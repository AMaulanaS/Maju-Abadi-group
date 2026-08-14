const API_URL = 'https://script.google.com/macros/s/AKfycbyRRKdNLibGz-prSXfQ6J81XPRbHZYCpEKPk-9JhzDmtDvRTRZyDIq-_VAEzJ07Z1IFaQ/exec';

const COMPANIES = {
  rma: 'PT Rizky Maju Abadi',
  fma: 'PT Fadhilah Maju Abadi',
  zma: 'PT Zahra Maju Abadi'
};

const JENIS_SURAT = [
  { kode: 'SP', ket: 'Permohonan, penawaran, pernyataan, dsb' },
  { kode: 'SPK', ket: 'Surat Perintah Kerja' },
  { kode: 'SPm', ket: 'Permohonan pemeriksaan, permohonan minat, dsb' },
  { kode: 'SPb', ket: 'Permohonan pembayaran' },
  { kode: 'PL', ket: 'Penawaran Langsung' },
  { kode: 'UM', ket: 'Umum' },
  { kode: 'PO', ket: 'Purchase Order' },
  { kode: 'INV', ket: 'Invoice' },
  { kode: 'KW', ket: 'Kwitansi' }
];

const ROMAN_MONTHS = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'];

let data = { rma: [], fma: [], zma: [] };
let pembatalan = [];
let activeCompany = 'rma';
let activeYear = String(new Date().getFullYear());
let isLoading = false;

async function apiGetData() {
  const res = await fetch(`${API_URL}?action=getData&t=${Date.now()}`);
  if (!res.ok) throw new Error(`Gagal membaca data (${res.status})`);
  const result = await res.json();
  if (!result.success) throw new Error(result.message || 'Gagal membaca data');
  return result.data || {};
}

async function apiPost(payload) {
  const res = await fetch(API_URL, {
    method: 'POST',
    redirect: 'follow',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(`Server mengembalikan error (${res.status})`);
  const result = await res.json();
  if (!result.success) throw new Error(result.message || 'Operasi gagal');
  return result;
}

async function loadData() {
  isLoading = true;
  renderAll();
  try {
    const result = await apiGetData();
    data = {
      rma: Array.isArray(result.rma) ? result.rma : [],
      fma: Array.isArray(result.fma) ? result.fma : [],
      zma: Array.isArray(result.zma) ? result.zma : []
    };
    pembatalan = Array.isArray(result.pembatalan) ? result.pembatalan : [];
  } catch (error) {
    console.error(error);
    showToast(`⚠️ Gagal terhubung ke Google Spreadsheet: ${escapeHtml(error.message)}`);
  } finally {
    isLoading = false;
    renderAll();
  }
}

async function refreshData() {
  await loadData();
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
  }[c]));
}

function pad3(n) {
  return String(Number(n) || 0).padStart(3, '0');
}

function getYear(dateStr) {
  return String(dateStr || '').slice(0, 4);
}

function romanMonth(dateStr) {
  const month = Number(String(dateStr).slice(5, 7));
  return ROMAN_MONTHS[month - 1] || '';
}

function formatTanggal(dateStr) {
  if (!dateStr) return '';
  const d = new Date(`${String(dateStr).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(d.getTime())) return String(dateStr);
  return d.toLocaleDateString('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric'
  });
}

function buildNomor(company, entry) {
  return entry.nomorSurat || `${pad3(entry.urutan)}/${company.toUpperCase()}/${String(entry.jenis || '').toUpperCase()}/${romanMonth(entry.tanggal)}/${getYear(entry.tanggal)}`;
}

function allUsedForYear(company, year) {
  const active = (data[company] || []).filter(e => getYear(e.tanggal) === String(year));
  const canceled = pembatalan.filter(e =>
    e.perusahaan === company && getYear(e.tanggal) === String(year)
  );
  return [...active, ...canceled];
}

function nextUrutan(company, year) {
  const list = allUsedForYear(company, year);
  if (!list.length) return 1;
  return Math.max(...list.map(e => Number(e.urutan) || 0)) + 1;
}

function renderYearOptions() {
  const years = new Set([String(new Date().getFullYear())]);
  Object.values(data).flat().forEach(e => {
    if (getYear(e.tanggal)) years.add(getYear(e.tanggal));
  });
  pembatalan.forEach(e => {
    if (getYear(e.tanggal)) years.add(getYear(e.tanggal));
  });

  const sorted = [...years].sort((a, b) => Number(b) - Number(a));
  if (!sorted.includes(activeYear)) sorted.unshift(activeYear);

  const select = document.getElementById('yearFilter');
  select.innerHTML = sorted.map(y => `<option value="${y}">${y}</option>`).join('');
  select.value = activeYear;
}

function renderTabs() {
  document.querySelectorAll('.company-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.company === activeCompany);
  });
}

function renderTable() {
  const suratView = document.getElementById('suratView');
  const cancelView = document.getElementById('cancelView');
  const addBtn = document.getElementById('addBtn');
  const printBtn = document.getElementById('printBtn');

  if (activeCompany === 'cancel') {
    suratView.hidden = true;
    cancelView.hidden = false;
    addBtn.hidden = true;
    printBtn.hidden = true;
    renderCancelTable();
    return;
  }

  suratView.hidden = false;
  cancelView.hidden = true;
  addBtn.hidden = false;
  printBtn.hidden = false;

  const tbody = document.getElementById('suratTableBody');
  const empty = document.getElementById('emptyRow');

  if (isLoading) {
    tbody.innerHTML = `<tr><td colspan="6" class="loading-cell">Memuat data...</td></tr>`;
    empty.hidden = true;
    return;
  }

  const list = (data[activeCompany] || [])
    .filter(e => getYear(e.tanggal) === activeYear)
    .sort((a, b) => Number(a.urutan) - Number(b.urutan));

  empty.hidden = list.length !== 0;
  tbody.innerHTML = list.map((e, index) => `
    <tr>
      <td>${index + 1}</td>
      <td><span class="nomor-chip">${escapeHtml(buildNomor(activeCompany, e))}</span></td>
      <td><span class="jenis-chip">${escapeHtml(e.jenis)}</span></td>
      <td>${escapeHtml(e.perihal)}</td>
      <td>${escapeHtml(formatTanggal(e.tanggal))}</td>
      <td class="action-cell">
        <button class="action-btn" title="Edit" onclick="openEdit('${escapeHtml(e.id)}')">✎</button>
        <button class="action-btn cancel-action" title="Batalkan Surat" onclick="openCancel('${escapeHtml(e.id)}')">🚫</button>
        <button class="action-btn delete-action" title="Hapus" onclick="deleteEntry('${escapeHtml(e.id)}')">⌫</button>
      </td>
    </tr>
  `).join('');
}

function renderCancelTable() {
  const tbody = document.getElementById('cancelTableBody');
  const empty = document.getElementById('cancelEmptyRow');

  const list = pembatalan
    .filter(e => getYear(e.tanggal) === activeYear)
    .sort((a, b) => String(b.tanggalPembatalan).localeCompare(String(a.tanggalPembatalan)));

  empty.hidden = list.length !== 0;
  tbody.innerHTML = list.map((e, index) => `
    <tr>
      <td>${index + 1}</td>
      <td><span class="nomor-chip">${escapeHtml(e.nomorSurat)}</span></td>
      <td>${escapeHtml(COMPANIES[e.perusahaan] || e.perusahaan)}</td>
      <td><span class="jenis-chip">${escapeHtml(e.jenis)}</span></td>
      <td>${escapeHtml(e.perihal)}</td>
      <td>${escapeHtml(e.alasan)}</td>
      <td>${escapeHtml(formatTanggal(e.tanggalPembatalan))}</td>
    </tr>
  `).join('');
}

function renderAll() {
  renderYearOptions();
  renderTabs();
  renderTable();
}

const modalOverlay = document.getElementById('modalOverlay');
const suratForm = document.getElementById('suratForm');
const jenisSelect = document.getElementById('jenisSelect');
const jenisHint = document.getElementById('jenisHint');
const tanggalInput = document.getElementById('tanggalInput');
const perihalInput = document.getElementById('perihalInput');
const nomorPreview = document.getElementById('nomorPreview');
const editIdInput = document.getElementById('editId');

function fillJenisSelect() {
  jenisSelect.innerHTML = JENIS_SURAT.map(j =>
    `<option value="${j.kode}">${j.kode} — ${j.ket}</option>`
  ).join('');
}

function updateJenisHint() {
  const j = JENIS_SURAT.find(x => x.kode === jenisSelect.value);
  jenisHint.textContent = j ? j.ket : '';
}

function updatePreview() {
  if (!tanggalInput.value) {
    nomorPreview.textContent = '—';
    return;
  }

  const id = editIdInput.value;
  let urutan;

  if (id) {
    const entry = (data[activeCompany] || []).find(e => e.id === id);
    urutan = entry ? entry.urutan : nextUrutan(activeCompany, getYear(tanggalInput.value));
  } else {
    urutan = nextUrutan(activeCompany, getYear(tanggalInput.value));
  }

  nomorPreview.textContent = buildNomor(activeCompany, {
    urutan,
    jenis: jenisSelect.value,
    tanggal: tanggalInput.value
  });
}

function openAdd() {
  if (activeCompany === 'cancel') return;
  document.getElementById('modalTitle').textContent = `Tambah Surat — ${COMPANIES[activeCompany]}`;
  suratForm.reset();
  editIdInput.value = '';
  fillJenisSelect();
  tanggalInput.value = new Date().toISOString().slice(0, 10);
  updateJenisHint();
  updatePreview();
  modalOverlay.hidden = false;
}

function openEdit(id) {
  const entry = (data[activeCompany] || []).find(e => e.id === id);
  if (!entry) return;

  document.getElementById('modalTitle').textContent = `Edit Surat — ${COMPANIES[activeCompany]}`;
  fillJenisSelect();
  editIdInput.value = id;
  jenisSelect.value = entry.jenis;
  tanggalInput.value = entry.tanggal;
  perihalInput.value = entry.perihal;
  updateJenisHint();
  updatePreview();
  modalOverlay.hidden = false;
}
window.openEdit = openEdit;

function closeModal() {
  modalOverlay.hidden = true;
}

const cancelModalOverlay = document.getElementById('cancelModalOverlay');
const cancelIdInput = document.getElementById('cancelId');
const cancelNomor = document.getElementById('cancelNomor');
const cancelReason = document.getElementById('cancelReason');

function openCancel(id) {
  const entry = (data[activeCompany] || []).find(e => e.id === id);
  if (!entry) return;
  cancelIdInput.value = id;
  cancelNomor.textContent = buildNomor(activeCompany, entry);
  cancelReason.value = '';
  cancelModalOverlay.hidden = false;
}
window.openCancel = openCancel;

function closeCancelModal() {
  cancelModalOverlay.hidden = true;
}

document.getElementById('cancelSuratForm').addEventListener('submit', async e => {
  e.preventDefault();

  const id = cancelIdInput.value;
  const alasan = cancelReason.value.trim();
  if (!id || !alasan) {
    showToast('⚠️ Alasan pembatalan wajib diisi.');
    return;
  }

  if (!confirm('Yakin surat ini dibatalkan? Nomor surat tetap menjadi riwayat dan tidak dapat digunakan kembali.')) return;

  try {
    await apiPost({
      action: 'cancel',
      perusahaan: activeCompany,
      id,
      alasan
    });
    closeCancelModal();
    await refreshData();
    showToast('🚫 Surat berhasil dibatalkan dan masuk ke menu Pembatalan Surat.');
  } catch (error) {
    showToast(`⚠️ Gagal membatalkan surat: ${escapeHtml(error.message)}`);
  }
});

async function deleteEntry(id) {
  const entry = (data[activeCompany] || []).find(e => e.id === id);
  if (!entry) return;

  const nomor = buildNomor(activeCompany, entry);
  if (!confirm(`Hapus permanen surat ${nomor}?\n\nData akan dihapus dari daftar aktif.`)) return;

  try {
    await apiPost({ action: 'delete', perusahaan: activeCompany, id });
    await refreshData();
    showToast(`Surat <strong>${escapeHtml(nomor)}</strong> berhasil dihapus.`);
  } catch (error) {
    showToast(`⚠️ Gagal menghapus: ${escapeHtml(error.message)}`);
  }
}
window.deleteEntry = deleteEntry;

let toastTimer;
function showToast(html) {
  const toast = document.getElementById('toast');
  toast.innerHTML = html;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 4000);
}

function printReport() {
  if (activeCompany === 'cancel') return;

  const list = (data[activeCompany] || [])
    .filter(e => getYear(e.tanggal) === activeYear)
    .sort((a, b) => Number(a.urutan) - Number(b.urutan));

  document.getElementById('printCompany').textContent = COMPANIES[activeCompany];
  document.getElementById('printTitle').textContent = `Buku Nomor Surat Tahun ${activeYear}`;
  document.getElementById('printTableBody').innerHTML = list.map((e, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${escapeHtml(buildNomor(activeCompany, e))}</td>
      <td>${escapeHtml(e.jenis)}</td>
      <td>${escapeHtml(e.perihal)}</td>
      <td>${escapeHtml(formatTanggal(e.tanggal))}</td>
    </tr>
  `).join('');

  document.getElementById('printFooter').textContent =
    `Dicetak pada ${new Date().toLocaleDateString('id-ID')} · Total ${list.length} surat`;

  window.print();
}

suratForm.addEventListener('submit', async e => {
  e.preventDefault();

  const id = editIdInput.value;
  const jenis = jenisSelect.value;
  const tanggal = tanggalInput.value;
  const perihal = perihalInput.value.trim();

  if (!jenis || !tanggal || !perihal) {
    showToast('⚠️ Lengkapi semua data terlebih dahulu.');
    return;
  }

  const submitBtn = suratForm.querySelector('button[type="submit"]');
  try {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Menyimpan...';

    if (id) {
      const oldEntry = (data[activeCompany] || []).find(e => e.id === id);
      if (!oldEntry) throw new Error('Data yang akan diedit tidak ditemukan');

      await apiPost({
        action: 'update',
        data: {
          id,
          perusahaan: activeCompany,
          urutan: oldEntry.urutan,
          jenis,
          tanggal,
          perihal
        }
      });
    } else {
      const urutan = nextUrutan(activeCompany, getYear(tanggal));
      await apiPost({
        action: 'add',
        data: {
          id: `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          perusahaan: activeCompany,
          urutan,
          jenis,
          tanggal,
          perihal
        }
      });
    }

    activeYear = getYear(tanggal);
    closeModal();
    await refreshData();
    showToast('✓ Data surat berhasil disimpan ke Google Spreadsheet.');
  } catch (error) {
    console.error(error);
    showToast(`⚠️ Gagal menyimpan: ${escapeHtml(error.message)}`);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Simpan';
  }
});

document.querySelectorAll('.company-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    activeCompany = tab.dataset.company;
    renderAll();
  });
});

document.getElementById('yearFilter').addEventListener('change', e => {
  activeYear = e.target.value;
  renderTable();
});

document.getElementById('addBtn').addEventListener('click', openAdd);
document.getElementById('printBtn').addEventListener('click', printReport);
document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('cancelBtn').addEventListener('click', closeModal);
document.getElementById('cancelModalClose').addEventListener('click', closeCancelModal);
document.getElementById('cancelSuratCloseBtn').addEventListener('click', closeCancelModal);
jenisSelect.addEventListener('change', () => { updateJenisHint(); updatePreview(); });
tanggalInput.addEventListener('change', updatePreview);

loadData();

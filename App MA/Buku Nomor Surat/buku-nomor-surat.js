// ============ Konfigurasi API ============
const API_URL = 'https://script.google.com/macros/s/AKfycbyRRKdNLibGz-prSXfQ6J81XPRbHZYCpEKPk-9JhzDmtDvRTRZyDIq-_VAEzJ07Z1IFaQ/exec';

// ============ Data referensi ============
const COMPANIES = {
  rma: 'PT Rizky Maju Abadi',
  fma: 'PT Fadhilah Maju Abadi',
  zma: 'PT Zahra Maju Abadi',
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
  { kode: 'KW', ket: 'Kwitansi' },
];

const ROMAN_MONTHS = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'];

// ============ State ============
let data = { rma: [], fma: [], zma: [] };
let activeCompany = 'rma';
let activeYear = null;
let isLoading = false;

// ============ API ============
async function apiGetData() {
  const res = await fetch(`${API_URL}?action=getData&t=${Date.now()}`);
  if (!res.ok) throw new Error(`Gagal membaca data (${res.status})`);
  const result = await res.json();
  if (!result.success) throw new Error(result.message || 'Gagal membaca data');
  return result.data || { rma: [], fma: [], zma: [] };
}

async function apiPost(payload) {
  // Mengirim JSON ke Apps Script.
  // no-cors tidak digunakan karena kita perlu membaca respons server.
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
  renderTable();

  try {
    const result = await apiGetData();
    data = {
      rma: Array.isArray(result.rma) ? result.rma : [],
      fma: Array.isArray(result.fma) ? result.fma : [],
      zma: Array.isArray(result.zma) ? result.zma : []
    };
  } catch (error) {
    console.error('loadData error:', error);
    showToast(`⚠️ Gagal terhubung ke Google Spreadsheet: ${escapeHtml(error.message)}`);
  } finally {
    isLoading = false;
    renderAll();
  }
}

async function refreshData() {
  try {
    const result = await apiGetData();
    data = {
      rma: Array.isArray(result.rma) ? result.rma : [],
      fma: Array.isArray(result.fma) ? result.fma : [],
      zma: Array.isArray(result.zma) ? result.zma : []
    };
    renderAll();
  } catch (error) {
    console.error('refreshData error:', error);
    showToast(`⚠️ Gagal memperbarui data: ${escapeHtml(error.message)}`);
  }
}

// ============ Helpers ============
function pad3(n) { return String(n).padStart(3, '0'); }

function romanMonth(dateStr) {
  const m = new Date(dateStr + 'T00:00:00').getMonth();
  return ROMAN_MONTHS[m];
}

function formatTanggal(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
}

function buildNomor(company, entry) {
  if (entry.nomorSurat) return entry.nomorSurat;
  const year = entry.tanggal.slice(0, 4);
  return `${pad3(entry.urutan)}/${company.toUpperCase()}/${entry.jenis.toUpperCase()}/${romanMonth(entry.tanggal).toUpperCase()}/${year}`;
}

function nextUrutan(company, year) {
  const list = data[company].filter(
    (e) => e.tanggal && e.tanggal.slice(0, 4) === String(year)
  );
  if (list.length === 0) return 1;
  return Math.max(...list.map((e) => Number(e.urutan) || 0)) + 1;
}

function availableYears(company) {
  const years = new Set(
    data[company]
      .filter((e) => e.tanggal)
      .map((e) => e.tanggal.slice(0, 4))
  );
  years.add(String(new Date().getFullYear()));
  return Array.from(years).sort((a, b) => Number(b) - Number(a));
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = String(str || '');
  return div.innerHTML;
}

// ============ Render ============
function renderTabs() {
  document.querySelectorAll('.company-tab').forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.company === activeCompany);
  });
}

function renderYearFilter() {
  const select = document.getElementById('yearFilter');
  const years = availableYears(activeCompany);

  if (!activeYear || !years.includes(String(activeYear))) {
    activeYear = years[0];
  }

  select.innerHTML = years
    .map((y) => `<option value="${y}" ${String(y) === String(activeYear) ? 'selected' : ''}>${y}</option>`)
    .join('');
}

function renderTable() {
  const tbody = document.getElementById('suratTableBody');
  const emptyRow = document.getElementById('emptyRow');

  if (isLoading) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-row">Memuat data dari Google Spreadsheet...</td></tr>`;
    emptyRow.hidden = true;
    return;
  }

  const list = (data[activeCompany] || [])
    .filter((e) => e.tanggal && e.tanggal.slice(0, 4) === String(activeYear))
    .sort((a, b) => Number(a.urutan) - Number(b.urutan));

  if (list.length === 0) {
    tbody.innerHTML = '';
    emptyRow.hidden = false;
    return;
  }

  emptyRow.hidden = true;

  tbody.innerHTML = list.map((e, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><span class="nomor-code">${escapeHtml(buildNomor(activeCompany, e))}</span></td>
      <td><span class="jenis-badge">${escapeHtml(e.jenis)}</span></td>
      <td>${escapeHtml(e.perihal)}</td>
      <td>${formatTanggal(e.tanggal)}</td>
      <td>
        <div class="row-actions">
          <button class="action-btn" title="Edit" onclick="openEdit('${e.id}')">
            <svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          </button>
          <button class="action-btn danger" title="Hapus" onclick="deleteEntry('${e.id}')">
            <svg viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z"/></svg>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function renderAll() {
  renderTabs();
  renderYearFilter();
  renderTable();
}

// ============ Modal ============
const modalOverlay = document.getElementById('modalOverlay');
const suratForm = document.getElementById('suratForm');
const jenisSelect = document.getElementById('jenisSelect');
const jenisHint = document.getElementById('jenisHint');
const tanggalInput = document.getElementById('tanggalInput');
const perihalInput = document.getElementById('perihalInput');
const nomorPreview = document.getElementById('nomorPreview');
const editIdInput = document.getElementById('editId');

function fillJenisSelect() {
  jenisSelect.innerHTML = JENIS_SURAT
    .map((j) => `<option value="${j.kode}">${j.kode} — ${j.ket}</option>`)
    .join('');
}

function updateJenisHint() {
  const j = JENIS_SURAT.find((x) => x.kode === jenisSelect.value);
  jenisHint.textContent = j ? j.ket : '';
}

function updatePreview() {
  if (!tanggalInput.value) {
    nomorPreview.textContent = '—';
    return;
  }

  const isEdit = !!editIdInput.value;
  let urutan;

  if (isEdit) {
    const existing = (data[activeCompany] || []).find(
      (e) => e.id === editIdInput.value
    );
    urutan = existing
      ? existing.urutan
      : nextUrutan(activeCompany, tanggalInput.value.slice(0, 4));
  } else {
    urutan = nextUrutan(activeCompany, tanggalInput.value.slice(0, 4));
  }

  nomorPreview.textContent = buildNomor(activeCompany, {
    urutan,
    jenis: jenisSelect.value,
    tanggal: tanggalInput.value
  });
}

function openAdd() {
  document.getElementById('modalTitle').textContent =
    `Tambah Surat — ${COMPANIES[activeCompany]}`;

  editIdInput.value = '';
  suratForm.reset();
  fillJenisSelect();
  tanggalInput.value = new Date().toISOString().slice(0, 10);
  updateJenisHint();
  updatePreview();
  modalOverlay.hidden = false;
}

function openEdit(id) {
  const entry = (data[activeCompany] || []).find((e) => e.id === id);
  if (!entry) return;

  document.getElementById('modalTitle').textContent =
    `Edit Surat — ${COMPANIES[activeCompany]}`;

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

// ============ Hapus ============
async function deleteEntry(id) {
  const entry = (data[activeCompany] || []).find((e) => e.id === id);
  if (!entry) return;

  const nomor = buildNomor(activeCompany, entry);

  if (!confirm(`Hapus surat ${nomor}?\n\nPerihal: ${entry.perihal}`)) return;

  try {
    showToast('Menghapus data dari Google Spreadsheet...');

    await apiPost({
      action: 'delete',
      perusahaan: activeCompany,
      id: id
    });

    data[activeCompany] = data[activeCompany].filter((e) => e.id !== id);
    renderAll();
    showToast(`Surat <strong>${escapeHtml(nomor)}</strong> dihapus dari Google Spreadsheet.`);
  } catch (error) {
    console.error('deleteEntry error:', error);
    showToast(`⚠️ Gagal menghapus: ${escapeHtml(error.message)}`);
  }
}
window.deleteEntry = deleteEntry;

// ============ Toast ============
let toastTimer;

function showToast(html) {
  const toast = document.getElementById('toast');
  toast.innerHTML = html;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3500);
}

// ============ Print ============
function printReport() {
  const list = (data[activeCompany] || [])
    .filter((e) => e.tanggal && e.tanggal.slice(0, 4) === String(activeYear))
    .sort((a, b) => Number(a.urutan) - Number(b.urutan));

  document.getElementById('printCompany').textContent =
    COMPANIES[activeCompany];

  document.getElementById('printTitle').textContent =
    `Buku Nomor Surat Tahun ${activeYear}`;

  document.getElementById('printFooter').textContent =
    `Dicetak pada ${new Date().toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })} · Total ${list.length} surat`;

  const tbody = document.getElementById('printTableBody');

  if (list.length === 0) {
    tbody.innerHTML =
      `<tr><td colspan="5" style="text-align:center;">Tidak ada data surat tahun ini.</td></tr>`;
  } else {
    tbody.innerHTML = list.map((e, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${escapeHtml(buildNomor(activeCompany, e))}</td>
        <td>${escapeHtml(e.jenis)}</td>
        <td>${escapeHtml(e.perihal)}</td>
        <td>${formatTanggal(e.tanggal)}</td>
      </tr>
    `).join('');
  }

  window.print();
}

// ============ Events ============
document.querySelectorAll('.company-tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    activeCompany = tab.dataset.company;
    activeYear = null;
    renderAll();
  });
});

document.getElementById('yearFilter').addEventListener('change', (e) => {
  activeYear = e.target.value;
  renderTable();
});

document.getElementById('addBtn').addEventListener('click', openAdd);
document.getElementById('cancelBtn').addEventListener('click', closeModal);
document.getElementById('modalClose').addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) closeModal();
});
document.getElementById('printBtn').addEventListener('click', printReport);

jenisSelect.addEventListener('change', () => {
  updateJenisHint();
  updatePreview();
});

tanggalInput.addEventListener('change', updatePreview);

// ============ Tambah / Update ============
suratForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const id = editIdInput.value;
  const jenis = jenisSelect.value;
  const tanggal = tanggalInput.value;
  const perihal = perihalInput.value.trim();

  if (!jenis || !tanggal || !perihal) {
    showToast('⚠️ Lengkapi semua data terlebih dahulu.');
    return;
  }

  try {
    const submitBtn = suratForm.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.dataset.oldText = submitBtn.textContent;
      submitBtn.textContent = 'Menyimpan...';
    }

    let entry;

    if (id) {
      const oldEntry = (data[activeCompany] || []).find((x) => x.id === id);

      if (!oldEntry) throw new Error('Data yang akan diedit tidak ditemukan');

      entry = {
        id,
        perusahaan: activeCompany,
        urutan: oldEntry.urutan,
        jenis,
        tanggal,
        perihal
      };

      const result = await apiPost({
        action: 'update',
        data: entry
      });

      entry.nomorSurat = result.nomorSurat || buildNomor(activeCompany, entry);

      const index = data[activeCompany].findIndex((x) => x.id === id);
      data[activeCompany][index] = entry;

      activeYear = tanggal.slice(0, 4);
      renderAll();
      closeModal();

      showToast(`Surat <strong>${escapeHtml(entry.nomorSurat)}</strong> diperbarui.`);

    } else {
      const urutan = nextUrutan(activeCompany, tanggal.slice(0, 4));

      entry = {
        id: 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
        perusahaan: activeCompany,
        urutan,
        jenis,
        tanggal,
        perihal
      };

      const result = await apiPost({
        action: 'add',
        data: entry
      });

      entry.nomorSurat = result.nomorSurat || buildNomor(activeCompany, entry);

      data[activeCompany].push(entry);

      activeYear = tanggal.slice(0, 4);
      renderAll();
      closeModal();

      showToast(`Surat <strong>${escapeHtml(entry.nomorSurat)}</strong> ditambahkan ke Google Spreadsheet.`);
    }

  } catch (error) {
    console.error('submit error:', error);
    showToast(`⚠️ Gagal menyimpan: ${escapeHtml(error.message)}`);
  } finally {
    const submitBtn = suratForm.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = submitBtn.dataset.oldText || 'Simpan';
    }
  }
});

// ============ Init ============
loadData();

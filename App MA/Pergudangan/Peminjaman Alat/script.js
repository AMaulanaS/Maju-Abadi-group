// ═══════════════════════════════════════════════════════════════
//  KONFIGURASI
// ═══════════════════════════════════════════════════════════════
const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbyzbZwvhsPaMz1-IyAn-kBWVGuItkgL0hcsCp5gmVcPSKRR77LL3dZSK0VP31YXJ8dISQ/exec";

// ═══════════════════════════════════════════════════════════════
//  STATE
// ═══════════════════════════════════════════════════════════════
let state = { alat: [], pinjaman: [] };
let selectedTools = [];
let loadingFromDatabase = false;
let returnTargetId = null;

// ─── LocalStorage ──────────────────────────────────────────────
function localKey(k) {
  return "alatApp_" + k;
}

function loadState() {
  try {
    const a = localStorage.getItem(localKey("alat"));
    const p = localStorage.getItem(localKey("pinjaman"));
    state.alat = a ? JSON.parse(a) : [];
    state.pinjaman = p ? JSON.parse(p) : [];
  } catch (_) {
    state = { alat: [], pinjaman: [] };
  }
}

function saveState() {
  localStorage.setItem(localKey("alat"), JSON.stringify(state.alat));
  localStorage.setItem(localKey("pinjaman"), JSON.stringify(state.pinjaman));
}

// ─── Helpers ──────────────────────────────────────────────────
function today() {
  return new Date().toISOString().slice(0, 10);
}

function code(n) {
  return "ALT-" + String(n).padStart(4, "0");
}

function loanNo() {
  return "PIN-" + new Date().toISOString().slice(0, 10).replaceAll("-", "") +
    "-" + String(state.pinjaman.length + 1).padStart(4, "0");
}

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  } [c]));
}

function badgeStatus(s) {
  const v = String(s || "");
  const c = v === "Tersedia" ? "b-available" :
    v === "Dipinjam" ? "b-loan" :
    v === "Maintenance" || v.includes("Rusak") ? "b-maint" :
    v === "Sudah Kembali" ? "b-done" : "b-done";
  return `<span class="badge ${c}">${esc(v)}</span>`;
}

function getBorrowedQty(alat) {
  if (!alat) return 0;
  return state.pinjaman
    .filter(p => p.alatKode === alat.kode && p.status === "Dipinjam")
    .reduce((s, p) => s + (Number(p.qty) || 0), 0);
}

function getAvailableQty(alat) {
  if (!alat) return 0;
  if (alat.status !== "Tersedia") return 0;
  const jumlah = Number(alat.jumlah) || 0;
  const rusakRingan = Number(alat.rusakRingan) || 0;
  const rusakBerat = Number(alat.rusakBerat) || 0;
  const hilang = Number(alat.hilang) || 0;
  const totalRusak = rusakRingan + rusakBerat + hilang;
  return Math.max(0, jumlah - totalRusak - getBorrowedQty(alat));
}

function loanDuration(p) {
  const start = new Date(p.tanggal + "T00:00:00");
  const end = new Date((p.tanggalKembali || today()) + "T00:00:00");
  const days = Math.max(0, Math.floor((end - start) / 86400000));
  return days + " hari";
}

// ─── Toast ─────────────────────────────────────────────────────
function toast(t) {
  const e = document.getElementById("status");
  if (!e) return;
  e.textContent = t;
  e.className = "toast show";
  clearTimeout(e._timer);
  e._timer = setTimeout(() => { e.className = "toast"; }, 3500);
}

// ─── Init ──────────────────────────────────────────────────────
function init() {
  loadState();

  const tgl = document.getElementById("pinjamTanggal");
  if (tgl) tgl.value = today();

  document.querySelectorAll(".tab").forEach(btn =>
    btn.addEventListener("click", () => openTab(btn.dataset.tab))
  );

  renderAll();
  renderAvailableTools();
  loadFromDatabase();
}

// ─── Tab ──────────────────────────────────────────────────────
function openTab(id) {
  document.querySelectorAll(".tab")
    .forEach(x => x.classList.toggle("active", x.dataset.tab === id));
  document.querySelectorAll(".tab-content")
    .forEach(x => x.classList.toggle("active", x.id === id));
}

function refreshAll() {
  loadFromDatabase();
}

// ─── Render All ──────────────────────────────────────────────
function renderAll() {
  renderDashboard();
  renderMaster();
  renderReturns();
  renderHistory();
}

// ─── Dashboard ────────────────────────────────────────────────
function renderDashboard() {
  const total = state.alat.reduce((s, a) => s + (Number(a.jumlah) || 0), 0);
  const tersedia = state.alat.reduce((s, a) => s + getAvailableQty(a), 0);
  const dipinjam = state.alat.reduce((s, a) => s + getBorrowedQty(a), 0);
  const rusak = state.alat.reduce((s, a) => {
    if (["Maintenance", "Rusak Ringan", "Rusak Berat"].includes(a.status)) {
      return s + (Number(a.jumlah) || 0);
    }
    return s + (Number(a.rusakRingan) || 0) + (Number(a.rusakBerat) || 0) + (Number(a.hilang) || 0);
  }, 0);

  const el = id => document.getElementById(id);
  if (el("totalAlat")) el("totalAlat").textContent = total;
  if (el("tersedia")) el("tersedia").textContent = tersedia;
  if (el("dipinjam")) el("dipinjam").textContent = dipinjam;
  if (el("rusak")) el("rusak").textContent = rusak;

  const counts = {
    Tersedia: tersedia,
    Dipinjam: dipinjam,
    Maintenance: state.alat
      .filter(a => a.status === "Maintenance")
      .reduce((s, a) => s + (Number(a.jumlah) || 0), 0),
    Rusak: rusak
  };
  const max = Math.max(1, ...Object.values(counts));

  const bars = document.getElementById("statusBars");
  if (bars) {
    bars.innerHTML = Object.entries(counts)
      .map(([k, v]) =>
        `<div class="bar"><span>${k}</span><i style="width:${(v / max) * 70}%"></i><b>${v}</b></div>`
      ).join("");
  }

  const recent = document.getElementById("recentLoans");
  if (recent) {
    const list = state.pinjaman.slice().reverse().slice(0, 8);
    recent.innerHTML = list.length ?
      list.map(p => `<div class="list-item">
        <b>${esc(p.no)}</b> · ${esc(p.peminjam)} · ${esc(p.alatNama)}<br>
        ${badgeStatus(p.status)} · ${esc(p.tanggal)} · <b>${loanDuration(p)}</b>
      </div>`).join("") :
      "Belum ada transaksi.";
  }
}

// ─── Master Alat ──────────────────────────────────────────────
function renderMaster() {
  const q = (document.getElementById("searchAlat")?.value || "").toLowerCase();
  const rows = state.alat.filter(a =>
    [a.kode, a.nama, a.seri, a.merk, a.kategori]
    .join(" ").toLowerCase().includes(q)
  );

  const body = document.getElementById("masterBody");
  if (!body) return;

  body.innerHTML = rows.map(a => {
    const avail = getAvailableQty(a);
    const rRingan = Number(a.rusakRingan) || 0;
    const rBerat = Number(a.rusakBerat) || 0;
    const hilang = Number(a.hilang) || 0;
    const tersediaCell = a.status === "Tersedia" ?
      (avail > 0 ?
        `<span class="badge b-available">${avail}</span>` :
        `<span class="badge b-loan">Habis</span>`) :
      `<span class="badge b-maint">0</span>`;

    return `
    <tr>
      <td>${esc(a.kode)}</td>
      <td>${esc(a.nama)}</td>
      <td>${esc(a.kategori)}</td>
      <td>${esc(a.merk)}</td>
      <td>${esc(a.seri)}</td>
      <td>${esc(a.jumlah ?? 1)}</td>
      <td>${tersediaCell}</td>
      <td>${rRingan > 0 ? `<span class="badge b-maint">${rRingan}</span>` : `<span class="badge b-done">0</span>`}</td>
      <td>${rBerat > 0 ? `<span class="badge b-maint">${rBerat}</span>` : `<span class="badge b-done">0</span>`}</td>
      <td>${hilang > 0 ? `<span class="badge b-maint">${hilang}</span>` : `<span class="badge b-done">0</span>`}</td>
      <td>${esc(a.kondisi)}</td>
      <td>${badgeStatus(a.status)}</td>
      <td>${esc(a.lokasi)}</td>
      <td><button class="secondary btn-edit" onclick="editAlat('${a.id}')">✏ Edit</button></td>
    </tr>`;
  }).join("") || `<tr><td colspan="14">Belum ada alat.</td></tr>`;
}

// ─── Available Tools (picker) ─────────────────────────────────
function renderAvailableTools() {
  const box = document.getElementById("availableTools");
  if (!box) return;
  const q = (document.getElementById("alatSearch")?.value || "").toLowerCase().trim();

  const available = state.alat.filter(a =>
    getAvailableQty(a) > 0 &&
    !selectedTools.some(x => x.id === a.id) &&
    (!q || [a.kode, a.nama, a.merk, a.seri, a.kategori, a.lokasi]
      .join(" ").toLowerCase().includes(q))
  );

  if (!available.length) {
    box.innerHTML = q ?
      `<div class="empty-search">Tidak ada alat tersedia yang cocok dengan "<b>${esc(q)}</b>".</div>` :
      `<div class="empty-search">Tidak ada alat tersedia.</div>`;
    return;
  }

  box.innerHTML = available.slice(0, 80).map(a => `
    <button class="tool-result" onclick="selectTool('${a.id}')">
      <div>
        <b>${esc(a.kode)} · ${esc(a.nama)}</b>
        <small>${esc(a.merk || "-")} · No.Seri: ${esc(a.seri || "-")} · Tersedia: ${getAvailableQty(a)}</small>
      </div>
      <strong>+ Pilih</strong>
    </button>
  `).join("");
}

function selectTool(id) {
  const a = state.alat.find(x => x.id === id);
  const maxQty = getAvailableQty(a);
  if (!a || maxQty <= 0 || selectedTools.some(x => x.id === id)) return;
  selectedTools.push({
    id: a.id,
    kode: a.kode,
    nama: a.nama,
    merk: a.merk,
    seri: a.seri,
    qty: 1,
    max: maxQty,
    kondisi: "Baik"
  });
  document.getElementById("alatSearch").value = "";
  renderAvailableTools();
  renderSelectedTools();
}

function removeSelectedTool(id) {
  selectedTools = selectedTools.filter(x => x.id !== id);
  renderAvailableTools();
  renderSelectedTools();
}

function updateSelectedQty(id, val) {
  const x = selectedTools.find(a => a.id === id);
  if (!x) return;
  const max = x.max || getAvailableQty(state.alat.find(a => a.id === id)) || 1;
  x.qty = Math.max(1, Math.min(max, Number(val) || 1));
  renderSelectedTools();
}

function updateSelectedCondition(id, val) {
  const x = selectedTools.find(a => a.id === id);
  if (x) x.kondisi = val;
}

function renderSelectedTools() {
  const box = document.getElementById("selectedTools");
  const count = document.getElementById("selectedCount");
  if (!box) return;
  if (count) count.textContent = selectedTools.length + " alat";

  if (!selectedTools.length) {
    box.innerHTML = '<div class="empty-selected">Belum ada alat dipilih.</div>';
    return;
  }

  box.innerHTML = selectedTools.map(a => `
    <div class="selected-tool">
      <div>
        <b>${esc(a.kode)} · ${esc(a.nama)}</b>
        <small>${esc(a.merk || "-")} · No.Seri: ${esc(a.seri || "-")} · Tersedia: ${a.max || 1}</small>
      </div>
      <label>Qty
        <input type="number" min="1" max="${a.max || 1}" value="${a.qty}"
          onchange="updateSelectedQty('${a.id}',this.value)">
      </label>
      <label>Kondisi
        <select onchange="updateSelectedCondition('${a.id}',this.value)">
          <option ${a.kondisi === "Baik" ? "selected" : ""}>Baik</option>
          <option ${a.kondisi === "Rusak Ringan" ? "selected" : ""}>Rusak Ringan</option>
          <option ${a.kondisi === "Rusak Berat" ? "selected" : ""}>Rusak Berat</option>
        </select>
      </label>
      <button class="remove-selected" onclick="removeSelectedTool('${a.id}')">×</button>
    </div>
  `).join("");
}

function clearSelectedTools() {
  selectedTools = [];
  document.getElementById("alatSearch").value = "";
  renderAvailableTools();
  renderSelectedTools();
}

// ─── Pengembalian ─────────────────────────────────────────────
function renderReturns() {
  const rows = state.pinjaman.filter(p => p.status === "Dipinjam");
  const body = document.getElementById("returnBody");
  if (!body) return;
  body.innerHTML = rows.map(p => `
    <tr>
      <td>${esc(p.no)}</td>
      <td>${esc(p.tanggal)}</td>
      <td>${esc(p.peminjam)}</td>
      <td>${esc(p.alatNama)}</td>
      <td>${esc(p.qty ?? 1)}</td>
      <td>${esc(p.kondisiPinjam)}</td>
      <td>${badgeStatus(p.status)}</td>
      <td><button class="primary" onclick="returnTool('${p.id}')">Kembalikan</button></td>
    </tr>
  `).join("") || `<tr><td colspan="8">Tidak ada alat yang sedang dipinjam.</td></tr>`;
}

// ─── Riwayat ──────────────────────────────────────────────────
function renderHistory() {
  const q = (document.getElementById("searchRiwayat")?.value || "").toLowerCase();
  const rows = state.pinjaman
    .filter(p => JSON.stringify(p).toLowerCase().includes(q))
    .slice().reverse();

  const body = document.getElementById("historyBody");
  if (!body) return;
  body.innerHTML = rows.map(p => `
    <tr>
      <td>${esc(p.no)}</td>
      <td>${esc(p.tanggal)}</td>
      <td>${esc(p.peminjam)}</td>
      <td>${esc(p.proyek)}</td>
      <td>${esc(p.alatNama)}</td>
      <td>${esc(p.qty ?? 1)}</td>
      <td>${badgeStatus(p.status)}</td>
      <td>${loanDuration(p)}</td>
      <td>${esc(p.tanggalKembali || "-")}</td>
      <td>${esc(p.kondisiKembali || "-")}</td>
    </tr>
  `).join("") || `<tr><td colspan="10">Belum ada riwayat.</td></tr>`;
}

// ─── Modal Alat ──────────────────────────────────────────────
function openModal(mode, id) {
  const modal = document.getElementById("modal");
  if (!modal) return;
  modal.classList.add("show");

  const title = document.getElementById("modalTitle");
  const mid = document.getElementById("mId");
  if (mid) mid.value = "";

  const fields = ["mNama", "mKategori", "mMerk", "mSeri", "mTahun", "mLokasi", "mKet"];

  if (mode === "edit" && id) {
    const a = state.alat.find(x => x.id === id);
    if (!a) return;
    title.textContent = "Edit Alat";
    if (mid) mid.value = a.id;
    document.getElementById("mNama").value = a.nama || "";
    document.getElementById("mKategori").value = a.kategori || "";
    document.getElementById("mMerk").value = a.merk || "";
    document.getElementById("mSeri").value = a.seri || "";
    document.getElementById("mJumlah").value = a.jumlah || 1;
    document.getElementById("mRusakRingan").value = Number(a.rusakRingan) || 0;
    document.getElementById("mRusakBerat").value = Number(a.rusakBerat) || 0;
    document.getElementById("mHilang").value = Number(a.hilang) || 0;
    document.getElementById("mTahun").value = a.tahun || "";
    document.getElementById("mKondisi").value = a.kondisi || "Baik";
    document.getElementById("mStatus").value = a.status || "Tersedia";
    document.getElementById("mLokasi").value = a.lokasi || "";
    document.getElementById("mKet").value = a.keterangan || "";

    fields.forEach(f => { const el = document.getElementById(f); if (el) el.disabled = true; });
    document.getElementById("mJumlah").disabled = false;
    document.getElementById("mRusakRingan").disabled = false;
    document.getElementById("mRusakBerat").disabled = false;
    document.getElementById("mHilang").disabled = false;
  } else {
    title.textContent = "Tambah Alat";
    fields.forEach(f => { const el = document.getElementById(f); if (el) el.disabled = false; });
    document.getElementById("mJumlah").value = 1;
    document.getElementById("mRusakRingan").value = 0;
    document.getElementById("mRusakBerat").value = 0;
    document.getElementById("mHilang").value = 0;
    document.getElementById("mKondisi").value = "Baik";
    document.getElementById("mStatus").value = "Tersedia";
    document.getElementById("mNama").value = "";
    document.getElementById("mKategori").value = "";
    document.getElementById("mMerk").value = "";
    document.getElementById("mSeri").value = "";
    document.getElementById("mTahun").value = "";
    document.getElementById("mLokasi").value = "";
    document.getElementById("mKet").value = "";
  }
}

function closeModal() {
  document.getElementById("modal")?.classList.remove("show");
}

function editAlat(id) {
  openModal("edit", id);
}

async function saveAlat() {
  const editId = document.getElementById("mId").value;
  const kondisi = document.getElementById("mKondisi").value;
  const status = document.getElementById("mStatus").value;

  if (editId) {
    const a = state.alat.find(x => x.id === editId);
    if (!a) return;
    if (a.status === "Dipinjam") {
      toast("Alat yang sedang dipinjam tidak dapat diedit.");
      return;
    }
    const jumlahBaru = Math.max(1, Number(document.getElementById("mJumlah").value) || 1);
    const rRingan = Math.max(0, Number(document.getElementById("mRusakRingan").value) || 0);
    const rBerat = Math.max(0, Number(document.getElementById("mRusakBerat").value) || 0);
    const hilang = Math.max(0, Number(document.getElementById("mHilang").value) || 0);
    const totalRusak = rRingan + rBerat + hilang;
    const dipinjam = getBorrowedQty(a);
    if (jumlahBaru < dipinjam + totalRusak) {
      toast(`Jumlah tidak boleh kurang dari ${dipinjam + totalRusak} (dipinjam + rusak/hilang).`);
      return;
    }
    a.kondisi = kondisi;
    a.status = status;
    a.jumlah = jumlahBaru;
    a.rusakRingan = rRingan;
    a.rusakBerat = rBerat;
    a.hilang = hilang;
    saveState();
    await sync({ alat: a, record: { alatId: a.id, alatKode: a.kode, alatNama: a.nama, kondisi, status,
        catatanStatus: "Update manual" } }, "UPDATE_STATUS");
    closeModal();
    renderAll();
    renderAvailableTools();
    toast(`${a.kode} berhasil diubah.`);
    return;
  }

  const nama = document.getElementById("mNama").value.trim();
  if (!nama) { toast("Nama alat wajib diisi."); return; }

  const id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
  const jumlah = Math.max(1, Number(document.getElementById("mJumlah").value) || 1);

  const alat = {
    id,
    kode: code(state.alat.length + 1),
    nama,
    jumlah,
    rusakRingan: 0,
    rusakBerat: 0,
    hilang: 0,
    kategori: document.getElementById("mKategori").value.trim(),
    merk: document.getElementById("mMerk").value.trim(),
    seri: document.getElementById("mSeri").value.trim(),
    tahun: document.getElementById("mTahun").value,
    kondisi,
    status,
    lokasi: document.getElementById("mLokasi").value.trim(),
    keterangan: document.getElementById("mKet").value.trim()
  };

  state.alat.push(alat);
  saveState();
  await sync({ alat, record: alat }, "ALAT");
  closeModal();
  renderAll();
  renderAvailableTools();
  toast("Alat berhasil disimpan.");
}

// ─── Submit Pinjam ────────────────────────────────────────────
async function submitPinjam() {
  const pem = document.getElementById("peminjam").value.trim();
  if (!selectedTools.length) { toast("Pilih minimal 1 alat."); return; }
  if (!pem) { toast("Nama peminjam wajib diisi."); return; }

  const no = loanNo();
  const tanggal = document.getElementById("pinjamTanggal").value || today();
  const proyek = document.getElementById("proyek").value.trim();
  const keperluan = document.getElementById("keperluan").value.trim();
  const catatan = document.getElementById("catatanPinjam").value.trim();

  for (const sel of selectedTools) {
    const a = state.alat.find(x => x.id === sel.id);
    if (!a) continue;
    const qty = Math.max(1, Number(sel.qty) || 1);
    if (qty > getAvailableQty(a)) {
      toast(`Stok ${a.nama} tidak cukup (tersedia ${getAvailableQty(a)}).`);
      continue;
    }
    const p = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + "_" + sel.id,
      no,
      tanggal,
      peminjam: pem,
      proyek,
      keperluan,
      alatId: a.id,
      alatKode: a.kode,
      alatNama: a.nama,
      qty: qty,
      kondisiPinjam: sel.kondisi,
      status: "Dipinjam",
      catatan,
      tanggalKembali: "",
      kondisiKembali: "",
      catatanKembali: "",
      qtyBaik: 0,
      qtyRusakRingan: 0,
      qtyRusakBerat: 0,
      qtyHilang: 0
    };
    state.pinjaman.push(p);
    await sync({ alat: a, record: p }, "PINJAM");
  }

  saveState();
  ["peminjam", "proyek", "keperluan", "catatanPinjam"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  clearSelectedTools();
  renderAll();
  renderAvailableTools();
  toast(`Peminjaman ${no} berhasil.`);
}

// ─── Return Tool ──────────────────────────────────────────────
function returnTool(id) {
  const p = state.pinjaman.find(x => x.id === id);
  if (!p) return;
  returnTargetId = id;

  const info = document.getElementById("rInfo");
  if (info) info.textContent = `${p.no} · ${esc(p.peminjam)} · ${esc(p.alatNama)} — Qty dipinjam: ${p.qty}`;

  const tgl = document.getElementById("rTanggal");
  if (tgl) tgl.value = today();

  const baik = document.getElementById("rBaik");
  if (baik) { baik.value = p.qty;
    baik.max = p.qty; }
  ["rRingan", "rBerat", "rHilang"].forEach(fid => {
    const el = document.getElementById(fid);
    if (el) { el.value = 0;
      el.max = p.qty; }
  });
  document.getElementById("rCatatan").value = "";
  updateReturnRemaining();
  document.getElementById("returnModal")?.classList.add("show");
}

function closeReturnModal() {
  document.getElementById("returnModal")?.classList.remove("show");
  returnTargetId = null;
}

function updateReturnRemaining() {
  const p = state.pinjaman.find(x => x.id === returnTargetId);
  const el = document.getElementById("rSisa");
  if (!p || !el) return;
  const { baik, ringan, berat, hilang } = readReturnQty();
  const total = baik + ringan + berat + hilang;
  const sisa = p.qty - total;
  if (sisa === 0) {
    el.textContent = `✓ Sudah pas (${p.qty} unit)`;
    el.style.color = "#16a34a";
  } else if (sisa > 0) {
    el.textContent = `Belum lengkap: ${total}/${p.qty} unit (kurang ${sisa})`;
    el.style.color = "#dc2626";
  } else {
    el.textContent = `Kelebihan: ${total}/${p.qty} unit (lebih ${-sisa})`;
    el.style.color = "#dc2626";
  }
}

function readReturnQty() {
  const g = id => Math.max(0, Number(document.getElementById(id)?.value) || 0);
  return { baik: g("rBaik"), ringan: g("rRingan"), berat: g("rBerat"), hilang: g("rHilang") };
}

async function confirmReturn() {
  const p = state.pinjaman.find(x => x.id === returnTargetId);
  if (!p) return;
  const { baik, ringan, berat, hilang } = readReturnQty();
  const total = baik + ringan + berat + hilang;
  if (total !== p.qty) {
    toast(`Total kondisi (${total}) harus sama dengan jumlah dipinjam (${p.qty}).`);
    return;
  }

  const tanggal = document.getElementById("rTanggal").value || today();
  const cat = document.getElementById("rCatatan").value.trim();

  const parts = [];
  if (baik) parts.push(`${baik} Baik`);
  if (ringan) parts.push(`${ringan} Rusak Ringan`);
  if (berat) parts.push(`${berat} Rusak Berat`);
  if (hilang) parts.push(`${hilang} Hilang`);

  p.tanggalKembali = tanggal;
  p.kondisiKembali = parts.join(", ") || "Baik";
  p.catatanKembali = cat;
  p.status = "Sudah Kembali";
  p.qtyBaik = baik;
  p.qtyRusakRingan = ringan;
  p.qtyRusakBerat = berat;
  p.qtyHilang = hilang;

  const a = state.alat.find(x => x.id === p.alatId) ||
    state.alat.find(x => x.kode === p.alatKode);

  if (a) {
    // Tambahkan ke field masing-masing
    a.rusakRingan = (Number(a.rusakRingan) || 0) + ringan;
    a.rusakBerat = (Number(a.rusakBerat) || 0) + berat;
    a.hilang = (Number(a.hilang) || 0) + hilang;

    // Update kondisi jika semua unit kembali dalam kondisi yang sama (total unit yang rusak/hilang = total dipinjam)
    const totalRusakHilang = ringan + berat + hilang;
    if (totalRusakHilang === 0) {
      a.kondisi = "Baik";
    } else if (totalRusakHilang === total) {
      const jenis = [];
      if (ringan > 0) jenis.push("Rusak Ringan");
      if (berat > 0) jenis.push("Rusak Berat");
      if (hilang > 0) jenis.push("Hilang");
      if (jenis.length === 1) a.kondisi = jenis[0];
    }
  }

  saveState();
  await sync({ alat: a || {}, record: p }, "KEMBALI");
  closeReturnModal();
  renderAll();
  renderAvailableTools();
  toast(`Pengembalian tersimpan.`);
}

// ─── Sync ke Google Script ────────────────────────────────────
function sync(data, type) {
  if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.includes("PASTE_URL")) {
    return Promise.resolve({ ok: false, error: "URL Google Script belum diisi." });
  }
  const payload = JSON.stringify({ type, record: data.record || {}, alat: data.alat || {} });
  return fetch(GOOGLE_SCRIPT_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: payload
  }).then(() => ({ ok: true })).catch(err => {
    console.error("Sync error:", err);
    toast("Data lokal tersimpan, tetapi gagal mengirim ke database.");
    return { ok: false, error: String(err) };
  });
}

// ─── Load dari Database (JSONP) ──────────────────────────────
function loadFromDatabase() {
  if (loadingFromDatabase) return;
  loadingFromDatabase = true;
  toast("Mengambil data dari database...");

  const callbackName = "__alatDbCallback_" + Date.now() + "_" + Math.random().toString(36).slice(2);
  const script = document.createElement("script");

  const cleanup = () => {
    loadingFromDatabase = false;
    delete window[callbackName];
    script.remove();
  };

  const timer = setTimeout(() => {
    cleanup();
    console.error("Timeout load database.");
    toast("Database tidak merespons.");
  }, 20000);

  window[callbackName] = function(data) {
    clearTimeout(timer);
    try {
      if (!data || !data.ok) throw new Error(data?.error || "Respons tidak valid.");
      state.alat = Array.isArray(data.alat) ? data.alat : [];
      state.pinjaman = Array.isArray(data.pinjaman) ? data.pinjaman : [];
      saveState();
      selectedTools = [];
      renderAll();
      renderAvailableTools();
      renderSelectedTools();
      toast(`Data dimuat: ${state.alat.length} alat, ${state.pinjaman.length} transaksi.`);
    } catch (err) {
      console.error("Database error:", err);
      toast("Data database gagal diproses.");
    } finally {
      cleanup();
    }
  };

  script.onerror = function() {
    clearTimeout(timer);
    cleanup();
    console.error("Gagal memuat Google Script.");
    toast("Gagal terhubung ke database.");
  };

  script.src = GOOGLE_SCRIPT_URL + "?callback=" + encodeURIComponent(callbackName) + "&t=" + Date.now();
  document.head.appendChild(script);
}

// ─── Start ────────────────────────────────────────────────────
init();

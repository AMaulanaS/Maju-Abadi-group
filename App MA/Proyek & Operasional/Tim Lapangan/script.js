const state = {
  data: [],
  busy: false,
  editingId: null
};

const $ = (selector) => document.querySelector(selector);

function isConfigured() {
  return APP_CONFIG.GOOGLE_SCRIPT_URL &&
    APP_CONFIG.GOOGLE_SCRIPT_URL.startsWith("https://") &&
    !APP_CONFIG.GOOGLE_SCRIPT_URL.includes("PASTE_URL") &&
    APP_CONFIG.API_TOKEN &&
    !APP_CONFIG.API_TOKEN.includes("GANTI_DENGAN");
}

function setConnection(status, message) {
  const dot = $("#connectionDot");
  const text = $("#connectionText");
  dot.className = "connection-dot";
  if (status === "ok") dot.classList.add("ok");
  if (status === "error") dot.classList.add("error");
  text.textContent = message;
}

function showToast(message, type = "success") {
  const el = $("#toast");
  el.textContent = message;
  el.className = `toast ${type === "error" ? "error" : ""}`;
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => el.classList.add("hidden"), 3000);
}

function initials(name = "") {
  return name.trim().split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase() || "").join("") || "?";
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeStatus(value) {
  return String(value || "Aktif").trim() || "Aktif";
}

function statusClass(status) {
  return normalizeStatus(status).toLowerCase().replaceAll(" ", "-");
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function toInputDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function render() {
  const search = $("#searchInput").value.trim().toLowerCase();
  const filter = $("#statusFilter").value;
  const filtered = state.data.filter(item => {
    const haystack = [item.nama, item.jabatan, item.noHp, item.lokasi, item.keterangan, item.status]
      .join(" ").toLowerCase();
    return (!search || haystack.includes(search)) && (!filter || normalizeStatus(item.status) === filter);
  });

  $("#totalPersonel").textContent = state.data.length;
  $("#aktifBertugas").textContent = state.data.filter(x => normalizeStatus(x.status) === "Aktif").length;
  $("#totalLokasi").textContent = new Set(state.data.map(x => String(x.lokasi || "").trim()).filter(Boolean)).size;

  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;
  $("#hariIni").textContent = state.data.filter(x => toInputDate(x.tanggal) === todayKey).length;

  const tbody = $("#personelTableBody");
  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty-state">Tidak ada data yang cocok dengan pencarian/filter.</td></tr>`;
  } else {
    tbody.innerHTML = filtered.map(item => `
      <tr>
        <td>
          <div class="person-cell">
            <div class="avatar">${escapeHtml(initials(item.nama))}</div>
            <div><strong>${escapeHtml(item.nama)}</strong><small>${escapeHtml(item.keterangan || "—")}</small></div>
          </div>
        </td>
        <td>${escapeHtml(item.jabatan || "—")}</td>
        <td>${escapeHtml(item.noHp || "—")}</td>
        <td class="location-cell">📍 ${escapeHtml(item.lokasi || "—")}</td>
        <td>${escapeHtml(formatDate(item.tanggal))}</td>
        <td><span class="status-pill ${escapeHtml(statusClass(item.status))}">${escapeHtml(normalizeStatus(item.status))}</span></td>
        <td>
          <div class="row-actions">
            <button class="row-btn" type="button" title="Edit" data-action="edit" data-id="${escapeHtml(item.id)}">✏️</button>
            <button class="row-btn delete" type="button" title="Hapus" data-action="delete" data-id="${escapeHtml(item.id)}">🗑️</button>
          </div>
        </td>
      </tr>
    `).join("");
  }

  const grouped = {};
  state.data.filter(x => normalizeStatus(x.status) === "Aktif").forEach(item => {
    const lokasi = String(item.lokasi || "Tanpa lokasi").trim() || "Tanpa lokasi";
    if (!grouped[lokasi]) grouped[lokasi] = [];
    grouped[lokasi].push(item);
  });
  const locations = Object.entries(grouped).sort((a, b) => b[1].length - a[1].length);
  $("#assignmentGrid").innerHTML = locations.length ? locations.map(([lokasi, members]) => `
    <div class="assignment-card">
      <div class="assignment-head"><strong>📍 ${escapeHtml(lokasi)}</strong><span class="assignment-count">${members.length} orang</span></div>
      <div class="assignment-members">
        ${members.map(item => `<span class="member-chip"><span class="mini-avatar">${escapeHtml(initials(item.nama))}</span>${escapeHtml(item.nama)}</span>`).join("")}
      </div>
    </div>
  `).join("") : `<div class="empty-assignment">Belum ada personel berstatus Aktif.</div>`;
}

function openModal(item = null) {
  state.editingId = item?.id || null;
  $("#modalTitle").textContent = item ? "Edit Personel" : "Tambah Personel";
  $("#personelId").value = item?.id || "";
  $("#nama").value = item?.nama || "";
  $("#jabatan").value = item?.jabatan || "";
  $("#noHp").value = item?.noHp || "";
  $("#lokasi").value = item?.lokasi || "";
  $("#tanggal").value = item ? toInputDate(item.tanggal) : toInputDate(new Date());
  $("#status").value = normalizeStatus(item?.status || "Aktif");
  $("#keterangan").value = item?.keterangan || "";
  $("#modalBackdrop").classList.remove("hidden");
  setTimeout(() => $("#nama").focus(), 50);
}

function closeModal() {
  $("#modalBackdrop").classList.add("hidden");
  state.editingId = null;
}

function jsonpRequest(params) {
  return new Promise((resolve, reject) => {
    const callbackName = `cb_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    const script = document.createElement("script");
    const query = new URLSearchParams({ modul: "tim", ...params, token: APP_CONFIG.API_TOKEN, callback: callbackName });
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error("Koneksi ke Google Sheet timeout."));
    }, 15000);

    window[callbackName] = (payload) => {
      cleanup();
      if (payload?.ok) resolve(payload);
      else reject(new Error(payload?.message || "Permintaan gagal."));
    };
    script.onerror = () => {
      cleanup();
      reject(new Error("Tidak dapat menghubungi Google Apps Script."));
    };
    script.src = `${APP_CONFIG.GOOGLE_SCRIPT_URL}?${query.toString()}`;
    document.body.appendChild(script);

    function cleanup() {
      clearTimeout(timeout);
      delete window[callbackName];
      script.remove();
    }
  });
}

async function loadData(silent = false) {
  if (!isConfigured()) {
    setConnection("error", "Belum dikonfigurasi");
    if (!silent) showToast("Masukkan URL Apps Script dan token di config.js.", "error");
    render();
    return;
  }
  try {
    if (!silent) $("#refreshBtn").disabled = true;
    const response = await jsonpRequest({ action: "list" });
    state.data = Array.isArray(response.data) ? response.data : [];
    setConnection("ok", "Terhubung");
    $("#lastSync").textContent = `Sinkron ${new Intl.DateTimeFormat("id-ID", {hour: "2-digit", minute: "2-digit"}).format(new Date())}`;
    render();
  } catch (error) {
    setConnection("error", "Gagal terhubung");
    if (!silent) showToast(error.message, "error");
  } finally {
    $("#refreshBtn").disabled = false;
  }
}

async function saveData(form) {
  if (!isConfigured()) {
    showToast("Konfigurasi Google Sheet di config.js terlebih dahulu.", "error");
    return;
  }
  const saveBtn = $("#saveBtn");
  saveBtn.disabled = true;
  saveBtn.textContent = "Menyimpan...";
  const payload = {
    action: state.editingId ? "update" : "create",
    id: state.editingId || crypto.randomUUID(),
    nama: $("#nama").value.trim(),
    jabatan: $("#jabatan").value.trim(),
    noHp: $("#noHp").value.trim(),
    lokasi: $("#lokasi").value.trim(),
    tanggal: $("#tanggal").value,
    status: $("#status").value,
    keterangan: $("#keterangan").value.trim()
  };

  try {
    await jsonpRequest(payload);
    closeModal();
    showToast(state.editingId ? "Data berhasil diperbarui." : "Personel berhasil ditambahkan.");
    await loadData(true);
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = "Simpan";
  }
}

async function deleteData(id) {
  const item = state.data.find(x => x.id === id);
  if (!item) return;
  const confirmed = window.confirm(`Hapus data ${item.nama}?`);
  if (!confirmed) return;
  try {
    await jsonpRequest({ action: "delete", id });
    showToast("Data berhasil dihapus.");
    await loadData(true);
  } catch (error) {
    showToast(error.message, "error");
  }
}

$("#addBtn").addEventListener("click", () => openModal());
$("#closeModal").addEventListener("click", closeModal);
$("#cancelBtn").addEventListener("click", closeModal);
$("#modalBackdrop").addEventListener("click", (event) => { if (event.target.id === "modalBackdrop") closeModal(); });
$("#personelForm").addEventListener("submit", (event) => { event.preventDefault(); saveData(event.currentTarget); });
$("#refreshBtn").addEventListener("click", () => loadData());
$("#searchInput").addEventListener("input", render);
$("#statusFilter").addEventListener("change", render);
$("#personelTableBody").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const id = button.dataset.id;
  if (button.dataset.action === "edit") openModal(state.data.find(x => x.id === id));
  if (button.dataset.action === "delete") deleteData(id);
});

document.addEventListener("keydown", event => { if (event.key === "Escape" && !$("#modalBackdrop").classList.contains("hidden")) closeModal(); });
$("#year").textContent = new Date().getFullYear();
render();
loadData();

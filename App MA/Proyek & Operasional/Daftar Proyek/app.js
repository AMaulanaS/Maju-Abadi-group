// GANTI dengan URL Web App Google Apps Script Anda
const API_URL = "https://script.google.com/macros/s/AKfycbyCZ2_aVvNwb7z1Tr_PVRpFoBAhNRrldOu4HfIddIKVJPffnWhDDagiswIgT0muJm72DA/exec";

let projects = [];

const $ = id => document.getElementById(id);

document.addEventListener("DOMContentLoaded", () => {
  $("btnTambah").onclick = () => openModal();
  $("btnClose").onclick = closeModal;
  $("btnCancel").onclick = closeModal;
  $("btnRefresh").onclick = loadProjects;
  $("searchInput").oninput = render;
  $("statusFilter").onchange = render;
  $("projectForm").onsubmit = saveProject;
  loadProjects();
});

async function api(action, data = {}) {
  if (API_URL.includes("PASTE_URL")) {
    throw new Error("API_URL belum diisi.");
  }
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {"Content-Type":"text/plain;charset=utf-8"},
    body: JSON.stringify({modul: "proyek", action, ...data})
  });
  const result = await response.json();
  if (!result.success) throw new Error(result.message || "Terjadi kesalahan.");
  return result;
}

async function loadProjects() {
  $("projectTable").innerHTML = `<tr><td colspan="8" class="empty">Memuat data...</td></tr>`;
  try {
    const result = await api("list");
    projects = result.data || [];
    render();
  } catch (err) {
    $("projectTable").innerHTML = `<tr><td colspan="8" class="empty">Gagal memuat: ${escapeHtml(err.message)}</td></tr>`;
    showToast(err.message, true);
  }
}

function render() {
  const q = $("searchInput").value.toLowerCase().trim();
  const status = $("statusFilter").value;

  const filtered = projects.filter(p => {
    const text = [p.kode,p.nama,p.pemilik,p.kategori,p.deskripsi].join(" ").toLowerCase();
    return (!q || text.includes(q)) && (!status || p.status === status);
  });

  $("projectTable").innerHTML = filtered.length ? filtered.map(rowHtml).join("") :
    `<tr><td colspan="8" class="empty">Belum ada data proyek.</td></tr>`;

  $("tableInfo").textContent = `${filtered.length} dari ${projects.length} proyek`;
  $("statTotal").textContent = projects.length;
  $("statBerjalan").textContent = projects.filter(x => x.status === "Berjalan").length;
  $("statSelesai").textContent = projects.filter(x => x.status === "Selesai").length;
  $("statTertunda").textContent = projects.filter(x => x.status === "Tertunda").length;
}

function rowHtml(p) {
  const statusClass = String(p.status || "").toLowerCase().replace(/\s+/g,"-");
  const progress = Math.max(0, Math.min(100, Number(p.progress) || 0));
  return `<tr>
    <td><b>${escapeHtml(p.kode)}</b></td>
    <td><b>${escapeHtml(p.nama)}</b><br><small>${escapeHtml(p.deskripsi || "")}</small></td>
    <td>${escapeHtml(p.pemilik || "-")}</td>
    <td>${escapeHtml(p.kategori || "-")}</td>
    <td><span class="status ${statusClass}">${escapeHtml(p.status || "-")}</span></td>
    <td><div class="progress"><b>${progress}%</b><div class="progress-track"><div class="progress-bar" style="width:${progress}%"></div></div></div></td>
    <td>${formatDate(p.deadline)}</td>
    <td><div class="actions">
      <button class="action" onclick="editProject('${escapeAttr(p.id)}')">✏️</button>
      <button class="action" onclick="deleteProject('${escapeAttr(p.id)}')">🗑️</button>
    </div></td>
  </tr>`;
}

function openModal(project = null) {
  $("modalTitle").textContent = project ? "Edit Proyek" : "Tambah Proyek";
  $("projectId").value = project?.id || "";
  $("kode").value = project?.kode || "";
  $("nama").value = project?.nama || "";
  $("pemilik").value = project?.pemilik || "";
  $("kategori").value = project?.kategori || "";
  $("status").value = project?.status || "Belum Mulai";
  $("progress").value = project?.progress ?? 0;
  $("mulai").value = normalizeDate(project?.mulai);
  $("deadline").value = normalizeDate(project?.deadline);
  $("anggaran").value = project?.anggaran || "";
  $("deskripsi").value = project?.deskripsi || "";
  $("projectModal").classList.remove("hidden");
}

function closeModal() {
  $("projectModal").classList.add("hidden");
}

async function saveProject(e) {
  e.preventDefault();
  const payload = {
    id: $("projectId").value,
    kode: $("kode").value.trim(),
    nama: $("nama").value.trim(),
    pemilik: $("pemilik").value.trim(),
    kategori: $("kategori").value.trim(),
    status: $("status").value,
    progress: Number($("progress").value || 0),
    mulai: $("mulai").value,
    deadline: $("deadline").value,
    anggaran: Number($("anggaran").value || 0),
    deskripsi: $("deskripsi").value.trim()
  };

  if (!payload.kode || !payload.nama) return showToast("Kode dan nama proyek wajib diisi.", true);

  $("btnSave").disabled = true;
  try {
    await api(payload.id ? "update" : "create", payload);
    closeModal();
    showToast(payload.id ? "Proyek berhasil diperbarui." : "Proyek berhasil ditambahkan.");
    await loadProjects();
  } catch (err) {
    showToast(err.message, true);
  } finally {
    $("btnSave").disabled = false;
  }
}

window.editProject = function(id) {
  const project = projects.find(p => String(p.id) === String(id));
  if (project) openModal(project);
};

window.deleteProject = async function(id) {
  const project = projects.find(p => String(p.id) === String(id));
  if (!project || !confirm(`Hapus proyek "${project.nama}"?`)) return;
  try {
    await api("delete", {id});
    showToast("Proyek berhasil dihapus.");
    await loadProjects();
  } catch (err) {
    showToast(err.message, true);
  }
};

function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  return isNaN(d) ? escapeHtml(String(value)) : d.toLocaleDateString("id-ID");
}
function normalizeDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d)) return String(value).slice(0,10);
  return d.toISOString().slice(0,10);
}
function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}
function escapeAttr(s) { return escapeHtml(s); }
function showToast(message, error=false) {
  const t = $("toast"); t.textContent = message; t.classList.remove("hidden");
  t.style.background = error ? "#a33b2f" : "#33251e";
  clearTimeout(showToast.timer); showToast.timer = setTimeout(() => t.classList.add("hidden"), 3000);
}

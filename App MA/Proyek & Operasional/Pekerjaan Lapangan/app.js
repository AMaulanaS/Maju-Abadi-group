const $ = id => document.getElementById(id);
let jobs = [];

document.addEventListener("DOMContentLoaded", () => {
  $("tanggal").value = new Date().toISOString().slice(0,10);
  $("addBtn").onclick = () => openModal();
  $("closeBtn").onclick = closeModal;
  $("cancelBtn").onclick = closeModal;
  $("jobForm").onsubmit = saveJob;
  $("search").oninput = render;
  $("statusFilter").onchange = render;
  $("refreshBtn").onclick = loadJobs;
  loadJobs();
});

async function api(action, payload={}) {
  if (!API_URL || API_URL.includes("PASTE_URL")) throw new Error("API_URL belum diisi di config.js");
  const body = JSON.stringify({modul:"pekerjaan", action, ...payload});
  const res = await fetch(API_URL, {method:"POST", body});
  const data = await res.json();
  if (!data.ok) throw new Error(data.message || "Terjadi kesalahan");
  return data;
}

async function loadJobs(){
  try {
    const data = await api("list");
    jobs = data.data || [];
    render();
  } catch(e) {
    jobs = JSON.parse(localStorage.getItem("pekerjaan_lapangan") || "[]");
    render();
    toast("Mode lokal: " + e.message);
  }
}

function render(){
  const q = $("search").value.toLowerCase();
  const sf = $("statusFilter").value;
  const filtered = jobs.filter(j => {
    const text = Object.values(j).join(" ").toLowerCase();
    return text.includes(q) && (!sf || j.status === sf);
  });
  $("tableBody").innerHTML = filtered.map(j => `
    <tr>
      <td>${esc(j.id)}</td><td>${esc(j.tanggal)}</td><td><b>${esc(j.pekerjaan)}</b><br><small>${esc(j.keterangan||"")}</small></td>
      <td>${esc(j.lokasi)}</td><td>${esc(j.petugas||"-")}</td>
      <td><span class="priority ${esc(j.prioritas)}">${esc(j.prioritas)}</span></td>
      <td><span class="badge ${String(j.status).replaceAll(" ","-")}">${esc(j.status)}</span></td>
      <td><div class="actions"><button class="btn small edit" onclick="editJob('${escAttr(j.id)}')">Edit</button><button class="btn small delete" onclick="deleteJob('${escAttr(j.id)}')">Hapus</button></div></td>
    </tr>`).join("");
  $("empty").style.display = filtered.length ? "none" : "block";
  $("total").textContent = jobs.length;
  $("belum").textContent = jobs.filter(x=>x.status==="Belum Mulai").length;
  $("proses").textContent = jobs.filter(x=>x.status==="Proses").length;
  $("selesai").textContent = jobs.filter(x=>x.status==="Selesai").length;
}

function openModal(j=null){
  $("modal").classList.remove("hidden");
  $("modalTitle").textContent = j ? "Edit Pekerjaan" : "Tambah Pekerjaan";
  $("id").value=j?.id||"";
  $("tanggal").value=j?.tanggal||new Date().toISOString().slice(0,10);
  $("pekerjaan").value=j?.pekerjaan||"";
  $("lokasi").value=j?.lokasi||"";
  $("petugas").value=j?.petugas||"";
  $("prioritas").value=j?.prioritas||"Normal";
  $("status").value=j?.status||"Belum Mulai";
  $("keterangan").value=j?.keterangan||"";
}
function closeModal(){ $("modal").classList.add("hidden"); }

async function saveJob(e){
  e.preventDefault();
  const job={id:$("id").value||("PL-"+Date.now()),tanggal:$("tanggal").value,pekerjaan:$("pekerjaan").value,lokasi:$("lokasi").value,petugas:$("petugas").value,prioritas:$("prioritas").value,status:$("status").value,keterangan:$("keterangan").value};
  try {
    await api(job.id && jobs.some(x=>x.id===job.id) ? "update" : "create",{data:job});
    toast("Data berhasil disimpan"); closeModal(); await loadJobs();
  } catch(e) {
    const idx=jobs.findIndex(x=>x.id===job.id); if(idx>=0) jobs[idx]=job; else jobs.unshift(job);
    localStorage.setItem("pekerjaan_lapangan",JSON.stringify(jobs)); render(); closeModal(); toast("Tersimpan di browser");
  }
}
window.editJob = id => { const j=jobs.find(x=>x.id===id); if(j) openModal(j); };
window.deleteJob = async id => {
  if(!confirm("Hapus pekerjaan ini?")) return;
  try { await api("delete",{id}); toast("Data dihapus"); await loadJobs(); }
  catch(e){ jobs=jobs.filter(x=>x.id!==id); localStorage.setItem("pekerjaan_lapangan",JSON.stringify(jobs)); render(); toast("Dihapus dari browser"); }
};
function toast(msg){const t=$("toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2800)}
function esc(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function escAttr(v){return esc(v).replace(/`/g,"&#096;")}

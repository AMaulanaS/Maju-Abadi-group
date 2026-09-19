// URL Web App yang sama dengan modul lain (satu backend untuk semua modul).
const API_URL = "https://script.google.com/macros/s/AKfycbyCZ2_aVvNwb7z1Tr_PVRpFoBAhNRrldOu4HfIddIKVJPffnWhDDagiswIgT0muJm72DA/exec";

const demoData = [
  {id:"PRJ-001", nama:"Pembangunan Gedung", penanggung:"Budi", mulai:"01/09/2026", target:"30/10/2026", progress:65, status:"Berjalan", keterangan:"Pekerjaan lantai 2"},
  {id:"PRJ-002", nama:"Renovasi Kantor", penanggung:"Andi", mulai:"05/09/2026", target:"20/09/2026", progress:100, status:"Selesai", keterangan:"Pekerjaan selesai"}
];

let projects = [];

async function loadData(){
  try{
    if(!API_URL) projects = demoData;
    else {
      // Ambil data dari modul "proyek" (sheet Daftar Proyek yang sama),
      // supaya Progress Proyek tidak punya data ganda sendiri.
      const res = await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({modul:"proyek", action:"list"})
      });
      const data = await res.json();
      projects = Array.isArray(data) ? data : (data.data || []);
    }
  }catch(e){
    console.error(e);
    projects = demoData;
  }
  render();
}

function render(){
  const q=document.getElementById("search").value.toLowerCase();
  const s=document.getElementById("status").value;
  const filtered=projects.filter(p =>
    String(p.nama||p["Nama Proyek"]||"").toLowerCase().includes(q) &&
    (!s || (p.status||p.Status)===s)
  );
  document.getElementById("total").textContent=projects.length;
  document.getElementById("running").textContent=projects.filter(p=>(p.status||p.Status)==="Berjalan").length;
  document.getElementById("done").textContent=projects.filter(p=>(p.status||p.Status)==="Selesai").length;
  document.getElementById("pending").textContent=projects.filter(p=>(p.status||p.Status)==="Tertunda").length;

  const list=document.getElementById("projectList");
  list.innerHTML=filtered.length ? filtered.map(p=>{
    const nama=p.nama||p["Nama Proyek"]||"-";
    const progress=Number(p.progress??p.Progress??0);
    const status=p.status||p.Status||"Belum Mulai";
    return `<article class="card">
      <div class="card-top"><div><p class="name">${esc(nama)}</p><div class="meta">${esc(p.kode||p.id||p.ID||"")}</div></div><span class="badge">${esc(status)}</span></div>
      <div class="progress-row"><span>Progress</span><span>${progress}%</span></div>
      <div class="bar"><div class="fill" style="width:${Math.max(0,Math.min(100,progress))}%"></div></div>
      <div class="detail"><div>👤 ${esc(p.penanggung||p["Penanggung Jawab"]||p.pemilik||"-")}</div><div>🎯 ${esc(p.target||p["Target Selesai"]||p.deadline||"-")}</div></div>
      <div class="note">${esc(p.keterangan||p.Keterangan||p.deskripsi||"Tidak ada keterangan.")}</div>
    </article>`;
  }).join("") : `<div class="empty">Tidak ada proyek yang sesuai.</div>`;
}
function esc(v){return String(v).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
document.getElementById("search").addEventListener("input",render);
document.getElementById("status").addEventListener("change",render);
document.getElementById("refreshBtn").addEventListener("click",loadData);
loadData();

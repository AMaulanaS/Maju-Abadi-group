const API_URL = "https://script.google.com/macros/s/AKfycbw3ozDeSHnRkUoAWOVyZj6bT61en0__pkEkerphZeCxjPlblo0zny0J-ac8z8eJfGdH1g/exec";
// Jika URL deployment Anda berbeda, ubah API_URL di atas.

let guests = [];
let filtered = [];
let page = 1;
const pageSize = 12;
let editingId = null;
let selectedGuest = null;

const $ = id => document.getElementById(id);

function escapeHtml(v){
  return String(v ?? "").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}
function showToast(text){
  const t=$("toast"); t.textContent=text; t.classList.add("show");
  clearTimeout(window.toastTimer); window.toastTimer=setTimeout(()=>t.classList.remove("show"),2500);
}
function formMessage(text,type=""){
  $("formMessage").textContent=text; $("formMessage").className="message "+type;
}
function fmtNow(){return new Date().toLocaleString("id-ID",{hour:"2-digit",minute:"2-digit",second:"2-digit"});}
function tick(){$("clock").textContent=fmtNow();}
setInterval(tick,1000); tick(); $("year").textContent=new Date().getFullYear();

function openTab(name){
  document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active",b.dataset.tab===name));
  document.querySelectorAll(".tab-panel").forEach(p=>p.classList.toggle("active",p.id==="tab-"+name));
  if(name==="history") renderTable();
}
window.openTab=openTab;

document.querySelectorAll(".tab").forEach(b=>b.addEventListener("click",()=>openTab(b.dataset.tab)));

function getVal(g,key){return g?.[key] ?? "";}
function todayKey(){
  const d=new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function guestDateKey(v){
  if(!v) return "";
  const s=String(v);
  const m=s.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if(m) return `${m[3]}-${String(m[2]).padStart(2,"0")}-${String(m[1]).padStart(2,"0")}`;
  const d=new Date(s); return isNaN(d)? "":`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function apiJsonp(action, payload = {}, timeout = 20000) {
  return new Promise((resolve, reject) => {
    const callback = "__bukuTamuCB_" + Date.now() + "_" + Math.random().toString(36).slice(2);
    const script = document.createElement("script");
    const params = new URLSearchParams({ action, callback });
    Object.entries(payload).forEach(([key, value]) => params.set(key, value ?? ""));

    let finished = false;
    const cleanup = () => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      script.remove();
      try { delete window[callback]; } catch (_) {}
    };
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error("Apps Script tidak merespons dalam 20 detik."));
    }, timeout);

    window[callback] = (data) => {
      cleanup();
      resolve(data);
    };
    script.onerror = () => {
      cleanup();
      reject(new Error("URL Apps Script tidak dapat diakses."));
    };
    script.src = `${API_URL}?${params.toString()}`;
    document.head.appendChild(script);
  });
}

async function apiGet(action){
  return apiJsonp(action);
}

async function apiPost(action, payload = {}){
  // Apps Script Web App dapat melakukan redirect lintas domain pada POST.
  // Gunakan JSONP GET agar browser tidak menunggu respons CORS/redirect.
  return apiJsonp(action, payload, 30000);
}

async function loadGuests(){
  $("statStatus").textContent="...";
  $("statStatusText").textContent="Memuat data";
  try{
    const data=await apiGet("list");
    if(data.success===false) throw new Error(data.message||"Gagal");
    guests=Array.isArray(data.data)?data.data:(Array.isArray(data)?data:[]);
    $("statStatus").textContent="OK";
    $("statStatusText").textContent="Terhubung ke Google Sheets";
    renderAll();
  }catch(err){
    guests=[]; renderAll();
    $("statStatus").textContent="ERROR";
    $("statStatusText").textContent="Periksa URL Apps Script";
    showToast("Gagal mengambil data: "+err.message);
  }
}

function renderAll(){
  const today= todayKey();
  $("statTotal").textContent=guests.length;
  $("statToday").textContent=guests.filter(g=>guestDateKey(getVal(g,"timestamp"))===today).length;
  $("statInside").textContent=guests.filter(g=>getVal(g,"status")==="Berada di lokasi").length;
  renderPurpose();
  renderRecent();
  renderTable();
}

function renderPurpose(){
  const box=$("purposeSummary");
  const counts={};
  guests.forEach(g=>{const k=getVal(g,"keperluan")||"Lainnya";counts[k]=(counts[k]||0)+1});
  const items=Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,8);
  if(!items.length){box.innerHTML='<div class="empty">Belum ada data.</div>';return}
  const max=Math.max(...items.map(x=>x[1]));
  box.innerHTML=items.map(([k,v])=>`<div class="bar-row"><span>${escapeHtml(k)}</span><div class="bar-track"><div class="bar-fill" style="width:${Math.round(v/max*100)}%"></div></div><b>${v}</b></div>`).join("");
}
function renderRecent(){
  const box=$("recentList");
  const list=guests.slice().reverse().slice(0,5);
  if(!list.length){box.innerHTML='<div class="empty">Belum ada kunjungan.</div>';return}
  box.innerHTML=list.map(g=>`<div class="recent"><strong>${escapeHtml(g.nama)}</strong><small>${escapeHtml(g.instansi||"-")} • ${escapeHtml(g.keperluan||"-")}</small><small>${escapeHtml(g.timestamp||"-")}</small></div>`).join("");
}

function applyFilters(){
  const q=$("searchInput").value.trim().toLowerCase();
  const status=$("statusFilter").value;
  const date=$("dateFilter").value;
  filtered=guests.filter(g=>{
    const text=[g.nama,g.telepon,g.instansi,g.jabatan,g.bertemu,g.keperluan,g.detail].join(" ").toLowerCase();
    return (!q||text.includes(q))&&(!status||g.status===status)&&(!date||guestDateKey(g.timestamp)===date);
  });
  page=1; renderTable();
}
function renderTable(){
  const q=$("searchInput").value.trim().toLowerCase();
  const status=$("statusFilter").value;
  const date=$("dateFilter").value;
  filtered=guests.filter(g=>{
    const text=[g.nama,g.telepon,g.instansi,g.jabatan,g.bertemu,g.keperluan,g.detail].join(" ").toLowerCase();
    return (!q||text.includes(q))&&(!status||g.status===status)&&(!date||guestDateKey(g.timestamp)===date);
  });
  const totalPages=Math.max(1,Math.ceil(filtered.length/pageSize));
  if(page>totalPages) page=totalPages;
  const start=(page-1)*pageSize, data=filtered.slice().reverse().slice(start,start+pageSize);
  $("resultInfo").textContent=`${filtered.length} data`;
  $("pageInfo").textContent=`Halaman ${page} / ${totalPages}`;
  $("prevPage").disabled=page<=1; $("nextPage").disabled=page>=totalPages;
  if(!data.length){$("guestTable").innerHTML='<tr><td colspan="8" class="empty">Data tidak ditemukan.</td></tr>';return}
  $("guestTable").innerHTML=data.map((g,i)=>{
    const idx=guests.indexOf(g);
    const inside=g.status==="Berada di lokasi";
    return `<tr>
      <td>${start+i+1}</td>
      <td>${escapeHtml(g.timestamp)}</td>
      <td><b>${escapeHtml(g.nama)}</b></td>
      <td>${escapeHtml(g.instansi||"-")}</td>
      <td>${escapeHtml(g.bertemu||"-")}</td>
      <td>${escapeHtml(g.keperluan||"-")}</td>
      <td><span class="badge ${inside?"inside":"done"}">${escapeHtml(g.status||"Selesai")}</span></td>
      <td><div class="action-row">
        <button class="icon-action" title="Detail" onclick="viewGuest(${idx})">👁</button>
        <button class="icon-action" title="Edit" onclick="editGuest(${idx})">✎</button>
        ${inside?`<button class="icon-action" title="Check-out" onclick="checkoutGuest(${idx})">↪</button>`:""}
        <button class="icon-action danger" title="Hapus" onclick="deleteGuest(${idx})">🗑</button>
      </div></td>
    </tr>`
  }).join("");
}

function clearForm(){
  editingId=null;$("guestForm").reset();$("guestId").value="";
  $("formTitle").textContent="Tambah Data Tamu";$("saveBtn").textContent="Simpan Kunjungan";$("cancelEditBtn").style.display="none";formMessage("");
}

$("guestForm").addEventListener("submit",async e=>{
  e.preventDefault();
  $("saveBtn").disabled=true; formMessage(editingId?"Memperbarui data...":"Menyimpan data...");
  const data=Object.fromEntries(new FormData($("guestForm")).entries());
  try{
    let result;
    if(editingId) result=await apiPost("update",{...data,id:editingId});
    else result=await apiPost("create",data);
    if(result.success===false) throw new Error(result.message||"Operasi gagal");
    formMessage(editingId?"Data berhasil diperbarui.":"Kunjungan berhasil disimpan.","success");
    showToast(editingId?"Data diperbarui":"Kunjungan tersimpan");
    clearForm(); await loadGuests(); openTab("history");
  }catch(err){formMessage("Gagal: "+err.message,"error")}
  finally{$("saveBtn").disabled=false}
});
$("resetBtn").addEventListener("click",()=>setTimeout(clearForm,0));
$("cancelEditBtn").addEventListener("click",clearForm);

window.viewGuest=function(index){
  const g=guests[index]; if(!g)return; selectedGuest=g;
  $("detailContent").innerHTML=[
    ["Waktu Masuk",g.timestamp],["Nama",g.nama],["No. HP / WhatsApp",g.telepon||"-"],
    ["Instansi / Perusahaan",g.instansi||"-"],["Jabatan",g.jabatan||"-"],["Bertemu Dengan",g.bertemu||"-"],
    ["Keperluan",g.keperluan||"-"],["Jumlah Tamu",g.jumlah||"1"],["Status",g.status||"-"],
    ["Waktu Keluar",g.checkout||"-"],["Detail Keperluan",g.detail||"-"]
  ].map(([k,v],i)=>`<div class="detail-item ${i===10?'full':''}"><span>${escapeHtml(k)}</span><b>${escapeHtml(v)}</b></div>`).join("");
  $("detailModal").classList.add("show");
}
window.closeModal=function(){$("detailModal").classList.remove("show")};

window.editGuest=function(index){
  const g=guests[index]; if(!g)return;
  editingId=g.id;
  $("guestId").value=g.id||"";$("nama").value=g.nama||"";
  $("guestForm").telepon.value=g.telepon||"";$("guestForm").instansi.value=g.instansi||"";
  $("guestForm").jabatan.value=g.jabatan||"";$("guestForm").bertemu.value=g.bertemu||"";
  $("guestForm").keperluan.value=g.keperluan||"";$("guestForm").jumlah.value=g.jumlah||1;
  $("guestForm").status.value=g.status||"Berada di lokasi";$("guestForm").detail.value=g.detail||"";
  $("formTitle").textContent="Edit Data Tamu";$("saveBtn").textContent="Simpan Perubahan";$("cancelEditBtn").style.display="inline-block";
  openTab("form"); window.scrollTo({top:0,behavior:"smooth"});
}
window.deleteGuest=async function(index){
  const g=guests[index]; if(!g)return;
  if(!confirm(`Hapus data tamu "${g.nama}"? Data akan dihapus dari Google Sheets.`))return;
  try{
    const result=await apiPost("delete",{id:g.id});
    if(result.success===false) throw new Error(result.message||"Gagal menghapus");
    showToast("Data berhasil dihapus"); await loadGuests();
  }catch(err){showToast("Gagal menghapus: "+err.message)}
}
window.checkoutGuest=async function(index){
  const g=guests[index]; if(!g)return;
  try{
    const result=await apiPost("checkout",{id:g.id});
    if(result.success===false) throw new Error(result.message||"Gagal check-out");
    showToast("Tamu berhasil check-out"); await loadGuests();
  }catch(err){showToast("Gagal check-out: "+err.message)}
}

$("searchInput").addEventListener("input",applyFilters);
$("statusFilter").addEventListener("change",applyFilters);
$("dateFilter").addEventListener("change",applyFilters);
$("clearFilterBtn").addEventListener("click",()=>{$("searchInput").value="";$("statusFilter").value="";$("dateFilter").value="";applyFilters()});
$("prevPage").addEventListener("click",()=>{if(page>1){page--;renderTable()}});
$("nextPage").addEventListener("click",()=>{const p=Math.ceil(filtered.length/pageSize);if(page<p){page++;renderTable()}});
$("refreshBtn").addEventListener("click",loadGuests);

function csvEscape(v){return `"${String(v??"").replace(/"/g,'""')}"`}
$("csvBtn").addEventListener("click",()=>{
  const headers=["ID","Timestamp","Nama","Telepon","Instansi","Jabatan","Bertemu Dengan","Keperluan","Jumlah","Status","Checkout","Detail"];
  const lines=[headers,...filtered.map(g=>[g.id,g.timestamp,g.nama,g.telepon,g.instansi,g.jabatan,g.bertemu,g.keperluan,g.jumlah,g.status,g.checkout,g.detail])].map(r=>r.map(csvEscape).join(","));
  const blob=new Blob(["\ufeff"+lines.join("\n")],{type:"text/csv;charset=utf-8"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`buku-tamu-${todayKey()}.csv`;a.click();URL.revokeObjectURL(a.href);
});

$("printBtn").addEventListener("click",()=>{
  const oldTitle=document.title; document.title=`Rekap Buku Tamu ${todayKey()}`;
  window.print(); document.title=oldTitle;
});
$("modalPrintBtn").addEventListener("click",()=>{
  if(!selectedGuest)return;
  const g=selectedGuest;
  const w=window.open("","_blank","width=850,height=700");
  w.document.write(`<html><head><title>Detail Tamu</title><style>body{font-family:Arial;padding:35px;color:#222}h1{font-size:22px;margin-bottom:20px}.row{padding:9px 0;border-bottom:1px solid #ddd}.k{display:inline-block;width:180px;color:#666}.v{font-weight:700}</style></head><body><h1>Detail Kunjungan Tamu</h1>${
    [["Waktu Masuk",g.timestamp],["Nama",g.nama],["Telepon",g.telepon],["Instansi",g.instansi],["Jabatan",g.jabatan],["Bertemu Dengan",g.bertemu],["Keperluan",g.keperluan],["Jumlah Tamu",g.jumlah],["Status",g.status],["Waktu Keluar",g.checkout],["Detail Keperluan",g.detail]]
    .map(x=>`<div class="row"><span class="k">${escapeHtml(x[0])}</span><span class="v">${escapeHtml(x[1]||"-")}</span></div>`).join("")
  }</body></html>`);w.document.close();w.focus();w.print();
});
$("detailModal").addEventListener("click",e=>{if(e.target.id==="detailModal")closeModal()});

loadGuests();

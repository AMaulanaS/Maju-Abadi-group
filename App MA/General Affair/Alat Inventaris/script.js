const API_URL="https://script.google.com/macros/s/AKfycbz2gkpOKOesDno2rpDNAHaVUb3tDDcTsRF7U581xSci7gL21yu5fAVutjpf665reYIgcg/exec";
let inventory=[],categories=[],locations=[];
let dashboardCharts={};
let loadingCount=0;
const DEFAULT_UNITS=["pcs","buah","unit","set","pak","lusin","lembar","meter","roll","botol","box","lainnya"];
const DEFAULT_LOCATIONS=["Lantai 1","Lantai 2","Lantai 3","Ruang Administrasi","Ruang Keuangan","Ruang HR","Ruang HRD","Ruang Pimpinan","Ruang Rapat","Gudang","Ruang IT","Ruang Operasional","Ruang Arsip","Ruang Tamu","Lainnya"];

function setLoading(active,text="Memproses..."){
  loadingCount=Math.max(0,loadingCount+(active?1:-1));
  const el=document.getElementById("loadingOverlay");
  if(!el)return;
  el.classList.toggle("show",loadingCount>0);
  el.setAttribute("aria-hidden",loadingCount>0?"false":"true");
  const t=document.getElementById("loadingText"); if(t)t.textContent=text;
}
async function withLoading(fn,text="Memproses..."){
  setLoading(true,text);
  try{return await fn()} finally{setLoading(false)}
}

async function api(action,data={}){
  const res=await fetch(API_URL,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify({action,data})});
  const json=await res.json();if(!json.success)throw new Error(json.message||"Terjadi kesalahan");return json
}
function showToast(msg){const t=document.getElementById("toast");t.textContent=msg;t.style.display="block";setTimeout(()=>t.style.display="none",2500)}
function setConnection(ok){document.getElementById("connectionDot").style.background=ok?"#22c55e":"#facc15";document.getElementById("connectionText").textContent=ok?"Terhubung":"Belum terhubung"}
const pageNames={dashboard:"Dashboard",inventaris:"Inventaris",kategoriPage:"Master Kategori",peminjaman:"Peminjaman",mutasi:"Mutasi Barang",laporan:"Laporan"};
function showPage(page){document.querySelectorAll(".page").forEach(x=>x.classList.remove("active"));document.getElementById(page+"Page").classList.add("active");document.querySelectorAll(".nav-item").forEach(x=>x.classList.toggle("active",x.dataset.page===page));document.getElementById("pageTitle").textContent=pageNames[page]||page}
document.querySelectorAll(".nav-item").forEach(x=>x.addEventListener("click",()=>showPage(x.dataset.page)));

async function loadData(){try{const r=await api("getAllData");inventory=r.data.inventaris||[];categories=r.data.kategori||[];locations=r.data.lokasi||[];renderCategoryOptions();renderCategoryTable();renderLocationOptions();renderInventory();renderRecent();setConnection(true);const d=await api("getDashboard");renderDashboard(d.data||{})}catch(e){console.error(e);setConnection(false);showToast("Gagal terhubung ke Google Sheet")}}
function renderDashboard(d){
  document.getElementById("totalAset").textContent=d.totalAset??0;
  document.getElementById("tersedia").textContent=d.tersedia??0;
  document.getElementById("dipinjam").textContent=d.dipinjam??0;
  document.getElementById("rusak").textContent=d.rusak??0;
  document.getElementById("totalNilai").textContent=money(d.totalNilai??0);
  renderDashboardCharts();
}

function renderDashboardCharts(){
  if(typeof Chart==='undefined') return;
  const sumBy=(field, valueFn)=>{
    const m={};
    inventory.forEach(x=>{const key=String(x[field]||'Belum diisi').trim()||'Belum diisi';m[key]=(m[key]||0)+valueFn(x)});
    return Object.entries(m).sort((a,b)=>b[1]-a[1]);
  };
  const qty=sumBy('Kategori',x=>Number(x.Jumlah)||0);
  const values=sumBy('Kategori',x=>(Number(x.Jumlah)||0)*(Number(x['Harga Perolehan'])||0));
  const cond=sumBy('Kondisi',x=>Number(x.Jumlah)||0);
  makeChart('categoryChart','bar','Jumlah Barang per Kategori',qty.map(x=>x[0]),qty.map(x=>x[1]),'Jumlah','integer');
  makeChart('valueCategoryChart','bar','Nilai Aset per Kategori',values.map(x=>x[0]),values.map(x=>x[1]),'Nilai','currency');
  makeChart('conditionChart','doughnut','Kondisi Inventaris',cond.map(x=>x[0]),cond.map(x=>x[1]),'Jumlah','integer');
}

function makeChart(id,type,title,labels,data,label,format){
  const el=document.getElementById(id); if(!el) return;
  if(dashboardCharts[id]) dashboardCharts[id].destroy();
  const isCurrency=format==='currency';
  dashboardCharts[id]=new Chart(el,{
    type,
    data:{labels,datasets:[{label,data,borderWidth:1,borderRadius:type==='bar'?8:0}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:type==='doughnut',position:'bottom'},tooltip:{callbacks:{label:ctx=>{const v=ctx.parsed?.y??ctx.parsed??0;return `${ctx.dataset.label||label}: ${isCurrency?money(v):new Intl.NumberFormat('id-ID').format(v)}`}}}},scales:type==='doughnut'?{}:{y:{beginAtZero:true,ticks:{callback:v=>isCurrency?money(v):new Intl.NumberFormat('id-ID').format(v)}}}}
  });
}

function renderRecent(){document.getElementById("recentTable").innerHTML=inventory.slice(-8).reverse().map(x=>`<tr><td>${esc(x["Kode Inventaris"])}</td><td>${esc(x["Nama Barang"])}</td><td>${esc(x.Kategori)}</td><td>${esc(x.Lokasi)}</td><td>${esc(x.Kondisi)}</td><td>${esc(x.Status)}</td></tr>`).join("")||`<tr><td colspan="6">Belum ada data.</td></tr>`}
function renderInventory(){const q=(document.getElementById("searchInput")?.value||"").toLowerCase(),cat=document.getElementById("categoryFilter")?.value||"",con=document.getElementById("conditionFilter")?.value||"";const rows=inventory.filter(x=>(!q||JSON.stringify(x).toLowerCase().includes(q))&&(!cat||x.Kategori===cat)&&(!con||x.Kondisi===con));document.getElementById("inventoryTable").innerHTML=rows.map(x=>`<tr><td>${esc(x["Kode Inventaris"])}</td><td>${esc(x["Nama Barang"])}</td><td>${esc(x.Kategori)}</td><td>${esc(x["Merk/Type"])}</td><td>${esc(x.Jumlah)} ${esc(x.Satuan)}</td><td>${money(x["Harga Perolehan"])}</td><td>${esc(x.Lokasi)}</td><td>${esc(x.Kondisi)}</td><td>${esc(x.Status)}</td><td><button class="action-btn" onclick='editInventory(${JSON.stringify(x)})'><i class="bi bi-pencil"></i></button><button class="action-btn delete" onclick="deleteInventory('${esc(x.ID)}')"><i class="bi bi-trash"></i></button></td></tr>`).join("")||`<tr><td colspan="10">Belum ada data.</td></tr>`}
function renderCategoryOptions(){const a=document.getElementById("categoryFilter"),b=document.getElementById("kategori");const active=categories.filter(x=>String(x.Status).toLowerCase()==="aktif"&&x["Nama Kategori"]);a.innerHTML='<option value="">Semua Kategori</option>'+active.map(x=>`<option value="${esc(x["Nama Kategori"])}">${esc(x["Nama Kategori"])}</option>`).join("");b.innerHTML=active.map(x=>`<option value="${esc(x["Nama Kategori"])}">${esc(x["Nama Kategori"])}</option>`).join("")}
function renderCategoryTable(){document.getElementById("categoryTable").innerHTML=categories.map(x=>`<tr><td>${esc(x["ID Kategori"])}</td><td><b>${esc(x["Nama Kategori"])}</b></td><td><span class="badge ${String(x.Status).toLowerCase()!=="aktif"?"off":""}">${esc(x.Status)}</span></td><td>${esc(x.Keterangan)}</td><td><button class="action-btn" onclick='editCategory(${JSON.stringify(x)})'><i class="bi bi-pencil"></i></button><button class="action-btn delete" onclick="deleteCategory('${esc(x["ID Kategori"])}')"><i class="bi bi-trash"></i></button></td></tr>`).join("")||`<tr><td colspan="5">Belum ada kategori.</td></tr>`}
function renderLocationOptions(){
  const values=[...DEFAULT_LOCATIONS,...locations.map(x=>x["Nama Lokasi"]).filter(Boolean)];
  const unique=[...new Set(values.map(v=>String(v).trim()).filter(Boolean))];
  document.getElementById("lokasi").innerHTML=unique.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join("");
}

function openInventoryModal(item=null){document.getElementById("modalTitle").textContent=item?"Edit Aset":"Tambah Aset";document.getElementById("editId").value=item?.ID||"";const map={nama:"Nama Barang",merk:"Merk/Type",noSeri:"No Seri",jumlah:"Jumlah",satuan:"Satuan",tanggalPembelian:"Tanggal Pembelian",harga:"Harga Perolehan",penanggungJawab:"Penanggung Jawab",keterangan:"Keterangan"};Object.keys(map).forEach(id=>document.getElementById(id).value=item?.[map[id]]??"");document.getElementById("kategori").value=item?.Kategori||categories.find(x=>x.Status==="Aktif")?.["Nama Kategori"]||"";document.getElementById("lokasi").value=item?.Lokasi||locations[0]?.["Nama Lokasi"]||"";document.getElementById("kondisi").value=item?.Kondisi||"Baik";document.getElementById("status").value=item?.Status||"Tersedia";document.getElementById("inventoryModal").classList.add("show")}
function editInventory(item){openInventoryModal(item)}
document.getElementById("inventoryForm").addEventListener("submit",async e=>{e.preventDefault();const data={"ID":document.getElementById("editId").value,"Nama Barang":document.getElementById("nama").value,"Kategori":document.getElementById("kategori").value,"Merk/Type":document.getElementById("merk").value,"No Seri":document.getElementById("noSeri").value,"Jumlah":document.getElementById("jumlah").value,"Satuan":document.getElementById("satuan").value,"Tanggal Pembelian":document.getElementById("tanggalPembelian").value,"Harga Perolehan":document.getElementById("harga").value,"Lokasi":document.getElementById("lokasi").value,"Penanggung Jawab":document.getElementById("penanggungJawab").value,"Kondisi":document.getElementById("kondisi").value,"Status":document.getElementById("status").value,"Keterangan":document.getElementById("keterangan").value};try{await withLoading(()=>api(data.ID?"updateInventaris":"tambahInventaris",data),"Menyimpan inventaris...");closeModal("inventoryModal");showToast("Data berhasil disimpan");await withLoading(()=>loadData(),"Memuat data...")}catch(err){showToast(err.message)}})
async function deleteInventory(id){if(!confirm("Hapus aset ini?"))return;try{await withLoading(()=>api("hapusInventaris",{ID:id}),"Menghapus inventaris...");showToast("Data dihapus");await withLoading(()=>loadData(),"Memuat data...")}catch(e){showToast(e.message)}}

function openCategoryModal(item=null){document.getElementById("categoryModalTitle").textContent=item?"Edit Kategori":"Tambah Kategori";document.getElementById("categoryId").value=item?.["ID Kategori"]||"";document.getElementById("categoryName").value=item?.["Nama Kategori"]||"";document.getElementById("categoryStatus").value=item?.Status||"Aktif";document.getElementById("categoryNote").value=item?.Keterangan||"";document.getElementById("categoryModal").classList.add("show")}
function editCategory(item){openCategoryModal(item)}
document.getElementById("categoryForm").addEventListener("submit",async e=>{e.preventDefault();const data={"ID Kategori":document.getElementById("categoryId").value,"Nama Kategori":document.getElementById("categoryName").value.trim(),"Status":document.getElementById("categoryStatus").value,"Keterangan":document.getElementById("categoryNote").value.trim()};if(!data["Nama Kategori"]){showToast("Nama kategori wajib diisi");return}try{await withLoading(()=>api(data["ID Kategori"]?"updateKategori":"tambahKategori",data),"Menyimpan kategori...");closeModal("categoryModal");showToast("Kategori berhasil disimpan");await withLoading(()=>loadData(),"Memuat data...");showPage("kategoriPage")}catch(err){showToast(err.message)}})
async function deleteCategory(id){
  if(!confirm("Hapus kategori ini?")) return;

  const kategori = categories.find(
    x => String(x["ID Kategori"]).trim() === String(id).trim()
  );

  try {
    await withLoading(()=>api("hapusKategori", {
      "ID Kategori": id,
      "Nama Kategori": kategori ? kategori["Nama Kategori"] : ""
    }),"Menghapus kategori...");

    showToast("Kategori berhasil dihapus");

    await withLoading(()=>loadData(),"Memuat data...");

    showPage("kategoriPage");

  } catch(e) {
    showToast(e.message);
  }
}

function closeModal(id){document.getElementById(id).classList.remove("show")}
function money(n){return new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(Number(n)||0)}
function esc(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
window.addEventListener("click",e=>{if(e.target.classList.contains("modal"))e.target.classList.remove("show")})
withLoading(()=>loadData(),"Memuat aplikasi...");
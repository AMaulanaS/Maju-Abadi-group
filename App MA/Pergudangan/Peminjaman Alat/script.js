const GOOGLE_SCRIPT_URL="https://script.google.com/macros/s/AKfycbyzbZwvhsPaMz1-IyAn-kBWVGuItkgL0hcsCp5gmVcPSKRR77LL3dZSK0VP31YXJ8dISQ/exec";
const SPREADSHEET_ID="180IBhlVD0R0zHGqhlBauqtlyOpgVOW3MUjLY5aJvtQM";
const DRIVE_FOLDER_ID="16Agi6Poj_Qhn5g1GjnHb4eo8lie2AvNd";

let state={alat:[],pinjaman:[]};
let selectedTools=[];

function localKey(k){return "alatApp_"+k}
function loadState(){
 const a=localStorage.getItem(localKey("alat")); const p=localStorage.getItem(localKey("pinjaman"));
 state.alat=a?JSON.parse(a):[];
 state.pinjaman=p?JSON.parse(p):[];
}
function saveState(){localStorage.setItem(localKey("alat"),JSON.stringify(state.alat));localStorage.setItem(localKey("pinjaman"),JSON.stringify(state.pinjaman))}
function today(){return new Date().toISOString().slice(0,10)}
function code(n){return "ALT-"+String(n).padStart(4,"0")}
function loanNo(){return "PIN-"+new Date().toISOString().slice(0,10).replaceAll("-","")+"-"+String(state.pinjaman.length+1).padStart(4,"0")}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function badgeStatus(s){const c=s==="Tersedia"?"b-available":s==="Dipinjam"?"b-loan":s==="Maintenance"||s.includes("Rusak")?"b-maint":"b-done";return `<span class="badge ${c}">${esc(s)}</span>`}

function init(){
 loadState();
 document.getElementById("pinjamTanggal").value=today();
 document.querySelectorAll(".tab").forEach(btn=>btn.addEventListener("click",()=>openTab(btn.dataset.tab)));
 renderAll(); renderAvailableTools();
}
function openTab(id){document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active",x.dataset.tab===id));document.querySelectorAll(".tab-content").forEach(x=>x.classList.toggle("active",x.id===id))}
function refreshAll(){loadState();renderAll();renderAvailableTools();toast("Data diperbarui")}
function renderAll(){renderDashboard();renderMaster();renderReturns();renderHistory()}

function renderDashboard(){
 const total=state.alat.length, tersedia=state.alat.filter(a=>a.status==="Tersedia").length,dipinjam=state.alat.filter(a=>a.status==="Dipinjam").length,rusak=state.alat.filter(a=>["Maintenance","Rusak Ringan","Rusak Berat"].includes(a.status)).length;
 document.getElementById("totalAlat").textContent=total;document.getElementById("tersedia").textContent=tersedia;document.getElementById("dipinjam").textContent=dipinjam;document.getElementById("rusak").textContent=rusak;
 const counts={Tersedia:tersedia,Dipinjam:dipinjam,Maintenance:state.alat.filter(a=>a.status==="Maintenance").length,Rusak:state.alat.filter(a=>a.status.includes("Rusak")).length};
 const max=Math.max(1,...Object.values(counts));
 document.getElementById("statusBars").innerHTML=Object.entries(counts).map(([k,v])=>`<div class="bar"><span>${k}</span><i style="width:${(v/max)*70}%"></i><b>${v}</b></div>`).join("");
 const recent=state.pinjaman.slice().reverse().slice(0,8);
 document.getElementById("recentLoans").innerHTML=recent.length
 ? recent.map(p=>`<div class="list-item">
   <b>${esc(p.no)}</b> · ${esc(p.peminjam)} · ${esc(p.alatNama)}<br>
   ${badgeStatus(p.status)} · ${esc(p.tanggal)} · <b>${loanDuration(p)}</b>
  </div>`).join("")
 : "Belum ada transaksi.";
}
function renderMaster(){
 const q=(document.getElementById("searchAlat")?.value||"").toLowerCase();
 const rows=state.alat.filter(a=>[a.kode,a.nama,a.seri,a.merk,a.kategori].join(" ").toLowerCase().includes(q));
 document.getElementById("masterBody").innerHTML=rows.map(a=>`<tr><td>${esc(a.kode)}</td><td>${esc(a.nama)}</td><td>${esc(a.kategori)}</td><td>${esc(a.merk)}</td><td>${esc(a.seri)}</td><td>${esc(a.kondisi)}</td><td>${badgeStatus(a.status)}</td><td>${esc(a.lokasi)}</td><td><button class="secondary btn-edit" type="button" onclick="editAlat('${a.id}')">✏ Edit</button></td></tr>`).join("")||`<tr><td colspan="9">Belum ada alat.</td></tr>`;
}
function renderAvailableTools(){
 const box=document.getElementById("availableTools"); if(!box)return;
 const q=(document.getElementById("alatSearch")?.value||"").toLowerCase().trim();
 const available=state.alat.filter(a=>a.status==="Tersedia"&&!selectedTools.some(x=>x.id===a.id)&&(!q||[a.kode,a.nama,a.merk,a.seri,a.kategori,a.lokasi].join(" ").toLowerCase().includes(q)));
 if(!available.length){box.innerHTML=q?`<div class="empty-search">Tidak ada alat tersedia yang cocok dengan "<b>${esc(q)}</b>".</div>`:`<div class="empty-search">Tidak ada alat tersedia.</div>`;return;}
 box.innerHTML=available.slice(0,80).map(a=>`<button type="button" class="tool-result" onclick="selectTool('${a.id}')"><div><b>${esc(a.kode)} · ${esc(a.nama)}</b><small>${esc(a.merk||"-")} · No. Seri: ${esc(a.seri||"-")}</small></div><strong>+ Pilih</strong></button>`).join("");
}
function selectTool(id){const a=state.alat.find(x=>x.id===id);if(!a||a.status!=="Tersedia"||selectedTools.some(x=>x.id===id))return;selectedTools.push({id:a.id,kode:a.kode,nama:a.nama,merk:a.merk,seri:a.seri,qty:1,kondisi:"Baik"});document.getElementById("alatSearch").value="";renderAvailableTools();renderSelectedTools()}
function removeSelectedTool(id){selectedTools=selectedTools.filter(x=>x.id!==id);renderAvailableTools();renderSelectedTools()}
function updateSelectedQty(id,val){const x=selectedTools.find(a=>a.id===id);if(x)x.qty=Math.max(1,Number(val)||1)}
function updateSelectedCondition(id,val){const x=selectedTools.find(a=>a.id===id);if(x)x.kondisi=val}
function renderSelectedTools(){const box=document.getElementById("selectedTools"),count=document.getElementById("selectedCount");if(!box)return;count.textContent=selectedTools.length+" alat";if(!selectedTools.length){box.innerHTML='<div class="empty-selected">Belum ada alat dipilih.</div>';return;}box.innerHTML=selectedTools.map(a=>`<div class="selected-tool"><div><b>${esc(a.kode)} · ${esc(a.nama)}</b><small>${esc(a.merk||"-")} · No. Seri: ${esc(a.seri||"-")}</small></div><label>Qty<input type="number" min="1" value="${a.qty}" onchange="updateSelectedQty('${a.id}',this.value)"></label><label>Kondisi<select onchange="updateSelectedCondition('${a.id}',this.value)"><option ${a.kondisi==="Baik"?"selected":""}>Baik</option><option ${a.kondisi==="Rusak Ringan"?"selected":""}>Rusak Ringan</option><option ${a.kondisi==="Rusak Berat"?"selected":""}>Rusak Berat</option></select></label><button type="button" class="remove-selected" onclick="removeSelectedTool('${a.id}')">×</button></div>`).join("")}
function clearSelectedTools(){selectedTools=[];const s=document.getElementById("alatSearch");if(s)s.value="";renderAvailableTools();renderSelectedTools()}

function renderReturns(){
 const rows=state.pinjaman.filter(p=>p.status==="Dipinjam");
 document.getElementById("returnBody").innerHTML=rows.map(p=>`<tr><td>${esc(p.no)}</td><td>${esc(p.tanggal)}</td><td>${esc(p.peminjam)}</td><td>${esc(p.alatNama)}</td><td>${esc(p.kondisiPinjam)}</td><td>${badgeStatus(p.status)}</td><td><button class="primary" onclick="returnTool('${p.id}')">Kembalikan</button></td></tr>`).join("")||`<tr><td colspan="7">Tidak ada alat yang sedang dipinjam.</td></tr>`;
}
function loanDuration(p){
 const start=new Date(p.tanggal+"T00:00:00");
 const end=new Date((p.tanggalKembali||today())+"T00:00:00");
 const days=Math.max(0,Math.floor((end-start)/86400000));
 return days+" hari";
}

function renderHistory(){
 const q=(document.getElementById("searchRiwayat")?.value||"").toLowerCase();
 const rows=state.pinjaman.filter(p=>JSON.stringify(p).toLowerCase().includes(q)).slice().reverse();
 document.getElementById("historyBody").innerHTML=rows.map(p=>`<tr><td>${esc(p.no)}</td><td>${esc(p.tanggal)}</td><td>${esc(p.peminjam)}</td><td>${esc(p.proyek)}</td><td>${esc(p.alatNama)}</td><td>${badgeStatus(p.status)}</td><td>${loanDuration(p)}</td><td>${esc(p.tanggalKembali||"-")}</td><td>${esc(p.kondisiKembali||"-")}</td></tr>`).join("")||`<tr><td colspan="8">Belum ada riwayat.</td></tr>`;
}

function openModal(mode="add", id=""){
 const modal=document.getElementById("modal"); modal.classList.add("show");
 const title=document.getElementById("modalTitle"); document.getElementById("mId").value="";
 const fields=["mNama","mKategori","mMerk","mSeri","mTahun","mLokasi","mKet"];
 if(mode==="edit"){
  const a=state.alat.find(x=>x.id===id); if(!a)return;
  title.textContent="Edit Status Alat"; document.getElementById("mId").value=a.id;
  document.getElementById("mNama").value=a.nama||""; document.getElementById("mKategori").value=a.kategori||""; document.getElementById("mMerk").value=a.merk||""; document.getElementById("mSeri").value=a.seri||""; document.getElementById("mTahun").value=a.tahun||""; document.getElementById("mKondisi").value=a.kondisi||"Baik"; document.getElementById("mStatus").value=a.status||"Tersedia"; document.getElementById("mLokasi").value=a.lokasi||""; document.getElementById("mKet").value=a.keterangan||"";
  fields.forEach(id=>document.getElementById(id).disabled=true);
 }else{
  title.textContent="Tambah Alat"; fields.forEach(id=>document.getElementById(id).disabled=false); document.getElementById("mKondisi").value="Baik"; document.getElementById("mStatus").value="Tersedia";
 }
}
function closeModal(){document.getElementById("modal").classList.remove("show");}
function editAlat(id){openModal("edit",id);}
function saveAlat(){
 const editId=document.getElementById("mId").value, kondisi=document.getElementById("mKondisi").value, status=document.getElementById("mStatus").value;
 if(editId){
  const a=state.alat.find(x=>x.id===editId); if(!a)return;
  if(a.status==="Dipinjam"){toast("Alat yang sedang dipinjam tidak dapat diedit statusnya");return;}
  a.kondisi=kondisi; a.status=status; saveState(); sync({alatId:a.id,alatKode:a.kode,alatNama:a.nama,kondisi,status,catatanStatus:"Update manual dari Master Alat"},"UPDATE_STATUS"); closeModal(); renderAll(); renderAvailableTools(); toast(`${a.kode} berhasil diubah menjadi ${status}`); return;
 }
 const nama=document.getElementById("mNama").value.trim(); if(!nama){toast("Nama alat wajib diisi");return}
 const id=crypto.randomUUID?crypto.randomUUID():String(Date.now());
 const alat={id,kode:code(state.alat.length+1),nama,kategori:document.getElementById("mKategori").value.trim(),merk:document.getElementById("mMerk").value.trim(),seri:document.getElementById("mSeri").value.trim(),tahun:document.getElementById("mTahun").value,kondisi,status,lokasi:document.getElementById("mLokasi").value.trim(),keterangan:document.getElementById("mKet").value.trim()};
 state.alat.push(alat); saveState(); sync(alat,"ALAT"); closeModal(); toast("Alat berhasil disimpan. Memuat ulang..."); setTimeout(()=>window.location.reload(),500);
}
function submitPinjam(){
 const pem=document.getElementById("peminjam").value.trim();
 if(!selectedTools.length){toast("Pilih minimal 1 alat");return}
 if(!pem){toast("Nama peminjam wajib diisi");return}
 const no=loanNo(),tanggal=document.getElementById("pinjamTanggal").value||today(),proyek=document.getElementById("proyek").value.trim(),keperluan=document.getElementById("keperluan").value.trim(),catatan=document.getElementById("catatanPinjam").value.trim();
 selectedTools.forEach(sel=>{const a=state.alat.find(x=>x.id===sel.id);if(!a)return;a.status="Dipinjam";const p={id:crypto.randomUUID?crypto.randomUUID():String(Date.now())+"_"+sel.id,no,tanggal,peminjam:pem,proyek,keperluan,alatId:a.id,alatKode:a.kode,alatNama:a.nama,qty:sel.qty,kondisiPinjam:sel.kondisi,status:"Dipinjam",catatan,tanggalKembali:"",kondisiKembali:"",catatanKembali:""};state.pinjaman.push(p);sync(p,"PINJAM")});
 saveState();["peminjam","proyek","keperluan","catatanPinjam"].forEach(id=>document.getElementById(id).value="");clearSelectedTools();renderAll();renderAvailableTools();toast(`Peminjaman ${no} berhasil disimpan`);
}

function returnTool(id){
 const p=state.pinjaman.find(x=>x.id===id);if(!p)return;
 const kondisi=prompt("Kondisi alat saat dikembalikan (Baik / Maintenance / Rusak Ringan / Rusak Berat):","Baik");if(kondisi===null)return;
 const cat=prompt("Catatan pengembalian:","")||"";p.tanggalKembali=today();p.kondisiKembali=kondisi;p.catatanKembali=cat;p.status="Sudah Kembali";
 const a=state.alat.find(x=>x.id===p.alatId);if(a){a.kondisi=kondisi;a.status=kondisi==="Baik"?"Tersedia":kondisi}
 saveState();renderAll();renderAvailableTools();sync(p,"KEMBALI");toast("Pengembalian tersimpan");
}
function sync(record,type){
 if(GOOGLE_SCRIPT_URL.includes("PASTE_URL"))return;
 const payload={type,record};
 fetch(GOOGLE_SCRIPT_URL,{method:"POST",mode:"no-cors",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(payload)}).catch(err=>console.error(err));
}
function toast(t){const e=document.getElementById("status");e.textContent=t;e.className="toast show";setTimeout(()=>e.className="toast",2500)}
init();
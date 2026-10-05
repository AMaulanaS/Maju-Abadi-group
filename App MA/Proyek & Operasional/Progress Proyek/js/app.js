/* ===== Konfigurasi: satu backend untuk semua modul ===== */
const API=window.APP_CONFIG.API;
const TOK=window.APP_CONFIG.TOKENS;


/* ===== Helper ===== */
const $=s=>document.querySelector(s),p2=n=>String(n).padStart(2,"0"),ymd=d=>`${d.getFullYear()}-${p2(d.getMonth()+1)}-${p2(d.getDate())}`,today=()=>ymd(new Date());
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const D=v=>{const s=String(v||"");if(!s||/^\d{4}-\d{2}-\d{2}$/.test(s))return s;const d=new Date(s);return isNaN(d)?s.slice(0,10):ymd(d)};
const T=v=>{const s=String(v||"");if(/^\d{1,2}:\d{2}$/.test(s))return s.padStart(5,"0");const d=new Date(s);return !s||isNaN(d)?s:`${p2(d.getHours())}:${p2(d.getMinutes())}`};
const fd=v=>{if(!v)return"-";const d=new Date(v+"T00:00");return isNaN(d)?esc(v):d.toLocaleDateString("id-ID",{day:"2-digit",month:"short",year:"numeric"})};
const wk=t=>{const n=new Date(),s=new Date(n);s.setDate(n.getDate()-(n.getDay()+6)%7);const e=new Date(s);e.setDate(s.getDate()+6);return t>=ymd(s)&&t<=ymd(e)};
const tone=s=>({Selesai:"ok",Berjalan:"run",Proses:"run",Berlangsung:"run",Aktif:"run",Tertunda:"warn",Cuti:"warn",Dibatalkan:"bad"}[s]||"");
const badge=s=>`<span class="b ${tone(s)}">${esc(s||"-")}</span>`;
const pr=p=>`<span class="b ${p==="Urgent"?"bad":p==="Tinggi"?"warn":""}">${esc(p)}</span>`;
const pg=n=>{n=Math.max(0,Math.min(100,+n||0));return `<div class="pg"><b>${n}%</b><div class="bar"><i style="width:${n}%"></i></div></div>`};
const cs=(d,s)=>d.filter(x=>x.status===s).length;
const avg=d=>d.length?Math.round(d.reduce((a,x)=>a+(+x.progress||0),0)/d.length):0;
const pn=k=>S.proyek.find(p=>p.kode===k)?.nama||k||"-";
const cn=(m,k)=>S[m].filter(x=>(m==="dokumentasi"?x.project:x.kodeProyek)===k).length;
const ph=u=>{const m=String(u).match(/[-\w]{25,}/);return m?`https://drive.google.com/thumbnail?id=${m[0]}&sz=w800`:u};

/* ===== Ikon SVG inline ===== */
const ICP={
 chart:'<path d="M3 21h18"/><path d="M7 17v-6"/><path d="M12 17V7"/><path d="M17 17v-9"/>',
 list:'<path d="M8 6h13M8 12h13M8 18h13"/><path d="M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',
 cal:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/>',
 tool:'<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
 cam:'<path d="M14.5 4h-5L7.5 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3.5l-2-3z"/><circle cx="12" cy="13" r="3"/>',
 team:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
 pin:'<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
 ref:'<path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/>',
 arr:'<path d="M5 12h14M13 6l6 6-6 6"/>',
 plus:'<path d="M12 5v14M5 12h14"/>'
};
const IC=(n,s=18)=>`<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICP[n]}</svg>`;

/* ===== Definisi modul ===== */
const ST={p:["Belum Mulai","Berjalan","Selesai","Tertunda"],j:["Terjadwal","Berlangsung","Selesai","Dibatalkan"],k:["Belum Mulai","Proses","Selesai","Tertunda"],t:["Aktif","Selesai","Cuti","Tidak Aktif"]},PR=["Normal","Tinggi","Urgent"];
const PJ=["kodeProyek","Proyek terkait","proj"];
const MODS={
ringkasan:{n:"Progress Proyek",i:IC("chart"),d:"Pantau perkembangan semua proyek beserta jadwal, pekerjaan, tim, dan dokumentasinya.",src:"proyek",s:ST.p,
  st:d=>[["Total proyek",d.length],["Berjalan",cs(d,"Berjalan")],["Selesai",cs(d,"Selesai")],["Rata-rata progress",avg(d)+"%"]],
  g:x=>`<article class="card pad"><div class="mt"><div><b style="font-size:16px; color:var(--ink);">${esc(x.nama)}</b><small>${esc(x.kode)}</small></div>${badge(x.status)}</div>${pg(x.progress)}<div class="mt"><small>PIC: ${esc(x.pemilik||"-")}</small><small>Deadline: ${fd(x.deadline)}</small></div><div class="ch">${[["jadwal","jadwal"],["pekerjaan","pekerjaan"],["tim","personel"],["dokumentasi","dokumentasi"]].map(([m,l])=>`<span>${cn(m,x.kode)}${l}</span>`).join("")}</div></article>`},
proyek:{n:"Daftar Proyek",i:IC("list"),d:"Data dan informasi seluruh proyek.",add:"Tambah Proyek",s:ST.p,
  f:[["kode","Kode proyek","text",1],["nama","Nama proyek","text",1],["pemilik","PIC","text"],["kategori","Kategori","text"],["status","Status","sel",0,ST.p],["progress","Progress (%)","number"],["mulai","Tanggal mulai","date"],["deadline","Deadline","date"],["anggaran","Anggaran (Rp)","number"],["deskripsi","Deskripsi","area"]],
  c:[["Kode",x=>`<b>${esc(x.kode)}</b>`],["Proyek",x=>`<b style="color:var(--ink); font-size:14px;">${esc(x.nama)}</b><small>${esc(x.deskripsi)}</small>`],["PIC",x=>esc(x.pemilik||"-")],["Kategori",x=>esc(x.kategori||"-")],["Status",x=>badge(x.status)],["Progress",x=>pg(x.progress)],["Deadline",x=>fd(x.deadline)]],
  st:d=>[["Total proyek",d.length],["Berjalan",cs(d,"Berjalan")],["Selesai",cs(d,"Selesai")],["Tertunda",cs(d,"Tertunda")]]},
jadwal:{n:"Jadwal Pekerjaan",i:IC("cal"),d:"Atur jadwal dan agenda pekerjaan.",add:"Tambah Jadwal",s:ST.j,ip:"JD-",sk:"tanggal",
  f:[["tanggal","Tanggal","date",1],["mulai","Jam mulai","time",1],["selesai","Jam selesai","time"],["pekerjaan","Nama pekerjaan","text",1],["lokasi","Lokasi","text",1],["petugas","Petugas / tim","text"],["prioritas","Prioritas","sel",0,PR],["status","Status","sel",0,ST.j],PJ,["keterangan","Keterangan","area"]],
  c:[["Tanggal",x=>fd(x.tanggal)],["Jam",x=>esc(x.mulai)+(x.selesai?" – "+esc(x.selesai):"")],["Pekerjaan",x=>`<b style="color:var(--ink); font-size:14px;">${esc(x.pekerjaan)}</b><small>${esc(x.keterangan)}</small>`],["Lokasi",x=>esc(x.lokasi)],["Petugas",x=>esc(x.petugas||"-")],["Proyek",x=>esc(x.kodeProyek||"-")],["Prioritas",x=>pr(x.prioritas)],["Status",x=>badge(x.status)]],
  st:d=>[["Total agenda",d.length],["Hari ini",d.filter(x=>x.tanggal===today()).length],["Minggu ini",d.filter(x=>wk(x.tanggal)).length],["Selesai",cs(d,"Selesai")]]},
pekerjaan:{n:"Pekerjaan Lapangan",i:IC("tool"),d:"Kelola aktivitas dan pekerjaan lapangan.",add:"Tambah Pekerjaan",s:ST.k,ip:"PL-",sk:"tanggal",
  f:[["tanggal","Tanggal","date",1],["pekerjaan","Nama pekerjaan","text",1],["lokasi","Lokasi","text",1],["petugas","Petugas / tim","text"],["prioritas","Prioritas","sel",0,PR],["status","Status","sel",0,ST.k],PJ,["keterangan","Keterangan","area"]],
  c:[["Tanggal",x=>fd(x.tanggal)],["Pekerjaan",x=>`<b style="color:var(--ink); font-size:14px;">${esc(x.pekerjaan)}</b><small>${esc(x.keterangan)}</small>`],["Lokasi",x=>esc(x.lokasi)],["Petugas",x=>esc(x.petugas||"-")],["Proyek",x=>esc(x.kodeProyek||"-")],["Prioritas",x=>pr(x.prioritas)],["Status",x=>badge(x.status)]],
  st:d=>[["Total pekerjaan",d.length],["Belum mulai",cs(d,"Belum Mulai")],["Proses",cs(d,"Proses")],["Selesai",cs(d,"Selesai")]]},
dokumentasi:{n:"Dokumentasi Proyek",i:IC("cam"),d:"Kegiatan, foto, dan perkembangan pekerjaan di lapangan.",add:"Dokumentasi Baru",s:ST.p,sk:"date",
  f:[["title","Judul dokumentasi","text",1],["project","Proyek","proj",1],["date","Tanggal kegiatan","date",1],["pic","PIC","text"],["activity","Kegiatan / progress","text",1],["status","Status","sel",0,ST.p],["progress","Progress (%)","number",1],["notes","Catatan","area"],["photos","Foto dokumentasi","file"]],
  st:d=>[["Total dokumen",d.length],["Proyek tercatat",new Set(d.map(x=>x.project).filter(Boolean)).size],["Rata-rata Progress",avg(d)+"%"],["Selesai",cs(d,"Selesai")]],
  g:x=>`<article class="card" data-v="${esc(x.id)}"><div class="cv">${x.photos?.[0]?`<img src="${esc(ph(x.photos[0]))}" alt="" loading="lazy">`:IC("cam",32)}</div><div class="pad"><b style="font-size:15px; color:var(--ink);">${esc(x.title)}</b><small>${esc(pn(x.project))}</small><div class="mt">${badge(x.status)}<small>${fd(x.date)}</small></div>${pg(x.progress)}</div></article>`},
tim:{n:"Tim Lapangan",i:IC("team"),d:"Data personel dan penugasan lapangan.",add:"Tambah Personel",s:ST.t,ip:"uuid",sk:"tanggal",
  f:[["nama","Nama lengkap","text",1],["jabatan","Jabatan","text",1],["noHp","No. HP","tel"],["lokasi","Lokasi tugas","text",1],["tanggal","Tanggal tugas","date",1],["status","Status","sel",0,ST.t],PJ,["keterangan","Keterangan","area"]],
  c:[["Personel",x=>`<b style="color:var(--ink); font-size:14px;">${esc(x.nama)}</b><small>${esc(x.keterangan)}</small>`],["Jabatan",x=>esc(x.jabatan)],["No. HP",x=>esc(x.noHp||"-")],["Lokasi",x=>IC("pin",14)+" "+esc(x.lokasi)],["Tanggal",x=>fd(x.tanggal)],["Proyek",x=>esc(x.kodeProyek||"-")],["Status",x=>badge(x.status)]],
  st:d=>[["Total personel",d.length],["Aktif bertugas",cs(d,"Aktif")],["Lokasi tugas",new Set(d.map(x=>x.lokasi).filter(Boolean)).size],["Tugas hari ini",d.filter(x=>x.tanggal===today()).length]],
  x:d=>{const g={};d.filter(x=>x.status==="Aktif").forEach(x=>(g[x.lokasi||"Tanpa lokasi"]??=[]).push(x.nama));const e=Object.entries(g).sort((a,b)=>b[1].length-a[1].length);return `<section class="panel pad"><h2>Penugasan per lokasi</h2>${e.length?`<div class="gal" style="padding:0">${e.map(([l,n])=>`<div class="card pad"><b style="color:var(--ink);">${IC("pin",16)} ${esc(l)}</b><small style="margin-top:4px;"> ${n.length} orang</small><p class="mu" style="margin-top:12px;">${n.map(esc).join(", ")}</p></div>`).join("")}</div>`:'<p class="mu">Belum ada personel berstatus Aktif.</p>'}</section>`}}
};

/* ===== API & data ===== */
const S={proyek:[],jadwal:[],pekerjaan:[],dokumentasi:[],tim:[]},L={},E={};let cur="ringkasan",ed="";
async function api(m,action,b={}){
  const o={modul:m,action};
  if(m==="proyek")Object.assign(o,b);
  else if(m==="jadwal"||m==="pekerjaan"){if(action==="delete")o.id=b.id;else if(action!=="list")o.data=b}
  else Object.assign(o,b,{token:TOK[m]});
  const r=await fetch(API,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(o)});
  const j=await r.json();if(!j.ok&&!j.success)throw Error(j.message||"Permintaan gagal");return j}
async function load(m){const M=MODS[m];
  try{const j=await api(m,"list");const d=(m==="dokumentasi"?j.records:j.data)||[];
    d.forEach(x=>M.f.forEach(([k,,t])=>{if(t==="date")x[k]=D(x[k]);if(t==="time")x[k]=T(x[k])}));
    if(M.sk)d.sort((a,b)=>String(b[M.sk]).localeCompare(String(a[M.sk])));
    S[m]=d;E[m]=""}catch(e){E[m]=e.message}
  L[m]=1}
async function loadAll(){$("#sy").textContent="Sinkronisasi data...";await Promise.all(Object.keys(S).map(load));
  const bad=Object.keys(S).filter(k=>E[k]);$("#sy").textContent=bad.length?"Gagal memuat: "+bad.map(k=>MODS[k].n).join(", "):"✅ Terhubung ke Google Sheet";render()}

/* ===== Tampilan ===== */
function listView(){const M=MODS[cur],d=S[M.src||cur];
  return `<div class="stats">${M.st(d).map(([l,v])=>`<div class="stat"><span>${l}</span><b>${v}</b></div>`).join("")}</div>
  <section class="panel"><div class="tools"><input id="q" type="search" placeholder="Cari data..." aria-label="Cari"><select id="sf" aria-label="Filter status"><option value="">Semua status</option>${M.s.map(o=>`<option>${o}</option>`).join("")}</select></div>
  ${M.g?'<div class="gal" id="tb"></div>':`<div class="tw"><table><thead><tr>${M.c.map(c=>`<th>${c[0]}</th>`).join("")}<th></th></tr></thead><tbody id="tb"></tbody></table></div>`}</section>${M.x?'<div id="xt"></div>':""}`}
function rows(){const M=MODS[cur],q=$("#q").value.toLowerCase(),s=$("#sf").value,
  r=S[M.src||cur].filter(x=>(!q||Object.values(x).join(" ").toLowerCase().includes(q))&&(!s||x.status===s));
  $("#tb").innerHTML=r.length?r.map(x=>M.g?M.g(x):`<tr>${M.c.map(c=>`<td>${c[1](x)}</td>`).join("")}<td class="ac"><button class="bt s" data-e="${esc(x.id)}">Edit</button><button class="bt s" data-d="${esc(x.id)}" style="color:var(--redB); border-color:#fca5a5; background:#fef2f2;">Hapus</button></td></tr>`).join(""):M.g?'<div class="em">Belum ada data.</div>':'<tr><td colspan="9" class="em">Belum ada data.</td></tr>';
  if(M.x)$("#xt").innerHTML=M.x(S[cur])}
function render(){cur=MODS[location.hash.slice(1)]?location.hash.slice(1):"ringkasan";const M=MODS[cur],s=M.src||cur;
  document.querySelectorAll("nav button").forEach(b=>b.classList.toggle("on",b.dataset.n===cur));
  $("#view").innerHTML=`<div class="hd"><div><h1>${M.i} ${M.n}</h1><p>${M.d}</p></div><div><button class="bt" data-r="1">${IC("ref",16)} Muat Ulang</button>${M.f?`<button class="bt pri" data-a="1">${IC("plus",16)} ${M.add}</button>`:""}</div></div>`+(!L[s]?'<div class="em">Memuat data dari Google Sheets...</div>':E[s]?`<div class="em" style="color:var(--redB);">Gagal memuat: ${esc(E[s])}</div>`:listView());
  if(L[s]&&!E[s])rows()}

/* ===== Form tambah / ubah ===== */
const fld=([k,l,t,r,o],x)=>{
  const v=x?(x[k]??""):t==="date"&&k!=="deadline"?today():t==="time"&&k==="mulai"?"08:00":t==="number"?"0":"";
  const a=`name="${k}"${r?" required":""}`;let h;
  if(t==="sel")h=`<select ${a}>${o.map(s=>`<option${s===v?" selected":""}>${s}</option>`).join("")}</select>`;
  else if(t==="proj")h=`<select ${a}>${r?"":'<option value="">Tanpa proyek</option>'}${v&&!S.proyek.some(p=>p.kode===v)?`<option selected>${esc(v)}</option>`:""}${S.proyek.map(p=>`<option value="${esc(p.kode)}"${p.kode===v?" selected":""}>${esc(p.kode)}:${esc(p.nama)}</option>`).join("")}</select>`;
  else if(t==="area")h=`<textarea ${a} rows="4">${esc(v)}</textarea>`;
  else if(t==="file")h=`<input ${a} type="file" accept="image/*" multiple>`;
  else h=`<input ${a} type="${t}" value="${esc(v)}"${t==="number"?' min="0"'+(k==="progress"?' max="100"':""):""}>`;
  return `<label${t==="area"||t==="file"?' class="w"':""}>${l}${r?" <span style='color:red;'>*</span>":""}${h}${t==="file"?"<small>Maks. 3 foto, 5 MB per foto. Kosongkan jika tidak diganti.</small>":""}</label>`};
function form(x){const M=MODS[cur];ed=x?.id||"";
  $("#md").innerHTML=`<form id="fm"><h2 style="font-weight:700; font-size:22px; margin-bottom:24px;">${x?"Ubah data":M.add}</h2><div class="fg">${M.f.map(f=>fld(f,x)).join("")}</div><div class="fa"><button type="button" class="bt" data-x="1">Batal</button><button class="bt pri">Simpan Data</button></div></form>`;modal(1)}
function detail(x){if(!x)return;
  $("#md").innerHTML=`<h2 style="font-weight:700; font-size:24px; margin-bottom:4px;">${esc(x.title)}</h2><p class="mu" style="margin-bottom:20px;">${esc(pn(x.project))}, ${fd(x.date)}, PIC ${esc(x.pic||"-")}</p>${x.photos?.length?`<div class="ph">${x.photos.map(u=>`<a href="${esc(u)}" target="_blank" rel="noopener"><img src="${esc(ph(u))}" alt="Foto dokumentasi" loading="lazy"></a>`).join("")}</div>`:""}<div class="mt" style="margin-top:24px; padding-top:16px; border-top:1px solid var(--line);">${badge(x.status)}${pg(x.progress)}</div><div style="margin-top:16px;"><p><b>Kegiatan:</b> ${esc(x.activity)}</p><p style="color:var(--mu);">${esc(x.notes||"").replace(/\n/g,"<br>")}</p></div><div class="fa"><button class="bt" data-d="${esc(x.id)}" style="color:var(--redB); border-color:#fca5a5;">Hapus</button><button class="bt" data-e="${esc(x.id)}">Edit</button><button class="bt pri" data-x="1">Tutup</button></div>`;modal(1)}

/* ===== Interaksi ===== */
const modal=on=>{$("#ov").hidden=!on};
const toast=(s,er)=>{const t=$("#ts");t.textContent=s;t.className="ts"+(er?" er":"");t.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>t.hidden=true,3200)};
const byId=id=>S[cur].find(y=>String(y.id)===id);
document.addEventListener("click",async e=>{
  if(e.target.id==="ov")return modal(0);
  const t=e.target.closest("[data-n],[data-a],[data-e],[data-d],[data-v],[data-x],[data-r]");if(!t)return;const q=t.dataset;
  if(q.n)location.hash=q.n;
  else if(q.a)form();
  else if(q.e)form(byId(q.e));
  else if(q.v)detail(byId(q.v));
  else if(q.x)modal(0);
  else if(q.r)loadAll();
  else if(q.d){if(!byId(q.d)||!confirm("Hapus data ini? Tindakan ini tidak bisa dibatalkan."))return;
    try{await api(cur,"delete",{id:q.d});modal(0);toast("Data dihapus");await load(cur);render()}catch(err){toast(err.message,1)}}});
document.addEventListener("input",e=>{if(e.target.id==="q")rows()});
document.addEventListener("change",e=>{if(e.target.id==="sf")rows()});
document.addEventListener("keydown",e=>{if(e.key==="Escape")modal(0)});
document.addEventListener("submit",async e=>{e.preventDefault();
  const M=MODS[cur],f=new FormData(e.target),b=e.target.querySelector(".pri"),o={};
  M.f.forEach(([k,,t])=>{if(t!=="file")o[k]=t==="number"?Number(f.get(k)||0):String(f.get(k)||"").trim()});
  if(ed)o.id=ed;else if(M.ip)o.id=M.ip==="uuid"?(crypto.randomUUID?.()||"T-"+Date.now()):M.ip+Date.now();
  b.disabled=true; b.innerHTML = "Menyimpan...";
  try{
    if(M.f.some(x=>x[2]==="file")){
      const fl=[...e.target.querySelector("[type=file]").files].slice(0,3);
      if(fl.some(x=>x.size>5242880))throw Error("Ukuran foto maksimal 5 MB per file.");
      o.photos=await Promise.all(fl.map(x=>new Promise((ok,no)=>{const r=new FileReader();r.onload=()=>ok({name:x.name,mimeType:x.type,data:String(r.result).split(",")[1]});r.onerror=no;r.readAsDataURL(x)})))}
    await api(cur,ed?"update":"create",o);modal(0);toast(ed?"Data diperbarui":"Data tersimpan");await load(cur);render()
  }catch(err){toast(err.message,1); b.innerHTML="Simpan Data"; b.disabled=false;}
});
addEventListener("hashchange",render);

/* ===== Inisialisasi awal ===== */
$("nav").innerHTML=Object.entries(MODS).map(([k,M])=>`<button data-n="${k}">${M.i} ${M.n}</button>`).join("");
if(!location.hash) location.hash = "ringkasan";
render();
loadAll();

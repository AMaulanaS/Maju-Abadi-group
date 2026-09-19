let allData = [];
let filteredData = [];

const $ = id => document.getElementById(id);

function esc(value=''){
  return String(value).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[s]));
}
function formatDate(value){
  if(!value) return '-';
  const d = new Date(value);
  if(Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'});
}
function showToast(msg,error=false){
  $('toast').textContent=msg; $('toast').className='toast'+(error?' error':''); $('toast').classList.remove('hidden');
  clearTimeout(showToast.t); showToast.t=setTimeout(()=> $('toast').classList.add('hidden'),3000);
}
function openForm(record=null){
  $('form').classList.remove('hidden');
  $('formTitle').textContent=record?'Edit Dokumentasi':'Dokumentasi Baru';
  if(record){
    $('recordId').value=record.id||''; $('title').value=record.title||''; $('project').value=record.project||''; $('date').value=record.date?String(record.date).slice(0,10):'';
    $('pic').value=record.pic||''; $('activity').value=record.activity||''; $('status').value=record.status||'Berjalan'; $('progress').value=Number(record.progress||0); $('notes').value=record.notes||'';
    renderPreview(record.photos||[]);
  } else {
    $('docForm').reset(); $('recordId').value=''; $('date').value=new Date().toISOString().slice(0,10); $('status').value='Berjalan'; $('progress').value=0; $('photoPreview').innerHTML='';
  }
  location.hash='form'; window.scrollTo({top:document.getElementById('form').offsetTop-15,behavior:'smooth'});
}
function closeForm(){ $('form').classList.add('hidden'); }
function closeDetail(){ $('detailModal').classList.add('hidden'); }
function renderPreview(input){
  const wrap=$('photoPreview'); wrap.innerHTML='';
  if(Array.isArray(input)){ input.forEach(src=>{ if(!src) return; const img=document.createElement('img'); img.src=src; wrap.appendChild(img); }); return; }
  [...input.files].slice(0,3).forEach(file=>{const url=URL.createObjectURL(file);const img=document.createElement('img');img.src=url;wrap.appendChild(img);});
}
async function callApi(action,payload={}){
  if(!APP_CONFIG.GOOGLE_SCRIPT_URL || APP_CONFIG.GOOGLE_SCRIPT_URL.includes('PASTE_URL')) throw new Error('URL Google Apps Script belum diisi di config.js');
  const res=await fetch(APP_CONFIG.GOOGLE_SCRIPT_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({modul:"dokumentasi",action,token:APP_CONFIG.API_TOKEN,...payload})});
  const text=await res.text();
  let data; try{data=JSON.parse(text)}catch{throw new Error('Respons server tidak valid. Pastikan Web App Apps Script sudah benar.');}
  if(!data.ok) throw new Error(data.message||'Terjadi kesalahan');
  return data;
}
async function loadData(){
  try{
    const data=await callApi('list'); allData=Array.isArray(data.records)?data.records:[]; applyFilters(); updateStats(); populateProjects();
  }catch(err){ showToast(err.message,true); renderGallery([]); }
}
function populateProjects(){
  const current=$('projectFilter').value; const projects=[...new Set(allData.map(x=>x.project).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
  $('projectFilter').innerHTML='<option value="">Semua Proyek</option>'+projects.map(p=>`<option value="${esc(p)}">${esc(p)}</option>`).join(''); $('projectFilter').value=projects.includes(current)?current:'';
}
function applyFilters(){
  const q=$('searchInput').value.trim().toLowerCase(), p=$('projectFilter').value, s=$('statusFilter').value;
  filteredData=allData.filter(r=>{
    const hay=[r.title,r.project,r.activity,r.pic,r.notes].join(' ').toLowerCase(); return (!q||hay.includes(q))&&(!p||r.project===p)&&(!s||r.status===s);
  });
  renderGallery(filteredData); $('resultCount').textContent=`${filteredData.length} data`;
}
function renderGallery(data){
  const gallery=$('gallery'), empty=$('emptyState');
  if(!data.length){gallery.innerHTML='';empty.classList.remove('hidden');return} empty.classList.add('hidden');
  gallery.innerHTML=data.map(r=>{
    const photos=Array.isArray(r.photos)?r.photos:[]; const cover=photos[0]||''; const progress=Math.max(0,Math.min(100,Number(r.progress||0)));
    return `<article class="doc-card" onclick="openDetail('${esc(String(r.id))}')"><div class="cover">${cover?`<img src="${esc(cover)}" alt="Dokumentasi">`:'<div class="no-image">📷</div>'}<span class="status-pill">${esc(r.status||'-')}</span></div><div class="doc-body"><h3 class="doc-title">${esc(r.title)}</h3><div class="doc-project">${esc(r.project)}</div><div class="doc-meta"><span>📅 ${esc(formatDate(r.date))}</span><span>👷 ${esc(r.pic||'-')}</span></div><div class="progress-row"><div class="progress"><i style="width:${progress}%"></i></div><span class="progress-val">${progress}%</span></div></div></article>`;
  }).join('');
}
function updateStats(){
  const total=allData.length, projects=new Set(allData.map(x=>x.project).filter(Boolean)); const avg=total?Math.round(allData.reduce((a,b)=>a+Number(b.progress||0),0)/total):0; const done=allData.filter(x=>x.status==='Selesai').length;
  $('statTotal').textContent=total; $('statActive').textContent=projects.size; $('statProgress').textContent=avg+'%'; $('statDone').textContent=done;
}
function openDetail(id){
  const r=allData.find(x=>String(x.id)===String(id)); if(!r) return;
  const photos=Array.isArray(r.photos)?r.photos:[]; const progress=Number(r.progress||0);
  $('modalContent').innerHTML=`<p class="eyebrow">DOKUMENTASI PROYEK</p><h2 style="margin:0 35px 4px 0">${esc(r.title)}</h2><p class="muted">${esc(r.project)} · ${esc(formatDate(r.date))}</p>${photos.length?`<div class="detail-images" style="margin-top:18px">${photos.map(src=>`<img src="${esc(src)}" alt="Foto dokumentasi">`).join('')}</div>`:''}<div class="detail-grid"><div class="detail-box"><small>Progress</small><strong>${progress}%</strong></div><div class="detail-box"><small>Status</small><strong>${esc(r.status)}</strong></div><div class="detail-box"><small>PIC</small><strong>${esc(r.pic||'-')}</strong></div><div class="detail-box"><small>Tanggal</small><strong>${esc(formatDate(r.date))}</strong></div></div><div class="detail-box"><small>Kegiatan / Progress</small><div>${esc(r.activity||'-')}</div></div><div class="detail-box" style="margin-top:10px"><small>Catatan</small><div>${esc(r.notes||'-').replace(/\n/g,'<br>')}</div></div><div class="modal-actions"><button class="secondary-btn" onclick="closeDetail();openFormById('${esc(String(r.id))}')">✏️ Edit</button><button class="secondary-btn" onclick="deleteRecord('${esc(String(r.id))}')">🗑️ Hapus</button></div>`;
  $('detailModal').classList.remove('hidden');
}
function openFormById(id){const r=allData.find(x=>String(x.id)===String(id));if(r)openForm(r)}
async function deleteRecord(id){
  if(!confirm('Hapus dokumentasi ini? Data di Google Sheet akan dihapus.')) return;
  try{await callApi('delete',{id});closeDetail();showToast('Dokumentasi berhasil dihapus.');await loadData();}catch(err){showToast(err.message,true)}
}
async function filesToBase64(files){
  const selected=[...files].slice(0,3); if(selected.some(f=>f.size>5*1024*1024)) throw new Error('Ukuran foto maksimal 5 MB per file.');
  return Promise.all(selected.map(file=>new Promise((resolve,reject)=>{const rd=new FileReader();rd.onload=()=>resolve({name:file.name,mimeType:file.type,data:String(rd.result).split(',')[1]});rd.onerror=reject;rd.readAsDataURL(file)})));
}
$('photos').addEventListener('change',e=>renderPreview(e.target));
['searchInput','projectFilter','statusFilter'].forEach(id=>$(id).addEventListener('input',applyFilters));
$('docForm').addEventListener('submit',async e=>{
  e.preventDefault();
  const btn=e.submitter; btn.disabled=true; btn.textContent='⏳ Menyimpan...';
  try{
    const photos=await filesToBase64($('photos').files);
    const payload={id:$('recordId').value,title:$('title').value.trim(),project:$('project').value.trim(),date:$('date').value,pic:$('pic').value.trim(),activity:$('activity').value.trim(),status:$('status').value,progress:Number($('progress').value),notes:$('notes').value.trim(),photos};
    await callApi(payload.id?'update':'create',payload); showToast(payload.id?'Dokumentasi berhasil diperbarui.':'Dokumentasi berhasil disimpan.'); closeForm(); await loadData();
  }catch(err){showToast(err.message,true)}finally{btn.disabled=false;btn.textContent='💾 Simpan Dokumentasi'}
});

$('date').value=new Date().toISOString().slice(0,10);
loadData();

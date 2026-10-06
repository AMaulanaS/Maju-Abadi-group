/*
 * FRONTEND PUBLIC - Google Apps Script API
 * Rincian item + harga + banyak gambar per item.
 */
const API_URL = 'https://script.google.com/macros/s/AKfycbwt87pA-3UE_rbHXxTX1KaBckKKkwHIvXDZM1lCdJSAvZIGrvU_h8zHQcC9F7pjbs9f/exec';
const ADMIN_PIN = '123456';

const state = { requests: [], filter: 'all', search: '', sort: 'newest', admin: false, pin: '', editingId: '' };
const $ = (s) => document.querySelector(s);
const rupiah = (n) => new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',minimumFractionDigits:0}).format(Number(n||0));
const dateFmt = (v) => { if(!v) return '-'; const d=new Date(v); return isNaN(d) ? String(v) : d.toLocaleString('id-ID',{dateStyle:'medium',timeStyle:'short'}); };
const statusLabel = {pending:'Menunggu',approved:'Disetujui',rejected:'Ditolak',paid:'Sudah Dibayar'};
const categoryLabel = {operasional:'Operasional',transportasi:'Transportasi',pembelian:'Pembelian',lainnya:'Lainnya'};
function toast(msg, ok=true){const t=$('#toast');t.textContent=msg;t.className='toast '+(ok?'ok':'bad');clearTimeout(window.__toast);window.__toast=setTimeout(()=>t.className='toast hidden',4500)}
function openModal(id){$('#'+id).classList.remove('hidden')}
function closeModal(id){$('#'+id).classList.add('hidden')}
document.addEventListener('click',e=>{const c=e.target.closest('[data-close]');if(c)closeModal(c.dataset.close);});

async function api(action,data={}){
  if(API_URL.includes('PASTE_')) throw new Error('API Google Apps Script belum diatur. Buka script.js dan isi API_URL.');
  const body={action,...data};
  const res=await fetch(API_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(body)});
  const json=await res.json();
  if(!json.ok) throw new Error(json.message||'Terjadi kesalahan server');
  return json;
}

async function load(){
  $('#requestList').innerHTML='<div class="empty">Memuat data...</div>';
  try{const r=await api('listRequests');state.requests=r.data||[];render();}
  catch(e){$('#requestList').innerHTML='<div class="empty"><strong>Belum terhubung ke database.</strong><br><span>'+escapeHtml(e.message)+'</span></div>';renderStats([])}
}
function renderStats(rows){
  const pending=rows.filter(x=>x.status==='pending'), approved=rows.filter(x=>x.status==='approved'), paid=rows.filter(x=>x.status==='paid');
  $('#stats').innerHTML=`<div class="stat"><div class="label">Total Permohonan</div><div class="value">${rows.length}</div></div><div class="stat"><div class="label">Menunggu</div><div class="value">${pending.length}</div></div><div class="stat"><div class="label">Disetujui</div><div class="value">${approved.length}</div></div><div class="stat"><div class="label">Total Dibayar</div><div class="value">${rupiah(paid.reduce((a,x)=>a+Number(x.amount||0),0))}</div></div>`;
}
function getFiltered(){
  let a=[...state.requests];
  if(state.filter!=='all')a=a.filter(x=>x.status===state.filter);
  if(state.search){const q=state.search.toLowerCase();a=a.filter(x=>[x.request_number,x.name,x.department,x.title,x.description,x.category,JSON.stringify(x.items||[])].join(' ').toLowerCase().includes(q))}
  a.sort((x,y)=>{if(state.sort==='amount_desc')return Number(y.amount)-Number(x.amount);if(state.sort==='amount_asc')return Number(x.amount)-Number(y.amount);const dx=new Date(x.created_at).getTime(),dy=new Date(y.created_at).getTime();return state.sort==='oldest'?dx-dy:dy-dx});
  return a;
}
function render(){
  renderStats(state.requests);const rows=getFiltered();$('#listSubtitle').textContent=`Menampilkan ${rows.length} dari ${state.requests.length} permohonan`;$('#requestList').innerHTML=rows.length?rows.map(card).join(''):'<div class="empty">Tidak ada permohonan yang sesuai.</div>';
}
function card(r){
  const items=r.items||[];const itemCount=items.length;const imageCount=items.reduce((n,x)=>n+(x.images||[]).length,0);
  return `<article class="request-card" onclick="showDetail('${escapeAttr(r.id)}')"><div class="card-top"><span class="number">${escapeHtml(r.request_number)}</span><span class="status ${escapeAttr(r.status)}">${statusLabel[r.status]||r.status}</span></div><h3>${escapeHtml(r.title)}</h3><div class="meta">${escapeHtml(r.name||'-')}${r.department?' · '+escapeHtml(r.department):''}</div><div class="amount">${rupiah(r.amount)}</div><div class="description">${itemCount?`${itemCount} item rincian · ${imageCount} gambar bukti`:escapeHtml(r.description||'Belum ada rincian item')}</div><span class="category">${categoryLabel[r.category]||r.category||'-'}</span></article>`;
}

function renderItems(items){
  const rows=Array.isArray(items)&&items.length?items:[{description:'',price:'',files:[],images:[]}];
  $('#itemRows').innerHTML=rows.map((item,i)=>itemRow(item,i)).join('');
  $('#itemRows').querySelectorAll('.item-row').forEach((row,i)=>{row._existingImages=Array.isArray(rows[i].images)?rows[i].images:[];});
  rows.forEach((_,i)=>renderSelectedFiles(i));
  recalcTotal();
}
function itemRow(item={},index=0){
  const saved=Array.isArray(item.images)?item.images:[];
  return `<tr class="item-row" data-index="${index}"><td class="col-no item-number">${index+1}</td><td><input class="item-name" type="text" placeholder="Contoh: Pembelian ATK" value="${escapeAttr(item.description||'')}" aria-label="Keterangan item"><div class="item-file-box"><input class="item-files" type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple aria-label="Bukti gambar item"><small>${saved.length?'Bukti tersimpan akan tetap dipertahankan. Tambah gambar baru bila diperlukan.':'Pilih banyak gambar sekaligus'}</small><div class="selected-files" data-preview-for="${index}"></div>${saved.length?`<div class="existing-files">${saved.map(img=>`<span class="existing-file">✓ ${escapeHtml(img.name||'Bukti tersimpan')}</span>`).join('')}</div>`:''}</div></td><td class="col-price"><input class="item-price" type="number" min="0" step="1" placeholder="0" value="${item.price!==undefined&&item.price!==null&&item.price!==''?Number(item.price):''}" aria-label="Harga item"></td><td class="col-action"><button type="button" class="remove-item" title="Hapus item">×</button></td></tr>`;
}
function addItem(){
  $('#itemRows').insertAdjacentHTML('beforeend',itemRow({},$('#itemRows').querySelectorAll('.item-row').length));
  renumberItems();
  const rows=$('#itemRows').querySelectorAll('.item-row');
  const last=rows[rows.length-1];
  last?.querySelector('.item-name')?.focus();
}
function renumberItems(){
  document.querySelectorAll('#itemRows .item-row').forEach((row,i)=>{row.dataset.index=i;row.querySelector('.item-number').textContent=i+1;const p=row.querySelector('.selected-files');if(p)p.dataset.previewFor=i;});
}
function recalcTotal(){
  let total=0;document.querySelectorAll('#itemRows .item-price').forEach(input=>total+=Math.max(0,Number(input.value)||0));
  $('#itemTotal').textContent=rupiah(total);$('#totalAmountPreview').textContent=rupiah(total);return total;
}
function collectItems(){
  return [...document.querySelectorAll('#itemRows .item-row')].map(row=>({
    description:row.querySelector('.item-name').value.trim(),
    price:Number(row.querySelector('.item-price').value)||0,
    files:[...row.querySelector('.item-files').files],
    images:Array.isArray(row._existingImages)?row._existingImages:[]
  })).filter(x=>x.description||x.price>0||x.files.length||x.images.length);
}
function validateItems(items){
  if(!items.length)return 'Tambahkan minimal 1 item dan isi keterangan serta harga.';
  if(items.some(x=>!x.description))return 'Keterangan semua item wajib diisi.';
  if(items.some(x=>!(x.price>0)))return 'Harga setiap item harus lebih dari Rp0.';
  return '';
}
function showItemError(msg=''){const el=$('#itemError');if(!msg){el.classList.add('hidden');el.textContent='';}else{el.textContent=msg;el.classList.remove('hidden')}}

function renderSelectedFiles(index){
  const row=$('#itemRows')?.querySelectorAll('.item-row')[index];if(!row)return;
  const box=row.querySelector('.selected-files');const input=row.querySelector('.item-files');if(!box||!input)return;
  const files=[...input.files];
  box.innerHTML=files.length?files.map((file,i)=>`<div class="selected-file"><span class="selected-file-name">${escapeHtml(file.name)}</span><button type="button" class="remove-selected-file" data-file-index="${i}" title="Hapus gambar ini">×</button></div>`).join(''):'<span class="no-files">Belum ada gambar dipilih</span>';
}
function removeSelectedFile(rowIndex,fileIndex){
  const row=$('#itemRows').querySelectorAll('.item-row')[rowIndex];if(!row)return;
  const input=row.querySelector('.item-files');const files=[...input.files];files.splice(fileIndex,1);
  const dt=new DataTransfer();files.forEach(f=>dt.items.add(f));input.files=dt.files;renderSelectedFiles(rowIndex);
}

function showDetail(id){
  const r=state.requests.find(x=>String(x.id)===String(id));if(!r)return;
  const itemBlocks=(r.items||[]).map((x,i)=>{
    const imgs=x.images||[];
    const gallery=imgs.length?`<div class="image-gallery">${imgs.map((img,j)=>`<div class="detail-image-wrap"><a href="${escapeAttr(img.url)}" target="_blank" rel="noopener"><img src="${escapeAttr(img.url)}" alt="Bukti ${i+1}-${j+1}" loading="lazy"></a>${state.admin?`<button type="button" class="delete-saved-image" onclick="deleteSavedImage('${escapeAttr(r.id)}',${i},'${escapeAttr(img.id)}')">Hapus</button>`:''}<div class="detail-image-name">${escapeHtml(img.name||'Gambar '+(j+1))}</div></div>`).join('')}</div>`:'<div class="no-saved-images">Belum ada bukti gambar untuk item ini.</div>';
    return `<div class="detail-item"><div class="detail-item-head"><span class="detail-item-no">${i+1}</span><div class="detail-item-title">${escapeHtml(x.description)}</div><strong>${rupiah(x.price)}</strong></div><div class="detail-item-images">${gallery}</div></div>`;
  }).join('');
  const legacyReceipt=r.receipt_url?`<div class="detail-section"><h4>Nota / Bukti Lama</h4><div class="receipt">${/\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(r.receipt_url)?`<a href="${escapeAttr(r.receipt_url)}" target="_blank" rel="noopener"><img src="${escapeAttr(r.receipt_url)}" alt="Nota"></a>`:''}<a href="${escapeAttr(r.receipt_url)}" target="_blank" rel="noopener">Buka ${escapeHtml(r.receipt_filename||'file bukti')}</a></div></div>`:'';
  const itemTable=`<div class="detail-section"><h4>Rincian Item & Bukti</h4><div class="detail-items-list">${itemBlocks||'<div class="empty">Belum ada rincian item.</div>'}</div></div>`;
  $('#detailContent').innerHTML=`<div class="modal-head"><div><span class="number">${escapeHtml(r.request_number)}</span><h2>${escapeHtml(r.title)}</h2></div><button class="icon-btn" data-close="detailModal">×</button></div><div class="detail-body"><div class="detail-head"><div><span class="status ${escapeAttr(r.status)}">${statusLabel[r.status]||r.status}</span></div><strong>${rupiah(r.amount)}</strong></div><div class="detail-section"><div class="detail-grid"><div><div class="detail-label">Pemohon</div><div class="detail-value">${escapeHtml(r.name||'-')}</div></div><div><div class="detail-label">Departemen</div><div class="detail-value">${escapeHtml(r.department||'-')}</div></div><div><div class="detail-label">Kategori</div><div class="detail-value">${categoryLabel[r.category]||r.category}</div></div><div><div class="detail-label">Tanggal</div><div class="detail-value">${dateFmt(r.created_at)}</div></div></div></div>${itemTable}${r.description?`<div class="detail-section"><h4>Keterangan Tambahan</h4><p>${escapeHtml(r.description)}</p></div>`:''}${r.finance_note?`<div class="detail-section"><h4>Catatan Keuangan</h4><p>${escapeHtml(r.finance_note)}</p></div>`:''}${legacyReceipt}${state.admin?adminActions(r):''}</div>`;
  openModal('detailModal');
}
function adminActions(r){
  const manage=`<div class="finance-actions"><button class="btn btn-light" onclick="editRequest('${escapeAttr(r.id)}')">✎ Edit</button><button class="btn btn-danger" onclick="deleteRequest('${escapeAttr(r.id)}')">🗑 Hapus</button></div>`;
  let statusActions='';
  if(r.status==='pending')statusActions=`<textarea id="financeNote" class="search" rows="3" placeholder="Catatan approval / penolakan">${escapeHtml(r.finance_note||'')}</textarea><div class="finance-actions"><button class="btn btn-success" onclick="changeStatus('${escapeAttr(r.id)}','approved')">✓ Setujui</button><button class="btn btn-danger" onclick="changeStatus('${escapeAttr(r.id)}','rejected')">✕ Tolak</button></div>`;
  else if(r.status==='approved')statusActions=`<textarea id="financeNote" class="search" rows="3" placeholder="Catatan pembayaran (opsional)">${escapeHtml(r.finance_note||'')}</textarea><div class="finance-actions"><button class="btn btn-blue" onclick="changeStatus('${escapeAttr(r.id)}','paid')">Rp Tandai Sudah Dibayar</button><button class="btn btn-light" onclick="changeStatus('${escapeAttr(r.id)}','pending')">↶ Kembalikan Menunggu</button></div>`;
  else statusActions=`<div class="finance-actions"><button class="btn btn-light" onclick="changeStatus('${escapeAttr(r.id)}','pending')">↶ Kembalikan Menunggu</button></div>`;
  return `<div class="detail-section"><h4>Aksi Pengelola</h4>${statusActions}${manage}</div>`;
}
async function changeStatus(id,status){
  const note=$('#financeNote')?.value||'';
  if(status==='rejected'&&!note.trim()){toast('Isi catatan saat menolak permohonan.',false);return}
  try{await api('updateStatus',{id,status,finance_note:note,pin:state.pin});toast('Status berhasil diperbarui.');closeModal('detailModal');await load();openFinancePanel();}catch(e){toast(e.message,false)}
}

async function deleteSavedImage(requestId,itemIndex,imageId){
  if(!state.admin)return;
  if(!confirm('Hapus gambar bukti ini dari Drive?'))return;
  try{await api('deleteItemImage',{id:requestId,item_index:itemIndex,image_id:imageId});toast('Gambar berhasil dihapus.');await load();showDetail(requestId);}catch(e){toast(e.message,false)}
}

async function submitRequest(e){
  e.preventDefault();
  const form=e.target,btn=$('#submitBtn'),err=$('#formError');err.classList.add('hidden');showItemError('');
  const items=collectItems(), itemError=validateItems(items);if(itemError){showItemError(itemError);return}
  const total=items.reduce((sum,x)=>sum+x.price,0);if(!(total>0)){showItemError('Total dana harus lebih dari Rp0.');return}
  btn.disabled=true;
  try{
    const cleanItems=items.map(x=>({description:x.description,price:x.price,images:x.images||[]}));
    const fd=new FormData(form);const data=Object.fromEntries(fd.entries());delete data.receipt;data.amount=total;data.items=cleanItems;data.pin=state.pin;
    const isEdit=!!state.editingId;
    if(isEdit)data.id=state.editingId;
    btn.textContent=isEdit?'Menyimpan perubahan...':'Menyimpan permohonan...';
    const saved=await api(isEdit?'updateRequest':'createRequest',data);
    const uploadJobs=[];
    items.forEach((item,itemIndex)=>item.files.forEach(file=>uploadJobs.push({itemIndex,file})));
    let done=0,failed=[];
    for(const job of uploadJobs){
      btn.textContent=`Mengunggah bukti ${done+1}/${uploadJobs.length}...`;
      try{
        if(fileTooLarge(job.file))throw new Error('Ukuran lebih dari 10 MB');
        await api('uploadItemImage',{id:saved.id||state.editingId,item_index:job.itemIndex,file:{name:job.file.name,type:job.file.type,data:await fileToBase64(job.file)}});
      }catch(ex){failed.push(job.file.name+': '+ex.message)}
      done++;
    }
    const edited=isEdit;state.editingId='';form.reset();renderItems([]);closeModal('requestModal');await load();
    if(failed.length)toast(`${edited?'Perubahan tersimpan':'Permohonan tersimpan'}, tetapi ${failed.length} gambar gagal diunggah.`,false);
    else toast(edited?'Permohonan berhasil diedit.':`Permohonan berhasil dikirim. ${uploadJobs.length} gambar tersimpan.`);
  }catch(e){err.textContent=e.message;err.classList.remove('hidden')}
  finally{btn.disabled=false;btn.textContent='Kirim Permohonan'}
}
function fileTooLarge(file){return file.size>10*1024*1024}
function fileToBase64(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result).split(',')[1]);r.onerror=reject;r.readAsDataURL(file)})}

function currentMonth(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')}
async function renderFinancePanel(month=currentMonth()){
  $('#financeContent').innerHTML='<div class="finance-list"><div class="alert">Memuat rekap keuangan...</div></div>';
  try{
    const recap=await api('monthlyRecap',{month});
    const s=recap.data.summary, rows=recap.data.rows||[];
    $('#financeContent').innerHTML=`<div class="finance-list"><div class="finance-toolbar"><div><strong>Rekap 1 Bulan</strong><div class="meta">Pilih bulan untuk melihat ringkasan dan daftar permohonan.</div></div><input id="financeMonth" class="month-input" type="month" value="${escapeAttr(month)}"></div><div class="finance-summary"><div class="finance-stat"><span>Total</span><strong>${s.total}</strong><small>${rupiah(s.total_amount)}</small></div><div class="finance-stat"><span>Menunggu</span><strong>${s.pending}</strong><small>-</small></div><div class="finance-stat approved"><span>Disetujui</span><strong>${s.approved}</strong><small>${rupiah(s.approved_amount)}</small></div><div class="finance-stat paid"><span>Dibayar</span><strong>${s.paid}</strong><small>${rupiah(s.paid_amount)}</small></div><div class="finance-stat rejected"><span>Ditolak</span><strong>${s.rejected}</strong><small>${rupiah(s.rejected_amount)}</small></div></div><div class="finance-list-head"><div><strong>Semua Permohonan</strong><span class="meta">${rows.length} data pada ${escapeHtml(month)}</span></div></div>${rows.length?rows.map(x=>financeItem(x)).join(''):'<div class="empty">Tidak ada permohonan pada bulan ini.</div>'}</div>`;
    $('#financeMonth').onchange=e=>renderFinancePanel(e.target.value||currentMonth());
  }catch(e){$('#financeContent').innerHTML=`<div class="finance-list"><div class="alert error">${escapeHtml(e.message)}</div></div>`}
}
function financeItem(x){return `<div class="finance-item"><div class="finance-main"><div><strong>${escapeHtml(x.request_number)}</strong> <span class="status ${escapeAttr(x.status)}">${statusLabel[x.status]||x.status}</span></div><span class="meta">${escapeHtml(x.name||'-')} · ${escapeHtml(x.title||'-')} · ${dateFmt(x.created_at)}</span><strong class="finance-amount">${rupiah(x.amount)}</strong></div><div class="finance-item-actions"><button class="btn btn-light" onclick="closeModal('financeModal');showDetail('${escapeAttr(x.id)}')">Buka</button><button class="btn btn-light" onclick="editRequest('${escapeAttr(x.id)}')">✎ Edit</button><button class="btn btn-danger" onclick="deleteRequest('${escapeAttr(x.id)}')">Hapus</button></div></div>`}
async function openFinancePanel(){if(!state.admin)return;openModal('financeModal');await renderFinancePanel($('#financeMonth')?.value||currentMonth())}
async function openFinance(){
  const pin=prompt('Masukkan PIN Panel Keuangan:');if(!pin)return;
  try{const r=await api('adminCheck',{pin});if(!r.authorized)throw new Error('PIN salah.');state.admin=true;state.pin=pin;openModal('financeModal');await renderFinancePanel(currentMonth())}
  catch(e){toast(e.message,false)}
}
function editRequest(id){
  if(!state.admin)return;
  const r=state.requests.find(x=>String(x.id)===String(id));if(!r)return;
  state.editingId=r.id;
  $('#formTitle').textContent='Edit Permohonan Dana';
  $('#submitBtn').textContent='Simpan Perubahan';
  const form=$('#requestForm');form.name.value=r.name||'';form.department.value=r.department||'';form.title.value=r.title||'';form.category.value=r.category||'operasional';form.description.value=r.description||'';
  renderItems(r.items||[]);showItemError('');$('#formError').classList.add('hidden');closeModal('financeModal');closeModal('detailModal');openModal('requestModal');
}
async function deleteRequest(id){
  if(!state.admin)return;
  const r=state.requests.find(x=>String(x.id)===String(id));if(!r)return;
  if(!confirm(`Hapus ${r.request_number}? Data permohonan dan bukti yang tersimpan akan dihapus.`))return;
  try{await api('deleteRequest',{id:r.id,pin:state.pin});toast('Permohonan berhasil dihapus.');closeModal('detailModal');await load();await openFinancePanel();}catch(e){toast(e.message,false)}
}
function escapeHtml(s){return String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function escapeAttr(s){return escapeHtml(s)}

$('#newRequestBtn').onclick=()=>{state.editingId='';$('#formTitle').textContent='Permohonan Dana Baru';$('#submitBtn').textContent='Kirim Permohonan';$('#requestForm').reset();renderItems([]);showItemError('');$('#formError').classList.add('hidden');openModal('requestModal')};
$('#refreshBtn').onclick=load;
$('#financeBtn').onclick=openFinance;
$('#addItemBtn').onclick=addItem;
$('#requestForm').onsubmit=submitRequest;
$('#itemRows').addEventListener('input',e=>{if(e.target.classList.contains('item-price'))recalcTotal()});
$('#itemRows').addEventListener('change',e=>{if(e.target.classList.contains('item-files')){const row=e.target.closest('.item-row');renderSelectedFiles([...$('#itemRows').querySelectorAll('.item-row')].indexOf(row));}});
$('#itemRows').addEventListener('click',e=>{
  const removeFile=e.target.closest('.remove-selected-file');
  if(removeFile){const row=removeFile.closest('.item-row');removeSelectedFile([...$('#itemRows').querySelectorAll('.item-row')].indexOf(row),Number(removeFile.dataset.fileIndex));return;}
  const btn=e.target.closest('.remove-item');if(!btn)return;
  const rows=$('#itemRows').querySelectorAll('.item-row');
  if(rows.length<=1){rows[0].querySelector('.item-name').value='';rows[0].querySelector('.item-price').value='';rows[0].querySelector('.item-files').value='';renderSelectedFiles(0);}else{btn.closest('tr').remove();}
  renumberItems();recalcTotal();showItemError('');
});
$('#searchInput').oninput=e=>{state.search=e.target.value;render()};
$('#sortSelect').onchange=e=>{state.sort=e.target.value;render()};
document.querySelectorAll('.filter').forEach(b=>b.onclick=()=>{document.querySelectorAll('.filter').forEach(x=>x.classList.remove('active'));b.classList.add('active');state.filter=b.dataset.filter;render()});
document.querySelectorAll('.modal').forEach(m=>m.addEventListener('click',e=>{if(e.target===m)m.classList.add('hidden')}));
renderItems([]);
load();

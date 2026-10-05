/*
 * FRONTEND PUBLIC - Google Apps Script API
 * Dynamic item + price rows are stored as an item list and total automatically.
 */
const API_URL = 'https://script.google.com/macros/s/AKfycbwt87pA-3UE_rbHXxTX1KaBckKKkwHIvXDZM1lCdJSAvZIGrvU_h8zHQcC9F7pjbs9f/exec';
const ADMIN_PIN = '123456';

const state = { requests: [], filter: 'all', search: '', sort: 'newest', admin: false, pin: '' };
const $ = (s) => document.querySelector(s);
const rupiah = (n) => new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',minimumFractionDigits:0}).format(Number(n||0));
const dateFmt = (v) => { if(!v) return '-'; const d=new Date(v); return isNaN(d) ? String(v) : d.toLocaleString('id-ID',{dateStyle:'medium',timeStyle:'short'}); };
const statusLabel = {pending:'Menunggu',approved:'Disetujui',rejected:'Ditolak',paid:'Sudah Dibayar'};
const categoryLabel = {operasional:'Operasional',transportasi:'Transportasi',pembelian:'Pembelian',lainnya:'Lainnya'};
function toast(msg, ok=true){const t=$('#toast');t.textContent=msg;t.className='toast '+(ok?'ok':'bad');clearTimeout(window.__toast);window.__toast=setTimeout(()=>t.className='toast hidden',3500)}
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
  const itemCount=(r.items||[]).length;
  return `<article class="request-card" onclick="showDetail('${r.id}')"><div class="card-top"><span class="number">${escapeHtml(r.request_number)}</span><span class="status ${r.status}">${statusLabel[r.status]||r.status}</span></div><h3>${escapeHtml(r.title)}</h3><div class="meta">${escapeHtml(r.name||'-')}${r.department?' · '+escapeHtml(r.department):''}</div><div class="amount">${rupiah(r.amount)}</div><div class="description">${itemCount?`${itemCount} item rincian`:escapeHtml(r.description||'Belum ada rincian item')}</div><span class="category">${categoryLabel[r.category]||r.category||'-'}</span></article>`;
}
function renderItems(items){
  const rows=Array.isArray(items)&&items.length?items:[{description:'',price:''}];
  $('#itemRows').innerHTML=rows.map((item,i)=>itemRow(item,i)).join('');
  recalcTotal();
}
function itemRow(item={},index=0){
  return `<tr class="item-row"><td class="col-no item-number">${index+1}</td><td><input class="item-name" type="text" placeholder="Contoh: Pembelian ATK" value="${escapeAttr(item.description||'')}" aria-label="Keterangan item"></td><td class="col-price"><input class="item-price" type="number" min="0" step="1" placeholder="0" value="${item.price!==undefined&&item.price!==null&&item.price!==''?Number(item.price):''}" aria-label="Harga item"></td><td class="col-action"><button type="button" class="remove-item" title="Hapus item">×</button></td></tr>`;
}
function addItem(){
  $('#itemRows').insertAdjacentHTML('beforeend',itemRow({},$('#itemRows').querySelectorAll('.item-row').length));
  renumberItems();
  const inputs=$('#itemRows').querySelectorAll('.item-name');
  if(inputs.length)inputs[inputs.length-1].focus();
}
function renumberItems(){document.querySelectorAll('#itemRows .item-number').forEach((el,i)=>el.textContent=i+1)}
function recalcTotal(){
  let total=0;
  document.querySelectorAll('#itemRows .item-price').forEach(input=>total+=Math.max(0,Number(input.value)||0));
  $('#itemTotal').textContent=rupiah(total);$('#totalAmountPreview').textContent=rupiah(total);return total;
}
function collectItems(){
  return [...document.querySelectorAll('#itemRows .item-row')].map(row=>({description:row.querySelector('.item-name').value.trim(),price:Number(row.querySelector('.item-price').value)||0})).filter(x=>x.description||x.price>0);
}
function validateItems(items){
  if(!items.length) return 'Tambahkan minimal 1 item dan isi keterangan serta harga.';
  if(items.some(x=>!x.description)) return 'Keterangan semua item wajib diisi.';
  if(items.some(x=>!(x.price>0))) return 'Harga setiap item harus lebih dari Rp0.';
  return '';
}
function showItemError(msg=''){const el=$('#itemError');if(!msg){el.classList.add('hidden');el.textContent='';}else{el.textContent=msg;el.classList.remove('hidden')}}

function showDetail(id){
  const r=state.requests.find(x=>String(x.id)===String(id));if(!r)return;
  let receipt='';
  if(r.receipt_url){const isImg=/\.(jpg|jpeg|png|webp)(\?|$)/i.test(r.receipt_url);receipt=`<div class="detail-section"><h4>Nota / Bukti</h4><div class="receipt">${isImg?`<a href="${r.receipt_url}" target="_blank"><img src="${r.receipt_url}" alt="Nota"></a>`:''}<a href="${r.receipt_url}" target="_blank">Buka ${escapeHtml(r.receipt_filename||'file bukti')}</a></div></div>`}
  const items=(r.items||[]).map((x,i)=>`<tr><td>${i+1}</td><td>${escapeHtml(x.description)}</td><td class="money">${rupiah(x.price)}</td></tr>`).join('');
  const itemTable=items?`<div class="detail-section"><h4>Rincian Item</h4><div class="item-table-wrap"><table class="item-table detail-items"><thead><tr><th class="col-no">No</th><th>Keterangan / Item</th><th class="col-price">Harga</th></tr></thead><tbody>${items}</tbody><tfoot><tr><td colspan="2" class="total-label">TOTAL</td><td class="total-value">${rupiah(r.amount)}</td></tr></tfoot></table></div></div>`:'';
  $('#detailContent').innerHTML=`<div class="modal-head"><div><span class="number">${escapeHtml(r.request_number)}</span><h2>${escapeHtml(r.title)}</h2></div><button class="icon-btn" data-close="detailModal">×</button></div><div class="detail-body"><div class="detail-head"><div><span class="status ${r.status}">${statusLabel[r.status]||r.status}</span></div><strong>${rupiah(r.amount)}</strong></div><div class="detail-section"><div class="detail-grid"><div><div class="detail-label">Pemohon</div><div class="detail-value">${escapeHtml(r.name||'-')}</div></div><div><div class="detail-label">Departemen</div><div class="detail-value">${escapeHtml(r.department||'-')}</div></div><div><div class="detail-label">Kategori</div><div class="detail-value">${categoryLabel[r.category]||r.category}</div></div><div><div class="detail-label">Tanggal</div><div class="detail-value">${dateFmt(r.created_at)}</div></div></div></div>${itemTable}${r.description?`<div class="detail-section"><h4>Keterangan Tambahan</h4><p>${escapeHtml(r.description)}</p></div>`:''}${r.finance_note?`<div class="detail-section"><h4>Catatan Keuangan</h4><p>${escapeHtml(r.finance_note)}</p></div>`:''}${receipt}${state.admin?adminActions(r):''}</div>`;
  openModal('detailModal');
}
function adminActions(r){
  if(r.status==='pending')return `<div class="detail-section"><h4>Aksi Keuangan</h4><textarea id="financeNote" class="search" rows="3" placeholder="Catatan approval / penolakan"></textarea><div class="finance-actions"><button class="btn btn-success" onclick="changeStatus('${r.id}','approved')">✓ Setujui</button><button class="btn btn-danger" onclick="changeStatus('${r.id}','rejected')">✕ Tolak</button></div></div>`;
  if(r.status==='approved')return `<div class="detail-section"><h4>Aksi Keuangan</h4><button class="btn btn-blue" onclick="changeStatus('${r.id}','paid')">Rp Tandai Sudah Dibayar</button></div>`;
  return '';
}
async function changeStatus(id,status){
  const note=$('#financeNote')?.value||'';if(status==='rejected'&&!note.trim()){toast('Isi catatan saat menolak permohonan.',false);return}
  try{await api('updateStatus',{id,status,finance_note:note,pin:state.pin});toast('Status berhasil diperbarui.');closeModal('detailModal');await load();}catch(e){toast(e.message,false)}
}
async function submitRequest(e){
  e.preventDefault();
  const form=e.target,btn=$('#submitBtn'),err=$('#formError');err.classList.add('hidden');showItemError('');
  const items=collectItems(), itemError=validateItems(items);
  if(itemError){showItemError(itemError);return}
  const total=items.reduce((sum,x)=>sum+x.price,0);if(!(total>0)){showItemError('Total dana harus lebih dari Rp0.');return}
  btn.disabled=true;btn.textContent='Mengirim...';
  try{
    const file=$('#receipt').files[0];if(file&&file.size>5*1024*1024)throw new Error('Ukuran file maksimal 5MB.');
    let receipt=null;if(file)receipt={name:file.name,type:file.type,data:await fileToBase64(file)};
    const fd=new FormData(form);const data=Object.fromEntries(fd.entries());delete data.receipt;data.amount=total;data.items=items;data.receipt=receipt;
    const r=await api('createRequest',data);form.reset();renderItems([]);closeModal('requestModal');toast('Permohonan berhasil dikirim. Nomor: '+r.request_number);await load();
  }catch(e){err.textContent=e.message;err.classList.remove('hidden')}
  finally{btn.disabled=false;btn.textContent='Kirim Permohonan'}
}
function fileToBase64(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result).split(',')[1]);r.onerror=reject;r.readAsDataURL(file)})}
async function openFinance(){
  const pin=prompt('Masukkan PIN Panel Keuangan:');if(!pin)return;
  try{const r=await api('adminCheck',{pin});if(!r.authorized)throw new Error('PIN salah.');state.admin=true;state.pin=pin;$('#financeContent').innerHTML=`<div class="finance-list"><div class="alert">Panel aktif. Klik salah satu permohonan untuk meninjau dan mengubah status.</div>${state.requests.length?state.requests.map(x=>`<div class="finance-item"><div><strong>${escapeHtml(x.request_number)}</strong><br><span class="meta">${escapeHtml(x.name||'-')} · ${escapeHtml(x.title)}</span></div><button class="btn btn-light" onclick="closeModal('financeModal');showDetail('${x.id}')">Buka</button></div>`).join(''):'<div class="empty">Belum ada data.</div>'}</div>`;openModal('financeModal')}
  catch(e){toast(e.message,false)}
}
function escapeHtml(s){return String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function escapeAttr(s){return escapeHtml(s)}

$('#newRequestBtn').onclick=()=>{renderItems([]);showItemError('');$('#formError').classList.add('hidden');openModal('requestModal')};
$('#refreshBtn').onclick=load;
$('#financeBtn').onclick=openFinance;
$('#addItemBtn').onclick=addItem;
$('#requestForm').onsubmit=submitRequest;
$('#itemRows').addEventListener('input',e=>{if(e.target.classList.contains('item-price'))recalcTotal()});
$('#itemRows').addEventListener('click',e=>{const btn=e.target.closest('.remove-item');if(!btn)return;const rows=$('#itemRows').querySelectorAll('.item-row');if(rows.length<=1){rows[0].querySelector('.item-name').value='';rows[0].querySelector('.item-price').value='';}else{btn.closest('tr').remove();}renumberItems();recalcTotal();showItemError('')});
$('#searchInput').oninput=e=>{state.search=e.target.value;render()};
$('#sortSelect').onchange=e=>{state.sort=e.target.value;render()};
document.querySelectorAll('.filter').forEach(b=>b.onclick=()=>{document.querySelectorAll('.filter').forEach(x=>x.classList.remove('active'));b.classList.add('active');state.filter=b.dataset.filter;render()});
document.querySelectorAll('.modal').forEach(m=>m.addEventListener('click',e=>{if(e.target===m)m.classList.add('hidden')}));
renderItems([]);
load();

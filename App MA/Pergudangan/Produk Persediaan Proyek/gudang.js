const APP_MODE='core';
const API_URL='https://script.google.com/macros/s/AKfycbwhzQLPfSPwQouiM_9x0DJT5FFzQOPEn84rKKNDo-7UD-I3nk8hhVokIiY6_FNCG4SQww/exec';
let state={perusahaan:[],produk:[],stokPT:[],po:[],sj:[],mutasi:[],proyek:[],stokProyek:[]},currentId='',activePT='FMA';
const $=id=>document.getElementById(id),today=()=>new Date().toISOString().slice(0,10);
const rupiah=n=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(n)||0);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const companies=[{id:'FMA',kode:'FMA',nama:'PT. Fadhilah Maju Abadi',short:'Fadhilah Maju Abadi'},{id:'ZMA',kode:'ZMA',nama:'PT. Zahra Maju Abadi',short:'Zahra Maju Abadi'},{id:'RMA',kode:'RMA',nama:'PT. Rizky Maju Abadi',short:'Rizky Maju Abadi'}];

let signatureRole='',signatureCanvas=null,signatureCtx=null,signatureDrawing=false,signatureHasInk=false;
function sigVal(x,role){return String(x?.[role+'_ttd']||'')}
function sigName(x,role){if(role==='pengemudi')return String(x?.pengemudi_nama||x?.pengemudi||'');return String(x?.[role+'_nama']||'')}
function signatureCard(role,label,x){const s=sigVal(x,role);const n=sigName(x,role);return `<div class="signature-card"><div class="signature-card-head"><b>${label}</b><span class="sig-status ${s?'signed':''}">${s?'✓ Sudah ditandatangani':'Belum ditandatangani'}</span></div><input id="ttd${role.charAt(0).toUpperCase()+role.slice(1)}Nama" placeholder="Nama ${label}" value="${esc(n)}" oninput="syncSignatureName('${role}',this.value)"><div class="signature-preview ${s?'has-signature':''}">${s?`<img src="${esc(s)}" alt="Tanda tangan ${label}">`:'<span>Belum ada tanda tangan</span>'}</div><button type="button" class="btn light sig-button" onclick="openSignaturePad('${role}')">✍ ${s?'Ubah':'Tanda Tangan'}</button></div>`}
function signatureSection(x){return `<div class="signature-section"><div class="signature-title"><div><b>Tanda Tangan Surat Jalan</b><small>Tanda tangan dapat digambar dengan mouse, touchpad, atau jari di HP.</small></div><span class="signature-note">Disimpan bersama Surat Jalan</span></div><div class="signature-grid">${signatureCard('penerima','Penerima',x)}${signatureCard('pengemudi','Pengemudi',x)}${signatureCard('mengetahui','Mengetahui',x)}</div></div>`}
function syncSignatureName(role,value){if(role==='pengemudi' && $('spengemudi'))$('spengemudi').value=value;}
function openSignaturePad(role){
  signatureRole=role;
  signatureCanvas=$('signatureCanvas');
  if(!signatureCanvas)return toast('Kotak tanda tangan tidak ditemukan');
  signatureCtx=signatureCanvas.getContext('2d');
  signatureCanvas.width=600;
  signatureCanvas.height=240;
  signatureDrawing=false;
  signatureHasInk=false;
  setupSignatureCanvas();
$('signatureModalTitle').textContent='Tanda Tangan — '+role.charAt(0).toUpperCase()+role.slice(1);$('signatureName').value=role==='pengemudi'?($('spengemudi')?.value||''):($('ttd'+role.charAt(0).toUpperCase()+role.slice(1)+'Nama')?.value||'');clearSignaturePad(false);const old=state.sj.find(a=>String(a.id)===String(currentId));const data=sigVal(old,role);if(data){const img=new Image();img.onload=()=>{signatureCtx.drawImage(img,0,0,signatureCanvas.width,signatureCanvas.height);signatureHasInk=true};img.src=data;}$('signatureModal').classList.remove('hidden')}
function setupSignatureCanvas(){
  if(!signatureCanvas)return;
  signatureCanvas.style.touchAction='none';
  signatureCanvas.onpointerdown=function(e){
    e.preventDefault();
    signatureDrawing=true;
    signatureHasInk=true;
    const r=signatureCanvas.getBoundingClientRect();
    const x=(e.clientX-r.left)*(signatureCanvas.width/r.width);
    const y=(e.clientY-r.top)*(signatureCanvas.height/r.height);
    signatureCtx.beginPath();
    signatureCtx.moveTo(x,y);
    if(signatureCanvas.setPointerCapture){
      try{signatureCanvas.setPointerCapture(e.pointerId)}catch(_){}
    }
  };
  signatureCanvas.onpointermove=function(e){
    if(!signatureDrawing)return;
    e.preventDefault();
    const r=signatureCanvas.getBoundingClientRect();
    const x=(e.clientX-r.left)*(signatureCanvas.width/r.width);
    const y=(e.clientY-r.top)*(signatureCanvas.height/r.height);
    signatureCtx.lineTo(x,y);
    signatureCtx.stroke();
  };
  signatureCanvas.onpointerup=function(e){
    e.preventDefault();
    signatureDrawing=false;
    try{signatureCanvas.releasePointerCapture?.(e.pointerId)}catch(_){}
  };
  signatureCanvas.onpointercancel=function(){
    signatureDrawing=false;
  };
  signatureCanvas.onpointerleave=function(){
    // Jangan memutus garis saat pointer keluar sedikit; pointer capture menangani ini.
  };
  signatureCtx.lineWidth=4;
  signatureCtx.lineCap='round';
  signatureCtx.lineJoin='round';
  signatureCtx.strokeStyle='#111';
}
function clearSignaturePad(resetInk=true){if(!signatureCanvas||!signatureCtx)return;signatureCtx.save();signatureCtx.setTransform(1,0,0,1,0,0);signatureCtx.fillStyle='#fff';signatureCtx.fillRect(0,0,signatureCanvas.width,signatureCanvas.height);signatureCtx.restore();signatureHasInk=false;if(resetInk)toast('Tanda tangan dibersihkan')}
function saveSignaturePad(){if(!signatureHasInk)return toast('Silakan buat tanda tangan terlebih dahulu');let data=signatureCanvas.toDataURL('image/png');if(data.length>48000)data=signatureCanvas.toDataURL('image/jpeg',0.65);const key=signatureRole+'_ttd';const nameKey=signatureRole+'_nama';if(!$('signatureName').value.trim())return toast('Nama penanda tangan wajib diisi');window.__currentSJSignatures=window.__currentSJSignatures||{};window.__currentSJSignatures[key]=data;window.__currentSJSignatures[nameKey]=$('signatureName').value.trim();if(signatureRole==='pengemudi'&&$('spengemudi'))$('spengemudi').value=$('signatureName').value.trim();$('signatureModal').classList.add('hidden');renderSignatureSectionFromModal();toast('Tanda tangan disimpan ✓')}
function renderSignatureSectionFromModal(){const wrap=$('sjSignatureSection');if(!wrap)return;const x=state.sj.find(a=>String(a.id)===String(currentId))||{};const merged={...x,...(window.__currentSJSignatures||{})};wrap.innerHTML=signatureSection(merged)}
function closeSignaturePad(){$('signatureModal').classList.add('hidden')}
function company(){return companies.find(c=>c.id===activePT)||companies[0]}
function toast(t){$('toast').textContent=t;$('toast').classList.add('show');setTimeout(()=>$('toast').classList.remove('show'),2500)}
function tab(btn,id){document.querySelectorAll('.tabs .tab[data-tab]').forEach(x=>x.classList.remove('active'));document.querySelectorAll('.tabpane').forEach(x=>x.classList.remove('active'));btn.classList.add('active');$('tab-'+id).classList.add('active')}
document.querySelectorAll('.tabs .tab[data-tab]').forEach(b=>b.onclick=()=>tab(b,b.dataset.tab));
document.querySelectorAll('.nav').forEach(b=>b.onclick=()=>showPage(b.dataset.page));
document.querySelectorAll('.inventory-tabs .tab[data-stocktab]').forEach(b=>b.onclick=()=>showStockTab(b,b.dataset.stocktab));
function showPage(p){if(APP_MODE==='core' && !['produk','stok','proyek'].includes(p))p='produk';if(APP_MODE==='po')p='po';if(APP_MODE==='sj')p='sj';document.querySelectorAll('.page').forEach(x=>x.classList.add('hidden'));$('page-'+p).classList.remove('hidden');document.querySelectorAll('.nav').forEach(x=>x.classList.toggle('active',x.dataset.page===p));if(p==='produk')renderProducts();if(p==='po')renderPO();if(p==='sj')renderSJ();if(p==='stok')renderStock();if(p==='proyek')renderProjects()}
function showStockTab(btn,id){document.querySelectorAll('.inventory-tabs .tab').forEach(x=>x.classList.remove('active'));btn.classList.add('active');['gudang','group','proyek','mutasi'].forEach(x=>$('stock'+x.charAt(0).toUpperCase()+x.slice(1)+'Pane').classList.add('hidden'));$('stock'+id.charAt(0).toUpperCase()+id.slice(1)+'Pane').classList.remove('hidden')}
function renderCompanySwitch(){
  $('companySwitch').innerHTML=companies.map((c,i)=>`<button class="company-pill ${c.id===activePT?'active '+c.id.toLowerCase():''}" onclick="switchPT('${c.id}')"><span class="flag">${i===0?'🟦':i===1?'🟩':'🟨'}</span><span><b>${esc(c.short)}</b><small>${c.kode}</small></span></button>`).join('');
  if($('stockCompanyName')) $('stockCompanyName').textContent=company().nama;
  if($('productCompanyLabel')) $('productCompanyLabel').textContent='Stok yang tampil mengikuti '+company().nama;
}
function switchPT(id){
  activePT=id;
  renderCompanySwitch();
  if(APP_MODE==='core'){
    renderProducts(); renderStock(); renderProjects();
    if(currentId){let p=state.produk.find(x=>String(x.id)===String(currentId));if(p)fillProduct(p)}
  }else if(APP_MODE==='po'){
    renderPO();
  }else if(APP_MODE==='sj'){
    renderSJ();
  }
  toast('PT aktif: '+company().nama);
}
function blankProduct(){return{id:Date.now().toString(),kode:'',nama:'',tipe:'Barang',kategori:'',satuan:'PCS',lokasi:'',spesifikasi:'',hargaBeli:0,hargaJual:0,ppn:11,stokMin:0,supplier:'',supplierKontak:'',hargaTerakhir:0,tanggalBeli:'',forSale:true,forPurchase:true}}
function newProduct(){currentId='';fillProduct(blankProduct());showPage('produk')}
function stockFor(ptId,kode){return state.stokPT.filter(s=>String(s.ptId)===String(ptId)&&String(s.kode).toLowerCase()===String(kode).toLowerCase()).reduce((a,b)=>a+Number(b.qty||0),0)}
function groupStock(kode){return state.stokPT.filter(s=>String(s.kode).toLowerCase()===String(kode).toLowerCase()).reduce((a,b)=>a+Number(b.qty||0),0)}
function projectStockFor(ptId,kode){return state.stokProyek.filter(s=>String(s.ptId)===String(ptId)&&String(s.kode).toLowerCase()===String(kode).toLowerCase()).reduce((a,b)=>a+Number(b.qty||0),0)}
function fillProduct(x){
  $('productHeading').textContent=x.nama||'Produk Baru';
  ['kode','nama','tipe','kategori','satuan','lokasi','spesifikasi','hargaBeli','hargaJual','ppn','stokMin','supplier','supplierKontak','hargaTerakhir','tanggalBeli'].forEach(k=>$(k).value=x[k]??'');
  $('forSale').checked=x.forSale!==false;$('forPurchase').checked=x.forPurchase!==false;
  const s=stockFor(activePT,x.kode),g=groupStock(x.kode),p=projectStockFor(activePT,x.kode);$('stokTampil').textContent=s.toLocaleString('id-ID');$('stokGroupTampil').textContent=g.toLocaleString('id-ID');$('stokProyekTampil').textContent=p.toLocaleString('id-ID');$('stokUnit').textContent=x.satuan||'PCS';$('stokGroupUnit').textContent=x.satuan||'PCS';$('stokProyekUnit').textContent=x.satuan||'PCS';
}
function productFromForm(){let old=state.produk.find(x=>x.id===currentId)||{};return{...old,id:currentId||Date.now().toString(),kode:$('kode').value.trim(),nama:$('nama').value.trim(),tipe:$('tipe').value,kategori:$('kategori').value.trim(),satuan:$('satuan').value.trim()||'PCS',lokasi:$('lokasi').value.trim(),spesifikasi:$('spesifikasi').value,hargaBeli:Number($('hargaBeli').value)||0,hargaJual:Number($('hargaJual').value)||0,ppn:Number($('ppn').value)||0,stok:0,stokMin:Number($('stokMin').value)||0,supplier:$('supplier').value.trim(),supplierKontak:$('supplierKontak').value.trim(),hargaTerakhir:Number($('hargaTerakhir').value)||0,tanggalBeli:$('tanggalBeli').value,forSale:$('forSale').checked,forPurchase:$('forPurchase').checked}}
async function saveProduct(){
  let x=productFromForm();
  if(!x.kode||!x.nama)return toast('Kode dan nama produk wajib diisi');
  let dup=state.produk.find(p=>String(p.kode).toLowerCase()===x.kode.toLowerCase()&&String(p.id)!==String(x.id));
  if(dup)return toast(`Kode ${x.kode} sudah dipakai oleh ${dup.nama}`);

  // Hindari klik ganda dan berikan feedback instan saat request ke Google dimulai.
  const btn=document.getElementById('saveProductBtn');
  const oldText=btn?.textContent;
  if(btn){btn.disabled=true;btn.classList.add('is-loading');btn.textContent='Menyimpan…';}
  try{
    let r=await api('saveProduct',{item:x});
    if(!r.ok)return toast('Gagal: '+r.error);

    // Update hanya produk yang berubah. Tidak perlu meminta ulang seluruh 8 sheet.
    const saved=r.data?.product||x;
    const idx=state.produk.findIndex(p=>String(p.id)===String(saved.id));
    if(idx>=0)state.produk[idx]=saved;else state.produk.push(saved);
    currentId=saved.id;
    fillProduct(saved);
    renderProducts();
    renderStock();
    toast('Produk tersimpan ✓');
  }finally{
    if(btn){btn.disabled=false;btn.classList.remove('is-loading');btn.textContent=oldText||'Simpan';}
  }
}
function renderProducts(){let q=($('search').value||'').toLowerCase();let a=state.produk.filter(x=>(x.kode+' '+x.nama).toLowerCase().includes(q));$('productList').innerHTML=a.map(x=>`<div class="product ${String(x.id)===String(currentId)?'active':''}" onclick="selectProduct('${esc(x.id)}')"><b>${esc(x.nama)}</b><small>${esc(x.kode)} · ${stockFor(activePT,x.kode).toLocaleString('id-ID')} ${esc(x.satuan||'')}</small></div>`).join('')||'<p class="muted">Belum ada produk.</p>'}
function selectProduct(id){currentId=id;let x=state.produk.find(a=>String(a.id)===String(id));if(x){fillProduct(x);showPage('produk')}}
function openModal(t,b){$('modalTitle').textContent=t;$('modalBody').innerHTML=b;$('modal').classList.remove('hidden')}function closeModal(){$('modal').classList.add('hidden')}
function productOptions(selected=''){return state.produk.map(p=>`<option value="${esc(p.kode)}" ${String(p.kode)===String(selected)?'selected':''}>${esc(p.kode)} — ${esc(p.nama)}</option>`).join('')}
function projectOptions(selected='',ptId=activePT){return state.proyek.filter(p=>String(p.ptId)===String(ptId)).map(p=>`<option value="${esc(p.id)}" ${String(p.id)===String(selected)?'selected':''}>${esc(p.kode)} — ${esc(p.nama)}</option>`).join('')}
function ptOptions(selected=activePT,includeActive=true){return companies.filter(c=>includeActive||c.id!==activePT).map(c=>`<option value="${c.id}" ${c.id===selected?'selected':''}>${esc(c.nama)}</option>`).join('')}

function normalizeItems(v){
  if(Array.isArray(v)) return v;
  if(v===null || v===undefined || String(v).trim()==='') return [];
  try{
    const p=JSON.parse(String(v));
    return Array.isArray(p)?p:[];
  }catch(e){return [];}
}

function itemRows(items=[],mode='PO'){return items.map(x=>`<div class="item"><select class="ikode">${productOptions(x.kode)}</select><input class="iqty" type="number" min="0" value="${x.qty||1}">${mode==='PO'?`<input class="iharga" type="number" value="${x.harga||0}"><input class="itotal" readonly value="${x.qty*x.harga||0}">`:'<span></span><span></span>'}<button type="button" onclick="this.parentElement.remove()">×</button></div>`).join('')}
function newPO(id=''){let x=state.po.find(a=>a.id===id)||{id:'',no:'PO-'+new Date().getFullYear()+'-'+String(state.po.length+1).padStart(4,'0'),tanggal:today(),ptId:activePT,supplier:'',alamat:'',keterangan:'',items:[]};openModal(id?'Edit PO':'Buat Purchase Order',`<div class="form"><div class="formgrid"><label>PT Pembelian<select id="fpt">${ptOptions(x.ptId)}</select></label><label>No. PO<input id="fno" value="${esc(x.no)}"></label><label>Tanggal<input id="ftanggal" type="date" value="${x.tanggal}"></label><label>Supplier<input id="fsupplier" value="${esc(x.supplier)}"></label><label>Alamat Supplier<input id="falamat" value="${esc(x.alamat)}"></label><label class="full">Keterangan<textarea id="fket">${esc(x.keterangan)}</textarea></label></div><div class="items"><b>Barang</b><div class="item"><b>Kode</b><b>Qty</b><b>Harga</b><b>Total</b><span></span></div><div id="poItems">${itemRows(x.items)}</div><button class="btn light" onclick="addPOItem()">＋ Tambah Barang</button></div><div class="formfoot"><button class="btn light" onclick="closeModal()">Batal</button><button class="btn gold" onclick="savePO('${esc(x.id)}')">Simpan</button></div></div>`)}
function addPOItem(){let d=document.createElement('div');d.className='item';d.innerHTML=`<select class="ikode">${productOptions()}</select><input class="iqty" type="number" min="0" value="1"><input class="iharga" type="number" value="0"><input class="itotal" readonly value="0"><button type="button">×</button>`;d.querySelector('button').onclick=()=>d.remove();$('poItems').appendChild(d)}
async function savePO(id){let items=[...document.querySelectorAll('#poItems .item')].map(r=>({kode:r.querySelector('.ikode').value,qty:Number(r.querySelector('.iqty').value)||0,harga:Number(r.querySelector('.iharga').value)||0})).filter(x=>x.kode&&x.qty>0);let x={id:id||Date.now().toString(),ptId:$('fpt').value,no:$('fno').value,tanggal:$('ftanggal').value,supplier:$('fsupplier').value,alamat:$('falamat').value,keterangan:$('fket').value,items,total:items.reduce((a,b)=>a+b.qty*b.harga,0)};if(!x.supplier||!items.length)return toast('PT, supplier dan barang wajib diisi');let r=await api('savePO',{item:x});if(!r.ok)return toast('Gagal: '+r.error);state=r.data;closeModal();renderPO();toast('PO tersimpan')}
function renderPO(){$('poList').innerHTML=table(['No PO','Tanggal','PT','Supplier','Total','Aksi'],state.po.slice().reverse().map(x=>[esc(x.no),x.tanggal,esc(x.ptNama||x.ptId),esc(x.supplier),rupiah(x.total),`<button onclick="newPO('${esc(x.id)}')">Edit</button><button onclick="printPO('${esc(x.id)}')">Cetak</button>`]))}
function newSJ(id=''){
  let x=state.sj.find(a=>a.id===id)||{id:'',no:'SJ-'+new Date().getFullYear()+'-'+String(state.sj.length+1).padStart(4,'0'),tanggal:today(),ptId:activePT,po:'',tujuan:'',pengemudi:'',kendaraan:'',keterangan:'',items:[],penerima_nama:'',penerima_ttd:'',pengemudi_nama:'',pengemudi_ttd:'',mengetahui_nama:'',mengetahui_ttd:''};
  x={...x,items:normalizeItems(x.items||x.items_json)};
  currentId=x.id||'';window.__currentSJSignatures={penerima_nama:x.penerima_nama||'',penerima_ttd:x.penerima_ttd||'',pengemudi_nama:x.pengemudi_nama||x.pengemudi||'',pengemudi_ttd:x.pengemudi_ttd||'',mengetahui_nama:x.mengetahui_nama||'',mengetahui_ttd:x.mengetahui_ttd||''};
  openModal(id?'Edit Surat Jalan':'Buat Surat Jalan',`<div class="form"><div class="formgrid"><label>PT Pengirim<select id="spt">${ptOptions(x.ptId)}</select></label><label>No. Surat Jalan<input id="sno" value="${esc(x.no)}"></label><label>Tanggal<input id="stanggal" type="date" value="${x.tanggal}"></label><label>No. PO<input id="spo" value="${esc(x.po)}"></label><label>Tujuan<input id="stujuan" value="${esc(x.tujuan)}"></label><label>Pengemudi<input id="spengemudi" value="${esc(x.pengemudi)}"></label><label>No. Kendaraan<input id="skendaraan" value="${esc(x.kendaraan)}"></label><label class="full">Keterangan<textarea id="sket">${esc(x.keterangan)}</textarea></label></div><div class="items"><b>Barang</b><div class="item"><b>Kode</b><b>Qty</b><span></span><span></span><span></span></div><div id="sjItems">${itemRows(x.items,'SJ')}</div><button class="btn light" onclick="addSJItem()">＋ Tambah Barang</button></div><div id="sjSignatureSection">${signatureSection({...x,...window.__currentSJSignatures})}</div><div class="formfoot"><button class="btn light" onclick="closeModal()">Batal</button><button class="btn gold" onclick="saveSJ('${esc(x.id)}')">Simpan</button></div></div>`);
}
function addSJItem(){let d=document.createElement('div');d.className='item';d.innerHTML=`<select class="ikode">${productOptions()}</select><input class="iqty" type="number" min="0" value="1"><span></span><span></span><button type="button">×</button>`;d.querySelector('button').onclick=()=>d.remove();$('sjItems').appendChild(d)}
async function saveSJ(id){
  let items=[...document.querySelectorAll('#sjItems .item')].map(r=>({kode:r.querySelector('.ikode').value,qty:Number(r.querySelector('.iqty').value)||0})).filter(x=>x.kode&&x.qty>0);
  const sig=window.__currentSJSignatures||{};
  let x={id:id||Date.now().toString(),ptId:$('spt').value,no:$('sno').value,tanggal:$('stanggal').value,po:$('spo').value,tujuan:$('stujuan').value,pengemudi:$('spengemudi').value,kendaraan:$('skendaraan').value,keterangan:$('sket').value,items,penerima_nama:sig.penerima_nama||$('ttdPenerimaNama')?.value||'',penerima_ttd:sig.penerima_ttd||'',pengemudi_nama:sig.pengemudi_nama||$('spengemudi').value,pengemudi_ttd:sig.pengemudi_ttd||'',mengetahui_nama:sig.mengetahui_nama||$('ttdMengetahuiNama')?.value||'',mengetahui_ttd:sig.mengetahui_ttd||''};
  if(!x.tujuan||!items.length)return toast('PT, tujuan dan barang wajib diisi');
  let r=await api('saveSJ',{item:x});if(!r.ok)return toast('Gagal: '+r.error);state=r.data;closeModal();renderSJ();toast('Surat Jalan tersimpan ✓')
}
function renderSJ(){$('sjList').innerHTML=table(['No SJ','Tanggal','PT','Tujuan','PO','Aksi'],state.sj.slice().reverse().map(x=>[esc(x.no),x.tanggal,esc(x.ptNama||x.ptId),esc(x.tujuan),esc(x.po||'-'),`<button onclick="newSJ('${esc(x.id)}')">Edit</button><button onclick="printSJ('${esc(x.id)}')">Cetak</button>`]))}
function movement(type){let title=type==='MASUK'?'Barang Masuk ke '+company().short:'Barang Keluar dari '+company().short;openModal(title,`<div class="form"><div class="notice ${type==='MASUK'?'success':'warning'}"><b>${esc(company().nama)}</b> adalah PT yang akan menerima/mengeluarkan stok.</div><div class="formgrid"><label>Tanggal<input id="mtgl" type="date" value="${today()}"></label><label>Barang<select id="mkode">${productOptions()}</select></label><label>Qty<input id="mqty" type="number" min="0" value="1"></label><label>Referensi<input id="mref" placeholder="PO / SJ / Nota"></label><label class="full">Keterangan<input id="mket" placeholder="Contoh: penerimaan kabel LVTC"></label></div><div class="formfoot"><button class="btn light" onclick="closeModal()">Batal</button><button class="btn ${type==='MASUK'?'gold':'dark'}" onclick="saveMovement('${type}')">Simpan</button></div></div>`)}
async function saveMovement(type){let x={ptId:activePT,tanggal:$('mtgl').value,kode:$('mkode').value,qty:Number($('mqty').value)||0,ref:$('mref').value,keterangan:$('mket').value};if(!x.kode||x.qty<=0)return toast('Barang dan qty wajib diisi');let r=await api('movement',{type,item:x});if(!r.ok)return toast('Gagal: '+r.error);state=r.data;closeModal();renderStock();renderProducts();toast(type==='MASUK'?'Barang masuk dicatat':'Barang keluar dicatat')}
function transferPT(prefillKode=''){openModal('Transfer Antar PT',`<div class="form"><div class="notice warning"><b>Transfer Antar PT</b> tidak menghilangkan barang dari Group. Stok dipindahkan dari PT asal ke PT tujuan dan tercatat di riwayat mutasi.</div><div class="formgrid"><label>PT Asal<select id="fromPT">${ptOptions(activePT)}</select></label><label>PT Tujuan<select id="toPT">${ptOptions(companies.find(c=>c.id!==activePT)?.id||'ZMA')}</select></label><label class="full">Barang<select id="tpkode">${productOptions(prefillKode)}</select></label><label>Qty<input id="tpqty" type="number" min="0" value="1"></label><label>Referensi<input id="tpref" placeholder="Nomor surat jalan / memo"></label><label class="full">Keterangan<input id="tpket" placeholder="Pemindahan stok antar PT"></label></div><div id="tpInfo" class="notice success"></div><div class="formfoot"><button class="btn light" onclick="closeModal()">Batal</button><button class="btn transferpt" onclick="saveTransferPT()">⇄ Transfer</button></div></div>`);updateTransferInfo();$('fromPT').onchange=updateTransferInfo;$('toPT').onchange=updateTransferInfo;$('tpkode').onchange=updateTransferInfo}
function updateTransferInfo(){if(!$('tpInfo'))return;let from=$('fromPT').value,k=$('tpkode').value,p=state.produk.find(x=>x.kode===k);$('tpInfo').textContent=`Stok ${companyBy(from).short}: ${stockFor(from,k).toLocaleString('id-ID')} ${p?.satuan||''} · Tujuan: ${companyBy($('toPT').value).short}`}
function companyBy(id){return companies.find(c=>c.id===id)||companies[0]}
async function saveTransferPT(){let x={fromPtId:$('fromPT').value,toPtId:$('toPT').value,kode:$('tpkode').value,qty:Number($('tpqty').value)||0,ref:$('tpref').value,keterangan:$('tpket').value};if(x.fromPtId===x.toPtId||!x.kode||x.qty<=0)return toast('PT asal/tujuan, barang dan qty wajib benar');let r=await api('transferPT',{item:x});if(!r.ok)return toast('Gagal: '+r.error);state=r.data;closeModal();renderStock();renderProducts();toast('Stok berhasil dipindahkan antar PT')}
function transferProject(prefillKode=''){openModal('Transfer ke Proyek — '+company().short,`<div class="form"><div class="notice success">Stok gudang <b>${esc(company().short)}</b> akan berkurang dan stok proyek PT ini bertambah.</div><div class="formgrid"><label>Tanggal<input id="ptgl" type="date" value="${today()}"></label><label>Proyek<select id="pproyek">${projectOptions()}</select></label><label>Barang<select id="pkode">${productOptions(prefillKode)}</select></label><label>Qty<input id="pqty" type="number" min="0" value="1"></label><label>No. Surat Jalan<input id="psj"></label><label>Keterangan<input id="pket" placeholder="Material dikirim ke proyek"></label></div><div class="formfoot"><button class="btn light" onclick="closeModal()">Batal</button><button class="btn gold" onclick="saveTransferProject()">Transfer ke Proyek</button></div></div>`)}
async function saveTransferProject(){let x={ptId:activePT,tanggal:$('ptgl').value,proyekId:$('pproyek').value,kode:$('pkode').value,qty:Number($('pqty').value)||0,noSJ:$('psj').value,keterangan:$('pket').value};if(!x.proyekId||!x.kode||x.qty<=0)return toast('Proyek, barang dan qty wajib diisi');let r=await api('transferProject',{item:x});if(!r.ok)return toast('Gagal: '+r.error);state=r.data;closeModal();renderStock();renderProducts();renderProjects();toast('Material ditransfer ke proyek')}
function useProject(prefillPid='',prefillKode=''){openModal('Pemakaian Material di Proyek — '+company().short,`<div class="form"><div class="formgrid"><label>Tanggal<input id="utgl" type="date" value="${today()}"></label><label>Proyek<select id="uproyek">${projectOptions(prefillPid)}</select></label><label>Barang<select id="ukode">${productOptions(prefillKode)}</select></label><label>Qty Dipakai<input id="uqty" type="number" min="0" value="1"></label><label class="full">Keterangan<input id="uket" placeholder="Material terpasang/terpakai di lapangan"></label></div><div class="formfoot"><button class="btn light" onclick="closeModal()">Batal</button><button class="btn project" onclick="saveUseProject()">Catat Pemakaian</button></div></div>`)}
async function saveUseProject(){let x={ptId:activePT,tanggal:$('utgl').value,proyekId:$('uproyek').value,kode:$('ukode').value,qty:Number($('uqty').value)||0,keterangan:$('uket').value};if(!x.proyekId||!x.kode||x.qty<=0)return toast('Proyek, barang dan qty wajib diisi');let r=await api('useProject',{item:x});if(!r.ok)return toast('Gagal: '+r.error);state=r.data;closeModal();renderStock();renderProducts();renderProjects();toast('Pemakaian material dicatat')}
function returnProject(prefillPid='',prefillKode=''){openModal('Barang Kembali dari Proyek — '+company().short,`<div class="form"><div class="notice return-notice">Material kembali dari proyek akan mengurangi stok proyek dan menambah stok <b>${esc(company().short)}</b>.</div><div class="formgrid"><label>Tanggal<input id="rtgl" type="date" value="${today()}"></label><label>Proyek<select id="rproyek">${projectOptions(prefillPid)}</select></label><label>Barang<select id="rkode">${productOptions(prefillKode)}</select></label><label>Qty Kembali<input id="rqty" type="number" min="0" value="1"></label><label>No. Surat Jalan<input id="rsj"></label><label>Keterangan<input id="rket" placeholder="Material sisa pekerjaan"></label></div><div class="formfoot"><button class="btn light" onclick="closeModal()">Batal</button><button class="btn return" onclick="saveReturn()">Kembalikan ke Gudang</button></div></div>`)}
async function saveReturn(){let x={ptId:activePT,tanggal:$('rtgl').value,proyekId:$('rproyek').value,kode:$('rkode').value,qty:Number($('rqty').value)||0,noSJ:$('rsj').value,keterangan:$('rket').value};if(!x.proyekId||!x.kode||x.qty<=0)return toast('Proyek, barang dan qty wajib diisi');let r=await api('returnProject',{item:x});if(!r.ok)return toast('Gagal: '+r.error);state=r.data;closeModal();renderStock();renderProducts();renderProjects();toast('Barang kembali ke gudang')}
function renderStock(){
  const activeRows=state.stokPT.filter(s=>String(s.ptId)===String(activePT));const totalPT=activeRows.reduce((a,b)=>a+Number(b.qty||0),0),totalGroup=state.stokPT.reduce((a,b)=>a+Number(b.qty||0),0),totalProj=state.stokProyek.filter(s=>String(s.ptId)===String(activePT)).reduce((a,b)=>a+Number(b.qty||0),0);
  $('sumGudang').textContent=totalPT.toLocaleString('id-ID');$('sumGroup').textContent=totalGroup.toLocaleString('id-ID');$('sumProyek').textContent=totalProj.toLocaleString('id-ID');$('sumProjects').textContent=state.proyek.filter(p=>String(p.ptId)===String(activePT)).length.toLocaleString('id-ID');$('stockCompanyName').textContent=company().nama;
  const rows=state.produk.map(p=>{let q=stockFor(activePT,p.kode);return[p.kode,esc(p.nama),q.toLocaleString('id-ID'),esc(p.satuan||''),Number(p.stokMin||0).toLocaleString('id-ID'),q<=Number(p.stokMin||0)?'<span class="badge danger-badge">Menipis</span>':'<span class="badge">Aman</span>',`<button onclick="transferProject('${esc(p.kode)}')">Transfer Proyek</button>`]});$('stockGudangPane').innerHTML=table(['Kode','Produk','Stok PT','Satuan','Minimum','Status','Aksi'],rows);
  $('stockGroupPane').innerHTML=renderGroupTable();$('stockProyekPane').innerHTML=renderProjectStockTable();$('stockMutasiPane').innerHTML=table(['Waktu','Jenis','PT Asal','PT Tujuan','Proyek','Barang','Qty','Keterangan'],state.mutasi.slice().reverse().map(x=>[x.waktu||'',esc(x.type||''),esc(x.ptAsal||''),esc(x.ptTujuan||''),esc(x.proyek||''),esc(x.nama||''),Number(x.qty||0).toLocaleString('id-ID'),esc(x.keterangan||'')]));
}
function renderGroupTable(){return table(['Kode','Produk','Fadhilah','Zahra','Rizky','Total'],state.produk.map(p=>{let a=stockFor('FMA',p.kode),b=stockFor('ZMA',p.kode),c=stockFor('RMA',p.kode);return[p.kode,esc(p.nama),a.toLocaleString('id-ID'),b.toLocaleString('id-ID'),c.toLocaleString('id-ID'),(a+b+c).toLocaleString('id-ID')] }))}
function renderProjectStockTable(){let rows=state.stokProyek.filter(x=>String(x.ptId)===String(activePT)&&Number(x.qty||0)>0);if(!rows.length)return '<div class="empty">Belum ada material yang berada di proyek PT aktif.</div>';return table(['PT','Proyek','Kode','Produk','Qty','Satuan','Aksi'],rows.map(x=>{let p=state.produk.find(a=>String(a.kode)===String(x.kode))||{};return[esc(x.ptNama||''),esc(x.proyek||''),esc(x.kode),esc(p.nama||x.nama||''),Number(x.qty||0).toLocaleString('id-ID'),esc(p.satuan||x.satuan||''),`<button onclick="useProject('${esc(x.proyekId)}','${esc(x.kode)}')">Pakai</button><button onclick="returnProject('${esc(x.proyekId)}','${esc(x.kode)}')">Kembali</button>`]}))}
function newProject(id=''){let x=state.proyek.find(a=>String(a.id)===String(id))||{id:'',kode:'PRJ-'+String(state.proyek.length+1).padStart(3,'0'),nama:'',ptId:activePT,lokasi:'',pic:'',keterangan:''};openModal(id?'Edit Proyek':'Proyek Baru',`<div class="form"><div class="formgrid"><label>PT Pemilik<select id="prjPT">${ptOptions(x.ptId)}</select></label><label>Kode Proyek<input id="prjKode" value="${esc(x.kode)}"></label><label>Nama Proyek<input id="prjNama" value="${esc(x.nama)}" placeholder="Highmast Tlogosari"></label><label>Lokasi<input id="prjLokasi" value="${esc(x.lokasi)}"></label><label>Penanggung Jawab<input id="prjPic" value="${esc(x.pic)}"></label><label class="full">Keterangan<textarea id="prjKet">${esc(x.keterangan)}</textarea></label></div><div class="formfoot"><button class="btn light" onclick="closeModal()">Batal</button><button class="btn gold" onclick="saveProject('${esc(x.id)}')">Simpan</button></div></div>`)}
async function saveProject(id){let x={id:id||Date.now().toString(),ptId:$('prjPT').value,kode:$('prjKode').value.trim(),nama:$('prjNama').value.trim(),lokasi:$('prjLokasi').value.trim(),pic:$('prjPic').value.trim(),keterangan:$('prjKet').value};if(!x.kode||!x.nama)return toast('PT, kode dan nama proyek wajib diisi');let r=await api('saveProject',{item:x});if(!r.ok)return toast('Gagal: '+r.error);state=r.data;closeModal();renderProjects();renderStock();toast('Proyek tersimpan')}
function renderProjects(){let list=state.proyek.filter(p=>String(p.ptId)===String(activePT));if(!list.length){$('projectList').innerHTML='<div class="empty">Belum ada proyek untuk '+esc(company().nama)+'.</div>';return}$('projectList').innerHTML=list.map(p=>{let materials=state.stokProyek.filter(s=>String(s.proyekId)===String(p.id)&&Number(s.qty||0)>0);return`<div class="project-card"><div><div class="project-code">${esc(p.kode)} · ${esc(p.ptKode||'')}</div><h3>${esc(p.nama)}</h3><p>${esc(p.lokasi||'')} ${p.pic?' · PIC: '+esc(p.pic):''}</p></div><div class="project-stock"><b>${materials.reduce((a,b)=>a+Number(b.qty||0),0).toLocaleString('id-ID')}</b><span>qty di proyek</span></div><div class="project-actions"><button onclick="newProject('${esc(p.id)}')">Edit</button><button onclick="openProjectReport('${esc(p.id)}')">Lihat Material</button></div></div>`}).join('')}
function openProjectReport(pid){let p=state.proyek.find(x=>String(x.id)===String(pid)),rows=state.stokProyek.filter(x=>String(x.proyekId)===String(pid)&&Number(x.qty||0)>0);openModal('Material — '+esc(p?.nama||''),`<div class="form"><div class="project-report-head"><b>${esc(p?.ptNama||'')}</b><span>${esc(p?.lokasi||'')}</span></div>${table(['Kode','Produk','Qty','Satuan'],rows.map(x=>{let pr=state.produk.find(a=>String(a.kode)===String(x.kode))||{};return[esc(x.kode),esc(pr.nama||x.nama||''),Number(x.qty||0).toLocaleString('id-ID'),esc(pr.satuan||x.satuan||'')]}))}<div class="formfoot"><button class="btn light" onclick="closeModal()">Tutup</button></div></div>`)}
function table(h,rows){return`<div class="table-wrap"><table class="table"><thead><tr>${h.map(x=>`<th>${x}</th>`).join('')}</tr></thead><tbody>${rows.length?rows.map(r=>`<tr>${r.map(x=>`<td>${x??''}</td>`).join('')}</tr>`).join(''):`<tr><td colspan="${h.length}" class="empty">Belum ada data.</td></tr>`}</tbody></table></div>`}
function printPO(id){let x=state.po.find(a=>String(a.id)===String(id));if(x)printDoc('PURCHASE ORDER',x,true)}function printSJ(id){let x=state.sj.find(a=>String(a.id)===String(id));if(x){x={...x,items:normalizeItems(x.items||x.items_json)};printDoc('SURAT JALAN',x,false)}}
function printDoc(title,x,isPO){
  let rows=normalizeItems(x.items||x.items_json).map((i,n)=>{let p=state.produk.find(a=>a.kode===i.kode)||{};return`<tr><td>${n+1}</td><td>${esc(i.kode)}</td><td>${esc(p.nama||'')}</td><td>${i.qty}</td>${isPO?`<td>${rupiah(i.harga)}</td><td>${rupiah(i.qty*i.harga)}</td>`:''}</tr>`}).join('');
  const sig=(role,label)=>{const data=sigVal(x,role),name=sigName(x,role);return`<div class="signbox"><div class="siglabel">${label}</div><div class="sigimg">${data?`<img src="${esc(data)}">`:''}</div><div class="sigline">${esc(name||'')}</div></div>`};
  let w=open('','_blank');
  w.document.write(`<html><head><title>${title}</title><style>body{font:14px Arial;padding:35px;color:#111}h1{margin-bottom:2px}table{width:100%;border-collapse:collapse;margin-top:25px}th,td{border:1px solid #aaa;padding:8px}th{background:#eee}.head{display:flex;justify-content:space-between;border-bottom:2px solid #222;padding-bottom:15px}.sign{display:grid;grid-template-columns:repeat(${isPO?2:3},1fr);gap:35px;margin-top:55px;text-align:center}.signbox{min-height:150px}.siglabel{font-weight:700;margin-bottom:8px}.sigimg{height:75px;display:flex;align-items:center;justify-content:center}.sigimg img{max-width:180px;max-height:70px;object-fit:contain}.sigline{border-top:1px solid #222;padding-top:6px;min-height:18px}.note{font-size:11px;color:#666;margin-top:25px}</style></head><body><div class="head"><div><h1>MAJU ABADI GROUP</h1><b>${title}</b><br>${esc(x.ptNama||'')}</div><div><b>${esc(x.no)}</b><br>${esc(x.tanggal)}</div></div><p>${isPO?'Supplier':'Tujuan'}: <b>${esc(x.supplier||x.tujuan)}</b></p>${!isPO?`<p>Pengemudi: ${esc(x.pengemudi)} &nbsp; Kendaraan: ${esc(x.kendaraan)}</p>`:''}<table><tr><th>No</th><th>Kode</th><th>Nama Barang</th><th>Qty</th>${isPO?'<th>Harga</th><th>Total</th>':''}</tr>${rows}</table>${isPO?`<h3 style="text-align:right">TOTAL ${rupiah(x.total)}</h3>`:''}<p>Keterangan: ${esc(x.keterangan)}</p><div class="sign">${isPO?`<div class="signbox"><div class="siglabel">Penerima</div><div class="sigimg"></div><div class="sigline"></div></div><div class="signbox"><div class="siglabel">Mengetahui</div><div class="sigimg"></div><div class="sigline"></div></div>`:sig('penerima','Penerima')+sig('pengemudi','Pengemudi')+sig('mengetahui','Mengetahui')}</div>${!isPO?'<div class="note">Tanda tangan dibuat secara elektronik pada aplikasi gudang Maju Abadi Group.</div>':''}<script>onload=()=>print()<\/script></body></html>`);w.document.close()
}
async function api(action,data={}){try{let u=new URL(API_URL);u.searchParams.set('action',action);Object.entries(data).forEach(([k,v])=>u.searchParams.set(k,typeof v==='object'?JSON.stringify(v):v));let r=await fetch(u,{cache:'no-store'});return await r.json()}catch(e){return{ok:false,error:e.message||String(e)}}}
async function loadData(){try{let r=await api('all');if(!r.ok)throw Error(r.error||'Database gagal');state=r.data||state;
      state.sj=(state.sj||[]).map(x=>({...x,items:normalizeItems(x.items||x.items_json),penerima_nama:x.penerima_nama||'',penerima_ttd:x.penerima_ttd||'',pengemudi_nama:x.pengemudi_nama||x.pengemudi||'',pengemudi_ttd:x.pengemudi_ttd||'',mengetahui_nama:x.mengetahui_nama||'',mengetahui_ttd:x.mengetahui_ttd||''}));
      state.po=(state.po||[]).map(x=>({...x,items:normalizeItems(x.items||x.items_json)}));
      renderCompanySwitch();
      if(APP_MODE==='core'){
        renderProducts(); renderStock(); renderProjects();
      }else if(APP_MODE==='po'){
        renderPO();
      }else if(APP_MODE==='sj'){
        renderSJ();
      }
      $('status').textContent='● Google Sheets';}catch(e){$('status').textContent='● Database Error';toast('Database: '+e.message)}}
setupSignatureCanvas();loadData();

(function(){
  const keep=APP_MODE==='core'?['produk','stok','proyek']:[APP_MODE];
  document.querySelectorAll('.nav[data-page]').forEach(b=>{b.style.display=keep.includes(b.dataset.page)?'inline-flex':'none';});
  if(APP_MODE!=='core'){const sb=document.querySelector('.sidebar');if(sb)sb.style.display='none';}
  showPage(keep[0]);
})();

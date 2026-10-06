/******************************************************
 * SISTEM PERMOHONAN DANA - GOOGLE APPS SCRIPT
 * Database: Google Sheets
 * Storage: Google Drive
 *
 * Versi ini mendukung rincian item dinamis:
 * No | Keterangan / Item | Harga
 * Total dihitung otomatis dari semua harga item.
 ******************************************************/
const CONFIG = {
  SPREADSHEET_ID: '1I1tKnG7IRtWPRmbGWXPEEiqmXPBv8S4VLyJbm0bSuxs',
  SHEET_NAME: 'Permohonan Dana',
  DRIVE_FOLDER_ID: '',
  ADMIN_PIN: '123456',
  // Tidak ada batas jumlah gambar. Ukuran dibatasi per file agar upload tetap aman/stabil.
  MAX_FILE_BYTES: 10 * 1024 * 1024
};

const HEADERS = ['ID','No Pengajuan','Nama Pemohon','Departemen','Judul','Kategori','Jumlah','Keterangan','Status','Bukti URL','Nama File Bukti','Catatan Keuangan','Disetujui Oleh','Tanggal Persetujuan','Tanggal Dibuat','Tanggal Diperbarui','Items JSON'];

function doGet(){ return json_({ok:true,service:'Permohonan Dana API',version:'2.0'}); }
function doPost(e){
  try{
    const p=JSON.parse(e.postData.contents||'{}');
    switch(p.action){
      case 'listRequests': return json_({ok:true,data:listRequests_()});
      case 'createRequest': return json_(createRequest_(p));
      case 'uploadItemImage': return json_(uploadItemImage_(p));
      case 'deleteItemImage': return json_(deleteItemImage_(p));
      case 'getRequest': return json_(getRequest_(p.id));
      case 'adminCheck': return json_({ok:true,authorized:String(p.pin||'')===String(CONFIG.ADMIN_PIN)});
      case 'updateStatus': return json_(updateStatus_(p));
      case 'updateRequest': return json_(updateRequest_(p));
      case 'deleteRequest': return json_(deleteRequest_(p));
      case 'monthlyRecap': return json_({ok:true,data:getMonthlyRecap_(p.month)});
      default: return json_({ok:false,message:'Action tidak dikenal.'});
    }
  }catch(err){return json_({ok:false,message:err.message||String(err)});}
}
function json_(obj){return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);}
function sheet_(){
  if(CONFIG.SPREADSHEET_ID==='PASTE_SPREADSHEET_ID_HERE') throw new Error('SPREADSHEET_ID belum diisi pada Code.gs.');
  const ss=SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);let sh=ss.getSheetByName(CONFIG.SHEET_NAME);if(!sh)sh=ss.insertSheet(CONFIG.SHEET_NAME);ensureHeaders_(sh);return sh;
}
function ensureHeaders_(sh){
  if(sh.getLastRow()===0){sh.getRange(1,1,1,HEADERS.length).setValues([HEADERS]);}
  else{
    const width=Math.max(sh.getLastColumn(),HEADERS.length);
    const current=sh.getRange(1,1,1,width).getValues()[0];
    let changed=false;
    HEADERS.forEach((h,i)=>{if(current[i]!==h){sh.getRange(1,i+1).setValue(h);changed=true;}});
  }
  sh.setFrozenRows(1);sh.getRange(1,1,1,HEADERS.length).setFontWeight('bold');
}
function listRequests_(){const sh=sheet_(),last=sh.getLastRow();if(last<2)return [];const vals=sh.getRange(2,1,last-1,HEADERS.length).getValues();return vals.map(rowToObj_).filter(x=>x.id).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));}
function parseItems_(raw){
  if(!raw)return [];
  try{
    const parsed=typeof raw==='string'?JSON.parse(raw):raw;
    return Array.isArray(parsed)?parsed.map(x=>({
      description:String(x.description||'').trim(),
      price:Number(x.price)||0,
      images:Array.isArray(x.images)?x.images.map(img=>({
        id:String(img.id||''),
        name:String(img.name||''),
        url:String(img.url||''),
        type:String(img.type||'')
      })).filter(img=>img.url):[]
    })).filter(x=>x.description):[];
  }catch(e){return []}
}
function rowToObj_(r){
  return {
    id:String(r[0]||''),request_number:String(r[1]||''),name:String(r[2]||''),department:String(r[3]||''),title:String(r[4]||''),category:String(r[5]||''),amount:Number(r[6]||0),description:String(r[7]||''),status:String(r[8]||'pending'),receipt_url:String(r[9]||''),receipt_filename:String(r[10]||''),finance_note:String(r[11]||''),approved_by:String(r[12]||''),approved_at:r[13]?new Date(r[13]).toISOString():'',created_at:r[14]?new Date(r[14]).toISOString():'',updated_at:r[15]?new Date(r[15]).toISOString():'',items:parseItems_(r[16])
  };
}
function createRequest_(p){
  const name=String(p.name||'').trim(),title=String(p.title||'').trim();
  if(!name)throw new Error('Nama pemohon wajib diisi.');
  if(!title)throw new Error('Judul wajib diisi.');
  let items=parseItems_(p.items);
  if(!items.length)throw new Error('Minimal 1 item harus ditambahkan.');
  if(items.some(x=>!x.description))throw new Error('Keterangan semua item wajib diisi.');
  if(items.some(x=>!(x.price>0)))throw new Error('Harga setiap item harus lebih dari Rp0.');
  items=items.map(x=>({description:x.description,price:x.price,images:[]}));
  const amount=items.reduce((sum,x)=>sum+x.price,0);
  if(!(amount>0))throw new Error('Total jumlah dana tidak valid.');
  let receiptUrl='',receiptName='';
  if(p.receipt&&p.receipt.data){
    const bytes=Utilities.base64Decode(p.receipt.data);
    if(bytes.length>CONFIG.MAX_FILE_BYTES)throw new Error('File terlalu besar.');
    const folder=getFolder_();
    const safeName=Date.now()+'_'+String(p.receipt.name||'bukti').replace(/[^a-zA-Z0-9._-]/g,'_');
    const blob=Utilities.newBlob(bytes,p.receipt.type||MimeType.PLAIN_TEXT,safeName);
    const file=folder.createFile(blob);file.setSharing(DriveApp.Access.ANYONE_WITH_LINK,DriveApp.Permission.VIEW);
    receiptUrl='https://drive.google.com/uc?export=view&id='+file.getId();receiptName=p.receipt.name||safeName;
  }
  const sh=sheet_(),now=new Date(),id=Utilities.getUuid(),number=nextNumber_(sh);
  sh.appendRow([id,number,name,String(p.department||''),title,String(p.category||'operasional'),amount,String(p.description||''),'pending',receiptUrl,receiptName,'','','',now,now,JSON.stringify(items)]);
  return {ok:true,id,request_number:number,amount,items};
}
function findRequestRow_(id){
  const sh=sheet_(),last=sh.getLastRow();
  if(last<2)throw new Error('Data belum tersedia.');
  const vals=sh.getRange(2,1,last-1,HEADERS.length).getValues();
  for(let i=0;i<vals.length;i++){
    if(String(vals[i][0])===String(id))return {sh,row:i+2,values:vals[i]};
  }
  throw new Error('Permohonan tidak ditemukan.');
}
function uploadItemImage_(p){
  const id=String(p.id||'').trim();
  const itemIndex=Number(p.item_index);
  if(!id)throw new Error('ID permohonan tidak valid.');
  if(!Number.isInteger(itemIndex)||itemIndex<0)throw new Error('Nomor item tidak valid.');
  if(!p.file||!p.file.data)throw new Error('File gambar tidak ditemukan.');
  const decoded=Utilities.base64Decode(String(p.file.data));
  if(decoded.length>CONFIG.MAX_FILE_BYTES)throw new Error('Ukuran file maksimal '+Math.round(CONFIG.MAX_FILE_BYTES/1024/1024)+' MB per gambar.');
  const found=findRequestRow_(id), items=parseItems_(found.values[16]);
  if(!items[itemIndex])throw new Error('Item tidak ditemukan.');
  const type=String(p.file.type||'image/jpeg').toLowerCase();
  if(['image/jpeg','image/png','image/webp','image/gif'].indexOf(type)<0)throw new Error('File harus berupa JPG, PNG, WEBP, atau GIF.');
  const originalName=String(p.file.name||('bukti-'+Date.now()+'.jpg'));
  const safeName=Date.now()+'_'+String(itemIndex+1)+'_'+originalName.replace(/[^a-zA-Z0-9._-]/g,'_');
  const blob=Utilities.newBlob(decoded,type,safeName);
  const folder=getRequestFolder_(found.values[1]);
  const file=folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK,DriveApp.Permission.VIEW);
  const image={id:file.getId(),name:originalName,url:'https://drive.google.com/uc?export=view&id='+file.getId(),type:type};
  items[itemIndex].images=items[itemIndex].images||[];
  items[itemIndex].images.push(image);
  found.sh.getRange(found.row,17).setValue(JSON.stringify(items));
  found.sh.getRange(found.row,16).setValue(new Date());
  return {ok:true,id, item_index:itemIndex, image:image, images:items[itemIndex].images};
}
function deleteItemImage_(p){
  const id=String(p.id||'').trim(), itemIndex=Number(p.item_index), imageId=String(p.image_id||'').trim();
  if(!id||!Number.isInteger(itemIndex)||itemIndex<0||!imageId)throw new Error('Data gambar tidak valid.');
  const found=findRequestRow_(id), items=parseItems_(found.values[16]);
  if(!items[itemIndex])throw new Error('Item tidak ditemukan.');
  const image=items[itemIndex].images.find(x=>x.id===imageId);
  if(!image)throw new Error('Gambar tidak ditemukan.');
  try{DriveApp.getFileById(imageId).setTrashed(true);}catch(e){}
  items[itemIndex].images=items[itemIndex].images.filter(x=>x.id!==imageId);
  found.sh.getRange(found.row,17).setValue(JSON.stringify(items));
  found.sh.getRange(found.row,16).setValue(new Date());
  return {ok:true,images:items[itemIndex].images};
}
function getRequestFolder_(requestNumber){
  const root=getFolder_();
  const name='Bukti '+String(requestNumber||'Permohonan');
  const existing=root.getFoldersByName(name);
  return existing.hasNext()?existing.next():root.createFolder(name);
}
function nextNumber_(sh){const year=Utilities.formatDate(new Date(),Session.getScriptTimeZone()||'Asia/Jakarta','yyyy');const prefix='PD-'+year+'-';const last=sh.getLastRow();if(last<2)return prefix+'00001';const nums=sh.getRange(2,2,last-1,1).getValues().map(x=>String(x[0])).filter(x=>x.indexOf(prefix)===0).map(x=>Number(x.slice(prefix.length))||0);return prefix+String((nums.length?Math.max.apply(null,nums):0)+1).padStart(5,'0');}
function getRequest_(id){const r=listRequests_().find(x=>x.id===String(id));if(!r)throw new Error('Permohonan tidak ditemukan.');return {ok:true,data:r};}
function updateStatus_(p){
  if(String(p.pin||'')!==String(CONFIG.ADMIN_PIN))throw new Error('Akses keuangan ditolak.');
  const allowed=['pending','approved','rejected','paid'];
  if(allowed.indexOf(String(p.status))<0)throw new Error('Status tidak valid.');
  const found=findRequestRow_(p.id), now=new Date();
  found.sh.getRange(found.row,9).setValue(String(p.status));
  if(p.finance_note!==undefined)found.sh.getRange(found.row,12).setValue(String(p.finance_note||''));
  if(p.status==='approved'||p.status==='rejected'){
    found.sh.getRange(found.row,13).setValue('Panel Keuangan');
    found.sh.getRange(found.row,14).setValue(now);
  }
  if(p.status==='pending'){
    found.sh.getRange(found.row,13).setValue('');
    found.sh.getRange(found.row,14).setValue('');
  }
  found.sh.getRange(found.row,16).setValue(now);
  return {ok:true,status:String(p.status)};
}
function validateRequestPayload_(p){
  const name=String(p.name||'').trim(), title=String(p.title||'').trim();
  if(!name)throw new Error('Nama pemohon wajib diisi.');
  if(!title)throw new Error('Judul wajib diisi.');
  const items=parseItems_(p.items);
  if(!items.length)throw new Error('Minimal 1 item harus ditambahkan.');
  if(items.some(x=>!x.description))throw new Error('Keterangan semua item wajib diisi.');
  if(items.some(x=>!(x.price>0)))throw new Error('Harga setiap item harus lebih dari Rp0.');
  const amount=items.reduce((sum,x)=>sum+x.price,0);
  if(!(amount>0))throw new Error('Total jumlah dana tidak valid.');
  return {name,title,items,amount};
}
function updateRequest_(p){
  if(String(p.pin||'')!==String(CONFIG.ADMIN_PIN))throw new Error('Akses keuangan ditolak.');
  const found=findRequestRow_(p.id), data=validateRequestPayload_(p), oldItems=parseItems_(found.values[16]);
  const items=data.items.map((x,i)=>({description:x.description,price:x.price,images:Array.isArray(x.images)?x.images:((oldItems[i]&&oldItems[i].images)||[])}));
  const kept={}; items.forEach(item=>(item.images||[]).forEach(img=>kept[String(img.id)]=true));
  oldItems.forEach(item=>(item.images||[]).forEach(img=>{if(img.id&&!kept[String(img.id)])trashDriveFile_(img.id);}));
  found.sh.getRange(found.row,3,1,6).setValues([[data.name,String(p.department||''),data.title,String(p.category||'operasional'),data.amount,String(p.description||'')]]);
  found.sh.getRange(found.row,17).setValue(JSON.stringify(items));
  found.sh.getRange(found.row,16).setValue(new Date());
  return {ok:true,id:String(p.id),amount:data.amount,items:items};
}
function trashDriveFile_(fileId){try{DriveApp.getFileById(String(fileId)).setTrashed(true);}catch(e){}}
function extractDriveId_(url){const m=String(url||'').match(/[?&]id=([^&]+)/);return m?m[1]:'';}
function deleteRequest_(p){
  if(String(p.pin||'')!==String(CONFIG.ADMIN_PIN))throw new Error('Akses keuangan ditolak.');
  const found=findRequestRow_(p.id), values=found.values;
  trashDriveFile_(extractDriveId_(values[9]));
  parseItems_(values[16]).forEach(item=>(item.images||[]).forEach(img=>trashDriveFile_(img.id)));
  found.sh.deleteRow(found.row);
  return {ok:true,id:String(p.id)};
}
function getMonthlyRecap_(month){
  const tz=Session.getScriptTimeZone()||'Asia/Jakarta';
  const target=String(month||Utilities.formatDate(new Date(),tz,'yyyy-MM'));
  if(!/^\d{4}-\d{2}$/.test(target))throw new Error('Format bulan tidak valid.');
  const rows=listRequests_().filter(r=>r.created_at && Utilities.formatDate(new Date(r.created_at),tz,'yyyy-MM')===target);
  const summary={month:target,total:rows.length,pending:0,approved:0,rejected:0,paid:0,total_amount:0,approved_amount:0,paid_amount:0,rejected_amount:0};
  rows.forEach(r=>{const a=Number(r.amount||0);summary[r.status]=(summary[r.status]||0)+1;summary.total_amount+=a;if(r.status==='approved')summary.approved_amount+=a;if(r.status==='paid')summary.paid_amount+=a;if(r.status==='rejected')summary.rejected_amount+=a;});
  return {summary,rows};
}
function getFolder_(){if(CONFIG.DRIVE_FOLDER_ID)return DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);const props=PropertiesService.getScriptProperties(),saved=props.getProperty('RECEIPT_FOLDER_ID');if(saved)return DriveApp.getFolderById(saved);const folder=DriveApp.createFolder('Permohonan Dana - Bukti');props.setProperty('RECEIPT_FOLDER_ID',folder.getId());return folder;}

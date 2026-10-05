/******************************************************
 * SISTEM PERMOHONAN DANA - GOOGLE APPS SCRIPT
 * Database: Google Sheets
 * Storage: Google Drive
 *
 * SETUP:
 * 1. Buat Google Spreadsheet baru.
 * 2. Extensions > Apps Script.
 * 3. Tempel seluruh file ini.
 * 4. Isi CONFIG.SPREADSHEET_ID dan CONFIG.ADMIN_PIN.
 * 5. Deploy > New deployment > Web app.
 *    Execute as: Me
 *    Who has access: Anyone
 * 6. Salin URL /exec ke API_URL pada script.js.
 ******************************************************/
const CONFIG = {
  SPREADSHEET_ID: '1I1tKnG7IRtWPRmbGWXPEEiqmXPBv8S4VLyJbm0bSuxs',
  SHEET_NAME: 'Permohonan Dana',
  DRIVE_FOLDER_ID: '', // Kosongkan untuk membuat folder otomatis.
  ADMIN_PIN: '123456',
  MAX_FILE_BYTES: 5 * 1024 * 1024
};

const HEADERS = ['ID','No Pengajuan','Nama Pemohon','Departemen','Judul','Kategori','Jumlah','Keterangan','Status','Bukti URL','Nama File Bukti','Catatan Keuangan','Disetujui Oleh','Tanggal Persetujuan','Tanggal Dibuat','Tanggal Diperbarui'];

function doGet(){ return json_({ok:true,service:'Permohonan Dana API',version:'1.0'}); }
function doPost(e){
  try{
    const p=JSON.parse(e.postData.contents||'{}');
    switch(p.action){
      case 'listRequests': return json_({ok:true,data:listRequests_()});
      case 'createRequest': return json_(createRequest_(p));
      case 'getRequest': return json_(getRequest_(p.id));
      case 'adminCheck': return json_({ok:true,authorized:String(p.pin||'')===String(CONFIG.ADMIN_PIN)});
      case 'updateStatus': return json_(updateStatus_(p));
      default: return json_({ok:false,message:'Action tidak dikenal.'});
    }
  }catch(err){return json_({ok:false,message:err.message||String(err)});}
}
function json_(obj){return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);}
function sheet_(){
  if(CONFIG.SPREADSHEET_ID==='PASTE_SPREADSHEET_ID_HERE') throw new Error('SPREADSHEET_ID belum diisi pada Code.gs.');
  const ss=SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);let sh=ss.getSheetByName(CONFIG.SHEET_NAME);if(!sh)sh=ss.insertSheet(CONFIG.SHEET_NAME);ensureHeaders_(sh);return sh;
}
function ensureHeaders_(sh){const current=sh.getRange(1,1,1,HEADERS.length).getValues()[0];let mismatch=HEADERS.some((h,i)=>current[i]!==h);if(sh.getLastRow()===0||mismatch){sh.getRange(1,1,1,HEADERS.length).setValues([HEADERS]);sh.setFrozenRows(1);sh.getRange(1,1,1,HEADERS.length).setFontWeight('bold');}}
function listRequests_(){const sh=sheet_(),last=sh.getLastRow();if(last<2)return [];const vals=sh.getRange(2,1,last-1,HEADERS.length).getValues();return vals.map(rowToObj_).filter(x=>x.id).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));}
function rowToObj_(r){return {id:String(r[0]||''),request_number:String(r[1]||''),name:String(r[2]||''),department:String(r[3]||''),title:String(r[4]||''),category:String(r[5]||''),amount:Number(r[6]||0),description:String(r[7]||''),status:String(r[8]||'pending'),receipt_url:String(r[9]||''),receipt_filename:String(r[10]||''),finance_note:String(r[11]||''),approved_by:String(r[12]||''),approved_at:r[13]?new Date(r[13]).toISOString():'',created_at:r[14]?new Date(r[14]).toISOString():'',updated_at:r[15]?new Date(r[15]).toISOString():''};}
function createRequest_(p){
  const name=String(p.name||'').trim(),title=String(p.title||'').trim(),description=String(p.description||'').trim();const amount=Number(p.amount);if(!name)throw new Error('Nama pemohon wajib diisi.');if(!title)throw new Error('Judul wajib diisi.');if(!description)throw new Error('Keterangan wajib diisi.');if(!(amount>0))throw new Error('Jumlah dana tidak valid.');
  let receiptUrl='',receiptName='';if(p.receipt&&p.receipt.data){const bytes=Utilities.base64Decode(p.receipt.data);if(bytes.length>CONFIG.MAX_FILE_BYTES)throw new Error('File terlalu besar.');const folder=getFolder_();const safeName=Date.now()+'_'+String(p.receipt.name||'bukti').replace(/[^a-zA-Z0-9._-]/g,'_');const blob=Utilities.newBlob(bytes,p.receipt.type||MimeType.PLAIN_TEXT,safeName);const file=folder.createFile(blob);file.setSharing(DriveApp.Access.ANYONE_WITH_LINK,DriveApp.Permission.VIEW);receiptUrl='https://drive.google.com/uc?export=view&id='+file.getId();receiptName=p.receipt.name||safeName;}
  const sh=sheet_(),now=new Date(),id=Utilities.getUuid(),number=nextNumber_(sh);sh.appendRow([id,number,name,String(p.department||''),title,String(p.category||'operasional'),amount,description,'pending',receiptUrl,receiptName,'','','',now,now]);return {ok:true,id,request_number:number};
}
function nextNumber_(sh){const year=Utilities.formatDate(new Date(),Session.getScriptTimeZone()||'Asia/Jakarta','yyyy');const prefix='PD-'+year+'-';const last=sh.getLastRow();if(last<2)return prefix+'00001';const nums=sh.getRange(2,2,last-1,1).getValues().map(x=>String(x[0])).filter(x=>x.indexOf(prefix)===0).map(x=>Number(x.slice(prefix.length))||0);return prefix+String((nums.length?Math.max.apply(null,nums):0)+1).padStart(5,'0');}
function getRequest_(id){const r=listRequests_().find(x=>x.id===String(id));if(!r)throw new Error('Permohonan tidak ditemukan.');return {ok:true,data:r};}
function updateStatus_(p){if(String(p.pin||'')!==String(CONFIG.ADMIN_PIN))throw new Error('Akses keuangan ditolak.');const allowed=['approved','rejected','paid'];if(allowed.indexOf(p.status)<0)throw new Error('Status tidak valid.');const sh=sheet_(),last=sh.getLastRow(),vals=sh.getRange(2,1,Math.max(last-1,0),HEADERS.length).getValues();for(let i=0;i<vals.length;i++){if(String(vals[i][0])===String(p.id)){const row=i+2;const now=new Date();sh.getRange(row,9).setValue(p.status);if(p.finance_note!==undefined)sh.getRange(row,12).setValue(String(p.finance_note||''));if(p.status==='approved'||p.status==='rejected'){sh.getRange(row,13).setValue('Panel Keuangan');sh.getRange(row,14).setValue(now);}sh.getRange(row,16).setValue(now);return {ok:true};}}throw new Error('Data tidak ditemukan.');}
function getFolder_(){if(CONFIG.DRIVE_FOLDER_ID)return DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);const props=PropertiesService.getScriptProperties(),saved=props.getProperty('RECEIPT_FOLDER_ID');if(saved)return DriveApp.getFolderById(saved);const folder=DriveApp.createFolder('Permohonan Dana - Bukti');props.setProperty('RECEIPT_FOLDER_ID',folder.getId());return folder;}

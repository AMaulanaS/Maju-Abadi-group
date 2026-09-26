// ================================================================
// DATABASE KEUANGAN PROYEK MAJU ABADI GROUP
// Tempel seluruh kode ini di Extensions > Apps Script pada Spreadsheet.
// Jalankan setupDatabase() SATU KALI, lalu Deploy > New deployment > Web app.
// Execute as: Me | Who has access: Anyone
// ================================================================
const SHEETS={projects:'PROYEK',payments:'PEMBAYARAN',officials:'PEJABAT'};
const HEADERS={
 PROYEK:['id','company','tanggal','noKontrak','nama','opd','lokasi','nilai','pph','ppn','tahun','ppkom','pptk','mandor','staff','keterangan','createdAt','updatedAt'],
 PEMBAYARAN:['id','company','projectId','tanggal','termin','nominal','keterangan','createdAt'],
 PEJABAT:['id','company','nama','nip','jabatan','instansi','createdAt']
};
function doGet(e){return json(handle((e&&e.parameter&&e.parameter.action)||'list',e?e.parameter:{}));}
function doPost(e){try{const d=JSON.parse((e.postData&&e.postData.contents)||'{}');return json(handle(d.action||'list',d));}catch(err){return json({ok:false,message:String(err)})}}
function json(data){return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON)}
function setupDatabase(){Object.keys(HEADERS).forEach(name=>ensureSheet(name,HEADERS[name]));const ss=SpreadsheetApp.getActive();ss.getSheets().forEach(s=>{if(HEADERS[s.getName()]){s.setFrozenRows(1);s.getRange(1,1,1,s.getLastColumn()).setFontWeight('bold').setBackground('#0b66c3').setFontColor('#ffffff');s.autoResizeColumns(1,s.getLastColumn())}});return 'Database siap';}
function ensureSheet(name,headers){const ss=SpreadsheetApp.getActive();let s=ss.getSheetByName(name);if(!s)s=ss.insertSheet(name);if(s.getLastRow()===0)s.getRange(1,1,1,headers.length).setValues([headers]);else{const old=s.getRange(1,1,1,s.getLastColumn()).getValues()[0];headers.forEach(h=>{if(!old.includes(h)){s.getRange(1,s.getLastColumn()+1).setValue(h);old.push(h)}})}return s}
function handle(action,d){try{setupDatabase();if(action==='list')return {ok:true,projects:read('PROYEK'),payments:read('PEMBAYARAN'),officials:read('PEJABAT')};if(action==='saveProject'){d.data.updatedAt=new Date();if(!d.data.createdAt)d.data.createdAt=new Date();return upsert('PROYEK',d.data)}if(action==='savePayment'){d.data.createdAt=new Date();return append('PEMBAYARAN',d.data)}if(action==='saveOfficial'){d.data.createdAt=new Date();return append('PEJABAT',d.data)}if(action==='delete')return remove(d.sheet,d.id);if(action==='deleteProject'){removeChildren('PEMBAYARAN','projectId',d.id);return remove('PROYEK',d.id)}return {ok:false,message:'Action tidak dikenal: '+action};}catch(err){return {ok:false,message:String(err)}}}
function read(name){const s=ensureSheet(name,HEADERS[name]);if(s.getLastRow()<2)return [];const v=s.getDataRange().getDisplayValues(),h=v.shift();return v.filter(r=>r.some(x=>x!=='')).map(r=>Object.fromEntries(h.map((x,i)=>[x,r[i]])))}
function append(name,o){const s=ensureSheet(name,HEADERS[name]),h=s.getRange(1,1,1,s.getLastColumn()).getValues()[0];s.appendRow(h.map(k=>o[k]??''));return {ok:true}}
function upsert(name,o){const s=ensureSheet(name,HEADERS[name]),h=s.getRange(1,1,1,s.getLastColumn()).getValues()[0];let i=-1;if(s.getLastRow()>1){const ids=s.getRange(2,1,s.getLastRow()-1,1).getDisplayValues().flat();i=ids.indexOf(String(o.id))}const row=h.map(k=>o[k]??'');if(i<0)s.appendRow(row);else s.getRange(i+2,1,1,h.length).setValues([row]);return {ok:true}}
function remove(name,id){if(!HEADERS[name])throw new Error('Sheet tidak valid');const s=ensureSheet(name,HEADERS[name]);if(s.getLastRow()<2)return {ok:true};const ids=s.getRange(2,1,s.getLastRow()-1,1).getDisplayValues().flat(),i=ids.indexOf(String(id));if(i>=0)s.deleteRow(i+2);return {ok:true}}
function removeChildren(name,key,value){const s=ensureSheet(name,HEADERS[name]);if(s.getLastRow()<2)return;const h=s.getRange(1,1,1,s.getLastColumn()).getValues()[0],col=h.indexOf(key)+1;if(!col)return;for(let r=s.getLastRow();r>=2;r--)if(String(s.getRange(r,col).getDisplayValue())===String(value))s.deleteRow(r)}

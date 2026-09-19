const SPREADSHEET_ID = "1QsqVUhB1xPpo8tCEC67bMcayLO8fOGsiNfb1RydYvpA";
const SHEET_NAME = "Sheet1";

const HEADERS = [
  "ID","Timestamp","Nama","No. HP / WhatsApp","Instansi / Perusahaan","Jabatan",
  "Bertemu Dengan","Keperluan","Jumlah Tamu","Status","Waktu Keluar","Detail Keperluan"
];

function setup() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) sh = ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() === 0) {
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
  } else {
    // Jika sheet lama memakai struktur berbeda, jangan menimpa data otomatis.
    // Tambahkan header baru hanya bila baris pertama kosong.
    const current = sh.getRange(1,1,1,Math.max(sh.getLastColumn(),1)).getValues()[0];
    if (!current[0]) sh.getRange(1,1,1,HEADERS.length).setValues([HEADERS]);
    sh.setFrozenRows(1);
  }
}

function doGet(e) {
  setup();
  const p = (e && e.parameter) || {};
  const action = p.action || "list";
  const callback = String(p.callback || "");
  try {
    let result;
    if (action === "list") result = {success:true, data:listGuests_()};
    else if (action === "create") result = createGuest_(p);
    else if (action === "update") result = updateGuest_(p);
    else if (action === "delete") result = deleteGuest_(p.id);
    else if (action === "checkout") result = checkoutGuest_(p.id);
    else result = {success:true,message:"Buku Tamu API aktif"};
    return output_(result, callback);
  } catch(err) {
    return output_({success:false,message:err.message}, callback);
  }
}

function output_(obj, callback) {
  const json = JSON.stringify(obj);
  // JSONP dipakai agar website statis dapat membaca respons Apps Script
  // tanpa terkena blokir CORS/redirect dari browser.
  if (callback && /^[A-Za-z_$][0-9A-Za-z_$]*$/.test(callback)) {
    return ContentService.createTextOutput(callback + "(" + json + ");")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  setup();
  try {
    const p = e.parameter || {};
    const action = p.action || "";
    if (action === "create") return json_(createGuest_(p));
    if (action === "update") return json_(updateGuest_(p));
    if (action === "delete") return json_(deleteGuest_(p.id));
    if (action === "checkout") return json_(checkoutGuest_(p.id));
    return json_({success:false,message:"Action tidak dikenali"});
  } catch(err) {
    return json_({success:false,message:err.message});
  }
}

function createGuest_(p) {
  if (!p.nama || !p.bertemu || !p.keperluan)
    return {success:false,message:"Nama, Bertemu Dengan, dan Keperluan wajib diisi."};

  const sh = sheet_();
  const id = Utilities.getUuid();
  sh.appendRow([
    id,
    new Date(),
    p.nama || "",
    p.telepon || "",
    p.instansi || "",
    p.jabatan || "",
    p.bertemu || "",
    p.keperluan || "",
    Number(p.jumlah || 1),
    p.status || "Berada di lokasi",
    "",
    p.detail || ""
  ]);
  return {success:true,id:id,message:"Data berhasil disimpan"};
}

function updateGuest_(p) {
  if (!p.id) return {success:false,message:"ID data tidak ditemukan."};
  const sh=sheet_(), row=findRowById_(sh,p.id);
  if (!row) return {success:false,message:"Data tidak ditemukan."};

  const old=sh.getRange(row,1,1,HEADERS.length).getValues()[0];
  sh.getRange(row,1,1,HEADERS.length).setValues([[
    old[0],old[1],p.nama||"",p.telepon||"",p.instansi||"",p.jabatan||"",
    p.bertemu||"",p.keperluan||"",Number(p.jumlah||1),p.status||"Berada di lokasi",
    old[10]||"",p.detail||""
  ]]);
  return {success:true,message:"Data berhasil diperbarui"};
}

function deleteGuest_(id) {
  if (!id) return {success:false,message:"ID data tidak ditemukan."};
  const sh=sheet_(), row=findRowById_(sh,id);
  if (!row) return {success:false,message:"Data tidak ditemukan."};
  sh.deleteRow(row);
  return {success:true,message:"Data berhasil dihapus"};
}

function checkoutGuest_(id) {
  if (!id) return {success:false,message:"ID data tidak ditemukan."};
  const sh=sheet_(), row=findRowById_(sh,id);
  if (!row) return {success:false,message:"Data tidak ditemukan."};
  sh.getRange(row,10,1,2).setValues([["Selesai",new Date()]]);
  return {success:true,message:"Check-out berhasil"};
}

function listGuests_() {
  const sh=sheet_();
  const lastRow=sh.getLastRow();
  if (lastRow<=1) return [];
  const values=sh.getRange(2,1,lastRow-1,HEADERS.length).getValues();

  return values.map(r=>({
    id:r[0]||"",
    timestamp:formatDate_(r[1]),
    nama:r[2]||"",
    telepon:r[3]||"",
    instansi:r[4]||"",
    jabatan:r[5]||"",
    bertemu:r[6]||"",
    keperluan:r[7]||"",
    jumlah:r[8]||1,
    status:r[9]||"Berada di lokasi",
    checkout:formatDate_(r[10]),
    detail:r[11]||""
  }));
}

function sheet_() {
  return SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
}
function findRowById_(sh,id) {
  const last=sh.getLastRow();
  if(last<=1) return null;
  const vals=sh.getRange(2,1,last-1,1).getValues().flat();
  const i=vals.findIndex(x=>String(x)===String(id));
  return i===-1?null:i+2;
}
function formatDate_(v) {
  if(v instanceof Date) return Utilities.formatDate(v,Session.getScriptTimeZone(),"dd/MM/yyyy HH:mm:ss");
  return v||"";
}
function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

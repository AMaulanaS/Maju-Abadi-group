/**
 * Google Apps Script - Backend Progress Proyek & Operasional
 * 
 * Buat satu Google Spreadsheet, lalu isi SPREADSHEET_ID.
 * Deploy: Web app -> Execute as Me -> Anyone with link.
 */

const SPREADSHEET_ID = "ISI_ID_GOOGLE_SHEET_DI_SINI";

const SHEETS = {
  proyek: "Proyek",
  jadwal: "Jadwal",
  pekerjaan: "Pekerjaan",
  dokumentasi: "Dokumentasi",
  tim: "Tim"
};

const HEADERS = {
  proyek: ["id","kode","nama","pemilik","kategori","status","progress","mulai","deadline","anggaran","deskripsi"],
  jadwal: ["id","tanggal","mulai","selesai","pekerjaan","lokasi","petugas","prioritas","status","kodeProyek","keterangan"],
  pekerjaan: ["id","tanggal","pekerjaan","lokasi","petugas","prioritas","status","kodeProyek","keterangan"],
  dokumentasi: ["id","title","project","date","pic","activity","status","progress","notes","photos"],
  tim: ["id","nama","jabatan","noHp","lokasi","tanggal","status","kodeProyek","keterangan"]
};

const TOKENS = {
  dokumentasi: "ERP2026_5DXF9CXIBR",
  tim: "ERP2026_FGGZVTU7JX"
};

function doGet() {
  return json({ok:true, service:"Maju Abadi Group - Progress Backend"});
}

function doPost(e) {
  try {
    const req = JSON.parse(e.postData.contents || "{}");
    const modul = String(req.modul || "");
    const action = String(req.action || "");

    if (!SHEETS[modul]) throw new Error("Modul tidak dikenal.");
    if ((modul === "dokumentasi" || modul === "tim") &&
        req.token !== TOKENS[modul]) throw new Error("Token tidak valid.");

    const sheet = getSheet_(modul);
    const headers = ensureHeader_(sheet, modul);

    if (action === "list") {
      return json({ok:true, data:readRows_(sheet, headers)});
    }

    if (action === "create" || action === "update") {
      const data = modul === "proyek" ? req : (req.data || {});
      if (!data.id) data.id = Utilities.getUuid();
      if (action === "create") appendRow_(sheet, headers, data);
      else updateRow_(sheet, headers, data.id, data);
      return json({ok:true, id:data.id});
    }

    if (action === "delete") {
      deleteRow_(sheet, headers, req.id);
      return json({ok:true});
    }

    throw new Error("Action tidak dikenal.");
  } catch (err) {
    return json({ok:false, message:err.message});
  }
}

function getSheet_(modul) {
  if (!SPREADSHEET_ID || SPREADSHEET_ID === "ISI_ID_GOOGLE_SHEET_DI_SINI")
    throw new Error("SPREADSHEET_ID belum diisi di Code.gs.");
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sh = ss.getSheetByName(SHEETS[modul]);
  if (!sh) sh = ss.insertSheet(SHEETS[modul]);
  return sh;
}

function ensureHeader_(sh, modul) {
  const headers = HEADERS[modul];
  if (sh.getLastRow() === 0) sh.getRange(1,1,1,headers.length).setValues([headers]);
  return headers;
}

function readRows_(sh, headers) {
  const n = sh.getLastRow();
  if (n < 2) return [];
  return sh.getRange(2,1,n-1,headers.length).getValues().map(row => {
    const o = {};
    headers.forEach((h,i) => o[h] = row[i] instanceof Date ? formatDate_(row[i]) : row[i]);
    return o;
  });
}

function appendRow_(sh, headers, data) {
  sh.appendRow(headers.map(h => safeCell_(data[h])));
}

function updateRow_(sh, headers, id, data) {
  const values = sh.getDataRange().getValues();
  for (let r=1; r<values.length; r++) {
    if (String(values[r][0]) === String(id)) {
      sh.getRange(r+1,1,1,headers.length).setValues([headers.map(h => safeCell_(data[h]))]);
      return;
    }
  }
  throw new Error("Data tidak ditemukan.");
}

function deleteRow_(sh, headers, id) {
  const values = sh.getDataRange().getValues();
  for (let r=1; r<values.length; r++) {
    if (String(values[r][0]) === String(id)) {
      sh.deleteRow(r+1);
      return;
    }
  }
  throw new Error("Data tidak ditemukan.");
}

function safeCell_(v) {
  if (v === undefined || v === null) return "";
  if (typeof v === "string" && /^[=+\-@]/.test(v)) return "'" + v;
  if (Array.isArray(v)) return JSON.stringify(v);
  if (typeof v === "object") return JSON.stringify(v);
  return v;
}

function formatDate_(d) {
  return Utilities.formatDate(d, Session.getScriptTimeZone(), "yyyy-MM-dd");
}

function json(o) {
  return ContentService.createTextOutput(JSON.stringify(o))
    .setMimeType(ContentService.MimeType.JSON);
}

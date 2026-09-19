/**
 * =============================================================
 *  ERP TERPADU — BACKEND TUNGGAL (Google Apps Script)
 * =============================================================
 * Menggabungkan 5 modul (Daftar Proyek, Jadwal Pekerjaan,
 * Pekerjaan Lapangan, Dokumentasi Proyek, Tim Lapangan) ke
 * dalam SATU Google Spreadsheet dan SATU Web App URL.
 * Modul "Progress Proyek" tidak butuh sheet sendiri — dia cukup
 * membaca data dari sheet "Proyek" (lihat catatan di bagian bawah).
 *
 * CARA PAKAI:
 * 1. Buat 1 Google Spreadsheet baru, beri nama misalnya "ERP Operasional".
 * 2. Extensions > Apps Script. Hapus kode contoh, tempel SELURUH isi
 *    file ini.
 * 3. Isi TOKEN_DOKUMENTASI dan TOKEN_TIM di bawah dengan kata sandi
 *    rahasia pilihan Anda (masing-masing beda / sama, terserah).
 * 4. Jalankan fungsi setupAll() sekali dari editor (pilih di dropdown
 *    lalu klik Run). Izinkan akses saat diminta. Ini akan membuat
 *    kelima tab/sheet otomatis dengan header yang benar.
 * 5. Deploy > New deployment > pilih tipe "Web app".
 *      Execute as: Me
 *      Who has access: Anyone
 * 6. Salin URL yang berakhiran /exec. INI SATU-SATUNYA API_URL yang
 *    akan dipakai oleh KELIMA website (bukan 5 URL berbeda lagi).
 * =============================================================
 */

const TOKEN_DOKUMENTASI = 'ERP2026_5DXF9CXIBR';
const TOKEN_TIM = 'ERP2026_FGGZVTU7JX';
const DRIVE_FOLDER_NAME = 'Dokumentasi Proyek';

// Definisi kelima sheet. "kodeProyek" adalah kolom penghubung ke
// sheet "Proyek" (isinya harus sama dengan nilai kolom "Kode" di
// sheet Proyek), supaya semua modul bisa saling dikaitkan.
const SHEETS = {
  proyek: {
    name: 'Proyek',
    headers: ["ID","Kode","Nama","Pemilik","Kategori","Status","Progress",
      "Tanggal Mulai","Deadline","Anggaran","Deskripsi","Dibuat","Diperbarui"]
  },
  jadwal: {
    name: 'Jadwal',
    headers: ["id","tanggal","mulai","selesai","pekerjaan","lokasi","petugas",
      "prioritas","status","keterangan","kodeProyek","updated_at"]
  },
  pekerjaan: {
    name: 'Pekerjaan Lapangan',
    headers: ["id","tanggal","pekerjaan","lokasi","petugas","prioritas",
      "status","keterangan","kodeProyek","updated_at"]
  },
  dokumentasi: {
    name: 'Dokumentasi Proyek',
    headers: ["ID","Timestamp","Tanggal","Judul","Proyek","PIC","Kegiatan",
      "Progress","Status","Catatan","Foto URLs"]
  },
  tim: {
    name: 'Tim Lapangan',
    headers: ["ID","Nama","Jabatan","No HP","Lokasi Tugas","Tanggal Tugas",
      "kodeProyek","Status","Keterangan","Dibuat","Diubah"]
  }
};

function setupAll() {
  Object.keys(SHEETS).forEach(getSheet_);
  return 'Semua sheet siap: ' + Object.values(SHEETS).map(s => s.name).join(', ');
}

function getSheet_(modul) {
  const cfg = SHEETS[modul];
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(cfg.name);
  if (!sh) sh = ss.insertSheet(cfg.name);
  if (sh.getLastRow() === 0) {
    sh.appendRow(cfg.headers);
    sh.setFrozenRows(1);
  }
  return sh;
}

// ---------- ROUTER ----------

function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.modul === 'tim') return handleTimGet_(p);
  return json_({ ok: true, success: true, message: "API ERP Terpadu aktif. Kirim POST dengan field 'modul' & 'action'." });
}

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    switch (body.modul) {
      case 'proyek':      return handleProyek_(body);
      case 'jadwal':      return runGenericModule_('jadwal', body);
      case 'pekerjaan':   return runGenericModule_('pekerjaan', body);
      case 'dokumentasi': return handleDokumentasi_(body);
      case 'tim':         return handleTimPost_(body);
      default:
        return json_({ ok:false, success:false, message:"Field 'modul' wajib diisi: proyek / jadwal / pekerjaan / dokumentasi / tim" });
    }
  } catch (err) {
    return json_({ ok:false, success:false, message: String(err.message || err) });
  }
}

// ---------- MODUL: PROYEK (Daftar Proyek) ----------

function handleProyek_(body) {
  const action = body.action;
  if (action === 'list')   return listProyek_();
  if (action === 'create') return createProyek_(body);
  if (action === 'update') return updateProyek_(body);
  if (action === 'delete') return deleteProyek_(body);
  return json_({ success:false, ok:false, message:'Action tidak dikenal.' });
}

function listProyek_() {
  const sh = getSheet_('proyek');
  const values = sh.getDataRange().getValues();
  if (values.length <= 1) return json_({ success:true, ok:true, data: [] });
  const data = values.slice(1).filter(r => r[0]).map(r => ({
    id: r[0], kode: r[1], nama: r[2], pemilik: r[3], kategori: r[4],
    status: r[5], progress: r[6], mulai: toIsoDate_(r[7]), deadline: toIsoDate_(r[8]),
    anggaran: r[9], deskripsi: r[10]
  }));
  return json_({ success:true, ok:true, data });
}

function createProyek_(p) {
  const sh = getSheet_('proyek');
  const now = new Date();
  const id = Utilities.getUuid();
  sh.appendRow([
    id, clean_(p.kode), clean_(p.nama), clean_(p.pemilik), clean_(p.kategori),
    clean_(p.status || 'Belum Mulai'), Number(p.progress || 0),
    p.mulai || '', p.deadline || '', Number(p.anggaran || 0),
    clean_(p.deskripsi), now, now
  ]);
  return json_({ success:true, ok:true, id });
}

function updateProyek_(p) {
  const sh = getSheet_('proyek');
  const row = findRowById_(sh, p.id);
  if (!row) return json_({ success:false, ok:false, message:'Proyek tidak ditemukan.' });
  sh.getRange(row, 2, 1, 12).setValues([[
    clean_(p.kode), clean_(p.nama), clean_(p.pemilik), clean_(p.kategori),
    clean_(p.status), Number(p.progress || 0), p.mulai || '', p.deadline || '',
    Number(p.anggaran || 0), clean_(p.deskripsi), sh.getRange(row, 12).getValue(), new Date()
  ]]);
  return json_({ success:true, ok:true });
}

function deleteProyek_(p) {
  const sh = getSheet_('proyek');
  const row = findRowById_(sh, p.id);
  if (!row) return json_({ success:false, ok:false, message:'Proyek tidak ditemukan.' });
  sh.deleteRow(row);
  return json_({ success:true, ok:true });
}

// ---------- MODUL: JADWAL & PEKERJAAN LAPANGAN ----------
// Kedua modul ini punya struktur mirip (sama-sama daftar tugas
// dengan tanggal/lokasi/petugas), jadi dipakaikan satu fungsi
// generik yang dipanggil untuk 'jadwal' maupun 'pekerjaan'.

function runGenericModule_(modulKey, body) {
  const sh = getSheet_(modulKey);
  const headers = SHEETS[modulKey].headers;
  const action = body.action;
  const d = body.data || {};

  if (action === 'list') {
    const values = sh.getDataRange().getValues();
    if (values.length <= 1) return json_({ ok:true, success:true, data: [] });
    const data = values.slice(1).filter(r => r[0]).map(r =>
      Object.fromEntries(headers.map((h, i) => [h, String(r[i] ?? '')]))
    );
    return json_({ ok:true, success:true, data });
  }
  if (action === 'create') {
    const row = headers.map(h => h === 'updated_at' ? new Date() : (d[h] ?? ''));
    sh.appendRow(row);
    return json_({ ok:true, success:true, data: d });
  }
  if (action === 'update') {
    const row = findRowById_(sh, d.id);
    if (!row) return json_({ ok:false, success:false, message:'Data tidak ditemukan.' });
    const values = headers.map(h => h === 'updated_at' ? new Date() : (d[h] ?? ''));
    sh.getRange(row, 1, 1, headers.length).setValues([values]);
    return json_({ ok:true, success:true, data: d });
  }
  if (action === 'delete') {
    const row = findRowById_(sh, body.id);
    if (!row) return json_({ ok:false, success:false, message:'Data tidak ditemukan.' });
    sh.deleteRow(row);
    return json_({ ok:true, success:true });
  }
  return json_({ ok:false, success:false, message:'Action tidak dikenal.' });
}

// ---------- MODUL: DOKUMENTASI PROYEK ----------

function handleDokumentasi_(body) {
  if (body.token !== TOKEN_DOKUMENTASI) return json_({ ok:false, success:false, message:'Token tidak valid.' });
  const action = body.action || 'list';
  if (action === 'list')   return json_({ ok:true, success:true, records: listDokumentasi_() });
  if (action === 'create') return json_({ ok:true, success:true, record: createDokumentasi_(body) });
  if (action === 'update') return json_({ ok:true, success:true, record: updateDokumentasi_(body) });
  if (action === 'delete') return json_({ ok:true, success:true, record: deleteDokumentasi_(body.id) });
  return json_({ ok:false, success:false, message:'Action tidak dikenal.' });
}

function listDokumentasi_() {
  const sh = getSheet_('dokumentasi');
  const last = sh.getLastRow();
  if (last < 2) return [];
  const rows = sh.getRange(2, 1, last - 1, SHEETS.dokumentasi.headers.length).getValues();
  return rows.filter(r => r[0]).map(rowToDokumentasiObject_).reverse();
}

function rowToDokumentasiObject_(r) {
  return {
    id: String(r[0] || ''),
    timestamp: r[1] instanceof Date ? r[1].toISOString() : r[1],
    date: r[2] instanceof Date ? Utilities.formatDate(r[2], Session.getScriptTimeZone(), 'yyyy-MM-dd') : String(r[2] || ''),
    title: String(r[3] || ''),
    project: String(r[4] || ''), // <- isi dengan "Kode" proyek dari sheet Proyek
    pic: String(r[5] || ''), activity: String(r[6] || ''),
    progress: Number(r[7] || 0), status: String(r[8] || ''), notes: String(r[9] || ''),
    photos: String(r[10] || '').split(/\n/).map(s => s.trim()).filter(Boolean)
  };
}

function createDokumentasi_(b) {
  validateDokumentasi_(b);
  const sh = getSheet_('dokumentasi');
  const id = Utilities.getUuid();
  const photoUrls = savePhotos_(b.photos || [], id, b.title || 'Dokumentasi');
  sh.appendRow([id, new Date(), parseDate_(b.date), clean_(b.title), clean_(b.project),
    clean_(b.pic), clean_(b.activity), Number(b.progress || 0), clean_(b.status),
    clean_(b.notes), photoUrls.join('\n')]);
  return { id };
}

function updateDokumentasi_(b) {
  validateDokumentasi_(b);
  if (!b.id) throw new Error('ID tidak ditemukan.');
  const sh = getSheet_('dokumentasi');
  const row = findRowById_(sh, b.id);
  if (!row) throw new Error('Data tidak ditemukan.');
  const old = sh.getRange(row, 1, 1, SHEETS.dokumentasi.headers.length).getValues()[0];
  let urls = String(old[10] || '').split(/\n/).filter(Boolean);
  if (b.photos && b.photos.length) urls = savePhotos_(b.photos, b.id, b.title || 'Dokumentasi');
  sh.getRange(row, 3, 1, 9).setValues([[parseDate_(b.date), clean_(b.title), clean_(b.project),
    clean_(b.pic), clean_(b.activity), Number(b.progress || 0), clean_(b.status), clean_(b.notes), urls.join('\n')]]);
  return { id: b.id };
}

function deleteDokumentasi_(id) {
  if (!id) throw new Error('ID tidak ditemukan.');
  const sh = getSheet_('dokumentasi');
  const row = findRowById_(sh, id);
  if (!row) throw new Error('Data tidak ditemukan.');
  sh.deleteRow(row);
  return { id };
}

function validateDokumentasi_(b) {
  if (!b.title || !b.project || !b.date || !b.activity) throw new Error('Judul, proyek, tanggal, dan kegiatan wajib diisi.');
  const p = Number(b.progress);
  if (p < 0 || p > 100) throw new Error('Progress harus 0 sampai 100%.');
  if ((b.photos || []).length > 3) throw new Error('Maksimal 3 foto per dokumentasi.');
}

function getFolder_() {
  const props = PropertiesService.getScriptProperties();
  const saved = props.getProperty('DOC_FOLDER_ID');
  if (saved) { try { return DriveApp.getFolderById(saved); } catch (e) {} }
  const it = DriveApp.getFoldersByName(DRIVE_FOLDER_NAME);
  const folder = it.hasNext() ? it.next() : DriveApp.createFolder(DRIVE_FOLDER_NAME);
  props.setProperty('DOC_FOLDER_ID', folder.getId());
  return folder;
}

function savePhotos_(photos, id, title) {
  const folder = getFolder_();
  return (photos || []).map((p, idx) => {
    if (!p || !p.data) return '';
    const bytes = Utilities.base64Decode(p.data);
    const safe = (p.name || 'foto').replace(/[^a-zA-Z0-9._-]/g, '_');
    const blob = Utilities.newBlob(bytes, p.mimeType || 'image/jpeg', id + '_' + (idx + 1) + '_' + safe);
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return file.getUrl();
  }).filter(Boolean);
}

// ---------- MODUL: TIM LAPANGAN ----------

// Tim Lapangan aslinya mengirim SEMUA action (list/create/update/delete)
// lewat GET + JSONP (bukan POST) untuk menghindari masalah CORS di
// hosting statis. Jadi handleTimGet_ harus mendukung keempatnya, sama
// seperti handleTimPost_ (yang tetap disediakan untuk kompatibilitas
// bila suatu saat frontend diubah untuk memakai fetch POST biasa).

function handleTimGet_(p) {
  try {
    if (String(p.token || '') !== String(TOKEN_TIM)) throw new Error('Token tidak valid.');
    const result = runTimAction_((p.action || 'list').toLowerCase(), p);
    return outputJsonp_(result, p.callback);
  } catch (err) {
    return outputJsonp_({ ok:false, success:false, message: err.message || String(err) }, p.callback);
  }
}

function handleTimPost_(body) {
  try {
    if (String(body.token || '') !== String(TOKEN_TIM)) return json_({ ok:false, success:false, message:'Token tidak valid.' });
    return json_(runTimAction_((body.action || 'list').toLowerCase(), body));
  } catch (err) {
    return json_({ ok:false, success:false, message: err.message || String(err) });
  }
}

function runTimAction_(action, p) {
  if (action === 'list')   return { ok:true, success:true, data: listTim_() };
  if (action === 'create') return createTim_(p);
  if (action === 'update') return updateTim_(p);
  if (action === 'delete') return removeTim_(p);
  throw new Error('Action tidak dikenali.');
}

function listTim_() {
  const sh = getSheet_('tim');
  const values = sh.getDataRange().getValues();
  if (values.length <= 1) return [];
  return values.slice(1).filter(r => r[0]).map(rowToTimObject_);
}

function rowToTimObject_(row) {
  return {
    id: String(row[0] || ''), nama: String(row[1] || ''), jabatan: String(row[2] || ''),
    noHp: String(row[3] || ''), lokasi: String(row[4] || ''), tanggal: formatDate_(row[5]),
    kodeProyek: String(row[6] || ''), status: String(row[7] || 'Aktif'), keterangan: String(row[8] || ''),
    dibuat: formatDateTime_(row[9]), diubah: formatDateTime_(row[10])
  };
}

function createTim_(p) {
  requireFields_(p, ['id', 'nama', 'jabatan', 'lokasi', 'tanggal']);
  const sh = getSheet_('tim');
  const now = new Date();
  sh.appendRow([
    clean_(p.id), clean_(p.nama), clean_(p.jabatan), clean_(p.noHp), clean_(p.lokasi),
    parseDate_(p.tanggal), clean_(p.kodeProyek), clean_(p.status || 'Aktif'), clean_(p.keterangan), now, now
  ]);
  return { ok:true, success:true, message:'Data dibuat.', data:{ id: clean_(p.id) } };
}

function updateTim_(p) {
  requireFields_(p, ['id', 'nama', 'jabatan', 'lokasi', 'tanggal']);
  const sh = getSheet_('tim');
  const rowIndex = findRowById_(sh, clean_(p.id));
  if (!rowIndex) throw new Error('Data personel tidak ditemukan.');
  const currentCreated = sh.getRange(rowIndex, 10).getValue() || new Date();
  sh.getRange(rowIndex, 1, 1, SHEETS.tim.headers.length).setValues([[
    clean_(p.id), clean_(p.nama), clean_(p.jabatan), clean_(p.noHp), clean_(p.lokasi),
    parseDate_(p.tanggal), clean_(p.kodeProyek), clean_(p.status || 'Aktif'), clean_(p.keterangan), currentCreated, new Date()
  ]]);
  return { ok:true, success:true, message:'Data diperbarui.' };
}

function removeTim_(p) {
  if (!p.id) throw new Error('ID wajib diisi.');
  const sh = getSheet_('tim');
  const rowIndex = findRowById_(sh, clean_(p.id));
  if (!rowIndex) throw new Error('Data personel tidak ditemukan.');
  sh.deleteRow(rowIndex);
  return { ok:true, success:true, message:'Data dihapus.' };
}

// ---------- HELPER BERSAMA ----------

function findRowById_(sh, id) {
  if (!id) return null;
  const last = sh.getLastRow();
  if (last < 2) return null;
  const ids = sh.getRange(2, 1, last - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) return i + 2;
  }
  return null;
}

function requireFields_(obj, fields) {
  fields.forEach(f => { if (!obj[f]) throw new Error(`Field '${f}' wajib diisi.`); });
}

function clean_(v) { return String(v ?? '').trim(); }

function toIsoDate_(v) {
  if (!v) return '';
  if (Object.prototype.toString.call(v) === '[object Date]' && !isNaN(v)) {
    return Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  return String(v);
}

function parseDate_(s) {
  if (!s) return new Date();
  const parts = String(s).split('-');
  if (parts.length !== 3) return new Date(s);
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
}

function formatDate_(value) {
  if (!value) return '';
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value)) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  return String(value).slice(0, 10);
}

function formatDateTime_(value) {
  if (!value) return '';
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value)) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
  }
  return String(value);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function outputJsonp_(payload, callback) {
  const j = JSON.stringify(payload);
  if (callback) {
    const safe = String(callback).replace(/[^a-zA-Z0-9_$.]/g, '');
    return ContentService.createTextOutput(`${safe}(${j});`).setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(j).setMimeType(ContentService.MimeType.JSON);
}

/**
 * CATATAN: modul "Progress Proyek" sengaja tidak dibuatkan
 * sheet/endpoint baru — dia cukup memanggil modul 'proyek' action
 * 'list' (endpoint yang sama dipakai Daftar Proyek), lalu memetakan
 * field nama/pemilik/mulai/deadline/progress/status/deskripsi yang
 * sudah tersedia di situ. Ini menghindari data proyek ganda.
 */

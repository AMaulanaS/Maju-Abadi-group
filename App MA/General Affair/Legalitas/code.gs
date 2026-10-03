// ================================================================
// SMART REMINDER SERKOM & LEGAL - MA GROUP
// ================================================================
// >>> CARA MEMASUKKAN ID GOOGLE SPREADSHEET <<<
//
// 1. Buka Google Spreadsheet Anda.
// 2. Lihat alamat di browser, contoh:
//    https://docs.google.com/spreadsheets/d/1ABCDEF123456789/edit
// 3. Yang disalin HANYA bagian di antara /d/ dan /edit:
//    1ABCDEF123456789
// 4. Tempel di bawah pada SPREADSHEET_ID.
//
// JANGAN memasukkan seluruh URL.
//
// ================================================================

const SPREADSHEET_ID = '159mTMvDbnLM1Tx0SFL_yBs3RqlCpfwBsrIA_NkwWrd8';

// ID folder Google Drive tempat PDF diupload.
// Isi dengan ID folder Google Drive jika ingin file masuk ke folder tertentu.
// Jika kosong, file akan disimpan di My Drive milik akun yang menjalankan Web App.
const DRIVE_FOLDER_ID = '';
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

// ================================================================
// PEMETAAN KATEGORI -> NAMA TAB & HEADER
// ================================================================
const REMINDER_DAYS = 120;

const SHEET_CONFIG = {
  serkom: {
    sheetName: 'SERKOM',
    headers: ['Timestamp', 'ID', 'UploadFileName', 'UploadFileUrl', 'Nama', 'Serkom', 'KodeKualifikasi', 'TglBuat', 'ExpiredDate',
              'Bidang', 'SubBidang', 'Keterangan'],
    statusCols: ['ExpiredDate'],
    identCols: ['Nama', 'Serkom']
  },
  legal_rma: {
    sheetName: 'LEGAL RMA',
    headers: ['Timestamp', 'ID', 'UploadFileName', 'UploadFileUrl', 'Legal', 'NoDokumen', 'TglDokumen', 'TglExpired', 'Keterangan'],
    statusCols: ['TglExpired'],
    identCols: ['Legal']
  },
  legal_fma: {
    sheetName: 'LEGAL FMA',
    headers: ['Timestamp', 'ID', 'UploadFileName', 'UploadFileUrl', 'Legal', 'NoDokumen', 'TglDokumen', 'TglExpired', 'Keterangan'],
    statusCols: ['TglExpired'],
    identCols: ['Legal']
  },
  legal_zma: {
    sheetName: 'LEGAL ZMA',
    headers: ['Timestamp', 'ID', 'UploadFileName', 'UploadFileUrl', 'Legal', 'NoDokumen', 'TglDokumen', 'TglExpired', 'Keterangan'],
    statusCols: ['TglExpired'],
    identCols: ['Legal']
  }
};

// ================================================================
// AMBIL SPREADSHEET BERDASARKAN ID
// ================================================================
function getSpreadsheet_() {
  if (!SPREADSHEET_ID || SPREADSHEET_ID === 'TEMPEL_ID_SPREADSHEET_DI_SINI') {
    throw new Error('SPREADSHEET_ID belum diisi. Tempel ID Google Spreadsheet di bagian paling atas code.gs.');
  }
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function getOrCreateSheet_(cfg) {
  const ss = getSpreadsheet_();
  let sheet = ss.getSheetByName(cfg.sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(cfg.sheetName);
    sheet.getRange(1, 1, 1, cfg.headers.length).setValues([cfg.headers]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, cfg.headers.length)
      .setFontWeight('bold')
      .setBackground('#172554')
      .setFontColor('#ffffff');
    sheet.autoResizeColumns(1, cfg.headers.length);
  }

  return sheet;
}


// ================================================================
// MIGRASI OTOMATIS HEADER LAMA -> STRUKTUR BARU
// Jalankan fungsi migrasiHeaderLamaKeBaru() SATU KALI setelah
// SPREADSHEET_ID diisi. Data lama tidak dihapus.
// Sistem membuat backup tab terlebih dahulu.
// ================================================================
function migrasiHeaderLamaKeBaru() {
  const ss = getSpreadsheet_();
  const laporan = [];

  Object.keys(SHEET_CONFIG).forEach(kategori => {
    const cfg = SHEET_CONFIG[kategori];
    let sheet = ss.getSheetByName(cfg.sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(cfg.sheetName);
      sheet.getRange(1, 1, 1, cfg.headers.length).setValues([cfg.headers]);
      laporan.push(cfg.sheetName + ': dibuat baru');
      return;
    }

    const range = sheet.getDataRange();
    const values = range.getValues();
    if (!values.length) {
      sheet.getRange(1, 1, 1, cfg.headers.length).setValues([cfg.headers]);
      laporan.push(cfg.sheetName + ': header dibuat');
      return;
    }

    const oldHeaders = values[0].map(h => String(h || '').trim());
    const oldRows = values.slice(1);

    // Backup hanya dibuat bila struktur belum sama dengan struktur baru.
    if (!headersSama_(oldHeaders, cfg.headers)) {
      const backupName = buatNamaBackup_(cfg.sheetName);
      const backup = ss.insertSheet(backupName);
      backup.getRange(1, 1, values.length, values[0].length).setValues(values);
      backup.setFrozenRows(1);
      backup.autoResizeColumns(1, values[0].length);

      const migrated = oldRows.map(row => migrasikanBaris_(kategori, oldHeaders, row, cfg.headers));

      // Bersihkan isi tab asli, lalu tulis struktur baru + data hasil migrasi.
      sheet.clearContents();
      sheet.getRange(1, 1, 1, cfg.headers.length).setValues([cfg.headers]);
      if (migrated.length) {
        sheet.getRange(2, 1, migrated.length, cfg.headers.length).setValues(migrated);
      }
      formatHeader_(sheet, cfg.headers.length);
      laporan.push(cfg.sheetName + ': dimigrasikan; backup: ' + backupName);
    } else {
      formatHeader_(sheet, cfg.headers.length);
      laporan.push(cfg.sheetName + ': sudah menggunakan struktur baru');
    }
  });

  Logger.log(laporan.join('\n'));
  return laporan.join('\n');
}

function normalisasiHeader_(h) {
  return String(h || '')
    .toLowerCase()
    .replace(/[\s._-]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function headersSama_(a, b) {
  if (a.length !== b.length) return false;
  return a.every((h, i) => normalisasiHeader_(h) === normalisasiHeader_(b[i]));
}

function cariIndexHeader_(headers, aliases) {
  const map = {};
  headers.forEach((h, i) => map[normalisasiHeader_(h)] = i);
  for (const alias of aliases) {
    const idx = map[normalisasiHeader_(alias)];
    if (idx !== undefined) return idx;
  }
  return -1;
}

function nilaiLama_(headers, row, aliases) {
  const idx = cariIndexHeader_(headers, aliases);
  return idx >= 0 ? row[idx] : '';
}

function gabungKeterangan_(bagian) {
  return bagian
    .filter(x => x && String(x.value).trim() !== '')
    .map(x => x.label + ': ' + x.value)
    .join(' | ');
}

function migrasikanBaris_(kategori, oldHeaders, row, newHeaders) {
  const timestamp = nilaiLama_(oldHeaders, row, ['Timestamp', 'Tanggal', 'Waktu']);
  const id = nilaiLama_(oldHeaders, row, ['ID', 'Id']);

  if (kategori === 'serkom') {
    const nama = nilaiLama_(oldHeaders, row, ['Nama', 'Nama Sertifikat', 'Nama Serkom']);
    const serkom = nilaiLama_(oldHeaders, row, ['Serkom', 'Sertifikat Kompetensi']);
    const kode = nilaiLama_(oldHeaders, row, ['KodeKualifikasi', 'Kode Kualifikasi', 'Kode']);
    const tglBuat = nilaiLama_(oldHeaders, row, ['TglBuat', 'Tgl Buat', 'Tanggal Buat']);
    const expired = nilaiLama_(oldHeaders, row, ['ExpiredDate', 'Expired Date', 'TglExpired', 'Tgl Expired']);
    const bidang = nilaiLama_(oldHeaders, row, ['Bidang']);
    const subBidang = nilaiLama_(oldHeaders, row, ['SubBidang', 'Sub Bidang']);

    const keteranganLama = nilaiLama_(oldHeaders, row, ['Keterangan']);
    const keteranganTambahan = gabungKeterangan_([
      {label: 'No Sertifikat', value: nilaiLama_(oldHeaders, row, ['NoSertifikat', 'No Sertifikat', 'Nomor Sertifikat'])},
      {label: 'No Registrasi', value: nilaiLama_(oldHeaders, row, ['NoRegistrasi', 'No Registrasi', 'Nomor Registrasi'])},
      {label: 'Tgl Buat Registrasi', value: nilaiLama_(oldHeaders, row, ['TglBuatRegistrasi', 'Tgl Buat Registrasi'])},
      {label: 'Tgl Expired Registrasi', value: nilaiLama_(oldHeaders, row, ['TglExpiredRegistrasi', 'Tgl Expired Registrasi'])},
      {label: 'PJT', value: nilaiLama_(oldHeaders, row, ['PJT'])},
      {label: 'TT', value: nilaiLama_(oldHeaders, row, ['TT'])},
      {label: 'Keterangan Lama', value: keteranganLama}
    ]);

    const ket = [keteranganTambahan].filter(Boolean).join(' | ');
    const uploadFileName = nilaiLama_(oldHeaders, row, ['UploadFileName', 'NamaFile', 'FileName']);
    const uploadFileUrl = nilaiLama_(oldHeaders, row, ['UploadFileUrl', 'FileUrl', 'URLFile', 'LinkFile']);
    return [timestamp, id, uploadFileName, uploadFileUrl, nama, serkom, kode, tglBuat, expired, bidang, subBidang, ket];
  }

  // LEGAL RMA/FMA/ZMA
  const legal = nilaiLama_(oldHeaders, row, ['Legal', 'Nama Legal', 'Dokumen']);
  const noDokumen = nilaiLama_(oldHeaders, row, ['NoDokumen', 'No Dokumen', 'Nomer Dokumen', 'Nomor Dokumen', 'NoSertifikat', 'No Sertifikat', 'Nomor Sertifikat']);
  const tglDokumen = nilaiLama_(oldHeaders, row, ['TglDokumen', 'Tgl Dokumen', 'Tanggal Dokumen', 'TglBuat', 'Tgl Buat', 'Tanggal Buat']);
  const tglExpired = nilaiLama_(oldHeaders, row, ['TglExpired', 'Tgl Expired', 'Tanggal Expired', 'ExpiredDate', 'Expired Date']);
  const keterangan = nilaiLama_(oldHeaders, row, ['Keterangan']);

  const uploadFileName = nilaiLama_(oldHeaders, row, ['UploadFileName', 'NamaFile', 'FileName']);
  const uploadFileUrl = nilaiLama_(oldHeaders, row, ['UploadFileUrl', 'FileUrl', 'URLFile', 'LinkFile']);
  return [timestamp, id, uploadFileName, uploadFileUrl, legal, noDokumen, tglDokumen, tglExpired, keterangan];
}

function buatNamaBackup_(sheetName) {
  const ss = getSpreadsheet_();
  const stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'Asia/Jakarta', 'yyyyMMdd_HHmmss');
  let name = 'BACKUP_' + sheetName + '_' + stamp;
  let n = 2;
  while (ss.getSheetByName(name)) {
    name = 'BACKUP_' + sheetName + '_' + stamp + '_' + n++;
  }
  return name;
}

function formatHeader_(sheet, jumlahKolom) {
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, jumlahKolom)
    .setFontWeight('bold')
    .setBackground('#172554')
    .setFontColor('#ffffff');
  sheet.autoResizeColumns(1, jumlahKolom);
}

function getUploadFolder_() {
  try {
    if (DRIVE_FOLDER_ID) {
      return DriveApp.getFolderById(DRIVE_FOLDER_ID);
    }
    return DriveApp.getRootFolder();
  } catch (err) {
    throw new Error(
      'Google Drive belum diberi izin. Buka Apps Script, pilih fungsi authorizeApp, klik Run, lalu izinkan akses Google Drive. ' +
      'Setelah itu deploy ulang Web App dengan Execute as: Me. Detail: ' +
      (err && err.message ? err.message : err)
    );
  }
}

function uploadPdf_(e) {
  const fileName = String(e.parameter.fileName || '').trim();
  const mimeType = String(e.parameter.mimeType || '').toLowerCase();
  const base64 = String(e.parameter.fileBase64 || '');

  if (!fileName || !base64) throw new Error('File PDF belum diterima.');
  if (mimeType !== 'application/pdf' && !fileName.toLowerCase().endsWith('.pdf')) {
    throw new Error('File harus berupa PDF.');
  }

  const bytes = Utilities.base64Decode(base64);
  if (bytes.length > MAX_UPLOAD_BYTES) throw new Error('Ukuran PDF maksimal 10 MB.');

  const safeName = fileName.replace(/[^a-zA-Z0-9._ -]/g, '_');
  const blob = Utilities.newBlob(bytes, 'application/pdf', safeName);
  const file = getUploadFolder_().createFile(blob);

  return {
    success: true,
    fileId: file.getId(),
    fileName: file.getName(),
    fileUrl: file.getUrl(),
    uploadedAt: new Date().toISOString()
  };
}

function doGet(e) {
  try {
    const kategori = (e && e.parameter && e.parameter.kategori || '').toLowerCase();
    const cfg = SHEET_CONFIG[kategori];

    if (!cfg) {
      return jsonOutput_({ error: 'Kategori tidak dikenal: ' + kategori });
    }

    const sheet = getOrCreateSheet_(cfg);
    const data = sheet.getDataRange().getValues();

    if (data.length <= 1) return jsonOutput_([]);

    const headers = data[0].map(h =>
      h.toString().trim().replace(/\s+/g, '').toLowerCase()
    );

    const result = data.slice(1).map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        let val = row[index];
        if (val instanceof Date) {
          val = Utilities.formatDate(
            val,
            Session.getScriptTimeZone() || 'Asia/Jakarta',
            'yyyy-MM-dd'
          );
        }
        obj[header] = val;
      });
      return obj;
    }).filter(obj =>
      cfg.identCols.some(c => obj[c.toLowerCase()])
    );

    return jsonOutput_(result);

  } catch (error) {
    return jsonOutput_({
      error: error.toString()
    });
  }
}

function doPost(e) {
  try {
    const action = String(e && e.parameter && e.parameter.action || '').toLowerCase();

    if (action === 'upload') {
      return jsonOutput_(uploadPdf_(e));
    }

    const kategori = (e && e.parameter && e.parameter.kategori || '').toLowerCase();
    const cfg = SHEET_CONFIG[kategori];

    if (!cfg) {
      return jsonOutput_({ success: false, error: 'Kategori tidak dikenal: ' + kategori });
    }

    if (!e.parameter.fileId || !e.parameter.fileUrl) {
      return jsonOutput_({ success: false, error: 'PDF wajib diupload terlebih dahulu.' });
    }

    const sheet = getOrCreateSheet_(cfg);
    const timestamp = new Date();
    const id = 'ID-' + Date.now().toString().slice(-8);
    const row = [timestamp, id,
      (e.parameter.fileName || '').toString().trim(),
      (e.parameter.fileUrl || '').toString().trim()];

    cfg.headers.slice(4).forEach(h => {
      const paramKey = h.charAt(0).toLowerCase() + h.slice(1);
      row.push((e.parameter[paramKey] || '').toString().trim());
    });

    sheet.appendRow(row);
    return jsonOutput_({ success: true, message: 'Success', id: id });

  } catch (error) {
    console.error(error);
    return jsonOutput_({
      success: false,
      error: String(error && error.message ? error.message : error),
      detail: String(error && error.stack ? error.stack : '')
    });
  }
}

// ================================================================
// OTORISASI GOOGLE
// Jalankan authorizeApp() SEKALI dari editor Apps Script setelah
// menempel code.gs ini. Pilih akun pemilik/akun yang dipakai pada
// setting 'Execute as: Me' pada Web App, lalu izinkan akses.
// ================================================================
function authorizeApp() {
  const ss = getSpreadsheet_();
  const sheetName = ss.getName();
  const folder = getUploadFolder_();
  const folderName = folder.getName();

  Logger.log('Spreadsheet OK: ' + sheetName);
  Logger.log('Google Drive OK: ' + folderName);
  return 'OTORISASI OK | Spreadsheet: ' + sheetName + ' | Folder: ' + folderName;
}

// Jalankan sekali secara manual setelah menambahkan DriveApp atau mengganti akun/deployment.
// Fungsi ini hanya untuk memicu otorisasi Drive dan memastikan folder upload dapat diakses.
function testDriveAccess() {
  const folder = getUploadFolder_();
  const result = 'Akses Google Drive OK. Folder: ' + folder.getName();
  Logger.log(result);
  return result;
}

function jsonOutput_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function textOutput_(text) {
  return ContentService
    .createTextOutput(text)
    .setMimeType(ContentService.MimeType.TEXT);
}

// ================================================================
// REMINDER
// ================================================================
function kumpulkanReminder_() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const mendekatiED = [];
  const sudahED = [];

  Object.keys(SHEET_CONFIG).forEach(kategori => {
    const cfg = SHEET_CONFIG[kategori];
    const sheet = getOrCreateSheet_(cfg);
    const data = sheet.getDataRange().getValues();

    if (data.length <= 1) return;

    const headers = data[0].map(h => h.toString().trim());
    const rows = data.slice(1);

    const idxIdent = cfg.identCols.map(c => headers.indexOf(c));
    const idxStatus = cfg.statusCols.map(c => headers.indexOf(c));

    rows.forEach(row => {
      const namaLabel = idxIdent
        .map(i => i >= 0 ? row[i] : '')
        .filter(Boolean)
        .join(' - ');

      if (!namaLabel) return;

      let bestDiff = null;

      idxStatus.forEach(i => {
        if (i < 0) return;

        const d = new Date(row[i]);
        if (isNaN(d.getTime())) return;

        const diff = Math.ceil(
          (d - today) / (1000 * 60 * 60 * 24)
        );

        if (bestDiff === null || diff < bestDiff) {
          bestDiff = diff;
        }
      });

      if (bestDiff === null) return;

      const label = `[${cfg.sheetName}] ${namaLabel}`;

      if (bestDiff < 0) {
        sudahED.push(
          `• ${label} - KEDALUWARSA (${Math.abs(bestDiff)} hari lalu)`
        );
      } else if (bestDiff <= REMINDER_DAYS) {
        mendekatiED.push(
          `• ${label} - Sisa ${bestDiff} hari lagi`
        );
      }
    });
  });

  return { mendekatiED, sudahED };
}

// ================================================================
// EMAIL REMINDER
// ================================================================
function kirimEmailReminder() {
  const EMAIL_TUJUAN = 'admin@majuabadigroup.com';

  const { mendekatiED, sudahED } = kumpulkanReminder_();

  if (mendekatiED.length === 0 && sudahED.length === 0) return;

  const subjek =
    '⚠️ [REMINDER SYSTEM] Status Masa Berlaku SERKOM & Legal MA Group';

  let isiEmail =
    'Halo Admin,\n\n' +
    'Berikut laporan dokumen yang membutuhkan tindakan perpanjangan:\n\n';

  if (mendekatiED.length > 0) {
    isiEmail +=
      '🟡 MENDEKATI KEDALUWARSA (<= 120 HARI):\n' +
      mendekatiED.join('\n') + '\n\n';
  }

  if (sudahED.length > 0) {
    isiEmail +=
      '🔴 SUDAH KEDALUWARSA:\n' +
      sudahED.join('\n') + '\n\n';
  }

  isiEmail +=
    'Mohon segera diproses perpanjangannya.\n\n' +
    'Terima kasih,\nSmart Reminder System';

  MailApp.sendEmail(EMAIL_TUJUAN, subjek, isiEmail);
}

// ================================================================
// WHATSAPP REMINDER
// ================================================================
// Catatan keamanan:
// Token Fonnte sebaiknya disimpan di Script Properties, bukan ditulis
// langsung di source code. Fungsi di bawah membaca token dari Properties.
function kirimWhatsAppReminder() {
  const TOKEN_FONNTE =
    PropertiesService.getScriptProperties().getProperty('FONNTE_TOKEN');

  if (!TOKEN_FONNTE) {
    throw new Error(
      'FONNTE_TOKEN belum disimpan di Script Properties.'
    );
  }

  const DAFTAR_NOMOR = [
    '08980222087',
    '089669886598',
    '085640652416',
    '08995761175'
  ];

  const { mendekatiED, sudahED } = kumpulkanReminder_();
  const daftarPesan = [];

  sudahED.forEach(t => daftarPesan.push('🔴 ' + t));
  mendekatiED.forEach(t => daftarPesan.push('🟡 ' + t));

  if (daftarPesan.length === 0) return;

  const isiPesan =
    '*📢 [REMINDER SYSTEM] SERKOM & LEGAL MA GROUP*\n\n' +
    'Berikut dokumen yang memerlukan tindakan perpanjangan:\n\n' +
    daftarPesan.join('\n\n') +
    '\n\nMohon segera ditindaklanjuti. Terima kasih!';

  const payload = {
    target: DAFTAR_NOMOR.join(','),
    message: isiPesan
  };

  UrlFetchApp.fetch('https://api.fonnte.com/send', {
    method: 'post',
    headers: {
      Authorization: TOKEN_FONNTE
    },
    payload: payload,
    muteHttpExceptions: true
  });
}

// ================================================================
// JALANKAN 1X SAJA UNTUK MEMBUAT TRIGGER JAM 08.00
// ================================================================
function buatJadwalJam8Pagi() {
  const triggers = ScriptApp.getProjectTriggers();

  triggers.forEach(trigger => ScriptApp.deleteTrigger(trigger));

  ScriptApp.newTrigger('kirimWhatsAppReminder')
    .timeBased()
    .everyDays(1)
    .atHour(8)
    .create();

  ScriptApp.newTrigger('kirimEmailReminder')
    .timeBased()
    .everyDays(1)
    .atHour(8)
    .create();
}

// ================================================================
// OPSIONAL: SIMPAN TOKEN FONNTE
// Jalankan sekali setelah mengganti token di fungsi ini.
// Setelah itu hapus/ganti token di source.
// ================================================================
function simpanTokenFonnte() {
  const TOKEN_BARU = 'TEMPEL_TOKEN_FONNTE_DI_SINI';

  PropertiesService.getScriptProperties()
    .setProperty('FONNTE_TOKEN', TOKEN_BARU);

  Logger.log('Token Fonnte berhasil disimpan di Script Properties.');
}

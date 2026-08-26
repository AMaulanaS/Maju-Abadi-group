const SHEET_NAME = 'DataSurat'; // Pastikan nama tab di Google Sheets sesuai

function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    const timestamp = new Date();
    const id = 'ID-' + Date.now().toString().slice(-6); // ID unik otomatis
    const aksi = 'Aktif';

    sheet.appendRow([
      timestamp,
      aksi,
      id,
      e.parameter.namaPerusahaan,
      e.parameter.jenisSurat,
      e.parameter.nomorSurat,
      e.parameter.tanggalTerbit,
      e.parameter.tanggalBerakhir,
      e.parameter.keterangan
    ]);
    return ContentService.createTextOutput("Success").setMimeType(ContentService.MimeType.TEXT);
  } catch (error) {
    return ContentService.createTextOutput("Error: " + error.toString()).setMimeType(ContentService.MimeType.TEXT);
  }
}

function doGet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) {
    return ContentService.createTextOutput("[]").setMimeType(ContentService.MimeType.JSON);
  }
  
  // Menghapus spasi dan mengubah nama header menjadi huruf kecil tanpa spasi
  const headers = data[0].map(h => h.toString().trim().toLowerCase().replace(/\s+/g, ''));
  const rows = data.slice(1);
  
  const result = rows.map(row => {
    let obj = {};
    headers.forEach((header, index) => {
      let val = row[index];
      if (val instanceof Date) {
        val = val.toISOString().split('T')[0];
      }
      obj[header] = val;
    });
    return obj;
  });
  
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

// FUNGSI OTOMATIS: Kirim Notifikasi Email
function kirimEmailReminder() {
  const EMAIL_TUJUAN = "admin@majuabadigroup.com"; 
  
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) return;
  
  const today = new Date();
  today.setHours(0,0,0,0);
  
  let mendekatiED = [];
  let sudahED = [];

  for (let i = 1; i < data.length; i++) {
    const namaPerusahaan = data[i][3]; // Kolom D (Nama Perusahaan)
    const jenisSurat = data[i][4];     // Kolom E (Jenis Surat)
    const nomorSurat = data[i][5];     // Kolom F (Nomor Surat)
    const expDate = new Date(data[i][7]); // Kolom H (Tanggal Berakhir)

    if (isNaN(expDate.getTime())) continue;

    const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      sudahED.push(`• ${namaPerusahaan} [${jenisSurat}: ${nomorSurat}] - KEDALUWARSA`);
    } else if (diffDays <= 30) {
      mendekatiED.push(`• ${namaPerusahaan} [${jenisSurat}: ${nomorSurat}] - Sisa ${diffDays} hari lagi`);
    }
  }

  if (mendekatiED.length > 0 || sudahED.length > 0) {
    const subjek = "⚠️ [REMINDER SYSTEM] Status Masa Berlaku SBU & SERKOM";
    let isiEmail = "Halo Admin,\n\nBerikut laporan dokumen yang membutuhkan tindakan perpanjangan:\n\n";

    if (mendekatiED.length > 0) {
      isiEmail += "🟡 MENDEKATI KEDALUWARSA (<= 30 HARI):\n" + mendekatiED.join("\n") + "\n\n";
    }
    if (sudahED.length > 0) {
      isiEmail += "🔴 SUDAH KEDALUWARSA:\n" + sudahED.join("\n") + "\n\n";
    }

    isiEmail += "Mohon segera diproses perpanjangannya.\n\nTerima kasih,\nSmart Reminder System";

    MailApp.sendEmail(EMAIL_TUJUAN, subjek, isiEmail);
  }
}

// FUNGSI OTOMATIS: Kirim Notifikasi WhatsApp
function kirimWhatsAppReminder() {
  const TOKEN_FONNTE = 'eLG4g5euahY6zaaxpcRVSW2YAgY5a4veYUHys5iKRc7JWo';
  const DAFTAR_NOMOR = [
    '08980222087',  // Nomor Admin 1
    '089669886598',  // Nomor Admin 2
    '085640652416', // Nomor Penanggung Jawab (Sudah ditambah koma)
    '08995761175'   // Nomor Penanggung Jawab
  ];

  const NOMOR_WA_TUJUAN = DAFTAR_NOMOR.join(',');
  
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) return;
  
  const today = new Date();
  today.setHours(0,0,0,0);
  
  let daftarPesan = [];

  for (let i = 1; i < data.length; i++) {
    const namaPerusahaan = data[i][3]; // Kolom D
    const jenisSurat = data[i][4];     // Kolom E
    const nomorSurat = data[i][5];     // Kolom F
    const expDate = new Date(data[i][7]); // Kolom H

    if (isNaN(expDate.getTime())) continue;

    const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      daftarPesan.push(`🔴 *${namaPerusahaan}* [${jenisSurat}: ${nomorSurat}]\n   Status: *KEDALUWARSA*`);
    } else if (diffDays <= 30) {
      daftarPesan.push(`🟡 *${namaPerusahaan}* [${jenisSurat}: ${nomorSurat}]\n   Status: Sisa *${diffDays} Hari* lagi`);
    }
  }

  if (daftarPesan.length > 0) {
    const isiPesan = "*📢 [REMINDER SYSTEM] SBU & SERKOM*\n\n" +
                     "Berikut dokumen yang memerlukan tindakan perpanjangan:\n\n" +
                     daftarPesan.join("\n\n") +
                     "\n\nMohon segera ditindaklanjuti. Terima kasih!";

    const payload = {
      'target': NOMOR_WA_TUJUAN,
      'message': isiPesan
    };

    const options = {
      'method': 'post',
      'headers': {
        'Authorization': TOKEN_FONNTE
      },
      'payload': payload
    };

    UrlFetchApp.fetch('https://api.fonnte.com/send', options);
  }
}

// Jalankan fungsi ini 1x saja dari editor untuk membuat pemicu Jam 8 Pagi otomatis
function buatJadwalJam8Pagi() {
  // Menghapus pemicu lama agar tidak duplikat
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => ScriptApp.deleteTrigger(trigger));

  // Membuat pemicu baru tiap jam 8 pagi
  ScriptApp.newTrigger('kirimWhatsAppReminder')
           .timeBased()
           .everyDays(1)
           .atHour(8) // Mengatur jam kirim (Jam 8 Pagi)
           .create();
}

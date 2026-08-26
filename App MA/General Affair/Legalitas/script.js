const SHEET_NAME = 'DataSurat'; // Pastikan nama tab di Google Sheets sesuai ini

// Menerima data baru dari Form Web
function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    sheet.appendRow([
      e.parameter.nama,
      e.parameter.jenis,
      e.parameter.nomor,
      e.parameter.tanggal
    ]);
    return ContentService.createTextOutput("Success").setMimeType(ContentService.MimeType.TEXT);
  } catch (error) {
    return ContentService.createTextOutput("Error: " + error.toString()).setMimeType(ContentService.MimeType.TEXT);
  }
}

// Mengambil data dari Sheets ke Web (Format JSON)
function doGet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) {
    return ContentService.createTextOutput("[]").setMimeType(ContentService.MimeType.JSON);
  }
  
  const headers = data[0].map(h => h.toString().trim().toLowerCase());
  const rows = data.slice(1);
  
  const result = rows.map(row => {
    let obj = {};
    headers.forEach((header, index) => {
      let val = row[index];
      if (header === 'tanggal' && val instanceof Date) {
        val = val.toISOString().split('T')[0];
      }
      obj[header] = val;
    });
    return obj;
  });
  
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

//reminder gmail
// FUNGSI OTOMATIS: Kirim Notifikasi Email Pengingat
function kirimEmailReminder() {
  const EMAIL_TUJUAN = "emailanda@gmail.com"; // ⚠️ Ganti dengan alamat email Anda
  
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) return;
  
  const today = new Date();
  today.setHours(0,0,0,0);
  
  let mendekatiED = [];
  let sudahED = [];

  // Pindai data dari baris ke-2
  for (let i = 1; i < data.length; i++) {
    const namaPerusahaan = data[i][3]; // Kolom D (Nama Perusahaan)
    const jenisSurat = data[i][4];     // Kolom E (Jenis Surat)
    const nomorSurat = data[i][5];     // Kolom F (Nomor Surat)
    const expDate = new Date(data[i][7]); // Kolom H (Tanggal Berakhir)

    if (isNaN(expDate.getTime())) continue;

    const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      sudahED.push(`• ${namaPerusahaan} [${jenisSurat}: ${nomorSurat}] - KEDALUWARSA`);
    } else if (diffDays <= 30) { // Mengingatkan jika sisa <= 30 hari
      mendekatiED.push(`• ${namaPerusahaan} [${jenisSurat}: ${nomorSurat}] - Sisa ${diffDays} hari lagi`);
    }
  }

  // Kirim Email jika ada dokumen yang perlu tindakan
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
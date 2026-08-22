/**
 * SISTEM PENGINGAT KENDARAAN
 * Google Apps Script
 *
 * LANGKAH:
 * 1. Buat Google Sheet baru.
 * 2. Buka Extensions > Apps Script.
 * 3. Ganti isi Code.gs dengan kode ini.
 * 4. Jalankan fungsi setup() satu kali dan izinkan akses.
 * 5. Deploy > New deployment > Web app.
 *    Execute as: Me
 *    Who has access: Anyone
 * 6. Salin URL /exec ke script.js -> API_URL.
 *
 * Kolom Sheet:
 * ID | Timestamp | Plat | Pemilik | Jenis | JatuhTempo | WhatsApp | Email | Catatan | LastReminder
 */

const SHEET_NAME = "Kendaraan";
const REMINDER_DAYS = [30, 14, 7, 1, 0];

function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "ID", "Timestamp", "Plat", "Pemilik", "Jenis",
      "JatuhTempo", "WhatsApp", "Email", "Catatan", "LastReminder"
    ]);
  }

  sheet.setFrozenRows(1);
  sheet.getRange("F:F").setNumberFormat("yyyy-mm-dd");

  const props = PropertiesService.getScriptProperties();
  props.setProperty("SHEET_ID", ss.getId());

  // Buat trigger harian hanya sekali.
  const exists = ScriptApp.getProjectTriggers()
    .some(t => t.getHandlerFunction() === "sendReminders");

  if (!exists) {
    ScriptApp.newTrigger("sendReminders")
      .timeBased()
      .everyDays(1)
      .atHour(8)
      .create();
  }
}

function getSheet_() {
  const id = PropertiesService.getScriptProperties().getProperty("SHEET_ID");
  if (!id) throw new Error("Jalankan setup() terlebih dahulu.");
  const ss = SpreadsheetApp.openById(id);
  return ss.getSheetByName(SHEET_NAME);
}

function doGet(e) {
  const p = e && e.parameter ? e.parameter : {};
  const action = p.action || "list";
  const callback = p.callback;

  let payload;
  try {
    if (action === "list") {
      payload = {ok:true, data:listVehicles_()};
    } else {
      payload = {ok:false, message:"Action tidak dikenal."};
    }
  } catch (err) {
    payload = {ok:false, message:String(err)};
  }

  const json = JSON.stringify(payload);

  if (callback) {
    return ContentService
      .createTextOutput(callback + "(" + json + ");")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const p = e && e.parameter ? e.parameter : {};
    if (p.action === "save") {
      saveVehicle_(p);
      return ContentService.createTextOutput(JSON.stringify({
        ok:true, message:"Data berhasil disimpan."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      ok:false, message:"Action tidak dikenal."
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      ok:false, message:String(err)
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function saveVehicle_(p) {
  const required = ["plat","pemilik","jenis","jatuhTempo"];
  required.forEach(k => {
    if (!p[k]) throw new Error("Field wajib kosong: " + k);
  });

  const sheet = getSheet_();
  const id = Utilities.getUuid();

  sheet.appendRow([
    id,
    new Date(),
    p.plat.toUpperCase().trim(),
    p.pemilik.trim(),
    p.jenis,
    p.jatuhTempo,
    p.whatsapp || "",
    p.email || "",
    p.catatan || "",
    ""
  ]);
}

function listVehicles_() {
  const sheet = getSheet_();
  const values = sheet.getDataRange().getDisplayValues();

  if (values.length <= 1) return [];

  return values.slice(1).filter(row => row[0]).map(row => ({
    id: row[0],
    timestamp: row[1],
    plat: row[2],
    pemilik: row[3],
    jenis: row[4],
    jatuhTempo: normalizeDate_(row[5]),
    whatsapp: row[6],
    email: row[7],
    catatan: row[8],
    lastReminder: row[9]
  }));
}

function normalizeDate_(value) {
  if (!value) return "";
  // Jika sudah yyyy-mm-dd dari Sheets
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const d = new Date(value);
  if (isNaN(d)) return value;
  return Utilities.formatDate(d, Session.getScriptTimeZone(), "yyyy-MM-dd");
}

function sendReminders() {
  const sheet = getSheet_();
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return;

  const tz = Session.getScriptTimeZone();
  const today = new Date();
  const todayKey = Utilities.formatDate(today, tz, "yyyy-MM-dd");
  const dayStart = new Date(Utilities.formatDate(today, tz, "yyyy/MM/dd"));

  for (let r = 1; r < values.length; r++) {
    const row = values[r];
    const email = String(row[7] || "").trim();
    const due = new Date(row[5]);
    if (isNaN(due)) continue;

    const dueStart = new Date(Utilities.formatDate(due, tz, "yyyy/MM/dd"));
    const diff = Math.round((dueStart - dayStart) / 86400000);

    if (REMINDER_DAYS.indexOf(diff) === -1) continue;

    const lastReminder = String(row[9] || "");
    const reminderKey = `${todayKey}|H-${diff}`;

    if (lastReminder === reminderKey) continue;

    if (email) {
      const plat = row[2];
      const pemilik = row[3];
      const jenis = row[4];
      const dueText = Utilities.formatDate(due, tz, "dd MMMM yyyy");

      let status;
      if (diff === 0) {
        status = "Hari ini adalah tanggal jatuh tempo.";
      } else if (diff > 0) {
        status = `Tersisa ${diff} hari lagi.`;
      } else {
        status = `Sudah lewat ${Math.abs(diff)} hari.`;
      }

      const subject = `Pengingat Kendaraan ${plat} - ${diff === 0 ? "Jatuh Tempo Hari Ini" : "Segera Diperpanjang"}`;

      const body = [
        `Halo ${pemilik},`,
        "",
        `Ini adalah pengingat perpanjangan surat kendaraan.`,
        "",
        `Nomor Polisi : ${plat}`,
        `Jenis         : ${jenis}`,
        `Jatuh Tempo   : ${dueText}`,
        `Status        : ${status}`,
        "",
        "Mohon segera melakukan perpanjangan sesuai kebutuhan.",
        "",
        "Pesan ini dikirim otomatis oleh Sistem Pengingat Kendaraan."
      ].join("\n");

      MailApp.sendEmail({
        to: email,
        subject: subject,
        body: body
      });
    }

    sheet.getRange(r + 1, 10).setValue(reminderKey);
  }
}

/*
 * OPSIONAL: WhatsApp otomatis
 * Untuk penggunaan nyata, isi kredensial Meta WhatsApp Cloud API.
 * Jangan taruh token rahasia di HTML/JS; token harus tetap di Apps Script.
 *
 * Contoh konfigurasi:
 *
 * const WA_TOKEN = "ISI_TOKEN";
 * const WA_PHONE_NUMBER_ID = "ISI_PHONE_NUMBER_ID";
 *
 * Lalu panggil sendWhatsApp_(nomor, pesan).
 *
 * Karena WhatsApp Cloud API membutuhkan setup akun/template yang sesuai,
 * versi awal ini menggunakan tombol WhatsApp di website.
 */

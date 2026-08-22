const SPREADSHEET_ID = "1-P0Zsmpl9Eh5KW8Gx40BiWbBKXE_Uar2j_COeFbe_Tw";
const DRIVE_FOLDER_ID = "1KXkNIbgWFK0ydYxG4fcODCvZ1AZCA5Kx";
const SHEET_NAME = "Surat Jalan";

function setup() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) sh = ss.insertSheet(SHEET_NAME);

  if (sh.getLastRow() === 0) {
    sh.appendRow([
      "Timestamp",
      "Perusahaan",
      "No Surat Jalan",
      "Tanggal",
      "Tujuan",
      "Alamat",
      "No Kendaraan",
      "Sopir",
      "Barang JSON",
      "Catatan",
      "TTD Penerima",
      "TTD Pengirim",
      "TTD Hormat Kami"
    ]);
    sh.setFrozenRows(1);
  }
}

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({
      ok: true,
      message: "API Surat Jalan aktif"
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    setup();

    // Website sekarang mengirim: payload=<JSON>
    const rawPayload =
      (e && e.parameter && e.parameter.payload)
      ? e.parameter.payload
      : ((e && e.postData && e.postData.contents) || "");

    if (!rawPayload) {
      throw new Error("Payload kosong. Pastikan website menggunakan versi script.js terbaru.");
    }

    let data;
    try {
      data = JSON.parse(rawPayload);
    } catch (parseErr) {
      throw new Error("Payload bukan JSON yang valid: " + parseErr.message);
    }

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(SHEET_NAME);
    if (!sh) throw new Error('Sheet "' + SHEET_NAME + '" tidak ditemukan.');

    // Simpan data utama terlebih dahulu.
    sh.appendRow([
      new Date(),
      data.company && data.company.name ? data.company.name : "",
      data.nomor || "",
      data.tanggal || "",
      data.tujuan || "",
      data.alamat || "",
      data.kendaraan || "",
      data.sopir || "",
      JSON.stringify(data.items || []),
      data.catatan || "",
      "",
      "",
      ""
    ]);

    const rowNumber = sh.getLastRow();

    // Simpan 3 tanda tangan ke folder Google Drive.
    const sigs = data.signatures || {};
    const keys = [
      { key:"penerima", col:11 },
      { key:"pengirim", col:12 },
      { key:"hormat", col:13 }
    ];

    const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);

    keys.forEach(item => {
      const sig = sigs[item.key];
      if (!sig || !String(sig).startsWith("data:image/png;base64,")) return;

      const bytes = Utilities.base64Decode(String(sig).split(",")[1]);
      const filename =
        item.key + "_" +
        String(data.nomor || "surat-jalan").replace(/[^a-zA-Z0-9_-]/g, "_") +
        "_" + Date.now() + ".png";

      const blob = Utilities.newBlob(bytes, "image/png", filename);
      const file = folder.createFile(blob);

      sh.getRange(rowNumber, item.col).setValue(file.getUrl());
    });

    return ContentService
      .createTextOutput(JSON.stringify({
        ok:true,
        row:rowNumber,
        message:"Data dan tanda tangan berhasil disimpan."
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    console.error(err);
    return ContentService
      .createTextOutput(JSON.stringify({
        ok:false,
        error:String(err),
        stack:err && err.stack ? err.stack : ""
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

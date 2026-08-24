const SPREADSHEET_ID = "180IBhlVD0R0zHGqhlBauqtlyOpgVOW3MUjLY5aJvtQM";
const DRIVE_FOLDER_ID = "16Agi6Poj_Qhn5g1GjnHb4eo8lie2AvNd";

function setup() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  const specs = {
    "Master Alat": [
      "Timestamp","Aksi","Kode Alat","Nama Alat","Kategori","Merk/Tipe",
      "Nomor Seri","Tahun","Kondisi","Status","Lokasi","Keterangan"
    ],
    "Peminjaman": [
      "Timestamp","Aksi","No Pinjam","Tanggal Pinjam","Peminjam",
      "Departemen/Proyek","Keperluan","Kode Alat","Nama Alat","Qty",
      "Kondisi Pinjam","Status","Tanggal Kembali","Kondisi Kembali","Catatan"
    ],
    "Riwayat": [
      "Timestamp","Aksi","No Pinjam","Kode Alat","Nama Alat","Peminjam",
      "Tanggal Pinjam","Tanggal Kembali","Status","Kondisi Pinjam",
      "Kondisi Kembali","Catatan"
    ]
  };

  Object.entries(specs).forEach(([name, headers]) => {
    let sh = ss.getSheetByName(name);
    if (!sh) sh = ss.insertSheet(name);

    if (sh.getLastRow() === 0) {
      sh.appendRow(headers);
      sh.setFrozenRows(1);
    }
  });

  return ss;
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function jsonp_(callback, obj) {
  const safeCallback = String(callback || "").replace(/[^\w.$]/g, "");
  if (!safeCallback) return json_(obj);

  return ContentService
    .createTextOutput(safeCallback + "(" + JSON.stringify(obj) + ");")
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function doGet(e) {
  try {
    const ss = setup();
    const master = ss.getSheetByName("Master Alat");
    const pinjaman = ss.getSheetByName("Peminjaman");

    const alat = readMaster_(master);
    const transaksi = readPeminjaman_(pinjaman);

    const result = {
      ok: true,
      alat: alat,
      pinjaman: transaksi,
      timestamp: new Date().toISOString()
    };

    const callback = e && e.parameter ? e.parameter.callback : "";
    return jsonp_(callback, result);

  } catch (err) {
    const result = { ok: false, error: String(err) };
    const callback = e && e.parameter ? e.parameter.callback : "";
    return jsonp_(callback, result);
  }
}

function readMaster_(sh) {
  const lastRow = sh.getLastRow();
  if (lastRow < 2) return [];

  const values = sh.getRange(2, 1, lastRow - 1, 12).getValues();

  return values.map(r => ({
    id: "db-" + String(r[2] || ""),
    kode: String(r[2] || ""),
    nama: String(r[3] || ""),
    kategori: String(r[4] || ""),
    merk: String(r[5] || ""),
    seri: String(r[6] || ""),
    tahun: String(r[7] || ""),
    kondisi: String(r[8] || ""),
    status: String(r[9] || ""),
    lokasi: String(r[10] || ""),
    keterangan: String(r[11] || "")
  })).filter(a => a.kode);
}

function readPeminjaman_(sh) {
  const lastRow = sh.getLastRow();
  if (lastRow < 2) return [];

  const values = sh.getRange(2, 1, lastRow - 1, 15).getValues();

  return values.map((r, index) => ({
    id: "db-pin-" + (index + 2) + "-" + String(r[2] || ""),
    no: String(r[2] || ""),
    tanggal: formatDate_(r[3]),
    peminjam: String(r[4] || ""),
    proyek: String(r[5] || ""),
    keperluan: String(r[6] || ""),
    alatKode: String(r[7] || ""),
    alatNama: String(r[8] || ""),
    qty: Number(r[9] || 1),
    kondisiPinjam: String(r[10] || ""),
    status: String(r[11] || ""),
    tanggalKembali: formatDate_(r[12]),
    kondisiKembali: String(r[13] || ""),
    catatan: String(r[14] || ""),
    catatanKembali: String(r[14] || "")
  })).filter(p => p.no);
}

function formatDate_(value) {
  if (!value) return "";
  if (Object.prototype.toString.call(value) === "[object Date]" && !isNaN(value)) {
    return Utilities.formatDate(
      value,
      Session.getScriptTimeZone() || "Asia/Jakarta",
      "yyyy-MM-dd"
    );
  }
  return String(value);
}

function doPost(e) {
  try {
    const ss = setup();

    const raw =
      e && e.parameter && e.parameter.payload
        ? e.parameter.payload
        : e && e.postData && e.postData.contents
          ? e.postData.contents
          : "";

    if (!raw) throw new Error("Payload kosong");

    const d = JSON.parse(raw);
    const type = d.type;
    const r = d.record || {};
    const a = d.alat || {};

    const now = new Date();
    const master = ss.getSheetByName("Master Alat");
    const peminjaman = ss.getSheetByName("Peminjaman");
    const riwayat = ss.getSheetByName("Riwayat");

    if (type === "ALAT") {
      master.appendRow([
        now, "TAMBAH",
        a.kode, a.nama, a.kategori, a.merk, a.seri, a.tahun,
        a.kondisi, a.status, a.lokasi, a.keterangan
      ]);

    } else if (type === "UPDATE_STATUS") {
      master.appendRow([
        now, "UPDATE STATUS",
        a.kode, a.nama, a.kategori, a.merk, a.seri, a.tahun,
        a.kondisi, a.status, a.lokasi, a.keterangan
      ]);

      riwayat.appendRow([
        now, "UPDATE STATUS", "",
        a.kode, a.nama, "", "", "",
        a.status, "", a.kondisi,
        r.catatanStatus || ""
      ]);

    } else if (type === "PINJAM") {
      master.appendRow([
        now, "PINJAM",
        a.kode, a.nama, a.kategori, a.merk, a.seri, a.tahun,
        a.kondisi, "Dipinjam", a.lokasi, a.keterangan
      ]);

      peminjaman.appendRow([
        now, "PINJAM",
        r.no, r.tanggal, r.peminjam, r.proyek, r.keperluan,
        r.alatKode, r.alatNama, r.qty, r.kondisiPinjam,
        r.status, "", "", r.catatan
      ]);

      riwayat.appendRow([
        now, "PINJAM",
        r.no, r.alatKode, r.alatNama, r.peminjam,
        r.tanggal, "", r.status, r.kondisiPinjam, "", r.catatan
      ]);

    } else if (type === "KEMBALI") {
      peminjaman.appendRow([
        now, "KEMBALI",
        r.no, r.tanggal, r.peminjam, r.proyek, r.keperluan,
        r.alatKode, r.alatNama, r.qty, r.kondisiPinjam,
        r.status, r.tanggalKembali, r.kondisiKembali, r.catatanKembali
      ]);

      riwayat.appendRow([
        now, "KEMBALI",
        r.no, r.alatKode, r.alatNama, r.peminjam,
        r.tanggal, r.tanggalKembali, r.status,
        r.kondisiPinjam, r.kondisiKembali, r.catatanKembali
      ]);

    } else {
      throw new Error("Tipe transaksi tidak dikenal: " + type);
    }

    return json_({ ok: true, type: type });

  } catch (err) {
    return json_({
      ok: false,
      error: String(err),
      stack: err && err.stack ? String(err.stack) : ""
    });
  }
}

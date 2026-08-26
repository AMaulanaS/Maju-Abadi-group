const SPREADSHEET_ID = "180IBhlVD0R0zHGqhlBauqtlyOpgVOW3MUjLY5aJvtQM";
const DRIVE_FOLDER_ID = "16Agi6Poj_Qhn5g1GjnHb4eo8lie2AvNd";

/*
 * SKEMA SHEET
 * -----------
 * Master Alat: Timestamp, Aksi, Kode Alat, Nama Alat, Jumlah,
 *   Rusak Ringan, Rusak Berat, Hilang,
 *   Kategori, Merk/Tipe, Nomor Seri, Tahun, Kondisi, Status, Lokasi, Keterangan
 * Peminjaman: Timestamp, Aksi, No Pinjam, Tanggal Pinjam, Peminjam,
 *   Departemen/Proyek, Keperluan, Kode Alat, Nama Alat, Qty,
 *   Kondisi Pinjam, Status, Tanggal Kembali, Kondisi Kembali, Catatan,
 *   Qty Baik, Qty Rusak Ringan, Qty Rusak Berat, Qty Hilang
 * Riwayat: Timestamp, Aksi, No Pinjam, Kode Alat, Nama Alat, Peminjam,
 *   Tanggal Pinjam, Tanggal Kembali, Status, Kondisi Pinjam,
 *   Kondisi Kembali, Catatan, Qty, Qty Baik, Qty Rusak Ringan,
 *   Qty Rusak Berat, Qty Hilang
 */

const specs = {
  "Master Alat": [
    "Timestamp","Aksi","Kode Alat","Nama Alat","Jumlah",
    "Rusak Ringan","Rusak Berat","Hilang",
    "Kategori","Merk/Tipe","Nomor Seri","Tahun","Kondisi","Status","Lokasi","Keterangan"
  ],
  "Peminjaman": [
    "Timestamp","Aksi","No Pinjam","Tanggal Pinjam","Peminjam",
    "Departemen/Proyek","Keperluan","Kode Alat","Nama Alat","Qty",
    "Kondisi Pinjam","Status","Tanggal Kembali","Kondisi Kembali","Catatan",
    "Qty Baik","Qty Rusak Ringan","Qty Rusak Berat","Qty Hilang"
  ],
  "Riwayat": [
    "Timestamp","Aksi","No Pinjam","Kode Alat","Nama Alat","Peminjam",
    "Tanggal Pinjam","Tanggal Kembali","Status","Kondisi Pinjam",
    "Kondisi Kembali","Catatan","Qty",
    "Qty Baik","Qty Rusak Ringan","Qty Rusak Berat","Qty Hilang"
  ]
};

function setup() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  Object.entries(specs).forEach(([name, headers]) => {
    let sh = ss.getSheetByName(name);
    if (!sh) sh = ss.insertSheet(name);
    if (sh.getLastRow() === 0) {
      sh.appendRow(headers);
      sh.setFrozenRows(1);
    } else {
      ensureColumns_(sh, headers);
    }
  });
  return ss;
}

function ensureColumns_(sh, headers) {
  let lastCol = sh.getLastColumn();
  let existing = lastCol > 0
    ? sh.getRange(1, 1, 1, lastCol).getValues()[0].map(String)
    : [];
  headers.forEach(h => {
    if (existing.indexOf(h) === -1) {
      lastCol++;
      sh.getRange(1, lastCol).setValue(h);
      existing.push(h);
    }
  });
}

function headerMap_(sh) {
  const lastCol = sh.getLastColumn();
  if (lastCol === 0) return {};
  const headers = sh.getRange(1, 1, 1, lastCol).getValues()[0];
  const map = {};
  headers.forEach((h, i) => {
    if (h) map[String(h)] = i + 1;
  });
  return map;
}

function appendRowByHeader_(sh, obj) {
  const map = headerMap_(sh);
  const lastCol = sh.getLastColumn();
  const row = new Array(lastCol).fill("");
  Object.keys(obj).forEach(key => {
    const col = map[key];
    if (col) row[col - 1] = obj[key];
  });
  sh.appendRow(row);
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
  const lastCol = sh.getLastColumn();
  if (lastRow < 2 || lastCol < 1) return [];
  const map = headerMap_(sh);
  const values = sh.getRange(2, 1, lastRow - 1, lastCol).getValues();
  const g = (row, name) => (map[name] ? row[map[name] - 1] : "");
  const out = {};
  values.forEach(row => {
    const kode = String(g(row, "Kode Alat") || "");
    if (!kode) return;
    out[kode] = {
      id: "db-" + kode,
      kode: kode,
      nama: String(g(row, "Nama Alat") || ""),
      jumlah: Number(g(row, "Jumlah")) || 1,
      rusakRingan: Number(g(row, "Rusak Ringan")) || 0,
      rusakBerat: Number(g(row, "Rusak Berat")) || 0,
      hilang: Number(g(row, "Hilang")) || 0,
      kategori: String(g(row, "Kategori") || ""),
      merk: String(g(row, "Merk/Tipe") || ""),
      seri: String(g(row, "Nomor Seri") || ""),
      tahun: String(g(row, "Tahun") || ""),
      kondisi: String(g(row, "Kondisi") || ""),
      status: String(g(row, "Status") || ""),
      lokasi: String(g(row, "Lokasi") || ""),
      keterangan: String(g(row, "Keterangan") || "")
    };
  });
  return Object.values(out);
}

function readPeminjaman_(sh) {
  const lastRow = sh.getLastRow();
  const lastCol = sh.getLastColumn();
  if (lastRow < 2 || lastCol < 1) return [];
  const map = headerMap_(sh);
  const values = sh.getRange(2, 1, lastRow - 1, lastCol).getValues();
  const g = (row, name) => (map[name] ? row[map[name] - 1] : "");
  const out = {};
  values.forEach(row => {
    const no = String(g(row, "No Pinjam") || "");
    if (!no) return;
    const alatKode = String(g(row, "Kode Alat") || "");
    const key = no + "||" + alatKode;
    out[key] = {
      id: "db-pin-" + key,
      no: no,
      tanggal: formatDate_(g(row, "Tanggal Pinjam")),
      peminjam: String(g(row, "Peminjam") || ""),
      proyek: String(g(row, "Departemen/Proyek") || ""),
      keperluan: String(g(row, "Keperluan") || ""),
      alatKode: alatKode,
      alatNama: String(g(row, "Nama Alat") || ""),
      qty: Number(g(row, "Qty")) || 1,
      kondisiPinjam: String(g(row, "Kondisi Pinjam") || ""),
      status: String(g(row, "Status") || ""),
      tanggalKembali: formatDate_(g(row, "Tanggal Kembali")),
      kondisiKembali: String(g(row, "Kondisi Kembali") || ""),
      catatan: String(g(row, "Catatan") || ""),
      catatanKembali: String(g(row, "Catatan") || ""),
      qtyBaik: Number(g(row, "Qty Baik")) || 0,
      qtyRusakRingan: Number(g(row, "Qty Rusak Ringan")) || 0,
      qtyRusakBerat: Number(g(row, "Qty Rusak Berat")) || 0,
      qtyHilang: Number(g(row, "Qty Hilang")) || 0
    };
  });
  return Object.values(out);
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
      appendRowByHeader_(master, {
        "Timestamp": now, "Aksi": "TAMBAH",
        "Kode Alat": a.kode, "Nama Alat": a.nama,
        "Jumlah": a.jumlah || 1,
        "Rusak Ringan": a.rusakRingan || 0,
        "Rusak Berat": a.rusakBerat || 0,
        "Hilang": a.hilang || 0,
        "Kategori": a.kategori, "Merk/Tipe": a.merk, "Nomor Seri": a.seri,
        "Tahun": a.tahun, "Kondisi": a.kondisi, "Status": a.status,
        "Lokasi": a.lokasi, "Keterangan": a.keterangan
      });
    } else if (type === "UPDATE_STATUS") {
      appendRowByHeader_(master, {
        "Timestamp": now, "Aksi": "UPDATE STATUS",
        "Kode Alat": a.kode, "Nama Alat": a.nama,
        "Jumlah": a.jumlah || 1,
        "Rusak Ringan": a.rusakRingan || 0,
        "Rusak Berat": a.rusakBerat || 0,
        "Hilang": a.hilang || 0,
        "Kategori": a.kategori, "Merk/Tipe": a.merk, "Nomor Seri": a.seri,
        "Tahun": a.tahun, "Kondisi": a.kondisi, "Status": a.status,
        "Lokasi": a.lokasi, "Keterangan": a.keterangan
      });
      appendRowByHeader_(riwayat, {
        "Timestamp": now, "Aksi": "UPDATE STATUS",
        "Kode Alat": a.kode, "Nama Alat": a.nama,
        "Status": a.status, "Kondisi Kembali": a.kondisi,
        "Catatan": r.catatanStatus || ""
      });
    } else if (type === "PINJAM") {
      appendRowByHeader_(peminjaman, {
        "Timestamp": now, "Aksi": "PINJAM",
        "No Pinjam": r.no, "Tanggal Pinjam": r.tanggal, "Peminjam": r.peminjam,
        "Departemen/Proyek": r.proyek, "Keperluan": r.keperluan,
        "Kode Alat": r.alatKode, "Nama Alat": r.alatNama, "Qty": r.qty,
        "Kondisi Pinjam": r.kondisiPinjam, "Status": r.status,
        "Catatan": r.catatan
      });
      appendRowByHeader_(riwayat, {
        "Timestamp": now, "Aksi": "PINJAM",
        "No Pinjam": r.no, "Kode Alat": r.alatKode, "Nama Alat": r.alatNama,
        "Qty": r.qty, "Peminjam": r.peminjam, "Tanggal Pinjam": r.tanggal,
        "Status": r.status, "Kondisi Pinjam": r.kondisiPinjam,
        "Catatan": r.catatan
      });
    } else if (type === "KEMBALI") {
      appendRowByHeader_(peminjaman, {
        "Timestamp": now, "Aksi": "KEMBALI",
        "No Pinjam": r.no, "Tanggal Pinjam": r.tanggal, "Peminjam": r.peminjam,
        "Departemen/Proyek": r.proyek, "Keperluan": r.keperluan,
        "Kode Alat": r.alatKode, "Nama Alat": r.alatNama, "Qty": r.qty,
        "Kondisi Pinjam": r.kondisiPinjam, "Status": r.status,
        "Tanggal Kembali": r.tanggalKembali, "Kondisi Kembali": r.kondisiKembali,
        "Catatan": r.catatanKembali,
        "Qty Baik": r.qtyBaik || 0, "Qty Rusak Ringan": r.qtyRusakRingan || 0,
        "Qty Rusak Berat": r.qtyRusakBerat || 0, "Qty Hilang": r.qtyHilang || 0
      });
      appendRowByHeader_(riwayat, {
        "Timestamp": now, "Aksi": "KEMBALI",
        "No Pinjam": r.no, "Kode Alat": r.alatKode, "Nama Alat": r.alatNama,
        "Qty": r.qty, "Peminjam": r.peminjam, "Tanggal Pinjam": r.tanggal,
        "Tanggal Kembali": r.tanggalKembali, "Status": r.status,
        "Kondisi Pinjam": r.kondisiPinjam, "Kondisi Kembali": r.kondisiKembali,
        "Catatan": r.catatanKembali,
        "Qty Baik": r.qtyBaik || 0, "Qty Rusak Ringan": r.qtyRusakRingan || 0,
        "Qty Rusak Berat": r.qtyRusakBerat || 0, "Qty Hilang": r.qtyHilang || 0
      });
      if (a && a.kode) {
        appendRowByHeader_(master, {
          "Timestamp": now, "Aksi": "UPDATE STOK (Pengembalian)",
          "Kode Alat": a.kode, "Nama Alat": a.nama,
          "Jumlah": a.jumlah || 1,
          "Rusak Ringan": a.rusakRingan || 0,
          "Rusak Berat": a.rusakBerat || 0,
          "Hilang": a.hilang || 0,
          "Kategori": a.kategori, "Merk/Tipe": a.merk, "Nomor Seri": a.seri,
          "Tahun": a.tahun, "Kondisi": a.kondisi, "Status": a.status,
          "Lokasi": a.lokasi, "Keterangan": a.keterangan
        });
      }
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

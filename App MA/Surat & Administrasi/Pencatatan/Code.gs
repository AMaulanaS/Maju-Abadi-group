// ====== ADMIN ARSIP: backend Google Sheet ======
// GANTI PIN di bawah sebelum deploy. PIN dicek di server, bukan di halaman web.
const PIN = 'GANTI-PIN-ANDA';

const LAYANAN = ['LPSE', 'Email Gmail', 'Email Yahoo', 'E-Catalog', 'INAPROC', 'JMTM', 'OSS'];
const SHEETS = {
  akun: ['Perusahaan', 'Direktur']
    .concat(LAYANAN.reduce((a, l) => a.concat([l + ' User', l + ' Password']), []))
    .concat(['Keterangan']),
  proyek: ['Judul Proyek', 'Lokasi', 'Personil', 'Peralatan', 'Nilai Penawaran',
           'Tanggal Penawaran', 'Nilai Kontrak', 'No SPK', 'Tanggal SPK', 'Pelaksanaan']
};

function getSheet(name) {
  const ss = SpreadsheetApp.getActive();
  let s = ss.getSheetByName(name);
  if (!s) {
    s = ss.insertSheet(name);
    s.appendRow(SHEETS[name]);
    s.setFrozenRows(1);
    s.getRange(1, 1, 1, SHEETS[name].length).setFontWeight('bold');
    // format teks biasa agar tanggal/angka/password tidak diubah otomatis oleh Sheets
    s.getRange(1, 1, 1000, SHEETS[name].length).setNumberFormat('@');
  }
  return s;
}

function listRows(name) {
  const v = getSheet(name).getDataRange().getDisplayValues();
  return v.slice(1).map((x, i) => ({ row: i + 2, v: x })).filter(o => o.v.join('') !== '');
}

function doPost(e) {
  let out;
  try {
    const r = JSON.parse(e.postData.contents);
    if (r.pin !== PIN) throw new Error('PIN salah');
    if (r.action === 'all') {
      out = { akun: listRows('akun'), proyek: listRows('proyek') };
    } else {
      if (!SHEETS[r.sheet]) throw new Error('Sheet tidak dikenal');
      const s = getSheet(r.sheet), n = SHEETS[r.sheet].length;
      if (r.action === 'list') out = { rows: listRows(r.sheet) };
      else if (r.action === 'add') { s.appendRow(r.values.slice(0, n)); out = { ok: true }; }
      else if (r.action === 'update' && r.row >= 2) { s.getRange(r.row, 1, 1, n).setValues([r.values.slice(0, n)]); out = { ok: true }; }
      else if (r.action === 'delete' && r.row >= 2) { s.deleteRow(r.row); out = { ok: true }; }
      else throw new Error('Aksi tidak valid');
    }
  } catch (err) {
    out = { error: err.message };
  }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

// Opsional: jalankan sekali dari editor untuk membuat kedua sheet
function setup() { getSheet('akun'); getSheet('proyek'); }

// ====== ADMIN ARSIP: backend Google Sheet ======
// GANTI PIN sebelum deploy. PIN dicek di server.
const PIN = '123123123';
const DEFAULT_CATEGORIES = ['LPSE', 'Email Gmail', 'Email Yahoo', 'E-Catalog', 'INAPROC', 'JMTM (Jasa Marga)', 'OSS'];
const PROJECT_HEADERS = ['Judul Proyek', 'Lokasi', 'Personil', 'Peralatan', 'Nilai Penawaran', 'Tanggal Penawaran', 'Nilai Kontrak', 'No SPK', 'Tanggal SPK', 'Pelaksanaan'];
const SHEETS = { akun: true, proyek: PROJECT_HEADERS };
function categorySheet() {
  const ss = SpreadsheetApp.getActive(); let s = ss.getSheetByName('Kategori Akun');
  if (!s) { s = ss.insertSheet('Kategori Akun'); s.getRange(1, 1).setValue('Nama Kategori'); s.getRange(2, 1, DEFAULT_CATEGORIES.length, 1).setValues(DEFAULT_CATEGORIES.map(x => [x])); s.setFrozenRows(1); }
  return s;
}
function getCategories() { return categorySheet().getRange(2, 1, Math.max(1, categorySheet().getLastRow() - 1), 1).getDisplayValues().flat().filter(Boolean); }
function accountHeaders(cats) { return ['Perusahaan'].concat(cats.flatMap(c => [c + ' User', c + ' Password']), ['Keterangan']); }
function getSheet(name) {
  const ss = SpreadsheetApp.getActive(); let s = ss.getSheetByName(name);
  if (!s) s = ss.insertSheet(name);
  if (name === 'akun') syncAccountSheet(s);
  else if (s.getLastRow() === 0) { s.appendRow(PROJECT_HEADERS); s.setFrozenRows(1); s.getRange(1, 1, 1000, PROJECT_HEADERS.length).setNumberFormat('@'); }
  return s;
}
function syncAccountSheet(s) {
  const cats = getCategories(), target = accountHeaders(cats); let values = s.getDataRange().getDisplayValues();
  if (!values.length || (values.length === 1 && values[0].join('') === '')) values = [target];
  const oldHeaders = values[0] || [], rows = values.slice(1);
  if (JSON.stringify(oldHeaders) !== JSON.stringify(target)) {
    // Migrasi berdasarkan nama kolom, sehingga penambahan/penghapusan kategori tidak menggeser data lain.
    const mapped = rows.map(row => target.map(h => { const ix = oldHeaders.indexOf(h); return ix >= 0 ? (row[ix] || '') : ''; }));
    s.clearContents(); s.getRange(1, 1, 1, target.length).setValues([target]);
    if (mapped.length) s.getRange(2, 1, mapped.length, target.length).setValues(mapped);
    s.setFrozenRows(1); s.getRange(1, 1, Math.max(1000, s.getMaxRows()), target.length).setNumberFormat('@');
  }
}
function listRows(name) {
  const v = getSheet(name).getDataRange().getDisplayValues();
  return v.slice(1).map((x, i) => ({ row: i + 2, v: x })).filter(o => o.v.join('') !== '');
}
// Buka URL /exec di browser untuk memeriksa apakah Web App sudah aktif.
function doGet() {
  return ContentService.createTextOutput(JSON.stringify({
    ok: true,
    app: 'Arsip Administrasi',
    message: 'Web App aktif. Gunakan formulir login website untuk memeriksa PIN.'
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  let out;
  try {
    const r = JSON.parse(e.postData.contents); if (r.pin !== PIN) throw new Error('PIN salah');
    if (r.action === 'all') out = { akun: listRows('akun'), proyek: listRows('proyek'), categories: getCategories() };
    else if (['addCategory', 'renameCategory', 'deleteCategory'].includes(r.action)) {
      const s = categorySheet(), cats = getCategories();
      if (r.action === 'addCategory') {
        const name = String(r.name || '').trim(); if (!name) throw new Error('Nama kategori wajib diisi');
        if (cats.some(c => c.toLowerCase() === name.toLowerCase())) throw new Error('Nama kategori sudah ada');
        s.appendRow([name]);
      } else if (r.action === 'renameCategory') {
        const oldName = String(r.oldName || '').trim(), newName = String(r.newName || '').trim();
        if (!newName) throw new Error('Nama kategori wajib diisi');
        if (!cats.includes(oldName)) throw new Error('Kategori tidak ditemukan');
        if (cats.some(c => c.toLowerCase() === newName.toLowerCase())) throw new Error('Nama kategori sudah ada');
        const akun = getSheet('akun'), header = akun.getRange(1, 1, 1, akun.getLastColumn()).getDisplayValues()[0];
        [' User', ' Password'].forEach(suffix => { const i = header.indexOf(oldName + suffix); if (i >= 0) akun.getRange(1, i + 1).setValue(newName + suffix); });
        const row = cats.indexOf(oldName) + 2; s.getRange(row, 1).setValue(newName);
      } else {
        const name = String(r.name || '').trim(); if (!cats.includes(name)) throw new Error('Kategori tidak ditemukan');
        const row = cats.indexOf(name) + 2; s.deleteRow(row);
      }
      getSheet('akun'); out = { ok: true, categories: getCategories() };
    } else {
      if (!SHEETS[r.sheet]) throw new Error('Sheet tidak dikenal');
      const s = getSheet(r.sheet), n = r.sheet === 'akun' ? accountHeaders(getCategories()).length : PROJECT_HEADERS.length;
      if (r.action === 'list') out = { rows: listRows(r.sheet) };
      else if (r.action === 'add') { const vals = (r.values || []).slice(0, n); while (vals.length < n) vals.push(''); s.appendRow(vals); out = { ok: true }; }
      else if (r.action === 'update' && r.row >= 2) { const vals = (r.values || []).slice(0, n); while (vals.length < n) vals.push(''); s.getRange(r.row, 1, 1, n).setValues([vals]); out = { ok: true }; }
      else if (r.action === 'delete' && r.row >= 2) { s.deleteRow(r.row); out = { ok: true }; }
      else throw new Error('Aksi tidak valid');
    }
  } catch (err) { out = { error: err.message }; }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}
function setup() { getSheet('akun'); getSheet('proyek'); }

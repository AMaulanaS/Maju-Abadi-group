const SPREADSHEET_ID = '18PSzRlKDC0omJhq1kyefgUFiwOZKVoMs80UU7dqSgyc';
const SHEET_NAME = 'Data Surat';
const HEADERS = ['ID','Perusahaan','Urutan','Jenis','Tanggal','Perihal','Nomor Surat'];

function doGet(e) {
  try {
    const action = e && e.parameter && e.parameter.action ? e.parameter.action : 'getData';
    if (action === 'getData') return jsonOutput({success:true, data:getData()});
    return jsonOutput({success:false, message:'Gunakan POST untuk operasi perubahan data.'});
  } catch (error) { return jsonOutput({success:false, message:error.message}); }
}

function doPost(e) {
  try {
    const params = e && e.parameter ? e.parameter : {};
    const action = params.action;
    let result;
    switch (action) {
      case 'getData': result = {success:true, data:getData()}; break;
      case 'add': result = addSurat(JSON.parse(params.data || '{}')); break;
      case 'update': result = updateSurat(JSON.parse(params.data || '{}')); break;
      case 'delete': result = deleteSurat(params.id); break;
      default: result = {success:false, message:'Action tidak ditemukan.'};
    }
    return jsonOutput(result);
  } catch (error) { return jsonOutput({success:false, message:error.message}); }
}

function getSpreadsheet() { return SpreadsheetApp.openById(SPREADSHEET_ID); }

function getSheet() {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  setupSheet(sheet);
  return sheet;
}

function setupSheet(sheet) {
  const firstRow = sheet.getRange(1,1,1,HEADERS.length).getValues()[0];
  if (firstRow.every(value => value === '')) {
    sheet.getRange(1,1,1,HEADERS.length).setValues([HEADERS]);
    sheet.getRange(1,1,1,HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1,HEADERS.length);
  }
}

function getData() {
  const sheet = getSheet();
  const result = {rma:[], fma:[], zma:[]};
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return result;
  const values = sheet.getRange(2,1,lastRow-1,HEADERS.length).getValues();
  values.forEach(row => {
    const [id, perusahaan, urutan, jenis, tanggal, perihal, nomorSurat] = row;
    if (!id || !result[perusahaan]) return;
    let tanggalFormat = '';
    if (tanggal instanceof Date) {
      tanggalFormat = Utilities.formatDate(tanggal, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    } else {
      tanggalFormat = String(tanggal || '');
    }
    result[perusahaan].push({
      id:String(id), urutan:Number(urutan)||0, jenis:String(jenis||''),
      tanggal:tanggalFormat, perihal:String(perihal||''), nomorSurat:String(nomorSurat||'')
    });
  });
  return result;
}

function addSurat(item) {
  validateData(item);
  const sheet = getSheet();
  const nomorSurat = buildNomorSurat(item.perusahaan,item.urutan,item.jenis,item.tanggal);
  sheet.appendRow([item.id,item.perusahaan,Number(item.urutan),item.jenis,item.tanggal,item.perihal,nomorSurat]);
  return {success:true,message:'Surat berhasil ditambahkan.',nomorSurat:nomorSurat};
}

function updateSurat(item) {
  validateData(item);
  const sheet = getSheet();
  const rowNumber = findRowById(sheet,item.id);
  if (!rowNumber) throw new Error('Data surat tidak ditemukan.');
  const nomorSurat = buildNomorSurat(item.perusahaan,item.urutan,item.jenis,item.tanggal);
  sheet.getRange(rowNumber,1,1,HEADERS.length).setValues([[
    item.id,item.perusahaan,Number(item.urutan),item.jenis,item.tanggal,item.perihal,nomorSurat
  ]]);
  return {success:true,message:'Surat berhasil diperbarui.',nomorSurat:nomorSurat};
}

function deleteSurat(id) {
  if (!id) throw new Error('ID surat kosong.');
  const sheet = getSheet();
  const rowNumber = findRowById(sheet,id);
  if (!rowNumber) throw new Error('Data surat tidak ditemukan.');
  sheet.deleteRow(rowNumber);
  return {success:true,message:'Surat berhasil dihapus.'};
}

function findRowById(sheet,id) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return null;
  const ids = sheet.getRange(2,1,lastRow-1,1).getValues().flat();
  const index = ids.findIndex(value => String(value) === String(id));
  return index === -1 ? null : index + 2;
}

function validateData(item) {
  if (!item.id) throw new Error('ID tidak boleh kosong.');
  if (!item.perusahaan) throw new Error('Perusahaan tidak boleh kosong.');
  if (!item.urutan) throw new Error('Nomor urut tidak boleh kosong.');
  if (!item.jenis) throw new Error('Jenis surat tidak boleh kosong.');
  if (!item.tanggal) throw new Error('Tanggal tidak boleh kosong.');
  if (!item.perihal) throw new Error('Perihal tidak boleh kosong.');
}

function buildNomorSurat(perusahaan,urutan,jenis,tanggal) {
  const romanMonths = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'];
  const parts = String(tanggal).split('-');
  const year = parts[0];
  const month = Number(parts[1]);
  return `${String(urutan).padStart(3,'0')}/${String(perusahaan).toUpperCase()}/${String(jenis).toUpperCase()}/${romanMonths[month-1]}/${year}`;
}

function jsonOutput(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function buatDatabase() {
  const sheet = getSheet();
  Logger.log('Database siap: ' + sheet.getName());
}

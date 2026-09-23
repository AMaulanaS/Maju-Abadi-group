const SPREADSHEET_ID='1UqFpZCJ0PKWZ3dEau07ciC3DFRqFv4VyZiXlloMmAV4';
const HEADERS={
INVENTARIS:['ID','Kode Inventaris','Nama Barang','Kategori','Merk/Type','No Seri','Jumlah','Satuan','Tanggal Pembelian','Harga Perolehan','Lokasi','Penanggung Jawab','Kondisi','Status','Keterangan','Created At','Updated At'],
KATEGORI:['ID Kategori','Nama Kategori','Status','Keterangan'],
LOKASI:['ID Lokasi','Nama Lokasi','Gedung/Ruang','Penanggung Jawab','Status','Keterangan'],
PEMINJAMAN:['ID Peminjaman','Kode Inventaris','Nama Barang','Peminjam','Departemen','Tanggal Pinjam','Rencana Kembali','Tanggal Kembali','Jumlah','Kondisi Keluar','Kondisi Kembali','Status','Keterangan','Created At','Updated At'],
MUTASI:['ID Mutasi','Kode Inventaris','Nama Barang','Tanggal Mutasi','Lokasi Asal','Lokasi Tujuan','Penanggung Jawab Lama','Penanggung Jawab Baru','Jumlah','Alasan','Keterangan','Created At']
};
function doGet(){return json({success:true,message:'API Inventaris Kantor aktif'})}
function doPost(e){try{const r=JSON.parse(e.postData.contents||'{}'),a=r.action,d=r.data||{};switch(a){case'setup':return json(setup());case'getAllData':return json(getAllData());case'getDashboard':return json(getDashboard());case'tambahInventaris':return json(tambahInventaris(d));case'updateInventaris':return json(updateInventaris(d));case'hapusInventaris':return json(hapusInventaris(d));case'tambahKategori':return json(tambahKategori(d));case'updateKategori':return json(updateKategori(d));case'hapusKategori':return json(hapusKategori(d));default:return json({success:false,message:'Action tidak dikenal: '+a})}}catch(err){return json({success:false,message:err.message})}}
function ss(){
  return SpreadsheetApp.getActiveSpreadsheet()
  }
function sheet(n){let s=ss().getSheetByName(n);if(!s)s=ss().insertSheet(n);return s}
function setup(){Object.keys(HEADERS).forEach(n=>{const s=sheet(n);if(s.getLastRow()===0)s.appendRow(HEADERS[n])});seed();return{success:true,message:'Setup selesai'}}
function seed(){const c=sheet('KATEGORI');if(c.getLastRow()===1)[['KAT-001','Elektronik','Aktif','Komputer, printer, perangkat elektronik'],['KAT-002','Furniture','Aktif','Meja, kursi, lemari'],['KAT-003','ATK','Aktif','Alat tulis kantor'],['KAT-004','Peralatan Kantor','Aktif','Peralatan pendukung kantor'],['KAT-005','Kendaraan','Aktif','Kendaraan operasional'],['KAT-006','Peralatan Lapangan','Aktif','Peralatan untuk pekerjaan lapangan']].forEach(r=>c.appendRow(r));const l=sheet('LOKASI');if(l.getLastRow()===1){
[['LOC-001','Lantai 1','Gedung Kantor','-','Aktif','Lantai 1'],['LOC-002','Lantai 2','Gedung Kantor','-','Aktif','Lantai 2'],['LOC-003','Lantai 3','Gedung Kantor','-','Aktif','Lantai 3'],['LOC-004','Ruang Administrasi','Gedung Kantor','-','Aktif','Ruang administrasi'],['LOC-005','Ruang Keuangan','Gedung Kantor','-','Aktif','Ruang keuangan'],['LOC-006','Ruang HR/HRD','Gedung Kantor','-','Aktif','Ruang HR/HRD'],['LOC-007','Ruang Pimpinan','Gedung Kantor','-','Aktif','Ruang pimpinan'],['LOC-008','Ruang Rapat','Gedung Kantor','-','Aktif','Ruang rapat'],['LOC-009','Gudang','Gedung Kantor','-','Aktif','Gudang'],['LOC-010','Ruang IT','Gedung Kantor','-','Aktif','Ruang IT'],['LOC-011','Ruang Operasional','Gedung Kantor','-','Aktif','Ruang operasional'],['LOC-012','Ruang Arsip','Gedung Kantor','-','Aktif','Ruang arsip']].forEach(r=>l.appendRow(r))
}}
function objs(s){const v=s.getDataRange().getValues();if(v.length<2)return[];const h=v[0].map(String);return v.slice(1).filter(r=>r.some(x=>x!=='')).map(r=>{const o={};h.forEach((x,i)=>o[x]=r[i] instanceof Date?Utilities.formatDate(r[i],Session.getScriptTimeZone(),'yyyy-MM-dd'):r[i]);return o})}
function getAllData(){setup();return{success:true,data:{inventaris:objs(sheet('INVENTARIS')),kategori:objs(sheet('KATEGORI')),lokasi:objs(sheet('LOKASI')),peminjaman:objs(sheet('PEMINJAMAN')),mutasi:objs(sheet('MUTASI'))}}}
function getDashboard(){const a=objs(sheet('INVENTARIS'));let totalAset=0,tersedia=0,dipinjam=0,rusak=0,totalNilai=0;a.forEach(x=>{const j=Number(x.Jumlah)||0,h=Number(x['Harga Perolehan'])||0;totalAset+=j;totalNilai+=j*h;if(String(x.Status).toLowerCase()==='tersedia')tersedia+=j;if(String(x.Status).toLowerCase()==='dipinjam')dipinjam+=j;if(String(x.Kondisi).toLowerCase().includes('rusak')||String(x.Status).toLowerCase()==='rusak')rusak+=j});return{success:true,data:{totalAset,tersedia,dipinjam,rusak,totalNilai}}}
function tambahInventaris(d){const s=sheet('INVENTARIS'),now=new Date(),id='INV-'+Utilities.getUuid().slice(0,8).toUpperCase(),code='INV-'+Utilities.formatDate(now,Session.getScriptTimeZone(),'yyyyMMdd')+'-'+String(Math.max(0,s.getLastRow()-1)+1).padStart(3,'0');s.appendRow(HEADERS.INVENTARIS.map(h=>h==='ID'?id:h==='Kode Inventaris'?code:h==='Created At'||h==='Updated At'?now:(d[h]??'')));return{success:true}}
function updateInventaris(d){return updateById('INVENTARIS','ID',d,'ID','Kode Inventaris','Created At')}
function hapusInventaris(d){return deleteById('INVENTARIS','ID',d.ID)}
function tambahKategori(d){const s=sheet('KATEGORI'),id=d['ID Kategori']||'KAT-'+Utilities.getUuid().slice(0,8).toUpperCase();if(dupeCategory(d['Nama Kategori']))return{success:false,message:'Nama kategori sudah ada'};s.appendRow([id,d['Nama Kategori'],d.Status||'Aktif',d.Keterangan||'']);return{success:true,data:{ID:id}}}
function updateKategori(d){const s=sheet('KATEGORI'),v=s.getDataRange().getValues(),h=v[0].map(String),ii=h.indexOf('ID Kategori');for(let r=1;r<v.length;r++){if(String(v[r][ii])===String(d['ID Kategori'])){if(dupeCategory(d['Nama Kategori'],d['ID Kategori']))return{success:false,message:'Nama kategori sudah dipakai'};s.getRange(r+1,1,1,4).setValues([[d['ID Kategori'],d['Nama Kategori'],d.Status||'Aktif',d.Keterangan||'']]);return{success:true}}}return{success:false,message:'Kategori tidak ditemukan'}}
function hapusKategori(d) {
  const sh = sheet('KATEGORI');
  const data = sh.getDataRange().getValues();

  if (data.length < 2) {
    return {
      success: false,
      message: 'Belum ada data kategori'
    };
  }

  const headers = data[0].map(String);

  const idCol = headers.indexOf('ID Kategori');
  const namaCol = headers.indexOf('Nama Kategori');

  const idDicari = String(
    typeof d === 'object' ? d['ID Kategori'] || '' : d || ''
  ).trim();

  const namaDicari = String(
    typeof d === 'object' ? d['Nama Kategori'] || '' : ''
  ).trim();

  for (let r = 1; r < data.length; r++) {

    const idSheet = String(
      idCol >= 0 ? data[r][idCol] : ''
    ).trim();

    const namaSheet = String(
      namaCol >= 0 ? data[r][namaCol] : ''
    ).trim();

    // Cocok berdasarkan ID
    if (idDicari && idSheet === idDicari) {
      sh.deleteRow(r + 1);

      return {
        success: true,
        message: 'Kategori berhasil dihapus'
      };
    }

    // Cadangan: cocok berdasarkan nama
    if (
      namaDicari &&
      namaSheet.toLowerCase() === namaDicari.toLowerCase()
    ) {
      sh.deleteRow(r + 1);

      return {
        success: true,
        message: 'Kategori berhasil dihapus'
      };
    }
  }

  return {
    success: false,
    message: 'Kategori tidak ditemukan'
  };
}
function dupeCategory(name,except){return objs(sheet('KATEGORI')).some(x=>String(x['Nama Kategori']).toLowerCase()===String(name).toLowerCase()&&String(x['ID Kategori'])!==String(except||''))}
function updateById(name,idHead,d,skip1,skip2,skip3){const s=sheet(name),v=s.getDataRange().getValues(),h=v[0].map(String),ii=h.indexOf(idHead);for(let r=1;r<v.length;r++)if(String(v[r][ii])===String(d[idHead])){h.forEach((x,c)=>{if([skip1,skip2,skip3].includes(x))return;s.getRange(r+1,c+1).setValue(d[x]??'')});const u=h.indexOf('Updated At');if(u>=0)s.getRange(r+1,u+1).setValue(new Date());return{success:true}}return{success:false,message:'Data tidak ditemukan'}}
function deleteById(name,head,id){const s=sheet(name),v=s.getDataRange().getValues(),i=v[0].map(String).indexOf(head);for(let r=1;r<v.length;r++)if(String(v[r][i])===String(id)){s.deleteRow(r+1);return{success:true}}return{success:false,message:'Data tidak ditemukan'}}
function json(o){return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON)}
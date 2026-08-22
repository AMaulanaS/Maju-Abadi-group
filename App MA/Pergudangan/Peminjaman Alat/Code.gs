const SPREADSHEET_ID="180IBhlVD0R0zHGqhlBauqtlyOpgVOW3MUjLY5aJvtQM";
const DRIVE_FOLDER_ID="16Agi6Poj_Qhn5g1GjnHb4eo8lie2AvNd";
function setup(){
 const ss=SpreadsheetApp.openById(SPREADSHEET_ID);
 const specs={"Master Alat":["Timestamp","Aksi","Kode Alat","Nama Alat","Kategori","Merk/Tipe","Nomor Seri","Tahun","Kondisi","Status","Lokasi","Keterangan"],"Peminjaman":["Timestamp","Aksi","No Pinjam","Tanggal Pinjam","Peminjam","Departemen/Proyek","Keperluan","Kode Alat","Nama Alat","Qty","Kondisi Pinjam","Status","Tanggal Kembali","Kondisi Kembali","Catatan"],"Riwayat":["Timestamp","Aksi","No Pinjam","Kode Alat","Nama Alat","Peminjam","Tanggal Pinjam","Tanggal Kembali","Status","Kondisi Pinjam","Kondisi Kembali","Catatan"]};
 Object.entries(specs).forEach(([name,headers])=>{let sh=ss.getSheetByName(name);if(!sh)sh=ss.insertSheet(name);if(sh.getLastRow()===0){sh.appendRow(headers);sh.setFrozenRows(1)}});
}
function doGet(){return ContentService.createTextOutput(JSON.stringify({ok:true,message:"API Manajemen Alat aktif"})).setMimeType(ContentService.MimeType.JSON)}
function doPost(e){
 try{
  setup(); const raw=(e&&e.parameter&&e.parameter.payload)?e.parameter.payload:((e&&e.postData&&e.postData.contents)||""); if(!raw)throw new Error("Payload kosong");
  const d=JSON.parse(raw),now=new Date(),ss=SpreadsheetApp.openById(SPREADSHEET_ID);
  if(d.type==="ALAT"){
   const a=d.alat; ss.getSheetByName("Master Alat").appendRow([now,"TAMBAH",a.kode,a.nama,a.kategori,a.merk,a.seri,a.tahun,a.kondisi,a.status,a.lokasi,a.keterangan]);
  }else if(d.type==="UPDATE_STATUS"){
   const a=d.alat,r=d.record||{}; ss.getSheetByName("Master Alat").appendRow([now,"UPDATE STATUS",a.kode,a.nama,a.kategori,a.merk,a.seri,a.tahun,a.kondisi,a.status,a.lokasi,a.keterangan]);
   ss.getSheetByName("Riwayat").appendRow([now,"UPDATE STATUS","",a.kode,a.nama,"","","",a.status,"",a.kondisi,r.catatanStatus||""]);
  }else if(d.type==="PINJAM"){
   const p=d.record,a=d.alat; ss.getSheetByName("Master Alat").appendRow([now,"PINJAM",a.kode,a.nama,a.kategori,a.merk,a.seri,a.tahun,a.kondisi,"Dipinjam",a.lokasi,a.keterangan]);
   ss.getSheetByName("Peminjaman").appendRow([now,"PINJAM",p.no,p.tanggal,p.peminjam,p.proyek,p.keperluan,p.alatKode,p.alatNama,p.qty,p.kondisiPinjam,p.status,"","",p.catatan]);
   ss.getSheetByName("Riwayat").appendRow([now,"PINJAM",p.no,p.alatKode,p.alatNama,p.peminjam,p.tanggal,"",p.status,p.kondisiPinjam,"",p.catatan]);
  }else if(d.type==="KEMBALI"){
   const p=d.record; ss.getSheetByName("Peminjaman").appendRow([now,"KEMBALI",p.no,p.tanggal,p.peminjam,p.proyek,p.keperluan,p.alatKode,p.alatNama,p.qty,p.kondisiPinjam,p.status,p.tanggalKembali,p.kondisiKembali,p.catatanKembali]);
   ss.getSheetByName("Riwayat").appendRow([now,"KEMBALI",p.no,p.alatKode,p.alatNama,p.peminjam,p.tanggal,p.tanggalKembali,p.status,p.kondisiPinjam,p.kondisiKembali,p.catatanKembali]);
  }
  return ContentService.createTextOutput(JSON.stringify({ok:true})).setMimeType(ContentService.MimeType.JSON);
 }catch(err){return ContentService.createTextOutput(JSON.stringify({ok:false,error:String(err)})).setMimeType(ContentService.MimeType.JSON)}
}

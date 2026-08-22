const SPREADSHEET_ID = "1AOsshZ5vOWFVOFILD3db5uDT4lOLoRyNhcuAMTsSrD0";
const DRIVE_FOLDER_ID = "1xm9alOqACExBm79Q92c-9jOmoN1-d0R_";
const SHEET_NAME = "Purchase Order";

function setup(){
  const ss=SpreadsheetApp.openById(SPREADSHEET_ID);
  let sh=ss.getSheetByName(SHEET_NAME);
  if(!sh) sh=ss.insertSheet(SHEET_NAME);
  if(sh.getLastRow()===0){
    sh.appendRow(["Timestamp","PT","No PO","Tanggal PO","Supplier","Alamat Supplier","PIC","Barang JSON","Catatan","Disetujui Oleh","Jabatan","Total","PDF/Folder"]);
    sh.setFrozenRows(1);
  }
}
function doGet(){
  return ContentService.createTextOutput(JSON.stringify({ok:true,message:"API Purchase Order aktif"})).setMimeType(ContentService.MimeType.JSON);
}
function doPost(e){
  try{
    setup();
    const raw=(e&&e.parameter&&e.parameter.payload)?e.parameter.payload:((e&&e.postData&&e.postData.contents)||"");
    if(!raw) throw new Error("Payload kosong.");
    const d=JSON.parse(raw);
    const sh=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    let folderUrl="";
    if(DRIVE_FOLDER_ID){
      folderUrl=DriveApp.getFolderById(DRIVE_FOLDER_ID).getUrl();
    }
    sh.appendRow([
      new Date(),
      d.company?.name||"",
      d.noPO||"",
      d.tanggal||"",
      d.supplier||"",
      d.supplierAddress||"",
      d.supplierPIC||"",
      JSON.stringify(d.items||[]),
      d.notes||"",
      d.approvedBy||"",
      d.approvedTitle||"",
      d.total||0,
      folderUrl
    ]);
    return ContentService.createTextOutput(JSON.stringify({ok:true,row:sh.getLastRow(),message:"PO tersimpan"})).setMimeType(ContentService.MimeType.JSON);
  }catch(err){
    return ContentService.createTextOutput(JSON.stringify({ok:false,error:String(err)})).setMimeType(ContentService.MimeType.JSON);
  }
}

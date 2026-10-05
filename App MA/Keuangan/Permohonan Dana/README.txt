PERMOHONAN DANA - PUBLIC GOOGLE SHEETS

Fitur:
- Form pengajuan tanpa login.
- Rincian item dinamis: No, Keterangan / Item, Harga.
- Tombol + Tambah Item untuk menambah baris sebanyak yang diperlukan.
- Total dana dihitung otomatis dari seluruh harga item.
- Rincian item disimpan di Google Sheets pada kolom Items JSON.
- Data lama tetap dapat dibaca; data lama yang belum mempunyai Items JSON akan tetap tampil dengan total nominalnya.
- Upload bukti ke Google Drive.
- Panel keuangan dengan PIN.

SETUP:
1. Buka google-apps-script/Code.gs.
2. Isi SPREADSHEET_ID dan ADMIN_PIN.
3. Deploy sebagai Web App, Execute as: Me, Who has access: Anyone.
4. Salin URL /exec ke API_URL di script.js.
5. Jika memakai Spreadsheet lama, cukup deploy ulang Code.gs. Kolom "Items JSON" akan ditambahkan otomatis di ujung sheet.

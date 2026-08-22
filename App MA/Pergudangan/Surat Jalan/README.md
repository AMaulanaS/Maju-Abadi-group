# SURAT JALAN FMA GROUP - VERSI FINAL

Fitur:
- 3 kop perusahaan menggunakan logo yang diberikan:
  PT. Zahra Maju Abadi, PT. Fadhilah Maju Abadi, PT. Rizky Maju Abadi
- Nomor surat otomatis per hari, contoh SJ/260819/0001
- Tujuan, alamat, kendaraan, sopir
- Barang dinamis
- 3 tanda tangan: Penerima, Pengirim, Hormat Kami
- Nama terang di bawah tanda tangan
- Preview A4 di layar, cetak F4
- Tombol Download PDF membuka print dialog browser; pilih "Save as PDF" dan ukuran F4
- Google Sheet + Google Drive via Apps Script

Google Apps Script:
1. Buat Google Sheet.
2. Extensions > Apps Script.
3. Tempel Code.gs.
4. Isi SPREADSHEET_ID dan DRIVE_FOLDER_ID.
5. Jalankan setup sekali.
6. Deploy > New deployment > Web app.
7. Execute as: Me; Who has access: Anyone.
8. Salin URL Web App ke GOOGLE_SCRIPT_URL di script.js.


## PERBAIKAN PAYLOAD v5

Versi ini memperbaiki masalah data masuk hanya Timestamp tetapi kolom lain kosong.
Frontend mengirim JSON sebagai parameter form `payload`, bukan `application/json` dalam `no-cors`.
Backend membaca `e.parameter.payload`.

Setelah mengganti Code.gs:
- Jalankan `setup()` sekali jika diperlukan.
- Update deployment Web App.
- Gunakan URL Web App deployment terbaru di `script.js`.

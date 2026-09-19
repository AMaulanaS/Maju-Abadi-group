DAFTAR PROYEK - HTML + CSS + JS + GOOGLE SHEETS

1. Buat Google Sheet baru.
2. Buka Extensions > Apps Script.
3. Salin isi Code.gs ke Apps Script lalu Save.
4. Deploy > New deployment > Web app.
5. Execute as: Me.
6. Who has access: Anyone.
7. Deploy dan salin URL Web App.
8. Buka app.js, ubah:
   const API_URL = "PASTE_URL_WEB_APP_GOOGLE_APPS_SCRIPT_DI_SINI";
   menjadi URL Web App Anda.
9. Buka index.html melalui hosting/server web.

Kolom Google Sheet otomatis dibuat:
ID | Kode | Nama | Pemilik | Kategori | Status | Progress |
Tanggal Mulai | Deadline | Anggaran | Deskripsi | Dibuat | Diperbarui

Fitur:
- Daftar seluruh proyek
- Search
- Filter status
- Statistik total/berjalan/selesai/tertunda
- Tambah proyek
- Edit proyek
- Hapus proyek
- Progress bar
- Penyimpanan langsung ke Google Sheet

Catatan keamanan:
Web App "Anyone" berarti endpoint dapat dipanggil oleh siapa pun yang mengetahui URL. Untuk sistem internal/produksi, tambahkan autentikasi atau batasi akses sesuai kebutuhan.

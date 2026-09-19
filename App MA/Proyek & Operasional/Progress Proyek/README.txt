PROGRESS PROYEK - HTML/CSS/JS + GOOGLE SHEETS

1. Buat Google Sheet dengan header:
ID | Nama Proyek | Penanggung Jawab | Tanggal Mulai | Target Selesai | Progress | Status | Keterangan | Update Terakhir

2. Buat Google Apps Script dari Extensions > Apps Script.
3. Buat endpoint doGet yang membaca data sheet dan mengembalikan JSON.
4. Deploy sebagai Web App.
5. Salin URL Web App ke:
   const API_URL = "";
   pada script.js.

Saat API_URL masih kosong, website memakai 2 data demo.

Catatan:
Versi ZIP ini sudah menyediakan frontend monitoring. Setelah Anda membuat Google Sheet,
saya bisa lanjutkan dengan Apps Script CRUD (GET/POST/PUT) untuk tambah, edit, hapus,
dan update progress langsung dari website.

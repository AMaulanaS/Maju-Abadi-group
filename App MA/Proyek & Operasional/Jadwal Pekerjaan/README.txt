JADWAL PEKERJAAN
HTML + CSS + JS + Google Sheet

FITUR:
- Dashboard total agenda, hari ini, minggu ini, selesai.
- Tambah/edit/hapus jadwal.
- Jam mulai dan selesai.
- Pencarian.
- Filter tanggal.
- Filter status.
- Prioritas pekerjaan.
- Petugas/tim dan lokasi.
- Google Sheet sebagai database.

CARA SETUP:
1. Buat Google Spreadsheet.
2. Extensions > Apps Script.
3. Tempel isi Code.gs.
4. Jalankan setupSheet() sekali.
5. Deploy > New deployment > Web app.
6. Execute as: Me.
7. Atur akses sesuai kebutuhan.
8. Copy URL /exec.
9. Tempel ke config.js pada API_URL.
10. Jalankan index.html melalui web hosting/server.

Jika API belum diisi, aplikasi tetap dapat digunakan sementara memakai localStorage browser.

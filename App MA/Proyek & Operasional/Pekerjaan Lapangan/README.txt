# Pekerjaan Lapangan — HTML + CSS + JS + Google Sheet

## Fitur
- Dashboard jumlah pekerjaan.
- Tambah, edit, hapus pekerjaan.
- Pencarian dan filter status.
- Status: Belum Mulai, Proses, Selesai, Tertunda.
- Prioritas: Normal, Tinggi, Urgent.
- Data tersimpan di Google Sheet melalui Google Apps Script.
- Ada fallback localStorage jika API belum tersambung.

## Struktur
- index.html
- style.css
- app.js
- config.js
- Code.gs

## Cara menghubungkan Google Sheet
1. Buat Google Spreadsheet baru.
2. Buka Extensions > Apps Script.
3. Salin isi `Code.gs`.
4. Jalankan `setupSheet()` satu kali.
5. Deploy > New deployment > Web app.
6. Pilih Execute as: Me.
7. Pilih akses yang sesuai, misalnya Anyone jika aplikasi digunakan tanpa login Google.
8. Copy URL `/exec`.
9. Buka `config.js` dan isi `API_URL`.
10. Buka `index.html` melalui hosting/web server.

Catatan keamanan:
Jika Web App dibuat "Anyone", endpoint dapat diakses oleh pihak yang mengetahui URL. Untuk aplikasi internal, sebaiknya gunakan autentikasi/akses Google dan pembatasan pengguna.

# Maju Abadi Group — Progress Proyek & Operasional

Struktur sudah dipisahkan dari file HTML tunggal menjadi:

- `index.html` — struktur halaman
- `css/style.css` — seluruh CSS
- `js/config.js` — alamat backend dan token
- `js/app.js` — logika aplikasi
- `google-apps-script/Code.gs` — backend Google Apps Script
- `README.md` — panduan instalasi

## Modul
1. Progress Proyek / Ringkasan
2. Daftar Proyek
3. Jadwal Pekerjaan
4. Pekerjaan Lapangan
5. Dokumentasi Proyek
6. Tim Lapangan

## Database Google Sheets

Backend mengikuti struktur API yang sudah dipakai website. Lima tab akan digunakan:
`Proyek`, `Jadwal`, `Pekerjaan`, `Dokumentasi`, `Tim`.

### Cara pemasangan
1. Buat Google Spreadsheet baru.
2. Buka Extensions → Apps Script.
3. Salin isi `google-apps-script/Code.gs`.
4. Isi `SPREADSHEET_ID` dengan ID Spreadsheet.
5. Deploy → New deployment → Web app.
6. Execute as: Me.
7. Who has access: Anyone with the link.
8. Salin URL `/exec`.
9. Buka `js/config.js` dan ganti nilai `API` dengan URL `/exec`.
10. Upload seluruh folder website ke hosting/GitHub Pages.

## Catatan penting
File asli sudah menggunakan satu endpoint Google Apps Script dan token untuk modul Dokumentasi/Tim. Struktur tersebut dipertahankan agar website yang sekarang tetap kompatibel.

Untuk dokumentasi, foto dikirim sebagai data dari browser ke Apps Script. Untuk penggunaan besar, sebaiknya tahap berikutnya memindahkan foto ke Google Drive dan menyimpan URL-nya di Sheet agar Sheet tidak cepat penuh.

Token dan URL backend yang ada pada file asli dipisahkan ke `config.js`; token client-side bukan mekanisme keamanan penuh. Jika website akan dibuka publik, tahap berikutnya sebaiknya dibuat autentikasi/otorisasi di Apps Script.

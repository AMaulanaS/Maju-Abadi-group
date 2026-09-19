# Tim Lapangan + Google Sheet

Dashboard HTML/CSS/JS untuk mengelola data personel dan penugasan lapangan, dengan Google Sheets sebagai database menggunakan Google Apps Script.

## File

- `index.html` — tampilan dashboard.
- `style.css` — desain responsive.
- `script.js` — pencarian, filter, modal, CRUD, statistik.
- `config.js` — URL Web App + token.
- `Code.gs` — backend Google Apps Script.

## Setup Google Sheet

1. Buat Google Sheet baru.
2. Buka **Extensions → Apps Script**.
3. Salin seluruh isi `Code.gs` ke editor Apps Script.
4. Ubah `SHEET_NAME` bila diperlukan.
5. Buat token rahasia sendiri pada `API_TOKEN`, contoh: `MAJUABADI_2026_ABC123`.
6. Jalankan fungsi `setupSheet()` satu kali dari editor Apps Script agar header kolom dibuat.
7. Pilih **Deploy → New deployment → Web app**.
8. `Execute as`: **Me**.
9. `Who has access`: **Anyone**.
10. Salin URL Web App yang berakhiran `/exec`.

## Hubungkan website

Buka `config.js` lalu isi:

```js
const APP_CONFIG = {
  GOOGLE_SCRIPT_URL: "https://script.google.com/macros/s/URL_ANDA/exec",
  API_TOKEN: "TOKEN_YANG_SAMA_DENGAN_APPS_SCRIPT"
};
```

Setelah itu upload folder ini ke GitHub Pages atau hosting lain.

## Kolom Google Sheet

`ID | Nama | Jabatan | No HP | Lokasi Tugas | Tanggal Tugas | Status | Keterangan | Dibuat | Diubah`

## Catatan keamanan

Situs GitHub Pages bersifat publik. Token di `config.js` juga dapat terlihat oleh pengunjung yang membuka source website. Untuk data operasional yang benar-benar sensitif, gunakan login/authentication atau backend yang tidak mengekspos token di browser.

# Dokumentasi Proyek — HTML + CSS + JS + Google Sheets

Aplikasi ini menyimpan **data dokumentasi ke Google Sheets** dan **foto ke Google Drive** melalui Google Apps Script.

## 1. Siapkan Google Sheet
Buat Google Sheet baru. File Apps Script dibuka dari **Extensions → Apps Script**.

## 2. Pasang Code.gs
Hapus kode contoh, lalu paste isi `Code.gs`.
Ubah:

```js
API_TOKEN: 'GANTI_DENGAN_TOKEN_RAHASIA_ANDA'
```

menjadi token rahasia pilihan Anda.

Klik **Deploy → New deployment → Web app**.
- Execute as: **Me**
- Who has access: **Anyone**

Salin URL Web App yang berakhiran `/exec`.

## 3. Hubungkan frontend
Buka `config.js` lalu isi URL dan token yang sama:

```js
const APP_CONFIG = {
  GOOGLE_SCRIPT_URL: 'https://script.google.com/macros/s/XXXXXXXX/exec',
  API_TOKEN: 'TOKEN_YANG_SAMA'
};
```

## 4. Jalankan website
Bisa dibuka lokal atau di-upload ke GitHub Pages bersama:
- index.html
- style.css
- script.js
- config.js

## 5. Struktur data
Google Sheet akan otomatis membuat sheet bernama `Dokumentasi Proyek` dengan kolom:

ID | Timestamp | Tanggal | Judul | Proyek | PIC | Kegiatan | Progress | Status | Catatan | Foto URLs

Foto diunggah ke folder Google Drive bernama `Dokumentasi Proyek`.

## Catatan keamanan
`config.js` pada GitHub Pages bersifat publik, jadi API token juga bisa terlihat. Pola ini cocok untuk aplikasi internal sederhana. Untuk data yang benar-benar sensitif, gunakan backend dengan autentikasi pengguna.

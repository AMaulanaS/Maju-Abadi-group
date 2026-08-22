# Sistem Pengingat Perpanjangan Kendaraan

## File
- `index.html` - tampilan website
- `style.css` - desain
- `script.js` - logika website
- `Code.gs` - backend Google Apps Script

## Setup Google Sheets
1. Buat Google Sheet kosong.
2. Extensions > Apps Script.
3. Masukkan isi `Code.gs`.
4. Simpan.
5. Jalankan `setup()` satu kali.
6. Izinkan permission yang diminta.
7. Deploy > New deployment.
8. Type: Web app.
9. Execute as: Me.
10. Who has access: Anyone.
11. Copy URL `/exec`.

## Hubungkan website
Buka `script.js`, cari:

API_URL = "PASTE_URL_APPS_SCRIPT_DI_SINI";

Ganti dengan URL Web App.

## Pengingat email
Trigger dibuat otomatis oleh `setup()`.
Pemeriksaan dilakukan sekali sehari sekitar pukul 08.00 sesuai timezone project Apps Script.

Reminder aktif:
- H-30
- H-14
- H-7
- H-1
- Hari H

Email hanya dikirim jika kolom Email terisi.

## WhatsApp
Tombol WA di website membuat pesan siap kirim.
Untuk WhatsApp otomatis tanpa klik, perlu WhatsApp Business Cloud API/provider. Token API jangan pernah ditaruh di `script.js`.


## Konfigurasi yang sudah diisi
URL Web App Apps Script sudah dimasukkan ke `script.js`.

Google Sheet yang digunakan:
https://docs.google.com/spreadsheets/d/1kgKQF9Kk07k7nZ4SgFfXUyVi9biQ9QeLvd1sH5LcmP4/edit

Folder Google Drive yang diberikan:
https://drive.google.com/drive/u/0/folders/1ZmXjMvFwn51VSDWFL3cC8-eXFk8GphpG

Catatan: folder Drive belum dipakai oleh kode versi awal. Bisa digunakan untuk menyimpan dokumen/foto kendaraan pada tahap berikutnya.

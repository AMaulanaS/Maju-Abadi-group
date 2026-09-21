BUKU TAMU DIGITAL - VERSI LENGKAP (TANPA LOGIN)

Fitur:
- Dashboard statistik
- Tambah tamu
- Edit data
- Hapus data
- Check-out tamu
- Pencarian
- Filter status
- Filter tanggal
- Pagination
- Detail kunjungan
- Cetak rekap
- Cetak detail tamu
- Export CSV
- Responsive desktop/mobile
- Google Sheets sebagai database
- Google Apps Script sebagai API
- TANPA LOGIN

FILE:
1. index.html
2. style.css
3. app.js
4. Code.gs
5. appsscript.json

SETUP GOOGLE APPS SCRIPT:
1. Buka Google Apps Script yang terkait dengan spreadsheet Anda.
2. Ganti/masukkan isi Code.gs dari paket ini.
3. Pastikan SHEET_NAME = "Sheet1" atau ubah sesuai nama sheet Anda.
4. Jalankan fungsi setup() satu kali dari editor Apps Script dan izinkan akses.
5. Deploy > New deployment > Web app.
6. Execute as: Me.
7. Who has access: Anyone.
8. Salin URL yang berakhiran /exec.
9. Masukkan URL tersebut ke variabel API_URL pada app.js.
10. Upload index.html, style.css dan app.js ke hosting/static website.

CATATAN:
- Karena tanpa login, semua orang yang mengetahui halaman web dapat menambah/edit/hapus data.
- Jangan menaruh data rahasia pada aplikasi ini tanpa menambahkan sistem keamanan.
- Bila URL Apps Script Anda tetap sama, app.js sudah diarahkan ke URL tersebut.
- Bila spreadsheet Anda sudah memiliki header/data versi lama, lakukan backup terlebih dahulu sebelum migrasi struktur kolom.

STRUKTUR KOLOM BARU:
ID | Timestamp | Nama | No. HP / WhatsApp | Instansi / Perusahaan | Jabatan |
Bertemu Dengan | Keperluan | Jumlah Tamu | Status | Waktu Keluar | Detail Keperluan

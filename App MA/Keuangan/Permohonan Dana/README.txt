ROMBAKAN SISTEM PERMOHONAN DANA
================================

Teknologi:
- index.html
- style.css
- script.js
- Google Apps Script (Code.gs)
- Google Sheets sebagai database
- Google Drive sebagai penyimpanan nota/bukti

TIDAK ADA:
- React
- TypeScript
- Supabase
- Supabase Auth
- Login pengguna

CARA PASANG
-----------
1. Buat Google Spreadsheet.
2. Buka Extensions > Apps Script.
3. Tempel isi google-apps-script/Code.gs.
4. Isi CONFIG.SPREADSHEET_ID dengan ID Spreadsheet.
5. Ganti CONFIG.ADMIN_PIN.
6. Deploy > New deployment > Web app.
   Execute as: Me
   Who has access: Anyone
7. Copy URL /exec.
8. Buka script.js dan isi API_URL dengan URL tersebut.
9. Ganti ADMIN_PIN di script.js agar sama dengan Code.gs.
10. Buka index.html atau upload seluruh folder ke hosting/server.

CATATAN KEAMANAN
----------------
Website publik memang tidak membutuhkan login. Namun perubahan status keuangan dilindungi PIN dan diverifikasi kembali di Apps Script. Jangan mengandalkan PIN di JavaScript sebagai keamanan utama.

FITUR
-----
- Public tanpa login
- Form permohonan dana
- Nomor otomatis PD-TAHUN-00001
- Google Sheets CRUD dasar
- Upload bukti ke Google Drive
- Daftar dan pencarian permohonan
- Filter status
- Sortir tanggal/nominal
- Detail permohonan
- Approval / reject / paid melalui Panel Keuangan
- Catatan keuangan
- Statistik dashboard

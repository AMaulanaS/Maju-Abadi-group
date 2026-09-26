KEUANGAN PROYEK MAJU ABADI GROUP — V2 GOOGLE SHEET

FITUR V2
- Tema modern gradient biru-merah.
- 3 perusahaan: FMA, ZMA, RMA.
- Master Pejabat memiliki Nama, NIP, Jabatan, Instansi/Wilayah.
- PPKom/PPTK/Mandor/Staff pada Proyek dipilih dari Master Pejabat.
- Input Rupiah otomatis tampil 50.000.000.
- Tabel proyek: Nilai -> PPh -> PPN -> Uang Masuk -> Sisa.
- Pembayaran/termin tersimpan terpisah dari kontrak.
- Google Sheet sebagai database utama.

CARA MEMBUAT DATABASE GOOGLE SHEET
1. Buat Google Spreadsheet baru, misalnya: DATABASE KEUANGAN PROYEK MAG.
2. Buka Extensions / Ekstensi > Apps Script.
3. Hapus kode lama lalu tempel seluruh isi file Code.gs.
4. Save. Pilih fungsi setupDatabase lalu klik Run/Jalankan SATU KALI.
5. Izinkan akses. Kembali ke Sheet. Otomatis dibuat sheet: PROYEK, PEMBAYARAN, PEJABAT.
6. Apps Script > Deploy > New deployment > Web app.
7. Execute as: Me. Who has access: Anyone. Klik Deploy.
8. Copy URL Web App yang berakhiran /exec.
9. Buka script.js. Isi baris: const API_URL='URL_ANDA';
10. Upload index.html, style.css, script.js ke hosting/GitHub Pages lalu refresh.

CATATAN
- Jika API_URL masih kosong, aplikasi masuk Mode Lokal agar tampilan tetap dapat dicoba.
- NIP disimpan sebagai teks agar angka panjang tidak rusak/berubah oleh Google Sheet.
- Setelah mengubah Code.gs di kemudian hari, deploy versi baru dari Apps Script.

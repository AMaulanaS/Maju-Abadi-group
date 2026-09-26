KEUANGAN PROYEK MAJU ABADI GROUP — V5

FITUR V5
- Dashboard modern gradient biru-merah.
- Filter dashboard: Tahun Anggaran, Status Pembayaran, OPD/Dinas.
- Grafik Nilai Kontrak vs Dana Masuk.
- Grafik pemasukan per bulan.
- Ringkasan Nilai Kontrak, PPh, PPN, Uang Masuk dan Sisa Piutang.
- Detail proyek + riwayat termin + cetak per proyek.
- Menu Aktivitas / audit trail TANPA login.
- Google Sheet menjadi database utama.

SETUP GOOGLE SHEET
1. Buka Spreadsheet database yang sudah digunakan.
2. Extensions > Apps Script.
3. GANTI Code.gs lama dengan Code.gs dari folder ini.
4. Save lalu jalankan setupDatabase() satu kali.
5. Sheet LOG_AKTIVITAS akan dibuat otomatis.
6. Deploy > Manage deployments > Edit deployment > New version > Deploy.
7. Salin URL Web App /exec.
8. Buka script.js dan isi const API_URL='URL_ANDA';

PENTING
Jika deployment lama diperbarui, gunakan New version agar Code.gs V5 aktif.
Tidak perlu membuat ulang sheet PROYEK, PEMBAYARAN, atau PEJABAT.

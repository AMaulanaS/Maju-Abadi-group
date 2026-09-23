INVENTARIS KANTOR v2

FITUR BARU:
- Master Kategori di index.html
- Tambah kategori
- Edit kategori
- Hapus kategori
- Status Aktif/Nonaktif
- Dropdown kategori inventaris otomatis diperbarui setelah perubahan
- Filter inventaris berdasarkan kategori ikut diperbarui

PENTING:
1. Ganti Code.gs pada Apps Script dengan Code.gs dari ZIP ini.
2. Save.
3. Deploy > Manage deployments > Edit deployment.
4. Pastikan Web app tetap menggunakan deployment terbaru.
5. Jika diminta otorisasi, jalankan setup() sekali dari Apps Script.
6. File frontend memakai URL Web App yang sudah diberikan sebelumnya.

Tab Google Sheet:
INVENTARIS
KATEGORI
LOKASI
PEMINJAMAN
MUTASI


Pembaruan versi:
- Animasi loading overlay saat memuat/menyimpan/menghapus data untuk mencegah klik berulang.
- Tabel inventaris menampilkan Harga/Barang (Harga Perolehan per unit/barang).
- Satuan inventaris memakai pilihan pcs, buah, unit, set, pak, lusin, lembar, meter, roll, botol, box, lainnya.
- Lokasi inventaris memiliki pilihan Lantai 1-3 dan ruangan Administrasi, Keuangan, HR/HRD, Pimpinan, Rapat, Gudang, IT, Operasional, Arsip, dll.

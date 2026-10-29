# Panduan Struktur Folder — Maju Abadi Group

Folder ini berisi **website company profile** dan **aplikasi administrasi internal** Maju Abadi Group. Modul Kunjungan Website dan PLTS sudah dipisahkan ke folder masing-masing, sementara aset utama website dan struktur aplikasi ERP tetap dipertahankan. File pendukung setup dan ZIP cadangan juga dikumpulkan agar lebih mudah dicari.

## Peta folder

```text
Maju-Abadi-group/
├── .github/workflows/         Pengaturan deploy otomatis GitHub Pages
├── App MA/                    Aplikasi ERP / administrasi internal
│   ├── General Affair/        Inventaris, legalitas, peminjaman alat, transport
│   ├── Keuangan/              Invoice, kas-bank, jurnal, penerimaan/pengeluaran,
│   │                          permohonan dana, dan rekap keuangan/proyek
│   ├── Laporan/               Dashboard manajemen dan laporan tiap divisi
│   ├── Pergudangan/            Pembelian, persediaan, peminjaman alat, surat jalan
│   ├── Proyek & Operasional/  Progress proyek
│   ├── Sumber Daya Manusia/   Absensi, cuti, data/dokumen karyawan, kontrak, gaji
│   ├── Surat & Administrasi/  Buku nomor surat, buku tamu, pencatatan
│   └── _Arsip Backup/         Salinan ZIP dari beberapa aplikasi
├── img/                       Logo, foto, dan gambar website umum
├── Integrasi Google Apps Script/
│   └── Testimoni/             Kode backend dan petunjuk setup testimoni
├── Kunjungan Website/         Dashboard, tracker, stylesheet, dan sumber backend kunjungan
├── PLTS Residensial/          CSS, JavaScript, dan brosur khusus PLTS
│   └── Brosur/                Brosur PLTS Semarang, Kalimantan, Papua
├── index.html                 Halaman utama website (bagian PLTS tertanam di halaman ini)
├── style.css / script.js      Tampilan dan fungsi website utama
├── kunjungan.html             Pengalihan untuk alamat dashboard kunjungan lama
├── README.md                  Deskripsi proyek
└── LICENSE                    Lisensi proyek
```

## Supaya website tetap berjalan

- **Jangan pindahkan atau mengganti nama** `index.html`, `style.css`, `script.js`, folder `PLTS Residensial/`, folder `Kunjungan Website/`, folder `img/`, folder `App MA/`, atau `.github/workflows/` tanpa sekaligus memperbarui seluruh referensi yang terkait.
- Folder di dalam `App MA/` dipertahankan sesuai lokasi asalnya agar tautan dan referensi aplikasi tidak berubah. Referensi website ke file PLTS dan tracker kunjungan sudah diperbarui sesuai folder baru.
- ZIP cadangan berada di `App MA/_Arsip Backup/`. File sumber aktif tetap berada di folder divisinya masing-masing.
- Kode dan petunjuk untuk backend testimoni dikumpulkan di `Integrasi Google Apps Script/Testimoni/`.

## Catatan

Penataan ini bersifat **organisasi folder**. Fungsi website dipertahankan; perubahan kode hanya untuk menyesuaikan jalur file akibat pemindahan folder. Simpan ZIP asli sebagai cadangan sebelum melakukan perubahan besar berikutnya.

# Admin Landing Page — Maju Abadi Group

Fitur ini menambahkan panel untuk mengelola konten landing page tanpa mengedit HTML setiap kali. Data tersimpan di Google Sheets melalui Google Apps Script.

## Yang bisa dikelola

- Teks beranda dan Tentang Kami.
- Statistik beranda.
- Deskripsi PLTS Residensial.
- Konten pengantar Tour & Travel.
- Daftar layanan: tambah, ubah, sembunyikan, atau hapus.
- Portofolio proyek: tambah, ubah, sembunyikan, hapus, kategori, dan foto.
- Kartu Tour & Travel: tambah, ubah, sembunyikan, atau hapus.
- Informasi alamat, WhatsApp, dan email.

Foto portofolio dapat diunggah dari perangkat melalui panel admin (maksimal 6 MB per foto). Foto akan disimpan di Google Drive pemilik Apps Script dan dibagikan dengan tautan publik agar dapat tampil di website.

## Setup pertama kali

> Admin CMS membutuhkan Google Apps Script dan Google Sheets. Bagian ini perlu dilakukan satu kali oleh pemilik/admin website sebelum panel dapat digunakan.

1. Buka **https://script.google.com/** menggunakan akun Google perusahaan/pengelola website.
2. Buat project baru, misalnya **Maju Abadi Website CMS**.
3. Ganti isi file `Code.gs` dengan isi file `Admin Website/Code.gs` dari folder project ini.
4. Tambahkan file HTML baru bernama **Admin**, lalu salin seluruh isi `Admin Website/Admin.html` ke file tersebut.
5. Di fungsi `initializeAdminPassword()` pada `Code.gs`, ganti teks `GANTI_DENGAN_PASSWORD_KUAT_MINIMAL_16_KARAKTER` dengan password kuat minimal 16 karakter. Jalankan fungsi **initializeAdminPassword** dari editor Apps Script dan setujui izin yang diminta. Setelah sukses, kembalikan string di kode ke placeholder semula lalu simpan. Hash dan salt password tetap tersimpan di Script Properties; password asli tidak diperlukan lagi.
6. Jalankan fungsi **initializeCms** satu kali. Fungsi ini membuat spreadsheet **Maju Abadi Group - Website CMS** dan mengisi konten awal. Simpan URL spreadsheet yang tercetak di log untuk pengelolaan cadangan bila dibutuhkan.
7. Klik **Deploy → New deployment → Web app**. Pilih **Execute as: Me** dan **Who has access: Anyone**. Deploy, lalu salin URL Web App yang berakhiran `/exec`.
8. Buka file `cms-config.js` di folder utama website. Isi `webAppUrl` dengan URL Web App tadi, tanpa menambahkan `?page=admin` atau `?action=content`.
9. Simpan perubahan ke repository GitHub dan tunggu GitHub Pages selesai memperbarui website.
10. Buka `https://majuabadigroup.com/admin.html`, tekan **Buka Panel Admin**, lalu login menggunakan password yang disiapkan pada langkah 5.

## Penggunaan

- Buka menu **Konten Utama**, **Layanan**, **Portofolio Proyek**, atau **Tour & Travel**.
- Isi atau ubah konten yang diperlukan.
- Untuk foto proyek, pilih file gambar lalu tekan **Upload Foto**. URL gambar akan terisi otomatis.
- Klik **Simpan Semua Perubahan**. Website akan memuat konten terbaru saat pengunjung membuka atau memuat ulang halaman.
- Jika hanya ingin menyembunyikan sebuah kartu, hilangkan centang **Tampilkan di website**. Kartu tidak dihapus dari daftar admin.

## Catatan keamanan dan operasional

- Password hanya disimpan sebagai hash + salt di Script Properties, bukan di HTML/JavaScript publik.
- Endpoint publik hanya menyediakan konten yang aktif. Fungsi simpan dan upload memerlukan token sesi admin yang dibuat setelah login.
- Setelah beberapa percobaan login yang salah, login akan dikunci sementara.
- Jangan membagikan password admin. Gunakan akun Google yang dikelola perusahaan sebagai pemilik Apps Script dan Google Drive media.
- Setelah upload gambar, jangan menghapus file di folder Drive **Maju Abadi Website Media**, karena website menggunakan file tersebut.
- Jika ingin mengubah password, edit fungsi `initializeAdminPassword()` dengan password baru, jalankan ulang, lalu kembalikan placeholder seperti langkah setup.
- Perubahan teks, layanan, proyek, dan Tour & Travel tidak memerlukan edit kode atau deployment ulang. Perubahan pada kode Apps Script sendiri memerlukan deployment versi baru.
- Jika CMS belum dihubungkan atau sedang tidak tersedia, landing page tetap menggunakan konten bawaan yang tersimpan di `index.html`.

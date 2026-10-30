# Admin Landing Page — Maju Abadi Group

Panel untuk mengelola konten landing page tanpa mengedit HTML. Semua data disimpan di **Google Sheets** melalui **Google Apps Script**.

## Cara kerja

```
Admin.html  ──(POST /exec)──►  Code.gs (Apps Script Web App)  ◄──►  Google Sheet "Maju Abadi Group - Website CMS"
                                          ▲
index.html + script.js ──(GET ?action=content)──┘   (website publik membaca dari sini)
```

Panel admin kini bisa dibuka dengan **dua cara**, keduanya menyimpan ke Sheet yang sama:

1. **Dari website** (disarankan): `https://majuabadigroup.com/admin.html` → *Buka Panel Admin* (membuka `Admin Website/Admin.html` dan terhubung langsung ke Web App).
2. **Dari Google Apps Script** (cara lama): `URL_WEB_APP/exec?page=admin`. Memerlukan file `Admin` ditempel juga di project Apps Script.

Di halaman login ada baris status koneksi. Jika tertulis **“✓ Terhubung ke Google Sheet CMS”**, sinkronisasi siap dipakai.

## Setup / update (satu kali, atau setiap `Code.gs` berubah)

1. Buka **https://script.google.com/** dengan akun Google pengelola website, lalu buka project **Maju Abadi Website CMS** (atau buat baru).
2. Ganti seluruh isi `Code.gs` dengan isi file `Admin Website/Code.gs`.
3. *(Opsional, hanya untuk cara 2)* tambahkan file HTML bernama **Admin** berisi `Admin Website/Admin.html`.
4. **Password admin** — hanya bila belum pernah dibuat atau ingin diganti:
   - Di fungsi `initializeAdminPassword()`, ganti teks `GANTI_DENGAN_PASSWORD_KUAT_MINIMAL_16_KARAKTER` dengan password baru (minimal 16 karakter).
   - Jalankan fungsi **initializeAdminPassword**, setujui izin.
   - **Kembalikan** teks ke placeholder semula dan simpan. Jangan pernah menyimpan password asli di `Code.gs` yang masuk ke repository.
5. Jalankan fungsi **diagnoseCms** dan lihat *Execution log*. Semua baris harus berstatus SIAP. (Spreadsheet CMS juga dibuat otomatis saat login admin pertama bila belum ada.)
6. **Deploy → Manage deployments → ikon pensil → Version: New version → Deploy.** Pengaturan: *Execute as: Me*, *Who has access: Anyone*. Langkah ini wajib setiap kali kode berubah; tanpa itu URL `/exec` masih menjalankan kode lama.
7. Pastikan file **`cms-config.js` ada di folder utama** (sejajar dengan `index.html` dan `admin.html`) dan `webAppUrl` di dalamnya berisi URL Web App yang diawali `https://script.google.com/` dan berakhiran `/exec` (bukan `/dev`). Tanpa file ini panel admin tidak tahu ke mana harus terhubung, dan login tidak akan berfungsi.
8. Commit ke GitHub dan tunggu GitHub Pages selesai diperbarui. File lama `Code.gs_20-_20perbaikan.gs` boleh dihapus; gantinya `Code.gs`.

## Penggunaan

- Pilih menu **Konten Utama**, **Layanan**, **Portofolio Proyek**, atau **Tour & Travel**, ubah isinya, lalu klik **Simpan Semua Perubahan**.
- Tombol **Buka Google Sheet** di pojok kanan atas membuka spreadsheet-nya untuk memeriksa data tersimpan.
- Website membaca konten terbaru saat halaman dimuat ulang (cache maksimal 60 detik).
- Menyembunyikan kartu: hilangkan centang **Tampilkan di website**.
- Foto proyek: pilih file → **Upload Foto** (maks. 6 MB). File tersimpan di folder Drive **Maju Abadi Website Media**; jangan dihapus.
- Batas: 60 layanan, 100 proyek, 60 konten Tour & Travel.

## Jika belum sinkron — cek pesan di halaman login

| Pesan | Penyebab | Solusi |
|---|---|---|
| URL Web App belum diisi | File `cms-config.js` tidak ada di folder utama, atau `webAppUrl` kosong | Buat/isi file tersebut dengan URL `/exec`, commit, lalu klik **Periksa ulang koneksi** |
| URL Web App pada cms-config.js tidak valid | URL bukan dari `script.google.com`, berakhiran `/dev`, atau URL editor | Salin ulang "Web app URL" dari Manage deployments (berakhiran `/exec`) |
| Web App masih memakai kode lama | `Code.gs` baru belum di-deploy | Langkah 2 dan 6 di atas |
| Password admin belum disiapkan | `initializeAdminPassword()` belum dijalankan | Langkah 4 |
| Tidak dapat menghubungi Web App | Akses bukan *Anyone*, atau URL salah | Deploy ulang dengan *Who has access: Anyone* |
| Sesi admin tidak valid | Sesi berakhir (6 jam) | Login kembali |
| Terlalu banyak percobaan | 8 kali salah password | Tunggu ±15 menit |

## Keamanan

- Password hanya disimpan sebagai hash + salt di Script Properties, tidak ada di HTML/JavaScript publik.
- Workflow GitHub Pages mengunggah **seluruh repository**, termasuk `Code.gs`. Karena itu `Code.gs` tidak boleh berisi password asli.
- Jika password pernah tertulis di `Code.gs` yang sudah di-commit, anggap password itu sudah bocor: buat password baru (langkah 4) dan, bila repository publik, pertimbangkan membersihkan riwayat Git.
- Endpoint publik hanya mengirim konten aktif. Simpan dan upload memerlukan token sesi yang dibuat setelah login.
- Jika CMS tidak tersedia, landing page tetap memakai konten bawaan di `index.html`.

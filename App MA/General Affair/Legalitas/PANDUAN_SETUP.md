## Versi 3 — Loading Anti Klik Berulang

Versi ini menambahkan loading overlay layar penuh saat mengambil atau menyimpan data. Selama loading aktif, klik berulang dicegah agar tidak terjadi request berkali-kali.

# SMART REMINDER SERKOM & LEGAL — SETUP MUDAH

## BAGIAN A — Memasukkan ID Google Spreadsheet

Di file `code.gs`, cari bagian paling atas:

```javascript
const SPREADSHEET_ID = 'TEMPEL_ID_SPREADSHEET_DI_SINI';
```

Misalnya alamat Google Spreadsheet Anda:

`https://docs.google.com/spreadsheets/d/1ABC123XYZ456/edit#gid=0`

Maka yang ditempel hanya:

```javascript
const SPREADSHEET_ID = '1ABC123XYZ456';
```

### Jangan ditempel seperti ini:

```javascript
const SPREADSHEET_ID = 'https://docs.google.com/spreadsheets/d/1ABC123XYZ456/edit';
```

Yang benar hanya ID-nya.

---

# BAGIAN B — Cara mendapatkan ID

1. Buka Google Spreadsheet.
2. Lihat alamat di bagian atas browser.
3. Cari bagian setelah `/d/`.
4. Salin sampai sebelum `/edit`.
5. Tempel ke `SPREADSHEET_ID`.

Contoh:

```text
https://docs.google.com/spreadsheets/d/1VH3kLmDCg5A3qlRyUDVp27m8euU6usXrzJt_sp8uAbY/edit
                                      ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                      INI YANG DISALIN
```

Hasil:

```javascript
const SPREADSHEET_ID = '1VH3kLmDCg5A3qlRyUDVp27m8euU6usXrzJt_sp8uAbY';
```

---

# BAGIAN C — Struktur Sheet

Tidak perlu membuat tab secara manual.

Saat website digunakan, Apps Script akan membuat:

- SERKOM
- LEGAL RMA
- LEGAL FMA
- LEGAL ZMA

beserta header kolomnya.

---

# BAGIAN D — Memasang Apps Script

1. Buka Google Spreadsheet.
2. Pilih `Extensions` → `Apps Script`.
3. Hapus isi `Code.gs`.
4. Copy isi `code.gs` dari paket ini.
5. Tempel.
6. Masukkan `SPREADSHEET_ID`.
7. Klik Save.

---

# BAGIAN E — Tes koneksi Spreadsheet

Di Apps Script:

1. Pilih fungsi `doGet` tidak perlu dijalankan langsung.
2. Pilih fungsi `getSpreadsheet_` lalu klik Run jika ingin mengetes ID.
3. Jika muncul izin, ikuti proses `Review permissions`.
4. Jika tidak ada error berarti ID Spreadsheet sudah terbaca.

Untuk tes yang lebih mudah, bisa tambahkan fungsi berikut sementara:

```javascript
function tesKoneksiSpreadsheet() {
  const ss = getSpreadsheet_();
  Logger.log('BERHASIL: ' + ss.getName());
}
```

Klik Run → `tesKoneksiSpreadsheet`.

Lihat `Execution log`.

---

# BAGIAN F — Deploy sebagai Web App

Di Apps Script:

1. Klik `Deploy`.
2. Klik `New deployment`.
3. Pilih tipe `Web app`.
4. `Execute as`: Me.
5. `Who has access`: Anyone.
6. Klik `Deploy`.
7. Copy URL Web App.

Contohnya:

```text
https://script.google.com/macros/s/AKfycbxxxxxxxxxxxxxxxx/exec
```

---

# BAGIAN G — Masukkan URL Web App ke website

Buka `script.js`.

Cari:

```javascript
const SCRIPT_URL = 'TEMPEL_URL_WEB_APP_DI_SINI';
```

Ganti dengan URL hasil Deploy.

Contoh:

```javascript
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxxxxxxxxxxxxxxxx/exec';
```

Jangan menambahkan `?kategori=serkom` pada URL utama.

Website akan menambahkan parameter kategori otomatis.

---

# BAGIAN H — Jika code.gs sudah pernah di-deploy

Setelah mengubah `code.gs`, deployment Web App perlu diperbarui.

Pilih:

`Deploy` → `Manage deployments` → pilih deployment → `Edit` → `New version` → `Deploy`.

URL Web App biasanya tetap sama.

---

# BAGIAN I — Fonnte

Versi ini tidak lagi menyimpan token Fonnte langsung di kode utama.

Di Apps Script:

1. Buka `Project Settings`.
2. Cari `Script Properties`.
3. Tambahkan property:

Name:
`FONNTE_TOKEN`

Value:
`TOKEN_FONNTE_ANDA`

Alternatif: gunakan fungsi `simpanTokenFonnte()` setelah mengganti placeholder token.

## Penting

Token Fonnte yang sebelumnya tertulis langsung di source code sebaiknya dibuat ulang/dirotasi jika source code tersebut pernah dibagikan ke orang lain.

---

# BAGIAN J — Reminder jam 08.00

Setelah semua koneksi berhasil:

1. Di Apps Script pilih fungsi `buatJadwalJam8Pagi`.
2. Klik Run satu kali.
3. Berikan izin jika diminta.

Sistem akan membuat trigger:
- WhatsApp reminder setiap hari
- Email reminder setiap hari

---

# BAGIAN K — Jika website tidak menampilkan data

Periksa berurutan:

1. `SPREADSHEET_ID` benar.
2. Web App sudah Deploy.
3. Access = Anyone.
4. `SCRIPT_URL` di `script.js` benar.
5. Nama tab jangan diubah:
   - SERKOM
   - LEGAL RMA
   - LEGAL FMA
   - LEGAL ZMA
6. Coba klik tombol `Refresh Data`.



## Perubahan sesuai koreksi Pak Bos

### SERKOM
- No Sertifikat, No Registrasi, Tgl Buat Registrasi, Tgl Expired Registrasi, PJT, dan TT dihapus.
- Diganti satu kolom **Keterangan**.
- Peringatan expired menjadi **120 hari**.

### LEGAL RMA / FMA / ZMA
- **No Sertifikat** menjadi **Nomer Dokumen**.
- **Tgl Buat** menjadi **Tgl Dokumen**.
- Peringatan expired menjadi **120 hari**.

> Catatan: jika Spreadsheet lama sudah memiliki kolom/header versi sebelumnya, sesuaikan header tab agar sama dengan struktur baru sebelum dipakai menyimpan data baru. Data lama tidak dihapus otomatis oleh versi ini.

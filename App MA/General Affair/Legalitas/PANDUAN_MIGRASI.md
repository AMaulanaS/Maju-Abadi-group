# PANDUAN MIGRASI DATA LEGALITAS

## Tujuan
Versi ini memindahkan struktur header Spreadsheet lama ke struktur baru tanpa menghilangkan data.

## Sebelum mulai
1. Pastikan `SPREADSHEET_ID` di `code.gs` sudah benar.
2. Jangan hapus tab lama.
3. Pastikan akun Apps Script mempunyai akses edit ke Spreadsheet.

## Cara menjalankan migrasi
1. Buka **Extensions > Apps Script** pada project Apps Script.
2. Buka file `code.gs`.
3. Isi:
   `const SPREADSHEET_ID = 'ID_SPREADSHEET_KAMU';`
4. Simpan.
5. Di dropdown fungsi bagian atas Apps Script pilih:
   **migrasiHeaderLamaKeBaru**
6. Klik **Run/Jalankan**.
7. Berikan izin Google jika diminta.

## Apa yang dilakukan?
Untuk setiap tab SERKOM, LEGAL RMA, LEGAL FMA, dan LEGAL ZMA:
- Struktur header lama dibaca.
- Sistem membuat tab `BACKUP_...` sebelum perubahan.
- Data lama dipetakan ke kolom baru.
- Data lama tidak dibuang.
- Pada SERKOM, kolom lama `No Sertifikat`, `No Registrasi`, `Tgl Buat Registrasi`, `Tgl Expired Registrasi`, `PJT`, dan `TT` digabung ke kolom **Keterangan** agar informasinya tetap tersimpan.
- Pada LEGAL, `No Sertifikat` dipindahkan menjadi **Nomer Dokumen**, dan `Tgl Buat` dipindahkan menjadi **Tgl Dokumen**.

## Setelah berhasil
Periksa tab asli dan tab `BACKUP_...`.
Jika data sudah benar, website bisa digunakan seperti biasa.

> Jangan menjalankan fungsi migrasi berulang kali kecuali memang diperlukan. Jika struktur sudah baru, fungsi tidak akan membuat backup baru untuk tab tersebut.

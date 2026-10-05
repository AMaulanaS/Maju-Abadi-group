PERMOHONAN DANA - PUBLIC GOOGLE SHEETS

Fitur:
- Form pengajuan tanpa login.
- Rincian item dinamis: No, Keterangan / Item, Harga.
- Tombol + Tambah Item untuk menambah baris sebanyak yang diperlukan.
- Total dana dihitung otomatis dari seluruh harga item.
- Setiap item dapat memiliki BANYAK gambar bukti.
- Tidak ada batas jumlah gambar; maksimal 10 MB per gambar.
- Gambar diunggah satu per satu ke Google Drive setelah permohonan dibuat agar upload banyak gambar lebih stabil.
- Preview nama file dan tombol hapus sebelum permohonan dikirim.
- Saat data dibuka kembali, seluruh gambar bukti tampil per item dalam galeri.
- Admin dapat menghapus gambar yang sudah tersimpan dari Panel Keuangan.
- Rincian item dan metadata gambar disimpan di Google Sheets pada kolom Items JSON.
- Data lama tetap dapat dibaca.
- Upload bukti lama/global tetap didukung untuk kompatibilitas data sebelumnya.
- Panel keuangan dengan PIN.

SETUP:
1. Buka google-apps-script/Code.gs.
2. Isi SPREADSHEET_ID dan ADMIN_PIN.
3. Deploy sebagai Web App, Execute as: Me, Who has access: Anyone.
4. Salin URL /exec ke API_URL di script.js.
5. Jika memakai Spreadsheet lama, cukup deploy ulang Code.gs. Kolom "Items JSON" akan ditambahkan otomatis di ujung sheet.

CATATAN UPLOAD:
- Jumlah gambar per item tidak dibatasi oleh aplikasi.
- Ukuran maksimal per gambar adalah 10 MB.
- Gunakan JPG, PNG, WEBP, atau GIF.
- Setiap gambar masuk ke folder Google Drive "Permohonan Dana - Bukti", lalu subfolder sesuai nomor permohonan.

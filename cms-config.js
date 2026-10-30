/**
 * Konfigurasi koneksi CMS Maju Abadi Group.
 *
 * File ini WAJIB ada di folder utama website (sejajar dengan index.html dan admin.html).
 * Panel admin membacanya untuk mengetahui alamat Google Apps Script Web App.
 *
 * CARA MENGISI:
 * 1. Buka https://script.google.com/ -> project "Maju Abadi Website CMS".
 * 2. Deploy -> Manage deployments -> salin "Web app URL".
 * 3. Tempel di webAppUrl di bawah (di antara tanda kutip), lalu commit ke GitHub.
 *
 * Syarat URL:
 * - diawali  https://script.google.com/
 * - berakhiran  /exec   (BUKAN /dev dan BUKAN alamat editor yang berisi /edit)
 *
 * Contoh bentuk:
 *   https://script.google.com/macros/s/AKfycb....panjang....../exec
 *
 * Catatan: URL ini memang terlihat publik di website. Yang rahasia adalah password admin,
 * dan password tidak pernah disimpan di file ini.
 */
window.MA_CMS_CONFIG = {
  webAppUrl: ''
};

/**
 * MAJU ABADI GROUP - LANDING PAGE CMS
 * Google Apps Script backend for the public website and password-protected admin.
 * Public endpoint: ?action=content
 * Admin dashboard: ?page=admin
 */

const CMS_SPREADSHEET_PROPERTY = 'MA_CMS_SPREADSHEET_ID';
const CMS_PASSWORD_SALT_PROPERTY = 'MA_CMS_PASSWORD_SALT';
const CMS_PASSWORD_HASH_PROPERTY = 'MA_CMS_PASSWORD_HASH';
const CMS_PUBLIC_CACHE_KEY = 'MA_CMS_PUBLIC_CONTENT_V1';
const CMS_SESSION_PREFIX = 'MA_CMS_ADMIN_SESSION_';
const CMS_LOGIN_LOCK_KEY = 'MA_CMS_LOGIN_LOCK';
const CMS_LOGIN_FAIL_KEY = 'MA_CMS_LOGIN_FAILURES';

const CMS_SHEETS = {
  settings: { name: 'Settings', headers: ['KEY', 'VALUE'] },
  services: { name: 'Services', headers: ['ID', 'ICON', 'TITLE', 'DESCRIPTION', 'BULLETS', 'ACTIVE', 'SORT'] },
  projects: { name: 'Projects', headers: ['ID', 'CATEGORY', 'LABEL', 'TITLE', 'IMAGE_URL', 'ACTIVE', 'FEATURED', 'SORT'] },
  tour: { name: 'Tour Travel', headers: ['ID', 'ICON', 'TITLE', 'DESCRIPTION', 'ACTIVE', 'SORT'] }
};

const DEFAULT_SETTINGS = {
  heroBadge: 'MAJU ABADI GROUP',
  heroLine1: 'MEMBANGUN',
  heroLine2: 'IMPIAN',
  heroLine3: 'ANDA',
  heroSubtitle: 'Grup bisnis terintegrasi yang menyediakan solusi di bidang teknik, konstruksi, perdagangan, pengadaan, teknologi, serta layanan Tour & Travel.',
  aboutTitle: 'Solusi | Mechanical, Electrical & Supplier yang Profesional',
  aboutParagraph1: 'Maju Abadi Group merupakan perusahaan yang bergerak di bidang Mechanical, Electrical & Supplier dengan fokus pada pengadaan barang, jasa konstruksi, instalasi mekanikal elektrikal, maintenance service, serta berbagai pekerjaan infrastruktur untuk sektor pemerintah maupun swasta.',
  aboutParagraph2: 'Berbekal tenaga ahli yang berpengalaman, sumber daya manusia yang kompeten, serta didukung peralatan kerja yang memadai, kami berkomitmen memberikan layanan berkualitas, tepat waktu, dan sesuai standar profesional.',
  aboutParagraph3: 'Kepuasan pelanggan merupakan prioritas utama kami. Kami menjaga kualitas pekerjaan, membangun hubungan kerja sama profesional, dan terus meningkatkan kemampuan perusahaan.',
  statProjects: '375',
  statYears: '8',
  statSatisfaction: '100',
  statTeam: '17',
  statLabelProjects: 'Proyek Selesai',
  statLabelYears: 'Tahun Pengalaman',
  statLabelSatisfaction: 'Klien Puas',
  statLabelTeam: 'Tim Profesional',
  pltsTitle: 'Paket PLTS Hybrid untuk | Rumah Anda',
  pltsDescription: 'Maju Abadi Energi menyediakan paket PLTS hybrid siap pasang: panel surya, inverter, dan baterai LiFePO4 dalam satu paket. Pilih wilayah Anda untuk melihat harga dan spesifikasi.',
  tourBadge: 'DIVISI BARU • TOUR & TRAVEL',
  tourTitle: 'MAJU ABADI | TOUR & TRAVEL',
  tourDescription: 'Perjalanan nyaman, terencana, dan berkesan untuk keluarga, sekolah, komunitas, instansi, hingga perusahaan.',
  tourIntroTitle: 'Travel dengan standar layanan Maju Abadi',
  tourIntroDescription: 'Divisi Tour & Travel dirancang sebagai unit usaha yang melengkapi Maju Abadi Group dengan layanan perjalanan yang fleksibel dan dapat disesuaikan dengan kebutuhan pelanggan.',
  projectsDescription: 'Berbagai proyek telah kami selesaikan dengan mengedepankan kualitas, keselamatan kerja, dan kepuasan pelanggan sebagai prioritas utama.',
  contactTitle: 'Konsultasikan | Kebutuhan Anda',
  contactDescription: 'Maju Abadi Group siap membantu kebutuhan konstruksi, pengadaan, maintenance, maupun perjalanan Tour & Travel.',
  contactAddress: 'Jl. Bukit Beringin Lestari II, No.1 Semarang',
  contactWhatsapp: '6285100511753',
  contactWhatsappLabel: '+62 851-0051-1753',
  contactEmail: 'admin@majuabadigroup.com'
};

const DEFAULT_SERVICES = [
  { id: 'service-1', icon: '⚡', title: 'Mechanical & Electrical', description: 'Instalasi dan pekerjaan mekanikal elektrikal dengan standar profesional.', bullets: ['Instalasi listrik', 'Panel & sistem kontrol', 'PJU & PJUTS'], active: true, sort: 1 },
  { id: 'service-2', icon: '🏗️', title: 'Konstruksi & Infrastruktur', description: 'Pekerjaan konstruksi dan pembangunan infrastruktur untuk berbagai kebutuhan.', bullets: ['Pembangunan', 'Renovasi', 'Pekerjaan infrastruktur'], active: true, sort: 2 },
  { id: 'service-3', icon: '📦', title: 'Pengadaan Barang & Jasa', description: 'Pengadaan barang dan jasa secara profesional sesuai spesifikasi kebutuhan.', bullets: ['Pengadaan material', 'Supplier', 'Barang proyek'], active: true, sort: 3 },
  { id: 'service-4', icon: '🛠️', title: 'Maintenance Service', description: 'Pemeliharaan dan dukungan teknis agar sistem tetap optimal dan berkelanjutan.', bullets: ['Preventive maintenance', 'Perbaikan', 'Inspeksi teknis'], active: true, sort: 4 }
];

const DEFAULT_PROJECTS = [
  { id: 'project-1', category: 'electrical', label: 'Mechanical & Electrical', title: 'Instalasi Panel Listrik & Sistem Kelistrikan', image: 'https://images.pexels.com/photos/9679179/pexels-photo-9679179.jpeg', active: true, featured: false, sort: 1 },
  { id: 'project-2', category: 'pju', label: 'PJU & PJUTS', title: 'Pembangunan Penerangan Jalan Umum', image: 'https://images.pexels.com/photos/34610710/pexels-photo-34610710.jpeg', active: true, featured: true, sort: 2 },
  { id: 'project-3', category: 'pju', label: 'PJU Tenaga Surya', title: 'Instalasi Penerangan Jalan Umum Tenaga Surya', image: 'https://images.pexels.com/photos/14613940/pexels-photo-14613940.jpeg', active: true, featured: false, sort: 3 },
  { id: 'project-4', category: 'supplier', label: 'Pengadaan Barang', title: 'Pengadaan Material & Peralatan Teknik', image: 'img/pengadaan.png', active: true, featured: false, sort: 4 },
  { id: 'project-5', category: 'maintenance', label: 'Maintenance', title: 'Pemeliharaan Sistem Kelistrikan', image: 'https://images.pexels.com/photos/34054464/pexels-photo-34054464.jpeg', active: true, featured: false, sort: 5 },
  { id: 'project-6', category: 'electrical', label: 'Infrastruktur', title: 'Pekerjaan Infrastruktur & Instalasi Pendukung', image: 'https://images.pexels.com/photos/11644973/pexels-photo-11644973.jpeg', active: true, featured: false, sort: 6 }
];

const DEFAULT_TOUR = [
  { id: 'tour-1', icon: '🌴', title: 'Paket Wisata', description: 'Perjalanan wisata domestik dengan itinerary yang dapat disesuaikan.', active: true, sort: 1 },
  { id: 'tour-2', icon: '🚌', title: 'Sewa Bus & Transportasi', description: 'Transportasi perjalanan kelompok untuk wisata, kunjungan, dan kegiatan perusahaan.', active: true, sort: 2 },
  { id: 'tour-3', icon: '🏢', title: 'Corporate Trip', description: 'Perjalanan perusahaan, gathering, outing, perjalanan dinas, dan kegiatan tim.', active: true, sort: 3 },
  { id: 'tour-4', icon: '🎓', title: 'Study Tour', description: 'Perjalanan edukasi untuk sekolah, kampus, organisasi, dan kelompok belajar.', active: true, sort: 4 },
  { id: 'tour-5', icon: '🕌', title: 'Wisata Religi', description: 'Perjalanan religi yang disusun dengan memperhatikan kenyamanan dan kebutuhan rombongan.', active: true, sort: 5 },
  { id: 'tour-6', icon: '🎉', title: 'Gathering & Outbound', description: 'Konsep perjalanan dan kegiatan kelompok untuk membangun kebersamaan dan pengalaman baru.', active: true, sort: 6 }
];

function doGet(e) {
  const params = (e && e.parameter) || {};

  if (params.page === 'admin') {
    return HtmlService.createHtmlOutputFromFile('Admin')
      .setTitle('Admin Website | Maju Abadi Group')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }

  if (params.action === 'content' || !params.action) {
    const content = getPublicContent_();
    const callback = String(params.callback || '');
    if (callback && /^[A-Za-z_$][0-9A-Za-z_$]{0,80}$/.test(callback)) {
      return ContentService.createTextOutput(callback + '(' + JSON.stringify(content) + ');')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return jsonOutput_(content);
  }

  return jsonOutput_({ ok: false, message: 'Action tidak dikenal.' });
}

/** Jalankan sekali dari Apps Script untuk membuat spreadsheet CMS awal. */
function initializeCms() {
  const properties = PropertiesService.getScriptProperties();
  let spreadsheetId = properties.getProperty(CMS_SPREADSHEET_PROPERTY);
  let spreadsheet;

  if (spreadsheetId) {
    spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  } else {
    spreadsheet = SpreadsheetApp.create('Maju Abadi Group - Website CMS');
    spreadsheetId = spreadsheet.getId();
    properties.setProperty(CMS_SPREADSHEET_PROPERTY, spreadsheetId);
  }

  ensureSheet_(spreadsheet, 'settings', DEFAULT_SETTINGS);
  ensureSheet_(spreadsheet, 'services', DEFAULT_SERVICES);
  ensureSheet_(spreadsheet, 'projects', DEFAULT_PROJECTS);
  ensureSheet_(spreadsheet, 'tour', DEFAULT_TOUR);
  CacheService.getScriptCache().remove(CMS_PUBLIC_CACHE_KEY);

  const result = {
    ok: true,
    spreadsheetId,
    spreadsheetUrl: spreadsheet.getUrl(),
    message: 'CMS siap. Data awal telah dibuat bila sheet masih kosong.'
  };
  Logger.log(JSON.stringify(result));
  return result;
}

/** Alias berbahasa Indonesia agar mudah ditemukan di daftar fungsi Apps Script. */
function inisialisasiDatabase() {
  return initializeCms();
}

/**
 * Ubah nilai password di bawah, jalankan fungsi ini sekali, lalu kembalikan
 * string password ke placeholder sebelum project di-deploy.
 * Password tersimpan sebagai hash + salt di Script Properties.
 */
function initializeAdminPassword() {
  const password = '@Admin12345';
  if (password.indexOf('GANTI_DENGAN_') === 0 || password.length < 10) {
    throw new Error('Edit password pada fungsi initializeAdminPassword() terlebih dahulu. Gunakan minimal 16 karakter.');
  }

  const salt = Utilities.getUuid() + Utilities.getUuid();
  const hash = hashPassword_(salt, password);
  const properties = PropertiesService.getScriptProperties();
  properties.setProperty(CMS_PASSWORD_SALT_PROPERTY, salt);
  properties.setProperty(CMS_PASSWORD_HASH_PROPERTY, hash);
  Logger.log('Password admin tersimpan dengan aman. Jangan simpan password asli di repository.');
  return { ok: true, message: 'Password admin berhasil disiapkan.' };
}

function getPublicContent_() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get(CMS_PUBLIC_CACHE_KEY);
  if (cached) {
    try { return JSON.parse(cached); } catch (error) { cache.remove(CMS_PUBLIC_CACHE_KEY); }
  }

  const spreadsheet = getCmsSpreadsheet_();
  if (!spreadsheet) {
    return { ok: false, message: 'CMS belum disiapkan. Jalankan initializeCms() dari Apps Script.' };
  }

  const result = {
    ok: true,
    settings: readSettings_(spreadsheet),
    services: readServices_(spreadsheet).filter(item => item.active),
    projects: readProjects_(spreadsheet).filter(item => item.active),
    tour: readTour_(spreadsheet).filter(item => item.active)
  };
  cache.put(CMS_PUBLIC_CACHE_KEY, JSON.stringify(result), 60);
  return result;
}

function loginAdmin(password) {
  const cache = CacheService.getScriptCache();
  if (cache.get(CMS_LOGIN_LOCK_KEY)) {
    return { ok: false, message: 'Terlalu banyak percobaan. Coba kembali sekitar 15 menit lagi.' };
  }

  const properties = PropertiesService.getScriptProperties();
  const salt = properties.getProperty(CMS_PASSWORD_SALT_PROPERTY);
  const storedHash = properties.getProperty(CMS_PASSWORD_HASH_PROPERTY);
  if (!salt || !storedHash) {
    return { ok: false, message: 'Password admin belum disiapkan. Jalankan initializeAdminPassword() di Apps Script.' };
  }

  const incoming = String(password || '');
  if (!constantTimeEquals_(hashPassword_(salt, incoming), storedHash)) {
    const failures = Number(cache.get(CMS_LOGIN_FAIL_KEY) || 0) + 1;
    if (failures >= 8) {
      cache.put(CMS_LOGIN_LOCK_KEY, '1', 900);
      cache.remove(CMS_LOGIN_FAIL_KEY);
    } else {
      cache.put(CMS_LOGIN_FAIL_KEY, String(failures), 900);
    }
    return { ok: false, message: 'Password tidak sesuai.' };
  }

  cache.remove(CMS_LOGIN_FAIL_KEY);
  const token = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
  cache.put(CMS_SESSION_PREFIX + token, 'valid', 21600);
  return { ok: true, token, expiresIn: 21600 };
}

function logoutAdmin(token) {
  if (token) CacheService.getScriptCache().remove(CMS_SESSION_PREFIX + String(token));
  return { ok: true };
}

function getAdminContent(token) {
  requireAdmin_(token);
  const spreadsheet = getCmsSpreadsheet_();
  if (!spreadsheet) throw new Error('CMS belum dibuat. Jalankan initializeCms() terlebih dahulu.');
  return {
    ok: true,
    settings: readSettings_(spreadsheet),
    services: readServices_(spreadsheet),
    projects: readProjects_(spreadsheet),
    tour: readTour_(spreadsheet)
  };
}

function saveAdminContent(token, payload) {
  requireAdmin_(token);
  if (!payload || typeof payload !== 'object') throw new Error('Data konten tidak valid.');

  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const spreadsheet = getCmsSpreadsheet_();
    if (!spreadsheet) throw new Error('CMS belum dibuat. Jalankan initializeCms() terlebih dahulu.');

    const settings = {};
    Object.keys(DEFAULT_SETTINGS).forEach(key => {
      settings[key] = cleanText_(payload.settings && payload.settings[key], 1000) || DEFAULT_SETTINGS[key];
    });
    writeSettings_(spreadsheet, settings);
    writeServices_(spreadsheet, Array.isArray(payload.services) ? payload.services : []);
    writeProjects_(spreadsheet, Array.isArray(payload.projects) ? payload.projects : []);
    writeTour_(spreadsheet, Array.isArray(payload.tour) ? payload.tour : []);

    CacheService.getScriptCache().remove(CMS_PUBLIC_CACHE_KEY);
    return { ok: true, message: 'Konten berhasil disimpan. Perubahan akan tampil di website dalam beberapa saat.' };
  } finally {
    lock.releaseLock();
  }
}

function uploadImage(token, fileName, mimeType, dataUrl) {
  requireAdmin_(token);
  const safeName = cleanText_(fileName, 120) || 'gambar-website';
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const type = String(mimeType || '').toLowerCase();
  if (allowed.indexOf(type) === -1) throw new Error('Format gambar harus JPG, PNG, WEBP, atau GIF.');

  const match = String(dataUrl || '').match(/^data:image\/(?:jpeg|png|webp|gif);base64,([A-Za-z0-9+/=]+)$/);
  if (!match) throw new Error('File gambar tidak terbaca. Pilih ulang file gambar.');
  const bytes = Utilities.base64Decode(match[1]);
  if (bytes.length > 6 * 1024 * 1024) throw new Error('Ukuran gambar maksimal 6 MB.');

  const folderName = 'Maju Abadi Website Media';
  const folders = DriveApp.getFoldersByName(folderName);
  const folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);
  const blob = Utilities.newBlob(bytes, type, safeName);
  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return {
    ok: true,
    url: 'https://drive.google.com/uc?export=view&id=' + file.getId(),
    fileId: file.getId(),
    message: 'Gambar berhasil diunggah.'
  };
}

function requireAdmin_(token) {
  const key = CMS_SESSION_PREFIX + String(token || '');
  if (!token || CacheService.getScriptCache().get(key) !== 'valid') {
    throw new Error('Sesi admin tidak valid atau sudah berakhir. Silakan login kembali.');
  }
}

function getCmsSpreadsheet_() {
  const id = PropertiesService.getScriptProperties().getProperty(CMS_SPREADSHEET_PROPERTY);
  if (!id) return null;
  return SpreadsheetApp.openById(id);
}

function ensureSheet_(spreadsheet, type, defaults) {
  const config = CMS_SHEETS[type];
  let sheet = spreadsheet.getSheetByName(config.name);
  if (!sheet) sheet = spreadsheet.insertSheet(config.name);

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, config.headers.length).setValues([config.headers]);
    const rows = defaultRows_(type, defaults);
    if (rows.length) sheet.getRange(2, 1, rows.length, config.headers.length).setValues(rows);
  }
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, config.headers.length).setFontWeight('bold').setBackground('#eaf0f8');
  return sheet;
}

function defaultRows_(type, defaults) {
  if (type === 'settings') return Object.keys(defaults).map(key => [key, defaults[key]]);
  if (type === 'services') return defaults.map(item => [item.id, item.icon, item.title, item.description, item.bullets.join('\n'), item.active, item.sort]);
  if (type === 'projects') return defaults.map(item => [item.id, item.category, item.label, item.title, item.image, item.active, item.featured, item.sort]);
  if (type === 'tour') return defaults.map(item => [item.id, item.icon, item.title, item.description, item.active, item.sort]);
  return [];
}

function readSettings_(spreadsheet) {
  const sheet = spreadsheet.getSheetByName(CMS_SHEETS.settings.name);
  const result = Object.assign({}, DEFAULT_SETTINGS);
  if (!sheet || sheet.getLastRow() < 2) return result;
  sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).getValues().forEach(row => {
    const key = String(row[0] || '');
    if (Object.prototype.hasOwnProperty.call(DEFAULT_SETTINGS, key)) result[key] = safeReadText_(row[1]);
  });
  return result;
}

function readServices_(spreadsheet) {
  const sheet = spreadsheet.getSheetByName(CMS_SHEETS.services.name);
  if (!sheet || sheet.getLastRow() < 2) return [];
  return sheet.getRange(2, 1, sheet.getLastRow() - 1, 7).getValues().filter(row => row[0]).map(row => ({
    id: String(row[0]), icon: safeReadText_(row[1]), title: safeReadText_(row[2]),
    description: safeReadText_(row[3]), bullets: safeReadText_(row[4]).split(/\r?\n/).map(v => v.trim()).filter(Boolean),
    active: row[5] === true || String(row[5]).toLowerCase() === 'true', sort: Number(row[6]) || 0
  })).sort((a, b) => a.sort - b.sort);
}

function readProjects_(spreadsheet) {
  const sheet = spreadsheet.getSheetByName(CMS_SHEETS.projects.name);
  if (!sheet || sheet.getLastRow() < 2) return [];
  return sheet.getRange(2, 1, sheet.getLastRow() - 1, 8).getValues().filter(row => row[0]).map(row => ({
    id: String(row[0]), category: safeReadText_(row[1]), label: safeReadText_(row[2]),
    title: safeReadText_(row[3]), image: safeReadText_(row[4]),
    active: row[5] === true || String(row[5]).toLowerCase() === 'true',
    featured: row[6] === true || String(row[6]).toLowerCase() === 'true', sort: Number(row[7]) || 0
  })).sort((a, b) => a.sort - b.sort);
}

function readTour_(spreadsheet) {
  const sheet = spreadsheet.getSheetByName(CMS_SHEETS.tour.name);
  if (!sheet || sheet.getLastRow() < 2) return [];
  return sheet.getRange(2, 1, sheet.getLastRow() - 1, 6).getValues().filter(row => row[0]).map(row => ({
    id: String(row[0]), icon: safeReadText_(row[1]), title: safeReadText_(row[2]),
    description: safeReadText_(row[3]), active: row[4] === true || String(row[4]).toLowerCase() === 'true', sort: Number(row[5]) || 0
  })).sort((a, b) => a.sort - b.sort);
}

function writeSettings_(spreadsheet, settings) {
  const sheet = spreadsheet.getSheetByName(CMS_SHEETS.settings.name);
  const rows = Object.keys(DEFAULT_SETTINGS).map(key => [key, safeSheetText_(settings[key])]);
  replaceSheetData_(sheet, CMS_SHEETS.settings.headers, rows);
}

function writeServices_(spreadsheet, items) {
  const rows = items.slice(0, 60).map((item, index) => [
    cleanText_(item.id, 80) || ('service-' + (index + 1)),
    cleanText_(item.icon, 20), cleanText_(item.title, 120), cleanText_(item.description, 500),
    cleanText_(Array.isArray(item.bullets) ? item.bullets.join('\n') : item.bullets, 500),
    item.active !== false, index + 1
  ]).filter(row => row[2]);
  replaceSheetData_(spreadsheet.getSheetByName(CMS_SHEETS.services.name), CMS_SHEETS.services.headers, rows);
}

function writeProjects_(spreadsheet, items) {
  const rows = items.slice(0, 100).map((item, index) => {
    const category = cleanCategory_(item.category) || 'lainnya';
    return [
      cleanText_(item.id, 80) || ('project-' + (index + 1)), category,
      cleanText_(item.label, 100) || category, cleanText_(item.title, 160),
      cleanImageUrl_(item.image), item.active !== false, item.featured === true, index + 1
    ];
  }).filter(row => row[3]);
  replaceSheetData_(spreadsheet.getSheetByName(CMS_SHEETS.projects.name), CMS_SHEETS.projects.headers, rows);
}

function writeTour_(spreadsheet, items) {
  const rows = items.slice(0, 60).map((item, index) => [
    cleanText_(item.id, 80) || ('tour-' + (index + 1)), cleanText_(item.icon, 20),
    cleanText_(item.title, 120), cleanText_(item.description, 500), item.active !== false, index + 1
  ]).filter(row => row[2]);
  replaceSheetData_(spreadsheet.getSheetByName(CMS_SHEETS.tour.name), CMS_SHEETS.tour.headers, rows);
}

function replaceSheetData_(sheet, headers, rows) {
  sheet.clearContents();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  if (rows.length) sheet.getRange(2, 1, rows.length, headers.length).setValues(rows.map(row => row.map(value => typeof value === 'string' ? safeSheetText_(value) : value)));
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#eaf0f8');
}

function cleanText_(value, maxLength) {
  return String(value == null ? '' : value).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, maxLength || 1000);
}

function safeSheetText_(value) {
  const text = cleanText_(value, 2000);
  return /^[=+@\-]/.test(text) ? "'" + text : text;
}

function safeReadText_(value) {
  const text = String(value == null ? '' : value);
  return text.charAt(0) === "'" && /^[=+@\-]/.test(text.slice(1)) ? text.slice(1) : text;
}

function cleanCategory_(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
}

function cleanImageUrl_(value) {
  const url = cleanText_(value, 600);
  if (!url) return '';
  if (/^https:\/\//i.test(url) || /^http:\/\//i.test(url) || /^[a-z0-9_./% -]+\.(?:png|jpe?g|webp|gif)(?:\?.*)?$/i.test(url)) return url;
  return '';
}

function hashPassword_(salt, password) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, salt + ':' + String(password), Utilities.Charset.UTF_8);
  return bytes.map(byte => {
    const value = byte < 0 ? byte + 256 : byte;
    return ('0' + value.toString(16)).slice(-2);
  }).join('');
}

function constantTimeEquals_(a, b) {
  const left = String(a || '');
  const right = String(b || '');
  if (left.length !== right.length) return false;
  let result = 0;
  for (let i = 0; i < left.length; i++) result |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return result === 0;
}

function jsonOutput_(object) {
  return ContentService.createTextOutput(JSON.stringify(object)).setMimeType(ContentService.MimeType.JSON);
}

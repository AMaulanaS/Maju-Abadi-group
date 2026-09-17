/*******************************************************
 * MAJU ABADI GROUP - MODUL KUNJUNGAN WEBSITE
 * Google Apps Script - FIX OTOMATIS
 *
 * Spreadsheet target:
 * 1OluATwmbaau_QFgVT3oHmAwVC8ajMCWYLE6XOTWj3GA
 *
 * Deploy sebagai Web App:
 * Execute as: Me
 * Who has access: Anyone
 *******************************************************/

const SPREADSHEET_ID = '1OluATwmbaau_QFgVT3oHmAwVC8ajMCWYLE6XOTWj3GA';
const VISITS_SHEET = 'KUNJUNGAN';
const NETWORK_SHEET = 'NETWORK_PEMERINTAH';

// Token ini dipakai dashboard secara otomatis.
// Jangan ubah salah satu file saja: kunjungan.gs dan kunjungan.html
// harus memakai token yang sama.
const DASHBOARD_TOKEN = '2d07db287e47456a7788724b582acfa73b3440198f786563214e7f61f31ad83f';

const VISIT_HEADERS = [
  'Waktu Kunjungan',
  'IP Address',
  'Negara',
  'Region',
  'Kota/Perkiraan Lokasi',
  'ISP',
  'Organization',
  'ASN',
  'Label Jaringan',
  'Jaringan Pemerintah',
  'Perangkat',
  'Browser',
  'OS',
  'Halaman',
  'Referrer',
  'Session ID',
  'User Agent'
];

const NETWORK_HEADERS = [
  'Aktif',
  'ASN',
  'Organization/ISP Pattern',
  'Label',
  'Keterangan'
];

const DEFAULT_GOV_NETWORKS = [
  ['YA', 'AS4761', 'TELKOM INDONESIA', 'TELKOM / PEMERINTAH', 'Contoh pola; verifikasi ASN/organisasi sebelum dipakai.'],
  ['YA', '', 'PEMERINTAH KOTA SEMARANG', 'PEMERINTAH KOTA SEMARANG', 'Contoh pola organisasi.'],
  ['YA', '', 'PEMERINTAH KABUPATEN', 'PEMERINTAH DAERAH', 'Contoh pola umum.'],
  ['YA', '', 'PEMERINTAH PROVINSI', 'PEMERINTAH DAERAH', 'Contoh pola umum.']
];

function doGet(e) {
  e = e || {};
  const p = e.parameter || {};
  const action = String(p.action || '').trim();

  try {
    if (action === 'setup') {
      setupSheets_();
      return json_({ ok: true, message: 'Setup selesai. Sheet KUNJUNGAN dan NETWORK_PEMERINTAH siap.' });
    }

    if (action === 'logVisit') {
      return json_(logVisit_(p));
    }

    if (action === 'listVisits') {
      requireDashboardToken_(p.token);
      const limit = Math.min(Math.max(Number(p.limit || 500), 1), 5000);
      return json_({ ok: true, data: getVisits_(limit) });
    }

    if (action === 'networks') {
      requireDashboardToken_(p.token);
      return json_({ ok: true, data: getNetworks_() });
    }

    if (action === 'ping') {
      return json_({ ok: true, time: new Date().toISOString() });
    }

    return json_({
      ok: false,
      error: 'Action tidak dikenal.',
      actions: ['setup', 'logVisit', 'listVisits', 'networks', 'ping']
    });
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message || err) });
  }
}

function doPost(e) {
  // Mendukung POST sederhana bila tracker/browser berubah di kemudian hari.
  return doGet(e);
}

function requireDashboardToken_(token) {
  if (!token || String(token) !== DASHBOARD_TOKEN) {
    throw new Error('Akses dashboard ditolak. Token dashboard tidak valid.');
  }
}

function setupSheets_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  let visitSheet = ss.getSheetByName(VISITS_SHEET);
  if (!visitSheet) visitSheet = ss.insertSheet(VISITS_SHEET);

  // Pastikan header ada walaupun sheet sebelumnya hanya berisi Sheet1/kosong.
  if (visitSheet.getLastRow() === 0) {
    visitSheet.getRange(1, 1, 1, VISIT_HEADERS.length).setValues([VISIT_HEADERS]);
  } else {
    const current = visitSheet.getRange(1, 1, 1, VISIT_HEADERS.length).getValues()[0];
    const mismatch = VISIT_HEADERS.some((h, i) => String(current[i] || '').trim() !== h);
    if (mismatch) visitSheet.getRange(1, 1, 1, VISIT_HEADERS.length).setValues([VISIT_HEADERS]);
  }
  visitSheet.setFrozenRows(1);
  visitSheet.getRange(1, 1, 1, VISIT_HEADERS.length).setFontWeight('bold');
  visitSheet.autoResizeColumns(1, VISIT_HEADERS.length);

  let networkSheet = ss.getSheetByName(NETWORK_SHEET);
  if (!networkSheet) networkSheet = ss.insertSheet(NETWORK_SHEET);

  if (networkSheet.getLastRow() === 0) {
    networkSheet.getRange(1, 1, 1, NETWORK_HEADERS.length).setValues([NETWORK_HEADERS]);
    networkSheet.getRange(2, 1, DEFAULT_GOV_NETWORKS.length, NETWORK_HEADERS.length)
      .setValues(DEFAULT_GOV_NETWORKS);
  } else {
    const currentN = networkSheet.getRange(1, 1, 1, NETWORK_HEADERS.length).getValues()[0];
    const mismatchN = NETWORK_HEADERS.some((h, i) => String(currentN[i] || '').trim() !== h);
    if (mismatchN) networkSheet.getRange(1, 1, 1, NETWORK_HEADERS.length).setValues([NETWORK_HEADERS]);
  }
  networkSheet.setFrozenRows(1);
  networkSheet.getRange(1, 1, 1, NETWORK_HEADERS.length).setFontWeight('bold');
  networkSheet.autoResizeColumns(1, NETWORK_HEADERS.length);

  return true;
}

function logVisit_(p) {
  setupSheets_();

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const data = normalizeVisit_(p);
    const network = classifyNetwork_(data.asn, data.organization, data.isp);

    data.networkLabel = network.label;
    data.govFlag = network.isGovernment ? 'YA' : 'TIDAK';

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(VISITS_SHEET);

    sh.appendRow([
      new Date(),
      data.ip,
      data.country,
      data.region,
      data.city,
      data.isp,
      data.organization,
      data.asn,
      data.networkLabel,
      data.govFlag,
      data.device,
      data.browser,
      data.os,
      data.page,
      data.referrer,
      data.sessionId,
      data.userAgent
    ]);

    return {
      ok: true,
      networkLabel: data.networkLabel,
      govFlag: data.govFlag
    };
  } finally {
    lock.releaseLock();
  }
}

function normalizeVisit_(p) {
  return {
    ip: clean_(p.ip, 80),
    country: clean_(p.country, 100),
    region: clean_(p.region, 100),
    city: clean_(p.city, 100),
    isp: clean_(p.isp, 160),
    organization: clean_(p.organization, 160),
    asn: clean_(p.asn, 80),
    device: clean_(p.device, 80),
    browser: clean_(p.browser, 80),
    os: clean_(p.os, 80),
    page: clean_(p.page, 300),
    referrer: clean_(p.referrer, 500),
    sessionId: clean_(p.sessionId, 120),
    userAgent: clean_(p.userAgent, 700)
  };
}

function getVisits_(limit) {
  setupSheets_();

  const sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(VISITS_SHEET);
  const lastRow = sh.getLastRow();
  if (lastRow < 2) return [];

  const startRow = Math.max(2, lastRow - limit + 1);
  const values = sh.getRange(startRow, 1, lastRow - startRow + 1, VISIT_HEADERS.length).getValues();

  return values.reverse().map(function(row) {
    return {
      time: formatDate_(row[0]),
      timestamp: row[0] instanceof Date ? row[0].getTime() : null,
      ip: row[1],
      country: row[2],
      region: row[3],
      city: row[4],
      isp: row[5],
      organization: row[6],
      asn: row[7],
      networkLabel: row[8],
      govFlag: row[9],
      device: row[10],
      browser: row[11],
      os: row[12],
      page: row[13],
      referrer: row[14],
      sessionId: row[15]
    };
  });
}

function getNetworks_() {
  setupSheets_();

  const sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(NETWORK_SHEET);
  const lastRow = sh.getLastRow();
  if (lastRow < 2) return [];

  return sh.getRange(2, 1, lastRow - 1, NETWORK_HEADERS.length).getValues()
    .map(function(r) {
      return {
        active: String(r[0] || '').toUpperCase() === 'YA',
        asn: String(r[1] || ''),
        pattern: String(r[2] || ''),
        label: String(r[3] || ''),
        note: String(r[4] || '')
      };
    });
}

function classifyNetwork_(asn, organization, isp) {
  const rows = getNetworks_();
  const a = String(asn || '').trim().toUpperCase();
  const org = String(organization || '').trim().toLowerCase();
  const i = String(isp || '').trim().toLowerCase();

  for (var n = 0; n < rows.length; n++) {
    const r = rows[n];
    if (!r.active) continue;

    const asnMatch = r.asn && a && a === r.asn.trim().toUpperCase();
    const pattern = r.pattern.trim().toLowerCase();
    const patternMatch = pattern && (org.indexOf(pattern) !== -1 || i.indexOf(pattern) !== -1);

    if (asnMatch || patternMatch) {
      return {
        isGovernment: true,
        label: r.label || 'JARINGAN PEMERINTAH'
      };
    }
  }

  return {
    isGovernment: false,
    label: organization || isp || 'Tidak diketahui'
  };
}

function clean_(value, maxLen) {
  let s = String(value == null ? '' : value);
  s = s.replace(/[\r\n\t]+/g, ' ').trim();
  return s.length > maxLen ? s.slice(0, maxLen) : s;
}

function formatDate_(d) {
  if (!(d instanceof Date)) return String(d || '');
  return Utilities.formatDate(
    d,
    Session.getScriptTimeZone() || 'Asia/Jakarta',
    'dd-MM-yyyy HH:mm:ss'
  );
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

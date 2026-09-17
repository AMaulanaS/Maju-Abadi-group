/* ==========================================================
   MAJU ABADI GROUP - TRACKER KUNJUNGAN WEBSITE
   FIX OTOMATIS

   Pasang pada halaman publik:
   <script src="/kunjungan.js"></script>

   Tracker ini TIDAK membutuhkan token dashboard.
   Token hanya dipakai oleh halaman monitoring.
   ========================================================== */

(() => {
  'use strict';

  const TRACK_API = 'https://script.google.com/macros/s/AKfycby7rswCTA--Cu2uaTN0X0T-S5C3YIl_6R5F0F7v0HVtjGhlnwQ29QfvTES1v46DZY0l/exec';
  const SESSION_KEY = 'ma_visit_session_v2';
  const SENT_KEY = 'ma_visit_last_sent_v2';

  function sessionId() {
    try {
      let id = localStorage.getItem(SESSION_KEY);
      if (!id) {
        id = 'VIS-' + Date.now().toString(36).toUpperCase() + '-' +
          Math.random().toString(36).slice(2, 8).toUpperCase();
        localStorage.setItem(SESSION_KEY, id);
      }
      return id;
    } catch (_) {
      return 'VIS-' + Date.now().toString(36).toUpperCase() + '-' +
        Math.random().toString(36).slice(2, 8).toUpperCase();
    }
  }

  function detectDevice(ua) {
    if (/tablet|ipad/i.test(ua)) return 'Tablet';
    if (/mobile|android|iphone|ipod/i.test(ua)) return 'Android/iPhone';
    return 'Windows/Mac/Linux PC';
  }

  function detectBrowser(ua) {
    if (/Edg\//i.test(ua)) return 'Edge';
    if (/OPR\//i.test(ua)) return 'Opera';
    if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) return 'Chrome';
    if (/Firefox\//i.test(ua)) return 'Firefox';
    if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) return 'Safari';
    return 'Browser lain';
  }

  function detectOS(ua) {
    if (/Windows NT 10/i.test(ua)) return 'Windows 10/11';
    if (/Windows NT 6\.1/i.test(ua)) return 'Windows 7';
    if (/Android/i.test(ua)) {
      const m = ua.match(/Android\s([\d.]+)/i);
      return m ? 'Android ' + m[1] : 'Android';
    }
    if (/iPhone|iPad/i.test(ua)) return 'iOS';
    if (/Mac OS X/i.test(ua)) return 'macOS';
    if (/Linux/i.test(ua)) return 'Linux';
    return 'OS tidak diketahui';
  }

  async function getNetworkInfo() {
    const fallback = { ip:'', country:'', region:'', city:'', isp:'', organization:'', asn:'' };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const res = await fetch('https://ipwho.is/', { cache:'no-store', signal:controller.signal });
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error('IP API HTTP ' + res.status);
      const d = await res.json();
      if (!d || d.success === false) throw new Error('IP API gagal');
      return {
        ip: d.ip || '',
        country: d.country || '',
        region: d.region || '',
        city: d.city || '',
        isp: d.connection?.isp || '',
        organization: d.connection?.org || '',
        asn: d.connection?.asn ? 'AS' + d.connection.asn : ''
      };
    } catch (_) {
      return fallback;
    }
  }

  function alreadySent() {
    try {
      const key = location.href;
      return sessionStorage.getItem(SENT_KEY) === key;
    } catch (_) {
      return false;
    }
  }

  function markSent() {
    try { sessionStorage.setItem(SENT_KEY, location.href); } catch (_) {}
  }

  async function send(payload) {
    const query = new URLSearchParams({ action:'logVisit', ...payload });
    try {
      const res = await fetch(TRACK_API + '?' + query.toString(), {
        method:'GET',
        mode:'cors',
        cache:'no-store',
        keepalive:true
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      if (!data || data.ok !== true) throw new Error((data && data.error) || 'Server menolak data');
      return true;
    } catch (_) {
      return false;
    }
  }

  async function track() {
    if (alreadySent()) return;

    const ua = navigator.userAgent || '';
    const network = await getNetworkInfo();

    const payload = {
      ...network,
      device: detectDevice(ua),
      browser: detectBrowser(ua),
      os: detectOS(ua),
      page: location.pathname + location.search,
      referrer: document.referrer || '',
      sessionId: sessionId(),
      userAgent: ua
    };

    const success = await send(payload);
    if (success) markSent();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', track, { once:true });
  } else {
    track();
  }
})();

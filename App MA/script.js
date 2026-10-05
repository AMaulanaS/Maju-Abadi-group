"use strict";

/* ---------- Konfigurasi ---------- */
const MA_DEFAULT = "gudang";

/* ---------- DATA (href asli dipertahankan) ---------- */
const MA_DIVISIONS = {
  gudang: {
    label: "Pergudangan", icon: "bi-box-seam",
    title: "Gudang & Peralatan",
    desc: "Pantau persediaan, alat kerja, dan aktivitas gudang.",
    cards: [
      { icon: "bi-box-seam",   title: "Master Barang",   desc: "Material, satuan, kategori, dan stok minimum.", href: "Pergudangan/Produk Persediaan Proyek/index.html", active: true },
      { icon: "bi-tools",      title: "Peminjaman Alat", desc: "Peminjaman, pengembalian, kondisi, dan riwayat.", href: "Pergudangan/Peminjaman Alat/index.html", active: true },
      { icon: "bi-truck",      title: "Surat Jalan",     desc: "Buat dan pantau dokumen pengiriman barang.", href: "Pergudangan/Surat Jalan/index.html", active: true },
      { icon: "bi-cart-check", title: "Pembelian",       desc: "Price Order dan administrasi pembelian barang.", href: "Pergudangan/Pembelian/index.html", active: true }
    ]
  },
  generalaffair: {
    label: "General Affair", icon: "bi-buildings",
    title: "General Affair",
    desc: "Pantau persediaan alat inventaris dan kebutuhan operasional.",
    cards: [
      { icon: "bi-clipboard-data", title: "Inventaris", desc: "Identitas alat, nomor seri, kondisi, dan status.", href: "General Affair/Alat Inventaris/index.html", active: true },
      { icon: "bi-car-front",      title: "Transport",  desc: "Perpanjangan: Pajak, KIR dan Service.", href: "General Affair/Transport/index.html", active: true },
      { icon: "bi-patch-check",    title: "Legalitas",  desc: "Perpanjangan Serkom, SBU.", href: "General Affair/Legalitas/index.html", active: true }
    ]
  },
  surat: {
    label: "Surat & Admin", icon: "bi-envelope-paper",
    title: "Surat & Administrasi",
    desc: "Kelola surat, tamu, dokumen, dan arsip perusahaan.",
    cards: [
      { icon: "bi-journal-text", title: "Buku Nomor Surat", desc: "Pencatatan dan pengelolaan nomor surat.", href: "Surat & Administrasi/Buku Nomor Surat/index.html", active: true },
      { icon: "bi-people",       title: "Buku Tamu",        desc: "Pencatatan kunjungan tamu dan kebutuhan administrasi.", href: "Surat & Administrasi/Buku Tamu/index.html", active: true }
    ]
  },
  keuangan: {
    label: "Keuangan", icon: "bi-bank",
    title: "Keuangan",
    desc: "Kelola transaksi, tagihan, kas, dan administrasi keuangan perusahaan.",
    cards: [
      { icon: "bi-kanban",           title: "Rekapitulasi Proyek", desc: "Tracking Pekerjaan Proyek Yang Berjalan.", href: "Keuangan/Rekapitulasi Proyek/index.html", active: true },
      { icon: "bi-receipt",          title: "Invoice",         desc: "Kelola invoice dan tagihan perusahaan.", href: "#", active: false },
      { icon: "bi-cash-coin",        title: "Pengeluaran",     desc: "Catat dan pantau pengeluaran perusahaan.", href: "#", active: false },
      { icon: "bi-cash-stack",       title: "Penerimaan",      desc: "Catat penerimaan pembayaran dari pelanggan.", href: "#", active: false },
      { icon: "bi-journal-bookmark", title: "Jurnal Keuangan", desc: "Pencatatan transaksi dan jurnal perusahaan.", href: "#", active: false },
      { icon: "bi-graph-up",         title: "Rekap Keuangan",  desc: "Ringkasan kondisi keuangan perusahaan.", href: "#", active: false }
    ]
  },
  sdm: {
    label: "SDM", icon: "bi-people",
    title: "Sumber Daya Manusia",
    desc: "Kelola data, kehadiran, cuti, dan administrasi karyawan.",
    cards: [
      { icon: "bi-person-vcard",    title: "Data Karyawan",    desc: "Database karyawan perusahaan.", href: "#", active: false },
      { icon: "bi-clock-history",   title: "Absensi",          desc: "Pencatatan kehadiran karyawan.", href: "#", active: false },
      { icon: "bi-calendar2-check", title: "Cuti & Izin",      desc: "Kelola pengajuan cuti dan izin.", href: "#", active: false },
      { icon: "bi-briefcase",       title: "Kontrak Kerja",    desc: "Kelola data kontrak dan masa kerja karyawan.", href: "#", active: false },
      { icon: "bi-wallet2",         title: "Penggajian",       desc: "Administrasi gaji dan tunjangan karyawan.", href: "#", active: false },
      { icon: "bi-folder2-open",    title: "Dokumen Karyawan", desc: "Pusat dokumen administrasi karyawan.", href: "#", active: false }
    ]
  },
  proyek: {
    label: "Proyek", icon: "bi-kanban",
    title: "Proyek & Operasional",
    desc: "Pantau proyek, pekerjaan lapangan, dan aktivitas operasional.",
    cards: [
     // { icon: "bi-kanban",         title: "Daftar Proyek",      desc: "Data dan informasi seluruh proyek.", href: "Proyek & Operasional/Daftar Proyek/index.html", active: true },
      { icon: "bi-graph-up-arrow", title: "Progress Proyek",    desc: "Pantau perkembangan pekerjaan.", href: "Proyek & Operasional/Progress Proyek/index.html", active: true },
     // { icon: "bi-hammer",         title: "Pekerjaan Lapangan", desc: "Kelola aktivitas dan pekerjaan lapangan.", href: "Proyek & Operasional/Pekerjaan Lapangan/index.html", active: true },
     // { icon: "bi-people",         title: "Tim Lapangan",       desc: "Data personel dan penugasan lapangan.", href: "Proyek & Operasional/Tim Lapangan/index.html", active: true },
     // { icon: "bi-calendar-week",  title: "Jadwal Pekerjaan",   desc: "Atur jadwal dan agenda pekerjaan.", href: "Proyek & Operasional/Jadwal Pekerjaan/index.html", active: true },
     // { icon: "bi-camera",         title: "Dokumentasi Proyek", desc: "Simpan dokumentasi kegiatan dan progress pekerjaan.", href: "Proyek & Operasional/Dokumentasi Proyek/index.html", active: true }
    ]
  },
  laporan: {
    label: "Laporan", icon: "bi-bar-chart-line",
    title: "Laporan",
    desc: "Pantau kondisi perusahaan melalui laporan terintegrasi.",
    cards: [
      { icon: "bi-speedometer2",      title: "Dashboard Manajemen", desc: "Ringkasan kondisi perusahaan.", href: "#", active: false },
      { icon: "bi-cash-coin",         title: "Laporan Keuangan",    desc: "Laporan transaksi dan keuangan.", href: "#", active: false },
      { icon: "bi-box-seam",          title: "Laporan Gudang",      desc: "Laporan persediaan dan aktivitas gudang.", href: "#", active: false },
      { icon: "bi-people",            title: "Laporan SDM",         desc: "Ringkasan data dan aktivitas karyawan.", href: "#", active: false },
      { icon: "bi-building",          title: "Laporan Proyek",      desc: "Ringkasan progress dan pekerjaan proyek.", href: "#", active: false },
      { icon: "bi-file-earmark-text", title: "Laporan Operasional", desc: "Laporan kegiatan operasional perusahaan.", href: "#", active: false }
    ]
  }
};

/* ---------- Cache elemen ---------- */
const el = {
  nav: document.getElementById("divisionNav"),
  content: document.getElementById("divisionContent"),
  search: document.getElementById("searchInput"),
  launcherBody: document.getElementById("launcherBody"),
  launcherCanvas: document.getElementById("launcherCanvas"),
  toast: document.getElementById("comingSoonToast"),
  toastMsg: document.getElementById("toastMsg")
};

let maActiveKey = null;

/* ---------- Helper ikon ---------- */
function maTileIcon(icon) {
  if (!icon) return '<i class="bi bi-grid-fill"></i>';
  return icon.startsWith("bi-")
    ? '<i class="bi ' + icon + '"></i>'
    : '<span aria-hidden="true">' + icon + "</span>";
}

/* ---------- Render kartu modul ---------- */
function maCardHTML(card, i) {
  const searchable = (card.title + " " + card.desc).toLowerCase();

  const footer = card.active
    ? '<a class="ma-btn" href="' + card.href + '">Buka Modul <i class="bi bi-arrow-right-short"></i></a>' +
      '<span class="ma-badge"><i class="bi bi-check2-circle"></i>Aktif</span>'
    : '<button type="button" class="ma-btn ghost" data-coming-soon="' + card.title + '">' +
      '<i class="bi bi-hourglass-split"></i> Segera Hadir</button>' +
      '<span class="ma-badge warn"><i class="bi bi-hourglass-split"></i>Segera</span>';

  return (
    '<article class="ma-card" style="--i:' + i + '" data-search="' + searchable + '">' +
      '<div class="ma-card-icon">' + maTileIcon(card.icon) + "</div>" +
      "<h5>" + card.title + "</h5>" +
      "<p>" + card.desc + "</p>" +
      '<div class="ma-card-foot">' + footer + "</div>" +
    "</article>"
  );
}

/* ---------- Render navigasi divisi ---------- */
function maRenderNav() {
  el.nav.innerHTML = Object.entries(MA_DIVISIONS)
    .map(function (entry) {
      const key = entry[0], d = entry[1];
      return (
        '<button type="button" class="ma-tab" role="tab" aria-selected="false" data-division="' + key + '">' +
          '<i class="bi ' + d.icon + '"></i><span>' + d.label + "</span>" +
          '<em class="ma-tab-count">' + d.cards.length + "</em>" +
        "</button>"
      );
    })
    .join("");
}

/* ---------- Fungsi utama: tampilkan divisi ---------- */
function maShowDivision(key) {
  const d = MA_DIVISIONS[key];
  if (!d) return;
  maActiveKey = key;

  el.nav.querySelectorAll(".ma-tab").forEach(function (btn) {
    const active = btn.dataset.division === key;
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-selected", String(active));
  });
  const act = el.nav.querySelector(".ma-tab.active");
  if (act) act.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });

  const total = d.cards.length;
  const siap = d.cards.filter(function (c) { return c.active; }).length;

  el.content.innerHTML =
    '<header class="ma-division-head">' +
      '<span class="ma-eyebrow">' + d.label + "</span>" +
      "<h2>" + d.title + "</h2>" +
      "<p>" + d.desc + "</p>" +
      '<div class="ma-division-meta">' +
        '<span><i class="bi bi-grid me-1"></i>' + total + " modul</span>" +
        '<span class="dot"></span>' +
        '<span><i class="bi bi-check2-circle me-1"></i>' + siap + " siap digunakan</span>" +
      "</div>" +
    "</header>" +
    '<div class="ma-grid" id="moduleGrid">' + d.cards.map(maCardHTML).join("") + "</div>" +
    '<div class="ma-empty d-none" id="emptyState" role="status">' +
      '<div class="big"><i class="bi bi-search"></i></div>' +
      '<p class="mt-2 mb-3">Tidak ada modul yang cocok dengan pencarian "<b id="emptyQuery"></b>".</p>' +
      '<button type="button" class="ma-btn ghost" id="clearSearchBtn"><i class="bi bi-x-lg"></i> Bersihkan pencarian</button>' +
    "</div>";

  el.search.value = "";
  localStorage.setItem("ma.division", key);
  history.replaceState(null, "", "#" + key);
}

/* ---------- Toast ---------- */
function maComingSoon(title) {
  el.toastMsg.textContent = '"' + title + '" akan tersedia pada tahap pengembangan berikutnya.';

  const bar = el.toast.querySelector(".ma-toast-progress");
  bar.classList.remove("run");
  void bar.offsetWidth;
  bar.classList.add("run");

  bootstrap.Toast.getOrCreateInstance(el.toast).show();
}

/* ---------- Pencarian ---------- */
function maHandleSearch() {
  const grid = document.getElementById("moduleGrid");
  const empty = document.getElementById("emptyState");
  if (!grid || !empty) return;

  const q = el.search.value.trim().toLowerCase();
  let visible = 0;

  grid.querySelectorAll(".ma-card").forEach(function (card) {
    const match = !q || (card.dataset.search || "").includes(q);
    card.classList.toggle("is-hidden", !match);
    if (match) visible++;
  });

  const kosong = visible === 0;
  empty.classList.toggle("d-none", !kosong);
  grid.classList.toggle("d-none", kosong);
  if (kosong) document.getElementById("emptyQuery").textContent = el.search.value.trim();
}

/* ---------- Tema ---------- */
function maApplyTheme(theme) {
  document.documentElement.setAttribute("data-bs-theme", theme);
  localStorage.setItem("ma.theme", theme);
  document.getElementById("themeIcon").className =
    theme === "dark" ? "bi bi-sun" : "bi bi-moon-stars";
}

/* ---------- Launcher ---------- */
function maRenderLauncher() {
  el.launcherBody.innerHTML = Object.entries(MA_DIVISIONS)
    .map(function (entry) {
      const d = entry[1];
      return (
        '<section class="ma-app-group">' +
          "<h6><i class=\"bi " + d.icon + ' me-1"></i>' + d.label + "</h6>" +
          d.cards.map(function (c) {
            return c.active
              ? '<a class="ma-app-chip" href="' + c.href + '">' +
                  '<span class="tile">' + maTileIcon(c.icon) + "</span>" +
                  "<span>" + c.title + '</span><span class="dot-status ok"></span></a>'
              : '<button type="button" class="ma-app-chip soon" data-module="' + c.title + '">' +
                  '<span class="tile">' + maTileIcon(c.icon) + "</span>" +
                  "<span>" + c.title + '</span><span class="dot-status wait"></span></button>';
          }).join("") +
        "</section>"
      );
    })
    .join("");
}

/* ---------- Hero ---------- */
function maRenderHero() {
  const h = new Date().getHours();
  const waktu = h < 11 ? "pagi" : h < 15 ? "siang" : h < 19 ? "sore" : "malam";
  document.getElementById("greetEyebrow").textContent = "Selamat " + waktu + ", Admin MA";
  document.getElementById("heroDate").textContent = new Intl.DateTimeFormat("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  }).format(new Date());

  let all = [];
  Object.values(MA_DIVISIONS).forEach(function (d) { all = all.concat(d.cards); });
  document.getElementById("statTotal").textContent = all.length;
  document.getElementById("statActive").textContent = all.filter(function (c) { return c.active; }).length;
  document.getElementById("statDiv").textContent = Object.keys(MA_DIVISIONS).length;
}

/* ---------- Inisialisasi ---------- */
document.addEventListener("DOMContentLoaded", function () {
  maApplyTheme(
    localStorage.getItem("ma.theme") ||
    (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
  );

  maRenderHero();
  maRenderNav();
  maRenderLauncher();

  const hash = location.hash.slice(1);
  const saved = localStorage.getItem("ma.division");
  maShowDivision(MA_DIVISIONS[hash] ? hash : (MA_DIVISIONS[saved] ? saved : MA_DEFAULT));

  /* Klik tab divisi */
  el.nav.addEventListener("click", function (e) {
    const btn = e.target.closest(".ma-tab");
    if (btn) maShowDivision(btn.dataset.division);
  });

  /* Klik di area konten */
  el.content.addEventListener("click", function (e) {
    const soon = e.target.closest("[data-coming-soon]");
    if (soon) { maComingSoon(soon.dataset.comingSoon); return; }

    if (e.target.closest("#clearSearchBtn")) {
      el.search.value = ""; maHandleSearch(); el.search.focus(); return;
    }
    const dead = e.target.closest('a.ma-btn[href="#"]');
    if (dead) { e.preventDefault(); maComingSoon("Modul ini"); }
  });

  /* Tombol [data-soon] (menu avatar dll.) */
  document.addEventListener("click", function (e) {
    const item = e.target.closest("[data-soon]");
    if (item) { e.preventDefault(); maComingSoon(item.dataset.soon); }
  });

  /* Pencarian */
  el.search.addEventListener("input", maHandleSearch);
  el.search.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { el.search.value = ""; maHandleSearch(); el.search.blur(); }
  });

  /* Shortcut "/" fokus pencarian */
  document.addEventListener("keydown", function (e) {
    const tag = document.activeElement ? document.activeElement.tagName : "";
    if (/^(input|textarea|select)$/i.test(tag)) return;
    if (e.key === "/" || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k")) {
      e.preventDefault(); el.search.focus();
    }
  });

  /* Launcher */
  el.launcherBody.addEventListener("click", function (e) {
    if (e.target.closest("a.ma-app-chip")) {
      const oc = bootstrap.Offcanvas.getInstance(el.launcherCanvas);
      if (oc) oc.hide();
      return;
    }
    const soon = e.target.closest("button.ma-app-chip.soon");
    if (soon) maComingSoon(soon.dataset.module);
  });

  /* Notifikasi */
  document.getElementById("markReadBtn").addEventListener("click", function () {
    document.getElementById("notifDot").classList.add("d-none");
  });

  /* Toggle tema */
  document.getElementById("themeToggle").addEventListener("click", function () {
    const cur = document.documentElement.getAttribute("data-bs-theme");
    maApplyTheme(cur === "dark" ? "light" : "dark");
  });

  /* Logo → beranda */
  document.getElementById("brandLink").addEventListener("click", function (e) {
    e.preventDefault();
    maShowDivision(MA_DEFAULT);
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  /* Tombol back/forward browser */
  window.addEventListener("hashchange", function () {
    const key = location.hash.slice(1);
    if (MA_DIVISIONS[key] && key !== maActiveKey) maShowDivision(key);
  });
});

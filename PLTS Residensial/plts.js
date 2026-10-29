/* PLTS Residensial — semua harga & spesifikasi ada di objek REGIONS di bawah.
   Untuk ubah harga/teks cukup edit di sini, tidak perlu menyentuh HTML. */
(function () {
  'use strict';

  var WA_1 = '628995761175'; // MA Ghofur, +62 899-5761-175 (tujuan tombol per paket)
  var WA_2 = '6285100511753'; // Admin Maju Abadi, +62 851-0051-1753
  var BONUS = 'Mounting, wiring, grounding, aksesoris & jasa pasang';

  var SPECS = [
    { kwp: '2,2', panel: '4 unit Lesso 550Wp',  inverter: 'Deye 3,6 kW', baterai: 'Daya 5 kWh LiFePO4' },
    { kwp: '3',   panel: '6 unit Lesso 550Wp',  inverter: 'Deye 5 kW',   baterai: 'Daya 10 kWh LiFePO4' },
    { kwp: '5',   panel: '10 unit Lesso 550Wp', inverter: 'Deye 5 kW',   baterai: 'Daya 10 kWh LiFePO4' },
    { kwp: '6',   panel: '12 unit Lesso 550Wp', inverter: 'Deye 6 kW',   baterai: 'Daya 16 kWh LiFePO4' }
  ];

  var REGIONS = {
    semarang: {
      name: 'Semarang & Sekitarnya',
      headline: 'Pangkas tagihan PLN dan punya cadangan listrik sendiri saat padam',
      areas: 'Melayani konsultasi dan survey lokasi di Semarang, Kendal, Demak, Ungaran, dan sekitarnya.',
      badge: 'Termasuk PPN 11%',
      priceNote: 'Inc. PPN',
      editions: ['Standard Residensial', 'Paling diminati rumah tangga', 'Daya ekstra', 'Performa maksimal'],
      flag: 'Favorit rumah',
      prices: [55000000, 75000000, 83000000, 95000000],
      note: '<strong>Catatan:</strong> Harga paket sudah termasuk PPN 11% dan jasa pemasangan untuk area Semarang &amp; sekitarnya (Kendal, Demak, Ungaran, Salatiga). Untuk pengiriman di luar Jawa atau luar kota, dikenakan biaya ongkir dan akomodasi teknisi.',
      perks: ['Solar panel Lesso Tier-1', 'Smart inverter Deye', 'Pemasangan rapi & aman', 'Layanan wilayah Semarang & sekitarnya'],
      brosur: 'PLTS Residensial/Brosur/brosur-plts-semarang.jpg'
    },
    kalimantan: {
      name: 'Kalimantan',
      headline: 'Bebas mati lampu dan hemat listrik PLN, harga all-in siap pasang di rumah Anda',
      areas: 'Melayani Balikpapan, Samarinda, Banjarmasin, Pontianak, Palangkaraya, dan sekitarnya.',
      badge: 'All-in: PPN, ongkir & teknisi',
      priceNote: 'All-in',
      editions: ['Kalimantan Edition', 'Paling diminati di Kalimantan', 'Daya ekstra', 'Performa maksimal'],
      flag: 'Favorit Kalimantan',
      prices: [68000000, 90000000, 98000000, 112000000],
      note: '<strong>Catatan paket Kalimantan:</strong> Harga di atas bersifat all-in, sudah termasuk PPN 11%, biaya kargo laut, packing kayu, asuransi pengiriman ke Kalimantan, serta akomodasi dan jasa pemasangan oleh tim teknisi.',
      perks: ['Solar panel Lesso Tier-1', 'Smart inverter Deye', 'Termasuk kargo laut & asuransi', 'Layanan seluruh Kalimantan'],
      brosur: 'PLTS Residensial/Brosur/brosur-plts-kalimantan.jpg'
    },
    papua: {
      name: 'Papua',
      headline: 'Listrik mandiri 24 jam tanpa gangguan, harga all-in sudah termasuk pengiriman & teknisi',
      areas: 'Melayani Jayapura, Sorong, Manokwari, Timika, Merauke, dan sekitarnya.',
      badge: 'All-in: PPN, ongkir & teknisi',
      priceNote: 'All-in',
      editions: ['Papua Edition', 'Paling diminati di Papua', 'Daya ekstra', 'Performa maksimal'],
      flag: 'Favorit Papua',
      prices: [82000000, 103000000, 115000000, 128000000],
      note: '<strong>Catatan paket Papua:</strong> Harga di atas bersifat all-in, sudah termasuk PPN 11%, kargo laut ke pelabuhan utama, packing kayu, asuransi, tiket dan akomodasi teknisi, serta pemasangan. Wilayah pedalaman atau yang hanya terjangkau penerbangan perintis disesuaikan.',
      perks: ['Solar panel Lesso Tier-1', 'Smart inverter Deye', 'Termasuk kargo laut & asuransi', 'Layanan seluruh kota di Papua'],
      brosur: 'PLTS Residensial/Brosur/brosur-plts-papua.jpg'
    }
  };

  var order = ['semarang', 'kalimantan', 'papua'];
  var panel = document.getElementById('pltsPanel');
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.plts-tab'));
  var dialog = document.getElementById('pltsDialog');
  if (!panel || !tabs.length) return;

  var current = 'semarang';

  function rupiah(n) {
    return 'Rp ' + n.toLocaleString('id-ID');
  }

  function waLink(region, spec, price) {
    var text = 'Halo Maju Abadi Energi, saya tertarik dengan Paket PLTS Hybrid ' + spec.kwp +
      ' kWp untuk area ' + region.name + ' (' + rupiah(price) + '). Mohon info lebih lanjut.';
    return 'https://wa.me/' + WA_1 + '?text=' + encodeURIComponent(text);
  }

  function card(region, spec, i) {
    var featured = i === 1;
    var max = i === 3;
    var flag = featured ? '<span class="plts-flag">' + region.flag + '</span>'
             : max ? '<span class="plts-flag is-max">Kapasitas maksimal</span>' : '';
    return '' +
      '<article class="plts-card' + (featured ? ' is-featured' : '') + '">' + flag +
        '<div class="plts-kwp">' + spec.kwp + '<small>kWp</small></div>' +
        '<p class="plts-edition">' + region.editions[i] + '</p>' +
        '<div class="plts-price"><strong>' + rupiah(region.prices[i]) + '</strong><span>' + region.priceNote + '</span></div>' +
        '<ul class="plts-specs">' +
          '<li><b>Panel surya</b>' + spec.panel + '</li>' +
          '<li><b>Inverter hybrid</b>' + spec.inverter + '</li>' +
          '<li><b>Baterai</b>' + spec.baterai + '</li>' +
          '<li><b>Sudah termasuk</b>' + BONUS + '</li>' +
        '</ul>' +
        '<a class="plts-wa" href="' + waLink(region, spec, region.prices[i]) + '" target="_blank" rel="noopener">Tanya paket ini via WhatsApp</a>' +
      '</article>';
  }

  function render(key) {
    var r = REGIONS[key];
    current = key;
    panel.setAttribute('aria-labelledby', 'pltsTab-' + key);
    panel.innerHTML = '' +
      '<div class="plts-region-head">' +
        '<div><h3>' + r.headline + '</h3><p>' + r.areas + '</p></div>' +
        '<span class="plts-region-badge">' + r.badge + '</span>' +
      '</div>' +
      '<div class="plts-grid">' + SPECS.map(function (s, i) { return card(r, s, i); }).join('') + '</div>' +
      '<div class="plts-notes">' +
        '<p class="plts-note">' + r.note + '</p>' +
        '<ul class="plts-perks">' + r.perks.map(function (p) { return '<li>' + p + '</li>'; }).join('') + '</ul>' +
      '</div>' +
      '<div class="plts-footbar">' +
        '<div><h3>Konsultasi &amp; pemesanan area ' + r.name + '</h3><p>Lihat brosur lengkap, atau langsung hubungi tim kami.</p></div>' +
        '<div class="plts-footbar-actions">' +
          '<button type="button" class="plts-link" data-open-brosur>Lihat brosur</button>' +
          '<a class="plts-link is-wa" href="https://wa.me/' + WA_1 + '" target="_blank" rel="noopener">WA MA Ghofur · +62 899-5761-175</a>' +
          '<a class="plts-link is-wa" href="https://wa.me/' + WA_2 + '" target="_blank" rel="noopener">WA Admin Maju Abadi · +62 851-0051-1753</a>' +
        '</div>' +
      '</div>';
  }

  function select(key, focus) {
    tabs.forEach(function (t) {
      var on = t.dataset.region === key;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      if (on && focus) t.focus();
    });
    render(key);
  }

  tabs.forEach(function (t) {
    t.addEventListener('click', function () { select(t.dataset.region, false); });
    t.addEventListener('keydown', function (e) {
      var i = order.indexOf(t.dataset.region);
      if (e.key === 'ArrowRight') { e.preventDefault(); select(order[(i + 1) % order.length], true); }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); select(order[(i + order.length - 1) % order.length], true); }
    });
  });

  // Dialog brosur
  if (dialog && typeof dialog.showModal === 'function') {
    var img = document.getElementById('pltsDialogImg');
    var title = document.getElementById('pltsDialogTitle');
    var dl = document.getElementById('pltsDialogDownload');

    panel.addEventListener('click', function (e) {
      if (!e.target.closest('[data-open-brosur]')) return;
      var r = REGIONS[current];
      img.src = r.brosur;
      img.alt = 'Brosur PLTS residensial ' + r.name;
      title.textContent = 'Brosur PLTS ' + r.name;
      dl.href = r.brosur;
      dl.setAttribute('download', 'Brosur-PLTS-' + current + '.jpg');
      dialog.showModal();
    });
    dialog.querySelector('.plts-dialog-close').addEventListener('click', function () { dialog.close(); });
    dialog.addEventListener('click', function (e) { if (e.target === dialog) dialog.close(); });
  } else {
    // Browser lama tanpa <dialog>: buka gambar di tab baru
    panel.addEventListener('click', function (e) {
      if (e.target.closest('[data-open-brosur]')) window.open(REGIONS[current].brosur, '_blank', 'noopener');
    });
  }

  select('semarang', false);

  // Buka tab sesuai hash, mis. index.html#plts-papua
  var m = /^#plts-(semarang|kalimantan|papua)$/.exec(location.hash);
  if (m) select(m[1], false);
})();

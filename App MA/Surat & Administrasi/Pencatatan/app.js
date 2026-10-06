// ====== PENGATURAN: tempel URL Web App dari Google Apps Script di sini ======
const API = 'https://script.google.com/macros/s/AKfycbyaXhf0KEYCrIZA0ElSXuLZXL6XJAhcCEKpwIiGjXH1sxMnRezBx12KtWphghKBPIsH/exec';

const LAY = ['LPSE', 'Email Gmail', 'Email Yahoo', 'E-Catalog', 'INAPROC', 'JMTM (Jasa Marga)', 'OSS'];
// field: [label, tipe, placeholder, grup]  (urutan harus sama dengan kolom di Code.gs)
const CFG = {
  akun: { judul: 'akun', f: [
    ['Perusahaan', 'text', 'Nama perusahaan'], ['Direktur', 'text', 'Nama direktur'],
    ...LAY.flatMap(l => [['Username', 'text', 'Username', l], ['Password', 'pw', 'Password', l]]),
    ['Keterangan', 'area', 'Catatan tambahan']] },
  proyek: { judul: 'proyek', f: [
    ['Judul Proyek', 'text', 'PJU tahap 6'], ['Lokasi', 'text'], ['Personil', 'text', 'Istiyanto'],
    ['Peralatan', 'area', 'Pick up: Grand Max\nToolkit: Bosch 108'], ['Nilai Penawaran', 'text', 'Rp131.439.318'],
    ['Tanggal Penawaran', 'text', '21 Juli 2023'], ['Nilai Kontrak', 'text', 'Rp'], ['No SPK', 'text', '050/2248/VII/PSU/23'],
    ['Tanggal SPK', 'text', '21 Juli 2023'], ['Pelaksanaan', 'area', '60 Hari Kerja, 21 Juli 2023 - 18 September 2023']] }
};

let pin = sessionStorage.getItem('pin') || '', tab = 'akun', editRow = null;
const D = { akun: null, proyek: null };   // cache di memori saja (tidak disimpan ke disk)
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const busy = (b, on) => { b.disabled = on; b.classList.toggle('busy', on); };

let net = 0;
async function call(o) {
  $('bar').classList.add('on'); net++;
  try {
    const r = await fetch(API, { method: 'POST', body: JSON.stringify({ pin, ...o }) });
    const j = await r.json();
    if (j.error) throw new Error(j.error);
    return j;
  } finally { if (--net === 0) $('bar').classList.remove('on'); }
}
// antrean agar perubahan dikirim berurutan (nomor baris tetap benar)
let chain = Promise.resolve(), pending = 0;
function queue(o) {
  pending++;
  const p = chain.then(() => call(o));
  chain = p.catch(() => {}).then(() => { pending--; });
  return p;
}

async function loadAll() { const j = await call({ action: 'all' }); D.akun = j.akun; D.proyek = j.proyek; }
async function refresh(silent) {
  if (!silent) { D[tab] = null; render(); }
  try { D[tab] = (await call({ action: 'list', sheet: tab })).rows; }
  catch (e) { D[tab] = D[tab] || []; alert('Gagal memuat: ' + e.message); }
  render();
}

function card(r, c) {
  let h = `<h2>${esc(r.v[0] || '(tanpa judul)')}</h2>`, last = null;
  c.f.forEach(([n, t, , g], i) => {
    const v = r.v[i];
    if (!v || i === 0) return;
    if (g && g !== last) { h += `<div class="sv">${esc(g)}</div>`; last = g; }
    h += `<div class="row"><b>${n}</b>` + (t === 'pw'
      ? `<span class="pw" data-v="${esc(v)}">••••••••</span><button data-a="show">Lihat</button><button data-a="copy" data-v="${esc(v)}">Salin</button>`
      : `<span>${esc(v)}</span>` + (g ? `<button data-a="copy" data-v="${esc(v)}">Salin</button>` : '')) + '</div>';
  });
  return `<article class="item" data-r="${r.row}">${h}<div class="act"><button data-a="edit">Ubah</button><button class="d" data-a="del">Hapus</button></div></article>`;
}
function render() {
  const rows = D[tab], c = CFG[tab], q = $('q').value.toLowerCase();
  if (!rows) { $('list').innerHTML = '<div class="item sk"></div>'.repeat(3); return; }
  const sh = rows.filter(r => r.v.join(' ').toLowerCase().includes(q));
  $('list').innerHTML = sh.length ? sh.map(r => card(r, c)).join('')
    : `<div class="empty">${rows.length ? 'Tidak ada hasil.' : 'Belum ada data. Klik "+ Tambah" untuk mulai.'}</div>`;
}

function openForm(r) {
  const c = CFG[tab]; editRow = r ? r.row : null;
  $('dt').textContent = (r ? 'Ubah ' : 'Tambah ') + c.judul;
  let h = '', open = false;
  c.f.forEach(([n, t, ph, g], i) => {
    const starts = g && (!c.f[i - 1] || c.f[i - 1][3] !== g);
    if (open && (!g || starts)) { h += '</div></fieldset>'; open = false; }
    if (starts) { h += `<fieldset><legend>${esc(g)}</legend><div class="two">`; open = true; }
    const v = r ? esc(r.v[i] || '') : '', p = esc(ph || '');
    h += `<label>${n}` + (t === 'area'
      ? `<textarea name="f${i}" rows="3" placeholder="${p}">${v}</textarea>`
      : `<input name="f${i}" autocomplete="off" placeholder="${p}" value="${v}"${i === 0 ? ' required' : ''}>`) + '</label>';
  });
  $('fields').innerHTML = h + (open ? '</div></fieldset>' : '');
  $('dlg').showModal();
}

async function act(e) {
  const b = e.target.closest('button[data-a]'); if (!b) return;
  const a = b.dataset.a, card = b.closest('.item'), r = card && D[tab].find(x => x.row == card.dataset.r);
  if (a === 'show') {
    const s = b.parentNode.querySelector('.pw'), hid = s.textContent.startsWith('•');
    s.textContent = hid ? s.dataset.v : '••••••••'; b.textContent = hid ? 'Sembunyi' : 'Lihat';
  } else if (a === 'copy') {
    try { await navigator.clipboard.writeText(b.dataset.v); b.textContent = 'Tersalin'; } catch { b.textContent = 'Gagal'; }
    setTimeout(() => b.textContent = 'Salin', 1500);
  } else if (r && r.row < 0) alert('Data sedang disimpan, tunggu sebentar.');
  else if (a === 'edit') openForm(r);
  else if (a === 'del' && confirm('Hapus "' + (r.v[0] || 'data ini') + '"? Tindakan ini tidak bisa dibatalkan.')) {
    D[tab] = D[tab].filter(x => x !== r);                       // tampil langsung
    D[tab].forEach(x => { if (x.row > r.row) x.row--; });
    render();
    queue({ action: 'delete', sheet: tab, row: r.row }).catch(x => { alert('Gagal menghapus: ' + x.message); refresh(true); });
  }
}

$('df').onsubmit = e => {
  e.preventDefault();
  const values = CFG[tab].f.map((_, i) => e.target['f' + i].value.trim()), t = tab;
  if (editRow) {
    const r = D[t].find(x => x.row === editRow); r.v = values;
    queue({ action: 'update', sheet: t, row: editRow, values }).catch(x => { alert('Gagal menyimpan: ' + x.message); refresh(true); });
  } else {
    D[t].push({ row: -Date.now(), v: values });
    queue({ action: 'add', sheet: t, values })
      .then(() => { if (pending <= 1) return refresh(true); })
      .catch(x => { alert('Gagal menyimpan: ' + x.message); refresh(true); });
  }
  $('dlg').close(); render();                                    // tampil langsung tanpa menunggu server
};

$('list').onclick = act;
$('add').onclick = () => openForm();
$('cx').onclick = () => $('dlg').close();
$('q').oninput = render;
$('rf').onclick = () => refresh(false);
document.querySelectorAll('.tabs button').forEach(b => b.onclick = () => {
  document.querySelectorAll('.tabs button').forEach(x => x.classList.toggle('on', x === b));
  tab = b.dataset.t; $('q').value = ''; render();                // dari cache, langsung tampil
});

async function enter() {
  $('login').classList.add('hide'); $('app').classList.remove('hide'); render();
  if (!D.akun) try { await loadAll(); } catch (e) { alert(e.message); sessionStorage.removeItem('pin'); location.reload(); }
  render();
}
$('lf').onsubmit = async e => {
  e.preventDefault(); $('err').textContent = ''; pin = $('pin').value;
  busy(e.submitter, true);
  try { await loadAll(); sessionStorage.setItem('pin', pin); enter(); }   // data dimuat sekali saat login
  catch (x) { $('err').textContent = x.message === 'PIN salah' ? 'PIN salah, coba lagi.' : 'Tidak bisa terhubung: ' + x.message; }
  busy(e.submitter, false);
};
$('out').onclick = () => { sessionStorage.removeItem('pin'); location.reload(); };
if (pin) enter();

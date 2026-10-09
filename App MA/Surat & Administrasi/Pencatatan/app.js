// ====== PENGATURAN ======
const API = 'https://script.google.com/macros/s/AKfycbz5D7Qg-s_st0bttCR1XCzYEc3kxt2mOpjOGi7o1sUy2zWcNk1jskW-6OjIa-sPKYxtjg/exec';
const DEFAULT_CATEGORIES = ['LPSE', 'Email Gmail', 'Email Yahoo', 'E-Catalog', 'INAPROC', 'JMTM (Jasa Marga)', 'OSS'];
let categories = [...DEFAULT_CATEGORIES];
const CFG = {
  akun: { judul: 'akun', f: [] },
  proyek: { judul: 'proyek', f: [
    ['Judul Proyek', 'text', 'PJU tahap 6'], ['Lokasi', 'text'], ['Personil', 'text', 'Istiyanto'],
    ['Peralatan', 'area', 'Pick up: Grand Max\nToolkit: Bosch 108'], ['Nilai Penawaran', 'text', 'Rp131.439.318'],
    ['Tanggal Penawaran', 'text', '21 Juli 2023'], ['Nilai Kontrak', 'text', 'Rp'], ['No SPK', 'text', '050/2248/VII/PSU/23'],
    ['Tanggal SPK', 'text', '21 Juli 2023'], ['Pelaksanaan', 'area', '60 Hari Kerja, 21 Juli 2023 - 18 September 2023']] }
};
function rebuildAccountFields() {
  CFG.akun.f = [['Perusahaan', 'text', 'Nama perusahaan'],
    ...categories.flatMap(c => [['Username', 'text', 'Username', c], ['Password', 'pw', 'Password', c]]),
    ['Keterangan', 'area', 'Catatan tambahan']];
}
rebuildAccountFields();
let pin = sessionStorage.getItem('pin') || '', tab = 'akun', editRow = null;
const D = { akun: null, proyek: null };
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const busy = (b, on) => { if (!b) return; b.disabled = on; b.classList.toggle('busy', on); b.dataset.originalText ||= b.textContent; b.textContent = on ? 'Memproses…' : b.dataset.originalText; };
let toastTimer;
function notify(message, type = 'success') { const t = $('toast'); if (!t) return; t.textContent = message; t.className = 'show ' + type; clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.className = ''; }, 3200); }
let net = 0;
async function call(o) {
  $('bar').classList.add('on'); net++;
  try { const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 20000); let r, raw, j; try { r = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ pin, ...o }), signal: controller.signal, cache: 'no-store' }); raw = await r.text(); } finally { clearTimeout(timeout); } try { j = JSON.parse(raw); } catch { throw new Error('Respons server bukan JSON. Periksa URL Web App dan akses deployment Google Apps Script.'); } if (!r.ok) throw new Error('Server merespons HTTP ' + r.status); if (!j || typeof j !== 'object') throw new Error('Respons server tidak valid.'); if (j.error) throw new Error(j.error); return j; } catch (e) { if (e.name === 'AbortError') throw new Error('Koneksi terlalu lama. Periksa internet dan deployment Apps Script.'); if (e instanceof TypeError) throw new Error('Tidak dapat menghubungi server. Pastikan URL Web App benar, deployment aktif, dan aksesnya sesuai.'); throw e; }
  finally { if (--net === 0) $('bar').classList.remove('on'); }
}
let chain = Promise.resolve(), pending = 0;
function queue(o) { pending++; const p = chain.then(() => call(o)); chain = p.catch(() => {}).then(() => { pending--; }); return p; }
async function loadAll() { const j = await call({ action: 'all' }); categories = j.categories || [...DEFAULT_CATEGORIES]; rebuildAccountFields(); D.akun = j.akun; D.proyek = j.proyek; }
async function refresh(silent) {
  if (!silent) { D[tab] = null; render(); }
  try { D[tab] = (await call({ action: 'list', sheet: tab })).rows; }
  catch (e) { D[tab] = D[tab] || []; notify('Gagal memuat: ' + e.message, 'error'); }
  render();
}
function card(r, c) {
  let h = `<h2>${esc(r.v[0] || '(tanpa judul)')}</h2>`, last = null;
  c.f.forEach(([n, t, , g], i) => {
    const v = r.v[i]; if (!v || i === 0) return;
    if (g && g !== last) { h += `<div class="sv">${esc(g)}</div>`; last = g; }
    h += `<div class="row"><b>${esc(n)}</b>` + (t === 'pw'
      ? `<span class="pw" data-v="${esc(v)}">••••••••</span><button data-a="show">Lihat</button><button data-a="copy" data-v="${esc(v)}">Salin</button>`
      : `<span>${esc(v)}</span>` + (g ? `<button data-a="copy" data-v="${esc(v)}">Salin</button>` : '')) + '</div>';
  });
  return `<article class="item" data-r="${r.row}">${h}<div class="act"><button data-a="edit">Ubah</button><button class="d" data-a="del">Hapus</button></div></article>`;
}
function render() {
  const rows = D[tab], c = CFG[tab], q = $('q').value.toLowerCase();
  $('catManage').classList.toggle('hide', tab !== 'akun');
  if (!rows) { $('list').innerHTML = '<div class="item sk"></div>'.repeat(3); return; }
  const sh = rows.filter(r => r.v.join(' ').toLowerCase().includes(q));
  $('list').innerHTML = sh.length ? sh.map(r => card(r, c)).join('') : `<div class="empty">${rows.length ? 'Tidak ada hasil.' : 'Belum ada data. Klik "+ Tambah" untuk mulai.'}</div>`;
}
function openForm(r) {
  const c = CFG[tab]; editRow = r ? r.row : null; $('dt').textContent = (r ? 'Ubah ' : 'Tambah ') + c.judul;
  let h = '', open = false;
  c.f.forEach(([n, t, ph, g], i) => {
    const starts = g && (!c.f[i - 1] || c.f[i - 1][3] !== g);
    if (open && (!g || starts)) { h += '</div></fieldset>'; open = false; }
    if (starts) { h += `<fieldset><legend>${esc(g)}</legend><div class="two">`; open = true; }
    const v = r ? esc(r.v[i] || '') : '', p = esc(ph || '');
    h += `<label>${esc(n)}` + (t === 'area' ? `<textarea name="f${i}" rows="3" placeholder="${p}">${v}</textarea>` : `<input name="f${i}" type="${t === 'pw' ? 'password' : 'text'}" autocomplete="off" placeholder="${p}" value="${v}"${i === 0 ? ' required' : ''}>`) + '</label>';
  });
  $('fields').innerHTML = h + (open ? '</div></fieldset>' : ''); $('dlg').showModal();
}
async function act(e) {
  const b = e.target.closest('button[data-a]'); if (!b) return;
  const a = b.dataset.a, el = b.closest('.item'), r = el && D[tab].find(x => x.row == el.dataset.r);
  if (a === 'show') { const s = b.parentNode.querySelector('.pw'), hid = s.textContent.startsWith('•'); s.textContent = hid ? s.dataset.v : '••••••••'; b.textContent = hid ? 'Sembunyi' : 'Lihat'; }
  else if (a === 'copy') { try { await navigator.clipboard.writeText(b.dataset.v); b.textContent = 'Tersalin'; } catch { b.textContent = 'Gagal'; } setTimeout(() => b.textContent = 'Salin', 1500); }
  else if (r && r.row < 0) alert('Data sedang disimpan, tunggu sebentar.');
  else if (a === 'edit') openForm(r);
  else if (a === 'del' && r && confirm('Hapus "' + (r.v[0] || 'data ini') + '"? Tindakan ini tidak bisa dibatalkan.')) {
    D[tab] = D[tab].filter(x => x !== r); D[tab].forEach(x => { if (x.row > r.row) x.row--; }); render();
    queue({ action: 'delete', sheet: tab, row: r.row }).catch(x => { alert('Gagal menghapus: ' + x.message); refresh(true); });
  }
}
$('df').onsubmit = e => {
  e.preventDefault(); const values = CFG[tab].f.map((_, i) => e.target['f' + i].value.trim()), t = tab;
  if (editRow) { const r = D[t].find(x => x.row === editRow); r.v = values; queue({ action: 'update', sheet: t, row: editRow, values }).catch(x => { alert('Gagal menyimpan: ' + x.message); refresh(true); }); }
  else { D[t].push({ row: -Date.now(), v: values }); queue({ action: 'add', sheet: t, values }).then(() => { if (pending <= 1) return refresh(true); }).catch(x => { alert('Gagal menyimpan: ' + x.message); refresh(true); }); }
  $('dlg').close(); render(); notify('Data masuk antrean penyimpanan.', 'success');
};
function renderCategories() {
  $('categoryList').innerHTML = categories.map((c, i) => `<div class="category-row"><input aria-label="Nama kategori ${i + 1}" value="${esc(c)}" data-category-index="${i}"><button type="button" data-cat="rename" data-index="${i}">Ubah nama</button><button type="button" class="d" data-cat="delete" data-index="${i}">Hapus</button></div>`).join('');
}
$('categoryList').onclick = async e => {
  const b = e.target.closest('button[data-cat]'); if (!b) return;
  const i = Number(b.dataset.index), oldName = categories[i];
  if (b.dataset.cat === 'rename') {
    const input = $('categoryList').querySelector(`[data-category-index="${i}"]`), newName = input.value.trim();
    if (!newName || newName === oldName) return;
    if (categories.some((x, j) => j !== i && x.toLowerCase() === newName.toLowerCase())) return alert('Nama kategori sudah ada.');
    try { await call({ action: 'renameCategory', oldName, newName }); categories[i] = newName; rebuildAccountFields(); await loadAll(); renderCategories(); render(); }
    catch (x) { alert('Gagal mengubah kategori: ' + x.message); }
  } else if (b.dataset.cat === 'delete') {
    if (!confirm(`Hapus kategori "${oldName}" beserta username dan password yang tersimpan di kategori ini?`)) return;
    try { await call({ action: 'deleteCategory', name: oldName }); categories.splice(i, 1); rebuildAccountFields(); await loadAll(); renderCategories(); render(); }
    catch (x) { alert('Gagal menghapus kategori: ' + x.message); }
  }
};
$('addCategory').onclick = async () => {
  const input = $('newCategory'), name = input.value.trim(); if (!name) return alert('Masukkan nama kategori.');
  if (categories.some(x => x.toLowerCase() === name.toLowerCase())) return alert('Nama kategori sudah ada.');
  try { await call({ action: 'addCategory', name }); input.value = ''; await loadAll(); renderCategories(); render(); }
  catch (x) { alert('Gagal menambah kategori: ' + x.message); }
};
$('list').onclick = act; $('add').onclick = () => openForm(); $('cx').onclick = () => $('dlg').close();
$('togglePin').onclick = () => { const input = $('pin'); const visible = input.type === 'password'; input.type = visible ? 'text' : 'password'; $('togglePin').textContent = visible ? 'Sembunyi' : 'Lihat'; $('togglePin').setAttribute('aria-label', visible ? 'Sembunyikan PIN' : 'Tampilkan PIN'); };
$('catManage').onclick = () => { renderCategories(); $('catDlg').showModal(); }; $('catClose').onclick = () => $('catDlg').close();
$('q').oninput = render; $('rf').onclick = () => refresh(false);
document.querySelectorAll('.tabs button').forEach(b => b.onclick = () => { document.querySelectorAll('.tabs button').forEach(x => x.classList.toggle('on', x === b)); tab = b.dataset.t; $('q').value = ''; render(); });
function showLoginError(error) {
  const message = error && error.message ? error.message : String(error || 'Kesalahan tidak diketahui');
  $('err').textContent = message === 'PIN salah'
    ? 'PIN salah. Periksa kembali PIN yang tersimpan di Code.gs.'
    : 'Belum bisa masuk: ' + message + ' Pastikan URL Web App benar dan deployment Apps Script aktif.';
  notify('Login gagal. Periksa pesan di bawah kolom PIN.', 'error');
}
function showDashboard() {
  $('login').classList.add('hide');
  $('app').classList.remove('hide');
  render();
  notify('Berhasil masuk. Data siap digunakan.');
}
$('lf').onsubmit = async e => {
  e.preventDefault();
  $('err').textContent = '';
  pin = $('pin').value.trim();
  if (!pin) { $('err').textContent = 'PIN wajib diisi.'; return; }
  const submit = e.submitter || $('lf').querySelector('button[type="submit"],button:not([type])');
  busy(submit, true);
  try {
    await loadAll();
    sessionStorage.setItem('pin', pin);
    $('pin').value = '';
    showDashboard();
  } catch (x) {
    sessionStorage.removeItem('pin');
    showLoginError(x);
  } finally { busy(submit, false); }
};
$('out').onclick = () => { sessionStorage.removeItem('pin'); pin = ''; location.reload(); };
if (pin) {
  $('pin').value = pin;
  loadAll().then(showDashboard).catch(error => {
    sessionStorage.removeItem('pin'); pin = ''; $('pin').value = '';
    showLoginError(error);
  });
}

// Ganti URL ini setelah deploy Code.gs sebagai Web App.
const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwlBePJFHJE4m8xOqbF89zLkLuHKEs3PFWU2h5brqXPYR5gFjIOId5HBK4yGBph7gw/exec";

const companies = [
  {
    id: "zma",
    name: "PT. ZAHRA MAJU ABADI",
    logo: "logo-zma.jpg",
    sub: "Mechanical, Electrical & Supplier",
    address: "Alamat : Jl. Bukit Beringin Lestari II, No.1 Semarang",
    contact: "Telp./Fax. (085) 920000900, Email : zahramajuabadi@gmail.com",
  },
  {
    id: "fma",
    name: "PT. FADHILAH MAJU ABADI",
    logo: "logo-fma.png",
    sub: "Mechanical, Electrical & Supplier",
    address: "Alamat : Jl. Bukit Beringin Asri XI / A.61 Semarang",
    contact: "Telp./Fax. (024) 8665382, Email : fadhilamajuabadi@gmail.com",
  },
  {
    id: "rma",
    name: "PT. RIZKY MAJU ABADI",
    logo: "logo-rma.png",
    sub: "Mechanical, Electrical & Supplier",
    address: "Jl. Bukit Beringin Asri XI / A.G1 Semarang",
    contact: "Telp./Fax. (024) 8665382, Email : rizkymajuabadi@gmail.com",
  },
];
let selected = "zma",
  itemCount = 0,
  signatures = {};

function init() {
  setTodayDate();
  generateNumber();
  document.getElementById("companyCards").innerHTML = companies
    .map(
      (c) =>
        `<div class="company-card ${c.id === selected ? "active" : ""}" onclick="selectCompany('${c.id}')"><img src="${c.logo}"><div class="ct">${c.name}<small>${c.sub}</small></div></div>`,
    )
    .join("");
  for (let i = 0; i < 3; i++) addItem();
  ["penerima", "pengirim", "hormat"].forEach(setupCanvas);
  bindPreview();
}
function selectCompany(id) {
  selected = id;
  document
    .querySelectorAll(".company-card")
    .forEach((e, i) => e.classList.toggle("active", companies[i].id === id));
  bindPreview();
}
function generateNumber() {
  const d = new Date();
  const y = String(d.getFullYear()).slice(-2),
    m = String(d.getMonth() + 1).padStart(2, "0"),
    day = String(d.getDate()).padStart(2, "0");
  const key = `sj_${d.getFullYear()}_${d.getMonth() + 1}_${d.getDate()}`;
  let n = Number(localStorage.getItem(key) || 0) + 1;
  localStorage.setItem(key, n);
  document.getElementById("nomor").value =
    `SJ/${y}${m}${day}/${String(n).padStart(4, "0")}`;
  bindPreview();
}
function addItem() {
  itemCount++;
  const tr = document.createElement("tr");
  tr.dataset.n = itemCount;
  tr.innerHTML = `<td class="rn"></td><td><input class="iname" placeholder="Nama Barang"></td><td><input class="iqty" type="number" min="0" value="0"></td><td><input class="iunit" value="Pcs"></td><td><button class="delete" onclick="this.closest('tr').remove();renumber();bindPreview()">🗑</button></td>`;
  document.getElementById("itemBody").appendChild(tr);
  renumber();
  bindPreview();
}
function renumber() {
  document
    .querySelectorAll("#itemBody tr")
    .forEach((tr, i) => (tr.querySelector(".rn").textContent = i + 1));
}
function setupCanvas(id) {
  const c = document.getElementById("sig-" + id),
    dpr = window.devicePixelRatio || 1,
    w = 500,
    h = 180;
  c.width = w * dpr;
  c.height = h * dpr;
  c.style.height = "72px";
  c.style.width = "100%";
  const ctx = c.getContext("2d");
  ctx.scale(dpr, dpr);
  ctx.lineWidth = 2.5;
  ctx.lineCap = "round";
  ctx.strokeStyle = "#111";
  let down = false;
  const point = (e) => {
    const r = c.getBoundingClientRect(),
      p = e.touches ? e.touches[0] : e;
    return {
      x: ((p.clientX - r.left) * w) / r.width,
      y: ((p.clientY - r.top) * h) / r.height,
    };
  };
  const start = (e) => {
    e.preventDefault();
    down = true;
    let p = point(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  };
  const move = (e) => {
    if (!down) return;
    e.preventDefault();
    let p = point(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    signatures[id] = true;
    bindPreview();
  };
  const end = () => (down = false);
  c.addEventListener("pointerdown", start);
  c.addEventListener("pointermove", move);
  c.addEventListener("pointerup", end);
  c.addEventListener("pointerleave", end);
}
function clearSig(id) {
  const c = document.getElementById("sig-" + id);
  c.getContext("2d").clearRect(0, 0, c.width, c.height);
  signatures[id] = false;
  bindPreview();
}
function sigData(id) {
  const c = document.getElementById("sig-" + id);
  return signatures[id] ? c.toDataURL("image/png") : "";
}
function esc(s) {
  return String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[c],
  );
}
function data() {
  const c = companies.find((x) => x.id === selected);
  return {
    company: c,
    nomor: document.getElementById("nomor").value,
    tanggal: normalizeDate(document.getElementById("tanggal").value),
    tujuan: document.getElementById("tujuan").value,
    alamat: document.getElementById("alamat").value,
    kendaraan: document.getElementById("kendaraan").value,
    sopir: document.getElementById("sopir").value,
    catatan: document.getElementById("catatan").value,
    items: [...document.querySelectorAll("#itemBody tr")].map((t) => ({
      nama: t.querySelector(".iname").value,
      qty: t.querySelector(".iqty").value,
      satuan: t.querySelector(".iunit").value,
    })),
    signatures: {
      penerima: sigData("penerima"),
      pengirim: sigData("pengirim"),
      hormat: sigData("hormat"),
    },
    names: {
      penerima: document.getElementById("nama-penerima").value,
      pengirim: document.getElementById("nama-pengirim").value,
      hormat: document.getElementById("nama-hormat").value,
    },
  };
}
function bindPreview() {
  const d = data(),
    rows = d.items
      .map(
        (x, i) =>
          `<tr><td>${i + 1}</td><td>${esc(x.nama)}</td><td>${esc(x.qty)}</td><td>${esc(x.satuan)}</td><td></td></tr>`,
      )
      .join("");
  const sig = (key) =>
    d.signatures[key]
      ? `<img class="sig-img" src="${d.signatures[key]}">`
      : `<div class="sig-img"></div>`;
  document.getElementById("paper").innerHTML = `
 <div class="kop"><img src="${d.company.logo}" alt="Kop Surat"></div>
 <div class="judul">SURAT JALAN</div>
 <div class="meta"><div class="details">
  <div class="line"><span>Tujuan / Customer</span><span>:</span><span>${esc(d.tujuan)}</span></div>
  <div class="line"><span>Alamat Tujuan</span><span>:</span><span>${esc(d.alamat)}</span></div>
  <div class="line"><span>No. Kendaraan</span><span>:</span><span>${esc(d.kendaraan)}</span></div>
  <div class="line"><span>Nama Sopir</span><span>:</span><span>${esc(d.sopir)}</span></div>
 </div><div class="docbox"><div><b>No. Surat Jalan</b><span>:</span><span>${esc(d.nomor)}</span></div><div><b>Tanggal</b><span>:</span><span>${esc(formatDate(d.tanggal))}</span></div></div></div>
 <table class="goods"><thead><tr><th>No</th><th>Nama Barang</th><th>Qty</th><th>Satuan</th><th>Keterangan</th></tr></thead><tbody>${rows}</tbody></table>
 <div class="notes"><b>Catatan :</b> ${esc(d.catatan)}</div>
 <div class="signs">
  <div><div class="sign-title">PENERIMA</div>${sig("penerima")}<div class="sig-line"></div><div class="sig-name">(${esc(d.names.penerima || "")})</div></div>
  <div><div class="sign-title">PENGIRIM</div>${sig("pengirim")}<div class="sig-line"></div><div class="sig-name">(${esc(d.names.pengirim || "")})</div></div>
  <div><div class="sign-title">HORMAT KAMI</div>${sig("hormat")}<div class="sig-line"></div><div class="sig-name">(${esc(d.names.hormat || "")})</div></div>
 </div>`;
}
function localISODate() {
  const d = new Date();
  const y = d.getFullYear(),
    m = String(d.getMonth() + 1).padStart(2, "0"),
    day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function setTodayDate() {
  document.getElementById("tanggal").value = formatDate(localISODate());
}
function normalizeDate(v) {
  const s = String(v || "").trim();
  if (!s) return "";
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
    const [d, m, y] = s.split("/");
    return `${y}-${m}-${d}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  return s;
}
function formatDate(v) {
  if (!v) return "";
  const s = String(v).trim();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return s;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split("-");
    return `${d}/${m}/${y}`;
  }
  return s;
}
function formatDateInput(e) {
  let v = e.target.value.replace(/\D/g, "").slice(0, 8);
  if (v.length > 4) v = v.slice(0, 2) + "/" + v.slice(2, 4) + "/" + v.slice(4);
  else if (v.length > 2) v = v.slice(0, 2) + "/" + v.slice(2);
  e.target.value = v;
  bindPreview();
}
function printF4() {
  bindPreview();
  window.print();
}
function downloadPDF() {
  bindPreview();
  // Browser print dialog -> pilih "Save as PDF". Ukuran halaman otomatis F4 dari @page.
  window.print();
}
async function saveToGoogle() {
  const d = data();
  if (!d.company || !d.nomor) {
    showStatus("Data surat jalan belum lengkap.", "err");
    return;
  }
  if (GOOGLE_SCRIPT_URL.includes("PASTE_URL")) {
    showStatus("URL Google Apps Script belum diisi di script.js.", "err");
    return;
  }

  showStatus("Menyimpan ke Google Sheet dan Google Drive...", "ok");

  try {
    /*
    PENTING:
    Jangan kirim application/json dalam mode no-cors.
    Browser bisa membatasi request tersebut sehingga Apps Script menerima body kosong.
    Kita kirim sebagai application/x-www-form-urlencoded (CORS-safelisted).
  */
    const body = "payload=" + encodeURIComponent(JSON.stringify(d));

    await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body: body,
    });

    showStatus(
      "Data sudah dikirim ke Apps Script. Periksa baris terbaru di Google Sheet.",
      "ok",
    );
  } catch (e) {
    console.error(e);
    showStatus(
      "Gagal mengirim data ke Google Apps Script. Periksa koneksi dan URL Web App.",
      "err",
    );
  }
}
function showStatus(t, c) {
  const e = document.getElementById("status");
  e.textContent = t;
  e.className = `status show ${c}`;
}
function resetForm() {
  if (!confirm("Reset semua data?")) return;
  document
    .querySelectorAll("input:not(#nomor),textarea")
    .forEach((e) => (e.value = ""));
  document.getElementById("itemBody").innerHTML = "";
  for (let i = 0; i < 3; i++) addItem();
  setTodayDate();
  ["penerima", "pengirim", "hormat"].forEach(clearSig);
  generateNumber();
  bindPreview();
}
document.getElementById("tanggal").addEventListener("input", formatDateInput);
[
  "nomor",
  "tanggal",
  "tujuan",
  "alamat",
  "kendaraan",
  "sopir",
  "catatan",
  "nama-penerima",
  "nama-pengirim",
  "nama-hormat",
].forEach((id) =>
  document.getElementById(id).addEventListener("input", bindPreview),
);
document.addEventListener("input", (e) => {
  if (e.target.closest("#itemBody")) bindPreview();
});
window.addEventListener("load", init);

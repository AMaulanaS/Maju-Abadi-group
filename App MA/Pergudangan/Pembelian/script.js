const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzv1MfrG7imA5hpeUvKz_lZ84nGURkm2CkFY48Gv1yStQU_oQLBcrsaEuNPrzhDyDwJcw/exec";
const SPREADSHEET_ID = "1AOsshZ5vOWFVOFILD3db5uDT4lOLoRyNhcuAMTsSrD0";
const DRIVE_FOLDER_ID = "1xm9alOqACExBm79Q92c-9jOmoN1-d0R_";

const companies = [
  {
    id: "zma",
    code: "ZMA",
    name: "PT. ZAHRA MAJU ABADI",
    logo: "logo-zma.jpg",
    sub: "Mechanical, Electrical & Supplier",
    address: "Jl. Bukit Beringin Lestari II no.1 Semarang",
    contact: "",
  },
  {
    id: "fma",
    code: "FMA",
    name: "PT. FADHILAH MAJU ABADI",
    logo: "logo-fma.png",
    sub: "Mechanical, Electrical & Supplier",
    address: "Jl. Bukit Beringin Asri XI / A.61 Semarang",
    contact: "",
  },
  {
    id: "rma",
    code: "RMA",
    name: "PT. RIZKY MAJU ABADI",
    logo: "logo-rma.png",
    sub: "Mechanical, Electrical & Supplier",
    address: "Jl. Bukit Beringin Asri XI / A.G1 Semarang",
    contact: "",
  },
];
let active = "zma";

function init() {
  const d = new Date();
  document.getElementById("poDate").value = d.toISOString().slice(0, 10);
  renderCompanies();
  generatePONumber();
  for (let i = 0; i < 3; i++) addRow();
  bind();
}
function renderCompanies() {
  document.getElementById("companies").innerHTML = companies
    .map(
      (c) =>
        `<div class="company ${c.id === active ? "active" : ""}" onclick="setCompany('${c.id}')"><img src="${c.logo}"><div><b>${c.name}</b><small>${c.sub}</small></div></div>`,
    )
    .join("");
}
function setCompany(id) {
  active = id;
  renderCompanies();
  generatePONumber();
  render();
}
function romanMonth(m) {
  return [
    "I",
    "II",
    "III",
    "IV",
    "V",
    "VI",
    "VII",
    "VIII",
    "IX",
    "X",
    "XI",
    "XII",
  ][m - 1];
}
function generatePONumber() {
  const d = new Date(document.getElementById("poDate").value || new Date());
  const c = companies.find((x) => x.id === active);
  const key = `po_${active}_${d.getFullYear()}_${d.getMonth() + 1}`;
  const n = Number(localStorage.getItem(key) || 0) + 1;
  localStorage.setItem(key, n);
  document.getElementById("poNumber").value =
    `${String(n).padStart(3, "0")}/${c.code}/PO/${romanMonth(d.getMonth() + 1)}/${d.getFullYear()}`;
  render();
}
function addRow() {
  const tr = document.createElement("tr");
  tr.innerHTML = `<td class="rn"></td><td><input class="desc" placeholder="Uraian barang"></td><td><input class="qty" type="number" min="0" value="1"></td><td><input class="unit" value="pcs"></td><td><input class="price" type="number" min="0" value="0"></td><td class="amount">0</td><td><button class="del" onclick="this.closest('tr').remove();numberRows();render()">×</button></td>`;
  document.getElementById("items").appendChild(tr);
  numberRows();
  bindRow(tr);
  render();
}
function numberRows() {
  document
    .querySelectorAll("#items tr")
    .forEach((tr, i) => (tr.querySelector(".rn").textContent = i + 1));
}
function bindRow(tr) {
  tr.querySelectorAll("input").forEach((e) =>
    e.addEventListener("input", () => {
      calcRow(tr);
      render();
    }),
  );
  calcRow(tr);
}
function bind() {
  [
    "supplier",
    "supplierAddress",
    "supplierPIC",
    "notes",
    "approvedBy",
    "approvedTitle",
    "poDate",
  ].forEach((id) =>
    document.getElementById(id).addEventListener("input", () => {
      if (id === "poDate") generatePONumber();
      else render();
    }),
  );
}
function calcRow(tr) {
  const q = Number(tr.querySelector(".qty").value) || 0,
    p = Number(tr.querySelector(".price").value) || 0;
  tr.querySelector(".amount").textContent = fmt(q * p);
}
function rowsData() {
  return [...document.querySelectorAll("#items tr")].map((tr) => ({
    uraian: tr.querySelector(".desc").value,
    qty: tr.querySelector(".qty").value,
    satuan: tr.querySelector(".unit").value,
    harga: Number(tr.querySelector(".price").value) || 0,
    jumlah:
      (Number(tr.querySelector(".qty").value) || 0) *
      (Number(tr.querySelector(".price").value) || 0),
  }));
}
function fmt(n) {
  return new Intl.NumberFormat("id-ID").format(n || 0);
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
function getData() {
  const c = companies.find((x) => x.id === active);
  return {
    company: c,
    noPO: document.getElementById("poNumber").value,
    tanggal: document.getElementById("poDate").value,
    supplier: document.getElementById("supplier").value,
    supplierAddress: document.getElementById("supplierAddress").value,
    supplierPIC: document.getElementById("supplierPIC").value,
    items: rowsData(),
    notes: document.getElementById("notes").value,
    approvedBy: document.getElementById("approvedBy").value,
    approvedTitle: document.getElementById("approvedTitle").value,
    total: rowsData().reduce((a, b) => a + b.jumlah, 0),
  };
}
function render() {
  const d = getData();
  document.querySelectorAll("#items tr").forEach(calcRow);
  const rows = d.items
    .map(
      (x, i) =>
        `<tr><td>${i + 1}</td><td>${esc(x.uraian)}</td><td>${esc(x.qty)}</td><td>${esc(x.satuan)}</td><td>${fmt(x.harga)}</td><td>${fmt(x.jumlah)}</td></tr>`,
    )
    .join("");
  document.getElementById("paper").innerHTML = `
  <div class="kop">
  <img src="${d.company.logo}" alt="Kop Surat">
</div>
  
  </div>
  <div class="po-title">PURCHASE ORDER</div>
  <div class="top-info"><div class="supplier-box"><div class="to">Kepada Yth :</div><b>${esc(d.supplier)}</b><br>${esc(d.supplierAddress)}${d.supplierPIC ? `<br>Up. ${esc(d.supplierPIC)}` : ""}</div><div class="meta-box"><div class="meta-line"><b>No. PO</b><span>:</span><span>${esc(d.noPO)}</span></div><div class="meta-line"><b>Tanggal PO</b><span>:</span><span>${esc(dateID(d.tanggal))}</span></div></div></div>
  <div class="closing">Bersama ini kami mengirimkan Pesanan Barang kepada <b>${esc(d.supplier)}</b> dengan rincian sebagai berikut :</div>
  <table class="items"><thead><tr><th>No</th><th>Uraian</th><th>Qty</th><th>Satuan</th><th>Harga</th><th>Jumlah</th></tr></thead><tbody>${rows}</tbody></table>
  <table class="total-line"><tr><td><b>Jumlah</b></td><td><b>${fmt(d.total)}</b></td></tr></table>
  <div class="closing">${d.notes ? `<b>Catatan:</b> ${esc(d.notes)}<br><br>` : ""}Demikian PO ini kami sampaikan, atas perhatian dan kerjasamanya di ucapkan terima kasih.</div>
  <div class="sig">Hormat kami,<br><b>${d.company.name}</b><div class="sig-space"></div><div class="sig-name">${esc(d.approvedBy || "")}</div><div>${esc(d.approvedTitle || "Direktur")}</div></div>
  <div class="footer-address">${d.company.address}${d.supplierPIC ? `<br>Up. ${esc(d.supplierPIC)}` : ""}</div>
 `;
}
function dateID(v) {
  if (!v) return "";
  const [y, m, d] = v.split("-");
  return `${d}/${m}/${y}`;
}
function downloadPDF() {
  render();
  window.print();
}
async function savePO() {
  const d = getData();
  if (!d.supplier) {
    status("Isi Supplier terlebih dahulu.", "err");
    return;
  }
  if (GOOGLE_SCRIPT_URL.includes("PASTE_URL")) {
    status("URL Google Apps Script PO belum diisi.", "err");
    return;
  }
  status("Menyimpan PO ke Google Sheet...", "ok");
  try {
    const body = "payload=" + encodeURIComponent(JSON.stringify(d));
    await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body,
    });
    status("PO dikirim ke Apps Script. Periksa Google Sheet.", "ok");
  } catch (e) {
    console.error(e);
    status("Gagal menyimpan PO.", "err");
  }
}
function status(t, c) {
  const e = document.getElementById("status");
  e.textContent = t;
  e.className = `show ${c}`;
}
function resetPO() {
  if (!confirm("Reset PO?")) return;
  ["supplier", "supplierAddress", "supplierPIC", "notes", "approvedBy"].forEach(
    (id) => (document.getElementById(id).value = ""),
  );
  document.getElementById("approvedTitle").value = "Direktur";
  document.getElementById("items").innerHTML = "";
  for (let i = 0; i < 3; i++) addRow();
  generatePONumber();
  render();
}
window.addEventListener("load", init);

/*
  KONFIGURASI:
  1. Deploy Code.gs sebagai Web App.
  2. Salin URL /exec ke API_URL di bawah.
*/
const API_URL = "https://script.google.com/macros/s/AKfycbw6Ae_5JIUdFP4M_7lfHCLepRHCpfdcptC-ZMn1YBfpy1vLep6rLWFtF6OCejfQVIvDDw/exec";

let vehicles = [];

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("vehicleForm").addEventListener("submit", saveVehicle);
  document.getElementById("refreshBtn").addEventListener("click", loadVehicles);
  document.getElementById("searchInput").addEventListener("input", renderVehicles);
  loadVehicles();
});

function isConfigured() {
  return API_URL && API_URL.startsWith("https://script.google.com/");
}

function showNotice(message, type="") {
  const el = document.getElementById("formNotice");
  el.textContent = message;
  el.className = "notice " + type;
}

function saveVehicle(event) {
  event.preventDefault();
  if (!isConfigured()) {
    showNotice("API_URL belum diisi. Buka script.js lalu masukkan URL Web App Apps Script.", "err");
    return;
  }

  const form = event.target;
  const data = Object.fromEntries(new FormData(form).entries());
  data.action = "save";

  const iframeName = "saveTarget_" + Date.now();
  const iframe = document.createElement("iframe");
  iframe.name = iframeName;
  iframe.style.display = "none";
  document.body.appendChild(iframe);

  const tempForm = document.createElement("form");
  tempForm.method = "POST";
  tempForm.action = API_URL;
  tempForm.target = iframeName;
  tempForm.style.display = "none";

  Object.entries(data).forEach(([key, value]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = value;
    tempForm.appendChild(input);
  });

  document.body.appendChild(tempForm);
  tempForm.submit();

  showNotice("Data dikirim ke Google Sheets. Silakan refresh beberapa detik lagi untuk melihat hasilnya.", "ok");
  form.reset();

  setTimeout(() => {
    iframe.remove();
    tempForm.remove();
    loadVehicles();
  }, 2500);
}

function loadVehicles() {
  if (!isConfigured()) {
    vehicles = [];
    renderVehicles();
    return;
  }

  const callback = "jsonpCallback_" + Date.now();
  const script = document.createElement("script");

  window[callback] = (response) => {
    try {
      vehicles = Array.isArray(response.data) ? response.data : [];
      renderVehicles();
    } finally {
      delete window[callback];
      script.remove();
    }
  };

  script.src = `${API_URL}?action=list&callback=${encodeURIComponent(callback)}&_=${Date.now()}`;
  script.onerror = () => {
    document.getElementById("vehicleBody").innerHTML =
      `<tr><td colspan="7" class="empty">Gagal membaca data. Periksa URL Apps Script dan akses Web App.</td></tr>`;
    delete window[callback];
    script.remove();
  };
  document.body.appendChild(script);
}

function calcDays(dateString) {
  const target = new Date(dateString + "T00:00:00");
  const today = new Date();
  today.setHours(0,0,0,0);
  return Math.ceil((target - today) / 86400000);
}

function getStatus(days) {
  if (days < 0) return {label:"JATUH TEMPO", cls:"expired"};
  if (days <= 1) return {label:"HARI INI / BESOK", cls:"urgent"};
  if (days <= 30) return {label:"SEGERA", cls:"soon"};
  return {label:"AMAN", cls:"safe"};
}

function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value + "T00:00:00");
  return d.toLocaleDateString("id-ID", {day:"2-digit", month:"short", year:"numeric"});
}

function normalizeWa(number) {
  let n = String(number || "").replace(/\D/g, "");
  if (n.startsWith("0")) n = "62" + n.slice(1);
  return n;
}

function whatsappUrl(v, days) {
  const n = normalizeWa(v.whatsapp);
  if (!n) return "#";
  const sisa = days < 0 ? `sudah jatuh tempo ${Math.abs(days)} hari` : `tersisa ${days} hari`;
  const text = `Halo ${v.pemilik}, pengingat kendaraan ${v.plat}. Tanggal jatuh tempo adalah ${formatDate(v.jatuhTempo)} (${sisa}). Mohon segera melakukan perpanjangan surat kendaraan.`;
  return `https://api.whatsapp.com/send?phone=${n}&text=${encodeURIComponent(text)}`;
}

function emailUrl(v, days) {
  if (!v.email) return "#";
  const subject = `Pengingat Perpanjangan Kendaraan ${v.plat}`;
  const sisa = days < 0 ? `sudah lewat ${Math.abs(days)} hari` : `tersisa ${days} hari`;
  const body = `Halo ${v.pemilik},\n\nPengingat perpanjangan kendaraan ${v.plat}. Jatuh tempo: ${formatDate(v.jatuhTempo)} (${sisa}).\n\nTerima kasih.`;
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(v.email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function renderVehicles() {
  const keyword = document.getElementById("searchInput")?.value.toLowerCase() || "";
  const filtered = vehicles.filter(v =>
    `${v.plat} ${v.pemilik} ${v.jenis}`.toLowerCase().includes(keyword)
  );

  const body = document.getElementById("vehicleBody");
  if (!filtered.length) {
    body.innerHTML = `<tr><td colspan="7" class="empty">${isConfigured() ? "Belum ada data kendaraan." : "Konfigurasi Apps Script terlebih dahulu."}</td></tr>`;
  } else {
    body.innerHTML = filtered.map(v => {
      const days = calcDays(v.jatuhTempo);
      const status = getStatus(days);
      const daysText = days < 0 ? `${Math.abs(days)} hari lewat` : `${days} hari`;
      return `<tr>
        <td><strong>${escapeHtml(v.plat)}</strong></td>
        <td>${escapeHtml(v.pemilik)}</td>
        <td>${escapeHtml(v.jenis)}</td>
        <td>${formatDate(v.jatuhTempo)}</td>
        <td>${daysText}</td>
        <td><span class="badge ${status.cls}">${status.label}</span></td>
        <td><div class="contact-actions">
          ${v.whatsapp ? `<a href="${whatsappUrl(v,days)}" target="_blank" rel="noopener">WA</a>` : ""}
          ${v.email ? `<a href="${emailUrl(v,days)}" target="_blank" rel="noopener">Email</a>` : ""}
        </div></td>
      </tr>`;
    }).join("");
  }

  const allDays = vehicles.map(v => calcDays(v.jatuhTempo));
  document.getElementById("totalCount").textContent = vehicles.length;
  document.getElementById("safeCount").textContent = allDays.filter(d => d > 30).length;
  document.getElementById("soonCount").textContent = allDays.filter(d => d >= 0 && d <= 30).length;
  document.getElementById("expiredCount").textContent = allDays.filter(d => d < 0).length;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));
}
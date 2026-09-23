// ================================================================
// SMART REMINDER SERKOM & LEGAL - MA GROUP
// ================================================================

// URL Web App Google Apps Script
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbykzUHgeHf0ri6aR7qtCPQHnavYFdCliFcJr09y5UgtG8oaCvXWvTEl9Tr9HTUz_7PM/exec';

const CATEGORY_CONFIG = {
    serkom: {
        label: 'SERKOM',
        icon: '🏅',
        fields: [
            { id: 'nama', label: 'Nama Personil', type: 'text', required: true, placeholder: 'Ahmad Zaenufi' },
            { id: 'serkom', label: 'SERKOM', type: 'text', required: true, placeholder: 'KITLTS 5' },
            { id: 'kodeKualifikasi', label: 'Kode Kualifikasi', type: 'text', placeholder: 'F.43.112.01.KUALIFIKASI.5.KITLTS' },
            { id: 'tglBuat', label: 'Tgl Buat', type: 'date' },
            { id: 'expiredDate', label: 'Expired Date', type: 'date', required: true },
            { id: 'bidang', label: 'Bidang', type: 'text', placeholder: 'SBU RMA' },
            { id: 'subBidang', label: 'Sub Bidang', type: 'text' },
            { id: 'keterangan', label: 'Keterangan', type: 'text', placeholder: 'Keterangan tambahan' }
        ],
        statusFields: ['expiredDate']
    },
    legal_rma: legalSheetConfig('LEGAL RMA', '🏢'),
    legal_fma: legalSheetConfig('LEGAL FMA', '🏢'),
    legal_zma: legalSheetConfig('LEGAL ZMA', '🏢')
};

function legalSheetConfig(label, icon) {
    return {
        label,
        icon,
        fields: [
            { id: 'legal', label: 'Legal / Jenis Dokumen', type: 'text', required: true, placeholder: 'AKTA PENDIRIAN' },
            { id: 'noDokumen', label: 'Nomer Dokumen', type: 'text', placeholder: 'Nomor dokumen' },
            { id: 'tglDokumen', label: 'Tgl Dokumen', type: 'date', required: true },
            { id: 'tglExpired', label: 'Tgl Expired', type: 'date' },
            { id: 'keterangan', label: 'Keterangan', type: 'text', placeholder: 'Keterangan tambahan' }
        ],
        statusFields: ['tglExpired']
    };
}

const CATEGORY_ORDER = ['serkom', 'legal_rma', 'legal_fma', 'legal_zma'];

let activeCategory = CATEGORY_ORDER[0];
const dataCache = {};

// ---------------------------------------------------------------
// UTILITAS
// ---------------------------------------------------------------
function escapeHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast show ${type}`;

    clearTimeout(window.toastTimer);
    window.toastTimer = setTimeout(() => {
        toast.classList.remove('show');
    }, 3500);
}


// ---------------------------------------------------------------
// LOADING OVERLAY - mencegah klik berulang saat proses berjalan
// ---------------------------------------------------------------
let loadingCount = 0;
function setLoading(show, title = 'Sedang memproses...', message = 'Mohon tunggu sebentar, jangan klik berulang.') {
    const overlay = document.getElementById('loadingOverlay');
    if (!overlay) return;

    if (show) {
        loadingCount++;
        document.getElementById('loadingTitle').textContent = title;
        document.getElementById('loadingText').textContent = message;
        overlay.classList.remove('hidden');
        overlay.setAttribute('aria-busy', 'true');
        document.body.classList.add('is-loading');
    } else {
        loadingCount = Math.max(0, loadingCount - 1);
        if (loadingCount === 0) {
            overlay.classList.add('hidden');
            overlay.setAttribute('aria-busy', 'false');
            document.body.classList.remove('is-loading');
        }
    }
}

// ---------------------------------------------------------------
// TABS
// ---------------------------------------------------------------
function buildTabs() {
    const tabBar = document.getElementById('tabBar');

    tabBar.innerHTML = CATEGORY_ORDER.map((key, i) => {
        const cfg = CATEGORY_CONFIG[key];

        return `
            <button type="button"
                data-key="${key}"
                class="tab-btn ${i === 0 ? 'active' : ''}">
                <span class="tab-icon">${cfg.icon}</span>
                <span>${escapeHtml(cfg.label)}</span>
            </button>
        `;
    }).join('');

    tabBar.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.key));
    });
}

function switchTab(key) {
    if (document.body.classList.contains('is-loading')) return;
    activeCategory = key;

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.key === key);
    });

    buildForm(key);
    renderTable(key);

    if (!dataCache[key]) {
        loadData(key);
    }
}

// ---------------------------------------------------------------
// FORM
// ---------------------------------------------------------------
function buildForm(key) {
    const cfg = CATEGORY_CONFIG[key];
    const container = document.getElementById('formFields');

    container.innerHTML = cfg.fields.map(f => `
        <div class="field-group">
            <label for="f_${f.id}">
                ${escapeHtml(f.label)}
                ${f.required ? '<span class="required">*</span>' : ''}
            </label>

            <input
                type="${f.type}"
                id="f_${f.id}"
                placeholder="${escapeHtml(f.placeholder || '')}"
                ${f.required ? 'required' : ''}
            >
        </div>
    `).join('');

    document.getElementById('formTitle').innerHTML =
        `<span class="form-title-icon">${cfg.icon}</span> Tambah Data ${escapeHtml(cfg.label)}`;

    document.getElementById('formSubtitle').textContent =
        `Isi data ${cfg.label.toLowerCase()} lalu tekan Simpan Data.`;
}

// ---------------------------------------------------------------
// TABLE
// ---------------------------------------------------------------
function buildTableHead(key) {
    const cfg = CATEGORY_CONFIG[key];
    const thead = document.getElementById('tableHead');

    thead.innerHTML = `
        <tr>
            <th>No</th>
            ${cfg.fields.map(f =>
                `<th>${escapeHtml(f.label.split('(')[0].trim())}</th>`
            ).join('')}
            <th>Status</th>
        </tr>
    `;
}

function computeStatus(item, statusFields) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let bestDiff = null;

    statusFields.forEach(fieldId => {
        const raw = item[fieldId.toLowerCase()];
        if (!raw) return;

        const d = new Date(raw);
        if (isNaN(d.getTime())) return;

        const diff = Math.ceil(
            (d - today) / (1000 * 60 * 60 * 24)
        );

        if (bestDiff === null || diff < bestDiff) {
            bestDiff = diff;
        }
    });

    if (bestDiff === null) {
        return {
            badge: '<span class="status-badge status-none">Tidak Ada Expired</span>',
            rowColor: ''
        };
    }

    if (bestDiff < 0) {
        return {
            badge: `<span class="status-badge status-expired">🔴 Expired</span>`,
            rowColor: 'row-expired'
        };
    }

    if (bestDiff <= 120) {
        return {
            badge: `<span class="status-badge status-warning">🟡 Perpanjang ${bestDiff} Hari</span>`,
            rowColor: 'row-warning'
        };
    }

    return {
        badge: `<span class="status-badge status-safe">🟢 Aman ${bestDiff} Hari</span>`,
        rowColor: ''
    };
}

function formatVal(val, type) {
    if (val === undefined || val === null || val === '') return '-';

    if (type === 'date') {
        const d = new Date(val);

        if (!isNaN(d.getTime())) {
            return d.toLocaleDateString('id-ID', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        }
    }

    return escapeHtml(val);
}

// ---------------------------------------------------------------
// DATA
// ---------------------------------------------------------------
async function loadData(key) {
    const tableBody = document.getElementById('tableBody');
    setLoading(true, 'Memuat data...', 'Mengambil data dari Google Spreadsheet. Jangan klik berulang.');

    tableBody.innerHTML = `
        <tr>
            <td colspan="20" class="empty-state">
                <div class="loader"></div>
                <div>Memuat data...</div>
            </td>
        </tr>
    `;

    try {
        const response = await fetch(
            `${SCRIPT_URL}?kategori=${encodeURIComponent(key)}&t=${Date.now()}`
        );

        const data = await response.json();

        if (data && data.error) {
            throw new Error(data.error);
        }

        dataCache[key] = Array.isArray(data) ? data : [];

    } catch (error) {
        console.error(error);
        dataCache[key] = null;
    }

    if (activeCategory === key) {
        renderTable(key);
    }
    setLoading(false);
}

function renderTable(key) {
    buildTableHead(key);

    const cfg = CATEGORY_CONFIG[key];
    const tableBody = document.getElementById('tableBody');
    const data = dataCache[key];

    document.getElementById('recordCount').textContent =
        data && Array.isArray(data) ? data.length : '0';

    if (data === null) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="20" class="empty-state error-state">
                    <div class="empty-icon">⚠️</div>
                    <strong>Gagal memuat data</strong>
                    <span>Periksa URL Web App dan koneksi Google Spreadsheet.</span>
                </td>
            </tr>
        `;
        return;
    }

    if (data === undefined) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="20" class="empty-state">
                    <div class="loader"></div>
                    <span>Memuat data...</span>
                </td>
            </tr>
        `;
        return;
    }

    if (data.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="20" class="empty-state">
                    <div class="empty-icon">📁</div>
                    <strong>Belum ada data</strong>
                    <span>Belum ada data ${escapeHtml(cfg.label)} tersimpan.</span>
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = data.map((item, index) => {
        const { badge, rowColor } =
            computeStatus(item, cfg.statusFields);

        const cells = cfg.fields.map(f => `
            <td>${formatVal(item[f.id.toLowerCase()], f.type)}</td>
        `).join('');

        return `
            <tr class="${rowColor}">
                <td class="row-number">${index + 1}</td>
                ${cells}
                <td>${badge}</td>
            </tr>
        `;
    }).join('');
}

// ---------------------------------------------------------------
// SUBMIT
// ---------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    if (SCRIPT_URL.includes('TEMPEL_URL')) {
        document.getElementById('connectionWarning').classList.remove('hidden');
    }

    buildTabs();
    buildForm(activeCategory);
    buildTableHead(activeCategory);
    loadData(activeCategory);

    const form = document.getElementById('dataForm');
    const btnSubmit = document.getElementById('btnSubmit');

    form.addEventListener('submit', async e => {
        e.preventDefault();

        const cfg = CATEGORY_CONFIG[activeCategory];

        btnSubmit.disabled = true;
        setLoading(true, 'Menyimpan data...', 'Sedang mengirim data ke Google Spreadsheet.');
        btnSubmit.innerHTML = '<span class="btn-spinner"></span> Menyimpan...';

        const formData = new URLSearchParams();
        formData.append('kategori', activeCategory);

        cfg.fields.forEach(f => {
            formData.append(
                f.id,
                document.getElementById(`f_${f.id}`).value
            );
        });

        try {
            const response = await fetch(SCRIPT_URL, {
                method: 'POST',
                body: formData
            });

            const result = await response.text();

            if (result.includes('Error')) {
                throw new Error(result);
            }

            showToast('Data berhasil disimpan ke Google Spreadsheet!', 'success');

            form.reset();
            dataCache[activeCategory] = null;
            await loadData(activeCategory);

        } catch (error) {
            console.error(error);
            showToast(
                'Gagal menyimpan. Periksa URL Web App dan izin Apps Script.',
                'error'
            );
        } finally {
            setLoading(false);
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = '💾 Simpan Data';
        }
    });

    document.getElementById('btnRefresh').addEventListener('click', () => {
        if (document.body.classList.contains('is-loading')) return;
        dataCache[activeCategory] = null;
        loadData(activeCategory);
        showToast('Data sedang diperbarui...', 'info');
    });
});

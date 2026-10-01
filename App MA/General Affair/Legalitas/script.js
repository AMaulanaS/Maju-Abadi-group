// ================================================================
// SMART REMINDER SERKOM & LEGAL - MA GROUP
// ================================================================

// URL Web App Google Apps Script
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxrouiC6ZUNIZozPpXHFdLLVmd6A4ZYVjw5XuAlPW76aPCypKC7g3A7pQDNBBMQdvzJ-g/exec';

const CATEGORY_CONFIG = {
    serkom: {
        label: 'SERKOM',
        icon: '🏅',
        uploadLabel: 'Upload PDF SERKOM',
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
        uploadLabel: 'Upload PDF Dokumen',
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
    window.uploadedFile = null;
    const submitButton = document.getElementById('btnSubmit');
    if (submitButton) submitButton.disabled = true;

    container.innerHTML = `
        <div class="upload-card field-group">
            <label for="f_upload">${escapeHtml(cfg.uploadLabel || 'Upload PDF Dokumen')} <span class="required">*</span></label>
            <input type="file" id="f_upload" accept="application/pdf,.pdf" required>
            <small id="uploadStatus" class="upload-status">Upload PDF terlebih dahulu. Field lainnya akan aktif setelah upload berhasil.</small>
        </div>
        ${cfg.fields.map(f => `
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
                    disabled
                >
            </div>
        `).join('')}
    `;

    document.getElementById('formTitle').innerHTML =
        `<span class="form-title-icon">${cfg.icon}</span> Tambah Data ${escapeHtml(cfg.label)}`;

    document.getElementById('formSubtitle').textContent =
        `Upload dokumen terlebih dahulu, kemudian isi data ${cfg.label.toLowerCase()} lalu tekan Simpan Data.`;

    const uploadInput = document.getElementById('f_upload');
    uploadInput.addEventListener('change', () => handleUpload(key));
}

async function readJsonResponse(response) {
    const text = await response.text();
    const cleaned = String(text || '').trim();

    if (!cleaned) {
        throw new Error('Server tidak mengembalikan respons. Pastikan deployment Web App masih aktif.');
    }

    try {
        return JSON.parse(cleaned);
    } catch (e) {
        // Backend lama kadang mengembalikan plain text "Error: ...".
        // Tampilkan pesan aslinya, bukan error JSON yang membingungkan.
        if (/^error\s*:/i.test(cleaned)) {
            throw new Error(cleaned.replace(/^error\s*:\s*/i, ''));
        }
        throw new Error('Respons server bukan JSON yang valid: ' + cleaned.slice(0, 300));
    }
}

async function handleUpload(key) {
    const input = document.getElementById('f_upload');
    const status = document.getElementById('uploadStatus');
    const btnSubmit = document.getElementById('btnSubmit');
    const cfg = CATEGORY_CONFIG[key];

    if (!input.files || !input.files[0]) return;

    const file = input.files[0];
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        input.value = '';
        showToast('File harus berupa PDF.', 'error');
        return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
        input.value = '';
        showToast('Ukuran PDF maksimal 10 MB.', 'error');
        return;
    }

    status.textContent = 'Sedang mengupload PDF dan membaca isi dokumen...';
    status.className = 'upload-status uploading';
    btnSubmit.disabled = true;
    setLoading(true, 'Memproses dokumen...', 'PDF sedang disimpan ke Google Drive dan dibaca otomatis.');

    try {
        // Baca isi PDF di browser terlebih dahulu. Ini bekerja untuk PDF yang
        // mempunyai text layer. PDF hasil scan/foto membutuhkan OCR.
        let extractedText = '';
        try {
            extractedText = await extractPdfText(file);
        } catch (pdfError) {
            console.warn('Pembacaan PDF gagal:', pdfError);
        }

        const base64 = await fileToBase64(file);
        const payload = new URLSearchParams();
        payload.append('action', 'upload');
        payload.append('kategori', key);
        payload.append('fileName', file.name);
        payload.append('mimeType', 'application/pdf');
        payload.append('fileBase64', base64);

        const response = await fetch(SCRIPT_URL, { method: 'POST', body: payload });
        const result = await readJsonResponse(response);

        if (!response.ok || !result.success) {
            throw new Error(result.error || 'Upload gagal.');
        }

        window.uploadedFile = {
            category: key,
            name: result.fileName || file.name,
            url: result.fileUrl,
            id: result.fileId
        };

        cfg.fields.forEach(f => {
            const el = document.getElementById(`f_${f.id}`);
            if (el) el.disabled = false;
        });

        // Isi field secara otomatis dari hasil pembacaan PDF.
        const parsed = parseDocumentText(extractedText, key, file.name);
        let filledCount = 0;
        Object.entries(parsed).forEach(([fieldId, value]) => {
            const el = document.getElementById(`f_${fieldId}`);
            if (el && value) {
                el.value = value;
                filledCount++;
            }
        });

        const readInfo = filledCount
            ? ` ${filledCount} field terisi otomatis; silakan periksa dan koreksi bila perlu.`
            : ' Isi field secara manual karena teks PDF belum dapat dikenali otomatis.';

        status.textContent = `✓ Upload berhasil: ${result.fileName || file.name}.${readInfo}`;
        status.className = 'upload-status success';
        showToast(
            filledCount
                ? `PDF berhasil. ${filledCount} field terisi otomatis.`
                : 'PDF berhasil diupload. Field sudah aktif.',
            'success'
        );
    } catch (error) {
        console.error(error);
        input.value = '';
        window.uploadedFile = null;
        status.textContent = 'Upload gagal. Silakan pilih PDF lagi.';
        status.className = 'upload-status error';
        showToast(error.message || 'Gagal mengupload PDF.', 'error');
    } finally {
        setLoading(false);
        btnSubmit.disabled = !window.uploadedFile || window.uploadedFile.category !== key;
    }
}

function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function cleanPdfText(text) {
    return String(text || '')
        .replace(/\u00a0/g, ' ')
        .replace(/[ \t]+/g, ' ')
        .replace(/\r/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

async function extractPdfText(file) {
    if (!window.pdfjsLib) {
        throw new Error('PDF reader belum tersedia.');
    }

    window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    const buffer = await file.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
    const pages = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
        const page = await pdf.getPage(pageNumber);
        const content = await page.getTextContent();
        pages.push(content.items.map(item => item.str || '').join(' '));
    }

    return cleanPdfText(pages.join('\n'));
}

function findPdfField(text, labels) {
    if (!text) return '';

    const source = cleanPdfText(text)
        .replace(/[\n\r]+/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .trim();

    const labelPattern = labels.map(escapeRegExp).join('|');

    // PDF text layer sering keluar sebagai satu baris panjang. Karena itu
    // pencarian tidak hanya bergantung pada posisi newline.
    const direct = new RegExp(
        `(?:^|\\s)(?:${labelPattern})\\s*[:：=-]\\s*(.*?)(?=\\s+(?:[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ0-9 ./()_-]{1,45})\\s*[:：=-]|$)`,
        'i'
    ).exec(source);
    if (direct && direct[1]) {
        return direct[1].trim().replace(/\s{2,}/g, ' ');
    }

    // Coba pola multiline asli: label diikuti nilai pada baris berikutnya.
    const lines = cleanPdfText(text).split('\n').map(x => x.trim()).filter(Boolean);
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const normalized = line.toLowerCase().replace(/[\s:：-]+/g, ' ').trim();
        const matchLabel = labels.some(label => {
            const l = label.toLowerCase().replace(/[\s:：-]+/g, ' ').trim();
            return normalized === l || normalized.startsWith(l + ' ');
        });

        if (matchLabel) {
            const remainder = line
                .replace(new RegExp(`^(?:${labelPattern})\\s*[:：=-]?\\s*`, 'i'), '')
                .trim();
            if (remainder && remainder.length > 1) return remainder;
            if (lines[i + 1]) return lines[i + 1].trim();
        }
    }

    return '';
}

function normalizeDateValue(value) {
    if (!value) return '';
    const v = String(value).trim();

    let m = v.match(/\b(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})\b/);
    if (m) return `${m[3]}-${String(m[2]).padStart(2, '0')}-${String(m[1]).padStart(2, '0')}`;

    m = v.match(/\b(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})\b/);
    if (m) return `${m[1]}-${String(m[2]).padStart(2, '0')}-${String(m[3]).padStart(2, '0')}`;

    const months = {
        januari: 1, februari: 2, maret: 3, april: 4, mei: 5, juni: 6,
        juli: 7, agustus: 8, september: 9, oktober: 10, november: 11, desember: 12
    };
    m = v.toLowerCase().match(/(\d{1,2})\s+([a-z]+)\s+(\d{4})/);
    if (m && months[m[2]]) {
        return `${m[3]}-${String(months[m[2]]).padStart(2, '0')}-${String(m[1]).padStart(2, '0')}`;
    }
    return '';
}

function parseDocumentText(text, key, fileName = '') {
    const t = cleanPdfText(text);
    const result = {};

    if (!t) return result;

    if (key === 'serkom') {
        result.nama = findPdfField(t, ['Nama Personil', 'Nama Pemegang Sertifikat', 'Nama Tenaga Teknik', 'Pemegang Sertifikat', 'Nama']);
        result.serkom = findPdfField(t, ['Sertifikat Kompetensi', 'Jenis Sertifikat', 'Jenis Kompetensi', 'SERKOM']);
        result.kodeKualifikasi = findPdfField(t, ['Kode Kualifikasi', 'KodeKualifikasi']);
        result.tglBuat = normalizeDateValue(findPdfField(t, ['Tanggal Terbit', 'Tgl Terbit', 'Tanggal Penerbitan', 'Tanggal Mulai Berlaku', 'Tgl Buat', 'Tanggal Buat']));
        result.expiredDate = normalizeDateValue(findPdfField(t, ['Berlaku Sampai', 'Berlaku Hingga', 'Tanggal Berakhir', 'Tanggal Kadaluarsa', 'Expired Date', 'Tgl Expired']));
        result.bidang = findPdfField(t, ['Bidang']);
        result.subBidang = findPdfField(t, ['Sub Bidang', 'SubBidang']);
    } else {
        result.legal = findPdfField(t, ['Jenis Dokumen', 'Jenis Legalitas', 'Nama Dokumen', 'Dokumen', 'Legal']);
        result.noDokumen = findPdfField(t, ['Nomor Dokumen', 'Nomer Dokumen', 'No Dokumen', 'Nomor', 'No.']);
        result.tglDokumen = normalizeDateValue(findPdfField(t, ['Tanggal Dokumen', 'Tgl Dokumen', 'Tanggal Terbit', 'Tanggal Penerbitan', 'Tanggal', 'Tgl']));
        result.tglExpired = normalizeDateValue(findPdfField(t, ['Berlaku Sampai', 'Berlaku Hingga', 'Tanggal Berakhir', 'Tanggal Kadaluarsa', 'Tanggal Expired', 'Tgl Expired']));
    }

    // Bila nama dokumen tidak terbaca dari label, gunakan nama file sebagai petunjuk
    // hanya untuk field Legal (tidak mengisi field lain secara spekulatif).
    if (key !== 'serkom' && !result.legal && fileName) {
        result.legal = fileName.replace(/\.pdf$/i, '').replace(/[_-]+/g, ' ').trim();
    }

    return result;
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
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

        // URL PDF dari Spreadsheet. Dukung beberapa nama header lama/baru.
        const fileUrl = String(
            item.uploadfileurl ||
            item.fileurl ||
            item.linkfile ||
            item.uploadurl ||
            ''
        ).trim();

        // Tombol Drive SELALU ditampilkan di sebelah status.
        // Jika URL belum tersedia (misalnya data lama), tombol dibuat disabled
        // agar pengguna tetap melihat posisi tombolnya.
        const driveButton = fileUrl
            ? `<a class="drive-link-btn" href="${escapeHtml(fileUrl)}" target="_blank" rel="noopener noreferrer" title="Buka dokumen PDF di Google Drive">📁 Drive</a>`
            : `<button type="button" class="drive-link-btn drive-link-disabled" disabled title="Data ini belum memiliki link PDF Google Drive">📁 Drive</button>`;

        return `
            <tr class="${rowColor}">
                <td class="row-number">${index + 1}</td>
                ${cells}
                <td class="status-cell">
                    <div class="status-actions">
                        ${badge}
                        ${driveButton}
                    </div>
                </td>
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

        if (!window.uploadedFile || window.uploadedFile.category !== activeCategory) {
            showToast('Upload PDF terlebih dahulu sebelum mengisi dan menyimpan data.', 'error');
            return;
        }

        btnSubmit.disabled = true;
        setLoading(true, 'Menyimpan data...', 'Sedang mengirim data ke Google Spreadsheet.');
        btnSubmit.innerHTML = '<span class="btn-spinner"></span> Menyimpan...';

        const formData = new URLSearchParams();
        formData.append('kategori', activeCategory);
        formData.append('fileId', window.uploadedFile.id || '');
        formData.append('fileName', window.uploadedFile.name || '');
        formData.append('fileUrl', window.uploadedFile.url || '');

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

            const result = await readJsonResponse(response);

            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Gagal menyimpan data.');
            }

            showToast('Data berhasil disimpan ke Google Spreadsheet!', 'success');

            form.reset();
            window.uploadedFile = null;
            buildForm(activeCategory);
            dataCache[activeCategory] = null;
            await loadData(activeCategory);

        } catch (error) {
            console.error(error);
            showToast(
                error.message || 'Gagal menyimpan data.',
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

// ===== DOM =====
const trackingForm = document.getElementById('trackingForm');
const trackingInput = document.getElementById('trackingNumber');
const trackingResult = document.getElementById('trackingResult');
const closeResult = document.getElementById('closeResult');
const loadingSpinner = document.getElementById('loadingSpinner');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const resultTrackingNumber = document.getElementById('resultTrackingNumber');
const resultStatus = document.getElementById('resultStatus');
const resultLastUpdate = document.getElementById('resultLastUpdate');
const resultLocation = document.getElementById('resultLocation');
const resultLastEvent = document.getElementById('resultLastEvent');
const trackingEvents = document.getElementById('trackingEvents');
const copyTrackingBtn = document.getElementById('copyTrackingBtn');
const bulkResults = document.getElementById('bulkResults');
const bulkResultsBody = document.getElementById('bulkResultsBody');
const copyAllBtn = document.getElementById('copyAllBtn');

// ===== Events =====
if (trackingForm) trackingForm.addEventListener('submit', e => { e.preventDefault(); trackPackage(); });
if (closeResult) closeResult.addEventListener('click', () => { trackingResult.classList.add('hidden'); window.scrollTo({top:0,behavior:'smooth'}); });
if (copyTrackingBtn) copyTrackingBtn.addEventListener('click', () => copyToClipboard(resultTrackingNumber.textContent));
if (copyAllBtn) copyAllBtn.addEventListener('click', copyAllBulk);

// ===== Get order from Firebase (added by admin) =====
async function getAdminOrder(num) {
    try {
        const database = await initFirebase();
        console.log('[Track] Searching for:', num);
        const snap = await database.collection('milanoOrders').where('m16Number', '==', num).get();
        console.log('[Track] M16 results:', snap.size);
        if (snap.empty) {
            const snap2 = await database.collection('milanoOrders').where('realTrackingNumber', '==', num).get();
            console.log('[Track] Tracking results:', snap2.size);
            if (snap2.empty) return null;
            return buildTrackingData(snap2.docs[0].data());
        }
        return buildTrackingData(snap.docs[0].data());
    } catch(e) {
        console.error('[Track] Error:', e.code || e.message || e);
        if (e.code === 'permission-denied') {
            showError('خطأ في الصلاحيات — تواصل مع الإدارة');
        }
        return null;
    }
}

function buildTrackingData(o) {
    const statusMap = { 'pending':'قيد المعالجة', 'in-transit':'في الطريق', 'delivered':'تم التوصيل', 'exception':'مشكلة في التوصيل' };
    const statusLoc = { 'pending':'مستودع البائع', 'in-transit':'في الطريق', 'delivered':'تم التوصيل', 'exception':'مركز الخدمة' };
    return {
        trackingNumber: o.m16Number || o.trackingNumber,
        status: o.status,
        statusText: statusMap[o.status] || o.status,
        lastUpdate: o.createdAt || '-',
        location: o.address || statusLoc[o.status] || '-',
        lastEvent: statusMap[o.status] || o.status,
        events: [
            { date: o.createdAt || '-', status: statusMap[o.status] || o.status, location: o.address || '-' },
            ...(o.notes ? [{ date: o.createdAt || '-', status: o.notes, location: o.address || '-' }] : [])
        ]
    };
}

// ===== Track =====
async function trackPackage() {
    const num = trackingInput.value.trim().toUpperCase();
    if (!num) { showError('الرجاء إدخال رقم التتبع'); shakeInput(); return; }
    if (num.length < 6) { showError('رقم التتبع يجب أن يكون على الأقل 6 أحرف'); shakeInput(); return; }

    hideAll();
    loadingSpinner.classList.remove('hidden');
    await new Promise(r => setTimeout(r, 800));

    // Check admin orders from Firebase
    const data = await getAdminOrder(num);
    if (!data) { showError('رقم التتبع غير موجود — تأكد من صحة الرقم'); return; }
    displayResults(data);
}

// ===== Bulk Track =====
async function bulkTrack() {
    const input = document.getElementById('bulkInput').value.trim();
    if (!input) { showToast('أدخل أرقام التتبع', 'error'); return; }

    const numbers = input.split('\n').map(n => n.trim().toUpperCase()).filter(n => n.length >= 6);
    if (numbers.length === 0) { showToast('لا توجد أرقام صالحة', 'error'); return; }

    hideAll();
    loadingSpinner.classList.remove('hidden');
    await new Promise(r => setTimeout(r, 1500));

    bulkResultsBody.innerHTML = '';
    let foundCount = 0;
    for (const num of numbers) {
        const data = await getAdminOrder(num);
        if (!data) continue;
        foundCount++;
        const statusColors = { 'pending':'#fdcb6e', 'in-transit':'#0984e3', 'delivered':'#00b894', 'exception':'#e17055' };
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:16px 20px;background:var(--bg);border-radius:10px;margin-bottom:10px;border:1px solid var(--border);';
        row.innerHTML = `
            <div style="flex:1;">
                <div style="font-family:monospace;font-weight:700;font-size:1rem;letter-spacing:1px;margin-bottom:4px;">${num}</div>
                <div style="font-size:0.85rem;color:var(--text-muted);">${data.lastEvent}</div>
            </div>
            <div style="display:flex;align-items:center;gap:12px;">
                <span style="display:inline-block;padding:6px 16px;border-radius:50px;font-size:0.8rem;font-weight:700;color:white;background:${statusColors[data.status]||'#636e72'};">${data.statusText}</span>
                <button onclick="copyToClipboard('${num}')" style="background:var(--gold);color:white;border:none;padding:8px 14px;border-radius:8px;cursor:pointer;font-family:inherit;font-weight:600;"><i class="fas fa-copy"></i></button>
            </div>`;
        bulkResultsBody.appendChild(row);
    }

    loadingSpinner.classList.add('hidden');
    bulkResults.classList.remove('hidden');
    if (foundCount === 0) { showToast('لم يتم العثور على أي شحنات', 'error'); }
    else { showToast(`تم تتبع ${foundCount} شحنة بنجاح`, 'success'); }
}

// ===== Copy =====
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('تم النسخ بنجاح', 'success');
    }).catch(() => {
        const ta = document.createElement('textarea');
        ta.value = text; document.body.appendChild(ta); ta.select();
        document.execCommand('copy'); document.body.removeChild(ta);
        showToast('تم النسخ بنجاح', 'success');
    });
}

function copyAllBulk() {
    const nums = Array.from(bulkResultsBody.querySelectorAll('[style*="monospace"]')).map(el => el.textContent.trim());
    copyToClipboard(nums.join('\n'));
}

// ===== Display =====
function displayResults(data) {
    hideAll();
    resultTrackingNumber.textContent = data.trackingNumber;
    resultStatus.textContent = data.statusText;
    resultStatus.className = 'result-status ' + data.status;
    resultLastUpdate.textContent = data.lastUpdate;
    resultLocation.textContent = data.location;
    if (resultLastEvent) resultLastEvent.textContent = data.lastEvent;

    trackingEvents.innerHTML = '';
    data.events.forEach((e, i) => {
        const el = document.createElement('div');
        el.className = 'timeline-event';
        el.style.animationDelay = (i * 0.1) + 's';
        el.innerHTML = `<div class="event-date"><i class="fas fa-clock"></i> ${e.date}</div><div class="event-status">${e.status}</div><div class="event-location"><i class="fas fa-map-marker-alt"></i> ${e.location}</div>`;
        trackingEvents.appendChild(el);
    });

    trackingResult.classList.remove('hidden');
    trackingResult.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ===== Helpers =====
function showError(msg) { hideAll(); errorText.textContent = msg; errorMessage.classList.remove('hidden'); }

function hideAll() {
    [trackingResult, loadingSpinner, errorMessage, bulkResults].forEach(el => { if(el) el.classList.add('hidden'); });
}

function shakeInput() {
    if (!trackingInput) return;
    trackingInput.style.animation = 'none';
    void trackingInput.offsetHeight;
    trackingInput.style.animation = 'shake 0.4s ease';
    setTimeout(() => trackingInput.style.animation = '', 500);
}

function showToast(msg, type) {
    let t = document.getElementById('toast');
    if (!t) { t = document.createElement('div'); t.id = 'toast'; document.body.appendChild(t); }
    t.className = 'toast toast-' + type;
    t.innerHTML = `<i class="fas fa-${type==='success'?'check-circle':'exclamation-circle'}"></i> ${msg}`;
    t.classList.remove('hidden');
    setTimeout(() => t.classList.add('hidden'), 3000);
}

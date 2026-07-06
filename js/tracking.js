// ===== Tracking System JavaScript =====

// Sample tracking data
const trackingData = {
    'EE123456789EG': {
        trackingNumber: 'EE123456789EG',
        status: 'in-transit',
        statusText: 'في الطريق',
        lastUpdate: '7 يوليو 2026 - 2:30 م',
        location: 'مركز توزيع القاهرة',
        lastEvent: 'تم استلام الشحنة في مركز التوزيع',
        events: [
            { date: '7 يوليو 2026 - 2:30 م', status: 'تم استلام الشحنة في مركز التوزيع', location: 'مركز توزيع القاهرة' },
            { date: '6 يوليو 2026 - 10:15 ص', status: 'وصلت الشحنة إلى مصر', location: 'مطار القاهرة الدولي' },
            { date: '4 يوليو 2026 - 3:00 م', status: 'غادرت الشحنة بلد المنشأ', location: 'شنغهاي - الصين' },
            { date: '2 يوليو 2026 - 9:00 ص', status: 'تم استلام الشحنة من المرسل', location: 'مستودع البائع' }
        ]
    },
    'EE987654321EG': {
        trackingNumber: 'EE987654321EG',
        status: 'delivered',
        statusText: 'تم التوصيل',
        lastUpdate: '5 يوليو 2026 - 4:45 م',
        location: 'تم التوصيل للمستلم',
        lastEvent: 'تم التوصيل بنجاح',
        events: [
            { date: '5 يوليو 2026 - 4:45 م', status: 'تم التوصيل بنجاح', location: 'العنوان: ١٥ شارع النيل - المعادي' },
            { date: '5 يوليو 2026 - 9:20 ص', status: 'خرجت الشحنة للتوصيل', location: 'مركز توزيع المعادي' },
            { date: '4 يوليو 2026 - 2:00 م', status: 'وصلت إلى مركز التوزيع', location: 'مركز توزيع المعادي' },
            { date: '3 يوليو 2026 - 11:30 ص', status: 'الشحنة في الطريق', location: 'القاهرة' },
            { date: '30 يونيو 2026 - 8:00 ص', status: 'تم استلام الشحنة من المرسل', location: 'مستودع البائع - القاهرة' }
        ]
    },
    'EE112233445EG': {
        trackingNumber: 'EE112233445EG',
        status: 'pending',
        statusText: 'قيد المعالجة',
        lastUpdate: '7 يوليو 2026 - 9:00 ص',
        location: 'مستودع البائع',
        lastEvent: 'تم استلام طلب الشحن',
        events: [
            { date: '7 يوليو 2026 - 9:00 ص', status: 'تم استلام طلب الشحن', location: 'مستودع البائع' },
            { date: '6 يوليو 2026 - 3:00 م', status: 'تم تأكيد الطلب', location: 'نظام ميلانو OTC' }
        ]
    }
};

// ===== DOM Elements =====
const trackingForm = document.getElementById('trackingForm');
const trackingInput = document.getElementById('trackingNumber');
const trackBtn = document.getElementById('trackBtn');
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

// ===== Event Listeners =====
if (trackingForm) {
    trackingForm.addEventListener('submit', function(e) {
        e.preventDefault();
        trackPackage();
    });
}

if (closeResult) {
    closeResult.addEventListener('click', function() {
        trackingResult.classList.add('hidden');
        resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ===== Retry =====
function retryTracking() {
    trackPackage();
}

// ===== Tracking Function =====
async function trackPackage() {
    const trackingNumber = trackingInput.value.trim().toUpperCase();

    if (!trackingNumber) {
        showError('الرجاء إدخال رقم التتبع');
        shakeInput();
        return;
    }

    if (trackingNumber.length < 10) {
        showError('رقم التتبع يجب أن يكون على الأقل 10 أحرف');
        shakeInput();
        return;
    }

    hideAll();
    loadingSpinner.classList.remove('hidden');

    await new Promise(resolve => setTimeout(resolve, 1500));

    // Check local demo data first, then show demo for any number
    if (trackingData[trackingNumber]) {
        displayResults(trackingData[trackingNumber]);
    } else {
        displayDemoData(trackingNumber);
    }
}

// ===== Fetch from Egypt Post =====
async function fetchFromEgyptPost(trackingNumber) {
    return null;
}

// ===== Display Demo Data =====
function displayDemoData(trackingNumber) {
    const now = new Date();
    const demoData = {
        trackingNumber: trackingNumber,
        status: 'in-transit',
        statusText: 'في الطريق',
        lastUpdate: now.toLocaleString('ar-EG'),
        location: 'مركز توزيع',
        lastEvent: 'تم استلام الشحنة',
        events: [
            { date: now.toLocaleString('ar-EG'), status: 'تم استلام الشحنة', location: 'مركز التوزيع' }
        ]
    };
    displayResults(demoData);
}

// ===== Display Results =====
function displayResults(data) {
    hideAll();

    resultTrackingNumber.textContent = data.trackingNumber;
    resultStatus.textContent = data.statusText;
    resultStatus.className = 'result-status ' + data.status;
    resultLastUpdate.textContent = data.lastUpdate;
    resultLocation.textContent = data.location;
    if (resultLastEvent) resultLastEvent.textContent = data.lastEvent;

    // Render timeline
    trackingEvents.innerHTML = '';
    data.events.forEach((event, index) => {
        const el = document.createElement('div');
        el.className = 'timeline-event';
        el.style.animationDelay = (index * 0.1) + 's';
        el.innerHTML = `
            <div class="event-date"><i class="fas fa-clock"></i> ${event.date}</div>
            <div class="event-status">${event.status}</div>
            <div class="event-location"><i class="fas fa-map-marker-alt"></i> ${event.location}</div>
        `;
        trackingEvents.appendChild(el);
    });

    trackingResult.classList.remove('hidden');
    trackingResult.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ===== Show Error =====
function showError(message) {
    hideAll();
    errorText.textContent = message;
    errorMessage.classList.remove('hidden');
}

// ===== Hide All =====
function hideAll() {
    trackingResult.classList.add('hidden');
    loadingSpinner.classList.add('hidden');
    errorMessage.classList.add('hidden');
}

// ===== Shake Input =====
function shakeInput() {
    if (trackingInput) {
        trackingInput.style.animation = 'none';
        void trackingInput.offsetHeight;
        trackingInput.style.animation = 'shake 0.4s ease';
        setTimeout(() => trackingInput.style.animation = '', 500);
    }
}

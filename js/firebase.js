// Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyCeKmOHzwu5kCE-Z8dPhouelwUuV71MMZI",
    authDomain: "milano-otc.firebaseapp.com",
    projectId: "milano-otc",
    storageBucket: "milano-otc.firebasestorage.app",
    messagingSenderId: "675063391861",
    appId: "1:675063391861:web:abdcf59cb57366d830fa3c",
    measurementId: "G-KHYWCM7ZFW"
};

let db = null;
let firebaseReady = false;

async function initFirebase() {
    if (db && firebaseReady) return db;

    try {
        if (typeof firebase === 'undefined') {
            console.warn('[FB] firebase not found, loading SDK...');
            await loadScript('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
            await loadScript('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js');
        }

        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        db = firebase.firestore();
        firebaseReady = true;
        console.log('[FB] Firestore connected ✓');
        updateConnectionStatus('connected');
        return db;
    } catch(e) {
        console.error('[FB] init FAILED:', e.message || e);
        db = null;
        firebaseReady = false;
        updateConnectionStatus('error');
        throw e;
    }
}

function updateConnectionStatus(status) {
    const el = document.getElementById('connectionStatus');
    if (!el) return;
    const now = new Date().toLocaleTimeString('ar-EG');
    if (status === 'connected') {
        el.innerHTML = '<i class="fas fa-circle" style="color:#10b981;font-size:8px;margin-left:4px;"></i> متصل — مزامنة لحظية | آخر تحديث: ' + now;
        el.style.background = '#d1fae5';
        el.style.color = '#065f46';
    } else if (status === 'error') {
        el.innerHTML = '<i class="fas fa-exclamation-triangle" style="color:#ef4444;font-size:10px;margin-left:4px;"></i> خطأ في الاتصال — جاري إعادة المحاولة...';
        el.style.background = '#fee2e2';
        el.style.color = '#991b1b';
    }
}

function loadScript(src) {
    return new Promise((resolve, reject) => {
        if (document.querySelector('script[src="' + src + '"]')) { resolve(); return; }
        const s = document.createElement('script');
        s.src = src;
        s.onload = resolve;
        s.onerror = () => reject(new Error('Failed to load: ' + src));
        document.head.appendChild(s);
    });
}

function fbListen(col, callback, retryCount) {
    retryCount = retryCount || 0;
    initFirebase().then(database => {
        console.log('[FB] onSnapshot listening:', col);
        database.collection(col).onSnapshot(snap => {
            const data = snap.docs.map(d => ({ _fbId: d.id, ...d.data() }));
            data.sort((a, b) => {
                const ta = a.createdAt && a.createdAt.toMillis ? a.createdAt.toMillis() : 0;
                const tb = b.createdAt && b.createdAt.toMillis ? b.createdAt.toMillis() : 0;
                return tb - ta;
            });
            console.log('[FB] onSnapshot received:', col, data.length, 'docs');
            callback(data);
            updateConnectionStatus('connected');
        }, err => {
            console.error('[FB] onSnapshot ERROR:', col, err.code, err.message);
            updateConnectionStatus('error');
            if (retryCount < 5) {
                setTimeout(() => fbListen(col, callback, retryCount + 1), 3000);
            }
        });
    }).catch(err => {
        console.error('[FB] init ERROR:', col, err.message || err);
        updateConnectionStatus('error');
        if (retryCount < 5) {
            setTimeout(() => fbListen(col, callback, retryCount + 1), 3000);
        }
    });
}

async function fbGet(collection) {
    const database = await initFirebase();
    const snap = await database.collection(collection).get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function fbAdd(collection, data) {
    const database = await initFirebase();
    data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
    const ref = await database.collection(collection).add(data);
    return ref.id;
}

async function fbUpdate(collection, id, data) {
    const database = await initFirebase();
    await database.collection(collection).doc(id).update(data);
}

async function fbDelete(collection, id) {
    const database = await initFirebase();
    await database.collection(collection).doc(id).delete();
}

async function fbGetWhere(collection, field, op, value) {
    const database = await initFirebase();
    const snap = await database.collection(collection).where(field, op, value).get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

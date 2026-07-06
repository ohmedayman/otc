// ===== Admin Dashboard JS =====

const orderForm = document.getElementById('orderForm');
const ordersTableBody = document.getElementById('ordersTableBody');
const noOrders = document.getElementById('noOrders');
const searchInput = document.getElementById('searchInput');
const filterStatus = document.getElementById('filterStatus');
const editModal = document.getElementById('editModal');
const editForm = document.getElementById('editForm');
const alertMessage = document.getElementById('alertMessage');

// ===== Init =====
document.addEventListener('DOMContentLoaded', () => {
    loadOrders();
    updateStats();
    orderForm.addEventListener('submit', handleAddOrder);
    editForm.addEventListener('submit', handleEditOrder);
    searchInput.addEventListener('input', filterOrders);
    filterStatus.addEventListener('change', filterOrders);
});

// ===== Storage =====
const getOrders = () => JSON.parse(localStorage.getItem('milanoOrders') || '[]');
const saveOrders = o => localStorage.setItem('milanoOrders', JSON.stringify(o));

// ===== Load & Render =====
function loadOrders() { renderOrders(getOrders()); }

function renderOrders(orders) {
    ordersTableBody.innerHTML = '';
    if (!orders.length) { noOrders.classList.remove('hidden'); return; }
    noOrders.classList.add('hidden');
    orders.forEach(o => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${esc(o.customerName)}</td>
            <td>${esc(o.customerPhone)}</td>
            <td><code style="font-weight:700;letter-spacing:1px;">${esc(o.trackingNumber)}</code></td>
            <td><span class="status-badge ${o.status}">${statusText(o.status)}</span></td>
            <td>${o.createdAt||'-'}</td>
            <td>
                <div class="btn-group">
                    <button class="btn btn-view" onclick="openWhatsApp('${esc(o.customerPhone)}','${esc(o.trackingNumber)}','${esc(o.status)}')" title="واتساب"><i class="fab fa-whatsapp"></i></button>
                    <button class="btn btn-edit" onclick="editOrder(${o.id})" title="تعديل"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-delete" onclick="delOrder(${o.id})" title="حذف"><i class="fas fa-trash"></i></button>
                </div>
            </td>`;
        ordersTableBody.appendChild(tr);
    });
}

// ===== Add =====
function handleAddOrder(e) {
    e.preventDefault();
    const data = {
        customerName: document.getElementById('customerName').value.trim(),
        customerPhone: document.getElementById('customerPhone').value.trim(),
        trackingNumber: document.getElementById('trackingNumber').value.trim().toUpperCase(),
        status: document.getElementById('orderStatus').value,
        address: document.getElementById('orderAddress').value.trim(),
        notes: document.getElementById('orderNotes').value.trim(),
        value: document.getElementById('orderValue').value || 0
    };
    if (data.trackingNumber.length < 10) { showAlert('error', 'رقم التتبع يجب أن يكون على الأقل 10 أحرف'); return; }
    const orders = getOrders();
    if (orders.some(o => o.trackingNumber === data.trackingNumber)) { showAlert('error', 'رقم التتبع مسجل بالفعل'); return; }
    data.id = Date.now(); data.createdAt = new Date().toLocaleString('ar-EG');
    orders.push(data); saveOrders(orders);
    orderForm.reset(); loadOrders(); updateStats();
    showAlert('success', 'تم إضافة الطلب بنجاح');
}

// ===== Edit =====
function handleEditOrder(e) {
    e.preventDefault();
    const id = parseInt(document.getElementById('editOrderId').value);
    const orders = getOrders();
    const i = orders.findIndex(o => o.id === id);
    if (i !== -1) {
        orders[i] = { ...orders[i],
            customerName: document.getElementById('editCustomerName').value.trim(),
            customerPhone: document.getElementById('editCustomerPhone').value.trim(),
            trackingNumber: document.getElementById('editTrackingNumber').value.trim().toUpperCase(),
            status: document.getElementById('editOrderStatus').value,
            address: document.getElementById('editOrderAddress').value.trim(),
            notes: document.getElementById('editOrderNotes').value.trim(),
            value: document.getElementById('editOrderValue').value || 0
        };
        saveOrders(orders); closeModal(); loadOrders(); updateStats();
        showAlert('success', 'تم تعديل الطلب بنجاح');
    }
}

function editOrder(id) {
    const o = getOrders().find(x => x.id === id);
    if (!o) return;
    document.getElementById('editOrderId').value = o.id;
    document.getElementById('editCustomerName').value = o.customerName;
    document.getElementById('editCustomerPhone').value = o.customerPhone;
    document.getElementById('editTrackingNumber').value = o.trackingNumber;
    document.getElementById('editOrderStatus').value = o.status;
    document.getElementById('editOrderAddress').value = o.address;
    document.getElementById('editOrderNotes').value = o.notes || '';
    document.getElementById('editOrderValue').value = o.value || '';
    editModal.classList.add('active');
}

function delOrder(id) {
    if (!confirm('هل أنت متأكد من حذف هذا الطلب؟')) return;
    saveOrders(getOrders().filter(o => o.id !== id));
    loadOrders(); updateStats(); showAlert('success', 'تم حذف الطلب بنجاح');
}

function closeModal() { editModal.classList.remove('active'); }

// ===== Filter =====
function filterOrders() {
    let orders = getOrders();
    const s = searchInput.value.toLowerCase();
    if (s) orders = orders.filter(o => o.customerName.toLowerCase().includes(s) || o.trackingNumber.toLowerCase().includes(s) || o.customerPhone.includes(s));
    if (filterStatus.value) orders = orders.filter(o => o.status === filterStatus.value);
    renderOrders(orders);
}

// ===== Stats =====
function updateStats() {
    const orders = getOrders();
    const total = orders.length;
    const transit = orders.filter(o => o.status === 'in-transit').length;
    const delivered = orders.filter(o => o.status === 'delivered').length;
    const pending = orders.filter(o => o.status === 'pending').length;

    document.getElementById('statTotal').textContent = total;
    document.getElementById('statTransit').textContent = transit;
    document.getElementById('statDelivered').textContent = delivered;
    document.getElementById('statPending').textContent = pending;

    // Progress bars
    const pct = n => total ? Math.round((n / total) * 100) : 0;
    setTimeout(() => {
        document.getElementById('barTotal').style.width = '100%';
        document.getElementById('barTransit').style.width = pct(transit) + '%';
        document.getElementById('barDelivered').style.width = pct(delivered) + '%';
        document.getElementById('barPending').style.width = pct(pending) + '%';
    }, 200);
}

// ===== WhatsApp =====
function openWhatsApp(phone, tracking, status) {
    const statusMap = { 'pending':'قيد المعالجة', 'in-transit':'في الطريق', 'delivered':'تم التوصيل', 'exception':'مشكلة في التوصيل' };
    const msg = `مرحباً,\n\nتتبع طلبك:\nرقم التتبع: ${tracking}\nالحالة: ${statusMap[status]||status}\n\nتتبع شحنتك من هنا:\nhttps://otc.milanof16.com/?track=${tracking}`;
    document.getElementById('whatsappPhone').value = phone;
    document.getElementById('whatsappTracking').value = tracking;
    document.getElementById('whatsappMessage').value = msg;
    document.getElementById('whatsappSend').href = `https://wa.me/${phone.startsWith('0') ? '20'+phone.slice(1) : phone}?text=${encodeURIComponent(msg)}`;
    document.getElementById('whatsappModal').classList.add('active');
}

// ===== Export Excel =====
function exportToExcel() {
    const orders = getOrders();
    if (!orders.length) { showAlert('warning', 'لا توجد طلبات للتصدير'); return; }

    const statusMap = { 'pending':'قيد المعالجة', 'in-transit':'في الطريق', 'delivered':'تم التوصيل', 'exception':'مشكلة في التوصيل' };
    const rows = orders.map(o => [o.customerName, o.customerPhone, o.trackingNumber, statusMap[o.status]||o.status, o.address||'', o.notes||'', o.value||0, o.createdAt||'']);

    let csv = '\uFEFF' + 'اسم العميل,رقم الهاتف,رقم التتبع,الحالة,العنوان,ملاحظات,القيمة,التاريخ\n';
    rows.forEach(r => { csv += r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',') + '\n'; });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `milano-orders-${new Date().toLocaleDateString('ar-EG')}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showAlert('success', 'تم تصدير الملف بنجاح');
}

// ===== Helpers =====
function statusText(s) { return { 'pending':'قيد المعالجة', 'in-transit':'في الطريق', 'delivered':'تم التوصيل', 'exception':'مشكلة في التوصيل' }[s]||s; }
function esc(t) { const d = document.createElement('div'); d.textContent = t; return d.innerHTML; }
function showAlert(type, msg) {
    alertMessage.className = 'alert alert-' + type;
    alertMessage.innerHTML = `<i class="fas fa-${type==='success'?'check-circle':type==='error'?'exclamation-circle':'info-circle'}"></i><span>${msg}</span>`;
    alertMessage.classList.remove('hidden');
    setTimeout(() => alertMessage.classList.add('hidden'), 4000);
}

// ===== Admin Dashboard JavaScript =====

// ===== DOM Elements =====
const orderForm = document.getElementById('orderForm');
const ordersTableBody = document.getElementById('ordersTableBody');
const noOrders = document.getElementById('noOrders');
const searchInput = document.getElementById('searchInput');
const filterStatus = document.getElementById('filterStatus');
const editModal = document.getElementById('editModal');
const editForm = document.getElementById('editForm');
const alertMessage = document.getElementById('alertMessage');

// Stats elements
const totalOrdersEl = document.getElementById('totalOrders');
const inTransitEl = document.getElementById('inTransit');
const deliveredEl = document.getElementById('delivered');
const pendingEl = document.getElementById('pending');

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', function() {
    loadOrders();
    updateStats();
    
    // Event listeners
    orderForm.addEventListener('submit', handleAddOrder);
    editForm.addEventListener('submit', handleEditOrder);
    searchInput.addEventListener('input', filterOrders);
    filterStatus.addEventListener('change', filterOrders);
});

// ===== Load Orders =====
function loadOrders() {
    const orders = getOrdersFromStorage();
    renderOrders(orders);
    return orders;
}

// ===== Get Orders from Storage =====
function getOrdersFromStorage() {
    const orders = localStorage.getItem('milanoOrders');
    return orders ? JSON.parse(orders) : [];
}

// ===== Save Orders to Storage =====
function saveOrdersToStorage(orders) {
    localStorage.setItem('milanoOrders', JSON.stringify(orders));
}

// ===== Render Orders =====
function renderOrders(orders) {
    ordersTableBody.innerHTML = '';
    
    if (orders.length === 0) {
        noOrders.classList.remove('hidden');
        return;
    }
    
    noOrders.classList.add('hidden');
    
    orders.forEach(order => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${escapeHtml(order.customerName)}</td>
            <td>${escapeHtml(order.customerPhone)}</td>
            <td><strong>${escapeHtml(order.trackingNumber)}</strong></td>
            <td><span class="status-badge ${order.status}">${getStatusText(order.status)}</span></td>
            <td>${order.createdAt}</td>
            <td>
                <div class="btn-group">
                    <button class="btn btn-view" onclick="viewTracking('${escapeHtml(order.trackingNumber)}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-edit" onclick="editOrder(${order.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-delete" onclick="deleteOrder(${order.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        ordersTableBody.appendChild(row);
    });
}

// ===== Handle Add Order =====
function handleAddOrder(e) {
    e.preventDefault();
    
    const formData = {
        customerName: document.getElementById('customerName').value.trim(),
        customerPhone: document.getElementById('customerPhone').value.trim(),
        trackingNumber: document.getElementById('trackingNumber').value.trim().toUpperCase(),
        status: document.getElementById('orderStatus').value,
        address: document.getElementById('orderAddress').value.trim(),
        notes: document.getElementById('orderNotes').value.trim(),
        value: document.getElementById('orderValue').value || 0
    };
    
    // Validate tracking number format
    if (formData.trackingNumber.length < 10) {
        showAlert('error', 'رقم التتبع يجب أن يكون على الأقل 10 أحرف');
        return;
    }
    
    // Check if tracking number already exists
    const orders = getOrdersFromStorage();
    if (orders.some(order => order.trackingNumber === formData.trackingNumber)) {
        showAlert('error', 'رقم التتبع هذا مسجل بالفعل');
        return;
    }
    
    // Add new order
    formData.id = Date.now();
    formData.createdAt = new Date().toLocaleString('ar-EG');
    orders.push(formData);
    saveOrdersToStorage(orders);
    
    // Reset form and reload orders
    orderForm.reset();
    loadOrders();
    updateStats();
    showAlert('success', 'تم إضافة الطلب بنجاح');
}

// ===== Handle Edit Order =====
function handleEditOrder(e) {
    e.preventDefault();
    
    const orderId = parseInt(document.getElementById('editOrderId').value);
    const updatedData = {
        customerName: document.getElementById('editCustomerName').value.trim(),
        customerPhone: document.getElementById('editCustomerPhone').value.trim(),
        trackingNumber: document.getElementById('editTrackingNumber').value.trim().toUpperCase(),
        status: document.getElementById('editOrderStatus').value,
        address: document.getElementById('editOrderAddress').value.trim(),
        notes: document.getElementById('editOrderNotes').value.trim(),
        value: document.getElementById('editOrderValue').value || 0
    };
    
    const orders = getOrdersFromStorage();
    const index = orders.findIndex(order => order.id === orderId);
    
    if (index !== -1) {
        orders[index] = { ...orders[index], ...updatedData };
        saveOrdersToStorage(orders);
        closeModal();
        loadOrders();
        updateStats();
        showAlert('success', 'تم تعديل الطلب بنجاح');
    }
}

// ===== Edit Order =====
function editOrder(orderId) {
    const orders = getOrdersFromStorage();
    const order = orders.find(o => o.id === orderId);
    
    if (order) {
        document.getElementById('editOrderId').value = order.id;
        document.getElementById('editCustomerName').value = order.customerName;
        document.getElementById('editCustomerPhone').value = order.customerPhone;
        document.getElementById('editTrackingNumber').value = order.trackingNumber;
        document.getElementById('editOrderStatus').value = order.status;
        document.getElementById('editOrderAddress').value = order.address;
        document.getElementById('editOrderNotes').value = order.notes || '';
        document.getElementById('editOrderValue').value = order.value || '';
        
        editModal.classList.add('active');
    }
}

// ===== Delete Order =====
function deleteOrder(orderId) {
    if (confirm('هل أنت متأكد من حذف هذا الطلب؟')) {
        const orders = getOrdersFromStorage();
        const filteredOrders = orders.filter(order => order.id !== orderId);
        saveOrdersToStorage(filteredOrders);
        loadOrders();
        updateStats();
        showAlert('success', 'تم حذف الطلب بنجاح');
    }
}

// ===== View Tracking =====
function viewTracking(trackingNumber) {
    // Open main tracking page with the tracking number
    window.open(`../index.html?track=${trackingNumber}`, '_blank');
}

// ===== Close Modal =====
function closeModal() {
    editModal.classList.remove('active');
}

// ===== Filter Orders =====
function filterOrders() {
    const searchTerm = searchInput.value.toLowerCase();
    const statusFilter = filterStatus.value;
    
    let orders = getOrdersFromStorage();
    
    // Apply search filter
    if (searchTerm) {
        orders = orders.filter(order => 
            order.customerName.toLowerCase().includes(searchTerm) ||
            order.trackingNumber.toLowerCase().includes(searchTerm) ||
            order.customerPhone.includes(searchTerm)
        );
    }
    
    // Apply status filter
    if (statusFilter) {
        orders = orders.filter(order => order.status === statusFilter);
    }
    
    renderOrders(orders);
}

// ===== Update Stats =====
function updateStats() {
    const orders = getOrdersFromStorage();
    
    totalOrdersEl.textContent = orders.length;
    inTransitEl.textContent = orders.filter(o => o.status === 'in-transit').length;
    deliveredEl.textContent = orders.filter(o => o.status === 'delivered').length;
    pendingEl.textContent = orders.filter(o => o.status === 'pending').length;
}

// ===== Get Status Text =====
function getStatusText(status) {
    const statusMap = {
        'pending': 'قيد المعالجة',
        'in-transit': 'في الطريق',
        'delivered': 'تم التوصيل',
        'exception': 'مشكلة في التوصيل'
    };
    return statusMap[status] || status;
}

// ===== Show Alert =====
function showAlert(type, message) {
    alertMessage.className = `alert alert-${type}`;
    alertMessage.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    alertMessage.classList.remove('hidden');
    
    // Auto hide after 5 seconds
    setTimeout(() => {
        alertMessage.classList.add('hidden');
    }, 5000);
}

// ===== Escape HTML =====
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===== Check URL for tracking parameter =====
function checkUrlForTracking() {
    const urlParams = new URLSearchParams(window.location.search);
    const trackParam = urlParams.get('track');
    if (trackParam) {
        // Pre-fill tracking number on main page
        const trackingInput = document.getElementById('trackingNumber');
        if (trackingInput) {
            trackingInput.value = trackParam;
        }
    }
}

// Call this function on main page load
if (window.location.pathname.includes('index.html') && !window.location.pathname.includes('admin')) {
    document.addEventListener('DOMContentLoaded', checkUrlForTracking);
}

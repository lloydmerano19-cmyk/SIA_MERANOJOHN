/**
 * FoodHub Warehouse & Logistics System
 * All-Button-Functional Logic for Dashboard & Auth
 */

// Shipments State
const DEFAULT_SHIPMENTS = [
    {
        trackingNo: 'FH-001245',
        customer: 'Juan Dela Cruz',
        items: 'Food Package (x5)',
        status: 'In Transit',
        dateTime: 'Nov 22, 2026 • 10:24 AM',
        value: 2450.00,
        address: 'Warehouse Bay 4, Pasig Central Hub'
    },
    {
        trackingNo: 'FH-001244',
        customer: 'Maria Santos',
        items: 'Beverages (x3)',
        status: 'Delivered',
        dateTime: 'Nov 22, 2026 • 09:15 AM',
        value: 1280.00,
        address: 'BGC Taguig Branch Kitchen'
    },
    {
        trackingNo: 'FH-001243',
        customer: 'Pedro Reyes',
        items: 'Snacks (x8)',
        status: 'Preparing',
        dateTime: 'Nov 22, 2026 • 08:42 AM',
        value: 3100.00,
        address: 'Ortigas Food Terminal Bay 2'
    },
    {
        trackingNo: 'FH-001242',
        customer: 'Ana Garcia',
        items: 'Frozen Foods (x4)',
        status: 'Pending',
        dateTime: 'Nov 22, 2026 • 08:10 AM',
        value: 4600.00,
        address: 'Makati Central Cold Depot'
    },
    {
        trackingNo: 'FH-001241',
        customer: 'Luis Lim',
        items: 'Groceries (x6)',
        status: 'Delivered',
        dateTime: 'Nov 21, 2026 • 04:32 PM',
        value: 2890.00,
        address: 'Quezon City Distribution Gate 1'
    }
];

// Inventory Items State
const DEFAULT_INVENTORY = [
    { sku: 'INV-101', name: 'Prime Beef Burger Patties (Case x100)', zone: 'Deep Freeze Bay A', stock: 1450, status: 'In Stock' },
    { sku: 'INV-102', name: 'Mozzarella Block Cheese (Crate 10kg)', zone: 'Cold Room 2', stock: 820, status: 'In Stock' },
    { sku: 'INV-103', name: 'Jasmine Rice Sacks (50kg)', zone: 'Dry Ambient Bay D', stock: 3200, status: 'In Stock' },
    { sku: 'INV-104', name: 'Fresh Culinary Dairy Cream (12x 1L)', zone: 'Cold Room 1', stock: 640, status: 'Low Stock' },
    { sku: 'INV-105', name: 'Eco-Kraft Food Cartons (Bundle x500)', zone: 'Packaging Bay P', stock: 2450, status: 'In Stock' }
];
const LOW_STOCK_THRESHOLD = 700;

const CLIENT_PRODUCTS = [
    { sku: 'INV-101', name: 'Prime Beef Burger Patties (Case x100)', category: 'Meat', price: 4200 },
    { sku: 'INV-102', name: 'Mozzarella Block Cheese (Crate 10kg)', category: 'Dairy', price: 3600 },
    { sku: 'INV-103', name: 'Jasmine Rice Sacks (50kg)', category: 'Grains', price: 2850 },
    { sku: 'INV-104', name: 'Fresh Culinary Dairy Cream (12x 1L)', category: 'Dairy', price: 1450 }
];

// Customers State
const DEFAULT_CUSTOMERS = [
    { name: 'Juan Dela Cruz', phone: '0917-111-2233', branch: 'Pasig Central Hub', orders: 14 },
    { name: 'Maria Santos', phone: '0918-444-5566', branch: 'BGC Taguig Branch Kitchen', orders: 22 },
    { name: 'Pedro Reyes', phone: '0922-888-9900', branch: 'Ortigas Food Terminal', orders: 9 },
    { name: 'Ana Garcia', phone: '0915-333-7788', branch: 'Makati Cold Depot', orders: 31 },
    { name: 'Luis Lim', phone: '0920-666-1212', branch: 'QC Distribution Gate 1', orders: 18 }
];

// Accounts State
const DEFAULT_USERS = [
    { username: 'admin', email: 'admin@foodhub.com', password: 'admin123', name: 'Admin', role: 'Admin' },
    { username: 'staff', email: 'staff@foodhub.com', password: 'staff123', name: 'Staff Officer', role: 'Staff' }
];

// LocalStorage Store Wrapper
class Store {
    static get(key, fallback) {
        try {
            const data = localStorage.getItem(`fhwms_${key}`);
            return data ? JSON.parse(data) : fallback;
        } catch (e) {
            return fallback;
        }
    }

    static set(key, value) {
        try {
            localStorage.setItem(`fhwms_${key}`, JSON.stringify(value));
        } catch (e) {}
    }
}

// Runtime App State
let shipments = Store.get('shipments', DEFAULT_SHIPMENTS);
let inventory = Store.get('inventory', DEFAULT_INVENTORY);
let customers = Store.get('customers', DEFAULT_CUSTOMERS);
let users = Store.get('users', DEFAULT_USERS);
let auditLogs = Store.get('auditLogs', []);
let stockReceipts = Store.get('stockReceipts', []);
let customerCarts = Store.get('customerCarts', {});
let clientOrders = Store.get('clientOrders', []);
let paymentRecords = Store.get('paymentRecords', []);

if (!customerCarts || typeof customerCarts !== 'object' || Array.isArray(customerCarts)) customerCarts = {};
if (!Array.isArray(clientOrders)) clientOrders = [];
if (!Array.isArray(paymentRecords)) paymentRecords = [];

// Keep Admin and Staff as the only privileged accounts.
users = users.map(user => {
    const username = (user.username || '').trim().toLowerCase();
    const storedEmail = (user.email || (username.includes('@') ? user.username : '') || '').trim().toLowerCase();
    if (username === 'admin' || user.role === 'Admin') {
        return { ...user, username: 'admin', email: storedEmail || 'admin@foodhub.com', role: 'Admin' };
    }
    if (user.role === 'Staff') {
        return { ...user, username, email: storedEmail || 'staff@foodhub.com', role: 'Staff' };
    }
    return { ...user, username: user.username || '', email: storedEmail, role: 'Customer' };
}).filter((user, index, list) =>
    list.findIndex(item => item.username.toLowerCase() === user.username.toLowerCase()) === index
);
Store.set('users', users);

// Set default logged in user to Admin so it is automatically logged in upon opening
let currentUser = null;
let activeTab = 'dashboard';

// On Document Ready
document.addEventListener('DOMContentLoaded', () => {
    initClock();
    showAuthScreen();
});

// Real-time Clock
function initClock() {
    function update() {
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
        const dateStr = 'Today ' + now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        
        const clockEl = document.getElementById('live-clock');
        const dateEl = document.getElementById('current-date-label');
        if (clockEl) clockEl.innerText = timeStr;
        if (dateEl) dateEl.innerText = dateStr;
    }
    update();
    setInterval(update, 1000);
}

// Auth Screen vs Dashboard View
function showAuthScreen() {
    const auth = document.getElementById('view-auth');
    const portal = document.getElementById('system-portal');
    if (auth) auth.classList.remove('hidden');
    if (portal) portal.classList.add('hidden');
    switchAuthTab('login');
}

function showDashboardView() {
    const auth = document.getElementById('view-auth');
    const portal = document.getElementById('system-portal');
    if (auth) auth.classList.add('hidden');
    if (portal) portal.classList.remove('hidden');

    const heroUser = document.getElementById('hero-username');
    const headerUser = document.getElementById('logged-username');
    const clockUserRole = document.getElementById('clock-user-role');
    const dropdownRole = document.getElementById('dropdown-user-role');

    const name = currentUser ? (currentUser.name || currentUser.username) : 'Admin';
    const role = currentUser ? currentUser.role : 'Admin';
    const roleLabel = role === 'Customer' ? 'Client' : role;

    if (heroUser) heroUser.innerText = name;
    if (headerUser) headerUser.innerText = name;
    if (clockUserRole) clockUserRole.innerText = roleLabel;
    if (dropdownRole) dropdownRole.innerText = `${roleLabel} (${name})`;

    renderShipmentsTable();
    populateProfileForm();
    applyRoleRestrictions();
    renderStaffTaskSummary();
    if (currentUser && currentUser.role === 'Customer') renderClientDashboard();
}

function applyRoleRestrictions() {
    const isAdmin = currentUser && currentUser.role === 'Admin';
    const isStaff = currentUser && currentUser.role === 'Staff';
    const isClient = currentUser && currentUser.role === 'Customer';
    const reportsNavLabel = document.getElementById('reports-nav-label');
    if (reportsNavLabel) reportsNavLabel.innerText = isStaff ? 'My Reports' : 'Reports';

    document.querySelectorAll('.operations-only-nav').forEach(element => {
        element.classList.toggle('hidden', Boolean(isClient));
    });
    document.querySelectorAll('.client-only-nav').forEach(element => {
        element.classList.toggle('hidden', !isClient);
    });
    if (isClient) {
        document.querySelectorAll('.operations-panel').forEach(element => element.classList.add('hidden'));
    } else {
        document.querySelectorAll('.client-only-panel').forEach(element => element.classList.add('hidden'));
    }
    const globalSearch = document.getElementById('global-search-input-container');
    const notificationsButton = document.getElementById('header-notifications');
    if (globalSearch) globalSearch.classList.toggle('hidden', Boolean(isClient));
    if (notificationsButton) notificationsButton.classList.toggle('hidden', Boolean(isClient));
    document.querySelectorAll('.admin-only-nav').forEach(element => {
        element.classList.toggle('hidden', !isAdmin);
    });
    document.querySelectorAll('.admin-only-content').forEach(element => {
        element.classList.toggle('hidden', !isAdmin);
    });
    document.querySelectorAll('.staff-only-nav').forEach(element => {
        element.classList.toggle('hidden', !isStaff);
    });

    const ordersNav = document.getElementById('nav-btn-orders');
    const warehousesNav = document.getElementById('nav-btn-warehouses');
    if (ordersNav) {
        ordersNav.innerHTML = '<i class="fa-solid fa-clipboard-list text-sm"></i> Manage Orders';
    }
    if (warehousesNav) {
        warehousesNav.innerHTML = `<i class="fa-solid fa-warehouse text-sm"></i> ${isStaff ? 'Warehouse Monitoring' : 'Warehouses'}`;
    }
    const inventoryNav = document.getElementById('nav-btn-inventory');
    if (inventoryNav) {
        inventoryNav.innerHTML = `<i class="fa-solid fa-boxes-stacked text-sm"></i> ${isStaff ? 'Inventory Management' : 'Inventory'}`;
    }
    const shipmentNav = document.getElementById('nav-btn-shipments');
    if (shipmentNav) {
        shipmentNav.innerHTML = `<i class="fa-solid fa-truck text-sm"></i> ${isStaff ? 'Shipment Management' : 'Shipments'}`;
    }
    const dashboardNav = document.getElementById('nav-btn-dashboard');
    if (dashboardNav) dashboardNav.innerHTML = '<i class="fa-solid fa-house text-sm"></i> Dashboard';
    const profileNav = document.getElementById('nav-btn-profile');
    if (profileNav) profileNav.innerHTML = '<i class="fa-solid fa-user-circle text-sm"></i> My Profile';

    document.querySelectorAll('.staff-admin-only').forEach(element => {
        element.classList.toggle('hidden', !isAdmin);
    });

    document.querySelectorAll('.staff-admin-create').forEach(element => {
        element.classList.toggle('hidden', !isAdmin);
    });

    document.querySelectorAll('.staff-only-report').forEach(element => {
        element.classList.toggle('hidden', isAdmin ? false : false);
    });

    if (isStaff) {
        const limitedCards = document.querySelectorAll('.staff-limited-finance');
        limitedCards.forEach(card => card.classList.add('hidden'));

        const printReport = document.getElementById('print-report-button');
        if (printReport) printReport.classList.add('hidden');
    } else {
        document.querySelectorAll('.staff-limited-finance').forEach(card => card.classList.remove('hidden'));
    }

    if (isStaff) {
        const dashboardPanel = document.getElementById('panel-dashboard');
        if (dashboardPanel) dashboardPanel.classList.remove('hidden');
    }

    const staffTaskCard = document.getElementById('staff-daily-tasks');
    if (staffTaskCard) staffTaskCard.classList.toggle('hidden', !isStaff);

    const dashboardHeading = document.getElementById('dashboard-greeting');
    if (dashboardHeading) dashboardHeading.innerText = isStaff ? 'Staff Operations Dashboard' : 'Keep Your Food Moving Forward';
    const reportTitle = document.getElementById('reports-title');
    if (reportTitle) reportTitle.innerText = isStaff ? 'Operational Reports' : 'Operational Performance & Turnover';
    const staffReportSummary = document.getElementById('staff-report-summary');
    if (staffReportSummary) staffReportSummary.classList.toggle('hidden', !isStaff);
    const reportSubtitle = document.getElementById('reports-subtitle');
    if (reportSubtitle) {
        reportSubtitle.innerText = isStaff
            ? 'Inventory, order, and shipment activity reports'
            : 'Monthly logistics freight, delivery success rates, and audit logs';
    }
    if (isStaff) {
        const pending = shipments.filter(shipment => ['Pending', 'Preparing', 'Ready for Dispatch'].includes(shipment.status)).length;
        const lowStock = inventory.filter(item => Number(item.stock) <= LOW_STOCK_THRESHOLD).length;
        const secondLabel = document.getElementById('report-second-label');
        const secondValue = document.getElementById('report-second-value');
        const secondCaption = document.getElementById('report-second-caption');
        const thirdLabel = document.getElementById('report-third-label');
        const thirdValue = document.getElementById('report-third-value');
        const thirdCaption = document.getElementById('report-third-caption');
        if (secondLabel) secondLabel.innerText = 'Open Orders';
        if (secondValue) secondValue.innerText = pending;
        if (secondCaption) secondCaption.innerText = 'Orders awaiting preparation or dispatch';
        if (thirdLabel) thirdLabel.innerText = 'Low Stock Products';
        if (thirdValue) thirdValue.innerText = lowStock;
        if (thirdCaption) thirdCaption.innerText = `Threshold: ${LOW_STOCK_THRESHOLD} units or less`;
    } else {
        const secondLabel = document.getElementById('report-second-label');
        const secondValue = document.getElementById('report-second-value');
        const secondCaption = document.getElementById('report-second-caption');
        const thirdLabel = document.getElementById('report-third-label');
        const thirdValue = document.getElementById('report-third-value');
        const thirdCaption = document.getElementById('report-third-caption');
        if (secondLabel) secondLabel.innerText = 'On-Time Transit Rate';
        if (secondValue) secondValue.innerText = '98.6%';
        if (secondCaption) secondCaption.innerText = 'Zero temperature breach recorded';
        if (thirdLabel) thirdLabel.innerText = 'Dispatched Cargo Ton';
        if (thirdValue) thirdValue.innerText = '42.8 Tons';
        if (thirdCaption) thirdCaption.innerText = 'FoodHub Metro Manila Network';
    }
}

function renderStaffTaskSummary() {
    const pending = shipments.filter(shipment => ['Pending', 'Preparing', 'Ready for Dispatch'].includes(shipment.status)).length;
    const lowStock = inventory.filter(item => Number(item.stock) <= LOW_STOCK_THRESHOLD).length;
    const incoming = shipments.filter(shipment => ['Pending', 'Preparing', 'In Transit'].includes(shipment.status)).length;
    const taskCount = pending + lowStock + incoming;

    const values = {
        'staff-task-count': taskCount,
        'staff-pending-count': pending,
        'staff-low-stock-count': lowStock,
        'staff-incoming-count': incoming
    };
    Object.keys(values).forEach(id => {
        const element = document.getElementById(id);
        if (element) element.innerText = values[id];
    });
}

function populateProfileForm() {
    if (!currentUser) return;

    const nameInput = document.getElementById('profile-name');
    const emailInput = document.getElementById('profile-email');
    const roleInput = document.getElementById('profile-role');
    const passwordInput = document.getElementById('profile-password');

    if (nameInput) nameInput.value = currentUser.name || '';
    if (emailInput) emailInput.value = currentUser.email || (currentUser.username && currentUser.username.includes('@') ? currentUser.username : '');
    if (roleInput) roleInput.value = currentUser.role === 'Customer' ? 'Client' : (currentUser.role || '');
    if (passwordInput) passwordInput.value = '';
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function saveProfile(e) {
    if (e) e.preventDefault();
    if (!currentUser) return;

    const name = document.getElementById('profile-name').value.trim();
    const email = document.getElementById('profile-email').value.trim().toLowerCase();
    const newPassword = document.getElementById('profile-password').value.trim();
    const oldUsername = currentUser.username || '';

    if (!name || !email) {
        showToast('Name and email are required.', 'error');
        return;
    }
    if (!isValidEmail(email)) {
        showToast('Enter a valid email address.', 'error');
        return;
    }

    const duplicate = users.find(user =>
        ((user.email || '').toLowerCase() === email || user.username.toLowerCase() === email) &&
        user.username.toLowerCase() !== oldUsername.toLowerCase()
    );
    if (duplicate) {
        showToast('That email address is already registered.', 'error');
        return;
    }

    currentUser.name = name;
    currentUser.email = email;
    if (newPassword) currentUser.password = newPassword;

    let accountIndex = users.findIndex(user =>
        user.username.toLowerCase() === oldUsername.toLowerCase()
    );
    if (accountIndex < 0 && (oldUsername === 'admin' || oldUsername === 'staff')) {
        accountIndex = users.findIndex(user =>
            user.username === oldUsername && user.role === currentUser.role
        );
    }
    if (accountIndex >= 0) {
        users[accountIndex] = { ...users[accountIndex], ...currentUser };
        Store.set('users', users);
    }

    Store.set('currentUser', currentUser);
    addAuditLog(newPassword ? 'Updated profile email and changed password' : 'Updated profile email');
    showDashboardView();
    showToast('Profile updated successfully!');
}

function saveStaffAccount(e) {
    if (e) e.preventDefault();
    if (!currentUser || currentUser.role !== 'Admin') {
        showToast('Only Admin can manage the Staff account.', 'error');
        return;
    }

    const nameInput = document.getElementById('staff-account-name');
    const usernameInput = document.getElementById('staff-account-username');
    const passwordInput = document.getElementById('staff-account-password');
    const name = nameInput.value.trim();
    const username = usernameInput.value.trim().toLowerCase();
    const password = passwordInput.value.trim();

    if (name.length < 2) {
        showToast('Staff name must be at least 2 characters.', 'error');
        return;
    }
    if (username.length < 3) {
        showToast('Staff username must be at least 3 characters.', 'error');
        return;
    }
    if (password.length < 6) {
        showToast('Staff password must be at least 6 characters.', 'error');
        return;
    }
    if (username === 'admin') {
        showToast('Admin username is reserved.', 'error');
        return;
    }

    const duplicate = users.find(user =>
        user.role === 'Customer' && user.username.toLowerCase() === username
    );
    if (duplicate) {
        showToast('That username is already used by a Customer account.', 'error');
        return;
    }

    const existingStaff = users.find(user => user.role === 'Staff');
    const staffEmail = existingStaff ? existingStaff.email : 'staff@foodhub.com';
    const emailConflict = users.find(user =>
        user.role !== 'Staff' && (user.email || '').toLowerCase() === staffEmail.toLowerCase()
    );
    if (emailConflict) {
        showToast('The Staff email is already used by a Client account.', 'error');
        return;
    }

    const staffAccount = { username, email: staffEmail, password, name, role: 'Staff' };
    users = users.filter(user => user.role !== 'Staff');
    users.push(staffAccount);
    Store.set('users', users);
    addAuditLog('Created or updated the Staff account');

    if (currentUser.role === 'Staff') {
        currentUser = staffAccount;
        Store.set('currentUser', currentUser);
    }

    showToast('Staff account created and saved successfully!');
}

// Switch between Log In & Register form
function switchAuthTab(tab) {
    const loginForm = document.getElementById('auth-login-form');
    const regForm = document.getElementById('auth-register-form');
    const title = document.getElementById('auth-title');
    const subtitle = document.getElementById('auth-subtitle');

    if (tab === 'login') {
        loginForm.classList.remove('hidden');
        regForm.classList.add('hidden');
        title.innerText = 'Log In';
        subtitle.innerText = 'Access your account';
    } else {
        loginForm.classList.add('hidden');
        regForm.classList.remove('hidden');
        title.innerText = 'Register Account';
        subtitle.innerText = 'Create your logistics profile';
        validateRegistrationForm();
    }
}

function validateRegistrationForm(showErrors = false) {
    const nameInput = document.getElementById('reg-name');
    const emailInput = document.getElementById('reg-email');
    const passwordInput = document.getElementById('reg-password');
    const submitButton = document.getElementById('register-submit-button');
    const errorElement = document.getElementById('reg-validation-error');

    if (!nameInput || !emailInput || !passwordInput || !submitButton) return;

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    const isComplete = name.length >= 2 && isValidEmail(email) && password.length >= 6;

    submitButton.disabled = !isComplete;
    submitButton.className = isComplete
        ? 'w-full py-3 bg-[#ff6900] hover:bg-[#e65c00] text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg transition'
        : 'w-full py-3 bg-slate-300 text-slate-500 cursor-not-allowed font-bold text-xs sm:text-sm rounded-2xl shadow-lg transition';

    [nameInput, emailInput, passwordInput].forEach((input, index) => {
        const value = input.value.trim();
        const valid = index === 0 ? value.length >= 2 : index === 1 ? isValidEmail(value) : value.length >= 6;
        input.classList.remove('border-rose-500', 'ring-2', 'ring-rose-200');
        if (value && valid) {
            input.classList.add('border-slate-200');
        } else if (value) {
            input.classList.remove('border-slate-200');
            input.classList.add('border-rose-500', 'ring-2', 'ring-rose-200');
        } else {
            input.classList.remove('border-slate-200');
        }
    });

    if (!errorElement) return;

    if (showErrors && !isComplete) {
        let message = 'Please complete all registration fields.';
        if (!name) message = 'Full Name is required.';
        else if (!email) message = 'Email is required.';
        else if (!isValidEmail(email)) message = 'Enter a valid email address.';
        else if (!password) message = 'Password is required.';
        else if (password.length < 6) message = 'Password must be at least 6 characters.';
        else if (name.length < 2) message = 'Full Name must be at least 2 characters.';

        errorElement.innerText = message;
        errorElement.classList.remove('hidden');
    } else if (isComplete) {
        errorElement.classList.add('hidden');
    }
}

function validateRegistrationField(input) {
    if (!input) return;
    const value = input.value.trim();
    const valid = input.id === 'reg-name'
        ? value.length >= 2
        : input.id === 'reg-email'
            ? isValidEmail(value)
            : value.length >= 6;

    input.classList.remove('border-slate-200', 'border-rose-500', 'ring-2', 'ring-rose-200');
    if (!valid) {
        input.classList.add('border-rose-500', 'ring-2', 'ring-rose-200');
    } else {
        input.classList.add('border-slate-200');
    }

    const errorElement = document.getElementById('reg-validation-error');
    if (errorElement) {
        if (!valid) {
            errorElement.innerText = input.id === 'reg-name'
                ? 'Full Name is required and must be at least 2 characters.'
                : input.id === 'reg-email'
                    ? 'Enter a valid email address.'
                    : 'Password is required and must be at least 6 characters.';
            errorElement.classList.remove('hidden');
        } else {
            const name = document.getElementById('reg-name')?.value.trim() || '';
            const email = document.getElementById('reg-email')?.value.trim() || '';
            const password = document.getElementById('reg-password')?.value.trim() || '';
            if (name.length >= 2 && isValidEmail(email) && password.length >= 6) {
                errorElement.classList.add('hidden');
            }
        }
    }
}

function validateLoginForm(showErrors = true) {
    const usernameInput = document.getElementById('login-username');
    const passwordInput = document.getElementById('login-password');
    if (!usernameInput || !passwordInput) return;

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (showErrors) {
        if (!username) {
            markLoginFieldError(usernameInput);
            showLoginValidation('Email is required.');
        } else if (!password) {
            markLoginFieldError(passwordInput);
            showLoginValidation('Password is required.');
        } else {
            clearLoginValidation();
        }
    }
}

function markLoginFieldError(input) {
    if (!input) return;
    input.classList.remove('border-slate-200', 'focus:ring-[#ff6900]');
    input.classList.add('border-rose-500', 'ring-2', 'ring-rose-200');
}

function clearLoginValidation() {
    const usernameInput = document.getElementById('login-username');
    const passwordInput = document.getElementById('login-password');
    const errorElement = document.getElementById('login-validation-error');

    [usernameInput, passwordInput].forEach(input => {
        if (!input) return;
        input.classList.remove('border-rose-500', 'ring-2', 'ring-rose-200');
        input.classList.add('border-slate-200');
    });

    if (errorElement) errorElement.classList.add('hidden');
}

function clearLoginFieldError(input) {
    if (!input) return;
    input.classList.remove('border-rose-500', 'ring-2', 'ring-rose-200');
    input.classList.add('border-slate-200');

    const usernameInput = document.getElementById('login-username');
    const passwordInput = document.getElementById('login-password');
    if (usernameInput?.value.trim() && passwordInput?.value.trim()) {
        clearLoginValidation();
    }
}

function showLoginValidation(message) {
    const errorElement = document.getElementById('login-validation-error');
    if (!errorElement) return;
    errorElement.innerText = message;
    errorElement.classList.remove('hidden');
}

// Toggle password visibility
function togglePasswordVisibility() {
    const input = document.getElementById('login-password');
    const icon = document.getElementById('pwd-eye-icon');
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    }
}

// 1-Click Role Login
function quickFillAndLogin(u, p) {
    document.getElementById('login-username').value = u;
    document.getElementById('login-password').value = p;
    handleLogin(new Event('submit'));
}

// Handle Login
function handleLogin(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (e && e.stopPropagation) e.stopPropagation();

    const uInput = document.getElementById('login-username');
    const pInput = document.getElementById('login-password');
    
    const u = uInput ? uInput.value.trim().toLowerCase() : '';
    const p = pInput ? pInput.value.trim() : '';

    if (!u || !p) {
        showLoginValidation(!u ? 'Email is required.' : 'Password is required.');
        markLoginFieldError(!u ? uInput : pInput);
        return false;
    }

    const found = users.find(account =>
        account.password === p &&
        (account.username.toLowerCase() === u || (account.email || '').toLowerCase() === u)
    );
    if (!found) {
        showLoginValidation('Invalid email or password. Please register if you do not have an account.');
        markLoginFieldError(uInput);
        markLoginFieldError(pInput);
        return false;
    }
    currentUser = { ...found };

    Store.set('currentUser', currentUser);
    showDashboardView();
    navigate('dashboard');
    addAuditLog('Signed in');
    showToast(`Welcome, ${currentUser.name}! Naka-log in bilang ${currentUser.role === 'Customer' ? 'Client' : currentUser.role}.`);
    return false;
}

// Handle Register
function handleRegister(e) {
    e.preventDefault();
    validateRegistrationForm(true);

    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim().toLowerCase();
    const password = document.getElementById('reg-password').value.trim();

    if (!name || !email || !password) {
        showToast('Please fill in all required fields.', 'error');
        return;
    }
    if (name.length < 2) {
        showToast('Full Name must be at least 2 characters.', 'error');
        return;
    }
    if (!isValidEmail(email)) {
        showToast('Enter a valid email address.', 'error');
        return;
    }
    if (password.length < 6) {
        showToast('Password must be at least 6 characters.', 'error');
        return;
    }
    const role = 'Customer';
    const emailAlreadyUsed = users.some(account =>
        (account.email || '').toLowerCase() === email ||
        account.username.toLowerCase() === email
    );
    if (emailAlreadyUsed) {
        showToast('Email address already registered!', 'error');
        return;
    }

    const newUser = { username: email, email, password, name, role };
    users.push(newUser);
    Store.set('users', users);

    currentUser = newUser;
    Store.set('currentUser', currentUser);
    addAuditLog('Created a client account');
    showDashboardView();
    navigate('dashboard');
    showToast('Account registered successfully as Client!');
}

// Logout
function logoutToLanding() {
    addAuditLog('Signed out');
    currentUser = null;
    activeTab = 'dashboard';
    Store.set('currentUser', null);
    showAuthScreen();
    showToast('Signed out from FoodHub.');
}

function toggleUserDropdown() {
    const dd = document.getElementById('user-dropdown');
    if (dd) dd.classList.toggle('hidden');
}

function toggleMobileSidebar() {
    const sb = document.getElementById('sidebar-drawer');
    if (!sb) return;

    if (!sb.classList.contains('hidden')) {
        closeMobileSidebar();
        return;
    }

    sb.classList.remove('hidden');
    sb.classList.add('fixed', 'inset-y-0', 'left-0', 'shadow-2xl');
    document.getElementById('sidebar-backdrop')?.classList.remove('hidden');
    const toggleButton = document.getElementById('mobile-sidebar-toggle');
    if (toggleButton) {
        toggleButton.setAttribute('aria-expanded', 'true');
        toggleButton.setAttribute('aria-label', 'Close navigation');
    }
    document.body.classList.add('overflow-hidden');
}

function handleResponsiveSidebarResize() {
    if (window.matchMedia('(min-width: 768px)').matches) closeMobileSidebar();
}

function closeMobileSidebar() {
    const sb = document.getElementById('sidebar-drawer');
    if (sb) {
        sb.classList.add('hidden');
        sb.classList.remove('fixed', 'inset-y-0', 'left-0', 'shadow-2xl');
    }
    document.getElementById('sidebar-backdrop')?.classList.add('hidden');
    const toggleButton = document.getElementById('mobile-sidebar-toggle');
    if (toggleButton) {
        toggleButton.setAttribute('aria-expanded', 'false');
        toggleButton.setAttribute('aria-label', 'Open navigation');
    }
    document.body.classList.remove('overflow-hidden');
}

window.addEventListener('resize', handleResponsiveSidebarResize);

// Toast
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    const bgClass = type === 'success' ? 'bg-emerald-600' : type === 'error' ? 'bg-rose-600' : 'bg-slate-800';
    const icon = type === 'success' ? 'fa-circle-check' : type === 'error' ? 'fa-triangle-exclamation' : 'fa-bell';
    
    toast.className = `${bgClass} text-white px-5 py-3 rounded-2xl shadow-xl flex items-center space-x-3 text-xs sm:text-sm font-semibold transform transition duration-300 translate-y-2 pointer-events-auto border border-white/20`;
    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-4');
        setTimeout(() => toast.remove(), 300);
    }, 3200);
}

// Render Shipments Table (Matching Screenshot 1)
function renderShipmentsTable(filter = '') {
    const tbody = document.getElementById('dashboard-shipments-tbody');
    if (!tbody) return;

    let list = shipments;
    if (filter) {
        const q = filter.toLowerCase();
        list = list.filter(s => 
            s.trackingNo.toLowerCase().includes(q) ||
            s.customer.toLowerCase().includes(q) ||
            s.items.toLowerCase().includes(q) ||
            s.status.toLowerCase().includes(q)
        );
    }

    const statusBadgeMap = {
        'In Transit': 'bg-blue-50 text-blue-600 border border-blue-200',
        'Delivered': 'bg-emerald-50 text-emerald-600 border border-emerald-200',
        'Preparing': 'bg-orange-50 text-orange-600 border border-orange-200',
        'Ready for Dispatch': 'bg-violet-50 text-violet-600 border border-violet-200',
        'Pending': 'bg-slate-100 text-slate-600 border border-slate-200'
    };

    if (list.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="py-8 text-center text-slate-400">
                    No shipments found.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = list.map(item => `
        <tr class="hover:bg-slate-50 transition border-b border-slate-100">
            <td class="py-3.5 font-bold font-mono text-slate-800">${item.trackingNo}</td>
            <td class="py-3.5 font-medium text-slate-800">${item.customer}</td>
            <td class="py-3.5 text-slate-500">${item.items}</td>
            <td class="py-3.5">
                <span class="px-3 py-1 rounded-full text-[10px] font-bold ${statusBadgeMap[item.status] || 'bg-slate-100 text-slate-600'}">
                    ${item.status}
                </span>
            </td>
            <td class="py-3.5 text-slate-400 font-medium">${item.dateTime}</td>
            <td class="py-3.5 text-center">
                <button onclick="openShipmentDetails('${item.trackingNo}')" class="px-4 py-1.5 bg-[#ff6900] hover:bg-[#e65c00] text-white rounded-xl font-bold text-[11px] shadow-sm shadow-orange-500/20 transition transform active:scale-95">
                    View
                </button>
            </td>
        </tr>
    `).join('');
}

function filterDashboardShipments() {
    const q = document.getElementById('global-search').value;
    renderShipmentsTable(q);
}

function filterByStatus(statusName) {
    renderShipmentsTable(statusName);
    showToast(`Filtered by status: ${statusName}`);
}

function updateShipmentStatus(trackingNo, status) {
    if (!currentUser || (currentUser.role !== 'Staff' && currentUser.role !== 'Admin')) return;

    const shipment = shipments.find(item => item.trackingNo === trackingNo);
    const allowedStatuses = ['Pending', 'Preparing', 'Ready for Dispatch', 'In Transit', 'Delivered'];
    if (!shipment || !allowedStatuses.includes(status)) return;

    const previousStatus = shipment.status;
    shipment.status = status;
    Store.set('shipments', shipments);
    const clientOrder = clientOrders.find(order => order.trackingNo === trackingNo);
    if (clientOrder) {
        clientOrder.status = status;
        Store.set('clientOrders', clientOrders);
    }
    addAuditLog(`Updated shipment ${trackingNo} from ${previousStatus} to ${status}`);
    renderFullShipmentsTable();
    renderOrdersPanelTable();
    renderOrderPreparation();
    renderShipmentsTable();
    renderStaffTaskSummary();
    showToast(`Shipment ${trackingNo} updated to ${status}.`);
}

function processOrder(trackingNo) {
    if (!currentUser || !['Staff', 'Admin'].includes(currentUser.role)) return;
    const shipment = shipments.find(item => item.trackingNo === trackingNo);
    if (!shipment) return;

    const statusFlow = ['Pending', 'Preparing', 'Ready for Dispatch', 'In Transit', 'Delivered'];
    const currentStatusIndex = statusFlow.indexOf(shipment.status);
    if (currentStatusIndex < 0 || currentStatusIndex === statusFlow.length - 1) {
        showToast('This order has completed processing.', 'info');
        return;
    }
    const nextStatus = statusFlow[currentStatusIndex + 1];

    updateShipmentStatus(trackingNo, nextStatus);
}

// View Shipment Waybill Receipt Modal
function openShipmentDetails(trackingNo) {
    const item = shipments.find(s => s.trackingNo === trackingNo);
    if (!item) return;

    const receiptBox = document.getElementById('printable-receipt');
    receiptBox.innerHTML = `
        <div class="text-center pb-4 border-b border-dashed border-slate-300">
            <div class="w-10 h-10 rounded-xl bg-[#ff6900] text-white mx-auto flex items-center justify-center text-lg mb-2 shadow">
                <i class="fa-solid fa-cube"></i>
            </div>
            <h2 class="text-base font-black tracking-widest text-slate-900">FOODHUB LOGISTICS</h2>
            <p class="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Official Waybill & Delivery Manifest</p>
        </div>

        <div class="py-3 border-b border-dashed border-slate-300 space-y-1.5 text-[11px]">
            <div class="flex justify-between">
                <span>Tracking Number:</span>
                <span class="font-bold font-mono text-slate-900">${item.trackingNo}</span>
            </div>
            <div class="flex justify-between">
                <span>Customer / Consignee:</span>
                <span class="font-bold text-slate-900">${item.customer}</span>
            </div>
            <div class="flex justify-between">
                <span>Delivery Bay / Address:</span>
                <span class="text-slate-700">${item.address || 'Central Terminal Hub'}</span>
            </div>
            <div class="flex justify-between">
                <span>Dispatch Date & Time:</span>
                <span>${item.dateTime}</span>
            </div>
            <div class="flex justify-between">
                <span>Current Status:</span>
                <span class="font-bold uppercase text-blue-600">${item.status}</span>
            </div>
        </div>

        <div class="py-3 border-b border-dashed border-slate-300 space-y-1.5 text-[11px]">
            <div class="flex justify-between font-bold text-slate-500">
                <span>CARGO ITEM</span>
                <span>VALUE</span>
            </div>
            <div class="flex justify-between">
                <span>${item.items}</span>
                <span class="font-bold text-[#ff6900]">₱${Number(item.value).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
        </div>

        <div class="pt-4 text-[10px] text-slate-400 space-y-1">
            <p>Certified Forklift Dock Inspection: Verified</p>
            <p>Receiver Signature: _______________________</p>
            <p class="text-center pt-2 text-[9px]">FoodHub Automated Digital Manifest</p>
        </div>
    `;

    document.getElementById('receipt-modal').classList.remove('hidden');
}

function closeReceiptModal() {
    document.getElementById('receipt-modal').classList.add('hidden');
}

// Create Shipment Modal
function openCreateShipmentModal() {
    if (!currentUser || currentUser.role !== 'Admin') {
        showToast('Only Admin can create shipments.', 'error');
        return;
    }
    document.getElementById('ship-customer').value = '';
    document.getElementById('ship-items').value = '';
    document.getElementById('ship-address').value = '';
    document.getElementById('shipment-modal').classList.remove('hidden');
}

function closeShipmentModal() {
    document.getElementById('shipment-modal').classList.add('hidden');
}

function handleCreateShipment(e) {
    e.preventDefault();
    const customer = document.getElementById('ship-customer').value.trim();
    const items = document.getElementById('ship-items').value.trim();
    const address = document.getElementById('ship-address').value.trim();
    const status = document.getElementById('ship-status').value;
    const value = parseFloat(document.getElementById('ship-value').value) || 2000;

    const newTracking = 'FH-00' + Math.floor(1246 + Math.random() * 500);
    const now = new Date();
    const dateTime = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' • ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

    const newShipment = {
        trackingNo: newTracking,
        customer,
        items,
        status,
        dateTime,
        value,
        address: address || 'Warehouse Bay 1'
    };

    shipments.unshift(newShipment);
    Store.set('shipments', shipments);
    addAuditLog(`Created shipment ${newTracking}`);
    closeShipmentModal();
    renderShipmentsTable();

    // Update KPI
    const kpiEl = document.getElementById('kpi-shipments-count');
    if (kpiEl) kpiEl.innerText = shipments.length + 120;

    // Add to activity feed
    addActivityItem(`New shipment ${newTracking} scheduled for ${customer}`, 'blue');

    showToast(`Shipment ${newTracking} created!`);
}

// Add Customer Modal
function openAddCustomerModal() {
    if (!currentUser || currentUser.role !== 'Admin') {
        showToast('Only Admin can add customers.', 'error');
        return;
    }
    document.getElementById('cust-name').value = '';
    document.getElementById('cust-address').value = '';
    document.getElementById('customer-modal').classList.remove('hidden');
}

function closeCustomerModal() {
    document.getElementById('customer-modal').classList.add('hidden');
}

function handleAddCustomer(e) {
    e.preventDefault();
    const name = document.getElementById('cust-name').value.trim();
    const address = document.getElementById('cust-address').value.trim();

    customers.unshift({ name, phone: '0919-888-0000', branch: address, orders: 1 });
    Store.set('customers', customers);
    addAuditLog(`Added client ${name}`);

    closeCustomerModal();
    addActivityItem(`New customer registered: ${name}`, 'purple');

    const custKpi = document.getElementById('kpi-customers-count');
    if (custKpi) custKpi.innerText = parseInt(custKpi.innerText) + 1;

    showToast(`Customer ${name} added!`);
}

function addActivityItem(text, color = 'emerald') {
    const feed = document.getElementById('activity-feed-container');
    if (feed) {
        const item = document.createElement('div');
        item.className = 'flex items-start gap-2.5';
        const colorClasses = {
            emerald: 'bg-emerald-100 text-emerald-600',
            blue: 'bg-blue-100 text-blue-600',
            purple: 'bg-purple-100 text-purple-600',
            amber: 'bg-amber-100 text-amber-600'
        };
        item.innerHTML = `
            <span class="w-5 h-5 rounded-full ${colorClasses[color] || 'bg-slate-100 text-slate-600'} flex items-center justify-center text-[10px] mt-0.5"><i class="fa-solid fa-bell"></i></span>
            <div class="flex-grow">
                <p class="font-semibold text-slate-800">${text}</p>
            </div>
            <span class="text-[10px] text-slate-400">Just now</span>
        `;
        feed.prepend(item);
    }
}

function refreshActivityFeed() {
    showToast('Activity feed updated in real-time!');
}

// Generic Modal for Sub-Views (Inventory, Orders, Warehouses, Reports, Settings)
function closeGenericModal() {
    document.getElementById('generic-modal').classList.add('hidden');
}

// Sidebar Navigation with Dedicated Panel Layouts
function navigate(tabName) {
    const clientTabs = ['food-menu', 'categories', 'search-food', 'cart', 'my-orders', 'order-history', 'track-order', 'my-payments'];
    const isClient = currentUser && currentUser.role === 'Customer';
    if (isClient && !['dashboard', 'profile', ...clientTabs].includes(tabName)) {
        showToast('This module is not available to Client accounts.', 'error');
        return;
    }
    if (!isClient && clientTabs.includes(tabName)) {
        showToast('This module is available to Client accounts only.', 'error');
        return;
    }
    if ((tabName === 'users' || tabName === 'audit' || tabName === 'settings' || tabName === 'customers') &&
        (!currentUser || currentUser.role !== 'Admin')) {
        showToast('This module is available to Admin only.', 'error');
        return;
    }
    activeTab = tabName;

    // 1. Update Sidebar Active Button Styling
    document.querySelectorAll('#nav-links button, aside nav button').forEach(btn => {
        btn.classList.remove('bg-[#ff6900]', 'text-white', 'shadow-md', 'shadow-orange-500/25');
        btn.classList.add('text-slate-600', 'hover:bg-slate-50', 'hover:text-[#ff6900]');
    });

    const activeBtn = document.getElementById(`nav-btn-${tabName}`) ||
        document.getElementById(`nav-btn-${tabName}-admin`);
    if (activeBtn) {
        activeBtn.classList.remove('text-slate-600', 'hover:bg-slate-50', 'hover:text-[#ff6900]');
        activeBtn.classList.add('bg-[#ff6900]', 'text-white', 'shadow-md', 'shadow-orange-500/25');
    }

    // 2. Hide all content panels & show only the targeted panel
    document.querySelectorAll('.content-panel').forEach(panel => {
        panel.classList.add('hidden');
    });

    const targetPanelId = isClient && tabName === 'dashboard' ? 'panel-client-dashboard' : `panel-${tabName}`;
    const targetPanel = document.getElementById(targetPanelId);
    if (targetPanel) {
        targetPanel.classList.remove('hidden');
    }

    // 3. Render specific data for active panel
    if (tabName === 'dashboard') {
        if (isClient) renderClientDashboard();
        else renderShipmentsTable();
    } else if (tabName === 'profile') {
        populateProfileForm();
    } else if (tabName === 'shipments') {
        renderFullShipmentsTable();
    } else if (tabName === 'inventory') {
        renderInventoryPanelTable();
    } else if (tabName === 'orders') {
        renderOrdersPanelTable();
    } else if (tabName === 'order-preparation') {
        renderOrderPreparation();
    } else if (tabName === 'customers') {
        renderCustomersPanelCards();
    } else if (tabName === 'reports') {
        renderReportsAuditTable();
        renderStaffOperationalReports();
    } else if (tabName === 'users') {
        renderManageUsers();
    } else if (tabName === 'stock-receiving') {
        renderStockReceiving();
    } else if (tabName === 'audit') {
        renderAuditLogs();
    } else if (tabName === 'food-menu' || tabName === 'search-food') {
        renderClientProducts(tabName === 'food-menu' ? 'client-food-menu-list' : 'client-search-results',
            tabName === 'search-food' ? document.getElementById('client-food-search')?.value || '' : '',
            tabName === 'food-menu' ? document.getElementById('client-menu-category')?.value || 'all' : 'all');
    } else if (tabName === 'categories') {
        renderClientCategories();
    } else if (tabName === 'cart') {
        renderClientCart();
    } else if (tabName === 'my-orders') {
        renderClientOrders('active');
    } else if (tabName === 'order-history') {
        renderClientOrders('history');
    } else if (tabName === 'track-order') {
        renderClientTracking();
    } else if (tabName === 'my-payments') {
        renderClientPayments();
    }

    if (window.matchMedia('(max-width: 767px)').matches) closeMobileSidebar();
}

// Render Dedicated Panel: Full Shipments Table
let currentShipmentFilter = 'ALL';
function renderFullShipmentsTable(filter = currentShipmentFilter) {
    const tbody = document.getElementById('full-shipments-tbody');
    const badge = document.getElementById('shipments-count-badge');
    if (!tbody) return;

    let list = shipments;
    if (filter && filter !== 'ALL') {
        list = list.filter(s => s.status.toLowerCase() === filter.toLowerCase());
    }

    if (badge) badge.innerText = `Total: ${list.length} Shipments`;

    const statusBadgeMap = {
        'In Transit': 'bg-blue-50 text-blue-600 border border-blue-200',
        'Delivered': 'bg-emerald-50 text-emerald-600 border border-emerald-200',
        'Preparing': 'bg-orange-50 text-orange-600 border border-orange-200',
        'Pending': 'bg-slate-100 text-slate-600 border border-slate-200'
    };

    if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="py-8 text-center text-slate-400">No shipments under this filter.</td></tr>`;
        return;
    }

    tbody.innerHTML = list.map(item => `
        <tr class="hover:bg-slate-50 transition border-b border-slate-100">
            <td class="py-3.5 font-bold font-mono text-slate-800">${item.trackingNo}</td>
            <td class="py-3.5 font-bold text-slate-800">${item.customer}</td>
            <td class="py-3.5 text-slate-500">${item.items}</td>
            <td class="py-3.5 text-slate-600">${item.address || 'Central Terminal Hub'}</td>
            <td class="py-3.5">
                <span class="px-3 py-1 rounded-full text-[10px] font-bold ${statusBadgeMap[item.status] || 'bg-slate-100 text-slate-600'}">
                    ${item.status}
                </span>
            </td>
            <td class="py-3.5 text-slate-400 font-medium">${item.dateTime}</td>
            <td class="py-3.5 text-center">
                ${currentUser && (currentUser.role === 'Staff' || currentUser.role === 'Admin') ? `
                    <select onchange="updateShipmentStatus('${item.trackingNo}', this.value)" class="mb-1 px-2 py-1.5 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 bg-white">
                        ${['Pending', 'Preparing', 'Ready for Dispatch', 'In Transit', 'Delivered'].map(status =>
                            `<option value="${status}" ${item.status === status ? 'selected' : ''}>${status}</option>`
                        ).join('')}
                    </select>
                ` : ''}
                <button onclick="openShipmentDetails('${item.trackingNo}')" class="px-4 py-1.5 bg-[#ff6900] hover:bg-[#e65c00] text-white rounded-xl font-bold text-[11px] shadow-sm shadow-orange-500/20 transition transform active:scale-95">
                    View Slip
                </button>
            </td>
        </tr>
    `).join('');
}

function filterShipmentsByTab(status) {
    currentShipmentFilter = status;
    document.querySelectorAll('.ship-tab-filter').forEach(btn => {
        btn.classList.remove('bg-[#ff6900]', 'text-white');
        btn.classList.add('bg-slate-100', 'text-slate-600');
    });

    const activeBtnMap = {
        'ALL': 'filter-ship-all',
        'Pending': 'filter-ship-pending',
        'In Transit': 'filter-ship-transit',
        'Delivered': 'filter-ship-delivered',
        'Preparing': 'filter-ship-prep',
        'Ready for Dispatch': 'filter-ship-ready'
    };
    const targetBtn = document.getElementById(activeBtnMap[status]);
    if (targetBtn) {
        targetBtn.classList.remove('bg-slate-100', 'text-slate-600');
        targetBtn.classList.add('bg-[#ff6900]', 'text-white');
    }

    renderFullShipmentsTable(status);
}

// Render Dedicated Panel: Inventory Table
function renderInventoryPanelTable(query = '') {
    const tbody = document.getElementById('inventory-panel-tbody');
    if (!tbody) return;

    const filter = query.trim().toLowerCase();
    const results = inventory.filter(item =>
        !filter || item.sku.toLowerCase().includes(filter) || item.name.toLowerCase().includes(filter)
    );
    if (!results.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="py-8 text-center text-slate-400">No matching products found.</td></tr>';
        return;
    }

    tbody.innerHTML = results.map(item => `
        <tr class="hover:bg-slate-50 transition border-b border-slate-100">
            <td class="py-3.5 font-bold font-mono text-slate-900">${item.sku}</td>
            <td class="py-3.5 font-bold text-slate-800">${item.name}</td>
            <td class="py-3.5 text-slate-500">${item.zone}</td>
            <td class="py-3.5">
                <input id="stock-quantity-${item.sku}" type="number" min="0" step="1" value="${Number(item.stock)}" class="w-24 p-2 border border-slate-200 rounded-lg font-bold text-slate-800">
                <span class="text-slate-500"> units</span>
            </td>
            <td class="py-3.5">
                <span class="px-2.5 py-1 rounded-full text-[10px] font-bold ${Number(item.stock) <= LOW_STOCK_THRESHOLD ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}">
                    ${Number(item.stock) <= LOW_STOCK_THRESHOLD ? 'Low Stock' : 'In Stock'}
                </span>
            </td>
            <td class="py-3.5 text-center">
                <button onclick="updateStockQuantity('${item.sku}')" class="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-[11px] shadow transition">
                    Save Quantity
                </button>
            </td>
        </tr>
    `).join('');
}

function updateStockQuantity(sku) {
    if (!currentUser || !['Admin', 'Staff'].includes(currentUser.role)) return;
    const item = inventory.find(product => product.sku === sku);
    const quantityInput = document.getElementById(`stock-quantity-${sku}`);
    const quantity = quantityInput ? Number(quantityInput.value) : NaN;
    if (!item || !Number.isInteger(quantity) || quantity < 0) {
        showToast('Enter a valid stock quantity.', 'error');
        return;
    }

    item.stock = quantity;
    item.status = quantity <= LOW_STOCK_THRESHOLD ? 'Low Stock' : 'In Stock';
    Store.set('inventory', inventory);
    addAuditLog(`Updated stock quantity for ${sku} to ${quantity}`);
    renderInventoryPanelTable(document.getElementById('inventory-search')?.value || '');
    renderStaffTaskSummary();
    showToast(`Stock quantity for ${sku} updated.`);
}

// Render Dedicated Panel: Orders Table
function renderOrdersPanelTable() {
    const tbody = document.getElementById('orders-panel-tbody');
    if (!tbody) return;

    tbody.innerHTML = shipments.map(s => `
        <tr class="hover:bg-slate-50 transition border-b border-slate-100">
            <td class="py-3.5 font-bold font-mono text-blue-600">${s.trackingNo}</td>
            <td class="py-3.5 font-bold text-slate-800">${s.customer} <span class="block text-[11px] text-slate-400 font-normal">${s.address || 'Central Terminal'}</span></td>
            <td class="py-3.5 text-slate-600">${s.items}</td>
            <td class="py-3.5 font-bold text-slate-900">₱${Number(s.value).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
            <td class="py-3.5">
                <span class="px-2.5 py-1 rounded-full text-[10px] font-bold ${s.status === 'Delivered' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}">
                    ${s.status}
                </span>
            </td>
            <td class="py-3.5 text-center space-x-1">
                <button onclick="openShipmentDetails('${s.trackingNo}')" class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-[11px]">Details</button>
                ${currentUser && (currentUser.role === 'Staff' || currentUser.role === 'Admin') ? `
                    <button onclick="processOrder('${s.trackingNo}')" class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-[11px]">
                        ${s.status === 'Ready for Dispatch' ? 'Mark In Transit' : s.status === 'In Transit' ? 'Mark Delivered' : 'Process'}
                    </button>
                ` : ''}
            </td>
        </tr>
    `).join('');
}

function renderOrderPreparation() {
    const container = document.getElementById('order-preparation-list');
    if (!container) return;

    const activeOrders = shipments.filter(shipment =>
        ['Pending', 'Preparing', 'Ready for Dispatch'].includes(shipment.status)
    );
    if (!activeOrders.length) {
        container.innerHTML = '<div class="bg-white rounded-3xl p-6 text-center text-sm text-slate-400">No orders are waiting for preparation.</div>';
        return;
    }

    container.innerHTML = activeOrders.map(shipment => {
        const action = shipment.status === 'Pending'
            ? `<button onclick="prepareOrder('${shipment.trackingNo}')" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold">Pick Products</button>`
            : shipment.status === 'Preparing'
                ? `<label class="flex items-center gap-2 text-[11px] text-slate-600"><input id="order-quantity-checked-${shipment.trackingNo}" type="checkbox" class="accent-[#ff6900]"> Quantity checked</label><button onclick="prepareOrder('${shipment.trackingNo}', true)" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold">Pack & Mark Ready</button>`
                : '<span class="px-3 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold">Ready for Dispatch</span>';
        const quantity = shipment.items.match(/\(x(\d+)\)/i);
        return `
            <article class="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
                <div class="flex items-start justify-between gap-3">
                    <div>
                        <p class="font-mono font-black text-blue-700">${shipment.trackingNo}</p>
                        <h3 class="font-bold text-slate-900 mt-1">${shipment.customer}</h3>
                    </div>
                    <span class="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full text-[10px] font-bold">${shipment.status}</span>
                </div>
                <dl class="grid grid-cols-2 gap-3 mt-4 text-xs">
                    <div><dt class="text-slate-400">Products</dt><dd class="font-semibold text-slate-700">${shipment.items}</dd></div>
                    <div><dt class="text-slate-400">Quantity / Pack</dt><dd class="font-semibold text-slate-700">${quantity ? quantity[1] : 'See order details'}</dd></div>
                    <div class="col-span-2"><dt class="text-slate-400">Destination</dt><dd class="font-semibold text-slate-700">${shipment.address || 'Central Terminal Hub'}</dd></div>
                </dl>
                <div class="flex justify-between items-center mt-5 pt-4 border-t">
                    <button onclick="openShipmentDetails('${shipment.trackingNo}')" class="text-xs font-bold text-slate-600 hover:text-[#ff6900]">View Order Details</button>
                    ${action}
                </div>
            </article>
        `;
    }).join('');
}

function prepareOrder(trackingNo, confirmQuantity = false) {
    if (!currentUser || !['Staff', 'Admin'].includes(currentUser.role)) return;
    const shipment = shipments.find(item => item.trackingNo === trackingNo);
    if (!shipment) return;

    if (shipment.status === 'Preparing' && confirmQuantity &&
        !document.getElementById(`order-quantity-checked-${trackingNo}`)?.checked) {
        showToast('Check the picked quantity before packing this order.', 'error');
        return;
    }

    const nextStatus = shipment.status === 'Pending' ? 'Preparing' :
        shipment.status === 'Preparing' && confirmQuantity ? 'Ready for Dispatch' : null;
    if (!nextStatus) return;
    updateShipmentStatus(trackingNo, nextStatus);
    renderOrderPreparation();
}

function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, character => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[character]);
}

function formatClientPrice(value) {
    return `₱${Number(value).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getClientAccountKey() {
    return currentUser && currentUser.username ? currentUser.username.toLowerCase() : '';
}

function getCurrentClientCart() {
    const cart = customerCarts[getClientAccountKey()];
    return Array.isArray(cart) ? cart : [];
}

function saveCurrentClientCart(cart) {
    const accountKey = getClientAccountKey();
    if (!accountKey) return;
    customerCarts[accountKey] = cart;
    Store.set('customerCarts', customerCarts);
}

function getClientProduct(sku) {
    return CLIENT_PRODUCTS.find(product => product.sku === sku);
}

function getProductInventory(product) {
    return product ? inventory.find(item => item.sku === product.sku) : null;
}

function getCurrentClientOrders() {
    const accountKey = getClientAccountKey();
    return clientOrders.filter(order => (order.username || '').toLowerCase() === accountKey)
        .sort((a, b) => new Date(b.createdAt || b.dateTime).getTime() - new Date(a.createdAt || a.dateTime).getTime());
}

function renderClientDashboard() {
    if (!currentUser || currentUser.role !== 'Customer') return;
    const orders = getCurrentClientOrders();
    const cart = getCurrentClientCart();
    const setText = (id, value) => {
        const element = document.getElementById(id);
        if (element) element.innerText = value;
    };

    setText('client-dashboard-name', currentUser.name || currentUser.username);
    setText('client-dashboard-orders', orders.length);
    setText('client-dashboard-active', orders.filter(order => !['Delivered', 'Cancelled'].includes(order.status)).length);
    setText('client-dashboard-cart', cart.reduce((total, item) => total + Number(item.quantity || 0), 0));
    setText('client-dashboard-delivered', orders.filter(order => order.status === 'Delivered').length);
    renderClientDashboardRecentOrders(orders.slice(0, 3));
    renderClientCartBadge();
}

function renderClientDashboardRecentOrders(orders) {
    const container = document.getElementById('client-dashboard-recent-orders');
    if (!container) return;
    if (!orders.length) {
        container.innerHTML = '<p class="py-5 text-center text-sm text-slate-400">Wala ka pang order. Browse the Food Menu to get started.</p>';
        return;
    }

    container.innerHTML = orders.map(order => `
        <button onclick="navigate('track-order')" class="w-full flex items-center justify-between gap-3 p-4 text-left border-b last:border-0 border-slate-100 hover:bg-slate-50">
            <span><strong class="block text-xs font-mono text-slate-800">${escapeHtml(order.trackingNo)}</strong><small class="text-slate-400">${escapeHtml(order.dateTime)}</small></span>
            <span class="text-right"><strong class="block text-xs text-slate-800">${formatClientPrice(order.total)}</strong><small class="text-[#ff6900]">${escapeHtml(order.status)}</small></span>
        </button>
    `).join('');
}

function renderClientCartBadge() {
    const badge = document.getElementById('client-cart-count');
    if (!badge) return;
    const count = getCurrentClientCart().reduce((total, item) => total + Number(item.quantity || 0), 0);
    badge.innerText = count;
    badge.classList.toggle('hidden', count === 0);
}

function renderClientProducts(containerId, query = '', category = 'all') {
    const container = document.getElementById(containerId);
    if (!container) return;
    const normalizedQuery = query.trim().toLowerCase();
    const products = CLIENT_PRODUCTS.filter(product => {
        const matchesSearch = !normalizedQuery ||
            product.name.toLowerCase().includes(normalizedQuery) ||
            product.sku.toLowerCase().includes(normalizedQuery) ||
            product.category.toLowerCase().includes(normalizedQuery);
        return matchesSearch && (category === 'all' || product.category === category);
    });

    if (!products.length) {
        container.innerHTML = '<p class="col-span-full py-8 text-center text-sm text-slate-400">No food products match your search.</p>';
        return;
    }

    container.innerHTML = products.map(product => {
        const stockItem = getProductInventory(product);
        const stock = stockItem ? Math.max(0, Number(stockItem.stock) || 0) : 0;
        return `
            <article class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col">
                <div class="w-12 h-12 rounded-2xl bg-orange-50 text-[#ff6900] flex items-center justify-center text-xl"><i class="fa-solid fa-bowl-food"></i></div>
                <span class="mt-4 text-[10px] uppercase tracking-wide text-purple-600 font-bold">${escapeHtml(product.category)}</span>
                <h3 class="mt-1 text-sm font-bold text-slate-900">${escapeHtml(product.name)}</h3>
                <p class="mt-2 text-[11px] text-slate-400">${escapeHtml(product.sku)} · ${stock} available</p>
                <div class="mt-auto pt-4 flex items-center justify-between gap-2">
                    <strong class="text-sm text-slate-900">${formatClientPrice(product.price)}</strong>
                    <button onclick="addClientProductToCart('${product.sku}')" ${stock < 1 ? 'disabled' : ''} class="px-3 py-2 rounded-xl bg-[#ff6900] text-white text-[11px] font-bold disabled:bg-slate-300 disabled:cursor-not-allowed">
                        <i class="fa-solid fa-cart-plus mr-1"></i> Add
                    </button>
                </div>
            </article>
        `;
    }).join('');
}

function filterClientFood() {
    const query = document.getElementById('client-food-search')?.value || '';
    renderClientProducts('client-search-results', query);
}

function filterClientMenuCategory() {
    const category = document.getElementById('client-menu-category')?.value || 'all';
    renderClientProducts('client-food-menu-list', '', category);
}

function renderClientCategories() {
    const container = document.getElementById('client-category-list');
    if (!container) return;
    const categories = [...new Set(CLIENT_PRODUCTS.map(product => product.category))];
    container.innerHTML = categories.map(category => {
        const count = CLIENT_PRODUCTS.filter(product => product.category === category).length;
        return `
            <button onclick="openClientCategory('${escapeHtml(category)}')" class="bg-white rounded-2xl border border-slate-200 p-6 text-left shadow-sm hover:border-orange-300 transition">
                <span class="w-11 h-11 rounded-xl bg-orange-50 text-[#ff6900] flex items-center justify-center"><i class="fa-solid fa-tags"></i></span>
                <strong class="block mt-4 text-sm text-slate-900">${escapeHtml(category)}</strong>
                <span class="text-xs text-slate-400">${count} products</span>
            </button>
        `;
    }).join('');
}

function openClientCategory(category) {
    const selector = document.getElementById('client-menu-category');
    if (selector) selector.value = category;
    navigate('food-menu');
}

function addClientProductToCart(sku) {
    if (!currentUser || currentUser.role !== 'Customer') return;
    const product = getClientProduct(sku);
    const stockItem = getProductInventory(product);
    if (!product || !stockItem) {
        showToast('This food product is currently unavailable.', 'error');
        return;
    }

    const cart = getCurrentClientCart();
    const existing = cart.find(item => item.sku === sku);
    if ((existing ? Number(existing.quantity) : 0) + 1 > Number(stockItem.stock)) {
        showToast('The requested quantity is not available in stock.', 'error');
        return;
    }
    if (existing) existing.quantity = Number(existing.quantity) + 1;
    else cart.push({ sku, quantity: 1 });
    saveCurrentClientCart(cart);
    renderClientCartBadge();
    if (activeTab === 'cart') renderClientCart();
    showToast(`${product.name} added to your cart.`);
}

function changeClientCartQuantity(sku, change) {
    const cart = getCurrentClientCart();
    const cartItem = cart.find(item => item.sku === sku);
    if (!cartItem) return;
    const nextQuantity = Number(cartItem.quantity) + change;
    if (nextQuantity <= 0) {
        saveCurrentClientCart(cart.filter(item => item.sku !== sku));
    } else {
        const product = getClientProduct(sku);
        const stockItem = getProductInventory(product);
        if (!stockItem || nextQuantity > Number(stockItem.stock)) {
            showToast('The requested quantity is not available in stock.', 'error');
            return;
        }
        cartItem.quantity = nextQuantity;
        saveCurrentClientCart(cart);
    }
    renderClientCart();
    renderClientCartBadge();
}

function removeClientCartItem(sku) {
    saveCurrentClientCart(getCurrentClientCart().filter(item => item.sku !== sku));
    renderClientCart();
    renderClientCartBadge();
}

function renderClientCart() {
    if (!currentUser || currentUser.role !== 'Customer') return;
    const container = document.getElementById('client-cart-items');
    const totalElement = document.getElementById('client-cart-total');
    const checkoutButton = document.getElementById('client-checkout-button');
    if (!container) return;

    const rows = getCurrentClientCart().map(cartItem => {
        const product = getClientProduct(cartItem.sku);
        const stockItem = getProductInventory(product);
        return product && stockItem ? { product, stockItem, quantity: Number(cartItem.quantity) } : null;
    }).filter(Boolean);

    if (!rows.length) {
        container.innerHTML = '<p class="py-8 text-center text-sm text-slate-400">Your cart is empty. Add food products from the menu.</p>';
    } else {
        container.innerHTML = rows.map(({ product, quantity }) => `
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-slate-100">
                <div class="min-w-0">
                    <strong class="block text-sm text-slate-900">${escapeHtml(product.name)}</strong>
                    <span class="text-xs text-slate-400">${formatClientPrice(product.price)} each</span>
                </div>
                <div class="flex items-center gap-2">
                    <button type="button" aria-label="Decrease quantity" onclick="changeClientCartQuantity('${product.sku}', -1)" class="w-8 h-8 rounded-lg border text-slate-600">−</button>
                    <span class="w-8 text-center text-sm font-bold">${quantity}</span>
                    <button type="button" aria-label="Increase quantity" onclick="changeClientCartQuantity('${product.sku}', 1)" class="w-8 h-8 rounded-lg border text-slate-600">+</button>
                    <button type="button" onclick="removeClientCartItem('${product.sku}')" class="ml-2 text-xs font-bold text-rose-600">Remove</button>
                </div>
                <strong class="text-sm text-slate-900">${formatClientPrice(product.price * quantity)}</strong>
            </div>
        `).join('');
    }

    const total = rows.reduce((sum, row) => sum + row.product.price * row.quantity, 0);
    if (totalElement) totalElement.innerText = formatClientPrice(total);
    if (checkoutButton) checkoutButton.disabled = rows.length === 0;
}

function checkoutClientOrder(e) {
    if (e) e.preventDefault();
    if (!currentUser || currentUser.role !== 'Customer') {
        showToast('Only Client accounts can place orders.', 'error');
        return;
    }

    const addressInput = document.getElementById('client-delivery-address');
    const address = addressInput ? addressInput.value.trim() : '';
    if (!address) {
        showToast('Enter a delivery address before placing your order.', 'error');
        return;
    }

    const cart = getCurrentClientCart();
    if (!cart.length) {
        showToast('Your cart is empty.', 'error');
        return;
    }
    const orderItems = [];
    for (const cartItem of cart) {
        const product = getClientProduct(cartItem.sku);
        const stockItem = getProductInventory(product);
        const quantity = Number(cartItem.quantity);
        if (!product || !stockItem || !Number.isInteger(quantity) || quantity < 1 || quantity > Number(stockItem.stock)) {
            showToast('Some cart quantities are no longer available. Review your cart.', 'error');
            renderClientCart();
            return;
        }
        orderItems.push({
            sku: product.sku,
            name: product.name,
            quantity,
            unitPrice: product.price,
            lineTotal: product.price * quantity
        });
    }

    const total = orderItems.reduce((sum, item) => sum + item.lineTotal, 0);
    const paymentMethod = document.getElementById('client-payment-method')?.value || '';
    if (paymentMethod !== 'Cash on Delivery') {
        showToast('Choose an available payment method.', 'error');
        return;
    }

    const now = new Date();
    const dateTime = now.toLocaleString();
    const trackingBase = `FH-${now.getTime()}`;
    let trackingNo = trackingBase;
    let trackingSuffix = 1;
    while (shipments.some(shipment => shipment.trackingNo === trackingNo)) {
        trackingNo = `${trackingBase}-${trackingSuffix++}`;
    }
    const accountKey = getClientAccountKey();
    const order = {
        trackingNo,
        username: accountKey,
        customerName: currentUser.name || currentUser.username,
        items: orderItems,
        total,
        address,
        status: 'Pending',
        paymentMethod,
        paymentStatus: 'Due on delivery',
        dateTime,
        createdAt: now.toISOString()
    };
    const shipment = {
        trackingNo,
        customer: order.customerName,
        customerUsername: accountKey,
        orderId: trackingNo,
        items: orderItems.map(item => `${item.name} (x${item.quantity})`).join(', '),
        status: 'Pending',
        dateTime,
        value: total,
        address
    };
    const payment = {
        trackingNo,
        username: accountKey,
        amount: total,
        method: paymentMethod,
        status: 'Due on delivery',
        dateTime
    };

    orderItems.forEach(item => {
        const stockItem = inventory.find(entry => entry.sku === item.sku);
        stockItem.stock = Number(stockItem.stock) - item.quantity;
        stockItem.status = stockItem.stock <= LOW_STOCK_THRESHOLD ? 'Low Stock' : 'In Stock';
    });
    clientOrders.push(order);
    shipments.push(shipment);
    paymentRecords.push(payment);
    Store.set('inventory', inventory);
    Store.set('clientOrders', clientOrders);
    Store.set('shipments', shipments);
    Store.set('paymentRecords', paymentRecords);
    saveCurrentClientCart([]);
    addAuditLog(`Placed client order ${trackingNo}`);
    renderStaffTaskSummary();
    showToast(`Order ${trackingNo} placed successfully. Payment is due on delivery.`);
    navigate('my-orders');
}

function renderClientOrders(view) {
    const container = document.getElementById(view === 'active' ? 'client-active-orders' : 'client-order-history');
    if (!container) return;
    const orders = getCurrentClientOrders().filter(order =>
        view === 'active' ? !['Delivered', 'Cancelled'].includes(order.status) : ['Delivered', 'Cancelled'].includes(order.status)
    );
    if (!orders.length) {
        container.innerHTML = `<p class="py-8 text-center text-sm text-slate-400">${view === 'active' ? 'You have no active orders.' : 'No previous orders yet.'}</p>`;
        return;
    }
    container.innerHTML = orders.map(order => `
        <article class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div class="flex flex-wrap justify-between gap-3">
                <div><p class="text-[10px] uppercase text-slate-400">Order reference</p><strong class="font-mono text-sm text-slate-900">${escapeHtml(order.trackingNo)}</strong></div>
                <span class="h-fit px-3 py-1 rounded-full bg-orange-50 text-[#ff6900] text-[10px] font-bold">${escapeHtml(order.status)}</span>
            </div>
            <p class="mt-3 text-xs text-slate-500">${escapeHtml(order.items.map(item => `${item.name} × ${item.quantity}`).join(', '))}</p>
            <div class="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                <span class="text-[11px] text-slate-400">${escapeHtml(order.dateTime)}</span>
                <strong class="text-sm text-slate-900">${formatClientPrice(order.total)}</strong>
                <button onclick="navigate('track-order')" class="text-xs font-bold text-[#ff6900]">Track order</button>
            </div>
        </article>
    `).join('');
}

function renderClientTracking() {
    const container = document.getElementById('client-tracking-list');
    if (!container) return;
    const orders = getCurrentClientOrders();
    if (!orders.length) {
        container.innerHTML = '<p class="py-8 text-center text-sm text-slate-400">Your order tracking details will appear here after checkout.</p>';
        return;
    }
    const statusFlow = ['Pending', 'Preparing', 'Ready for Dispatch', 'In Transit', 'Delivered'];
    container.innerHTML = orders.map(order => {
        const currentStep = statusFlow.indexOf(order.status);
        return `
            <article class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div class="flex flex-wrap justify-between gap-2">
                    <strong class="font-mono text-sm">${escapeHtml(order.trackingNo)}</strong>
                    <span class="text-xs font-bold text-[#ff6900]">${escapeHtml(order.status)}</span>
                </div>
                <p class="mt-2 text-xs text-slate-500">${escapeHtml(order.items.map(item => `${item.name} × ${item.quantity}`).join(', '))}</p>
                ${currentStep >= 0 ? `
                    <ol class="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-5">
                        ${statusFlow.map((status, index) => `
                            <li class="rounded-xl p-2 text-center text-[10px] font-bold ${index <= currentStep ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'}">
                                <span class="block mb-1">${index <= currentStep ? '✓' : index + 1}</span>${escapeHtml(status)}
                            </li>
                        `).join('')}
                    </ol>
                ` : '<p class="mt-4 text-xs text-rose-600">This order is no longer active.</p>'}
            </article>
        `;
    }).join('');
}

function renderClientPayments() {
    const container = document.getElementById('client-payment-records');
    if (!container) return;
    const accountKey = getClientAccountKey();
    const records = paymentRecords.filter(payment => (payment.username || '').toLowerCase() === accountKey)
        .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
    if (!records.length) {
        container.innerHTML = '<p class="py-8 text-center text-sm text-slate-400">Your payment records will appear after placing an order.</p>';
        return;
    }
    container.innerHTML = records.map(payment => {
        const order = clientOrders.find(item => item.trackingNo === payment.trackingNo && item.username === accountKey);
        return `
            <article class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-wrap items-center justify-between gap-3">
                <div><strong class="block font-mono text-sm text-slate-900">${escapeHtml(payment.trackingNo)}</strong><span class="text-xs text-slate-400">${escapeHtml(payment.method)} · ${escapeHtml(payment.dateTime)}</span></div>
                <span class="text-xs font-bold text-amber-600">${escapeHtml(payment.status)}</span>
                <span class="text-xs text-slate-500">Order: ${escapeHtml(order ? order.status : 'Unavailable')}</span>
                <strong class="text-sm">${formatClientPrice(payment.amount)}</strong>
            </article>
        `;
    }).join('');
}

// Render Dedicated Panel: Customers Cards
function renderCustomersPanelCards() {
    const container = document.getElementById('customers-cards-container');
    if (!container) return;

    container.innerHTML = customers.map(c => `
        <div class="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-purple-300 transition">
            <div class="space-y-3">
                <div class="flex items-center justify-between">
                    <div class="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl font-black">
                        <i class="fa-solid fa-store"></i>
                    </div>
                    <span class="px-3 py-1 bg-purple-100 text-purple-700 font-bold rounded-full text-[10px]">Active Partner</span>
                </div>
                <div>
                    <h4 class="text-base font-extrabold text-slate-900">${c.name}</h4>
                    <p class="text-xs text-slate-500 mt-0.5">${c.branch}</p>
                </div>
                <div class="pt-2 text-xs text-slate-600 space-y-1">
                    <p><i class="fa-solid fa-phone text-slate-400 mr-1.5"></i> ${c.phone}</p>
                    <p><i class="fa-solid fa-box text-slate-400 mr-1.5"></i> Total Deliveries: <strong class="text-purple-600">${c.orders} Orders</strong></p>
                </div>
            </div>
            <div class="mt-5 pt-3 border-t flex justify-end">
                ${currentUser && currentUser.role === 'Admin' ? `
                    <button onclick="openCreateShipmentModal(); document.getElementById('ship-customer').value='${c.name}'; document.getElementById('ship-address').value='${c.branch}';" class="w-full py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs rounded-xl transition">
                        + Dispatch Shipment
                    </button>
                ` : `
                    <span class="w-full text-center py-2 text-[10px] font-bold text-slate-400">View Only</span>
                `}
            </div>
        </div>
    `).join('');
}

// Render Dedicated Panel: Reports Audit Table
function renderReportsAuditTable() {
    const tbody = document.getElementById('reports-audit-tbody');
    if (!tbody) return;

    tbody.innerHTML = shipments.map(s => `
        <tr class="hover:bg-slate-50 transition border-b border-slate-100">
            <td class="py-3 font-mono font-bold text-slate-800">${s.trackingNo}</td>
            <td class="py-3 font-semibold text-slate-800">${s.customer}</td>
            <td class="py-3 text-slate-500">${s.items}</td>
            <td class="py-3"><span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold ${s.status === 'Delivered' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}">${s.status}</span></td>
            <td class="py-3 text-right font-bold text-emerald-600">₱${Number(s.value).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
        </tr>
    `).join('');
}

function renderStaffOperationalReports() {
    const inventorySummary = document.getElementById('staff-report-inventory');
    const orderSummary = document.getElementById('staff-report-orders');
    const shipmentSummary = document.getElementById('staff-report-shipments');
    if (!inventorySummary || !orderSummary || !shipmentSummary) return;

    const totalUnits = inventory.reduce((sum, item) => sum + Number(item.stock || 0), 0);
    const lowStockCount = inventory.filter(item => Number(item.stock) <= LOW_STOCK_THRESHOLD).length;
    const pendingCount = shipments.filter(item => ['Pending', 'Preparing', 'Ready for Dispatch'].includes(item.status)).length;
    const inTransitCount = shipments.filter(item => item.status === 'In Transit').length;
    const deliveredCount = shipments.filter(item => item.status === 'Delivered').length;

    inventorySummary.innerText = `${inventory.length} products · ${totalUnits.toLocaleString()} units · ${lowStockCount} low-stock alerts`;
    orderSummary.innerText = `${shipments.length} orders · ${pendingCount} awaiting processing`;
    shipmentSummary.innerText = `${shipments.length} shipments · ${inTransitCount} in transit · ${deliveredCount} delivered`;
}

function resetDefaultData() {
    localStorage.removeItem('fhwms_shipments');
    localStorage.removeItem('fhwms_inventory');
    localStorage.removeItem('fhwms_customers');
    localStorage.removeItem('fhwms_clientOrders');
    localStorage.removeItem('fhwms_paymentRecords');
    localStorage.removeItem('fhwms_customerCarts');
    shipments = DEFAULT_SHIPMENTS;
    inventory = DEFAULT_INVENTORY;
    customers = DEFAULT_CUSTOMERS;
    clientOrders = [];
    paymentRecords = [];
    customerCarts = {};
    renderShipmentsTable();
    showToast('Sample warehouse data restored!');
}

function addAuditLog(activity) {
    if (!currentUser) return;
    auditLogs.unshift({
        dateTime: new Date().toLocaleString(),
        user: currentUser.name || currentUser.username,
        role: currentUser.role,
        activity
    });
    auditLogs = auditLogs.slice(0, 100);
    Store.set('auditLogs', auditLogs);
}

function renderManageUsers() {
    const staffList = document.getElementById('staff-users-list');
    const clientList = document.getElementById('client-users-list');
    if (!staffList || !clientList) return;

    const staffUsers = users.filter(user => user.role === 'Staff');
    const clientUsers = users.filter(user => user.role === 'Customer');

    staffList.innerHTML = staffUsers.length ? staffUsers.map(user => `
        <div class="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div><p class="font-bold text-slate-800">${user.name}</p><p class="text-slate-400">${user.username}</p></div>
            <span class="px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold">Staff</span>
        </div>
    `).join('') : '<p class="text-slate-400 text-center py-4">No Staff account found.</p>';

    clientList.innerHTML = clientUsers.length ? clientUsers.map(user => `
        <div class="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div><p class="font-bold text-slate-800">${user.name}</p><p class="text-slate-400">${user.username}</p></div>
            <span class="px-2 py-1 rounded-full bg-purple-100 text-purple-700 text-[10px] font-bold">Client</span>
        </div>
    `).join('') : '<p class="text-slate-400 text-center py-4">No Client account found.</p>';
}

function renderStockReceiving() {
    const tbody = document.getElementById('stock-receiving-tbody');
    const skuSelect = document.getElementById('receiving-sku');
    if (!tbody || !skuSelect) return;

    skuSelect.innerHTML = inventory.map(item =>
        `<option value="${item.sku}">${item.sku} - ${item.name}</option>`
    ).join('');

    if (!stockReceipts.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="py-8 text-center text-slate-400">No stock receipts recorded yet.</td></tr>';
        return;
    }

    tbody.innerHTML = stockReceipts.slice(0, 30).map(receipt => `
        <tr class="border-b border-slate-100">
            <td class="py-3 text-slate-500">${receipt.dateTime}</td>
            <td class="py-3 font-bold">${receipt.sku} - ${receipt.product}</td>
            <td class="py-3">${receipt.supplier}</td>
            <td class="py-3 font-bold text-emerald-700">${receipt.quantity}</td>
            <td class="py-3">${receipt.receivedBy}</td>
        </tr>
    `).join('');
}

function confirmStockReceiving(e) {
    if (e) e.preventDefault();
    if (!currentUser || !['Admin', 'Staff'].includes(currentUser.role)) {
        showToast('You are not authorized to receive stock.', 'error');
        return;
    }

    const sku = document.getElementById('receiving-sku').value;
    const supplier = document.getElementById('receiving-supplier').value.trim();
    const quantity = Number(document.getElementById('receiving-quantity').value);
    const item = inventory.find(product => product.sku === sku);
    if (!item || !supplier || !Number.isInteger(quantity) || quantity <= 0) {
        showToast('Select a product, enter a supplier, and enter a quantity greater than zero.', 'error');
        return;
    }

    item.stock = Number(item.stock) + quantity;
    item.status = item.stock <= LOW_STOCK_THRESHOLD ? 'Low Stock' : 'In Stock';
    Store.set('inventory', inventory);
    stockReceipts.unshift({
        dateTime: new Date().toLocaleString(),
        sku,
        product: item.name,
        supplier,
        quantity,
        receivedBy: currentUser.name || currentUser.username
    });
    Store.set('stockReceipts', stockReceipts);
    addAuditLog(`Received ${quantity} units of ${sku} from ${supplier}`);
    document.getElementById('stock-receiving-form').reset();
    renderStockReceiving();
    renderInventoryPanelTable(document.getElementById('inventory-search')?.value || '');
    renderStaffTaskSummary();
    showToast(`Received ${quantity} units of ${sku} from ${supplier}.`);
}

function renderAuditLogs() {
    const tbody = document.getElementById('audit-log-tbody');
    if (!tbody) return;

    if (!auditLogs.length) {
        tbody.innerHTML = '<tr><td colspan="4" class="py-8 text-center text-slate-400">No audit activity recorded.</td></tr>';
        return;
    }

    tbody.innerHTML = auditLogs.map(log => `
        <tr class="border-b border-slate-100">
            <td class="py-3 text-slate-500">${log.dateTime}</td>
            <td class="py-3 font-bold text-slate-800">${log.user}</td>
            <td class="py-3"><span class="px-2 py-1 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">${log.role}</span></td>
            <td class="py-3 text-slate-600">${log.activity}</td>
        </tr>
    `).join('');
}

function addNewInventorySKU() {
    if (!currentUser || currentUser.role !== 'Admin') {
        showToast('Only Admin can add inventory SKUs.', 'error');
        return;
    }
    const sku = 'INV-' + Math.floor(106 + Math.random() * 50);
    inventory.push({ sku, name: 'Specialty Food Sauce Concentrate (Drum 20L)', zone: 'Cold Room 1', stock: 450, status: 'In Stock' });
    Store.set('inventory', inventory);
    addAuditLog(`Added inventory SKU ${sku}`);
    if (activeTab === 'inventory') renderInventoryPanelTable();
    showToast(`Added SKU ${sku} to inventory!`);
}

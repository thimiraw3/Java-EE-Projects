/* =========================================================
   LEDGRR – Single File Application Script
   (Merged api.js + app.js)
========================================================= */

/* =========================================================
   GLOBAL STATE
========================================================= */

const API_BASE = window.location.origin + "/invoicing";

let allInvoices = [];
let allCustomers = [];
let currentInvoiceForPrint = null;

/* =========================================================
   PAGE LOAD
========================================================= */

window.addEventListener("load", async () => {

    try {
        initNav();
        initInvoiceSearch();
        initCustomerSearch();
        initDatePickers();

        await loadDashboard();

    } catch (e) {
        console.error(e);
    }
});


/* =========================================================
   API WRAPPER (Previously api.js)
========================================================= */

async function apiRequest(method, path, body = null, params = null) {

    let url = API_BASE + path;

    if (params) {
        url += "?" + new URLSearchParams(params).toString();
    }

    const options = {
        method,
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const text = await response.text();

    let data;
    try {
        data = JSON.parse(text);
    } catch {
        data = { error: text };
    }

    if (!response.ok) {
        const err = new Error(data.error || `HTTP ${response.status}`);
        err.data = data;
        err.status = response.status;
        throw err;
    }

    return data;
}


/* =========================================================
   API METHODS
========================================================= */

// ---------- INVOICES ----------
async function apiInvoiceList() {
    return apiRequest("GET", "/api/invoices");
}

async function apiInvoiceSearch(q) {
    return apiRequest("GET", "/api/invoices/search", null, { q });
}

async function apiInvoiceGet(id) {
    return apiRequest("GET", `/api/invoices/${id}`);
}

async function apiInvoiceCreate(data) {
    return apiRequest("POST", "/api/invoices", data);
}

async function apiInvoiceUpdate(id, data) {
    return apiRequest("PUT", `/api/invoices/${id}`, data);
}

async function apiInvoiceDelete(id) {
    return apiRequest("DELETE", `/api/invoices/${id}`);
}


// ---------- CUSTOMERS ----------
async function apiCustomerList() {
    return apiRequest("GET", "/api/customers");
}

async function apiCustomerSearch(q) {
    return apiRequest("GET", "/api/customers/search", null, { q });
}

async function apiCustomerGet(id) {
    return apiRequest("GET", `/api/customers/${id}`);
}

async function apiCustomerCreate(data) {
    return apiRequest("POST", "/api/customers", data);
}

async function apiCustomerUpdate(id, data) {
    return apiRequest("PUT", `/api/customers/${id}`, data);
}

async function apiCustomerDelete(id) {
    return apiRequest("DELETE", `/api/customers/${id}`);
}


/* =========================================================
   DASHBOARD
========================================================= */

async function loadDashboard() {

    try {

        const invoices = await apiInvoiceList();
        allInvoices = invoices;

        const paid = invoices.filter(i => i.status === "PAID").length;
        const overdue = invoices.filter(i => i.status === "OVERDUE").length;

        const revenue = invoices
            .filter(i => i.status === "PAID")
            .reduce((sum, i) => sum + (parseFloat(i.totalAmount) || 0), 0);

        document.getElementById("stat-total").textContent = invoices.length;
        document.getElementById("stat-paid").textContent = paid;
        document.getElementById("stat-overdue").textContent = overdue;
        document.getElementById("stat-revenue").textContent = formatCurrency(revenue);

    } catch (e) {
        console.error("Dashboard load failed:", e);
    }
}


/* =========================================================
   INVOICES PAGE
========================================================= */

async function loadInvoicesPage() {

    try {
        allInvoices = await apiInvoiceList();
        renderInvoicesTable(allInvoices);
    } catch (e) {
        toast("Failed to load invoices: " + e.message, "error");
    }
}


/* =========================================================
   SAVE INVOICE
========================================================= */

async function saveInvoice() {

    const id = document.getElementById("inv-id").value;
    const payload = buildInvoicePayload();

    try {

        if (id) {
            await apiInvoiceUpdate(id, payload);
            toast("Invoice updated!", "success");
        } else {
            await apiInvoiceCreate(payload);
            toast("Invoice created!", "success");
        }

        closeInvoiceModal();
        await loadInvoicesPage();
        await loadDashboard();

    } catch (e) {
        toast("Error: " + e.message, "error");
    }
}


/* =========================================================
   CUSTOMERS PAGE
========================================================= */

async function loadCustomersPage() {

    try {
        allCustomers = await apiCustomerList();
        renderCustomersTable(allCustomers);
    } catch (e) {
        toast("Failed to load customers: " + e.message, "error");
    }
}


async function saveCustomer() {

    const id = document.getElementById("cust-id").value;

    const payload = {
        name: document.getElementById("cust-name").value.trim(),
        email: document.getElementById("cust-email").value.trim(),
        phone: document.getElementById("cust-phone").value.trim(),
        address: document.getElementById("cust-address").value.trim()
    };

    try {

        if (id) {
            await apiCustomerUpdate(id, payload);
            toast("Client updated!", "success");
        } else {
            await apiCustomerCreate(payload);
            toast("Client added!", "success");
        }

        closeCustomerModal();
        await loadCustomersPage();

    } catch (e) {
        toast("Error: " + e.message, "error");
    }
}


/* =========================================================
   UTILITIES (UNCHANGED DESIGN)
========================================================= */

function formatCurrency(value) {
    const n = parseFloat(value) || 0;
    return "$" + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function toast(message, type = "info") {
    const container = document.getElementById("toast-container");
    const el = document.createElement("div");
    el.className = `toast ${type}`;
    el.textContent = message;
    container.appendChild(el);

    setTimeout(() => el.remove(), 3000);
}
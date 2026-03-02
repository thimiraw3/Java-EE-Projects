let allInvoices = [];
let allCustomers = [];
let currentInvoiceForPrint = null;

document.addEventListener('DOMContentLoaded', () => {
    initNav();
    initInvoiceSearch();
    initCustomerSearch();
    initDatePickers();
    loadDashboard();

    document.querySelectorAll('.modal-veil').forEach(veil => {
        veil.addEventListener('click', e => {
            if (e.target === veil) veil.style.display = 'none';
        });
    });

    // Tax rate recalc
    document.getElementById('inv-tax-rate')?.addEventListener('input', recalcTotals);
});

// nav
function initNav() {
    document.querySelectorAll('.nav-item').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            navigateTo(link.dataset.page);
        });
    });
}

function navigateTo(page) {
    document.querySelectorAll('.nav-item').forEach(l => l.classList.remove('active'));
    document.querySelector(`.nav-item[data-page="${page}"]`)?.classList.add('active');

    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-' + page)?.classList.add('active');

    const labels = {dashboard: 'Overview', invoices: 'Invoices', customers: 'Clients'};
    document.getElementById('page-title').textContent = labels[page] || page;

    // Topbar controls
    document.getElementById('btn-new-invoice').style.display = page === 'invoices' ? '' : 'none';
    document.getElementById('btn-new-customer').style.display = page === 'customers' ? '' : 'none';
    document.getElementById('invoice-search-pill').style.display = page === 'invoices' ? '' : 'none';
    document.getElementById('customer-search-pill').style.display = page === 'customers' ? '' : 'none';

    if (page === 'dashboard') loadDashboard();
    if (page === 'invoices') loadInvoicesPage();
    if (page === 'customers') loadCustomersPage();
}

// invoice search
function initInvoiceSearch() {
    let timer;
    document.getElementById('global-search').addEventListener('input', e => {
        clearTimeout(timer);
        timer = setTimeout(async () => {
            const q = e.target.value.trim();
            if (!q) {
                renderInvoicesTable(allInvoices);
                return;
            }
            try {
                renderInvoicesTable(await Api.invoices.search(q));
            } catch (err) {
                toast('Search failed: ' + err.message, 'error');
            }
        }, 300);
    });
}

// customer search
function initCustomerSearch() {
    let timer;
    document.getElementById('customer-search').addEventListener('input', e => {
        clearTimeout(timer);
        timer = setTimeout(async () => {
            const q = e.target.value.trim();
            if (!q) {
                renderCustomersTable(allCustomers);
                return;
            }
            try {
                renderCustomersTable(await Api.customers.search(q));
            } catch (err) {
                toast('Search failed: ' + err.message, 'error');
            }
        }, 300);
    });
}

function initDatePickers() {
    flatpickr('#inv-issue-date', {dateFormat: 'Y-m-d'});
    flatpickr('#inv-due-date', {dateFormat: 'Y-m-d'});
}


async function loadDashboard() {
    try {
        const invoices = await Api.invoices.list();
        allInvoices = invoices;

        const paid = invoices.filter(i => i.status === 'PAID').length;
        const overdue = invoices.filter(i => i.status === 'OVERDUE').length;
        const revenue = invoices
            .filter(i => i.status === 'PAID')
            .reduce((sum, i) => sum + (parseFloat(i.totalAmount) || 0), 0);

        document.getElementById('stat-total').textContent = invoices.length;
        document.getElementById('stat-paid').textContent = paid;
        document.getElementById('stat-overdue').textContent = overdue;
        document.getElementById('stat-revenue').textContent = formatCurrency(revenue);

        const recent = invoices.slice(0, 6);
        document.getElementById('dashboard-invoices').innerHTML =
            recent.length ? buildInvoiceTable(recent, false) : emptyState('No invoices yet.');
    } catch (err) {
        document.getElementById('dashboard-invoices').innerHTML =
            `<div class="empty-state"><p style="color:var(--red)">Failed to load: ${esc(err.message)}</p></div>`;
    }
}

async function loadInvoicesPage() {
    const container = document.getElementById('invoices-table-container');
    container.innerHTML = '<div class="shimmer"></div>';
    document.getElementById('global-search').value = '';
    try {
        allInvoices = await Api.invoices.list();
        renderInvoicesTable(allInvoices);
    } catch (err) {
        container.innerHTML = `<div class="empty-state"><p style="color:var(--red)">${esc(err.message)}</p></div>`;
    }
}

function renderInvoicesTable(invoices) {
    document.getElementById('invoices-table-container').innerHTML =
        invoices.length ? buildInvoiceTable(invoices, true)
            : emptyState('No invoices found. Create your first invoice!');
}

function buildInvoiceTable(invoices, showActions) {
    const rows = invoices.map(inv => `
        <tr>
            <td><span class="mono" style="font-size:.82rem;color:var(--text-muted)">${esc(inv.invoiceNumber)}</span></td>
            <td style="font-weight:500">${esc(inv.customer?.name || '—')}</td>
            <td style="color:var(--text-muted)">${formatDate(inv.issueDate)}</td>
            <td style="color:var(--text-muted)">${formatDate(inv.dueDate)}</td>
            <td>${statusBadge(inv.status)}</td>
            <td class="mono" style="font-weight:500;text-align:right">${formatCurrency(inv.totalAmount)}</td>
            ${showActions ? `<td>
                <div class="tbl-actions">
                    <button class="icon-btn" title="View"   onclick="viewInvoice(${inv.id})">&#128065;</button>
                    <button class="icon-btn" title="Edit"   onclick="editInvoice(${inv.id})">&#9998;</button>
                    <button class="icon-btn del" title="Delete" onclick="confirmDeleteInvoice(${inv.id}, '${esc(inv.invoiceNumber)}')">&#128465;</button>
                </div>
            </td>` : ''}
        </tr>`).join('');

    return `<table>
        <thead>
            <tr>
                <th>Invoice #</th><th>Client</th><th>Issued</th>
                <th>Due</th><th>Status</th><th style="text-align:right">Amount</th>
                ${showActions ? '<th></th>' : ''}
            </tr>
        </thead>
        <tbody>${rows}</tbody>
    </table>`;
}

async function openInvoiceModal(invoice = null) {
    try {
        allCustomers = await Api.customers.list();
    } catch {
    }

    clearInvoiceForm();
    populateCustomerDropdown(invoice?.customer?.id);

    if (invoice) {
        document.getElementById('invoice-modal-title').textContent = 'Edit Invoice';
        document.getElementById('inv-id').value = invoice.id;
        document.getElementById('inv-customer').value = invoice.customer?.id || '';
        document.getElementById('inv-status').value = invoice.status;
        document.getElementById('inv-issue-date').value = invoice.issueDate || '';
        document.getElementById('inv-due-date').value = invoice.dueDate || '';
        document.getElementById('inv-tax-rate').value = invoice.taxRate || 0;
        document.getElementById('inv-notes').value = invoice.notes || '';

        document.getElementById('inv-issue-date')._flatpickr?.setDate(invoice.issueDate);
        document.getElementById('inv-due-date')._flatpickr?.setDate(invoice.dueDate);

        invoice.items?.forEach(item => addItemRow(item));
    } else {
        document.getElementById('invoice-modal-title').textContent = 'New Invoice';
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('inv-issue-date').value = today;
        document.getElementById('inv-issue-date')._flatpickr?.setDate(today);
        addItemRow();
    }

    recalcTotals();
    document.getElementById('invoice-modal').style.display = 'flex';
}

function closeInvoiceModal() {
    document.getElementById('invoice-modal').style.display = 'none';
}

function clearInvoiceForm() {
    ['inv-id', 'inv-status', 'inv-tax-rate', 'inv-notes', 'inv-issue-date', 'inv-due-date'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = id === 'inv-status' ? 'DRAFT' : id === 'inv-tax-rate' ? '0' : '';
    });
    document.getElementById('items-tbody').innerHTML = '';
    document.getElementById('invoice-form-errors').style.display = 'none';
    clearFieldErrors();
    recalcTotals();
}

function populateCustomerDropdown(selectedId = null) {
    const sel = document.getElementById('inv-customer');
    sel.innerHTML = '<option value="">— Select client —</option>';
    allCustomers.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.name;
        if (selectedId && c.id == selectedId) opt.selected = true;
        sel.appendChild(opt);
    });
}

// add new row to invoice item
function addItemRow(item = null) {
    const tbody = document.getElementById('items-tbody');
    const rowId = 'row-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
    const tr = document.createElement('tr');
    tr.id = rowId;
    tr.innerHTML = `
        <td><input type="text" placeholder="Description…" value="${esc(item?.description || '')}" class="item-desc" oninput="recalcTotals()"/></td>
        <td class="num-col"><input type="number" min="0.01" step="0.01" value="${item?.quantity ?? 1}" class="item-qty" oninput="recalcRow(this);recalcTotals()"/></td>
        <td class="num-col"><input type="number" min="0" step="0.01" value="${item?.unitPrice ?? ''}" placeholder="0.00" class="item-price" oninput="recalcRow(this);recalcTotals()"/></td>
        <td class="item-total-cell">${formatCurrency((item?.quantity ?? 0) * (item?.unitPrice ?? 0))}</td>
        <td class="act-col"><button type="button" class="icon-btn del" onclick="document.getElementById('${rowId}').remove();recalcTotals();" title="Remove">✕</button></td>`;
    tbody.appendChild(tr);
}

function recalcRow(input) {
    const tr = input.closest('tr');
    const qty = parseFloat(tr.querySelector('.item-qty').value) || 0;
    const prc = parseFloat(tr.querySelector('.item-price').value) || 0;
    tr.querySelector('.item-total-cell').textContent = formatCurrency(qty * prc);
}

function recalcTotals() {
    const taxRate = parseFloat(document.getElementById('inv-tax-rate').value) || 0;
    let subtotal = 0;

    document.querySelectorAll('#items-tbody tr').forEach(tr => {
        const qty = parseFloat(tr.querySelector('.item-qty')?.value) || 0;
        const prc = parseFloat(tr.querySelector('.item-price')?.value) || 0;
        subtotal += qty * prc;
        tr.querySelector('.item-total-cell').textContent = formatCurrency(qty * prc);
    });

    const taxAmt = subtotal * (taxRate / 100);
    const total = subtotal + taxAmt;

    document.getElementById('total-subtotal').textContent = formatCurrency(subtotal);
    document.getElementById('tax-rate-display').textContent = taxRate;
    document.getElementById('total-tax').textContent = formatCurrency(taxAmt);
    document.getElementById('total-grand').textContent = formatCurrency(total);
}

// save invoice
async function saveInvoice() {
    clearFieldErrors();
    const errors = validateInvoiceClient();
    if (errors.length) {
        showErrors('invoice-form-errors', errors);
        return;
    }

    const id = document.getElementById('inv-id').value;
    const payload = buildInvoicePayload();
    const btn = document.getElementById('btn-save-invoice');
    btn.disabled = true;
    btn.textContent = 'Saving…';

    try {
        if (id) await Api.invoices.update(id, payload);
        else await Api.invoices.create(payload);
        toast(id ? 'Invoice updated!' : 'Invoice created!', 'success');
        closeInvoiceModal();
        loadInvoicesPage();
        loadDashboard();
    } catch (err) {
        if (err.data?.errors) showErrors('invoice-form-errors', err.data.errors);
        else toast('Error: ' + err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Save Invoice';
    }
}

function buildInvoicePayload() {
    const items = [];
    document.querySelectorAll('#items-tbody tr').forEach(tr => {
        const desc = tr.querySelector('.item-desc')?.value.trim();
        const qty = tr.querySelector('.item-qty')?.value;
        const prc = tr.querySelector('.item-price')?.value;
        if (desc) items.push({description: desc, quantity: qty, unitPrice: prc});
    });
    return {
        customerId: document.getElementById('inv-customer').value,
        issueDate: document.getElementById('inv-issue-date').value,
        dueDate: document.getElementById('inv-due-date').value,
        status: document.getElementById('inv-status').value,
        taxRate: document.getElementById('inv-tax-rate').value || '0',
        notes: document.getElementById('inv-notes').value,
        items,
    };
}

function validateInvoiceClient() {
    const errors = [];
    const cust = document.getElementById('inv-customer').value;
    const issue = document.getElementById('inv-issue-date').value;
    const due = document.getElementById('inv-due-date').value;

    if (!cust) {
        markInvalid('inv-customer', 'err-customer', 'Client is required.');
        errors.push('Client is required.');
    }
    if (!issue) {
        markInvalid('inv-issue-date', 'err-issue-date', 'Issue date is required.');
        errors.push('Issue date is required.');
    }
    if (!due) {
        markInvalid('inv-due-date', 'err-due-date', 'Due date is required.');
        errors.push('Due date is required.');
    }
    if (issue && due && due < issue) {
        markInvalid('inv-due-date', 'err-due-date', 'Due date must be after issue date.');
        errors.push('Due date must be after issue date.');
    }

    const rows = document.querySelectorAll('#items-tbody tr');
    if (!rows.length) {
        document.getElementById('err-items').textContent = 'Add at least one line item.';
        errors.push('Add at least one line item.');
    } else {
        const anyFilled = [...rows].some(tr => tr.querySelector('.item-desc')?.value.trim());
        if (!anyFilled) {
            document.getElementById('err-items').textContent = 'Each item needs a description.';
            errors.push('Each item needs a description.');
        }
    }
    return errors;
}

async function editInvoice(id) {
    try {
        openInvoiceModal(await Api.invoices.get(id));
    } catch (err) {
        toast('Failed to load invoice: ' + err.message, 'error');
    }
}

function confirmDeleteInvoice(id, number) {
    showConfirm('Delete Invoice',
        `This will permanently delete invoice <strong>${esc(number)}</strong>. This cannot be undone.`,
        async () => {
            try {
                await Api.invoices.delete(id);
                toast('Invoice deleted.', 'success');
                loadInvoicesPage();
                loadDashboard();
            } catch (err) {
                toast('Delete failed: ' + err.message, 'error');
            }
        }
    );
}

// view invoice
async function viewInvoice(id) {
    try {
        const inv = await Api.invoices.get(id);
        currentInvoiceForPrint = inv;
        document.getElementById('view-inv-number').textContent = inv.invoiceNumber;
        document.getElementById('view-invoice-body').innerHTML = buildInvoicePreview(inv);
        document.getElementById('view-invoice-modal').style.display = 'flex';
    } catch (err) {
        toast('Failed to load invoice: ' + err.message, 'error');
    }
}

function buildInvoicePreview(inv) {
    const itemRows = (inv.items || []).map(item => `
        <tr>
            <td>${esc(item.description)}</td>
            <td class="mono" style="text-align:right;color:var(--text-muted)">${item.quantity}</td>
            <td class="mono" style="text-align:right;color:var(--text-muted)">${formatCurrency(item.unitPrice)}</td>
            <td class="mono" style="text-align:right;font-weight:500">${formatCurrency(item.lineTotal)}</td>
        </tr>`).join('');

    return `
        <div class="inv-preview-header">
            <div class="inv-preview-brand">Ledgrr</div>
            <div class="inv-preview-meta">
                <div class="inv-preview-num">${esc(inv.invoiceNumber)}</div>
                ${statusBadge(inv.status)}
            </div>
        </div>
        <div class="inv-preview-grid">
            <div class="inv-preview-section">
                <h4>Bill To</h4>
                <p><strong>${esc(inv.customer?.name || '—')}</strong></p>
                <p>${esc(inv.customer?.email || '')}</p>
                <p>${esc(inv.customer?.phone || '')}</p>
            </div>
            <div class="inv-preview-section">
                <h4>Details</h4>
                <p><strong>Issue Date:</strong> ${formatDate(inv.issueDate)}</p>
                <p><strong>Due Date:</strong> ${formatDate(inv.dueDate)}</p>
                <p><strong>Tax Rate:</strong> ${inv.taxRate}%</p>
            </div>
        </div>
        <div class="data-panel" style="margin-bottom:.75rem">
            <table>
                <thead><tr>
                    <th>Description</th>
                    <th style="text-align:right">Qty</th>
                    <th style="text-align:right">Unit Price</th>
                    <th style="text-align:right">Total</th>
                </tr></thead>
                <tbody>${itemRows}</tbody>
            </table>
        </div>
        <div class="totals-strip">
            <div class="total-row-item"><span>Subtotal</span><span class="mono">${formatCurrency(inv.subtotal)}</span></div>
            <div class="total-row-item"><span>Tax (${inv.taxRate}%)</span><span class="mono">${formatCurrency(inv.taxAmount)}</span></div>
            <div class="total-row-item total-grand"><span>Total Due</span><span class="mono">${formatCurrency(inv.totalAmount)}</span></div>
        </div>
        ${inv.notes ? `<div style="margin-top:1.25rem;padding:1rem;background:var(--ink-3);border-radius:var(--r-sm)"><p style="font-size:.8rem;color:var(--text-faint);margin-bottom:.35rem;text-transform:uppercase;letter-spacing:.06em">Notes</p><p style="font-size:.88rem;color:var(--text-muted)">${esc(inv.notes)}</p></div>` : ''}`;
}

function printInvoice() {
    if (!currentInvoiceForPrint) return;
    const inv = currentInvoiceForPrint;

    const statusColors = {
        PAID: '#16a34a', SENT: '#4f7ef8',
        OVERDUE: '#dc2626', DRAFT: '#64748b', CANCELLED: '#94a3b8'
    };
    const statusColor = statusColors[inv.status] || '#64748b';

    const itemRows = (inv.items || []).map(item => `
        <tr>
            <td>${esc(item.description)}</td>
            <td>${item.quantity}</td>
            <td>${formatCurrency(item.unitPrice)}</td>
            <td><strong>${formatCurrency(item.lineTotal)}</strong></td>
        </tr>`).join('');

    const printHTML = `
        <div class="p-header">
            <div class="p-brand">Ledgrr</div>
            <div class="p-meta">
                <div class="p-invnum">${esc(inv.invoiceNumber)}</div>
                <span class="p-status" style="color:${statusColor};border-color:${statusColor}">${inv.status}</span>
            </div>
        </div>
        <div class="p-grid">
            <div class="p-section">
                <div class="p-section-label">Bill To</div>
                <div class="p-strong">${esc(inv.customer?.name || '—')}</div>
                <div>${esc(inv.customer?.email || '')}</div>
                <div>${esc(inv.customer?.phone || '')}</div>
            </div>
            <div class="p-section" style="text-align:right">
                <div class="p-section-label">Invoice Details</div>
                <div><b>Issue Date:</b> ${formatDate(inv.issueDate)}</div>
                <div><b>Due Date:</b> ${formatDate(inv.dueDate)}</div>
                <div><b>Tax Rate:</b> ${inv.taxRate}%</div>
            </div>
        </div>
        <table>
            <thead><tr><th>Description</th><th>Qty</th><th>Unit Price</th><th>Amount</th></tr></thead>
            <tbody>${itemRows}</tbody>
        </table>
        <div class="p-totals">
            <div class="p-total-row"><span>Subtotal</span><span>${formatCurrency(inv.subtotal)}</span></div>
            <div class="p-total-row"><span>Tax (${inv.taxRate}%)</span><span>${formatCurrency(inv.taxAmount)}</span></div>
            <div class="p-total-row p-total-final"><span>Total Due</span><span>${formatCurrency(inv.totalAmount)}</span></div>
        </div>
        ${inv.notes ? `<div class="p-notes"><div class="p-section-label">Notes</div><div>${esc(inv.notes)}</div></div>` : ''}
        <div class="p-footer">Generated by Ledgrr &middot; ${new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })}</div>
    `;

    // Build a full standalone HTML document
    const doc = `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<title>Invoice ${esc(inv.invoiceNumber)}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',system-ui,sans-serif;color:#1a202e;background:#fff;padding:40px;font-size:13px;line-height:1.55}
.p-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:36px;padding-bottom:20px;border-bottom:2px solid #e4e8f0}
.p-brand{font-size:24px;font-weight:700;color:#4f7ef8;letter-spacing:-.03em}
.p-meta{text-align:right}
.p-invnum{font-size:18px;font-weight:700;font-family:monospace;color:#1a202e}
.p-status{display:inline-block;margin-top:6px;padding:2px 10px;border-radius:99px;font-size:10px;font-weight:700;letter-spacing:.06em;border:1.5px solid}
.p-grid{display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-bottom:32px}
.p-section-label{font-size:9px;font-weight:700;color:#4f7ef8;text-transform:uppercase;letter-spacing:.1em;margin-bottom:7px}
.p-section div{font-size:13px;color:#4a5568;margin:2px 0}
.p-strong{font-weight:600;color:#1a202e}
table{width:100%;border-collapse:collapse}
thead th{background:#f4f6fb;padding:9px 12px;text-align:left;font-size:9px;font-weight:700;color:#8896ab;text-transform:uppercase;letter-spacing:.08em;border-bottom:1.5px solid #e4e8f0}
thead th:not(:first-child){text-align:right}
tbody td{padding:10px 12px;border-bottom:1px solid #e4e8f0;color:#1a202e}
tbody td:not(:first-child){text-align:right;color:#4a5568;font-family:monospace}
tbody tr:last-child td{border-bottom:none}
.p-totals{display:flex;flex-direction:column;align-items:flex-end;gap:5px;padding:14px 12px;background:#f9fafc;border:1.5px solid #e4e8f0;border-radius:6px;margin-top:14px}
.p-total-row{display:flex;gap:48px;font-size:13px;color:#4a5568}
.p-total-row span:last-child{min-width:90px;text-align:right;font-family:monospace}
.p-total-final{font-size:15px;font-weight:700;color:#4f7ef8;border-top:1.5px solid #e4e8f0;padding-top:8px;margin-top:4px;width:100%;justify-content:flex-end}
.p-total-final span:first-child{color:#1a202e}
.p-notes{margin-top:24px;padding:12px 14px;background:#f9fafc;border:1.5px solid #e4e8f0;border-radius:6px}
.p-notes div{font-size:13px;color:#4a5568;margin-top:4px}
.p-footer{margin-top:40px;padding-top:14px;border-top:1px solid #e4e8f0;text-align:center;color:#8896ab;font-size:11px}
@media print{body{padding:0}@page{margin:16mm}}
</style></head><body>${printHTML}</body></html>`;

    // Inject a hidden iframe, write the doc into it, then print that frame
    let frame = document.getElementById('ledgrr-print-frame');
    if (frame) frame.remove();
    frame = document.createElement('iframe');
    frame.id = 'ledgrr-print-frame';
    frame.style.cssText = 'position:fixed;top:0;left:0;width:0;height:0;border:none;visibility:hidden';
    document.body.appendChild(frame);

    const fdoc = frame.contentDocument || frame.contentWindow.document;
    fdoc.open();
    fdoc.write(doc);
    fdoc.close();

    // Wait for iframe to load then print only that frame
    frame.onload = function () {
        frame.contentWindow.focus();
        frame.contentWindow.print();
    };
}


async function loadCustomersPage() {
    const container = document.getElementById('customers-table-container');
    container.innerHTML = '<div class="shimmer"></div>';
    document.getElementById('customer-search').value = '';
    try {
        allCustomers = await Api.customers.list();
        renderCustomersTable(allCustomers);
    } catch (err) {
        container.innerHTML = `<div class="empty-state"><p style="color:var(--red)">${esc(err.message)}</p></div>`;
    }
}

function renderCustomersTable(customers) {
    const container = document.getElementById('customers-table-container');
    if (!customers.length) {
        container.innerHTML = emptyState('No clients yet. Add your first!');
        return;
    }

    const rows = customers.map(c => `
        <tr>
            <td style="font-weight:500">${esc(c.name)}</td>
            <td class="mono" style="font-size:.82rem;color:var(--text-muted)">${esc(c.email)}</td>
            <td class="mono" style="font-size:.82rem;color:var(--text-muted)">${esc(c.phone || '—')}</td>
            <td style="color:var(--text-muted);font-size:.85rem">${esc(c.address || '—')}</td>
            <td>
                <div class="tbl-actions">
                    <button class="icon-btn" onclick="editCustomer(${c.id})" title="Edit">&#9998;</button>
                    <button class="icon-btn del" onclick="confirmDeleteCustomer(${c.id},'${esc(c.name)}')" title="Delete">&#128465;</button>
                </div>
            </td>
        </tr>`).join('');

    container.innerHTML = `<table>
        <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Address</th><th></th></tr></thead>
        <tbody>${rows}</tbody>
    </table>`;
}

// customer model
function openCustomerModal(customer = null) {
    clearCustomerForm();
    if (customer) {
        document.getElementById('customer-modal-title').textContent = 'Edit Client';
        document.getElementById('cust-id').value = customer.id;
        document.getElementById('cust-name').value = customer.name;
        document.getElementById('cust-email').value = customer.email;
        document.getElementById('cust-phone').value = customer.phone || '';
        document.getElementById('cust-address').value = customer.address || '';
    } else {
        document.getElementById('customer-modal-title').textContent = 'New Client';
    }
    document.getElementById('customer-modal').style.display = 'flex';
}

function closeCustomerModal() {
    document.getElementById('customer-modal').style.display = 'none';
}

function clearCustomerForm() {
    ['cust-id', 'cust-name', 'cust-email', 'cust-phone', 'cust-address'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    document.getElementById('customer-form-errors').style.display = 'none';
    document.getElementById('err-cust-name').textContent = '';
    document.getElementById('err-cust-email').textContent = '';
}

async function saveCustomer() {
    const errors = validateCustomerClient();
    if (errors.length) {
        showErrors('customer-form-errors', errors);
        return;
    }

    const id = document.getElementById('cust-id').value;
    const payload = {
        name: document.getElementById('cust-name').value.trim(),
        email: document.getElementById('cust-email').value.trim(),
        phone: document.getElementById('cust-phone').value.trim(),
        address: document.getElementById('cust-address').value.trim(),
    };

    try {
        if (id) await Api.customers.update(id, payload);
        else await Api.customers.create(payload);
        toast(id ? 'Client updated!' : 'Client added!', 'success');
        closeCustomerModal();
        loadCustomersPage();
    } catch (err) {
        if (err.data?.errors) showErrors('customer-form-errors', err.data.errors);
        else toast('Error: ' + err.message, 'error');
    }
}

function validateCustomerClient() {
    const errors = [];
    const name = document.getElementById('cust-name').value.trim();
    const email = document.getElementById('cust-email').value.trim();
    if (!name) {
        markInvalid('cust-name', 'err-cust-name', 'Name is required.');
        errors.push('Name is required.');
    }
    if (!email) {
        markInvalid('cust-email', 'err-cust-email', 'Email is required.');
        errors.push('Email is required.');
    } else if (!/^[\w.+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(email)) {
        markInvalid('cust-email', 'err-cust-email', 'Enter a valid email address.');
        errors.push('Enter a valid email address.');
    }
    return errors;
}

async function editCustomer(id) {
    try {
        openCustomerModal(await Api.customers.get(id));
    } catch (err) {
        toast('Failed to load client: ' + err.message, 'error');
    }
}

function confirmDeleteCustomer(id, name) {
    showConfirm('Delete Client',
        `Delete client <strong>${esc(name)}</strong>? All their invoices will also be removed.`,
        async () => {
            try {
                await Api.customers.delete(id);
                toast('Client deleted.', 'success');
                loadCustomersPage();
            } catch (err) {
                toast('Delete failed: ' + err.message, 'error');
            }
        }
    );
}

// confirm dialog
function showConfirm(title, message, onConfirm) {
    document.getElementById('confirm-title').textContent = title;
    document.getElementById('confirm-message').innerHTML = message;
    document.getElementById('confirm-modal').style.display = 'flex';
    document.getElementById('btn-confirm-ok').onclick = () => {
        closeConfirm();
        onConfirm();
    };
}

function closeConfirm() {
    document.getElementById('confirm-modal').style.display = 'none';
}

function toast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = message;
    container.appendChild(el);
    setTimeout(() => {
        el.style.animation = 'toastOut .3s ease forwards';
        setTimeout(() => el.remove(), 300);
    }, 3000);
}

function showErrors(containerId, errors) {
    const el = document.getElementById(containerId);
    el.style.display = 'block';
    el.innerHTML = errors.length === 1
        ? `⚠ ${esc(errors[0])}`
        : `<ul>${errors.map(e => `<li>${esc(e)}</li>`).join('')}</ul>`;
}

function markInvalid(inputId, errId, message) {
    const input = document.getElementById(inputId);
    const err = document.getElementById(errId);
    if (input) input.classList.add('invalid');
    if (err) err.textContent = message;
    input?.addEventListener('input', () => {
        input.classList.remove('invalid');
        if (err) err.textContent = '';
    }, {once: true});
}

function clearFieldErrors() {
    document.querySelectorAll('.field-err').forEach(e => e.textContent = '');
    document.querySelectorAll('.invalid').forEach(e => e.classList.remove('invalid'));
}

function formatCurrency(value) {
    const n = parseFloat(value) || 0;
    return '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function formatDate(d) {
    if (!d) return '—';
    return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric'
    });
}

function statusBadge(status) {
    const cls = {
        DRAFT: 'badge-draft',
        SENT: 'badge-sent',
        PAID: 'badge-paid',
        OVERDUE: 'badge-overdue',
        CANCELLED: 'badge-cancelled'
    };
    const lbl = {DRAFT: 'Draft', SENT: 'Sent', PAID: 'Paid', OVERDUE: 'Overdue', CANCELLED: 'Cancelled'};
    return `<span class="badge ${cls[status] || ''}">${lbl[status] || status}</span>`;
}

function esc(str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function emptyState(msg) {
    return `<div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
            <path d="M9 12h6m-3-3v6M3 12a9 9 0 1118 0 9 9 0 01-18 0z"/>
        </svg>
        <p>${msg}</p>
    </div>`;
}

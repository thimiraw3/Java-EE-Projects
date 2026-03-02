const API_BASE = '/ems/api';
let token = localStorage.getItem('emp_token') || '';
let currentUser = JSON.parse(localStorage.getItem('emp_user') || 'null');
let currentPage = 1;
let pageSize = 10;
let totalPages = 1;
let totalRecords = 0;
let editingId = null;
let deleteId = null;
let deleteUserId = null;
let changePwUserId = null;
let searchTimer = null;
let allUsersCache = [];

document.addEventListener('DOMContentLoaded', () => {
    if (token && currentUser) {
        showApp();
    }
    document.getElementById('login-password').addEventListener('keydown', e => {
        if (e.key === 'Enter') handleLogin();
    });
    document.getElementById('reg-confirm').addEventListener('keydown', e => {
        if (e.key === 'Enter') handleRegister();
    });
    document.getElementById('dash-date').textContent =
        new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
});

function switchAuthTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.auth-panel').forEach(p => p.classList.remove('active'));
    document.getElementById('tab-' + tab).classList.add('active');
    document.getElementById('panel-' + tab).classList.add('active');

    ['login-error','reg-error','reg-success'].forEach(id => {
        document.getElementById(id).style.display = 'none';
    });

    if (tab === 'login') {
        document.getElementById('auth-title').textContent = 'Welcome Back';
        document.getElementById('auth-subtitle').textContent = '// authenticate to continue';
    } else {
        document.getElementById('auth-title').textContent = 'Create Account';
        document.getElementById('auth-subtitle').textContent = '// register a new user';
    }
}

//  LOGIN
async function handleLogin() {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    const errEl = document.getElementById('login-error');
    const btnText = document.getElementById('login-btn-text');

    if (!username || !password) {
        errEl.textContent = 'Please enter username and password.';
        errEl.style.display = 'block';
        return;
    }

    errEl.style.display = 'none';
    btnText.innerHTML = '<span class="spinner" style="width:16px;height:16px;border-width:2px;border-top-color:#0a0a0f"></span>';

    try {
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Login failed');

        token = data.token;
        currentUser = { username: data.username, role: data.role };
        localStorage.setItem('emp_token', token);
        localStorage.setItem('emp_user', JSON.stringify(currentUser));

        showApp();
        showToast('Welcome back, ' + data.username + '!', 'success');
    } catch (err) {
        errEl.textContent = err.message;
        errEl.style.display = 'block';
        btnText.textContent = 'Sign In';
    }
}

//  REGISTER (from login screen — open to anyone)
async function handleRegister() {
    const username = document.getElementById('reg-username').value.trim();
    const email    = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const confirm  = document.getElementById('reg-confirm').value;
    const role     = document.getElementById('reg-role').value;
    const errEl    = document.getElementById('reg-error');
    const sucEl    = document.getElementById('reg-success');
    const btnText  = document.getElementById('reg-btn-text');

    errEl.style.display = 'none';
    sucEl.style.display = 'none';

    if (!username) { errEl.textContent = 'Username is required.'; errEl.style.display = 'block'; return; }
    if (username.length < 3) { errEl.textContent = 'Username must be at least 3 characters.'; errEl.style.display = 'block'; return; }
    if (!password) { errEl.textContent = 'Password is required.'; errEl.style.display = 'block'; return; }
    if (password.length < 6) { errEl.textContent = 'Password must be at least 6 characters.'; errEl.style.display = 'block'; return; }
    if (password !== confirm) { errEl.textContent = 'Passwords do not match.'; errEl.style.display = 'block'; return; }

    btnText.innerHTML = '<span class="spinner" style="width:16px;height:16px;border-width:2px;border-top-color:#0a0a0f"></span>';

    try {
        const res = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password, role })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Registration failed');

        sucEl.textContent = `Account "${username}" created! You can now sign in.`;
        sucEl.style.display = 'block';

        ['reg-username','reg-email','reg-password','reg-confirm'].forEach(id => document.getElementById(id).value = '');

        setTimeout(() => {
            switchAuthTab('login');
            document.getElementById('login-username').value = username;
        }, 1800);

    } catch (err) {
        errEl.textContent = err.message;
        errEl.style.display = 'block';
    } finally {
        btnText.textContent = 'Create Account';
    }
}

//  LOGOUT
function handleLogout() {
    token = '';
    currentUser = null;
    localStorage.removeItem('emp_token');
    localStorage.removeItem('emp_user');
    document.getElementById('app').classList.remove('visible');
    document.getElementById('app').style.display = 'none';
    const ls = document.getElementById('login-screen');
    ls.classList.remove('hidden');
    document.getElementById('login-username').value = '';
    document.getElementById('login-password').value = '';
    document.getElementById('login-btn-text').textContent = 'Sign In';
    document.getElementById('login-error').style.display = 'none';
    switchAuthTab('login');
    showToast('Logged out successfully', 'info');
}

function showApp() {
    document.getElementById('login-screen').classList.add('hidden');
    const app = document.getElementById('app');
    app.style.display = 'flex';
    app.classList.add('visible');

    if (currentUser) {
        document.getElementById('user-name-header').textContent = currentUser.username;
        document.getElementById('user-role-header').textContent = currentUser.role;
        document.getElementById('user-avatar-header').textContent = currentUser.username.charAt(0).toUpperCase();

        // Show Users nav only for ADMIN
        if (currentUser.role === 'ADMIN') {
            document.getElementById('nav-users').style.display = 'inline-flex';
        }
    }

    loadDashboard();
    loadDepartmentFilter();
}

function authHeaders() {
    return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
}

//  NAVIGATION
function showPage(page, btn) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('page-' + page).classList.add('active');
    btn.classList.add('active');

    if (page === 'employees') {
        currentPage = 1;
        loadEmployees();
    } else if (page === 'dashboard') {
        loadDashboard();
    } else if (page === 'users') {
        loadUsers();
    }
}

//  DASHBOARD
async function loadDashboard() {
    try {
        const res = await fetch(`${API_BASE}/employees/stats/dashboard`, { headers: authHeaders() });
        if (res.status === 401) { handleLogout(); return; }
        const data = await res.json();

        console.log(data);

        document.getElementById('stat-total').textContent = data.totalEmployees || 0;
        document.getElementById('stat-active').textContent = data.activeEmployees || 0;
        document.getElementById('stat-recent').textContent = data.recentHires || 0;
        const avg = data.averageSalary || 0;
        document.getElementById('stat-salary').textContent = '$' + Math.round(avg / 1000) + 'k';

        const depts = data.departmentCounts || [];
        const maxCount = depts.length > 0 ? depts[0][1] : 1;
        const barsEl = document.getElementById('dept-bars');
        if (depts.length === 0) {
            barsEl.innerHTML = '<p style="color:var(--text3);font-size:13px;font-family:var(--font-mono)">No department data yet.</p>';
        } else {
            barsEl.innerHTML = depts.slice(0, 8).map(([dept, cnt]) => `
        <div class="dept-bar-row">
          <div class="dept-bar-label" title="${dept}">${dept}</div>
          <div class="dept-bar-track">
            <div class="dept-bar-fill" style="width:${Math.round(cnt/maxCount*100)}%"></div>
          </div>
          <div class="dept-bar-count">${cnt}</div>
        </div>
      `).join('');
        }

        const empRes = await fetch(`${API_BASE}/employees?page=1&size=6`, { headers: authHeaders() });
        const empData = await empRes.json();
        const recent = empData.data || [];
        const recentEl = document.getElementById('recent-list');

        if (recent.length === 0) {
            recentEl.innerHTML = '<p style="color:var(--text3);font-size:13px;font-family:var(--font-mono)">No employees yet.</p>';
        } else {
            recentEl.innerHTML = recent.map(emp => `
        <div class="recent-item">
          <div class="recent-avatar">${getInitials(emp.name)}</div>
          <div class="recent-info">
            <div class="recent-name">${escHtml(emp.name)}</div>
            <div class="recent-meta">${escHtml(emp.position)} · ${escHtml(emp.department)}</div>
          </div>
          <div class="recent-salary">$${formatNum(emp.salary)}</div>
        </div>
      `).join('');
        }
    } catch (err) {
        console.error('Dashboard error:', err);
    }
}

//  EMPLOYEES CRUD
async function loadEmployees(page = currentPage) {
    currentPage = page;
    const search = document.getElementById('search-input').value.trim();
    const dept   = document.getElementById('filter-dept').value;
    const status = document.getElementById('filter-status').value;

    const params = new URLSearchParams({
        page, size: pageSize,
        ...(search && { name: search }),
        ...(dept   && { department: dept }),
        ...(status && { status }),
    });

    const tbody = document.getElementById('table-body');
    tbody.innerHTML = `<tr><td colspan="7"><div class="loading-overlay"><div class="spinner"></div> Loading...</div></td></tr>`;

    try {
        const res = await fetch(`${API_BASE}/employees?${params}`, { headers: authHeaders() });
        if (res.status === 401) { handleLogout(); return; }
        const data = await res.json();

        const employees = data.data || [];
        totalRecords = data.total || 0;
        totalPages   = data.totalPages || 1;

        if (employees.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7">
        <div class="empty-state">
          <div class="empty-state-icon">◎</div>
          <div class="empty-state-title">No employees found</div>
          <div class="empty-state-sub">// Try adjusting your search filters</div>
        </div>
      </td></tr>`;
        } else {
            tbody.innerHTML = employees.map(emp => `
        <tr id="row-${emp.id}">
          <td>
            <div class="emp-name-cell">
              <div class="emp-avatar-sm">${getInitials(emp.name)}</div>
              <div>
                <div class="emp-name">${escHtml(emp.name)}</div>
                ${emp.email ? `<div class="emp-email">${escHtml(emp.email)}</div>` : ''}
              </div>
            </div>
          </td>
          <td>${escHtml(emp.position)}</td>
          <td><span class="dept-badge">${escHtml(emp.department)}</span></td>
          <td style="font-family:var(--font-mono);font-size:13px">${formatDate(emp.hireDate)}</td>
          <td class="salary-cell">$${formatNum(emp.salary)}</td>
          <td><span class="status-badge ${emp.status || 'ACTIVE'}">${(emp.status || 'ACTIVE').replace('_', ' ')}</span></td>
          <td>
            <div class="actions-cell">
              <button class="btn btn-info btn-sm" onclick="openEditModal(${emp.id})">Edit</button>
              ${currentUser && currentUser.role === 'ADMIN' ?
                `<button class="btn btn-danger btn-sm" onclick="openDeleteModal(${emp.id}, '${escHtml(emp.name)}')">Del</button>` : ''}
            </div>
          </td>
        </tr>
      `).join('');
        }

        renderPagination();
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state">
      <div class="empty-state-icon">⚠</div>
      <div class="empty-state-title">Error loading data</div>
      <div class="empty-state-sub">${err.message}</div>
    </div></td></tr>`;
    }
}

async function loadDepartmentFilter() {
    try {
        const res = await fetch(`${API_BASE}/employees/meta/departments`, { headers: authHeaders() });
        if (!res.ok) return;
        const depts = await res.json();
        const sel = document.getElementById('filter-dept');
        // clear existing options except the first
        while (sel.options.length > 1) sel.remove(1);
        depts.forEach(d => {
            const opt = document.createElement('option');
            opt.value = d; opt.textContent = d;
            sel.appendChild(opt);
        });
    } catch {}
}

function debounceSearch() {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => { currentPage = 1; loadEmployees(1); }, 350);
}

function applyFilters() { currentPage = 1; loadEmployees(1); }

//  PAGINATION
function renderPagination() {
    const start = (currentPage - 1) * pageSize + 1;
    const end   = Math.min(currentPage * pageSize, totalRecords);
    document.getElementById('page-info').textContent =
        totalRecords === 0 ? 'No employees' : `Showing ${start}–${end} of ${totalRecords}`;

    const btnsEl = document.getElementById('page-btns');
    let html = '';
    html += `<button class="page-btn" onclick="loadEmployees(${currentPage-1})" ${currentPage===1?'disabled':''}>‹</button>`;

    getPageRange(currentPage, totalPages).forEach(p => {
        if (p === '...') html += `<button class="page-btn" disabled>…</button>`;
        else html += `<button class="page-btn ${p===currentPage?'active':''}" onclick="loadEmployees(${p})">${p}</button>`;
    });

    html += `<button class="page-btn" onclick="loadEmployees(${currentPage+1})" ${currentPage===totalPages?'disabled':''}>›</button>`;
    btnsEl.innerHTML = html;
}

function getPageRange(cur, total) {
    if (total <= 7) return Array.from({length:total}, (_,i)=>i+1);
    if (cur <= 4)        return [1,2,3,4,5,'...',total];
    if (cur >= total-3)  return [1,'...',total-4,total-3,total-2,total-1,total];
    return [1,'...',cur-1,cur,cur+1,'...',total];
}

//  EMPLOYEE CREATE / EDIT MODAL
function openCreateModal() {
    editingId = null;
    clearForm();
    document.getElementById('modal-title').textContent = 'Add Employee';
    document.getElementById('modal-save-text').textContent = 'Create Employee';
    document.getElementById('modal-error').style.display = 'none';
    document.getElementById('f-hireDate').value = new Date().toISOString().split('T')[0];
    openModal('emp-modal');
}

async function openEditModal(id) {
    try {
        const res = await fetch(`${API_BASE}/employees/${id}`, { headers: authHeaders() });
        if (!res.ok) throw new Error('Failed to load employee');
        const emp = await res.json();

        editingId = id;
        document.getElementById('modal-title').textContent = 'Edit Employee';
        document.getElementById('modal-save-text').textContent = 'Update Employee';
        document.getElementById('modal-error').style.display = 'none';

        document.getElementById('f-name').value       = emp.name || '';
        document.getElementById('f-position').value   = emp.position || '';
        document.getElementById('f-department').value = emp.department || '';
        document.getElementById('f-hireDate').value   = emp.hireDate || '';
        document.getElementById('f-salary').value     = emp.salary || '';
        document.getElementById('f-email').value      = emp.email || '';
        document.getElementById('f-phone').value      = emp.phone || '';
        document.getElementById('f-status').value     = emp.status || 'ACTIVE';

        openModal('emp-modal');
    } catch (err) {
        showToast('Error loading employee: ' + err.message, 'error');
    }
}

async function saveEmployee() {
    const saveBtn  = document.getElementById('modal-save-btn');
    const saveText = document.getElementById('modal-save-text');
    const errEl    = document.getElementById('modal-error');

    const body = {
        name:       document.getElementById('f-name').value.trim(),
        position:   document.getElementById('f-position').value.trim(),
        department: document.getElementById('f-department').value.trim(),
        hireDate:   document.getElementById('f-hireDate').value,
        salary:     parseFloat(document.getElementById('f-salary').value),
        email:      document.getElementById('f-email').value.trim() || null,
        phone:      document.getElementById('f-phone').value.trim() || null,
        status:     document.getElementById('f-status').value,
    };

    if (!body.name || !body.position || !body.department || !body.hireDate || !body.salary) {
        errEl.textContent = 'Please fill all required fields.';
        errEl.style.display = 'block';
        return;
    }

    saveText.innerHTML = '<span class="spinner" style="width:14px;height:14px;border-width:2px;border-top-color:#0a0a0f"></span>';
    saveBtn.disabled = true;
    errEl.style.display = 'none';

    try {
        const url    = editingId ? `${API_BASE}/employees/${editingId}` : `${API_BASE}/employees`;
        const method = editingId ? 'PUT' : 'POST';
        const res    = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(body) });
        const data   = await res.json();
        if (!res.ok) throw new Error(data.error || 'Save failed');

        closeModal('emp-modal');
        loadEmployees();
        loadDashboard();
        loadDepartmentFilter();
        showToast(editingId ? 'Employee updated!' : 'Employee created!', 'success');

        if (data.id) {
            setTimeout(() => {
                const row = document.getElementById('row-' + data.id);
                if (row) { row.classList.add('highlight-row'); setTimeout(() => row.classList.remove('highlight-row'), 2000); }
            }, 300);
        }
    } catch (err) {
        errEl.textContent = err.message;
        errEl.style.display = 'block';
    } finally {
        saveText.textContent = editingId ? 'Update Employee' : 'Create Employee';
        saveBtn.disabled = false;
    }
}

//  DELETE EMPLOYEE
function openDeleteModal(id, name) {
    deleteId = id;
    document.getElementById('delete-name').textContent = name;
    openModal('delete-modal');
}

async function confirmDelete() {
    if (!deleteId) return;
    const btn = document.getElementById('confirm-delete-btn');
    btn.textContent = 'Deleting...';
    btn.disabled = true;

    try {
        const res = await fetch(`${API_BASE}/employees/${deleteId}`, { method: 'DELETE', headers: authHeaders() });
        if (!res.ok) throw new Error('Delete failed');
        closeModal('delete-modal');
        loadEmployees();
        loadDashboard();
        showToast('Employee deleted successfully', 'success');
    } catch (err) {
        showToast('Error: ' + err.message, 'error');
    } finally {
        btn.textContent = 'Delete Employee';
        btn.disabled = false;
        deleteId = null;
    }
}

//  USERS PAGE
async function loadUsers() {
    const tbody = document.getElementById('users-table-body');
    tbody.innerHTML = `<tr><td colspan="6"><div class="loading-overlay"><div class="spinner"></div> Loading users...</div></td></tr>`;

    try {
        const res = await fetch(`${API_BASE}/users`, { headers: authHeaders() });
        if (res.status === 401) { handleLogout(); return; }
        if (res.status === 403) {
            tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state">
        <div class="empty-state-icon">🔒</div>
        <div class="empty-state-title">Access Denied</div>
        <div class="empty-state-sub">// Admin role required</div>
      </div></td></tr>`;
            return;
        }
        const users = await res.json();
        allUsersCache = users;
        renderUsersTable(users);
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state">
      <div class="empty-state-icon">⚠</div>
      <div class="empty-state-title">Error loading users</div>
      <div class="empty-state-sub">${err.message}</div>
    </div></td></tr>`;
    }
}

function renderUsersTable(users) {
    const tbody = document.getElementById('users-table-body');
    if (users.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state">
      <div class="empty-state-icon">◎</div>
      <div class="empty-state-title">No users found</div>
    </div></td></tr>`;
        return;
    }
    tbody.innerHTML = users.map((u, i) => `
    <tr>
      <td style="font-family:var(--font-mono);color:var(--text3)">${i + 1}</td>
      <td>
        <div class="emp-name-cell">
          <div class="emp-avatar-sm">${u.username.charAt(0).toUpperCase()}</div>
          <div class="emp-name">${escHtml(u.username)}</div>
        </div>
      </td>
      <td style="font-family:var(--font-mono);font-size:13px;color:var(--text3)">${escHtml(u.email || '—')}</td>
      <td><span class="role-badge ${u.role}">${u.role}</span></td>
      <td style="font-family:var(--font-mono);font-size:13px">${formatDate(u.createdAt)}</td>
      <td>
        <div class="actions-cell">
          <button class="btn btn-info btn-sm" onclick="openChangePwModal(${u.id}, '${escHtml(u.username)}')">Change PW</button>
          ${u.username !== currentUser.username ?
        `<button class="btn btn-danger btn-sm" onclick="openDeleteUserModal(${u.id}, '${escHtml(u.username)}')">Del</button>` :
        `<span style="font-size:12px;color:var(--text3);font-family:var(--font-mono);padding:0 4px">(you)</span>`}
        </div>
      </td>
    </tr>
  `).join('');
}

function filterUsersTable() {
    const q = document.getElementById('user-search-input').value.toLowerCase();
    const filtered = allUsersCache.filter(u =>
        u.username.toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q)
    );
    renderUsersTable(filtered);
}

//  CREATE USER (from Users page — ADMIN only)
function openCreateUserModal() {
    document.getElementById('user-modal-title').textContent = 'Add User';
    document.getElementById('user-modal-save-text').textContent = 'Create User';
    document.getElementById('user-modal-error').style.display = 'none';
    ['u-username','u-email','u-password','u-confirm'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('u-role').value = 'USER';
    document.getElementById('u-password-group').style.display = 'block';
    document.getElementById('u-confirm-group').style.display = 'block';
    openModal('user-modal');
}

async function saveUser() {
    const saveBtn  = document.getElementById('user-modal-save-btn');
    const saveText = document.getElementById('user-modal-save-text');
    const errEl    = document.getElementById('user-modal-error');

    const username = document.getElementById('u-username').value.trim();
    const email    = document.getElementById('u-email').value.trim();
    const password = document.getElementById('u-password').value;
    const confirm  = document.getElementById('u-confirm').value;
    const role     = document.getElementById('u-role').value;

    errEl.style.display = 'none';

    if (!username || username.length < 3) { errEl.textContent = 'Username must be at least 3 characters.'; errEl.style.display = 'block'; return; }
    if (!password || password.length < 6) { errEl.textContent = 'Password must be at least 6 characters.'; errEl.style.display = 'block'; return; }
    if (password !== confirm) { errEl.textContent = 'Passwords do not match.'; errEl.style.display = 'block'; return; }

    saveText.innerHTML = '<span class="spinner" style="width:14px;height:14px;border-width:2px;border-top-color:#0a0a0f"></span>';
    saveBtn.disabled = true;

    try {
        const res  = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ username, email, password, role })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to create user');

        closeModal('user-modal');
        loadUsers();
        showToast(`User "${username}" created!`, 'success');
    } catch (err) {
        errEl.textContent = err.message;
        errEl.style.display = 'block';
    } finally {
        saveText.textContent = 'Create User';
        saveBtn.disabled = false;
    }
}

//  CHANGE PASSWORD
function openChangePwModal(userId, username) {
    changePwUserId = userId;
    document.getElementById('chpw-username').textContent = username;
    document.getElementById('chpw-new').value = '';
    document.getElementById('chpw-confirm').value = '';
    document.getElementById('chpw-error').style.display = 'none';
    openModal('chpw-modal');
}

async function saveChangePassword() {
    const saveBtn  = document.getElementById('chpw-save-btn');
    const saveText = document.getElementById('chpw-save-text');
    const errEl    = document.getElementById('chpw-error');
    const newPw    = document.getElementById('chpw-new').value;
    const confirm  = document.getElementById('chpw-confirm').value;

    errEl.style.display = 'none';
    if (!newPw || newPw.length < 6) { errEl.textContent = 'Password must be at least 6 characters.'; errEl.style.display = 'block'; return; }
    if (newPw !== confirm)           { errEl.textContent = 'Passwords do not match.';                 errEl.style.display = 'block'; return; }

    saveText.innerHTML = '<span class="spinner" style="width:14px;height:14px;border-width:2px;border-top-color:#0a0a0f"></span>';
    saveBtn.disabled = true;

    try {
        const res  = await fetch(`${API_BASE}/users/${changePwUserId}/password`, {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify({ password: newPw })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update password');

        closeModal('chpw-modal');
        showToast('Password updated successfully!', 'success');
    } catch (err) {
        errEl.textContent = err.message;
        errEl.style.display = 'block';
    } finally {
        saveText.textContent = 'Update Password';
        saveBtn.disabled = false;
    }
}

//  DELETE USER
function openDeleteUserModal(id, username) {
    deleteUserId = id;
    document.getElementById('delete-user-name').textContent = username;
    openModal('delete-user-modal');
}

async function confirmDeleteUser() {
    if (!deleteUserId) return;
    const btn = document.getElementById('confirm-delete-user-btn');
    btn.textContent = 'Deleting...';
    btn.disabled = true;

    try {
        const res = await fetch(`${API_BASE}/users/${deleteUserId}`, { method: 'DELETE', headers: authHeaders() });
        if (!res.ok) throw new Error('Delete failed');
        closeModal('delete-user-modal');
        loadUsers();
        showToast('User deleted', 'success');
    } catch (err) {
        showToast('Error: ' + err.message, 'error');
    } finally {
        btn.textContent = 'Delete User';
        btn.disabled = false;
        deleteUserId = null;
    }
}

//  PDF EXPORT
async function exportPDF() {
    showToast('Generating PDF...', 'info');
    try {
        const search = document.getElementById('search-input').value.trim();
        const dept   = document.getElementById('filter-dept').value;
        const status = document.getElementById('filter-status').value;
        const params = new URLSearchParams({ page: 1, size: 1000,
            ...(search && { name: search }),
            ...(dept   && { department: dept }),
            ...(status && { status }),
        });
        const res  = await fetch(`${API_BASE}/employees?${params}`, { headers: authHeaders() });
        const data = await res.json();
        const employees = data.data || [];

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

        doc.setFillColor(10, 10, 15);
        doc.rect(0, 0, 297, 297, 'F');
        doc.setFillColor(30, 30, 40);
        doc.rect(0, 0, 297, 28, 'F');
        doc.setTextColor(232, 255, 71);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('EMS — EMPLOYEE MANAGEMENT SYSTEM', 14, 10);
        doc.setTextColor(200, 200, 200);
        doc.setFontSize(16);
        doc.text('Employee Report', 14, 22);
        doc.setFontSize(9);
        doc.setTextColor(150, 150, 160);
        doc.text(`Generated: ${new Date().toLocaleString()}  |  Total: ${employees.length} employees`, 14, 29);

        doc.autoTable({
            startY: 35,
            head: [['#', 'Name', 'Position', 'Department', 'Hire Date', 'Salary', 'Status']],
            body: employees.map((emp, i) => [
                i + 1, emp.name, emp.position, emp.department,
                formatDate(emp.hireDate), `$${formatNum(emp.salary)}`,
                (emp.status || 'ACTIVE').replace('_', ' ')
            ]),
            styles: { fontSize: 9, cellPadding: 4, textColor: [220, 220, 230], fillColor: [18, 18, 25], lineColor: [42, 42, 56], lineWidth: 0.3 },
            headStyles: { fillColor: [30, 30, 40], textColor: [232, 255, 71], fontStyle: 'bold', fontSize: 8 },
            alternateRowStyles: { fillColor: [24, 24, 32] },
            theme: 'grid'
        });

        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(80, 80, 100);
            doc.text(`Page ${i} of ${pageCount}`, 250, 200);
        }

        doc.save(`employees_report_${new Date().toISOString().split('T')[0]}.pdf`);
        showToast('PDF exported successfully!', 'success');
    } catch (err) {
        showToast('PDF export failed: ' + err.message, 'error');
        console.error(err);
    }
}

//  MODAL HELPERS
function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
        if (e.target === overlay) overlay.classList.remove('open');
    });
});

function clearForm() {
    ['f-name','f-position','f-department','f-hireDate','f-salary','f-email','f-phone'].forEach(id => {
        document.getElementById(id).value = '';
    });
    document.getElementById('f-status').value = 'ACTIVE';
}

//  TOAST
function showToast(msg, type = 'info') {
    const icons = { success: '✓', error: '✕', info: '◈' };
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span class="toast-icon">${icons[type]}</span><span>${msg}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('out');
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

//  UTILITIES
function getInitials(name) {
    if (!name) return '?';
    const parts = name.split(' ');
    return parts.length >= 2
        ? (parts[0][0] + parts[parts.length-1][0]).toUpperCase()
        : name.slice(0,2).toUpperCase();
}

function formatNum(n) {
    if (n == null) return '0';
    return Number(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatDate(d) {
    if (!d) return '—';
    const date = new Date(d);
    return date.toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' });
}

function escHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
// ==========================================
// admin.js
// ==========================================

if (!getToken()) window.location.href = '/index.html';

document.addEventListener('DOMContentLoaded', () => {
    loadStats();
    loadCategories();
    loadUsers();
});

async function loadStats() {
    try {
        const data = await apiFetch('/api/admin/stats');
        document.getElementById('totalUsers').textContent    = data.totalUsers    || 0;
        document.getElementById('totalSessions').textContent = data.totalSessions || 0;
    } catch (err) {
        if (err.message === 'Unauthorized' || err.message.includes('403')) {
            alert('Admin access required.');
            window.location.href = '/dashboard.html';
        }
    }
}

async function loadCategories() {
    try {
        const cats = await apiFetch('/api/admin/categories');
        const wrap = document.getElementById('categoriesTable');
        if (!wrap) return;

        if (!cats || cats.length === 0) {
            wrap.innerHTML = '<div class="empty-state">No categories found.</div>';
            return;
        }

        wrap.innerHTML = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Icon</th>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                ${cats.map(c => `
                <tr>
                    <td>${c.id}</td>
                    <td style="font-size:1.3rem">${c.iconClass || '📋'}</td>
                    <td><strong>${escHtml(c.name)}</strong></td>
                    <td>${escHtml(c.description || '')}</td>
                    <td>
                        <span class="status-dot ${c.active ? 'active' : 'inactive'}"></span>
                        ${c.active ? 'Active' : 'Inactive'}
                    </td>
                    <td>
                        <button class="toggle-btn ${c.active ? 'active' : 'inactive'}"
                                onclick="toggleCategory(${c.id})">
                            ${c.active ? 'Disable' : 'Enable'}
                        </button>
                    </td>
                </tr>`).join('')}
            </tbody>
        </table>`;
    } catch (err) {
        console.error('Categories error:', err);
    }
}

async function loadUsers() {
    try {
        const users = await apiFetch('/api/admin/users');
        const wrap  = document.getElementById('usersTable');
        if (!wrap) return;

        if (!users || users.length === 0) {
            wrap.innerHTML = '<div class="empty-state">No users found.</div>';
            return;
        }

        wrap.innerHTML = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Username</th>
                    <th>Full Name</th>
                    <th>Email</th>
                    <th>Roles</th>
                    <th>Status</th>
                    <th>Joined</th>
                </tr>
            </thead>
            <tbody>
                ${users.map(u => `
                <tr>
                    <td>${u.id}</td>
                    <td><strong>${escHtml(u.username)}</strong></td>
                    <td>${escHtml(u.fullName || '—')}</td>
                    <td>${escHtml(u.email)}</td>
                    <td>${(u.roles || []).map(r =>
                        `<span class="badge ${r.name === 'ROLE_ADMIN' ? 'badge-admin-role' : 'badge-completed'}"
                               style="font-size:0.7rem">${r.name.replace('ROLE_','')}</span>`
                    ).join(' ')}</td>
                    <td>
                        <span class="status-dot ${u.active ? 'active' : 'inactive'}"></span>
                        ${u.active ? 'Active' : 'Inactive'}
                    </td>
                    <td>${u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN') : '—'}</td>
                </tr>`).join('')}
            </tbody>
        </table>`;
    } catch (err) {
        console.error('Users error:', err);
    }
}

function showAddCategory() {
    document.getElementById('addCategoryForm').style.display = 'flex';
}
function hideAddCategory() {
    document.getElementById('addCategoryForm').style.display = 'none';
    document.getElementById('catName').value  = '';
    document.getElementById('catDesc').value  = '';
    document.getElementById('catIcon').value  = '';
}

async function addCategory() {
    const name = document.getElementById('catName').value.trim();
    const desc = document.getElementById('catDesc').value.trim();
    const icon = document.getElementById('catIcon').value.trim();

    if (!name) { alert('Category name is required.'); return; }

    try {
        await apiFetch('/api/admin/categories', {
            method: 'POST',
            body: JSON.stringify({ name, description: desc, iconClass: icon, active: true })
        });
        hideAddCategory();
        loadCategories();
    } catch (err) {
        alert('Failed to add category: ' + err.message);
    }
}

async function toggleCategory(id) {
    try {
        await apiFetch(`/api/admin/categories/${id}/toggle`, { method: 'PUT' });
        loadCategories();
    } catch (err) {
        alert('Failed to toggle category: ' + err.message);
    }
}

function escHtml(str) {
    return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;')
                      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

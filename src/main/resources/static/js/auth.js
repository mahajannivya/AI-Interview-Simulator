// ==========================================
// auth.js — Shared Auth Utilities
// ==========================================

const API = '';  // same origin

function getToken() { return localStorage.getItem('jwt_token'); }
function getUser()  { return JSON.parse(localStorage.getItem('user_data') || 'null'); }

function requireAuth() {
    if (!getToken()) {
        window.location.href = '/index.html';
        return false;
    }
    return true;
}

function logout() {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_data');
    window.location.href = '/index.html';
}

async function apiFetch(path, options = {}) {
    const token = getToken();
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    if (token) headers['Authorization'] = 'Bearer ' + token;

    const res = await fetch(API + path, { ...options, headers });

    if (res.status === 401) {
        logout();
        throw new Error('Unauthorized');
    }
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(err.error || err.message || 'Request failed');
    }
    // 204 No Content
    if (res.status === 204) return null;
    return res.json();
}

// ---- Login Form ----
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    // Already logged in → redirect
    if (getToken()) window.location.href = '/dashboard.html';

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('loginBtn');
        const errEl = document.getElementById('error-msg');
        errEl.style.display = 'none';
        btn.textContent = 'Signing in...';
        btn.disabled = true;

        try {
            const data = await apiFetch('/api/auth/login', {
                method: 'POST',
                body: JSON.stringify({
                    username: document.getElementById('username').value.trim(),
                    password: document.getElementById('password').value
                })
            });
            localStorage.setItem('jwt_token', data.token);
            localStorage.setItem('user_data', JSON.stringify(data));
            window.location.href = '/dashboard.html';
        } catch (err) {
            errEl.textContent = err.message || 'Invalid username or password';
            errEl.style.display = 'block';
            btn.textContent = 'Sign In';
            btn.disabled = false;
        }
    });
}

// ---- Register Form ----
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    if (getToken()) window.location.href = '/dashboard.html';

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('registerBtn');
        const errEl = document.getElementById('error-msg');
        const okEl  = document.getElementById('success-msg');
        errEl.style.display = 'none';
        okEl.style.display  = 'none';
        btn.textContent = 'Creating account...';
        btn.disabled = true;

        try {
            const data = await apiFetch('/api/auth/register', {
                method: 'POST',
                body: JSON.stringify({
                    fullName: document.getElementById('fullName').value.trim(),
                    username: document.getElementById('username').value.trim(),
                    email:    document.getElementById('email').value.trim(),
                    password: document.getElementById('password').value
                })
            });
            localStorage.setItem('jwt_token', data.token);
            localStorage.setItem('user_data', JSON.stringify(data));
            okEl.textContent = 'Account created! Redirecting...';
            okEl.style.display = 'block';
            setTimeout(() => window.location.href = '/dashboard.html', 1000);
        } catch (err) {
            errEl.textContent = err.message || 'Registration failed';
            errEl.style.display = 'block';
            btn.textContent = 'Create Account';
            btn.disabled = false;
        }
    });
}

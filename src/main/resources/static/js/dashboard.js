// ==========================================
// dashboard.js
// ==========================================

if (!getToken()) window.location.href = '/index.html';

const user = getUser();
let categories = [];
let customCategoryId = null;

document.addEventListener('DOMContentLoaded', () => {
    loadProfile();
    loadCategories();
    loadHistory();
    loadStats();

    // Set nav username
    const navUser = document.getElementById('navUsername');
    if (navUser && user) navUser.textContent = user.fullName || user.username;
});

function getSelectedInterviewMode() {

    return document.querySelector(
        'input[name="interviewMode"]:checked'
    ).value;

}
async function loadProfile() {
    try {
        const u = getUser();
        if (!u) return;
        const nameEl = document.getElementById('profileName');
        const emailEl = document.getElementById('profileEmail');
        const avatarEl = document.getElementById('avatarInitial');
        const joinedEl = document.getElementById('profileJoined');

        if (nameEl) nameEl.textContent = u.fullName || u.username;
        if (emailEl) emailEl.textContent = u.email;
        if (avatarEl) avatarEl.textContent = (u.fullName || u.username || '?')[0].toUpperCase();
        if (joinedEl) joinedEl.textContent = 'Member since joining';
    } catch (err) {
        console.error('Profile load error:', err);
    }
}

async function loadStats() {
    try {
        const data = await apiFetch('/api/analytics');
        document.getElementById('statTotal').textContent     = data.totalInterviews || 0;
        document.getElementById('statCompleted').textContent = data.completedInterviews || 0;
        const avg = data.overallAvgScore;
        document.getElementById('statAvgScore').textContent  =
            avg ? avg.toFixed(1) : '—';
    } catch (err) {
        console.error('Stats load error:', err);
    }
}

async function loadCategories() {
    try {
        categories = await apiFetch('/api/interviews/categories');
        const grid = document.getElementById('categoryGrid');
        if (!grid) return;
        grid.innerHTML = '';

        categories.forEach(cat => {
            const card = document.createElement('div');
            card.className = 'category-card';
            card.innerHTML = `
                <span class="category-icon">${cat.iconClass || '📋'}</span>
                <div class="category-name">${cat.name}</div>
                <div class="category-desc">${cat.description || ''}</div>
            `;
            card.addEventListener('click', () => handleCategoryClick(cat));
            grid.appendChild(card);
        });
    } catch (err) {
        const grid = document.getElementById('categoryGrid');
        if (grid) grid.innerHTML = '<p style="color:red">Failed to load categories</p>';
    }
}

function handleCategoryClick(cat) {
    if (cat.name === 'Custom Topic') {
        customCategoryId = cat.id;
        document.getElementById('customModal').style.display = 'flex';
        setTimeout(() => document.getElementById('customTopicInput').focus(), 100);
    } else {
        startInterview(cat.id, null);
    }
}

function closeModal() {
    document.getElementById('customModal').style.display = 'none';
    document.getElementById('customTopicInput').value = '';
}

function startCustomInterview() {
    const topic = document.getElementById('customTopicInput').value.trim();
    if (!topic) {
        alert('Please enter a topic.');
        return;
    }
    closeModal();
    startInterview(customCategoryId, topic);
}

async function startInterview(categoryId, customTopic) {
     sessionStorage.setItem(
           "interview_mode",
     getSelectedInterviewMode()
      );
    try {
        const payload = { categoryId };
        if (customTopic) payload.customTopic = customTopic;

        const res = await apiFetch('/api/interviews/start', {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        // Store session state for interview page
        // Bug fix: include category name so interview.js can display it in the sidebar
        const catObj = categories.find(c => c.id === categoryId);
        sessionStorage.setItem('interview_session', JSON.stringify({
            sessionId: res.sessionId,
            questionId: res.questionId,
            questionText: res.questionText,
            questionOrder: res.questionOrder,
            category: catObj ? catObj.name : 'Interview'
        }));

        window.location.href = '/interview.html';
    } catch (err) {
        alert('Failed to start interview: ' + err.message);
    }
}

async function loadHistory() {
    try {
        const sessions = await apiFetch('/api/interviews/history');
        const el = document.getElementById('sessionsList');
        if (!el) return;

        if (!sessions || sessions.length === 0) {
            el.innerHTML = '<div class="empty-state">No interviews yet. Start your first one above! 🚀</div>';
            return;
        }

        el.innerHTML = sessions.slice(0, 8).map(s => {
            const date = new Date(s.startedAt).toLocaleDateString('en-IN',
                { day: 'numeric', month: 'short', year: 'numeric' });
            const score = s.avgScore ? s.avgScore.toFixed(1) : '—';
            const badgeClass = s.status === 'COMPLETED' ? 'badge-completed' : 'badge-inprogress';
            const badgeText  = s.status === 'COMPLETED' ? 'Completed' : 'In Progress';
            const clickable  = s.status === 'COMPLETED' ? `onclick="viewResult(${s.id})"` : '';
            const scoreColor = s.avgScore
                ? (s.avgScore >= 7 ? 'color:var(--success)' :
                   s.avgScore >= 4 ? 'color:var(--warning)' : 'color:var(--danger)')
                : '';

            return `
                <div class="session-item" ${clickable} style="${s.status==='COMPLETED'?'cursor:pointer':''}">
                    <div>
                        <div class="session-category">${s.categoryName}
                            ${s.customTopic ? `<span class="muted">— ${s.customTopic}</span>` : ''}
                        </div>
                        <div class="session-meta">
                            ${date} · ${s.totalQuestions} questions
                            <span class="badge ${badgeClass}" style="margin-left:8px">${badgeText}</span>
                        </div>
                    </div>
                    <div class="session-score" style="${scoreColor}">${score}</div>
                </div>`;
        }).join('');
    } catch (err) {
        console.error('History load error:', err);
    }
}

function viewResult(sessionId) {
    sessionStorage.setItem('result_session_id', sessionId);
    window.location.href = '/results.html';
}

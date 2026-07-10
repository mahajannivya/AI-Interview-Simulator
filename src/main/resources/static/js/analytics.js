// ==========================================
// analytics.js
// ==========================================

if (!getToken()) window.location.href = '/index.html';

document.addEventListener('DOMContentLoaded', () => {
    const user = getUser();
    const navUser = document.getElementById('navUsername');
    if (navUser && user) navUser.textContent = user.fullName || user.username;
    loadAnalytics();
});

async function loadAnalytics() {
    try {
        const data = await apiFetch('/api/analytics');

        document.getElementById('totalInterviews').textContent     = data.totalInterviews   || 0;
        document.getElementById('completedInterviews').textContent = data.completedInterviews || 0;

        const avg = data.overallAvgScore;
        document.getElementById('avgScore').textContent = avg ? avg.toFixed(1) : '—';

        // Best category
        const catScores = data.categoryScores || {};
        const entries   = Object.entries(catScores);
        if (entries.length > 0) {
            const best = entries.sort((a, b) => b[1] - a[1])[0];
            document.getElementById('bestCategory').textContent = best[0];
        } else {
            document.getElementById('bestCategory').textContent = '—';
        }

        renderHistoryChart(data.scoreHistory || []);
        renderCategoryBars(catScores);
        renderWeakAreas(catScores);

    } catch (err) {
        console.error('Analytics error:', err);
    }
}

function renderHistoryChart(history) {
    const canvas = document.getElementById('historyChart');
    const noMsg  = document.getElementById('noHistoryMsg');

    if (!history || history.length === 0) {
        if (canvas) canvas.style.display = 'none';
        if (noMsg)  noMsg.style.display  = 'block';
        return;
    }

    if (!canvas) return;
    canvas.style.display = 'block';
    if (noMsg) noMsg.style.display = 'none';

    const ctx = canvas.getContext('2d');
    const W = canvas.parentElement.clientWidth - 48;
    const H = 200;
    canvas.width  = W;
    canvas.height = H;

    const pad   = { top: 20, right: 20, bottom: 40, left: 40 };
    const chartW = W - pad.left - pad.right;
    const chartH = H - pad.top  - pad.bottom;
    const n      = history.length;

    ctx.clearRect(0, 0, W, H);

    // Grid lines
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth   = 1;
    [0, 2, 4, 6, 8, 10].forEach(v => {
        const y = pad.top + chartH - (v / 10) * chartH;
        ctx.beginPath();
        ctx.moveTo(pad.left, y);
        ctx.lineTo(pad.left + chartW, y);
        ctx.stroke();
        ctx.fillStyle = '#9CA3AF';
        ctx.font = '11px sans-serif';
        ctx.fillText(v, pad.left - 22, y + 4);
    });

    // X labels
    history.forEach((entry, i) => {
        const x = pad.left + (n === 1 ? chartW / 2 : (i / (n - 1)) * chartW);
        ctx.fillStyle = '#9CA3AF';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(entry.date.slice(5), x, H - 8);
    });

    // Line
    ctx.beginPath();
    ctx.strokeStyle = '#4F46E5';
    ctx.lineWidth   = 2.5;
    ctx.lineJoin    = 'round';
    history.forEach((entry, i) => {
        const x = pad.left + (n === 1 ? chartW / 2 : (i / (n - 1)) * chartW);
        const y = pad.top + chartH - ((entry.score || 0) / 10) * chartH;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Fill under line
    ctx.lineTo(pad.left + (n === 1 ? chartW / 2 : chartW), pad.top + chartH);
    ctx.lineTo(pad.left, pad.top + chartH);
    ctx.closePath();
    ctx.fillStyle = 'rgba(79,70,229,0.08)';
    ctx.fill();

    // Dots
    history.forEach((entry, i) => {
        const x = pad.left + (n === 1 ? chartW / 2 : (i / (n - 1)) * chartW);
        const y = pad.top + chartH - ((entry.score || 0) / 10) * chartH;
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#4F46E5';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth   = 2;
        ctx.stroke();
    });
}

function renderCategoryBars(catScores) {
    const container = document.getElementById('categoryBars');
    if (!container) return;

    const entries = Object.entries(catScores);
    if (entries.length === 0) {
        container.innerHTML = '<div class="empty-state">No topic data yet.</div>';
        return;
    }

    container.innerHTML = entries
        .sort((a, b) => b[1] - a[1])
        .map(([cat, score]) => {
            const pct   = (score / 10) * 100;
            const color = score >= 7 ? 'var(--success)'
                        : score >= 4 ? 'var(--warning)'
                        : 'var(--danger)';
            return `
            <div class="category-bar-row">
                <div class="cat-bar-label">${cat}</div>
                <div class="cat-bar-track">
                    <div class="cat-bar-fill" style="width:${pct}%;background:${color}"></div>
                </div>
                <div class="cat-bar-score" style="color:${color}">${score.toFixed(1)}</div>
            </div>`;
        }).join('');
}

function renderWeakAreas(catScores) {
    const container = document.getElementById('weakAreas');
    if (!container) return;

    const weak = Object.entries(catScores).filter(([, s]) => s < 6);
    if (weak.length === 0) {
        container.innerHTML =
            '<div class="empty-state">🎉 No major weak areas found! Keep it up.</div>';
        return;
    }

    container.innerHTML = weak.map(([cat, score]) => `
        <div class="weak-area-card">
            <h4>${cat}</h4>
            <p>Avg score: <strong>${score.toFixed(1)}/10</strong> — needs more practice</p>
        </div>`).join('');
}

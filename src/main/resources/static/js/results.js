// ==========================================
// results.js
// ==========================================

if (!getToken()) window.location.href = '/index.html';

const sessionId = sessionStorage.getItem('result_session_id');
if (!sessionId) window.location.href = '/dashboard.html';

document.addEventListener('DOMContentLoaded', () => {
    loadResults();
});

async function loadResults() {
    try {
        const results = await apiFetch(`/api/interviews/${sessionId}/result`);

        if (!results || results.length === 0) {
            document.getElementById('overallScore').textContent = '—';
            document.getElementById('scoreBadge').textContent = 'No answers recorded';
            return;
        }

        // Calculate overall average
        const avg = results.reduce((sum, r) => sum + r.score, 0) / results.length;
        const avgRounded = avg.toFixed(1);

        document.getElementById('overallScore').textContent = avgRounded;
        document.getElementById('resultsSubtitle').textContent =
            `${results.length} questions answered`;

        const badge = avg >= 8 ? '🏆 Excellent!' :
                      avg >= 6 ? '👍 Good Job!'  :
                      avg >= 4 ? '📚 Keep Practicing' : '💪 Needs Improvement';
        document.getElementById('scoreBadge').textContent = badge;

        renderScoreChart(results);
        renderDetailedResults(results);

    } catch (err) {
        console.error('Results load error:', err);
        alert('Failed to load results: ' + err.message);
    }
}

function renderScoreChart(results) {
    const chart = document.getElementById('scoreChart');
    if (!chart) return;
    chart.innerHTML = '';

    results.forEach((r, i) => {
        const heightPct = (r.score / 10) * 100;
        const colorClass = r.score >= 7 ? 'high' : r.score >= 4 ? 'mid' : 'low';

        const wrap = document.createElement('div');
        wrap.className = 'score-bar-wrap';
        wrap.innerHTML = `
            <div class="score-bar-val">${r.score}</div>
            <div class="score-bar ${colorClass}"
                 style="height:${heightPct}%"></div>
            <div class="score-bar-label">Q${i + 1}</div>
        `;
        chart.appendChild(wrap);
    });
}

function renderDetailedResults(results) {
    const container = document.getElementById('detailedResults');
    if (!container) return;

    container.innerHTML = results.map((r, i) => {
        const scoreColor = r.score >= 7 ? 'var(--success)'
                         : r.score >= 4 ? 'var(--warning)'
                         : 'var(--danger)';
        return `
        <div class="review-card">
            <div class="review-card-header">
                <div class="review-question">Q${i + 1}. ${escHtml(r.questionText)}</div>
                <div class="review-score" style="color:${scoreColor}">${r.score}/10</div>
            </div>
            <div class="review-answer">
                <strong style="font-size:0.78rem;color:var(--text-muted)">YOUR ANSWER</strong><br>
                ${escHtml(r.answerText)}
            </div>
            <div class="review-feedback">
                <div class="feedback-item fb-strength">
                    <strong>✅ Strengths</strong>
                    ${escHtml(r.strengths || '—')}
                </div>
                <div class="feedback-item fb-weakness">
                    <strong>⚠️ Weaknesses</strong>
                    ${escHtml(r.weaknesses || '—')}
                </div>
                <div class="feedback-item fb-suggest">
                    <strong>💡 Suggestions</strong>
                    ${escHtml(r.suggestions || '—')}
                </div>
            </div>
        </div>`;
    }).join('');
}

function escHtml(str) {
    return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;')
                      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

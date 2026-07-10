"use strict";

/* ==========================================================
   SECTION 1 — CONSTANTS
========================================================== */
const MAX_QUESTIONS   = 10;
const MAX_WARNINGS    = 3;
const QUESTION_TIME   = 120;
const WARNING_DISPLAY_MS = 4000;

/* ==========================================================
   SECTION 2 — DOM ELEMENTS
========================================================== */
const systemCheckOverlay    = document.getElementById("systemCheckOverlay");
const runSystemCheckBtn     = document.getElementById("runSystemCheckBtn");
const startInterviewBtn     = document.getElementById("startInterviewBtn");
const systemCameraPreview   = document.getElementById("systemCameraPreview");
const cameraCheckStatus     = document.getElementById("cameraCheckStatus");
const micCheckStatus        = document.getElementById("micCheckStatus");
const internetCheckStatus   = document.getElementById("internetCheckStatus");
const browserCheckStatus    = document.getElementById("browserCheckStatus");
const fullscreenCheckStatus = document.getElementById("fullscreenCheckStatus");

const countdownOverlay = document.getElementById("countdownOverlay");
const countdownNumber  = document.getElementById("countdownNumber");

const warningPopup   = document.getElementById("warningPopup");
const warningMessage = document.getElementById("warningMessage");
const warningCounter = document.getElementById("warningCounter");

const endBtn = document.getElementById("endBtn");

const timerBar   = document.getElementById("timerBar");
const timerFill  = document.getElementById("timerFill");
const timerLabel = document.getElementById("timerLabel");

const sessionCategory = document.getElementById("sessionCategory");
const currentQ        = document.getElementById("currentQ");
const totalQ          = document.getElementById("totalQ");
const progressFill    = document.getElementById("progressFill");
const modeBadge       = document.getElementById("modeBadge");
const scoreList       = document.getElementById("scoreList");

const qNum             = document.getElementById("qNum");
const questionCategory = document.getElementById("questionCategory");
const questionText     = document.getElementById("questionText");

const answerPanel   = document.getElementById("answerPanel");
const voiceControls = document.getElementById("voiceControls");
const listenBtn     = document.getElementById("listenBtn");
const micBtn        = document.getElementById("micBtn");
const stopMicBtn    = document.getElementById("stopMicBtn");
const voiceStatus   = document.getElementById("voiceStatus");
const answerText    = document.getElementById("answerText");
const charCount     = document.getElementById("charCount");
const submitBtn     = document.getElementById("submitBtn");

const evalPanel      = document.getElementById("evalPanel");
const evalScore      = document.getElementById("evalScore");
const evalStrengths  = document.getElementById("evalStrengths");
const evalWeaknesses = document.getElementById("evalWeaknesses");
const evalSuggestions= document.getElementById("evalSuggestions");
const nextBtn        = document.getElementById("nextBtn");

const loadingOverlay = document.getElementById("loadingOverlay");
const loadingText    = document.getElementById("loadingText");

const cameraContainer = document.getElementById("cameraContainer");
const cameraVideo     = document.getElementById("cameraVideo");
const cameraStatus    = document.getElementById("cameraStatus");

const internetDot    = document.getElementById("internetDot");
const cameraDot      = document.getElementById("cameraDot");
const fullscreenDot  = document.getElementById("fullscreenDot");
const micDot         = document.getElementById("micDot");
const internetLabel  = document.getElementById("internetLabel");
const cameraLabel    = document.getElementById("cameraLabel");
const fullscreenLabel= document.getElementById("fullscreenLabel");
const micLabel       = document.getElementById("micLabel");

/* ==========================================================
   SECTION 3 — UTILITIES
========================================================== */
function getAuthToken() {
    return typeof getToken === "function"
        ? getToken()
        : localStorage.getItem("jwt_token") || "";
}

function buildHeaders() {
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getAuthToken()}`
    };
}

async function apiFetch(url, options = {}) {
    const res = await fetch(url, {
        ...options,
        headers: { ...buildHeaders(), ...(options.headers || {}) }
    });
    if (res.status === 401) { logout(); throw new Error("Unauthorized"); }
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || body.message || `HTTP ${res.status}`);
    }
    if (res.status === 204) return null;
    return res.json();
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function clamp(v, lo, hi) { return Math.min(Math.max(v, lo), hi); }

function setStatus(el, state, text) {
    el.className = `status ${state}`;
    el.textContent = text;
}

function getInterviewMode() {
    return (sessionStorage.getItem("interview_mode") || "TEXT").toUpperCase();
}

function getSessionState() {
    try { return JSON.parse(sessionStorage.getItem("interview_session")) || null; }
    catch { return null; }
}

/* ==========================================================
   SECTION 4 — SYSTEM CHECK
========================================================== */
const checkResults = { camera: false, microphone: false, internet: false, browser: false, fullscreen: false };

async function runSystemCheck() {
    runSystemCheckBtn.disabled = true;
    startInterviewBtn.disabled = true;
    setStatus(cameraCheckStatus,     "waiting", "Checking…");
    setStatus(micCheckStatus,        "waiting", "Checking…");
    setStatus(internetCheckStatus,   "waiting", "Checking…");
    setStatus(browserCheckStatus,    "waiting", "Checking…");
    setStatus(fullscreenCheckStatus, "waiting", "Checking…");

    await checkInternet();         await sleep(300);
    await checkBrowserCompatibility(); await sleep(300);
    await checkCameraAccess();     await sleep(300);
    await checkMicrophoneAccess(); await sleep(300);
    await checkFullscreen();

    const allPassed = Object.values(checkResults).every(Boolean);
    startInterviewBtn.disabled = !allPassed;
    runSystemCheckBtn.disabled = false;
}

async function checkInternet() {
    if (!navigator.onLine) {
        setStatus(internetCheckStatus, "failed", "Offline");
        checkResults.internet = false;
        return;
    }
    try { await fetch("/favicon.ico", { method: "HEAD", cache: "no-cache" }); } catch { /* ok */ }
    setStatus(internetCheckStatus, "success", "Connected ✓");
    checkResults.internet = true;
}

function checkBrowserCompatibility() {
    const hasCam  = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    const hasFs   = !!(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen);
    if (hasCam && hasFs) {
        const hasSpeech = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
        setStatus(browserCheckStatus, "success", hasSpeech ? "Compatible ✓" : "Compatible (no speech)");
        checkResults.browser = true;
    } else {
        setStatus(browserCheckStatus, "failed", "Unsupported Browser");
        checkResults.browser = false;
    }
}

/* ==========================================================
   SECTION 5 — CAMERA
========================================================== */
let cameraStream = null;

async function checkCameraAccess() {
    try {
        cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
        systemCameraPreview.srcObject = cameraStream;
        cameraVideo.srcObject = cameraStream;
        setStatus(cameraCheckStatus, "success", "Camera Ready ✓");
        updateStatusBar("camera", true);
        checkResults.camera = true;
    } catch (err) {
        setStatus(cameraCheckStatus, "failed", "Access Denied");
        updateStatusBar("camera", false);
        checkResults.camera = false;
    }
}

function monitorCameraTrack() {
    if (!cameraStream) return;
    const track = cameraStream.getVideoTracks()[0];
    if (!track) return;
    track.addEventListener("ended", () => {
        updateStatusBar("camera", false);
        if (cameraStatus) cameraStatus.textContent = "Camera Disconnected";
        if (isInterviewActive) triggerWarning("Camera disconnected. Please reconnect your camera.");
    });
}

function releaseCamera() {
    if (cameraStream) { cameraStream.getTracks().forEach(t => t.stop()); cameraStream = null; }
}

/* ==========================================================
   SECTION 6 — MICROPHONE
========================================================== */
async function checkMicrophoneAccess() {
    try {
        const s = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        s.getTracks().forEach(t => t.stop());
        setStatus(micCheckStatus, "success", "Microphone Ready ✓");
        updateStatusBar("mic", true);
        checkResults.microphone = true;
    } catch {
        setStatus(micCheckStatus, "failed", "Access Denied");
        updateStatusBar("mic", false);
        checkResults.microphone = false;
    }
}

/* ==========================================================
   SECTION 7 — FULLSCREEN
========================================================== */
async function checkFullscreen() {
    try {
        const el = document.documentElement;
        if (el.requestFullscreen) await el.requestFullscreen();
        else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
        else throw new Error("API not available");
        setStatus(fullscreenCheckStatus, "success", "Fullscreen ✓");
        updateStatusBar("fullscreen", true);
        checkResults.fullscreen = true;
    } catch {
        setStatus(fullscreenCheckStatus, "failed", "Not Available");
        updateStatusBar("fullscreen", false);
        checkResults.fullscreen = false;
    }
}

function exitFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
}

/* ==========================================================
   SECTION 8 — INTERVIEW ENGINE
   Bug fix: use session data from sessionStorage (set by dashboard.js)
   and talk to the correct REST endpoints.
========================================================== */
let isInterviewActive      = false;
let currentQuestionIndex   = 0;
let currentQuestionText    = "";
let currentQuestionId      = null;   // tracks the active question ID
let currentSessionId       = null;   // tracks the active session ID

const sessionState = getSessionState();

async function startInterview() {
    systemCheckOverlay.style.display = "none";

    if (cameraStream) {
        cameraVideo.srcObject = cameraStream;
        if (cameraStatus) cameraStatus.textContent = "Camera Active";
    }

    sessionCategory.textContent = sessionState?.category || "Interview";
    totalQ.textContent = MAX_QUESTIONS;
    modeBadge.textContent = getInterviewMode() === "VOICE" ? "🎤 VOICE MODE" : "⌨ TEXT MODE";

    activateSecurity();
    await runCountdown();
    isInterviewActive = true;
    timerBar.style.display = "block";
    monitorCameraTrack();

    // Bug fix: use the first question already fetched by dashboard.js
    // instead of calling a non-existent GET endpoint
    if (sessionState && sessionState.questionText) {
        currentSessionId    = sessionState.sessionId;
        currentQuestionId   = sessionState.questionId;
        currentQuestionText = sessionState.questionText;
        currentQuestionIndex = 0;
        renderQuestion(currentQuestionText, 1);
    } else {
        questionText.textContent = "Failed to load question. Please go back and try again.";
    }
}

/* ==========================================================
   SECTION 9 — QUESTION RENDERER
========================================================== */
function renderQuestion(text, order) {
    showPanel("question");
    questionText.textContent = text;
    qNum.textContent = order;
    if (questionCategory) questionCategory.textContent = sessionState?.category || "";
    currentQ.textContent = order;
    updateProgress();
    showPanel("answer");

    if (getInterviewMode() === "VOICE") {
        voiceControls.hidden = false;
        answerText.placeholder = "Your voice transcript will appear here…";
        speakQuestion(text);
    } else {
        voiceControls.hidden = true;
        answerText.placeholder = "Type your answer here. Be thorough and specific…";
    }

    answerText.value = "";
    charCount.textContent = "0 characters";
    answerText.disabled = false;
    submitBtn.disabled = false;
    startTimer();
}

function updateProgress() {
    const pct = ((currentQuestionIndex + 1) / MAX_QUESTIONS) * 100;
    progressFill.style.width = `${pct}%`;
}

function showPanel(panel) {
    answerPanel.hidden    = panel !== "answer";
    evalPanel.hidden      = panel !== "eval";
    loadingOverlay.hidden = panel !== "loading";
}

/* ==========================================================
   SECTION 10 — VOICE
========================================================== */
let recognition    = null;
let isRecognising  = false;

function createRecognition() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return null;
    const rec = new SR();
    rec.continuous = true; rec.interimResults = true; rec.lang = "en-US";
    rec.addEventListener("result", onRecognitionResult);
    rec.addEventListener("end",    onRecognitionEnd);
    rec.addEventListener("error",  onRecognitionError);
    return rec;
}

function startVoiceCapture() {
    if (isRecognising) return;
    if (!recognition) recognition = createRecognition();
    if (!recognition) { voiceStatus.textContent = "Speech recognition not available."; return; }
    answerText.value = "";
    recognition.start();
    isRecognising = true;
    voiceStatus.textContent = "🔴 Recording…";
    voiceStatus.classList.add("recording");
    micBtn.disabled = true; stopMicBtn.disabled = false;
    updateStatusBar("mic", true);
}

function stopVoiceCapture() {
    if (!isRecognising || !recognition) return;
    recognition.stop(); isRecognising = false;
    voiceStatus.textContent = "Recording stopped.";
    voiceStatus.classList.remove("recording");
    micBtn.disabled = false; stopMicBtn.disabled = true;
}

function onRecognitionResult(event) {
    let final = "", interim = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
        const seg = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += seg + " "; else interim += seg;
    }
    answerText.value = (answerText.value.trimEnd() + " " + final + interim).trimStart();
    updateCharCount();
}

function onRecognitionEnd() {
    if (isRecognising) { try { recognition.start(); } catch { /* ignore */ } }
}

function onRecognitionError(event) {
    voiceStatus.textContent = `Recognition error: ${event.error}`;
    isRecognising = false;
    micBtn.disabled = false; stopMicBtn.disabled = true;
}

function speakQuestion(text) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US"; u.rate = 0.9; u.pitch = 1;
    window.speechSynthesis.speak(u);
}

/* ==========================================================
   SECTION 11 — TIMER
========================================================== */
let timerInterval = null;
let timeRemaining = QUESTION_TIME;

function startTimer() {
    timeRemaining = QUESTION_TIME;
    renderTimer();
    timerInterval = setInterval(() => {
        timeRemaining--;
        renderTimer();
        if (timeRemaining <= 0) { stopTimer(); autoSubmitOnTimeout(); }
    }, 1000);
}

function stopTimer() {
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
}

function renderTimer() {
    const pct = (timeRemaining / QUESTION_TIME) * 100;
    timerFill.style.width = `${clamp(pct, 0, 100)}%`;
    timerLabel.textContent = `${timeRemaining}s`;
    if (timeRemaining <= 15) timerFill.classList.add("danger");
    else timerFill.classList.remove("danger");
}

function autoSubmitOnTimeout() {
    if (isInterviewActive) submitAnswer(true);
}

/* ==========================================================
   SECTION 12 — ANSWER SUBMISSION
   Bug fix: call the correct endpoint POST /api/interviews/{sessionId}/answer
   and handle the response to show evaluation + next question.
========================================================== */
async function submitAnswer(forced = false) {
    stopTimer();
    stopVoiceCapture();

    const answer = (answerText.value || "").trim();
    if (!answer && !forced) {
        answerText.focus();
        answerText.style.borderColor = "#ef4444";
        setTimeout(() => { answerText.style.borderColor = ""; }, 1500);
        return;
    }

    answerText.disabled = true;
    submitBtn.disabled  = true;

    showPanel("loading");
    loadingText.textContent = "AI is evaluating your answer…";

    try {
        const data = await apiFetch(`/api/interviews/${currentSessionId}/answer`, {
            method: "POST",
            body: JSON.stringify({
                questionId: currentQuestionId,
                answerText: answer || "(No answer provided)"
            })
        });

        // Response: { evaluation, nextQuestion, sessionComplete, message }
        const evalData = data.evaluation;
        renderEvaluation(evalData, currentQuestionIndex + 1);

        if (data.sessionComplete) {
            nextBtn.textContent = "View Results →";
            nextBtn.onclick = () => {
                sessionStorage.setItem("result_session_id", currentSessionId);
                window.location.href = "/results.html";
            };
        } else if (data.nextQuestion) {
            // Store the next question for when user clicks Next
            const nq = data.nextQuestion;
            nextBtn.textContent = "Next Question →";
            nextBtn.onclick = () => {
                currentQuestionIndex++;
                currentQuestionId   = nq.questionId;
                currentQuestionText = nq.questionText;
                renderQuestion(currentQuestionText, nq.questionOrder);
                nextBtn.onclick = null; // reset
            };
        }

    } catch (err) {
        console.error("[Submit]", err);
        renderEvaluation({
            score: 0,
            strengths: "Could not retrieve evaluation.",
            weaknesses: "Please check your connection.",
            suggestions: "Try again or continue."
        }, currentQuestionIndex + 1);
    }
}

function renderEvaluation(data, qNumber) {
    const score = Number(data.score) || 0;
    evalScore.textContent      = score;
    evalStrengths.textContent  = data.strengths   || "—";
    evalWeaknesses.textContent = data.weaknesses  || "—";
    evalSuggestions.textContent= data.suggestions || "—";

    showPanel("eval");

    evalScore.classList.remove("success-pulse");
    void evalScore.offsetWidth;
    evalScore.classList.add("success-pulse");

    evalScore.style.color =
        score >= 8 ? "#16a34a" :
        score >= 5 ? "#d97706" : "#dc2626";

    addScoreEntry(qNumber, score);
}

/* ==========================================================
   SECTION 13 — SCORE TRACKER
========================================================== */
const scores = [];

function addScoreEntry(qNumber, score) {
    scores.push({ question: qNumber, score });
    const cls = score >= 8 ? "high" : score >= 5 ? "mid" : "low";
    const entry = document.createElement("div");
    entry.className = "score-entry";
    entry.innerHTML = `<span class="score-entry-label">Q${qNumber}</span><span class="score-entry-val ${cls}">${score} / 10</span>`;
    scoreList.appendChild(entry);
    scoreList.scrollTop = scoreList.scrollHeight;
}

function computeAverageScore() {
    if (!scores.length) return 0;
    return Math.round((scores.reduce((s, e) => s + e.score, 0) / scores.length) * 10) / 10;
}

/* ==========================================================
   SECTION 14-16 — SECURITY & AUTO-SUBMIT
========================================================== */
let warningCount = 0;
let warningHideTimeout = null;

function activateSecurity() {
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur",              onWindowBlur);
    document.addEventListener("keydown",          onKeyDown);
    document.addEventListener("contextmenu",      onContextMenu);
    document.addEventListener("copy",             onCopyBlock);
    document.addEventListener("cut",              onCutBlock);
    document.addEventListener("paste",            onPasteBlock);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("webkitfullscreenchange", onFullscreenChange);
    window.addEventListener("offline", onGoOffline);
    window.addEventListener("online",  onGoOnline);
    window.addEventListener("beforeunload", onBeforeUnload);
}

function deactivateSecurity() {
    document.removeEventListener("visibilitychange", onVisibilityChange);
    window.removeEventListener("blur",              onWindowBlur);
    document.removeEventListener("keydown",          onKeyDown);
    document.removeEventListener("contextmenu",      onContextMenu);
    document.removeEventListener("copy",             onCopyBlock);
    document.removeEventListener("cut",              onCutBlock);
    document.removeEventListener("paste",            onPasteBlock);
    document.removeEventListener("fullscreenchange", onFullscreenChange);
    document.removeEventListener("webkitfullscreenchange", onFullscreenChange);
    window.removeEventListener("offline", onGoOffline);
    window.removeEventListener("online",  onGoOnline);
    window.removeEventListener("beforeunload", onBeforeUnload);
}

function onVisibilityChange() { if (document.hidden && isInterviewActive) triggerWarning("Tab switching detected."); }
function onWindowBlur()       { if (isInterviewActive) triggerWarning("Window lost focus."); }
function onKeyDown(e) {
    if (!isInterviewActive) return;
    const ctrl = e.ctrlKey || e.metaKey;
    if (e.key === "F12" || (ctrl && e.shiftKey && ["I","J","C"].includes(e.key.toUpperCase())) || (ctrl && e.key.toUpperCase() === "U")) {
        e.preventDefault(); triggerWarning("DevTools access is not permitted."); return;
    }
    if (e.key === "F5" || (ctrl && e.key.toLowerCase() === "r")) {
        e.preventDefault(); triggerWarning("Refreshing is not allowed during the interview.");
    }
}
function onContextMenu(e) { if (isInterviewActive) { e.preventDefault(); triggerWarning("Right-click is disabled."); } }
function onCopyBlock(e)   { if (isInterviewActive && e.target !== answerText) e.preventDefault(); }
function onCutBlock(e)    { if (isInterviewActive && e.target !== answerText) e.preventDefault(); }
function onPasteBlock(e)  { if (isInterviewActive) { e.preventDefault(); triggerWarning("Pasting is not allowed."); } }
function onFullscreenChange() {
    const inFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
    updateStatusBar("fullscreen", inFs);
    if (!inFs && isInterviewActive) {
        triggerWarning("Fullscreen exited. Please return to fullscreen.");
        document.documentElement.requestFullscreen && document.documentElement.requestFullscreen().catch(() => {});
    }
}
function onGoOffline() { updateStatusBar("internet", false); if (isInterviewActive) triggerWarning("Internet lost."); }
function onGoOnline()  { updateStatusBar("internet", true); }
function onBeforeUnload(e) { if (isInterviewActive) { e.preventDefault(); e.returnValue = "Interview in progress."; } }

function triggerWarning(reason) {
    if (!isInterviewActive) return;
    warningCount++;
    warningMessage.textContent = reason;
    warningCounter.textContent = `${warningCount} / ${MAX_WARNINGS}`;
    warningPopup.classList.add("visible");
    warningPopup.hidden = false;
    warningPopup.setAttribute("aria-hidden", "false");
    document.body.classList.remove("warning-flash");
    void document.body.offsetWidth;
    document.body.classList.add("warning-flash");
    clearTimeout(warningHideTimeout);
    warningHideTimeout = setTimeout(hideWarningPopup, WARNING_DISPLAY_MS);
    if (warningCount >= MAX_WARNINGS) autoSubmitDueToWarnings();
}

function hideWarningPopup() {
    warningPopup.classList.remove("visible");
    warningPopup.setAttribute("aria-hidden", "true");
}

async function autoSubmitDueToWarnings() {
    isInterviewActive = false;
    deactivateSecurity();
    warningMessage.textContent = "Maximum warnings reached. Submitting automatically.";
    warningPopup.classList.add("visible");
    await sleep(2000);
    endInterviewAndRedirect();
}

async function endInterview() {
    if (!isInterviewActive) { window.location.href = "/dashboard.html"; return; }
    const ok = window.confirm("End the interview early? Progress will be saved.");
    if (ok) endInterviewAndRedirect();
}

async function endInterviewAndRedirect() {
    isInterviewActive = false;
    stopTimer(); stopVoiceCapture(); deactivateSecurity();
    window.removeEventListener("beforeunload", onBeforeUnload);

    showPanel("loading");
    loadingText.textContent = "Ending session…";

    try {
        await apiFetch(`/api/interviews/${currentSessionId}/end`, { method: "POST" });
    } catch { /* ignore */ }

    cleanupResources();
    sessionStorage.setItem("result_session_id", currentSessionId);
    window.location.href = "/results.html";
}

/* ==========================================================
   SECTION 17 — CLEANUP
========================================================== */
function cleanupResources() {
    stopTimer(); stopVoiceCapture(); releaseCamera();
    window.speechSynthesis && window.speechSynthesis.cancel();
    clearTimeout(warningHideTimeout);
}

/* ==========================================================
   SECTION 18 — STATUS BAR
========================================================== */
function updateStatusBar(key, online) {
    const dots   = { internet: internetDot,   camera: cameraDot,   fullscreen: fullscreenDot, mic: micDot };
    const labels = { internet: internetLabel, camera: cameraLabel, fullscreen: fullscreenLabel, mic: micLabel };
    const texts  = {
        internet:   [online ? "Internet Connected" : "Internet Offline",    online ? "online" : "offline"],
        camera:     [online ? "Camera Active"       : "Camera Inactive",    online ? "online" : "offline"],
        fullscreen: [online ? "Fullscreen Active"   : "Fullscreen Off",     online ? "online" : "warning"],
        mic:        [online ? "Microphone Active"   : "Microphone Inactive",online ? "online" : "offline"]
    };
    const dot = dots[key]; const label = labels[key];
    if (!dot || !label) return;
    dot.className = `status-dot ${texts[key][1]}`;
    label.textContent = texts[key][0];
}

function syncFullscreenStatus() {
    updateStatusBar("fullscreen", !!(document.fullscreenElement || document.webkitFullscreenElement));
}

function updateCharCount() {
    const len = answerText.value.length;
    charCount.textContent = `${len.toLocaleString()} character${len !== 1 ? "s" : ""}`;
}

function runCountdown() {
    return new Promise(resolve => {
        countdownOverlay.classList.add("active");
        let count = 3;
        countdownNumber.textContent = count;
        const tick = setInterval(() => {
            count--;
            if (count > 0) { countdownNumber.textContent = count; }
            else if (count === 0) { countdownNumber.textContent = "GO!"; countdownNumber.style.fontSize = "80px"; }
            else { clearInterval(tick); countdownOverlay.classList.remove("active"); countdownNumber.style.fontSize = ""; resolve(); }
        }, 1000);
    });
}

/* ==========================================================
   SECTION 19 — INIT
========================================================== */
function init() {
    if (!getAuthToken()) { window.location.href = "/index.html"; return; }

    // Validate session was set up by dashboard
    if (!sessionState || !sessionState.sessionId) {
        alert("No active session found. Please start an interview from the dashboard.");
        window.location.href = "/dashboard.html";
        return;
    }

    totalQ.textContent = MAX_QUESTIONS;
    progressFill.style.width = "0%";
    updateStatusBar("internet",   navigator.onLine);
    updateStatusBar("camera",     false);
    updateStatusBar("fullscreen", false);
    updateStatusBar("mic",        false);

    runSystemCheckBtn.addEventListener("click",  runSystemCheck);
    startInterviewBtn.addEventListener("click",  startInterview);
    endBtn.addEventListener("click",             endInterview);
    submitBtn.addEventListener("click",          () => submitAnswer(false));
    // nextBtn onclick set dynamically after each evaluation
    answerText.addEventListener("input",         updateCharCount);
    if (listenBtn)  listenBtn.addEventListener("click",  () => speakQuestion(currentQuestionText));
    if (micBtn)     micBtn.addEventListener("click",     startVoiceCapture);
    if (stopMicBtn) stopMicBtn.addEventListener("click", stopVoiceCapture);

    window.addEventListener("online",  () => updateStatusBar("internet", true));
    window.addEventListener("offline", () => updateStatusBar("internet", false));
    document.addEventListener("fullscreenchange",       syncFullscreenStatus);
    document.addEventListener("webkitfullscreenchange", syncFullscreenStatus);
}

init();

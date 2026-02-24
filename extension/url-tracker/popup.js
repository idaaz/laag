const DEFAULT_APP_URL = "https://laag.vercel.app"; // fallback

// ── DOM refs ──────────────────────────────────────────────────────────────────
const setupScreen = document.getElementById("setupScreen");
const loadingScreen = document.getElementById("loadingScreen");
const dashboardScreen = document.getElementById("dashboardScreen");
const statusPill = document.getElementById("statusPill");
const lastUpdated = document.getElementById("lastUpdated");

const userIdInput = document.getElementById("userIdInput");
const appUrlInput = document.getElementById("appUrlInput");
const connectBtn = document.getElementById("connectBtn");
const settingsBtn = document.getElementById("settingsBtn");

// KPI elements
const kpiContent = document.getElementById("kpiContent");
const kpiCategory = document.getElementById("kpiCategory");
const trackingHighlights = document.getElementById("trackingHighlights");
const domainsList = document.getElementById("domainsList");
const categoriesList = document.getElementById("categoriesList");

let cachedKpi = null;

// ── Helpers ───────────────────────────────────────────────────────────────────
function show(el) { el.classList.remove("hidden"); }
function hide(el) { el.classList.add("hidden"); }

function setStatus(label, type) {
    statusPill.textContent = label;
    statusPill.className = `status-pill ${type}`;
}

function fmt(n) {
    if (n >= 1000) return (n / 1000).toFixed(1) + "k";
    return String(n);
}

// ── Main ──────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
    const { userId, appUrl } = await chrome.storage.local.get(["userId", "appUrl"]);

    if (!userId) {
        show(setupScreen);
        hide(loadingScreen);
        hide(dashboardScreen);
        setStatus("Not set up", "error");
        return;
    }

    show(loadingScreen);
    hide(setupScreen);
    hide(dashboardScreen);
    await fetchAndRender(userId, appUrl || DEFAULT_APP_URL);
});

kpiCategory.addEventListener("change", () => {
    if (cachedKpi) renderDashboard(cachedKpi);
});

// ── Connect button ─────────────────────────────────────────────────────────────
connectBtn.addEventListener("click", async () => {
    const uid = userIdInput.value.trim();
    const url = appUrlInput.value.trim().replace(/\/$/, "") || DEFAULT_APP_URL;

    if (!uid) {
        userIdInput.style.borderColor = "#f87171";
        return;
    }

    userIdInput.style.borderColor = "";
    await chrome.storage.local.set({ userId: uid, appUrl: url });
    hide(setupScreen);
    show(loadingScreen);
    await fetchAndRender(uid, url);
});

// ── Settings button ────────────────────────────────────────────────────────────
settingsBtn.addEventListener("click", async () => {
    hide(dashboardScreen);
    hide(loadingScreen);
    show(setupScreen);

    const { userId, appUrl } = await chrome.storage.local.get(["userId", "appUrl"]);
    if (userId) userIdInput.value = userId;
    if (appUrl) appUrlInput.value = appUrl;
    setStatus("Settings", "loading");
});

// ── Fetch KPIs ─────────────────────────────────────────────────────────────────
async function fetchAndRender(userId, appUrl) {
    if (!appUrl) appUrl = DEFAULT_APP_URL;
    setStatus("Fetching…", "loading");

    try {
        // Normalize URL: remove trailing slashes and ensure no duplicate /api
        let baseUrl = appUrl.trim().replace(/\/+$/, "");
        if (baseUrl.endsWith("/api")) {
            baseUrl = baseUrl.substring(0, baseUrl.length - 4);
        }

        const finalUrl = `${baseUrl}/api/kpi?userId=${encodeURIComponent(userId)}`;
        console.log("Extension: Fetching from", finalUrl);

        const res = await fetch(finalUrl);
        if (!res.ok) throw new Error(`API ${res.status}`);

        const data = await res.json();
        if (!data.kpi) throw new Error("Invalid response format");

        cachedKpi = data.kpi;
        renderDashboard(data.kpi);
        setStatus("Live", "ok");

        const now = new Date();
        lastUpdated.textContent = `Updated ${now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`;
    } catch (err) {
        setStatus("Error", "error");
        lastUpdated.textContent = `Error: ${err.message} (${new URL(appUrl).host})`;
        show(dashboardScreen);
        hide(loadingScreen);
    }
}

// ── Render ─────────────────────────────────────────────────────────────────────
function renderDashboard(kpi) {
    hide(loadingScreen);
    show(dashboardScreen);

    const category = kpiCategory.value;
    let html = "";

    // Toggle tracking highlights visibility
    if (category === "summary" || category === "tracking") {
        show(trackingHighlights);
        renderTrackingExtras(kpi.tracking);
    } else {
        hide(trackingHighlights);
    }

    if (category === "summary") {
        const s = kpi.summary;
        html = `
            <div class="kpi-grid">
                <div class="kpi-card">
                    <span class="kpi-label">Total XP</span>
                    <span class="kpi-value kpi-blue">${fmt(s.totalXP)}</span>
                    <span class="kpi-sub">Level ${s.level}</span>
                </div>
                <div class="kpi-card">
                    <span class="kpi-label">Discipline</span>
                    <span class="kpi-value kpi-gold">${s.disciplineScore}%</span>
                    <span class="kpi-sub">Overall stability</span>
                </div>
                <div class="kpi-card">
                    <span class="kpi-label">Focus</span>
                    <span class="kpi-value kpi-teal">${Math.round(s.focusScore)}%</span>
                    <span class="kpi-sub">30-day health</span>
                </div>
            </div>
        `;
    } else if (category === "tasks") {
        const t = kpi.tasks;
        html = `
            <div class="kpi-grid">
                <div class="kpi-card">
                    <span class="kpi-label">Pending</span>
                    <span class="kpi-value kpi-gold">${t.pending}</span>
                    <span class="kpi-sub">Active tasks</span>
                </div>
                <div class="kpi-card">
                    <span class="kpi-label">Overdue</span>
                    <span class="kpi-value kpi-red">${t.overdue}</span>
                    <span class="kpi-sub">${t.overdue > 0 ? "Immediate action" : "On track"}</span>
                </div>
                <div class="kpi-card">
                    <span class="kpi-label">Critical</span>
                    <span class="kpi-value kpi-red">${t.critical}</span>
                    <span class="kpi-sub">High priority</span>
                </div>
            </div>
            <div class="section-title">Completion Rate</div>
            <div style="font-size:12px; color:#71717a;">${Math.round((t.total - t.pending) / (t.total || 1) * 100)}% of life-time tasks completed</div>
        `;
    } else if (category === "habits") {
        const h = kpi.habits;
        html = `
            <div class="kpi-grid">
                <div class="kpi-card" style="grid-column: span 3;">
                    <span class="kpi-label">Today's Progress</span>
                    <div style="display:flex; align-items:baseline; gap:6px;">
                        <span class="kpi-value kpi-green">${h.loggedToday}</span>
                        <span style="font-size:14px; color:#52525b;">/ ${h.totalActive} habits</span>
                    </div>
                </div>
            </div>
            <div class="section-title">Top Streaks</div>
            ${h.streaks.map(s => `
                <div class="domain-row">
                    <span class="domain-name">${s.name}</span>
                    <span class="domain-pct kpi-green">${s.streak}d</span>
                </div>
            `).join("")}
        `;
    } else if (category === "tracking") {
        const tr = kpi.tracking;
        html = `
            <div class="kpi-grid">
                <div class="kpi-card">
                    <span class="kpi-label">Visits</span>
                    <span class="kpi-value kpi-indigo">${fmt(tr.totalVisits)}</span>
                    <span class="kpi-sub">Total 30d</span>
                </div>
                <div class="kpi-card" style="grid-column: span 2;">
                    <span class="kpi-label">Unique Domains</span>
                    <span class="kpi-value kpi-blue">${tr.uniqueDomains}</span>
                    <span class="kpi-sub">Engagement span</span>
                </div>
            </div>
        `;
    } else if (category === "logs") {
        const l = kpi.logs;
        html = `
            <div class="kpi-grid">
                <div class="kpi-card">
                    <span class="kpi-label">Mood</span>
                    <span class="kpi-value kpi-blue">${l.recentMood}/10</span>
                    <span class="kpi-sub">Avg 7d</span>
                </div>
                <div class="kpi-card">
                    <span class="kpi-label">Energy</span>
                    <span class="kpi-value kpi-teal">${l.recentProductivity}/10</span>
                    <span class="kpi-sub">Avg 7d</span>
                </div>
                <div class="kpi-card">
                    <span class="kpi-label">Status</span>
                    <span class="kpi-value ${l.hasLoggedToday ? "kpi-green" : "kpi-red"}">${l.hasLoggedToday ? "DONE" : "MISSING"}</span>
                    <span class="kpi-sub">Today</span>
                </div>
            </div>
        `;
    }

    kpiContent.innerHTML = html;
}

function renderTrackingExtras(tracking) {
    // Top Domains
    const domains = tracking.topDomains ?? [];
    if (domains.length === 0) {
        domainsList.innerHTML = `<div style="font-size:11px;color:#3f3f46;padding:6px 0;">No domain data yet</div>`;
    } else {
        const maxPct = Math.max(...domains.map((d) => d.percentage ?? d.count), 1);
        domainsList.innerHTML = domains.map((d) => {
            const pct = d.percentage ?? 0;
            const barW = Math.round((pct / maxPct) * 100);
            const name = (d.domain || "").replace(/^www\./, "");
            return `
        <div class="domain-row">
          <span class="domain-name" title="${d.domain}">${name}</span>
          <div class="domain-bar-wrap"><div class="domain-bar" style="width:${barW}%"></div></div>
          <span class="domain-pct">${Math.round(pct)}%</span>
        </div>`;
        }).join("");
    }

    // Categories
    const cats = tracking.categories ?? [];
    categoriesList.innerHTML = cats.length === 0
        ? `<span style="font-size:11px;color:#3f3f46;">No categories yet</span>`
        : cats.map((c) => `
        <span class="cat-pill" style="border-color:${c.color || "rgba(255,255,255,0.1)"}; color:${c.color || "#a1a1aa"}">
          ${c.category} · ${Math.round(c.percentage ?? 0)}%
        </span>`).join("");
}

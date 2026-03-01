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

function el(tag, className, textOrChildren, attrs = {}) {
    const e = document.createElement(tag);
    if (className) e.className = className;
    for (let k in attrs) {
        if (k === 'style') {
            e.style.cssText = attrs[k];
        } else {
            e.setAttribute(k, attrs[k]);
        }
    }
    if (Array.isArray(textOrChildren)) {
        textOrChildren.forEach(child => child && (typeof child === 'string' ? e.appendChild(document.createTextNode(child)) : e.appendChild(child)));
    } else if (textOrChildren != null) {
        e.textContent = textOrChildren;
    }
    return e;
}

function createKpiCard(label, valueEl, sub, colorClass, span = 1) {
    const card = el("div", "kpi-card", [], span > 1 ? { style: `grid-column: span ${span};` } : {});
    card.appendChild(el("span", "kpi-label", label));

    if (Array.isArray(valueEl)) {
        card.appendChild(el("div", "", valueEl, { style: "display:flex; align-items:baseline; gap:6px;" }));
    } else {
        card.appendChild(el("span", `kpi-value ${colorClass}`, valueEl));
    }

    card.appendChild(el("span", "kpi-sub", sub));
    return card;
}

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
    const { userId, appUrl } = await browser.storage.local.get(["userId", "appUrl"]);

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
    await browser.storage.local.set({ userId: uid, appUrl: url });
    hide(setupScreen);
    show(loadingScreen);
    await fetchAndRender(uid, url);
});

// ── Settings button ────────────────────────────────────────────────────────────
settingsBtn.addEventListener("click", async () => {
    hide(dashboardScreen);
    hide(loadingScreen);
    show(setupScreen);

    const { userId, appUrl } = await browser.storage.local.get(["userId", "appUrl"]);
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
    kpiContent.replaceChildren(); // Clear content

    // Toggle tracking highlights visibility
    if (category === "summary" || category === "tracking") {
        show(trackingHighlights);
        renderTrackingExtras(kpi.tracking);
    } else {
        hide(trackingHighlights);
    }

    if (category === "summary") {
        const s = kpi.summary;
        const grid = el("div", "kpi-grid", [
            createKpiCard("Total XP", fmt(s.totalXP), `Level ${s.level}`, "kpi-blue"),
            createKpiCard("Discipline", `${s.disciplineScore}%`, "Overall stability", "kpi-gold"),
            createKpiCard("Focus", `${Math.round(s.focusScore)}%`, "30-day health", "kpi-teal")
        ]);
        kpiContent.appendChild(grid);

    } else if (category === "tasks") {
        const t = kpi.tasks;
        const grid = el("div", "kpi-grid", [
            createKpiCard("Pending", String(t.pending), "Active tasks", "kpi-gold"),
            createKpiCard("Overdue", String(t.overdue), t.overdue > 0 ? "Immediate action" : "On track", "kpi-red"),
            createKpiCard("Critical", String(t.critical), "High priority", "kpi-red")
        ]);
        const rate = Math.round((t.total - t.pending) / (t.total || 1) * 100);
        kpiContent.appendChild(grid);
        kpiContent.appendChild(el("div", "section-title", "Completion Rate"));
        kpiContent.appendChild(el("div", "", `${rate}% of life-time tasks completed`, { style: "font-size:12px; color:#71717a;" }));

    } else if (category === "habits") {
        const h = kpi.habits;
        const grid = el("div", "kpi-grid", [
            createKpiCard("Today's Progress", [
                el("span", "kpi-value kpi-green", String(h.loggedToday)),
                el("span", "", `/ ${h.totalActive} habits`, { style: "font-size:14px; color:#52525b;" })
            ], "", "", 3)
        ]);
        kpiContent.appendChild(grid);
        kpiContent.appendChild(el("div", "section-title", "Top Streaks"));

        h.streaks.forEach(s => {
            kpiContent.appendChild(el("div", "domain-row", [
                el("span", "domain-name", s.name),
                el("span", "domain-pct kpi-green", `${s.streak}d`)
            ]));
        });

    } else if (category === "tracking") {
        const tr = kpi.tracking;
        const grid = el("div", "kpi-grid", [
            createKpiCard("Visits", fmt(tr.totalVisits), "Total 30d", "kpi-indigo"),
            createKpiCard("Unique Domains", String(tr.uniqueDomains), "Engagement span", "kpi-blue", 2)
        ]);
        kpiContent.appendChild(grid);

    } else if (category === "logs") {
        const l = kpi.logs;
        const grid = el("div", "kpi-grid", [
            createKpiCard("Mood", `${l.recentMood}/10`, "Avg 7d", "kpi-blue"),
            createKpiCard("Energy", `${l.recentProductivity}/10`, "Avg 7d", "kpi-teal"),
            createKpiCard("Status", l.hasLoggedToday ? "DONE" : "MISSING", "Today", l.hasLoggedToday ? "kpi-green" : "kpi-red")
        ]);
        kpiContent.appendChild(grid);
    }
}

function renderTrackingExtras(tracking) {
    // Top Domains
    const domains = tracking.topDomains ?? [];
    domainsList.replaceChildren();

    if (domains.length === 0) {
        domainsList.appendChild(el("div", "", "No domain data yet", { style: "font-size:11px;color:#3f3f46;padding:6px 0;" }));
    } else {
        const maxPct = Math.max(...domains.map((d) => d.percentage ?? d.count), 1);
        domains.forEach(d => {
            const pct = d.percentage ?? 0;
            const barW = Math.round((pct / maxPct) * 100);
            const name = (d.domain || "").replace(/^www\./, "");

            const row = el("div", "domain-row", [
                el("span", "domain-name", name, { title: d.domain }),
                el("div", "domain-bar-wrap", [
                    el("div", "domain-bar", "", { style: `width:${barW}%` })
                ]),
                el("span", "domain-pct", `${Math.round(pct)}%`)
            ]);
            domainsList.appendChild(row);
        });
    }

    // Categories
    const cats = tracking.categories ?? [];
    categoriesList.replaceChildren();

    if (cats.length === 0) {
        categoriesList.appendChild(el("span", "", "No categories yet", { style: "font-size:11px;color:#3f3f46;" }));
    } else {
        cats.forEach(c => {
            const color = c.color || "#a1a1aa";
            const borderColor = c.color || "rgba(255,255,255,0.1)";
            const pill = el("span", "cat-pill", `${c.category} · ${Math.round(c.percentage ?? 0)}%`, {
                style: `border-color:${borderColor}; color:${color}`
            });
            categoriesList.appendChild(pill);
        });
    }
}

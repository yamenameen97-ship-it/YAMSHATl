const API_BASE = window.API_BASE || (() => {
    const saved = (localStorage.getItem("apiBase") || "").trim().replace(/\/+$/, "");
    if (saved) {
        return saved.endsWith("/api") ? saved : `${saved}/api`;
    }
    return `${window.location.origin.replace(/\/+$/, "")}/api`;
})();

let currentUser = window.getStoredAuth?.().user || null;
let currentEmail = window.getStoredAuth?.().email || null;
let currentRole = window.getStoredAuth?.().role || null;
let cache = {};
let relationshipCache = {};
let postsTimer = null;
let notificationsTimer = null;
let chatTimer = null;
let reelsData = [];
let current = 0;
let startY = 0;
let passwordResetRequestToken = null;
let passwordResetToken = null;

function escapeHTML(value) {
    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function isVideo(url) {
    return /\.(mp4|webm|mov|mkv)$/i.test(url || "");
}

function isImage(url) {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(url || "");
}

function normalizeMediaUrl(url) {
    const safeUrl = String(url || "").trim();
    if (!safeUrl) return safeUrl;
    if (safeUrl.includes("/api/uploads/")) return safeUrl;
    if (safeUrl.startsWith("/uploads/")) return `/api${safeUrl}`;
    if (/^https?:\/\//i.test(safeUrl) && safeUrl.includes("/uploads/")) {
        return safeUrl.replace("/uploads/", "/api/uploads/");
    }
    if (!safeUrl.includes('/') && /\.[a-z0-9]{2,8}$/i.test(safeUrl)) {
        return `${API_BASE}/uploads/${encodeURIComponent(safeUrl)}`;
    }
    return safeUrl;
}

function renderContent(content, media = "") {
    const safeContent = String(content || "").trim();
    const safeMedia = normalizeMediaUrl(media);
    const parts = [];
    if (safeContent) parts.push(`<p class="post-text">${escapeHTML(safeContent)}</p>`);
    if (safeMedia) {
        if (isVideo(safeMedia)) parts.push(`<video class="post-media" controls src="${encodeURI(safeMedia)}"></video>`);
        else if (isImage(safeMedia)) parts.push(`<img class="post-media" src="${encodeURI(safeMedia)}" alt="post image">`);
        else parts.push(`<a class="post-text" href="${encodeURI(safeMedia)}" target="_blank" rel="noopener">فتح الملف المرفوع</a>`);
    }
    if (!parts.length) return `<p class="post-text"></p>`;
    return parts.join("");
}

function showLoading(btn) {
    if (!btn) return;
    btn.dataset.originalText = btn.innerText;
    btn.innerText = "جاري التحميل...";
    btn.disabled = true;
}

function resetLoading(btn) {
    if (!btn) return;
    btn.innerText = btn.dataset.originalText || "تم";
    btn.disabled = false;
}

function showToast(msg) {
    const t = document.createElement("div");
    t.className = "toast";
    t.innerText = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3000);
}

const requestJSON = window.requestJSON || async function (url, options = {}) {
    const response = await fetch(url, { credentials: "include", ...options });
    const data = await response.json().catch(() => ({ message: "حدث خطأ غير متوقع" }));
    if (!response.ok) throw new Error(data.message || "حدث خطأ في الطلب");
    return data;
};

function persistAuthSession(data = {}) {
    const saved = window.persistSessionFromPayload?.(data) || data;
    currentUser = saved.user || data.user || currentUser || null;
    currentEmail = saved.email || data.email || currentEmail || null;
    currentRole = saved.role || data.role || currentRole || null;
    return saved;
}

function clearAuthSession() {
    window.clearStoredAuth?.();
    currentUser = null;
    currentEmail = null;
    currentRole = null;
    relationshipCache = {};
}

function fetchData(url, callback, force = false) {
    if (cache[url] && !force) {
        callback(cache[url]);
        return;
    }
    (window.authFetch ? window.authFetch(url) : fetch(url, { credentials: "include" }))
        .then(res => res.json())
        .then(data => {
            cache[url] = data;
            callback(data);
        })
        .catch(() => callback([]));
}

function invalidateCache(urls = []) {
    urls.forEach(url => delete cache[url]);
}

function getStoredTheme() {
    return localStorage.getItem("yamshatTheme") || "dark";
}

function getStoredStylePreset() {
    return localStorage.getItem("yamshatStylePreset") || "classic";
}

function updateThemeColorMeta() {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) return;
    const preset = getStoredStylePreset();
    const isLight = getStoredTheme() === 'light';
    const map = {
        classic: isLight ? '#ffffff' : '#e00000',
        instagram: isLight ? '#ffd7df' : '#ff2d55',
        neon: isLight ? '#d9fbff' : '#06b6d4',
    };
    meta.setAttribute('content', map[preset] || map.classic);
}

function applyStylePreset(preset = getStoredStylePreset()) {
    document.body.classList.remove('theme-instagram', 'theme-neon');
    if (preset === 'instagram') document.body.classList.add('theme-instagram');
    if (preset === 'neon') document.body.classList.add('theme-neon');
    updateThemeColorMeta();
}

function setStylePreset(preset = 'classic') {
    const safePreset = ['classic', 'instagram', 'neon'].includes(preset) ? preset : 'classic';
    localStorage.setItem('yamshatStylePreset', safePreset);
    applyStylePreset(safePreset);
    hideServiceMenu();
    const labels = { classic: 'تم تفعيل الاستايل الكلاسيكي', instagram: 'تم تفعيل استايل إنستغرام', neon: 'تم تفعيل الاستايل الثالث' };
    showToast(labels[safePreset] || labels.classic);
}

function applyTheme(theme = getStoredTheme()) {
    document.body.classList.toggle("light-theme", theme === "light");
    applyStylePreset();
}

function toggleTheme() {
    const nextTheme = getStoredTheme() === "light" ? "dark" : "light";
    localStorage.setItem("yamshatTheme", nextTheme);
    applyTheme(nextTheme);
    hideServiceMenu();
    showToast(nextTheme === "light" ? "تم تفعيل الوضع النهاري" : "تم تفعيل الوضع الليلي");
}

function showAuthForm(formId) {
    ["loginForm", "registerForm", "resetForm"].forEach(id => {
        document.getElementById(id)?.classList.toggle("hidden", id !== formId);
    });
}

function showRegister() {
    showAuthForm("registerForm");
}

function showLogin() {
    showAuthForm("loginForm");
}

function showPasswordReset() {
    showAuthForm("resetForm");
}

async function register(btn) {
    const name = document.getElementById("registerName")?.value.trim();
    const email = document.getElementById("registerEmail")?.value.trim();
    const password = document.getElementById("registerPassword")?.value.trim();

    if (!name || !email || !password) {
        showToast("من فضلك أكمل كل الحقول");
        return;
    }

    showLoading(btn);
    try {
        const data = await requestJSON(`${API_BASE}/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password })
        });
        persistAuthSession(data);
        showToast(data.message);
        document.getElementById("registerName").value = "";
        document.getElementById("registerEmail").value = "";
        document.getElementById("registerPassword").value = "";
        window.location.href = "feed.html";
    } catch (error) {
        showToast(error.message);
    } finally {
        resetLoading(btn);
    }
}

async function login(btn) {
    const email = document.getElementById("loginEmail")?.value.trim();
    const password = document.getElementById("loginPassword")?.value.trim();

    if (!email || !password) {
        showToast("أدخل بيانات تسجيل الدخول");
        return;
    }

    showLoading(btn);
    try {
        const data = await requestJSON(`${API_BASE}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });
        persistAuthSession(data);
        showToast(data.message);
        window.location.href = "feed.html";
    } catch (error) {
        showToast(error.message);
    } finally {
        resetLoading(btn);
    }
}

async function requestPasswordReset(btn) {
    const identifier = document.getElementById("resetIdentifier")?.value.trim();
    const channel = document.getElementById("resetChannel")?.value || "auto";

    if (!identifier) {
        showToast("أدخل البريد الإلكتروني أو رقم الجوال");
        return;
    }

    showLoading(btn);
    try {
        const data = await requestJSON(`${API_BASE}/password_reset/request`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ identifier, channel })
        });
        passwordResetRequestToken = data.request_token || null;
        passwordResetToken = null;
        showToast(data.message || "تم إرسال رمز التحقق");
    } catch (error) {
        showToast(error.message);
    } finally {
        resetLoading(btn);
    }
}

async function verifyPasswordReset(btn) {
    const code = document.getElementById("resetCode")?.value.trim();
    if (!passwordResetRequestToken) {
        showToast("أرسل رمز التحقق أولاً");
        return;
    }
    if (!code) {
        showToast("أدخل رمز التحقق");
        return;
    }

    showLoading(btn);
    try {
        const data = await requestJSON(`${API_BASE}/password_reset/verify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ request_token: passwordResetRequestToken, code })
        });
        passwordResetToken = data.reset_token || null;
        showToast(data.message || "تم التحقق من الرمز");
    } catch (error) {
        showToast(error.message);
    } finally {
        resetLoading(btn);
    }
}

async function completePasswordReset(btn) {
    const newPassword = document.getElementById("resetNewPassword")?.value.trim();
    if (!passwordResetToken) {
        showToast("أكد رمز التحقق أولاً");
        return;
    }
    if (!newPassword) {
        showToast("أدخل كلمة المرور الجديدة");
        return;
    }

    showLoading(btn);
    try {
        const data = await requestJSON(`${API_BASE}/password_reset/reset`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reset_token: passwordResetToken, new_password: newPassword })
        });
        passwordResetRequestToken = null;
        passwordResetToken = null;
        document.getElementById("resetCode") && (document.getElementById("resetCode").value = "");
        document.getElementById("resetNewPassword") && (document.getElementById("resetNewPassword").value = "");
        document.getElementById("loginPassword") && (document.getElementById("loginPassword").value = "");
        showToast(data.message || "تم تحديث كلمة المرور");
        showLogin();
    } catch (error) {
        showToast(error.message);
    } finally {
        resetLoading(btn);
    }
}

async function checkSession(redirectIfMissing = true) {
    try {
        const data = await requestJSON(`${API_BASE}/me`);
        if (data.user) {
            persistAuthSession(data);
            document.getElementById("sessionUser")?.replaceChildren(document.createTextNode(`مرحباً ${currentUser}`));
            const profileEmail = document.getElementById("profileEmail");
            if (profileEmail && !profileEmail.innerText.trim()) {
                profileEmail.innerText = currentEmail || "جلسة نشطة";
            }
            return data;
        }
    } catch (error) {
        console.error(error.message);
    }

    clearAuthSession();
    if (redirectIfMissing) window.location.href = "index.html";
    return { user: null };
}

async function logout() {
    try {
        if (window.authFetch) await window.authFetch(`${API_BASE}/logout`);
        else await fetch(`${API_BASE}/logout`, { credentials: "include" });
    } finally {
        clearAuthSession();
        window.location.href = "index.html";
    }
}

function toggleServiceMenu(event) {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    const menu = document.getElementById("serviceMenu");
    if (!menu) return;
    document.getElementById("notifBox")?.style && (document.getElementById("notifBox").style.display = "none");
    const isHidden = menu.classList.contains("hidden");
    menu.classList.toggle("hidden", !isHidden);
}

function hideServiceMenu() {
    document.getElementById("serviceMenu")?.classList.add("hidden");
}

function openModal(id) {
    document.getElementById(id)?.classList.remove("hidden");
}

function closeModal(id) {
    document.getElementById(id)?.classList.add("hidden");
}

function openSearchPanel() {
    hideServiceMenu();
    openModal("searchModal");
    setTimeout(() => document.getElementById("globalSearchInput")?.focus(), 50);
}

function closeSearchPanel() {
    closeModal("searchModal");
}

async function runSearch() {
    const input = document.getElementById("globalSearchInput");
    const query = input?.value.trim();
    const box = document.getElementById("searchResults");
    if (!box) return;

    if (!query) {
        box.innerHTML = '<div class="empty-state">اكتب كلمة للبحث أولاً</div>';
        return;
    }

    box.innerHTML = '<div class="empty-state">جاري البحث...</div>';
    try {
        const data = await requestJSON(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
        const users = Array.isArray(data.users) ? data.users : [];
        const posts = Array.isArray(data.posts) ? data.posts : [];
        box.innerHTML = `
            <div class="search-section">
                <h4>المستخدمون</h4>
                ${users.length ? users.map(user => `
                    <div class="search-card">
                        <div>
                            <b>${escapeHTML(user.name)}</b>
                            <div class="subtle-text">تم إخفاء البريد حفاظاً على الخصوصية</div>
                        </div>
                        <button onclick='openProfile(${JSON.stringify(user.name)})'>فتح</button>
                    </div>
                `).join("") : '<div class="empty-state">لا توجد نتائج مستخدمين</div>'}
            </div>
            <div class="search-section">
                <h4>المنشورات</h4>
                ${posts.length ? posts.map(post => `
                    <div class="search-card post-search-card">
                        <div>
                            <b onclick='openProfile(${JSON.stringify(post.username)})' class="user-link">${escapeHTML(post.username)}</b>
                            <div class="subtle-text">${escapeHTML(String(post.content).slice(0, 120))}</div>
                        </div>
                        <button onclick='openProfile(${JSON.stringify(post.username)})'>عرض الحساب</button>
                    </div>
                `).join("") : '<div class="empty-state">لا توجد نتائج منشورات</div>'}
            </div>
        `;
    } catch (error) {
        box.innerHTML = `<div class="empty-state">${escapeHTML(error.message)}</div>`;
    }
}

function openProfileEditor() {
    hideServiceMenu();
    document.getElementById("editName") && (document.getElementById("editName").value = currentUser || "");
    document.getElementById("editEmail") && (document.getElementById("editEmail").value = currentEmail || "");
    document.getElementById("editPassword") && (document.getElementById("editPassword").value = "");
    openModal("profileModal");
}

function closeProfileEditor() {
    closeModal("profileModal");
}

async function saveProfile(btn) {
    const name = document.getElementById("editName")?.value.trim();
    const email = document.getElementById("editEmail")?.value.trim();
    const password = document.getElementById("editPassword")?.value.trim();
    if (!name || !email) {
        showToast("الاسم والبريد مطلوبان");
        return;
    }

    showLoading(btn);
    try {
        const data = await requestJSON(`${API_BASE}/update_profile`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password })
        });
        persistAuthSession(data);
        document.getElementById("username") && (document.getElementById("username").innerText = currentUser);
        document.getElementById("profileEmail") && (document.getElementById("profileEmail").innerText = currentEmail);
        document.getElementById("sessionUser")?.replaceChildren(document.createTextNode(`مرحباً ${currentUser}`));
        closeProfileEditor();
        showToast(data.message);
        if (document.body.classList.contains("profile-page")) {
            const params = new URLSearchParams(window.location.search);
            const viewingSelf = !params.get("user") || params.get("user") === currentUser;
            if (viewingSelf) {
                history.replaceState({}, "", `profile.html?user=${encodeURIComponent(currentUser)}`);
                loadProfile();
            }
        }
        if (document.body.classList.contains("feed-page")) reloadFeed();
    } catch (error) {
        showToast(error.message);
    } finally {
        resetLoading(btn);
    }
}

async function openAdminPanel() {
    hideServiceMenu();
    const box = document.getElementById("adminContent");
    if (!box) {
        showToast("لوحة الإدارة متاحة من الصفحة الرئيسية");
        return;
    }
    openModal("adminModal");
    box.innerHTML = '<div class="empty-state">جاري تحميل لوحة الإدارة...</div>';
    try {
        const data = await requestJSON(`${API_BASE}/admin_overview`);
        const totals = data.stats || {};
        const day = data.activity?.day || {};
        const month = data.activity?.month || {};
        const reports = Array.isArray(data.reports) ? data.reports : [];
        const recentPosts = Array.isArray(data.recent_posts) ? data.recent_posts : [];
        const recentUsers = Array.isArray(data.recent_users) ? data.recent_users : [];
        const recentReels = Array.isArray(data.recent_reels) ? data.recent_reels : [];
        const liveRooms = Array.isArray(data.live_rooms) ? data.live_rooms : [];
        const leaderboards = data.leaderboards || {};
        const system = data.system || {};

        const renderBoard = (title, rows, icon) => `
            <div class="glass admin-panel-card admin-list-card">
                <div class="admin-section-title">${icon} ${title}</div>
                ${rows?.length ? rows.map(row => `
                    <div class="admin-mini-row">
                        <b>${escapeHTML(row.username)}</b>
                        <span>${row.total || 0}</span>
                    </div>
                `).join("") : '<div class="empty-state">لا توجد بيانات كافية</div>'}
            </div>
        `;

        box.innerHTML = `
            <div class="admin-stats-grid">
                <div class="admin-stat glass"><b>${totals.users || 0}</b><span>المستخدمون</span></div>
                <div class="admin-stat glass"><b>${totals.posts || 0}</b><span>المنشورات</span></div>
                <div class="admin-stat glass"><b>${totals.comments || 0}</b><span>التعليقات</span></div>
                <div class="admin-stat glass"><b>${totals.messages || 0}</b><span>الرسائل</span></div>
                <div class="admin-stat glass"><b>${totals.reels || 0}</b><span>الريلز</span></div>
                <div class="admin-stat glass"><b>${totals.live_rooms || 0}</b><span>البثوث</span></div>
                <div class="admin-stat glass"><b>${totals.reports || 0}</b><span>البلاغات</span></div>
                <div class="admin-stat glass"><b>${totals.follows || 0}</b><span>المتابعات</span></div>
            </div>

            <div class="admin-activity-grid">
                <div class="glass admin-panel-card">
                    <div class="admin-section-title">📅 ${escapeHTML(system.tracking_window_day || 'آخر 24 ساعة')}</div>
                    <div class="admin-mini-grid">
                        <div><b>${day.active_users || 0}</b><span>نشاط المستخدمين</span></div>
                        <div><b>${day.users || 0}</b><span>تسجيلات جديدة</span></div>
                        <div><b>${day.posts || 0}</b><span>منشورات</span></div>
                        <div><b>${day.comments || 0}</b><span>تعليقات</span></div>
                        <div><b>${day.messages || 0}</b><span>رسائل</span></div>
                        <div><b>${day.reports || 0}</b><span>بلاغات</span></div>
                        <div><b>${day.reels || 0}</b><span>ريلز</span></div>
                        <div><b>${day.stories || 0}</b><span>ستوري</span></div>
                    </div>
                </div>
                <div class="glass admin-panel-card">
                    <div class="admin-section-title">🗓️ ${escapeHTML(system.tracking_window_month || 'آخر 30 يوم')}</div>
                    <div class="admin-mini-grid">
                        <div><b>${month.active_users || 0}</b><span>نشاط المستخدمين</span></div>
                        <div><b>${month.users || 0}</b><span>تسجيلات جديدة</span></div>
                        <div><b>${month.posts || 0}</b><span>منشورات</span></div>
                        <div><b>${month.comments || 0}</b><span>تعليقات</span></div>
                        <div><b>${month.messages || 0}</b><span>رسائل</span></div>
                        <div><b>${month.reports || 0}</b><span>بلاغات</span></div>
                        <div><b>${month.reels || 0}</b><span>ريلز</span></div>
                        <div><b>${month.stories || 0}</b><span>ستوري</span></div>
                    </div>
                </div>
            </div>

            <div class="admin-activity-grid">
                ${renderBoard('أكثر المعلقين', leaderboards.commenters, '💬')}
                ${renderBoard('أكثر الناشرين', leaderboards.posters, '📝')}
                ${renderBoard('أكثر المراسلين', leaderboards.messengers, '📨')}
            </div>

            <div class="admin-report-list">
                <div class="admin-section-title">🚩 أحدث البلاغات</div>
                ${reports.length ? reports.map(report => `
                    <div class="search-card admin-report-card">
                        <div>
                            <b>#${report.id} · ${escapeHTML(report.target_type)}</b>
                            <div class="subtle-text">المبلّغ: ${escapeHTML(report.reporter)} · الهدف: ${escapeHTML(report.target_value)} · ${escapeHTML(report.created_at || '')}</div>
                            <div>${escapeHTML(report.reason)}</div>
                        </div>
                        <div class="inline-actions">
                            ${report.target_type === 'post' ? `<button class="soft-danger" onclick="adminRemovePost(${Number(report.target_value)})">حذف المنشور</button>` : ''}
                            <button onclick="adminDismissReport(${report.id})">أرشفة البلاغ</button>
                        </div>
                    </div>
                `).join("") : '<div class="empty-state">لا توجد بلاغات</div>'}
            </div>

            <div class="admin-report-list">
                <div class="admin-section-title">📰 مراجعة آخر المنشورات</div>
                ${recentPosts.length ? recentPosts.map(post => `
                    <div class="search-card admin-report-card">
                        <div>
                            <b>${escapeHTML(post.username)}</b>
                            <div class="subtle-text">#${post.id} · إعجابات ${post.likes || 0} · ${escapeHTML(post.created_at || '')}</div>
                            <div>${escapeHTML(String(post.content || '').slice(0, 180) || 'منشور وسائط بدون نص')}</div>
                        </div>
                        <div class="inline-actions">
                            <button onclick='openProfile(${JSON.stringify(post.username)})'>الحساب</button>
                            <button class="soft-danger" onclick="adminRemovePost(${post.id})">حذف</button>
                        </div>
                    </div>
                `).join("") : '<div class="empty-state">لا توجد منشورات حديثة</div>'}
            </div>

            <div class="admin-report-list">
                <div class="admin-section-title">🎬 آخر الريلز</div>
                ${recentReels.length ? recentReels.map(reel => `
                    <div class="search-card admin-report-card">
                        <div>
                            <b>${escapeHTML(reel.username)}</b>
                            <div class="subtle-text">ريل #${reel.id} · ${escapeHTML(reel.created_at || '')}</div>
                            <div class="subtle-text">${escapeHTML(reel.video || '')}</div>
                        </div>
                        <div class="inline-actions">
                            <button onclick="goReels()">فتح الريلز</button>
                            <button class="soft-danger" onclick="adminRemoveReel(${reel.id})">حذف</button>
                        </div>
                    </div>
                `).join("") : '<div class="empty-state">لا توجد ريلز حديثة</div>'}
            </div>

            <div class="admin-report-list">
                <div class="admin-section-title">🔴 متابعة البثوث</div>
                ${liveRooms.length ? liveRooms.map(room => `
                    <div class="search-card admin-report-card">
                        <div>
                            <b>#${room.id} · ${escapeHTML(room.title || 'بث مباشر')}</b>
                            <div class="subtle-text">${escapeHTML(room.username || '')} · الحالة: ${escapeHTML(room.status || '')} · مشاهدون: ${room.viewer_count || 0}</div>
                            <div class="subtle-text">حالة المضيف: ${room.host_active ? 'نشط' : 'غير متصل'}</div>
                        </div>
                        <div class="inline-actions">
                            <button onclick="window.location.href='live_room.html?id=${room.id}'">فتح</button>
                            ${room.status === 'live' ? `<button class="soft-danger" onclick="adminEndLive(${room.id})">إنهاء</button>` : ''}
                        </div>
                    </div>
                `).join("") : '<div class="empty-state">لا توجد بثوث مسجلة</div>'}
            </div>

            <div class="admin-report-list">
                <div class="admin-section-title">👤 أحدث المستخدمين</div>
                ${recentUsers.length ? recentUsers.map(user => `
                    <div class="search-card admin-report-card">
                        <div>
                            <b>${escapeHTML(user.name)}</b>
                            <div class="subtle-text">${escapeHTML(user.created_at || '')} · الصلاحية: ${escapeHTML(user.role || 'user')}</div>
                            <div class="subtle-text">تم إخفاء البريد في الواجهات العامة حفاظاً على الخصوصية</div>
                        </div>
                        <div class="inline-actions">
                            <button onclick='openProfile(${JSON.stringify(user.name)})'>فتح الحساب</button>
                        </div>
                    </div>
                `).join("") : '<div class="empty-state">لا توجد حسابات حديثة</div>'}
            </div>
        `;
    } catch (error) {
        box.innerHTML = `<div class="empty-state">${escapeHTML(error.message)}</div>`;
    }
}

function closeAdminPanel() {
    closeModal("adminModal");
}

async function adminRemovePost(postId) {
    if (!postId || !confirm(`حذف المنشور رقم ${postId} من لوحة الإدارة؟`)) return;
    try {
        const data = await requestJSON(`${API_BASE}/admin_remove_post/${postId}`, { method: "POST" });
        showToast(data.message);
        openAdminPanel();
        if (document.body.classList.contains("feed-page")) reloadFeed();
    } catch (error) {
        showToast(error.message);
    }
}

async function adminDismissReport(reportId) {
    if (!reportId) return;
    try {
        const data = await requestJSON(`${API_BASE}/admin_dismiss_report/${reportId}`, { method: "POST" });
        showToast(data.message);
        openAdminPanel();
    } catch (error) {
        showToast(error.message);
    }
}

async function adminRemoveReel(reelId) {
    if (!reelId || !confirm(`حذف الريل رقم ${reelId} من لوحة الإدارة؟`)) return;
    try {
        const data = await requestJSON(`${API_BASE}/admin_remove_reel/${reelId}`, { method: "POST" });
        showToast(data.message);
        openAdminPanel();
        if (document.body.classList.contains("reels-page")) loadReels();
    } catch (error) {
        showToast(error.message);
    }
}

async function adminEndLive(roomId) {
    if (!roomId || !confirm(`إنهاء البث رقم ${roomId} من لوحة الإدارة؟`)) return;
    try {
        const data = await requestJSON(`${API_BASE}/admin_end_live/${roomId}`, { method: "POST" });
        showToast(data.message);
        openAdminPanel();
    } catch (error) {
        showToast(error.message);
    }
}

async function reportEntity(targetType, targetValue, label = "المحتوى") {
    const reason = window.prompt(`سبب التبليغ عن ${label}`);
    if (!reason) return;
    try {
        const data = await requestJSON(`${API_BASE}/report`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ target_type: targetType, target_value: String(targetValue), reason })
        });
        showToast(data.message);
    } catch (error) {
        showToast(error.message);
    }
}

function reportUser(username) {
    reportEntity("user", username, `المستخدم ${username}`);
}

function reportPost(postId) {
    reportEntity("post", postId, `المنشور ${postId}`);
}

function reportReel(reelId) {
    reportEntity("reel", reelId, `الريل ${reelId}`);
}

async function blockUser(username) {
    if (!username) return;
    if (!confirm(`هل تريد حظر ${username}؟`)) return;
    try {
        const data = await requestJSON(`${API_BASE}/block_user`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username })
        });
        showToast(data.message);
        setTimeout(() => window.location.href = "feed.html", 600);
    } catch (error) {
        showToast(error.message);
    }
}

async function addPost(btn) {
    const input = document.getElementById("postInput");
    const content = input?.value.trim();
    if (!content) {
        showToast("اكتب منشوراً أولاً");
        return;
    }
    showLoading(btn);
    try {
        await requestJSON(`${API_BASE}/add_post`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: currentUser, content, media: "" })
        });
        input.value = "";
        invalidateCache([`${API_BASE}/posts`]);
        await loadPosts(true);
        showToast("تم نشر المنشور");
    } catch (error) {
        showToast(error.message);
    } finally {
        resetLoading(btn);
    }
}

async function uploadMedia(btn) {
    const fileInput = document.getElementById("fileInput");
    const file = fileInput?.files?.[0];
    if (!file) {
        showToast("اختر صورة أو فيديو أولاً");
        return;
    }
    showLoading(btn);
    const formData = new FormData();
    formData.append("file", file);
    try {
        const uploadData = await requestJSON(`${API_BASE}/upload`, { method: "POST", body: formData });
        await requestJSON(`${API_BASE}/add_post`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: currentUser, content: "", media: uploadData.file_url })
        });
        fileInput.value = "";
        invalidateCache([`${API_BASE}/posts`]);
        await loadPosts(true);
        showToast("تم رفع الملف ونشره");
    } catch (error) {
        showToast(error.message);
    } finally {
        resetLoading(btn);
    }
}

async function deletePost(postId) {
    if (!confirm("هل تريد حذف هذا المنشور؟")) return;
    try {
        const data = await requestJSON(`${API_BASE}/delete_post/${postId}`, { method: "DELETE" });
        showToast(data.message);
        reloadFeed();
        if (document.body.classList.contains("profile-page")) loadProfile();
    } catch (error) {
        showToast(error.message);
    }
}

async function like(id) {
    try {
        await requestJSON(`${API_BASE}/like/${id}`, { method: "POST" });
        await Promise.all([loadPosts(true), loadNotifications(true)]);
    } catch (error) {
        showToast(error.message);
    }
}

function handleCommentInput(id, input) {
    const sendBtn = document.getElementById(`commentSend-${id}`);
    const commentsBox = document.getElementById(`comments-${id}`);
    const hasValue = Boolean(input?.value.trim());
    sendBtn?.classList.toggle("hidden", !hasValue);
    if (commentsBox && hasValue) {
        commentsBox.style.display = "block";
    }
}

async function addComment(id) {
    const input = document.getElementById(`commentInput-${id}`);
    const comment = input?.value.trim();
    if (!comment) {
        showToast("اكتب تعليقاً أولاً");
        return;
    }
    try {
        await requestJSON(`${API_BASE}/add_comment`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ post_id: id, username: currentUser, comment })
        });
        input.value = "";
        handleCommentInput(id, input);
        await loadComments(id);
        await loadNotifications(true);
        openComments(id, false);
        showToast("تم إضافة التعليق");
    } catch (error) {
        showToast(error.message);
    }
}

async function loadComments(id) {
    try {
        const data = await requestJSON(`${API_BASE}/comments/${id}`);
        const box = document.getElementById(`comments-${id}`);
        if (!box) return;
        box.dataset.loaded = "true";
        if (!data.length) {
            box.innerHTML = '<div class="empty-state">لا توجد تعليقات بعد</div>';
            return;
        }
        box.innerHTML = data.map(c => `
            <div class="comment"><b>${escapeHTML(c.username)}:</b> ${escapeHTML(c.comment)}</div>
        `).join("");
    } catch (error) {
        const box = document.getElementById(`comments-${id}`);
        if (box) box.dataset.loaded = "false";
        console.error(error.message);
    }
}

function openComments(id, focusInput = false) {
    const box = document.getElementById(`comments-${id}`);
    const input = document.getElementById(`commentInput-${id}`);
    if (!box) return;
    const shouldLoad = box.style.display !== "block" || box.dataset.loaded !== "true";
    box.style.display = "block";
    if (shouldLoad) loadComments(id);
    if (focusInput && input) {
        input.scrollIntoView({ behavior: "smooth", block: "center" });
        window.setTimeout(() => {
            input.focus();
            const length = input.value.length;
            try {
                input.setSelectionRange(length, length);
            } catch (_) {}
        }, 120);
    }
}

function toggleComments(id) {
    const box = document.getElementById(`comments-${id}`);
    if (!box) return;
    if (box.style.display === "block") {
        box.style.display = "none";
        return;
    }
    openComments(id, false);
}


function relationshipCacheKey(user) {
    return String(user || '').trim().toLowerCase();
}

function getRelationshipButtonsSelector(user) {
    return `[data-rel-actions="${encodeURIComponent(String(user || '').trim())}"]`;
}

async function getRelationshipState(user, force = false) {
    const safeUser = String(user || '').trim();
    if (!safeUser || safeUser === currentUser) {
        return { same_user: true, following: false, is_friend: false, outgoing_request_id: null, incoming_request_id: null };
    }
    const key = relationshipCacheKey(safeUser);
    if (!force && relationshipCache[key]) return relationshipCache[key];
    const state = await requestJSON(`${API_BASE}/relationship/${encodeURIComponent(safeUser)}`);
    relationshipCache[key] = state;
    return state;
}

function relationshipFollowLabel(state = {}) {
    return state.following ? '➖ إلغاء المتابعة' : '➕ متابعة';
}

function relationshipFriendLabel(state = {}) {
    if (state.is_friend) return '✅ صديق';
    if (state.incoming_request_id) return '✅ قبول طلب الصداقة';
    if (state.outgoing_request_id) return '❌ إلغاء طلب الصداقة';
    return '🤝 طلب صداقة';
}

function renderRelationshipButtons(user, extraButtons = '') {
    const encodedUser = encodeURIComponent(String(user || '').trim());
    return `
        <div class="inline-actions social-actions" data-rel-actions="${encodedUser}">
            <button class="rel-follow-btn" data-rel-user="${encodedUser}" onclick='follow(${JSON.stringify(user)})'>⏳ متابعة</button>
            <button class="rel-friend-btn" data-friend-user="${encodedUser}" onclick='toggleFriendRequest(${JSON.stringify(user)})'>🤝 طلب صداقة</button>
            ${extraButtons}
        </div>
    `;
}

function applyRelationshipStateToDom(user, state = {}) {
    document.querySelectorAll(getRelationshipButtonsSelector(user)).forEach(container => {
        const followBtn = container.querySelector('.rel-follow-btn');
        const friendBtn = container.querySelector('.rel-friend-btn');
        if (followBtn) {
            followBtn.textContent = relationshipFollowLabel(state);
            followBtn.dataset.following = state.following ? '1' : '0';
        }
        if (friendBtn) {
            friendBtn.textContent = relationshipFriendLabel(state);
            friendBtn.disabled = Boolean(state.is_friend);
            friendBtn.dataset.friendState = state.is_friend ? 'friend' : state.outgoing_request_id ? 'outgoing' : state.incoming_request_id ? 'incoming' : 'none';
        }
    });
}

async function hydrateRelationshipButtons(scope = document) {
    const containers = Array.from((scope || document).querySelectorAll?.('[data-rel-actions]') || []);
    const uniqueUsers = [...new Set(containers.map(node => decodeURIComponent(node.dataset.relActions || '')).filter(Boolean))];
    await Promise.all(uniqueUsers.map(async user => {
        try {
            const state = await getRelationshipState(user);
            applyRelationshipStateToDom(user, state);
        } catch (_) {}
    }));
}

async function refreshRelationshipState(user) {
    const state = await getRelationshipState(user, true);
    applyRelationshipStateToDom(user, state);
    return state;
}

async function toggleFriendRequest(user) {
    if (!user || user === currentUser) {
        showToast('لا يمكنك إرسال طلب لنفسك');
        return;
    }
    try {
        const state = await getRelationshipState(user, true);
        let data;
        if (state.is_friend) {
            showToast('أنتم أصدقاء بالفعل');
            return;
        }
        if (state.incoming_request_id) {
            data = await requestJSON(`${API_BASE}/handle_friend_request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: state.incoming_request_id, status: 'accepted' })
            });
        } else if (state.outgoing_request_id) {
            data = await requestJSON(`${API_BASE}/cancel_friend_request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: state.outgoing_request_id, receiver: user })
            });
        } else {
            data = await requestJSON(`${API_BASE}/send_friend_request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sender: currentUser, receiver: user })
            });
        }
        relationshipCache[relationshipCacheKey(user)] = null;
        await refreshRelationshipState(user);
        if (document.body.classList.contains('profile-page')) {
            const viewed = new URLSearchParams(window.location.search).get('user') || currentUser || '';
            if (viewed === user) {
                const stats = await requestJSON(`${API_BASE}/followers/${encodeURIComponent(user)}`);
                document.getElementById('followers') && (document.getElementById('followers').innerText = stats.followers || 0);
                document.getElementById('following') && (document.getElementById('following').innerText = stats.following || 0);
            }
        }
        showToast(data.message || 'تم تحديث حالة الصداقة');
    } catch (error) {
        showToast(error.message);
    }
}

async function follow(user) {
    if (!user || user === currentUser) {
        showToast("لا يمكنك متابعة نفسك");
        return;
    }
    try {
        const data = await requestJSON(`${API_BASE}/follow`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ following: user })
        });
        relationshipCache[relationshipCacheKey(user)] = null;
        await refreshRelationshipState(user);
        if (document.body.classList.contains('profile-page')) {
            const stats = await requestJSON(`${API_BASE}/followers/${encodeURIComponent(user)}`);
            document.getElementById('followers') && (document.getElementById('followers').innerText = stats.followers || 0);
            document.getElementById('following') && (document.getElementById('following').innerText = stats.following || 0);
        }
        showToast(data.message);
    } catch (error) {
        showToast(error.message);
    }
}

function sharePost(id) {
    const text = `شاهد هذا المنشور رقم ${id}`;
    if (navigator.share) {
        navigator.share({ text }).catch(() => {});
        return;
    }
    navigator.clipboard?.writeText(text).then(() => showToast("تم نسخ رابط المشاركة")).catch(() => showToast("تم تجهيز المشاركة"));
}

function shareReel(id) {
    const shareUrl = `${window.location.origin}/reels.html?reel=${id}`;
    if (navigator.share) {
        navigator.share({ title: "Yamshat Reels", text: "شاهد هذا الريل على Yamshat", url: shareUrl }).catch(() => {});
        return;
    }
    navigator.clipboard?.writeText(shareUrl).then(() => showToast("تم نسخ رابط الريل")).catch(() => showToast("تم تجهيز مشاركة الريل"));
}

function openProfile(user) {
    window.location.href = `profile.html?user=${encodeURIComponent(user)}`;
}

function openChat(user) {
    window.location.href = `chat.html?user=${encodeURIComponent(user)}`;
}

function showFeedSkeleton() {
    const feed = document.getElementById("feed");
    if (!feed) return;
    feed.innerHTML = `<div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div>`;
}

async function loadPosts(force = false) {
    const feed = document.getElementById("feed");
    if (!feed) return;
    if (!feed.dataset.loaded) showFeedSkeleton();

    try {
        const data = await requestJSON(`${API_BASE}/posts`);
        feed.dataset.loaded = "true";
        if (!data.length) {
            feed.innerHTML = '<div class="post"><div class="empty-state">لا توجد منشورات حالياً</div></div>';
            return;
        }

        feed.innerHTML = data.map(post => {
            const isMine = post.username === currentUser;
            return `
                <div class="post glass">
                    <div class="post-top">
                        <div class="post-user">
                            <div class="avatar">👤</div>
                            <div>
                                <b class="user-link" onclick='openProfile(${JSON.stringify(post.username)})'>${escapeHTML(post.username)}</b>
                                <div class="count-chip">منشور حديث</div>
                            </div>
                        </div>
                        <div class="post-top-actions">
                            ${isMine ? `<button class="soft-danger" onclick="deletePost(${post.id})">🗑 حذف</button>` : renderRelationshipButtons(post.username)}
                        </div>
                    </div>

                    ${renderContent(post.content, post.media)}

                    <div class="actions">
                        <button onclick="like(${post.id})">❤️</button>
                        <button onclick="openComments(${post.id}, true)">💬</button>
                        <button onclick="sharePost(${post.id})">📤</button>
                        ${isMine ? `<button onclick="deletePost(${post.id})">🗑</button>` : `<button onclick="reportPost(${post.id})">🚩</button>`}
                    </div>

                    <div class="count-chip">الإعجابات: ${post.likes}</div>
                    <div id="comments-${post.id}" class="comments-wrapper" style="display:none;"></div>
                    <div class="comment-box">
                        <input type="text" id="commentInput-${post.id}" placeholder="اكتب تعليق..." onfocus="openComments(${post.id})" oninput="handleCommentInput(${post.id}, this)">
                        <button id="commentSend-${post.id}" class="send-comment-btn hidden" onclick="addComment(${post.id})">إرسال</button>
                    </div>
                </div>
            `;
        }).join("");
        hydrateRelationshipButtons(feed);

        if (force) cache[`${API_BASE}/posts`] = data;
    } catch (error) {
        feed.innerHTML = `<div class="post"><div class="empty-state">${escapeHTML(error.message)}</div></div>`;
    }
}

function loadStories(force = false) {
    const bar = document.getElementById("storyBar");
    if (!bar) return;
    fetchData(`${API_BASE}/stories`, data => {
        if (!Array.isArray(data) || !data.length) {
            bar.innerHTML = '<div class="empty-state">لا توجد ستوري حالياً</div>';
            return;
        }
        bar.innerHTML = data.map(s => {
            const mediaUrl = normalizeMediaUrl(s.media_url || (s.media ? `${API_BASE}/uploads/${encodeURIComponent(s.media)}` : ''));
            const preview = isVideo(s.media)
                ? `<video muted playsinline><source src="${mediaUrl}"></video>`
                : `<img src="${mediaUrl}" alt="story">`;
            return `
                <div class="story-item">
                    <div class="story" onclick='openStory(${JSON.stringify(s.media)})'>${preview}</div>
                    <div class="story-label">${escapeHTML(s.username)}</div>
                </div>
            `;
        }).join("");
    }, force);
}

function openStory(media) {
    const viewer = document.createElement("div");
    viewer.style = `position:fixed;top:0;left:0;width:100%;height:100%;background:black;display:flex;justify-content:center;align-items:center;z-index:9999;`;
    const mediaUrl = normalizeMediaUrl(media?.includes?.('/uploads/') ? media : `${API_BASE}/uploads/${encodeURIComponent(media)}`);
    viewer.innerHTML = isVideo(media)
        ? `<video src="${mediaUrl}" autoplay controls style="max-width:100%; max-height:100%;"></video>`
        : `<img src="${mediaUrl}" style="max-width:100%; max-height:100%;">`;
    viewer.onclick = () => viewer.remove();
    document.body.appendChild(viewer);
    setTimeout(() => viewer.remove(), 5000);
}

async function uploadStory(file) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("username", currentUser || "User");
    try {
        await requestJSON(`${API_BASE}/add_story`, { method: "POST", body: formData });
        invalidateCache([`${API_BASE}/stories`]);
        loadStories(true);
        document.getElementById("storyInput").value = "";
        showToast("تم إضافة الستوري");
    } catch (error) {
        showToast(error.message);
    }
}

async function uploadReel(file) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("username", currentUser || "User");
    try {
        await requestJSON(`${API_BASE}/add_reel`, { method: "POST", body: formData });
        invalidateCache([`${API_BASE}/reels`]);
        document.getElementById("reelInput") && (document.getElementById("reelInput").value = "");
        document.getElementById("pageReelInput") && (document.getElementById("pageReelInput").value = "");
        showToast("تم رفع الريل");
        if (document.body.classList.contains("reels-page")) loadReels(true);
    } catch (error) {
        showToast(error.message);
    }
}

async function loadNotifications(force = false) {
    const countEl = document.getElementById("count");
    const box = document.getElementById("notifBox");
    if (!countEl || !box) return;
    try {
        const data = await requestJSON(`${API_BASE}/notifications`);
        countEl.innerText = Array.isArray(data) ? data.length : 0;
        cache[`${API_BASE}/notifications`] = data;
        box.innerHTML = !Array.isArray(data) || !data.length
            ? '<div class="notif-item">لا توجد إشعارات جديدة</div>'
            : data.map(n => `<div class="notif-item">${escapeHTML(n.message)}</div>`).join("");
        if (force) cache[`${API_BASE}/notifications`] = data;
    } catch (error) {
        box.innerHTML = `<div class="notif-item">${escapeHTML(error.message)}</div>`;
    }
}

function toggleNotifications() {
    hideServiceMenu();
    const box = document.getElementById("notifBox");
    if (!box) return;
    box.style.display = box.style.display === "block" ? "none" : "block";
}

function setActiveNav(name) {
    document.querySelectorAll(".bottom-nav button").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.nav === name);
    });
}

function goFeed() {
    setActiveNav("feed");
    if (document.body.classList.contains("feed-page")) {
        reloadFeed();
        return;
    }
    window.location.href = "feed.html";
}

function goUpload() {
    setActiveNav("upload");
    const section = document.getElementById("quickUpload");
    if (section) {
        section.scrollIntoView({ behavior: "smooth", block: "start" });
        showToast("منطقة الرفع جاهزة");
        return;
    }
    window.location.href = "feed.html#quickUpload";
}

function goNotifications() {
    setActiveNav("notifications");
    document.getElementById("notifBox")?.style && (document.getElementById("notifBox").style.display = "block");
    loadNotifications(true);
}

function goProfile() {
    setActiveNav("profile");
    const target = new URLSearchParams(window.location.search).get("user") || currentUser || "";
    window.location.href = `profile.html?user=${encodeURIComponent(target)}`;
}

function goReels() {
    setActiveNav("reels");
    window.location.href = "reels.html";
}

function goInbox() {
    setActiveNav("inbox");
    window.location.href = "inbox.html";
}

function reloadFeed() {
    loadPosts(true);
    loadStories(true);
    loadNotifications(true);
}

function initPullToRefresh() {
    const pullTarget = document.querySelector(".feed-shell") || document.querySelector("main") || document.body;
    document.addEventListener("touchstart", e => { startY = e.touches[0].clientY; }, { passive: true });
    document.addEventListener("touchmove", e => {
        const moveY = e.touches[0].clientY;
        if (window.scrollY <= 0 && moveY - startY > 120) pullTarget.style.transform = "translateY(12px)";
    }, { passive: true });
    document.addEventListener("touchend", e => {
        const endY = e.changedTouches[0].clientY;
        pullTarget.style.transform = "";
        if (window.scrollY <= 0 && endY - startY > 120) reloadFeed();
    }, { passive: true });
}

function isUserComposing() {
    const active = document.activeElement;
    if (!active) return false;
    if (active.matches?.('input, textarea, [contenteditable="true"]')) return true;
    return Boolean(active.closest?.('.comment-box, .reel-comment-box, .composer-box, .input-box, .post-box, .stacked-form'));
}

function startAutoRefresh() {
    if (postsTimer) clearInterval(postsTimer);
    if (notificationsTimer) clearInterval(notificationsTimer);
    postsTimer = setInterval(() => {
        if (isUserComposing()) return;
        loadPosts(true);
        loadNotifications(true);
    }, 5000);
}

async function loadProfile() {
    const usernameEl = document.getElementById("username");
    const postsEl = document.getElementById("posts");
    const profileEmail = document.getElementById("profileEmail");
    const profileActions = document.getElementById("profileActions");
    if (!usernameEl || !postsEl) return;

    const params = new URLSearchParams(window.location.search);
    const user = params.get("user") || currentUser;
    usernameEl.innerText = user || "الملف الشخصي";
    profileEmail.innerText = user === currentUser ? (currentEmail || "جلسة نشطة") : "حساب اجتماعي";

    try {
        const [stats, posts] = await Promise.all([
            requestJSON(`${API_BASE}/followers/${encodeURIComponent(user)}`),
            requestJSON(`${API_BASE}/user_posts/${encodeURIComponent(user)}`)
        ]);
        document.getElementById("followers").innerText = stats.followers || 0;
        document.getElementById("following").innerText = stats.following || 0;

        if (user && user !== currentUser) {
            profileActions.innerHTML = renderRelationshipButtons(user, `
                <button onclick='openChat(${JSON.stringify(user)})'>💬 مراسلة</button>
                <button onclick='blockUser(${JSON.stringify(user)})'>⛔ حظر</button>
                <button onclick='reportUser(${JSON.stringify(user)})'>🚩 تبليغ</button>
            `);
            hydrateRelationshipButtons(profileActions);
        } else {
            profileActions.innerHTML = `
                <button onclick="openProfileEditor()">✏️ تعديل الملف</button>
                <button onclick="goReels()">🎬 الريلز</button>
            `;
        }

        if (!posts.length) {
            postsEl.innerHTML = '<div class="post"><div class="empty-state">لا توجد منشورات لهذا المستخدم</div></div>';
            return;
        }

        postsEl.innerHTML = posts.map(post => `
            <div class="post glass">
                <div class="post-top">
                    <div class="post-user">
                        <div class="avatar">👤</div>
                        <div>
                            <b>${escapeHTML(post.username)}</b>
                            <div class="count-chip">الإعجابات: ${post.likes}</div>
                        </div>
                    </div>
                    ${post.username === currentUser ? `<button class="soft-danger" onclick="deletePost(${post.id})">🗑 حذف</button>` : `<button onclick="reportPost(${post.id})">🚩 تبليغ</button>`}
                </div>
                ${renderContent(post.content, post.media)}
            </div>
        `).join("");
    } catch (error) {
        postsEl.innerHTML = `<div class="post"><div class="empty-state">${escapeHTML(error.message)}</div></div>`;
    }
}

function loadReels(force = false) {
    fetchData(`${API_BASE}/reels`, data => {
        reelsData = Array.isArray(data) ? data : [];
        const target = document.getElementById("reels");
        if (!target) return;
        if (!reelsData.length) {
            target.innerHTML = '<div class="reel"><div class="user">لا توجد ريلز حالياً</div></div>';
            return;
        }
        const requestedId = new URLSearchParams(window.location.search).get("reel");
        const requestedIndex = requestedId ? reelsData.findIndex(item => String(item.id) === String(requestedId)) : 0;
        current = requestedIndex >= 0 ? requestedIndex : 0;
        showReel(current);
    }, force);
}

async function deleteReel(reelId) {
    if (!confirm("هل تريد حذف هذا الريل؟")) return;
    try {
        const data = await requestJSON(`${API_BASE}/delete_reel/${reelId}`, { method: "DELETE" });
        showToast(data.message);
        loadReels(true);
    } catch (error) {
        showToast(error.message);
    }
}

async function likeReel(reelId) {
    try {
        const data = await requestJSON(`${API_BASE}/reels/${reelId}/like`, { method: "POST" });
        const reel = reelsData.find(item => item.id === reelId);
        if (reel) {
            reel.likes = data.likes;
            reel.comments_count = data.comments_count;
            reel.liked_by_current_user = data.liked;
        }
        updateReelStats(reelId, data.likes, data.comments_count, data.liked);
        showToast(data.message);
    } catch (error) {
        showToast(error.message);
    }
}

function updateReelStats(reelId, likes, commentsCount, liked) {
    document.getElementById(`reelLikesCount-${reelId}`) && (document.getElementById(`reelLikesCount-${reelId}`).innerText = likes ?? 0);
    document.getElementById(`reelCommentsCount-${reelId}`) && (document.getElementById(`reelCommentsCount-${reelId}`).innerText = commentsCount ?? 0);
    const likeBtn = document.getElementById(`reelLikeBtn-${reelId}`);
    if (likeBtn) {
        likeBtn.classList.toggle("active", Boolean(liked));
        likeBtn.setAttribute("aria-pressed", liked ? "true" : "false");
    }
}

function handleReelCommentInput(reelId, input) {
    const sendBtn = document.getElementById(`reelCommentSend-${reelId}`);
    const box = document.getElementById(`reelCommentsWrap-${reelId}`);
    const hasValue = Boolean(input?.value.trim());
    sendBtn?.classList.toggle("hidden", !hasValue);
    if (box && hasValue) box.style.display = "block";
}

function openReelComments(reelId, focusInput = false) {
    const box = document.getElementById(`reelCommentsWrap-${reelId}`);
    const input = document.getElementById(`reelCommentInput-${reelId}`);
    if (!box) return;
    box.style.display = "block";
    loadReelComments(reelId);
    if (focusInput && input) {
        input.removeAttribute("readonly");
        input.scrollIntoView({ behavior: "smooth", block: "center" });
        window.setTimeout(() => {
            input.focus();
            const length = input.value.length;
            try {
                input.setSelectionRange(length, length);
            } catch (_) {}
        }, 120);
    }
}

async function addReelComment(reelId) {
    const input = document.getElementById(`reelCommentInput-${reelId}`);
    const comment = input?.value.trim();
    if (!comment) {
        showToast("اكتب تعليقاً على الريل أولاً");
        return;
    }
    try {
        const data = await requestJSON(`${API_BASE}/reels/${reelId}/comment`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ comment })
        });
        const reel = reelsData.find(item => item.id === reelId);
        if (reel) {
            reel.likes = data.likes;
            reel.comments_count = data.comments_count;
        }
        input.value = "";
        handleReelCommentInput(reelId, input);
        updateReelStats(reelId, data.likes, data.comments_count, reel?.liked_by_current_user);
        await loadReelComments(reelId);
        document.getElementById(`reelCommentsWrap-${reelId}`).style.display = "block";
        showToast(data.message);
    } catch (error) {
        showToast(error.message);
    }
}

async function loadReelComments(reelId) {
    const list = document.getElementById(`reelComments-${reelId}`);
    if (!list) return;
    try {
        const data = await requestJSON(`${API_BASE}/reels/${reelId}/comments`);
        list.innerHTML = !data.length
            ? '<div class="empty-state">لا توجد تعليقات على الريل بعد</div>'
            : data.map(comment => `<div class="comment"><b>${escapeHTML(comment.username)}:</b> ${escapeHTML(comment.comment)}</div>`).join("");
    } catch (error) {
        list.innerHTML = `<div class="empty-state">${escapeHTML(error.message)}</div>`;
    }
}

function toggleReelComments(reelId, focusInput = false) {
    const box = document.getElementById(`reelCommentsWrap-${reelId}`);
    if (!box) return;
    const shouldShow = box.style.display === "none" || !box.style.display;
    if (!shouldShow && focusInput) {
        openReelComments(reelId, true);
        return;
    }
    box.style.display = shouldShow ? "block" : "none";
    if (shouldShow) {
        loadReelComments(reelId);
        if (focusInput) {
            const input = document.getElementById(`reelCommentInput-${reelId}`);
            window.setTimeout(() => input?.focus(), 120);
        }
    }
}

function showReel(index) {
    const target = document.getElementById("reels");
    if (!target || !reelsData[index]) return;
    const r = reelsData[index];
    const isLiked = Boolean(r.liked_by_current_user);
    const isMine = r.username === currentUser;
    target.innerHTML = `
        <div class="reel">
            <video id="video" autoplay loop playsinline webkit-playsinline preload="metadata" controls>
                <source src="${normalizeMediaUrl(r.video_url || (r.video ? `${API_BASE}/uploads/${encodeURIComponent(r.video)}` : ''))}">
            </video>
            <div class="reel-gradient"></div>
            <div class="user">👤 ${escapeHTML(r.username)}</div>
            <div class="reel-meta">ريل ${index + 1} من ${reelsData.length}</div>
            <div class="reel-side-actions">
                <button id="reelLikeBtn-${r.id}" class="reel-action-btn ${isLiked ? "active" : ""}" onclick="likeReel(${r.id})">❤️</button>
                <div class="reel-action-count" id="reelLikesCount-${r.id}">${r.likes || 0}</div>
                <button class="reel-action-btn" onclick="toggleReelComments(${r.id}, true)">💬</button>
                <div class="reel-action-count" id="reelCommentsCount-${r.id}">${r.comments_count || 0}</div>
                <button class="reel-action-btn" onclick="shareReel(${r.id})">📤</button>
                <button class="reel-action-btn" onclick="${isMine ? `deleteReel(${r.id})` : `reportReel(${r.id})`}">${isMine ? "🗑" : "🚩"}</button>
            </div>
            <div id="reelCommentsWrap-${r.id}" class="reel-comment-panel glass" style="display:none;">
                <div id="reelComments-${r.id}" class="reel-comments-list"></div>
                <div class="comment-box reel-comment-box">
                    <input type="text" id="reelCommentInput-${r.id}" placeholder="اكتب تعليقك على الريل..." autocomplete="off" autocorrect="off" autocapitalize="sentences" spellcheck="true" onfocus="openReelComments(${r.id}, true)" oninput="handleReelCommentInput(${r.id}, this)">
                    <button id="reelCommentSend-${r.id}" class="send-comment-btn hidden" onclick="addReelComment(${r.id})">إرسال</button>
                </div>
            </div>
        </div>
    `;
    document.getElementById("video")?.play().catch(() => {});
}

function next() { if (current < reelsData.length - 1) { current++; showReel(current); } }
function prev() { if (current > 0) { current--; showReel(current); } }

function initReelsSwipe() {
    const isInteractiveTarget = target => Boolean(target?.closest?.('input, textarea, button, select, .reel-comment-panel'));
    document.addEventListener("touchstart", e => {
        if (isInteractiveTarget(e.target)) {
            startY = 0;
            return;
        }
        startY = e.touches[0].clientY;
    }, { passive: true });
    document.addEventListener("touchend", e => {
        if (!startY || isInteractiveTarget(e.target)) return;
        const endY = e.changedTouches[0].clientY;
        if (endY < startY - 50) next();
        if (endY > startY + 50) prev();
        startY = 0;
    }, { passive: true });
    document.addEventListener("keydown", e => {
        if (e.key === "ArrowUp") prev();
        if (e.key === "ArrowDown") next();
    });
}

async function loadMessages() {
    const receiver = new URLSearchParams(window.location.search).get("user");
    const box = document.getElementById("messages");
    if (!receiver || !box) return;
    try {
        const data = await requestJSON(`${API_BASE}/get_messages?receiver=${encodeURIComponent(receiver)}`);
        if (!data.length) {
            box.innerHTML = '<div class="empty-state">ابدأ المحادثة الآن</div>';
            return;
        }
        box.innerHTML = data.map(m => `<div class="msg ${m.sender === currentUser ? 'me' : 'other'}">${escapeHTML(m.message)}</div>`).join("");
        box.scrollTop = box.scrollHeight;
    } catch (error) {
        box.innerHTML = `<div class="empty-state">${escapeHTML(error.message)}</div>`;
    }
}

async function sendMsg(btn) {
    const receiver = new URLSearchParams(window.location.search).get("user");
    const input = document.getElementById("msgInput");
    const message = input?.value.trim();
    if (!receiver || !message) {
        showToast("اكتب الرسالة أولاً");
        return;
    }
    showLoading(btn);
    try {
        await requestJSON(`${API_BASE}/send_message`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sender: currentUser, receiver, message })
        });
        input.value = "";
        await loadMessages();
    } catch (error) {
        showToast(error.message);
    } finally {
        resetLoading(btn);
    }
}

function initChatPage() {
    const receiver = new URLSearchParams(window.location.search).get("user");
    document.getElementById("chatWith") && (document.getElementById("chatWith").innerText = receiver ? `المحادثة مع ${receiver}` : "لم يتم اختيار مستخدم");
    loadMessages();
    if (chatTimer) clearInterval(chatTimer);
    chatTimer = setInterval(loadMessages, 2000);
}

function installGlobalUIEvents() {
    document.addEventListener("click", event => {
        const menu = document.getElementById("serviceMenu");
        const isMenuTrigger = event.target.closest?.('[data-menu-trigger]');
        const isNotifTrigger = event.target.closest?.('[data-notif-trigger]');
        if (menu && !menu.classList.contains("hidden") && !menu.contains(event.target) && !isMenuTrigger) {
            menu.classList.add("hidden");
        }

        const notifBox = document.getElementById("notifBox");
        if (notifBox && notifBox.style.display === "block" && !notifBox.contains(event.target) && !isNotifTrigger) {
            notifBox.style.display = "none";
        }
    });

    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', event => {
            if (event.target === modal) modal.classList.add('hidden');
        });
    });
}

window.addEventListener("DOMContentLoaded", async () => {
    applyTheme();
    installGlobalUIEvents();

    if (document.body.classList.contains("auth-page")) {
        const sessionData = await checkSession(false);
        if (sessionData.user) window.location.href = "feed.html";
        return;
    }

    await checkSession(true);

    const postComposer = document.getElementById("postInput");
    if (postComposer) {
        postComposer.value = "";
        postComposer.setAttribute("autocomplete", "off");
        postComposer.setAttribute("autocorrect", "off");
        postComposer.setAttribute("autocapitalize", "sentences");
        postComposer.setAttribute("spellcheck", "true");
    }

    if (document.body.classList.contains("feed-page")) {
        setActiveNav("feed");
        reloadFeed();
        initPullToRefresh();
        startAutoRefresh();
        return;
    }

    if (document.body.classList.contains("profile-page")) {
        loadProfile();
        return;
    }

    if (document.body.classList.contains("reels-page")) {
        loadReels(true);
        initReelsSwipe();
        return;
    }

    if (document.body.classList.contains("chat-page") && typeof window.initChatPage === "function") {
        window.initChatPage();
    }
});

(function () {
    const enc = new TextEncoder();
    const dec = new TextDecoder();
    let chatPendingMedia = null;
    let chatMediaRecorder = null;
    let chatVoiceChunks = [];
    let typingTimer = null;
    let lastTypingSentAt = 0;

    function chatReceiver() {
        return new URLSearchParams(window.location.search).get('user') || '';
    }

    function chatSecretKey(receiver) {
        const pair = [String(currentUser || '').trim(), String(receiver || '').trim()].sort().join('::');
        return `yamshat_e2e_${pair}`;
    }

    function getChatSecret(receiver = chatReceiver()) {
        return localStorage.getItem(chatSecretKey(receiver)) || '';
    }

    function setChatSecret(receiver, secret) {
        const key = chatSecretKey(receiver);
        if (!secret) localStorage.removeItem(key);
        else localStorage.setItem(key, secret);
    }

    async function deriveChatCryptoKey(secret, receiver) {
        const material = await crypto.subtle.importKey('raw', enc.encode(secret), 'PBKDF2', false, ['deriveKey']);
        const salt = enc.encode([String(currentUser || '').trim(), String(receiver || '').trim()].sort().join('|yamshat|'));
        return crypto.subtle.deriveKey(
            { name: 'PBKDF2', salt, iterations: 120000, hash: 'SHA-256' },
            material,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt']
        );
    }

    function toB64(buffer) {
        return btoa(String.fromCharCode(...new Uint8Array(buffer)));
    }

    function fromB64(value) {
        return Uint8Array.from(atob(value), c => c.charCodeAt(0));
    }

    async function encryptChatText(plainText, receiver) {
        const secret = getChatSecret(receiver);
        if (!secret || !plainText) return plainText;
        const key = await deriveChatCryptoKey(secret, receiver);
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plainText));
        return `ENCv1:${toB64(iv)}:${toB64(cipher)}`;
    }

    async function decryptChatText(cipherText, receiver) {
        const text = String(cipherText || '');
        if (!text.startsWith('ENCv1:')) return text;
        const secret = getChatSecret(receiver);
        if (!secret) return '🔐 رسالة مشفرة — فعّل E2E لقراءتها';
        const parts = text.split(':');
        if (parts.length < 3) return '🔐 رسالة مشفرة';
        try {
            const key = await deriveChatCryptoKey(secret, receiver);
            const iv = fromB64(parts[1]);
            const payload = fromB64(parts.slice(2).join(':'));
            const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, payload);
            return dec.decode(plain);
        } catch (_) {
            return '🔐 تعذر فك التشفير بهذه العبارة السرية';
        }
    }

    function isAudio(url) {
        return /\.(mp3|wav|m4a|aac|ogg|oga|opus|3gp|amr|weba)$/i.test(url || '');
    }

    function chatStatusLabel(status) {
        switch (String(status || '').toLowerCase()) {
            case 'seen': return '✓✓ تمت المشاهدة';
            case 'delivered': return '✓✓ تم التسليم';
            case 'deleted': return 'تم الحذف';
            default: return '✓ تم الإرسال';
        }
    }

    function clearChatPendingMedia() {
        chatPendingMedia = null;
        const preview = document.getElementById('chatUploadPreview');
        if (preview) {
            preview.classList.add('hidden');
            preview.innerHTML = '';
        }
        const input = document.getElementById('chatMediaInput');
        if (input) input.value = '';
    }

    function renderPendingMedia(url, type) {
        const preview = document.getElementById('chatUploadPreview');
        if (!preview) return;
        preview.classList.remove('hidden');
        const safe = normalizeMediaUrl(url);
        if (type === 'image') {
            preview.innerHTML = `<img src="${encodeURI(safe)}" alt="preview"><button type="button" onclick="clearChatPendingMedia()">إزالة</button>`;
        } else if (type === 'video') {
            preview.innerHTML = `<video controls src="${encodeURI(safe)}"></video><button type="button" onclick="clearChatPendingMedia()">إزالة</button>`;
        } else {
            preview.innerHTML = `<div class="upload-preview-file">🎤 جاهز للإرسال الصوتي</div><button type="button" onclick="clearChatPendingMedia()">إزالة</button>`;
        }
    }

    async function uploadChatMedia(file) {
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file, file.name || 'upload');
        try {
            const data = await requestJSON(`${API_BASE}/upload`, { method: 'POST', body: formData });
            const url = data.file_url || data.url;
            if (!url) throw new Error('تعذر رفع الملف');
            let type = 'file';
            if ((file.type || '').startsWith('image/')) type = 'image';
            else if ((file.type || '').startsWith('video/')) type = 'video';
            else if ((file.type || '').startsWith('audio/')) type = 'voice';
            chatPendingMedia = { url, type, name: file.name || '' };
            renderPendingMedia(url, type);
            showToast(type === 'voice' ? 'تم تجهيز الرسالة الصوتية' : 'تم رفع الملف وجاهز للإرسال');
        } catch (error) {
            showToast(error.message || 'فشل رفع الملف');
        }
    }

    async function toggleVoiceRecording() {
        const status = document.getElementById('voiceStatus');
        const recordBtn = document.getElementById('voiceRecordBtn');
        if (chatMediaRecorder && chatMediaRecorder.state === 'recording') {
            chatMediaRecorder.stop();
            if (recordBtn) recordBtn.textContent = '🎤';
            if (status) status.textContent = 'جاري تجهيز الرسالة الصوتية...';
            return;
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            chatVoiceChunks = [];
            chatMediaRecorder = new MediaRecorder(stream);
            chatMediaRecorder.ondataavailable = event => {
                if (event.data?.size) chatVoiceChunks.push(event.data);
            };
            chatMediaRecorder.onstop = async () => {
                stream.getTracks().forEach(track => track.stop());
                const blob = new Blob(chatVoiceChunks, { type: chatMediaRecorder.mimeType || 'audio/webm' });
                const ext = (chatMediaRecorder.mimeType || '').includes('ogg') ? 'ogg' : 'weba';
                const file = new File([blob], `voice-note.${ext}`, { type: blob.type || 'audio/webm' });
                if (status) status.textContent = 'جاري رفع الرسالة الصوتية...';
                await uploadChatMedia(file);
                if (status) status.textContent = 'الرسالة الصوتية جاهزة';
            };
            chatMediaRecorder.start();
            if (recordBtn) recordBtn.textContent = '⏹';
            if (status) status.textContent = 'جاري التسجيل... اضغط للإيقاف';
        } catch (error) {
            showToast(error.message || 'تعذر الوصول إلى الميكروفون');
        }
    }

    async function renderChatMessage(m, receiver) {
        const deleted = Boolean(m.deleted);
        const safeMedia = normalizeMediaUrl(m.media_url || '');
        const rawText = deleted ? 'تم حذف هذه الرسالة' : String(m.content || m.message || '');
        const text = await decryptChatText(rawText, receiver);
        const mine = m.sender === currentUser;
        let mediaHtml = '';
        if (!deleted && safeMedia) {
            if (isImage(safeMedia) || m.type === 'image') mediaHtml = `<img class="chat-media" src="${encodeURI(safeMedia)}" alt="image message">`;
            else if (isVideo(safeMedia) || m.type === 'video') mediaHtml = `<video class="chat-media" controls src="${encodeURI(safeMedia)}"></video>`;
            else if (isAudio(safeMedia) || m.type === 'voice') mediaHtml = `<audio class="chat-audio" controls src="${encodeURI(safeMedia)}"></audio>`;
            else mediaHtml = `<a class="chat-file-link" href="${encodeURI(safeMedia)}" target="_blank" rel="noopener">فتح الملف</a>`;
        }
        const deleteBtn = mine && !deleted ? `<button class="chat-delete-btn" type="button" onclick="deleteChatMessage(${Number(m.id || 0)})">حذف للجميع</button>` : '';
        return `
            <div class="msg ${mine ? 'me' : 'other'} ${deleted ? 'deleted' : ''}">
                <div class="chat-msg-body">
                    ${text ? `<div class="chat-msg-text">${escapeHTML(text)}</div>` : ''}
                    ${mediaHtml}
                </div>
                <div class="chat-msg-meta">
                    <span>${escapeHTML(String(m.created_at || '').replace('T', ' ').slice(0, 16))}</span>
                    ${mine ? `<span>${escapeHTML(chatStatusLabel(m.status))}</span>` : ''}
                </div>
                ${deleteBtn}
            </div>
        `;
    }

    async function refreshPresence() {
        const receiver = chatReceiver();
        const label = document.getElementById('presenceText');
        if (!receiver || !label) return;
        try {
            const data = await requestJSON(`${API_BASE}/presence/${encodeURIComponent(receiver)}`);
            label.textContent = data.is_online ? '🟢 متصل الآن' : `آخر ظهور: ${String(data.last_seen || '').replace('T', ' ').slice(0, 16) || 'غير متاح'}`;
        } catch (_) {
            label.textContent = 'تعذر جلب الحالة الآن';
        }
    }

    async function notifySeen(receiver) {
        try {
            await requestJSON(`${API_BASE}/message_seen`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sender: receiver })
            });
        } catch (_) {}
    }

    async function sendPresence(online) {
        try {
            await requestJSON(`${API_BASE}/update_online`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ online: Boolean(online) })
            });
        } catch (_) {}
    }

    async function loadMessagesEnhanced() {
        const receiver = chatReceiver();
        const box = document.getElementById('messages');
        if (!receiver || !box) return;
        try {
            const data = await requestJSON(`${API_BASE}/get_messages?receiver=${encodeURIComponent(receiver)}`);
            if (!data.length) {
                box.innerHTML = '<div class="empty-state">ابدأ المحادثة الآن</div>';
                await refreshPresence();
                return;
            }
            const html = await Promise.all(data.map(item => renderChatMessage(item, receiver)));
            box.innerHTML = html.join('');
            box.scrollTop = box.scrollHeight;
            await notifySeen(receiver);
            await refreshPresence();
        } catch (error) {
            box.innerHTML = `<div class="empty-state">${escapeHTML(error.message)}</div>`;
        }
    }

    async function sendMsgEnhanced(btn) {
        const receiver = chatReceiver();
        const input = document.getElementById('msgInput');
        const rawMessage = input?.value.trim() || '';
        if (!receiver || (!rawMessage && !chatPendingMedia)) {
            showToast('اكتب رسالة أو أرفق ملفاً أولاً');
            return;
        }
        showLoading(btn);
        try {
            const encryptedMessage = rawMessage ? await encryptChatText(rawMessage, receiver) : '';
            const type = chatPendingMedia?.type || 'text';
            await requestJSON(`${API_BASE}/send_message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    receiver,
                    message: encryptedMessage,
                    type,
                    media_url: chatPendingMedia?.url || null
                })
            });
            if (input) input.value = '';
            clearChatPendingMedia();
            await loadMessagesEnhanced();
        } catch (error) {
            showToast(error.message);
        } finally {
            resetLoading(btn);
        }
    }

    async function deleteChatMessage(messageId) {
        if (!messageId) return;
        try {
            await requestJSON(`${API_BASE}/delete_message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message_id: messageId })
            });
            await loadMessagesEnhanced();
        } catch (error) {
            showToast(error.message || 'تعذر حذف الرسالة');
        }
    }

    function sendTypingPing(isTyping) {
        const receiver = chatReceiver();
        if (!receiver) return;
        const now = Date.now();
        if (isTyping && now - lastTypingSentAt < 1200) return;
        lastTypingSentAt = now;
        requestJSON(`${API_BASE}/typing`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ receiver, is_typing: Boolean(isTyping) })
        }).catch(() => {});
    }

    function initChatTyping() {
        const input = document.getElementById('msgInput');
        if (!input) return;
        input.addEventListener('input', () => {
            sendTypingPing(Boolean(input.value.trim()));
            clearTimeout(typingTimer);
            typingTimer = setTimeout(() => sendTypingPing(false), 1200);
        });
    }

    function toggleChatE2E() {
        const receiver = chatReceiver();
        if (!receiver) return;
        const current = getChatSecret(receiver);
        const next = window.prompt(current ? 'أدخل عبارة سرية جديدة أو اتركها فارغة لإيقاف E2E' : 'أدخل عبارة سرية لتفعيل E2E بينك وبين هذا المستخدم', current || '');
        if (next === null) return;
        setChatSecret(receiver, next.trim());
        showToast(next.trim() ? 'تم تفعيل التشفير الطرفي لهذه المحادثة' : 'تم إيقاف التشفير الطرفي');
        loadMessagesEnhanced();
    }

    function startCall(mode) {
        const receiver = chatReceiver();
        if (!receiver) return;
        window.location.href = `call.html?user=${encodeURIComponent(receiver)}&mode=${encodeURIComponent(mode || 'video')}`;
    }

    function initChatPageEnhanced() {
        const receiver = chatReceiver();
        document.getElementById('chatWith') && (document.getElementById('chatWith').innerText = receiver ? `المحادثة مع ${receiver}` : 'لم يتم اختيار مستخدم');
        initChatTyping();
        loadMessagesEnhanced();
        sendPresence(true);
        if (chatTimer) clearInterval(chatTimer);
        chatTimer = setInterval(loadMessagesEnhanced, 4000);
        document.addEventListener('visibilitychange', () => sendPresence(!document.hidden));
        window.addEventListener('beforeunload', () => sendPresence(false));
    }

    window.loadMessages = loadMessagesEnhanced;
    window.sendMsg = sendMsgEnhanced;
    window.uploadChatMedia = uploadChatMedia;
    window.toggleVoiceRecording = toggleVoiceRecording;
    window.deleteChatMessage = deleteChatMessage;
    window.toggleChatE2E = toggleChatE2E;
    window.startCall = startCall;
    window.clearChatPendingMedia = clearChatPendingMedia;
    window.initChatPage = initChatPageEnhanced;
})();


(function () {
    let chatSocket = null;
    let presenceUnloadBound = false;
    let typingTimeout = null;
    let lastTypingSentAt = 0;

    function activeReceiver() {
        return new URLSearchParams(window.location.search).get('user') || '';
    }

    function updatePresenceLabel(payload) {
        const receiver = activeReceiver();
        const label = document.getElementById('presenceText');
        if (!label || !payload || payload.user !== receiver) return;
        label.textContent = payload.is_online ? '🟢 متصل الآن' : `آخر ظهور: ${String(payload.last_seen || '').replace('T', ' ').slice(0, 16) || 'غير متاح'}`;
    }

    function updateTyping(payload) {
        const receiver = activeReceiver();
        const indicator = document.getElementById('typingIndicator');
        if (!indicator || !payload || payload.sender !== receiver) return;
        indicator.classList.toggle('hidden', !payload.is_typing);
        indicator.textContent = payload.is_typing ? 'يكتب الآن...' : '';
    }

    function connectRealtimeChat() {
        const receiver = activeReceiver();
        const auth = window.getStoredAuth ? window.getStoredAuth() : {};
        if (!receiver || !auth?.token || typeof io === 'undefined') return;

        if (chatSocket) {
            try { chatSocket.disconnect(); } catch (_) {}
        }

        const origin = (window.YAMSHAT_BACKEND_ORIGIN || window.location.origin || '').replace(/\/+$/, '');
        chatSocket = io(origin, {
            transports: ['websocket'],
            withCredentials: true,
            auth: { token: auth.token }
        });

        chatSocket.on('connect', () => {
            chatSocket.emit('join_chat', { user: auth.user, peer: receiver, token: auth.token });
        });

        ['new_private_message', 'message_deleted', 'messages_seen', 'messages_delivered', 'incoming_call'].forEach(eventName => {
            chatSocket.on(eventName, () => {
                if (typeof window.loadMessages === 'function') window.loadMessages();
            });
        });

        chatSocket.on('presence_update', payload => updatePresenceLabel(payload));
        chatSocket.on('typing_update', payload => updateTyping(payload));
    }

    async function sendPresenceRealtime(online) {
        const auth = window.getStoredAuth ? window.getStoredAuth() : {};
        const receiver = activeReceiver();
        try {
            await requestJSON(`${API_BASE}/update_online`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ online: Boolean(online) })
            });
        } catch (_) {}
        if (chatSocket?.connected) {
            chatSocket.emit('chat_presence', { user: auth.user, peer: receiver, online: Boolean(online) });
        }
    }

    function bindRealtimeTyping() {
        const input = document.getElementById('msgInput');
        const auth = window.getStoredAuth ? window.getStoredAuth() : {};
        if (!input) return;
        input.addEventListener('input', () => {
            const receiver = activeReceiver();
            if (!receiver) return;
            const now = Date.now();
            const isTyping = Boolean(input.value.trim());
            if (isTyping && now - lastTypingSentAt < 1000) return;
            lastTypingSentAt = now;
            requestJSON(`${API_BASE}/typing`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ receiver, is_typing: isTyping })
            }).catch(() => {});
            if (chatSocket?.connected) {
                chatSocket.emit('chat_typing', { sender: auth.user, receiver, is_typing: isTyping });
            }
            clearTimeout(typingTimeout);
            typingTimeout = setTimeout(() => {
                requestJSON(`${API_BASE}/typing`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ receiver, is_typing: false })
                }).catch(() => {});
                if (chatSocket?.connected) {
                    chatSocket.emit('chat_typing', { sender: auth.user, receiver, is_typing: false });
                }
            }, 1200);
        }, { passive: true });
    }

    function initChatPageRealtime() {
        const receiver = activeReceiver();
        document.getElementById('chatWith') && (document.getElementById('chatWith').innerText = receiver ? `المحادثة مع ${receiver}` : 'لم يتم اختيار مستخدم');
        if (typeof window.loadMessages === 'function') window.loadMessages();
        bindRealtimeTyping();
        connectRealtimeChat();
        sendPresenceRealtime(true);
        document.addEventListener('visibilitychange', () => sendPresenceRealtime(!document.hidden));
        if (!presenceUnloadBound) {
            presenceUnloadBound = true;
            window.addEventListener('beforeunload', () => sendPresenceRealtime(false));
        }
    }

    window.initChatPage = initChatPageRealtime;
})();

const API_BASE = localStorage.getItem("apiBase") || "http://127.0.0.1:5000";

let currentUser = null;
let currentEmail = null;
let cache = {};
let postsTimer = null;
let notificationsTimer = null;
let chatTimer = null;
let reelsData = [];
let current = 0;
let startY = 0;

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

function renderContent(content) {
    const safeContent = String(content || "").trim();

    if (isVideo(safeContent)) {
        return `<video class="post-media" controls src="${encodeURI(safeContent)}"></video>`;
    }

    if (isImage(safeContent)) {
        return `<img class="post-media" src="${encodeURI(safeContent)}" alt="post image">`;
    }

    return `<p class="post-text">${escapeHTML(safeContent)}</p>`;
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

async function requestJSON(url, options = {}) {
    const finalOptions = {
        credentials: "include",
        ...options,
    };

    const response = await fetch(url, finalOptions);
    const data = await response.json().catch(() => ({ message: "حدث خطأ غير متوقع" }));

    if (!response.ok) {
        throw new Error(data.message || "حدث خطأ في الطلب");
    }

    return data;
}

function fetchData(url, callback, force = false) {
    if (cache[url] && !force) {
        callback(cache[url]);
        return;
    }

    fetch(url, { credentials: "include" })
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

function showRegister() {
    document.getElementById("loginForm")?.classList.add("hidden");
    document.getElementById("registerForm")?.classList.remove("hidden");
}

function showLogin() {
    document.getElementById("registerForm")?.classList.add("hidden");
    document.getElementById("loginForm")?.classList.remove("hidden");
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
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password })
        });

        showToast(data.message);
        document.getElementById("registerName").value = "";
        document.getElementById("registerEmail").value = "";
        document.getElementById("registerPassword").value = "";
        showLogin();
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
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        currentUser = data.user;
        showToast(data.message);
        window.location.href = "feed.html";
    } catch (error) {
        showToast(error.message);
    } finally {
        resetLoading(btn);
    }
}

async function checkSession(redirectIfMissing = true) {
    try {
        const data = await requestJSON(`${API_BASE}/me`, {
            credentials: "include"
        });

        if (data.user) {
            currentUser = data.user;
            currentEmail = data.email || "";
            const sessionLabel = document.getElementById("sessionUser");
            if (sessionLabel) {
                sessionLabel.innerText = `مرحباً ${currentUser}`;
            }
            return data;
        }
    } catch (error) {
        console.error(error.message);
    }

    if (redirectIfMissing) {
        window.location.href = "index.html";
    }

    return { user: null };
}

async function logout() {
    try {
        await fetch(`${API_BASE}/logout`, {
            credentials: "include"
        });
    } finally {
        window.location.href = "index.html";
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
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: currentUser,
                content
            })
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
        const uploadData = await requestJSON(`${API_BASE}/upload`, {
            method: "POST",
            credentials: "include",
            body: formData
        });

        await requestJSON(`${API_BASE}/add_post`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: currentUser,
                content: uploadData.file_url
            })
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

async function like(id) {
    try {
        await requestJSON(`${API_BASE}/like/${id}`, {
            method: "POST",
            credentials: "include"
        });
        await Promise.all([loadPosts(true), loadNotifications(true)]);
    } catch (error) {
        showToast(error.message);
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
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                post_id: id,
                username: currentUser,
                comment
            })
        });

        input.value = "";
        await loadComments(id);
        await loadNotifications(true);
        document.getElementById(`comments-${id}`).style.display = "block";
        showToast("تم إضافة التعليق");
    } catch (error) {
        showToast(error.message);
    }
}

async function loadComments(id) {
    try {
        const data = await requestJSON(`${API_BASE}/comments/${id}`, { credentials: "include" });
        const box = document.getElementById(`comments-${id}`);
        if (!box) return;

        if (!data.length) {
            box.innerHTML = '<div class="empty-state">لا توجد تعليقات بعد</div>';
            return;
        }

        box.innerHTML = data.map(c => `
            <div class="comment"><b>${escapeHTML(c.username)}:</b> ${escapeHTML(c.comment)}</div>
        `).join("");
    } catch (error) {
        console.error(error.message);
    }
}

function toggleComments(id) {
    const box = document.getElementById(`comments-${id}`);
    if (!box) return;
    box.style.display = box.style.display === "none" ? "block" : "none";
    if (box.style.display === "block") {
        loadComments(id);
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
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ following: user })
        });
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

    navigator.clipboard?.writeText(text).then(() => {
        showToast("تم نسخ رابط المشاركة");
    }).catch(() => {
        showToast("تم تجهيز المشاركة");
    });
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
    feed.innerHTML = `
        <div class="skeleton"></div>
        <div class="skeleton"></div>
        <div class="skeleton"></div>
    `;
}

async function loadPosts(force = false) {
    const feed = document.getElementById("feed");
    if (!feed) return;

    if (!feed.dataset.loaded) {
        showFeedSkeleton();
    }

    try {
        const data = await requestJSON(`${API_BASE}/posts`, { credentials: "include" });
        feed.dataset.loaded = "true";

        if (!data.length) {
            feed.innerHTML = '<div class="post"><div class="empty-state">لا توجد منشورات حالياً</div></div>';
            return;
        }

        feed.innerHTML = data.map(post => `
            <div class="post glass">
                <div class="post-top">
                    <div class="post-user">
                        <div class="avatar">👤</div>
                        <div>
                            <b class="user-link" onclick="openProfile('${escapeHTML(post.username)}')">${escapeHTML(post.username)}</b>
                            <div class="count-chip">منشور حديث</div>
                        </div>
                    </div>
                    <button onclick="follow('${escapeHTML(post.username)}')">➕</button>
                </div>

                ${renderContent(post.content)}

                <div class="actions">
                    <button onclick="like(${post.id})">❤️</button>
                    <button onclick="toggleComments(${post.id})">💬</button>
                    <button onclick="reloadFeed()">🔄</button>
                    <button onclick="sharePost(${post.id})">📤</button>
                </div>

                <div class="count-chip">الإعجابات: ${post.likes}</div>

                <div id="comments-${post.id}" class="comments-wrapper" style="display:none;"></div>

                <div class="comment-box">
                    <input type="text" id="commentInput-${post.id}" placeholder="اكتب تعليق...">
                    <button onclick="addComment(${post.id})">إرسال</button>
                </div>
            </div>
        `).join("");

        data.forEach(post => loadComments(post.id));
        if (force) {
            cache[`${API_BASE}/posts`] = data;
        }
    } catch (error) {
        feed.innerHTML = `<div class="post"><div class="empty-state">${escapeHTML(error.message)}</div></div>`;
    }
}

function loadStories(force = false) {
    const bar = document.getElementById("storyBar");
    if (!bar) return;

    const url = `${API_BASE}/stories`;
    fetchData(url, data => {
        if (!Array.isArray(data) || !data.length) {
            bar.innerHTML = '<div class="empty-state">لا توجد ستوري حالياً</div>';
            return;
        }

        bar.innerHTML = data.map(s => {
            const mediaUrl = `${API_BASE}/uploads/${encodeURIComponent(s.media)}`;
            const preview = isVideo(s.media)
                ? `<video muted playsinline><source src="${mediaUrl}"></video>`
                : `<img src="${mediaUrl}" alt="story">`;

            return `
                <div class="story-item">
                    <div class="story" onclick="openStory('${escapeHTML(s.media)}')">
                        ${preview}
                    </div>
                    <div class="story-label">${escapeHTML(s.username)}</div>
                </div>
            `;
        }).join("");
    }, force);
}

function openStory(media) {
    const viewer = document.createElement("div");
    viewer.style = `
        position:fixed;
        top:0;
        left:0;
        width:100%;
        height:100%;
        background:black;
        display:flex;
        justify-content:center;
        align-items:center;
        z-index:9999;
    `;

    const mediaUrl = `${API_BASE}/uploads/${encodeURIComponent(media)}`;
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
        await requestJSON(`${API_BASE}/add_story`, {
            method: "POST",
            credentials: "include",
            body: formData
        });
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
        await requestJSON(`${API_BASE}/add_reel`, {
            method: "POST",
            credentials: "include",
            body: formData
        });
        invalidateCache([`${API_BASE}/reels`]);
        const reelInput = document.getElementById("reelInput");
        const pageReelInput = document.getElementById("pageReelInput");
        if (reelInput) reelInput.value = "";
        if (pageReelInput) pageReelInput.value = "";
        showToast("تم رفع الريل");
        if (document.body.classList.contains("reels-page")) {
            loadReels(true);
        }
    } catch (error) {
        showToast(error.message);
    }
}

async function loadNotifications(force = false) {
    const countEl = document.getElementById("count");
    const box = document.getElementById("notifBox");
    if (!countEl || !box) return;

    try {
        const data = await requestJSON(`${API_BASE}/notifications`, { credentials: "include" });
        countEl.innerText = Array.isArray(data) ? data.length : 0;
        cache[`${API_BASE}/notifications`] = data;

        if (!Array.isArray(data) || !data.length) {
            box.innerHTML = '<div class="notif-item">لا توجد إشعارات جديدة</div>';
            return;
        }

        box.innerHTML = data.map(n => `<div class="notif-item">${escapeHTML(n.message)}</div>`).join("");
    } catch (error) {
        box.innerHTML = `<div class="notif-item">${escapeHTML(error.message)}</div>`;
    }
}

function toggleNotifications() {
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
    document.getElementById("notifBox").style.display = "block";
    loadNotifications(true);
}

function goProfile() {
    setActiveNav("profile");
    const target = new URLSearchParams(window.location.search).get("user") || currentUser || "";
    window.location.href = `profile.html?user=${encodeURIComponent(target)}`;
}

function goReels() {
    window.location.href = "reels.html";
}

function reloadFeed() {
    loadPosts(true);
    loadStories(true);
    loadNotifications(true);
}

function initPullToRefresh() {
    document.addEventListener("touchstart", e => {
        startY = e.touches[0].clientY;
    }, { passive: true });

    document.addEventListener("touchmove", e => {
        const moveY = e.touches[0].clientY;
        if (moveY - startY > 120) {
            document.body.style.transform = "translateY(20px)";
        }
    }, { passive: true });

    document.addEventListener("touchend", e => {
        const endY = e.changedTouches[0].clientY;
        document.body.style.transform = "translateY(0px)";
        if (endY - startY > 120) {
            loadPosts(true);
            loadStories(true);
            loadNotifications(true);
        }
    }, { passive: true });
}

function startAutoRefresh() {
    if (postsTimer) clearInterval(postsTimer);
    if (notificationsTimer) clearInterval(notificationsTimer);

    postsTimer = setInterval(() => {
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
            requestJSON(`${API_BASE}/followers/${encodeURIComponent(user)}`, { credentials: "include" }),
            requestJSON(`${API_BASE}/user_posts/${encodeURIComponent(user)}`, { credentials: "include" })
        ]);

        document.getElementById("followers").innerText = stats.followers || 0;
        document.getElementById("following").innerText = stats.following || 0;

        if (user && user !== currentUser) {
            profileActions.innerHTML = `
                <button onclick="follow('${escapeHTML(user)}')">➕ متابعة</button>
                <button onclick="openChat('${escapeHTML(user)}')">💬 مراسلة</button>
            `;
        } else {
            profileActions.innerHTML = '<button onclick="goReels()">🎬 الريلز</button>';
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
                </div>
                ${renderContent(post.content)}
            </div>
        `).join("");
    } catch (error) {
        postsEl.innerHTML = `<div class="post"><div class="empty-state">${escapeHTML(error.message)}</div></div>`;
    }
}

function loadReels(force = false) {
    fetchData(`${API_BASE}/reels`, data => {
        reelsData = Array.isArray(data) ? data : [];
        if (!reelsData.length) {
            document.getElementById("reels").innerHTML = '<div class="reel"><div class="user">لا توجد ريلز حالياً</div></div>';
            return;
        }
        current = 0;
        showReel(0);
    }, force);
}

function showReel(index) {
    const target = document.getElementById("reels");
    if (!target || !reelsData[index]) return;

    const r = reelsData[index];
    target.innerHTML = `
        <div class="reel">
            <video id="video" autoplay loop playsinline>
                <source src="${API_BASE}/uploads/${encodeURIComponent(r.video)}">
            </video>
            <div class="user">👤 ${escapeHTML(r.username)}</div>
        </div>
    `;

    document.getElementById("video")?.play().catch(() => {});
}

function next() {
    if (current < reelsData.length - 1) {
        current++;
        showReel(current);
    }
}

function prev() {
    if (current > 0) {
        current--;
        showReel(current);
    }
}

function initReelsSwipe() {
    document.addEventListener("touchstart", e => {
        startY = e.touches[0].clientY;
    }, { passive: true });

    document.addEventListener("touchend", e => {
        const endY = e.changedTouches[0].clientY;
        if (endY < startY - 50) next();
        if (endY > startY + 50) prev();
    }, { passive: true });
}

async function loadMessages() {
    const receiver = new URLSearchParams(window.location.search).get("user");
    const box = document.getElementById("messages");
    if (!receiver || !box) return;

    try {
        const data = await requestJSON(`${API_BASE}/get_messages?receiver=${encodeURIComponent(receiver)}`, {
            credentials: "include"
        });

        if (!data.length) {
            box.innerHTML = '<div class="empty-state">ابدأ المحادثة الآن</div>';
            return;
        }

        box.innerHTML = data.map(m => `
            <div class="msg ${m.sender === currentUser ? 'me' : 'other'}">
                ${escapeHTML(m.message)}
            </div>
        `).join("");

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
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                sender: currentUser,
                receiver,
                message
            })
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
    document.getElementById("chatWith").innerText = receiver ? `المحادثة مع ${receiver}` : "لم يتم اختيار مستخدم";
    loadMessages();
    if (chatTimer) clearInterval(chatTimer);
    chatTimer = setInterval(loadMessages, 2000);
}

window.addEventListener("DOMContentLoaded", async () => {
    if (document.body.classList.contains("auth-page")) {
        return;
    }

    await checkSession(true);

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

    if (document.body.classList.contains("chat-page")) {
        initChatPage();
    }
});

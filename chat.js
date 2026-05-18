const token = localStorage.getItem('yamshat_token') || '';
let socket = null;
let currentUser = '';
let currentPeer = '';
let currentRoom = '';
let mediaRecorder = null;
let mediaChunks = [];
let typingTimeout = null;

const els = {
    currentUser: document.getElementById('currentUser'),
    peerInput: document.getElementById('peerInput'),
    roomInput: document.getElementById('roomInput'),
    joinBtn: document.getElementById('joinBtn'),
    logoutBtn: document.getElementById('logoutBtn'),
    chatTitle: document.getElementById('chatTitle'),
    presenceText: document.getElementById('presenceText'),
    typingBadge: document.getElementById('typingBadge'),
    messages: document.getElementById('messages'),
    messageInput: document.getElementById('messageInput'),
    sendBtn: document.getElementById('sendBtn'),
    fileInput: document.getElementById('fileInput'),
    recordBtn: document.getElementById('recordBtn'),
    recordStatus: document.getElementById('recordStatus'),
    notifCount: document.getElementById('notifCount'),
    notifList: document.getElementById('notifList'),
    notifBell: document.getElementById('notifBell')
};

function authHeaders(extra = {}) {
    const headers = { ...extra };
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
}

async function api(path, options = {}) {
    const headers = authHeaders(options.headers || {});
    const res = await fetch(path, {
        ...options,
        headers,
        credentials: 'same-origin'
    });
    const isJson = (res.headers.get('content-type') || '').includes('application/json');
    const data = isJson ? await res.json() : await res.text();
    if (!res.ok) {
        throw new Error(data.error || data.message || 'حدث خطأ');
    }
    return data;
}

function activeTarget() {
    return {
        receiver: currentPeer || undefined,
        room: currentRoom || undefined
    };
}

function chatTitleText() {
    if (currentPeer) return `محادثة مع ${currentPeer}`;
    if (currentRoom) return `غرفة ${currentRoom}`;
    return 'اختر محادثة';
}

function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

function messageStatusLabel(status) {
    switch ((status || 'sent').toLowerCase()) {
        case 'seen': return '✓✓ تمت المشاهدة';
        case 'delivered': return '✓✓ تم التسليم';
        case 'deleted': return 'تم الحذف';
        default: return '✓ تم الإرسال';
    }
}

function renderMedia(message) {
    if (!message.media_url) return '';
    const url = message.media_url;
    const lower = url.toLowerCase();
    if (/(png|jpg|jpeg|gif|webp)$/.test(lower)) {
        return `<div class="message-media"><img src="${url}" alt="media"></div>`;
    }
    if (/(mp4|webm|mov)$/.test(lower)) {
        return `<div class="message-media"><video src="${url}" controls></video></div>`;
    }
    if (/(mp3|wav|ogg|m4a|aac)$/.test(lower)) {
        return `<div class="message-media"><audio src="${url}" controls></audio></div>`;
    }
    return `<div class="message-media"><a href="${url}" target="_blank" rel="noopener">فتح الملف المرفق</a></div>`;
}

function renderMessages(items) {
    if (!items.length) {
        els.messages.innerHTML = '<div class="empty-state">لا توجد رسائل بعد</div>';
        return;
    }
    els.messages.innerHTML = items.map((message) => {
        const mine = message.sender === currentUser;
        const body = message.deleted ? 'تم حذف هذه الرسالة' : escapeHtml(message.message || message.content || '');
        const edited = message.edited_at ? ' • معدلة' : '';
        const actions = mine && !message.deleted ? `
            <div class="message-actions">
                <button class="mini-btn" onclick="editMessage(${message.id}, ${JSON.stringify(message.message || message.content || '')})">تعديل</button>
                <button class="mini-btn" onclick="deleteMessage(${message.id})">حذف</button>
            </div>` : '';
        return `
            <div class="message-row ${mine ? 'mine' : 'theirs'}">
                <div class="message-bubble">
                    <div><strong>${escapeHtml(message.sender)}</strong></div>
                    <div class="message-body">${body}</div>
                    ${renderMedia(message)}
                    ${actions}
                    <div class="meta">
                        <span>${escapeHtml((message.created_at || '').replace('T', ' ').slice(0, 16))}</span>
                        ${mine ? `<span>${messageStatusLabel(message.status)}${edited}</span>` : `<span>${edited.trim()}</span>`}
                    </div>
                </div>
            </div>`;
    }).join('');
    els.messages.scrollTop = els.messages.scrollHeight;
}

async function loadMessages(markSeen = true) {
    if (!currentPeer && !currentRoom) return;
    const params = new URLSearchParams(activeTarget());
    const items = await api(`/get_messages?${params.toString()}`);
    renderMessages(items);
    if (markSeen && currentPeer) {
        await api('/message_seen', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sender: currentPeer })
        }).catch(() => null);
    }
}

async function loadPresence() {
    if (!currentPeer) {
        els.presenceText.textContent = currentRoom ? 'غرفة شات عامة' : 'بانتظار اختيار مستخدم أو غرفة';
        return;
    }
    const data = await api(`/presence/${encodeURIComponent(currentPeer)}`);
    els.presenceText.textContent = data.is_online ? '🟢 متصل الآن' : `آخر ظهور: ${(data.last_seen || 'غير متاح').replace('T', ' ').slice(0, 16)}`;
}

async function loadNotifications() {
    const items = await api('/notifications');
    const unreadCount = items.filter((item) => !item.read).length;
    els.notifCount.textContent = String(unreadCount);
    els.notifList.innerHTML = items.length ? items.map((item) => `
        <div class="notif-item ${item.read ? '' : 'unread'}" onclick="openNotification(${item.id}, ${JSON.stringify(item.link || '')}, ${JSON.stringify(item.sender || '')})">
            <div>${escapeHtml(item.message)}</div>
            <div class="notif-meta">${escapeHtml(item.created_at?.replace('T', ' ').slice(0, 16) || '')}</div>
        </div>
    `).join('') : '<div class="empty-state">لا توجد إشعارات</div>';
}

async function openNotification(id, link, sender) {
    await api(`/notifications/read/${id}`, { method: 'POST' }).catch(() => null);
    if (sender) {
        currentPeer = sender;
        currentRoom = '';
        els.peerInput.value = sender;
        els.roomInput.value = '';
        await joinSelectedChat();
    } else if (link && link.includes('peer=')) {
        const url = new URL(link, window.location.origin);
        const peer = url.searchParams.get('peer');
        if (peer) {
            currentPeer = peer;
            currentRoom = '';
            els.peerInput.value = peer;
            els.roomInput.value = '';
            await joinSelectedChat();
        }
    }
    await loadNotifications();
}
window.openNotification = openNotification;

async function sendUploadedFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch('/upload', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
        credentials: 'same-origin'
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'فشل رفع الملف');
    return data.file_url || data.url;
}

async function sendVoiceBlob(blob) {
    const formData = new FormData();
    formData.append('file', blob, `voice-${Date.now()}.webm`);
    const response = await fetch('/send_voice', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
        credentials: 'same-origin'
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'فشل رفع الصوت');
    return data.file_url || data.url;
}

async function sendMessage() {
    if (!currentPeer && !currentRoom) {
        alert('حدد مستخدم أو غرفة أولاً');
        return;
    }
    let mediaUrl = null;
    let type = 'text';
    const file = els.fileInput.files[0];
    if (file) {
        mediaUrl = await sendUploadedFile(file);
        if (file.type.startsWith('image/')) type = 'image';
        else if (file.type.startsWith('video/')) type = 'video';
        else if (file.type.startsWith('audio/')) type = 'voice';
        else type = 'file';
    }
    const message = els.messageInput.value.trim();
    const payload = {
        ...activeTarget(),
        message,
        type,
        media_url: mediaUrl,
        client_id: `web_${Date.now()}`
    };
    await api('/send_message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    els.messageInput.value = '';
    els.fileInput.value = '';
    await loadMessages(false);
}

async function editMessage(messageId, currentText) {
    const nextValue = window.prompt('تعديل الرسالة', currentText || '');
    if (nextValue === null) return;
    await api('/edit_message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message_id: messageId, message: nextValue })
    });
    await loadMessages(false);
}
window.editMessage = editMessage;

async function deleteMessage(messageId) {
    if (!window.confirm('هل تريد حذف الرسالة؟')) return;
    await api('/delete_message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message_id: messageId })
    });
    await loadMessages(false);
}
window.deleteMessage = deleteMessage;

async function joinSelectedChat() {
    currentPeer = els.peerInput.value.trim();
    currentRoom = els.roomInput.value.trim();
    if (!currentPeer && !currentRoom) {
        alert('اكتب اسم مستخدم أو اسم غرفة');
        return;
    }
    els.chatTitle.textContent = chatTitleText();
    if (socket?.connected) {
        socket.emit('join_chat', { peer: currentPeer || null, room: currentRoom || null });
    }
    await loadPresence();
    await loadMessages(false);
}

async function logout() {
    await api('/logout', { method: 'POST' }).catch(() => null);
    localStorage.removeItem('yamshat_token');
    window.location.href = '/login.html';
}

async function initRecorder() {
    if (!navigator.mediaDevices?.getUserMedia) {
        alert('المتصفح لا يدعم التسجيل الصوتي');
        return;
    }
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        return;
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaChunks = [];
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) mediaChunks.push(event.data);
    };
    mediaRecorder.onstop = async () => {
        els.recordStatus.textContent = 'جاري رفع الرسالة الصوتية...';
        try {
            const blob = new Blob(mediaChunks, { type: 'audio/webm' });
            const fileUrl = await sendVoiceBlob(blob);
            await api('/send_message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...activeTarget(),
                    message: els.messageInput.value.trim(),
                    type: 'voice',
                    media_url: fileUrl,
                    client_id: `voice_${Date.now()}`
                })
            });
            els.messageInput.value = '';
            await loadMessages(false);
            els.recordStatus.textContent = 'تم إرسال الرسالة الصوتية';
        } catch (error) {
            els.recordStatus.textContent = error.message || 'فشل إرسال الصوت';
        }
        stream.getTracks().forEach((track) => track.stop());
        els.recordBtn.textContent = '🎙️ تسجيل صوت';
    };
    mediaRecorder.start();
    els.recordBtn.textContent = '⏹️ إيقاف التسجيل';
    els.recordStatus.textContent = 'جاري التسجيل...';
}

function bindSocket() {
    socket = io({ auth: token ? { token } : undefined });

    socket.on('connect', async () => {
        if (currentPeer || currentRoom) {
            socket.emit('join_chat', { peer: currentPeer || null, room: currentRoom || null });
        }
        await loadNotifications().catch(() => null);
    });

    socket.on('receive_message', async (payload) => {
        const isCurrentConversation = (currentPeer && [payload.sender, payload.receiver].includes(currentPeer)) ||
            (currentRoom && payload.room === `room:${currentRoom}`);
        if (isCurrentConversation) {
            await loadMessages(false).catch(() => null);
        } else {
            await loadNotifications().catch(() => null);
        }
    });

    socket.on('message_deleted', () => loadMessages(false).catch(() => null));
    socket.on('message_edited', () => loadMessages(false).catch(() => null));
    socket.on('messages_seen', () => loadMessages(false).catch(() => null));
    socket.on('messages_delivered', () => loadMessages(false).catch(() => null));
    socket.on('new_notification', () => loadNotifications().catch(() => null));
    socket.on('notification', () => loadNotifications().catch(() => null));

    socket.on('typing_update', (payload) => {
        const matchPeer = currentPeer && payload.sender === currentPeer;
        const matchRoom = currentRoom && payload.room === `room:${currentRoom}`;
        if (!matchPeer && !matchRoom) return;
        els.typingBadge.textContent = payload.is_typing ? `${payload.sender} يكتب الآن...` : '';
    });

    socket.on('presence_update', (payload) => {
        if (payload.user === currentPeer) {
            els.presenceText.textContent = payload.is_online ? '🟢 متصل الآن' : `آخر ظهور: ${(payload.last_seen || '').replace('T', ' ').slice(0, 16)}`;
        }
    });

    socket.on('error_message', (payload) => {
        alert(payload.error || 'حدث خطأ في الإرسال');
    });
}

function bindEvents() {
    els.joinBtn.addEventListener('click', joinSelectedChat);
    els.sendBtn.addEventListener('click', () => sendMessage().catch((error) => alert(error.message || 'فشل الإرسال')));
    els.logoutBtn.addEventListener('click', logout);
    els.recordBtn.addEventListener('click', () => initRecorder().catch((error) => alert(error.message || 'تعذر بدء التسجيل')));
    els.notifBell.addEventListener('click', () => loadNotifications().catch(() => null));

    els.messageInput.addEventListener('input', () => {
        if (!socket || (!currentPeer && !currentRoom)) return;
        socket.emit('chat_typing', { ...activeTarget(), is_typing: true });
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
            socket.emit('chat_typing', { ...activeTarget(), is_typing: false });
        }, 1200);
    });

    const params = new URLSearchParams(window.location.search);
    const initialPeer = params.get('peer');
    const initialRoom = params.get('room');
    if (initialPeer) els.peerInput.value = initialPeer;
    if (initialRoom) els.roomInput.value = initialRoom;
}

async function ensureUser() {
    try {
        const data = await api('/me');
        currentUser = data.username;
        els.currentUser.textContent = currentUser;
        return true;
    } catch {
        window.location.href = '/login.html';
        return false;
    }
}

(async function init() {
    const ok = await ensureUser();
    if (!ok) return;
    bindEvents();
    bindSocket();
    await loadNotifications().catch(() => null);
    if (els.peerInput.value || els.roomInput.value) {
        await joinSelectedChat().catch(() => null);
    }
})();

(function () {
    const enc = new TextEncoder();
    const dec = new TextDecoder();
    const PAGINATION_LIMIT = 30;
    const REACTION_SET = ['👍', '❤️', '😂', '😮', '😢', '🔥', '👏'];

    let chatSocket = null;
    let chatPendingMedia = null;
    let chatMediaRecorder = null;
    let chatVoiceChunks = [];
    let typingTimer = null;
    let lastTypingSentAt = 0;
    let chatInitialized = false;
    let uiBound = false;
    let socketBoundReceiver = '';
    let syncInProgress = false;

    const state = {
        receiver: '',
        messages: [],
        hasMore: false,
        nextBeforeId: null,
        replyDraft: null,
        online: navigator.onLine,
    };

    function chatReceiver() {
        return new URLSearchParams(window.location.search).get('user') || '';
    }

    function queueKey(receiver = chatReceiver()) {
        return `yamshat_chat_queue_${String(currentUser || '').trim()}_${String(receiver || '').trim()}`;
    }

    function readQueue(receiver = chatReceiver()) {
        try {
            const parsed = JSON.parse(localStorage.getItem(queueKey(receiver)) || '[]');
            return Array.isArray(parsed) ? parsed : [];
        } catch (_) {
            return [];
        }
    }

    function writeQueue(items, receiver = chatReceiver()) {
        localStorage.setItem(queueKey(receiver), JSON.stringify(Array.isArray(items) ? items : []));
    }

    function getQueuedItem(clientId, receiver = chatReceiver()) {
        return readQueue(receiver).find(item => item.client_id === clientId) || null;
    }

    function upsertQueuedItem(item, receiver = chatReceiver()) {
        const items = readQueue(receiver).filter(existing => existing.client_id !== item.client_id);
        items.push(item);
        items.sort((a, b) => String(a.created_at || '').localeCompare(String(b.created_at || '')));
        writeQueue(items, receiver);
        return items;
    }

    function patchQueuedItem(clientId, patch = {}, receiver = chatReceiver()) {
        const items = readQueue(receiver).map(item => item.client_id === clientId ? { ...item, ...patch } : item);
        writeQueue(items, receiver);
        return items.find(item => item.client_id === clientId) || null;
    }

    function removeQueuedItem(clientId, receiver = chatReceiver()) {
        const items = readQueue(receiver).filter(item => item.client_id !== clientId);
        writeQueue(items, receiver);
        return items;
    }

    function generateClientId() {
        return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    }

    function isAudio(url) {
        return /\.(mp3|wav|m4a|aac|ogg|oga|opus|3gp|amr|weba)$/i.test(url || '');
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

    function showSyncBanner(text, tone = 'neutral') {
        const box = document.getElementById('syncStatusBar');
        if (!box) return;
        box.className = `sync-status ${tone}`;
        box.textContent = text;
    }

    function refreshSyncBanner() {
        const queued = readQueue().length;
        if (!state.online) {
            showSyncBanner(`📡 بدون اتصال — ${queued || 0} رسالة محفوظة للمزامنة`, 'warning');
            return;
        }
        if (queued > 0) {
            showSyncBanner(`🔄 توجد ${queued} رسالة بانتظار المزامنة`, 'info');
            return;
        }
        showSyncBanner('✅ المحادثة متزامنة', 'success');
    }

    function serverStatusLabel(status) {
        switch (String(status || '').toLowerCase()) {
            case 'seen': return '✓✓ تمت المشاهدة';
            case 'delivered': return '✓✓ تم التسليم';
            case 'deleted': return 'تم الحذف';
            default: return '✓ تم الإرسال';
        }
    }

    function getMessageStatusLabel(message) {
        if (message.local_status === 'pending') return '📦 محفوظة للمزامنة';
        if (message.local_status === 'syncing') return '🔄 جاري الإرسال';
        if (message.local_status === 'failed') return '⚠️ فشل الإرسال';
        return serverStatusLabel(message.status);
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
            preview.innerHTML = `<div class="upload-preview-file">🎤 الرسالة الصوتية جاهزة</div><button type="button" onclick="clearChatPendingMedia()">إزالة</button>`;
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
            if (recordBtn) recordBtn.textContent = '⏹️';
            if (status) status.textContent = 'جاري التسجيل... اضغط للإيقاف';
        } catch (error) {
            showToast(error.message || 'تعذر الوصول إلى الميكروفون');
        }
    }

    function updateLoadOlderButton() {
        const btn = document.getElementById('loadOlderBtn');
        if (!btn) return;
        btn.classList.toggle('hidden', !state.hasMore);
        btn.disabled = !state.hasMore;
        btn.textContent = state.hasMore ? 'تحميل رسائل أقدم' : 'لا توجد رسائل أقدم';
    }

    function renderReplyComposer() {
        const box = document.getElementById('replyComposer');
        if (!box) return;
        const reply = state.replyDraft;
        if (!reply) {
            box.classList.add('hidden');
            box.innerHTML = '';
            return;
        }
        box.classList.remove('hidden');
        box.innerHTML = `
            <div class="reply-draft-card">
                <div class="reply-draft-copy">
                    <div class="reply-draft-title">↩️ رد على ${escapeHTML(reply.sender || '')}</div>
                    <div class="reply-draft-text">${escapeHTML(reply.content || 'رسالة')}</div>
                </div>
                <button type="button" class="icon-btn" onclick="cancelReplyDraft()">✕</button>
            </div>
        `;
    }

    function normalizeReactionItems(reactions) {
        return Array.isArray(reactions) ? reactions.filter(item => item && item.emoji && item.count) : [];
    }

    function reactionSummaryHtml(message) {
        const reactions = normalizeReactionItems(message.reactions);
        if (!reactions.length) return '';
        return `<div class="chat-reaction-summary">${reactions.map(item => {
            const mine = item.emoji === message.my_reaction ? ' mine' : '';
            return `<button type="button" class="reaction-chip${mine}" onclick="toggleMessageReaction(${Number(message.id || 0)}, ${JSON.stringify(item.emoji)})">${item.emoji} <span>${Number(item.count || 0)}</span></button>`;
        }).join('')}</div>`;
    }

    function reactionPickerHtml(message) {
        if (!Number(message.id || 0) || message.deleted || message.local_status) return '';
        return `<div class="chat-reaction-picker">${REACTION_SET.map(emoji => `
            <button type="button" class="reaction-btn${message.my_reaction === emoji ? ' active' : ''}" onclick="toggleMessageReaction(${Number(message.id || 0)}, ${JSON.stringify(emoji)})">${emoji}</button>
        `).join('')}</div>`;
    }

    function replyPreviewHtml(reply) {
        if (!reply) return '';
        return `
            <div class="chat-reply-preview">
                <div class="chat-reply-author">↩️ ${escapeHTML(reply.sender || '')}</div>
                <div class="chat-reply-text">${escapeHTML(reply.content || 'رسالة')}</div>
            </div>
        `;
    }

    function localPendingToMessage(item) {
        return {
            id: item.client_id,
            client_id: item.client_id,
            sender: currentUser,
            receiver: state.receiver,
            message: item.raw_message || '',
            content: item.raw_message || '',
            type: item.type || 'text',
            media_url: item.media_url || null,
            deleted: false,
            status: 'sent',
            local_status: item.local_status || (state.online ? 'syncing' : 'pending'),
            created_at: item.created_at,
            reply_to: item.reply_to || null,
            reply_to_id: item.reply_to_id || null,
            reactions: [],
            my_reaction: null,
        };
    }

    function mergeMessages() {
        const serverMessages = Array.isArray(state.messages) ? state.messages.slice() : [];
        const queued = readQueue().filter(item => !serverMessages.some(message => message.client_id && message.client_id === item.client_id));
        return [...serverMessages, ...queued.map(localPendingToMessage)].sort((a, b) => {
            const first = Number(a.id) || 0;
            const second = Number(b.id) || 0;
            if (first && second) return first - second;
            return String(a.created_at || '').localeCompare(String(b.created_at || ''));
        });
    }

    async function renderChatMessage(message, receiver) {
        const deleted = Boolean(message.deleted);
        const safeMedia = normalizeMediaUrl(message.media_url || '');
        const mine = message.sender === currentUser;
        const rawText = deleted ? 'تم حذف هذه الرسالة' : String(message.local_status ? (message.content || message.message || '') : (message.content || message.message || ''));
        const text = message.local_status ? rawText : await decryptChatText(rawText, receiver);
        let mediaHtml = '';
        if (!deleted && safeMedia) {
            if (isImage(safeMedia) || message.type === 'image') mediaHtml = `<img class="chat-media" src="${encodeURI(safeMedia)}" alt="image message">`;
            else if (isVideo(safeMedia) || message.type === 'video') mediaHtml = `<video class="chat-media" controls src="${encodeURI(safeMedia)}"></video>`;
            else if (isAudio(safeMedia) || message.type === 'voice') mediaHtml = `<audio class="chat-audio" controls src="${encodeURI(safeMedia)}"></audio>`;
            else mediaHtml = `<a class="chat-file-link" href="${encodeURI(safeMedia)}" target="_blank" rel="noopener">فتح الملف</a>`;
        }
        const deleteBtn = mine && !deleted && Number(message.id || 0) ? `<button class="chat-action-btn" type="button" onclick="deleteChatMessage(${Number(message.id || 0)})">حذف</button>` : '';
        const replyBtn = !deleted && Number(message.id || 0) ? `<button class="chat-action-btn" type="button" onclick="selectReplyToMessage(${Number(message.id || 0)})">رد</button>` : '';
        const retryBtn = mine && message.local_status === 'failed' ? `<button class="chat-action-btn" type="button" onclick="retryQueuedMessage(${JSON.stringify(message.client_id)})">إعادة المحاولة</button>` : '';
        return `
            <div class="msg ${mine ? 'me' : 'other'} ${deleted ? 'deleted' : ''} ${message.local_status ? `local-${message.local_status}` : ''}">
                ${replyPreviewHtml(message.reply_to)}
                <div class="chat-msg-body">
                    ${text ? `<div class="chat-msg-text">${escapeHTML(text)}</div>` : ''}
                    ${mediaHtml}
                </div>
                ${reactionSummaryHtml(message)}
                <div class="chat-msg-meta">
                    <span>${escapeHTML(String(message.created_at || '').replace('T', ' ').slice(0, 16))}</span>
                    ${mine ? `<span>${escapeHTML(getMessageStatusLabel(message))}</span>` : ''}
                </div>
                <div class="chat-msg-actions">
                    ${replyBtn}
                    ${deleteBtn}
                    ${retryBtn}
                </div>
                ${reactionPickerHtml(message)}
            </div>
        `;
    }

    async function renderMessages(options = {}) {
        const { preserveScroll = false } = options;
        const box = document.getElementById('messages');
        if (!box) return;
        const prevHeight = box.scrollHeight;
        const prevTop = box.scrollTop;
        const merged = mergeMessages();
        if (!merged.length) {
            box.innerHTML = '<div class="empty-state">ابدأ المحادثة الآن</div>';
            renderReplyComposer();
            refreshSyncBanner();
            updateLoadOlderButton();
            return;
        }
        const html = await Promise.all(merged.map(item => renderChatMessage(item, state.receiver)));
        box.innerHTML = html.join('');
        renderReplyComposer();
        refreshSyncBanner();
        updateLoadOlderButton();
        if (preserveScroll) {
            const nextHeight = box.scrollHeight;
            box.scrollTop = nextHeight - prevHeight + prevTop;
        } else {
            box.scrollTop = box.scrollHeight;
        }
    }

    async function refreshPresence() {
        const receiver = state.receiver;
        const label = document.getElementById('presenceText');
        if (!receiver || !label) return;
        try {
            const data = await requestJSON(`${API_BASE}/presence/${encodeURIComponent(receiver)}`);
            label.textContent = data.is_online ? '🟢 متصل الآن' : `آخر ظهور: ${String(data.last_seen || '').replace('T', ' ').slice(0, 16) || 'غير متاح'}`;
        } catch (_) {
            label.textContent = 'تعذر جلب الحالة الآن';
        }
    }

    async function notifySeen(receiver = state.receiver) {
        if (!receiver) return;
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
        const auth = window.getStoredAuth ? window.getStoredAuth() : {};
        if (chatSocket?.connected) {
            chatSocket.emit('chat_presence', { user: auth.user, peer: state.receiver, online: Boolean(online) });
        }
    }

    function upsertServerMessage(message) {
        if (!message) return;
        const messages = Array.isArray(state.messages) ? state.messages.slice() : [];
        const index = messages.findIndex(item => Number(item.id || 0) === Number(message.id || 0) || (item.client_id && message.client_id && item.client_id === message.client_id));
        if (index >= 0) messages[index] = { ...messages[index], ...message };
        else messages.push(message);
        messages.sort((a, b) => Number(a.id || 0) - Number(b.id || 0));
        state.messages = messages;
        if (message.client_id) removeQueuedItem(message.client_id);
    }

    async function loadMessagesEnhanced(options = {}) {
        const { reset = true, beforeId = null, preserveScroll = false } = options;
        const receiver = state.receiver || chatReceiver();
        const box = document.getElementById('messages');
        if (!receiver || !box) return;
        try {
            const query = new URLSearchParams({ receiver, paginated: '1', limit: String(PAGINATION_LIMIT) });
            if (beforeId) query.set('before_id', String(beforeId));
            const data = await requestJSON(`${API_BASE}/messages?${query.toString()}`);
            const items = Array.isArray(data.items) ? data.items : [];
            const meta = data.meta || {};
            if (reset) {
                state.messages = items;
            } else {
                const existingIds = new Set((state.messages || []).map(item => Number(item.id || 0)));
                state.messages = [...items.filter(item => !existingIds.has(Number(item.id || 0))), ...(state.messages || [])];
            }
            state.hasMore = Boolean(meta.has_more);
            state.nextBeforeId = meta.next_before_id || null;
            await renderMessages({ preserveScroll });
            await notifySeen(receiver);
            await refreshPresence();
        } catch (error) {
            box.innerHTML = `<div class="empty-state">${escapeHTML(error.message)}</div>`;
        }
    }

    async function loadOlderMessages() {
        if (!state.hasMore || !state.nextBeforeId) return;
        const btn = document.getElementById('loadOlderBtn');
        if (btn) btn.disabled = true;
        await loadMessagesEnhanced({ reset: false, beforeId: state.nextBeforeId, preserveScroll: true });
        if (btn) btn.disabled = false;
    }

    async function syncQueuedItem(item) {
        if (!item || !state.online) return false;
        patchQueuedItem(item.client_id, { local_status: 'syncing', last_error: '' });
        await renderMessages();
        try {
            const encryptedMessage = item.raw_message ? await encryptChatText(item.raw_message, state.receiver) : '';
            const response = await requestJSON(`${API_BASE}/send_message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    receiver: state.receiver,
                    message: encryptedMessage,
                    type: item.type || 'text',
                    media_url: item.media_url || null,
                    client_id: item.client_id,
                    reply_to_id: item.reply_to_id || null
                })
            });
            const payload = response.data || response;
            removeQueuedItem(item.client_id);
            upsertServerMessage(payload);
            await renderMessages();
            return true;
        } catch (error) {
            const text = String(error.message || 'تعذر مزامنة الرسالة');
            const offlineLike = !navigator.onLine || /network|fetch|failed/i.test(text);
            patchQueuedItem(item.client_id, { local_status: offlineLike ? 'pending' : 'failed', last_error: text });
            if (/عدد الطلبات|spam|مزعجة|مؤقتاً|مكررة/i.test(text)) {
                showSyncBanner(`🛡️ تم إيقاف الإرسال مؤقتاً: ${text}`, 'danger');
            }
            await renderMessages();
            return false;
        }
    }

    async function flushOfflineQueue() {
        if (syncInProgress || !state.online || !state.receiver) return;
        const items = readQueue();
        if (!items.length) {
            refreshSyncBanner();
            return;
        }
        syncInProgress = true;
        refreshSyncBanner();
        for (const item of items) {
            const ok = await syncQueuedItem(getQueuedItem(item.client_id) || item);
            if (!ok && !navigator.onLine) break;
        }
        syncInProgress = false;
        refreshSyncBanner();
    }

    async function queueOutgoingMessage(rawMessage) {
        const item = {
            client_id: generateClientId(),
            raw_message: rawMessage || '',
            type: chatPendingMedia?.type || 'text',
            media_url: chatPendingMedia?.url || null,
            created_at: new Date().toISOString(),
            local_status: state.online ? 'syncing' : 'pending',
            reply_to_id: state.replyDraft?.id || null,
            reply_to: state.replyDraft || null,
        };
        upsertQueuedItem(item);
        clearChatPendingMedia();
        cancelReplyDraft();
        await renderMessages();
        if (!state.online) {
            showToast('تم حفظ الرسالة وسيتم إرسالها عند عودة الاتصال');
            refreshSyncBanner();
            return;
        }
        await syncQueuedItem(item);
    }

    async function sendMsgEnhanced(btn) {
        const input = document.getElementById('msgInput');
        const rawMessage = input?.value.trim() || '';
        if (!state.receiver || (!rawMessage && !chatPendingMedia)) {
            showToast('اكتب رسالة أو أرفق ملفاً أولاً');
            return;
        }
        showLoading(btn);
        try {
            await queueOutgoingMessage(rawMessage);
            if (input) input.value = '';
        } catch (error) {
            showToast(error.message || 'تعذر إرسال الرسالة');
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
        } catch (error) {
            showToast(error.message || 'تعذر حذف الرسالة');
        }
    }

    async function toggleMessageReaction(messageId, emoji) {
        if (!messageId || !emoji) return;
        try {
            const data = await requestJSON(`${API_BASE}/message_reaction`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message_id: messageId, emoji })
            });
            updateReactionState(data);
            await renderMessages();
        } catch (error) {
            showToast(error.message || 'تعذر إضافة التفاعل');
        }
    }

    function findAnyMessage(messageId) {
        return mergeMessages().find(item => String(item.id) === String(messageId)) || null;
    }

    function selectReplyToMessage(messageId) {
        const message = findAnyMessage(messageId);
        if (!message) return;
        const raw = String(message.content || message.message || '').trim();
        state.replyDraft = {
            id: Number(message.id || 0),
            sender: message.sender || '',
            content: raw ? raw.slice(0, 140) : ({ image: '📷 صورة', video: '🎥 فيديو', voice: '🎤 رسالة صوتية', file: '📎 ملف' }[message.type] || 'رسالة')
        };
        renderReplyComposer();
    }

    function cancelReplyDraft() {
        state.replyDraft = null;
        renderReplyComposer();
    }

    async function retryQueuedMessage(clientId) {
        const item = getQueuedItem(clientId);
        if (!item) return;
        if (!navigator.onLine) {
            showToast('الاتصال غير متوفر حالياً');
            return;
        }
        state.online = true;
        await syncQueuedItem(item);
    }

    function sendTypingPing(isTyping) {
        if (!state.receiver) return;
        const now = Date.now();
        if (isTyping && now - lastTypingSentAt < 1000) return;
        lastTypingSentAt = now;
        requestJSON(`${API_BASE}/typing`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ receiver: state.receiver, is_typing: Boolean(isTyping) })
        }).catch(() => {});
        const auth = window.getStoredAuth ? window.getStoredAuth() : {};
        if (chatSocket?.connected) {
            chatSocket.emit('chat_typing', { sender: auth.user, receiver: state.receiver, is_typing: Boolean(isTyping) });
        }
    }

    function bindTypingInput() {
        const input = document.getElementById('msgInput');
        if (!input || input.dataset.chatTypingBound === '1') return;
        input.dataset.chatTypingBound = '1';
        input.addEventListener('input', () => {
            sendTypingPing(Boolean(input.value.trim()));
            clearTimeout(typingTimer);
            typingTimer = setTimeout(() => sendTypingPing(false), 1200);
        });
    }

    function toggleChatE2E() {
        const receiver = state.receiver;
        if (!receiver) return;
        const current = getChatSecret(receiver);
        const next = window.prompt(current ? 'أدخل عبارة سرية جديدة أو اتركها فارغة لإيقاف E2E' : 'أدخل عبارة سرية لتفعيل E2E بينك وبين هذا المستخدم', current || '');
        if (next === null) return;
        setChatSecret(receiver, next.trim());
        showToast(next.trim() ? 'تم تفعيل التشفير الطرفي لهذه المحادثة' : 'تم إيقاف التشفير الطرفي');
        renderMessages();
    }

    function startCall(mode) {
        if (!state.receiver) return;
        window.location.href = `call.html?user=${encodeURIComponent(state.receiver)}&mode=${encodeURIComponent(mode || 'video')}`;
    }

    function updatePresenceLabel(payload) {
        const label = document.getElementById('presenceText');
        if (!label || !payload || payload.user !== state.receiver) return;
        label.textContent = payload.is_online ? '🟢 متصل الآن' : `آخر ظهور: ${String(payload.last_seen || '').replace('T', ' ').slice(0, 16) || 'غير متاح'}`;
    }

    function updateTyping(payload) {
        const indicator = document.getElementById('typingIndicator');
        if (!indicator || !payload || payload.sender !== state.receiver) return;
        indicator.classList.toggle('hidden', !payload.is_typing);
        indicator.textContent = payload.is_typing ? 'يكتب الآن...' : '';
    }

    function updateReactionState(payload) {
        if (!payload || !payload.message_id) return;
        state.messages = (state.messages || []).map(item => Number(item.id || 0) === Number(payload.message_id)
            ? { ...item, reactions: payload.reactions || [], my_reaction: payload.my_reaction || null }
            : item);
    }

    function updateMessageStatuses(payload) {
        if (!payload || !Array.isArray(payload.message_ids) || !payload.message_ids.length) return;
        const ids = new Set(payload.message_ids.map(id => Number(id || 0)));
        state.messages = (state.messages || []).map(item => ids.has(Number(item.id || 0)) ? { ...item, status: payload.status || item.status } : item);
    }

    function markDeleted(payload) {
        if (!payload || !payload.id) return;
        state.messages = (state.messages || []).map(item => Number(item.id || 0) === Number(payload.id)
            ? { ...item, deleted: true, status: 'deleted', content: 'تم حذف هذه الرسالة', message: 'تم حذف هذه الرسالة', media_url: null }
            : item);
    }

    function connectRealtimeChat() {
        const auth = window.getStoredAuth ? window.getStoredAuth() : {};
        if (!state.receiver || !auth?.token || typeof io === 'undefined' || socketBoundReceiver === state.receiver) return;
        socketBoundReceiver = state.receiver;
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
            chatSocket.emit('join_chat', { user: auth.user, peer: state.receiver, token: auth.token });
        });
        chatSocket.on('new_private_message', async payload => {
            if (!payload) return;
            upsertServerMessage(payload);
            await renderMessages();
            if (payload.sender === state.receiver) notifySeen(state.receiver);
        });
        chatSocket.on('message_deleted', async payload => {
            markDeleted(payload);
            await renderMessages();
        });
        chatSocket.on('message_reaction_update', async payload => {
            updateReactionState(payload);
            await renderMessages();
        });
        chatSocket.on('messages_seen', async payload => {
            if (payload?.sender === currentUser && payload?.viewer === state.receiver) {
                updateMessageStatuses(payload);
                await renderMessages();
            }
        });
        chatSocket.on('messages_delivered', async payload => {
            if (payload?.sender === currentUser && payload?.viewer === state.receiver) {
                updateMessageStatuses(payload);
                await renderMessages();
            }
        });
        chatSocket.on('presence_update', payload => updatePresenceLabel(payload));
        chatSocket.on('typing_update', payload => updateTyping(payload));
        chatSocket.on('disconnect', () => {
            state.online = navigator.onLine;
            refreshSyncBanner();
        });
    }

    function bindUiEvents() {
        if (uiBound) return;
        uiBound = true;
        const olderBtn = document.getElementById('loadOlderBtn');
        if (olderBtn) olderBtn.addEventListener('click', () => loadOlderMessages());
        window.addEventListener('online', async () => {
            state.online = true;
            refreshSyncBanner();
            await flushOfflineQueue();
        });
        window.addEventListener('offline', () => {
            state.online = false;
            refreshSyncBanner();
        });
        document.addEventListener('visibilitychange', () => sendPresence(!document.hidden));
        window.addEventListener('beforeunload', () => sendPresence(false));
    }

    async function initChatPageAdvanced() {
        state.receiver = chatReceiver();
        state.online = navigator.onLine;
        document.getElementById('chatWith') && (document.getElementById('chatWith').innerText = state.receiver ? `المحادثة مع ${state.receiver}` : 'لم يتم اختيار مستخدم');
        bindUiEvents();
        bindTypingInput();
        renderReplyComposer();
        refreshSyncBanner();
        await loadMessagesEnhanced({ reset: true });
        await refreshPresence();
        await sendPresence(true);
        connectRealtimeChat();
        await flushOfflineQueue();
        chatInitialized = true;
    }

    window.initChatPage = function () {
        if (!document.body.classList.contains('chat-page')) return;
        initChatPageAdvanced().catch(error => showToast(error.message || 'تعذر تهيئة الدردشة'));
    };
    window.loadMessages = () => loadMessagesEnhanced({ reset: true });
    window.loadOlderMessages = loadOlderMessages;
    window.sendMsg = sendMsgEnhanced;
    window.uploadChatMedia = uploadChatMedia;
    window.toggleVoiceRecording = toggleVoiceRecording;
    window.deleteChatMessage = deleteChatMessage;
    window.toggleChatE2E = toggleChatE2E;
    window.startCall = startCall;
    window.clearChatPendingMedia = clearChatPendingMedia;
    window.toggleMessageReaction = toggleMessageReaction;
    window.selectReplyToMessage = selectReplyToMessage;
    window.cancelReplyDraft = cancelReplyDraft;
    window.retryQueuedMessage = retryQueuedMessage;
})();

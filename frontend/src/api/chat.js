import API from './axios.js';
import mediaUploadService from '../services/media/mediaUploadService.js';

const RESUMABLE_THRESHOLD_BYTES = 5 * 1024 * 1024;
const RESUME_KEY_PREFIX = 'yamshat-upload-session';

const sessionStorageKey = (file) => `${RESUME_KEY_PREFIX}:${file.name}:${file.size}:${file.lastModified}`;

export const getMessages = (receiver, limit = 40, before_id, options = {}) =>
  API.get('/messages', {
    params: { receiver, limit, before_id },
    signal: options.signal,
    cache: Boolean(before_id),
    cacheTtlMs: 8_000,
  });

export const sendMessageApi = (payload) => API.post('/send_message', payload);
export const markMessagesSeen = (sender) => API.post('/message_seen', { sender });
export const getChatThreads = (options = {}) => API.get('/chat_threads', { signal: options.signal, cache: true, cacheTtlMs: 10_000 });
export const getPresence = (username, options = {}) => API.get(`/presence/${encodeURIComponent(username)}`, { signal: options.signal, cache: true, cacheTtlMs: 5_000 });
export const getBlockStatus = (username, options = {}) => API.get(`/chat_block_status/${encodeURIComponent(username)}`, { signal: options.signal, cache: true, cacheTtlMs: 15_000 });
export const blockUserApi = (username) => API.post('/block_user', { username });
export const unblockUserApi = (username) => API.post('/unblock_user', { username });
export const translateMessageApi = (payload) => API.post('/translate_message', payload);
export const updateOnline = (online) => API.post('/update_online', { online });
export const uploadMedia = (formData, onUploadProgress) =>
  API.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  });
export const deleteMessageApi = (message_id, options = {}) => API.post('/delete_message', { message_id, delete_for_everyone: Boolean(options.delete_for_everyone) });

export const startResumableUpload = (payload) => API.post('/upload/resumable/start', payload);
export const getResumableUploadStatus = (sessionId) => API.get(`/upload/resumable/${sessionId}`);
export const uploadResumableChunk = (sessionId, chunkIndex, chunk) =>
  API.put(`/upload/resumable/${sessionId}/chunk/${chunkIndex}`, chunk, {
    headers: { 'Content-Type': 'application/octet-stream' },
  });
export const completeResumableUpload = (sessionId) => API.post(`/upload/resumable/${sessionId}/complete`);

export async function uploadMediaWithResume(file, onProgress = () => {}) {
  const upload = await mediaUploadService.uploadFile(file, {
    onProgress: (payload) => {
      const percent = typeof payload === 'number' ? payload : Number(payload?.percent || 0);
      onProgress(percent);
    },
  });

  const responseShape = {
    upload,
    media_url: upload.mediaUrl,
    url: upload.url,
    cdn_url: upload.cdnUrl,
    manifest: upload.manifest,
    provider: upload.provider,
  };

  try {
    window.localStorage.removeItem(sessionStorageKey(file));
  } catch {
    // ignore storage cleanup failures
  }

  return {
    data: responseShape,
  };
}
export const restoreMessage = (message_id) => API.post('/restore_message', { message_id });

// ============================================================
// استكمال ربط الشات بالباك إند — زر بزر
//   (رد / تعديل / تمرير / تفاعلات / بحث / كتابة / استرجاع)
// ============================================================

/**
 * إرسال رسالة مع مرفقات متعددة وعلاقات إضافية.
 * @param {object} payload {
 *   receiver, message, attachments[{url,kind,mime_type,file_name,file_size,...}],
 *   reply_to_id, forwarded_from_id, disappearing_in_seconds, client_id, type, media_url
 * }
 */
export const sendRichMessage = (payload) => API.post('/send_message', payload);

/** تعديل رسالة سابقة (خلال 24 ساعة). */
export const editMessage = (message_id, content) =>
  API.post('/edit_message', { message_id, content });

/** تمرير رسالة إلى عدة أطراف (أسماء مستخدمين أو group:<id>). */
export const forwardMessage = (message_id, receivers) =>
  API.post('/forward_message', { message_id, receivers: Array.isArray(receivers) ? receivers : [receivers] });

/** استرجاع (Recall) رسالة خلال نافذة الساعة. */
export const recallMessage = (message_id) => API.post(`/${message_id}/recall`);

/** إضافة / تبديل تفاعل (toggle) على رسالة. */
export const reactToMessage = (message_id, reaction) =>
  API.post(`/${message_id}/react`, { reaction });

/** إزالة تفاعل معين (أو كل تفاعلات المستخدم) على رسالة. */
export const unreactToMessage = (message_id, reaction) =>
  API.delete(`/${message_id}/react`, { params: reaction ? { reaction } : {} });

/** جلب كل تفاعلات رسالة + ملخص. */
export const getMessageReactions = (message_id, options = {}) =>
  API.get(`/${message_id}/reactions`, { signal: options.signal, cache: true, cacheTtlMs: 5_000 });

/** بحث داخل الرسائل (اختيارياً في محادثة محددة). */
export const searchMessagesApi = (q, options = {}) =>
  API.get('/search_messages', {
    params: { q, peer: options.peer, limit: options.limit ?? 40 },
    signal: options.signal,
  });

/** إعلام الطرف الآخر بحالة الكتابة (HTTP fallback). */
export const sendTypingState = (to, isTyping = true) =>
  API.post('/typing', { to, is_typing: Boolean(isTyping) });

/** تطبيق سياسة احتفاظ على محادثة ('24h' | '7d' | '30d' | 'forever'). */
export const applyRetentionPolicy = (chat_id, policy) =>
  API.post('/apply_retention', { chat_id, policy });

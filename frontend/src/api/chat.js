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
export const deleteMessageApi = (message_id) => API.post('/delete_message', { message_id });
export const restoreMessage = (message_id) => API.post('/restore_message', { message_id });

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

  return { data: responseShape };
}

// ─── call api ────────────────────────────────────────────────────────────────────

export const getCallSession = (callId) => API.get(`/call/${callId}`);
export const getCallHistory = (options = {}) => API.get('/call_history', { signal: options.signal, cache: false });

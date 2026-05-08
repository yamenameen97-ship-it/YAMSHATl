import API from './axios.js';

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

export const startResumableUpload = (payload) => API.post('/upload/resumable/start', payload);
export const getResumableUploadStatus = (sessionId) => API.get(`/upload/resumable/${sessionId}`);
export const uploadResumableChunk = (sessionId, chunkIndex, chunk) =>
  API.put(`/upload/resumable/${sessionId}/chunk/${chunkIndex}`, chunk, {
    headers: { 'Content-Type': 'application/octet-stream' },
  });
export const completeResumableUpload = (sessionId) => API.post(`/upload/resumable/${sessionId}/complete`);

export async function uploadMediaWithResume(file, onProgress = () => {}) {
  if (!file || file.size < RESUMABLE_THRESHOLD_BYTES) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await uploadMedia(formData, (event) => {
      const progress = event.total ? Math.round((event.loaded / event.total) * 100) : 0;
      onProgress(progress);
    });
    return response;
  }

  const chunkSize = 1024 * 1024;
  const totalChunks = Math.max(1, Math.ceil(file.size / chunkSize));
  const storageKey = sessionStorageKey(file);

  let sessionId = '';
  let uploadedChunks = [];
  try {
    const cached = window.localStorage.getItem(storageKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed?.sessionId) {
        sessionId = parsed.sessionId;
        const { data } = await getResumableUploadStatus(sessionId);
        uploadedChunks = Array.isArray(data?.uploaded_chunks) ? data.uploaded_chunks : [];
      }
    }
  } catch {
    // ignore cached state
  }

  if (!sessionId) {
    const { data } = await startResumableUpload({
      filename: file.name,
      content_type: file.type || 'application/octet-stream',
      total_size: file.size,
      total_chunks: totalChunks,
    });
    sessionId = data.session_id;
    uploadedChunks = Array.isArray(data.uploaded_chunks) ? data.uploaded_chunks : [];
    window.localStorage.setItem(storageKey, JSON.stringify({ sessionId }));
  }

  const uploaded = new Set(uploadedChunks);
  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex += 1) {
    if (uploaded.has(chunkIndex)) {
      onProgress(Math.round(((chunkIndex + 1) / totalChunks) * 100));
      continue;
    }
    const start = chunkIndex * chunkSize;
    const end = Math.min(file.size, start + chunkSize);
    const chunk = file.slice(start, end);
    await uploadResumableChunk(sessionId, chunkIndex, chunk);
    onProgress(Math.round(((chunkIndex + 1) / totalChunks) * 100));
  }

  const response = await completeResumableUpload(sessionId);
  window.localStorage.removeItem(storageKey);
  return {
    ...response,
    data: response.data?.upload || response.data,
  };
}

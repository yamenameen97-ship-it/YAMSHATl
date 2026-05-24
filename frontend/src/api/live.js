import API from './axios.js';

export const getLiveRooms = () => API.get('/live_rooms', { cache: false, forceRefresh: true });
export const getLiveRoom = (roomId) => API.get(`/live_room/${roomId}`, { cache: false, forceRefresh: true });
export const createLiveRoom = (data) => API.post('/create_live', data);
export const getLiveComments = (roomId) => API.get(`/live_comments/${roomId}`, { cache: false, forceRefresh: true });
export const getLiveToken = (roomId, payload = {}) => API.post(`/live/${roomId}/token`, payload);
export const endLiveRoom = (roomId) => API.post(`/end_live/${roomId}`);
export const sendLiveGift = ({ room_id, ...payload }) => API.post(`/live/${room_id}/gift`, payload);
export const updateLiveRecording = ({ room_id, action }) => API.post(`/live/${room_id}/recording/${action}`);
export const getLiveAnalytics = (roomId) => API.get(`/live/${roomId}/analytics`, { cache: false, forceRefresh: true });
export const getLiveHealth = (roomId) => API.get(`/live/${roomId}/health`, { cache: false, forceRefresh: true });
export const updateLiveHealth = (roomId, payload) => API.post(`/live/${roomId}/health`, payload);
export const syncLiveViewer = (roomId, payload) => API.post(`/live/${roomId}/sync`, payload);
export const moderateLiveRoom = (roomId, payload) => API.post(`/live/${roomId}/moderate`, payload);
export const manageLiveCohost = ({ room_id, ...payload }) => API.post(`/live/${room_id}/multi-host`, payload);
export const triggerLiveRecovery = (roomId, payload = {}) => API.post(`/live/${roomId}/recovery`, payload);
export const addLiveComment = ({ room_id, ...payload }) => API.post(`/live/${room_id}/comment`, payload);

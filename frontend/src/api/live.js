import API from './axios.js';

export const getLiveRooms = () => API.get('/live_rooms');
export const getLiveRoom = (roomId) => API.get(`/live_room/${roomId}`);
export const createLiveRoom = (data) => API.post('/create_live', data);
export const getLiveToken = (payload) => API.post('/live_token', payload);
export const createCallToken = (payload) => API.post('/create_call_token', payload);
export const getLiveComments = (roomId) => API.get(`/live_comments/${roomId}`);
export const updateLivePresence = (payload) => API.post('/live_presence', payload);
export const endLiveRoom = (roomId) => API.post(`/end_live/${roomId}`);

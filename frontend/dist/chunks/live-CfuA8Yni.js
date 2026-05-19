import { A as API } from "../index-BAMQT-m6.js";
const getLiveRooms = () => API.get("/live_rooms", { cache: false, forceRefresh: true });
const getLiveRoom = (roomId) => API.get(`/live_room/${roomId}`, { cache: false, forceRefresh: true });
const createLiveRoom = (data) => API.post("/create_live", data);
const getLiveComments = (roomId) => API.get(`/live_comments/${roomId}`, { cache: false, forceRefresh: true });
const getLiveToken = (roomId, payload = {}) => API.post(`/live/${roomId}/token`, payload);
const endLiveRoom = (roomId) => API.post(`/end_live/${roomId}`);
const sendLiveGift = ({ room_id, ...payload }) => API.post(`/live/${room_id}/gift`, payload);
const updateLiveRecording = ({ room_id, action }) => API.post(`/live/${room_id}/recording/${action}`);
export {
  getLiveRoom as a,
  getLiveComments as b,
  getLiveToken as c,
  createLiveRoom as d,
  endLiveRoom as e,
  getLiveRooms as g,
  sendLiveGift as s,
  updateLiveRecording as u
};

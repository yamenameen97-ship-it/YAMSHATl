import { a as apiClient } from "./apiClient-DxRN-ErF.js";
import { aT as socketManager } from "../index-BtxTC4_g.js";
const asResponse = (data) => ({ data });
const getLiveStreamDetails = (streamId) => apiClient.get(`/live_room/${streamId}`, { cache: false, forceRefresh: true });
const sendLiveComment = (streamId, commentData = {}) => apiClient.post(`/live/${streamId}/comment`, commentData);
const getLiveComments = (streamId, limit = 50) => apiClient.get(`/live_comments/${streamId}`, { params: { limit }, cache: false, forceRefresh: true });
const sendLiveGift = (streamId, giftData = {}) => apiClient.post(`/live/${streamId}/gift`, giftData);
const sendLiveHeart = async (streamId) => {
  socketManager.emit("send_heart", { room_id: streamId }, { queue: false });
  return asResponse({ status: "queued", room_id: streamId });
};
const getStreamStats = (streamId) => apiClient.get(`/live/${streamId}/analytics`, { cache: false, forceRefresh: true });
const createLiveStream = (streamData = {}) => apiClient.post("/create_live", streamData);
const startLiveStream = (streamId, payload = {}) => apiClient.post(`/live/${streamId}/token`, { role: "host", ...payload });
const endLiveStream = (streamId) => apiClient.post(`/end_live/${streamId}`);
const toggleCamera = (streamId, enabled) => apiClient.post(`/live/${streamId}/camera`, { enabled });
const toggleMicrophone = (streamId, enabled) => apiClient.post(`/live/${streamId}/microphone`, { enabled });
export {
  getLiveStreamDetails as a,
  getStreamStats as b,
  createLiveStream as c,
  sendLiveGift as d,
  endLiveStream as e,
  sendLiveHeart as f,
  getLiveComments as g,
  startLiveStream as h,
  toggleMicrophone as i,
  sendLiveComment as s,
  toggleCamera as t
};

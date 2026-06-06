import { a as apiClient } from "./apiClient-DEojD3jc.js";
import { aT as socketManager } from "../index-Dz8FA2T4.js";
const asResponse = (data) => ({ data });
const getActiveLiveStreams = (filters = {}) => apiClient.get("/live_rooms", { params: filters, cache: false, forceRefresh: true });
const getLiveStreamDetails = (streamId) => apiClient.get(`/live_room/${streamId}`, { cache: false, forceRefresh: true });
const sendLiveComment = (streamId, commentData = {}) => apiClient.post(`/live/${streamId}/comment`, commentData);
const getLiveComments = (streamId, limit = 50) => apiClient.get(`/live_comments/${streamId}`, { params: { limit }, cache: false, forceRefresh: true });
const sendLiveGift = (streamId, giftData = {}) => apiClient.post(`/live/${streamId}/gift`, giftData);
const sendLiveHeart = async (streamId) => {
  socketManager.emit("send_heart", { room_id: streamId }, { queue: false });
  return asResponse({ status: "queued", room_id: streamId });
};
const getLiveStreamStats = (streamId) => apiClient.get(`/live/${streamId}/analytics`, { cache: false, forceRefresh: true });
const getLiveStreamViewers = async (streamId) => {
  const analytics = await getLiveStreamStats(streamId).catch(() => null);
  const details = await getLiveStreamDetails(streamId).catch(() => null);
  const uniqueViewers = Number(analytics?.data?.unique_viewers ?? details?.data?.analytics?.unique_viewers ?? 0);
  return asResponse({
    stream_id: streamId,
    unique_viewers: uniqueViewers,
    viewers: details?.data?.viewers || []
  });
};
export {
  getLiveComments as a,
  getLiveStreamDetails as b,
  getLiveStreamStats as c,
  getLiveStreamViewers as d,
  sendLiveGift as e,
  sendLiveHeart as f,
  getActiveLiveStreams as g,
  sendLiveComment as s
};

import apiClient from './apiClient.js';
import socketManager from '../socketManager.js';
import { getPosts } from '../../api/posts.js';

const asResponse = (data) => ({ data });
export const addViewer = (streamId, viewerData = {}) =>
  apiClient.post(`/live/${streamId}/viewer`, viewerData);
export const getActiveLiveStreams = (filters = {}) =>
  apiClient.get('/live_rooms', { params: filters, cache: false, forceRefresh: true });

export const getLiveStreamDetails = (streamId) =>
  apiClient.get(`/live_room/${streamId}`, { cache: false, forceRefresh: true });

export const createLiveStream = (streamData = {}) =>
  apiClient.post('/create_live', streamData);

export const getLiveToken = (streamId, payload = {}) =>
  apiClient.post(`/live/${streamId}/token`, payload);

export const startLiveStream = (streamId, payload = {}) =>
  getLiveToken(streamId, { role: 'host', ...payload });

export const endLiveStream = (streamId) =>
  apiClient.post(`/end_live/${streamId}`);

export const sendLiveComment = (streamId, commentData = {}) =>
  apiClient.post(`/live/${streamId}/comment`, commentData);

export const getLiveComments = (streamId, limit = 50) =>
  apiClient.get(`/live_comments/${streamId}`, { params: { limit }, cache: false, forceRefresh: true });

export const sendLiveGift = (streamId, giftData = {}) =>
  apiClient.post(`/live/${streamId}/gift`, giftData);

export const sendLiveHeart = async (streamId) => {
  socketManager.emit('send_heart', { room_id: streamId }, { queue: false });
  return asResponse({ status: 'queued', room_id: streamId });
};

export const getLiveStreamStats = (streamId) =>
  apiClient.get(`/live/${streamId}/analytics`, { cache: false, forceRefresh: true });

export const updateLiveStreamStatus = (streamId, statusData = {}) => {
  const action = String(statusData.action || statusData.recording_action || '').trim().toLowerCase();
  if (action === 'start' || action === 'stop') {
    return apiClient.post(`/live/${streamId}/recording/${action}`, statusData);
  }
  return apiClient.post(`/live/${streamId}/recovery`, statusData);
};

export const linkLiveStreamToPost = (streamId, postId) =>
  asResponse({ status: 'not_supported_by_backend', stream_id: streamId, post_id: postId });

export const getPostsWithLiveStreams = async (filters = {}) => {
  const response = await getPosts(filters);
  const items = Array.isArray(response?.data) ? response.data : [];
  return {
    ...response,
    data: items.filter((item) => item?.has_live_stream || item?.live_stream || item?.live_stream_id),
  };
};

export const updateLiveStreamInfo = (streamId) => getLiveStreamDetails(streamId);

export const getLiveStreamViewers = async (streamId) => {
  const analytics = await getLiveStreamStats(streamId).catch(() => null);
  const details = await getLiveStreamDetails(streamId).catch(() => null);
  const uniqueViewers = Number(analytics?.data?.unique_viewers ?? details?.data?.analytics?.unique_viewers ?? 0);
  return asResponse({
    stream_id: streamId,
    unique_viewers: uniqueViewers,
    viewers: details?.data?.viewers || [],
  });
};

export const addCoHost = (streamId, coHostData = {}) =>
  apiClient.post(`/live/${streamId}/multi-host`, { action: 'add', username: coHostData.username || coHostData.coHostId || coHostData.user_id || coHostData });

export const removeCoHost = (streamId, coHostId) =>
  apiClient.post(`/live/${streamId}/multi-host`, { action: 'remove', username: coHostId });

export const applyModerationAction = async (streamId, actionData = {}) => {
  socketManager.emit('moderation_action', { room_id: streamId, ...actionData }, { queue: false });
  return asResponse({ status: 'queued', room_id: streamId, ...actionData });
};

export const getLiveStreamGiftStats = async (streamId) => {
  const details = await getLiveStreamDetails(streamId);
  return asResponse({
    stream_id: streamId,
    gifts: details?.data?.gifts || [],
    economy: details?.data?.economy || {},
  });
};

export const recordLiveStream = (streamId, recordingData = {}) => {
  const action = String(recordingData.action || 'start').trim().toLowerCase();
  return apiClient.post(`/live/${streamId}/recording/${action}`);
};

export default {
  getActiveLiveStreams,
  getLiveStreamDetails,
  createLiveStream,
  getLiveToken,
  startLiveStream,
  endLiveStream,
  sendLiveComment,
  getLiveComments,
  sendLiveGift,
  sendLiveHeart,
  getLiveStreamStats,
  updateLiveStreamStatus,
  linkLiveStreamToPost,
  getPostsWithLiveStreams,
  updateLiveStreamInfo,
  getLiveStreamViewers,
  addViewer,
  addCoHost,
  removeCoHost,
  applyModerationAction,
  getLiveStreamGiftStats,
  recordLiveStream,
};

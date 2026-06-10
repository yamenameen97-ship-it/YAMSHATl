import apiClient from './apiClient.js';
import socketManager from '../socketManager.js';
import { getPosts } from '../../api/posts.js';

/**
 * ✅ FIX (2026-06): Aligné toutes les routes sur le backend réel.
 * Backend supports BOTH /live_room/{id}/* and /live/{id}/* for some endpoints,
 * but viewer/token/comment/gift only exist under /live_room/{id}/*.
 * Old paths (`/live/{id}/viewer`, `/live/{id}/comment`, …) returned 404
 * which is why subscribers couldn't see the stream even though the
 * broadcaster studio was happily connected to LiveKit.
 */

const asResponse = (data) => ({ data });

// ==================== Streams listing / details ====================
export const getActiveLiveStreams = (filters = {}) =>
  apiClient.get('/live_rooms', { params: filters, cache: false, forceRefresh: true });

export const getLiveStreamDetails = (streamId) =>
  apiClient.get(`/live_room/${streamId}`, { cache: false, forceRefresh: true, retry: true });

export const createLiveStream = (streamData = {}) =>
  apiClient.post('/create_live', streamData, { retry: true });

// ==================== Tokens / lifecycle ====================
export const getLiveToken = (streamId, payload = {}) =>
  apiClient.post(`/live_room/${streamId}/token`, payload, { retry: true });

export const startLiveStream = (streamId, payload = {}) =>
  getLiveToken(streamId, { role: 'host', ...payload });

export const endLiveStream = (streamId) =>
  apiClient.post(`/end_live/${streamId}`, {}, { retry: true });

// ==================== Viewer management ====================
export const addViewer = (streamId, viewerData = {}) =>
  apiClient.post(`/live_room/${streamId}/add-viewer`, {
    user_id: viewerData.userId || viewerData.user_id,
    username: viewerData.username,
    user_avatar: viewerData.userAvatar || viewerData.user_avatar,
    platform: viewerData.platform || 'web',
  }, { retry: true });

export const removeViewer = (streamId, userId) =>
  apiClient.post(`/live_room/${streamId}/remove-viewer`, { user_id: userId }, { retry: true });

// ==================== Comments ====================
export const sendLiveComment = (streamId, commentData = {}) =>
  apiClient.post(`/live_room/${streamId}/comment`, commentData, { retry: true });

export const getLiveComments = (streamId, limit = 50) =>
  apiClient.get(`/live_comments/${streamId}`, { params: { limit }, cache: false, forceRefresh: true });

// ==================== Gifts ====================
export const sendLiveGift = (streamId, giftData = {}) => {
  const payload = typeof giftData === 'object' && giftData !== null
    ? giftData
    : { gift_id: giftData };
  return apiClient.post(`/live_room/${streamId}/gift`, payload, { retry: true });
};

export const sendLiveHeart = async (streamId) => {
  socketManager.emit('send_heart', { room_id: streamId }, { queue: false });
  return asResponse({ status: 'queued', room_id: streamId });
};

// ==================== Stats / analytics ====================
export const getLiveStreamStats = (streamId) =>
  apiClient.get(`/live_room/${streamId}/analytics`, { cache: false, forceRefresh: true });

export const updateLiveStreamStatus = (streamId, statusData = {}) => {
  const action = String(statusData.action || statusData.recording_action || '').trim().toLowerCase();
  if (action === 'start' || action === 'stop') {
    return apiClient.post(`/live_room/${streamId}/recording/${action}`, statusData);
  }
  // recovery path doesn't exist in backend; return a silent no-op
  return Promise.resolve(asResponse({ status: 'noop', stream_id: streamId }));
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
  // Use the real backend endpoint instead of inferring from analytics
  try {
    const res = await apiClient.get(`/live_room/${streamId}/viewers`, {
      cache: false, forceRefresh: true, retry: true,
    });
    return res;
  } catch (_err) {
    const details = await getLiveStreamDetails(streamId).catch(() => null);
    return asResponse({
      stream_id: streamId,
      unique_viewers: Number(details?.data?.analytics?.unique_viewers ?? 0),
      viewers: details?.data?.viewers || [],
    });
  }
};

// ==================== Co-hosts ====================
export const addCoHost = (streamId, coHostData = {}) =>
  apiClient.post(`/live_room/${streamId}/multi-host`, {
    action: 'add',
    username: coHostData.username || coHostData.coHostId || coHostData.user_id || coHostData,
  }, { retry: true });

export const removeCoHost = (streamId, coHostId) =>
  apiClient.post(`/live_room/${streamId}/multi-host`, { action: 'remove', username: coHostId }, { retry: true });

// ==================== Moderation ====================
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
  return apiClient.post(`/live_room/${streamId}/recording/${action}`, recordingData, { retry: true });
};

export default {
  getActiveLiveStreams,
  getLiveStreamDetails,
  createLiveStream,
  getLiveToken,
  startLiveStream,
  endLiveStream,
  addViewer,
  removeViewer,
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
  addCoHost,
  removeCoHost,
  applyModerationAction,
  getLiveStreamGiftStats,
  recordLiveStream,
};

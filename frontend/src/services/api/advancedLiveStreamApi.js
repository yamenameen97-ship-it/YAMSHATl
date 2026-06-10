/**
 * 🔗 advancedLiveStreamApi.js — Wrapper متوافق عكسياً.
 * ======================================================
 * المعمارية الجديدة جعلت liveStreamApi.js هو المصدر الوحيد لكل HTTP.
 * هذا الملف يبقى للحفاظ على التوافق مع الكود القديم (LiveStudio.jsx
 * يستورد منه دوال متعددة الأسماء)، لكنه الآن مجرد re-export.
 *
 * لا منطق Socket هنا. كل ما هو Socket-related يجب أن يبقى في
 * socketManager / livekitService.
 */

import apiClient from './apiClient.js';
import socketManager from '../socketManager.js';
import liveApi from './liveStreamApi.js';

// ── Lifecycle ──────────────────────────────────────────────────────────────
export const createLiveStream = liveApi.createLiveStream;
export const startLiveStream  = liveApi.startLiveStream;
export const endLiveStream    = liveApi.endLiveStream;
export const getLiveStreamDetails = liveApi.getLiveStreamDetails;
export const getActiveLiveStreams = liveApi.getActiveLiveStreams;
export const getActiveStreams = (limit = 50) =>
  liveApi.getActiveLiveStreams({ limit });

// ── Viewers ────────────────────────────────────────────────────────────────
export const addViewer      = liveApi.addViewer;
export const removeViewer   = liveApi.removeViewer;
export const getStreamViewers = liveApi.getLiveStreamViewers;

// ── Comments / Gifts / Hearts ──────────────────────────────────────────────
export const sendLiveComment = liveApi.sendLiveComment;
export const getLiveComments = liveApi.getLiveComments;
export const sendLiveGift    = liveApi.sendLiveGift;

export const sendLiveHeart = async (streamId) => {
  socketManager.emit?.('send_heart', { room_id: streamId }, { queue: false });
  return { data: { status: 'queued', room_id: streamId } };
};

// ── Stats ──────────────────────────────────────────────────────────────────
export const getStreamStats = liveApi.getStreamStats;
export const getLiveStreamAnalytics = liveApi.getStreamStats;

// ── Camera/Mic — يتم محلياً عبر livekitService، هذه الدوال HTTP-noop ───────
//    تركناها للتوافق فقط — لا ترسل أي طلبات للسيرفر (السيرفر لا يعرف بحالة
//    الكاميرا، LiveKit يديرها مباشرة).
export const updateCameraState = async () => ({ data: { status: 'noop' } });
export const closeCameraStream  = async () => ({ data: { status: 'noop' } });
export const toggleCamera       = async () => ({ data: { status: 'noop' } });
export const toggleMicrophone   = async () => ({ data: { status: 'noop' } });

// ── Recording ──────────────────────────────────────────────────────────────
export const startRecording = (streamId) =>
  liveApi.recordLiveStream(streamId, { action: 'start' });
export const stopRecording  = (streamId) =>
  liveApi.recordLiveStream(streamId, { action: 'stop' });
export const recordLiveStream = liveApi.recordLiveStream;

// ── Moderation / Co-hosts (placeholders) ──────────────────────────────────
const noop = async (payload = {}) => ({ data: { status: 'noop', ...payload } });
export const muteUser   = noop;
export const unmuteUser = noop;
export const banUser    = noop;
export const unbanUser  = noop;
export const addCoHost    = noop;
export const removeCoHost = noop;
export const applyModerationAction = async (streamId, actionData = {}) => {
  socketManager.emit?.('moderation_action', { room_id: streamId, ...actionData }, { queue: false });
  return { data: { status: 'queued', room_id: streamId, ...actionData } };
};

// ── join / leave via socket (used by LiveStudio/LiveViewer) ────────────────
export const joinLiveRoom = (streamId, role = 'viewer') => {
  socketManager.emit?.('join_live', { room_id: streamId, role }, { queue: false });
  return Promise.resolve({ data: { status: 'queued', room_id: streamId, role } });
};
export const leaveLiveRoom = (streamId) => {
  socketManager.emit?.('leave_live', { room_id: streamId }, { queue: false });
  return Promise.resolve({ data: { status: 'queued', room_id: streamId } });
};

// ── Misc ───────────────────────────────────────────────────────────────────
export const getUserStreamStatus = async (streamId) => ({
  data: { stream_id: streamId, is_active: true },
});
export const updateStreamStats = async (streamId) => liveApi.getStreamStats(streamId);
export const checkStreamConnection = async (streamId) => {
  try {
    const res = await liveApi.getLiveStreamDetails(streamId);
    return { data: { connected: !!res?.data, stream_id: streamId } };
  } catch {
    return { data: { connected: false, stream_id: streamId } };
  }
};

export default {
  createLiveStream,
  startLiveStream,
  endLiveStream,
  getLiveStreamDetails,
  getActiveLiveStreams,
  getActiveStreams,
  addViewer,
  removeViewer,
  getStreamViewers,
  sendLiveComment,
  getLiveComments,
  sendLiveGift,
  sendLiveHeart,
  getStreamStats,
  getLiveStreamAnalytics,
  updateCameraState,
  closeCameraStream,
  toggleCamera,
  toggleMicrophone,
  startRecording,
  stopRecording,
  recordLiveStream,
  muteUser,
  unmuteUser,
  banUser,
  unbanUser,
  addCoHost,
  removeCoHost,
  applyModerationAction,
  joinLiveRoom,
  leaveLiveRoom,
  getUserStreamStatus,
  updateStreamStats,
  checkStreamConnection,
};

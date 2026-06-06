import {
  getLiveStreamDetails,
  sendLiveComment,
  getLiveComments,
  sendLiveGift,
  sendLiveHeart,
  getLiveStreamStats,
  getLiveStreamViewers,
} from './liveStreamApi.js';
import {
  muteParticipant,
  unmuteParticipant,
  banViewer,
  unbanViewer,
  kickParticipant,
} from './advancedStreamApi.js';

export {
  getLiveStreamDetails,
  sendLiveComment,
  getLiveComments,
  sendLiveGift,
  sendLiveHeart,
};

export const getStreamStats = (streamId) => getLiveStreamStats(streamId);

export const getStreamViewers = async (streamId) => {
  const response = await getLiveStreamViewers(streamId);
  const payload = response?.data;
  const viewers = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.viewers)
      ? payload.viewers
      : [];
  return {
    ...response,
    data: viewers,
  };
};

export const muteUser = (streamId, userId, hostId = null, reason = '', duration = null) =>
  muteParticipant(streamId, userId, {
    host_id: hostId,
    reason,
    duration,
  });

export const unmuteUser = (streamId, userId) =>
  unmuteParticipant(streamId, userId);

export const banUser = (streamId, userId, hostId = null, reason = '', mode = 'temporary') =>
  banViewer(streamId, userId, {
    host_id: hostId,
    reason,
    permanent: String(mode).toLowerCase() === 'permanent',
  });

export const unbanUser = (streamId, userId) =>
  unbanViewer(streamId, userId);

export const removeViewer = (streamId, userId) =>
  kickParticipant(streamId, userId, 'removed-by-host');

export default {
  getLiveStreamDetails,
  sendLiveComment,
  getLiveComments,
  sendLiveGift,
  sendLiveHeart,
  getStreamStats,
  getStreamViewers,
  muteUser,
  unmuteUser,
  banUser,
  unbanUser,
  removeViewer,
};

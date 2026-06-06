import {
  createLiveStream,
  startLiveStream,
  endLiveStream,
  getLiveComments,
  sendLiveComment,
  sendLiveGift,
  getLiveStreamStats,
  recordLiveStream,
  getLiveStreamViewers,
} from './liveStreamApi.js';
import {
  toggleCamera,
  toggleMicrophone,
} from './advancedStreamApi.js';

export {
  createLiveStream,
  startLiveStream,
  endLiveStream,
  getLiveComments,
  sendLiveComment,
  sendLiveGift,
  recordLiveStream,
  toggleCamera,
  toggleMicrophone,
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

export const updateCameraState = (streamId, enabled) => toggleCamera(streamId, enabled);

export const closeCameraStream = async (streamId) => {
  if (!streamId) {
    return { data: { status: 'noop' } };
  }
  return toggleCamera(streamId, false);
};

export default {
  createLiveStream,
  startLiveStream,
  endLiveStream,
  getLiveComments,
  sendLiveComment,
  sendLiveGift,
  getStreamStats,
  recordLiveStream,
  updateCameraState,
  closeCameraStream,
  toggleCamera,
  toggleMicrophone,
  getStreamViewers,
};

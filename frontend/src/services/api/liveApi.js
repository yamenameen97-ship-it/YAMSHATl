import {
  addLiveComment,
  createLiveRoom,
  endLiveRoom,
  getLiveAnalytics,
  getLiveRooms,
  getLiveToken,
  sendLiveGift,
} from '../../api/live.js';
import socketManager from '../socketManager.js';

export const liveApi = {
  streams: () => getLiveRooms(),
  createStream: (payload = {}) => createLiveRoom(payload),
  joinStream: (streamId, payload = {}) => getLiveToken(streamId, { role: 'viewer', ...payload }),
  sendReaction: async (streamId, reaction = {}) => {
    if (reaction?.type === 'gift') {
      return sendLiveGift({ room_id: streamId, ...reaction });
    }
    socketManager.emit('send_heart', { room_id: streamId, reaction }, { queue: false });
    return { data: { status: 'queued', room_id: streamId, reaction } };
  },
  sendComment: (streamId, payload = {}) => addLiveComment({ room_id: streamId, ...payload }),
  getAnalytics: (streamId) => getLiveAnalytics(streamId),
  endStream: (streamId) => endLiveRoom(streamId),
};

export default liveApi;

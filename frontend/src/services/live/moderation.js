import axios from 'axios';
import socketManager from '../socketManager';
import logger from '../../utils/logger';

class ModerationService {
  async sendAction(roomId, action, payload = {}) {
    try {
      const response = await axios.post(`/api/live/${roomId}/moderate`, { action, ...payload });
      socketManager.emit('moderation_action', { roomId, action, ...payload });
      logger.info(`Live moderation action: ${action}`, { roomId, payload });
      return response.data;
    } catch (error) {
      logger.error('Failed live moderation action', { roomId, action, error: error?.message || error });
      throw error;
    }
  }

  muteParticipant(roomId, participantId) {
    return this.sendAction(roomId, 'mute_user', { username: participantId });
  }

  unmuteParticipant(roomId, participantId) {
    return this.sendAction(roomId, 'unmute_user', { username: participantId });
  }

  kickParticipant(roomId, participantId) {
    return this.sendAction(roomId, 'ban_user', { username: participantId });
  }

  banStream(roomId, userId) {
    return this.sendAction(roomId, 'ban_user', { username: userId });
  }

  deleteComment(roomId, commentId) {
    return this.sendAction(roomId, 'delete_comment', { comment_id: commentId });
  }

  pinComment(roomId, commentId) {
    return this.sendAction(roomId, 'pin_comment', { comment_id: commentId });
  }

  unpinComment(roomId, commentId) {
    return this.sendAction(roomId, 'unpin_comment', { comment_id: commentId });
  }

  async reportStream(roomId, reason) {
    try {
      const response = await axios.post(`/api/live/${roomId}/report`, { reason });
      logger.info('Live stream reported', { roomId, reason });
      return response.data;
    } catch (error) {
      logger.error('Failed to report live stream', { roomId, error: error?.message || error });
      throw error;
    }
  }
}

export const moderationService = new ModerationService();
export default moderationService;

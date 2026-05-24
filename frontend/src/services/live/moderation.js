import axios from 'axios';
import socketManager from '../socketManager';
import logger from '../../utils/logger';

class ModerationService {
  async muteParticipant(roomId, participantId) {
    try {
      await axios.post(`/api/live/${roomId}/mute`, { participantId });
      socketManager.emit('moderation_action', { type: 'mute', roomId, participantId });
      logger.info(`Muted participant ${participantId} in room ${roomId}`);
    } catch (error) {
      logger.error('Failed to mute participant', error);
      throw error;
    }
  }

  async kickParticipant(roomId, participantId) {
    try {
      await axios.post(`/api/live/${roomId}/kick`, { participantId });
      socketManager.emit('moderation_action', { type: 'kick', roomId, participantId });
      logger.info(`Kicked participant ${participantId} from room ${roomId}`);
    } catch (error) {
      logger.error('Failed to kick participant', error);
      throw error;
    }
  }

  async reportStream(roomId, reason) {
    try {
      await axios.post(`/api/live/${roomId}/report`, { reason });
      logger.info(`Reported room ${roomId} for ${reason}`);
    } catch (error) {
      logger.error('Failed to report stream', error);
      throw error;
    }
  }

  async banStream(roomId, userId) {
    try {
      await axios.post(`/api/live/ban`, { roomId, userId });
      socketManager.emit('moderation_action', { type: 'ban', roomId, userId });
      logger.info(`Banned user ${userId} from streaming`);
    } catch (error) {
      logger.error('Failed to ban stream', error);
      throw error;
    }
  }
}

export const moderationService = new ModerationService();
export default moderationService;

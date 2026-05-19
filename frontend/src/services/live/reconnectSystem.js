import livekitService from '../livekitService';
import logger from '../../utils/logger';

class ReconnectSystem {
  constructor() {
    this.isRecovering = false;
    this.recoveryData = null;
  }

  saveSession(data) {
    this.recoveryData = data;
    localStorage.setItem('live_session_recovery', JSON.stringify({
      ...data,
      timestamp: Date.now()
    }));
  }

  clearSession() {
    this.recoveryData = null;
    localStorage.removeItem('live_session_recovery');
  }

  async handleDisconnect(reason) {
    logger.warn('Live stream disconnected', { reason });
    
    if (this.isRecovering) return;
    this.isRecovering = true;

    const savedSession = JSON.parse(localStorage.getItem('live_session_recovery'));
    if (savedSession && (Date.now() - savedSession.timestamp < 300000)) { // 5 mins window
      await this.recoverStream(savedSession);
    }

    this.isRecovering = false;
  }

  async recoverStream(session) {
    logger.info('Attempting stream recovery...', { roomId: session.roomId });
    try {
      const result = await livekitService.connect(
        session.serverUrl,
        session.token,
        session.roomName,
        session.userName
      );
      
      if (result.success) {
        logger.info('Stream recovered successfully');
        return true;
      }
    } catch (error) {
      logger.error('Stream recovery failed', error);
    }
    return false;
  }

  async recoverRoom(roomId) {
    // Logic to fetch room state from backend and rejoin
    logger.info(`Recovering room state for ${roomId}`);
    // API call to get room details
  }
}

export const reconnectSystem = new ReconnectSystem();
export default reconnectSystem;

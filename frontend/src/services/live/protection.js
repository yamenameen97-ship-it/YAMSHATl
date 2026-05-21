import logger from '../../utils/logger';

class StreamProtection {
  constructor() {
    this.reconnectAttempts = new Map();
    this.messageCount = new Map();
    this.MAX_RECONNECTS_PER_MIN = 5;
    this.MAX_MESSAGES_PER_SEC = 2;
  }

  // Prevent Reconnect Abuse
  canReconnect(userId) {
    const now = Date.now();
    const userAttempts = this.reconnectAttempts.get(userId) || [];
    const recentAttempts = userAttempts.filter(ts => now - ts < 60000);
    
    if (recentAttempts.length >= this.MAX_RECONNECTS_PER_MIN) {
      logger.warn(`Reconnect abuse detected for user ${userId}`);
      return false;
    }
    
    recentAttempts.push(now);
    this.reconnectAttempts.set(userId, recentAttempts);
    return true;
  }

  // Prevent Stream Spam
  isSpamming(userId) {
    const now = Date.now();
    const userMessages = this.messageCount.get(userId) || [];
    const recentMessages = userMessages.filter(ts => now - ts < 1000);
    
    if (recentMessages.length >= this.MAX_MESSAGES_PER_SEC) {
      return true;
    }
    
    recentMessages.push(now);
    this.messageCount.set(userId, recentMessages);
    return false;
  }

  // Detect Fake Viewers (Basic logic)
  async validateViewer(viewerToken) {
    // In production, this would verify a signed JWT or challenge-response
    return !!viewerToken;
  }
}

export const streamProtection = new StreamProtection();
export default streamProtection;

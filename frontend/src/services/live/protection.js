import logger from '../../utils/logger';

const NORMALIZE_RE = /\s+/g;
const DEFAULT_BANNED_TERMS = ['spam', 'scam', 'abuse', 'hate'];

function normalizeText(value = '') {
  return String(value).trim().toLowerCase().replace(NORMALIZE_RE, ' ');
}

class StreamProtection {
  constructor() {
    this.reconnectAttempts = new Map();
    this.messageWindows = new Map();
    this.lastMessageByUser = new Map();
    this.MAX_RECONNECTS_PER_MIN = 6;
    this.MESSAGE_WINDOW_MS = 4_000;
    this.MAX_MESSAGES_PER_WINDOW = 4;
    this.bannedTerms = new Set(DEFAULT_BANNED_TERMS);
  }

  canReconnect(userId) {
    const key = String(userId || 'anonymous');
    const now = Date.now();
    const attempts = (this.reconnectAttempts.get(key) || []).filter((ts) => now - ts < 60_000);
    if (attempts.length >= this.MAX_RECONNECTS_PER_MIN) {
      logger.warn('Reconnect abuse detected', { userId: key, attempts: attempts.length });
      this.reconnectAttempts.set(key, attempts);
      return false;
    }
    attempts.push(now);
    this.reconnectAttempts.set(key, attempts);
    return true;
  }

  isSpamming(userId) {
    const key = String(userId || 'anonymous');
    const now = Date.now();
    const window = (this.messageWindows.get(key) || []).filter((ts) => now - ts < this.MESSAGE_WINDOW_MS);
    window.push(now);
    this.messageWindows.set(key, window);
    return window.length > this.MAX_MESSAGES_PER_WINDOW;
  }

  evaluateComment(userId, text, { slowModeSeconds = 0 } = {}) {
    const key = String(userId || 'anonymous');
    const normalized = normalizeText(text);
    if (!normalized) {
      return { allowed: false, reason: 'empty_comment', normalizedText: '' };
    }

    if (this.isSpamming(key)) {
      return { allowed: false, reason: 'rate_limited', normalizedText: normalized };
    }

    const lastMessage = this.lastMessageByUser.get(key);
    if (lastMessage?.text === normalized && Date.now() - lastMessage.ts < 20_000) {
      return { allowed: false, reason: 'duplicate_comment', normalizedText: normalized };
    }

    if (slowModeSeconds > 0 && lastMessage?.ts && Date.now() - lastMessage.ts < slowModeSeconds * 1000) {
      return { allowed: false, reason: 'slow_mode', normalizedText: normalized };
    }

    const bannedTerm = [...this.bannedTerms].find((term) => normalized.includes(term));
    if (bannedTerm) {
      return { allowed: false, reason: 'blocked_keyword', normalizedText: normalized, blockedKeyword: bannedTerm };
    }

    this.lastMessageByUser.set(key, { text: normalized, ts: Date.now() });
    return { allowed: true, reason: 'ok', normalizedText: normalized };
  }

  async validateViewer(viewerToken) {
    return typeof viewerToken === 'string' && viewerToken.trim().length >= 8;
  }
}

export const streamProtection = new StreamProtection();
export default streamProtection;

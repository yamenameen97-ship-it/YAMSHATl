import axios from 'axios';
import socketManager from '../socketManager.js';
import logger from '../../utils/logger.js';

const DEFAULT_BANNED_TERMS = ['spam', 'scam', 'abuse', 'hate'];

function normalizeText(value = '') {
  return String(value || '').trim().toLowerCase();
}

class ModerationService {
  constructor() {
    this.auditLog = [];
    this.configCache = new Map();
  }

  rememberAction(entry) {
    this.auditLog.unshift({ ...entry, at: Date.now() });
    if (this.auditLog.length > 200) this.auditLog.length = 200;
  }

  emitRealtime(payload) {
    try {
      socketManager.emit('moderation_action', payload);
    } catch (error) {
      logger.warn('Moderation realtime emit failed', { message: error?.message });
    }
  }

  async request(url, payload, realtimePayload) {
    try {
      const response = await axios.post(url, payload);
      if (realtimePayload) this.emitRealtime(realtimePayload);
      this.rememberAction({ url, payload, success: true });
      return response.data;
    } catch (error) {
      this.rememberAction({ url, payload, success: false, error: error?.message });
      logger.error('Moderation request failed', { url, message: error?.message });
      throw error;
    }
  }

  async muteParticipant(roomId, participantId, durationSeconds = 300) {
    return this.request(`/api/live/${roomId}/mute`, { participantId, durationSeconds }, { type: 'mute', roomId, participantId, durationSeconds });
  }

  async kickParticipant(roomId, participantId, reason = 'manual') {
    return this.request(`/api/live/${roomId}/kick`, { participantId, reason }, { type: 'kick', roomId, participantId, reason });
  }

  async banParticipant(roomId, participantId, reason = 'policy_violation') {
    return this.request(`/api/live/${roomId}/ban`, { participantId, reason }, { type: 'ban', roomId, participantId, reason });
  }

  async shadowBanParticipant(roomId, participantId, reason = 'shadow_ban') {
    return this.request(`/api/live/${roomId}/shadow-ban`, { participantId, reason }, { type: 'shadow_ban', roomId, participantId, reason });
  }

  async hideComment(roomId, commentId, reason = 'manual') {
    return this.request(`/api/live/${roomId}/comments/${commentId}/hide`, { reason }, { type: 'hide_comment', roomId, commentId, reason });
  }

  async pinComment(roomId, commentId) {
    return this.request(`/api/live/${roomId}/comments/${commentId}/pin`, {}, { type: 'pin_comment', roomId, commentId });
  }

  async toggleSlowMode(roomId, seconds = 3, enabled = true) {
    const payload = { enabled, seconds };
    const data = await this.request(`/api/live/${roomId}/slow-mode`, payload, { type: 'slow_mode', roomId, ...payload });
    this.configCache.set(roomId, { ...(this.configCache.get(roomId) || {}), slowMode: payload });
    return data;
  }

  async approveGuest(roomId, guestId) {
    return this.request(`/api/live/${roomId}/guests/${guestId}/approve`, {}, { type: 'approve_guest', roomId, guestId });
  }

  async rejectGuest(roomId, guestId, reason = 'rejected') {
    return this.request(`/api/live/${roomId}/guests/${guestId}/reject`, { reason }, { type: 'reject_guest', roomId, guestId, reason });
  }

  async reportStream(roomId, reason) {
    return this.request(`/api/live/${roomId}/report`, { reason }, { type: 'report_stream', roomId, reason });
  }

  async banStream(roomId, userId, reason = 'repeat_violation') {
    return this.request('/api/live/ban', { roomId, userId, reason }, { type: 'ban_stream', roomId, userId, reason });
  }

  setRoomConfig(roomId, config = {}) {
    const next = { ...(this.configCache.get(roomId) || {}), ...config };
    this.configCache.set(roomId, next);
    return next;
  }

  getRoomConfig(roomId) {
    return this.configCache.get(roomId) || {};
  }

  evaluateComment(comment, rules = {}) {
    const text = normalizeText(comment?.text || comment);
    const bannedTerms = Array.isArray(rules.bannedTerms) && rules.bannedTerms.length ? rules.bannedTerms.map(normalizeText) : DEFAULT_BANNED_TERMS;
    const maxLength = Number(rules.maxLength || 220);
    const repeatedChars = /(.)\1{7,}/.test(text);
    const hasBlockedTerm = bannedTerms.some((term) => term && text.includes(term));
    const linkCount = (text.match(/https?:\/\//g) || []).length;
    const upperRatio = text ? text.replace(/[^A-Z]/g, '').length / text.length : 0;

    if (!text) return { status: 'blocked', reason: 'empty_comment', score: 1 };
    if (text.length > maxLength) return { status: 'review', reason: 'too_long', score: 0.7 };
    if (hasBlockedTerm) return { status: 'blocked', reason: 'blocked_term', score: 0.98 };
    if (repeatedChars) return { status: 'review', reason: 'repeated_characters', score: 0.74 };
    if (linkCount >= 2) return { status: 'review', reason: 'too_many_links', score: 0.8 };
    if (upperRatio > 0.6 && text.length > 18) return { status: 'review', reason: 'excessive_caps', score: 0.55 };
    return { status: 'allow', reason: 'clean', score: 0.05 };
  }

  getAuditLog(limit = 30) {
    return this.auditLog.slice(0, limit);
  }
}

export const moderationService = new ModerationService();
export default moderationService;

import logger from '../../utils/logger.js';

const DEFAULT_LIMIT = 250;
const DEFAULT_FLUSH_MS = 180;

function normalizeComment(comment = {}) {
  const createdAt = comment.created_at || comment.createdAt || new Date().toISOString();
  const user = comment.user || comment.username || 'عضو';
  const text = String(comment.text || '').trim();
  const id = String(comment.id || `${user}-${createdAt}-${text}`);
  return {
    ...comment,
    id,
    user,
    text,
    created_at: createdAt,
    pinned: Boolean(comment.pinned),
  };
}

class LiveCommentBuffer {
  constructor({ limit = DEFAULT_LIMIT, flushIntervalMs = DEFAULT_FLUSH_MS } = {}) {
    this.limit = limit;
    this.flushIntervalMs = flushIntervalMs;
    this.items = [];
    this.pending = [];
    this.listeners = new Set();
    this.flushTimer = null;
    this.signatures = new Map();
  }

  buildSignature(comment = {}) {
    return [comment.id, comment.user || comment.username, comment.text, comment.created_at || comment.createdAt]
      .map((part) => String(part || '').trim())
      .join('|');
  }

  pruneSignatures() {
    const threshold = Date.now() - 60_000;
    for (const [key, ts] of this.signatures.entries()) {
      if (ts < threshold) this.signatures.delete(key);
    }
  }

  subscribe(listener) {
    if (typeof listener !== 'function') return () => {};
    this.listeners.add(listener);
    listener(this.items.slice());
    return () => {
      this.listeners.delete(listener);
    };
  }

  emit() {
    const snapshot = this.items.slice();
    this.listeners.forEach((listener) => {
      try {
        listener(snapshot);
      } catch (error) {
        logger.warn('live comment buffer listener failure', { error: String(error?.message || error) });
      }
    });
  }

  seed(comments = []) {
    this.pending = [];
    this.items = Array.isArray(comments)
      ? comments.map((comment) => normalizeComment(comment)).slice(-this.limit)
      : [];
    this.signatures.clear();
    this.items.forEach((comment) => this.signatures.set(this.buildSignature(comment), Date.now()));
    this.emit();
  }

  push(comment) {
    const normalized = normalizeComment(comment);
    const signature = this.buildSignature(normalized);
    this.pruneSignatures();
    if (this.signatures.has(signature)) return false;
    this.pending.push(normalized);
    this.signatures.set(signature, Date.now());
    this.scheduleFlush();
    return true;
  }

  scheduleFlush() {
    if (this.flushTimer) return;
    this.flushTimer = window.setTimeout(() => {
      this.flushTimer = null;
      this.flush();
    }, this.flushIntervalMs);
  }

  flush() {
    if (!this.pending.length) return this.items.slice();
    const next = [...this.items, ...this.pending]
      .filter((comment) => !comment.deleted)
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      })
      .slice(-this.limit);
    this.pending = [];
    this.items = next;
    this.emit();
    return next.slice();
  }

  remove(commentId) {
    const target = String(commentId || '');
    this.items = this.items.filter((comment) => String(comment.id) !== target);
    this.pending = this.pending.filter((comment) => String(comment.id) !== target);
    this.emit();
  }

  pin(commentId, pinned = true) {
    const target = String(commentId || '');
    this.items = this.items.map((comment) => ({ ...comment, pinned: pinned && String(comment.id) === target }));
    this.pending = this.pending.map((comment) => ({ ...comment, pinned: pinned && String(comment.id) === target }));
    this.emit();
  }

  clear() {
    this.items = [];
    this.pending = [];
    this.signatures.clear();
    if (this.flushTimer) {
      window.clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    this.emit();
  }
}

export const createLiveCommentBuffer = (options) => new LiveCommentBuffer(options);
export default createLiveCommentBuffer;

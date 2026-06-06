export function buildAchievements(stats = {}) {
  return [
    stats.posts > 100 ? 'Top Creator' : null,
    stats.followers > 1000 ? 'Influencer' : null,
  ].filter(Boolean);
}

export function buildProfileThemes() {
  return ['light', 'dark', 'neon', 'creator'];
}

export function validateCaptcha(token) {
  return Boolean(token);
}

export function buildSessionLogs(sessions = []) {
  return sessions.map((session, index) => ({
    id: index + 1,
    device: session.device || 'unknown',
    createdAt: session.createdAt || Date.now(),
  }));
}
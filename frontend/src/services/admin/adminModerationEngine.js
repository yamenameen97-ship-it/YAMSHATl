const moderationState = {
  strikes: {},
  shadowBanned: [],
  reports: [],
};

export function detectAbuse(content = '') {
  const abusive = ['abuse', 'hate', 'spam'];

  return abusive.some((word) =>
    String(content).toLowerCase().includes(word)
  );
}

export function detectFraud(activity = {}) {
  return Boolean(activity.multipleDevices || activity.proxyDetected);
}

export function shadowBanUser(userId) {
  moderationState.shadowBanned.push(userId);

  return true;
}

export function issueStrike(userId) {
  moderationState.strikes[userId] ??= 0;
  moderationState.strikes[userId] += 1;

  return moderationState.strikes[userId];
}

export function enqueueModeration(item) {
  moderationState.reports.push({
    ...item,
    queuedAt: Date.now(),
  });

  return moderationState.reports.length;
}

export function automatedPunishment(userId, reason) {
  return {
    userId,
    punished: true,
    reason,
  };
}

export function exportAuditLog(logs = []) {
  return JSON.stringify({
    exportedAt: new Date().toISOString(),
    logs,
  });
}

export default {
  detectAbuse,
  detectFraud,
  shadowBanUser,
  issueStrike,
  enqueueModeration,
  automatedPunishment,
  exportAuditLog,
};
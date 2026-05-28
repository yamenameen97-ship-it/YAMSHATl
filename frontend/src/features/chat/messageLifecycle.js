export const MESSAGE_LIFECYCLE = Object.freeze({
  DRAFT: 'draft',
  QUEUED: 'queued',
  PENDING_UPLOAD: 'pending_upload',
  UPLOADING: 'uploading',
  SYNCING: 'syncing',
  SENT: 'sent',
  DELIVERED: 'delivered',
  SEEN: 'seen',
  RETRYING: 'retrying',
  FAILED: 'failed',
  FAILED_PERMANENT: 'failed_permanent',
  EDITED: 'edited',
  RECALLED: 'recalled',
  DELETED: 'deleted',
});

const STATUS_ALIASES = {
  sending: MESSAGE_LIFECYCLE.SYNCING,
  uploaded: MESSAGE_LIFECYCLE.SYNCING,
  upload_failed: MESSAGE_LIFECYCLE.FAILED,
  failed_permanent: MESSAGE_LIFECYCLE.FAILED_PERMANENT,
  deleted: MESSAGE_LIFECYCLE.DELETED,
  recalled: MESSAGE_LIFECYCLE.RECALLED,
  edited: MESSAGE_LIFECYCLE.EDITED,
};

const STATUS_ORDER = {
  [MESSAGE_LIFECYCLE.DRAFT]: 0,
  [MESSAGE_LIFECYCLE.QUEUED]: 1,
  [MESSAGE_LIFECYCLE.PENDING_UPLOAD]: 2,
  [MESSAGE_LIFECYCLE.UPLOADING]: 3,
  [MESSAGE_LIFECYCLE.SYNCING]: 4,
  [MESSAGE_LIFECYCLE.SENT]: 5,
  [MESSAGE_LIFECYCLE.DELIVERED]: 6,
  [MESSAGE_LIFECYCLE.SEEN]: 7,
  [MESSAGE_LIFECYCLE.EDITED]: 8,
  [MESSAGE_LIFECYCLE.RECALLED]: 9,
  [MESSAGE_LIFECYCLE.DELETED]: 10,
  [MESSAGE_LIFECYCLE.FAILED]: 11,
  [MESSAGE_LIFECYCLE.FAILED_PERMANENT]: 12,
};

export function normalizeMessageStatus(value = '') {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return MESSAGE_LIFECYCLE.SENT;
  return STATUS_ALIASES[raw] || raw;
}

export function isFailureStatus(value = '') {
  const normalized = normalizeMessageStatus(value);
  return normalized === MESSAGE_LIFECYCLE.FAILED || normalized === MESSAGE_LIFECYCLE.FAILED_PERMANENT;
}

export function getMessageStatusWeight(value = '') {
  return STATUS_ORDER[normalizeMessageStatus(value)] ?? STATUS_ORDER[MESSAGE_LIFECYCLE.SENT];
}

export function pickStrongerStatus(...statuses) {
  return statuses
    .map((status) => normalizeMessageStatus(status))
    .sort((left, right) => getMessageStatusWeight(right) - getMessageStatusWeight(left))[0] || MESSAGE_LIFECYCLE.SENT;
}

export function buildLifecycleState(status = MESSAGE_LIFECYCLE.SENT, patch = {}) {
  const normalized = normalizeMessageStatus(status);
  return {
    status: normalized,
    queued: normalized === MESSAGE_LIFECYCLE.QUEUED,
    syncing: [MESSAGE_LIFECYCLE.SYNCING, MESSAGE_LIFECYCLE.PENDING_UPLOAD, MESSAGE_LIFECYCLE.UPLOADING, MESSAGE_LIFECYCLE.RETRYING].includes(normalized),
    failed: isFailureStatus(normalized),
    isTerminalFailure: normalized === MESSAGE_LIFECYCLE.FAILED_PERMANENT,
    updatedAt: new Date().toISOString(),
    ...patch,
  };
}

export function withLifecycle(message = {}, status = message?.status || MESSAGE_LIFECYCLE.SENT, patch = {}) {
  const normalized = normalizeMessageStatus(status);
  return {
    ...message,
    status: normalized,
    lifecycle: buildLifecycleState(normalized, patch),
  };
}

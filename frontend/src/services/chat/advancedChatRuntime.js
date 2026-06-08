const memoryState = {
  typingUsers: {},
  onlineUsers: {},
  scheduledMessages: [],
  failedQueue: [],
  mutedConversations: {},
  blockedUsers: {},
};

export function setTyping(chatId, userId, value = true) {
  memoryState.typingUsers[chatId] ??= {};
  memoryState.typingUsers[chatId][userId] = value;
  return memoryState.typingUsers;
}

export function setOnline(userId, value = true) {
  memoryState.onlineUsers[userId] = {
    online: value,
    lastSeen: Date.now(),
  };
  return memoryState.onlineUsers[userId];
}

export function scheduleMessage(message) {
  memoryState.scheduledMessages.push({
    ...message,
    scheduledAt: message.scheduledAt || Date.now(),
  });
  return true;
}

export function enqueueFailedMessage(message) {
  memoryState.failedQueue.push({
    ...message,
    failedAt: Date.now(),
  });
}

export function retryFailedMessages(sender) {
  const queue = [...memoryState.failedQueue];
  memoryState.failedQueue = [];
  queue.forEach((msg) => sender?.(msg));
  return queue.length;
}

export function muteConversation(chatId) {
  memoryState.mutedConversations[chatId] = true;
}

export function blockUser(userId) {
  memoryState.blockedUsers[userId] = true;
}

export function exportChatBackup(messages = []) {
  return JSON.stringify({
    exportedAt: new Date().toISOString(),
    messages,
  });
}

export function syncOfflineMessages(messages = []) {
  return messages.map((m) => ({
    ...m,
    synced: true,
  }));
}

export default {
  setTyping,
  setOnline,
  scheduleMessage,
  enqueueFailedMessage,
  retryFailedMessages,
  muteConversation,
  blockUser,
  exportChatBackup,
  syncOfflineMessages,
};
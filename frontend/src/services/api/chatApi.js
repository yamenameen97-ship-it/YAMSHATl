import { getChatThreads, getMessages, markMessagesSeen, sendMessageApi } from '../../api/chat.js';

export const chatApi = {
  conversations: (options = {}) => getChatThreads(options),
  messages: (chatId, options = {}) => getMessages(chatId, 40, undefined, options),
  sendMessage: (chatId, payload = {}) => sendMessageApi({ receiver: chatId, ...payload }),
  typing: (chatId) => Promise.resolve({ data: { status: 'realtime_only', chatId } }),
  read: (chatId) => markMessagesSeen(chatId),
};

export default chatApi;

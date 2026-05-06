import { create } from 'zustand';

function toIsoDate(value) {
  if (!value) return null;
  try {
    return new Date(value).toISOString();
  } catch {
    return null;
  }
}

function getThreadTimestamp(thread) {
  return thread?.last_message_at || thread?.created_at || null;
}

function normalizePreview(thread) {
  if (thread?.last_message_deleted || thread?.deleted) return 'تم حذف هذه الرسالة';
  return thread?.last_message
    || thread?.message
    || thread?.content
    || (thread?.last_message_type && thread.last_message_type !== 'text' ? '📎 مرفق' : 'ابدأ المحادثة الآن');
}

function normalizeThread(rawThread = {}) {
  const timestamp = toIsoDate(rawThread.last_message_at || rawThread.created_at || rawThread.lastMessage?.created_at);
  return {
    username: rawThread.username || rawThread.name || '',
    avatar: rawThread.avatar || '',
    unread_count: Number(rawThread.unread_count || 0),
    created_at: timestamp,
    last_message: normalizePreview(rawThread),
    last_message_at: timestamp,
    last_message_status: rawThread.last_message_status || rawThread.status || 'sent',
    last_message_sender: rawThread.last_message_sender || rawThread.sender || '',
    last_message_type: rawThread.last_message_type || rawThread.type || 'text',
    last_message_deleted: Boolean(rawThread.last_message_deleted || rawThread.deleted),
    last_message_id: rawThread.last_message_id || rawThread.id || null,
    presence: rawThread.presence || { is_online: false, last_seen: null },
  };
}

function buildThreadFromMessage(message, currentUser, previous = {}) {
  const peer = message?.sender === currentUser ? message?.receiver : message?.sender;
  return normalizeThread({
    ...previous,
    username: peer,
    last_message: message?.deleted ? 'تم حذف هذه الرسالة' : (message?.message || message?.content || (message?.type && message.type !== 'text' ? '📎 مرفق' : previous.last_message)),
    last_message_at: message?.created_at,
    last_message_sender: message?.sender,
    last_message_status: message?.status || previous.last_message_status || 'sent',
    last_message_type: message?.type || previous.last_message_type || 'text',
    last_message_deleted: Boolean(message?.deleted),
    last_message_id: message?.id || previous.last_message_id || null,
    unread_count: Number(previous.unread_count || 0),
    avatar: previous.avatar || '',
    presence: previous.presence || { is_online: false, last_seen: null },
  });
}

function sortThreads(threads) {
  return [...threads].sort((a, b) => {
    const unreadDelta = Number(b.unread_count || 0) - Number(a.unread_count || 0);
    if (unreadDelta !== 0) return unreadDelta;
    return new Date(getThreadTimestamp(b) || 0) - new Date(getThreadTimestamp(a) || 0);
  });
}

function sortMessages(messages = []) {
  const map = new Map();
  messages.forEach((message) => {
    const key = message?.id || message?.client_id;
    if (!key) return;
    map.set(key, { ...(map.get(key) || {}), ...message });
  });
  return [...map.values()].sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
}

export const useChatStore = create((set, get) => ({
  initialized: false,
  loadingThreads: false,
  activePeer: '',
  threadsByUsername: {},
  conversationsByPeer: {},
  setInitialized: (initialized = true) => set({ initialized }),
  setLoadingThreads: (loadingThreads) => set({ loadingThreads: Boolean(loadingThreads) }),
  setActivePeer: (activePeer = '') => set({ activePeer }),
  hydrateThreads: (threads = [], options = {}) => set((state) => {
    const replace = Boolean(options.replace);
    const nextThreads = replace ? {} : { ...state.threadsByUsername };
    threads.forEach((thread) => {
      const normalized = normalizeThread(thread);
      if (!normalized.username) return;
      nextThreads[normalized.username] = {
        ...(nextThreads[normalized.username] || {}),
        ...normalized,
      };
    });
    return { threadsByUsername: nextThreads, initialized: true };
  }),
  upsertThread: (thread) => set((state) => {
    const normalized = normalizeThread(thread);
    if (!normalized.username) return state;
    return {
      threadsByUsername: {
        ...state.threadsByUsername,
        [normalized.username]: {
          ...(state.threadsByUsername[normalized.username] || {}),
          ...normalized,
        },
      },
    };
  }),
  setPresence: (username, presence) => set((state) => {
    if (!username) return state;
    const existing = state.threadsByUsername[username] || normalizeThread({ username });
    return {
      threadsByUsername: {
        ...state.threadsByUsername,
        [username]: {
          ...existing,
          presence: {
            ...(existing.presence || {}),
            ...(presence || {}),
          },
        },
      },
    };
  }),
  markThreadRead: (username) => set((state) => {
    if (!username || !state.threadsByUsername[username]) return state;
    return {
      threadsByUsername: {
        ...state.threadsByUsername,
        [username]: {
          ...state.threadsByUsername[username],
          unread_count: 0,
        },
      },
    };
  }),
  applyIncomingMessage: (message, currentUser, options = {}) => set((state) => {
    if (!message || !currentUser) return state;
    const peer = message.sender === currentUser ? message.receiver : message.sender;
    if (!peer) return state;
    const existing = state.threadsByUsername[peer] || normalizeThread({ username: peer });
    const nextUnread = message.sender !== currentUser && state.activePeer !== peer && !options.skipUnreadIncrement
      ? Number(existing.unread_count || 0) + 1
      : Number(existing.unread_count || 0);
    const nextThread = {
      ...buildThreadFromMessage(message, currentUser, existing),
      unread_count: state.activePeer === peer ? 0 : nextUnread,
      presence: existing.presence || { is_online: false, last_seen: null },
    };

    const previousConversation = state.conversationsByPeer[peer]?.messages || [];
    const nextConversation = sortMessages([...previousConversation, message]);

    return {
      threadsByUsername: {
        ...state.threadsByUsername,
        [peer]: nextThread,
      },
      conversationsByPeer: {
        ...state.conversationsByPeer,
        [peer]: {
          ...(state.conversationsByPeer[peer] || {}),
          messages: nextConversation,
        },
      },
    };
  }),
  setConversation: (peer, payload = {}) => set((state) => {
    if (!peer) return state;
    const messages = Array.isArray(payload.messages) ? payload.messages : [];
    const currentConversation = state.conversationsByPeer[peer] || {};
    const nextMessages = payload.appendOlder
      ? sortMessages([...(messages || []), ...(currentConversation.messages || [])])
      : sortMessages(messages);

    const latest = nextMessages[nextMessages.length - 1];
    const existingThread = state.threadsByUsername[peer] || normalizeThread({ username: peer });

    return {
      threadsByUsername: latest ? {
        ...state.threadsByUsername,
        [peer]: {
          ...buildThreadFromMessage(latest, payload.currentUser || latest.sender, existingThread),
          unread_count: payload.keepUnread ? Number(existingThread.unread_count || 0) : 0,
          presence: payload.presence || existingThread.presence || { is_online: false, last_seen: null },
          avatar: existingThread.avatar || '',
        },
      } : state.threadsByUsername,
      conversationsByPeer: {
        ...state.conversationsByPeer,
        [peer]: {
          ...currentConversation,
          messages: nextMessages,
          hasMore: typeof payload.hasMore === 'boolean' ? payload.hasMore : currentConversation.hasMore,
          hydrated: true,
        },
      },
    };
  }),
  replaceOptimisticMessage: (peer, clientId, savedMessage) => set((state) => {
    if (!peer || !clientId) return state;
    const currentConversation = state.conversationsByPeer[peer] || { messages: [] };
    const filtered = (currentConversation.messages || []).filter((item) => item.client_id !== clientId);
    const messages = sortMessages([...filtered, savedMessage]);
    const latest = messages[messages.length - 1];
    const existingThread = state.threadsByUsername[peer] || normalizeThread({ username: peer });
    return {
      threadsByUsername: latest ? {
        ...state.threadsByUsername,
        [peer]: {
          ...buildThreadFromMessage(latest, savedMessage.sender, existingThread),
          unread_count: Number(existingThread.unread_count || 0),
          presence: existingThread.presence || { is_online: false, last_seen: null },
        },
      } : state.threadsByUsername,
      conversationsByPeer: {
        ...state.conversationsByPeer,
        [peer]: {
          ...currentConversation,
          messages,
        },
      },
    };
  }),
  updateMessageStatus: (peer, messageIds = [], status = 'sent') => set((state) => {
    if (!peer || !messageIds.length) return state;
    const currentConversation = state.conversationsByPeer[peer] || { messages: [] };
    const messages = (currentConversation.messages || []).map((message) => (
      messageIds.includes(message.id) ? { ...message, status } : message
    ));
    const thread = state.threadsByUsername[peer];
    const lastMessageId = thread?.last_message_id;
    return {
      threadsByUsername: thread && messageIds.includes(lastMessageId) ? {
        ...state.threadsByUsername,
        [peer]: {
          ...thread,
          last_message_status: status,
        },
      } : state.threadsByUsername,
      conversationsByPeer: {
        ...state.conversationsByPeer,
        [peer]: {
          ...currentConversation,
          messages,
        },
      },
    };
  }),
  getSortedThreads: () => sortThreads(Object.values(get().threadsByUsername)),
  getUnreadTotal: () => Object.values(get().threadsByUsername).reduce((sum, thread) => sum + Number(thread.unread_count || 0), 0),
}));

export function selectSortedThreads(state) {
  return sortThreads(Object.values(state.threadsByUsername || {}));
}

export function selectUnreadTotal(state) {
  return Object.values(state.threadsByUsername || {}).reduce((sum, thread) => sum + Number(thread.unread_count || 0), 0);
}

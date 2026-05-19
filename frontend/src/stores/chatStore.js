import { create } from 'zustand';

function toIsoDate(value) {
  if (!value) return null;
  try {
    return new Date(value).toISOString();
  } catch {
    return null;
  }
}

function normalizeThread(rawThread = {}) {
  const timestamp = toIsoDate(rawThread.last_message_at || rawThread.created_at) || new Date().toISOString();
  return {
    username: rawThread.username || rawThread.name || rawThread.peer || '',
    unread_count: Number(rawThread.unread_count || 0),
    last_message: rawThread.last_message || rawThread.message || 'ابدأ المحادثة الآن',
    last_message_at: timestamp,
    presence: rawThread.presence || { is_online: false },
  };
}

function upsertThread(state, peer, patch = {}) {
  const current = state.threadsByUsername[peer] || normalizeThread({ username: peer });
  return {
    ...state.threadsByUsername,
    [peer]: {
      ...current,
      ...patch,
      username: peer,
    },
  };
}

export const useChatStore = create((set, get) => ({
  threadsByUsername: {},
  conversationsByPeer: {},
  isSyncing: false,
  initialized: false,
  loadingThreads: false,
  activePeer: null,

  setLoadingThreads: (loadingThreads = false) => set({ loadingThreads: Boolean(loadingThreads) }),
  setActivePeer: (activePeer = null) => set({ activePeer }),

  hydrateThreads: (threads = [], options = {}) =>
    set((state) => {
      const replace = options?.replace !== false;
      const nextThreads = replace ? {} : { ...state.threadsByUsername };

      (Array.isArray(threads) ? threads : []).forEach((thread) => {
        const normalized = normalizeThread(thread);
        if (!normalized.username) return;
        nextThreads[normalized.username] = {
          ...(nextThreads[normalized.username] || {}),
          ...normalized,
        };
      });

      return {
        threadsByUsername: nextThreads,
        initialized: true,
      };
    }),

  setThreads: (threads = []) => get().hydrateThreads(threads, { replace: true }),

  applyIncomingMessage: (message, currentUser, options = {}) =>
    set((state) => {
      const peer = message?.sender === currentUser ? message?.receiver : message?.sender;
      if (!peer) return state;

      const prevConversation = state.conversationsByPeer[peer] || { messages: [], lastUpdate: null };
      const prevMessages = Array.isArray(prevConversation.messages) ? prevConversation.messages : [];
      const nextMessages = [...prevMessages, message].slice(-100);
      const shouldIncrementUnread = message?.sender !== currentUser && !options?.skipUnreadIncrement;
      const previousThread = state.threadsByUsername[peer] || normalizeThread({ username: peer });

      return {
        conversationsByPeer: {
          ...state.conversationsByPeer,
          [peer]: {
            ...prevConversation,
            messages: nextMessages,
            lastUpdate: Date.now(),
          },
        },
        threadsByUsername: {
          ...state.threadsByUsername,
          [peer]: {
            ...previousThread,
            username: peer,
            last_message: message?.body || message?.content || previousThread.last_message,
            last_message_at: toIsoDate(message?.created_at) || new Date().toISOString(),
            unread_count: shouldIncrementUnread
              ? Number(previousThread.unread_count || 0) + 1
              : Number(previousThread.unread_count || 0),
          },
        },
        initialized: true,
      };
    }),

  updateMessageStatus: (peer, messageIds = [], status = 'sent') =>
    set((state) => {
      if (!peer || !state.conversationsByPeer[peer]) return state;
      const ids = new Set((Array.isArray(messageIds) ? messageIds : []).map(String));
      if (!ids.size) return state;

      return {
        conversationsByPeer: {
          ...state.conversationsByPeer,
          [peer]: {
            ...state.conversationsByPeer[peer],
            messages: (state.conversationsByPeer[peer].messages || []).map((message) => {
              const messageId = message?.id ?? message?.message_id;
              if (!ids.has(String(messageId))) return message;
              return { ...message, status };
            }),
          },
        },
      };
    }),

  setPresence: (peer, presence = {}) =>
    set((state) => ({
      threadsByUsername: upsertThread(state, peer, {
        presence: {
          ...(state.threadsByUsername[peer]?.presence || {}),
          ...(presence || {}),
        },
      }),
    })),

  markThreadRead: (peer) =>
    set((state) => ({
      threadsByUsername: upsertThread(state, peer, { unread_count: 0 }),
    })),

  invalidateCache: () =>
    set({
      threadsByUsername: {},
      conversationsByPeer: {},
      initialized: false,
      activePeer: null,
    }),

  syncOfflineMessages: async () => {
    set({ isSyncing: true });
    set({ isSyncing: false });
  },
}));

export const selectUnreadTotal = (state) =>
  Object.values(state?.threadsByUsername || {}).reduce(
    (total, thread) => total + Number(thread?.unread_count || 0),
    0,
  );

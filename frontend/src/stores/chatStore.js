import { create } from 'zustand';

// Utility functions from original file
function toIsoDate(value) {
  if (!value) return null;
  try { return new Date(value).toISOString(); } catch { return null; }
}

function normalizeThread(rawThread = {}) {
  const timestamp = toIsoDate(rawThread.last_message_at || rawThread.created_at);
  return {
    username: rawThread.username || rawThread.name || '',
    unread_count: Number(rawThread.unread_count || 0),
    last_message: rawThread.last_message || 'ابدأ المحادثة الآن',
    last_message_at: timestamp,
    presence: rawThread.presence || { is_online: false },
  };
}

export const useChatStore = create((set, get) => ({
  threadsByUsername: {},
  conversationsByPeer: {},
  isSyncing: false,

  // Optimistic updates
  applyIncomingMessage: (message, currentUser) => set((state) => {
    const peer = message.sender === currentUser ? message.receiver : message.sender;
    const prevMessages = state.conversationsByPeer[peer]?.messages || [];
    
    // Pagination memory cleanup: Keep only last 100 messages
    const nextMessages = [...prevMessages, message].slice(-100);

    return {
      conversationsByPeer: {
        ...state.conversationsByPeer,
        [peer]: { messages: nextMessages, lastUpdate: Date.now() }
      }
    };
  }),

  // Cache invalidation
  invalidateCache: () => set({ threadsByUsername: {}, conversationsByPeer: {} }),

  // Background sync
  syncOfflineMessages: async () => {
    set({ isSyncing: true });
    // Logic for background sync would go here
    set({ isSyncing: false });
  },

  setThreads: (threads) => set({
    threadsByUsername: threads.reduce((acc, t) => {
      acc[t.username] = normalizeThread(t);
      return acc;
    }, {})
  })
}));

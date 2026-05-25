import { create } from 'zustand';
import { getCurrentUsername } from '../utils/auth.js';
import {
  createConversationState,
  loadChatSnapshot,
  loadPendingReceipts,
  mergeConversationState,
  mergeMessages,
  mergeReceiptBucket,
  mergeThreadsMap,
  normalizeThread,
  persistChatSnapshot,
  persistPendingReceipts,
  removeReceiptIds,
} from '../features/chat/reliability.js';

function toIsoDate(value) {
  if (!value) return null;
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString();
  } catch {
    return null;
  }
}

function getPeerFromMessage(message = {}, currentUser = '') {
  return message?.sender === currentUser ? message?.receiver : message?.sender;
}

function withPersistedState(partialState = {}) {
  const currentUser = getCurrentUsername();
  if (!currentUser) return partialState;
  const snapshot = {
    threadsByUsername: partialState.threadsByUsername,
    conversationsByPeer: partialState.conversationsByPeer,
    pendingReceiptsByPeer: partialState.pendingReceiptsByPeer,
    lastHydratedAt: new Date().toISOString(),
  };
  persistChatSnapshot(currentUser, snapshot);
  persistPendingReceipts(currentUser, partialState.pendingReceiptsByPeer || {});
  return partialState;
}

const persistedSnapshot = loadChatSnapshot(getCurrentUsername());
const persistedReceipts = loadPendingReceipts(getCurrentUsername());

export const useChatStore = create((set, get) => ({
  threadsByUsername: persistedSnapshot?.threadsByUsername || {},
  conversationsByPeer: persistedSnapshot?.conversationsByPeer || {},
  pendingReceiptsByPeer: {
    ...(persistedSnapshot?.pendingReceiptsByPeer || {}),
    ...(persistedReceipts || {}),
  },
  isSyncing: false,
  initialized: Boolean(
    Object.keys(persistedSnapshot?.threadsByUsername || {}).length
    || Object.keys(persistedSnapshot?.conversationsByPeer || {}).length,
  ),
  loadingThreads: false,
  activePeer: null,
  lastSyncAt: persistedSnapshot?.lastHydratedAt || null,

  setLoadingThreads: (loadingThreads = false) => set({ loadingThreads: Boolean(loadingThreads) }),
  setActivePeer: (activePeer = null) => set({ activePeer }),
  setSyncing: (isSyncing = false) => set({ isSyncing: Boolean(isSyncing) }),
  setLastSyncAt: (lastSyncAt = null) => set({ lastSyncAt }),

  hydrateThreads: (threads = [], options = {}) =>
    set((state) => {
      const replace = options?.replace === true;
      const mergedThreads = replace
        ? mergeThreadsMap({}, threads)
        : mergeThreadsMap(state.threadsByUsername, threads);

      return withPersistedState({
        ...state,
        threadsByUsername: mergedThreads,
        initialized: true,
        lastSyncAt: new Date().toISOString(),
      });
    }),

  setThreads: (threads = []) => get().hydrateThreads(threads, { replace: true }),

  replaceConversationMessages: (peer, messages = [], meta = {}) =>
    set((state) => {
      if (!peer) return state;
      const conversationState = createConversationState(messages, {
        hasMore: meta?.hasMore,
        oldestMessageId: meta?.oldestMessageId,
        limit: meta?.limit || 200,
      });

      const latestMessage = conversationState.messages[conversationState.messages.length - 1] || null;
      const previousThread = state.threadsByUsername[peer] || normalizeThread({ username: peer }) || { username: peer };

      return withPersistedState({
        ...state,
        conversationsByPeer: {
          ...state.conversationsByPeer,
          [peer]: conversationState,
        },
        threadsByUsername: {
          ...state.threadsByUsername,
          [peer]: {
            ...previousThread,
            username: peer,
            last_message: latestMessage?.body || latestMessage?.content || latestMessage?.message || previousThread.last_message,
            last_message_type: latestMessage?.type || previousThread.last_message_type || 'text',
            last_message_at: toIsoDate(latestMessage?.created_at) || previousThread.last_message_at || new Date().toISOString(),
          },
        },
        initialized: true,
        lastSyncAt: new Date().toISOString(),
      });
    }),

  prependConversationPage: (peer, messages = [], meta = {}) =>
    set((state) => {
      if (!peer) return state;
      const currentConversation = state.conversationsByPeer[peer] || createConversationState([], {});
      const merged = mergeMessages(messages, currentConversation.messages || [], { limit: meta?.limit || 250 });
      return withPersistedState({
        ...state,
        conversationsByPeer: {
          ...state.conversationsByPeer,
          [peer]: {
            ...currentConversation,
            messages: merged,
            hasMore: meta?.hasMore ?? currentConversation.hasMore ?? false,
            oldestMessageId: meta?.oldestMessageId || merged?.[0]?.id || merged?.[0]?.message_id || currentConversation.oldestMessageId || '',
            lastUpdate: Date.now(),
          },
        },
      });
    }),

  applyIncomingMessage: (message, currentUser, options = {}) =>
    set((state) => {
      const peer = options?.peer || getPeerFromMessage(message, currentUser);
      if (!peer) return state;

      const previousThread = state.threadsByUsername[peer] || normalizeThread({ username: peer }) || { username: peer };
      const previousConversation = state.conversationsByPeer[peer] || createConversationState([], {});
      const nextConversation = mergeConversationState(previousConversation, [message], {
        limit: options?.limit || 250,
      });
      const shouldIncrementUnread = message?.sender !== currentUser && !options?.skipUnreadIncrement;
      const nextUnread = shouldIncrementUnread
        ? Number(previousThread.unread_count || 0) + 1
        : Number(previousThread.unread_count || 0);

      return withPersistedState({
        ...state,
        conversationsByPeer: {
          ...state.conversationsByPeer,
          [peer]: nextConversation,
        },
        threadsByUsername: {
          ...state.threadsByUsername,
          [peer]: {
            ...previousThread,
            username: peer,
            last_message: message?.body || message?.content || message?.message || previousThread.last_message,
            last_message_type: message?.type || previousThread.last_message_type || 'text',
            last_message_at: toIsoDate(message?.created_at) || new Date().toISOString(),
            unread_count: nextUnread,
          },
        },
        initialized: true,
        lastSyncAt: new Date().toISOString(),
      });
    }),

  updateMessageStatus: (peer, messageIds = [], status = 'sent') =>
    set((state) => {
      if (!peer || !state.conversationsByPeer[peer]) return state;
      const ids = new Set((Array.isArray(messageIds) ? messageIds : []).map((value) => String(value)));
      if (!ids.size) return state;

      const conversation = state.conversationsByPeer[peer];
      return withPersistedState({
        ...state,
        conversationsByPeer: {
          ...state.conversationsByPeer,
          [peer]: {
            ...conversation,
            messages: (conversation.messages || []).map((message) => {
              const messageId = message?.id ?? message?.message_id ?? message?.client_id;
              if (!ids.has(String(messageId))) return message;
              return { ...message, status };
            }),
            lastUpdate: Date.now(),
          },
        },
      });
    }),

  reconcileOptimisticMessage: (peer, clientId, serverMessage = {}) =>
    set((state) => {
      if (!peer || !clientId || !state.conversationsByPeer[peer]) return state;
      const conversation = state.conversationsByPeer[peer];
      const mergedMessages = mergeMessages(
        (conversation.messages || []).map((message) => (
          String(message?.client_id || message?.id) === String(clientId)
            ? { ...message, ...serverMessage, status: serverMessage?.status || 'sent' }
            : message
        )),
        [serverMessage],
        { limit: 250 },
      );

      return withPersistedState({
        ...state,
        conversationsByPeer: {
          ...state.conversationsByPeer,
          [peer]: {
            ...conversation,
            messages: mergedMessages,
            lastUpdate: Date.now(),
          },
        },
      });
    }),

  setPresence: (peer, presence = {}) =>
    set((state) => {
      const previousThread = state.threadsByUsername[peer] || normalizeThread({ username: peer }) || { username: peer };
      return withPersistedState({
        ...state,
        threadsByUsername: {
          ...state.threadsByUsername,
          [peer]: {
            ...previousThread,
            username: peer,
            presence: {
              ...(previousThread.presence || {}),
              ...(presence || {}),
            },
          },
        },
      });
    }),

  markThreadRead: (peer) =>
    set((state) => {
      const previousThread = state.threadsByUsername[peer] || normalizeThread({ username: peer }) || { username: peer };
      return withPersistedState({
        ...state,
        threadsByUsername: {
          ...state.threadsByUsername,
          [peer]: {
            ...previousThread,
            username: peer,
            unread_count: 0,
          },
        },
      });
    }),

  queuePendingReceipt: (peer, messageIds = [], type = 'seen') =>
    set((state) => {
      const nextPending = mergeReceiptBucket(state.pendingReceiptsByPeer, peer, messageIds, type);
      return withPersistedState({
        ...state,
        pendingReceiptsByPeer: nextPending,
      });
    }),

  flushPendingReceipts: (peer, type = 'seen', messageIds = []) =>
    set((state) => {
      const nextPending = removeReceiptIds(state.pendingReceiptsByPeer, peer, type, messageIds);
      return withPersistedState({
        ...state,
        pendingReceiptsByPeer: nextPending,
      });
    }),

  invalidateCache: () =>
    set((state) => withPersistedState({
      ...state,
      threadsByUsername: {},
      conversationsByPeer: {},
      pendingReceiptsByPeer: {},
      initialized: false,
      activePeer: null,
      lastSyncAt: null,
    })),

  syncOfflineMessages: async () => {
    set({ isSyncing: true });
    set({ isSyncing: false, lastSyncAt: new Date().toISOString() });
  },
}));

export const selectUnreadTotal = (state) =>
  Object.values(state?.threadsByUsername || {}).reduce(
    (total, thread) => total + Number(thread?.unread_count || 0),
    0,
  );

/**
 * Chat State Slice
 * 
 * Manages:
 * - Conversations list
 * - Current conversation
 * - Messages
 * - Chat loading states
 */

export default function chatSlice(set, get) {
  return {
    // State
    conversations: [],
    currentConversation: null,
    messages: {},
    isLoadingConversations: false,
    isLoadingMessages: false,
    unreadConversations: 0,

    // Conversation Actions
    setConversations: (conversations) => {
      set((state) => ({
        ...state,
        conversations,
        unreadConversations: conversations.filter(c => c.unread).length,
      }));
    },

    addConversation: (conversation) => {
      set((state) => ({
        ...state,
        conversations: [conversation, ...state.conversations],
      }));
    },

    updateConversation: (conversationId, updates) => {
      set((state) => ({
        ...state,
        conversations: state.conversations.map(c =>
          c.id === conversationId ? { ...c, ...updates } : c
        ),
      }));
    },

    removeConversation: (conversationId) => {
      set((state) => ({
        ...state,
        conversations: state.conversations.filter(c => c.id !== conversationId),
      }));
    },

    // Current Conversation Actions
    setCurrentConversation: (conversation) => {
      set((state) => ({
        ...state,
        currentConversation: conversation,
      }));
    },

    clearCurrentConversation: () => {
      set((state) => ({
        ...state,
        currentConversation: null,
      }));
    },

    // Message Actions
    setMessages: (conversationId, messages) => {
      set((state) => ({
        ...state,
        messages: {
          ...state.messages,
          [conversationId]: messages,
        },
      }));
    },

    addMessage: (conversationId, message) => {
      set((state) => ({
        ...state,
        messages: {
          ...state.messages,
          [conversationId]: [
            ...(state.messages[conversationId] || []),
            message,
          ],
        },
      }));
    },

    updateMessage: (conversationId, messageId, updates) => {
      set((state) => ({
        ...state,
        messages: {
          ...state.messages,
          [conversationId]: (state.messages[conversationId] || []).map(m =>
            m.id === messageId ? { ...m, ...updates } : m
          ),
        },
      }));
    },

    deleteMessage: (conversationId, messageId) => {
      set((state) => ({
        ...state,
        messages: {
          ...state.messages,
          [conversationId]: (state.messages[conversationId] || []).filter(
            m => m.id !== messageId
          ),
        },
      }));
    },

    clearMessages: (conversationId) => {
      set((state) => {
        const newMessages = { ...state.messages };
        delete newMessages[conversationId];
        return {
          ...state,
          messages: newMessages,
        };
      });
    },

    clearAllMessages: () => {
      set((state) => ({
        ...state,
        messages: {},
      }));
    },

    // Loading States
    setLoadingConversations: (isLoading) => {
      set((state) => ({
        ...state,
        isLoadingConversations: isLoading,
      }));
    },

    setLoadingMessages: (isLoading) => {
      set((state) => ({
        ...state,
        isLoadingMessages: isLoading,
      }));
    },

    // Utility Selectors
    getConversationMessages: (conversationId) => {
      return get().messages[conversationId] || [];
    },

    getUnreadConversations: () => {
      return get().conversations.filter(c => c.unread);
    },

    getTotalUnreadCount: () => {
      return get().conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
    },

    searchConversations: (query) => {
      const state = get();
      return state.conversations.filter(c =>
        c.name?.toLowerCase().includes(query.toLowerCase()) ||
        c.participants?.some(p =>
          p.name?.toLowerCase().includes(query.toLowerCase())
        )
      );
    },

    searchMessages: (conversationId, query) => {
      const messages = get().getConversationMessages(conversationId);
      return messages.filter(m =>
        m.content?.toLowerCase().includes(query.toLowerCase())
      );
    },
  };
}

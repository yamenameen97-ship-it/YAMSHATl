import { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import { getMessages } from '../api/chat.js';
import logger from '../utils/logger.js';

/**
 * useMessageStore Hook
 * 
 * إدارة متقدمة لمخزن الرسائل مع:
 * - Pagination وتحميل البيانات
 * - البحث والفلترة
 * - التخزين المؤقت (Caching)
 * - معالجة الأخطاء
 * - تحسين الأداء
 */
export function useMessageStore(peer, options = {}) {
  const {
    pageSize = 50,
    maxCachedMessages = 500,
    enableCache = true,
  } = options;

  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, text, media

  const pageRef = useRef(0);
  const cacheRef = useRef(new Map());
  const loadingRef = useRef(false);

  // تحميل الرسائل
  const loadMessages = useCallback(async (page = 0, reset = false) => {
    if (loadingRef.current || !peer) return;
    
    loadingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      // التحقق من الـ Cache
      if (enableCache && cacheRef.current.has(page)) {
        const cached = cacheRef.current.get(page);
        setMessages(reset ? cached : [...messages, ...cached]);
        setHasMore(cached.length === pageSize);
        pageRef.current = page + 1;
        return;
      }

      const { data } = await getMessages({
        peer,
        page,
        limit: pageSize,
      });

      const newMessages = Array.isArray(data) ? data : [];

      // تخزين في الـ Cache
      if (enableCache) {
        cacheRef.current.set(page, newMessages);
        
        // تنظيف الـ Cache إذا تجاوز الحد الأقصى
        if (cacheRef.current.size * pageSize > maxCachedMessages) {
          const firstKey = cacheRef.current.keys().next().value;
          cacheRef.current.delete(firstKey);
        }
      }

      setMessages(reset ? newMessages : [...messages, ...newMessages]);
      setHasMore(newMessages.length === pageSize);
      pageRef.current = page + 1;
    } catch (err) {
      logger.warn('Failed to load messages', { error: err?.message });
      setError(err?.message || 'Failed to load messages');
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
    }
  }, [peer, pageSize, enableCache, maxCachedMessages, messages]);

  // تحميل الرسائل الأولية
  useEffect(() => {
    if (!peer) return;
    pageRef.current = 0;
    cacheRef.current.clear();
    loadMessages(0, true);
  }, [peer]);

  // تحميل المزيد من الرسائل
  const loadMore = useCallback(() => {
    if (!hasMore || isLoading) return;
    loadMessages(pageRef.current);
  }, [hasMore, isLoading, loadMessages]);

  // البحث في الرسائل
  const filteredMessages = useMemo(() => {
    let result = messages;

    // تطبيق الفلتر حسب النوع
    if (filterType !== 'all') {
      result = result.filter(msg => {
        if (filterType === 'text') {
          return !msg.media_url && !msg.media;
        }
        if (filterType === 'media') {
          return msg.media_url || msg.media;
        }
        return true;
      });
    }

    // تطبيق البحث
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(msg => {
        const content = (msg.content || msg.message || '').toLowerCase();
        return content.includes(query);
      });
    }

    return result;
  }, [messages, searchQuery, filterType]);

  // إضافة رسالة جديدة
  const addMessage = useCallback((message) => {
    setMessages(prev => {
      const updated = [message, ...prev];
      return updated.slice(0, maxCachedMessages);
    });
  }, [maxCachedMessages]);

  // تحديث رسالة موجودة
  const updateMessage = useCallback((messageId, updates) => {
    setMessages(prev => 
      prev.map(msg => 
        (msg.id === messageId || msg.message_id === messageId)
          ? { ...msg, ...updates }
          : msg
      )
    );
  }, []);

  // حذف رسالة
  const deleteMessage = useCallback((messageId) => {
    setMessages(prev => 
      prev.filter(msg => msg.id !== messageId && msg.message_id !== messageId)
    );
  }, []);

  // مسح الرسائل
  const clearMessages = useCallback(() => {
    setMessages([]);
    cacheRef.current.clear();
    pageRef.current = 0;
    setHasMore(true);
  }, []);

  return {
    messages: filteredMessages,
    allMessages: messages,
    isLoading,
    hasMore,
    error,
    searchQuery,
    setSearchQuery,
    filterType,
    setFilterType,
    loadMore,
    addMessage,
    updateMessage,
    deleteMessage,
    clearMessages,
    reload: () => loadMessages(0, true),
  };
}

/**
 * Hook لإدارة حالة الرسائل المحددة
 */
export function useMessageSelection() {
  const [selectedMessageIds, setSelectedMessageIds] = useState(new Set());

  const toggleSelection = useCallback((messageId) => {
    setSelectedMessageIds(prev => {
      const next = new Set(prev);
      if (next.has(messageId)) {
        next.delete(messageId);
      } else {
        next.add(messageId);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback((messageIds) => {
    setSelectedMessageIds(new Set(messageIds));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedMessageIds(new Set());
  }, []);

  const isSelected = useCallback((messageId) => {
    return selectedMessageIds.has(messageId);
  }, [selectedMessageIds]);

  return {
    selectedMessageIds,
    toggleSelection,
    selectAll,
    clearSelection,
    isSelected,
    selectionCount: selectedMessageIds.size,
  };
}

/**
 * Hook لإدارة حالة الرسائل المثبتة (Pinned Messages)
 */
export function usePinnedMessages(peer) {
  const [pinnedMessages, setPinnedMessages] = useState([]);

  const togglePin = useCallback((message) => {
    setPinnedMessages(prev => {
      const exists = prev.some(m => m.id === message.id || m.message_id === message.id);
      if (exists) {
        return prev.filter(m => m.id !== message.id && m.message_id !== message.id);
      }
      return [message, ...prev].slice(0, 10); // حد أقصى 10 رسائل مثبتة
    });
  }, []);

  const clearPinned = useCallback(() => {
    setPinnedMessages([]);
  }, []);

  return {
    pinnedMessages,
    togglePin,
    clearPinned,
    isPinned: (messageId) => pinnedMessages.some(m => m.id === messageId || m.message_id === messageId),
  };
}

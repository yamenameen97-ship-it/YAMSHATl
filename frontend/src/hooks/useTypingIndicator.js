import { useEffect, useRef, useCallback, useState } from 'react';
import socketManager from '../services/socketManager.js';
import logger from '../utils/logger.js';

/**
 * useTypingIndicator Hook
 * 
 * إدارة مؤشر الكتابة (Typing Indicator) مع:
 * - Debouncing لتقليل الرسائل
 * - تتبع حالة الكتابة
 * - تنظيف تلقائي عند الانتهاء
 * - معالجة الأخطاء
 */
export function useTypingIndicator(receiver, options = {}) {
  const {
    debounceMs = 300,
    stopTimeoutMs = 2000,
    maxFrequencyMs = 1000,
  } = options;

  const [isTyping, setIsTyping] = useState(false);
  const debounceTimerRef = useRef(null);
  const stopTimerRef = useRef(null);
  const lastEmitRef = useRef(0);
  const currentStateRef = useRef(false);

  // إرسال حالة الكتابة
  const emitTypingState = useCallback((typing) => {
    if (!receiver) return;
    
    const now = Date.now();
    if (now - lastEmitRef.current < maxFrequencyMs) {
      return; // تخطي إذا كان الوقت قصير جداً
    }

    lastEmitRef.current = now;
    currentStateRef.current = typing;

    try {
      socketManager.emit('chat_typing', {
        receiver,
        is_typing: typing,
      });
      logger.debug('typing indicator emitted', { receiver, is_typing: typing });
    } catch (error) {
      logger.warn('Failed to emit typing indicator', { error: error?.message });
    }
  }, [receiver, maxFrequencyMs]);

  // معالج بدء الكتابة
  const handleTypingStart = useCallback(() => {
    if (isTyping) return;
    setIsTyping(true);

    // مسح Timers السابقة
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
    }

    // إرسال حالة الكتابة بعد Debounce
    debounceTimerRef.current = setTimeout(() => {
      emitTypingState(true);

      // إيقاف الكتابة بعد Timeout
      stopTimerRef.current = setTimeout(() => {
        handleTypingStop();
      }, stopTimeoutMs);
    }, debounceMs);
  }, [isTyping, debounceMs, stopTimeoutMs, emitTypingState]);

  // معالج إيقاف الكتابة
  const handleTypingStop = useCallback(() => {
    if (!isTyping) return;
    
    setIsTyping(false);

    // مسح Timers
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }

    // إرسال حالة الإيقاف
    if (currentStateRef.current) {
      emitTypingState(false);
    }
  }, [isTyping, emitTypingState]);

  // تنظيف عند الفصل
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (stopTimerRef.current) {
        clearTimeout(stopTimerRef.current);
      }
      
      // إرسال حالة الإيقاف النهائية
      if (currentStateRef.current) {
        try {
          socketManager.emit('chat_typing', {
            receiver,
            is_typing: false,
          });
        } catch (error) {
          logger.warn('Failed to emit final typing stop', { error: error?.message });
        }
      }
    };
  }, [receiver]);

  return {
    isTyping,
    handleTypingStart,
    handleTypingStop,
  };
}

/**
 * Hook لتتبع مؤشرات الكتابة من المستخدمين الآخرين
 */
export function useTypingIndicators(currentUser) {
  const [typingUsers, setTypingUsers] = useState(new Map());
  const typingTimeoutsRef = useRef(new Map());

  useEffect(() => {
    const handleTypingUpdate = (payload) => {
      if (!payload?.sender || payload.sender === currentUser) return;

      // مسح Timeout السابق
      if (typingTimeoutsRef.current.has(payload.sender)) {
        clearTimeout(typingTimeoutsRef.current.get(payload.sender));
      }

      if (payload.is_typing) {
        setTypingUsers(prev => new Map(prev).set(payload.sender, true));

        // إيقاف الكتابة بعد 3 ثوان تلقائياً
        const timeout = setTimeout(() => {
          setTypingUsers(prev => {
            const next = new Map(prev);
            next.delete(payload.sender);
            return next;
          });
          typingTimeoutsRef.current.delete(payload.sender);
        }, 3000);

        typingTimeoutsRef.current.set(payload.sender, timeout);
      } else {
        setTypingUsers(prev => {
          const next = new Map(prev);
          next.delete(payload.sender);
          return next;
        });
        typingTimeoutsRef.current.delete(payload.sender);
      }
    };

    const unsubscribe = socketManager.on('typing_update', handleTypingUpdate);

    return () => {
      unsubscribe?.();
      typingTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      typingTimeoutsRef.current.clear();
    };
  }, [currentUser]);

  return {
    typingUsers,
    isUserTyping: (username) => typingUsers.has(username),
    typingCount: typingUsers.size,
  };
}

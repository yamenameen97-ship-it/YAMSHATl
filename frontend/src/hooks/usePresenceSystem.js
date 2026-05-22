import { useCallback, useEffect, useRef, useState } from 'react';
import socketManager from '../services/socketManager.js';
import { getAuthToken, getCurrentUsername } from '../utils/auth.js';
import logger from '../utils/logger.js';

/**
 * usePresenceSystem Hook
 * 
 * نظام متقدم لتتبع الحضور (Presence) مع:
 * - تتبع حالة المستخدمين (Online/Offline)
 * - تتبع آخر وقت نشاط
 * - إدارة الأجهزة المتعددة
 * - معالجة الانقطاع والاتصال
 */
export function usePresenceSystem() {
  const [presenceMap, setPresenceMap] = useState(new Map());
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const currentUser = getCurrentUsername();
  const presenceTimeoutRef = useRef(new Map());
  const heartbeatIntervalRef = useRef(null);

  // تحديث حالة الحضور
  const updatePresence = useCallback((username, presenceData) => {
    if (!username) return;

    setPresenceMap(prev => {
      const next = new Map(prev);
      const current = next.get(username) || {};
      next.set(username, {
        ...current,
        ...presenceData,
        last_updated_at: new Date().toISOString(),
      });
      return next;
    });

    // تحديث قائمة المستخدمين النشطين
    if (presenceData.is_online) {
      setOnlineUsers(prev => new Set(prev).add(username));
    } else {
      setOnlineUsers(prev => {
        const next = new Set(prev);
        next.delete(username);
        return next;
      });
    }
  }, []);

  // معالج تحديثات الحضور من الخادم
  const handlePresenceUpdate = useCallback((payload) => {
    if (!payload?.user) return;

    // مسح Timeout السابق إن وجد
    if (presenceTimeoutRef.current.has(payload.user)) {
      clearTimeout(presenceTimeoutRef.current.get(payload.user));
    }

    updatePresence(payload.user, {
      is_online: Boolean(payload.is_online),
      last_seen: payload.last_seen,
      device_type: payload.device_type,
      platform: payload.platform,
    });

    // تعيين Timeout لتحديث آخر وقت نشاط
    if (!payload.is_online) {
      const timeout = setTimeout(() => {
        updatePresence(payload.user, { is_online: false });
        presenceTimeoutRef.current.delete(payload.user);
      }, 5000);
      presenceTimeoutRef.current.set(payload.user, timeout);
    }
  }, [updatePresence]);

  // إرسال Heartbeat للخادم
  const sendHeartbeat = useCallback(() => {
    if (!currentUser) return;
    try {
      socketManager.emit('presence_update', {
        user: currentUser,
        is_online: true,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.warn('Failed to send heartbeat', { error: error?.message });
    }
  }, [currentUser]);

  // طلب لقطة من حالات المستخدمين
  const requestPresenceSnapshot = useCallback((usernames = []) => {
    if (usernames.length === 0) return;
    try {
      socketManager.emit('presence_snapshot', {
        users: usernames.slice(0, 50), // حد أقصى 50 مستخدم
      });
    } catch (error) {
      logger.warn('Failed to request presence snapshot', { error: error?.message });
    }
  }, []);

  // إعداد المستمعين والـ Heartbeat
  useEffect(() => {
    if (!currentUser) return;

    // إرسال Heartbeat كل 30 ثانية
    heartbeatIntervalRef.current = setInterval(() => {
      sendHeartbeat();
    }, 30000);

    // إرسال Heartbeat أولي
    sendHeartbeat();

    const unsubscribe = socketManager.on('presence_update', handlePresenceUpdate);

    return () => {
      unsubscribe?.();
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, [currentUser, sendHeartbeat, handlePresenceUpdate]);

  // تنظيف عند الفصل
  useEffect(() => {
    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      presenceTimeoutRef.current.forEach(timeout => clearTimeout(timeout));
      presenceTimeoutRef.current.clear();
    };
  }, []);

  return {
    presenceMap,
    onlineUsers,
    isOnline: (username) => onlineUsers.has(username),
    getPresence: (username) => presenceMap.get(username),
    updatePresence,
    requestPresenceSnapshot,
    onlineCount: onlineUsers.size,
  };
}

/**
 * Hook لتتبع حالة المستخدم الحالي
 */
export function useCurrentUserPresence() {
  const [userPresence, setUserPresence] = useState({
    is_online: true,
    last_seen: new Date().toISOString(),
    device_type: 'browser',
    platform: 'web',
  });

  const currentUser = getCurrentUsername();
  const activityTimeoutRef = useRef(null);
  const inactivityTimeoutRef = useRef(null);

  // تحديث حالة النشاط
  const recordActivity = useCallback(() => {
    setUserPresence(prev => ({
      ...prev,
      last_seen: new Date().toISOString(),
    }));

    // مسح Timeout عدم النشاط السابق
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
    }

    // تعيين Timeout جديد لعدم النشاط (5 دقائق)
    inactivityTimeoutRef.current = setTimeout(() => {
      setUserPresence(prev => ({
        ...prev,
        is_online: false,
      }));
      
      try {
        socketManager.emit('presence_update', {
          user: currentUser,
          is_online: false,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        logger.warn('Failed to update presence', { error: error?.message });
      }
    }, 5 * 60 * 1000); // 5 minutes
  }, [currentUser]);

  // تسجيل أحداث النشاط
  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    
    events.forEach(event => {
      window.addEventListener(event, recordActivity);
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, recordActivity);
      });
      
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
      }
    };
  }, [recordActivity]);

  return {
    userPresence,
    recordActivity,
    setOnline: () => setUserPresence(prev => ({ ...prev, is_online: true })),
    setOffline: () => setUserPresence(prev => ({ ...prev, is_online: false })),
  };
}

/**
 * Hook لإدارة قائمة المستخدمين النشطين
 */
export function useActiveUsersList(limit = 50) {
  const [activeUsers, setActiveUsers] = useState([]);
  const { presenceMap, onlineUsers } = usePresenceSystem();

  useEffect(() => {
    const sorted = Array.from(onlineUsers)
      .map(username => ({
        username,
        ...presenceMap.get(username),
      }))
      .sort((a, b) => {
        const aTime = new Date(a.last_seen || 0).getTime();
        const bTime = new Date(b.last_seen || 0).getTime();
        return bTime - aTime;
      })
      .slice(0, limit);

    setActiveUsers(sorted);
  }, [presenceMap, onlineUsers, limit]);

  return activeUsers;
}

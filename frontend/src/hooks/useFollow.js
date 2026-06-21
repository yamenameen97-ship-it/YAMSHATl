import { useState, useCallback, useEffect, useRef } from 'react';
import {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  getMutualFriends,
  checkIsFollowing,
} from '../api/users.js';

/**
 * useFollow - Hook موحَّد لإدارة نظام المتابعة
 * v51 — إصلاح: زر "متابعة" لم يكن يتحول إلى "متابَع" بعد النقر بسبب إعادة
 *               تعيين الحالة من props كل re-render للأب. الحل: علم userInteracted
 *               يمنع props من الكتابة فوق الحالة المحلية بعد تفاعل المستخدم.
 *
 * @param {string} username
 * @param {object} options
 */
export default function useFollow(username, options = {}) {
  const {
    initialIsFollowing = false,
    initialFollowersCount = 0,
    initialFollowingCount = 0,
    autoCheck = true,
  } = options;

  const [isFollowing, setIsFollowing] = useState(Boolean(initialIsFollowing));
  const [followersCount, setFollowersCount] = useState(Number(initialFollowersCount) || 0);
  const [followingCount, setFollowingCount] = useState(Number(initialFollowingCount) || 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const inflightRef = useRef(false);
  // ✅ v51 FIX: علم تفاعل المستخدم — بعد ضغط الزر لا نسمح للـ props بتجاوز الحالة
  const userInteractedRef = useRef(false);
  const usernameRef = useRef(username);

  // عند تغيُّر المستخدم المستهدف، نُعيد ضبط علم التفاعل
  useEffect(() => {
    if (usernameRef.current !== username) {
      usernameRef.current = username;
      userInteractedRef.current = false;
    }
  }, [username]);

  // مزامنة القيم الافتراضية — تتجاهل إذا تفاعل المستخدم
  useEffect(() => {
    if (userInteractedRef.current) return;
    setFollowersCount(Number(initialFollowersCount) || 0);
  }, [initialFollowersCount]);

  useEffect(() => {
    if (userInteractedRef.current) return;
    setFollowingCount(Number(initialFollowingCount) || 0);
  }, [initialFollowingCount]);

  useEffect(() => {
    if (userInteractedRef.current) return;
    setIsFollowing(Boolean(initialIsFollowing));
  }, [initialIsFollowing]);

  // فحص حالة المتابعة عند تحميل الهوك
  useEffect(() => {
    if (!username || !autoCheck) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await checkIsFollowing(username);
        // ✅ v51 FIX: لا نتجاوز تفاعل المستخدم إذا ضغط الزر خلال فترة الفحص
        if (!cancelled && res?.data && !userInteractedRef.current) {
          if (typeof res.data.is_following === 'boolean') {
            setIsFollowing(res.data.is_following);
          }
          if (Number.isFinite(Number(res.data.followers_count))) {
            setFollowersCount(Number(res.data.followers_count));
          }
          if (Number.isFinite(Number(res.data.following_count))) {
            setFollowingCount(Number(res.data.following_count));
          }
        }
      } catch (e) {
        if (!cancelled) {
          // لا نعرض خطأ، الرجوع للقيم الافتراضية
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [username, autoCheck]);

  const toggleFollow = useCallback(async () => {
    if (!username || inflightRef.current) return;
    inflightRef.current = true;
    userInteractedRef.current = true; // ✅ v51: علامة تفاعل المستخدم
    setLoading(true);
    setError(null);

    // Optimistic update
    const previousState = isFollowing;
    const previousCount = followersCount;
    const nextState = !previousState;
    setIsFollowing(nextState);
    setFollowersCount((c) => Math.max(0, c + (nextState ? 1 : -1)));

    try {
      if (nextState) {
        await followUser(username);
      } else {
        await unfollowUser(username);
      }
      // ✅ v51: تثبيت الحالة بعد نجاح الـ API صراحةً
      setIsFollowing(nextState);
    } catch (err) {
      // إرجاع الحالة عند الفشل
      setIsFollowing(previousState);
      setFollowersCount(previousCount);
      setError(err?.message || 'تعذر تحديث المتابعة');
      throw err;
    } finally {
      inflightRef.current = false;
      setLoading(false);
    }
  }, [username, isFollowing, followersCount]);

  const follow = useCallback(async () => {
    if (isFollowing) return;
    return toggleFollow();
  }, [isFollowing, toggleFollow]);

  const unfollow = useCallback(async () => {
    if (!isFollowing) return;
    return toggleFollow();
  }, [isFollowing, toggleFollow]);

  return {
    isFollowing,
    followersCount,
    followingCount,
    loading,
    error,
    follow,
    unfollow,
    toggleFollow,
    setIsFollowing,
    setFollowersCount,
    setFollowingCount,
  };
}

/** Hook إضافي لجلب قائمة المتابعين/المتابَعين */
export function useFollowList(username, type = 'followers') {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async (params = {}) => {
    if (!username) return;
    setLoading(true);
    setError(null);
    try {
      const fn = type === 'followers' ? getFollowers
        : type === 'following' ? getFollowing
        : getMutualFriends;
      const res = await fn(username, params);
      const list = Array.isArray(res?.data) ? res.data
        : Array.isArray(res?.data?.items) ? res.data.items
        : Array.isArray(res?.data?.users) ? res.data.users
        : Array.isArray(res?.data?.followers) ? res.data.followers
        : Array.isArray(res?.data?.following) ? res.data.following
        : [];
      setItems(list);
      return list;
    } catch (err) {
      setError(err?.message || 'تعذر تحميل القائمة');
      setItems([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [username, type]);

  useEffect(() => {
    load();
  }, [load]);

  return { items, loading, error, reload: load };
}

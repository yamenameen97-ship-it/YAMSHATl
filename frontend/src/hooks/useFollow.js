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
 * useFollow - Hook ู…ูˆุญุฏ ู„ุฅุฏุงุฑุฉ ู†ุธุงู… ุงู„ู…ุชุงุจุนุฉ
 * ูŠุญู„ ู…ุดูƒู„ุฉ ุนุฏู… ุงุฑุชุจุงุท ุฒุฑ ุงู„ู…ุชุงุจุนุฉ ุจุงู„ู€ backend
 *
 * @param {string} username - ุงุณู… ุงู„ู…ุณุชุฎุฏู… ุงู„ู…ุณุชู‡ุฏู
 * @param {object} options - { initialIsFollowing, initialFollowersCount, initialFollowingCount }
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

  // ู…ุฒุงู…ู†ุฉ ุงู„ู‚ูŠู… ุงู„ุงูุชุฑุงุถูŠุฉ ุนู†ุฏ ุชุบูŠุฑู‡ุง
  useEffect(() => {
    setFollowersCount(Number(initialFollowersCount) || 0);
  }, [initialFollowersCount]);

  useEffect(() => {
    setFollowingCount(Number(initialFollowingCount) || 0);
  }, [initialFollowingCount]);

  useEffect(() => {
    setIsFollowing(Boolean(initialIsFollowing));
  }, [initialIsFollowing]);

  // ูุญุต ุญุงู„ุฉ ุงู„ู…ุชุงุจุนุฉ ุนู†ุฏ ุชุญู…ูŠู„ ุงู„ู‡ูˆูƒ
  useEffect(() => {
    if (!username || !autoCheck) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await checkIsFollowing(username);
        if (!cancelled && res?.data) {
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
          // ู„ุง ู†ุนุฑุถ ุฎุทุฃุŒ ุงู„ุฑุฌูˆุน ู„ู„ู‚ูŠู… ุงู„ุงูุชุฑุงุถูŠุฉ
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
    } catch (err) {
      // ุฅุฑุฌุงุน ุงู„ุญุงู„ุฉ ุนู†ุฏ ุงู„ูุดู„
      setIsFollowing(previousState);
      setFollowersCount(previousCount);
      setError(err?.message || 'ุชุนุฐุฑ ุชุญุฏูŠุซ ุงู„ู…ุชุงุจุนุฉ');
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

/** Hook ุฅุถุงููŠ ู„ุฌู„ุจ ู‚ุงุฆู…ุฉ ุงู„ู…ุชุงุจุนูŠู†/ุงู„ู…ุชุงุจูŽุนูŠู† */
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
      setError(err?.message || 'ุชุนุฐุฑ ุชุญู…ูŠู„ ุงู„ู‚ุงุฆู…ุฉ');
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

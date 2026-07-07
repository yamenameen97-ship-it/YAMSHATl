
import { create } from 'zustand';
import API from '../api/axios.js';

/**
 * v83.8 — socialStore: previously all reactions/follows/blocks lived only in memory
 *   (lost on refresh, not synced to any device). Now every mutator persists to the
 *   backend so state survives reloads and syncs across devices via the cloud DB.
 *   The local zustand cache remains as an optimistic UI mirror.
 */

const DEFAULT_REACTIONS = {
  like: 0,
  love: 0,
  wow: 0,
  angry: 0,
};

// Backend endpoints — all live in the cloud DB
const API_ENDPOINTS = {
  hydrate: '/users/social-state',                   // GET  → follows/blocks/mutes/closeFriends
  follow: (userId) => `/follow/${userId}`,          // POST
  unfollow: (userId) => `/follow/${userId}`,        // DELETE
  block: (userId) => `/users/${userId}/block`,      // POST
  mute: (userId) => `/users/${userId}/mute`,        // POST
  closeFriend: (userId) => `/users/${userId}/close-friend`, // POST toggle
  privacy: '/users/privacy',                        // PATCH
  reaction: (postId) => `/posts/${postId}/react`,   // POST { reaction_type }
};

const safeCall = async (fn, fallback = null) => {
  try {
    const { data } = await fn();
    return data ?? fallback;
  } catch (err) {
    // Non-fatal — keep optimistic UI but log for diagnostics.
    // eslint-disable-next-line no-console
    console.warn('[socialStore] API sync failed:', err?.response?.data?.detail || err?.message);
    return fallback;
  }
};

export const useSocialStore = create((set, get) => ({
  reactions: {},
  follows: {},
  privateAccounts: {},
  blocks: [],
  restrictedUsers: [],
  mutedUsers: [],
  closeFriends: [],
  hydrated: false,

  // v83.8: pull server-of-truth on login/app-boot so state matches other devices
  hydrateFromServer: async () => {
    if (get().hydrated) return;
    const data = await safeCall(() => API.get(API_ENDPOINTS.hydrate, { cache: false }), {});
    if (data && typeof data === 'object') {
      set({
        follows: data.follows || {},
        blocks: Array.isArray(data.blocks) ? data.blocks : [],
        mutedUsers: Array.isArray(data.muted_users) ? data.muted_users : [],
        closeFriends: Array.isArray(data.close_friends) ? data.close_friends : [],
        restrictedUsers: Array.isArray(data.restricted_users) ? data.restricted_users : [],
        privateAccounts: data.private_accounts || {},
        hydrated: true,
      });
    } else {
      set({ hydrated: true });
    }
  },

  toggleReaction: async (postId, reactionType) => {
    const current = get().reactions[postId] || { active: null, counters: { ...DEFAULT_REACTIONS }, history: [] };
    const nextCounters = { ...current.counters };

    if (current.active) {
      nextCounters[current.active] = Math.max(0, nextCounters[current.active] - 1);
    }

    const nextReaction = current.active === reactionType ? null : reactionType;

    if (nextReaction) {
      nextCounters[nextReaction] += 1;
    }

    // Optimistic UI first
    set({
      reactions: {
        ...get().reactions,
        [postId]: {
          active: nextReaction,
          counters: nextCounters,
          updatedAt: Date.now(),
          history: [...current.history, { reactionType: nextReaction, at: Date.now() }],
        },
      },
    });

    // Cloud persistence
    await safeCall(() => API.post(API_ENDPOINTS.reaction(postId), { reaction_type: nextReaction }));
  },

  undoReaction: async (postId) => {
    const current = get().reactions[postId];
    if (!current?.active) return;

    set({
      reactions: {
        ...get().reactions,
        [postId]: {
          ...current,
          counters: {
            ...current.counters,
            [current.active]: Math.max(0, current.counters[current.active] - 1),
          },
          active: null,
        },
      },
    });
    await safeCall(() => API.post(API_ENDPOINTS.reaction(postId), { reaction_type: null }));
  },

  followUser: async (userId, category = 'default') => {
    set({
      follows: {
        ...get().follows,
        [userId]: {
          following: true,
          category,
          requestedAt: Date.now(),
        },
      },
    });
    await safeCall(() => API.post(API_ENDPOINTS.follow(userId), { category }));
  },

  unfollowUser: async (userId) => {
    const follows = { ...get().follows };
    delete follows[userId];
    set({ follows });
    await safeCall(() => API.delete(API_ENDPOINTS.unfollow(userId)));
  },

  togglePrivateAccount: async (userId) => {
    const next = !get().privateAccounts[userId];
    set({
      privateAccounts: {
        ...get().privateAccounts,
        [userId]: next,
      },
    });
    await safeCall(() => API.patch(API_ENDPOINTS.privacy, { user_id: userId, is_private: next }));
  },

  blockUser: async (userId) => {
    set({ blocks: [...new Set([...get().blocks, userId])] });
    await safeCall(() => API.post(API_ENDPOINTS.block(userId)));
  },

  restrictUser: async (userId) => {
    set({ restrictedUsers: [...new Set([...get().restrictedUsers, userId])] });
    await safeCall(() => API.post(`/users/${userId}/restrict`));
  },

  muteUser: async (userId) => {
    set({ mutedUsers: [...new Set([...get().mutedUsers, userId])] });
    await safeCall(() => API.post(API_ENDPOINTS.mute(userId)));
  },

  addCloseFriend: async (userId) => {
    set({ closeFriends: [...new Set([...get().closeFriends, userId])] });
    await safeCall(() => API.post(API_ENDPOINTS.closeFriend(userId)));
  },
}));

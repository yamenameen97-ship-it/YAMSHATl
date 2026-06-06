
import { create } from 'zustand';

const DEFAULT_REACTIONS = {
  like: 0,
  love: 0,
  wow: 0,
  angry: 0,
};

export const useSocialStore = create((set, get) => ({
  reactions: {},
  follows: {},
  privateAccounts: {},
  blocks: [],
  restrictedUsers: [],
  mutedUsers: [],
  closeFriends: [],
  toggleReaction: (postId, reactionType) => {
    const current = get().reactions[postId] || { active: null, counters: { ...DEFAULT_REACTIONS }, history: [] };
    const nextCounters = { ...current.counters };

    if (current.active) {
      nextCounters[current.active] = Math.max(0, nextCounters[current.active] - 1);
    }

    const nextReaction = current.active === reactionType ? null : reactionType;

    if (nextReaction) {
      nextCounters[nextReaction] += 1;
    }

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
  },
  undoReaction: (postId) => {
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
  },
  followUser: (userId, category = 'default') => {
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
  },
  unfollowUser: (userId) => {
    const follows = { ...get().follows };
    delete follows[userId];
    set({ follows });
  },
  togglePrivateAccount: (userId) => {
    set({
      privateAccounts: {
        ...get().privateAccounts,
        [userId]: !get().privateAccounts[userId],
      },
    });
  },
  blockUser: (userId) => set({ blocks: [...new Set([...get().blocks, userId])] }),
  restrictUser: (userId) => set({ restrictedUsers: [...new Set([...get().restrictedUsers, userId])] }),
  muteUser: (userId) => set({ mutedUsers: [...new Set([...get().mutedUsers, userId])] }),
  addCloseFriend: (userId) => set({ closeFriends: [...new Set([...get().closeFriends, userId])] }),
}));

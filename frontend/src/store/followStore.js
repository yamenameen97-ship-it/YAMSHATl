import { create } from 'zustand';

export const useFollowStore = create((set) => ({
  following: [],
  blockedUsers: [],
  mutedUsers: [],

  followUser: (userId) =>
    set((state) => ({
      following: [...state.following, userId],
    })),

  unfollowUser: (userId) =>
    set((state) => ({
      following: state.following.filter((id) => id !== userId),
    })),

  muteUser: (userId) =>
    set((state) => ({
      mutedUsers: [...state.mutedUsers, userId],
    })),

  blockUser: (userId) =>
    set((state) => ({
      blockedUsers: [...state.blockedUsers, userId],
    })),
}));
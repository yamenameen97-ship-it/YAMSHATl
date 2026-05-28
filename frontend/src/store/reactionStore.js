import { create } from 'zustand';

export const useReactionStore = create((set) => ({
  reactions: {},

  toggleReaction: (postId, reaction) =>
    set((state) => ({
      reactions: {
        ...state.reactions,
        [postId]: reaction,
      },
    })),

  removeReaction: (postId) =>
    set((state) => {
      const copy = { ...state.reactions };
      delete copy[postId];
      return { reactions: copy };
    }),
}));
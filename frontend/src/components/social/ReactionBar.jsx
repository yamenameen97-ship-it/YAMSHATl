
import { motion } from 'framer-motion';
import { useSocialStore } from '../../store/socialStore.js';

const REACTIONS = [
  { id: 'like', emoji: '👍' },
  { id: 'love', emoji: '❤️' },
  { id: 'wow', emoji: '😮' },
  { id: 'angry', emoji: '😡' },
];

export default function ReactionBar({ postId }) {
  const reactionState = useSocialStore((state) => state.reactions[postId]);
  const toggleReaction = useSocialStore((state) => state.toggleReaction);
  const undoReaction = useSocialStore((state) => state.undoReaction);

  return (
    <div className="flex flex-col gap-3 rounded-3xl bg-[#151521] p-4">
      <div className="flex items-center gap-2 flex-wrap">
        {REACTIONS.map((reaction) => (
          <motion.button
            whileTap={{ scale: 1.15 }}
            whileHover={{ scale: 1.05 }}
            key={reaction.id}
            onClick={() => toggleReaction(postId, reaction.id)}
            className={`rounded-full px-4 py-2 text-lg transition ${
              reactionState?.active === reaction.id ? 'bg-pink-500/20 border border-pink-400' : 'bg-white/5'
            }`}
          >
            {reaction.emoji}
          </motion.button>
        ))}

        <button
          onClick={() => undoReaction(postId)}
          className="rounded-full border border-white/10 px-3 py-2 text-xs text-white/70"
        >
          تراجع
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm text-white/80">
        {REACTIONS.map((reaction) => (
          <div key={reaction.id} className="flex items-center justify-between rounded-2xl bg-black/20 px-3 py-2">
            <span>{reaction.emoji}</span>
            <span>{reactionState?.counters?.[reaction.id] || 0}</span>
          </div>
        ))}
      </div>

      <div className="text-xs text-white/50">
        realtime reactions • analytics • who reacted list
      </div>
    </div>
  );
}

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface ReactionPickerProps {
  onSelect: (reaction: "like" | "love" | "haha" | "wow" | "sad" | "angry") => void;
  onClose: () => void;
}

const reactions = [
  { type: "like" as const, emoji: "👍", label: "إعجاب" },
  { type: "love" as const, emoji: "❤️", label: "حب" },
  { type: "haha" as const, emoji: "😆", label: "ضحك" },
  { type: "wow" as const, emoji: "😮", label: "مفاجأة" },
  { type: "sad" as const, emoji: "😢", label: "حزن" },
  { type: "angry" as const, emoji: "😡", label: "غضب" },
];

export default function ReactionPicker({ onSelect, onClose }: ReactionPickerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="absolute bottom-full left-0 mb-2 bg-slate-800 border border-slate-700 rounded-lg p-2 flex gap-2 shadow-lg"
    >
      {reactions.map((reaction) => (
        <motion.button
          key={reaction.type}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onSelect(reaction.type)}
          className="text-2xl hover:bg-slate-700 p-2 rounded transition-colors"
          title={reaction.label}
        >
          {reaction.emoji}
        </motion.button>
      ))}
    </motion.div>
  );
}

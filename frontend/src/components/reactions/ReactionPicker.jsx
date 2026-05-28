import React from 'react';

const reactions = ['👍', '❤️', '😮', '😡'];

export default function ReactionPicker({ onSelect }) {
  return (
    <div className="flex gap-2 p-2 bg-white rounded-xl shadow">
      {reactions.map((reaction) => (
        <button
          key={reaction}
          onClick={() => onSelect(reaction)}
          className="text-2xl hover:scale-125 transition"
        >
          {reaction}
        </button>
      ))}
    </div>
  );
}
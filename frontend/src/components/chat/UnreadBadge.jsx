import React from 'react';

export default function UnreadBadge({ count }) {
  if (!count) return null;

  return (
    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
      {count}
    </span>
  );
}
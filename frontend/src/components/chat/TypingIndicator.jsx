import React from 'react';

export default function TypingIndicator({ username }) {
  return (
    <div className="text-sm opacity-70 animate-pulse">
      {username} is typing...
    </div>
  );
}
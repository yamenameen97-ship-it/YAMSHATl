import React from 'react';

const PostSkeleton = () => (
  <div className="post-skeleton" style={{
    background: 'var(--bg-card)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    border: '1px solid var(--line)',
    animation: 'pulse 1.5s infinite ease-in-out'
  }}>
    <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
      <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--line)' }} />
      <div style={{ flex: 1 }}>
        <div style={{ width: '40%', height: 14, background: 'var(--line)', borderRadius: 4, marginBottom: 8 }} />
        <div style={{ width: '20%', height: 10, background: 'var(--line)', borderRadius: 4 }} />
      </div>
    </div>
    <div style={{ width: '100%', height: 12, background: 'var(--line)', borderRadius: 4, marginBottom: 8 }} />
    <div style={{ width: '90%', height: 12, background: 'var(--line)', borderRadius: 4, marginBottom: 8 }} />
    <div style={{ width: '60%', height: 12, background: 'var(--line)', borderRadius: 4, marginBottom: 16 }} />
    <div style={{ width: '100%', height: 300, background: 'var(--line)', borderRadius: 12 }} />
    
    <style>{`
      @keyframes pulse {
        0% { opacity: 0.6; }
        50% { opacity: 1; }
        100% { opacity: 0.6; }
      }
    `}</style>
  </div>
);

export default function FeedSkeleton({ count = 3 }) {
  return (
    <div className="feed-skeleton">
      {Array.from({ length: count }).map((_, i) => (
        <PostSkeleton key={i} />
      ))}
    </div>
  );
}

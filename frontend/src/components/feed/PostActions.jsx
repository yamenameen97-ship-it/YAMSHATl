import { useMemo, useState } from 'react';

const DEFAULT_REACTIONS = {
  like: 0,
  love: 0,
  fire: 0,
};

export default function PostActions({
  post = {},
  onLike,
  onSave,
  onShare,
  onReport,
}) {
  const [liked, setLiked] = useState(Boolean(post?.isLiked));
  const [saved, setSaved] = useState(Boolean(post?.isSaved));
  const [reactions, setReactions] = useState({
    ...DEFAULT_REACTIONS,
    ...(post?.reactions || {}),
  });

  const totalReactions = useMemo(
    () => Object.values(reactions).reduce((sum, value) => sum + Number(value || 0), 0),
    [reactions],
  );

  const toggleLike = () => {
    setLiked((prev) => !prev);
    setReactions((prev) => ({
      ...prev,
      like: Math.max(0, Number(prev.like || 0) + (liked ? -1 : 1)),
    }));
    onLike?.(!liked);
  };

  const toggleSave = () => {
    setSaved((prev) => !prev);
    onSave?.(!saved);
  };

  const handleShare = async () => {
    const sharePayload = {
      title: post?.author || 'Yamshat Post',
      text: post?.content || 'شاهد هذا المنشور',
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(sharePayload);
      } else {
        await navigator.clipboard.writeText(sharePayload.url);
      }
      onShare?.();
    } catch {
      // تجاهل أخطاء الإلغاء
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      alert('تم نسخ رابط المنشور');
    } catch {
      alert('فشل نسخ الرابط');
    }
  };

  return (
    <div
      className="feed-post-actions"
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 10,
        marginTop: 14,
        flexWrap: 'wrap',
        alignItems: 'center',
      }}
    >
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type="button" className={`action-btn ${liked ? 'active' : ''}`} onClick={toggleLike}>
          {liked ? '💙' : '🤍'} إعجاب {totalReactions > 0 ? `(${totalReactions})` : ''}
        </button>

        <button type="button" className={`action-btn ${saved ? 'active' : ''}`} onClick={toggleSave}>
          {saved ? '🔖 محفوظ' : '📌 حفظ'}
        </button>

        <button type="button" className="action-btn" onClick={handleShare}>
          📤 مشاركة
        </button>

        <button type="button" className="action-btn" onClick={handleCopy}>
          🔗 نسخ الرابط
        </button>

        <button type="button" className="action-btn danger" onClick={() => onReport?.()}>
          🚨 إبلاغ
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <button
          type="button"
          className="reaction-chip"
          onClick={() => setReactions((prev) => ({ ...prev, love: Number(prev.love || 0) + 1 }))}
        >
          ❤️ {reactions.love || 0}
        </button>

        <button
          type="button"
          className="reaction-chip"
          onClick={() => setReactions((prev) => ({ ...prev, fire: Number(prev.fire || 0) + 1 }))}
        >
          🔥 {reactions.fire || 0}
        </button>
      </div>
    </div>
  );
}

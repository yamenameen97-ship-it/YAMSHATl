import { useMemo, useState, useCallback } from 'react';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';

const EMOJIS = ['😀', '😂', '😍', '🔥', '👏', '🎉', '❤️', '🙌', '✨', '💯'];

export default function NestedComments({ comments = [], onAddComment }) {
  const [commentText, setCommentText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [sortBy, setSortBy] = useState('newest'); // newest, popular, controversial

  const sortedComments = useMemo(() => {
    const items = [...comments];
    if (sortBy === 'newest') return items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    if (sortBy === 'popular') return items.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    return items;
  }, [comments, sortBy]);

  const handleAddEmoji = (emoji) => {
    setCommentText(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleSelectGif = (gifUrl) => {
    onAddComment({ content: gifUrl, type: 'gif' });
    setShowGifPicker(false);
  };

  return (
    <div className="comments-section" style={{ marginTop: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h4 style={{ margin: 0 }}>التعليقات ({comments.length})</h4>
        <select 
          value={sortBy} 
          onChange={(e) => setSortBy(e.target.value)}
          style={{ background: '#222', color: 'white', border: '1px solid #444', padding: '4px 8px', borderRadius: 4 }}
        >
          <option value="newest">الأحدث</option>
          <option value="popular">الأكثر تفاعلاً</option>
          <option value="controversial">المثير للجدل</option>
        </select>
      </div>

      {/* Comment Input */}
      <div style={{ marginBottom: 24, position: 'relative' }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <textarea
            placeholder="اكتب تعليقاً... (يخضع للرقابة الآلية)"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid #333',
              borderRadius: 12,
              padding: 12,
              color: 'white',
              minHeight: 60,
              resize: 'none'
            }}
          />
          <Button 
            onClick={() => { onAddComment({ content: commentText }); setCommentText(''); }}
            disabled={!commentText.trim()}
          >
            نشر
          </Button>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button 
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}
            title="إضافة إيموجي"
          >
            😊
          </button>
          <button 
            onClick={() => setShowGifPicker(!showGifPicker)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}
            title="إضافة GIF"
          >
            🖼️ GIF
          </button>
        </div>

        {showEmojiPicker && (
          <div style={{
            position: 'absolute',
            bottom: '100%',
            left: 0,
            background: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: 12,
            padding: 10,
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 8,
            zIndex: 10,
            marginBottom: 8
          }}>
            {EMOJIS.map(e => (
              <button key={e} onClick={() => handleAddEmoji(e)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>
                {e}
              </button>
            ))}
          </div>
        )}

        {showGifPicker && (
          <div style={{
            position: 'absolute',
            bottom: '100%',
            left: 0,
            background: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: 12,
            padding: 12,
            width: 250,
            zIndex: 10,
            marginBottom: 8
          }}>
            <div style={{ fontSize: 14, marginBottom: 8, fontWeight: 'bold' }}>GIFs الشائعة</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {['https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJqZ3R4Z3R4Z3R4Z3R4Z3R4Z3R4Z3R4Z3R4Z3R4Z3R4JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/3o7TKQN7vTfTHP9X8I/giphy.gif', 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJqZ3R4Z3R4Z3R4Z3R4Z3R4Z3R4Z3R4Z3R4Z3R4Z3R4JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/l0HlHFRbmaZtBRhXG/giphy.gif'].map((url, i) => (
                <img 
                  key={i} 
                  src={url} 
                  alt="gif" 
                  style={{ width: '100%', borderRadius: 4, cursor: 'pointer' }} 
                  onClick={() => handleSelectGif(url)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Comments List */}
      <div style={{ display: 'grid', gap: 16 }}>
        {sortedComments.map(comment => (
          <div key={comment.id} style={{ display: 'flex', gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#444', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px 14px', borderRadius: 16 }}>
                <div style={{ fontWeight: 'bold', fontSize: 13, marginBottom: 2 }}>{comment.username}</div>
                <div style={{ fontSize: 14 }}>
                  {comment.type === 'gif' ? (
                    <img src={comment.content} alt="gif comment" style={{ maxWidth: '100%', borderRadius: 8, marginTop: 4 }} />
                  ) : (
                    comment.content
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 16, marginTop: 4, paddingRight: 8, fontSize: 12 }} className="muted">
                <span>{new Date(comment.created_at).toLocaleString('ar-EG')}</span>
                <button style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>إعجاب</button>
                <button style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>رد</button>
                {comment.is_flagged && <span style={{ color: '#ff4444' }}>⚠️ تم الإبلاغ (قيد المراجعة)</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

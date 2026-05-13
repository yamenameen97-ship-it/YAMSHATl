import { useState, useEffect } from 'react';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import { useRealtime } from '../../hooks/realtime/useRealtime.js';

export default function AdminPosts() {
  const [posts, setPosts] = useState([
    { id: 1, author: 'user_1', content: 'هذا منشور تجريبي للمراجعة', aiScore: 0.1, status: 'approved', flags: 0 },
    { id: 2, author: 'spammer_99', content: 'اربح المال بسرعة من خلال هذا الرابط...', aiScore: 0.95, status: 'auto-flagged', flags: 3 },
    { id: 3, author: 'user_42', content: 'محتوى قد يحتوي على كلمات غير لائقة', aiScore: 0.72, status: 'pending', flags: 1 },
  ]);

  const [autoModeration, setAutoModeration] = useState(true);

  // Realtime Auto-flagging simulation
  useRealtime('new_post_moderation', (data) => {
    if (autoModeration) {
      const newPost = {
        ...data,
        status: data.aiScore > 0.9 ? 'auto-blocked' : data.aiScore > 0.7 ? 'auto-flagged' : 'approved'
      };
      setPosts(prev => [newPost, ...prev]);
    }
  });

  const handleAIScan = (postId) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, status: 'scanning...' } : p));
    setTimeout(() => {
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, status: 'ai-reviewed', aiScore: Math.random().toFixed(2) } : p));
    }, 1500);
  };

  return (
    <div className="admin-posts-page">
      <Card className="moderation-controls">
        <div className="flex-between">
          <div>
            <h2>إدارة المحتوى (AI Moderation)</h2>
            <p className="muted">التحكم في المنشورات باستخدام الذكاء الاصطناعي وقواعد الأتمتة.</p>
          </div>
          <div className="automation-toggle">
            <label className="switch-label">
              <span>الأتمتة الذكية:</span>
              <button 
                className={`toggle-btn ${autoModeration ? 'on' : 'off'}`}
                onClick={() => setAutoModeration(!autoModeration)}
              >
                {autoModeration ? 'مفعلة' : 'معطلة'}
              </button>
            </label>
          </div>
        </div>

        <div className="rules-grid mt-4">
          <div className="rule-chip">حظر تلقائي (AI > 0.9)</div>
          <div className="rule-chip">تبليغ تلقائي (AI > 0.7)</div>
          <div className="rule-chip">كلمات محظورة (Regex)</div>
        </div>
      </Card>

      <div className="posts-moderation-grid mt-4">
        {posts.map(post => (
          <Card key={post.id} className={`post-mod-card ${post.status}`}>
            <div className="post-mod-header">
              <span className="author">@{post.author}</span>
              <div className={`ai-score-badge ${post.aiScore > 0.7 ? 'danger' : 'safe'}`}>
                AI Score: {post.aiScore}
              </div>
            </div>
            <div className="post-content-preview">{post.content}</div>
            <div className="post-mod-footer">
              <div className="status-info">
                <span className="status-label">الحالة: {post.status}</span>
                {post.flags > 0 && <span className="flags-count">🚩 {post.flags} بلاغات</span>}
              </div>
              <div className="actions">
                <Button size="small" variant="secondary" onClick={() => handleAIScan(post.id)}>فحص AI</Button>
                <Button size="small" variant="danger">حذف</Button>
                <Button size="small" variant="primary">موافقة</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .admin-posts-page { padding: 20px; }
        .switch-label { display: flex; align-items: center; gap: 10px; font-weight: bold; }
        .toggle-btn { padding: 5px 15px; border-radius: 20px; border: none; cursor: pointer; transition: all 0.3s; }
        .toggle-btn.on { background: #10b981; color: white; }
        .toggle-btn.off { background: #94a3b8; color: white; }
        .rules-grid { display: flex; gap: 10px; }
        .rule-chip { background: #f1f5f9; padding: 4px 12px; border-radius: 15px; font-size: 12px; color: #475569; border: 1px solid #e2e8f0; }
        .posts-moderation-grid { display: grid; grid-template-columns: 1fr; gap: 15px; }
        .post-mod-card { border-right: 4px solid #e2e8f0; }
        .post-mod-card.auto-blocked { border-right-color: #ef4444; background: #fffafb; }
        .post-mod-card.auto-flagged { border-right-color: #f59e0b; }
        .post-mod-card.approved { border-right-color: #10b981; }
        .post-mod-header { display: flex; justify-content: space-between; margin-bottom: 10px; }
        .author { font-weight: bold; color: #3b82f6; }
        .ai-score-badge { font-size: 11px; padding: 2px 8px; border-radius: 10px; font-weight: bold; }
        .ai-score-badge.danger { background: #fee2e2; color: #991b1b; }
        .ai-score-badge.safe { background: #dcfce7; color: #166534; }
        .post-content-preview { font-size: 14px; margin-bottom: 15px; color: #334155; }
        .post-mod-footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #f1f5f9; padding-top: 10px; }
        .status-info { display: flex; gap: 15px; font-size: 12px; }
        .flags-count { color: #ef4444; font-weight: bold; }
        .actions { display: flex; gap: 8px; }
      `}} />
    </div>
  );
}

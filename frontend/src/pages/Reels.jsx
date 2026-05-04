import { useEffect, useMemo, useState } from 'react';
import MainLayout from '../components/layout/MainLayout.jsx';
import Card from '../components/ui/Card.jsx';
import { getPosts } from '../api/posts.js';

const isVideo = (value) => /\.(mp4|mov|webm|mkv)$/i.test(String(value || ''));

export default function Reels() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const { data } = await getPosts();
        setPosts(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err?.response?.data?.message || 'تعذر تحميل الريلز.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const reels = useMemo(() => posts.filter((post) => isVideo(post.media || post.image_url)), [posts]);

  return (
    <MainLayout>
      <div className="section-head">
        <div>
          <h3 className="section-title">🎬 الريلز</h3>
          <p className="muted">عرض الفيديوهات المنشورة داخل الشبكة في صفحة مستقلة.</p>
        </div>
      </div>

      {error ? <div className="alert error">{error}</div> : null}
      {loading ? <div className="empty-state">جارٍ تحميل الريلز...</div> : null}
      {!loading && reels.length === 0 ? <div className="empty-state">لا توجد فيديوهات منشورة حالياً.</div> : null}

      <div className="feed-stack">
        {reels.map((post) => (
          <Card key={post.id} className="post-card">
            <div className="post-head">
              <div>
                <strong>{post.username}</strong>
                <div className="muted">{post.created_at ? new Date(post.created_at).toLocaleString('ar-EG') : 'الآن'}</div>
              </div>
              <div className="glass-chip">❤️ {post.likes || post.like_count || 0}</div>
            </div>
            {post.content ? <p className="post-text">{post.content}</p> : null}
            <video className="post-media" src={post.media || post.image_url} controls playsInline />
          </Card>
        ))}
      </div>
    </MainLayout>
  );
}

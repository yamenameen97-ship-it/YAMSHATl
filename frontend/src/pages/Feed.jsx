import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import MainLayout from '../components/layout/MainLayout.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Modal from '../components/ui/Modal.jsx';
import EmptyState from '../components/feedback/EmptyState.jsx';
import ErrorState from '../components/feedback/ErrorState.jsx';
import { FeedSkeleton } from '../components/feedback/Skeleton.jsx';
import PostCard from '../components/feed/PostCard.jsx';
import { useToast } from '../components/admin/ToastProvider.jsx';
import {
  createPost,
  getDraftPosts,
  getPosts,
  getScheduledPosts,
  getPostAnalytics,
  getRecommendedPosts
} from '../api/posts.js';
import { getUsers } from '../api/users.js';
import { getCurrentUsername } from '../utils/auth.js';

export default function Feed() {
  const { pushToast } = useToast();
  const currentUser = getCurrentUsername();
  
  const [activeTab, setActiveTab] = useState('feed'); // feed, recommended, scheduled, drafts
  const [editorContent, setEditorContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [analyticsPost, setAnalyticsPost] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['feed-data', activeTab, currentUser],
    queryFn: async () => {
      let postsData = [];
      if (activeTab === 'feed') {
        const res = await getPosts();
        postsData = res.data;
      } else if (activeTab === 'recommended') {
        const res = await getRecommendedPosts();
        postsData = res.data;
      } else if (activeTab === 'scheduled') {
        const res = await getScheduledPosts();
        postsData = res.data;
      } else if (activeTab === 'drafts') {
        const res = await getDraftPosts();
        postsData = res.data;
      }
      return postsData || [];
    }
  });

  const handleCreatePost = async (status = 'published') => {
    if (!editorContent.trim()) return;
    
    setIsSubmitting(true);
    try {
      // AI Moderation Hook Simulation
      const isSafe = !editorContent.toLowerCase().includes('badword');
      if (!isSafe) {
        pushToast({ type: 'error', message: 'تم رفض المنشور بواسطة نظام الرقابة الذكي لمخالفته السياسات.' });
        setIsSubmitting(false);
        return;
      }

      await createPost({
        content: editorContent,
        status: status,
        scheduled_at: status === 'scheduled' ? scheduledDate : null
      });

      pushToast({ 
        type: 'success', 
        message: status === 'published' ? 'تم النشر بنجاح!' : status === 'draft' ? 'تم حفظ المسودة' : 'تم جدولة المنشور' 
      });
      setEditorContent('');
      setShowScheduler(false);
      refetch();
    } catch (err) {
      pushToast({ type: 'error', message: 'فشل تنفيذ العملية' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAnalytics = (post) => {
    setAnalyticsPost(post);
    setShowAnalytics(true);
  };

  return (
    <MainLayout>
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '20px 10px' }}>
        
        {/* Composer */}
        <Card style={{ marginBottom: 24, padding: 20 }}>
          <textarea
            placeholder="ماذا يدور في ذهنك؟ (استخدم AI للتحقق من المحتوى تلقائياً)"
            value={editorContent}
            onChange={(e) => setEditorContent(e.target.value)}
            style={{
              width: '100%',
              minHeight: 100,
              background: 'transparent',
              border: 'none',
              color: 'white',
              fontSize: 18,
              resize: 'none',
              outline: 'none'
            }}
          />
          
          {showScheduler && (
            <div style={{ marginTop: 12, padding: 12, background: 'rgba(255,255,255,0.05)', borderRadius: 8 }}>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 14 }}>اختر وقت الجدولة:</label>
              <input 
                type="datetime-local" 
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                style={{ background: '#222', color: 'white', border: '1px solid #444', padding: 8, borderRadius: 4 }}
              />
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="secondary" onClick={() => handleCreatePost('draft')} disabled={isSubmitting}>
                حفظ كمسودة
              </Button>
              <Button variant="secondary" onClick={() => setShowScheduler(!showScheduler)}>
                {showScheduler ? 'إلغاء الجدولة' : 'جدولة المنشور'}
              </Button>
            </div>
            <Button 
              onClick={() => handleCreatePost(showScheduler ? 'scheduled' : 'published')} 
              loading={isSubmitting}
              disabled={!editorContent.trim()}
            >
              {showScheduler ? 'تأكيد الجدولة' : 'نشر الآن'}
            </Button>
          </div>
        </Card>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, overflowX: 'auto', paddingBottom: 8 }}>
          {[
            { id: 'feed', label: 'الرئيسية', icon: '🏠' },
            { id: 'recommended', label: 'اقتراحات ذكية', icon: '✨' },
            { id: 'scheduled', label: 'المجدولة', icon: '📅' },
            { id: 'drafts', label: 'المسودات', icon: '📝' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '8px 16px',
                borderRadius: 20,
                background: activeTab === tab.id ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.2s'
              }}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Feed Content */}
        {isLoading ? (
          <FeedSkeleton />
        ) : isError ? (
          <ErrorState onRetry={refetch} />
        ) : data.length === 0 ? (
          <EmptyState title="لا توجد منشورات هنا بعد" />
        ) : (
          <div style={{ display: 'grid', gap: 20 }}>
            {data.map(post => (
              <PostCard 
                key={post.id} 
                post={post} 
                onShowAnalytics={() => openAnalytics(post)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Advanced Analytics Modal */}
      <Modal 
        isOpen={showAnalytics} 
        onClose={() => setShowAnalytics(false)}
        title="تحليلات المنشور المتقدمة"
      >
        {analyticsPost && (
          <div style={{ padding: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 24 }}>
              <div style={{ padding: 16, background: 'rgba(255,255,255,0.05)', borderRadius: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 'bold', color: 'var(--primary)' }}>{analyticsPost.views_count || 0}</div>
                <div className="muted">المشاهدات</div>
              </div>
              <div style={{ padding: 16, background: 'rgba(255,255,255,0.05)', borderRadius: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 'bold', color: '#44ff44' }}>{analyticsPost.reach_count || 0}</div>
                <div className="muted">الوصول</div>
              </div>
              <div style={{ padding: 16, background: 'rgba(255,255,255,0.05)', borderRadius: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 'bold', color: '#ffaa00' }}>{analyticsPost.engagement_rate || '0%'}</div>
                <div className="muted">معدل التفاعل</div>
              </div>
              <div style={{ padding: 16, background: 'rgba(255,255,255,0.05)', borderRadius: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 'bold', color: '#00ccff' }}>{analyticsPost.shares_count || 0}</div>
                <div className="muted">المشاركات</div>
              </div>
            </div>
            
            <h4>توزيع التفاعلات</h4>
            <div style={{ height: 10, background: 'rgba(255,255,255,0.1)', borderRadius: 5, marginTop: 12, overflow: 'hidden', display: 'flex' }}>
              <div style={{ width: '60%', background: 'red' }} title="حب"></div>
              <div style={{ width: '20%', background: 'yellow' }} title="ضحك"></div>
              <div style={{ width: '20%', background: 'blue' }} title="إعجاب"></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12 }} className="muted">
              <span>❤️ 60%</span>
              <span>😂 20%</span>
              <span>👍 20%</span>
            </div>
          </div>
        )}
      </Modal>
    </MainLayout>
  );
}

import { useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import MainLayout from '../components/layout/MainLayout.jsx';
import PostComposer from '../components/feed/PostComposer.jsx';
import PostCard from '../components/feed/PostCard.jsx';
import Button from '../components/ui/Button.jsx';
import { useFeed } from '../hooks/useFeed.js';
import { likePost } from '../api/posts.js';
import { getCurrentUsername } from '../utils/auth.js';

function extractTrendingTopics(posts) {
  const counts = new Map();
  posts.forEach((post) => {
    const matches = String(post?.content || '').match(/#[\p{L}\p{N}_-]+/gu) || [];
    matches.forEach((tag) => counts.set(tag, (counts.get(tag) || 0) + 1));
  });

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag, count]) => ({ tag, count }));
}

function buildSuggestions(posts, currentUser) {
  const users = new Map();
  posts.forEach((post) => {
    const username = post?.username || post?.user?.username;
    if (!username || username === currentUser || users.has(username)) return;
    users.set(username, {
      username,
      bio: post?.content || 'صاحب محتوى نشط على يمشات.',
    });
  });
  return Array.from(users.values()).slice(0, 4);
}

export default function Feed() {
  const currentUser = getCurrentUsername();
  const queryClient = useQueryClient();
  const {
    posts,
    isLoading,
    isError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refetch,
  } = useFeed({ limit: 10 });

  const likeMutation = useMutation({
    mutationFn: likePost,
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ['feed-data'] });
      const previousData = queryClient.getQueryData(['feed-data', 'all', 'latest']);
      queryClient.setQueriesData({ queryKey: ['feed-data'] }, (old) => {
        if (!old?.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page) =>
            page.map((post) => post.id === postId
              ? {
                  ...post,
                  is_liked: !post.is_liked,
                  likes_count: post.is_liked ? Math.max(0, Number(post.likes_count || 0) - 1) : Number(post.likes_count || 0) + 1,
                }
              : post),
          ),
        };
      });
      return { previousData };
    },
    onError: (_error, _postId, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['feed-data', 'all', 'latest'], context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['feed-data'] });
    },
  });

  const trending = useMemo(() => extractTrendingTopics(posts), [posts]);
  const suggestions = useMemo(() => buildSuggestions(posts, currentUser), [posts, currentUser]);

  return (
    <MainLayout>
      <div className="yam-page yam-page-wide">
        <div className="yam-hero" style={{ marginBottom: 22 }}>
          <div className="yam-toolbar" style={{ marginBottom: 0 }}>
            <div>
              <div className="yam-badge primary" style={{ marginBottom: 12 }}>✨ الواجهة الجديدة للفيد</div>
              <h1 className="yam-section-title">الفيد الرئيسي</h1>
              <p className="yam-section-note" style={{ margin: '10px 0 0' }}>
                تم استبدال شكل الصفحة بتصميم أحدث مع الحفاظ على نفس خدمات المنشورات والإعجاب والتحديث والتحميل التدريجي.
              </p>
            </div>

            <div className="yam-action-row">
              <Button variant="secondary" onClick={() => refetch()}>تحديث</Button>
              <div className="yam-chip">👋 أهلاً {currentUser || 'بك'}</div>
            </div>
          </div>
        </div>

        <div className="yam-grid-main">
          <div className="yam-grid">
            <div className="yam-card">
              <PostComposer />
            </div>

            {isLoading ? (
              <div className="yam-empty-state">جارٍ تحميل أحدث المنشورات...</div>
            ) : isError ? (
              <div className="yam-empty-state">
                <div style={{ fontSize: 28, marginBottom: 10 }}>⚠️</div>
                <div style={{ marginBottom: 12 }}>تعذر تحميل الفيد حالياً.</div>
                <Button onClick={() => refetch()}>إعادة المحاولة</Button>
              </div>
            ) : posts.length === 0 ? (
              <div className="yam-empty-state">
                <div style={{ fontSize: 28, marginBottom: 10 }}>🪄</div>
                <div style={{ marginBottom: 12 }}>لا توجد منشورات بعد. ابدأ أول منشور من أعلى الصفحة.</div>
              </div>
            ) : (
              <div className="yam-list">
                {posts.map((post) => (
                  <div key={post.id} className="yam-card" style={{ padding: 0, overflow: 'hidden' }}>
                    <PostCard post={post} onLike={() => likeMutation.mutate(post.id)} />
                  </div>
                ))}

                {hasNextPage ? (
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <Button onClick={() => fetchNextPage()} loading={isFetchingNextPage}>
                      تحميل المزيد
                    </Button>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          <aside className="yam-sidebar-stack">
            <div className="yam-card">
              <div className="yam-toolbar">
                <h3 style={{ margin: 0 }}>الترندات الآن</h3>
                <span className="yam-badge">#</span>
              </div>
              <div className="yam-list">
                {trending.length ? trending.map((item, index) => (
                  <div key={item.tag} className="yam-item-row" style={{ justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--yam-muted)' }}>الترند #{index + 1}</div>
                      <strong>{item.tag}</strong>
                    </div>
                    <span className="yam-pill-count">{item.count}</span>
                  </div>
                )) : <div className="yam-empty-copy">سيظهر هنا أكثر الهاشتاجات استخداماً بمجرد توفر منشورات فيها هاشتاج.</div>}
              </div>
            </div>

            <div className="yam-card">
              <div className="yam-toolbar">
                <h3 style={{ margin: 0 }}>حسابات مقترحة</h3>
                <span className="yam-badge success">نشط</span>
              </div>
              <div className="yam-list">
                {suggestions.length ? suggestions.map((item) => (
                  <div key={item.username} className="yam-item-row" style={{ alignItems: 'flex-start' }}>
                    <div className="yam-avatar-sm">{item.username.slice(0, 1).toUpperCase()}</div>
                    <div style={{ flex: 1 }}>
                      <strong>@{item.username}</strong>
                      <div className="yam-meta" style={{ fontSize: 13, marginTop: 4 }}>
                        {String(item.bio).slice(0, 70)}
                      </div>
                    </div>
                  </div>
                )) : <div className="yam-empty-copy">سيتم إظهار اقتراحات المتابعة هنا بعد وصول بيانات المستخدمين من المنشورات.</div>}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </MainLayout>
  );
}

import { useEffect, useMemo, useRef, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import MainLayout from '../components/layout/MainLayout.jsx';
import EmptyState from '../components/feedback/EmptyState.jsx';
import ErrorState from '../components/feedback/ErrorState.jsx';
import PageLoader from '../components/feedback/PageLoader.jsx';
import { getPosts } from '../api/posts.js';

const isVideo = (value) => /\.(mp4|mov|webm|mkv)$/i.test(String(value || ''));
const PAGE_SIZE = 4;

async function fetchReelsPage({ pageParam = 0 }) {
  const { data } = await getPosts();
  const posts = Array.isArray(data) ? data : [];
  const reels = posts.filter((post) => isVideo(post.media || post.image_url));
  const slice = reels.slice(pageParam, pageParam + PAGE_SIZE);
  return {
    items: slice,
    nextCursor: pageParam + PAGE_SIZE < reels.length ? pageParam + PAGE_SIZE : undefined,
    total: reels.length,
  };
}

export default function Reels() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [saveData, setSaveData] = useState(false);
  const containerRef = useRef(null);
  const videoRefs = useRef({});
  const sentinelRef = useRef(null);

  const { data, isLoading, isError, error, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } = useInfiniteQuery({
    queryKey: ['reels'],
    queryFn: fetchReelsPage,
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  const reels = useMemo(() => data?.pages.flatMap((page) => page.items) || [], [data]);

  useEffect(() => {
    setSaveData(Boolean(navigator.connection?.saveData));
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = Number(entry.target.dataset.index);
          const video = videoRefs.current[index];
          if (!video) return;
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            setActiveIndex(index);
            video.play().catch(() => null);
            const nextVideo = videoRefs.current[index + 1];
            if (nextVideo) nextVideo.preload = saveData ? 'metadata' : 'auto';
          } else {
            video.pause();
          }
        });
      },
      { threshold: [0.25, 0.6, 0.9] }
    );

    Object.values(videoRefs.current).forEach((video) => video && observer.observe(video.parentElement));
    return () => observer.disconnect();
  }, [reels, saveData]);

  useEffect(() => {
    if (!sentinelRef.current) return undefined;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    }, { threshold: 0.2 });
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const handleNext = (direction = 1) => {
    const nextIndex = Math.max(0, Math.min(reels.length - 1, activeIndex + direction));
    const target = containerRef.current?.querySelector(`[data-reel-index="${nextIndex}"]`);
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <MainLayout>
      <section className="reels-page-shell">
        <div className="section-head">
          <div>
            <h3 className="section-title">🎬 الريلز</h3>
            <p className="muted">سحب رأسي حقيقي، تشغيل/إيقاف ذكي، Preload للفيديو التالي، وكاش أخف عند وضع توفير البيانات.</p>
          </div>
          <div className="live-stage-stats">
            <span className="glass-chip">Swipe Ready</span>
            <span className="glass-chip">{saveData ? 'Data Saver' : 'HD Streaming'}</span>
          </div>
        </div>

        {isLoading ? <PageLoader label="جارٍ تحميل الريلز..." /> : null}
        {isError ? (
          <ErrorState
            title="تعذر تحميل الريلز"
            description={error?.response?.data?.message || error?.message || 'حدث خطأ أثناء جلب الفيديوهات.'}
            onRetry={refetch}
          />
        ) : null}
        {!isLoading && !isError && reels.length === 0 ? (
          <EmptyState
            icon="🎥"
            title="لا توجد فيديوهات منشورة"
            description="بمجرد نشر أي فيديو سيظهر هنا تلقائياً بشكل عمودي." 
          />
        ) : null}

        {!isLoading && !isError && reels.length > 0 ? (
          <div className="reels-layout-enhanced">
            <div className="reels-viewport" ref={containerRef}>
              {reels.map((post, index) => (
                <article key={post.id || index} className="reel-slide" data-reel-index={index}>
                  <div className="reel-video-shell" data-index={index}>
                    <video
                      ref={(node) => {
                        if (node) videoRefs.current[index] = node;
                      }}
                      className="reel-video"
                      src={post.media || post.image_url}
                      controls
                      playsInline
                      preload={saveData ? 'metadata' : index <= activeIndex + 1 ? 'auto' : 'metadata'}
                      poster={post.thumbnail || ''}
                      muted={index !== activeIndex}
                    />
                    <div className="reel-overlay">
                      <div>
                        <strong>@{post.username}</strong>
                        <p>{post.content || 'ريل جديد داخل يمشات'}</p>
                      </div>
                      <div className="reel-stats-overlay">
                        <span>❤️ {post.likes || post.like_count || 0}</span>
                        <span>💬 {post.comments_count || post.comment_count || 0}</span>
                        <span>📆 {post.created_at ? new Date(post.created_at).toLocaleDateString('ar-EG') : 'اليوم'}</span>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
              <div ref={sentinelRef} className="reels-sentinel">{isFetchingNextPage ? 'جارٍ تحميل المزيد...' : hasNextPage ? 'اسحب للأسفل للمزيد' : 'تم الوصول لآخر الريلز'}</div>
            </div>

            <aside className="reels-side-rail card">
              <div className="section-head compact">
                <div>
                  <h3 className="section-title">تحكم سريع</h3>
                  <p className="muted">تنقل بين الريلز مع تحسين استهلاك البيانات للأجهزة الضعيفة.</p>
                </div>
              </div>
              <div className="reels-control-stack">
                <button type="button" className="mini-action" onClick={() => handleNext(-1)}>⬆ السابق</button>
                <button type="button" className="mini-action" onClick={() => handleNext(1)}>⬇ التالي</button>
                <div className="muted">الحالي: {activeIndex + 1} / {reels.length}</div>
                <div className="muted">الوضع: {saveData ? 'توفير البيانات مفعّل' : 'تحميل مسبق للفيديو القادم'}</div>
              </div>
            </aside>
          </div>
        ) : null}
      </section>
    </MainLayout>
  );
}

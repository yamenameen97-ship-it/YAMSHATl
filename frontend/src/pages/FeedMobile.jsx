import { memo, useEffect, useMemo, useState } from 'react';
import MobileComposer from '../components/mobile/MobileComposer.jsx';
import MobileFilterPills from '../components/mobile/MobileFilterPills.jsx';
import MobilePostCard from '../components/mobile/MobilePostCard.jsx';
import useSmartFeed from '../hooks/useSmartFeed.js';
import { resolveMediaUrl } from '../config/mediaConfig.js';

/**
 * FeedMobile — صفحة الخلاصة للموبايل (مطابقة للتصميم المرجعي)
 * - تستخدم نفس useSmartFeed
 * - تعرض composer + فلاتر + قائمة منشورات بتصميم نظيف
 * - تتعامل مع حالة التحميل والفراغ والأخطاء
 */

function timeAgoAr(dateLike) {
  if (!dateLike) return 'الآن';
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return 'الآن';
  const diffSec = Math.max(1, Math.floor((Date.now() - d.getTime()) / 1000));
  if (diffSec < 60) return 'منذ لحظات';
  const m = Math.floor(diffSec / 60);
  if (m < 60) return `منذ ${m} دقيقة`;
  const h = Math.floor(m / 60);
  if (h < 24) return `منذ ${h} ساعة${h > 2 ? '' : ''}`;
  const days = Math.floor(h / 24);
  if (days < 30) return `منذ ${days} يوم`;
  const months = Math.floor(days / 30);
  if (months < 12) return `منذ ${months} شهر`;
  return `منذ ${Math.floor(months / 12)} سنة`;
}

function normalizePost(p, i) {
  const author = p.author_name || p.username || p.user || 'مستخدم يمشات';
  const handle = (p.username || p.user || `user${i}`).toString();
  const verified = Boolean(p.verified || p.is_verified || p.official);
  const bannerUrl = resolveMediaUrl(
    Array.isArray(p.media_urls) && p.media_urls.length
      ? p.media_urls[0]
      : (p.media_url || p.image_url || '')
  );
  return {
    id: p.id || `p-${i}`,
    authorName: author,
    handle: `@${handle.replace(/^@/, '')}`,
    timeText: timeAgoAr(p.created_at || p.published_at),
    verified,
    avatarUrl: resolveMediaUrl(p.user_avatar || p.avatar || p.author_avatar || ''),
    text: p.content || p.text || '',
    banner: bannerUrl
      ? { type: 'image', url: bannerUrl }
      : (i === 0 ? { type: 'logo', title: 'YAMSHAT', slogan: 'تواصل، تفاعل، اربح' } : null),
    likes: Number(p.likes_count || p.like_count || p.likes || 0),
    comments: Number(p.comments_count || p.comment_count || p.comments || 0),
    reposts: Number(p.share_count || p.shares || p.reposts || 0),
    liked: Boolean(p.liked || p.is_liked),
    reposted: Boolean(p.reposted || p.is_reposted),
  };
}

// منشورات تجريبية افتراضية مطابقة لما يظهر في الصورة المرجعية
const SAMPLE_POSTS = [
  {
    id: 'sample-1',
    authorName: 'فريق يمشات الرسمي',
    handle: '@yamshat_team',
    timeText: 'منذ ساعتين',
    verified: true,
    text: 'مرحباً بكم في يمشات 🚀\nالجيل الجديد من التواصل الاجتماعي وصل.\nاكتشف. تفاعل. اربح.',
    banner: { type: 'logo', title: 'YAMSHAT', slogan: 'تواصل، تفاعل، اربح' },
    likes: 1200,
    comments: 128,
    reposts: 356,
  },
  {
    id: 'sample-2',
    authorName: 'تحديثات يمشات',
    handle: '@yamshat_updates',
    timeText: 'منذ 4 ساعات',
    verified: true,
    text: '🎯 إطلاق المهام اليومية الجديدة\nأكمل المهام اليومية واحصل على النقاط والمكافآت\nوارتقِ بحسابك.',
    likes: 842,
    comments: 96,
    reposts: 214,
  },
  {
    id: 'sample-3',
    authorName: 'مجتمع يمشات',
    handle: '@yamshat_community',
    timeText: 'منذ 6 ساعات',
    verified: true,
    text: 'تحية لكل أعضاء مجتمع يمشات 💜\nأنتم سبب نجاح المنصة وتطورها يوماً بعد يوم.\n#عائلة_يمشات',
    likes: 621,
    comments: 74,
    reposts: 130,
  },
];

function FeedMobile() {
  const [activeFilter, setActiveFilter] = useState('all');
  const smart = useSmartFeed?.();

  // إن لم يتوفر useSmartFeed أو لم تُجلب بيانات، استخدم العيّنة
  const rawPosts = smart?.posts || smart?.data || smart?.items || [];
  const loading = smart?.isLoading || smart?.loading;
  const error = smart?.error;

  const posts = useMemo(() => {
    if (Array.isArray(rawPosts) && rawPosts.length) {
      return rawPosts.map((p, i) => normalizePost(p, i));
    }
    return SAMPLE_POSTS;
  }, [rawPosts]);

  // فلترة بسيطة (يمكن توسيعها لاحقاً)
  const filtered = useMemo(() => {
    if (activeFilter === 'all') return posts;
    if (activeFilter === 'updates') return posts.filter((p) => /تحديث|تطوير|إطلاق|جديد/.test(p.text));
    if (activeFilter === 'ads') return posts.filter((p) => /إعلان|عرض|خصم/.test(p.text));
    if (activeFilter === 'community') return posts.filter((p) => /مجتمع|عائلة|أعضاء/.test(p.text));
    return posts;
  }, [activeFilter, posts]);

  return (
    <>
      <MobileComposer />
      <MobileFilterPills activeId={activeFilter} onChange={setActiveFilter} />

      {error ? (
        <div className="ym-empty">
          <div className="icon">⚠️</div>
          تعذر تحميل المنشورات. حاول لاحقاً.
        </div>
      ) : null}

      {loading && !posts.length ? (
        <div className="ym-feed">
          {[1, 2, 3].map((i) => (
            <div key={i} className="ym-post" aria-busy="true">
              <div className="ym-post-head">
                <div className="ym-skeleton" style={{ width: 44, height: 44, borderRadius: '50%' }} />
                <div className="ym-post-meta">
                  <div className="ym-skeleton" style={{ width: '40%', height: 14 }} />
                  <div className="ym-skeleton" style={{ width: '25%', height: 12, marginTop: 6 }} />
                </div>
              </div>
              <div className="ym-skeleton" style={{ width: '100%', height: 60 }} />
              <div className="ym-skeleton" style={{ width: '100%', aspectRatio: '16/9' }} />
            </div>
          ))}
        </div>
      ) : null}

      <div className="ym-feed">
        {filtered.map((post) => (
          <MobilePostCard key={post.id} post={post} />
        ))}
      </div>

      {!loading && filtered.length === 0 ? (
        <div className="ym-empty">
          <div className="icon">📭</div>
          لا توجد منشورات في هذا التصنيف بعد.
        </div>
      ) : null}
    </>
  );
}

export default memo(FeedMobile);

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserPosts } from '../../api/users.js';
import { resolveMediaUrl } from '../../config/mediaConfig.js';

/**
 * ProfileMediaGrid (v88.68)
 * ------------------------------------------------------------
 * ✅ عند الضغط على تبويب "الوسائط" في الملف الشخصي:
 *    - يجلب جميع منشورات المستخدم صاحب الحساب.
 *    - يستخرج منها كل الوسائط (صور + فيديوهات) بما فيها المنشورات
 *      متعددة الوسائط (كل عنصر media كخانة منفصلة).
 *    - يعرضها في شبكة 3 أعمدة بنسبة 1:1 مثل معرض إنستغرام.
 *    - عند الضغط على أي عنصر → ينتقل لصفحة المنشور الأصلية `/post/:id`.
 * ------------------------------------------------------------
 * - بدون تغيير في backend.
 * - يعتمد على endpoint القائم `/users/user_posts/{username}` عبر getUserPosts().
 */

const VIDEO_MEDIA_RE = /\.(mp4|webm|mov|m4v|m3u8|mkv|avi)(\?.*)?$/i;

function looksLikeVideoUrl(value = '') {
  const candidate = String(value || '').trim().toLowerCase();
  if (!candidate) return false;
  return (
    VIDEO_MEDIA_RE.test(candidate)
    || /(^data:video\/)|([?&](resource_type|content_type|mime_type)=video)/i.test(candidate)
    || /\/video\/upload\//i.test(candidate)
  );
}

/** يستخرج كل الوسائط من منشور واحد ويعيدها كمصفوفة عناصر مسطّحة. */
function extractMediaItems(post = {}) {
  const items = [];
  const seen = new Set();

  const pushItem = (rawUrl, opts = {}) => {
    const url = resolveMediaUrl(String(rawUrl || '').trim());
    if (!url || seen.has(url)) return;
    seen.add(url);
    const explicitVideo = Boolean(opts.forceVideo)
      || Boolean(post.has_video)
      || Boolean(post.is_reel)
      || String(post.media_type || '').toLowerCase() === 'video';
    const isVideo = explicitVideo || looksLikeVideoUrl(url);
    const poster = resolveMediaUrl(
      post.thumbnail_url
      || post.preview_url
      || (!isVideo ? '' : post.image_url)
      || ''
    );
    items.push({
      id: `${post.id}::${items.length}`,
      postId: post.id,
      url,
      isVideo,
      poster,
      likes_count: Number(post.likes_count || 0),
      comments_count: Number(post.comments_count || 0),
      created_at: post.created_at || post.published_at || null,
    });
  };

  // 1) قائمة media_urls (الأولوية) — قد تكون مصفوفة من نصوص أو كائنات
  const list = Array.isArray(post.media_urls) ? post.media_urls : [];
  list.forEach((entry) => {
    if (!entry) return;
    if (typeof entry === 'string') {
      pushItem(entry);
    } else if (typeof entry === 'object') {
      const kind = String(entry.type || entry.media_type || '').toLowerCase();
      pushItem(entry.url || entry.media_url || entry.src || '', {
        forceVideo: kind === 'video',
      });
    }
  });

  // 2) الحقول الفردية كاحتياط إن لم تكن موجودة أعلاه
  if (post.media_url) pushItem(post.media_url);
  if (post.media) pushItem(post.media);
  if (post.image_url && !post.has_video) pushItem(post.image_url);

  return items;
}

function ProfileMediaGrid({ username, profile }) {
  const navigate = useNavigate();

  const [posts, setPosts] = useState(
    Array.isArray(profile?.posts) ? profile.posts : []
  );
  const [isLoading, setIsLoading] = useState(!Array.isArray(profile?.posts) || profile.posts.length === 0);
  const [error, setError] = useState('');
  const videoRefs = useRef({});

  // ───────────── جلب المنشورات لصاحب الحساب ─────────────
  useEffect(() => {
    if (!username) return undefined;
    let cancelled = false;

    (async () => {
      try {
        setError('');
        const { data } = await getUserPosts(username);
        const list = Array.isArray(data) ? data
          : Array.isArray(data?.items) ? data.items
          : Array.isArray(data?.posts) ? data.posts
          : Array.isArray(data?.results) ? data.results
          : [];
        if (cancelled) return;
        setPosts(list);
      } catch (e) {
        if (cancelled) return;
        // إن فشل النداء لكن لدينا نسخة من profile.posts نستمر بها
        if (!Array.isArray(profile?.posts) || profile.posts.length === 0) {
          setError('تعذر تحميل الوسائط');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [username, profile?.posts]);

  // ───────────── تسطيح كل الوسائط من كل المنشورات ─────────────
  const mediaItems = useMemo(() => {
    if (!Array.isArray(posts) || posts.length === 0) return [];
    const out = [];
    posts.forEach((p) => {
      const items = extractMediaItems(p);
      items.forEach((it) => out.push(it));
    });
    return out;
  }, [posts]);

  // ───────────── إيقاف كل فيديوهات المعاينة عند تفكيك المكوّن ─────────────
  useEffect(() => {
    return () => {
      Object.values(videoRefs.current || {}).forEach((v) => {
        try { v && v.pause(); } catch { /* ignore */ }
      });
    };
  }, []);

  const openPost = useCallback((postId) => {
    if (!postId) return;
    navigate(`/post/${postId}`);
  }, [navigate]);

  // ───────────── حالات العرض ─────────────
  if (isLoading && mediaItems.length === 0) {
    return (
      <div className="ym-media-grid ym-media-grid--loading" dir="rtl">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="ym-media-grid__skeleton" />
        ))}
        <StyleTag />
      </div>
    );
  }

  if (error && mediaItems.length === 0) {
    return (
      <div className="ym-media-grid__empty-state" dir="rtl">
        <p style={{ color: '#ff6b6b' }}>{error}</p>
        <StyleTag />
      </div>
    );
  }

  if (mediaItems.length === 0) {
    return (
      <div className="ym-media-grid__empty-state" dir="rtl">
        <p>لا توجد وسائط منشورة بعد</p>
        <StyleTag />
      </div>
    );
  }

  return (
    <div className="ym-media-grid" dir="rtl">
      {mediaItems.map((item) => (
        <button
          key={item.id}
          type="button"
          className="ym-media-grid__cell"
          onClick={() => openPost(item.postId)}
          aria-label={item.isVideo ? 'عرض الفيديو' : 'عرض الصورة'}
        >
          {item.isVideo ? (
            <>
              <video
                ref={(el) => { if (el) videoRefs.current[item.id] = el; }}
                src={item.url}
                poster={item.poster || undefined}
                className="ym-media-grid__media"
                muted
                playsInline
                preload="metadata"
                aria-hidden="true"
              />
              <span className="ym-media-grid__badge ym-media-grid__badge--video" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="16" height="16">
                  <path fill="currentColor" d="M8 5v14l11-7z" />
                </svg>
              </span>
            </>
          ) : (
            <img
              src={item.url}
              alt=""
              className="ym-media-grid__media"
              loading="lazy"
              decoding="async"
            />
          )}
          <div className="ym-media-grid__stats" aria-hidden="true">
            <span>❤ {item.likes_count}</span>
            <span>💬 {item.comments_count}</span>
          </div>
        </button>
      ))}
      <StyleTag />
    </div>
  );
}

/* ============================================================
   الأنماط — مضمّنة داخل المكوّن لتفادي كسر build أو ملفات CSS
   ============================================================ */
const StyleTag = memo(() => (
  <style>{`
    .ym-media-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 3px;
      width: 100%;
      direction: rtl;
      margin-top: 8px;
    }
    .ym-media-grid__cell {
      position: relative;
      aspect-ratio: 1 / 1;
      background: #0f0f14;
      border: 0;
      padding: 0;
      cursor: pointer;
      overflow: hidden;
      border-radius: 4px;
      transition: transform 0.15s ease, opacity 0.15s ease;
    }
    .ym-media-grid__cell:hover,
    .ym-media-grid__cell:focus-visible {
      transform: scale(1.01);
      outline: none;
      opacity: 0.95;
    }
    .ym-media-grid__media {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .ym-media-grid__badge--video {
      position: absolute;
      top: 6px;
      inset-inline-end: 6px;
      background: rgba(0, 0, 0, 0.55);
      color: #fff;
      border-radius: 999px;
      width: 24px;
      height: 24px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
    }
    .ym-media-grid__stats {
      position: absolute;
      inset: auto 0 0 0;
      padding: 8px;
      display: flex;
      gap: 10px;
      justify-content: center;
      align-items: center;
      color: #fff;
      font-size: 12px;
      font-weight: 700;
      background: linear-gradient(180deg, transparent, rgba(0,0,0,0.55));
      opacity: 0;
      transition: opacity 0.2s ease;
      pointer-events: none;
    }
    .ym-media-grid__cell:hover .ym-media-grid__stats,
    .ym-media-grid__cell:focus-visible .ym-media-grid__stats {
      opacity: 1;
    }
    .ym-media-grid__skeleton {
      aspect-ratio: 1 / 1;
      background: linear-gradient(90deg, #14141c 0%, #1c1c26 50%, #14141c 100%);
      background-size: 200% 100%;
      animation: ymMediaShimmer 1.4s infinite linear;
      border-radius: 4px;
    }
    @keyframes ymMediaShimmer {
      0%   { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
    .ym-media-grid__empty-state {
      text-align: center;
      padding: 40px 20px;
      color: #94a3b8;
      font-size: 14px;
    }
    @media (max-width: 380px) {
      .ym-media-grid { gap: 2px; }
    }
  `}</style>
));

export default memo(ProfileMediaGrid);

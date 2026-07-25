import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axios.js';
import { addReelComment, getReelComments, deleteReel } from '../../api/reels.js';
import { resolveMediaUrl } from '../../config/mediaConfig.js';
import { useToast } from '../admin/ToastProvider.jsx';
import ReportModal from '../reports/ReportModal.jsx';

/**
 * ProfileReelsGrid (v88.67)
 * ------------------------------------------------------------
 * ✅ عند الضغط على تبويب "الريلز" في الملف الشخصي:
 *    - جلب ريلزات المستخدم صاحب الحساب.
 *    - عرضها في شبكة عمودين (مقطع جنب مقطع) بشكل عمودي 9:16.
 *    - عند الضغط على أي واحد منها → يفتح مشغّل ريلز كامل الشاشة مثل
 *      صفحة الريلز الأصلية مع جميع أزرار التفاعل (إعجاب/تعليق/مشاركة/حفظ/المزيد).
 * ------------------------------------------------------------
 */

function fmtCount(n) {
  const num = Number(n) || 0;
  if (num < 1000) return String(num);
  if (num < 1_000_000) return `${(num / 1000).toFixed(num < 10_000 ? 1 : 0)}K`;
  return `${(num / 1_000_000).toFixed(1)}M`;
}

function normalizeReel(raw = {}) {
  const mediaUrl = resolveMediaUrl(
    raw.video_url || raw.media_url || raw.url || raw.media || ''
  );
  const poster = resolveMediaUrl(
    raw.thumbnail_url || raw.poster || raw.preview_url || raw.image_url || ''
  );
  return {
    id: raw.id || raw.reel_id,
    media_url: mediaUrl,
    poster,
    caption: raw.caption || raw.description || raw.text || '',
    username: raw.username || raw.author?.username || raw.user?.username || '',
    display_name:
      raw.display_name
      || raw.full_name
      || raw.author?.display_name
      || raw.author?.full_name
      || raw.username
      || '',
    avatar: resolveMediaUrl(
      raw.avatar || raw.avatar_url || raw.author?.avatar || raw.user?.avatar || ''
    ),
    user_id: raw.user_id || raw.author?.id || raw.user?.id,
    likes_count: Number(raw.likes_count || raw.likes || 0),
    comments_count: Number(raw.comments_count || raw.comments || 0),
    views_count: Number(raw.views_count || raw.views || 0),
    shares_count: Number(raw.shares_count || raw.shares || 0),
    is_liked: Boolean(raw.is_liked || raw.liked),
    is_saved: Boolean(raw.is_saved || raw.saved),
    created_at: raw.created_at || raw.createdAt || null,
  };
}

function ProfileReelsGrid({ username, profile, isOwnProfile }) {
  const navigate = useNavigate();
  const { push: pushToast } = useToast() || {};

  const [reels, setReels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1); // -1 = grid; >=0 = fullscreen viewer
  const [muted, setMuted] = useState(true);

  // Comments sheet state
  const [showComments, setShowComments] = useState(false);
  const [commentsList, setCommentsList] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);

  // Report / More menu
  const [reportTarget, setReportTarget] = useState(null);
  const [menuReel, setMenuReel] = useState(null);

  const videoRefs = useRef([]);
  const containerRef = useRef(null);

  // ───────────── جلب ريلزات المستخدم ─────────────
  useEffect(() => {
    if (!username) return undefined;
    let cancelled = false;
    setIsLoading(true);
    setError('');

    (async () => {
      let items = [];
      try {
        // نحاول endpoint مخصّص إن وُجد: /users/{username}/reels
        try {
          const { data } = await API.get(
            `/users/${encodeURIComponent(username)}/reels`,
            { params: { limit: 60 } }
          );
          items = Array.isArray(data?.items) ? data.items
            : Array.isArray(data?.reels) ? data.reels
            : Array.isArray(data) ? data : [];
        } catch {
          items = [];
        }

        // fallback: نجلب الفيد العام ونصفّي حسب username / user_id
        if (!items.length) {
          try {
            let data;
            try {
              ({ data } = await API.get('/reels/feed', { params: { limit: 100, offset: 0 } }));
            } catch {
              ({ data } = await API.get('/reels', { params: { limit: 100, offset: 0 } }));
            }
            const list = Array.isArray(data?.items) ? data.items
              : Array.isArray(data?.reels) ? data.reels
              : Array.isArray(data?.results) ? data.results
              : Array.isArray(data?.data) ? data.data
              : Array.isArray(data) ? data : [];
            const uid = profile?.user?.id;
            items = list.filter((r) => {
              const un = String(r.username || r.author?.username || r.user?.username || '').toLowerCase();
              const rid = r.user_id || r.author?.id || r.user?.id;
              if (un && un === String(username).toLowerCase()) return true;
              if (uid && rid && Number(uid) === Number(rid)) return true;
              return false;
            });
          } catch {
            items = [];
          }
        }
      } catch (e) {
        if (!cancelled) setError('تعذر تحميل الريلز');
      }

      if (cancelled) return;
      const normalized = items.map(normalizeReel).filter((r) => r.id && r.media_url);
      setReels(normalized);
      setIsLoading(false);
    })();

    return () => { cancelled = true; };
  }, [username, profile?.user?.id]);

  // ───────────── تشغيل/إيقاف الفيديوهات في الفولسكرين ─────────────
  useEffect(() => {
    if (activeIndex < 0) {
      // إيقاف كل الفيديوهات عند الرجوع للشبكة
      videoRefs.current.forEach((v) => {
        try { v && v.pause(); } catch {}
      });
      return;
    }
    videoRefs.current.forEach((v, i) => {
      if (!v) return;
      try {
        if (i === activeIndex) {
          v.currentTime = 0;
          v.play().catch(() => {});
        } else {
          v.pause();
        }
      } catch {}
    });
  }, [activeIndex]);

  // scroll-snap observer داخل الفولسكرين
  useEffect(() => {
    if (activeIndex < 0) return undefined;
    const container = containerRef.current;
    if (!container) return undefined;
    let raf = null;
    const onScroll = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const h = container.clientHeight || 1;
        const idx = Math.round(container.scrollTop / h);
        setActiveIndex((prev) => (idx !== prev && idx >= 0 && idx < reels.length ? idx : prev));
      });
    };
    container.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [activeIndex, reels.length]);

  const openReelAt = useCallback((idx) => {
    setActiveIndex(idx);
    // مرّر الحاوية لموضع الريل بعد الرندر
    setTimeout(() => {
      const c = containerRef.current;
      if (c) c.scrollTo({ top: idx * c.clientHeight, behavior: 'auto' });
    }, 30);
  }, []);

  const closeFullscreen = useCallback(() => {
    setActiveIndex(-1);
    setShowComments(false);
  }, []);

  // ───────────── إجراءات ─────────────
  const handleLike = useCallback(async (reel) => {
    if (!reel) return;
    // Optimistic
    setReels((prev) => prev.map((r) => r.id === reel.id
      ? { ...r, is_liked: !r.is_liked, likes_count: Math.max(0, (r.likes_count || 0) + (r.is_liked ? -1 : 1)) }
      : r));
    try {
      await API.post(`/reels/${encodeURIComponent(reel.id)}/like`);
    } catch {
      // rollback
      setReels((prev) => prev.map((r) => r.id === reel.id
        ? { ...r, is_liked: !r.is_liked, likes_count: Math.max(0, (r.likes_count || 0) + (r.is_liked ? -1 : 1)) }
        : r));
      pushToast?.({ type: 'error', message: 'تعذر تسجيل الإعجاب' });
    }
  }, [pushToast]);

  const handleSave = useCallback(async (reel) => {
    if (!reel) return;
    setReels((prev) => prev.map((r) => r.id === reel.id ? { ...r, is_saved: !r.is_saved } : r));
    try {
      await API.post(`/reels/${encodeURIComponent(reel.id)}/save`);
      pushToast?.({ type: 'success', message: reel.is_saved ? 'أُزيل من المحفوظات' : 'حُفظ الريل' });
    } catch {
      setReels((prev) => prev.map((r) => r.id === reel.id ? { ...r, is_saved: !r.is_saved } : r));
      pushToast?.({ type: 'error', message: 'تعذر الحفظ' });
    }
  }, [pushToast]);

  const handleShare = useCallback(async (reel) => {
    if (!reel) return;
    const url = `${window.location.origin}/reels?rid=${encodeURIComponent(reel.id)}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'ريل', text: reel.caption || '', url });
      } else {
        await navigator.clipboard.writeText(url);
        pushToast?.({ type: 'success', message: 'تم نسخ الرابط' });
      }
    } catch {}
  }, [pushToast]);

  const openComments = useCallback(async (reel) => {
    if (!reel) return;
    setShowComments(true);
    setCommentsList([]);
    setCommentLoading(true);
    try {
      const { data } = await getReelComments(reel.id);
      const list = Array.isArray(data?.items) ? data.items
        : Array.isArray(data?.comments) ? data.comments
        : Array.isArray(data) ? data : [];
      setCommentsList(list);
    } catch {
      setCommentsList([]);
    } finally {
      setCommentLoading(false);
    }
  }, []);

  const sendComment = useCallback(async () => {
    const reel = reels[activeIndex];
    const text = commentText.trim();
    if (!reel || !text) return;
    setCommentText('');
    try {
      const { data } = await addReelComment(reel.id, text);
      setCommentsList((prev) => [data?.comment || data || { content: text, username: 'أنا', created_at: new Date().toISOString() }, ...prev]);
      setReels((prev) => prev.map((r) => r.id === reel.id
        ? { ...r, comments_count: (r.comments_count || 0) + 1 } : r));
    } catch {
      pushToast?.({ type: 'error', message: 'تعذر إرسال التعليق' });
    }
  }, [activeIndex, reels, commentText, pushToast]);

  const handleDelete = useCallback(async (reel) => {
    if (!reel) return;
    if (!window.confirm('حذف هذا الريل نهائياً؟')) return;
    try {
      await deleteReel(reel.id);
      setReels((prev) => prev.filter((r) => r.id !== reel.id));
      setMenuReel(null);
      if (activeIndex >= 0) setActiveIndex(-1);
      pushToast?.({ type: 'success', message: 'حُذف الريل' });
    } catch {
      pushToast?.({ type: 'error', message: 'تعذر الحذف' });
    }
  }, [activeIndex, pushToast]);

  // ───────────── العرض ─────────────
  const currentReel = activeIndex >= 0 ? reels[activeIndex] : null;

  return (
    <>
      {/* ═════════ الشبكة (عمودان) ═════════ */}
      {activeIndex < 0 && (
        <div className="ym-profile-reels-wrap" dir="rtl" style={{ padding: '12px 0' }}>
          {isLoading ? (
            <div style={{ padding: 32, textAlign: 'center', color: '#a1a1aa' }}>
              جاري تحميل الريلز…
            </div>
          ) : reels.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#a1a1aa' }}>
              {error || 'لا توجد ريلز لعرضها'}
            </div>
          ) : (
            <div
              className="ym-profile-reels-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 6,
                width: '100%',
              }}
            >
              {reels.map((reel, i) => (
                <button
                  key={reel.id}
                  type="button"
                  onClick={() => openReelAt(i)}
                  className="ym-profile-reels-cell"
                  style={{
                    position: 'relative',
                    width: '100%',
                    aspectRatio: '9 / 16',
                    background: '#111',
                    border: 'none',
                    borderRadius: 10,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                  aria-label="فتح الريل"
                >
                  {reel.poster ? (
                    <img
                      src={reel.poster}
                      alt=""
                      loading="lazy"
                      draggable="false"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <video
                      src={reel.media_url}
                      muted
                      playsInline
                      preload="metadata"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  )}

                  {/* شارة تشغيل + عدّاد المشاهدات */}
                  <div
                    style={{
                      position: 'absolute',
                      insetInlineStart: 6,
                      bottom: 6,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '3px 7px',
                      borderRadius: 8,
                      background: 'rgba(0,0,0,0.55)',
                      color: '#fff',
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    <svg viewBox="0 0 24 24" width="11" height="11" fill="#fff" aria-hidden>
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    {fmtCount(reel.views_count || reel.likes_count || 0)}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═════════ العارض الكامل (Fullscreen viewer) ═════════ */}
      {activeIndex >= 0 && (
        <div
          className="ym-profile-reels-viewer"
          role="dialog"
          aria-modal="true"
          dir="rtl"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10080,
            background: '#000',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* شريط علوي */}
          <div
            style={{
              position: 'absolute',
              top: 0, insetInlineStart: 0, insetInlineEnd: 0,
              zIndex: 5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              background: 'linear-gradient(180deg, rgba(0,0,0,0.6), rgba(0,0,0,0))',
              color: '#fff',
            }}
          >
            <button
              type="button"
              onClick={closeFullscreen}
              aria-label="رجوع"
              style={{
                background: 'rgba(0,0,0,0.35)', border: 'none', color: '#fff',
                width: 36, height: 36, borderRadius: '50%', cursor: 'pointer',
                fontSize: 20, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              ✕
            </button>
            <div style={{ fontWeight: 700 }}>الريلز</div>
            <button
              type="button"
              onClick={() => setMuted((m) => !m)}
              aria-label={muted ? 'تشغيل الصوت' : 'كتم الصوت'}
              style={{
                background: 'rgba(0,0,0,0.35)', border: 'none', color: '#fff',
                width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', fontSize: 16,
              }}
            >
              {muted ? '🔇' : '🔊'}
            </button>
          </div>

          {/* حاوية snap عمودية */}
          <div
            ref={containerRef}
            className="ym-profile-reels-viewer-feed"
            style={{
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
              scrollSnapType: 'y mandatory',
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain',
            }}
          >
            {reels.map((reel, i) => (
              <section
                key={reel.id}
                style={{
                  position: 'relative',
                  height: '100%',
                  minHeight: '100dvh',
                  width: '100%',
                  scrollSnapAlign: 'start',
                  scrollSnapStop: 'always',
                  background: '#000',
                }}
                onDoubleClick={() => {
                  if (!reel.is_liked) handleLike(reel);
                }}
              >
                <video
                  ref={(el) => { videoRefs.current[i] = el; }}
                  src={reel.media_url}
                  poster={reel.poster || undefined}
                  loop
                  muted={muted}
                  playsInline
                  preload="metadata"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    background: '#000',
                  }}
                  onClick={(e) => {
                    const v = e.currentTarget;
                    if (v.paused) v.play().catch(() => {});
                    else v.pause();
                  }}
                />

                {/* Overlay الأسفل: الاسم + الوصف */}
                <div
                  style={{
                    position: 'absolute',
                    insetInlineStart: 0,
                    right: 0,
                    bottom: 0,
                    padding: '16px 16px 24px',
                    background: 'linear-gradient(0deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0) 100%)',
                    color: '#fff',
                    paddingInlineEnd: 88,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    {reel.avatar ? (
                      <img
                        src={reel.avatar}
                        alt=""
                        style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '2px solid #fff' }}
                      />
                    ) : (
                      <div style={{
                        width: 40, height: 40, borderRadius: '50%',
                        background: 'linear-gradient(135deg,#a855f7,#6366f1)',
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontWeight: 700,
                      }}>{(reel.display_name || reel.username || 'م').charAt(0).toUpperCase()}</div>
                    )}
                    <div style={{ fontWeight: 700, fontSize: 15 }}>
                      @{reel.username || 'user'}
                    </div>
                  </div>
                  {reel.caption && (
                    <div style={{
                      fontSize: 14,
                      lineHeight: 1.5,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      opacity: 0.95,
                    }}>{reel.caption}</div>
                  )}
                </div>

                {/* عمود أزرار التفاعل (على اليسار في RTL؟ نجعله عند حافة الشاشة) */}
                <div
                  style={{
                    position: 'absolute',
                    insetInlineEnd: 10,
                    bottom: 90,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 18,
                    alignItems: 'center',
                    color: '#fff',
                  }}
                >
                  {/* إعجاب */}
                  <button
                    type="button"
                    onClick={() => handleLike(reel)}
                    aria-label="إعجاب"
                    style={actionBtnStyle}
                  >
                    <span style={{ fontSize: 28, lineHeight: 1 }}>{reel.is_liked ? '❤️' : '🤍'}</span>
                    <span style={actionLabelStyle}>{fmtCount(reel.likes_count)}</span>
                  </button>

                  {/* تعليق */}
                  <button
                    type="button"
                    onClick={() => openComments(reel)}
                    aria-label="تعليق"
                    style={actionBtnStyle}
                  >
                    <span style={{ fontSize: 26, lineHeight: 1 }}>💬</span>
                    <span style={actionLabelStyle}>{fmtCount(reel.comments_count)}</span>
                  </button>

                  {/* مشاركة */}
                  <button
                    type="button"
                    onClick={() => handleShare(reel)}
                    aria-label="مشاركة"
                    style={actionBtnStyle}
                  >
                    <span style={{ fontSize: 26, lineHeight: 1 }}>↗️</span>
                    <span style={actionLabelStyle}>{fmtCount(reel.shares_count)}</span>
                  </button>

                  {/* حفظ */}
                  <button
                    type="button"
                    onClick={() => handleSave(reel)}
                    aria-label="حفظ"
                    style={actionBtnStyle}
                  >
                    <span style={{ fontSize: 26, lineHeight: 1 }}>{reel.is_saved ? '🔖' : '📑'}</span>
                    <span style={actionLabelStyle}>حفظ</span>
                  </button>

                  {/* المزيد */}
                  <button
                    type="button"
                    onClick={() => setMenuReel(reel)}
                    aria-label="المزيد"
                    style={actionBtnStyle}
                  >
                    <span style={{ fontSize: 26, lineHeight: 1 }}>⋯</span>
                  </button>
                </div>
              </section>
            ))}
          </div>

          {/* شيت التعليقات */}
          {showComments && currentReel && (
            <div
              onClick={() => setShowComments(false)}
              style={{
                position: 'absolute', inset: 0, zIndex: 20,
                background: 'rgba(0,0,0,0.55)',
                display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
              }}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: '100%', maxWidth: 640, maxHeight: '70vh',
                  background: '#111', color: '#fff',
                  borderTopLeftRadius: 16, borderTopRightRadius: 16,
                  display: 'flex', flexDirection: 'column',
                }}
              >
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #262626', fontWeight: 700, textAlign: 'center' }}>
                  التعليقات ({fmtCount(currentReel.comments_count)})
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
                  {commentLoading ? (
                    <div style={{ textAlign: 'center', color: '#a1a1aa', padding: 20 }}>جاري التحميل…</div>
                  ) : commentsList.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#a1a1aa', padding: 20 }}>لا توجد تعليقات بعد</div>
                  ) : (
                    commentsList.map((c, idx) => (
                      <div key={c.id || idx} style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%',
                          background: 'linear-gradient(135deg,#a855f7,#6366f1)',
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          fontWeight: 700,
                        }}>
                          {(c.username || c.user?.username || 'م').charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>{c.username || c.user?.username || 'مستخدم'}</div>
                          <div style={{ fontSize: 14, opacity: 0.9, wordBreak: 'break-word' }}>{c.content || c.text}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8, padding: 10, borderTop: '1px solid #262626' }}>
                  <input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="اكتب تعليقاً…"
                    onKeyDown={(e) => { if (e.key === 'Enter') sendComment(); }}
                    style={{
                      flex: 1, padding: '10px 12px', borderRadius: 20,
                      border: '1px solid #262626', background: '#0a0a0a', color: '#fff',
                      outline: 'none', fontSize: 14,
                    }}
                  />
                  <button
                    type="button"
                    onClick={sendComment}
                    disabled={!commentText.trim()}
                    style={{
                      padding: '10px 18px', borderRadius: 20, border: 'none',
                      background: commentText.trim() ? '#3b82f6' : '#374151',
                      color: '#fff', fontWeight: 700, cursor: 'pointer',
                    }}
                  >إرسال</button>
                </div>
              </div>
            </div>
          )}

          {/* قائمة المزيد */}
          {menuReel && (
            <div
              onClick={() => setMenuReel(null)}
              style={{
                position: 'absolute', inset: 0, zIndex: 25,
                background: 'rgba(0,0,0,0.55)',
                display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
              }}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: '100%', maxWidth: 480,
                  background: '#111', color: '#fff',
                  borderTopLeftRadius: 16, borderTopRightRadius: 16,
                  padding: '10px 0',
                }}
              >
                {isOwnProfile ? (
                  <>
                    <MenuItem onClick={() => handleDelete(menuReel)} danger>🗑️ حذف الريل</MenuItem>
                  </>
                ) : (
                  <>
                    <MenuItem onClick={() => { setReportTarget({ type: 'reel', id: menuReel.id }); setMenuReel(null); }}>
                      🚩 الإبلاغ عن الريل
                    </MenuItem>
                  </>
                )}
                <MenuItem onClick={() => { handleShare(menuReel); setMenuReel(null); }}>
                  🔗 نسخ الرابط
                </MenuItem>
                <MenuItem onClick={() => setMenuReel(null)}>❌ إلغاء</MenuItem>
              </div>
            </div>
          )}
        </div>
      )}

      {reportTarget && (
        <ReportModal
          open={Boolean(reportTarget)}
          onClose={() => setReportTarget(null)}
          target={reportTarget}
        />
      )}
    </>
  );
}

const actionBtnStyle = {
  display: 'inline-flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 4,
  background: 'transparent',
  border: 'none',
  color: '#fff',
  cursor: 'pointer',
  padding: 6,
};

const actionLabelStyle = {
  fontSize: 12,
  fontWeight: 700,
  textShadow: '0 1px 2px rgba(0,0,0,0.6)',
};

function MenuItem({ children, onClick, danger }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'start',
        padding: '14px 20px',
        background: 'transparent',
        border: 'none',
        color: danger ? '#f87171' : '#fff',
        fontSize: 15,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}

export default memo(ProfileReelsGrid);

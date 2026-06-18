import { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LiveStreamCard from '../live/LiveStreamCard.jsx';
import { getLiveStreamDetails, sendLiveComment, sendLiveGift, sendLiveHeart } from '../../services/api/liveStreamApi.js';
import { resolveMediaUrl } from '../../config/mediaConfig.js';
import { getCurrentUsername } from '../../utils/auth.js';

/**
 * FeedLiveStreamWidget - بطاقة بث مباشر داخل صفحة المنشورات
 *
 * إعادة تصميم 2026:
 * - تظهر كمنشور اجتماعي متناسق (هيدر/محتوى/أكشن بار) مثل بوست فيسبوك وتيك توك.
 * - تستخدم نفس بنية بطاقة المنشور (.post-card) ليكون التناسق كاملاً على
 *   الموبايل والويب (الديسكتوب).
 * - زر «دخول البث» بارز ومركزي مع تأثير نبض.
 * - تطلق إشعاراً داخلياً (in-app toast + custom event) عند ظهور البث لأول
 *   مرة في الفيد حتى يلاحظه الأصدقاء والمتابعون.
 */
export default function FeedLiveStreamWidget({
  post,
  liveStream,
  onStreamEnd,
  onStreamUpdate,
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [streamData, setStreamData] = useState(liveStream);
  const [isLoading, setIsLoading] = useState(false);
  const currentUser = getCurrentUsername();

  // تحميل تفاصيل البث المباشر
  useEffect(() => {
    if (!liveStream?.id || isExpanded) return;

    const loadStreamData = async () => {
      try {
        setIsLoading(true);
        const response = await getLiveStreamDetails(liveStream.id);
        const data = response?.data || {};

        setStreamData((prev) => ({
          ...prev,
          ...data,
          host_name: data.host_name || data.host || prev?.host_name || 'مستخدم',
          host_avatar: data.host_avatar || prev?.host_avatar || '',
          thumbnail_url: data.thumbnail_url || prev?.thumbnail_url || '',
          hearts_count: data.hearts_count ?? prev?.hearts_count ?? 0,
          comments_count: data.comments_count ?? prev?.comments_count ?? 0,
        }));
      } catch (error) {
        console.error('Error loading stream data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const interval = setInterval(loadStreamData, 5000);
    loadStreamData();

    return () => clearInterval(interval);
  }, [liveStream?.id, isExpanded]);

  // إطلاق إشعار محلي (toast + custom event) عند ظهور البث للمرة الأولى في الفيد
  // الهدف: يُلفت انتباه الأصدقاء/المتابعين تماماً مثل إشعارات فيسبوك ولايف تيك توك.
  useEffect(() => {
    if (!streamData?.id) return;
    const seenKey = `yamshat_live_notified_${streamData.id}`;
    try {
      if (typeof window === 'undefined') return;
      if (sessionStorage.getItem(seenKey)) return;
      sessionStorage.setItem(seenKey, '1');

      const hostName = streamData.host_name || streamData.host || 'مستخدم';
      const title = streamData.title || 'بث مباشر جديد';

      // 1) Toast داخل التطبيق
      window.dispatchEvent(new CustomEvent('yamshat:toast', {
        detail: {
          type: 'info',
          title: `🔴 ${hostName} بدأ بثاً مباشراً`,
          description: title,
          duration: 5000,
        },
      }));

      // 2) حدث متوافق مع GlobalNotificationListener (يُحدّث جرس الإشعارات + يصدر بيب)
      window.dispatchEvent(new CustomEvent('yamshat:notification', {
        detail: {
          id: `live-${streamData.id}`,
          type: 'live_stream_started',
          title: `🔴 ${hostName} بدأ بثاً مباشراً الآن`,
          body: title,
          path: `/live/view/${streamData.id}`,
          created_at: new Date().toISOString(),
        },
      }));

      // 3) إشعار المتصفح إن كان مسموحاً
      try {
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted' && document.hidden) {
          const notif = new Notification(`🔴 ${hostName} بدأ بثاً مباشراً`, {
            body: title,
            icon: '/icons/icon-512.png',
            badge: '/icons/badge-96.png',
            tag: `yamshat-live-${streamData.id}`,
          });
          notif.onclick = () => {
            window.focus();
            window.location.assign(`/live/view/${streamData.id}`);
          };
        }
      } catch (_) { /* noop */ }
    } catch (_) { /* noop */ }
  }, [streamData?.id, streamData?.host_name, streamData?.title]);

  const handleSendComment = useCallback(async (streamId, text) => {
    try {
      await sendLiveComment(streamId, { text });
      onStreamUpdate?.();
    } catch (error) {
      console.error('Error sending comment:', error);
    }
  }, [onStreamUpdate]);

  const handleSendGift = useCallback(async (streamId, gift) => {
    try {
      await sendLiveGift(streamId, { gift_id: gift.id, amount: 1 });
      onStreamUpdate?.();
    } catch (error) {
      console.error('Error sending gift:', error);
    }
  }, [onStreamUpdate]);

  const handleSendHeart = useCallback(async (streamId) => {
    try {
      await sendLiveHeart(streamId);
      onStreamUpdate?.();
    } catch (error) {
      console.error('Error sending heart:', error);
    }
  }, [onStreamUpdate]);

  const handleCloseStream = useCallback(() => {
    setIsExpanded(false);
    onStreamEnd?.();
  }, [onStreamEnd]);

  const handleOpenStream = useCallback((event) => {
    event?.stopPropagation?.();
    setIsExpanded(true);
  }, []);

  // معالجة آمنة للحقول
  const view = useMemo(() => {
    if (!streamData) return null;
    const hostName = streamData.host_name || streamData.host || streamData.host_username || 'مستخدم';
    const hostHandle = streamData.host_username || streamData.host || hostName;
    return {
      hostName,
      hostHandle,
      hostAvatar: resolveMediaUrl(streamData.host_avatar || streamData.avatar || ''),
      thumbnail: resolveMediaUrl(streamData.thumbnail_url || streamData.cover_url || streamData.preview_url || ''),
      viewerCount: Number(streamData.viewer_count || streamData.viewers_count || 0),
      heartsCount: Number(streamData.hearts_count || streamData.likes_count || 0),
      commentsCount: Number(streamData.comments_count || 0),
      title: streamData.title || streamData.content || 'بث مباشر',
      startedAt: streamData.started_at || streamData.created_at || post?.created_at,
      isHost: streamData.host === currentUser || streamData.host_username === currentUser,
    };
  }, [streamData, post, currentUser]);

  if (!view) return null;

  const startedLabel = (() => {
    try {
      if (!view.startedAt) return 'الآن';
      const d = new Date(view.startedAt);
      const diffMin = Math.max(0, Math.floor((Date.now() - d.getTime()) / 60000));
      if (diffMin < 1) return 'الآن';
      if (diffMin < 60) return `قبل ${diffMin} دقيقة`;
      const diffH = Math.floor(diffMin / 60);
      if (diffH < 24) return `قبل ${diffH} ساعة`;
      return d.toLocaleString('ar-EG');
    } catch { return 'الآن'; }
  })();

  return (
    <>
      {!isExpanded && (
        <motion.article
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.25 }}
          className="post-card yam-live-post-card"
          aria-label="بث مباشر"
        >
          {/* شريط الحالة (إشعار البث) */}
          <div className="yam-live-post-banner" role="status" aria-live="polite">
            <span className="yam-live-post-banner-dot" />
            <span className="yam-live-post-banner-text">
              {view.hostName} يبثّ مباشرة الآن — شاركه اللحظة!
            </span>
          </div>

          {/* الهيدر: أفاتار + اسم + وقت + شارة مباشر */}
          <header className="yam-live-post-header">
            <div className="yam-live-post-author">
              <div className="yam-live-post-avatar">
                {view.hostAvatar ? (
                  <img
                    src={view.hostAvatar}
                    alt={view.hostName}
                    loading="lazy"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                ) : (
                  <span className="yam-live-post-avatar-fallback">
                    {(view.hostName?.charAt(0) || 'م').toUpperCase()}
                  </span>
                )}
                <span className="yam-live-post-avatar-ring" aria-hidden="true" />
              </div>
              <div className="yam-live-post-author-info">
                <div className="yam-live-post-author-name">
                  <strong>{view.hostName}</strong>
                  <span className="yam-live-post-live-badge">
                    <span className="dot" /> مباشر
                  </span>
                </div>
                <div className="yam-live-post-author-meta">
                  <span>@{view.hostHandle}</span>
                  <span>·</span>
                  <span>{startedLabel}</span>
                  <span>·</span>
                  <span title="عام">🌐</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              className="yam-live-post-more"
              aria-label="المزيد"
              onClick={(e) => e.stopPropagation()}
            >
              ⋯
            </button>
          </header>

          {/* نص البث (محتوى المنشور) */}
          <div className="yam-live-post-body">
            <p className="yam-live-post-title">{view.title}</p>
          </div>

          {/* الميديا (المعاينة) */}
          <button
            type="button"
            className="yam-live-post-media"
            onClick={handleOpenStream}
            aria-label="فتح البث المباشر"
          >
            {view.thumbnail ? (
              <img
                src={view.thumbnail}
                alt={view.title}
                className="yam-live-post-thumb"
                loading="lazy"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            ) : (
              <div className="yam-live-post-thumb-placeholder" aria-hidden="true">
                <div className="yam-live-post-thumb-glow" />
              </div>
            )}
            <div className="yam-live-post-media-overlay" />

            {/* شارة LIVE بأعلى يمين الميديا */}
            <span className="yam-live-post-live-tag">
              <span className="dot" /> LIVE
            </span>

            {/* عدّاد المشاهدين */}
            <span className="yam-live-post-viewers">
              👁 {view.viewerCount.toLocaleString('ar-EG')}
            </span>

            {/* زر تشغيل في المنتصف */}
            <span className="yam-live-post-play" aria-hidden="true">▶</span>

            {/* CTA بأسفل الميديا */}
            <span className="yam-live-post-cta">دخول البث المباشر</span>
          </button>

          {/* شريط الإحصائيات (مثل فيسبوك) */}
          <div className="yam-live-post-stats">
            <span>💜 {view.heartsCount.toLocaleString('ar-EG')}</span>
            <span>💬 {view.commentsCount.toLocaleString('ar-EG')} تعليق</span>
            <span>👁 {view.viewerCount.toLocaleString('ar-EG')} مشاهد</span>
          </div>

          {/* شريط الأكشن (مثل فيسبوك/تيك توك) */}
          <div className="yam-live-post-actions">
            <button
              type="button"
              className="yam-live-post-action"
              onClick={() => handleSendHeart(streamData.id)}
              aria-label="إعجاب"
            >
              <span>💜</span>
              <span>إعجاب</span>
            </button>
            <button
              type="button"
              className="yam-live-post-action"
              onClick={handleOpenStream}
              aria-label="تعليق"
            >
              <span>💬</span>
              <span>تعليق</span>
            </button>
            <button
              type="button"
              className="yam-live-post-action yam-live-post-action-primary"
              onClick={handleOpenStream}
              aria-label="دخول البث"
            >
              <span>▶</span>
              <span>دخول البث</span>
            </button>
            <button
              type="button"
              className="yam-live-post-action"
              onClick={(e) => {
                e.stopPropagation();
                try {
                  const url = `${window.location.origin}/live/view/${streamData.id}`;
                  if (navigator.share) {
                    navigator.share({ title: view.title, text: `${view.hostName} في بث مباشر الآن`, url }).catch(() => {});
                  } else {
                    navigator.clipboard?.writeText(url);
                    window.dispatchEvent(new CustomEvent('yamshat:toast', {
                      detail: { type: 'success', title: 'تم نسخ رابط البث', duration: 2200 },
                    }));
                  }
                } catch (_) { /* noop */ }
              }}
              aria-label="مشاركة"
            >
              <span>📤</span>
              <span>مشاركة</span>
            </button>
          </div>
        </motion.article>
      )}

      {/* الواجهة الكاملة للبث المباشر */}
      <AnimatePresence>
        {isExpanded && (
          <LiveStreamCard
            stream={streamData}
            onClose={handleCloseStream}
            onSendComment={handleSendComment}
            onSendGift={handleSendGift}
            onSendHeart={handleSendHeart}
            currentUser={currentUser}
            isViewer={!view.isHost}
          />
        )}
      </AnimatePresence>

      <style>{`
        /* ===== بطاقة البث كمنشور اجتماعي متناسق (فيسبوك/تيك توك ستايل) ===== */
        .yam-live-post-card {
          position: relative;
          width: 100%;
          padding: 0;
          margin: 12px 0;
          background: var(--bg-card, #ffffff);
          color: var(--text, #0f172a);
          border: 1px solid var(--line, rgba(148,163,184,0.18));
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 2px 6px rgba(15, 23, 42, 0.04);
          transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
        }
        .yam-live-post-card:hover {
          box-shadow: 0 12px 28px rgba(15, 23, 42, 0.10);
          border-color: rgba(124,58,237,0.35);
          transform: translateY(-2px);
        }

        /* شريط إشعار البث أعلى البطاقة */
        .yam-live-post-banner {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          background: linear-gradient(90deg, rgba(239,68,68,0.12), rgba(124,58,237,0.12));
          border-bottom: 1px solid rgba(239,68,68,0.18);
          font-size: 12px;
          font-weight: 700;
          color: #ef4444;
        }
        .yam-live-post-banner-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: #ef4444;
          box-shadow: 0 0 0 0 rgba(239,68,68,0.7);
          animation: yamLivePulse 1.6s infinite;
        }
        @keyframes yamLivePulse {
          0% { box-shadow: 0 0 0 0 rgba(239,68,68,0.7); }
          70% { box-shadow: 0 0 0 10px rgba(239,68,68,0); }
          100% { box-shadow: 0 0 0 0 rgba(239,68,68,0); }
        }

        /* الهيدر */
        .yam-live-post-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 12px 14px 8px;
        }
        .yam-live-post-author {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }
        .yam-live-post-avatar {
          position: relative;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          overflow: hidden;
          background: linear-gradient(135deg, #7c3aed, #3b82f6);
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .yam-live-post-avatar img {
          width: 100%; height: 100%; object-fit: cover;
        }
        .yam-live-post-avatar-fallback {
          color: #fff;
          font-weight: 800;
          font-size: 18px;
        }
        .yam-live-post-avatar-ring {
          position: absolute;
          inset: -3px;
          border-radius: 50%;
          border: 2px solid #ef4444;
          animation: yamLivePulse 1.6s infinite;
          pointer-events: none;
        }
        .yam-live-post-author-info {
          min-width: 0;
        }
        .yam-live-post-author-name {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          font-size: 14px;
        }
        .yam-live-post-author-name strong {
          font-weight: 800;
          color: var(--text, #0f172a);
        }
        .yam-live-post-live-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 8px;
          border-radius: 999px;
          background: linear-gradient(135deg, #ef4444, #f97316);
          color: #fff;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: .5px;
        }
        .yam-live-post-live-badge .dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #fff;
          animation: yamLivePulse 1.6s infinite;
        }
        .yam-live-post-author-meta {
          margin-top: 2px;
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
          font-size: 11px;
          color: var(--muted, #64748b);
        }
        .yam-live-post-more {
          width: 32px; height: 32px;
          border-radius: 50%;
          border: none;
          background: transparent;
          color: var(--muted, #64748b);
          font-size: 20px;
          cursor: pointer;
          transition: background .2s ease;
        }
        .yam-live-post-more:hover {
          background: rgba(148,163,184,0.12);
        }

        /* النص */
        .yam-live-post-body {
          padding: 4px 14px 10px;
        }
        .yam-live-post-title {
          margin: 0;
          font-size: 15px;
          line-height: 1.6;
          color: var(--text, #0f172a);
          font-weight: 600;
          word-break: break-word;
        }

        /* الميديا */
        .yam-live-post-media {
          position: relative;
          display: block;
          width: 100%;
          aspect-ratio: 16 / 9;
          padding: 0;
          margin: 0;
          border: none;
          background: linear-gradient(135deg, #0a0e27 0%, #1a0f3f 100%);
          cursor: pointer;
          overflow: hidden;
          color: inherit;
          font: inherit;
        }
        .yam-live-post-thumb {
          width: 100%; height: 100%;
          object-fit: cover;
          display: block;
        }
        .yam-live-post-thumb-placeholder {
          position: absolute; inset: 0;
          background:
            radial-gradient(circle at 30% 40%, rgba(124,58,237,.35), transparent 50%),
            radial-gradient(circle at 70% 60%, rgba(59,130,246,.35), transparent 50%),
            linear-gradient(135deg, #0a0e27 0%, #1a0f3f 100%);
        }
        .yam-live-post-thumb-glow {
          position: absolute;
          inset: -20%;
          background: radial-gradient(circle, rgba(239,68,68,0.25), transparent 60%);
          animation: yamLiveGlow 3s ease-in-out infinite;
        }
        @keyframes yamLiveGlow {
          0%, 100% { transform: scale(1); opacity: .8; }
          50% { transform: scale(1.15); opacity: 1; }
        }
        .yam-live-post-media-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(180deg,
            rgba(0,0,0,0.25) 0%,
            rgba(0,0,0,0.05) 35%,
            rgba(0,0,0,0.55) 100%);
          pointer-events: none;
        }
        .yam-live-post-live-tag {
          position: absolute;
          top: 12px;
          inset-inline-start: 12px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          background: #ef4444;
          color: #fff;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1px;
          border-radius: 6px;
          box-shadow: 0 4px 12px rgba(239,68,68,0.45);
        }
        .yam-live-post-live-tag .dot {
          width: 7px; height: 7px; border-radius: 50%; background: #fff;
          animation: yamLivePulse 1.6s infinite;
        }
        .yam-live-post-viewers {
          position: absolute;
          top: 12px;
          inset-inline-end: 12px;
          padding: 4px 10px;
          background: rgba(0,0,0,0.55);
          backdrop-filter: blur(8px);
          color: #fff;
          font-size: 11px;
          font-weight: 700;
          border-radius: 999px;
        }
        .yam-live-post-play {
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 64px; height: 64px;
          border-radius: 50%;
          background: rgba(255,255,255,0.92);
          color: #7c3aed;
          font-size: 24px;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 10px 28px rgba(0,0,0,0.35);
          transition: transform .25s ease, background .25s ease;
        }
        .yam-live-post-media:hover .yam-live-post-play {
          transform: translate(-50%, -50%) scale(1.08);
          background: #fff;
        }
        .yam-live-post-cta {
          position: absolute;
          bottom: 12px;
          inset-inline-end: 12px;
          padding: 8px 14px;
          background: linear-gradient(135deg, #7c3aed, #3b82f6);
          color: #fff;
          font-size: 12px;
          font-weight: 800;
          border-radius: 10px;
          box-shadow: 0 6px 18px rgba(124,58,237,0.45);
        }

        /* شريط الإحصائيات */
        .yam-live-post-stats {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
          padding: 10px 14px;
          font-size: 12px;
          color: var(--muted, #64748b);
          border-top: 1px solid var(--line, rgba(148,163,184,0.16));
        }

        /* شريط الأكشن */
        .yam-live-post-actions {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 4px;
          padding: 4px 6px 8px;
          border-top: 1px solid var(--line, rgba(148,163,184,0.16));
        }
        .yam-live-post-action {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 10px 8px;
          background: transparent;
          border: none;
          border-radius: 10px;
          color: var(--text, #0f172a);
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: background .2s ease, transform .15s ease, color .2s ease;
        }
        .yam-live-post-action:hover {
          background: rgba(124,58,237,0.08);
          color: #7c3aed;
        }
        .yam-live-post-action:active {
          transform: scale(0.97);
        }
        .yam-live-post-action-primary {
          background: linear-gradient(135deg, #7c3aed, #3b82f6);
          color: #fff !important;
          box-shadow: 0 6px 14px rgba(124,58,237,0.35);
        }
        .yam-live-post-action-primary:hover {
          background: linear-gradient(135deg, #6d28d9, #2563eb);
          color: #fff !important;
        }

        /* الوضع الداكن (يستخدم متغيرات الثيم تلقائياً) */
        @media (prefers-color-scheme: dark) {
          .yam-live-post-card {
            background: var(--bg-card, #0f172a);
            color: var(--text, #f1f5f9);
          }
          .yam-live-post-action {
            color: var(--text, #f1f5f9);
          }
          .yam-live-post-action:hover {
            background: rgba(124,58,237,0.18);
          }
        }

        /* تجاوب الجوال */
        @media (max-width: 640px) {
          .yam-live-post-card { border-radius: 14px; }
          .yam-live-post-banner { font-size: 11px; padding: 7px 12px; }
          .yam-live-post-header { padding: 10px 12px 6px; }
          .yam-live-post-avatar { width: 40px; height: 40px; }
          .yam-live-post-title { font-size: 14px; }
          .yam-live-post-media { aspect-ratio: 4 / 5; }
          .yam-live-post-play { width: 56px; height: 56px; font-size: 20px; }
          .yam-live-post-cta { font-size: 11px; padding: 7px 12px; }
          .yam-live-post-actions { grid-template-columns: repeat(4, 1fr); gap: 2px; padding: 4px; }
          .yam-live-post-action { font-size: 12px; padding: 9px 4px; }
          .yam-live-post-action span:nth-child(2) {
            display: inline;
          }
        }

        /* الديسكتوب: ارتفاع ميديا أوسع */
        @media (min-width: 1024px) {
          .yam-live-post-media { aspect-ratio: 16 / 9; }
          .yam-live-post-title { font-size: 16px; }
        }
      `}</style>
    </>
  );
}

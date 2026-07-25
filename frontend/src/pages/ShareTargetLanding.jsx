import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  readSharedPayload,
  clearSharedPayload,
  recommendTarget,
  stagePendingShare,
} from '../services/share/sharedIntake.js';

/**
 * ShareTargetLanding — v88.71 (إصلاح جذري لميزة "المشاركة إلى يام شات")
 * ---------------------------------------------------------------
 * السلوك الجديد المطابق لطلب المستخدم:
 *   عند مشاركة محتوى (فيديو / صورة / رابط يوتيوب / رابط ريلز خارجي … إلخ)
 *   من أي تطبيق آخر إلى منصة يام شات:
 *     1) SW يستقبل المحتوى ويحفظه في IndexedDB (بدون تغيير).
 *     2) هذه الصفحة تُفتح تلقائياً وتعرض:
 *          - معاينة سريعة للمحتوى المستلَم.
 *          - النص التوجيهي:
 *              "إذا كان المقطع صغيراً يرجى اختيار الريلز،
 *               وإذا كان المحتوى أكبر من اللازم اختر كمنشور."
 *          - زرّان بارزان: [ ريلز ] و [ منشور ].
 *          - توصية ذكية تُبرز الخيار الأنسب بناءً على النوع والحجم.
 *     3) عند اختيار [ ريلز ]  → تنقّل إلى /reels/new مع تجهيز الملف
 *        ليبدأ الرفع تلقائياً في بوست رفع الريلز مع شريط تقدم.
 *     4) عند اختيار [ منشور ] → تنقّل إلى /post/new مع تجهيز الملف
 *        ليبدأ الرفع تلقائياً في بوست رفع المنشور مع شريط تقدم،
 *        ومع وضع الرابط الأصلي (يوتيوب مثلاً) كوصف للمنشور.
 *     5) بعد اكتمال الرفع يضغط المستخدم "نشر" فيظهر المنشور/الريل
 *        في الفيد، وعند النقر على الرابط في الوصف يفتح المصدر
 *        الأصلي (يوتيوب) خارج التطبيق.
 * ---------------------------------------------------------------
 */
export default function ShareTargetLanding() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [payload, setPayload] = useState(null);
  const [previews, setPreviews] = useState([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let mounted = true;
    let urls = [];

    readSharedPayload()
      .then((data) => {
        if (!mounted) return;
        setPayload(data);
        const nextPreviews = (data?.files || []).map((file) => {
          let previewUrl = '';
          try {
            previewUrl = URL.createObjectURL(file.blob);
            urls.push(previewUrl);
          } catch { /* ignore */ }
          return {
            ...file,
            previewUrl,
            isImage: file.type?.startsWith('image/'),
            isVideo: file.type?.startsWith('video/'),
          };
        });
        setPreviews(nextPreviews);
      })
      .catch(() => {
        if (mounted) setPayload(null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
      urls.forEach((url) => {
        try { URL.revokeObjectURL(url); } catch { /* ignore */ }
      });
    };
  }, []);

  // توصية ذكية بناءً على نوع/حجم المحتوى
  const recommendation = useMemo(() => recommendTarget(payload), [payload]);

  const summaryText = useMemo(() => {
    if (!payload) {
      return 'افتح التطبيق من خيار "مشاركة" في يوتيوب أو أي تطبيق آخر لإرسال المحتوى إلى يام شات.';
    }
    const pieces = [];
    if (payload.title) pieces.push(payload.title);
    if (payload.text && payload.text !== payload.title) pieces.push(payload.text);
    if (payload.url) pieces.push(payload.url);
    return pieces.join(' • ') || 'تم استلام محتوى جديد من ميزة المشاركة.';
  }, [payload]);

  const goTo = (target) => {
    if (busy) return;
    setBusy(true);
    try {
      // نُخزّن الحمولة في الذاكرة/الجلسة حتى يقرأها الكومبوزر عند التركيب
      stagePendingShare(payload, target);
    } catch { /* ignore */ }

    if (target === 'reel') {
      navigate('/reels/new?from=share');
    } else {
      // منشور — بوست رفع المنشور
      navigate('/post/new?tab=post&from=share');
    }
  };

  const openFeed = async () => {
    await clearSharedPayload().catch(() => null);
    navigate('/');
  };

  const isReelRecommended = recommendation.target === 'reel';

  return (
    <section className="share-target-page" dir="rtl">
      <div className="share-target-card">
        <div className="share-target-badge">مشاركة إلى يام شات</div>
        <h1>إلى أين تريد نشر هذا المحتوى؟</h1>
        <p className="share-target-summary">
          {loading ? 'جاري تحضير المحتوى المُشارك...' : summaryText}
        </p>

        {!loading && (previews.length > 0 || payload?.url) ? (
          <div className="share-preview-grid">
            {previews.map((file) => (
              <article key={file.id} className="share-preview-card">
                {file.isImage && file.previewUrl ? (
                  <img src={file.previewUrl} alt={file.name} loading="lazy" />
                ) : file.isVideo && file.previewUrl ? (
                  <video src={file.previewUrl} controls preload="metadata" />
                ) : (
                  <div className="share-file-fallback">{file.name || 'ملف مُشارك'}</div>
                )}
                <div className="share-file-meta">
                  <strong>{file.name || 'ملف مُشارك'}</strong>
                  <span>{Math.max(1, Math.round((file.size || 0) / 1024))} KB</span>
                </div>
              </article>
            ))}

            {previews.length === 0 && payload?.url ? (
              <article className="share-preview-card share-preview-card--link">
                <div className="share-link-preview">
                  <div className="share-link-icon" aria-hidden="true">🔗</div>
                  <div className="share-link-body">
                    <strong>{payload.title || 'رابط خارجي'}</strong>
                    <span>{payload.url}</span>
                  </div>
                </div>
                <div className="share-file-meta">
                  <strong>سيُوضع الرابط كوصف للمنشور</strong>
                  <span>عند الضغط عليه يفتح خارج التطبيق (مثال: يوتيوب).</span>
                </div>
              </article>
            ) : null}
          </div>
        ) : null}

        {!loading && !payload ? (
          <div className="share-empty-box">
            <strong>لا يوجد محتوى مُستلم حالياً</strong>
            <span>
              افتح يوتيوب (أو أي تطبيق) → اضغط زر <b>مشاركة</b> → اختر <b>Yamshat</b>،
              وستعود إلى هذه الصفحة تلقائياً.
            </span>
          </div>
        ) : null}

        {!loading && payload ? (
          <>
            <div className="share-choose-hint">
              <div className="share-choose-hint-icon" aria-hidden="true">💡</div>
              <div className="share-choose-hint-text">
                <strong>اختر وجهة النشر:</strong>
                <span>
                  إذا كان المقطع صغيراً يُرجى اختيار <b>الريلز</b>،
                  وإذا كان المحتوى أكبر من اللازم اختر <b>منشور</b>.
                </span>
                {recommendation?.hint ? (
                  <span className="share-choose-recommend">
                    ⭐ التوصية:
                    <b style={{ margin: '0 6px' }}>{isReelRecommended ? 'ريلز' : 'منشور'}</b>
                    — {recommendation.hint}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="share-choose-grid">
              <button
                type="button"
                className={`share-choose-btn ${isReelRecommended ? 'is-recommended' : ''}`}
                onClick={() => goTo('reel')}
                disabled={busy}
              >
                <span className="share-choose-emoji" aria-hidden="true">🎬</span>
                <span className="share-choose-title">ريلز</span>
                <span className="share-choose-sub">للمقاطع القصيرة</span>
                {isReelRecommended ? <span className="share-choose-badge">موصى به</span> : null}
              </button>

              <button
                type="button"
                className={`share-choose-btn ${!isReelRecommended ? 'is-recommended' : ''}`}
                onClick={() => goTo('post')}
                disabled={busy}
              >
                <span className="share-choose-emoji" aria-hidden="true">📝</span>
                <span className="share-choose-title">منشور</span>
                <span className="share-choose-sub">صور • فيديو طويل • رابط</span>
                {!isReelRecommended ? <span className="share-choose-badge">موصى به</span> : null}
              </button>
            </div>
          </>
        ) : null}

        <div className="share-actions">
          <button type="button" className="share-action" onClick={openFeed}>
            إلغاء والعودة للفيد
          </button>
          <Link to="/" className="share-link-inline">عودة للتطبيق</Link>
        </div>

        {searchParams.get('shared') === '0' ? (
          <div className="share-error-note">
            تعذّر استلام المشاركة بالكامل. جرّب المشاركة مرة أخرى من التطبيق المصدر.
          </div>
        ) : null}
      </div>

      <style>{`
        .share-target-page {
          min-height: 100dvh;
          padding: calc(24px + env(safe-area-inset-top, 0px)) 16px calc(32px + env(safe-area-inset-bottom, 0px));
          background: radial-gradient(circle at top, rgba(99, 102, 241, 0.18), transparent 32%), #020617;
          color: #fff;
        }

        .share-target-card {
          width: min(980px, 100%);
          margin: 0 auto;
          display: grid;
          gap: 16px;
          padding: 22px;
          border-radius: 28px;
          background: rgba(15, 23, 42, 0.92);
          border: 1px solid rgba(148, 163, 184, 0.14);
          box-shadow: 0 30px 60px rgba(2, 6, 23, 0.32);
        }

        .share-target-badge {
          width: fit-content;
          padding: 6px 12px;
          border-radius: 999px;
          background: rgba(139, 92, 246, 0.16);
          color: #c4b5fd;
          font-size: 0.82rem;
          font-weight: 800;
        }

        .share-target-card h1 {
          margin: 0;
          font-size: clamp(1.5rem, 3vw, 2.2rem);
          line-height: 1.35;
        }

        .share-target-summary {
          margin: 0;
          color: #cbd5e1;
          line-height: 1.7;
          word-break: break-word;
        }

        .share-preview-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 14px;
        }

        .share-preview-card {
          overflow: hidden;
          border-radius: 20px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          display: flex;
          flex-direction: column;
        }

        .share-preview-card img,
        .share-preview-card video,
        .share-file-fallback {
          width: 100%;
          aspect-ratio: 1 / 1;
          object-fit: cover;
          display: block;
          background: rgba(15,23,42,0.85);
        }

        .share-file-fallback {
          display: grid;
          place-items: center;
          color: #cbd5e1;
          padding: 16px;
          text-align: center;
        }

        .share-preview-card--link .share-link-preview {
          display: flex;
          gap: 12px;
          padding: 18px;
          align-items: center;
          background: linear-gradient(135deg, rgba(139,92,246,0.14), rgba(59,130,246,0.10));
          aspect-ratio: 1 / 1;
        }

        .share-link-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: rgba(255,255,255,0.08);
          display: grid;
          place-items: center;
          font-size: 24px;
          flex-shrink: 0;
        }

        .share-link-body {
          display: grid;
          gap: 6px;
          min-width: 0;
        }

        .share-link-body strong {
          font-size: 0.95rem;
        }

        .share-link-body span {
          font-size: 0.8rem;
          color: #93c5fd;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          direction: ltr;
        }

        .share-file-meta {
          display: grid;
          gap: 4px;
          padding: 12px;
        }

        .share-file-meta strong {
          font-size: 0.92rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .share-file-meta span,
        .share-empty-box span,
        .share-error-note {
          color: #94a3b8;
          font-size: 0.88rem;
        }

        .share-empty-box,
        .share-error-note {
          padding: 14px 16px;
          border-radius: 18px;
          background: rgba(255,255,255,0.04);
          border: 1px dashed rgba(148,163,184,0.2);
          display: grid;
          gap: 6px;
        }

        /* ======= توجيه الاختيار ======= */
        .share-choose-hint {
          display: flex;
          gap: 12px;
          padding: 14px 16px;
          border-radius: 18px;
          background: linear-gradient(180deg, rgba(139,92,246,0.14), rgba(99,102,241,0.08));
          border: 1px solid rgba(167,139,250,0.28);
        }

        .share-choose-hint-icon {
          font-size: 22px;
          line-height: 1;
        }

        .share-choose-hint-text {
          display: grid;
          gap: 6px;
        }

        .share-choose-hint-text strong {
          color: #f5f3ff;
          font-size: 0.98rem;
        }

        .share-choose-hint-text span {
          color: #cbd5e1;
          font-size: 0.9rem;
          line-height: 1.75;
        }

        .share-choose-recommend {
          color: #a7f3d0 !important;
          font-size: 0.88rem !important;
        }

        /* ======= زرّا الاختيار ======= */
        .share-choose-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
        }

        .share-choose-btn {
          position: relative;
          display: grid;
          gap: 6px;
          padding: 18px 16px 20px;
          border-radius: 20px;
          border: 1px solid rgba(148,163,184,0.22);
          background: rgba(255,255,255,0.045);
          color: #fff;
          text-align: center;
          cursor: pointer;
          font-family: 'Noto Sans Arabic','Tajawal',system-ui,sans-serif;
          transition: transform 0.15s ease, background 0.2s ease, border-color 0.2s ease;
          min-height: 130px;
        }

        .share-choose-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          background: rgba(255,255,255,0.08);
          border-color: rgba(167,139,250,0.55);
        }

        .share-choose-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .share-choose-btn.is-recommended {
          background: linear-gradient(135deg, rgba(139,92,246,0.22), rgba(99,102,241,0.16));
          border-color: rgba(167,139,250,0.65);
          box-shadow: 0 0 0 3px rgba(139,92,246,0.12);
        }

        .share-choose-emoji {
          font-size: 32px;
          line-height: 1;
        }

        .share-choose-title {
          font-size: 1.1rem;
          font-weight: 900;
        }

        .share-choose-sub {
          font-size: 0.82rem;
          color: #cbd5e1;
        }

        .share-choose-badge {
          position: absolute;
          top: 10px;
          inset-inline-end: 10px;
          padding: 3px 10px;
          border-radius: 999px;
          background: rgba(16,185,129,0.22);
          color: #6ee7b7;
          font-size: 0.72rem;
          font-weight: 800;
        }

        /* ======= أزرار ثانوية ======= */
        .share-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          align-items: center;
          margin-top: 4px;
        }

        .share-action,
        .share-link-inline {
          min-height: 44px;
          padding: 0 16px;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.04);
          color: #fff;
          font-weight: 800;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          cursor: pointer;
        }
      `}</style>
    </section>
  );
}

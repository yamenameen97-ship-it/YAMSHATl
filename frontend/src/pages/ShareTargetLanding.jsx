import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  readSharedPayload,
  clearSharedPayload,
  recommendTarget,
  stagePendingShare,
} from '../services/share/sharedIntake.js';
import { useAppStore } from '../store/appStore.js';

/**
 * ShareTargetLanding — v88.82
 * ---------------------------------------------------------------
 * v88.82 — النقطة (4/الجزء الأول): تفعيل ربط الاستهلاك لصفحتي Chat و Groups
 *   - إزالة ready:false وشارة "قريباً" من أزرار Chat و Groups.
 *   - الربط الفعلي لـ consumePendingShare('chat') و ('groups')
 *     مُضاف الآن في Inbox.jsx و GroupsHome.jsx (مع فقاعة اختيار + عدّاد رفع).
 *
 * السلوك الجديد المطابق لطلب المستخدم (المرحلة الأولى — نقطتان فقط):
 *
 *   (1) فحص تسجيل الدخول أولاً + رسالة واضحة إذا كان مسجّل خروج
 *       - نقرأ الجلسة من appStore. إن لم تكن الجلسة موجودة نعرض بطاقة
 *         واضحة: "سجّل دخولك أولاً" مع زر يوجّه إلى /login.
 *       - الحمولة المُستلمة تبقى محفوظة في IndexedDB بدون استهلاك،
 *         فيعود المستخدم إليها بعد تسجيل الدخول تلقائياً (ShareTargetLanding
 *         نفسها هي الوجهة، والحمولة تُقرأ من readSharedPayload كما هي).
 *
 *   (2) توسيع خيارات الوجهة إلى 5 خيارات:
 *         🎬 ريلز   → /reels/new?from=share
 *         📝 منشور  → /post/new?tab=post&from=share
 *         📸 ستوري → /stories?from=share&intent=new
 *         💬 شات    → /chat?from=share
 *         👥 مجموعات → /groups?from=share
 *
 *   ملاحظة (النقاط 3 و 4 مؤجّلة لجلسة لاحقة كما اتّفقنا):
 *     - النقطة 3: فتح البست/الفقاعة المخصصة لكل صفحة مع عداد التحميل.
 *     - النقطة 4: حفظ الحمولة لكل وجهة عبر sharedIntake بحيث تُستهلك
 *       بشكل صحيح في story/chat/groups (post و reel يعملان أصلاً منذ v88.71).
 *   في هذه الجلسة: sharedIntake تدعم القائمة الخمسة (stagePendingShare
 *   يقبل الوجهات الجديدة)، لكن ربط الاستهلاك في صفحات story/chat/groups
 *   سيتم في الجلسة اللاحقة كما طلبت.
 * ---------------------------------------------------------------
 */

// ✅ v88.80: تعريف الوجهات الخمس (label + emoji + path + sub + الحالة)
const TARGETS = [
  {
    key: 'reel',
    emoji: '🎬',
    title: 'ريلز',
    sub: 'مقاطع فيديو قصيرة',
    path: '/reels/new?from=share',
    // ready = مربوط بالاستهلاك في الكومبوزر (post و reel جاهزَان منذ v88.71)
    ready: true,
  },
  {
    key: 'post',
    emoji: '📝',
    title: 'منشور',
    sub: 'صور • فيديو طويل • رابط',
    path: '/post/new?tab=post&from=share',
    ready: true,
  },
  {
    key: 'story',
    emoji: '📸',
    title: 'ستوري',
    sub: 'تختفي بعد 24 ساعة',
    path: '/stories?from=share&intent=new',
    // ✅ v88.81 — تم ربط الاستهلاك في StoriesPage.jsx
    ready: true,
  },
  {
    key: 'chat',
    emoji: '💬',
    title: 'شات',
    sub: 'إرسال في محادثة',
    path: '/chat?from=share',
    // ✅ v88.82 — تم ربط الاستهلاك في Inbox.jsx (فقاعة اختيار محادثة + عدّاد رفع)
    ready: true,
  },
  {
    key: 'groups',
    emoji: '👥',
    title: 'مجموعات',
    sub: 'نشر في مجموعة',
    path: '/groups?from=share',
    // ✅ v88.82 — تم ربط الاستهلاك في GroupsHome.jsx (فقاعة اختيار مجموعة + عدّاد رفع)
    ready: true,
  },
];

export default function ShareTargetLanding() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [payload, setPayload] = useState(null);
  const [previews, setPreviews] = useState([]);
  const [busy, setBusy] = useState(false);

  // ✅ v88.80 — النقطة (1): فحص تسجيل الدخول
  const session = useAppStore((state) => state.session);
  const authHydrated = useAppStore((state) => state.authHydrated);
  const authLoading = useAppStore((state) => state.authLoading);
  const isAuthenticated = Boolean(session?.username || session?.user || session?.email);

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

  const goTo = (targetKey) => {
    if (busy) return;
    const target = TARGETS.find((t) => t.key === targetKey);
    if (!target) return;

    // النقطة 3 و 4 مؤجّلة: story/chat/groups لم تُربط بعد باستهلاك sharedIntake.
    // نبقي زر الاختيار مرئياً (كما طلب المستخدم) لكن ننبّه أنه يفعّل لاحقاً.
    if (!target.ready) {
      try {
        // نحفظ الحمولة على أي حال حتى تبقى في IndexedDB لجلسة الربط اللاحقة
        stagePendingShare(payload, targetKey);
      } catch { /* ignore */ }
      // ننقل المستخدم إلى الصفحة، والصفحة نفسها ستتعامل مع الاستهلاك
      // عند إضافة الربط في المرحلة القادمة (النقطة 3 و 4).
      navigate(target.path);
      return;
    }

    setBusy(true);
    try {
      stagePendingShare(payload, targetKey);
    } catch { /* ignore */ }
    navigate(target.path);
  };

  const openFeed = async () => {
    await clearSharedPayload().catch(() => null);
    navigate('/');
  };

  const goLogin = () => {
    // نُبقي الحمولة في IndexedDB (لا نمسحها) حتى تُقرأ بعد العودة إلى نفس الصفحة
    // بعد تسجيل الدخول. صفحة تسجيل الدخول ستوجّه إلى الجذر عادةً، والمستخدم
    // يستطيع العودة إلى المشاركة عبر إعادة المشاركة من التطبيق الخارجي أو
    // بالضغط على إشعار الميزة إذا كان مفعّلاً.
    navigate('/login', { state: { from: { pathname: '/share-target', search: '?shared=1' } } });
  };

  // ✅ v88.80 — رسالة "سجّل دخولك أولاً" (النقطة 1)
  const showLoginGate = authHydrated && !authLoading && !isAuthenticated;

  return (
    <section className="share-target-page" dir="rtl">
      <div className="share-target-card">
        <div className="share-target-badge">مشاركة إلى يام شات</div>
        <h1>إلى أين تريد نشر هذا المحتوى؟</h1>

        {/* ✅ v88.80 — بوابة تسجيل الدخول (النقطة 1) */}
        {(!authHydrated || authLoading) ? (
          <div className="share-empty-box">
            <strong>جارٍ التحقّق من الجلسة...</strong>
            <span>لحظات وسنعرض لك خيارات المشاركة.</span>
          </div>
        ) : showLoginGate ? (
          <div className="share-login-gate" role="alert">
            <div className="share-login-gate-icon" aria-hidden="true">🔒</div>
            <div className="share-login-gate-body">
              <strong>سجّل دخولك أولاً</strong>
              <span>
                لا يمكنك مشاركة المحتوى إلى يام شات قبل تسجيل الدخول.
                المحتوى المُستلَم محفوظ مؤقتاً وسيظهر لك بعد تسجيل الدخول
                مباشرة للاختيار بين ريلز / منشور / ستوري / شات / مجموعات.
              </span>
              <div className="share-login-gate-actions">
                <button type="button" className="share-primary" onClick={goLogin}>
                  تسجيل الدخول
                </button>
                <Link to="/" className="share-link-inline">إلغاء والعودة للتطبيق</Link>
              </div>
            </div>
          </div>
        ) : (
          <>
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
                      المقاطع القصيرة أنسبها <b>ريلز</b>، والمحتوى الأكبر <b>منشور</b>،
                      واللحظات السريعة <b>ستوري</b>، والمشاركة الخاصة <b>شات</b>،
                      وللنشر داخل جماعتك اختر <b>مجموعات</b>.
                    </span>
                    {recommendation?.hint ? (
                      <span className="share-choose-recommend">
                        ⭐ التوصية:
                        <b style={{ margin: '0 6px' }}>
                          {(TARGETS.find((t) => t.key === recommendation.target) || TARGETS[1]).title}
                        </b>
                        — {recommendation.hint}
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* ✅ v88.80 — 5 أزرار (النقطة 2) */}
                <div className="share-choose-grid share-choose-grid--five">
                  {TARGETS.map((t) => {
                    const isRecommended = recommendation?.target === t.key;
                    return (
                      <button
                        key={t.key}
                        type="button"
                        className={`share-choose-btn ${isRecommended ? 'is-recommended' : ''} ${!t.ready ? 'is-pending' : ''}`}
                        onClick={() => goTo(t.key)}
                        disabled={busy}
                        aria-label={`مشاركة إلى ${t.title}`}
                      >
                        <span className="share-choose-emoji" aria-hidden="true">{t.emoji}</span>
                        <span className="share-choose-title">{t.title}</span>
                        <span className="share-choose-sub">{t.sub}</span>
                        {isRecommended ? <span className="share-choose-badge">موصى به</span> : null}
                        {!t.ready ? <span className="share-choose-soon">قريباً</span> : null}
                      </button>
                    );
                  })}
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
          </>
        )}
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

        /* ✅ v88.80 — بوابة تسجيل الدخول */
        .share-login-gate {
          display: flex;
          gap: 16px;
          padding: 22px 20px;
          border-radius: 22px;
          background: linear-gradient(180deg, rgba(239, 68, 68, 0.14), rgba(220, 38, 38, 0.06));
          border: 1px solid rgba(248, 113, 113, 0.35);
          align-items: flex-start;
        }

        .share-login-gate-icon {
          font-size: 34px;
          line-height: 1;
          flex-shrink: 0;
          background: rgba(255,255,255,0.06);
          width: 56px;
          height: 56px;
          border-radius: 16px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(255,255,255,0.08);
        }

        .share-login-gate-body {
          display: grid;
          gap: 10px;
          flex: 1;
          min-width: 0;
        }

        .share-login-gate-body strong {
          color: #fecaca;
          font-size: 1.15rem;
          font-weight: 900;
        }

        .share-login-gate-body span {
          color: #e2e8f0;
          font-size: 0.95rem;
          line-height: 1.85;
        }

        .share-login-gate-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 6px;
          align-items: center;
        }

        .share-primary {
          min-height: 46px;
          padding: 0 22px;
          border-radius: 14px;
          border: 1px solid transparent;
          background: linear-gradient(135deg, #8b5cf6, #6366f1);
          color: #fff;
          font-weight: 900;
          font-size: 0.98rem;
          cursor: pointer;
          font-family: inherit;
          box-shadow: 0 12px 24px rgba(99, 102, 241, 0.28);
        }

        .share-primary:hover {
          transform: translateY(-1px);
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

        /* ======= شبكة الأزرار الخمسة ======= */
        .share-choose-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 12px;
        }

        /* ✅ v88.80 — تخطيط مخصّص لخمسة أزرار (يبقى مرن على كل الشاشات) */
        .share-choose-grid--five {
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        }
        @media (min-width: 780px) {
          .share-choose-grid--five {
            grid-template-columns: repeat(5, minmax(0, 1fr));
          }
        }

        .share-choose-btn {
          position: relative;
          display: grid;
          gap: 6px;
          padding: 18px 12px 20px;
          border-radius: 20px;
          border: 1px solid rgba(148,163,184,0.22);
          background: rgba(255,255,255,0.045);
          color: #fff;
          text-align: center;
          cursor: pointer;
          font-family: 'Noto Sans Arabic','Tajawal',system-ui,sans-serif;
          transition: transform 0.15s ease, background 0.2s ease, border-color 0.2s ease;
          min-height: 140px;
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

        .share-choose-btn.is-pending {
          opacity: 0.86;
        }

        .share-choose-emoji {
          font-size: 30px;
          line-height: 1;
        }

        .share-choose-title {
          font-size: 1.05rem;
          font-weight: 900;
        }

        .share-choose-sub {
          font-size: 0.78rem;
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
          font-size: 0.7rem;
          font-weight: 800;
        }

        .share-choose-soon {
          position: absolute;
          top: 10px;
          inset-inline-start: 10px;
          padding: 3px 8px;
          border-radius: 999px;
          background: rgba(148,163,184,0.22);
          color: #cbd5e1;
          font-size: 0.68rem;
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

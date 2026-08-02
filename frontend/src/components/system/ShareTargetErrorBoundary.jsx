import React from 'react';
import logger from '../../utils/logger.js';

/**
 * ShareTargetErrorBoundary — v89.04 ROOT FIX #6
 * -----------------------------------------------------------------
 * حدود خطأ متخصّصة لمسار /share-target فقط.
 *
 * السبب الجذري (المشكلة #6):
 *   AppErrorBoundary العام يُغلّف <Suspense> الذي يحمل ShareTargetLanding
 *   عبر lazy(). عند فشل تحميل الـ chunk (SW قديم / شبكة ضعيفة):
 *     - React يرمي ChunkLoadError غير مُلتقَط داخل Suspense
 *     - قبل أن يصل الخطأ إلى AppErrorBoundary، الشجرة كلها تنهار
 *     - المستخدم يرى صفحة بيضاء بدلاً من واجهة تعافٍ
 *
 * الحل:
 *   - غلاف مُخصَّص يُلتقط أي خطأ يحدث في المسار /share-target تحديداً
 *   - لا يقوم بأي reload تلقائي (يفقد الحمولة من IndexedDB)
 *   - يعرض واجهة تعافٍ يدوية مع خيار "افتح التطبيق" (يذهب للجذر مع حفظ الحمولة)
 *   - يُلتقط أخطاء ChunkLoadError + أخطاء runtime عامة داخل ShareTargetLanding
 *   - يعمل حتى لو كان AppErrorBoundary فوقه (Boundary الأدنى يفوز أولاً)
 */

function isChunkError(error) {
  if (!error) return false;
  const msg = String(error?.message || '');
  const name = String(error?.name || '');
  return (
    name === 'ChunkLoadError' ||
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('Loading chunk') ||
    msg.includes('Importing a module script failed') ||
    msg.includes('Failed to fetch') ||
    /Loading CSS chunk/i.test(msg)
  );
}

export default class ShareTargetErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, isChunk: false };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
      isChunk: isChunkError(error),
    };
  }

  componentDidCatch(error, info) {
    try {
      logger.error('[ShareTargetErrorBoundary] caught', {
        message: error?.message,
        stack: error?.stack,
        componentStack: info?.componentStack,
      });
    } catch (_) { /* ignore */ }
    // مهم: لا نقوم بأي window.location.reload() تلقائي هنا.
    // reload أثناء استقبال المشاركة قد يُفقِد الحمولة من IndexedDB إذا لم
    // يكن SW قد ثبّتها بعد.
  }

  handleRetry = () => {
    // ✅ v89.19 ROOT FIX #4: تتبّع عدد محاولات الإعادة لمنع حلقة لانهائية
    //   إذا تكرّر الخطأ أكثر من 3 مرات خلال الجلسة، نأخذ مساراً مختلفاً
    try {
      const raw = sessionStorage.getItem('yamshat_share_error_retries');
      const n = raw ? parseInt(raw, 10) || 0 : 0;
      if (n >= 3) {
        // تجاوز 3 محاولات → انتقل للجذر بدل حلقة error متكرّرة
        try { sessionStorage.removeItem('yamshat_share_error_retries'); } catch (_) { /* ignore */ }
        this.handleGoHome();
        return;
      }
      sessionStorage.setItem('yamshat_share_error_retries', String(n + 1));
    } catch (_) { /* ignore */ }
    // إعادة render فقط — قد يكون chunk قد تم تنزيله في هذه اللحظة
    this.setState({ hasError: false, error: null, isChunk: false });
  };

  handleGoHome = () => {
    // الانتقال للجذر مع الاحتفاظ بالحمولة (IndexedDB يستمر)
    try {
      window.location.replace('/#/');
    } catch (_) {
      try { window.location.href = '/'; } catch (__) { /* ignore */ }
    }
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const { isChunk } = this.state;
    const title = isChunk ? 'تعذّر تحميل صفحة المشاركة' : 'حدث خطأ أثناء استقبال المشاركة';
    const body = isChunk
      ? 'قد يكون هناك تحديث جديد للتطبيق. اضغط "إعادة المحاولة" لتحميل الصفحة مجدداً دون فقدان المحتوى المُشارَك.'
      : 'المحتوى المُشارَك محفوظ مؤقتاً. يمكنك المحاولة مرة أخرى أو الانتقال للتطبيق ثم إعادة فتح المشاركة.';

    return (
      <section
        className="share-target-page"
        dir="rtl"
        style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: '#0A0D1A' }}
      >
        <div
          className="share-target-card"
          style={{ maxWidth: 560, width: '100%', color: '#fff', textAlign: 'center', background: 'rgba(139, 92, 246, 0.08)', padding: '32px 24px', borderRadius: 20, border: '1px solid rgba(139, 92, 246, 0.25)' }}
        >
          <div style={{ fontSize: 48, marginBottom: 12 }} aria-hidden="true">⚠️</div>
          <h1 style={{ fontSize: 22, marginBottom: 12, fontWeight: 800 }}>{title}</h1>
          <p style={{ opacity: 0.85, lineHeight: 1.8, marginBottom: 24 }}>{body}</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={this.handleRetry}
              style={{ padding: '12px 24px', borderRadius: 14, background: 'linear-gradient(135deg,#8B5CF6,#EC4899)', color: '#fff', border: 0, fontWeight: 800, fontSize: 15, cursor: 'pointer' }}
            >
              🔄 إعادة المحاولة
            </button>
            <button
              type="button"
              onClick={this.handleGoHome}
              style={{ padding: '12px 24px', borderRadius: 14, background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.25)', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}
            >
              الانتقال للتطبيق
            </button>
          </div>
          <p style={{ opacity: 0.6, fontSize: 12, marginTop: 20 }}>
            المحتوى المُستَلَم من التطبيق الخارجي (يوتيوب/تيك توك/...) لا يزال محفوظاً محلياً.
          </p>
        </div>
      </section>
    );
  }
}

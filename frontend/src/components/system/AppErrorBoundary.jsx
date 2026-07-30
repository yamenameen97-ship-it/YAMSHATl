import React from 'react';
import Button from '../ui/Button.jsx';
import logger from '../../utils/logger.js';

// ✅ v89.02 ROOT FIX #5: منع حلقة reload اللانهائية عند ChunkLoadError
//   السبب الجذري:
//     قبل الإصلاح كان auto-reload يحدث بعد 1s عند أي ChunkLoadError. إذا فشل
//     تحميل chunk (مثل ShareTargetLanding) بسبب Service Worker قديم عالق يخدم
//     ملفات hash قديمة، فإن reload لا يحل المشكلة → SW يعيد نفس الملفات القديمة
//     → chunk error مرة أخرى → حلقة reload لا نهائية → شاشة بيضاء دائمة.
//
//   الحل متعدد الطبقات:
//     1) عدّاد محاولات صارم في sessionStorage (بحد أقصى محاولتان).
//     2) قبل reload نلغي تسجيل جميع Service Workers ونحذف كل caches،
//        لكسر شبح SW القديم الذي يخدم chunks بأسماء قديمة.
//     3) داخل مسار /share-target: نتجنّب أي reload تلقائي إطلاقاً — نعرض
//        واجهة يدوية لأن reload أثناء استقبال المشاركة يفقد الحمولة.
//     4) بعد استنفاد المحاولات: نعرض شاشة خطأ نهائية بزر "تنظيف وإعادة تحميل"
//        الذي يقوم بالتنظيف الكامل قبل reload.

const CHUNK_RELOAD_KEY = 'yamshat_chunk_reload_count';
const CHUNK_RELOAD_TS_KEY = 'yamshat_chunk_reload_ts';
const MAX_CHUNK_RELOADS = 2;
const RELOAD_WINDOW_MS = 30_000; // نافذة 30 ثانية

function isInShareTargetPath() {
  try {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname || '';
    const hash = window.location.hash || '';
    return path === '/share-target'
      || path.startsWith('/share-target/')
      || hash.startsWith('#/share-target')
      || hash.includes('/share-target');
  } catch (_) {
    return false;
  }
}

async function purgeServiceWorkersAndCaches() {
  try {
    if (typeof navigator !== 'undefined' && navigator.serviceWorker) {
      const regs = await navigator.serviceWorker.getRegistrations().catch(() => []);
      await Promise.all((regs || []).map((r) => r.unregister().catch(() => null)));
    }
  } catch (_) { /* ignore */ }
  try {
    if (typeof caches !== 'undefined') {
      const keys = await caches.keys().catch(() => []);
      await Promise.all((keys || []).map((k) => caches.delete(k).catch(() => null)));
    }
  } catch (_) { /* ignore */ }
}

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      message: '',
      isChunkError: false,
      exhaustedReloads: false,
      inShareTarget: false,
    };
  }

  static getDerivedStateFromError(error) {
    const isChunkError =
      error?.message?.includes('Failed to fetch dynamically imported module') ||
      error?.name === 'ChunkLoadError' ||
      error?.message?.includes('Loading chunk') ||
      error?.message?.includes('Importing a module script failed');

    return {
      hasError: true,
      message: error?.message || 'حدث خطأ غير متوقع.',
      isChunkError,
      inShareTarget: isInShareTargetPath(),
    };
  }

  componentDidCatch(error, errorInfo) {
    logger.error('app error boundary caught an error', {
      message: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
    });

    if (!this.state.isChunkError) return;

    // ✅ v89.02 ROOT FIX #5 — الحماية (3): داخل مسار /share-target لا نُطلق أي
    //   reload تلقائي (يفقد الحمولة). المستخدم يستطيع الضغط يدوياً على الزر.
    if (this.state.inShareTarget) {
      logger.info('ChunkLoadError inside /share-target — auto-reload suppressed to preserve payload');
      return;
    }

    let count = 0;
    let lastTs = 0;
    try {
      count = parseInt(sessionStorage.getItem(CHUNK_RELOAD_KEY) || '0', 10) || 0;
      lastTs = parseInt(sessionStorage.getItem(CHUNK_RELOAD_TS_KEY) || '0', 10) || 0;
    } catch (_) { /* ignore */ }

    const now = Date.now();

    // إذا انقضت نافذة إعادة المحاولة (>30s) نصفّر العدّاد.
    if (lastTs && now - lastTs > RELOAD_WINDOW_MS) {
      count = 0;
    }

    // ✅ v89.02 ROOT FIX #5 — الحماية (1): بحد أقصى محاولتان في نافذة 30s.
    if (count >= MAX_CHUNK_RELOADS) {
      logger.warn(`ChunkLoadError reload cap reached (${count}) — showing manual recovery UI`);
      this.setState({ exhaustedReloads: true });
      return;
    }

    try {
      sessionStorage.setItem(CHUNK_RELOAD_KEY, String(count + 1));
      sessionStorage.setItem(CHUNK_RELOAD_TS_KEY, String(now));
    } catch (_) { /* ignore */ }

    logger.info(`Chunk load error detected (attempt ${count + 1}/${MAX_CHUNK_RELOADS}), purging SW+caches then reloading`);

    // ✅ v89.02 ROOT FIX #5 — الحماية (2): قبل reload نُلغي تسجيل SW ونمسح caches
    //   لكسر شبح SW القديم الذي قد يخدم chunks قديمة.
    setTimeout(async () => {
      await purgeServiceWorkersAndCaches();
      try {
        window.location.reload();
      } catch (_) { /* ignore */ }
    }, 1000);
  }

  handleReload = () => {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.removeItem(CHUNK_RELOAD_KEY);
      sessionStorage.removeItem(CHUNK_RELOAD_TS_KEY);
    } catch (_) { /* ignore */ }
    window.location.reload();
  };

  handleHardRecover = async () => {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.removeItem(CHUNK_RELOAD_KEY);
      sessionStorage.removeItem(CHUNK_RELOAD_TS_KEY);
    } catch (_) { /* ignore */ }
    await purgeServiceWorkersAndCaches();
    try {
      // ننتقل إلى الجذر لتفادي إعادة الدخول على مسار مكسور مثل /share-target
      window.location.replace('/');
    } catch (_) {
      try { window.location.reload(); } catch (__) { /* ignore */ }
    }
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const { isChunkError, exhaustedReloads, inShareTarget, message } = this.state;

    // شاشة خاصّة إذا استنفدنا محاولات إعادة التحميل أو كنّا داخل /share-target
    const isTerminal = isChunkError && (exhaustedReloads || inShareTarget);

    const title = isChunkError
      ? (isTerminal ? 'تعذّر تحميل التطبيق' : 'تحديث مطلوب للتطبيق')
      : 'حصل خطأ غير متوقع';

    const body = isChunkError
      ? (isTerminal
        ? 'يبدو أن نسخة مخبّأة قديمة من التطبيق تمنع تحميل بعض الأجزاء. اضغط "تنظيف وإعادة تحميل" لمسح الذاكرة المؤقتة وإعادة تشغيل التطبيق.'
        : 'نواجه مشكلة في تحميل بعض أجزاء التطبيق، قد يكون ذلك بسبب تحديث جديد. سيُعاد التحميل تلقائياً…')
      : (message || 'تم إيقاف الجزء المتأثر لحماية الجلسة والبيانات.');

    return (
      <div className="page-loader-shell" style={{ minHeight: '100vh', padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0b0f1a' }}>
        <div className="empty-state" style={{ maxWidth: 560, textAlign: 'center', color: '#fff' }}>
          <div className="empty-icon" style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <h3 style={{ fontSize: '24px', marginBottom: '12px' }}>{title}</h3>
          <p style={{ opacity: 0.8, marginBottom: '24px', lineHeight: 1.7 }}>{body}</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            {isTerminal ? (
              <Button onClick={this.handleHardRecover} variant="primary">تنظيف وإعادة تحميل</Button>
            ) : (
              <Button onClick={this.handleReload} variant="primary">إعادة تحميل التطبيق</Button>
            )}
          </div>
        </div>
      </div>
    );
  }
}

import { useEffect, useState, useCallback, useRef } from 'react';

/**
 * ═══════════════════════════════════════════════════════════════════
 * AppUpdatePrompt — v89.41 ROOT FIX: NEVER-REPEAT UPDATE PROMPT
 * ═══════════════════════════════════════════════════════════════════
 *
 * السلوك الجديد (إصلاح جذري لظهور الرسالة المتكرر):
 *
 * 1. لا تظهر الرسالة إلا عند تحقق تحديث فعلي: registration.waiting موجود
 *    ولديه scriptURL مختلف عن active.scriptURL (نسخة أحدث حقاً).
 * 2. تُخزَّن "نسخة scriptURL" للـ waiting worker عند العرض في مفتاح
 *    SHOWN_STORAGE_KEY. أي محاولة لعرض نفس النسخة مرة أخرى تُتجاهل نهائياً.
 * 3. عند ضغط "تحديث الآن": نُخزّن نفس النسخة كـ APPLIED_STORAGE_KEY —
 *    لا تعود الرسالة أبداً لهذا الإصدار حتى بعد إعادة التحميل.
 * 4. عند ضغط "لاحقاً": نُبقي علامة SHOWN — بحيث لا تظهر لنفس الجلسة إطلاقاً.
 * 5. أحداث السلسلة الرخوة (yamshat:update-available وحدها) لا تعرض شيئاً.
 * 6. مفاتيح SHOWN/APPLIED تُمسح فقط عند:
 *    - logout (يُطلق حدث 'yamshat:auth-logout')
 *    - login  (يُطلق حدث 'yamshat:auth-login')
 *    بحيث بعد تسجيل خروج + دخول جديد نسمح بفحص واحد فقط لهذا المستخدم.
 * 7. نستمع لحدث 'yamshat:auth-login' + 'yamshat:auth-logout' لمسح المفاتيح.
 *
 * الحصيلة: تظهر الرسالة مرة واحدة فقط لكل نسخة/جلسة، وبعد ضغط "تحديث الآن"
 * لا تعود أبداً إلى أن يسجّل المستخدم خروجه ثم دخوله من جديد.
 *
 * ═══════════════════════════════════════════════════════════════════
 */

const APPLYING_STORAGE_KEY = 'yamshat_update_applying';
// نسخة scriptURL آخر نافذة عُرضت (per session — يُمسح عند logout/login)
const SHOWN_STORAGE_KEY = 'yamshat_update_shown_script_url';
// نسخة scriptURL آخر نافذة طُبّقت بضغط "تحديث الآن" — لا تعود أبداً حتى login جديد
const APPLIED_STORAGE_KEY = 'yamshat_update_applied_script_url';

// حماية reload loop
const RELOAD_COUNT_KEY = 'yamshat_update_reload_count';
const RELOAD_WINDOW_MS = 60 * 1000;
const MAX_RELOADS_IN_WINDOW = 2;

// ─────────────────────────────────────────────────────────────────
// أدوات تخزين آمنة (localStorage قد يفشل في وضع خاص/بلا صلاحيات)
// ─────────────────────────────────────────────────────────────────
function safeGet(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function safeSet(key, val) {
  try { localStorage.setItem(key, val); } catch { /* noop */ }
}
function safeRemove(key) {
  try { localStorage.removeItem(key); } catch { /* noop */ }
}

// ─────────────────────────────────────────────────────────────────
// كشف حلقة إعادة التحميل
// ─────────────────────────────────────────────────────────────────
function isInReloadLoop() {
  try {
    const raw = safeGet(RELOAD_COUNT_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    if (!data || !Array.isArray(data.times)) return false;
    const now = Date.now();
    const recent = data.times.filter((t) => now - t < RELOAD_WINDOW_MS);
    return recent.length >= MAX_RELOADS_IN_WINDOW;
  } catch { return false; }
}

function trackReload() {
  try {
    const raw = safeGet(RELOAD_COUNT_KEY);
    const now = Date.now();
    let times = [];
    try {
      const data = raw ? JSON.parse(raw) : null;
      if (data && Array.isArray(data.times)) times = data.times;
    } catch { /* ignore */ }
    times = times.filter((t) => now - t < RELOAD_WINDOW_MS);
    times.push(now);
    safeSet(RELOAD_COUNT_KEY, JSON.stringify({ times }));
  } catch { /* noop */ }
}

/**
 * إعادة التحميل بعد قبول التحديث — مرة واحدة فقط.
 */
function reloadAfterUpdate() {
  if (isInReloadLoop()) {
    console.warn('[UpdatePrompt] كُشِفت حلقة إعادة تحميل — إيقاف reload التلقائي.');
    try { sessionStorage.removeItem(APPLYING_STORAGE_KEY); } catch { /* noop */ }
    return;
  }
  trackReload();
  try { sessionStorage.setItem(APPLYING_STORAGE_KEY, '1'); } catch { /* noop */ }
  window.location.reload();
}

function isApplyingUpdate() {
  try { return sessionStorage.getItem(APPLYING_STORAGE_KEY) === '1'; } catch { return false; }
}

function clearApplyingUpdate() {
  try { sessionStorage.removeItem(APPLYING_STORAGE_KEY); } catch { /* noop */ }
}

export default function AppUpdatePrompt() {
  const [registration, setRegistration] = useState(null);
  const [visible, setVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const currentSignatureRef = useRef(null);
  const controllerChangedRef = useRef(false);

  // مسح علامة "applying" بعد reload
  useEffect(() => {
    if (isApplyingUpdate()) {
      window.setTimeout(clearApplyingUpdate, 1200);
    }
  }, []);

  // ─────────────────────────────────────────────────────────────────
  // مستمع أحداث المصادقة — مسح مفاتيح shown/applied عند logout/login
  // بحيث لا تعود الرسالة إلا بعد دورة auth كاملة.
  // ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const onAuthChange = (event) => {
      const kind = event?.detail?.kind || event?.type || '';
      console.log('[UpdatePrompt] auth event received:', kind, '— clearing shown/applied markers');
      safeRemove(SHOWN_STORAGE_KEY);
      safeRemove(APPLIED_STORAGE_KEY);
    };
    window.addEventListener('yamshat:auth-logout', onAuthChange);
    window.addEventListener('yamshat:auth-login', onAuthChange);
    return () => {
      window.removeEventListener('yamshat:auth-logout', onAuthChange);
      window.removeEventListener('yamshat:auth-login', onAuthChange);
    };
  }, []);

  // ─────────────────────────────────────────────────────────────────
  // العرض فقط عند وجود waiting worker حقيقي + توقيع لم يُعرض سابقاً
  // ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const handleReady = async (event) => {
      // منع أثناء /share-target
      try {
        const path = (window.location && window.location.pathname) || '';
        const hash = (window.location && window.location.hash) || '';
        const inShareTarget = path === '/share-target'
          || path.startsWith('/share-target/')
          || hash.startsWith('#/share-target')
          || hash.includes('/share-target');
        if (inShareTarget) {
          console.log('[UpdatePrompt] handleReady skipped — inside /share-target flow');
          return;
        }
      } catch (_) { /* ignore */ }

      const candidate = event?.detail?.registration || null;
      let nextRegistration = candidate;
      if (!nextRegistration && 'serviceWorker' in navigator) {
        try { nextRegistration = await navigator.serviceWorker.getRegistration(); } catch (_) { /* ignore */ }
      }

      // ✅ ROOT FIX #1: waiting worker حقيقي (ليس مطابقاً للـ active)
      if (!nextRegistration?.waiting) return;
      if (nextRegistration.waiting === nextRegistration.active) return;

      // scriptURL يجب أن يكون مختلفاً (نسخة أحدث فعلاً)
      const waitingURL = nextRegistration.waiting?.scriptURL || '';
      const activeURL = nextRegistration.active?.scriptURL || '';
      if (!waitingURL) return;
      if (waitingURL && activeURL && waitingURL === activeURL) {
        console.log('[UpdatePrompt] waiting.scriptURL == active.scriptURL — تحديث وهمي، تجاهل.');
        return;
      }

      // ✅ ROOT FIX #2: هل طُبّقت هذه النسخة سابقاً بضغط "تحديث الآن"؟
      const appliedSig = safeGet(APPLIED_STORAGE_KEY);
      if (appliedSig && appliedSig === waitingURL) {
        console.log('[UpdatePrompt] هذه النسخة طُبّقت سابقاً — لن تظهر مرة أخرى حتى login جديد.');
        return;
      }

      // ✅ ROOT FIX #3: هل عُرضت لهذه الجلسة سابقاً؟
      const shownSig = safeGet(SHOWN_STORAGE_KEY);
      if (shownSig && shownSig === waitingURL) {
        console.log('[UpdatePrompt] هذه النسخة عُرضت سابقاً في هذه الجلسة — لن تعود.');
        return;
      }

      if (isApplyingUpdate()) return;
      if (isInReloadLoop()) {
        console.warn('[UpdatePrompt] حلقة تحديث مكتشفة — لن تُعرض النافذة.');
        return;
      }

      // كل الشروط تحققت — نعرض النافذة مرة واحدة فقط لهذا التوقيع
      currentSignatureRef.current = waitingURL;
      safeSet(SHOWN_STORAGE_KEY, waitingURL); // ⚠️ نضع العلامة فوراً حتى لا تعاد عند أي حدث لاحق
      setRegistration(nextRegistration);
      setVisible(true);
    };

    window.addEventListener('yamshat:update-ready', handleReady);
    // ⚠️ لا نستمع لـ yamshat:update-available (broadcast رخو من SW يُطلق بلا داعٍ).
    return () => window.removeEventListener('yamshat:update-ready', handleReady);
  }, []);

  // ─────────────────────────────────────────────────────────────────
  // controllerchange — إعادة تحميل مرة واحدة بعد قبول التحديث فقط
  // ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return undefined;
    const onControllerChange = () => {
      try {
        const path = (window.location && window.location.pathname) || '';
        const hash = (window.location && window.location.hash) || '';
        const inShareTarget = path === '/share-target'
          || path.startsWith('/share-target/')
          || hash.startsWith('#/share-target')
          || hash.includes('/share-target');
        if (inShareTarget) {
          console.log('[UpdatePrompt] controllerchange skipped — inside /share-target flow');
          return;
        }
      } catch (_) { /* ignore */ }
      if (!isApplyingUpdate() || controllerChangedRef.current) return;
      controllerChangedRef.current = true;
      reloadAfterUpdate();
    };
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
    return () => navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
  }, []);

  // ─────────────────────────────────────────────────────────────────
  // زر "تحديث الآن"
  // ─────────────────────────────────────────────────────────────────
  const handleUpdateNow = useCallback(async () => {
    setRefreshing(true);
    try {
      const reg = registration || (await navigator.serviceWorker?.getRegistration());
      if (!reg?.waiting) {
        setVisible(false);
        setRefreshing(false);
        return;
      }
      const sig = reg.waiting?.scriptURL || currentSignatureRef.current || '';
      // ✅ نُخزّن نسخة scriptURL كـ APPLIED — لن تعود أبداً حتى login جديد
      if (sig) safeSet(APPLIED_STORAGE_KEY, sig);
      try { sessionStorage.setItem(APPLYING_STORAGE_KEY, '1'); } catch { /* noop */ }
      reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      // fallback في حال لم يصل controllerchange بسرعة
      window.setTimeout(() => {
        if (!controllerChangedRef.current) reloadAfterUpdate();
      }, 2500);
    } catch (err) {
      console.error('[UpdatePrompt] update activation failed:', err);
      setRefreshing(false);
    }
  }, [registration]);

  // ─────────────────────────────────────────────────────────────────
  // زر "لاحقاً" — يُخفي النافذة نهائياً لهذه الجلسة (SHOWN مُثبَّت مسبقاً).
  // ─────────────────────────────────────────────────────────────────
  const handleDismiss = useCallback(() => {
    // SHOWN_STORAGE_KEY تم ضبطه بالفعل عند العرض — لا حاجة لإعادة كتابته.
    setVisible(false);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="yam-native-update-overlay"
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="yam-native-update-title"
    >
      <div className="yam-native-update-sheet">
        <div className="yam-native-update-badge" aria-hidden="true">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 11-3.5-7.1" />
            <path d="M21 4v5h-5" />
          </svg>
        </div>
        <h2 id="yam-native-update-title" className="yam-native-update-title">
          تحديث جديد متاح
        </h2>
        <p className="yam-native-update-subtitle">
          إصدار جديد من YAMSHAT جاهز — تحديثات، إصلاحات، وأداء أفضل.
        </p>
        <div className="yam-native-update-actions">
          <button
            type="button"
            className="yam-native-update-btn yam-native-update-btn-primary"
            onClick={handleUpdateNow}
            disabled={refreshing}
            autoFocus
          >
            {refreshing ? (
              <span className="yam-native-update-spinner" aria-hidden="true" />
            ) : (
              'تحديث الآن'
            )}
          </button>
          <button
            type="button"
            className="yam-native-update-btn yam-native-update-btn-secondary"
            onClick={handleDismiss}
            disabled={refreshing}
          >
            لاحقاً
          </button>
        </div>
      </div>
      <style>{sheetStyles}</style>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   أنماط النافذة — بنفسجي YAMSHAT (بدون تغيير بصري)
   ══════════════════════════════════════════════════════════════════ */
const sheetStyles = `
.yam-native-update-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  animation: yamNativeFade 220ms ease-out;
  padding-bottom: env(safe-area-inset-bottom, 0px);
  font-family: 'Noto Sans Arabic', 'Tajawal', system-ui, -apple-system, sans-serif;
}
@keyframes yamNativeFade { from { opacity: 0; } to { opacity: 1; } }

.yam-native-update-sheet {
  position: relative;
  width: 100%;
  max-width: 640px;
  padding: 26px 22px 24px;
  background: linear-gradient(180deg, #7c3aed 0%, #6d28d9 55%, #4c1d95 100%);
  border-top-left-radius: 26px;
  border-top-right-radius: 26px;
  box-shadow:
    0 -12px 48px rgba(76, 29, 149, 0.55),
    0 -1px 0 rgba(255, 255, 255, 0.10) inset;
  color: #ffffff;
  text-align: right;
  animation: yamNativeSlideUp 320ms cubic-bezier(0.2, 0.9, 0.25, 1);
}
@keyframes yamNativeSlideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }

.yam-native-update-sheet::before {
  content: '';
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  width: 44px;
  height: 4px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.28);
}

.yam-native-update-badge {
  width: 46px;
  height: 46px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.16);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  margin-bottom: 14px;
  box-shadow:
    0 6px 18px rgba(76, 29, 149, 0.35),
    0 0 0 1px rgba(255, 255, 255, 0.12) inset;
}

.yam-native-update-title {
  margin: 0 0 6px;
  font-size: 1.2rem;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: -0.01em;
}

.yam-native-update-subtitle {
  margin: 0 0 22px;
  font-size: 0.92rem;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.55;
}

.yam-native-update-actions {
  display: flex;
  gap: 12px;
  align-items: stretch;
  flex-direction: row-reverse;
}

.yam-native-update-btn {
  flex: 1;
  min-height: 52px;
  padding: 0 18px;
  border-radius: 14px;
  font-family: inherit;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: transform 140ms ease, background 200ms ease, opacity 200ms ease;
  -webkit-tap-highlight-color: transparent;
}
.yam-native-update-btn:active { transform: scale(0.97); }
.yam-native-update-btn:disabled { opacity: 0.7; cursor: default; }

.yam-native-update-btn-primary {
  background: #ffffff;
  color: #6d28d9;
  border: 1px solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 6px 18px rgba(76, 29, 149, 0.35);
}
.yam-native-update-btn-primary:hover { background: #f5f3ff; }

.yam-native-update-btn-secondary {
  background: rgba(255, 255, 255, 0.10);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.18);
}
.yam-native-update-btn-secondary:hover { background: rgba(255, 255, 255, 0.15); }

.yam-native-update-spinner {
  width: 20px;
  height: 20px;
  border: 2.5px solid rgba(109, 40, 217, 0.25);
  border-top-color: #6d28d9;
  border-radius: 50%;
  animation: yamNativeSpin 700ms linear infinite;
}
@keyframes yamNativeSpin { to { transform: rotate(360deg); } }

@media (min-width: 900px) {
  .yam-native-update-overlay { align-items: center; }
  .yam-native-update-sheet {
    max-width: 480px;
    border-radius: 22px;
    padding: 30px 26px 26px;
    box-shadow: 0 24px 80px rgba(0, 0, 0, 0.5);
  }
  .yam-native-update-sheet::before { display: none; }
}

@media (max-width: 360px) {
  .yam-native-update-sheet { padding: 22px 16px 20px; }
  .yam-native-update-btn { min-height: 48px; font-size: 0.95rem; }
}
`;

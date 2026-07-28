// services/share/sourceOpener.js — v88.85
// ---------------------------------------------------------------
// فتح المصدر الأصلي (رابط خارجي) بذكاء:
// 1) إن كان لدى المستخدم تطبيق المنصة مثبتاً (YouTube, TikTok, X, IG, FB, TG…):
//    → نحاول deep-link/intent فيفتح مباشرة داخل التطبيق.
// 2) إن لم يكن مثبتاً:
//    → المتصفح (Chrome/Safari/…) يعرض الرابط، والمستخدم يختار متصفحاً.
// 3) إن كان المصدر لا يدعم الفتح عبر المتصفح (مثال WhatsApp):
//    → نُظهر رسالة "هذا المصدر غير مدعوم عبر المتصفح".
//
// الفكرة العملية للأجهزة المحمولة:
// - Android: نستخدم intent:// URI مع scheme + package + S.browser_fallback_url
//   → يفتح التطبيق إن كان مثبتاً، ويرجع للمتصفح تلقائياً إن لم يكن.
// - iOS: نجرّب scheme:// عبر iframe مخفي؛ إن لم يستجب خلال ~1200ms
//   نفتح الرابط الويب.
// - Desktop: نفتح الرابط الويب مباشرة في تبويب جديد.
// ---------------------------------------------------------------

import { detectSourcePlatform } from './sharedIntake.js';

function isAndroid() { return /android/i.test(navigator.userAgent || ''); }
function isIOS() { return /iphone|ipad|ipod/i.test(navigator.userAgent || ''); }

// بناء رابط intent:// لأندرويد
function buildAndroidIntent({ platform, sourceUrl, androidPackage, scheme }) {
  if (!androidPackage || !sourceUrl) return null;
  try {
    const u = new URL(sourceUrl);
    const path = u.pathname + u.search + u.hash;
    const host = u.host;
    // مثال: intent://youtu.be/xxx#Intent;scheme=https;package=com.google.android.youtube;S.browser_fallback_url=https%3A%2F%2Fyoutu.be%2Fxxx;end
    return `intent://${host}${path}#Intent;scheme=${u.protocol.replace(':','')};package=${androidPackage};S.browser_fallback_url=${encodeURIComponent(sourceUrl)};end`;
  } catch { return null; }
}

// بناء scheme خاص بالتطبيق لـ iOS (اختياري — نضع مسار خام إن أمكن)
function buildIOSScheme({ platform, sourceUrl, iosScheme }) {
  if (!iosScheme || !sourceUrl) return null;
  try {
    if (platform === 'youtube') {
      // vnd.youtube://<video_id>
      const m = String(sourceUrl).match(/(?:youtu\.be\/|v=)([\w-]{6,})/);
      if (m) return `vnd.youtube://${m[1]}`;
    }
    if (platform === 'twitter') {
      const m = String(sourceUrl).match(/(?:twitter\.com|x\.com)\/([\w_]+)\/status\/(\d+)/i);
      if (m) return `twitter://status?id=${m[2]}`;
    }
    if (platform === 'instagram') {
      const m = String(sourceUrl).match(/instagram\.com\/(p|reel)\/([\w-]+)/i);
      if (m) return `instagram://media?id=${m[2]}`;
    }
    if (platform === 'tiktok') {
      return sourceUrl.replace(/^https?:\/\//, 'snssdk1233://');
    }
    if (platform === 'telegram') {
      const m = String(sourceUrl).match(/t\.me\/([\w_]+)(?:\/(\d+))?/);
      if (m) return `tg://resolve?domain=${m[1]}${m[2] ? `&post=${m[2]}` : ''}`;
    }
    return iosScheme;
  } catch { return null; }
}

/**
 * openExternalSource — الدالة الرئيسية للفتح الذكي.
 *
 * @param {string} sourceUrl — الرابط الأصلي
 * @param {object} [opts] — { onUnsupported: (msg) => void, forceBrowser: boolean }
 * @returns {Promise<'app'|'browser'|'unsupported'>}
 */
export async function openExternalSource(sourceUrl, opts = {}) {
  const { onUnsupported, forceBrowser = false } = opts;
  if (!sourceUrl) {
    onUnsupported?.('لا يوجد رابط للمصدر');
    return 'unsupported';
  }

  const info = detectSourcePlatform(sourceUrl);

  // 1) المصدر لا يدعم المتصفح ولا يوجد scheme → نعرض رسالة
  if (!info.supportsBrowser && !info.scheme) {
    onUnsupported?.('هذا المصدر غير مدعوم للفتح عبر المتصفح');
    return 'unsupported';
  }

  // 2) Desktop أو forceBrowser → افتح مباشرة في تبويب جديد
  if (forceBrowser || (!isAndroid() && !isIOS())) {
    window.open(sourceUrl, '_blank', 'noopener,noreferrer');
    return 'browser';
  }

  // 3) Android — استخدم intent://
  if (isAndroid() && info.androidPackage) {
    const intentUrl = buildAndroidIntent({
      platform: info.platform,
      sourceUrl,
      androidPackage: info.androidPackage,
      scheme: info.scheme,
    });
    if (intentUrl) {
      window.location.href = intentUrl;
      return 'app';
    }
    // fallback: افتح في المتصفح
    window.open(sourceUrl, '_blank', 'noopener,noreferrer');
    return 'browser';
  }

  // 4) iOS — جرّب scheme، fallback بعد 1200ms
  if (isIOS() && info.iosScheme) {
    const schemeUrl = buildIOSScheme({
      platform: info.platform,
      sourceUrl,
      iosScheme: info.iosScheme,
    });
    if (!schemeUrl) {
      window.open(sourceUrl, '_blank', 'noopener,noreferrer');
      return 'browser';
    }
    return await new Promise((resolve) => {
      let fell = false;
      const start = Date.now();
      // fallback: افتح الرابط الويب إن لم يستجب scheme
      const timer = setTimeout(() => {
        if (fell) return;
        if (document.visibilityState === 'visible' && Date.now() - start >= 1000) {
          fell = true;
          window.open(sourceUrl, '_blank', 'noopener,noreferrer');
          resolve('browser');
        } else {
          resolve('app');
        }
      }, 1200);
      // عند التخفي — التطبيق فُتح
      const onVis = () => {
        if (document.visibilityState === 'hidden') {
          clearTimeout(timer);
          fell = true;
          document.removeEventListener('visibilitychange', onVis);
          resolve('app');
        }
      };
      document.addEventListener('visibilitychange', onVis);
      // شغّل الـ scheme
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = schemeUrl;
      document.body.appendChild(iframe);
      setTimeout(() => { try { iframe.remove(); } catch { /* ignore */ } }, 2000);
    });
  }

  // 5) fallback عام → المتصفح
  window.open(sourceUrl, '_blank', 'noopener,noreferrer');
  return 'browser';
}

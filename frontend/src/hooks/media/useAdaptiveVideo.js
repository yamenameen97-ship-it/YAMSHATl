/**
 * useAdaptiveVideo.js — v89.28 ROOT FIX
 * =====================================
 * Hook خفيف لاستخدام مخرجات خطّ إنتاج الفيديو الجديد على الـ backend:
 *   /uploads/derivatives/<file_id>/master.m3u8   ← Adaptive Bitrate (HLS)
 *   /uploads/derivatives/<file_id>/720p.mp4      ← جودة ثابتة سريعة
 *   /uploads/derivatives/<file_id>/poster.jpg    ← thumbnail
 *
 * لماذا؟
 * ----
 * كان الـ frontend يستهلك دائماً الرابط الأصلي (قد يكون 4K/60fps بحجم 400MB)
 * — مما يُبطئ التحميل لأصحاب الإنترنت الضعيف ويستنزف نقل البيانات.
 * الآن نختار تلقائياً:
 *   1. HLS master.m3u8 عبر hls.js (على متصفح غير سفاري) — Adaptive.
 *   2. HLS master.m3u8 مباشرةً على Safari/iOS (دعم أصلي).
 *   3. أفضل جودة mp4 مناسبة للشبكة عبر Network Information API عند غياب HLS.
 *   4. الرابط الأصلي كخيار أخير.
 *
 * الاستخدام:
 * ```jsx
 * const { videoRef, activeSrc, poster, ready, level } = useAdaptiveVideo({
 *   fileId: reel.storage_file_id,      // مطلوب: id الملف على الـ backend
 *   originalUrl: reel.video_url,       // احتياطي إن لم يجاهز الترانسكود بعد
 *   apiBase: '/api/v1',
 * });
 * return <video ref={videoRef} src={activeSrc} poster={poster} playsInline muted />;
 * ```
 *
 * ملاحظات:
 *   - لا يعتمد على أي npm module. يحاول تحميل hls.js من CDN عند الحاجة فقط.
 *   - يستخدم exponential polling حتى يجهز الترانسكود، ثم يتوقف.
 *   - آمن مع SSR (يفحص typeof window).
 */

import { useCallback, useEffect, useRef, useState } from "react";

const HLS_JS_CDN =
  "https://cdn.jsdelivr.net/npm/hls.js@1.5.13/dist/hls.min.js";

const POLL_INTERVALS_MS = [1500, 2500, 4000, 6000, 10000, 15000, 20000, 30000];

// خريطة سرعة الشبكة → أفضل جودة mp4
function pickLevelByNetwork(variants) {
  if (!Array.isArray(variants) || variants.length === 0) return null;
  const byLabel = Object.fromEntries(variants.map((v) => [v.label, v]));
  const order = ["240p", "360p", "480p", "720p", "1080p"];
  const sorted = order.map((l) => byLabel[l]).filter(Boolean);
  if (sorted.length === 0) return null;

  const conn =
    (typeof navigator !== "undefined" &&
      (navigator.connection ||
        navigator.mozConnection ||
        navigator.webkitConnection)) ||
    null;

  if (!conn) return sorted[Math.min(2, sorted.length - 1)]; // افتراضي 480p
  const type = String(conn.effectiveType || "").toLowerCase();
  if (conn.saveData) return sorted[0];
  if (type.includes("2g")) return sorted[0];
  if (type === "3g") return byLabel["360p"] || sorted[0];
  if (type === "4g") return byLabel["720p"] || sorted[sorted.length - 1];
  if (type === "5g") return sorted[sorted.length - 1];
  return sorted[Math.min(2, sorted.length - 1)];
}

// تحميل hls.js عند الطلب فقط
let _hlsPromise = null;
function loadHlsJs() {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (window.Hls) return Promise.resolve(window.Hls);
  if (_hlsPromise) return _hlsPromise;
  _hlsPromise = new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = HLS_JS_CDN;
    s.async = true;
    s.onload = () => resolve(window.Hls || null);
    s.onerror = () => resolve(null);
    document.head.appendChild(s);
  });
  return _hlsPromise;
}

function canPlayHlsNatively(el) {
  if (!el) return false;
  return (
    el.canPlayType("application/vnd.apple.mpegurl") !== "" ||
    el.canPlayType("audio/mpegurl") !== ""
  );
}

export default function useAdaptiveVideo({
  fileId,
  originalUrl,
  apiBase = "/api/v1",
  preferHls = true,
} = {}) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const pollTimerRef = useRef(null);
  const pollIndexRef = useRef(0);

  const [status, setStatus] = useState(fileId ? "probing" : "ready");
  const [derivatives, setDerivatives] = useState(null);
  const [activeSrc, setActiveSrc] = useState(originalUrl || "");
  const [poster, setPoster] = useState("");
  const [level, setLevel] = useState("original");

  const cleanupHls = useCallback(() => {
    if (hlsRef.current) {
      try {
        hlsRef.current.destroy();
      } catch (_) {}
      hlsRef.current = null;
    }
  }, []);

  const attachHls = useCallback(
    async (masterUrl) => {
      const el = videoRef.current;
      if (!el || !masterUrl) return false;

      // Safari/iOS: دعم أصلي
      if (canPlayHlsNatively(el)) {
        el.src = masterUrl;
        setActiveSrc(masterUrl);
        setLevel("hls-native");
        return true;
      }

      const Hls = await loadHlsJs();
      if (!Hls || !Hls.isSupported()) return false;

      cleanupHls();
      const hls = new Hls({
        maxBufferLength: 20,
        maxMaxBufferLength: 40,
        capLevelToPlayerSize: true,
      });
      hls.loadSource(masterUrl);
      hls.attachMedia(el);
      hlsRef.current = hls;
      setActiveSrc(masterUrl);
      setLevel("hls-mse");
      return true;
    },
    [cleanupHls]
  );

  const applyDerivatives = useCallback(
    async (data) => {
      if (!data || !data.ready) return false;
      setDerivatives(data);
      if (data.poster_url) setPoster(data.poster_url);

      // 1) HLS
      if (preferHls && data.hls_master_url) {
        const ok = await attachHls(data.hls_master_url);
        if (ok) {
          setStatus("ready");
          return true;
        }
      }

      // 2) أفضل mp4 مناسب للشبكة
      const picked = pickLevelByNetwork(data.variants);
      if (picked && picked.mp4_url) {
        setActiveSrc(picked.mp4_url);
        setLevel(picked.label);
        setStatus("ready");
        return true;
      }
      return false;
    },
    [attachHls, preferHls]
  );

  const pollOnce = useCallback(async () => {
    if (!fileId) return;
    try {
      const res = await fetch(
        `${apiBase}/upload/derivatives/${encodeURIComponent(fileId)}/status`,
        { credentials: "include" }
      );
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.ready) {
        await applyDerivatives(data);
        return;
      }
    } catch (_) {
      /* soft-fail */
    }

    // إعادة الجدولة بتصاعد
    const idx = Math.min(pollIndexRef.current, POLL_INTERVALS_MS.length - 1);
    const delay = POLL_INTERVALS_MS[idx];
    pollIndexRef.current = idx + 1;
    pollTimerRef.current = setTimeout(pollOnce, delay);
  }, [fileId, apiBase, applyDerivatives]);

  useEffect(() => {
    // reset
    setActiveSrc(originalUrl || "");
    setStatus(fileId ? "probing" : "ready");
    setDerivatives(null);
    setPoster("");
    setLevel("original");
    pollIndexRef.current = 0;
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    cleanupHls();

    if (!fileId) return;
    pollOnce();

    return () => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
      cleanupHls();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileId, originalUrl]);

  return {
    videoRef,
    activeSrc,
    poster,
    ready: status === "ready",
    status,
    level,
    derivatives,
  };
}

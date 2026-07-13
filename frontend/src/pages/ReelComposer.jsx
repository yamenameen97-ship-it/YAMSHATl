// PLACEHOLDER - will be filled by MultiEdit
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import API from '../api/axios.js';
import mediaUploadService from '../services/media/mediaUploadService.js';
import { getCurrentUsername } from '../utils/auth.js';
import { getReelsCache, saveReelsCache } from '../services/reelsEngine.js';
import { useToast } from '../components/admin/ToastProvider.jsx';
import CameraFilterCarousel, {
  CAMERA_FILTERS,
  getSavedCamFilter,
  saveCamFilter,
  getCamFilterCss,
} from '../components/reels/CameraFilterCarousel.jsx';

/**
 * ReelComposer.jsx — v56 (Pixel-perfect rebuild — مطابق 1:1 للصورة المرجعية)
 * ---------------------------------------------------------------------------
 * صفحة رفع/إنشاء الريل الجديدة — مطابقة تماماً للصورة المرفقة:
 *   - شريط علوي: زر إغلاق (X) — كبسولة "إضافة صوت 🎵" — زر إعدادات
 *   - عمود يمين (الأدوات الرئيسية): قلب | الفلاش | الجودة 1080p | الميكروفون | فلاتر الضوضاء | كتم الأصوات | الترجمة
 *   - عمود يسار (تأثيرات الفيديو): المدة 15s | السرعة 1x | تحسين | الفلاتر | المؤثرات | المؤقت | التخطيط 9:16 | تجميل
 *   - وسط أسفل: زر تسجيل بنفسجي كبير دائري — يحيطه زر إلغاء (X) ومؤكد (✓)
 *   - تابات النوع: قوالب | صورة | ريلز (نشط) | لايف | نشر
 *   - شريط سفلي: المعرض (يفتح الإستوديو) | المسودات
 *
 * هذا النموذج هو **المعتمد** لكل صفحات الريلز (يُستبدل العامود القديم بالكامل).
 */

// ---------- ثوابت ----------
const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB
const ACCEPTED_VIDEO = 'video/*,video/mp4,video/webm,video/quicktime,video/x-m4v,.mp4,.webm,.mov,.m4v,.mkv,.3gp';

const DURATION_OPTIONS = [15, 30, 60, 90];
const SPEED_OPTIONS = [0.3, 0.5, 1, 2, 3];
const QUALITY_OPTIONS = ['480p', '720p', '1080p', '2K', '4K'];
const LAYOUT_OPTIONS = ['9:16', '1:1', '4:5', '16:9'];
const FLASH_MODES = [
  { v: 'off', label: 'إيقاف' },
  { v: 'on', label: 'تشغيل' },
  { v: 'auto', label: 'تلقائي' },
];
const FILTERS = [
  { v: 'none', label: 'بدون' },
  { v: 'enhance', label: 'تحسين' },
  { v: 'warm', label: 'دافئ' },
  { v: 'cool', label: 'بارد' },
  { v: 'vintage', label: 'كلاسيكي' },
  { v: 'mono', label: 'أبيض/أسود' },
];
const EFFECTS = [
  { v: 'none', label: 'بدون مؤثر' },
  { v: 'sparkle', label: 'بريق' },
  { v: 'glow', label: 'توهج' },
  { v: 'shake', label: 'اهتزاز' },
  { v: 'zoom', label: 'تكبير ديناميكي' },
];
const TIMER_OPTIONS = [0, 3, 5, 10];

const TABS = [
  { id: 'templates', label: 'قوالب' },
  { id: 'photo', label: 'صورة' },
  { id: 'reel', label: 'ريلز' },
  { id: 'live', label: 'لايف' },
  { id: 'post', label: 'نشر' },
];

function formatBytes(bytes = 0) {
  if (!bytes) return '0 B';
  const u = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / 1024 ** i).toFixed(1)} ${u[i] || 'B'}`;
}

// ---------- مكوّن صف زر (أيقونة + ليبل) ----------
function RailButton({ icon, label, sub, onClick, active = false, ariaLabel }) {
  return (
    <button
      type="button"
      className={`ymrc-rail-btn ${active ? 'is-active' : ''}`}
      onClick={onClick}
      aria-label={ariaLabel || label}
    >
      <span className="ymrc-rail-ico" aria-hidden>{icon}</span>
      <span className="ymrc-rail-text">
        <span className="ymrc-rail-label">{label}</span>
        {sub ? <span className="ymrc-rail-sub">{sub}</span> : null}
      </span>
    </button>
  );
}

// ---------- أيقونات SVG ----------
const Icons = {
  Close: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6l-12 12"/></svg>,
  Music: <svg viewBox="0 0 24 24" width="16" height="16" fill="#fff"><path d="M9 17V5l10-2v12"/><circle cx="7" cy="17" r="3" fill="none" stroke="#fff" strokeWidth="2"/><circle cx="17" cy="15" r="3" fill="none" stroke="#fff" strokeWidth="2"/></svg>,
  Settings: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06A2 2 0 1 1 4.27 16.96l.06-.06A1.65 1.65 0 0 0 4.66 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82L4.21 7.12A2 2 0 1 1 7.04 4.29l.06.06A1.65 1.65 0 0 0 8.92 4.7 1.65 1.65 0 0 0 9.92 3.19V3a2 2 0 1 1 4 0v.09A1.65 1.65 0 0 0 14.92 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  Timer: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9 2h6"/></svg>,
  Flip: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 2l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>,
  Speed: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  Sparkle: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z"/><path d="M19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8z"/></svg>,
  Filters: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="10" r="5"/><circle cx="16" cy="10" r="5"/><circle cx="12" cy="17" r="5"/></svg>,
  Effects: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 4V2M15 16v-2M8 9h2M20 9h2M17.8 11.8l1.4 1.4M17.8 6.2l1.4-1.4M3 21l9-9M12.2 6.2l-1.4-1.4"/></svg>,
  Layout: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="7" y="3" width="10" height="18" rx="2"/><path d="M7 12h10"/></svg>,
  Beautify: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l2 2 4-4"/><path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/></svg>,
  Flash: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/><line x1="3" y1="3" x2="21" y2="21"/></svg>,
  Quality: <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#fff" strokeWidth="1.8"><rect x="2" y="6" width="20" height="12" rx="2"/><text x="12" y="15" textAnchor="middle" fontSize="7" fill="#fff" stroke="none" fontWeight="700">1080</text></svg>,
  Mic: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2"/><path d="M12 19v3"/></svg>,
  Noise: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M3 12h2l2-6 4 12 4-9 2 5h4"/></svg>,
  Mute: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5a9 9 0 0 1 0 14"/></svg>,
  Caption: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 11h4M7 14h7"/></svg>,
  Camera: <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  Gallery: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/></svg>,
  Draft: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
  Check: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 12 10 18 20 6"/></svg>,
};

export default function ReelComposer() {
  const navigate = useNavigate();
  const location = useLocation();
  const { push: pushToast } = useToast() || {};

  // v50 — التبويب الافتراضي يأتي من ?tab=post|reel|story|live|photo|templates
  const initialTabFromUrl = useMemo(() => {
    try {
      const sp = new URLSearchParams(location.search);
      const t = (sp.get('tab') || '').toLowerCase();
      if (['post', 'reel', 'story', 'live', 'photo', 'templates'].includes(t)) return t;
    } catch { /* ignore */ }
    // fallback بناءً على pathname
    if (location.pathname.startsWith('/post')) return 'post';
    if (location.pathname.startsWith('/reels')) return 'reel';
    return 'reel';
  }, [location.search, location.pathname]);

  // أوضاع الكاميرا والإعدادات
  const [activeTab, setActiveTab] = useState(initialTabFromUrl);
  const [duration, setDuration] = useState(15);
  const [speed, setSpeed] = useState(1);
  const [quality, setQuality] = useState('1080p');
  const [layout, setLayout] = useState('9:16');
  const [flash, setFlash] = useState('off');
  const [filter, setFilter] = useState(() => getSavedCamFilter());
  const [effect, setEffect] = useState('none');
  const [timer, setTimer] = useState(0);
  const [beautify, setBeautify] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [noiseReduction, setNoiseReduction] = useState(false);
  const [muteAll, setMuteAll] = useState(false);
  const [captions, setCaptions] = useState(false);
  const [showSettingsSheet, setShowSettingsSheet] = useState(false);
  const [showSheet, setShowSheet] = useState(null); // 'duration' | 'speed' | 'filter' | ...
  const [audioTrack, setAudioTrack] = useState(null);

  // الكاميرا والتسجيل
  const [stream, setStream] = useState(null);
  const [facing, setFacing] = useState('user'); // 'user' | 'environment'
  const [recording, setRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [recordTime, setRecordTime] = useState(0);
  const [galleryFile, setGalleryFile] = useState(null);
  const [galleryPreviewUrl, setGalleryPreviewUrl] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  // v59.8 — وضع الكاميرا: لا تُفتح تلقائياً، فقط عند ضغط زر الكاميرا
  const [cameraOn, setCameraOn] = useState(false);

  const videoRef = useRef(null);
  const previewVideoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const recordTimerRef = useRef(null);
  const fileInputRef = useRef(null);
  // ✅ v59.13.7 FIX #3: تتبّع مؤقت العدّ التنازلي + حارس isMounted
  // لمنع:
  //   (أ) استدعاء startRecording() بعد مغادرة الصفحة أثناء العدّ التنازلي.
  //   (ب) setRecordedBlob في onstop بعد unmount.
  //   (ج) setState بعد unmount في onConfirm async.
  const countdownTimerRef = useRef(null);
  const isMountedRef = useRef(true);

  // ---- بدء/إيقاف الكاميرا حسب الجلسة ----
  // v59.8 — لا تُفتح الكاميرا تلقائياً عند دخول الصفحة، فقط عند تفعيل cameraOn
  useEffect(() => {
    let cancelled = false;
    async function start() {
      if (!cameraOn) return; // لا تُشغّل الكاميرا إلا بطلب صريح من المستخدم
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing, width: { ideal: 1080 }, height: { ideal: 1920 } },
          audio: micOn && !muteAll,
        });
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        setStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.play().catch(() => {});
        }
      } catch (err) {
        setErrorMessage('تعذّر الوصول للكاميرا: ' + (err?.message || ''));
        setCameraOn(false);
      }
    }
    start();
    return () => {
      cancelled = true;
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraOn, facing, micOn, muteAll]);

  // إيقاف الكاميرا فوراً عند إطفائها أو عند اختيار ملف من المعرض
  useEffect(() => {
    if (!cameraOn && stream) {
      try { stream.getTracks().forEach((t) => t.stop()); } catch { /* ignore */ }
      setStream(null);
      if (videoRef.current) {
        try { videoRef.current.srcObject = null; } catch { /* ignore */ }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraOn]);

  // تنظيف الـ object URL للمعاينة عند تغييرها أو الخروج
  useEffect(() => {
    return () => {
      if (galleryPreviewUrl) {
        try { URL.revokeObjectURL(galleryPreviewUrl); } catch { /* ignore */ }
      }
    };
  }, [galleryPreviewUrl]);

  // طلب فتح الكاميرا (مع إيقاف معاينة المعرض إن وُجدت)
  const requestOpenCamera = useCallback(() => {
    setErrorMessage('');
    if (galleryFile) {
      // إفراغ معاينة المعرض حتى تظهر الكاميرا
      setGalleryFile(null);
      if (galleryPreviewUrl) {
        try { URL.revokeObjectURL(galleryPreviewUrl); } catch { /* ignore */ }
      }
      setGalleryPreviewUrl('');
    }
    setCameraOn(true);
  }, [galleryFile, galleryPreviewUrl]);

  // ---- العدّاد أثناء التسجيل ----
  useEffect(() => {
    if (!recording) {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      return;
    }
    recordTimerRef.current = setInterval(() => {
      setRecordTime((t) => {
        const nx = t + 0.1;
        if (nx >= duration) {
          stopRecording();
          return duration;
        }
        return nx;
      });
    }, 100);
    return () => recordTimerRef.current && clearInterval(recordTimerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recording, duration]);

  // ✅ v59.13.7 FIX #3: cleanup عام — مؤقتات + isMounted + توقيف MediaRecorder
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      // أوقف مؤقت العدّ التنازلي إن وجد
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
      // أوقف أي مؤقت تسجيل عالق
      if (recordTimerRef.current) {
        clearInterval(recordTimerRef.current);
        recordTimerRef.current = null;
      }
      // عطّل callbackات الـ MediaRecorder لمنع setState بعد unmount
      try {
        if (mediaRecorderRef.current) {
          mediaRecorderRef.current.ondataavailable = null;
          mediaRecorderRef.current.onstop = null;
          if (mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
          }
        }
      } catch { /* ignore */ }
    };
  }, []);

  // ---- مرشّح CSS للمعاينة ----
  // يعتمد على قائمة الفلاتر الموحّدة في CameraFilterCarousel (نفس الفلاتر تماماً
  // التي تظهر في الكاروسيل السفلي على طريقة سناب شات)
  const previewFilter = useMemo(() => {
    let f = getCamFilterCss(filter, true);
    if (f === 'none') f = '';
    if (beautify) f = `${f} blur(0.4px) brightness(1.06) saturate(1.1)`.trim();
    return f || '';
  }, [filter, beautify]);

  // احفظ الفلتر الأخير محلياً ليُسترجع تلقائياً في المرّة القادمة
  useEffect(() => { saveCamFilter(filter); }, [filter]);

  // فلتر سناب شات النشط (للعرض في الإعدادات)
  const activeCamFilter = useMemo(
    () => CAMERA_FILTERS.find((x) => x.id === filter) || CAMERA_FILTERS[0],
    [filter]
  );

  const startRecording = useCallback(() => {
    if (!stream || recording) return;
    setErrorMessage('');
    setRecordedBlob(null);
    setRecordTime(0);
    recordedChunksRef.current = [];
    try {
      const rec = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9,opus' });
      rec.ondataavailable = (e) => { if (e.data?.size) recordedChunksRef.current.push(e.data); };
      rec.onstop = () => {
        // ✅ v59.13.7 FIX #3 (ب): فحص mount قبل setState
        if (!isMountedRef.current) return;
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        setRecordedBlob(blob);
      };
      mediaRecorderRef.current = rec;
      rec.start(250);
      setRecording(true);
    } catch (err) {
      setErrorMessage('تعذّر بدء التسجيل: ' + (err?.message || ''));
    }
  }, [stream, recording]);

  const stopRecording = useCallback(() => {
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    } catch { /* ignore */ }
    setRecording(false);
  }, []);

  const onCenterPress = () => {
    if (recording) {
      stopRecording();
      return;
    }
    if (timer && timer > 0) {
      // ✅ v59.13.7 FIX #3 (أ): ألغ أي عدّ تنازلي سابق إن وجد (تأمين ضغط متكرّر)
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
      let countdown = timer;
      pushToast?.({ tone: 'info', message: `يبدأ التسجيل خلال ${countdown}…` });
      countdownTimerRef.current = setInterval(() => {
        // ✅ v59.13.7 FIX #3 (أ): لا تتابع إذا أُزيل المكوّن
        if (!isMountedRef.current) {
          if (countdownTimerRef.current) {
            clearInterval(countdownTimerRef.current);
            countdownTimerRef.current = null;
          }
          return;
        }
        countdown -= 1;
        if (countdown <= 0) {
          clearInterval(countdownTimerRef.current);
          countdownTimerRef.current = null;
          startRecording();
        }
      }, 1000);
      return;
    }
    startRecording();
  };

  const onCancel = () => {
    setRecordedBlob(null);
    setGalleryFile(null);
    if (galleryPreviewUrl) {
      try { URL.revokeObjectURL(galleryPreviewUrl); } catch { /* ignore */ }
    }
    setGalleryPreviewUrl('');
    setRecordTime(0);
    setUploadProgress(0);
    setErrorMessage('');
  };

  const onConfirm = async () => {
    const file = galleryFile || (recordedBlob ? new File([recordedBlob], `reel-${Date.now()}.webm`, { type: 'video/webm' }) : null);
    if (!file) {
      pushToast?.({ tone: 'warning', message: 'سجّل ريل أو اختر من المعرض أولاً' });
      return;
    }
    setUploading(true);
    setUploadProgress(0);
    setErrorMessage('');
    // ✅ v59.13.34 FIX: ضمان حفظ الريل في قاعدة البيانات
    // المشكلة السابقة: عند فشل mediaUploadService أو إعادة الـ mediaUrl فارغاً،
    // كان الـ backend يرفض الطلب (HTTPException 400) ولا يحفظ السجل البتة.
    // الحل: إذا فشل التحميل عبر الخدمة أو لم نحصل على mediaUrl، نرفع الملف مباشرة
    // إلى POST /reels بصيغة multipart/form-data — وهي صيغة يدعمها الـ backend أصلاً
    // (راجع reels.py حيث 'multipart/form-data' in content_type) وبذلك يتم حفظ
    // الريل بشكل موثوق في قاعدة البيانات.
    let mediaUrl = '';
    try {
      const upload = await mediaUploadService.uploadFile(file, {
        purpose: 'reel-upload',
        compressionPreset: 'balanced',
        processingProfile: `${filter}:${effect}${beautify ? ':beauty' : ''}`,
        // ✅ v59.13.7 FIX #3 (ج): تجنّب setState بعد unmount
        onProgress: (p) => {
          if (!isMountedRef.current) return;
          setUploadProgress(Math.min(100, Number(p?.percent || 0)));
        },
      });
      mediaUrl = upload?.mediaUrl || upload?.url || '';
    } catch (uploadErr) {
      // سنحاول الرفع عبر multipart/form-data للـ backend مباشرة
      mediaUrl = '';
    }
    try {
      let publishResponse;
      if (mediaUrl) {
        // المسار الأساسي: لدينا mediaUrl جاهزة من خدمة الرفع
        publishResponse = await API.post('/reels', {
          media_url: mediaUrl,
          duration,
          quality,
          layout,
          filter,
          effect,
          audio_track: audioTrack?.id || null,
          captions,
          beautify,
        });
      } else {
        // ✅ v59.13.34: fallback multipart — نرفع الملف مباشرة للـ backend
        const fd = new FormData();
        fd.append('file', file, file.name || `reel-${Date.now()}.webm`);
        fd.append('caption', captions || '');
        fd.append('category', 'general');
        publishResponse = await API.post('/reels', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (e) => {
            if (!isMountedRef.current || !e?.total) return;
            setUploadProgress(Math.min(100, Math.round((e.loaded * 100) / e.total)));
          },
        });
      }

      const created = publishResponse?.data?.item || publishResponse?.data?.reel || publishResponse?.data || {};
      const currentUsername = getCurrentUsername();
      const cached = Array.isArray(getReelsCache()?.items) ? getReelsCache().items : [];
      const optimisticReel = {
        ...created,
        id: created?.id || `local-reel-${Date.now()}`,
        username: created?.username || created?.user?.username || currentUsername || 'أنت',
        content: created?.content || created?.caption || '',
        caption: created?.caption || created?.content || '',
        created_at: created?.created_at || new Date().toISOString(),
        media_url: created?.media_url || created?.video_url || mediaUrl,
        video_url: created?.video_url || created?.media_url || mediaUrl,
        thumbnail_url: created?.thumbnail_url || '',
        likes_count: Number(created?.likes_count || 0),
        comments_count: Number(created?.comments_count || 0),
        share_count: Number(created?.share_count || 0),
        views_count: Number(created?.views_count || 0),
      };
      const deduped = [optimisticReel, ...cached].filter((item, index, arr) => {
        const key = String(item?.id || item?.media_url || item?.video_url || index);
        return arr.findIndex((candidate) => String(candidate?.id || candidate?.media_url || candidate?.video_url || '') === key) === index;
      }).slice(0, 80);
      saveReelsCache(deduped);
      try {
        window.dispatchEvent(new CustomEvent('yamshat:reels-updated', { detail: { reelId: optimisticReel.id } }));
      } catch {}

      if (!isMountedRef.current) return;
      pushToast?.({ tone: 'success', message: 'تم نشر الريل بنجاح 🎉' });
      navigate('/reels', { replace: true, state: { highlightReelId: optimisticReel.id } });
    } catch (err) {
      const m = err?.response?.data?.detail || err?.message || 'فشل نشر الريل';
      // ✅ v59.13.7 FIX #3 (ج): تجنّب setState بعد unmount
      if (isMountedRef.current) {
        setErrorMessage(m);
        pushToast?.({ tone: 'error', message: m });
      }
    } finally {
      if (isMountedRef.current) setUploading(false);
    }
  };

  const onGalleryPick = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_VIDEO_SIZE) {
      pushToast?.({ tone: 'error', message: `الملف كبير جداً. الحد ${MAX_VIDEO_SIZE / (1024 * 1024)}MB` });
      return;
    }
    // v59.8 — أوقف الكاميرا (إن كانت مشغّلة) وأظهر معاينة للملف مع جميع التحسينات
    setCameraOn(false);
    setGalleryFile(f);
    setRecordedBlob(null);
    if (galleryPreviewUrl) {
      try { URL.revokeObjectURL(galleryPreviewUrl); } catch { /* ignore */ }
    }
    try {
      const url = URL.createObjectURL(f);
      setGalleryPreviewUrl(url);
    } catch { /* ignore */ }
    setErrorMessage('');
    // أعد قيمة الـ input ليُمكن اختيار نفس الملف مرة أخرى لاحقاً
    try { e.target.value = ''; } catch { /* ignore */ }
    pushToast?.({ tone: 'info', message: 'تم اختيار الفيديو — جرّب التحسينات قبل النشر' });
  };

  // v50 — تبديل التبويبات داخل الصفحة (دون الرجوع للمؤلّف القديم)
  const onTabSwitch = (id) => {
    setActiveTab(id);
    // تحديث ?tab=... في الرابط للحفاظ على الحالة عند التحديث
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', id);
      window.history.replaceState(null, '', url.toString());
    } catch { /* ignore */ }

    if (id === 'live') {
      // البث المباشر — انتقال للغرف الصوتية/البث
      navigate('/voice');
      return;
    }
    // باقي التبويبات (post / reel / story / photo / templates) تبقى داخل نفس الصفحة
  };

  // --- شريط التقدم العلوي أثناء التسجيل ---
  const recPct = Math.min(100, (recordTime / duration) * 100);

  // هل لدينا مقطع من المعرض جاهز للمعاينة/التحسين؟
  const hasGalleryPreview = Boolean(galleryFile && galleryPreviewUrl);
  // حساب فلتر CSS للمعاينة مع تطبيق السرعة على عنصر الفيديو
  useEffect(() => {
    if (previewVideoRef.current) {
      try { previewVideoRef.current.playbackRate = speed || 1; } catch { /* ignore */ }
    }
  }, [speed, galleryPreviewUrl]);

  return (
    <div className="ymrc-root" dir="rtl">
      {/* الفيديو/الكاميرا — خلفية ملء الشاشة */}
      {/* أولاً: معاينة فيديو المعرض إن وُجد، وإلا الكاميرا الحية إن كانت مُفعّلة */}
      {hasGalleryPreview ? (
        <video
          ref={previewVideoRef}
          src={galleryPreviewUrl}
          playsInline
          autoPlay
          loop
          muted={muteAll}
          controls={false}
          className="ymrc-cam"
          style={{ filter: previewFilter || 'none' }}
        />
      ) : (
        <video
          ref={videoRef}
          playsInline
          autoPlay
          muted
          className="ymrc-cam"
          style={{ filter: previewFilter || 'none', transform: facing === 'user' ? 'scaleX(-1)' : 'none', display: cameraOn ? 'block' : 'none' }}
        />
      )}
      {/* عند عدم تشغيل الكاميرا ولا وجود معاينة — أظهر شاشة طلب فتح الكاميرا */}
      {!hasGalleryPreview && !cameraOn ? (
        <div className="ymrc-cam-placeholder">
          <button type="button" className="ymrc-open-cam" onClick={requestOpenCamera} aria-label="فتح الكاميرا">
            {Icons.Camera}
            <span>اضغط لفتح الكاميرا</span>
          </button>
          <p className="ymrc-cam-hint">أو اختر مقطعاً من <button type="button" className="ymrc-link-btn" onClick={() => fileInputRef.current?.click()}>المعرض</button></p>
        </div>
      ) : null}
      <div className="ymrc-veil" aria-hidden />

      {/* شريط التقدم أثناء التسجيل */}
      {recording ? <div className="ymrc-recbar"><span style={{ width: `${recPct}%` }} /></div> : null}

      {/* الشريط العلوي */}
      <header className="ymrc-top">
        <button type="button" className="ymrc-icon-btn" onClick={() => navigate(-1)} aria-label="إغلاق">
          {Icons.Close}
        </button>
        <div className="ymrc-top-center">
          <button type="button" className="ymrc-pill" onClick={() => setShowSheet('audio')} aria-label="إضافة صوت">
            <span>إضافة صوت</span>
            {Icons.Music}
          </button>
          {/* v59.8 — زر أيقونة الكاميرا لفتحها/إغلاقها يدوياً */}
          <button
            type="button"
            className={`ymrc-cam-toggle ${cameraOn ? 'is-on' : ''}`}
            onClick={() => (cameraOn ? setCameraOn(false) : requestOpenCamera())}
            aria-label={cameraOn ? 'إيقاف الكاميرا' : 'فتح الكاميرا'}
            title={cameraOn ? 'إيقاف الكاميرا' : 'فتح الكاميرا'}
          >
            {Icons.Camera}
          </button>
        </div>
        <button type="button" className="ymrc-icon-btn" onClick={() => setShowSettingsSheet(true)} aria-label="الإعدادات">
          {Icons.Settings}
        </button>
      </header>

      {/* العمود الأيسر — أدوات تحسين الفيديو (تعمل في وضعي الكاميرا والمعاينة) */}
      <aside className="ymrc-rail ymrc-rail-left" aria-label="أدوات الفيديو">
        {!hasGalleryPreview && (
          <RailButton icon={Icons.Timer} label="المدة" sub={`${duration}s`} onClick={() => setShowSheet('duration')} />
        )}
        <RailButton icon={Icons.Speed} label="السرعة" sub={`${speed}x`} onClick={() => setShowSheet('speed')} />
        <RailButton icon={Icons.Sparkle} label="تحسين" sub={beautify ? 'تشغيل' : 'إيقاف'} active={beautify} onClick={() => setBeautify((v) => !v)} />
        <RailButton icon={Icons.Filters} label="الفلاتر" onClick={() => setShowSheet('filter')} active={filter !== 'none'} />
        <RailButton icon={Icons.Effects} label="المؤثرات" onClick={() => setShowSheet('effect')} active={effect !== 'none'} />
        {!hasGalleryPreview && (
          <RailButton icon={Icons.Timer} label="المؤقت" sub={timer ? `${timer}s` : 'إيقاف'} onClick={() => setShowSheet('timer')} active={timer > 0} />
        )}
        <RailButton icon={Icons.Layout} label="التخطيط" sub={layout} onClick={() => setShowSheet('layout')} />
        <RailButton icon={Icons.Beautify} label="تجميل" sub={beautify ? 'تشغيل' : 'إيقاف'} active={beautify} onClick={() => setBeautify((v) => !v)} />
      </aside>

      {/* العمود الأيمن — أدوات الكاميرا والصوت */}
      <aside className="ymrc-rail ymrc-rail-right" aria-label="إعدادات الكاميرا">
        {!hasGalleryPreview && (
          <>
            <RailButton icon={Icons.Flip} label="قلب" onClick={() => setFacing((f) => (f === 'user' ? 'environment' : 'user'))} />
            <RailButton icon={Icons.Flash} label="الفلاش" sub={FLASH_MODES.find((m) => m.v === flash)?.label} onClick={() => setShowSheet('flash')} active={flash !== 'off'} />
          </>
        )}
        <RailButton icon={Icons.Quality} label="الجودة" sub={quality} onClick={() => setShowSheet('quality')} />
        {!hasGalleryPreview && (
          <>
            <RailButton icon={Icons.Mic} label="الميكروفون" sub={micOn ? 'تشغيل' : 'إيقاف'} active={micOn} onClick={() => setMicOn((v) => !v)} />
            <RailButton icon={Icons.Noise} label="فلاتر الضوضاء" sub={noiseReduction ? 'تشغيل' : 'إيقاف'} active={noiseReduction} onClick={() => setNoiseReduction((v) => !v)} />
          </>
        )}
        <RailButton icon={Icons.Mute} label="كتم الأصوات" sub={muteAll ? 'مكتوم' : 'تشغيل'} active={muteAll} onClick={() => setMuteAll((v) => !v)} />
        <RailButton icon={Icons.Caption} label="الترجمة" sub={captions ? 'تشغيل' : 'إيقاف'} active={captions} onClick={() => setCaptions((v) => !v)} />
      </aside>

      {/* وسط أسفل — زر التسجيل + إلغاء/تأكيد */}
      {/* عند معاينة ملف من المعرض: زر منتصف يصبح زر "تأكيد ونشر" مع شريط تحسين */}
      <div className="ymrc-record-row">
        <button type="button" className="ymrc-side-btn" onClick={onCancel} aria-label="إلغاء">
          {Icons.Close}
        </button>
        {hasGalleryPreview ? (
          <button
            type="button"
            className="ymrc-record is-confirm"
            onClick={onConfirm}
            disabled={uploading}
            aria-label="تأكيد ونشر الفيديو المختار"
            title="تأكيد ونشر"
          >
            <span className="ymrc-record-core ymrc-record-core-check">{Icons.Check}</span>
          </button>
        ) : (
          <button
            type="button"
            className={`ymrc-record ${recording ? 'is-recording' : ''} ${!cameraOn ? 'is-disabled' : ''}`}
            onClick={cameraOn ? onCenterPress : requestOpenCamera}
            aria-label={!cameraOn ? 'فتح الكاميرا' : (recording ? 'إيقاف التسجيل' : 'بدء التسجيل')}
          >
            <span className="ymrc-record-core" />
          </button>
        )}
        <button type="button" className="ymrc-side-btn" onClick={onConfirm} aria-label="تأكيد ونشر" disabled={uploading || (!recordedBlob && !galleryFile)}>
          {Icons.Check}
        </button>
      </div>

      {/* ===== شريط الفلاتر السفلي على طريقة سناب شات ===== */}
      {/* يظهر دائماً تحت زر التسجيل، يعرض دوائر حيّة للكاميرا بفلاتر متعددة
          (جمالية، ألعاب، كلاسيكي، دافئ، بارد، سينمائي، مونو، حيوي، ...).
          اختيار أي فلتر يُطبَّق فوراً على المعاينة الرئيسية. */}
      {(cameraOn || hasGalleryPreview) ? (
        <div className="ymrc-fcar-wrap" role="region" aria-label="فلاتر الكاميرا">
          <CameraFilterCarousel
            stream={cameraOn ? stream : null}
            facing={facing}
            galleryUrl={hasGalleryPreview ? galleryPreviewUrl : ''}
            activeId={filter}
            onSelect={(f) => setFilter(f.id)}
            onOpenMore={() => setShowSheet('filter')}
          />
        </div>
      ) : null}

      {/* تابات النوع */}
      <nav className="ymrc-tabs" aria-label="نوع المحتوى">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`ymrc-tab ${activeTab === t.id ? 'is-active' : ''}`}
            onClick={() => onTabSwitch(t.id)}
          >
            {t.id === 'post' ? <span className="ymrc-dot" aria-hidden /> : null}
            {t.label}
          </button>
        ))}
      </nav>

      {/* الشريط السفلي — المعرض / المسودات */}
      <div className="ymrc-bottom">
        <button type="button" className="ymrc-bottom-btn" onClick={() => fileInputRef.current?.click()}>
          {Icons.Gallery}
          <span>المعرض</span>
        </button>
        <button type="button" className="ymrc-bottom-btn" onClick={() => navigate('/settings/reels')}>
          {Icons.Draft}
          <span>المسودات</span>
        </button>
      </div>

      {/* مدخل ملف مخفي للمعرض */}
      <input ref={fileInputRef} type="file" accept={ACCEPTED_VIDEO} onChange={onGalleryPick} style={{ display: 'none' }} />

      {/* v59.8 — شارة وضع المعاينة (عند وجود ملف من المعرض) */}
      {hasGalleryPreview ? (
        <div className="ymrc-preview-badge" role="status">
          <span className="ymrc-preview-dot" />
          <span>وضع المعاينة — جرّب الفلاتر والمؤثرات والسرعة قبل النشر</span>
        </div>
      ) : null}

      {/* لوحة الاختيار السفلية */}
      {showSheet ? (
        <div className="ymrc-sheet-back" onClick={() => setShowSheet(null)}>
          <div className="ymrc-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="ymrc-sheet-handle" />
            {showSheet === 'duration' && (
              <>
                <h4>مدّة الريل</h4>
                <div className="ymrc-grid">
                  {DURATION_OPTIONS.map((d) => (
                    <button key={d} className={`ymrc-chip ${duration === d ? 'is-on' : ''}`} onClick={() => { setDuration(d); setShowSheet(null); }}>{d}s</button>
                  ))}
                </div>
              </>
            )}
            {showSheet === 'speed' && (
              <>
                <h4>سرعة التسجيل</h4>
                <div className="ymrc-grid">
                  {SPEED_OPTIONS.map((s) => (
                    <button key={s} className={`ymrc-chip ${speed === s ? 'is-on' : ''}`} onClick={() => { setSpeed(s); setShowSheet(null); }}>{s}x</button>
                  ))}
                </div>
              </>
            )}
            {showSheet === 'quality' && (
              <>
                <h4>جودة الفيديو</h4>
                <div className="ymrc-grid">
                  {QUALITY_OPTIONS.map((q) => (
                    <button key={q} className={`ymrc-chip ${quality === q ? 'is-on' : ''}`} onClick={() => { setQuality(q); setShowSheet(null); }}>{q}</button>
                  ))}
                </div>
              </>
            )}
            {showSheet === 'layout' && (
              <>
                <h4>تخطيط الفيديو</h4>
                <div className="ymrc-grid">
                  {LAYOUT_OPTIONS.map((l) => (
                    <button key={l} className={`ymrc-chip ${layout === l ? 'is-on' : ''}`} onClick={() => { setLayout(l); setShowSheet(null); }}>{l}</button>
                  ))}
                </div>
              </>
            )}
            {showSheet === 'flash' && (
              <>
                <h4>الفلاش</h4>
                <div className="ymrc-grid">
                  {FLASH_MODES.map((m) => (
                    <button key={m.v} className={`ymrc-chip ${flash === m.v ? 'is-on' : ''}`} onClick={() => { setFlash(m.v); setShowSheet(null); }}>{m.label}</button>
                  ))}
                </div>
              </>
            )}
            {showSheet === 'filter' && (
              <>
                <h4>كل الفلاتر</h4>
                <p className="ymrc-muted">اختر فلتراً لتطبيقه فوراً على الكاميرا وعلى الفيديو المُسجَّل.</p>
                <div className="ymrc-grid">
                  {CAMERA_FILTERS.map((f) => (
                    <button
                      key={f.id}
                      className={`ymrc-chip ${filter === f.id ? 'is-on' : ''}`}
                      onClick={() => { setFilter(f.id); setShowSheet(null); }}
                    >
                      <span style={{ marginInlineEnd: 6 }}>{f.emoji}</span>
                      {f.label}
                    </button>
                  ))}
                </div>
              </>
            )}
            {showSheet === 'effect' && (
              <>
                <h4>المؤثرات</h4>
                <div className="ymrc-grid">
                  {EFFECTS.map((e) => (
                    <button key={e.v} className={`ymrc-chip ${effect === e.v ? 'is-on' : ''}`} onClick={() => { setEffect(e.v); setShowSheet(null); }}>{e.label}</button>
                  ))}
                </div>
              </>
            )}
            {showSheet === 'timer' && (
              <>
                <h4>المؤقت قبل التسجيل</h4>
                <div className="ymrc-grid">
                  {TIMER_OPTIONS.map((t) => (
                    <button key={t} className={`ymrc-chip ${timer === t ? 'is-on' : ''}`} onClick={() => { setTimer(t); setShowSheet(null); }}>{t === 0 ? 'إيقاف' : `${t}s`}</button>
                  ))}
                </div>
              </>
            )}
            {showSheet === 'audio' && (
              <>
                <h4>إضافة صوت</h4>
                <p className="ymrc-muted">اختر مقطعاً صوتياً للريل أو حمّل من جهازك.</p>
                <div className="ymrc-grid">
                  {['افتراضي', 'موسيقى ١', 'موسيقى ٢', 'بدون صوت'].map((label, idx) => (
                    <button key={label} className={`ymrc-chip ${audioTrack?.id === idx ? 'is-on' : ''}`} onClick={() => { setAudioTrack({ id: idx, label }); setShowSheet(null); }}>{label}</button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}

      {/* لوحة الإعدادات الكاملة */}
      {showSettingsSheet ? (
        <div className="ymrc-sheet-back" onClick={() => setShowSettingsSheet(false)}>
          <div className="ymrc-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="ymrc-sheet-handle" />
            <h4>إعدادات الريل</h4>
            <ul className="ymrc-settings-list">
              <li><span>الجودة الافتراضية</span><strong>{quality}</strong></li>
              <li><span>التخطيط</span><strong>{layout}</strong></li>
              <li><span>المدّة القصوى</span><strong>{duration}s</strong></li>
              <li><span>الفلتر</span><strong>{activeCamFilter.emoji} {activeCamFilter.label}</strong></li>
              <li><span>المؤثر</span><strong>{EFFECTS.find((x) => x.v === effect)?.label}</strong></li>
              <li><span>تجميل تلقائي</span><strong>{beautify ? 'تشغيل' : 'إيقاف'}</strong></li>
              <li><span>ميكروفون</span><strong>{micOn ? 'تشغيل' : 'إيقاف'}</strong></li>
              <li><span>تقليل الضوضاء</span><strong>{noiseReduction ? 'تشغيل' : 'إيقاف'}</strong></li>
              <li><span>الترجمة التلقائية</span><strong>{captions ? 'تشغيل' : 'إيقاف'}</strong></li>
            </ul>
            <button className="ymrc-cta" onClick={() => { setShowSettingsSheet(false); navigate('/settings/reels'); }}>
              فتح إعدادات الريلز الكاملة
            </button>
          </div>
        </div>
      ) : null}

      {/* شريط رفع/أخطاء */}
      {/* (تم نقل الكاروسيل أعلاه بحيث يظهر تحت زر التسجيل) */}
      {(uploading || errorMessage || (recordedBlob || galleryFile)) && !showSheet && !showSettingsSheet ? (
        <div className="ymrc-upload-pill" role="status">
          {uploading ? (
            <>
              <span className="ymrc-up-bar"><i style={{ width: `${uploadProgress}%` }} /></span>
              <span>جاري النشر… {uploadProgress}%</span>
            </>
          ) : errorMessage ? (
            <span className="ymrc-err">{errorMessage}</span>
          ) : (
            <span>جاهز للنشر — {galleryFile ? `${galleryFile.name} (${formatBytes(galleryFile.size)})` : 'تسجيل جديد'}</span>
          )}
        </div>
      ) : null}

      <style>{`
        .ymrc-root {
          position: fixed;
          inset: 0;
          background: #000;
          color: #fff;
          overflow: hidden;
          font-family: 'Noto Sans Arabic', 'Tajawal', system-ui, sans-serif;
          z-index: 1000;
        }
        .ymrc-cam {
          position: absolute; inset: 0;
          width: 100%; height: 100%;
          object-fit: cover;
          background: #0a0a14;
        }
        .ymrc-veil {
          position: absolute; inset: 0;
          background:
            radial-gradient(120% 80% at 50% 110%, rgba(0,0,0,0.55), transparent 60%),
            radial-gradient(80% 60% at 50% 0%, rgba(0,0,0,0.45), transparent 70%),
            linear-gradient(180deg, rgba(0,0,0,0.15), rgba(0,0,0,0.25));
        }
        .ymrc-recbar {
          position: absolute; top: env(safe-area-inset-top, 0); inset-inline: 0;
          height: 3px; background: rgba(255,255,255,0.12);
          z-index: 5;
        }
        .ymrc-recbar span {
          display: block; height: 100%;
          background: linear-gradient(90deg, #ff3b6b, #b66bff);
          transition: width 100ms linear;
        }
        .ymrc-top {
          position: absolute;
          top: calc(env(safe-area-inset-top, 0) + 14px);
          inset-inline: 14px;
          display: flex; align-items: center; justify-content: space-between;
          gap: 12px;
          z-index: 6;
        }
        .ymrc-top-center {
          display: inline-flex; align-items: center; gap: 10px;
        }
        .ymrc-cam-toggle {
          width: 42px; height: 42px;
          border-radius: 50%;
          background: rgba(0,0,0,0.55);
          border: 1px solid rgba(255,255,255,0.12);
          display: grid; place-items: center;
          color: #fff; cursor: pointer;
          backdrop-filter: blur(6px);
          transition: transform 120ms ease, background 120ms ease;
        }
        .ymrc-cam-toggle:hover { transform: scale(1.05); }
        .ymrc-cam-toggle.is-on {
          background: linear-gradient(135deg, rgba(139,92,246,0.85), rgba(99,102,241,0.85));
          border-color: rgba(167,139,250,0.85);
          box-shadow: 0 4px 18px rgba(138,92,255,0.45);
        }
        .ymrc-cam-toggle svg { width: 22px; height: 22px; }

        .ymrc-cam-placeholder {
          position: absolute; inset: 0;
          display: grid; place-items: center;
          background:
            radial-gradient(60% 50% at 50% 45%, rgba(139,92,246,0.18), transparent 70%),
            #0a0a14;
          z-index: 1;
          padding: 0 24px;
          text-align: center;
        }
        .ymrc-open-cam {
          display: grid; justify-items: center; gap: 14px;
          background: rgba(255,255,255,0.04);
          border: 1px dashed rgba(255,255,255,0.18);
          border-radius: 22px;
          padding: 26px 28px;
          color: #fff;
          font-size: 15px; font-weight: 800;
          cursor: pointer;
          backdrop-filter: blur(4px);
          transition: transform 120ms ease, background 120ms ease;
        }
        .ymrc-open-cam:hover {
          transform: translateY(-2px);
          background: rgba(139,92,246,0.12);
          border-color: rgba(139,92,246,0.45);
        }
        .ymrc-open-cam svg { width: 44px; height: 44px; }
        .ymrc-cam-hint {
          margin-top: 16px;
          color: rgba(255,255,255,0.7);
          font-size: 13px;
        }
        .ymrc-link-btn {
          background: transparent; border: 0;
          color: #b066ff;
          font-weight: 800; cursor: pointer;
          padding: 0 4px;
          text-decoration: underline;
        }

        .ymrc-preview-badge {
          position: absolute;
          top: calc(env(safe-area-inset-top, 0) + 64px);
          inset-inline: 0;
          display: flex; align-items: center; justify-content: center;
          gap: 8px;
          z-index: 5;
          pointer-events: none;
        }
        .ymrc-preview-badge > span:last-child {
          background: rgba(0,0,0,0.6);
          padding: 6px 12px; border-radius: 999px;
          font-size: 12px; color: #fff;
          backdrop-filter: blur(6px);
          border: 1px solid rgba(167,139,250,0.35);
        }
        .ymrc-preview-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: #b066ff;
          box-shadow: 0 0 0 4px rgba(176,102,255,0.15);
          animation: ymrc-pulse 1.6s ease-in-out infinite;
        }
        @keyframes ymrc-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.25); opacity: 0.7; }
        }
        .ymrc-icon-btn {
          width: 38px; height: 38px;
          display: grid; place-items: center;
          background: transparent; border: 0; color: #fff;
          cursor: pointer;
        }
        .ymrc-pill {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 10px 18px;
          border-radius: 999px;
          background: rgba(0,0,0,0.55);
          color: #fff; border: 0; cursor: pointer;
          font-size: 15px; font-weight: 700;
          backdrop-filter: blur(6px);
        }
        .ymrc-rail {
          position: absolute;
          top: calc(env(safe-area-inset-top, 0) + 72px);
          display: grid; gap: 22px;
          z-index: 5;
        }
        .ymrc-rail-left { inset-inline-start: 10px; }
        .ymrc-rail-right { inset-inline-end: 10px; }
        .ymrc-rail-btn {
          display: grid; justify-items: center; gap: 4px;
          background: transparent; border: 0; color: #fff;
          padding: 4px; cursor: pointer;
          min-width: 64px;
        }
        .ymrc-rail-ico {
          width: 36px; height: 36px;
          display: grid; place-items: center;
          border-radius: 12px;
          background: rgba(0,0,0,0.0);
        }
        .ymrc-rail-btn.is-active .ymrc-rail-ico {
          background: rgba(139,92,246,0.35);
          box-shadow: 0 0 0 1px rgba(139,92,246,0.55);
        }
        .ymrc-rail-text {
          display: grid; justify-items: center;
          font-size: 11px; line-height: 1.15;
        }
        .ymrc-rail-label { color: #fff; font-weight: 600; }
        .ymrc-rail-sub { color: rgba(255,255,255,0.72); font-size: 10px; margin-top: 1px; }

        .ymrc-record-row {
          position: absolute;
          bottom: calc(env(safe-area-inset-bottom, 0) + 222px);
          inset-inline: 0;
          display: flex; align-items: center; justify-content: center; gap: 36px;
          z-index: 6;
        }
        /* حاوية شريط الفلاتر السفلي (على طريقة سناب شات) */
        .ymrc-fcar-wrap {
          position: absolute;
          bottom: calc(env(safe-area-inset-bottom, 0) + 140px);
          inset-inline: 0;
          z-index: 7;
          pointer-events: auto;
          background: linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.45) 35%, rgba(0,0,0,0.55) 100%);
          padding-top: 8px;
        }
        .ymrc-side-btn {
          width: 44px; height: 44px;
          border-radius: 12px;
          background: rgba(0,0,0,0.55);
          display: grid; place-items: center;
          border: 0; color: #fff; cursor: pointer;
          backdrop-filter: blur(6px);
        }
        .ymrc-side-btn:disabled { opacity: 0.45; }
        .ymrc-record {
          width: 82px; height: 82px;
          border-radius: 50%;
          background: #8a5cff;
          border: 4px solid #fff;
          box-shadow: 0 0 0 2px rgba(0,0,0,0.25), 0 8px 28px rgba(138,92,255,0.45);
          cursor: pointer;
          display: grid; place-items: center;
          transition: transform 120ms ease;
        }
        .ymrc-record:active { transform: scale(0.96); }
        .ymrc-record.is-recording { background: #ef4444; }
        .ymrc-record.is-recording .ymrc-record-core {
          width: 26px; height: 26px;
          background: #fff;
          border-radius: 6px;
        }
        .ymrc-record.is-disabled {
          background: rgba(138,92,255,0.45);
          box-shadow: 0 0 0 2px rgba(0,0,0,0.25), 0 6px 20px rgba(138,92,255,0.25);
        }
        .ymrc-record.is-confirm {
          background: linear-gradient(135deg, #22c55e, #16a34a);
          box-shadow: 0 0 0 2px rgba(0,0,0,0.25), 0 8px 28px rgba(34,197,94,0.45);
        }
        .ymrc-record.is-confirm:disabled { opacity: 0.6; cursor: not-allowed; }
        .ymrc-record-core-check {
          background: transparent !important;
          display: grid; place-items: center;
        }
        .ymrc-record-core-check svg {
          width: 36px; height: 36px;
        }
        .ymrc-record-core {
          width: 64px; height: 64px;
          border-radius: 50%;
          background: #8a5cff;
          transition: all 150ms ease;
        }

        .ymrc-tabs {
          position: absolute;
          bottom: calc(env(safe-area-inset-bottom, 0) + 90px);
          inset-inline: 0;
          display: flex; align-items: center; justify-content: center;
          gap: 22px;
          z-index: 6;
          /* الترتيب البصري في الصورة من اليمين لليسار: قوالب صورة ريلز لايف نشر */
          direction: rtl;
        }
        .ymrc-tab {
          background: transparent; border: 0; color: rgba(255,255,255,0.75);
          font-size: 14px; font-weight: 700;
          padding: 6px 4px; cursor: pointer;
          position: relative;
          display: inline-flex; align-items: center; gap: 4px;
        }
        .ymrc-tab.is-active {
          color: #b066ff;
        }
        .ymrc-tab.is-active::after {
          content: ''; position: absolute; bottom: -4px; inset-inline: 8px; height: 2px;
          border-radius: 2px; background: #b066ff;
        }
        .ymrc-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #b066ff;
          display: inline-block;
        }

        .ymrc-bottom {
          position: absolute;
          bottom: calc(env(safe-area-inset-bottom, 0) + 14px);
          inset-inline: 0;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 36px;
          z-index: 6;
        }
        .ymrc-bottom-btn {
          display: grid; justify-items: center; gap: 2px;
          background: transparent; border: 0; color: #fff;
          font-size: 12px; cursor: pointer;
          padding: 6px 10px;
        }

        /* Bottom sheets */
        .ymrc-sheet-back {
          position: absolute; inset: 0;
          background: rgba(0,0,0,0.55);
          z-index: 10;
          display: flex; align-items: flex-end; justify-content: center;
        }
        .ymrc-sheet {
          width: 100%; max-width: 560px;
          background: #14141c;
          border-radius: 22px 22px 0 0;
          padding: 14px 18px 22px;
          box-shadow: 0 -10px 30px rgba(0,0,0,0.5);
        }
        .ymrc-sheet-handle {
          width: 46px; height: 5px; border-radius: 99px;
          background: rgba(255,255,255,0.2);
          margin: 0 auto 10px;
        }
        .ymrc-sheet h4 {
          margin: 6px 0 12px;
          color: #fff; font-size: 16px; font-weight: 800;
          text-align: center;
        }
        .ymrc-muted { margin: 0 0 10px; color: #9ca3af; font-size: 13px; text-align: center; }
        .ymrc-grid {
          display: grid; grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
        }
        .ymrc-chip {
          padding: 12px 8px;
          border-radius: 14px;
          background: rgba(255,255,255,0.06);
          color: #fff; border: 1px solid rgba(255,255,255,0.08);
          cursor: pointer; font-weight: 700; font-size: 13px;
        }
        .ymrc-chip.is-on {
          background: linear-gradient(135deg, rgba(139,92,246,0.45), rgba(99,102,241,0.4));
          border-color: rgba(167,139,250,0.7);
          color: #fff;
        }
        .ymrc-settings-list {
          list-style: none; margin: 0; padding: 0;
          display: grid; gap: 6px;
        }
        .ymrc-settings-list li {
          display: flex; justify-content: space-between; align-items: center;
          padding: 10px 12px;
          border-radius: 12px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.06);
          font-size: 13px;
        }
        .ymrc-settings-list strong { color: #c7b8ff; font-weight: 800; }
        .ymrc-cta {
          margin-top: 12px;
          width: 100%;
          padding: 12px;
          border-radius: 14px;
          background: linear-gradient(135deg, #8b5cf6, #6366f1);
          color: #fff; border: 0; font-weight: 800; cursor: pointer;
        }

        .ymrc-upload-pill {
          position: absolute;
          left: 50%; transform: translateX(-50%);
          bottom: calc(env(safe-area-inset-bottom, 0) + 316px);
          background: rgba(0,0,0,0.7);
          padding: 10px 14px; border-radius: 999px;
          display: inline-flex; align-items: center; gap: 10px;
          font-size: 12px; color: #fff;
          z-index: 7;
          max-width: 88%;
          backdrop-filter: blur(6px);
        }
        .ymrc-up-bar {
          width: 140px; height: 6px; border-radius: 999px;
          background: rgba(255,255,255,0.15); overflow: hidden;
        }
        .ymrc-up-bar i {
          display: block; height: 100%; border-radius: inherit;
          background: linear-gradient(90deg, #8b5cf6, #3b82f6);
          transition: width 120ms ease;
        }
        .ymrc-err { color: #fca5a5; }

        @media (min-width: 720px) {
          .ymrc-rail { gap: 24px; }
        }
      `}</style>
    </div>
  );
}

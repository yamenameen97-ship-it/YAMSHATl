import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  readSharedPayload,
  clearSharedPayload,
  recommendTarget,
  stagePendingShare,
  captureVideoThumbnail,
  downloadSharedFile,
} from '../services/share/sharedIntake.js';
import { useAppStore } from '../store/appStore.js';

/**
 * ShareTargetLanding — v88.84
 * ---------------------------------------------------------------
 * ✅ v88.84 — إعادة بناء كاملة لنظام المشاركة:
 *
 * التدفق الجديد:
 *   1) المستخدم يضغط "مشاركة" في يوتيوب/تيك توك/تويتر → يختار Yamshat.
 *   2) يُنسخ رابط المشاركة ويُفتح Yamshat.
 *   3) إن كان مسجّل دخول → يظهر بست فوري "إلى أين تريد المشاركة؟" مع 5 خيارات:
 *        🎬 الريلز
 *        💬 الشات (مشترك محدد)
 *        👥 المجموعات (مجموعة محددة)
 *        📝 المنشورات (ينشر باسم الشخص الذي جلب المشاركة والمسجل)
 *        📸 الستوري (يرفع باسم الشخص المسجل)
 *   4) عند اختيار أي خيار → يفتح بست ثانٍ بخيارين:
 *        🔗 مشاركة كرابط
 *        ⬇️ تنزيل ومشاركة
 *   5) عند اختيار "مشاركة كرابط":
 *        - إن كان المحتوى فيديو: يلتقط لقطة صورة من المقطع + الوصف + الرابط → ينشر
 *        - إن كان المحتوى صورة: يأخذ الصورة + الوصف فقط → ينشر
 *        - إن كان رابطاً فقط: ينشر الرابط + الوصف
 *   6) عند اختيار "تنزيل ومشاركة":
 *        - يفتح بست التحميل مع شريط تقدم من 1 إلى 100%
 *        - بعد الانتهاء: زر "الرفع/النشر" يصبح قابلاً للضغط (كان معطّلاً قبل الرفع)
 *        - عند الضغط: يُنشر مع وصف الفيديو القابل للتعديل بدون رابط
 *          (لأنه تم تنزيله ولا يحتاج لرابط — يشاهدونه الأصدقاء)
 * ---------------------------------------------------------------
 */

// تعريف الوجهات الخمس
const TARGETS = [
  {
    key: 'reel',
    emoji: '🎬',
    title: 'الريلز',
    sub: 'مقاطع فيديو قصيرة',
    path: '/reels/new?from=share',
    ready: true,
  },
  {
    key: 'chat',
    emoji: '💬',
    title: 'الشات',
    sub: 'مشترك محدد',
    path: '/chat?from=share',
    ready: true,
  },
  {
    key: 'groups',
    emoji: '👥',
    title: 'المجموعات',
    sub: 'مجموعة محددة',
    path: '/groups?from=share',
    ready: true,
  },
  {
    key: 'post',
    emoji: '📝',
    title: 'المنشورات',
    sub: 'ينشر باسمك',
    path: '/post/new?tab=post&from=share',
    ready: true,
  },
  {
    key: 'story',
    emoji: '📸',
    title: 'الستوري',
    sub: 'يرفع باسمك',
    path: '/stories?from=share&intent=new',
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

  // ✅ v88.84: حالات البست الجديدة
  // selectedTarget: الوجهة المختارة (reel/chat/groups/post/story)
  // showModeSheet: إظهار بست اختيار الوضع (link vs download)
  // showDownloadSheet: إظهار بست التنزيل مع شريط التقدم
  // downloadProgress: 0→100
  // downloadStage: 'idle' | 'downloading' | 'done' | 'error'
  // downloadedFile: Blob بعد التنزيل
  // editableDescription: وصف قابل للتعديل في بست التنزيل
  // publishDisabled: زر النشر معطّل حتى اكتمال التنزيل
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [showModeSheet, setShowModeSheet] = useState(false);
  const [showDownloadSheet, setShowDownloadSheet] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadStage, setDownloadStage] = useState('idle');
  const [downloadedFile, setDownloadedFile] = useState(null);
  const [downloadedFileMeta, setDownloadedFileMeta] = useState(null);
  const [editableDescription, setEditableDescription] = useState('');
  const [publishDisabled, setPublishDisabled] = useState(true);
  const [capturingThumb, setCapturingThumb] = useState(false);
  const [linkPublishing, setLinkPublishing] = useState(false);
  const previewUrlsRef = useRef([]);

  // ✅ v89.04 ROOT FIX #3: فحص تسجيل الدخول مع حماية من authHydrated=false الدائمة
  //   السبب الجذري (المشكلة #3):
  //     إذا لم يكتمل authHydrated (مثلاً: SW جديد تمّ install قبل التوفق مع
  //     appStore hydration من sessionStorage/IndexedDB) → الشرط (!authHydrated || authLoading)
  //     يبقى true إلى الأبد → المستخدم يرى "جارٍ التحقّق من الجلسة..." للأبد.
  //
  //   الحل:
  //     - مؤقت authHydrated قصوى 3s: إن لم يُرفع خلال هذه المدة نعتبر الجلسة
  //       "غير متوفّرة" ونعرض واجهة تسجيل الدخول (مع الاحتفاظ بالحمولة).
  //     - الحمولة تُقرأ وتُعرض معاً من IndexedDB حتّى قبل اكتمال auth
  //       (يرى المستخدم تأكيداً أن المشاركة استُلمت).
  const session = useAppStore((state) => state.session);
  const authHydrated = useAppStore((state) => state.authHydrated);
  const authLoading = useAppStore((state) => state.authLoading);
  const isAuthenticated = Boolean(session?.username || session?.user || session?.email);
  const [authTimeout, setAuthTimeout] = useState(false);

  // مؤقت طوارئ 3s: إذا بقي authHydrated=false يُعتبر فشل hydration
  //   ونفتح بوابة تسجيل الدخول (مع إبقاء الحمولة محفوظة في IndexedDB).
  useEffect(() => {
    if (authHydrated) return;
    const timer = setTimeout(() => setAuthTimeout(true), 1500);  // v89.07: 3s→1.5s
    return () => clearTimeout(timer);
  }, [authHydrated]);

  useEffect(() => {
    let mounted = true;

    // ✅ v89.02 ROOT FIX #4: تحرّي دقيق لمصدر الوصول + مهلة كافية لجميع الحالات
    //   السبب الجذري:
    //     قبل الإصلاح، الحالة via=direct&shared=0 (أي nginx fallback دون تحكم SW
    //     أولي) كانت تأخذ 5 محاولات فقط × 200ms = 1s، وهي غير كافية لأن SW
    //     الجديد ما زال يسجّل ويحول الطلب إلى IndexedDB (قد يأخذ 2–5 ثوانٍ
    //     على أجهزة أندرويد المتوسطة/الضعيفة).
    //
    //   الحل:
    //   - نرفع maxAttempts لجميع الحالات إلى حد أدنى كافٍ
    //     (via=direct: 30 × 200ms = 6s, via=sw: 40 × 200ms = 8s).
    //   - نعتبر أي وصول لـ /share-target محتمل أن يكون SW لم يتحكم بعد،
    //     حتى إذا وصلنا عبر nginx fallback (shared=0&via=direct).
    //   - نضيف الاستماع لـ navigator.serviceWorker.ready و controllerchange:
    //     فور تحكّم SW في العميل → نعيد القراءة مباشرة دون انتظار polling.
    const viaRaw = (searchParams.get('via') || '').toLowerCase();
    const sharedRaw = searchParams.get('shared') || '';
    const viaSw = viaRaw === 'sw' || sharedRaw === '1';
    // في حالة nginx fallback (via=direct&shared=0) نأخذ مهلة أطول لأن SW
    // لا يزال يحفظ الحمولة في IndexedDB في الخلفية.
    const maxAttempts = viaSw ? 40 : 30;
    const attemptDelay = 200;

    let stopFlag = false;
    let swMessageHandler = null;
    let visibilityHandler = null;

    function applyPayload(data) {
      if (!mounted || stopFlag) return false;
      // ✅ v89.13 ROOT FIX #C: قبول الحمولة حتى لو كانت _empty:true
      //   السبب الجذري السابق:
      //     إذا حفظ SW حمولة _empty:true (مشاركة فارغة تماماً من
      //     المتصفح)، كان hasContent=false → يرفضها → polling إلى الأبد.
      //   الحل: أي حمولة موسومة من SW (_v أو receivedAt أو _empty أو _fallback)
      //   تُقبل — الواجهة تعرف كيف تعرض حالة "مشاركة بلا محتوى".
      if (!data) return false;
      const hasContent = !!(data.files?.length || data.url || data.title || data.text);
      const isMarkedFromSw = !!(data._empty || data._fallback || data._v || data.receivedAt);
      if (!hasContent && !isMarkedFromSw) return false;
      setPayload(data);
      // نظّف URLs السابقة قبل إنشاء الجديدة
      previewUrlsRef.current.forEach((u) => {
        try { URL.revokeObjectURL(u); } catch { /* ignore */ }
      });
      previewUrlsRef.current = [];
      const nextPreviews = (data?.files || []).map((file) => {
        let previewUrl = '';
        try {
          previewUrl = URL.createObjectURL(file.blob);
          previewUrlsRef.current.push(previewUrl);
        } catch { /* ignore */ }
        return {
          ...file,
          previewUrl,
          isImage: file.type?.startsWith('image/'),
          isVideo: file.type?.startsWith('video/'),
        };
      });
      setPreviews(nextPreviews);
      setLoading(false);
      stopFlag = true;
      return true;
    }

    // ✅ v89.13 ROOT FIX #E: قراءة موحّدة تحاول IDB أولاً ثم localStorage fallback
    async function readAny() {
      try {
        const d = await readSharedPayload();
        if (d) return d;
      } catch { /* ignore */ }
      try {
        const raw = localStorage.getItem('yamshat.shareFallback');
        if (raw) return JSON.parse(raw);
      } catch { /* ignore */ }
      return null;
    }

    async function loadPayloadWithRetry() {
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        if (stopFlag) return;
        try {
          const data = await readAny();
          if (applyPayload(data)) return;
        } catch { /* ignore and retry */ }
        await new Promise((r) => setTimeout(r, attemptDelay));
      }
      // محاولة أخيرة
      if (!stopFlag) {
        try {
          const data = await readAny();
          if (!applyPayload(data) && mounted) {
            setPayload(data || null);
            setLoading(false);
          }
        } catch {
          if (mounted) {
            setPayload(null);
            setLoading(false);
          }
        }
      }
    }

    // ✅ v88.98: استماع لرسالة SW YAMSHAT_SHARE_RECEIVED — قراءة فورية بمجرد وصولها
    let controllerChangeHandler = null;
    let swReadyPromise = null;
    if (typeof navigator !== 'undefined' && navigator.serviceWorker) {
      swMessageHandler = async (event) => {
        const t = event?.data?.type;
        if (t === 'YAMSHAT_SHARE_RECEIVED') {
          try {
            const data = await readAny();
            applyPayload(data);
          } catch { /* ignore */ }
        } else if (t === 'YAMSHAT_SHARE_PAYLOAD_FALLBACK') {
          // ✅ v89.13 ROOT FIX #D: تلقّي حمولة fallback من SW عند فشل IndexedDB
          //   SW أرسل لنا payload خفيفة مباشرة لأن حفظها في IDB فشل
          //   (VersionError أو private mode). نطبقها كما هي ونحاول حفظ
          //   نسخة محلية في localStorage للتعافي من إعادة التحميل.
          try {
            const fb = event.data.payload || {};
            try { localStorage.setItem('yamshat.shareFallback', JSON.stringify(fb)); } catch (_) { /* ignore */ }
            applyPayload(fb);
          } catch { /* ignore */ }
        }
      };
      try {
        navigator.serviceWorker.addEventListener('message', swMessageHandler);
      } catch { /* ignore */ }

      // ✅ v89.14 ROOT FIX #E: أرسل hello للـ SW لطلب أي fallback payload مخزّن في Cache Storage.
      //   يعالج السباق الزمني: SW يحفظ fallback قبل ما ShareTargetLanding يفتح.
      const sendHello = () => {
        try {
          if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({ type: 'YAMSHAT_SHARE_HELLO' });
          }
        } catch { /* ignore */ }
      };
      sendHello();

      // ✅ v89.02 ROOT FIX #4: فور تحكّم SW للمرة الأولى → إعادة قراءة فورية.
      //   هذا يغطي الحالة via=direct&shared=0 حيث يصل المستخدم عبر nginx
      //   قبل تثبيت SW ويجب أن نلتقط أول تحكّم دون انتظار polling.
      controllerChangeHandler = async () => {
        try {
          // ✅ v89.14: فور تحكّم SW أرسل hello أيضاً (قد يكون مخزناً fallback من POST سابق)
          if (navigator.serviceWorker.controller) {
            try { navigator.serviceWorker.controller.postMessage({ type: 'YAMSHAT_SHARE_HELLO' }); } catch (_) { /* ignore */ }
          }
          const data = await readAny();
          applyPayload(data);
        } catch { /* ignore */ }
      };
      try {
        navigator.serviceWorker.addEventListener('controllerchange', controllerChangeHandler);
      } catch { /* ignore */ }

      // إذا لم يكن SW مسيطراً بعد → انتظار ready ثم إعادة القراءة مرة إضافية.
      if (!navigator.serviceWorker.controller) {
        try {
          swReadyPromise = navigator.serviceWorker.ready.then(async () => {
            if (stopFlag) return;
            try {
              // ✅ v89.14: أرسل hello بمجرد جاهزية SW (يحل حالة first-install)
              if (navigator.serviceWorker.controller) {
                try { navigator.serviceWorker.controller.postMessage({ type: 'YAMSHAT_SHARE_HELLO' }); } catch (_) { /* ignore */ }
              }
              const data = await readAny();
              applyPayload(data);
            } catch { /* ignore */ }
          }).catch(() => null);
        } catch { /* ignore */ }
      }
    }

    // ✅ v88.98: عند عودة visibility (يوتيوب فتح تبويب جديد ثم عاد)
    visibilityHandler = async () => {
      if (document.visibilityState === 'visible' && !stopFlag) {
        try {
          const data = await readAny();
          applyPayload(data);
        } catch { /* ignore */ }
      }
    };
    try { document.addEventListener('visibilitychange', visibilityHandler); } catch { /* ignore */ }

    loadPayloadWithRetry();

    return () => {
      mounted = false;
      stopFlag = true;
      if (swMessageHandler && navigator.serviceWorker) {
        try { navigator.serviceWorker.removeEventListener('message', swMessageHandler); } catch { /* ignore */ }
      }
      if (controllerChangeHandler && navigator.serviceWorker) {
        try { navigator.serviceWorker.removeEventListener('controllerchange', controllerChangeHandler); } catch { /* ignore */ }
      }
      if (visibilityHandler) {
        try { document.removeEventListener('visibilitychange', visibilityHandler); } catch { /* ignore */ }
      }
      previewUrlsRef.current.forEach((url) => {
        try { URL.revokeObjectURL(url); } catch { /* ignore */ }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // ✅ v88.84: تحديد نوع المحتوى الوارد
  const contentType = useMemo(() => {
    const files = Array.isArray(payload?.files) ? payload.files : [];
    const firstFile = files[0];
    if (!firstFile && payload?.url) return 'link';
    if (!firstFile) return 'empty';
    const type = String(firstFile.type || '').toLowerCase();
    if (type.startsWith('video/')) return 'video';
    if (type.startsWith('image/')) return 'image';
    return 'file';
  }, [payload]);

  const firstFile = useMemo(() => {
    const files = Array.isArray(payload?.files) ? payload.files : [];
    return files[0] || null;
  }, [payload]);

  // ✅ v88.84: بناء وصف افتراضي (بدون رابط لوضع التنزيل)
  const defaultDescriptionNoLink = useMemo(() => {
    if (!payload) return '';
    const parts = [];
    if (payload.title) parts.push(payload.title);
    if (payload.text && payload.text !== payload.title) parts.push(payload.text);
    return parts.join('\n').trim();
  }, [payload]);

  // ✅ v88.84: عند اختيار وجهة → افتح بست الوضع (link vs download)
  const handleSelectTarget = useCallback((targetKey) => {
    if (busy) return;
    const target = TARGETS.find((t) => t.key === targetKey);
    if (!target) return;
    setSelectedTarget(target);
    setShowModeSheet(true);
  }, [busy]);

  // ✅ v88.84: "مشاركة كرابط" — يلتقط لقطة من الفيديو + الوصف + الرابط → ينشر
  const handleShareAsLink = useCallback(async () => {
    if (!payload || !selectedTarget || linkPublishing) return;
    setLinkPublishing(true);

    try {
      let thumbnailDataUrl = null;

      // إن كان فيديو → التقط لقطة صورة
      if (contentType === 'video' && firstFile?.blob) {
        setCapturingThumb(true);
        thumbnailDataUrl = await captureVideoThumbnail(firstFile.blob);
        setCapturingThumb(false);
      }

      // جهّز الحمولة بوضع 'link'
      stagePendingShare(payload, selectedTarget.key, {
        mode: 'link',
        thumbnailDataUrl,
      });

      // انتقل إلى الوجهة
      setBusy(true);
      navigate(selectedTarget.path);
    } catch (err) {
      console.error('[share] link mode failed:', err);
      setCapturingThumb(false);
      // في حال الفشل، نشر بدون لقطة
      stagePendingShare(payload, selectedTarget.key, {
        mode: 'link',
        thumbnailDataUrl: null,
      });
      setBusy(true);
      navigate(selectedTarget.path);
    } finally {
      setLinkPublishing(false);
    }
  }, [payload, selectedTarget, contentType, firstFile, linkPublishing, navigate]);

  // ✅ v88.84: "تنزيل ومشاركة" — يفتح بست التنزيل
  const handleDownloadAndShare = useCallback(() => {
    if (!payload || !selectedTarget) return;
    setShowModeSheet(false);
    setShowDownloadSheet(true);
    setDownloadProgress(0);
    setDownloadStage('idle');
    setDownloadedFile(null);
    setDownloadedFileMeta(null);
    setPublishDisabled(true);
    // تعيين الوصف الافتراضي بدون رابط
    setEditableDescription(defaultDescriptionNoLink);
  }, [payload, selectedTarget, defaultDescriptionNoLink]);

  // ✅ v88.84: بدء التنزيل الفعلي
  const startDownload = useCallback(async () => {
    if (!payload) return;
    setDownloadStage('downloading');
    setDownloadProgress(1);

    try {
      // إن كان لدينا ملف محلي بالفعل (مُشارك كملف وليس كرابط)
      // نعامله كأنه "منزّل" مباشرة — لا حاجة للتنزيل
      if (firstFile?.blob) {
        // محاكاة تقدم سريع للملف المحلي
        const totalSize = Number(firstFile.size || 0);
        const startTime = Date.now();
        const estimatedMs = Math.min(1500, 300 + Math.round(totalSize / (1024 * 1024 * 2)));

        const timer = setInterval(() => {
          const elapsed = Date.now() - startTime;
          const pct = Math.min(99, Math.round((elapsed / estimatedMs) * 99));
          setDownloadProgress(pct);
          if (pct >= 99) clearInterval(timer);
        }, 50);

        await new Promise((resolve) => setTimeout(resolve, estimatedMs));
        clearInterval(timer);

        setDownloadedFile(firstFile.blob);
        setDownloadedFileMeta({
          name: firstFile.name || 'shared',
          type: firstFile.type || 'application/octet-stream',
          size: Number(firstFile.size || 0),
        });
      } else if (payload.url) {
        // تنزيل من الرابط
        const blob = await downloadSharedFile(payload.url, (pct) => {
          setDownloadProgress(pct);
        });

        // استخراج اسم الملف ونوعه من الرابط أو من رؤوس الاستجابة
        const urlStr = String(payload.url || '');
        let fileName = 'shared';
        let fileType = 'application/octet-stream';
        try {
          const urlPath = new URL(urlStr).pathname;
          const basename = urlPath.split('/').pop() || '';
          if (basename) fileName = basename;
        } catch { /* ignore */ }
        // تخمين النوع من الامتداد
        if (/\.mp4(\?|$)/i.test(urlStr)) fileType = 'video/mp4';
        else if (/\.webm(\?|$)/i.test(urlStr)) fileType = 'video/webm';
        else if (/\.mov(\?|$)/i.test(urlStr)) fileType = 'video/quicktime';
        else if (/\.jpg|\.jpeg(\?|$)/i.test(urlStr)) fileType = 'image/jpeg';
        else if (/\.png(\?|$)/i.test(urlStr)) fileType = 'image/png';
        else if (blob.type) fileType = blob.type;

        setDownloadedFile(blob);
        setDownloadedFileMeta({
          name: fileName,
          type: fileType,
          size: blob.size,
        });
      } else {
        throw new Error('لا يوجد محتوى للتنزيل');
      }

      setDownloadProgress(100);
      setDownloadStage('done');
      setPublishDisabled(false);
    } catch (err) {
      console.error('[share] download failed:', err);
      setDownloadStage('error');
      setDownloadProgress(0);
    }
  }, [payload, firstFile]);

  // ✅ v88.84: النشر بعد التنزيل — وصف قابل للتعديل بدون رابط
  const handlePublishAfterDownload = useCallback(() => {
    if (publishDisabled || !payload || !selectedTarget) return;

    stagePendingShare(payload, selectedTarget.key, {
      mode: 'download',
      downloadedFile,
      downloadedFileMeta,
      customDescription: editableDescription,
    });

    setBusy(true);
    navigate(selectedTarget.path);
  }, [publishDisabled, payload, selectedTarget, downloadedFile, downloadedFileMeta, editableDescription, navigate]);

  // ✅ v88.84: إغلاق بست الوضع
  const closeModeSheet = useCallback(() => {
    setShowModeSheet(false);
    setSelectedTarget(null);
  }, []);

  // ✅ v88.84: إغلاق بست التنزيل
  const closeDownloadSheet = useCallback(() => {
    if (downloadStage === 'downloading') return; // لا نغلق أثناء التنزيل
    setShowDownloadSheet(false);
    setDownloadProgress(0);
    setDownloadStage('idle');
    setDownloadedFile(null);
    setDownloadedFileMeta(null);
    setPublishDisabled(true);
    setSelectedTarget(null);
  }, [downloadStage]);

  const openFeed = async () => {
    await clearSharedPayload().catch(() => null);
    navigate('/');
  };

  const goLogin = () => {
    navigate('/login', { state: { from: { pathname: '/share-target', search: '?shared=1' } } });
  };

  // ✅ v89.04 ROOT FIX #3: الجلسة تُعتبر جاهزة إمّا:
  //   - authHydrated مرفوعة فعلاً (وليس authLoading)
  //   - أو انتهى مؤقت الطوارئ 3s → نفترض أنّها لن تُرفع أبداً
  const authResolved = authHydrated || authTimeout;
  const showLoginGate = authResolved && !authLoading && !isAuthenticated;
  const isAuthChecking = !authResolved || authLoading;

  // ✅ v88.84: تحديد ما إذا كان المحتوى قابلاً للتنزيل
  const canDownload = Boolean(firstFile?.blob || payload?.url);

  return (
    <section className="share-target-page" dir="rtl">
      <div className="share-target-card">
        <div className="share-target-badge">مشاركة إلى يام شات</div>
        <h1>إلى أين تريد نشر هذا المحتوى؟</h1>

        {/* ✅ v89.04 ROOT FIX #3: بوابة تسجيل الدخول — مع مؤقت طوارئ
            إذا لم تجتز auth hydration خلال 3s نمضي إلى واجهة تسجيل الدخول */}
        {isAuthChecking ? (
          /* ✅ v89.07 ROOT FIX: spinner مرئي كبير بدل نص فقط
             السبب: المستخدم كان يرى شاشة تبدو فارغة (فقط نص صغير) عند العودة
             من WebView — الآن يرى spinner + بطاقة واضحة فوراً */
          <div className="share-empty-box" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: 24 }}>
            <div
              aria-hidden="true"
              style={{
                width: 56, height: 56,
                border: '5px solid rgba(139,92,246,.2)',
                borderTopColor: '#8B5CF6',
                borderRadius: '50%',
                animation: 'ym-share-spin .85s linear infinite',
              }}
            />
            <style>{`@keyframes ym-share-spin{to{transform:rotate(360deg)}}`}</style>
            <strong style={{ fontSize: '1.05rem', fontWeight: 800 }}>جارٍ التحقّق من الجلسة...</strong>
            <span style={{ color: '#94A3B8', fontSize: '.9rem', textAlign: 'center', maxWidth: 360, lineHeight: 1.6 }}>
              لحظات وسنعرض لك خيارات المشاركة. المحتوى المُشارَك محفوظ محليّاً ولن يُفقد.
            </span>
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
                      المقاطع القصيرة أنسبها <b>ريلز</b>، والمشاركة الخاصة <b>شات</b>،
                      وللنشر داخل جماعتك اختر <b>مجموعات</b>،
                      والمنشورات <b>منشورات</b>، واللحظات السريعة <b>ستوري</b>.
                    </span>
                    {recommendation?.hint ? (
                      <span className="share-choose-recommend">
                        ⭐ التوصية:
                        <b style={{ margin: '0 6px' }}>
                          {(TARGETS.find((t) => t.key === recommendation.target) || TARGETS[3]).title}
                        </b>
                        — {recommendation.hint}
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* ✅ v88.84: 5 أزرار — عند الضغط يفتح بست الوضع */}
                <div className="share-choose-grid share-choose-grid--five">
                  {TARGETS.map((t) => {
                    const isRecommended = recommendation?.target === t.key;
                    return (
                      <button
                        key={t.key}
                        type="button"
                        className={`share-choose-btn ${isRecommended ? 'is-recommended' : ''}`}
                        onClick={() => handleSelectTarget(t.key)}
                        disabled={busy}
                        aria-label={`مشاركة إلى ${t.title}`}
                      >
                        <span className="share-choose-emoji" aria-hidden="true">{t.emoji}</span>
                        <span className="share-choose-title">{t.title}</span>
                        <span className="share-choose-sub">{t.sub}</span>
                        {isRecommended ? <span className="share-choose-badge">موصى به</span> : null}
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

      {/* ✅ v88.84: البست الثاني — اختيار وضع المشاركة (رابط vs تنزيل) */}
      {showModeSheet && selectedTarget ? (
        <div className="ym-share-overlay" onClick={closeModeSheet}>
          <div className="ym-share-sheet ym-share-sheet--mode" onClick={(e) => e.stopPropagation()}>
            <div className="ym-share-handle" />
            <div className="ym-share-sheet-header">
              <span className="ym-share-sheet-emoji">{selectedTarget.emoji}</span>
              <div>
                <strong>مشاركة إلى {selectedTarget.title}</strong>
                <span>{selectedTarget.sub}</span>
              </div>
            </div>

            <div className="ym-share-mode-grid">
              {/* مشاركة كرابط */}
              <button
                type="button"
                className="ym-share-mode-btn"
                onClick={handleShareAsLink}
                disabled={linkPublishing || capturingThumb}
              >
                <span className="ym-share-mode-icon">🔗</span>
                <span className="ym-share-mode-body">
                  <strong>مشاركة كرابط</strong>
                  <span>
                    {contentType === 'video'
                      ? 'يلتقط لقطة من المقطع + الوصف + الرابط وينشر'
                      : contentType === 'image'
                        ? 'يأخذ الصورة + الوصف وينشر'
                        : 'ينشر الرابط + الوصف'}
                  </span>
                </span>
                {(linkPublishing || capturingThumb) ? (
                  <span className="ym-share-mode-spinner">
                    {capturingThumb ? '📸 جارٍ التقاط لقطة...' : '⏳ جارٍ النشر...'}
                  </span>
                ) : null}
              </button>

              {/* تنزيل ومشاركة */}
              <button
                type="button"
                className="ym-share-mode-btn"
                onClick={handleDownloadAndShare}
                disabled={!canDownload || linkPublishing}
              >
                <span className="ym-share-mode-icon">⬇️</span>
                <span className="ym-share-mode-body">
                  <strong>تنزيل ومشاركة</strong>
                  <span>
                    ينزّل المحتوى مع شريط تقدم، ثم تنشره بدون رابط
                    (يشاهده أصدقاؤك مباشرة)
                  </span>
                </span>
              </button>
            </div>

            <button type="button" className="ym-share-cancel" onClick={closeModeSheet}>
              إلغاء
            </button>
          </div>
        </div>
      ) : null}

      {/* ✅ v88.84: بست التنزيل — شريط تقدم + وصف قابل للتعديل + زر نشر */}
      {showDownloadSheet ? (
        <div className="ym-share-overlay" onClick={() => { if (downloadStage !== 'downloading') closeDownloadSheet(); }}>
          <div className="ym-share-sheet ym-share-sheet--download" onClick={(e) => e.stopPropagation()}>
            <div className="ym-share-handle" />
            <div className="ym-share-sheet-header">
              <span className="ym-share-sheet-emoji">⬇️</span>
              <div>
                <strong>تنزيل ومشاركة إلى {selectedTarget?.title}</strong>
                <span>
                  {downloadStage === 'idle' && 'اضغط "بدء التنزيل" لبدء العملية'}
                  {downloadStage === 'downloading' && `جارٍ التنزيل... ${downloadProgress}%`}
                  {downloadStage === 'done' && '✅ اكتمل التنزيل — يمكنك النشر الآن'}
                  {downloadStage === 'error' && '❌ فشل التنزيل — حاول مرة أخرى'}
                </span>
              </div>
            </div>

            {/* شريط التقدم */}
            <div className="ym-download-progress-wrap">
              <div className="ym-download-progress-bar">
                <span
                  className={`ym-download-progress-fill ${
                    downloadStage === 'done' ? 'is-done' : ''
                  } ${downloadStage === 'error' ? 'is-error' : ''}`}
                  style={{ width: `${downloadProgress}%` }}
                />
              </div>
              <span className="ym-download-progress-pct">{downloadProgress}%</span>
            </div>

            {/* معلومات الملف بعد التنزيل */}
            {downloadStage === 'done' && downloadedFileMeta ? (
              <div className="ym-download-file-info">
                <strong>📄 {downloadedFileMeta.name}</strong>
                <span>{Math.max(1, Math.round((downloadedFileMeta.size || 0) / 1024))} KB — جاهز للنشر</span>
              </div>
            ) : null}

            {/* الوصف القابل للتعديل — يظهر بعد اكتمال التنزيل */}
            {downloadStage === 'done' ? (
              <div className="ym-download-desc-wrap">
                <label className="ym-download-desc-label">
                  الوصف (بدون رابط — المحتوى أصبح محلياً)
                </label>
                <textarea
                  className="ym-download-desc-input"
                  value={editableDescription}
                  onChange={(e) => setEditableDescription(e.target.value)}
                  placeholder="أضف وصفاً للمحتوى..."
                  rows={3}
                  dir="rtl"
                />
              </div>
            ) : null}

            {/* رسالة خطأ */}
            {downloadStage === 'error' ? (
              <div className="ym-download-error-msg">
                تعذّر تنزيل المحتوى. تأكد من اتصالك بالإنترنت وحاول مرة أخرى.
              </div>
            ) : null}

            {/* الأزرار */}
            <div className="ym-download-actions">
              {downloadStage === 'idle' ? (
                <button
                  type="button"
                  className="ym-share-primary-btn"
                  onClick={startDownload}
                  disabled={!canDownload}
                >
                  ▶️ بدء التنزيل
                </button>
              ) : downloadStage === 'downloading' ? (
                <button type="button" className="ym-share-primary-btn" disabled>
                  ⏳ جارٍ التنزيل... {downloadProgress}%
                </button>
              ) : downloadStage === 'done' ? (
                <button
                  type="button"
                  className={`ym-share-primary-btn ${publishDisabled ? 'is-disabled' : ''}`}
                  onClick={handlePublishAfterDownload}
                  disabled={publishDisabled}
                >
                  ✅ رفع / نشر
                </button>
              ) : (
                <button
                  type="button"
                  className="ym-share-primary-btn"
                  onClick={startDownload}
                >
                  🔄 إعادة المحاولة
                </button>
              )}

              <button
                type="button"
                className="ym-share-cancel"
                onClick={closeDownloadSheet}
                disabled={downloadStage === 'downloading'}
              >
                {downloadStage === 'downloading' ? 'جارٍ التنزيل...' : 'إلغاء'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

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

        .share-choose-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 12px;
        }

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

        /* ====== ✅ v88.84: أنماط الأبستات الجديدة ====== */

        .ym-share-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.65);
          backdrop-filter: blur(4px);
          z-index: 9999;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          animation: ym-share-fade-in 0.2s ease;
        }
        @keyframes ym-share-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .ym-share-sheet {
          width: 100%;
          max-width: 560px;
          background: #14141c;
          border-radius: 28px 28px 0 0;
          padding: 14px 20px calc(24px + env(safe-area-inset-bottom, 0px));
          box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.6);
          animation: ym-share-slide-up 0.25s ease;
          max-height: 90dvh;
          overflow-y: auto;
        }
        @keyframes ym-share-slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }

        .ym-share-handle {
          width: 46px;
          height: 5px;
          border-radius: 99px;
          background: rgba(255, 255, 255, 0.2);
          margin: 0 auto 14px;
        }

        .ym-share-sheet-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }

        .ym-share-sheet-emoji {
          font-size: 36px;
          line-height: 1;
          flex-shrink: 0;
          width: 56px;
          height: 56px;
          border-radius: 16px;
          background: rgba(139, 92, 246, 0.15);
          display: grid;
          place-items: center;
          border: 1px solid rgba(139, 92, 246, 0.3);
        }

        .ym-share-sheet-header > div {
          display: grid;
          gap: 4px;
        }

        .ym-share-sheet-header strong {
          font-size: 1.15rem;
          font-weight: 900;
          color: #fff;
        }

        .ym-share-sheet-header span {
          font-size: 0.88rem;
          color: #94a3b8;
        }

        /* بست الوضع — خياران */
        .ym-share-mode-grid {
          display: grid;
          gap: 12px;
          margin-bottom: 16px;
        }

        .ym-share-mode-btn {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 18px 16px;
          border-radius: 18px;
          border: 1px solid rgba(148, 163, 184, 0.18);
          background: rgba(255, 255, 255, 0.04);
          color: #fff;
          cursor: pointer;
          font-family: inherit;
          text-align: start;
          transition: all 0.2s ease;
          position: relative;
        }

        .ym-share-mode-btn:hover:not(:disabled) {
          background: rgba(139, 92, 246, 0.12);
          border-color: rgba(139, 92, 246, 0.45);
          transform: translateY(-1px);
        }

        .ym-share-mode-btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .ym-share-mode-icon {
          font-size: 30px;
          flex-shrink: 0;
          width: 52px;
          height: 52px;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.06);
          display: grid;
          place-items: center;
        }

        .ym-share-mode-body {
          display: grid;
          gap: 4px;
          flex: 1;
          min-width: 0;
        }

        .ym-share-mode-body strong {
          font-size: 1.02rem;
          font-weight: 800;
        }

        .ym-share-mode-body span {
          font-size: 0.84rem;
          color: #94a3b8;
          line-height: 1.6;
        }

        .ym-share-mode-spinner {
          position: absolute;
          top: 50%;
          inset-inline-end: 16px;
          transform: translateY(-50%);
          font-size: 0.78rem;
          color: #c4b5fd;
          font-weight: 700;
          white-space: nowrap;
        }

        .ym-share-cancel {
          width: 100%;
          padding: 12px;
          border-radius: 14px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: transparent;
          color: #94a3b8;
          font-weight: 700;
          font-size: 0.95rem;
          cursor: pointer;
          font-family: inherit;
        }

        .ym-share-cancel:disabled {
          opacity: 0.5;
        }

        /* بست التنزيل */
        .ym-download-progress-wrap {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .ym-download-progress-bar {
          flex: 1;
          height: 10px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.1);
          overflow: hidden;
        }

        .ym-download-progress-fill {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #8b5cf6, #6366f1);
          transition: width 0.3s ease;
        }

        .ym-download-progress-fill.is-done {
          background: linear-gradient(90deg, #22c55e, #16a34a);
        }

        .ym-download-progress-fill.is-error {
          background: linear-gradient(90deg, #ef4444, #dc2626);
        }

        .ym-download-progress-pct {
          font-size: 0.9rem;
          font-weight: 800;
          color: #c4b5fd;
          min-width: 42px;
          text-align: center;
        }

        .ym-download-file-info {
          padding: 14px 16px;
          border-radius: 16px;
          background: rgba(34, 197, 94, 0.1);
          border: 1px solid rgba(34, 197, 94, 0.25);
          display: grid;
          gap: 4px;
          margin-bottom: 16px;
        }

        .ym-download-file-info strong {
          font-size: 0.92rem;
          color: #86efac;
        }

        .ym-download-file-info span {
          font-size: 0.82rem;
          color: #94a3b8;
        }

        .ym-download-desc-wrap {
          margin-bottom: 16px;
        }

        .ym-download-desc-label {
          display: block;
          font-size: 0.85rem;
          font-weight: 700;
          color: #cbd5e1;
          margin-bottom: 8px;
        }

        .ym-download-desc-input {
          width: 100%;
          padding: 12px 14px;
          border-radius: 14px;
          border: 1px solid rgba(148, 163, 184, 0.2);
          background: rgba(255, 255, 255, 0.04);
          color: #fff;
          font-family: inherit;
          font-size: 0.92rem;
          resize: vertical;
          min-height: 80px;
          line-height: 1.6;
        }

        .ym-download-desc-input:focus {
          outline: none;
          border-color: rgba(139, 92, 246, 0.55);
          background: rgba(139, 92, 246, 0.06);
        }

        .ym-download-error-msg {
          padding: 14px 16px;
          border-radius: 16px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.25);
          color: #fca5a5;
          font-size: 0.88rem;
          margin-bottom: 16px;
          text-align: center;
        }

        .ym-download-actions {
          display: grid;
          gap: 10px;
        }

        .ym-share-primary-btn {
          width: 100%;
          padding: 14px;
          border-radius: 16px;
          border: 1px solid transparent;
          background: linear-gradient(135deg, #8b5cf6, #6366f1);
          color: #fff;
          font-weight: 900;
          font-size: 1rem;
          cursor: pointer;
          font-family: inherit;
          box-shadow: 0 8px 20px rgba(99, 102, 241, 0.3);
          transition: all 0.2s ease;
        }

        .ym-share-primary-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 10px 24px rgba(99, 102, 241, 0.4);
        }

        .ym-share-primary-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .ym-share-primary-btn.is-disabled {
          opacity: 0.4;
        }
      `}</style>
    </section>
  );
}

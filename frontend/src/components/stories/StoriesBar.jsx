import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getStoriesGrouped, viewStory } from '../../api/stories.js';
import StoryViewerEnhanced from './StoryViewerEnhanced.jsx';
import StoryEditor from './StoryEditor.jsx';

/**
 * v59.13 — جسر إجباري لإدراج قصّة صاحب الحساب فور رفعها (دون انتظار الباك إند).
 * نحوّل جسم الإرجاع إلى شكل group ليتوافق مع باقي الواجهة.
 */
// ✅ v59.13.7 FIX #2: تسرّب blob URLs — جانب خفي:
// الدالة كانت تستدعي URL.createObjectURL(file) داخليّاً دون إعادة عنوان الـURL
// للمستدعي، وبالتالي لا توجد فرصة لتحريره لاحقاً. عند رفع عدّة قصص متتالية
// تستهلك الذاكرة بشكل جلي (على الأجهزة المحمولة بشكل خاص).
// الحلّ: إرجاع createdLocalUrl إلى المستدعي ليحرره عند إعادة التحميل من الباك إند.
function buildOptimisticSelfGroup(uploadedStory, file, caption, currentUser, prevSelfGroup) {
  // إن رجعت الـAPI بعنصر جاهز استخدمه مباشرة، وإلا ابنِ واحدًا مؤقتًا.
  let createdLocalUrl = '';
  const buildLocalUrl = () => {
    if (!file) return '';
    try {
      const u = URL.createObjectURL(file);
      createdLocalUrl = u;
      return u;
    } catch {
      return '';
    }
  };
  const storyObj = uploadedStory && uploadedStory.id
    ? {
        id: uploadedStory.id,
        media_url: uploadedStory.media_url || buildLocalUrl(),
        media_type: uploadedStory.media_type || (file?.type?.startsWith('video') ? 'video' : 'image'),
        caption: uploadedStory.caption ?? caption ?? '',
        created_at: uploadedStory.created_at || new Date().toISOString(),
        views_count: uploadedStory.views_count ?? 0,
        reactions_count: uploadedStory.reactions_count ?? 0,
        replies_count: uploadedStory.replies_count ?? 0,
        _localBlobUrl: createdLocalUrl || undefined,
      }
    : {
        id: `local-${Date.now()}`,
        media_url: buildLocalUrl(),
        media_type: file?.type?.startsWith('video') ? 'video' : 'image',
        caption: caption || '',
        created_at: new Date().toISOString(),
        views_count: 0,
        reactions_count: 0,
        replies_count: 0,
        _optimistic: true,
        _localBlobUrl: createdLocalUrl || undefined,
      };

  return {
    group: {
      user_id: currentUser?.id || prevSelfGroup?.user_id || 'me',
      username: currentUser?.username || prevSelfGroup?.username || 'أنا',
      is_self: true,
      has_unseen: false,
      last_created_at: storyObj.created_at,
      stories: [storyObj, ...(prevSelfGroup?.stories || [])],
    },
    createdLocalUrl, // '' إذا لم يُنشَأ ولا واحد
  };
}

/**
 * StoriesBar — شريط الستوريات الدائري الذي يظهر تحت هيدر الشات.
 * -----------------------------------------------------------------
 * • RTL كامل + خط Noto Sans Arabic.
 * • متجاوب: على الجوال ٦٤×٦٤، على اللابتوب ٧٢×٧٢، مع تمرير أفقي بسلاسة.
 * • يعرض فقط ستوريات الأصدقاء (الفلترة تتم في الـ Backend).
 * • زر "قصتك" في البداية لإضافة قصة جديدة بسرعة.
 * • مؤشرات بصرية: حلقة متدرجة للقصص غير المشاهدة، رمادية للمشاهدة.
 * • نقاط متعددة حول الصورة عند وجود أكثر من قصة لنفس المستخدم.
 */
export default function StoriesBar({ currentUser, onOpenComposer }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [activeGroupIndex, setActiveGroupIndex] = useState(0);
  // v59.10: ملف مختار لفتح المحرر (بدل رفع مباشر دون أدوات)
  const [pendingFile, setPendingFile] = useState(null);
  const [toast, setToast] = useState('');
  const fileInputRef = useRef(null);
  const scrollRef = useRef(null);

  // ✅ v59.13.5 FIX #2: مؤقت موحَّد للتوست — نُلغي السابق قبل وضع جديد + ننظف عند unmount
  const toastTimerRef = useRef(null);

  // ✅ v59.13.7 FIX #2 (أ): isMountedRef لمنع setState بعد unmount عند تحميل المجموعات.
  const isMountedRef = useRef(true);

  // ✅ v59.13.7 FIX #2 (ب): تتبّع كل blob URLs المُنشَأة من القصص التفاؤلية لتحريرها لاحقاً.
  // عند رفع عدّة قصص متتالية كل واحدة كانت تنشئ blob URL مستقلاً لا يُحرَّر أبداً
  // (تسرّب ذاكرة ملحوظ على الأجهزة المحمولة عند رفع 3+ قصص).
  const optimisticBlobUrlsRef = useRef(new Set());
  const trackOptimisticBlobUrl = useCallback((url) => {
    if (url && typeof url === 'string') optimisticBlobUrlsRef.current.add(url);
  }, []);
  const revokeOptimisticBlobUrls = useCallback(() => {
    optimisticBlobUrlsRef.current.forEach((u) => {
      try { URL.revokeObjectURL(u); } catch { /* ignore */ }
    });
    optimisticBlobUrlsRef.current.clear();
  }, []);

  const showToast = useCallback((message, duration = 2500) => {
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    if (!isMountedRef.current) return;
    setToast(message);
    toastTimerRef.current = window.setTimeout(() => {
      if (!isMountedRef.current) return;
      setToast('');
      toastTimerRef.current = null;
    }, duration);
  }, []);

  // cleanup عند unmount
  useEffect(() => () => {
    isMountedRef.current = false;
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    // ✅ v59.13.7 FIX #2 (ب): حرّر كل blob URLs المتراكمة من الـ optimistic stories
    revokeOptimisticBlobUrls();
  }, [revokeOptimisticBlobUrls]);

  // v59.7: circuit breaker — إيقاف الـ polling عند تكرار الفشل لتفادي ضجيج الكونسول
  const disabledRef = useRef(false);
  const failCountRef = useRef(0);

  const loadGroups = useCallback(async () => {
    if (disabledRef.current) return;
    try {
      const res = await getStoriesGrouped();
      // ✅ v59.13.7 FIX #2 (أ): تجنّب setState إذا أُزيل المكوّن أثناء fetch
      if (!isMountedRef.current) return;
      // عند 404 صامت يرجع status=404 و data=[] من الـ interceptor
      if (res?.status === 404) {
        failCountRef.current += 1;
        if (failCountRef.current >= 2) {
          disabledRef.current = true;
        }
        setGroups([]);
      } else {
        failCountRef.current = 0;
        // ✅ v59.13.7: عند وصول البيانات الحقيقية من الباك إند، حرّر أي blob URLs تفاؤلية
        // لأنها لم تعد مطلوبة (الـ media_url الحقيقي حلّ محلها).
        const freshGroups = Array.isArray(res?.data) ? res.data : [];
        revokeOptimisticBlobUrls();
        setGroups(freshGroups);
      }
    } catch (err) {
      // لا تسجل في الكونسول إذا وُسم الخطأ بأنه صامت
      if (!err?.isSilent && !err?.silent) {
        console.warn('[StoriesBar] failed to load grouped stories', err);
      }
      if (!isMountedRef.current) return;
      failCountRef.current += 1;
      if (failCountRef.current >= 3) {
        disabledRef.current = true;
      }
      setGroups([]);
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [revokeOptimisticBlobUrls]);

  // ✅ v59.13.12 FIX #5: إيقاف polling عندما يكون التبويب مخفياً (لتوفير البطارية والداتا)
  useEffect(() => {
    loadGroups();
    let intervalId = null;
    const startPolling = () => {
      if (intervalId) return;
      intervalId = setInterval(() => {
        if (disabledRef.current) { stopPolling(); return; }
        if (typeof document !== 'undefined' && document.hidden) return;
        loadGroups();
      }, 60_000);
    };
    const stopPolling = () => {
      if (intervalId) { clearInterval(intervalId); intervalId = null; }
    };
    const onVisibility = () => {
      if (document.hidden) {
        // في الخلفية: اترك الـ interval بدون تحميل (الفحص فوق يصدّ ال fetch)
      } else {
        // عند العودة: حمّل فوراً
        if (!disabledRef.current) loadGroups();
      }
    };
    startPolling();
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisibility);
    }
    return () => {
      stopPolling();
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisibility);
      }
    };
  }, [loadGroups]);

  const myGroup = useMemo(
    () => groups.find(g => g.is_self) || null,
    [groups],
  );
  const otherGroups = useMemo(
    () => groups.filter(g => !g.is_self),
    [groups],
  );

  /**
   * v59.10: عند اختيار ملف نفتح المحرّر الكامل (StoryEditor)
   * بدلاً من الرفع المباشر — حتى يستطيع المستخدم إضافة فلاتر/ستيكرز/كابشن/خصوصية.
   *
   * ✅ v59.13.14 FIX #5: تحقّق صارم من نوع الملف (MIME type) وحدّ أدنى للحجم.
   * سابقًا كان الفحص فقط على الحجم الأعلى → يدخل أي ملف (حتى PDF بامتداد مزوّر)
   * إلى StoryEditor ويفشل لاحقًا عند الرفع برسالة فنية غامضة.
   */
  const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif'];
  const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-m4v', 'video/3gpp', 'video/mpeg'];
  const MAX_FILE_SIZE = 600 * 1024 * 1024; // 600 MB
  const MIN_FILE_SIZE = 1024;               // 1 KB — تجنّب ملفات فارغة / placeholders

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const type = (file.type || '').toLowerCase();
    const isImage = type.startsWith('image/') && ACCEPTED_IMAGE_TYPES.includes(type);
    const isVideo = type.startsWith('video/') && ACCEPTED_VIDEO_TYPES.includes(type);

    // رفض الملفات غير المدعومة (حتى لو تمّ تزوير الامتداد)
    if (!isImage && !isVideo) {
      showToast('صيغة الملف غير مدعومة. اختر صورة أو فيديو.', 3500);
      return;
    }

    // رفض الملفات الفارغة/التالفة (أصغر من 1KB)
    if (file.size < MIN_FILE_SIZE) {
      showToast('الملف فارغ أو تالف', 3000);
      return;
    }

    // فحص الحد الأعلى للحجم على الواجهة قبل الرفع
    if (file.size > MAX_FILE_SIZE) {
      showToast('الملف كبير جداً (الحد الأقصى 600MB)', 3500);
      return;
    }

    setPendingFile(file);
  };

  const handleEditorClose = () => setPendingFile(null);
  const handleEditorSuccess = async (uploadedStory, ctx = {}) => {
    // v59.13: إضافة تفاؤلية للقصّة حتى تظهر فورًا تحت هيدر الشات.
    setPendingFile(null);
    showToast('تم نشر القصة ✓', 2500);

    try {
      setGroups((prev) => {
        const prevSelf = prev.find((g) => g.is_self) || null;
        // ✅ v59.13.7 FIX #2: استخراج blob URL المُنشأ وتتبّعه لتحريره لاحقاً
        const { group: optimisticSelf, createdLocalUrl } = buildOptimisticSelfGroup(
          uploadedStory, ctx.file, ctx.caption, currentUser, prevSelf,
        );
        if (createdLocalUrl) trackOptimisticBlobUrl(createdLocalUrl);
        const others = prev.filter((g) => !g.is_self);
        return [optimisticSelf, ...others];
      });
    } catch (e) {
      // تجاهل أخطاء الدفع التفاؤلي، سنعتمد على إعادة التحميل أدناه
    }

    // إعادة ضبط الـcircuit breaker حتى لو سبق إيقاف التحديث الدوري، حاول مرة أخرى
    disabledRef.current = false;
    failCountRef.current = 0;
    await loadGroups();
  };

  const openViewer = async (group) => {
    const idx = groups.findIndex(g => g.user_id === group.user_id);
    setActiveGroupIndex(Math.max(0, idx));
    setViewerOpen(true);
    // علّم أول قصة كـ "مشاهدة"
    const first = group.stories?.[0];
    if (first?.id) {
      try { await viewStory(first.id); } catch (_) { /* ignore */ }
    }
  };

  const handleAddClick = () => {
    // v59.13: افتح المحرر مباشرة بدل الانتقال لصفحة أخرى — تجربة أسرع
    // (onOpenComposer لم يعد يستدعى تلقائيًا: يمكن للأب تمريره إن أراد فعلاً التنقل للصفحة)
    fileInputRef.current?.click();
  };

  if (!loading && groups.length === 0) {
    // اعرض زر "أضف قصتك" فقط حتى لو ما عند الأصدقاء قصص
    return (
      <div dir="rtl" className="yam-stories-bar" data-empty="true">
        <button
          type="button"
          className="yam-story-add"
          onClick={handleAddClick}
          aria-label="إضافة قصة جديدة"
        >
          <div className="yam-story-avatar">
            <img
              src={currentUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.username || 'me')}&background=8b5cf6&color=fff`}
              alt=""
              loading="lazy"
            />
            <span className="yam-story-plus" aria-hidden>+</span>
          </div>
          <span className="yam-story-name">قصتك</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          hidden
          onChange={handleFileSelect}
        />
        {pendingFile && (
          <StoryEditor file={pendingFile} onClose={handleEditorClose} onSuccess={handleEditorSuccess} />
        )}
        {toast && <div className="yam-stories-toast">{toast}</div>}
        <style>{barStyles}</style>
      </div>
    );
  }

  return (
    <div dir="rtl" className="yam-stories-bar" role="region" aria-label="ستوريات الأصدقاء">
      <div ref={scrollRef} className="yam-stories-scroll">
        {/* بطاقة "قصتك" دائمًا في البداية */}
        <button
          type="button"
          className="yam-story-add"
          onClick={myGroup ? () => openViewer(myGroup) : handleAddClick}
          aria-label={myGroup ? 'عرض قصصي' : 'إضافة قصة جديدة'}
        >
          <div className={`yam-story-avatar ${myGroup ? 'has-stories' : ''}`}>
            <img
              src={currentUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.username || 'me')}&background=8b5cf6&color=fff`}
              alt=""
              loading="lazy"
            />
            {!myGroup && <span className="yam-story-plus" aria-hidden>+</span>}
          </div>
          <span className="yam-story-name">قصتك</span>
        </button>

        {/* زر إضافة منفصل إذا فيه قصص قائمة */}
        {myGroup && (
          <button
            type="button"
            className="yam-story-add-mini"
            onClick={handleAddClick}
            aria-label="إضافة قصة جديدة"
          >
            <div className="yam-story-avatar dashed">
              <span className="yam-story-plus" aria-hidden>+</span>
            </div>
            <span className="yam-story-name">إضافة</span>
          </button>
        )}

        {/* قصص الأصدقاء */}
        {/* ✅ v85.4 FIX #1: استخدام group.user_avatar / avatar_url الحقيقية من الباك اند
            سابقاً: كان يستخدم دائماً ui-avatars.com كبديل → أفاتار المستخدمين
            الحقيقية لا تظهر في الشريط الدائري أبداً!
            مع fallback إلى ui-avatars فقط إذا لم يوجد أفاتار محفوظ. */}
        {otherGroups.map((group, idx) => {
          const realAvatar = group.user_avatar || group.avatar_url || '';
          const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(group.username || 'user')}&background=random&color=fff`;
          return (
            <motion.button
              key={`g-${group.user_id}`}
              type="button"
              whileTap={{ scale: 0.92 }}
              className="yam-story-item"
              onClick={() => openViewer(group)}
              aria-label={`فتح قصص ${group.username}`}
            >
              <div className={`yam-story-avatar ${group.has_unseen ? 'unseen' : 'seen'}`}>
                <img
                  src={realAvatar || fallbackAvatar}
                  alt=""
                  loading="lazy"
                  onError={(e) => {
                    // إذا فشل تحميل الأفاتار الحقيقي، اجعله fallback
                    if (e.currentTarget.src !== fallbackAvatar) {
                      e.currentTarget.src = fallbackAvatar;
                    }
                  }}
                />
                {group.stories?.length > 1 && (
                  <span className="yam-story-count" aria-hidden>{group.stories.length}</span>
                )}
              </div>
              <span className="yam-story-name" title={group.username}>{group.username}</span>
            </motion.button>
          );
        })}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        hidden
        onChange={handleFileSelect}
      />
      {pendingFile && (
        <StoryEditor file={pendingFile} onClose={handleEditorClose} onSuccess={handleEditorSuccess} />
      )}
      {toast && <div className="yam-stories-toast">{toast}</div>}

      <AnimatePresence>
        {viewerOpen && groups[activeGroupIndex] && (
          <StoryViewerEnhanced
            group={groups[activeGroupIndex]}
            allGroups={groups}
            currentIndex={activeGroupIndex}
            currentUserId={currentUser?.id}
            onClose={() => { setViewerOpen(false); loadGroups(); }}
            onNextGroup={() => {
              if (activeGroupIndex < groups.length - 1) {
                setActiveGroupIndex(i => i + 1);
              } else {
                setViewerOpen(false);
                loadGroups();
              }
            }}
            onPrevGroup={() => {
              if (activeGroupIndex > 0) setActiveGroupIndex(i => i - 1);
            }}
          />
        )}
      </AnimatePresence>

      <style>{barStyles}</style>
    </div>
  );
}

const barStyles = `
.yam-stories-bar {
  font-family: 'Noto Sans Arabic', 'Tajawal', system-ui, -apple-system, sans-serif;
  width: 100%;
  background: var(--surface, #0f0f14);
  border-bottom: 1px solid var(--border, rgba(255,255,255,0.06));
  padding: 10px 0;
  position: relative;
  z-index: 5;
}
.yam-stories-scroll {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 4px 14px;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}
.yam-stories-scroll::-webkit-scrollbar { display: none; }

.yam-story-item, .yam-story-add, .yam-story-add-mini {
  flex-shrink: 0;
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 0;
  width: 72px;
}
.yam-story-item:disabled, .yam-story-add:disabled { opacity: 0.6; cursor: wait; }

.yam-story-avatar {
  position: relative;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  padding: 2.5px;
  background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 50%, #f59e0b 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}
.yam-story-avatar.seen {
  background: linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.06));
}
.yam-story-avatar.unseen {
  background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 50%, #f59e0b 100%);
}
.yam-story-avatar.has-stories {
  background: linear-gradient(135deg, #22d3ee 0%, #8b5cf6 100%);
}
.yam-story-avatar.dashed {
  background: transparent;
  border: 2px dashed rgba(139, 92, 246, 0.7);
}
.yam-story-avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--surface, #0f0f14);
  background: #1a1a22;
}
.yam-story-plus {
  position: absolute;
  bottom: -2px;
  inset-inline-start: -2px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #8b5cf6;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
  line-height: 1;
  box-shadow: 0 0 0 2px var(--surface, #0f0f14);
}
.yam-story-avatar.dashed .yam-story-plus {
  position: static;
  width: 28px;
  height: 28px;
  font-size: 22px;
  box-shadow: none;
}
.yam-story-count {
  position: absolute;
  top: -2px;
  inset-inline-end: -2px;
  min-width: 20px;
  height: 20px;
  border-radius: 10px;
  padding: 0 6px;
  background: #ec4899;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 0 2px var(--surface, #0f0f14);
}
.yam-story-name {
  font-size: 11.5px;
  color: var(--text-secondary, #d4d4d8);
  max-width: 70px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: center;
  font-weight: 500;
}
.yam-story-add .yam-story-name { color: var(--text, #f4f4f5); font-weight: 600; }

/* تجاوب الشاشات */
@media (min-width: 768px) {
  .yam-story-item, .yam-story-add, .yam-story-add-mini { width: 80px; }
  .yam-story-avatar { width: 72px; height: 72px; padding: 3px; }
  .yam-story-name { font-size: 12.5px; max-width: 78px; }
  .yam-stories-scroll { gap: 14px; padding: 6px 18px; }
}
@media (min-width: 1280px) {
  .yam-story-item, .yam-story-add, .yam-story-add-mini { width: 86px; }
  .yam-story-avatar { width: 78px; height: 78px; }
  .yam-stories-scroll { gap: 16px; padding: 6px 22px; }
}
@media (max-width: 380px) {
  .yam-story-item, .yam-story-add, .yam-story-add-mini { width: 64px; }
  .yam-story-avatar { width: 56px; height: 56px; }
  .yam-story-name { font-size: 10.5px; max-width: 62px; }
}

/* Toast (v59.10) */
.yam-stories-toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(15, 15, 20, 0.95);
  color: #fff;
  padding: 12px 22px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  z-index: 2200;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
  border: 1px solid rgba(139, 92, 246, 0.4);
  animation: yamToastIn 0.3s ease-out;
}
@keyframes yamToastIn {
  from { opacity: 0; transform: translate(-50%, 20px); }
  to { opacity: 1; transform: translate(-50%, 0); }
}
`;

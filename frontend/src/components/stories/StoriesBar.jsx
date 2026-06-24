import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getStoriesGrouped, viewStory } from '../../api/stories.js';
import StoryViewerEnhanced from './StoryViewerEnhanced.jsx';
import StoryEditor from './StoryEditor.jsx';

/**
 * v59.13 — جسر إجباري لإدراج قصّة صاحب الحساب فور رفعها (دون انتظار الباك إند).
 * نحوّل جسم الإرجاع إلى شكل group ليتوافق مع باقي الواجهة.
 */
function buildOptimisticSelfGroup(uploadedStory, file, caption, currentUser, prevSelfGroup) {
  // إن رجعت الـAPI بعنصر جاهز استخدمه مباشرة، وإلا ابنِ واحدًا مؤقتًا.
  const storyObj = uploadedStory && uploadedStory.id
    ? {
        id: uploadedStory.id,
        media_url: uploadedStory.media_url || (file ? URL.createObjectURL(file) : ''),
        media_type: uploadedStory.media_type || (file?.type?.startsWith('video') ? 'video' : 'image'),
        caption: uploadedStory.caption ?? caption ?? '',
        created_at: uploadedStory.created_at || new Date().toISOString(),
        views_count: uploadedStory.views_count ?? 0,
        reactions_count: uploadedStory.reactions_count ?? 0,
        replies_count: uploadedStory.replies_count ?? 0,
      }
    : {
        id: `local-${Date.now()}`,
        media_url: file ? URL.createObjectURL(file) : '',
        media_type: file?.type?.startsWith('video') ? 'video' : 'image',
        caption: caption || '',
        created_at: new Date().toISOString(),
        views_count: 0,
        reactions_count: 0,
        replies_count: 0,
        _optimistic: true,
      };

  return {
    user_id: currentUser?.id || prevSelfGroup?.user_id || 'me',
    username: currentUser?.username || prevSelfGroup?.username || 'أنا',
    is_self: true,
    has_unseen: false,
    last_created_at: storyObj.created_at,
    stories: [storyObj, ...(prevSelfGroup?.stories || [])],
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

  // v59.7: circuit breaker — إيقاف الـ polling عند تكرار الفشل لتفادي ضجيج الكونسول
  const disabledRef = useRef(false);
  const failCountRef = useRef(0);

  const loadGroups = useCallback(async () => {
    if (disabledRef.current) return;
    try {
      const res = await getStoriesGrouped();
      // عند 404 صامت يرجع status=404 و data=[] من الـ interceptor
      if (res?.status === 404) {
        failCountRef.current += 1;
        if (failCountRef.current >= 2) {
          disabledRef.current = true;
        }
        setGroups([]);
      } else {
        failCountRef.current = 0;
        setGroups(Array.isArray(res?.data) ? res.data : []);
      }
    } catch (err) {
      // لا تسجل في الكونسول إذا وُسم الخطأ بأنه صامت
      if (!err?.isSilent && !err?.silent) {
        console.warn('[StoriesBar] failed to load grouped stories', err);
      }
      failCountRef.current += 1;
      if (failCountRef.current >= 3) {
        disabledRef.current = true;
      }
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGroups();
    const t = setInterval(() => {
      if (disabledRef.current) {
        clearInterval(t);
        return;
      }
      loadGroups();
    }, 60_000); // تحديث كل دقيقة
    return () => clearInterval(t);
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
   */
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    // فحص حجم بسيط على الواجهة (نسخة سريعة قبل الرفع)
    if (file.size > 600 * 1024 * 1024) {
      setToast('الملف كبير جداً (الحد الأقصى 600MB)');
      setTimeout(() => setToast(''), 3500);
      return;
    }
    setPendingFile(file);
  };

  const handleEditorClose = () => setPendingFile(null);
  const handleEditorSuccess = async (uploadedStory, ctx = {}) => {
    // v59.13: إضافة تفاؤلية للقصّة حتى تظهر فورًا تحت هيدر الشات.
    setPendingFile(null);
    setToast('تم نشر القصة ✓');
    setTimeout(() => setToast(''), 2500);

    try {
      setGroups((prev) => {
        const prevSelf = prev.find((g) => g.is_self) || null;
        const optimisticSelf = buildOptimisticSelfGroup(uploadedStory, ctx.file, ctx.caption, currentUser, prevSelf);
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
        {otherGroups.map((group, idx) => (
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
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(group.username || 'user')}&background=random&color=fff`}
                alt=""
                loading="lazy"
              />
              {group.stories?.length > 1 && (
                <span className="yam-story-count" aria-hidden>{group.stories.length}</span>
              )}
            </div>
            <span className="yam-story-name" title={group.username}>{group.username}</span>
          </motion.button>
        ))}
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

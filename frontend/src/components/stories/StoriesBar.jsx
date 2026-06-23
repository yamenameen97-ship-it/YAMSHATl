import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getStoriesGrouped, uploadStory, viewStory } from '../../api/stories.js';
import StoryViewerEnhanced from './StoryViewerEnhanced.jsx';

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
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const scrollRef = useRef(null);

  const loadGroups = useCallback(async () => {
    try {
      const res = await getStoriesGrouped();
      setGroups(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      console.warn('[StoriesBar] failed to load grouped stories', err);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGroups();
    const t = setInterval(loadGroups, 60_000); // تحديث كل دقيقة
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

  const handleQuickUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      setUploading(true);
      await uploadStory(file, { privacy: 'friends', auto_delete_hours: 24 });
      await loadGroups();
    } catch (err) {
      console.error('[StoriesBar] upload failed', err);
      alert('تعذّر رفع القصة. حاول مجدّدًا.');
    } finally {
      setUploading(false);
    }
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
    if (typeof onOpenComposer === 'function') {
      onOpenComposer();
    } else {
      fileInputRef.current?.click();
    }
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
          disabled={uploading}
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
          onChange={handleQuickUpload}
        />
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
          disabled={uploading}
        >
          <div className={`yam-story-avatar ${myGroup ? 'has-stories' : ''}`}>
            <img
              src={currentUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.username || 'me')}&background=8b5cf6&color=fff`}
              alt=""
              loading="lazy"
            />
            {!myGroup && <span className="yam-story-plus" aria-hidden>+</span>}
          </div>
          <span className="yam-story-name">
            {uploading ? 'جاري الرفع…' : 'قصتك'}
          </span>
        </button>

        {/* زر إضافة منفصل إذا فيه قصص قائمة */}
        {myGroup && (
          <button
            type="button"
            className="yam-story-add-mini"
            onClick={handleAddClick}
            aria-label="إضافة قصة جديدة"
            disabled={uploading}
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
        onChange={handleQuickUpload}
      />

      <AnimatePresence>
        {viewerOpen && groups[activeGroupIndex] && (
          <StoryViewerEnhanced
            group={groups[activeGroupIndex]}
            allGroups={groups}
            currentIndex={activeGroupIndex}
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
`;

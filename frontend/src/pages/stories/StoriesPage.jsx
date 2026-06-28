import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import MainLayout from '../../components/layout/MainLayout.jsx';
import StoryViewerEnhanced from '../../components/stories/StoryViewerEnhanced.jsx';
import StoryEditor from '../../components/stories/StoryEditor.jsx';
import { getStoriesGrouped, getStoryArchive } from '../../api/stories.js';
import { getMe } from '../../api/users.js';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * StoriesPage — صفحة الستوريات الكاملة.
 * -----------------------------------------------------------------
 * • RTL + خط Noto Sans Arabic.
 * • متجاوب: شبكة مرنة على اللابتوب، عمود واحد + شريط دائري على الجوال.
 * • تبويبات: قصص الأصدقاء / الأرشيف / إضافة.
 * • فلترة من Backend: لا تظهر أي قصة عامة — الأصدقاء فقط.
 */
export default function StoriesPage() {
  const [activeTab, setActiveTab] = useState('feed');
  const [groups, setGroups] = useState([]);
  const [archive, setArchive] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [activeGroupIndex, setActiveGroupIndex] = useState(0);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  // ✅ FIX v59.13.6: تتبّع blob URLs المولّدة تفاؤليًّا حتّى نحرّرها عند unmount.
  // السلوك السابق: URL.createObjectURL يُستدعى بلا revokeObjectURL أبدًا
  // → تسرّب blob URLs يتراكم عند رفع عدّة قصص.
  const optimisticBlobUrlsRef = useRef(new Set());

  const loadData = useCallback(async () => {
    setLoading(true);
    const results = await Promise.allSettled([
      getStoriesGrouped(),
      getStoryArchive(),
      getMe(),
    ]);
    const [gRes, aRes, meRes] = results;
    setGroups(gRes.status === 'fulfilled' ? (gRes.value?.data || []) : []);
    setArchive(aRes.status === 'fulfilled' ? (aRes.value?.data || []) : []);
    setMe(meRes.status === 'fulfilled' ? (meRes.value?.data || null) : null);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ✅ FIX v59.13.6: تحرير كل blob URLs التفاؤليّة عند unmount
  useEffect(() => () => {
    optimisticBlobUrlsRef.current.forEach((url) => {
      try { URL.revokeObjectURL(url); } catch (_) { /* ignore */ }
    });
    optimisticBlobUrlsRef.current.clear();
  }, []);

  // Preload للقصص التالية
  useEffect(() => {
    const next = groups[activeGroupIndex + 1];
    if (next?.stories?.length) {
      next.stories.forEach(s => {
        if (s.media_type !== 'video') {
          const img = new Image();
          img.src = s.media_url;
        }
      });
    }
  }, [activeGroupIndex, groups]);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) {
      setSelectedFile(file);
      setActiveTab('create');
    }
  };

  /**
   * v59.13 — إدراج تفاؤلي للقصة المرفوعة حتى تظهر فورًا في الصفحة
   * دون انتظار تحديث الباك إند (getStoriesGrouped).
   */
  const handleUploadSuccess = (uploadedStory, ctx = {}) => {
    setActiveTab('feed');
    setSelectedFile(null);

    try {
      // ✅ FIX v59.13.6: دالة مساعدة لإنشاء blob URL وتسجيله في مجموعة التتبُع
      const makeTrackedBlobUrl = (file) => {
        if (!file) return '';
        const url = URL.createObjectURL(file);
        optimisticBlobUrlsRef.current.add(url);
        return url;
      };
      const storyObj = uploadedStory && uploadedStory.id
        ? {
            id: uploadedStory.id,
            media_url: uploadedStory.media_url || makeTrackedBlobUrl(ctx.file),
            media_type: uploadedStory.media_type || (ctx.file?.type?.startsWith('video') ? 'video' : 'image'),
            caption: uploadedStory.caption ?? ctx.caption ?? '',
            created_at: uploadedStory.created_at || new Date().toISOString(),
            views_count: uploadedStory.views_count ?? 0,
            reactions_count: uploadedStory.reactions_count ?? 0,
            replies_count: uploadedStory.replies_count ?? 0,
          }
        : {
            id: `local-${Date.now()}`,
            media_url: makeTrackedBlobUrl(ctx.file),
            media_type: ctx.file?.type?.startsWith('video') ? 'video' : 'image',
            caption: ctx.caption || '',
            created_at: new Date().toISOString(),
            views_count: 0,
            reactions_count: 0,
            replies_count: 0,
            _optimistic: true,
          };

      setGroups((prev) => {
        const prevSelf = prev.find((g) => g.is_self) || null;
        const optimisticSelf = {
          user_id: me?.id || prevSelf?.user_id || 'me',
          username: me?.username || prevSelf?.username || 'أنا',
          is_self: true,
          has_unseen: false,
          last_created_at: storyObj.created_at,
          stories: [storyObj, ...(prevSelf?.stories || [])],
        };
        const others = prev.filter((g) => !g.is_self);
        return [optimisticSelf, ...others];
      });
    } catch (_) { /* ignore optimistic errors */ }

    // ثم أعد التحميل للتأكّد
    loadData();
  };

  const openViewer = (idx) => {
    setActiveGroupIndex(idx);
    setViewerOpen(true);
  };

  const myStoriesCount = useMemo(
    () => groups.find(g => g.is_self)?.stories?.length || 0,
    [groups],
  );

  return (
    <MainLayout>
      <section
        dir="rtl"
        className="yam-stories-page"
        style={{ fontFamily: "'Noto Sans Arabic', 'Tajawal', system-ui, sans-serif" }}
      >
        {/* تبويبات */}
        <div className="yam-stories-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'feed'}
            onClick={() => setActiveTab('feed')}
            className={`yam-stab ${activeTab === 'feed' ? 'active' : ''}`}
          >قصص الأصدقاء</button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'archive'}
            onClick={() => setActiveTab('archive')}
            className={`yam-stab ${activeTab === 'archive' ? 'active' : ''}`}
          >🗄️ الأرشيف {myStoriesCount ? `(${myStoriesCount})` : ''}</button>
          <label className="yam-stab yam-stab-add">
            <input type="file" hidden onChange={handleFileSelect} accept="image/*,video/*" />
            <span>➕ قصة جديدة</span>
          </label>
        </div>

        {/* قصص الأصدقاء — ✅ v59.13.36: تخطيط حر بدائر بدلًا من شبكة محشورة */}
        {activeTab === 'feed' && (
          <div className="yam-stories-freeflow">
            {loading && <SkeletonFreeFlow />}
            {!loading && groups.length === 0 && (
              <div className="yam-empty">
                <div className="yam-empty-icon">📭</div>
                <h3>لا توجد قصص حاليًا</h3>
                <p>عندما يضيف أحد أصدقائك قصة، ستظهر هنا.</p>
              </div>
            )}
            {groups.map((group, idx) => (
              <motion.button
                key={group.user_id}
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => openViewer(idx)}
                className={`yam-story-bubble ${group.has_unseen ? 'unseen' : ''}`}
                aria-label={`فتح قصة ${group.is_self ? 'قصتي' : group.username}`}
              >
                <div className="yam-story-bubble-ring">
                  <div className="yam-story-bubble-media">
                    {group.stories?.[0]?.media_type === 'video' ? (
                      <video src={group.stories[0].media_url} muted playsInline />
                    ) : (
                      <img src={group.stories?.[0]?.media_url} alt="" loading="lazy" />
                    )}
                    {group.stories?.length > 1 && (
                      <span className="yam-story-bubble-count">{group.stories.length}</span>
                    )}
                  </div>
                </div>
                <div className="yam-story-bubble-name">
                  <strong>{group.is_self ? 'قصتي' : group.username}</strong>
                  <span>{formatTimeAgo(group.last_created_at)}</span>
                </div>
              </motion.button>
            ))}
          </div>
        )}

        {/* الأرشيف */}
        {activeTab === 'archive' && (
          <div className="yam-archive-grid">
            {archive.length === 0 ? (
              <div className="yam-empty">
                <div className="yam-empty-icon">🗄️</div>
                <h3>لا توجد قصص في الأرشيف</h3>
                <p>قصصك المنتهية تُحفظ تلقائيًا هنا.</p>
              </div>
            ) : (
              archive.map(story => (
                <div key={story.id} className="yam-archive-item">
                  {story.media_type === 'video' ? (
                    <video src={story.media_url} muted playsInline />
                  ) : (
                    <img src={story.media_url} alt="" loading="lazy" />
                  )}
                  <div className="yam-archive-stats">
                    <span>👁 {story.views_count || 0}</span>
                    {story.highlight && <span>⭐</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* المحرر */}
        {activeTab === 'create' && selectedFile && (
          <StoryEditor
            file={selectedFile}
            onClose={() => { setActiveTab('feed'); setSelectedFile(null); }}
            onSuccess={handleUploadSuccess}
          />
        )}

        <AnimatePresence>
          {viewerOpen && groups[activeGroupIndex] && (
            <StoryViewerEnhanced
              group={groups[activeGroupIndex]}
              allGroups={groups}
              currentIndex={activeGroupIndex}
              currentUserId={me?.id}
              onClose={() => { setViewerOpen(false); loadData(); }}
              onNextGroup={() => {
                if (activeGroupIndex < groups.length - 1) {
                  setActiveGroupIndex(i => i + 1);
                } else {
                  setViewerOpen(false);
                  loadData();
                }
              }}
              onPrevGroup={() => {
                if (activeGroupIndex > 0) setActiveGroupIndex(i => i - 1);
              }}
            />
          )}
        </AnimatePresence>

        <style>{pageStyles}</style>
      </section>
    </MainLayout>
  );
}

function SkeletonGrid() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="yam-story-card yam-skel" />
      ))}
    </>
  );
}

// ✅ v59.13.36: skeleton دائري للتخطيط الجديد
function SkeletonFreeFlow() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="yam-story-bubble yam-skel-bubble">
          <div className="yam-story-bubble-ring">
            <div className="yam-story-bubble-media yam-skel" />
          </div>
          <div className="yam-story-bubble-name">
            <strong className="yam-skel-text" />
          </div>
        </div>
      ))}
    </>
  );
}

function formatTimeAgo(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    const diffMin = Math.floor((Date.now() - d.getTime()) / 60000);
    if (diffMin < 1) return 'الآن';
    if (diffMin < 60) return `قبل ${diffMin} د`;
    const hrs = Math.floor(diffMin / 60);
    if (hrs < 24) return `قبل ${hrs} س`;
    return d.toLocaleDateString('ar');
  } catch (_) { return ''; }
}

const pageStyles = `
/* ⭐ v59.13.31 — .yam-stories-page هي scroll container بصمة .yam-groups-page تماماً
   height ثابت + overflow-y:auto + momentum scroll + touch-action:pan-y
   هذا يحلّ مشكلة عدم استجابة السحب من منتصف الشاشة على ويب الجوال. */
.yam-stories-page {
  /* ✅ height ثابت — أبعاد معروفة مسبقاً تُفعّل momentum scroll على iOS Safari */
  height: 100vh;
  height: 100dvh;
  max-height: 100dvh;
  overflow-y: auto;
  overflow-x: hidden;
  max-width: 1180px;
  margin: 0 auto;
  /* ✅ padding يحسب الهيدر العلوي (76px) + BottomNav السفلي (120px) */
  padding:
    calc(76px + env(safe-area-inset-top, 0px))
    14px
    calc(120px + env(safe-area-inset-bottom, 0px));
  /* ✅ momentum scroll حقيقي (iOS) */
  -webkit-overflow-scrolling: touch;
  /* ✅ اللمس: pan-y نقي */
  touch-action: pan-y;
  -ms-touch-action: pan-y;
  /* ✅ لا انعكاس bounce يبتلع التمرير */
  overscroll-behavior-y: contain;
  overscroll-behavior-x: none;
  /* ✅ لا transform/filter يكسر momentum */
  transform: none;
  -webkit-transform: none;
  filter: none;
  -webkit-filter: none;
  perspective: none;
  pointer-events: auto;
  overflow-anchor: none;
  will-change: scroll-position;
  scrollbar-width: none;
  box-sizing: border-box;
}
.yam-stories-page::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}
/* ✅ متوافق مع الديسكتوب — على الشاشات الكبيرة لا نفرض 100dvh لأن التمرير يحدث على مستوى الصفحة */
@media (min-width: 981px) {
  .yam-stories-page {
    height: auto;
    max-height: none;
    overflow-y: visible;
    padding: 16px 14px 32px;
  }
}
.yam-stories-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.yam-stab {
  background: rgba(255,255,255,0.05);
  color: var(--text, #f4f4f5);
  border: 1px solid rgba(255,255,255,0.1);
  padding: 9px 16px;
  border-radius: 22px;
  cursor: pointer;
  font-size: 13.5px;
  font-weight: 600;
  font-family: inherit;
  transition: all 0.2s;
}
.yam-stab:hover { background: rgba(255,255,255,0.1); }
.yam-stab.active {
  background: linear-gradient(135deg, #8b5cf6, #ec4899);
  border-color: transparent;
  color: #fff;
}
.yam-stab-add {
  margin-inline-start: auto;
  background: linear-gradient(135deg, #8b5cf6, #ec4899);
  color: #fff;
  border: none;
}

.yam-stories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
}
@media (min-width: 768px) {
  .yam-stories-grid { grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 14px; }
}
@media (min-width: 1280px) {
  .yam-stories-grid { grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; }
}

/* ✨ v59.13.36 — تخطيط حر (Free-Flow) لفقاعات الستوري
   توزيع دائري على عرض الصفحة بدون حاوية مربعة تحصر العناصر */
.yam-stories-freeflow {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: flex-start;
  gap: 22px 28px;
  padding: 8px 4px 24px;
  background: transparent;
  border: 0;
}
@media (min-width: 768px) {
  .yam-stories-freeflow { gap: 30px 38px; padding: 12px 8px 28px; }
}
@media (min-width: 1280px) {
  .yam-stories-freeflow { gap: 36px 46px; padding: 16px 10px 32px; }
}

/* 🔵 الفقاعة الواحدة — دائرية بدون خلفية حاوية */
.yam-story-bubble {
  background: transparent;
  border: 0;
  padding: 0;
  margin: 0;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  font-family: inherit;
  color: var(--text, #f4f4f5);
  width: 92px;
  -webkit-tap-highlight-color: transparent;
}
@media (min-width: 768px) {
  .yam-story-bubble { width: 104px; gap: 10px; }
}
@media (min-width: 1280px) {
  .yam-story-bubble { width: 116px; gap: 12px; }
}

/* 🟣 حلقة متدرجة حول الفقاعة (بنفسجي/وردي للقصص غير المشاهدة) */
.yam-story-bubble-ring {
  width: 86px;
  height: 86px;
  border-radius: 50%;
  padding: 3px;
  background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 50%, #f59e0b 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 18px rgba(139, 92, 246, 0.22);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.yam-story-bubble:not(.unseen) .yam-story-bubble-ring {
  background: linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.08));
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
}
.yam-story-bubble:hover .yam-story-bubble-ring {
  box-shadow: 0 10px 24px rgba(236, 72, 153, 0.35);
}
@media (min-width: 768px) {
  .yam-story-bubble-ring { width: 96px; height: 96px; padding: 3px; }
}
@media (min-width: 1280px) {
  .yam-story-bubble-ring { width: 108px; height: 108px; padding: 4px; }
}

/* 🖼️ الوسائط داخل الفقاعة — صورة/فيديو دائريًا بالكامل */
.yam-story-bubble-media {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  overflow: hidden;
  background: #1a1a1d;
  border: 2px solid var(--bg, #0f0f12);
}
.yam-story-bubble-media img,
.yam-story-bubble-media video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* 🔢 مؤشر عدد القصص الإضافية */
.yam-story-bubble-count {
  position: absolute;
  bottom: 4px;
  inset-inline-end: 4px;
  background: rgba(0, 0, 0, 0.75);
  color: #fff;
  font-size: 10.5px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 10px;
  line-height: 1.4;
}

/* 🏷️ اسم المستخدم تحت الفقاعة */
.yam-story-bubble-name {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  max-width: 100%;
  text-align: center;
}
.yam-story-bubble-name strong {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text, #f4f4f5);
  max-width: 92px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.yam-story-bubble-name span {
  font-size: 10.5px;
  opacity: 0.6;
  color: var(--text-secondary, #a1a1aa);
}
@media (min-width: 768px) {
  .yam-story-bubble-name strong { font-size: 13px; max-width: 104px; }
  .yam-story-bubble-name span { font-size: 11px; }
}

/* 💤 skeleton دائري */
.yam-skel-bubble .yam-skel {
  border-radius: 50%;
  width: 100%;
  aspect-ratio: 1 / 1;
}
.yam-skel-text {
  display: block;
  width: 60px;
  height: 11px;
  border-radius: 6px;
  background: linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.04) 100%);
  background-size: 200% 100%;
  animation: yam-shimmer 1.5s infinite;
}

.yam-story-card {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  padding: 0;
  text-align: start;
  font-family: inherit;
}
.yam-story-card.unseen { border-color: rgba(139,92,246,0.6); }
.yam-story-card-preview {
  position: relative;
  aspect-ratio: 9 / 16;
  background: #111;
  overflow: hidden;
}
.yam-story-card-preview img,
.yam-story-card-preview video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.yam-story-card-count {
  position: absolute;
  top: 8px;
  inset-inline-end: 8px;
  background: rgba(0,0,0,0.7);
  color: #fff;
  font-size: 11.5px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 10px;
}
.yam-story-card-meta {
  display: flex;
  flex-direction: column;
  padding: 8px 12px;
  gap: 2px;
  color: var(--text, #f4f4f5);
}
.yam-story-card-meta strong { font-size: 13.5px; font-weight: 700; }
.yam-story-card-meta span { font-size: 11.5px; opacity: 0.65; }

.yam-archive-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}
@media (min-width: 768px) {
  .yam-archive-grid { grid-template-columns: repeat(5, 1fr); gap: 8px; }
}
@media (min-width: 1280px) {
  .yam-archive-grid { grid-template-columns: repeat(6, 1fr); gap: 10px; }
}
.yam-archive-item {
  position: relative;
  aspect-ratio: 9 / 16;
  background: #111;
  border-radius: 10px;
  overflow: hidden;
}
.yam-archive-item img, .yam-archive-item video {
  width: 100%; height: 100%; object-fit: cover; opacity: 0.85;
}
.yam-archive-stats {
  position: absolute;
  bottom: 6px;
  inset-inline-start: 6px;
  inset-inline-end: 6px;
  display: flex;
  justify-content: space-between;
  color: #fff;
  font-size: 11px;
  text-shadow: 0 1px 4px rgba(0,0,0,0.7);
}

.yam-empty {
  grid-column: 1 / -1;
  text-align: center;
  padding: 60px 20px;
  color: var(--text-secondary, #a1a1aa);
}
.yam-empty-icon { font-size: 56px; margin-bottom: 14px; }
.yam-empty h3 { font-size: 18px; margin: 0 0 6px; color: var(--text, #f4f4f5); }
.yam-empty p { font-size: 13.5px; margin: 0; }

.yam-skel {
  aspect-ratio: 9 / 16;
  background: linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 100%);
  background-size: 200% 100%;
  animation: yam-shimmer 1.5s infinite;
}
@keyframes yam-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
`;

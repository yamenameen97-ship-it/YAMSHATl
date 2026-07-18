import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import MainLayout from '../../components/layout/MainLayout.jsx';
import StoryViewerEnhanced from '../../components/stories/StoryViewerEnhanced.jsx';
import StoryEditor from '../../components/stories/StoryEditor.jsx';
import {
  getStoriesGrouped,
  getStoryArchive,
  getStoryAnalyticsSummary,
  getStoryHighlights,
} from '../../api/stories.js';
import { getMe } from '../../api/users.js';
import { motion, AnimatePresence } from 'framer-motion';

export default function StoriesPage() {
  const [activeTab, setActiveTab] = useState('feed');
  const [groups, setGroups] = useState([]);
  const [archive, setArchive] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [highlights, setHighlights] = useState([]);
  const [selectedFile, setSelectedFile] = useState(undefined);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [activeGroupIndex, setActiveGroupIndex] = useState(0);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const optimisticBlobUrlsRef = useRef(new Set());

  const loadData = useCallback(async () => {
    setLoading(true);
    const results = await Promise.allSettled([
      getStoriesGrouped(),
      getStoryArchive(),
      getStoryAnalyticsSummary(),
      getStoryHighlights(),
      getMe(),
    ]);
    const [gRes, aRes, analyticsRes, highlightsRes, meRes] = results;
    setGroups(gRes.status === 'fulfilled' ? (gRes.value?.data || []) : []);
    setArchive(aRes.status === 'fulfilled' ? (aRes.value?.data || []) : []);
    setAnalytics(analyticsRes.status === 'fulfilled' ? (analyticsRes.value?.data || null) : null);
    setHighlights(highlightsRes.status === 'fulfilled' ? (highlightsRes.value?.data || []) : []);
    setMe(meRes.status === 'fulfilled' ? (meRes.value?.data || null) : null);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => () => {
    optimisticBlobUrlsRef.current.forEach((url) => {
      try { URL.revokeObjectURL(url); } catch (_) {}
    });
    optimisticBlobUrlsRef.current.clear();
  }, []);

  useEffect(() => {
    const next = groups[activeGroupIndex + 1];
    if (next?.stories?.length) {
      next.stories.forEach((s) => {
        if (s.media_type !== 'video' && s.media_url) {
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

  const handleCreateTextOnly = () => {
    setSelectedFile(null);
    setActiveTab('create');
  };

  const handleUploadSuccess = (uploadedStory, ctx = {}) => {
    setActiveTab('feed');
    setSelectedFile(undefined);

    try {
      const makeTrackedBlobUrl = (file) => {
        if (!file) return '';
        const url = URL.createObjectURL(file);
        optimisticBlobUrlsRef.current.add(url);
        return url;
      };

      const fallbackFile = ctx.generatedFile || ctx.file || null;
      const storyObj = uploadedStory && uploadedStory.id
        ? {
            ...uploadedStory,
            media_url: uploadedStory.media_url || makeTrackedBlobUrl(fallbackFile),
            media_type: uploadedStory.media_type || (fallbackFile?.type?.startsWith('video') ? 'video' : 'image'),
            caption: uploadedStory.caption ?? ctx.caption ?? '',
            created_at: uploadedStory.created_at || new Date().toISOString(),
            views_count: uploadedStory.views_count ?? 0,
            reactions_count: uploadedStory.reactions_count ?? 0,
            replies_count: uploadedStory.replies_count ?? 0,
          }
        : {
            id: `local-${Date.now()}`,
            media_url: makeTrackedBlobUrl(fallbackFile),
            media_type: fallbackFile?.type?.startsWith('video') ? 'video' : 'image',
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
          user_avatar: me?.avatar_url || prevSelf?.user_avatar || prevSelf?.avatar_url || '',
          avatar_url: me?.avatar_url || prevSelf?.avatar_url || prevSelf?.user_avatar || '',
          is_self: true,
          has_unseen: false,
          last_created_at: storyObj.created_at,
          stories: [storyObj, ...(prevSelf?.stories || [])],
        };
        const others = prev.filter((g) => !g.is_self);
        return [optimisticSelf, ...others];
      });
    } catch (_) {}

    loadData();
  };

  const openViewer = (idx) => {
    setActiveGroupIndex(idx);
    setViewerOpen(true);
  };

  const myStoriesCount = useMemo(() => groups.find((g) => g.is_self)?.stories?.length || 0, [groups]);
  const topStory = analytics?.top_story || null;

  return (
    <MainLayout>
      <section dir="rtl" className="yam-stories-page" data-yam-stories-root="true" style={{ fontFamily: "'Noto Sans Arabic', 'Tajawal', system-ui, sans-serif" }}>
        <div className="yam-stories-tabs" role="tablist">
          <button type="button" role="tab" aria-selected={activeTab === 'feed'} onClick={() => setActiveTab('feed')} className={`yam-stab ${activeTab === 'feed' ? 'active' : ''}`}>قصص الأصدقاء</button>
          <button type="button" role="tab" aria-selected={activeTab === 'archive'} onClick={() => setActiveTab('archive')} className={`yam-stab ${activeTab === 'archive' ? 'active' : ''}`}>🗄️ الأرشيف {myStoriesCount ? `(${myStoriesCount})` : ''}</button>
          <button type="button" role="tab" aria-selected={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} className={`yam-stab ${activeTab === 'analytics' ? 'active' : ''}`}>📈 الإحصائيات</button>
          <label className="yam-stab yam-stab-add">
            <input type="file" hidden onChange={handleFileSelect} accept="image/*,video/*" />
            <span>➕ قصة وسائط</span>
          </label>
          <button type="button" className="yam-stab yam-stab-add alt" onClick={handleCreateTextOnly}>📝 قصة نصية</button>
        </div>

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
                whileTap={{ scale: 0.96 }}
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
                    {group.stories?.length > 1 && <span className="yam-story-bubble-count">{group.stories.length}</span>}
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

        {activeTab === 'archive' && (
          <div className="yam-panel-stack">
            <section className="yam-panel-card">
              <div className="yam-panel-title">⭐ القصص المميزة</div>
              {highlights.length === 0 ? (
                <div className="yam-inline-empty">لا توجد قصص مميزة بعد.</div>
              ) : (
                <div className="yam-highlights-row">
                  {highlights.map((story) => (
                    <div key={story.id} className="yam-highlight-item">
                      {story.media_type === 'video' ? (
                        <video src={story.media_url} muted playsInline />
                      ) : (
                        <img src={story.media_url} alt={story.highlight_title || ''} loading="lazy" />
                      )}
                      <div className="yam-highlight-label">{story.highlight_title || 'مميزة'}</div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="yam-panel-card">
              <div className="yam-panel-title">🗂️ الأرشيف الكامل</div>
              {archive.length === 0 ? (
                <div className="yam-empty">
                  <div className="yam-empty-icon">🗄️</div>
                  <h3>لا توجد قصص في الأرشيف</h3>
                  <p>قصصك المنتهية تُحفظ تلقائيًا هنا.</p>
                </div>
              ) : (
                <div className="yam-archive-grid">
                  {archive.map((story) => (
                    <div key={story.id} className="yam-archive-item">
                      {story.media_type === 'video' ? (
                        <video src={story.media_url} muted playsInline />
                      ) : (
                        <img src={story.media_url} alt="" loading="lazy" />
                      )}
                      <div className="yam-archive-stats">
                        <span>👁 {story.views_count || 0}</span>
                        <span>💖 {story.reactions_count || 0}</span>
                        <span>💬 {story.replies_count || 0}</span>
                        {story.highlight && <span>⭐</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="yam-panel-stack">
            <div className="yam-analytics-grid">
              <StatCard label="إجمالي القصص" value={analytics?.stories_count ?? 0} />
              <StatCard label="إجمالي المشاهدات" value={analytics?.total_views ?? 0} />
              <StatCard label="إجمالي الردود" value={analytics?.total_replies ?? 0} />
              <StatCard label="إجمالي التفاعلات" value={analytics?.total_reactions ?? 0} />
              <StatCard label="متوسط المشاهدات" value={analytics?.average_views ?? 0} />
              <StatCard label="القصص المميزة" value={analytics?.highlights_count ?? 0} />
            </div>

            {topStory && (
              <section className="yam-panel-card yam-top-story-card">
                <div className="yam-panel-title">🏆 أفضل قصة أداءً</div>
                <div className="yam-top-story-layout">
                  <div className="yam-top-story-media">
                    {topStory.media_type === 'video' ? (
                      <video src={topStory.media_url} muted playsInline />
                    ) : (
                      <img src={topStory.media_url} alt={topStory.caption || 'Top story'} loading="lazy" />
                    )}
                  </div>
                  <div className="yam-top-story-copy">
                    <h3>{topStory.caption || 'قصة بدون وصف'}</h3>
                    <p>معدل التفاعل: {analytics?.engagement_rate ?? 0}</p>
                    <div className="yam-top-story-metrics">
                      <span>👁 {topStory.views_count || 0}</span>
                      <span>💖 {topStory.reactions_count || 0}</span>
                      <span>💬 {topStory.replies_count || 0}</span>
                    </div>
                  </div>
                </div>
              </section>
            )}

            <section className="yam-panel-card">
              <div className="yam-panel-title">🕘 آخر القصص</div>
              {analytics?.recent_stories?.length ? (
                <div className="yam-recent-stories-grid">
                  {analytics.recent_stories.map((story) => (
                    <div key={story.id} className="yam-recent-card">
                      {story.media_type === 'video' ? (
                        <video src={story.media_url} muted playsInline />
                      ) : (
                        <img src={story.media_url} alt={story.caption || ''} loading="lazy" />
                      )}
                      <div className="yam-recent-body">
                        <strong>{story.caption || 'قصة بدون وصف'}</strong>
                        <span>👁 {story.views_count || 0} • 💖 {story.reactions_count || 0} • 💬 {story.replies_count || 0}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="yam-inline-empty">لا توجد بيانات كافية بعد.</div>
              )}
            </section>
          </div>
        )}

        {activeTab === 'create' && (
          <StoryEditor
            file={selectedFile ?? null}
            onClose={() => { setActiveTab('feed'); setSelectedFile(undefined); }}
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
                if (activeGroupIndex < groups.length - 1) setActiveGroupIndex((i) => i + 1);
                else { setViewerOpen(false); loadData(); }
              }}
              onPrevGroup={() => {
                if (activeGroupIndex > 0) setActiveGroupIndex((i) => i - 1);
              }}
            />
          )}
        </AnimatePresence>

        <style>{pageStyles}</style>
      </section>
    </MainLayout>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="yam-stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function SkeletonFreeFlow() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="yam-story-bubble yam-skel-bubble">
          <div className="yam-story-bubble-ring"><div className="yam-story-bubble-media yam-skel" /></div>
          <div className="yam-story-bubble-name"><strong className="yam-skel-text" /></div>
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
  } catch (_) {
    return '';
  }
}

const pageStyles = `
/* v88.10 — دوائر القصص على الويب: الأزرار كانت تلف فوق الدائرة وتقطعها على الشاشات الصغيرة. الحل: دفع الدوائر للأسفل بمسافة كافية لتظهر كاملة */
.yam-stories-page { padding: 18px; display:flex; flex-direction:column; gap:16px; width:100%; box-sizing:border-box; }
.yam-stories-tabs { display:flex; gap:10px; flex-wrap:wrap; position:relative; z-index:2; margin-bottom: 6px; }
.yam-stab { border:1px solid rgba(255,255,255,.1); background:rgba(255,255,255,.04); color:var(--text,#eef2ff); border-radius:999px; padding:10px 16px; cursor:pointer; font:inherit; font-weight:700; white-space: nowrap; }
.yam-stab.active { background:linear-gradient(135deg,#7c3aed,#ec4899); border-color:transparent; }
.yam-stab-add { display:inline-flex; align-items:center; justify-content:center; }
.yam-stab-add.alt { background:rgba(56,189,248,.12); }
.yam-stories-freeflow { display:grid; grid-template-columns:repeat(auto-fill, minmax(104px, 1fr)); gap:18px 14px; align-items:start; padding-top: 18px; margin-top: 8px; position: relative; z-index: 1; clear: both; }
@media (max-width: 640px) {
  /* على الشاشات الصغيرة: زيادة المسافة بين الأزرار والدوائر حتى لا تختفي تحتها */
  .yam-stories-tabs { gap: 8px; margin-bottom: 14px; }
  .yam-stab { padding: 9px 13px; font-size: 13px; }
  .yam-stories-freeflow { padding-top: 26px; margin-top: 14px; grid-template-columns: repeat(auto-fill, minmax(88px, 1fr)); gap: 20px 10px; }
}
.yam-story-bubble { width:100%; max-width:118px; justify-self:center; border:0; background:transparent; display:flex; flex-direction:column; align-items:center; gap:10px; cursor:pointer; color:inherit; }
.yam-story-bubble-ring { width:92px; height:92px; padding:4px; border-radius:50%; background:linear-gradient(135deg,#a855f7,#ec4899,#f59e0b); }
@media (max-width: 640px) {
  .yam-story-bubble-ring { width: 78px; height: 78px; padding: 3px; }
}
.yam-story-bubble.unseen .yam-story-bubble-ring { box-shadow:0 0 0 4px rgba(168,85,247,.18); }
.yam-story-bubble-media { position:relative; width:100%; height:100%; border-radius:50%; overflow:hidden; background:#111827; }
.yam-story-bubble-media img, .yam-story-bubble-media video { width:100%; height:100%; object-fit:cover; }
.yam-story-bubble-count { position:absolute; left:2px; bottom:2px; min-width:22px; height:22px; border-radius:999px; background:#111827; color:#fff; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:800; border:2px solid #fff; }
.yam-story-bubble-name { text-align:center; display:flex; flex-direction:column; gap:4px; }
.yam-story-bubble-name strong { font-size:14px; }
.yam-story-bubble-name span { font-size:11px; opacity:.7; }
.yam-panel-stack { display:flex; flex-direction:column; gap:16px; }
.yam-panel-card { background:rgba(15,23,42,.62); border:1px solid rgba(255,255,255,.08); border-radius:20px; padding:16px; }
.yam-panel-title { font-weight:800; margin-bottom:12px; color:#f8fafc; }
.yam-highlights-row { display:grid; grid-template-columns:repeat(auto-fit,minmax(110px,1fr)); gap:12px; }
.yam-highlight-item, .yam-archive-item, .yam-recent-card { background:rgba(255,255,255,.03); border-radius:16px; overflow:hidden; border:1px solid rgba(255,255,255,.06); }
.yam-highlight-item img, .yam-highlight-item video, .yam-archive-item img, .yam-archive-item video, .yam-recent-card img, .yam-recent-card video { width:100%; aspect-ratio:9/16; object-fit:cover; display:block; background:#020617; }
.yam-highlight-label { padding:8px; text-align:center; font-size:12px; font-weight:700; }
.yam-archive-grid, .yam-recent-stories-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); gap:14px; }
.yam-archive-stats, .yam-recent-body { padding:10px; display:flex; flex-wrap:wrap; gap:8px; font-size:12px; }
.yam-recent-body { flex-direction:column; }
.yam-analytics-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(140px,1fr)); gap:12px; }
.yam-stat-card { background:rgba(15,23,42,.72); border:1px solid rgba(255,255,255,.08); border-radius:18px; padding:16px; display:flex; flex-direction:column; gap:8px; }
.yam-stat-card span { opacity:.72; font-size:12px; }
.yam-stat-card strong { font-size:28px; color:#fff; }
.yam-top-story-layout { display:grid; grid-template-columns:minmax(160px,220px) 1fr; gap:16px; align-items:center; }
.yam-top-story-media img, .yam-top-story-media video { width:100%; aspect-ratio:9/16; object-fit:cover; border-radius:18px; background:#020617; }
.yam-top-story-copy h3 { margin:0 0 8px; font-size:18px; }
.yam-top-story-copy p { margin:0 0 10px; opacity:.78; }
.yam-top-story-metrics { display:flex; gap:10px; flex-wrap:wrap; font-size:13px; }
.yam-empty, .yam-inline-empty { text-align:center; padding:32px 16px; color:rgba(255,255,255,.72); }
.yam-empty-icon { font-size:36px; margin-bottom:10px; }
.yam-skel { background:linear-gradient(90deg,rgba(255,255,255,.06),rgba(255,255,255,.12),rgba(255,255,255,.06)); background-size:200% 100%; animation:yamShimmer 1.2s linear infinite; }
.yam-skel-text { display:block; width:70px; height:12px; border-radius:999px; background:rgba(255,255,255,.08); }
@keyframes yamShimmer { from { background-position:200% 0; } to { background-position:-200% 0; } }
@media (max-width: 720px) {
  .yam-stories-page { padding:14px; padding-top:16px; }
  .yam-stories-freeflow { grid-template-columns:repeat(3, minmax(0, 1fr)); gap:16px 10px; }
  .yam-story-bubble { max-width:none; }
  .yam-story-bubble-ring { width:84px; height:84px; }
  .yam-top-story-layout { grid-template-columns:1fr; }
}
@media (max-width: 420px) {
  .yam-stories-freeflow { grid-template-columns:repeat(2, minmax(0, 1fr)); }
}
`;

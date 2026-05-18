import { useEffect, useMemo, useRef, useState } from 'react';
import MainLayout from '../components/layout/MainLayout.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Modal from '../components/ui/Modal.jsx';
import { useToast } from '../components/admin/ToastProvider.jsx';
import { getStories, getStoryArchive, reactToStory, replyToStory, uploadStory, viewStory } from '../api/stories.js';

const MUSIC_OPTIONS = [
  { id: 'lofi-night', label: 'Lo-fi Night', mood: 'هادئ', color: '#3b82f6' },
  { id: 'arabic-pop', label: 'Arabic Pop Intro', mood: 'حيوي', color: '#8b5cf6' },
  { id: 'cinematic-rise', label: 'Cinematic Rise', mood: 'ملحمي', color: '#f97316' },
  { id: 'acoustic-vibes', label: 'Acoustic Vibes', mood: 'دافئ', color: '#10b981' },
];

const STICKERS = ['🔥', '❤️', '✨', '🎉', '🧿', '📍', '🎵', '🚀'];
const REACTIONS = ['❤️', '🔥', '😂', '😮', '👏'];

function normalizeStories(items = []) {
  return items.map((item) => {
    const viewers = Array.isArray(item.viewers)
      ? item.viewers
      : Array.isArray(item.viewers_list)
        ? item.viewers_list
        : [];

    return {
      ...item,
      viewers,
      sticker_items: Array.isArray(item.sticker_items)
        ? item.sticker_items
        : Array.isArray(item.stickers)
          ? item.stickers
          : [],
      music: item.music || item.music_track || '',
      reactions: item.reactions || {},
      replies_count: Number(item.replies_count || 0),
      views_count: Number(item.views_count || item.view_count || viewers.length || 0),
      viewer_count: Number(item.views_count || item.view_count || viewers.length || 0),
    };
  });
}

function groupStoriesByUser(items = []) {
  const groups = new Map();
  items.forEach((story) => {
    const key = story.username || 'مستخدم';
    if (!groups.has(key)) groups.set(key, { username: key, stories: [] });
    groups.get(key).stories.push(story);
  });
  return Array.from(groups.values());
}

function isVideoStory(story) {
  return /\.(mp4|webm|mov|m3u8)(\?.*)?$/i.test(story?.media_url || '');
}

function storyAudienceLabel(story) {
  return story?.is_close_friends ? 'الأصدقاء المقربون' : 'عام';
}

export default function Stories() {
  const { pushToast } = useToast();
  const fileInputRef = useRef(null);
  const progressTimerRef = useRef(0);
  const prefetchCleanupRef = useRef([]);
  const viewedStoryIdsRef = useRef(new Set());
  const [activeTab, setActiveTab] = useState('feed');
  const [viewerMode, setViewerMode] = useState('feed');
  const [stories, setStories] = useState([]);
  const [archive, setArchive] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isCloseFriends, setIsCloseFriends] = useState(false);
  const [caption, setCaption] = useState('');
  const [selectedStickers, setSelectedStickers] = useState([]);
  const [selectedMusic, setSelectedMusic] = useState(MUSIC_OPTIONS[0]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activeGroupIndex, setActiveGroupIndex] = useState(0);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [storiesRes, archiveRes] = await Promise.all([getStories(), getStoryArchive()]);
      setStories(normalizeStories(Array.isArray(storiesRes?.data) ? storiesRes.data : []));
      setArchive(normalizeStories(Array.isArray(archiveRes?.data) ? archiveRes.data : []));
    } catch (error) {
      pushToast({ type: 'error', title: 'فشل تحميل القصص', description: error?.response?.data?.detail || error?.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (progressTimerRef.current) window.clearInterval(progressTimerRef.current);
    prefetchCleanupRef.current.forEach((fn) => fn?.());
  }, [previewUrl]);

  const storyGroups = useMemo(() => groupStoriesByUser(stories), [stories]);
  const archiveGroups = useMemo(() => groupStoriesByUser(archive), [archive]);
  const viewerGroups = viewerMode === 'archive' ? archiveGroups : storyGroups;
  const activeGroup = viewerGroups[activeGroupIndex] || null;
  const activeStory = activeGroup?.stories?.[activeStoryIndex] || null;

  useEffect(() => {
    prefetchCleanupRef.current.forEach((fn) => fn?.());
    prefetchCleanupRef.current = [];

    if (!viewerOpen || !activeGroup) return undefined;

    const nextStory = activeGroup.stories?.[activeStoryIndex + 1]
      || viewerGroups[activeGroupIndex + 1]?.stories?.[0];

    if (!nextStory?.media_url) return undefined;

    if (isVideoStory(nextStory)) {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.src = nextStory.media_url;
      prefetchCleanupRef.current.push(() => {
        video.pause?.();
        video.removeAttribute('src');
        video.load?.();
      });
    } else {
      const img = new Image();
      img.decoding = 'async';
      img.src = nextStory.media_url;
      prefetchCleanupRef.current.push(() => {
        img.src = '';
      });
    }

    return () => {
      prefetchCleanupRef.current.forEach((fn) => fn?.());
      prefetchCleanupRef.current = [];
    };
  }, [activeGroup, activeGroupIndex, activeStoryIndex, viewerGroups, viewerOpen]);

  useEffect(() => {
    if (!viewerOpen || !activeStory) return undefined;
    setProgress(0);
    if (!viewedStoryIdsRef.current.has(String(activeStory.id))) {
      viewedStoryIdsRef.current.add(String(activeStory.id));
      viewStory(activeStory.id)
        .then(({ data }) => {
          const nextViews = Number(data?.views_count ?? data?.view_count ?? activeStory.views_count ?? 0);
          const updater = (items) => items.map((item) => String(item.id) === String(activeStory.id)
            ? { ...item, views_count: nextViews, viewer_count: nextViews, seen_by: data?.seen_by || item.seen_by || [] }
            : item);
          if (viewerMode === 'archive') setArchive((prev) => updater(prev));
          else setStories((prev) => updater(prev));
        })
        .catch(() => null);
    }

    if (progressTimerRef.current) window.clearInterval(progressTimerRef.current);
    if (!paused) {
      progressTimerRef.current = window.setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            if (activeStoryIndex < (activeGroup?.stories?.length || 0) - 1) {
              setActiveStoryIndex((current) => current + 1);
            } else if (activeGroupIndex < viewerGroups.length - 1) {
              setActiveGroupIndex((current) => current + 1);
              setActiveStoryIndex(0);
            } else {
              setViewerOpen(false);
            }
            return 0;
          }
          return prev + 2;
        });
      }, 120);
    }

    return () => {
      if (progressTimerRef.current) window.clearInterval(progressTimerRef.current);
    };
  }, [activeGroup?.stories?.length, activeGroupIndex, activeStory, activeStoryIndex, paused, viewerGroups.length, viewerOpen]);

  const resetComposer = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl('');
    setCaption('');
    setSelectedStickers([]);
    setSelectedMusic(MUSIC_OPTIONS[0]);
    setIsCloseFriends(false);
  };

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setActiveTab('create');
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      await uploadStory(selectedFile, {
        caption,
        is_close_friends: isCloseFriends,
        filter_name: 'Yamshat Stories',
        stickers: selectedStickers,
        music: selectedMusic.label,
      });
      pushToast({ type: 'success', title: 'تم نشر الستوري' });
      resetComposer();
      setActiveTab('feed');
      await loadData();
    } catch (error) {
      pushToast({ type: 'error', title: 'تعذر رفع الستوري', description: error?.response?.data?.detail || error?.message });
    } finally {
      setUploading(false);
    }
  };

  const toggleSticker = (sticker) => {
    setSelectedStickers((prev) => prev.includes(sticker) ? prev.filter((item) => item !== sticker) : [...prev, sticker].slice(0, 3));
  };

  const openViewer = (mode, groupIndex, storyIndex = 0) => {
    setViewerMode(mode);
    setActiveGroupIndex(groupIndex);
    setActiveStoryIndex(storyIndex);
    setReplyText('');
    setPaused(false);
    setViewerOpen(true);
  };

  const reactToCurrentStory = async (emoji) => {
    if (!activeStory) return;
    try {
      await reactToStory(activeStory.id, emoji);
    } catch {
      // optimistic update below
    }

    const updater = (items) => items.map((item) => String(item.id) === String(activeStory.id)
      ? { ...item, reactions: { ...(item.reactions || {}), [emoji]: Number(item.reactions?.[emoji] || 0) + 1 } }
      : item);

    if (viewerMode === 'archive') setArchive((prev) => updater(prev));
    else setStories((prev) => updater(prev));
  };

  const sendReply = async () => {
    if (!activeStory || !replyText.trim()) return;
    try {
      await replyToStory(activeStory.id, replyText.trim());
      setStories((prev) => prev.map((item) => String(item.id) === String(activeStory.id) ? { ...item, replies_count: Number(item.replies_count || 0) + 1 } : item));
      setReplyText('');
      pushToast({ type: 'success', title: 'تم إرسال الرد' });
    } catch (error) {
      pushToast({ type: 'error', title: 'تعذر إرسال الرد', description: error?.response?.data?.detail || error?.message });
    }
  };

  const archiveCount = archive.length;
  const totalViewers = stories.reduce((sum, item) => sum + Number(item.views_count || 0), 0);
  const totalReactions = stories.reduce((sum, item) => sum + Object.values(item.reactions || {}).reduce((acc, value) => acc + Number(value || 0), 0), 0);

  return (
    <MainLayout>
      <div style={{ maxWidth: 980, margin: '0 auto', padding: '20px 10px', display: 'grid', gap: 18 }}>
        <Card style={{ padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: 0 }}>الستوري</h2>
              <div className="muted" style={{ marginTop: 6 }}>viewers list + reactions + stickers + music UI + archive UI</div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Button variant="secondary" onClick={() => setActiveTab('feed')}>القصص</Button>
              <Button variant="secondary" onClick={() => setActiveTab('archive')}>الأرشيف</Button>
              <Button variant="secondary" onClick={loadData} loading={loading}>تحديث</Button>
              <Button onClick={() => fileInputRef.current?.click()}>رفع ستوري</Button>
              <input ref={fileInputRef} type="file" hidden accept="image/*,video/*" onChange={handleFileSelect} />
            </div>
          </div>
        </Card>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          <Card style={{ padding: 14 }}><div className="story-kpi"><strong>{storyGroups.length}</strong><span>دوائر الستوري</span></div></Card>
          <Card style={{ padding: 14 }}><div className="story-kpi"><strong>{totalViewers}</strong><span>إجمالي المشاهدات</span></div></Card>
          <Card style={{ padding: 14 }}><div className="story-kpi"><strong>{totalReactions}</strong><span>إجمالي التفاعلات</span></div></Card>
          <Card style={{ padding: 14 }}><div className="story-kpi"><strong>{archiveCount}</strong><span>عناصر الأرشيف</span></div></Card>
        </div>

        {loading ? <Card style={{ padding: 24 }}>جارٍ تحميل الستوري...</Card> : null}

        {!loading && activeTab === 'feed' ? (
          <div style={{ display: 'grid', gap: 16 }}>
            <div className="story-circles-strip">
              {storyGroups.map((group, groupIndex) => (
                <button key={group.username} type="button" onClick={() => openViewer('feed', groupIndex, 0)} className="story-user-card">
                  <div className="story-user-ring">
                    <img src={`https://ui-avatars.com/api/?name=${group.username}`} alt={group.username} className="story-user-avatar" />
                  </div>
                  <div style={{ marginTop: 8, fontSize: 12 }}>{group.username}</div>
                  <small className="muted">{group.stories.length} قصة</small>
                </button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
              {stories.map((story) => (
                <Card key={story.id} style={{ overflow: 'hidden', padding: 0 }}>
                  <div style={{ aspectRatio: '9 / 16', position: 'relative', background: '#111' }}>
                    {isVideoStory(story)
                      ? <video src={story.media_url} muted loop autoPlay playsInline preload="metadata" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <img src={story.media_url} alt="story" loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                    <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {story.music ? <span className="story-chip">🎵 {story.music}</span> : null}
                      {story.sticker_items?.length ? <span className="story-chip">{story.sticker_items.join(' ')}</span> : null}
                    </div>
                    <div style={{ position: 'absolute', insetInline: 0, bottom: 0, padding: 12, background: 'linear-gradient(transparent, rgba(0,0,0,0.82))', color: 'white' }}>
                      <div style={{ fontWeight: 700 }}>@{story.username}</div>
                      <div style={{ fontSize: 12, opacity: 0.84 }}>{story.caption || 'بدون كابشن'}</div>
                    </div>
                  </div>
                  <div style={{ padding: 12, display: 'grid', gap: 8 }}>
                    <div className="muted" style={{ fontSize: 12 }}>👁️ {story.views_count} · 💬 {story.replies_count} · 🎵 {story.music || 'بدون موسيقى'}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                      <span className="story-chip">{storyAudienceLabel(story)}</span>
                      <Button variant="secondary" onClick={() => {
                        const index = storyGroups.findIndex((group) => group.username === story.username);
                        const nestedIndex = storyGroups[index]?.stories?.findIndex((item) => String(item.id) === String(story.id)) || 0;
                        openViewer('feed', index, nestedIndex);
                      }}>عرض</Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ) : null}

        {!loading && activeTab === 'archive' ? (
          archive.length ? (
            <div style={{ display: 'grid', gap: 16 }}>
              <Card style={{ padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                  <div>
                    <strong>واجهة الأرشيف</strong>
                    <div className="muted" style={{ marginTop: 6 }}>مراجعة سريعة للقصص القديمة مع الموسيقى والملصقات والمشاهدات.</div>
                  </div>
                  <span className="story-chip">{archiveCount} عنصر</span>
                </div>
              </Card>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                {archive.map((story) => {
                  const groupIndex = archiveGroups.findIndex((group) => group.username === story.username);
                  const nestedIndex = archiveGroups[groupIndex]?.stories?.findIndex((item) => String(item.id) === String(story.id)) || 0;
                  return (
                    <Card key={story.id} style={{ overflow: 'hidden', padding: 0, cursor: 'pointer' }} onClick={() => openViewer('archive', groupIndex, nestedIndex)}>
                      <div style={{ aspectRatio: '9 / 16', background: '#111', position: 'relative' }}>
                        {isVideoStory(story)
                          ? <video src={story.media_url} muted preload="metadata" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.78 }} />
                          : <img src={story.media_url} alt="archived" loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.78 }} />}
                        <div style={{ position: 'absolute', top: 10, left: 10 }}><span className="story-chip">🗄️ مؤرشف</span></div>
                        <div style={{ position: 'absolute', insetInline: 0, bottom: 0, padding: 10, background: 'linear-gradient(transparent, rgba(0,0,0,0.84))', color: 'white' }}>
                          <strong>@{story.username}</strong>
                          <div style={{ fontSize: 11, opacity: 0.84 }}>{story.music || 'بدون موسيقى'}</div>
                        </div>
                      </div>
                      <div style={{ padding: 10, fontSize: 12, display: 'grid', gap: 6 }}>
                        <span className="muted">👁️ {story.views_count} · 💬 {story.replies_count}</span>
                        <span className="muted">{story.sticker_items?.length ? story.sticker_items.join(' ') : 'بدون ملصقات'}</span>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          ) : <Card style={{ padding: 24 }}>الأرشيف فارغ.</Card>
        ) : null}

        {activeTab === 'create' ? (
          <Card style={{ padding: 18 }}>
            <div style={{ display: 'grid', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(280px, 0.95fr)', gap: 16 }}>
                <div style={{ position: 'relative', aspectRatio: '9 / 16', background: '#000', borderRadius: 20, overflow: 'hidden' }}>
                  {selectedFile?.type?.startsWith('video/')
                    ? <video src={previewUrl} controls style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    : <img src={previewUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />}
                  <div style={{ position: 'absolute', top: 20, left: 20, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {selectedStickers.map((sticker) => <span key={sticker} className="story-chip" style={{ fontSize: 20 }}>{sticker}</span>)}
                  </div>
                  <div style={{ position: 'absolute', insetInline: 0, bottom: 0, padding: 16, background: 'linear-gradient(transparent, rgba(0,0,0,0.82))', color: 'white' }}>
                    <div style={{ fontSize: 14, marginBottom: 6 }}>{caption || 'اكتب كابشن للستوري'}</div>
                    <div style={{ fontSize: 12, opacity: 0.82 }}>🎵 {selectedMusic.label}</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gap: 14 }}>
                  <Card style={{ padding: 14 }}>
                    <div style={{ fontWeight: 700, marginBottom: 10 }}>Stickers</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {STICKERS.map((sticker) => (
                        <button key={sticker} type="button" className={`story-picker-chip ${selectedStickers.includes(sticker) ? 'active' : ''}`} onClick={() => toggleSticker(sticker)}>{sticker}</button>
                      ))}
                    </div>
                  </Card>

                  <Card style={{ padding: 14 }}>
                    <div style={{ fontWeight: 700, marginBottom: 10 }}>Music UI</div>
                    <div style={{ display: 'grid', gap: 10 }}>
                      {MUSIC_OPTIONS.map((option) => (
                        <button key={option.id} type="button" className={`story-music-row ${selectedMusic.id === option.id ? 'active' : ''}`} onClick={() => setSelectedMusic(option)}>
                          <span className="story-music-dot" style={{ background: option.color }} />
                          <span style={{ textAlign: 'start' }}>
                            <strong>{option.label}</strong>
                            <small className="muted" style={{ display: 'block', marginTop: 4 }}>{option.mood}</small>
                          </span>
                        </button>
                      ))}
                    </div>
                  </Card>
                </div>
              </div>

              <textarea value={caption} onChange={(event) => setCaption(event.target.value)} rows={3} placeholder="كابشن / CTA / سؤال للمشاهدين" style={{ width: '100%', borderRadius: 16, padding: 12 }} />
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" checked={isCloseFriends} onChange={(event) => setIsCloseFriends(event.target.checked)} />
                نشر للأصدقاء المقربين فقط
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
                <Button variant="secondary" onClick={() => { resetComposer(); setActiveTab('feed'); }}>إلغاء</Button>
                <Button onClick={handleUpload} loading={uploading}>نشر الستوري</Button>
              </div>
            </div>
          </Card>
        ) : null}
      </div>

      <Modal open={viewerOpen && Boolean(activeStory)} onClose={() => setViewerOpen(false)} title={activeStory ? `@${activeStory.username}` : 'Story'} size="large">
        {activeStory ? (
          <div style={{ display: 'grid', gap: 16 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {(activeGroup?.stories || []).map((item, idx) => (
                <div key={item.id || idx} style={{ flex: 1, height: 4, borderRadius: 999, overflow: 'hidden', background: 'rgba(59,130,246,0.14)' }}>
                  <div style={{ width: idx < activeStoryIndex ? '100%' : idx === activeStoryIndex ? `${progress}%` : '0%', height: '100%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }} />
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.05fr) minmax(300px, 0.95fr)', gap: 16 }}>
              <div
                style={{ position: 'relative', aspectRatio: '9 / 16', background: '#000', borderRadius: 20, overflow: 'hidden' }}
                onMouseDown={() => setPaused(true)}
                onMouseUp={() => setPaused(false)}
                onTouchStart={() => setPaused(true)}
                onTouchEnd={() => setPaused(false)}
              >
                {isVideoStory(activeStory)
                  ? <video key={activeStory.id} src={activeStory.media_url} controls autoPlay playsInline preload="metadata" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  : <img src={activeStory.media_url} alt="story" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />}

                <div style={{ position: 'absolute', top: 18, left: 18, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {activeStory.music ? <span className="story-chip">🎵 {activeStory.music}</span> : null}
                  {activeStory.sticker_items?.map((sticker) => <span key={sticker} className="story-chip">{sticker}</span>)}
                </div>

                <button type="button" className="story-nav-hit story-nav-prev" onClick={() => {
                  if (activeStoryIndex > 0) setActiveStoryIndex((prev) => prev - 1);
                  else if (activeGroupIndex > 0) {
                    const previousGroupIndex = activeGroupIndex - 1;
                    const previousGroupLength = viewerGroups[previousGroupIndex]?.stories?.length || 1;
                    setActiveGroupIndex(previousGroupIndex);
                    setActiveStoryIndex(previousGroupLength - 1);
                  }
                }}>‹</button>
                <button type="button" className="story-nav-hit story-nav-next" onClick={() => {
                  if (activeStoryIndex < (activeGroup?.stories?.length || 0) - 1) setActiveStoryIndex((prev) => prev + 1);
                  else if (activeGroupIndex < viewerGroups.length - 1) {
                    setActiveGroupIndex((prev) => prev + 1);
                    setActiveStoryIndex(0);
                  }
                }}>›</button>

                <div style={{ position: 'absolute', insetInline: 0, bottom: 0, padding: 16, background: 'linear-gradient(transparent, rgba(0,0,0,0.84))', color: 'white' }}>
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>{activeStory.caption || 'بدون كابشن'}</div>
                  <div style={{ fontSize: 12, opacity: 0.82 }}>🎵 {activeStory.music || 'بدون موسيقى'} · {storyAudienceLabel(activeStory)}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gap: 12 }}>
                <Card style={{ padding: 14 }}>
                  <div style={{ display: 'grid', gap: 8 }}>
                    <div className="story-meta-row"><strong>المشاهدات</strong><span>{activeStory.views_count}</span></div>
                    <div className="story-meta-row"><strong>الردود</strong><span>{activeStory.replies_count}</span></div>
                    <div className="story-meta-row"><strong>الأرشيف</strong><span>{viewerMode === 'archive' ? 'مؤرشف' : archive.some((item) => String(item.id) === String(activeStory.id)) ? 'موجود في الأرشيف' : 'نشط'}</span></div>
                    <div className="story-meta-row"><strong>المشاهدون التفصيليون</strong><span>{activeStory.viewers?.length || 0}</span></div>
                  </div>
                </Card>

                <Card style={{ padding: 14 }}>
                  <div style={{ fontWeight: 700, marginBottom: 10 }}>Reactions</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {REACTIONS.map((emoji) => (
                      <button key={emoji} type="button" className="story-picker-chip" onClick={() => reactToCurrentStory(emoji)}>
                        {emoji} {activeStory.reactions?.[emoji] ? activeStory.reactions[emoji] : ''}
                      </button>
                    ))}
                  </div>
                </Card>

                <Card style={{ padding: 14 }}>
                  <div style={{ fontWeight: 700, marginBottom: 10 }}>Viewers list</div>
                  {activeStory.viewers?.length ? (
                    <div style={{ display: 'grid', gap: 10, maxHeight: 180, overflowY: 'auto' }}>
                      {activeStory.viewers.map((viewer, index) => (
                        <div key={`${viewer?.username || viewer}-${index}`} className="story-viewer-row">
                          <div className="story-viewer-avatar">{String(viewer?.username || viewer || 'U').slice(0, 1).toUpperCase()}</div>
                          <div>
                            <strong>{viewer?.username || viewer}</strong>
                            <div className="muted" style={{ fontSize: 12 }}>{viewer?.viewed_at ? new Date(viewer.viewed_at).toLocaleString('ar-EG') : 'شاهد القصة'}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="muted">لا توجد بيانات viewers تفصيلية من الـ API حالياً، لكن عداد المشاهدات ظاهر فوق.</div>
                  )}
                </Card>

                <Card style={{ padding: 14 }}>
                  <div style={{ fontWeight: 700, marginBottom: 10 }}>Reply</div>
                  <textarea
                    value={replyText}
                    onChange={(event) => setReplyText(event.target.value)}
                    rows={3}
                    placeholder="اكتب ردك على الستوري"
                    style={{ width: '100%', borderRadius: 14, padding: 12 }}
                    onFocus={() => setPaused(true)}
                    onBlur={() => setPaused(false)}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                    <span className="muted" style={{ fontSize: 12 }}>CTA / mentions / quick reactions جاهزين</span>
                    <Button onClick={sendReply}>إرسال الرد</Button>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>

      <style>{`
        .story-kpi {
          display: grid;
          gap: 6px;
        }
        .story-kpi strong {
          font-size: 28px;
        }
        .story-chip,
        .story-picker-chip {
          border: 1px solid rgba(59,130,246,0.15);
          background: rgba(59,130,246,0.06);
          padding: 6px 10px;
          border-radius: 999px;
          cursor: pointer;
        }
        .story-picker-chip.active {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
        }
        .story-circles-strip {
          display: flex;
          gap: 14px;
          overflow-x: auto;
          padding-bottom: 6px;
        }
        .story-user-card {
          border: none;
          background: none;
          cursor: pointer;
          color: inherit;
          min-width: 98px;
          text-align: center;
        }
        .story-user-ring {
          width: 84px;
          height: 84px;
          border-radius: 50%;
          padding: 3px;
          margin: 0 auto;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6, #f97316);
          box-shadow: 0 18px 36px rgba(59,130,246,0.18);
        }
        .story-user-avatar {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid white;
        }
        .story-meta-row {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          padding: 10px 0;
          border-bottom: 1px solid rgba(15,23,42,0.06);
        }
        .story-meta-row:last-child {
          border-bottom: none;
        }
        .story-viewer-row {
          display: flex;
          gap: 10px;
          align-items: center;
          padding: 10px 0;
          border-bottom: 1px solid rgba(15,23,42,0.06);
        }
        .story-viewer-row:last-child {
          border-bottom: none;
        }
        .story-viewer-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          color: white;
          font-weight: 700;
        }
        .story-music-row {
          width: 100%;
          border: 1px solid rgba(15,23,42,0.08);
          border-radius: 16px;
          background: rgba(255,255,255,0.03);
          padding: 12px 14px;
          display: flex;
          gap: 12px;
          align-items: center;
          cursor: pointer;
        }
        .story-music-row.active {
          border-color: rgba(59,130,246,0.4);
          box-shadow: 0 14px 30px rgba(59,130,246,0.12);
        }
        .story-music-dot {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .story-nav-hit {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 54px;
          border: none;
          background: linear-gradient(90deg, rgba(0,0,0,0.24), transparent);
          color: white;
          font-size: 36px;
          cursor: pointer;
        }
        .story-nav-prev { left: 0; }
        .story-nav-next {
          right: 0;
          background: linear-gradient(270deg, rgba(0,0,0,0.24), transparent);
        }
        @media (max-width: 920px) {
          .story-circles-strip {
            padding-inline-end: 8px;
          }
        }
      `}</style>
    </MainLayout>
  );
}

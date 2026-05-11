import { useEffect, useMemo, useRef, useState } from 'react';
import MainLayout from '../components/layout/MainLayout.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Modal from '../components/ui/Modal.jsx';
import { useToast } from '../components/admin/ToastProvider.jsx';
import { getStories, getStoryArchive, reactToStory, replyToStory, uploadStory, viewStory } from '../api/stories.js';

const MUSIC_OPTIONS = ['Lo-fi Night', 'Arabic Pop Intro', 'Cinematic Rise', 'Acoustic Vibes'];
const STICKERS = ['🔥', '❤️', '✨', '🎉', '🧿', '📍'];

function normalizeStories(items = []) {
  return items.map((item) => ({
    ...item,
    viewers: item.viewers || [],
    sticker_items: item.sticker_items || [],
    music: item.music || item.music_track || '',
    reactions: item.reactions || {},
    replies_count: Number(item.replies_count || 0),
    views_count: Number(item.views_count || 0),
  }));
}

export default function Stories() {
  const { pushToast } = useToast();
  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState('feed');
  const [stories, setStories] = useState([]);
  const [archive, setArchive] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isCloseFriends, setIsCloseFriends] = useState(false);
  const [caption, setCaption] = useState('');
  const [selectedSticker, setSelectedSticker] = useState('');
  const [selectedMusic, setSelectedMusic] = useState(MUSIC_OPTIONS[0]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activeGroupIndex, setActiveGroupIndex] = useState(0);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [progress, setProgress] = useState(0);

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

  useEffect(() => { loadData(); }, []);

  const storyGroups = useMemo(() => {
    const groups = new Map();
    stories.forEach((story) => {
      const key = story.username || 'مستخدم';
      if (!groups.has(key)) groups.set(key, { username: key, stories: [] });
      groups.get(key).stories.push(story);
    });
    return Array.from(groups.values());
  }, [stories]);

  const activeGroup = storyGroups[activeGroupIndex] || null;
  const activeStory = activeGroup?.stories?.[activeStoryIndex] || null;

  useEffect(() => {
    if (!viewerOpen || !activeStory) return undefined;
    setProgress(0);
    viewStory(activeStory.id).catch(() => null);
    setStories((prev) => prev.map((item) => String(item.id) === String(activeStory.id) ? { ...item, views_count: Number(item.views_count || 0) + 1 } : item));

    const timer = window.setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (activeStoryIndex < (activeGroup?.stories?.length || 0) - 1) setActiveStoryIndex((current) => current + 1);
          else if (activeGroupIndex < storyGroups.length - 1) {
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
    return () => window.clearInterval(timer);
  }, [activeGroup?.stories?.length, activeGroupIndex, activeStory, activeStoryIndex, storyGroups.length, viewerOpen]);

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
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
        filter_name: 'Social Stories',
        stickers: selectedSticker ? [selectedSticker] : [],
        music: selectedMusic,
      });
      pushToast({ type: 'success', title: 'تم نشر الستوري' });
      setSelectedFile(null);
      setPreviewUrl('');
      setCaption('');
      setSelectedSticker('');
      setSelectedMusic(MUSIC_OPTIONS[0]);
      setIsCloseFriends(false);
      setActiveTab('feed');
      await loadData();
    } catch (error) {
      pushToast({ type: 'error', title: 'تعذر رفع الستوري', description: error?.response?.data?.detail || error?.message });
    } finally {
      setUploading(false);
    }
  };

  const reactToCurrentStory = async (emoji) => {
    if (!activeStory) return;
    try {
      await reactToStory(activeStory.id, emoji);
      setStories((prev) => prev.map((item) => String(item.id) === String(activeStory.id) ? { ...item, reactions: { ...(item.reactions || {}), [emoji]: Number(item.reactions?.[emoji] || 0) + 1 } } : item));
    } catch {
      setStories((prev) => prev.map((item) => String(item.id) === String(activeStory.id) ? { ...item, reactions: { ...(item.reactions || {}), [emoji]: Number(item.reactions?.[emoji] || 0) + 1 } } : item));
    }
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

  return (
    <MainLayout>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '20px 10px', display: 'grid', gap: 18 }}>
        <Card style={{ padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: 0 }}>الستوري</h2>
              <div className="muted" style={{ marginTop: 6 }}>upload + reactions + viewers + reply + stickers + music + archive</div>
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

        {loading ? <Card style={{ padding: 24 }}>جارٍ تحميل الستوري...</Card> : null}

        {!loading && activeTab === 'feed' ? (
          <div style={{ display: 'grid', gap: 16 }}>
            <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 4 }}>
              {storyGroups.map((group, groupIndex) => (
                <button key={group.username} type="button" onClick={() => { setActiveGroupIndex(groupIndex); setActiveStoryIndex(0); setViewerOpen(true); }} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'inherit' }}>
                  <div style={{ width: 78, height: 78, borderRadius: '50%', padding: 3, background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
                    <img src={`https://ui-avatars.com/api/?name=${group.username}`} alt={group.username} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '3px solid white' }} />
                  </div>
                  <div style={{ marginTop: 8, fontSize: 12 }}>{group.username}</div>
                </button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              {stories.map((story) => (
                <Card key={story.id} style={{ overflow: 'hidden', padding: 0 }}>
                  <div style={{ aspectRatio: '9 / 16', position: 'relative', background: '#111' }}>
                    {story.media_url?.match(/\.(mp4|webm|mov)$/i)
                      ? <video src={story.media_url} muted loop autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <img src={story.media_url} alt="story" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                    <div style={{ position: 'absolute', insetInline: 0, bottom: 0, padding: 12, background: 'linear-gradient(transparent, rgba(0,0,0,0.8))', color: 'white' }}>
                      <div style={{ fontWeight: 700 }}>@{story.username}</div>
                      <div style={{ fontSize: 12, opacity: 0.82 }}>{story.caption || 'بدون كابشن'}</div>
                    </div>
                  </div>
                  <div style={{ padding: 12, display: 'grid', gap: 8 }}>
                    <div className="muted" style={{ fontSize: 12 }}>👁️ {story.views_count} · 💬 {story.replies_count} · {story.music || 'بدون موسيقى'}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                      <span className="story-chip">{story.is_close_friends ? 'Close Friends' : 'Public'}</span>
                      <span className="story-chip">{story.sticker_items?.join(' ') || 'No stickers'}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ) : null}

        {!loading && activeTab === 'archive' ? (
          archive.length ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
              {archive.map((story) => (
                <Card key={story.id} style={{ overflow: 'hidden', padding: 0 }}>
                  <div style={{ aspectRatio: '9 / 16', background: '#111' }}>
                    {story.media_url?.match(/\.(mp4|webm|mov)$/i)
                      ? <video src={story.media_url} muted style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.72 }} />
                      : <img src={story.media_url} alt="archived" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.72 }} />}
                  </div>
                  <div style={{ padding: 10, fontSize: 12 }}>
                    <strong>@{story.username}</strong>
                    <div className="muted">{story.music || 'بدون موسيقى'}</div>
                  </div>
                </Card>
              ))}
            </div>
          ) : <Card style={{ padding: 24 }}>الأرشيف فارغ.</Card>
        ) : null}

        {activeTab === 'create' ? (
          <Card style={{ padding: 18 }}>
            <div style={{ display: 'grid', gap: 16 }}>
              <div style={{ position: 'relative', aspectRatio: '9 / 16', background: '#000', borderRadius: 20, overflow: 'hidden' }}>
                {selectedFile?.type?.startsWith('video/')
                  ? <video src={previewUrl} controls style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  : <img src={previewUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />}
                {selectedSticker ? <div style={{ position: 'absolute', top: 24, right: 24, fontSize: 44 }}>{selectedSticker}</div> : null}
                <div style={{ position: 'absolute', insetInline: 0, bottom: 0, padding: 16, background: 'linear-gradient(transparent, rgba(0,0,0,0.82))', color: 'white' }}>
                  <div style={{ fontSize: 14, marginBottom: 6 }}>{caption || 'اكتب كابشن للستوري'}</div>
                  <div style={{ fontSize: 12, opacity: 0.82 }}>🎵 {selectedMusic}</div>
                </div>
              </div>

              <textarea value={caption} onChange={(event) => setCaption(event.target.value)} rows={3} placeholder="كابشن / Reply prompt / CTA" style={{ width: '100%', borderRadius: 16, padding: 12 }} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 8 }}>Stickers</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {STICKERS.map((sticker) => (
                      <button key={sticker} type="button" className={`story-picker-chip ${selectedSticker === sticker ? 'active' : ''}`} onClick={() => setSelectedSticker(sticker)}>{sticker}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 8 }}>Music</div>
                  <select value={selectedMusic} onChange={(event) => setSelectedMusic(event.target.value)} style={{ width: '100%', borderRadius: 14, padding: 12 }}>
                    {MUSIC_OPTIONS.map((music) => <option key={music} value={music}>{music}</option>)}
                  </select>
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" checked={isCloseFriends} onChange={(event) => setIsCloseFriends(event.target.checked)} />
                نشر للأصدقاء المقربين فقط
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
                <Button variant="secondary" onClick={() => setActiveTab('feed')}>إلغاء</Button>
                <Button onClick={handleUpload} loading={uploading}>نشر الستوري</Button>
              </div>
            </div>
          </Card>
        ) : null}
      </div>

      <Modal open={viewerOpen && Boolean(activeStory)} onClose={() => setViewerOpen(false)} title={activeStory ? `@${activeStory.username}` : 'Story'} size="large">
        {activeStory ? (
          <div style={{ display: 'grid', gap: 16 }}>
            <div style={{ height: 4, borderRadius: 999, overflow: 'hidden', background: 'rgba(59,130,246,0.12)' }}>
              <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.1fr) minmax(280px, 0.9fr)', gap: 16 }}>
              <div style={{ position: 'relative', aspectRatio: '9 / 16', background: '#000', borderRadius: 20, overflow: 'hidden' }}>
                {activeStory.media_url?.match(/\.(mp4|webm|mov)$/i)
                  ? <video src={activeStory.media_url} controls autoPlay style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  : <img src={activeStory.media_url} alt="story" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />}
                {activeStory.sticker_items?.[0] ? <div style={{ position: 'absolute', top: 24, right: 24, fontSize: 42 }}>{activeStory.sticker_items[0]}</div> : null}
                <div style={{ position: 'absolute', insetInline: 0, bottom: 0, padding: 16, background: 'linear-gradient(transparent, rgba(0,0,0,0.82))', color: 'white' }}>
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>{activeStory.caption || 'بدون كابشن'}</div>
                  <div style={{ fontSize: 12, opacity: 0.82 }}>🎵 {activeStory.music || 'بدون موسيقى'}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gap: 12 }}>
                <Card style={{ padding: 14 }}>
                  <div style={{ display: 'grid', gap: 8 }}>
                    <div className="story-meta-row"><strong>Viewers</strong><span>{activeStory.views_count}</span></div>
                    <div className="story-meta-row"><strong>Replies</strong><span>{activeStory.replies_count}</span></div>
                    <div className="story-meta-row"><strong>Archive</strong><span>{archive.some((item) => String(item.id) === String(activeStory.id)) ? 'مؤرشف' : 'نشط'}</span></div>
                    <div className="story-meta-row"><strong>Audience</strong><span>{activeStory.is_close_friends ? 'Close Friends' : 'Public'}</span></div>
                  </div>
                </Card>

                <Card style={{ padding: 14 }}>
                  <div style={{ fontWeight: 700, marginBottom: 10 }}>Reactions</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {['❤️', '🔥', '😂', '😮', '👏'].map((emoji) => (
                      <button key={emoji} type="button" className="story-picker-chip" onClick={() => reactToCurrentStory(emoji)}>
                        {emoji} {activeStory.reactions?.[emoji] ? activeStory.reactions[emoji] : ''}
                      </button>
                    ))}
                  </div>
                </Card>

                <Card style={{ padding: 14 }}>
                  <div style={{ fontWeight: 700, marginBottom: 10 }}>Reply</div>
                  <textarea value={replyText} onChange={(event) => setReplyText(event.target.value)} rows={3} placeholder="اكتب ردك على الستوري" style={{ width: '100%', borderRadius: 14, padding: 12 }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                    <span className="muted" style={{ fontSize: 12 }}>Mentions / CTA / quick reactions جاهزين</span>
                    <Button onClick={sendReply}>إرسال الرد</Button>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>

      <style>{`
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
      `}</style>
    </MainLayout>
  );
}

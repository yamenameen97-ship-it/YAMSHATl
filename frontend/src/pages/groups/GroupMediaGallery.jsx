import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout.jsx';
import GroupSubHeader from '../../components/groups/GroupSubHeader.jsx';
import { listGroupMedia, getGroupDetails } from '../../api/groups.js';
import '../../styles/groups-features.css';

const TABS = [
  { id: 'all',    label: 'الكل',      icon: '🗂️' },
  { id: 'image',  label: 'الصور',     icon: '🖼️' },
  { id: 'video',  label: 'الفيديو',   icon: '🎬' },
  { id: 'audio',  label: 'الصوت',     icon: '🎵' },
  { id: 'file',   label: 'الملفات',   icon: '📎' },
];

const detectType = (item) => {
  const t = (item.media_type || item.type || '').toLowerCase();
  if (t) return t;
  const url = String(item.url || item.media_url || '').toLowerCase();
  if (/\.(jpe?g|png|webp|gif|avif|bmp)$/.test(url)) return 'image';
  if (/\.(mp4|webm|mov|m4v|3gp)$/.test(url))         return 'video';
  if (/\.(mp3|wav|m4a|ogg|aac)$/.test(url))          return 'audio';
  return 'file';
};

const GroupMediaGallery = () => {
  const { groupId } = useParams();
  const [media, setMedia] = useState([]);
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const [mr, det] = await Promise.allSettled([
          listGroupMedia(groupId, { limit: 200 }),
          getGroupDetails(groupId),
        ]);
        if (cancelled) return;
        if (mr.status === 'fulfilled') {
          const list = Array.isArray(mr.value?.data) ? mr.value.data : (mr.value?.data?.items || []);
          setMedia(list.map((x) => ({ ...x, _type: detectType(x) })));
        }
        if (det.status === 'fulfilled') setGroup(det.value?.data || null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [groupId]);

  const filtered = useMemo(
    () => tab === 'all' ? media : media.filter((m) => m._type === tab),
    [media, tab]
  );

  const counts = useMemo(() => {
    const c = { all: media.length, image: 0, video: 0, audio: 0, file: 0 };
    for (const m of media) c[m._type] = (c[m._type] || 0) + 1;
    return c;
  }, [media]);

  return (
    <MainLayout>
      <div className="yamg-page" dir="rtl">
        <GroupSubHeader
          title={`وسائط ${group?.name || 'المجموعة'}`}
          subtitle={`${media.length} عنصر مشارك`}
        />

        <div className="yamg-media-tabs">
          {TABS.map((t) => (
            <div
              key={t.id}
              className={`tab ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >{t.icon} {t.label} ({counts[t.id] || 0})</div>
          ))}
        </div>

        {loading ? (
          <div className="yamg-loading"><div className="yamg-spinner" />جاري التحميل...</div>
        ) : filtered.length === 0 ? (
          <div className="yamg-empty">
            <span className="ic">🖼️</span>
            لا توجد وسائط في هذا القسم بعد.
          </div>
        ) : (
          <div className="yamg-media-grid">
            {filtered.map((m, i) => {
              const url = m.url || m.media_url || m.cdn_url;
              if (m._type === 'image') {
                return (
                  <div key={m.id || i} className="yamg-media-cell" onClick={() => setPreview(m)}>
                    <img src={url} alt="" loading="lazy" />
                  </div>
                );
              }
              if (m._type === 'video') {
                return (
                  <div key={m.id || i} className="yamg-media-cell" onClick={() => setPreview(m)}>
                    <video src={url} muted preload="metadata" />
                    <span className="ic-overlay">▶ فيديو</span>
                  </div>
                );
              }
              if (m._type === 'audio') {
                return (
                  <div key={m.id || i} className="yamg-media-cell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 4, padding: 8 }}>
                    <span style={{ fontSize: 32 }}>🎵</span>
                    <span className="ic-overlay" style={{ position: 'static' }}>صوت</span>
                  </div>
                );
              }
              return (
                <a
                  key={m.id || i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="yamg-media-cell"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 4, padding: 8, textDecoration: 'none', color: 'white' }}
                >
                  <span style={{ fontSize: 32 }}>📎</span>
                  <span style={{ fontSize: 10, textAlign: 'center', wordBreak: 'break-all' }}>
                    {(m.filename || m.name || 'ملف').slice(0, 18)}
                  </span>
                </a>
              );
            })}
          </div>
        )}

        {preview && (
          <div
            onClick={() => setPreview(null)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,.92)',
              zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
            }}
          >
            {preview._type === 'video' ? (
              <video src={preview.url || preview.media_url} controls autoPlay style={{ maxWidth: '95%', maxHeight: '90vh' }} />
            ) : (
              <img src={preview.url || preview.media_url} alt="" style={{ maxWidth: '95%', maxHeight: '90vh', borderRadius: 12 }} />
            )}
            <button
              onClick={(e) => { e.stopPropagation(); setPreview(null); }}
              style={{
                position: 'fixed', top: 20, left: 20,
                background: 'rgba(255,255,255,.15)', color: 'white', border: 0,
                width: 40, height: 40, borderRadius: '50%', cursor: 'pointer', fontSize: 20
              }}
            >✕</button>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default GroupMediaGallery;

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout.jsx';
import GroupSubHeader from '../../components/groups/GroupSubHeader.jsx';
import { listGroupMentions, markMentionRead, getGroupDetails } from '../../api/groups.js';
import '../../styles/groups-features.css';

const GroupMentions = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();

  const [mentions, setMentions] = useState([]);
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all|unread

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const [m, det] = await Promise.allSettled([
          listGroupMentions(groupId, { limit: 100 }),
          getGroupDetails(groupId),
        ]);
        if (cancelled) return;
        if (m.status === 'fulfilled') {
          const list = Array.isArray(m.value?.data) ? m.value.data : (m.value?.data?.mentions || []);
          setMentions(list);
        }
        if (det.status === 'fulfilled') setGroup(det.value?.data || null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [groupId]);

  const handleOpen = async (m) => {
    if (!m.read) {
      setMentions((p) => p.map((x) => x.id === m.id ? { ...x, read: true } : x));
      try { await markMentionRead(groupId, m.id); } catch {/* ignore */}
    }
    if (m.message_id) {
      navigate(`/groups/${groupId}/chat?msg=${encodeURIComponent(m.message_id)}`);
    } else {
      navigate(`/groups/${groupId}/chat`);
    }
  };

  const markAll = async () => {
    const unread = mentions.filter((m) => !m.read);
    setMentions((p) => p.map((x) => ({ ...x, read: true })));
    for (const m of unread) {
      try { await markMentionRead(groupId, m.id); } catch {/* ignore */}
    }
  };

  const filtered = filter === 'unread' ? mentions.filter((m) => !m.read) : mentions;
  const unreadCount = mentions.filter((m) => !m.read).length;

  return (
    <MainLayout>
      <div className="yamg-page" dir="rtl">
        <GroupSubHeader
          title={`الإشارات في ${group?.name || 'المجموعة'}`}
          subtitle={`${unreadCount} غير مقروءة من ${mentions.length}`}
          action={unreadCount > 0 && (
            <button className="yamg-btn secondary" onClick={markAll}>تعليم الكل كمقروء</button>
          )}
        />

        <div className="yamg-media-tabs">
          <div className={`tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>الكل ({mentions.length})</div>
          <div className={`tab ${filter === 'unread' ? 'active' : ''}`} onClick={() => setFilter('unread')}>غير مقروء ({unreadCount})</div>
        </div>

        {loading ? (
          <div className="yamg-loading"><div className="yamg-spinner" />جاري التحميل...</div>
        ) : filtered.length === 0 ? (
          <div className="yamg-empty">
            <span className="ic">@</span>
            {filter === 'unread' ? 'لا توجد إشارات جديدة.' : 'لم يُشر إليك في هذه المجموعة بعد.'}
          </div>
        ) : (
          filtered.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`yamg-mention ${m.read ? '' : 'unread'}`}
              onClick={() => handleOpen(m)}
              style={{ textAlign: 'right', width: '100%' }}
            >
              <img
                src={m.from_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.from || 'u'}`}
                alt=""
                style={{ width: 40, height: 40, borderRadius: '50%' }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="who">@{m.from || m.from_user || 'مستخدم'}</div>
                <div className="txt">{m.text || m.message_preview || m.content || 'ذكرك في رسالة'}</div>
                <div className="meta">
                  {m.created_at ? new Date(m.created_at).toLocaleString('ar-EG') : ''}
                  {!m.read && <span className="yamg-tag" style={{ marginInlineStart: 8 }}>جديد</span>}
                </div>
              </div>
              <span style={{ alignSelf: 'center', color: 'var(--yamg-muted)' }}>←</span>
            </button>
          ))
        )}
      </div>
    </MainLayout>
  );
};

export default GroupMentions;

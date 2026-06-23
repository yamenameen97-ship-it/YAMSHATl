import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout.jsx';
import GroupSubHeader from '../../components/groups/GroupSubHeader.jsx';
import {
  discoverGroups, getTrendingGroups, searchGroups, joinGroup, createJoinRequest,
} from '../../api/groups.js';
import { useToast } from '../../components/admin/ToastProvider.jsx';
import '../../styles/groups-features.css';

const CATEGORIES = [
  { id: 'all',     label: 'الكل',      icon: '✨' },
  { id: 'trending',label: 'الرائج',    icon: '🔥' },
  { id: 'study',   label: 'دراسة',     icon: '🎓' },
  { id: 'tech',    label: 'تقنية',     icon: '💻' },
  { id: 'games',   label: 'ألعاب',     icon: '🎮' },
  { id: 'design',  label: 'تصميم',     icon: '🖋️' },
  { id: 'sports',  label: 'رياضة',     icon: '⚽' },
  { id: 'music',   label: 'موسيقى',    icon: '🎵' },
  { id: 'business',label: 'أعمال',     icon: '💼' },
  { id: 'fun',     label: 'ترفيه',     icon: '😄' },
];

const GroupDiscover = () => {
  const navigate = useNavigate();
  const { pushToast } = useToast();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');
  const [joining, setJoining] = useState({});

  const load = async () => {
    try {
      setLoading(true);
      let res;
      if (category === 'trending') {
        res = await getTrendingGroups(40);
      } else if (category === 'all') {
        res = await discoverGroups({ limit: 60 });
      } else {
        res = await discoverGroups({ category, limit: 60 });
      }
      const list = Array.isArray(res?.data) ? res.data : (res?.data?.groups || []);
      setItems(list);
    } catch {
      setItems([]);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [category]);

  // بحث
  useEffect(() => {
    const q = query.trim();
    if (!q) return;
    const h = setTimeout(async () => {
      try {
        const res = await searchGroups(q, 40);
        const list = Array.isArray(res?.data) ? res.data : (res?.data?.groups || []);
        if (list.length) setItems(list);
      } catch { /* keep silent */ }
    }, 350);
    return () => clearTimeout(h);
  }, [query]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((g) =>
      String(g.name || '').toLowerCase().includes(q)
      || String(g.description || g.desc || '').toLowerCase().includes(q)
    );
  }, [items, query]);

  const handleJoin = async (g) => {
    if (joining[g.id]) return;
    setJoining((s) => ({ ...s, [g.id]: true }));
    try {
      if (g.privacy === 'private') {
        await createJoinRequest(g.id, {});
        pushToast?.({ type: 'success', title: 'تم إرسال طلب الانضمام', description: 'بانتظار موافقة المشرفين.' });
      } else {
        await joinGroup(g.id);
        pushToast?.({ type: 'success', title: 'انضممت إلى المجموعة' });
        navigate(`/groups/${g.id}/chat`);
      }
    } catch (e) {
      pushToast?.({ type: 'error', title: 'تعذر الانضمام', description: e?.message });
    } finally {
      setJoining((s) => ({ ...s, [g.id]: false }));
    }
  };

  return (
    <MainLayout>
      <div className="yamg-page" dir="rtl">
        <GroupSubHeader
          title="اكتشف مجموعات"
          subtitle="انضم لمجتمعات تشاركك اهتماماتك"
          action={
            <button className="yamg-btn" onClick={() => navigate('/groups/wizard')}>
              + إنشاء مجموعة
            </button>
          }
        />

        <div className="yamg-card" style={{ padding: 12 }}>
          <input
            className="yamg-input"
            placeholder="🔍 ابحث باسم المجموعة أو الوصف..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            dir="rtl"
          />
        </div>

        <div className="yamg-trending-bar">
          {CATEGORIES.map((c) => (
            <div
              key={c.id}
              className={`yamg-trending-pill ${category === c.id ? 'active' : ''}`}
              onClick={() => { setCategory(c.id); setQuery(''); }}
            >
              {c.icon} {c.label}
            </div>
          ))}
        </div>

        {loading ? (
          <div className="yamg-loading"><div className="yamg-spinner" />جاري التحميل...</div>
        ) : filtered.length === 0 ? (
          <div className="yamg-empty">
            <span className="ic">🔭</span>
            لا توجد مجموعات لعرضها في هذا التصنيف.
          </div>
        ) : (
          <div className="yamg-discover-grid">
            {filtered.map((g) => (
              <article key={g.id} className="yamg-card yamg-discover-card">
                <div className="yamg-discover-cover">
                  {g.cover_image_url ? <img src={g.cover_image_url} alt="" /> : (
                    <div style={{
                      width: '100%', height: '100%', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', fontSize: 60
                    }}>{g.icon || '👥'}</div>
                  )}
                  {g.verified && (
                    <span className="yamg-tag success" style={{ position: 'absolute', top: 10, right: 10 }}>✓ موثّقة</span>
                  )}
                  {category === 'trending' && (
                    <span className="yamg-tag warning" style={{ position: 'absolute', top: 10, left: 10 }}>🔥 رائج</span>
                  )}
                </div>
                <div className="yamg-discover-body">
                  <h3>{g.name}</h3>
                  <p>{g.description || g.desc || 'لا يوجد وصف.'}</p>
                  <div className="yamg-row" style={{ fontSize: 12, color: 'var(--yamg-muted)' }}>
                    <span>👥 {g.members_count || g.members || 0} عضو</span>
                    {g.privacy && <span className="yamg-tag">{g.privacy === 'public' ? '🌐 عامة' : g.privacy === 'private' ? '🔒 خاصة' : '🔐 سرّية'}</span>}
                  </div>
                  <div className="yamg-discover-foot">
                    <button
                      className="yamg-btn secondary"
                      onClick={() => navigate(`/groups/${g.id}/chat`)}
                    >معاينة</button>
                    <button
                      className="yamg-btn"
                      onClick={() => handleJoin(g)}
                      disabled={joining[g.id]}
                    >
                      {joining[g.id] ? '...' : g.privacy === 'private' ? 'طلب انضمام' : 'انضم الآن'}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default GroupDiscover;

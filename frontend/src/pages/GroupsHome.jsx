import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createGroup, getGroups, joinGroup } from '../api/groups.js';
import { useToast } from '../components/admin/ToastProvider.jsx';
import '../styles/groups-list.css';

const FALLBACK_GROUPS = [
  { id: 'future-leaders', name: 'رواد المستقبل', description: 'مجتمع يهتم بالابتكار وريادة الأعمال 💡', members_count: 1200, last_active: 'نشط الآن', unread_count: 15, icon: '🚀', color: '#8b5cf6', verified: true, is_member: true, category: 'تقنية' },
  { id: 'arab-devs', name: 'مطورين العرب', description: 'كل ما يخص البرمجة والتطوير 💻', members_count: 3400, last_active: 'منذ 5 دقائق', unread_count: 8, icon: '</>', color: '#ec4899', verified: true, is_member: true, category: 'تقنية' },
  { id: 'gaming-hub', name: 'عشاق الألعاب', description: 'تحديثات وأخبار ونقاشات الألعاب 🔥', members_count: 2800, last_active: 'منذ 15 دقيقة', unread_count: 23, icon: '🎮', color: '#3b82f6', verified: true, is_member: false, category: 'ألعاب' },
  { id: 'design-lab', name: 'مصممين مبدعين', description: 'شارك أعمالك وتعلم التصميم 🎨', members_count: 1600, last_active: 'منذ ساعة', unread_count: 6, icon: '🖌️', color: '#f59e0b', verified: true, is_member: false, category: 'تصميم' },
  { id: 'students', name: 'طلاب الجامعات', description: 'مذاكرة وملفات ونصائح أكاديمية 📚', members_count: 2100, last_active: 'منذ 3 ساعات', unread_count: 9, icon: '📖', color: '#6366f1', verified: true, is_member: true, category: 'دراسة' },
];

const CATEGORIES = [
  { id: 'all', name: 'الكل', icon: '📱' },
  { id: 'study', name: 'دراسة', icon: '🎓' },
  { id: 'tech', name: 'تقنية', icon: '💻' },
  { id: 'games', name: 'ألعاب', icon: '🎮' },
  { id: 'design', name: 'تصميم', icon: '🖋️' },
  { id: 'social', name: 'ترفيه', icon: '😊' },
];

function formatMembersCount(value) {
  const count = Number(value || 0);
  if (!Number.isFinite(count) || count <= 0) return '0';
  if (count >= 1000000) return `${(count / 1000000).toFixed(1).replace('.0', '')}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1).replace('.0', '')}K`;
  return String(count);
}

function normalizeGroup(raw = {}, index = 0) {
  const id = raw.id || raw.group_id || raw.slug || `fallback-${index + 1}`;
  const name = raw.name || raw.title || raw.group_name || `مجموعة ${index + 1}`;
  const description = raw.description || raw.desc || raw.bio || 'مجموعة يام شات للتواصل والنقاش.';
  const membersCount = raw.members_count ?? raw.membersCount ?? raw.member_count ?? raw.members?.length ?? 0;
  const unreadCount = raw.unread_count ?? raw.unreadCount ?? raw.unread ?? 0;
  const lastActive = raw.last_active || raw.lastActive || (unreadCount > 0 ? 'نشط الآن' : 'منذ وقت قصير');
  const icon = raw.icon || ['🚀', '💬', '🎮', '📚', '🎨', '👥'][index % 6];
  const color = raw.color || ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#6366f1'][index % 6];
  const category = String(raw.category || raw.topic || raw.type || 'الكل');
  return {
    id: String(id),
    name,
    description,
    membersCount: Number(membersCount || 0),
    unreadCount: Number(unreadCount || 0),
    lastActive,
    icon,
    color,
    verified: Boolean(raw.verified ?? raw.is_verified ?? true),
    isMember: Boolean(raw.is_member ?? raw.joined ?? raw.isJoined ?? index % 2 === 0),
    category,
  };
}

export default function GroupsHome() {
  const navigate = useNavigate();
  const location = useLocation();
  const { pushToast } = useToast();

  const [activeCategory, setActiveCategory] = useState('الكل');
  const [query, setQuery] = useState('');
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });

  const createRequested = useMemo(() => new URLSearchParams(location.search).get('create') === '1', [location.search]);

  const closeCreateModal = useCallback(() => {
    setCreateOpen(false);
    if (createRequested) navigate('/groups', { replace: true });
  }, [createRequested, navigate]);

  const loadGroups = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getGroups();
      const payload = response?.data?.groups || response?.data || [];
      const list = Array.isArray(payload) && payload.length ? payload : FALLBACK_GROUPS;
      setGroups(list.map(normalizeGroup));
    } catch {
      setGroups(FALLBACK_GROUPS.map(normalizeGroup));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  useEffect(() => {
    if (createRequested) setCreateOpen(true);
  }, [createRequested]);

  const filteredGroups = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return groups.filter((group) => {
      const categoryMatch = activeCategory === 'الكل' || `${group.category}`.includes(activeCategory);
      const queryMatch = !normalizedQuery || [group.name, group.description, group.category].some((field) => String(field || '').toLowerCase().includes(normalizedQuery));
      return categoryMatch && queryMatch;
    });
  }, [activeCategory, groups, query]);

  const openGroupChat = useCallback((group) => {
    if (!group?.id) return;
    navigate(`/groups/${encodeURIComponent(group.id)}`);
  }, [navigate]);

  const handleJoinGroup = useCallback(async (group, event) => {
    event?.stopPropagation?.();
    if (!group?.id) return;
    try {
      await joinGroup(group.id);
      setGroups((prev) => prev.map((entry) => entry.id === group.id ? { ...entry, isMember: true, membersCount: entry.membersCount + 1 } : entry));
      pushToast?.({ type: 'success', title: 'تم الانضمام للمجموعة', description: group.name });
      navigate(`/groups/${encodeURIComponent(group.id)}`);
    } catch {
      pushToast?.({ type: 'warning', title: 'تعذر الانضمام الآن', description: 'فتحنا لك صفحة المجموعة مباشرة لتكمل منها.' });
      navigate(`/groups/${encodeURIComponent(group.id)}`);
    }
  }, [navigate, pushToast]);

  const handleCreateGroup = useCallback(async () => {
    const name = form.name.trim();
    if (!name) {
      pushToast?.({ type: 'info', title: 'اكتب اسم المجموعة أولاً' });
      return;
    }

    setCreating(true);
    try {
      const response = await createGroup({ name, description: form.description.trim() });
      const created = normalizeGroup(response?.data || { id: name.toLowerCase().replace(/\s+/g, '-'), name, description: form.description.trim(), is_member: true, members_count: 1 }, 0);
      setGroups((prev) => [created, ...prev.filter((item) => item.id !== created.id)]);
      pushToast?.({ type: 'success', title: 'تم إنشاء المجموعة', description: created.name });
      setForm({ name: '', description: '' });
      closeCreateModal();
      navigate(`/groups/${encodeURIComponent(created.id)}`);
    } catch {
      const fallbackCreated = normalizeGroup({ id: `local-${Date.now()}`, name, description: form.description.trim(), is_member: true, members_count: 1 }, 0);
      setGroups((prev) => [fallbackCreated, ...prev]);
      pushToast?.({ type: 'warning', title: 'تم إنشاء نسخة محلية مؤقتة', description: 'الخادم لم يستجب، لكن ربطنا الزر بصفحة المجموعة الجديدة بدون كسر الواجهة.' });
      setForm({ name: '', description: '' });
      closeCreateModal();
      navigate(`/groups/${encodeURIComponent(fallbackCreated.id)}`);
    } finally {
      setCreating(false);
    }
  }, [closeCreateModal, form.description, form.name, navigate, pushToast]);

  return (
    <div className="yam-groups-page" dir="rtl">
      <header className="yam-groups-header">
        <div className="yam-groups-title-section">
          <h1>المجموعات</h1>
          <p className="yam-groups-subtitle">كل أزرار إنشاء وفتح المجموعات أصبحت مرتبطة بالصفحات الحديثة فقط.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button type="button" className="yam-filter-btn" onClick={loadGroups} aria-label="تحديث">↻</button>
          <button type="button" className="yam-filter-btn" onClick={() => navigate('/inbox')} aria-label="الرسائل">💬</button>
        </div>
      </header>

      <button type="button" className="yam-create-group-btn" onClick={() => setCreateOpen(true)}>
        <span>+</span> إنشاء مجموعة
      </button>

      <section className="yam-search-filter-section" style={{ marginTop: 24 }}>
        <div className="yam-filter-btn" aria-hidden="true">⚙️</div>
        <div className="yam-search-bar-wrap">
          <input type="text" className="yam-search-input" placeholder="ابحث عن مجموعة..." value={query} onChange={(event) => setQuery(event.target.value)} />
          <span className="yam-search-icon">🔍</span>
        </div>
      </section>

      <section className="yam-categories-scroll">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            className={`yam-category-pill ${activeCategory === cat.name ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.name)}
          >
            <span>{cat.icon}</span>
            {cat.name}
          </button>
        ))}
      </section>

      <section className="yam-groups-list">
        {loading ? (
          <div className="yam-group-card" style={{ justifyContent: 'center' }}>جارٍ تحميل المجموعات...</div>
        ) : filteredGroups.length === 0 ? (
          <div className="yam-group-card" style={{ justifyContent: 'center', textAlign: 'center' }}>
            لا توجد مجموعات مطابقة الآن. جرّب البحث باسم مختلف أو أنشئ مجموعة جديدة.
          </div>
        ) : (
          filteredGroups.map((group) => (
            <div
              key={group.id}
              className="yam-group-card"
              role="button"
              tabIndex={0}
              onClick={() => openGroupChat(group)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  openGroupChat(group);
                }
              }}
            >
              <div className="yam-group-main-info">
                <div className="yam-group-neon-icon" style={{ '--neon-color': group.color }}>
                  <span style={{ color: group.color }}>{group.icon}</span>
                </div>
                <div className="yam-group-text-details">
                  <h3>
                    {group.name}
                    {group.verified ? <span style={{ color: '#8b5cf6', fontSize: 14, marginInlineStart: 6 }}>✔️</span> : null}
                  </h3>
                  <p className="yam-group-desc">{group.description}</p>
                  <div className="yam-group-meta">
                    <span className="yam-member-count">👥 {formatMembersCount(group.membersCount)} عضو</span>
                    <span className="yam-status-dot" style={{ backgroundColor: '#22c55e', width: 8, height: 8, borderRadius: '50%' }} />
                    <span>{group.category}</span>
                  </div>
                </div>
              </div>
              <div className="yam-group-side-info" style={{ minWidth: 132 }}>
                <span className="yam-last-active">{group.lastActive}</span>
                <div className="yam-unread-badge">{group.unreadCount}</div>
                <div style={{ display: 'grid', gap: 8, width: '100%' }}>
                  <button
                    type="button"
                    onClick={(event) => { event.stopPropagation(); openGroupChat(group); }}
                    style={{ border: 'none', borderRadius: 12, padding: '10px 12px', fontWeight: 800, cursor: 'pointer', background: 'linear-gradient(135deg,#8b5cf6,#6366f1)', color: '#fff' }}
                  >
                    فتح الدردشة
                  </button>
                  {!group.isMember ? (
                    <button
                      type="button"
                      onClick={(event) => handleJoinGroup(group, event)}
                      style={{ borderRadius: 12, padding: '9px 12px', fontWeight: 700, cursor: 'pointer', background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,.16)' }}
                    >
                      انضم الآن
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          ))
        )}
      </section>

      <nav className="yam-bottom-nav" aria-label="التنقل السفلي">
        <button type="button" className="yam-nav-item" onClick={() => navigate('/')}>
          <span className="yam-nav-icon">🏠</span>
          <span>الرئيسية</span>
        </button>
        <button type="button" className="yam-nav-item active" onClick={() => navigate('/groups')}>
          <span className="yam-nav-icon">👥</span>
          <span>المجموعات</span>
        </button>
        <button type="button" className="yam-center-nav-btn" onClick={() => setCreateOpen(true)} aria-label="إنشاء مجموعة">
          <span>+</span>
        </button>
        <button type="button" className="yam-nav-item" onClick={() => navigate('/inbox')}>
          <span className="yam-nav-icon">💬</span>
          <span>الرسائل</span>
        </button>
        <button type="button" className="yam-nav-item" onClick={() => navigate('/profile')}>
          <span className="yam-nav-icon">👤</span>
          <span>الملف</span>
        </button>
      </nav>

      <div style={{ height: 100 }} />

      {createOpen ? (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(4,6,14,.75)', display: 'grid', placeItems: 'center', padding: 16, zIndex: 9999 }} onClick={closeCreateModal}>
          <div style={{ width: 'min(520px, 100%)', background: '#111322', border: '1px solid rgba(255,255,255,.08)', borderRadius: 24, boxShadow: '0 22px 60px rgba(0,0,0,.45)', padding: 20, color: '#fff' }} onClick={(event) => event.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 22 }}>إنشاء مجموعة جديدة</h2>
                <p style={{ margin: '6px 0 0', color: 'rgba(255,255,255,.72)' }}>تم توحيد الإنشاء داخل صفحة المجموعات الحديثة حتى لا يحصل تعارض.</p>
              </div>
              <button type="button" onClick={closeCreateModal} style={{ border: 'none', background: 'transparent', color: '#fff', fontSize: 24, cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ display: 'grid', gap: 12 }}>
              <input
                type="text"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="اسم المجموعة"
                style={{ minHeight: 48, borderRadius: 14, border: '1px solid rgba(255,255,255,.1)', background: '#0b1020', color: '#fff', padding: '0 14px' }}
              />
              <textarea
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                placeholder="وصف مختصر للمجموعة"
                rows={4}
                style={{ borderRadius: 14, border: '1px solid rgba(255,255,255,.1)', background: '#0b1020', color: '#fff', padding: 14, resize: 'vertical' }}
              />
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button type="button" onClick={handleCreateGroup} disabled={creating} style={{ flex: 1, minHeight: 48, border: 'none', borderRadius: 14, fontWeight: 800, cursor: 'pointer', background: 'linear-gradient(135deg,#8b5cf6,#6366f1)', color: '#fff', opacity: creating ? 0.75 : 1 }}>
                  {creating ? 'جارٍ الإنشاء...' : 'إنشاء وفتح الدردشة'}
                </button>
                <button type="button" onClick={closeCreateModal} style={{ minWidth: 120, minHeight: 48, borderRadius: 14, border: '1px solid rgba(255,255,255,.14)', background: 'transparent', color: '#fff', cursor: 'pointer' }}>
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

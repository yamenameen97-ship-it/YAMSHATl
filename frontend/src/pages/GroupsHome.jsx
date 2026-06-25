import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout.jsx';
import { getGroups, searchGroups } from '../api/groups.js';
import '../styles/groups-list.css';

/**
 * GroupsHome — v2 مُصلحة
 * --------------------
 * إصلاحات:
 *  - حقل البحث أصبح فعّالاً (مرتبط بـ state ويفلتر القائمة + يستدعي searchGroups عند الكتابة).
 *  - زر الفلتر/الإعدادات لم يعد يذهب لمسار خاطئ (يفتح فلاتر التصنيفات بدل /groups/settings بدون id).
 *  - زر "⋮" داخل البطاقة يذهب لإعدادات المجموعة الخاصة بها فقط (آمن).
 *  - حالة "لا نتائج للبحث" منفصلة عن "لا توجد مجموعات".
 */
const GroupsHome = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('الكل');
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(true);
  // ✅ FIX v59.13.4: احتفظ بالقائمة الأصلية + seq لتجنب race condition في البحث
  const baseGroupsRef = useRef([]);
  const searchSeqRef = useRef(0);

  const categories = [
    { id: 1, name: 'الكل', icon: '📱' },
    { id: 2, name: 'دراسة', icon: '🎓' },
    { id: 3, name: 'تقنية', icon: '💻' },
    { id: 4, name: 'ألعاب', icon: '🎮' },
    { id: 5, name: 'تصميم', icon: '🖋️' },
    { id: 6, name: 'ترفيه', icon: '😊' }
  ];

  useEffect(() => {
    let cancelled = false;
    const fetchGroups = async () => {
      try {
        setLoading(true);
        const response = await getGroups();
        if (cancelled) return;
        const groupsData = Array.isArray(response.data) ? response.data : (response.data?.items || []);
        baseGroupsRef.current = groupsData;
        setGroups(groupsData);
      } catch (err) {
        if (cancelled) return;
        console.error('Error fetching groups:', err);
        setError('تعذر تحميل المجموعات. يرجى المحاولة مرة أخرى.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchGroups();
    return () => { cancelled = true; };
  }, []);

  // ✅ FIX v59.13.4: بحث مع debounce + حماية من race condition + إعادة للأصل عند المسح
  // المشكلة السابقة:
  //  (أ) عند مسح البحث كانت القائمة تبقى مدمجة مع نتائج البحث
  //  (ب) تتابع بحث سريع يجعل نتيجة أقدم تصل بعد الأحدث فتطؼي عليها
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      // إعادة للقائمة الأصلية
      if (baseGroupsRef.current.length) setGroups(baseGroupsRef.current);
      return undefined;
    }
    const mySeq = ++searchSeqRef.current;
    const handle = setTimeout(async () => {
      try {
        const res = await searchGroups(q, 50);
        // تجاهل الاستجابة إذا بدأ بحث أحدث أو أُلغي البحث
        if (mySeq !== searchSeqRef.current) return;
        const data = res?.data?.groups || res?.data || [];
        if (Array.isArray(data) && data.length) {
          // ادمج مع الأصل لا مع الحالة السابقة (حتى لا تتراكم نتائج بحوث سابقة)
          const map = new Map(baseGroupsRef.current.map((g) => [String(g.id), g]));
          for (const g of data) map.set(String(g.id), { ...map.get(String(g.id)), ...g });
          setGroups(Array.from(map.values()));
        }
      } catch { /* fallback للبحث المحلي فقط */ }
    }, 400);
    return () => clearTimeout(handle);
  }, [searchQuery]);

  const filteredGroups = useMemo(() => {
    const byCategory = activeCategory === 'الكل'
      ? groups
      : groups.filter((g) => g.category === activeCategory);
    const q = searchQuery.trim().toLowerCase();
    if (!q) return byCategory;
    return byCategory.filter((g) =>
      String(g.name || '').toLowerCase().includes(q) ||
      String(g.description || g.desc || '').toLowerCase().includes(q)
    );
  }, [groups, activeCategory, searchQuery]);

  return (
    <MainLayout>
      <div className="yam-groups-page" dir="rtl" style={{ fontFamily: "'Noto Sans Arabic','Cairo','Tahoma',sans-serif" }}>
        <header className="yam-groups-header">
          <div className="yam-groups-title-section">
            <h1>المجموعات</h1>
            <p className="yam-groups-subtitle">تواصل، شارك، وكن جزءاً من المجتمع ✨</p>
          </div>
        </header>

        {/* v59.13 — أزرار الإنشاء تشمل الآن إنشاء غرفة صوتية بشكل صريح */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="yam-create-group-btn" onClick={() => navigate('/groups/wizard')}>
            <span>👥</span> إنشاء مجموعة
          </button>
          <button
            className="yam-create-group-btn"
            style={{ background: 'linear-gradient(135deg, #22c55e, #10b981)' }}
            onClick={() => navigate('/voice?create=1')}
            aria-label="إنشاء غرفة صوتية"
          >
            <span>🎙️</span> إنشاء غرفة صوتية
          </button>
          <button
            className="yam-create-group-btn"
            style={{ background: 'linear-gradient(135deg, #22d3ee, #0ea5e9)' }}
            onClick={() => navigate('/groups/discover')}
          >
            <span>🔭</span> اكتشف مجموعات
          </button>
        </div>

        {/* v59.13 — وصول سريع لصفحة الغرف الصوتية */}
        <button
          type="button"
          onClick={() => navigate('/voice')}
          className="yam-voicerooms-card"
          aria-label="الغرف الصوتية"
        >
          <div className="yam-voicerooms-icon">🎙️</div>
          <div className="yam-voicerooms-text">
            <strong>الغرف الصوتية</strong>
            <small>انضمّ إلى غرف صوتية مباشرة أو أنشئ غرفتك</small>
          </div>
          <span className="yam-voicerooms-arrow" aria-hidden="true">‹</span>
        </button>

        <style>{`
          .yam-voicerooms-card {
            display: flex;
            align-items: center;
            gap: 14px;
            width: 100%;
            margin-top: 16px;
            padding: 14px 16px;
            background: linear-gradient(135deg, rgba(34,197,94,0.12), rgba(16,185,129,0.08));
            border: 1px solid rgba(34,197,94,0.35);
            border-radius: 16px;
            color: #E5E7EB;
            cursor: pointer;
            font-family: inherit;
            text-align: right;
            transition: background 0.2s ease, transform 0.15s ease, border-color 0.2s ease;
          }
          .yam-voicerooms-card:hover {
            background: linear-gradient(135deg, rgba(34,197,94,0.18), rgba(16,185,129,0.14));
            border-color: rgba(34,197,94,0.6);
            transform: translateY(-1px);
          }
          .yam-voicerooms-icon {
            width: 48px;
            height: 48px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border-radius: 14px;
            background: linear-gradient(135deg, #22c55e, #10b981);
            font-size: 24px;
            box-shadow: 0 6px 16px rgba(16,185,129,0.35);
            flex-shrink: 0;
          }
          .yam-voicerooms-text {
            display: flex;
            flex-direction: column;
            gap: 2px;
            flex: 1;
            min-width: 0;
          }
          .yam-voicerooms-text strong {
            font-size: 15px;
            font-weight: 800;
            color: #F4F4F5;
          }
          .yam-voicerooms-text small {
            font-size: 12.5px;
            color: #94A3B8;
            font-weight: 500;
          }
          .yam-voicerooms-arrow {
            color: #22c55e;
            font-size: 28px;
            font-weight: 800;
            line-height: 1;
            transform: rotate(180deg);
          }
        `}</style>

        {/* البحث */}
        {/* ✅ v59.13.15 FIX #1: تحويل الـ divs غير الدلالية إلى عناصر <button>/<form>
            مع دعم كامل لـ keyboard a11y + إرسال البحث بمفتاح Enter + role/aria صحيحة. */}
        <section className="yam-search-filter-section" style={{ marginTop: '24px' }}>
          <button
            type="button"
            className="yam-filter-btn"
            onClick={() => setShowFilters((v) => !v)}
            title="إظهار/إخفاء التصنيفات"
            aria-label="إظهار/إخفاء التصنيفات"
            aria-expanded={showFilters}
            aria-controls="yam-groups-categories"
          >
            <span aria-hidden="true">⚙️</span>
          </button>
          <form
            className="yam-search-bar-wrap"
            role="search"
            onSubmit={(e) => { e.preventDefault(); /* البحث تلقائي عبر debounce */ }}
          >
            <label htmlFor="yam-groups-search" className="sr-only" style={{
              position: 'absolute', width: 1, height: 1, padding: 0, margin: -1,
              overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0,
            }}>ابحث عن مجموعة</label>
            <input
              id="yam-groups-search"
              type="search"
              className="yam-search-input"
              placeholder="ابحث عن مجموعة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              dir="rtl"
              enterKeyHint="search"
              aria-label="بحث في المجموعات"
              autoComplete="off"
            />
            <span className="yam-search-icon" aria-hidden="true">🔍</span>
          </form>
        </section>

        {/* التصنيفات */}
        {showFilters && (
          <section
            id="yam-groups-categories"
            className="yam-categories-scroll"
            role="tablist"
            aria-label="تصنيفات المجموعات"
          >
            {categories.map((cat) => {
              const isActive = activeCategory === cat.name;
              return (
                <button
                  key={cat.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  tabIndex={isActive ? 0 : -1}
                  className={`yam-category-pill ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat.name)}
                  onKeyDown={(e) => {
                    // تنقل بأسهم لوحة المفاتيح بين التصنيفات (مع احترام RTL)
                    const dir = e.currentTarget.closest('[dir="rtl"]') ? -1 : 1;
                    const idx = categories.findIndex((c) => c.name === activeCategory);
                    let next = -1;
                    if (e.key === 'ArrowRight') next = idx + dir;
                    else if (e.key === 'ArrowLeft') next = idx - dir;
                    else if (e.key === 'Home') next = 0;
                    else if (e.key === 'End') next = categories.length - 1;
                    if (next >= 0 && next < categories.length) {
                      e.preventDefault();
                      setActiveCategory(categories[next].name);
                      const root = e.currentTarget.parentElement;
                      const btns = root?.querySelectorAll('.yam-category-pill');
                      try { btns?.[next]?.focus(); } catch { /* ignore */ }
                    }
                  }}
                  aria-label={`تصنيف ${cat.name}`}
                >
                  <span aria-hidden="true">{cat.icon}</span>
                  {cat.name}
                </button>
              );
            })}
          </section>
        )}

        {/* قائمة المجموعات */}
        <section className="yam-groups-list">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>جاري التحميل...</div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#ef4444' }}>{error}</div>
          ) : filteredGroups.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
              {searchQuery.trim() ? 'لا توجد نتائج مطابقة لبحثك.' : 'لا توجد مجموعات حالياً.'}
            </div>
          ) : (
            filteredGroups.map((group) => {
              const openGroup = () => navigate(`/groups/${group.id}/chat`);
              const openSettings = (e) => {
                e?.stopPropagation?.();
                navigate(`/groups/${group.id}/settings`);
              };
              return (
                <div
                  key={group.id}
                  className="yam-group-card"
                  role="button"
                  tabIndex={0}
                  aria-label={`فتح مجموعة ${group.name}${group.unread_count > 0 ? `، ${group.unread_count} رسالة غير مقروءة` : ''}`}
                  onClick={openGroup}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      openGroup();
                    }
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="yam-group-main-info">
                    <div className="yam-group-neon-icon" style={{ '--neon-color': group.color || '#8b5cf6' }}>
                      <span style={{ color: group.color || '#8b5cf6' }} aria-hidden="true">{group.icon || '👥'}</span>
                    </div>
                    <div className="yam-group-text-details">
                      <h3>{group.name} {group.verified && <span style={{ color: '#8b5cf6', fontSize: '14px' }} aria-label="موثّقة">✔️</span>}</h3>
                      <p className="yam-group-desc">{group.description || group.desc || 'لا يوجد وصف للمجموعة'}</p>
                      <div className="yam-group-meta">
                        <span className="yam-member-count"><span aria-hidden="true">👥</span> {group.members_count || group.members || 0} عضو</span>
                        <span className="yam-status-dot" aria-hidden="true" style={{ backgroundColor: '#22c55e', width: '8px', height: '8px', borderRadius: '50%' }}></span>
                      </div>
                    </div>
                  </div>
                  <div className="yam-group-side-info">
                    <span className="yam-last-active">
                      {group.is_active && <span className="yam-active-dot" aria-hidden="true"></span>}
                      {group.last_active_human || 'نشط'}
                    </span>
                    {group.unread_count > 0 && (
                      <div className="yam-unread-badge" aria-label={`${group.unread_count} غير مقروء`}>{group.unread_count}</div>
                    )}
                    <button
                      type="button"
                      className="yam-more-btn"
                      onClick={openSettings}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openSettings(e); } }}
                      aria-label={`إعدادات مجموعة ${group.name}`}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      <span aria-hidden="true">⋮</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </section>
      </div>
    </MainLayout>
  );
};

export default GroupsHome;

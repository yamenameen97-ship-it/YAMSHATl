import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout.jsx';
import GroupSubHeader from '../../components/groups/GroupSubHeader.jsx';
import { listGroupEvents, createGroupEvent, getGroupDetails } from '../../api/groups.js';
import { useToast } from '../../components/admin/ToastProvider.jsx';
import { getCurrentUsername } from '../../utils/auth.js';
import '../../styles/groups-features.css';

const AR_MONTHS = ['ينا','فبر','مار','أبر','ماي','يون','يول','أغس','سبت','أكت','نوف','ديس'];

const fmtDate = (iso) => {
  if (!iso) return { d: '—', m: '' };
  try {
    const d = new Date(iso);
    return { d: d.getDate(), m: AR_MONTHS[d.getMonth()] };
  } catch { return { d: '—', m: '' }; }
};

const fmtTime = (iso) => {
  if (!iso) return '';
  try { return new Date(iso).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' }); }
  catch { return ''; }
};

const GroupEvents = () => {
  const { groupId } = useParams();
  const { pushToast } = useToast();
  const currentUser = getCurrentUsername();

  const [events, setEvents] = useState([]);
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    location: '',
    starts_at: '',
    ends_at: '',
  });

  const role = useMemo(() => {
    const m = group?.members?.find((x) => (x.username || x.user_id) === currentUser);
    return m?.role || 'member';
  }, [group, currentUser]);
  const canCreate = role !== 'member' || group?.settings?.members_can_create_events;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const [evs, det] = await Promise.allSettled([
          listGroupEvents(groupId),
          getGroupDetails(groupId),
        ]);
        if (cancelled) return;
        if (evs.status === 'fulfilled') {
          const list = Array.isArray(evs.value?.data) ? evs.value.data : (evs.value?.data?.events || []);
          const sorted = [...list].sort((a, b) => new Date(a.starts_at || 0) - new Date(b.starts_at || 0));
          setEvents(sorted);
        }
        if (det.status === 'fulfilled') setGroup(det.value?.data || null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [groupId]);

  const submit = async () => {
    if (!form.title.trim() || !form.starts_at) {
      pushToast?.({ type: 'error', title: 'بيانات ناقصة', description: 'العنوان وتاريخ البداية مطلوبان' });
      return;
    }
    setCreating(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        location: form.location.trim(),
        starts_at: new Date(form.starts_at).toISOString(),
        ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
      };
      const res = await createGroupEvent(groupId, payload);
      const ev = res?.data?.event || res?.data || { ...payload, id: `tmp-${Date.now()}` };
      setEvents((p) => [...p, ev].sort((a, b) => new Date(a.starts_at || 0) - new Date(b.starts_at || 0)));
      setForm({ title: '', description: '', location: '', starts_at: '', ends_at: '' });
      setShowForm(false);
      pushToast?.({ type: 'success', title: 'تم إنشاء الحدث' });
    } catch (e) {
      pushToast?.({ type: 'error', title: 'تعذر إنشاء الحدث', description: e?.message });
    } finally {
      setCreating(false);
    }
  };

  const now = Date.now();
  const upcoming = events.filter((e) => new Date(e.starts_at || 0).getTime() >= now);
  const past = events.filter((e) => new Date(e.starts_at || 0).getTime() < now);

  return (
    <MainLayout>
      <div className="yamg-page" dir="rtl">
        <GroupSubHeader
          title={`أحداث ${group?.name || 'المجموعة'}`}
          subtitle={`${upcoming.length} قادم · ${past.length} منتهٍ`}
          action={canCreate && (
            <button className="yamg-btn" onClick={() => setShowForm((v) => !v)}>
              {showForm ? '✕ إغلاق' : '+ حدث جديد'}
            </button>
          )}
        />

        {showForm && (
          <div className="yamg-card">
            <div className="yamg-col">
              <input
                className="yamg-input"
                placeholder="عنوان الحدث"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
              <textarea
                className="yamg-textarea"
                placeholder="وصف الحدث"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
              <input
                className="yamg-input"
                placeholder="الموقع (اختياري)"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
              <div className="yamg-row">
                <label style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: 'var(--yamg-muted)', marginBottom: 4 }}>يبدأ</div>
                  <input
                    type="datetime-local"
                    className="yamg-input"
                    value={form.starts_at}
                    onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
                  />
                </label>
                <label style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: 'var(--yamg-muted)', marginBottom: 4 }}>ينتهي</div>
                  <input
                    type="datetime-local"
                    className="yamg-input"
                    value={form.ends_at}
                    onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
                  />
                </label>
              </div>
              <div className="yamg-row" style={{ justifyContent: 'flex-end' }}>
                <button className="yamg-btn secondary" onClick={() => setShowForm(false)}>إلغاء</button>
                <button className="yamg-btn" onClick={submit} disabled={creating}>
                  {creating ? '...إنشاء' : 'إنشاء الحدث'}
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="yamg-loading"><div className="yamg-spinner" />جاري التحميل...</div>
        ) : events.length === 0 ? (
          <div className="yamg-empty">
            <span className="ic">📅</span>
            لا توجد أحداث بعد.
          </div>
        ) : (
          <>
            {upcoming.length > 0 && (
              <>
                <h3 style={{ fontSize: 14, color: 'var(--yamg-muted)', margin: '12px 4px' }}>القادمة</h3>
                {upcoming.map((ev) => {
                  const d = fmtDate(ev.starts_at);
                  return (
                    <article key={ev.id} className="yamg-card">
                      <div className="yamg-event-row">
                        <div className="yamg-event-date">
                          <div className="d">{d.d}</div>
                          <div className="m">{d.m}</div>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h4 style={{ margin: 0, fontSize: 15 }}>{ev.title}</h4>
                          <div className="yamg-event-meta">🕒 {fmtTime(ev.starts_at)}</div>
                          {ev.location && <div className="yamg-event-meta">📍 {ev.location}</div>}
                          {ev.description && <p style={{ marginTop: 8, fontSize: 13 }}>{ev.description}</p>}
                          <div className="yamg-row" style={{ marginTop: 8 }}>
                            <span className="yamg-tag success">قادم</span>
                            <span className="yamg-tag">{ev.rsvp_count || 0} مهتم</span>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </>
            )}
            {past.length > 0 && (
              <>
                <h3 style={{ fontSize: 14, color: 'var(--yamg-muted)', margin: '20px 4px 12px' }}>المنتهية</h3>
                {past.map((ev) => {
                  const d = fmtDate(ev.starts_at);
                  return (
                    <article key={ev.id} className="yamg-card" style={{ opacity: 0.7 }}>
                      <div className="yamg-event-row">
                        <div className="yamg-event-date">
                          <div className="d">{d.d}</div>
                          <div className="m">{d.m}</div>
                        </div>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ margin: 0, fontSize: 15 }}>{ev.title}</h4>
                          <div className="yamg-event-meta">🕒 {fmtTime(ev.starts_at)}</div>
                          <span className="yamg-tag">منتهٍ</span>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default GroupEvents;

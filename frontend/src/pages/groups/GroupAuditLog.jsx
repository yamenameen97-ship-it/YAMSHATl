import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout.jsx';
import GroupSubHeader from '../../components/groups/GroupSubHeader.jsx';
import { getGroupAuditLog, getGroupDetails } from '../../api/groups.js';
import { getCurrentUsername } from '../../utils/auth.js';
import '../../styles/groups-features.css';

const ACTION_META = {
  member_join:      { icon: '➕', label: 'انضمام عضو',     color: 'success' },
  member_leave:     { icon: '➖', label: 'مغادرة عضو',     color: 'muted'   },
  member_kick:      { icon: '🚪', label: 'طرد عضو',         color: 'danger'  },
  member_ban:       { icon: '⛔', label: 'حظر عضو',         color: 'danger'  },
  member_unban:     { icon: '✅', label: 'رفع حظر',         color: 'success' },
  member_mute:      { icon: '🔇', label: 'كتم عضو',         color: 'warning' },
  member_unmute:    { icon: '🔊', label: 'إلغاء كتم',       color: 'success' },
  role_change:      { icon: '👑', label: 'تغيير الصلاحية',  color: 'warning' },
  ownership_transfer: { icon: '🔑', label: 'نقل الملكية',    color: 'warning' },
  settings_update:  { icon: '⚙️', label: 'تحديث الإعدادات', color: 'muted'   },
  group_create:     { icon: '✨', label: 'إنشاء المجموعة',  color: 'success' },
  group_update:     { icon: '✏️', label: 'تحديث المجموعة',  color: 'muted'   },
  message_pin:      { icon: '📌', label: 'تثبيت رسالة',     color: 'warning' },
  message_unpin:    { icon: '📍', label: 'إلغاء تثبيت',     color: 'muted'   },
  message_delete:   { icon: '🗑️', label: 'حذف رسالة',      color: 'danger'  },
  message_report:   { icon: '🚩', label: 'بلاغ على رسالة',  color: 'danger'  },
  post_create:      { icon: '📝', label: 'منشور جديد',      color: 'success' },
  post_delete:      { icon: '🗑️', label: 'حذف منشور',      color: 'danger'  },
  post_pin:         { icon: '📌', label: 'تثبيت منشور',     color: 'warning' },
  event_create:     { icon: '📅', label: 'حدث جديد',        color: 'success' },
  poll_create:      { icon: '📊', label: 'استطلاع جديد',    color: 'success' },
  announcement:     { icon: '📢', label: 'إعلان',           color: 'warning' },
  invitation_send:  { icon: '✉️', label: 'إرسال دعوة',      color: 'muted'   },
  join_request:     { icon: '📩', label: 'طلب انضمام',      color: 'muted'   },
  rule_create:      { icon: '📜', label: 'إضافة قاعدة',     color: 'muted'   },
};

const GroupAuditLog = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const currentUser = getCurrentUsername();

  const [log, setLog] = useState([]);
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const [logRes, det] = await Promise.allSettled([
          getGroupAuditLog(groupId, { limit: 200 }),
          getGroupDetails(groupId),
        ]);
        if (cancelled) return;

        if (det.status === 'fulfilled') {
          const g = det.value?.data || null;
          setGroup(g);
          const m = g?.members?.find((x) => (x.username || x.user_id) === currentUser);
          const role = m?.role || 'member';
          if (role !== 'owner' && role !== 'admin') {
            setDenied(true);
          }
        }
        if (logRes.status === 'fulfilled') {
          const list = Array.isArray(logRes.value?.data)
            ? logRes.value.data
            : (logRes.value?.data?.items || logRes.value?.data?.entries || []);
          setLog(list);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [groupId, currentUser]);

  const categories = useMemo(() => {
    const set = new Set(log.map((e) => e.action || e.type || 'unknown'));
    return ['all', ...Array.from(set)];
  }, [log]);

  const filtered = useMemo(() => {
    if (filter === 'all') return log;
    return log.filter((e) => (e.action || e.type) === filter);
  }, [log, filter]);

  if (denied) {
    return (
      <MainLayout>
        <div className="yamg-page" dir="rtl">
          <GroupSubHeader title="سجل التدقيق" subtitle="غير مصرّح" />
          <div className="yamg-empty">
            <span className="ic">🔒</span>
            هذا السجل مخصّص للملّاك والمشرفين فقط.
            <div style={{ marginTop: 12 }}>
              <button className="yamg-btn secondary" onClick={() => navigate(`/groups/${groupId}/chat`)}>
                العودة للدردشة
              </button>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="yamg-page" dir="rtl">
        <GroupSubHeader
          title={`سجل التدقيق — ${group?.name || ''}`}
          subtitle={`${log.length} حدث مسجّل`}
        />

        {categories.length > 2 && (
          <div className="yamg-trending-bar">
            {categories.map((c) => {
              const meta = ACTION_META[c];
              return (
                <div
                  key={c}
                  className={`yamg-trending-pill ${filter === c ? 'active' : ''}`}
                  onClick={() => setFilter(c)}
                >
                  {c === 'all' ? `الكل (${log.length})` : `${meta?.icon || '•'} ${meta?.label || c}`}
                </div>
              );
            })}
          </div>
        )}

        <div className="yamg-card">
          {loading ? (
            <div className="yamg-loading"><div className="yamg-spinner" />جاري التحميل...</div>
          ) : filtered.length === 0 ? (
            <div className="yamg-empty">
              <span className="ic">📜</span>
              لا توجد أحداث في هذا الفلتر.
            </div>
          ) : (
            filtered.map((e, i) => {
              const key = e.action || e.type || 'unknown';
              const meta = ACTION_META[key] || { icon: '•', label: key, color: 'muted' };
              return (
                <div key={e.id || i} className="yamg-audit-row">
                  <div className="yamg-audit-icon">{meta.icon}</div>
                  <div>
                    <div className="yamg-audit-desc">
                      <strong>{e.actor_name || e.actor || 'النظام'}</strong>{' '}
                      {e.description || meta.label}
                      {e.target_name && <> · <em style={{ color: '#cbd5e1' }}>{e.target_name}</em></>}
                    </div>
                    <div className="yamg-audit-meta">
                      {e.created_at ? new Date(e.created_at).toLocaleString('ar-EG') : ''}
                      {e.ip && <> · IP: {e.ip}</>}
                    </div>
                  </div>
                  <span className={`yamg-tag ${meta.color === 'muted' ? '' : meta.color}`}>{meta.label}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default GroupAuditLog;

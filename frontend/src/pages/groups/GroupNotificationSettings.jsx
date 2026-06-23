import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout.jsx';
import GroupSubHeader from '../../components/groups/GroupSubHeader.jsx';
import {
  getGroupNotificationSettings, updateGroupNotificationSettings, getGroupDetails,
} from '../../api/groups.js';
import { useToast } from '../../components/admin/ToastProvider.jsx';
import '../../styles/groups-features.css';

const MODES = [
  { id: 'all',      icon: '🔔', label: 'كل الرسائل',     hint: 'إشعار لكل رسالة جديدة'         },
  { id: 'mentions', icon: '@',  label: 'الإشارات فقط',   hint: 'فقط عند الإشارة إليك'           },
  { id: 'highlights', icon: '⭐', label: 'المهمّ فقط',   hint: 'الإعلانات والأحداث الكبرى'      },
  { id: 'none',     icon: '🔕', label: 'صامت',           hint: 'لا إشعارات نهائياً'              },
];

const MUTE_PRESETS = [
  { value: 0,            label: 'إلغاء الكتم' },
  { value: 60 * 60,      label: 'ساعة'        },
  { value: 8 * 3600,     label: '8 ساعات'     },
  { value: 24 * 3600,    label: 'يوم'         },
  { value: 7 * 86400,    label: 'أسبوع'       },
  { value: -1,           label: 'دائماً'      },
];

const SOUNDS = [
  { id: 'default', label: 'الافتراضي' },
  { id: 'ping',    label: 'Ping' },
  { id: 'chime',   label: 'Chime' },
  { id: 'pop',     label: 'Pop' },
  { id: 'none',    label: 'بدون صوت' },
];

const GroupNotificationSettings = () => {
  const { groupId } = useParams();
  const { pushToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [group, setGroup] = useState(null);

  const [settings, setSettings] = useState({
    mode: 'all',
    mute_until: null,
    mute_mentions: false,
    sound: 'default',
    vibrate: true,
    preview: true,
    notify_new_post: true,
    notify_new_event: true,
    notify_new_poll: false,
    notify_join_requests: true,
    notify_announcements: true,
    notify_calls: true,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const [s, det] = await Promise.allSettled([
          getGroupNotificationSettings(groupId),
          getGroupDetails(groupId),
        ]);
        if (cancelled) return;
        if (s.status === 'fulfilled' && s.value?.data) {
          setSettings((prev) => ({ ...prev, ...s.value.data }));
        }
        if (det.status === 'fulfilled') setGroup(det.value?.data || null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [groupId]);

  const update = (patch) => setSettings((s) => ({ ...s, ...patch }));

  const save = async () => {
    setSaving(true);
    try {
      await updateGroupNotificationSettings(groupId, settings);
      pushToast?.({ type: 'success', title: 'تم الحفظ', description: 'حُفظت إعدادات الإشعارات.' });
    } catch (e) {
      pushToast?.({ type: 'error', title: 'تعذر الحفظ', description: e?.message });
    } finally { setSaving(false); }
  };

  const applyMute = (seconds) => {
    if (seconds === 0) {
      update({ mute_until: null });
    } else if (seconds === -1) {
      update({ mute_until: 'forever' });
    } else {
      const ts = new Date(Date.now() + seconds * 1000).toISOString();
      update({ mute_until: ts });
    }
  };

  const isMuted = settings.mute_until === 'forever' ||
    (settings.mute_until && new Date(settings.mute_until).getTime() > Date.now());

  const muteLabel = settings.mute_until === 'forever'
    ? 'مكتومة دائماً'
    : isMuted ? `حتى ${new Date(settings.mute_until).toLocaleString('ar-EG')}` : '';

  return (
    <MainLayout>
      <div className="yamg-page" dir="rtl">
        <GroupSubHeader
          title={`إشعارات ${group?.name || 'المجموعة'}`}
          subtitle="تحكم في الإشعارات الخاصة بهذه المجموعة فقط"
          action={
            <button className="yamg-btn" onClick={save} disabled={saving || loading}>
              {saving ? '...حفظ' : '💾 حفظ'}
            </button>
          }
        />

        {loading ? (
          <div className="yamg-loading"><div className="yamg-spinner" />جاري التحميل...</div>
        ) : (
          <>
            {/* الوضع الرئيسي */}
            <div className="yamg-card">
              <h3 style={{ margin: '0 0 12px', fontSize: 15 }}>وضع الإشعارات</h3>
              <div className="yamg-noti-modes">
                {MODES.map((m) => (
                  <div
                    key={m.id}
                    className={`mode ${settings.mode === m.id ? 'active' : ''}`}
                    onClick={() => update({ mode: m.id })}
                  >
                    <div style={{ fontSize: 16, marginBottom: 2 }}>{m.icon} {m.label}</div>
                    <div style={{ fontSize: 11, opacity: 0.8 }}>{m.hint}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* كتم مؤقت */}
            <div className="yamg-card">
              <h3 style={{ margin: '0 0 4px', fontSize: 15 }}>كتم مؤقت</h3>
              <div style={{ fontSize: 12, color: 'var(--yamg-muted)', marginBottom: 12 }}>
                {isMuted ? `🔇 ${muteLabel}` : 'الإشعارات نشطة حالياً'}
              </div>
              <div className="yamg-noti-modes">
                {MUTE_PRESETS.map((p) => (
                  <div
                    key={p.value}
                    className="mode"
                    onClick={() => applyMute(p.value)}
                  >{p.label}</div>
                ))}
              </div>
            </div>

            {/* أنواع الإشعارات */}
            <div className="yamg-card">
              <h3 style={{ margin: '0 0 4px', fontSize: 15 }}>ما الذي يُنبّهك؟</h3>
              <div style={{ fontSize: 12, color: 'var(--yamg-muted)', marginBottom: 12 }}>
                تحكّم دقيق بنوع الإشعارات المُرسلة إليك
              </div>

              {[
                { k: 'notify_new_post',       label: 'منشورات جديدة',          hint: 'إشعار عند نشر عضو منشوراً' },
                { k: 'notify_new_event',      label: 'الأحداث',                hint: 'إنشاء حدث جديد أو تذكير'   },
                { k: 'notify_new_poll',       label: 'الاستطلاعات',            hint: 'استطلاع جديد للمشاركة'     },
                { k: 'notify_join_requests',  label: 'طلبات الانضمام',         hint: 'للمشرفين فقط'              },
                { k: 'notify_announcements',  label: 'الإعلانات الإدارية',     hint: 'دائماً ما يُوصى بتفعيلها'   },
                { k: 'notify_calls',          label: 'المكالمات الجماعية',     hint: 'صوت أو فيديو'              },
              ].map((row) => (
                <div className="yamg-noti-row" key={row.k}>
                  <div>
                    <div className="yamg-noti-label">{row.label}</div>
                    <div className="yamg-noti-hint">{row.hint}</div>
                  </div>
                  <label className="yamg-switch">
                    <input
                      type="checkbox"
                      checked={!!settings[row.k]}
                      onChange={(e) => update({ [row.k]: e.target.checked })}
                    />
                    <span className="slider" />
                  </label>
                </div>
              ))}
            </div>

            {/* الصوت والاهتزاز */}
            <div className="yamg-card">
              <h3 style={{ margin: '0 0 12px', fontSize: 15 }}>الصوت والاهتزاز</h3>

              <div className="yamg-noti-row">
                <div>
                  <div className="yamg-noti-label">نغمة الإشعار</div>
                  <div className="yamg-noti-hint">صوت يُسمع عند وصول رسالة</div>
                </div>
                <select
                  className="yamg-select"
                  style={{ maxWidth: 180 }}
                  value={settings.sound}
                  onChange={(e) => update({ sound: e.target.value })}
                >
                  {SOUNDS.map((s) => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div className="yamg-noti-row">
                <div>
                  <div className="yamg-noti-label">الاهتزاز</div>
                  <div className="yamg-noti-hint">اهتزاز عند وصول إشعار (الجوال فقط)</div>
                </div>
                <label className="yamg-switch">
                  <input
                    type="checkbox"
                    checked={!!settings.vibrate}
                    onChange={(e) => update({ vibrate: e.target.checked })}
                  />
                  <span className="slider" />
                </label>
              </div>

              <div className="yamg-noti-row">
                <div>
                  <div className="yamg-noti-label">معاينة محتوى الرسالة</div>
                  <div className="yamg-noti-hint">إظهار نص الرسالة في الإشعار</div>
                </div>
                <label className="yamg-switch">
                  <input
                    type="checkbox"
                    checked={!!settings.preview}
                    onChange={(e) => update({ preview: e.target.checked })}
                  />
                  <span className="slider" />
                </label>
              </div>

              <div className="yamg-noti-row">
                <div>
                  <div className="yamg-noti-label">كتم الإشارات أيضاً</div>
                  <div className="yamg-noti-hint">عند الكتم، لا تستثني الإشارات إليك</div>
                </div>
                <label className="yamg-switch">
                  <input
                    type="checkbox"
                    checked={!!settings.mute_mentions}
                    onChange={(e) => update({ mute_mentions: e.target.checked })}
                  />
                  <span className="slider" />
                </label>
              </div>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default GroupNotificationSettings;

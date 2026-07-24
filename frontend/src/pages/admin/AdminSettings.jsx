import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import EmptyState from '../../components/feedback/EmptyState.jsx';
import ErrorState from '../../components/feedback/ErrorState.jsx';
import { AdminOverviewSkeleton } from '../../components/feedback/Skeleton.jsx';
import { changeAdminPassword, getAdminSettings, updateAdminSettings } from '../../api/admin.js';
import socket from '../../api/socket.js';
import { useToast } from '../../components/admin/ToastProvider.jsx';
import { PRIMARY_ADMIN_EMAIL } from '../../utils/access.js';

const defaultNotificationSettings = {
  push_enabled: true,
  browser_enabled: true,
  mobile_enabled: true,
  smart_notifications: true,
  grouped_notifications: true,
  silent_notifications: false,
  realtime_notifications: true,
  sound: 'classic',
  categories: {
    chat: true,
    follow: true,
    interaction: true,
    live: true,
    system: true,
    reports: true,
  },
};

const defaultGeneral = {
  platform_name: '',
  support_email: '',
  maintenance_mode: false,
  allow_registration: true,
  default_user_role: 'user',
  session_timeout_minutes: 120,
  theme: 'midnight',
  locale: 'ar-EG',
  notifications: defaultNotificationSettings,
};

function normalizeSettingsPayload(data) {
  return {
    ...defaultGeneral,
    ...(data?.general || {}),
    notifications: {
      ...defaultNotificationSettings,
      ...(data?.general?.notifications || {}),
      categories: {
        ...defaultNotificationSettings.categories,
        ...(data?.general?.notifications?.categories || {}),
      },
    },
  };
}

export default function AdminSettings() {
  const [general, setGeneral] = useState(defaultGeneral);
  const [lastLoadedGeneral, setLastLoadedGeneral] = useState(defaultGeneral);
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingGeneral, setSavingGeneral] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const { pushToast } = useToast();

  const hasSettingsData = Boolean(general.platform_name || general.support_email || general.session_timeout_minutes || general.theme || general.locale);
  const settingsChecklist = useMemo(() => ([
    { key: 'platform', label: 'اسم المنصة', value: general.platform_name || 'غير مضبوط بعد' },
    { key: 'support', label: 'بريد الدعم', value: general.support_email || 'غير مضبوط بعد' },
    { key: 'registration', label: 'التسجيل', value: general.allow_registration ? 'مفتوح' : 'مغلق' },
    { key: 'maintenance', label: 'الصيانة', value: general.maintenance_mode ? 'مفعّلة' : 'متوقفة' },
    { key: 'push', label: 'Push Notifications', value: general.notifications?.push_enabled ? 'مفعلة' : 'مغلقة' },
    { key: 'grouped', label: 'Grouped Notifications', value: general.notifications?.grouped_notifications ? 'مفعلة' : 'مغلقة' },
  ]), [general]);

  const loadSettings = async (showToast = false) => {
    try {
      setLoading(true);
      setError('');
      const { data } = await getAdminSettings();
      const normalized = normalizeSettingsPayload(data);
      setGeneral(normalized);
      setLastLoadedGeneral(normalized);
      if (showToast) pushToast({ title: 'تمت إعادة التحميل', description: 'تم استرجاع آخر إعدادات محفوظة من الخادم.', type: 'success' });
    } catch (err) {
      setError(err?.response?.data?.detail || 'تعذر تحميل إعدادات الإدارة حالياً.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();

    const onSettingsUpdated = (payload) => {
      const normalized = normalizeSettingsPayload({ general: payload?.general || {} });
      setGeneral(normalized);
      setLastLoadedGeneral(normalized);
    };

    socket.on('admin:settings_updated', onSettingsUpdated);
    return () => {
      socket.off('admin:settings_updated', onSettingsUpdated);
    };
  }, []);

  const updateNotificationSetting = (key, value) => {
    setGeneral((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: value,
      },
    }));
  };

  const toggleCategory = (key) => {
    setGeneral((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        categories: {
          ...prev.notifications.categories,
          [key]: !prev.notifications.categories[key],
        },
      },
    }));
  };

  const handleSaveSettings = async () => {
    setSavingGeneral(true);
    setError('');
    try {
      const { data } = await updateAdminSettings({ general });
      const normalized = normalizeSettingsPayload(data);
      setGeneral(normalized);
      setLastLoadedGeneral(normalized);
      pushToast({ title: 'تم حفظ الإعدادات', description: 'تم تحديث الإعدادات العامة وإعدادات الإشعارات بنجاح.', type: 'success' });
    } catch (err) {
      const message = err?.response?.data?.detail || 'تعذر حفظ الإعدادات حالياً.';
      setError(message);
      pushToast({ title: 'تعذر الحفظ', description: message, type: 'error' });
    } finally {
      setSavingGeneral(false);
    }
  };

  const handleResetSettings = async () => {
    await loadSettings(true);
  };

  const handleChangePassword = async () => {
    if (!passwordForm.current_password.trim() || !passwordForm.new_password.trim()) {
      setError('اكتب كلمة المرور الحالية والجديدة قبل التنفيذ.');
      return;
    }
    setChangingPassword(true);
    setError('');
    try {
      await changeAdminPassword(passwordForm);
      pushToast({ title: 'تم تحديث كلمة المرور', description: 'تم تغيير كلمة المرور للحساب الحالي.', type: 'success' });
      setPasswordForm({ current_password: '', new_password: '' });
    } catch (err) {
      const message = err?.response?.data?.detail || 'تعذر تغيير كلمة المرور حالياً.';
      setError(message);
      pushToast({ title: 'تعذر التحديث', description: message, type: 'error' });
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading && !hasSettingsData) {
    return (
      <AdminLayout>
        <AdminOverviewSkeleton />
      </AdminLayout>
    );
  }

  if (error && !hasSettingsData) {
    return (
      <AdminLayout>
        <ErrorState title="تعذر تحميل الإعدادات" description={error} onRetry={loadSettings} />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {error ? <div className="alert error">{error}</div> : null}

      <section className="dashboard-hero-grid small-gap">
        <Card className="hero-card">
          <span className="badge">تفضيلات النظام</span>
          <h2>توحيد إعدادات المنصة والإشعارات والإدارة</h2>
          <p className="muted">تم ربط الحفظ وإعادة الضبط مع واجهة الخادم الحقيقية، مع مزامنة مباشرة لو الإعدادات تغيرت من جلسة مدير أخرى.</p>
          <div className="action-row wide">
            <Button loading={savingGeneral} disabled={savingGeneral} onClick={handleSaveSettings}>حفظ الإعدادات</Button>
            <Button variant="secondary" loading={loading} disabled={loading} onClick={handleResetSettings}>{loading ? 'جارٍ الاسترجاع...' : 'Reset / إعادة من الخادم'}</Button>
          </div>
        </Card>

        <Card>
          <div className="card-head split">
            <h3 className="section-title">جاهزية التكوين</h3>
            <span className="badge">{settingsChecklist.filter((item) => !String(item.value).includes('غير مضبوط')).length}/{settingsChecklist.length}</span>
          </div>
          <div className="queue-grid compact-cards">
            {settingsChecklist.map((item) => (
              <div key={item.key} className="queue-card compact">
                <span className="queue-label">{item.label}</span>
                <strong>{item.value}</strong>
                <p>مؤشر سريع على حالة التهيئة الحالية.</p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="two-column-grid">
        <Card>
          <div className="card-head"><h3 className="section-title">الإعدادات العامة</h3></div>
          {!hasSettingsData ? (
            <EmptyState
              icon="⚙️"
              title="لا توجد إعدادات مُحمّلة بعد"
              description="يمكنك سحب الإعدادات من الخادم أو البدء بملء القيم الافتراضية ثم الحفظ."
              actionLabel="إعادة التحميل"
              onAction={loadSettings}
            />
          ) : (
            <div className="modal-stack">
              <Input label="اسم المنصة" value={general.platform_name} onChange={(event) => setGeneral((prev) => ({ ...prev, platform_name: event.target.value }))} />
              <Input label="بريد الدعم" value={general.support_email} onChange={(event) => setGeneral((prev) => ({ ...prev, support_email: event.target.value }))} />
              <div className="filters-row wrap">
                <label className="field select-field">
                  <span className="field-label">الدور الافتراضي</span>
                  <select className="input" value={general.default_user_role} onChange={(event) => setGeneral((prev) => ({ ...prev, default_user_role: event.target.value }))}>
                    <option value="user">مستخدم</option>
                    <option value="moderator">مشرف</option>
                    <option value="admin">أدمن</option>
                  </select>
                </label>
                <Input label="مهلة الجلسة بالدقائق" type="number" value={general.session_timeout_minutes} onChange={(event) => setGeneral((prev) => ({ ...prev, session_timeout_minutes: Number(event.target.value) || 0 }))} />
              </div>
              <div className="filters-row wrap">
                <label className="field select-field">
                  <span className="field-label">الثيم</span>
                  <select className="input" value={general.theme} onChange={(event) => setGeneral((prev) => ({ ...prev, theme: event.target.value }))}>
                    <option value="midnight">منتصف الليل</option>
                    <option value="aurora">الشفق القطبي</option>
                    <option value="graphite">جرافيت</option>
                  </select>
                </label>
                <label className="field select-field">
                  <span className="field-label">اللغة</span>
                  <select className="input" value={general.locale} onChange={(event) => setGeneral((prev) => ({ ...prev, locale: event.target.value }))}>
                    <option value="ar-EG">العربية</option>
                    <option value="en-US">الإنجليزية</option>
                  </select>
                </label>
              </div>
              <div className="filters-row wrap">
                <label className="checkbox-row"><input type="checkbox" checked={general.maintenance_mode} onChange={(event) => setGeneral((prev) => ({ ...prev, maintenance_mode: event.target.checked }))} /><span>وضع الصيانة</span></label>
                <label className="checkbox-row"><input type="checkbox" checked={general.allow_registration} onChange={(event) => setGeneral((prev) => ({ ...prev, allow_registration: event.target.checked }))} /><span>السماح بالتسجيل</span></label>
              </div>
              <Button loading={savingGeneral} disabled={savingGeneral} onClick={handleSaveSettings}>حفظ الإعدادات</Button>
            </div>
          )}
        </Card>

        <Card>
          <div className="card-head"><h3 className="section-title">إعدادات الإشعارات</h3></div>
          <div className="modal-stack">
            <div className="queue-grid compact-cards">
              {[
                ['push_enabled', 'Push Notifications'],
                ['browser_enabled', 'Browser Notifications'],
                ['mobile_enabled', 'Mobile Notifications'],
                ['smart_notifications', 'Smart Notifications'],
                ['grouped_notifications', 'Grouped Notifications'],
                ['silent_notifications', 'Silent Notifications'],
                ['realtime_notifications', 'Real-time Notifications'],
              ].map(([key, label]) => (
                <div key={key} className="queue-card compact">
                  <span className="queue-label">{label}</span>
                  <strong>{general.notifications?.[key] ? 'مفعّل' : 'متوقف'}</strong>
                  <label className="checkbox-row">
                    <input type="checkbox" checked={Boolean(general.notifications?.[key])} onChange={(event) => updateNotificationSetting(key, event.target.checked)} />
                    <span>تبديل</span>
                  </label>
                </div>
              ))}
            </div>
            <label className="field select-field">
              <span className="field-label">أصوات الإشعارات</span>
              <select className="input" value={general.notifications?.sound || 'classic'} onChange={(event) => updateNotificationSetting('sound', event.target.value)}>
                <option value="classic">جرس كلاسيكي</option>
                <option value="pulse">نبضة</option>
                <option value="soft">رنين ناعم</option>
                <option value="silent">وضع صامت</option>
              </select>
            </label>
            <div className="queue-grid compact-cards">
              {Object.entries(general.notifications?.categories || {}).map(([key, enabled]) => (
                <div key={key} className="queue-card compact">
                  <span className="queue-label">{key}</span>
                  <strong>{enabled ? 'مفعّل' : 'متوقف'}</strong>
                  <label className="checkbox-row">
                    <input type="checkbox" checked={Boolean(enabled)} onChange={() => toggleCategory(key)} />
                    <span>تبديل الفئة</span>
                  </label>
                </div>
              ))}
            </div>
            <Button loading={savingGeneral} disabled={savingGeneral} onClick={handleSaveSettings}>حفظ إعدادات الإشعارات</Button>
          </div>
        </Card>
      </section>

      <section className="two-column-grid">
        <Card>
          <div className="card-head"><h3 className="section-title">الأمان والوصول الإداري</h3></div>
          <div className="modal-stack">
            <Input label="كلمة المرور الحالية" type="password" value={passwordForm.current_password} onChange={(event) => setPasswordForm((prev) => ({ ...prev, current_password: event.target.value }))} />
            <Input label="كلمة المرور الجديدة" type="password" value={passwordForm.new_password} onChange={(event) => setPasswordForm((prev) => ({ ...prev, new_password: event.target.value }))} />
            <Button variant="secondary" loading={changingPassword} disabled={changingPassword} onClick={handleChangePassword}>تغيير كلمة المرور</Button>
          </div>
        </Card>

        <Card>
          <div className="card-head"><h3 className="section-title">الأدمن الأساسي</h3></div>
          <div className="dropzone-hint admin-access-help">
            <strong>دخول لوحة الأدمن</strong>
            <p className="muted no-margin">الرابط الأساسي: /admin/login</p>
            <p className="muted no-margin">الرابط الاحتياطي: /admin.html</p>
            <p className="muted no-margin">لازم الدخول يتم بنفس البريد الإداري الأساسي: {PRIMARY_ADMIN_EMAIL}</p>
            <p className="muted no-margin">آخر نسخة محملة من الخادم: {lastLoadedGeneral.platform_name || 'غير متوفرة حالياً'}</p>
          </div>
        </Card>
      </section>
    </AdminLayout>
  );
}

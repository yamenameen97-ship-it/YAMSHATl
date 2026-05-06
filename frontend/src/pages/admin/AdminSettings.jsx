import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import { changeAdminPassword, getAdminSettings, updateAdminSettings } from '../../api/admin.js';
import { useToast } from '../../components/admin/ToastProvider.jsx';
import { PRIMARY_ADMIN_EMAIL } from '../../utils/access.js';

export default function AdminSettings() {
  const [general, setGeneral] = useState({
    platform_name: '',
    support_email: '',
    maintenance_mode: false,
    allow_registration: true,
    default_user_role: 'user',
    session_timeout_minutes: 120,
    theme: 'midnight',
    locale: 'ar-EG',
  });
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '' });
  const { pushToast } = useToast();

  useEffect(() => {
    getAdminSettings().then(({ data }) => setGeneral(data.general || general));
  }, []);

  const handleSaveSettings = async () => {
    await updateAdminSettings({ general });
    pushToast({ title: 'تم حفظ الإعدادات', description: 'تم تحديث الإعدادات العامة بنجاح.', type: 'success' });
  };

  const handleChangePassword = async () => {
    await changeAdminPassword(passwordForm);
    pushToast({ title: 'تم تحديث كلمة المرور', description: 'تم تغيير كلمة المرور للحساب الحالي.', type: 'success' });
    setPasswordForm({ current_password: '', new_password: '' });
  };

  return (
    <AdminLayout>
      <section className="two-column-grid">
        <Card>
          <div className="card-head"><h3 className="section-title">الإعدادات العامة</h3></div>
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
              <Input label="مهلة الجلسة بالدقائق" type="number" value={general.session_timeout_minutes} onChange={(event) => setGeneral((prev) => ({ ...prev, session_timeout_minutes: Number(event.target.value) }))} />
            </div>
            <div className="filters-row wrap">
              <label className="checkbox-row"><input type="checkbox" checked={general.maintenance_mode} onChange={(event) => setGeneral((prev) => ({ ...prev, maintenance_mode: event.target.checked }))} /><span>وضع الصيانة</span></label>
              <label className="checkbox-row"><input type="checkbox" checked={general.allow_registration} onChange={(event) => setGeneral((prev) => ({ ...prev, allow_registration: event.target.checked }))} /><span>السماح بالتسجيل</span></label>
            </div>
            <Button onClick={handleSaveSettings}>حفظ الإعدادات</Button>
          </div>
        </Card>

        <Card>
          <div className="card-head"><h3 className="section-title">الأمان والوصول الإداري</h3></div>
          <div className="modal-stack">
            <Input label="كلمة المرور الحالية" type="password" value={passwordForm.current_password} onChange={(event) => setPasswordForm((prev) => ({ ...prev, current_password: event.target.value }))} />
            <Input label="كلمة المرور الجديدة" type="password" value={passwordForm.new_password} onChange={(event) => setPasswordForm((prev) => ({ ...prev, new_password: event.target.value }))} />
            <Button variant="secondary" onClick={handleChangePassword}>تغيير كلمة المرور</Button>

            <div className="dropzone-hint admin-access-help">
              <strong>دخول لوحة الأدمن</strong>
              <p className="muted no-margin">الرابط الأساسي: /admin/login</p>
              <p className="muted no-margin">الرابط الاحتياطي: /admin.html</p>
              <p className="muted no-margin">لازم الدخول يتم بنفس البريد الإداري الأساسي: {PRIMARY_ADMIN_EMAIL}</p>
            </div>
          </div>
        </Card>
      </section>
    </AdminLayout>
  );
}

import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import { changeAdminPassword, getAdminSettings, updateAdminSettings } from '../../api/admin.js';
import { useToast } from '../../components/admin/ToastProvider.jsx';

export default function AdminSettings() {
  const [general, setGeneral] = useState({ platform_name: '', support_email: '', maintenance_mode: false, allow_registration: true, default_user_role: 'user', session_timeout_minutes: 120, theme: 'midnight', locale: 'ar-EG' });
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
          <div className="card-head"><h3 className="section-title">إعدادات عامة</h3></div>
          <div className="modal-stack">
            <Input label="Platform name" value={general.platform_name} onChange={(event) => setGeneral((prev) => ({ ...prev, platform_name: event.target.value }))} />
            <Input label="Support email" value={general.support_email} onChange={(event) => setGeneral((prev) => ({ ...prev, support_email: event.target.value }))} />
            <div className="filters-row wrap">
              <label className="field select-field"><span className="field-label">Default role</span><select className="input" value={general.default_user_role} onChange={(event) => setGeneral((prev) => ({ ...prev, default_user_role: event.target.value }))}><option value="user">User</option><option value="moderator">Moderator</option><option value="admin">Admin</option></select></label>
              <Input label="Session timeout" type="number" value={general.session_timeout_minutes} onChange={(event) => setGeneral((prev) => ({ ...prev, session_timeout_minutes: Number(event.target.value) }))} />
            </div>
            <div className="filters-row wrap">
              <label className="checkbox-row"><input type="checkbox" checked={general.maintenance_mode} onChange={(event) => setGeneral((prev) => ({ ...prev, maintenance_mode: event.target.checked }))} /><span>Maintenance mode</span></label>
              <label className="checkbox-row"><input type="checkbox" checked={general.allow_registration} onChange={(event) => setGeneral((prev) => ({ ...prev, allow_registration: event.target.checked }))} /><span>Allow registration</span></label>
            </div>
            <Button onClick={handleSaveSettings}>حفظ الإعدادات</Button>
          </div>
        </Card>

        <Card>
          <div className="card-head"><h3 className="section-title">الحساب والأمان</h3></div>
          <div className="modal-stack">
            <Input label="Current password" type="password" value={passwordForm.current_password} onChange={(event) => setPasswordForm((prev) => ({ ...prev, current_password: event.target.value }))} />
            <Input label="New password" type="password" value={passwordForm.new_password} onChange={(event) => setPasswordForm((prev) => ({ ...prev, new_password: event.target.value }))} />
            <Button variant="secondary" onClick={handleChangePassword}>تغيير كلمة المرور</Button>
          </div>
        </Card>
      </section>
    </AdminLayout>
  );
}

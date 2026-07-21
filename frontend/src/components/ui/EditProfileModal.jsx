import { useCallback, useEffect, useMemo, useState } from 'react';
import Modal from './Modal.jsx';
import Button from './Button.jsx';
import {
  deleteMyAccount,
  resendEmailVerification,
  sendPhoneVerification,
  updateMyProfile,
  verifyPhoneVerification,
} from '../../api/users.js';

/**
 * EditProfileModal — v88.36 (Full Account Editor)
 * =================================================
 * نافذة تعديل بيانات الحساب الكاملة (بديلاً عن نافذة تخصيص الثيم).
 * تدعم:
 *  - الاسم الأول / اسم الأب / اللقب / اسم المستخدم
 *  - النبذة التعريفية (حتى 800 حرف)
 *  - تاريخ الميلاد
 *  - البريد الإلكتروني + إعادة إرسال رمز التحقق
 *  - رقم الهاتف + إرسال رمز SMS + توثيق
 *  - منطقة خطرة: حذف الحساب بكتابة DELETE
 */

const fieldStyle = {
  width: '100%',
  boxSizing: 'border-box',
  background: '#171722',
  color: '#fff',
  border: '1px solid #3a3a4b',
  borderRadius: 10,
  padding: '11px 12px',
  fontFamily: 'inherit',
  fontSize: 14,
  outline: 'none',
};

const labelStyle = {
  display: 'grid',
  gap: 7,
  fontWeight: 700,
  color: '#e9e7f5',
  fontSize: 13,
};

const sectionStyle = {
  display: 'grid',
  gap: 12,
  padding: '14px 0',
  borderTop: '1px solid #2a2836',
};

const sectionTitle = {
  margin: 0,
  fontSize: 15,
  fontWeight: 800,
  color: '#e9e7f5',
};

const smallHint = { color: '#a5a1b9', fontSize: 12, textAlign: 'left' };

function normalizeUser(user) {
  const u = user || {};
  const profile = u.profile || {};
  return {
    username: u.username || u.name || '',
    email: u.email || '',
    phone_number: u.phone_number || '',
    email_verified: Boolean(u.email_verified),
    phone_verified: Boolean(u.phone_verified),
    first_name: profile.first_name || '',
    father_name: profile.father_name || '',
    last_name: profile.last_name || '',
    bio: profile.bio || '',
    date_of_birth: profile.date_of_birth || '',
  };
}

export default function EditProfileModal({ open, onClose, user, onSaved, onDeleted }) {
  const initial = useMemo(() => normalizeUser(user), [user]);
  const [form, setForm] = useState(initial);
  const [phoneCode, setPhoneCode] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [sendingPhone, setSendingPhone] = useState(false);
  const [verifyingPhone, setVerifyingPhone] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [showDangerZone, setShowDangerZone] = useState(false);

  // إعادة تعبئة النموذج عند فتح النافذة أو تغيّر المستخدم
  useEffect(() => {
    if (!open) return;
    setForm(normalizeUser(user));
    setPhoneCode('');
    setStatus('');
    setError('');
    setDeleteConfirm('');
    setShowDangerZone(false);
  }, [open, user]);

  const change = useCallback((key) => (event) => {
    const value = event?.target?.value ?? '';
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const save = useCallback(async (event) => {
    event?.preventDefault?.();
    setError('');
    setStatus('');
    setSaving(true);
    try {
      const payload = {
        username: form.username?.trim(),
        first_name: form.first_name?.trim() || '',
        father_name: form.father_name?.trim() || '',
        last_name: form.last_name?.trim() || '',
        bio: form.bio || '',
        date_of_birth: form.date_of_birth || '',
        email: form.email?.trim().toLowerCase(),
        phone_number: form.phone_number?.trim() || '',
      };
      const { data } = await updateMyProfile(payload);
      setStatus('تم حفظ بيانات الحساب بنجاح.');
      onSaved?.(data);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'تعذر حفظ التعديلات. حاول مجدداً.');
    } finally {
      setSaving(false);
    }
  }, [form, onSaved]);

  const sendEmail = useCallback(async () => {
    setError('');
    setStatus('');
    setSendingEmail(true);
    try {
      await resendEmailVerification(form.email?.trim().toLowerCase());
      setStatus('أرسلنا رمز التحقق إلى البريد الإلكتروني.');
    } catch (err) {
      setError(err?.response?.data?.detail || 'تعذر إرسال رمز البريد الإلكتروني.');
    } finally {
      setSendingEmail(false);
    }
  }, [form.email]);

  const sendPhone = useCallback(async () => {
    setError('');
    setStatus('');
    setSendingPhone(true);
    try {
      // حفظ الهاتف أولاً حتى يعتمده الـ backend قبل الإرسال
      if (form.phone_number?.trim()) {
        await updateMyProfile({ phone_number: form.phone_number.trim() });
      }
      await sendPhoneVerification();
      setStatus('أرسلنا رمز التحقق إلى رقم الهاتف عبر SMS.');
    } catch (err) {
      setError(err?.response?.data?.detail || 'تعذر إرسال رمز التحقق للهاتف.');
    } finally {
      setSendingPhone(false);
    }
  }, [form.phone_number]);

  const verifyPhone = useCallback(async () => {
    setError('');
    setStatus('');
    setVerifyingPhone(true);
    try {
      await verifyPhoneVerification((phoneCode || '').trim());
      setStatus('تم توثيق رقم الهاتف بنجاح.');
      onSaved?.({ ...(user || {}), phone_verified: true, phone_number: form.phone_number });
      setPhoneCode('');
    } catch (err) {
      setError(err?.response?.data?.detail || 'رمز التحقق غير صحيح أو منتهي الصلاحية.');
    } finally {
      setVerifyingPhone(false);
    }
  }, [phoneCode, user, form.phone_number, onSaved]);

  const removeAccount = useCallback(async () => {
    setError('');
    setStatus('');
    if (deleteConfirm.trim().toUpperCase() !== 'DELETE') {
      setError('اكتب DELETE بأحرف كبيرة لتأكيد حذف الحساب.');
      return;
    }
    setDeleting(true);
    try {
      await deleteMyAccount();
      onDeleted?.();
    } catch (err) {
      setError(err?.response?.data?.detail || 'تعذر حذف الحساب. حاول مجدداً.');
    } finally {
      setDeleting(false);
    }
  }, [deleteConfirm, onDeleted]);

  const bioLength = (form.bio || '').length;
  const todayIso = new Date().toISOString().slice(0, 10);

  return (
    <Modal open={open} onClose={onClose} title="تعديل الملف الشخصي" size="large">
      <form
        onSubmit={save}
        dir="rtl"
        style={{
          padding: 18,
          display: 'grid',
          gap: 14,
          maxHeight: '76vh',
          overflowY: 'auto',
        }}
      >
        <p style={{ margin: 0, color: '#aaa8bb', fontSize: 13, lineHeight: 1.7 }}>
          عدّل بيانات حسابك ومعلومات التوثيق. البريد الإلكتروني ورقم الهاتف لن يظهرا للآخرين.
        </p>

        {error ? (
          <div role="alert" style={{ color: '#fecaca', background: '#4a1820', padding: 10, borderRadius: 9, fontSize: 13 }}>
            {error}
          </div>
        ) : null}
        {status ? (
          <div role="status" style={{ color: '#bbf7d0', background: '#143c2b', padding: 10, borderRadius: 9, fontSize: 13 }}>
            {status}
          </div>
        ) : null}

        {/* ============ بيانات الاسم ============ */}
        <section style={{ ...sectionStyle, borderTop: 'none', paddingTop: 0 }}>
          <h4 style={sectionTitle}>بيانات الاسم</h4>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
              gap: 12,
            }}
          >
            <label style={labelStyle}>
              الاسم الأول
              <input
                style={fieldStyle}
                value={form.first_name}
                onChange={change('first_name')}
                maxLength={80}
                autoComplete="given-name"
              />
            </label>
            <label style={labelStyle}>
              اسم الأب
              <input
                style={fieldStyle}
                value={form.father_name}
                onChange={change('father_name')}
                maxLength={80}
                autoComplete="additional-name"
              />
            </label>
            <label style={labelStyle}>
              اللقب / اسم العائلة
              <input
                style={fieldStyle}
                value={form.last_name}
                onChange={change('last_name')}
                maxLength={80}
                autoComplete="family-name"
              />
            </label>
          </div>

          <label style={labelStyle}>
            اسم المستخدم
            <input
              style={fieldStyle}
              value={form.username}
              onChange={change('username')}
              maxLength={50}
              required
              autoComplete="username"
              pattern="[A-Za-z0-9_.\-]+"
              title="أحرف إنجليزية وأرقام و . _ - فقط"
            />
            <small style={smallHint}>يمكن استخدام الأحرف الإنجليزية والأرقام و ( . _ - ) فقط.</small>
          </label>

          <label style={labelStyle}>
            تاريخ الميلاد (العمر)
            <input
              style={fieldStyle}
              type="date"
              value={form.date_of_birth || ''}
              onChange={change('date_of_birth')}
              max={todayIso}
            />
          </label>

          <label style={labelStyle}>
            النبذة التعريفية
            <textarea
              style={{ ...fieldStyle, minHeight: 96, resize: 'vertical', fontFamily: 'inherit' }}
              value={form.bio}
              onChange={change('bio')}
              maxLength={800}
              placeholder="اكتب نبذة قصيرة عنك…"
            />
            <small style={smallHint}>{bioLength}/800</small>
          </label>
        </section>

        {/* ============ البريد والتوثيق ============ */}
        <section style={sectionStyle}>
          <h4 style={sectionTitle}>البريد الإلكتروني والتوثيق</h4>

          <label style={labelStyle}>
            البريد الإلكتروني
            <input
              style={fieldStyle}
              type="email"
              value={form.email}
              onChange={change('email')}
              required
              autoComplete="email"
            />
          </label>
          <div style={{ display: 'flex', gap: 9, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ color: form.email_verified ? '#86efac' : '#fcd34d', fontSize: 13, fontWeight: 700 }}>
              {form.email_verified ? '✓ البريد موثّق' : '⚠ البريد غير موثّق'}
            </span>
            {!form.email_verified && form.email ? (
              <Button type="button" variant="secondary" onClick={sendEmail} disabled={sendingEmail}>
                {sendingEmail ? 'جارٍ الإرسال…' : 'إرسال رمز التحقق للبريد'}
              </Button>
            ) : null}
          </div>

          <label style={labelStyle}>
            رقم الهاتف
            <input
              style={fieldStyle}
              type="tel"
              placeholder="+9665XXXXXXXX"
              value={form.phone_number}
              onChange={change('phone_number')}
              autoComplete="tel"
              inputMode="tel"
            />
            <small style={smallHint}>ابدأ برمز الدولة (مثال: +966 للسعودية، +967 لليمن).</small>
          </label>
          <div style={{ display: 'flex', gap: 9, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ color: form.phone_verified ? '#86efac' : '#fcd34d', fontSize: 13, fontWeight: 700 }}>
              {form.phone_verified ? '✓ الهاتف موثّق' : '⚠ الهاتف غير موثّق'}
            </span>
            {form.phone_number && !form.phone_verified ? (
              <Button type="button" variant="secondary" onClick={sendPhone} disabled={sendingPhone}>
                {sendingPhone ? 'جارٍ الإرسال…' : 'إرسال رمز SMS'}
              </Button>
            ) : null}
          </div>

          {form.phone_number && !form.phone_verified ? (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input
                style={{ ...fieldStyle, flex: '1 1 160px' }}
                inputMode="numeric"
                placeholder="رمز التحقق (6 أرقام)"
                value={phoneCode}
                onChange={(e) => setPhoneCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                maxLength={6}
              />
              <Button type="button" onClick={verifyPhone} disabled={verifyingPhone || !phoneCode}>
                {verifyingPhone ? 'جارٍ التوثيق…' : 'توثيق الهاتف'}
              </Button>
            </div>
          ) : null}
        </section>

        {/* ============ حفظ / إلغاء ============ */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-start',
            gap: 10,
            flexWrap: 'wrap',
            paddingTop: 8,
          }}
        >
          <Button type="submit" disabled={saving}>
            {saving ? 'جارٍ الحفظ…' : 'حفظ التعديلات'}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>
            إلغاء
          </Button>
        </div>

        {/* ============ منطقة خطرة ============ */}
        <section style={{ ...sectionStyle, borderTop: '1px solid #6b1f2a', marginTop: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <h4 style={{ ...sectionTitle, color: '#fca5a5' }}>منطقة خطرة — حذف الحساب</h4>
            <button
              type="button"
              onClick={() => setShowDangerZone((prev) => !prev)}
              style={{
                border: '1px solid #6b1f2a',
                borderRadius: 9,
                padding: '6px 12px',
                background: 'transparent',
                color: '#fca5a5',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {showDangerZone ? 'إخفاء' : 'إظهار'}
            </button>
          </div>

          {showDangerZone ? (
            <>
              <p style={{ margin: 0, fontSize: 13, color: '#d1cddc', lineHeight: 1.7 }}>
                سيتم حذف الحساب وجميع جلساته وبياناته المرتبطة (المنشورات، الرسائل، المتابعون…) نهائياً ولا يمكن التراجع.
                اكتب <b>DELETE</b> ثم اضغط زر الحذف.
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <input
                  style={{ ...fieldStyle, flex: '1 1 150px' }}
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  placeholder="DELETE"
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={removeAccount}
                  disabled={deleting}
                  style={{
                    border: 0,
                    borderRadius: 10,
                    padding: '10px 14px',
                    background: deleting ? '#7f1d1d' : '#b91c1c',
                    color: '#fff',
                    fontFamily: 'inherit',
                    fontWeight: 700,
                    cursor: deleting ? 'wait' : 'pointer',
                  }}
                >
                  {deleting ? 'جارٍ الحذف…' : 'حذف الحساب نهائياً'}
                </button>
              </div>
            </>
          ) : null}
        </section>
      </form>
    </Modal>
  );
}

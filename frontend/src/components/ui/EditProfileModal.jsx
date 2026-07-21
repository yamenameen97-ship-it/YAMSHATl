import { useEffect, useState } from 'react';
import Modal from './Modal.jsx';
import Button from './Button.jsx';
import {
  deleteMyAccount,
  resendEmailVerification,
  sendPhoneVerification,
  updateMyProfile,
  verifyPhoneVerification,
} from '../../api/users.js';

const fieldStyle = { width: '100%', boxSizing: 'border-box', background: '#171722', color: '#fff', border: '1px solid #3a3a4b', borderRadius: 10, padding: '11px 12px', fontFamily: 'inherit' };
const labelStyle = { display: 'grid', gap: 7, fontWeight: 700, color: '#e9e7f5' };

export default function EditProfileModal({ open, onClose, user, onSaved, onDeleted }) {
  const profile = user?.profile || {};
  const [form, setForm] = useState({});
  const [phoneCode, setPhoneCode] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');

  useEffect(() => {
    if (!open) return;
    setForm({ username: user?.username || user?.name || '', first_name: profile.first_name || '', father_name: profile.father_name || '', last_name: profile.last_name || '', bio: profile.bio || '', date_of_birth: profile.date_of_birth || '', email: user?.email || '', phone_number: user?.phone_number || '' });
    setPhoneCode(''); setStatus(''); setError(''); setDeleteConfirm('');
  }, [open, user, profile.first_name, profile.father_name, profile.last_name, profile.bio, profile.date_of_birth]);

  const change = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));
  const save = async (event) => {
    event.preventDefault(); setSaving(true); setError(''); setStatus('');
    try {
      const { data } = await updateMyProfile(form);
      onSaved?.(data); setStatus('تم حفظ بيانات الحساب بنجاح.');
    } catch (err) { setError(err?.response?.data?.detail || 'تعذر حفظ التعديلات.'); }
    finally { setSaving(false); }
  };
  const sendEmail = async () => { setError(''); try { await resendEmailVerification(form.email); setStatus('أرسلنا رمز التحقق إلى البريد الإلكتروني.'); } catch (err) { setError(err?.response?.data?.detail || 'تعذر إرسال رمز البريد.'); } };
  const sendPhone = async () => { setError(''); try { await updateMyProfile({ phone_number: form.phone_number }); await sendPhoneVerification(); setStatus('أرسلنا رمز التحقق إلى رقم الهاتف.'); } catch (err) { setError(err?.response?.data?.detail || 'تعذر إرسال رمز الهاتف.'); } };
  const verifyPhone = async () => { setError(''); try { await verifyPhoneVerification(phoneCode); setStatus('تم توثيق رقم الهاتف بنجاح.'); onSaved?.({ ...user, phone_verified: true, phone_number: form.phone_number }); } catch (err) { setError(err?.response?.data?.detail || 'رمز التحقق غير صحيح أو منتهي.'); } };
  const removeAccount = async () => { if (deleteConfirm !== 'DELETE') { setError('اكتب DELETE لتأكيد حذف الحساب.'); return; } try { await deleteMyAccount(); onDeleted?.(); } catch (err) { setError(err?.response?.data?.detail || 'تعذر حذف الحساب.'); } };

  return <Modal open={open} onClose={onClose} title="تعديل الملف الشخصي" size="large">
    <form onSubmit={save} dir="rtl" style={{ padding: 18, display: 'grid', gap: 18, maxHeight: '72vh', overflowY: 'auto' }}>
      <p style={{ margin: 0, color: '#aaa8bb', fontSize: 13 }}>عدّل بيانات حسابك ومعلومات التوثيق. لن يظهر البريد والهاتف للآخرين.</p>
      {error && <div role="alert" style={{ color: '#fecaca', background: '#4a1820', padding: 10, borderRadius: 9 }}>{error}</div>}
      {status && <div role="status" style={{ color: '#bbf7d0', background: '#143c2b', padding: 10, borderRadius: 9 }}>{status}</div>}
      <section style={{ display: 'grid', gap: 12 }}><h4 style={{ margin: 0 }}>بيانات الاسم</h4><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
        <label style={labelStyle}>الاسم الأول<input style={fieldStyle} value={form.first_name || ''} onChange={change('first_name')} maxLength="80" /></label>
        <label style={labelStyle}>اسم الأب<input style={fieldStyle} value={form.father_name || ''} onChange={change('father_name')} maxLength="80" /></label>
        <label style={labelStyle}>اللقب / اسم العائلة<input style={fieldStyle} value={form.last_name || ''} onChange={change('last_name')} maxLength="80" /></label>
      </div>
      <label style={labelStyle}>اسم المستخدم<input style={fieldStyle} value={form.username || ''} onChange={change('username')} maxLength="50" required /></label>
      <label style={labelStyle}>تاريخ الميلاد<input style={fieldStyle} type="date" value={form.date_of_birth || ''} onChange={change('date_of_birth')} max={new Date().toISOString().slice(0, 10)} /></label>
      <label style={labelStyle}>النبذة التعريفية<textarea style={{ ...fieldStyle, minHeight: 94, resize: 'vertical' }} value={form.bio || ''} onChange={change('bio')} maxLength="800" /><small style={{ color: '#a5a1b9', textAlign: 'left' }}>{(form.bio || '').length}/800</small></label></section>
      <section style={{ display: 'grid', gap: 12, borderTop: '1px solid #333142', paddingTop: 16 }}><h4 style={{ margin: 0 }}>البريد والتوثيق</h4>
        <label style={labelStyle}>البريد الإلكتروني<input style={fieldStyle} type="email" value={form.email || ''} onChange={change('email')} required /></label><div style={{ display: 'flex', gap: 9, alignItems: 'center', flexWrap: 'wrap' }}><span style={{ color: user?.email_verified ? '#86efac' : '#fcd34d' }}>{user?.email_verified ? '✓ البريد موثّق' : 'البريد غير موثّق'}</span>{!user?.email_verified && <Button type="button" onClick={sendEmail}>إرسال رمز البريد</Button>}</div>
        <label style={labelStyle}>رقم الهاتف<input style={fieldStyle} type="tel" placeholder="+9665XXXXXXXX" value={form.phone_number || ''} onChange={change('phone_number')} /></label><div style={{ display: 'flex', gap: 9, alignItems: 'center', flexWrap: 'wrap' }}><span style={{ color: user?.phone_verified ? '#86efac' : '#fcd34d' }}>{user?.phone_verified ? '✓ الهاتف موثّق' : 'الهاتف غير موثّق'}</span>{form.phone_number && !user?.phone_verified && <Button type="button" onClick={sendPhone}>إرسال رمز SMS</Button>}</div>
        {form.phone_number && !user?.phone_verified && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><input style={{ ...fieldStyle, flex: '1 1 160px' }} inputMode="numeric" placeholder="رمز التحقق" value={phoneCode} onChange={(e) => setPhoneCode(e.target.value)} maxLength="6" /><Button type="button" onClick={verifyPhone}>توثيق الهاتف</Button></div>}
      </section>
      <div style={{ display: 'flex', justifyContent: 'flex-start', gap: 10, flexWrap: 'wrap' }}><Button type="submit" disabled={saving}>{saving ? 'جارٍ الحفظ…' : 'حفظ التعديلات'}</Button><Button type="button" variant="secondary" onClick={onClose}>إلغاء</Button></div>
      <section style={{ display: 'grid', gap: 10, borderTop: '1px solid #6b1f2a', paddingTop: 16 }}><h4 style={{ margin: 0, color: '#fca5a5' }}>منطقة خطرة — حذف الحساب</h4><p style={{ margin: 0, fontSize: 13, color: '#d1cddc' }}>سيُحذف الحساب وجلساته وبياناته المرتبطة نهائياً. اكتب DELETE ثم اضغط حذف.</p><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><input style={{ ...fieldStyle, flex: '1 1 150px' }} value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} placeholder="DELETE" /><button type="button" onClick={removeAccount} style={{ border: 0, borderRadius: 10, padding: '10px 14px', background: '#b91c1c', color: '#fff', fontFamily: 'inherit', cursor: 'pointer' }}>حذف الحساب</button></div></section>
    </form>
  </Modal>;
}

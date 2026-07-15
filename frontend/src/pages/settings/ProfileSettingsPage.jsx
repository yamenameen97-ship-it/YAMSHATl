import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SettingsShell, { SettingsSection, SettingsRow, SettingsToggle } from '../../components/settings/SettingsShell.jsx';
import Button from '../../components/ui/Button.jsx';

const PROFILE_KEY = 'yamshat:profile-settings';

function loadPrefs() {
  try {
    return JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}');
  } catch { return {}; }
}

function savePrefs(prefs) {
  try { localStorage.setItem(PROFILE_KEY, JSON.stringify(prefs)); } catch {}
}

export default function ProfileSettingsPage() {
  const navigate = useNavigate();
  const [prefs, setPrefs] = useState(() => ({
    privateAccount: false,
    showOnlineStatus: true,
    showLastSeen: true,
    allowFollowRequests: true,
    allowProfileTagging: true,
    allowMentions: 'everyone',
    showActivityStatus: true,
    showProfilePhoto: 'everyone',
    showStoryToFollowers: true,
    allowDirectMessages: 'followers',
    allowProfileSharing: true,
    showVerificationBadge: true,
    hideFromSearch: false,
    blurSensitiveContent: true,
    autoTranslateBio: false,
    ...loadPrefs(),
  }));
  const [message, setMessage] = useState('');

  const update = (key, value) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    savePrefs(next);
    setMessage('تم حفظ الإعدادات.');
    setTimeout(() => setMessage(''), 2000);
  };

  return (
    <SettingsShell
      title="إعدادات الملف الشخصي"
      subtitle="تحكم في خصوصية ملفك، من يستطيع رؤيتك، التفاعل معك، ومراسلتك."
      icon="👤"
      backTo="/profile"
      message={message}
    >
      <SettingsSection title="الخصوصية الأساسية" description="من يستطيع رؤية محتواك ومتابعتك">
        <SettingsRow icon="🔒" title="حساب خاص" description="يجب الموافقة على طلبات المتابعة قبل رؤية محتواك">
          <SettingsToggle on={prefs.privateAccount} onChange={(v) => update('privateAccount', v)} />
        </SettingsRow>
        <SettingsRow icon="🟢" title="إظهار حالة الاتصال" description="السماح للآخرين برؤية أنك متصل الآن">
          <SettingsToggle on={prefs.showOnlineStatus} onChange={(v) => update('showOnlineStatus', v)} />
        </SettingsRow>
        <SettingsRow icon="⏱️" title="إظهار آخر ظهور" description="عرض وقت آخر نشاط لك">
          <SettingsToggle on={prefs.showLastSeen} onChange={(v) => update('showLastSeen', v)} />
        </SettingsRow>
        <SettingsRow icon="📊" title="حالة النشاط" description="إظهار آخر نشاطك في التطبيق">
          <SettingsToggle on={prefs.showActivityStatus} onChange={(v) => update('showActivityStatus', v)} />
        </SettingsRow>
        <SettingsRow icon="🔍" title="إخفاء من البحث" description="عدم ظهور حسابك في نتائج البحث للغرباء">
          <SettingsToggle on={prefs.hideFromSearch} onChange={(v) => update('hideFromSearch', v)} />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="من يستطيع التفاعل معي" description="تحكم في الرسائل والذكر والإشارات">
        <SettingsRow icon="💬" title="السماح بالرسائل المباشرة" description="من يستطيع إرسال رسائل لك">
          <select className="settings-select" value={prefs.allowDirectMessages} onChange={(e) => update('allowDirectMessages', e.target.value)}>
            <option value="everyone">الجميع</option>
            <option value="followers">المتابعون فقط</option>
            <option value="mutual">المتابعة المتبادلة</option>
            <option value="nobody">لا أحد</option>
          </select>
        </SettingsRow>
        <SettingsRow icon="@" title="من يستطيع الإشارة لي (@)" description="التحكم في إشارات @">
          <select className="settings-select" value={prefs.allowMentions} onChange={(e) => update('allowMentions', e.target.value)}>
            <option value="everyone">الجميع</option>
            <option value="followers">المتابعون</option>
            <option value="nobody">لا أحد</option>
          </select>
        </SettingsRow>
        <SettingsRow icon="🏷️" title="السماح بتعليمي في الصور" description="عند رفع صور للآخرين">
          <SettingsToggle on={prefs.allowProfileTagging} onChange={(v) => update('allowProfileTagging', v)} />
        </SettingsRow>
        <SettingsRow icon="👥" title="السماح بطلبات المتابعة" description="استقبال طلبات متابعة جديدة">
          <SettingsToggle on={prefs.allowFollowRequests} onChange={(v) => update('allowFollowRequests', v)} />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="الصورة والمحتوى" description="إعدادات الصورة الشخصية وعرض المحتوى">
        <SettingsRow icon="🖼️" title="من يستطيع رؤية صورة الملف" description="عرض الصورة الشخصية الرئيسية">
          <select className="settings-select" value={prefs.showProfilePhoto} onChange={(e) => update('showProfilePhoto', e.target.value)}>
            <option value="everyone">الجميع</option>
            <option value="followers">المتابعون</option>
            <option value="nobody">لا أحد</option>
          </select>
        </SettingsRow>
        <SettingsRow icon="📖" title="مشاركة قصصي مع المتابعين" description="السماح للمتابعين برؤية ستوريز">
          <SettingsToggle on={prefs.showStoryToFollowers} onChange={(v) => update('showStoryToFollowers', v)} />
        </SettingsRow>
        <SettingsRow icon="🔁" title="السماح بمشاركة ملفي" description="تمكين زر المشاركة في صفحتك">
          <SettingsToggle on={prefs.allowProfileSharing} onChange={(v) => update('allowProfileSharing', v)} />
        </SettingsRow>
        <SettingsRow icon="✅" title="إظهار شارة التوثيق" description="عرض شارة الحساب الموثق">
          <SettingsToggle on={prefs.showVerificationBadge} onChange={(v) => update('showVerificationBadge', v)} />
        </SettingsRow>
        <SettingsRow icon="🌫️" title="ضبابية المحتوى الحساس" description="تمويه المحتوى الحساس قبل عرضه">
          <SettingsToggle on={prefs.blurSensitiveContent} onChange={(v) => update('blurSensitiveContent', v)} />
        </SettingsRow>
        <SettingsRow icon="🌐" title="ترجمة السيرة الذاتية تلقائيًا" description="ترجمة Bio إلى لغتك">
          <SettingsToggle on={prefs.autoTranslateBio} onChange={(v) => update('autoTranslateBio', v)} />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="الحسابات المحظورة والمكتومة">
        <SettingsRow icon="🚫" title="الحسابات المحظورة" description="عرض وإدارة الحسابات التي حظرتها">
          <Button variant="secondary" size="small" onClick={() => navigate('/settings?tab=blocked')}>إدارة</Button>
        </SettingsRow>
        <SettingsRow icon="🔇" title="الحسابات المكتومة" description="حسابات لا ترى محتواها">
          <Button variant="secondary" size="small" onClick={() => navigate('/settings?tab=muted')}>إدارة</Button>
        </SettingsRow>
      </SettingsSection>
    </SettingsShell>
  );
}

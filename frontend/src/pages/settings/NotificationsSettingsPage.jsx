import { useState } from 'react';
import SettingsShell, { SettingsSection, SettingsRow, SettingsToggle } from '../../components/settings/SettingsShell.jsx';
import Button from '../../components/ui/Button.jsx';

const KEY = 'yamshat:notifications-settings';
const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; } };
const save = (p) => { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch {} };

export default function NotificationsSettingsPage() {
  const [prefs, setPrefs] = useState(() => ({
    pushEnabled: true,
    emailEnabled: true,
    smsEnabled: false,
    inAppEnabled: true,

    likes: true,
    comments: true,
    mentions: true,
    follows: true,
    followRequests: true,
    messages: true,
    groupActivity: true,
    storyViews: false,
    storyReplies: true,
    reelsActivity: true,
    liveStreams: true,
    voiceRooms: true,
    pkBattles: true,

    accountSecurity: true,
    loginAlerts: true,
    paymentAlerts: true,

    productUpdates: true,
    tipsAndTutorials: false,
    marketing: false,
    weeklyDigest: true,
    eventReminders: true,

    sound: true,
    vibration: true,
    badge: true,
    preview: 'full',
    quietHoursEnabled: false,
    quietStart: '22:00',
    quietEnd: '07:00',
    groupNotifications: 'mentions',
    notificationTone: 'default',
    ...load(),
  }));
  const [msg, setMsg] = useState('');

  const u = (k, v) => {
    const n = { ...prefs, [k]: v };
    setPrefs(n); save(n);
    setMsg('تم الحفظ.');
    setTimeout(() => setMsg(''), 1500);
  };

  return (
    <SettingsShell title="إعدادات الإشعارات" subtitle="تحكم تفصيلي في كل نوع إشعار." icon="🔔" backTo="/notifications" message={msg}>
      <SettingsSection title="قنوات الإشعارات" description="كيف تستلم الإشعارات">
        <SettingsRow icon="📲" title="إشعارات Push" description="إشعارات على الجهاز">
          <SettingsToggle on={prefs.pushEnabled} onChange={(v) => u('pushEnabled', v)} />
        </SettingsRow>
        <SettingsRow icon="📧" title="البريد الإلكتروني">
          <SettingsToggle on={prefs.emailEnabled} onChange={(v) => u('emailEnabled', v)} />
        </SettingsRow>
        <SettingsRow icon="📱" title="رسائل SMS">
          <SettingsToggle on={prefs.smsEnabled} onChange={(v) => u('smsEnabled', v)} />
        </SettingsRow>
        <SettingsRow icon="🔔" title="داخل التطبيق">
          <SettingsToggle on={prefs.inAppEnabled} onChange={(v) => u('inAppEnabled', v)} />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="التفاعلات الاجتماعية">
        <SettingsRow icon="❤️" title="الإعجابات">
          <SettingsToggle on={prefs.likes} onChange={(v) => u('likes', v)} />
        </SettingsRow>
        <SettingsRow icon="💬" title="التعليقات">
          <SettingsToggle on={prefs.comments} onChange={(v) => u('comments', v)} />
        </SettingsRow>
        <SettingsRow icon="@" title="الإشارات (@mentions)">
          <SettingsToggle on={prefs.mentions} onChange={(v) => u('mentions', v)} />
        </SettingsRow>
        <SettingsRow icon="👤" title="متابعون جدد">
          <SettingsToggle on={prefs.follows} onChange={(v) => u('follows', v)} />
        </SettingsRow>
        <SettingsRow icon="🙋" title="طلبات المتابعة">
          <SettingsToggle on={prefs.followRequests} onChange={(v) => u('followRequests', v)} />
        </SettingsRow>
        <SettingsRow icon="✉️" title="الرسائل المباشرة">
          <SettingsToggle on={prefs.messages} onChange={(v) => u('messages', v)} />
        </SettingsRow>
        <SettingsRow icon="👥" title="نشاط المجموعات">
          <SettingsToggle on={prefs.groupActivity} onChange={(v) => u('groupActivity', v)} />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="الستوريز والريلز والبث">
        <SettingsRow icon="👁️" title="مشاهدات الستوري">
          <SettingsToggle on={prefs.storyViews} onChange={(v) => u('storyViews', v)} />
        </SettingsRow>
        <SettingsRow icon="💭" title="ردود الستوري">
          <SettingsToggle on={prefs.storyReplies} onChange={(v) => u('storyReplies', v)} />
        </SettingsRow>
        <SettingsRow icon="🎬" title="نشاط الريلز">
          <SettingsToggle on={prefs.reelsActivity} onChange={(v) => u('reelsActivity', v)} />
        </SettingsRow>
        <SettingsRow icon="🔴" title="بث مباشر من المتابعين">
          <SettingsToggle on={prefs.liveStreams} onChange={(v) => u('liveStreams', v)} />
        </SettingsRow>
        <SettingsRow icon="🎙️" title="غرف صوتية">
          <SettingsToggle on={prefs.voiceRooms} onChange={(v) => u('voiceRooms', v)} />
        </SettingsRow>
        <SettingsRow icon="⚔️" title="معارك PK">
          <SettingsToggle on={prefs.pkBattles} onChange={(v) => u('pkBattles', v)} />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="الأمان والحساب">
        <SettingsRow icon="🔐" title="أمان الحساب">
          <SettingsToggle on={prefs.accountSecurity} onChange={(v) => u('accountSecurity', v)} />
        </SettingsRow>
        <SettingsRow icon="🚨" title="تنبيهات تسجيل الدخول">
          <SettingsToggle on={prefs.loginAlerts} onChange={(v) => u('loginAlerts', v)} />
        </SettingsRow>
        <SettingsRow icon="💳" title="تنبيهات الدفع والمحفظة">
          <SettingsToggle on={prefs.paymentAlerts} onChange={(v) => u('paymentAlerts', v)} />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="تحديثات ومحتوى تسويقي">
        <SettingsRow icon="🆕" title="تحديثات المنتج">
          <SettingsToggle on={prefs.productUpdates} onChange={(v) => u('productUpdates', v)} />
        </SettingsRow>
        <SettingsRow icon="💡" title="نصائح ودروس">
          <SettingsToggle on={prefs.tipsAndTutorials} onChange={(v) => u('tipsAndTutorials', v)} />
        </SettingsRow>
        <SettingsRow icon="📢" title="عروض تسويقية">
          <SettingsToggle on={prefs.marketing} onChange={(v) => u('marketing', v)} />
        </SettingsRow>
        <SettingsRow icon="📊" title="ملخص أسبوعي">
          <SettingsToggle on={prefs.weeklyDigest} onChange={(v) => u('weeklyDigest', v)} />
        </SettingsRow>
        <SettingsRow icon="📅" title="تذكيرات الأحداث">
          <SettingsToggle on={prefs.eventReminders} onChange={(v) => u('eventReminders', v)} />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="السلوك العام">
        <SettingsRow icon="🔊" title="الصوت">
          <SettingsToggle on={prefs.sound} onChange={(v) => u('sound', v)} />
        </SettingsRow>
        <SettingsRow icon="📳" title="الاهتزاز">
          <SettingsToggle on={prefs.vibration} onChange={(v) => u('vibration', v)} />
        </SettingsRow>
        <SettingsRow icon="🔢" title="شارة العدد (Badge)">
          <SettingsToggle on={prefs.badge} onChange={(v) => u('badge', v)} />
        </SettingsRow>
        <SettingsRow icon="👀" title="معاينة الإشعار">
          <select className="settings-select" value={prefs.preview} onChange={(e) => u('preview', e.target.value)}>
            <option value="full">كامل</option>
            <option value="short">مختصر</option>
            <option value="hidden">مخفي</option>
          </select>
        </SettingsRow>
        <SettingsRow icon="🎵" title="نغمة الإشعار">
          <select className="settings-select" value={prefs.notificationTone} onChange={(e) => u('notificationTone', e.target.value)}>
            <option value="default">افتراضي</option>
            <option value="chime">رنين</option>
            <option value="ding">بسيط</option>
            <option value="soft">ناعم</option>
            <option value="silent">صامت</option>
          </select>
        </SettingsRow>
        <SettingsRow icon="🌙" title="ساعات الهدوء (Do Not Disturb)">
          <SettingsToggle on={prefs.quietHoursEnabled} onChange={(v) => u('quietHoursEnabled', v)} />
        </SettingsRow>
        {prefs.quietHoursEnabled ? (
          <>
            <SettingsRow icon="🌃" title="بداية الهدوء">
              <input className="settings-input" type="time" value={prefs.quietStart} onChange={(e) => u('quietStart', e.target.value)} />
            </SettingsRow>
            <SettingsRow icon="🌅" title="نهاية الهدوء">
              <input className="settings-input" type="time" value={prefs.quietEnd} onChange={(e) => u('quietEnd', e.target.value)} />
            </SettingsRow>
          </>
        ) : null}
        <SettingsRow icon="👥" title="إشعارات المجموعات">
          <select className="settings-select" value={prefs.groupNotifications} onChange={(e) => u('groupNotifications', e.target.value)}>
            <option value="all">كل الرسائل</option>
            <option value="mentions">الإشارات فقط</option>
            <option value="none">صامت</option>
          </select>
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="إجراءات">
        <SettingsRow icon="✅" title="تمييز الكل كمقروء">
          <Button variant="secondary" size="small" onClick={() => { setMsg('تم التمييز كمقروء.'); setTimeout(() => setMsg(''), 1500); }}>تنفيذ</Button>
        </SettingsRow>
        <SettingsRow icon="🗑️" title="مسح كل الإشعارات">
          <Button variant="secondary" size="small" className="settings-danger" onClick={() => { if (confirm('تأكيد المسح؟')) { setMsg('تم المسح.'); setTimeout(() => setMsg(''), 1500); } }}>مسح</Button>
        </SettingsRow>
      </SettingsSection>
    </SettingsShell>
  );
}

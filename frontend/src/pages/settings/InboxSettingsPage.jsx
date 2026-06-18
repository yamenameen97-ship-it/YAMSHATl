import { useState } from 'react';
import SettingsShell, { SettingsSection, SettingsRow, SettingsToggle } from '../../components/settings/SettingsShell.jsx';
import Button from '../../components/ui/Button.jsx';

const KEY = 'yamshat:inbox-settings';
const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; } };
const save = (p) => { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch {} };

export default function InboxSettingsPage() {
  const [prefs, setPrefs] = useState(() => ({
    showReadReceipts: true,
    sendReadReceipts: true,
    showTypingIndicator: true,
    sendTypingIndicator: true,
    enterToSend: true,
    autoDownloadMedia: 'wifi',
    autoDownloadDocs: 'never',
    autoPlayGifs: true,
    autoPlayVideos: true,
    autoSaveMedia: false,
    chatBackup: true,
    backupFrequency: 'daily',
    encryptedBackup: true,
    deleteMessagesAfter: 'never',
    chatTheme: 'default',
    bubbleStyle: 'rounded',
    fontSize: 'medium',
    showAvatars: true,
    showGroupAvatars: true,
    soundOnSend: true,
    soundOnReceive: true,
    vibrationOnMessage: true,
    archiveOldChats: false,
    archiveAfterDays: 90,
    organizeBy: 'recent',
    showUnreadFirst: true,
    pinFavorites: true,
    requestsFolderEnabled: true,
    spamFilter: true,
    translateMessages: false,
    autoTranslateLang: 'ar',
    voiceMessageAutoplay: false,
    transcribeVoiceMessages: false,
    disappearingMessages: false,
    disappearingDuration: '24h',
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
    <SettingsShell title="إعدادات الرسائل والصندوق" subtitle="الإشعارات، الإيصالات، النسخ الاحتياطي، ومظهر المحادثات." icon="✉️" backTo="/inbox" message={msg}>
      <SettingsSection title="المؤشرات والإيصالات">
        <SettingsRow icon="✓✓" title="إرسال إيصال القراءة">
          <SettingsToggle on={prefs.sendReadReceipts} onChange={(v) => u('sendReadReceipts', v)} />
        </SettingsRow>
        <SettingsRow icon="👁️" title="رؤية إيصالات قراءة الآخرين">
          <SettingsToggle on={prefs.showReadReceipts} onChange={(v) => u('showReadReceipts', v)} />
        </SettingsRow>
        <SettingsRow icon="✏️" title="إرسال مؤشر الكتابة">
          <SettingsToggle on={prefs.sendTypingIndicator} onChange={(v) => u('sendTypingIndicator', v)} />
        </SettingsRow>
        <SettingsRow icon="...." title="رؤية مؤشر كتابة الآخرين">
          <SettingsToggle on={prefs.showTypingIndicator} onChange={(v) => u('showTypingIndicator', v)} />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="الإرسال والوسائط">
        <SettingsRow icon="⏎" title="Enter للإرسال">
          <SettingsToggle on={prefs.enterToSend} onChange={(v) => u('enterToSend', v)} />
        </SettingsRow>
        <SettingsRow icon="📥" title="تنزيل الوسائط تلقائيًا">
          <select className="settings-select" value={prefs.autoDownloadMedia} onChange={(e) => u('autoDownloadMedia', e.target.value)}>
            <option value="never">أبدًا</option>
            <option value="wifi">WiFi فقط</option>
            <option value="always">دائمًا</option>
          </select>
        </SettingsRow>
        <SettingsRow icon="📄" title="تنزيل الملفات تلقائيًا">
          <select className="settings-select" value={prefs.autoDownloadDocs} onChange={(e) => u('autoDownloadDocs', e.target.value)}>
            <option value="never">أبدًا</option>
            <option value="wifi">WiFi فقط</option>
            <option value="always">دائمًا</option>
          </select>
        </SettingsRow>
        <SettingsRow icon="🎞️" title="تشغيل GIF تلقائيًا">
          <SettingsToggle on={prefs.autoPlayGifs} onChange={(v) => u('autoPlayGifs', v)} />
        </SettingsRow>
        <SettingsRow icon="▶️" title="تشغيل الفيديو تلقائيًا">
          <SettingsToggle on={prefs.autoPlayVideos} onChange={(v) => u('autoPlayVideos', v)} />
        </SettingsRow>
        <SettingsRow icon="💾" title="حفظ الوسائط في المعرض">
          <SettingsToggle on={prefs.autoSaveMedia} onChange={(v) => u('autoSaveMedia', v)} />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="الرسائل الصوتية">
        <SettingsRow icon="🎙️" title="تشغيل تلقائي للرسائل الصوتية">
          <SettingsToggle on={prefs.voiceMessageAutoplay} onChange={(v) => u('voiceMessageAutoplay', v)} />
        </SettingsRow>
        <SettingsRow icon="📝" title="تحويل الصوت إلى نص">
          <SettingsToggle on={prefs.transcribeVoiceMessages} onChange={(v) => u('transcribeVoiceMessages', v)} />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="النسخ الاحتياطي والاحتفاظ">
        <SettingsRow icon="☁️" title="نسخ احتياطي للمحادثات">
          <SettingsToggle on={prefs.chatBackup} onChange={(v) => u('chatBackup', v)} />
        </SettingsRow>
        <SettingsRow icon="🔁" title="تكرار النسخ الاحتياطي">
          <select className="settings-select" value={prefs.backupFrequency} onChange={(e) => u('backupFrequency', e.target.value)}>
            <option value="daily">يومي</option>
            <option value="weekly">أسبوعي</option>
            <option value="monthly">شهري</option>
            <option value="manual">يدوي</option>
          </select>
        </SettingsRow>
        <SettingsRow icon="🔐" title="نسخ احتياطي مشفر (E2E)">
          <SettingsToggle on={prefs.encryptedBackup} onChange={(v) => u('encryptedBackup', v)} />
        </SettingsRow>
        <SettingsRow icon="🕒" title="حذف الرسائل بعد فترة">
          <select className="settings-select" value={prefs.deleteMessagesAfter} onChange={(e) => u('deleteMessagesAfter', e.target.value)}>
            <option value="never">أبدًا</option>
            <option value="7days">7 أيام</option>
            <option value="30days">30 يوم</option>
            <option value="90days">90 يوم</option>
            <option value="1year">سنة</option>
          </select>
        </SettingsRow>
        <SettingsRow icon="🔥" title="الرسائل المختفية">
          <SettingsToggle on={prefs.disappearingMessages} onChange={(v) => u('disappearingMessages', v)} />
        </SettingsRow>
        {prefs.disappearingMessages ? (
          <SettingsRow icon="⏱️" title="مدة الاختفاء">
            <select className="settings-select" value={prefs.disappearingDuration} onChange={(e) => u('disappearingDuration', e.target.value)}>
              <option value="24h">24 ساعة</option>
              <option value="7d">7 أيام</option>
              <option value="90d">90 يوم</option>
            </select>
          </SettingsRow>
        ) : null}
      </SettingsSection>

      <SettingsSection title="المظهر">
        <SettingsRow icon="🎨" title="ثيم المحادثة">
          <select className="settings-select" value={prefs.chatTheme} onChange={(e) => u('chatTheme', e.target.value)}>
            <option value="default">افتراضي</option>
            <option value="dark">داكن</option>
            <option value="light">فاتح</option>
            <option value="purple">بنفسجي</option>
            <option value="blue">أزرق</option>
            <option value="green">أخضر</option>
          </select>
        </SettingsRow>
        <SettingsRow icon="💭" title="شكل الفقاعة">
          <select className="settings-select" value={prefs.bubbleStyle} onChange={(e) => u('bubbleStyle', e.target.value)}>
            <option value="rounded">دائرية</option>
            <option value="square">مربعة</option>
            <option value="minimal">بسيطة</option>
          </select>
        </SettingsRow>
        <SettingsRow icon="🔤" title="حجم الخط">
          <select className="settings-select" value={prefs.fontSize} onChange={(e) => u('fontSize', e.target.value)}>
            <option value="small">صغير</option>
            <option value="medium">متوسط</option>
            <option value="large">كبير</option>
            <option value="xl">كبير جدًا</option>
          </select>
        </SettingsRow>
        <SettingsRow icon="🖼️" title="عرض الصور الرمزية">
          <SettingsToggle on={prefs.showAvatars} onChange={(v) => u('showAvatars', v)} />
        </SettingsRow>
        <SettingsRow icon="👥" title="عرض صور المجموعات">
          <SettingsToggle on={prefs.showGroupAvatars} onChange={(v) => u('showGroupAvatars', v)} />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="الأصوات والاهتزاز">
        <SettingsRow icon="📤" title="صوت عند الإرسال">
          <SettingsToggle on={prefs.soundOnSend} onChange={(v) => u('soundOnSend', v)} />
        </SettingsRow>
        <SettingsRow icon="📥" title="صوت عند الاستلام">
          <SettingsToggle on={prefs.soundOnReceive} onChange={(v) => u('soundOnReceive', v)} />
        </SettingsRow>
        <SettingsRow icon="📳" title="اهتزاز عند الرسالة">
          <SettingsToggle on={prefs.vibrationOnMessage} onChange={(v) => u('vibrationOnMessage', v)} />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="تنظيم الصندوق">
        <SettingsRow icon="🔃" title="ترتيب المحادثات">
          <select className="settings-select" value={prefs.organizeBy} onChange={(e) => u('organizeBy', e.target.value)}>
            <option value="recent">الأحدث</option>
            <option value="unread">غير المقروء أولاً</option>
            <option value="pinned">المثبتة أولاً</option>
            <option value="alphabetical">أبجدي</option>
          </select>
        </SettingsRow>
        <SettingsRow icon="🔝" title="غير المقروء أولاً">
          <SettingsToggle on={prefs.showUnreadFirst} onChange={(v) => u('showUnreadFirst', v)} />
        </SettingsRow>
        <SettingsRow icon="⭐" title="تثبيت المفضلة">
          <SettingsToggle on={prefs.pinFavorites} onChange={(v) => u('pinFavorites', v)} />
        </SettingsRow>
        <SettingsRow icon="📁" title="مجلد طلبات الرسائل">
          <SettingsToggle on={prefs.requestsFolderEnabled} onChange={(v) => u('requestsFolderEnabled', v)} />
        </SettingsRow>
        <SettingsRow icon="🛡️" title="فلتر السبام">
          <SettingsToggle on={prefs.spamFilter} onChange={(v) => u('spamFilter', v)} />
        </SettingsRow>
        <SettingsRow icon="📦" title="أرشفة المحادثات القديمة تلقائيًا">
          <SettingsToggle on={prefs.archiveOldChats} onChange={(v) => u('archiveOldChats', v)} />
        </SettingsRow>
        {prefs.archiveOldChats ? (
          <SettingsRow icon="📅" title="أرشفة بعد (أيام)">
            <input className="settings-input" type="number" value={prefs.archiveAfterDays} onChange={(e) => u('archiveAfterDays', Number(e.target.value))} />
          </SettingsRow>
        ) : null}
      </SettingsSection>

      <SettingsSection title="الترجمة">
        <SettingsRow icon="🌐" title="ترجمة الرسائل تلقائيًا">
          <SettingsToggle on={prefs.translateMessages} onChange={(v) => u('translateMessages', v)} />
        </SettingsRow>
        <SettingsRow icon="🔤" title="لغة الترجمة">
          <select className="settings-select" value={prefs.autoTranslateLang} onChange={(e) => u('autoTranslateLang', e.target.value)}>
            <option value="ar">العربية</option>
            <option value="en">English</option>
            <option value="fr">Français</option>
            <option value="es">Español</option>
            <option value="tr">Türkçe</option>
          </select>
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="إجراءات">
        <SettingsRow icon="📥" title="تصدير المحادثات">
          <Button variant="secondary" size="small">تصدير</Button>
        </SettingsRow>
        <SettingsRow icon="🗑️" title="حذف كل المحادثات">
          <Button variant="secondary" size="small" className="settings-danger">حذف</Button>
        </SettingsRow>
      </SettingsSection>
    </SettingsShell>
  );
}

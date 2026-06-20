import { useState } from 'react';
import SettingsShell, { SettingsSection, SettingsRow, SettingsToggle } from '../../components/settings/SettingsShell.jsx';

const KEY = 'yamshat:stories-settings';
const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; } };
const save = (p) => { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch {} };

export default function StoriesSettingsPage() {
  const [prefs, setPrefs] = useState(() => ({
    whoCanSeeMyStory: 'followers',
    hideStoryFrom: [],
    allowReplies: 'followers',
    allowSharing: true,
    autoArchive: true,
    saveToCameraRoll: false,
    showInExplore: false,
    allowReactions: true,
    showViewerList: true,
    closeFriendsOnly: false,
    autoPlayStories: true,
    muteStoryAudio: false,
    storyDuration: 5,
    highQualityUpload: true,
    bgUploadEnabled: true,
    storyHighlights: true,
    crossPostToReels: false,
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
    <SettingsShell title="إعدادات الستوري" subtitle="خصوصية، أرشيف، ومشاركة الستوريز." icon="📖" backTo="/stories" message={msg}>
      <SettingsSection title="من يستطيع رؤية ستوري" description="تحكم في جمهور القصص">
        <SettingsRow icon="👥" title="جمهور الستوري الافتراضي">
          <select className="settings-select" value={prefs.whoCanSeeMyStory} onChange={(e) => u('whoCanSeeMyStory', e.target.value)}>
            <option value="everyone">الجميع</option>
            <option value="followers">المتابعون فقط</option>
            <option value="close-friends">الأصدقاء المقربون</option>
            <option value="custom">مخصص</option>
          </select>
        </SettingsRow>
        <SettingsRow icon="⭐" title="مشاركة فقط مع المقربين">
          <SettingsToggle on={prefs.closeFriendsOnly} onChange={(v) => u('closeFriendsOnly', v)} />
        </SettingsRow>
        <SettingsRow icon="👁️" title="عرض قائمة المشاهدين">
          <SettingsToggle on={prefs.showViewerList} onChange={(v) => u('showViewerList', v)} />
        </SettingsRow>
        <SettingsRow icon="🌐" title="ظهور في صفحة الاستكشاف">
          <SettingsToggle on={prefs.showInExplore} onChange={(v) => u('showInExplore', v)} />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="التفاعل والردود">
        <SettingsRow icon="💬" title="السماح بالردود">
          <select className="settings-select" value={prefs.allowReplies} onChange={(e) => u('allowReplies', e.target.value)}>
            <option value="everyone">الجميع</option>
            <option value="followers">المتابعون</option>
            <option value="nobody">لا أحد</option>
          </select>
        </SettingsRow>
        <SettingsRow icon="😍" title="السماح بالتفاعلات (إعجاب، إيموجي)">
          <SettingsToggle on={prefs.allowReactions} onChange={(v) => u('allowReactions', v)} />
        </SettingsRow>
        <SettingsRow icon="🔁" title="السماح بإعادة المشاركة">
          <SettingsToggle on={prefs.allowSharing} onChange={(v) => u('allowSharing', v)} />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="الأرشيف والحفظ">
        <SettingsRow icon="📦" title="الأرشفة التلقائية" description="حفظ الستوريز في الأرشيف بعد 24 ساعة">
          <SettingsToggle on={prefs.autoArchive} onChange={(v) => u('autoArchive', v)} />
        </SettingsRow>
        <SettingsRow icon="💾" title="حفظ في الكاميرا" description="حفظ نسخة محلية على الجهاز">
          <SettingsToggle on={prefs.saveToCameraRoll} onChange={(v) => u('saveToCameraRoll', v)} />
        </SettingsRow>
        <SettingsRow icon="🌟" title="تفعيل القصص المميزة (Highlights)">
          <SettingsToggle on={prefs.storyHighlights} onChange={(v) => u('storyHighlights', v)} />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="عرض الستوريز والجودة">
        <SettingsRow icon="▶️" title="تشغيل تلقائي للستوريز">
          <SettingsToggle on={prefs.autoPlayStories} onChange={(v) => u('autoPlayStories', v)} />
        </SettingsRow>
        <SettingsRow icon="🔇" title="كتم صوت الستوريز افتراضيًا">
          <SettingsToggle on={prefs.muteStoryAudio} onChange={(v) => u('muteStoryAudio', v)} />
        </SettingsRow>
        <SettingsRow icon="⏱️" title="مدة عرض كل صورة (بالثواني)">
          <select className="settings-select" value={prefs.storyDuration} onChange={(e) => u('storyDuration', Number(e.target.value))}>
            <option value={3}>3 ثوان</option>
            <option value={5}>5 ثوان</option>
            <option value={7}>7 ثوان</option>
            <option value={10}>10 ثوان</option>
          </select>
        </SettingsRow>
        <SettingsRow icon="🎨" title="رفع بجودة عالية">
          <SettingsToggle on={prefs.highQualityUpload} onChange={(v) => u('highQualityUpload', v)} />
        </SettingsRow>
        <SettingsRow icon="📤" title="رفع في الخلفية">
          <SettingsToggle on={prefs.bgUploadEnabled} onChange={(v) => u('bgUploadEnabled', v)} />
        </SettingsRow>
        <SettingsRow icon="🎬" title="نشر الستوري في الريلز تلقائيًا">
          <SettingsToggle on={prefs.crossPostToReels} onChange={(v) => u('crossPostToReels', v)} />
        </SettingsRow>
      </SettingsSection>
    </SettingsShell>
  );
}

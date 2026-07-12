import { useState } from 'react';
import { Link } from 'react-router-dom';
import SettingsShell, { SettingsSection, SettingsRow, SettingsToggle } from '../../components/settings/SettingsShell.jsx';

const KEY = 'yamshat:stories-settings';
// ✅ v87.5 FIX #5: توحيد قيم الخصوصية مع الباك (close_friends بشرطة سفلية).
// سابقاً: الواجهة تحفظ 'close-friends' والباك يتوقع 'close_friends'
// → القصة تُرفوض من الخلفية وتعود إلى friends صامتة → إعداد المقربين مُلغى!
function _normalizePrivacy(p) {
  if (typeof p !== 'string') return p;
  if (p === 'close-friends') return 'close_friends';
  return p;
}
const load = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}');
    if (raw && typeof raw === 'object') {
      if (raw.whoCanSeeMyStory) raw.whoCanSeeMyStory = _normalizePrivacy(raw.whoCanSeeMyStory);
      if (raw.allowReplies)      raw.allowReplies      = _normalizePrivacy(raw.allowReplies);
    }
    return raw;
  } catch { return {}; }
};
const save = (p) => { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch {} };

export default function StoriesSettingsPage() {
  const [prefs, setPrefs] = useState(() => ({
    // v59.1: السياسة الجديدة — لا توجد قصص عامة، الأصدقاء فقط
    whoCanSeeMyStory: 'friends',
    hideStoryFrom: [],
    allowReplies: 'friends',
    allowSharing: false,        // معطّل افتراضيًا لأن القصص خاصة بالأصدقاء
    autoArchive: true,
    saveToCameraRoll: false,
    showInExplore: false,        // غير متاح في السياسة الجديدة
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
      <div dir="rtl" style={{ fontFamily: "'Noto Sans Arabic', 'Tajawal', system-ui, sans-serif" }}>

      <SettingsSection title="من يستطيع رؤية ستوري" description="القصص خاصة بالأصدقاء فقط ولا تظهر للعامة">
        <SettingsRow icon="👥" title="جمهور الستوري الافتراضي">
          {/* ✅ v87.5 FIX #5: القيم موحدة مع الباك (close_friends) */}
          <select className="settings-select" value={prefs.whoCanSeeMyStory} onChange={(e) => u('whoCanSeeMyStory', e.target.value)}>
            <option value="friends">الأصدقاء فقط</option>
            <option value="close_friends">الأصدقاء المقربون</option>
            <option value="private">خاص (أنا فقط)</option>
          </select>
        </SettingsRow>
        <SettingsRow icon="💚" title="مشاركة فقط مع المقربين">
          <SettingsToggle on={prefs.closeFriendsOnly} onChange={(v) => u('closeFriendsOnly', v)} />
        </SettingsRow>
        {/* ✅ v87.11 — إدارة قائمة المقربين */}
        <SettingsRow icon="💚" title="إدارة قائمة الأصدقاء المقربين" description="إضافة/إزالة الأشخاص الذين يرون قصص «المقربون فقط»">
          <Link to="/settings/stories/close-friends" className="settings-link-btn">فتح</Link>
        </SettingsRow>
        {/* ✅ v87.11 — إخفاء القصة من مستخدمين محددين */}
        <SettingsRow icon="🙈" title="إخفاء قصتي من أشخاص محددين" description="لن يرى المستخدمون المُختارون أياً من قصصك">
          <Link to="/settings/stories/hide-from" className="settings-link-btn">فتح</Link>
        </SettingsRow>
        {/* v87.12 — كتم قصص مستخدمين محددين */}
        <SettingsRow icon="🔕" title="قصص مكتومة" description="المستخدمون الذين كتمت قصصهم من شريط الستوري">
          <Link to="/settings/stories/muted" className="settings-link-btn">فتح</Link>
        </SettingsRow>
        <SettingsRow icon="👁️" title="عرض قائمة المشاهدين">
          <SettingsToggle on={prefs.showViewerList} onChange={(v) => u('showViewerList', v)} />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="التفاعل والردود">
        <SettingsRow icon="💬" title="السماح بالردود">
          {/* ✅ v87.5 FIX #5: close_friends بدل close-friends */}
          <select className="settings-select" value={prefs.allowReplies} onChange={(e) => u('allowReplies', e.target.value)}>
            <option value="friends">الأصدقاء</option>
            <option value="close_friends">المقربون فقط</option>
            <option value="nobody">لا أحد</option>
          </select>
        </SettingsRow>
        <SettingsRow icon="😍" title="السماح بالتفاعلات (إعجاب، إيموجي)">
          <SettingsToggle on={prefs.allowReactions} onChange={(v) => u('allowReactions', v)} />
        </SettingsRow>
        <SettingsRow icon="🔁" title="السماح بإعادة المشاركة" description="ضمن الأصدقاء فقط">
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

      </div>

      <style>{`
        .settings-link-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 6px 14px; border-radius: 10px;
          background: linear-gradient(135deg, #4f9cff, #6b7cff);
          color: #fff; font-weight: 700; font-size: 12px;
          text-decoration: none; cursor: pointer;
          transition: transform 0.15s ease, opacity 0.15s ease;
        }
        .settings-link-btn:hover { transform: translateY(-1px); opacity: 0.94; }
      `}</style>
    </SettingsShell>
  );
}

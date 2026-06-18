import { useState } from 'react';
import SettingsShell, { SettingsSection, SettingsRow, SettingsToggle } from '../../components/settings/SettingsShell.jsx';

const KEY = 'yamshat:reels-settings';

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; }
}
function save(p) { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch {} }

export default function ReelsSettingsPage() {
  const [prefs, setPrefs] = useState(() => ({
    autoplay: true,
    autoplayOnWifi: true,
    autoplayOnMobileData: false,
    quality: 'auto',
    captionsEnabled: true,
    captionsLanguage: 'ar',
    soundEnabled: true,
    soundDefault: 'muted',
    loopReels: true,
    saveDataMode: false,
    preloadNext: true,
    hapticFeedback: true,
    showWatermark: true,
    allowDownloads: false,
    allowDuet: true,
    allowStitch: true,
    allowComments: true,
    allowSharing: true,
    hideViewCount: false,
    autoplayInBackground: false,
    nightModeBoost: false,
    skipSensitive: true,
    contentLanguage: 'ar',
    interestCategories: 'mixed',
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
    <SettingsShell title="إعدادات الريلز" subtitle="تشغيل، جودة، تعليقات، ومشاركة الريلز." icon="🎬" backTo="/reels" message={msg}>
      <SettingsSection title="التشغيل التلقائي" description="كيف ومتى يتم تشغيل الريلز">
        <SettingsRow icon="▶️" title="تشغيل تلقائي" description="بدء التشغيل عند ظهور الريل">
          <SettingsToggle on={prefs.autoplay} onChange={(v) => u('autoplay', v)} />
        </SettingsRow>
        <SettingsRow icon="📶" title="تلقائي على الواي فاي" description="فقط عند الاتصال بشبكة WiFi">
          <SettingsToggle on={prefs.autoplayOnWifi} onChange={(v) => u('autoplayOnWifi', v)} />
        </SettingsRow>
        <SettingsRow icon="📱" title="تلقائي على بيانات الجوال" description="استخدام بيانات الجوال للتشغيل">
          <SettingsToggle on={prefs.autoplayOnMobileData} onChange={(v) => u('autoplayOnMobileData', v)} />
        </SettingsRow>
        <SettingsRow icon="🔁" title="تكرار الريل" description="إعادة الفيديو تلقائيًا عند انتهائه">
          <SettingsToggle on={prefs.loopReels} onChange={(v) => u('loopReels', v)} />
        </SettingsRow>
        <SettingsRow icon="⏩" title="تحميل مسبق للتالي" description="تسريع التنقل بين الريلز">
          <SettingsToggle on={prefs.preloadNext} onChange={(v) => u('preloadNext', v)} />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="الجودة والبيانات">
        <SettingsRow icon="🎚️" title="جودة الفيديو" description="اختر جودة الفيديو الافتراضية">
          <select className="settings-select" value={prefs.quality} onChange={(e) => u('quality', e.target.value)}>
            <option value="auto">تلقائي</option>
            <option value="1080p">عالية 1080p</option>
            <option value="720p">متوسطة 720p</option>
            <option value="480p">منخفضة 480p</option>
            <option value="360p">موفر بيانات 360p</option>
          </select>
        </SettingsRow>
        <SettingsRow icon="💾" title="وضع توفير البيانات" description="خفض جودة الفيديو لتوفير البيانات">
          <SettingsToggle on={prefs.saveDataMode} onChange={(v) => u('saveDataMode', v)} />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="الصوت والترجمة">
        <SettingsRow icon="🔊" title="تفعيل الصوت" description="السماح بتشغيل الصوت">
          <SettingsToggle on={prefs.soundEnabled} onChange={(v) => u('soundEnabled', v)} />
        </SettingsRow>
        <SettingsRow icon="🔇" title="حالة الصوت الافتراضية">
          <select className="settings-select" value={prefs.soundDefault} onChange={(e) => u('soundDefault', e.target.value)}>
            <option value="muted">مكتوم</option>
            <option value="unmuted">صوت مفتوح</option>
            <option value="last">آخر اختيار</option>
          </select>
        </SettingsRow>
        <SettingsRow icon="📝" title="الترجمة التلقائية (Captions)" description="عرض ترجمة الفيديو تلقائيًا">
          <SettingsToggle on={prefs.captionsEnabled} onChange={(v) => u('captionsEnabled', v)} />
        </SettingsRow>
        <SettingsRow icon="🌐" title="لغة الترجمة">
          <select className="settings-select" value={prefs.captionsLanguage} onChange={(e) => u('captionsLanguage', e.target.value)}>
            <option value="ar">العربية</option>
            <option value="en">English</option>
            <option value="auto">تلقائي</option>
          </select>
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="التفاعلات والمشاركة" description="من يستطيع التفاعل مع ريلزك">
        <SettingsRow icon="💬" title="السماح بالتعليقات">
          <SettingsToggle on={prefs.allowComments} onChange={(v) => u('allowComments', v)} />
        </SettingsRow>
        <SettingsRow icon="🔗" title="السماح بالمشاركة">
          <SettingsToggle on={prefs.allowSharing} onChange={(v) => u('allowSharing', v)} />
        </SettingsRow>
        <SettingsRow icon="🎭" title="السماح بالـ Duet" description="السماح للآخرين بإنشاء duet مع ريلزك">
          <SettingsToggle on={prefs.allowDuet} onChange={(v) => u('allowDuet', v)} />
        </SettingsRow>
        <SettingsRow icon="🧵" title="السماح بالـ Stitch" description="السماح بدمج جزء من ريلك في ريل آخر">
          <SettingsToggle on={prefs.allowStitch} onChange={(v) => u('allowStitch', v)} />
        </SettingsRow>
        <SettingsRow icon="⬇️" title="السماح بالتحميل">
          <SettingsToggle on={prefs.allowDownloads} onChange={(v) => u('allowDownloads', v)} />
        </SettingsRow>
        <SettingsRow icon="👀" title="إخفاء عدد المشاهدات">
          <SettingsToggle on={prefs.hideViewCount} onChange={(v) => u('hideViewCount', v)} />
        </SettingsRow>
        <SettingsRow icon="💧" title="علامة مائية على التحميلات">
          <SettingsToggle on={prefs.showWatermark} onChange={(v) => u('showWatermark', v)} />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="المحتوى والاهتمامات">
        <SettingsRow icon="🌍" title="لغة المحتوى المفضلة">
          <select className="settings-select" value={prefs.contentLanguage} onChange={(e) => u('contentLanguage', e.target.value)}>
            <option value="ar">العربية</option>
            <option value="en">English</option>
            <option value="all">كل اللغات</option>
          </select>
        </SettingsRow>
        <SettingsRow icon="🎯" title="فئات الاهتمام">
          <select className="settings-select" value={prefs.interestCategories} onChange={(e) => u('interestCategories', e.target.value)}>
            <option value="mixed">متنوع</option>
            <option value="entertainment">ترفيه</option>
            <option value="education">تعليمي</option>
            <option value="sports">رياضة</option>
            <option value="music">موسيقى</option>
            <option value="comedy">كوميدي</option>
          </select>
        </SettingsRow>
        <SettingsRow icon="🚫" title="تخطي المحتوى الحساس">
          <SettingsToggle on={prefs.skipSensitive} onChange={(v) => u('skipSensitive', v)} />
        </SettingsRow>
        <SettingsRow icon="📳" title="اهتزاز عند التفاعل (Haptics)">
          <SettingsToggle on={prefs.hapticFeedback} onChange={(v) => u('hapticFeedback', v)} />
        </SettingsRow>
        <SettingsRow icon="🌙" title="تحسين الرؤية الليلية">
          <SettingsToggle on={prefs.nightModeBoost} onChange={(v) => u('nightModeBoost', v)} />
        </SettingsRow>
      </SettingsSection>
    </SettingsShell>
  );
}

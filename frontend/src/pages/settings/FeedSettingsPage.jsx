import { useState } from 'react';
import SettingsShell, { SettingsSection, SettingsRow, SettingsToggle } from '../../components/settings/SettingsShell.jsx';
import Button from '../../components/ui/Button.jsx';

const KEY = 'yamshat:feed-settings';
const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; } };
const save = (p) => { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch {} };

export default function FeedSettingsPage() {
  const [prefs, setPrefs] = useState(() => ({
    feedAlgorithm: 'smart',
    feedSort: 'recommended',
    showSensitiveContent: false,
    blurSensitive: true,
    showSuggestedPosts: true,
    showSuggestedAccounts: true,
    showAds: true,
    hideSeenPosts: false,
    autoplayVideos: true,
    showLikesCount: true,
    showCommentsPreview: true,
    showReactions: true,
    refreshOnPullDown: true,
    infiniteScroll: true,
    compactView: false,
    showPostedTime: true,
    contentLanguages: 'all',
    mutedWords: '',
    filterSpam: true,
    filterMisinformation: true,
    showVerifiedFirst: false,
    showFollowingFirst: true,
    hideReposts: false,
    hidePolls: false,
    showTrendingTopics: true,
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
    <SettingsShell title="إعدادات الخلاصة (Feed)" subtitle="خصص خلاصتك: ترتيب، فلاتر، ومحتوى." icon="📰" backTo="/" message={msg}>
      <SettingsSection title="ترتيب وخوارزمية الخلاصة">
        <SettingsRow icon="🧠" title="خوارزمية الخلاصة">
          <select className="settings-select" value={prefs.feedAlgorithm} onChange={(e) => u('feedAlgorithm', e.target.value)}>
            <option value="smart">ذكية (موصى به)</option>
            <option value="chronological">حسب الوقت</option>
            <option value="popular">الأكثر شعبية</option>
            <option value="following">المتابعون فقط</option>
          </select>
        </SettingsRow>
        <SettingsRow icon="🔀" title="ترتيب المنشورات">
          <select className="settings-select" value={prefs.feedSort} onChange={(e) => u('feedSort', e.target.value)}>
            <option value="recommended">موصى به</option>
            <option value="newest">الأحدث أولاً</option>
            <option value="oldest">الأقدم أولاً</option>
            <option value="most-engaged">الأكثر تفاعلاً</option>
          </select>
        </SettingsRow>
        <SettingsRow icon="✅" title="إظهار الحسابات الموثقة أولاً">
          <SettingsToggle on={prefs.showVerifiedFirst} onChange={(v) => u('showVerifiedFirst', v)} />
        </SettingsRow>
        <SettingsRow icon="👥" title="إظهار المتابعين أولاً">
          <SettingsToggle on={prefs.showFollowingFirst} onChange={(v) => u('showFollowingFirst', v)} />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="المحتوى والفلاتر">
        <SettingsRow icon="⚠️" title="إظهار المحتوى الحساس" description="تعطيل المرشحات الافتراضية">
          <SettingsToggle on={prefs.showSensitiveContent} onChange={(v) => u('showSensitiveContent', v)} />
        </SettingsRow>
        <SettingsRow icon="🌫️" title="ضبابية المحتوى الحساس">
          <SettingsToggle on={prefs.blurSensitive} onChange={(v) => u('blurSensitive', v)} />
        </SettingsRow>
        <SettingsRow icon="🛡️" title="فلترة السبام تلقائيًا">
          <SettingsToggle on={prefs.filterSpam} onChange={(v) => u('filterSpam', v)} />
        </SettingsRow>
        <SettingsRow icon="📢" title="فلترة المعلومات المضللة">
          <SettingsToggle on={prefs.filterMisinformation} onChange={(v) => u('filterMisinformation', v)} />
        </SettingsRow>
        <SettingsRow icon="🚫" title="كلمات محظورة" description="افصل بفاصلة، مثل: spam, ads">
          <input className="settings-input" placeholder="spam, ads, ..." value={prefs.mutedWords} onChange={(e) => u('mutedWords', e.target.value)} />
        </SettingsRow>
        <SettingsRow icon="🌍" title="لغات المحتوى">
          <select className="settings-select" value={prefs.contentLanguages} onChange={(e) => u('contentLanguages', e.target.value)}>
            <option value="all">كل اللغات</option>
            <option value="ar">العربية فقط</option>
            <option value="en">الإنجليزية فقط</option>
            <option value="ar-en">العربية والإنجليزية</option>
          </select>
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="المقترحات والإعلانات">
        <SettingsRow icon="✨" title="منشورات مقترحة" description="إظهار منشورات من حسابات لا تتابعها">
          <SettingsToggle on={prefs.showSuggestedPosts} onChange={(v) => u('showSuggestedPosts', v)} />
        </SettingsRow>
        <SettingsRow icon="👤" title="حسابات مقترحة">
          <SettingsToggle on={prefs.showSuggestedAccounts} onChange={(v) => u('showSuggestedAccounts', v)} />
        </SettingsRow>
        <SettingsRow icon="📣" title="إظهار الإعلانات">
          <SettingsToggle on={prefs.showAds} onChange={(v) => u('showAds', v)} />
        </SettingsRow>
        <SettingsRow icon="🔥" title="إظهار المواضيع الرائجة">
          <SettingsToggle on={prefs.showTrendingTopics} onChange={(v) => u('showTrendingTopics', v)} />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="العرض والتفاعل">
        <SettingsRow icon="📱" title="عرض مدمج (Compact)">
          <SettingsToggle on={prefs.compactView} onChange={(v) => u('compactView', v)} />
        </SettingsRow>
        <SettingsRow icon="▶️" title="تشغيل تلقائي للفيديوهات">
          <SettingsToggle on={prefs.autoplayVideos} onChange={(v) => u('autoplayVideos', v)} />
        </SettingsRow>
        <SettingsRow icon="❤️" title="إظهار عدد الإعجابات">
          <SettingsToggle on={prefs.showLikesCount} onChange={(v) => u('showLikesCount', v)} />
        </SettingsRow>
        <SettingsRow icon="💬" title="معاينة التعليقات">
          <SettingsToggle on={prefs.showCommentsPreview} onChange={(v) => u('showCommentsPreview', v)} />
        </SettingsRow>
        <SettingsRow icon="😀" title="إظهار التفاعلات (Reactions)">
          <SettingsToggle on={prefs.showReactions} onChange={(v) => u('showReactions', v)} />
        </SettingsRow>
        <SettingsRow icon="🕒" title="إظهار وقت النشر">
          <SettingsToggle on={prefs.showPostedTime} onChange={(v) => u('showPostedTime', v)} />
        </SettingsRow>
        <SettingsRow icon="👁️‍🗨️" title="إخفاء المنشورات المقروءة">
          <SettingsToggle on={prefs.hideSeenPosts} onChange={(v) => u('hideSeenPosts', v)} />
        </SettingsRow>
        <SettingsRow icon="🔁" title="إخفاء إعادة النشر">
          <SettingsToggle on={prefs.hideReposts} onChange={(v) => u('hideReposts', v)} />
        </SettingsRow>
        <SettingsRow icon="📊" title="إخفاء استطلاعات الرأي">
          <SettingsToggle on={prefs.hidePolls} onChange={(v) => u('hidePolls', v)} />
        </SettingsRow>
        <SettingsRow icon="🔄" title="تحديث بالسحب">
          <SettingsToggle on={prefs.refreshOnPullDown} onChange={(v) => u('refreshOnPullDown', v)} />
        </SettingsRow>
        <SettingsRow icon="♾️" title="التمرير اللانهائي">
          <SettingsToggle on={prefs.infiniteScroll} onChange={(v) => u('infiniteScroll', v)} />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="مسح وإعادة">
        <SettingsRow icon="🗑️" title="مسح سجل التصفح" description="إعادة تعيين بيانات الخوارزمية">
          <Button variant="secondary" size="small" className="settings-danger" onClick={() => { if (confirm('تأكيد المسح؟')) { try { localStorage.removeItem('yamshat:feed-history'); setMsg('تم المسح.'); setTimeout(() => setMsg(''), 1500); } catch {} } }}>مسح</Button>
        </SettingsRow>
      </SettingsSection>
    </SettingsShell>
  );
}

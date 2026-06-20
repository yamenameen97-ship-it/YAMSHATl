import { useState } from 'react';
import SettingsShell, { SettingsSection, SettingsRow, SettingsToggle } from '../../components/settings/SettingsShell.jsx';

const KEY = 'yamshat:engagement-settings';
const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; } };
const save = (p) => { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch {} };

export default function EngagementSettingsPage() {
  const [prefs, setPrefs] = useState(() => ({
    pkBattlesEnabled: true,
    autoJoinPK: false,
    pkNotifications: true,
    pkLevel: 'beginner',
    autoAcceptChallenges: false,
    showLeaderboard: true,
    showOnLeaderboard: true,
    minimumOpponentLevel: 'any',
    matchmakingRegion: 'global',
    streakReminders: true,
    rewardsEnabled: true,
    autoCollectRewards: true,
    showAchievements: true,
    showBadges: true,
    showLevelProgress: true,
    enableQuests: true,
    questNotifications: true,
    challengeFriendsAllowed: true,
    showStats: true,
    competitiveMode: false,
    safeMode: true,
    autoMuteOpponent: false,
    blurOpponentVideo: false,
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
    <SettingsShell title="إعدادات التفاعل والمعارك" subtitle="معارك PK، الإنجازات، المكافآت، والمسابقات." icon="⚔️" backTo="/engagement" message={msg}>
      <SettingsSection title="معارك PK">
        <SettingsRow icon="⚔️" title="تفعيل معارك PK">
          <SettingsToggle on={prefs.pkBattlesEnabled} onChange={(v) => u('pkBattlesEnabled', v)} />
        </SettingsRow>
        <SettingsRow icon="🤖" title="انضمام تلقائي للمعارك">
          <SettingsToggle on={prefs.autoJoinPK} onChange={(v) => u('autoJoinPK', v)} />
        </SettingsRow>
        <SettingsRow icon="🔔" title="إشعارات المعارك">
          <SettingsToggle on={prefs.pkNotifications} onChange={(v) => u('pkNotifications', v)} />
        </SettingsRow>
        <SettingsRow icon="🎯" title="مستواك في PK">
          <select className="settings-select" value={prefs.pkLevel} onChange={(e) => u('pkLevel', e.target.value)}>
            <option value="beginner">مبتدئ</option>
            <option value="intermediate">متوسط</option>
            <option value="advanced">متقدم</option>
            <option value="expert">خبير</option>
            <option value="legend">أسطورة</option>
          </select>
        </SettingsRow>
        <SettingsRow icon="✅" title="قبول التحديات تلقائيًا">
          <SettingsToggle on={prefs.autoAcceptChallenges} onChange={(v) => u('autoAcceptChallenges', v)} />
        </SettingsRow>
        <SettingsRow icon="🎚️" title="مستوى الخصم الأدنى">
          <select className="settings-select" value={prefs.minimumOpponentLevel} onChange={(e) => u('minimumOpponentLevel', e.target.value)}>
            <option value="any">أي مستوى</option>
            <option value="same">نفس المستوى فقط</option>
            <option value="higher">أعلى منك فقط</option>
            <option value="similar">مستوى مماثل (±1)</option>
          </select>
        </SettingsRow>
        <SettingsRow icon="🌎" title="منطقة المطابقة (Matchmaking)">
          <select className="settings-select" value={prefs.matchmakingRegion} onChange={(e) => u('matchmakingRegion', e.target.value)}>
            <option value="global">عالمي</option>
            <option value="mena">الشرق الأوسط</option>
            <option value="gcc">الخليج</option>
            <option value="local">المحلية</option>
          </select>
        </SettingsRow>
        <SettingsRow icon="🚫" title="كتم صوت الخصم تلقائيًا">
          <SettingsToggle on={prefs.autoMuteOpponent} onChange={(v) => u('autoMuteOpponent', v)} />
        </SettingsRow>
        <SettingsRow icon="🌫️" title="ضبابية فيديو الخصم">
          <SettingsToggle on={prefs.blurOpponentVideo} onChange={(v) => u('blurOpponentVideo', v)} />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="لوحات الصدارة والإحصائيات">
        <SettingsRow icon="🏆" title="عرض لوحة الصدارة">
          <SettingsToggle on={prefs.showLeaderboard} onChange={(v) => u('showLeaderboard', v)} />
        </SettingsRow>
        <SettingsRow icon="👤" title="إظهار اسمك في لوحة الصدارة">
          <SettingsToggle on={prefs.showOnLeaderboard} onChange={(v) => u('showOnLeaderboard', v)} />
        </SettingsRow>
        <SettingsRow icon="📊" title="عرض إحصائياتك">
          <SettingsToggle on={prefs.showStats} onChange={(v) => u('showStats', v)} />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="الإنجازات والمكافآت">
        <SettingsRow icon="🏅" title="عرض الإنجازات">
          <SettingsToggle on={prefs.showAchievements} onChange={(v) => u('showAchievements', v)} />
        </SettingsRow>
        <SettingsRow icon="🎖️" title="عرض الشارات">
          <SettingsToggle on={prefs.showBadges} onChange={(v) => u('showBadges', v)} />
        </SettingsRow>
        <SettingsRow icon="📈" title="عرض تقدم المستوى">
          <SettingsToggle on={prefs.showLevelProgress} onChange={(v) => u('showLevelProgress', v)} />
        </SettingsRow>
        <SettingsRow icon="🎁" title="تفعيل المكافآت">
          <SettingsToggle on={prefs.rewardsEnabled} onChange={(v) => u('rewardsEnabled', v)} />
        </SettingsRow>
        <SettingsRow icon="📦" title="استلام المكافآت تلقائيًا">
          <SettingsToggle on={prefs.autoCollectRewards} onChange={(v) => u('autoCollectRewards', v)} />
        </SettingsRow>
        <SettingsRow icon="🔥" title="تذكيرات السلسلة (Streaks)">
          <SettingsToggle on={prefs.streakReminders} onChange={(v) => u('streakReminders', v)} />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="المهام (Quests) والتحديات">
        <SettingsRow icon="📝" title="تفعيل المهام اليومية">
          <SettingsToggle on={prefs.enableQuests} onChange={(v) => u('enableQuests', v)} />
        </SettingsRow>
        <SettingsRow icon="🔔" title="إشعارات المهام">
          <SettingsToggle on={prefs.questNotifications} onChange={(v) => u('questNotifications', v)} />
        </SettingsRow>
        <SettingsRow icon="👥" title="السماح بتحدي الأصدقاء">
          <SettingsToggle on={prefs.challengeFriendsAllowed} onChange={(v) => u('challengeFriendsAllowed', v)} />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="وضع الأمان">
        <SettingsRow icon="🛡️" title="الوضع الآمن" description="إخفاء المحتوى التنافسي القوي">
          <SettingsToggle on={prefs.safeMode} onChange={(v) => u('safeMode', v)} />
        </SettingsRow>
        <SettingsRow icon="🏁" title="الوضع التنافسي">
          <SettingsToggle on={prefs.competitiveMode} onChange={(v) => u('competitiveMode', v)} />
        </SettingsRow>
      </SettingsSection>
    </SettingsShell>
  );
}

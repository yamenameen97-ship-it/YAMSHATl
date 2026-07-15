import { E as reactExports, I as jsxRuntimeExports } from "../index-DRmq1dbV.js";
import { S as SettingsShell, a as SettingsSection, b as SettingsRow, c as SettingsToggle } from "./SettingsShell-C-ZBPdrd.js";
const KEY = "yamshat:engagement-settings";
const load = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
};
const save = (p) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
  }
};
function EngagementSettingsPage() {
  const [prefs, setPrefs] = reactExports.useState(() => ({
    pkBattlesEnabled: true,
    autoJoinPK: false,
    pkNotifications: true,
    pkLevel: "beginner",
    autoAcceptChallenges: false,
    showLeaderboard: true,
    showOnLeaderboard: true,
    minimumOpponentLevel: "any",
    matchmakingRegion: "global",
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
    ...load()
  }));
  const [msg, setMsg] = reactExports.useState("");
  const u = (k, v) => {
    const n = { ...prefs, [k]: v };
    setPrefs(n);
    save(n);
    setMsg("تم الحفظ.");
    setTimeout(() => setMsg(""), 1500);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(SettingsShell, { title: "إعدادات التفاعل والمعارك", subtitle: "معارك PK، الإنجازات، المكافآت، والمسابقات.", icon: "⚔️", backTo: "/engagement", message: msg, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(SettingsSection, { title: "معارك PK", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "⚔️", title: "تفعيل معارك PK", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.pkBattlesEnabled, onChange: (v) => u("pkBattlesEnabled", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🤖", title: "انضمام تلقائي للمعارك", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.autoJoinPK, onChange: (v) => u("autoJoinPK", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🔔", title: "إشعارات المعارك", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.pkNotifications, onChange: (v) => u("pkNotifications", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🎯", title: "مستواك في PK", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "settings-select", value: prefs.pkLevel, onChange: (e) => u("pkLevel", e.target.value), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "beginner", children: "مبتدئ" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "intermediate", children: "متوسط" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "advanced", children: "متقدم" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "expert", children: "خبير" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "legend", children: "أسطورة" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "✅", title: "قبول التحديات تلقائيًا", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.autoAcceptChallenges, onChange: (v) => u("autoAcceptChallenges", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🎚️", title: "مستوى الخصم الأدنى", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "settings-select", value: prefs.minimumOpponentLevel, onChange: (e) => u("minimumOpponentLevel", e.target.value), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "any", children: "أي مستوى" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "same", children: "نفس المستوى فقط" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "higher", children: "أعلى منك فقط" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "similar", children: "مستوى مماثل (±1)" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🌎", title: "منطقة المطابقة (Matchmaking)", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "settings-select", value: prefs.matchmakingRegion, onChange: (e) => u("matchmakingRegion", e.target.value), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "global", children: "عالمي" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "mena", children: "الشرق الأوسط" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "gcc", children: "الخليج" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "local", children: "المحلية" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🚫", title: "كتم صوت الخصم تلقائيًا", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.autoMuteOpponent, onChange: (v) => u("autoMuteOpponent", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🌫️", title: "ضبابية فيديو الخصم", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.blurOpponentVideo, onChange: (v) => u("blurOpponentVideo", v) }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(SettingsSection, { title: "لوحات الصدارة والإحصائيات", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🏆", title: "عرض لوحة الصدارة", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.showLeaderboard, onChange: (v) => u("showLeaderboard", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "👤", title: "إظهار اسمك في لوحة الصدارة", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.showOnLeaderboard, onChange: (v) => u("showOnLeaderboard", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "📊", title: "عرض إحصائياتك", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.showStats, onChange: (v) => u("showStats", v) }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(SettingsSection, { title: "الإنجازات والمكافآت", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🏅", title: "عرض الإنجازات", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.showAchievements, onChange: (v) => u("showAchievements", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🎖️", title: "عرض الشارات", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.showBadges, onChange: (v) => u("showBadges", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "📈", title: "عرض تقدم المستوى", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.showLevelProgress, onChange: (v) => u("showLevelProgress", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🎁", title: "تفعيل المكافآت", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.rewardsEnabled, onChange: (v) => u("rewardsEnabled", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "📦", title: "استلام المكافآت تلقائيًا", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.autoCollectRewards, onChange: (v) => u("autoCollectRewards", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🔥", title: "تذكيرات السلسلة (Streaks)", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.streakReminders, onChange: (v) => u("streakReminders", v) }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(SettingsSection, { title: "المهام (Quests) والتحديات", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "📝", title: "تفعيل المهام اليومية", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.enableQuests, onChange: (v) => u("enableQuests", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🔔", title: "إشعارات المهام", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.questNotifications, onChange: (v) => u("questNotifications", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "👥", title: "السماح بتحدي الأصدقاء", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.challengeFriendsAllowed, onChange: (v) => u("challengeFriendsAllowed", v) }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(SettingsSection, { title: "وضع الأمان", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🛡️", title: "الوضع الآمن", description: "إخفاء المحتوى التنافسي القوي", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.safeMode, onChange: (v) => u("safeMode", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🏁", title: "الوضع التنافسي", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.competitiveMode, onChange: (v) => u("competitiveMode", v) }) })
    ] })
  ] });
}
export {
  EngagementSettingsPage as default
};

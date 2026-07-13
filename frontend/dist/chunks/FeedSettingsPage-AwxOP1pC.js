import { b0 as reactExports, ar as jsxRuntimeExports, c as Button } from "../index-CbZjTFV4.js";
import { b as SettingsShell, a as SettingsSection, S as SettingsRow, c as SettingsToggle } from "./SettingsShell-DGHmPchu.js";
const KEY = "yamshat:feed-settings";
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
function FeedSettingsPage() {
  const [prefs, setPrefs] = reactExports.useState(() => ({
    feedAlgorithm: "smart",
    feedSort: "recommended",
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
    contentLanguages: "all",
    mutedWords: "",
    filterSpam: true,
    filterMisinformation: true,
    showVerifiedFirst: false,
    showFollowingFirst: true,
    hideReposts: false,
    hidePolls: false,
    showTrendingTopics: true,
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
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(SettingsShell, { title: "إعدادات الخلاصة (Feed)", subtitle: "خصص خلاصتك: ترتيب، فلاتر، ومحتوى.", icon: "📰", backTo: "/", message: msg, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(SettingsSection, { title: "ترتيب وخوارزمية الخلاصة", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🧠", title: "خوارزمية الخلاصة", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "settings-select", value: prefs.feedAlgorithm, onChange: (e) => u("feedAlgorithm", e.target.value), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "smart", children: "ذكية (موصى به)" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "chronological", children: "حسب الوقت" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "popular", children: "الأكثر شعبية" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "following", children: "المتابعون فقط" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🔀", title: "ترتيب المنشورات", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "settings-select", value: prefs.feedSort, onChange: (e) => u("feedSort", e.target.value), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "recommended", children: "موصى به" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "newest", children: "الأحدث أولاً" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "oldest", children: "الأقدم أولاً" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "most-engaged", children: "الأكثر تفاعلاً" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "✅", title: "إظهار الحسابات الموثقة أولاً", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.showVerifiedFirst, onChange: (v) => u("showVerifiedFirst", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "👥", title: "إظهار المتابعين أولاً", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.showFollowingFirst, onChange: (v) => u("showFollowingFirst", v) }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(SettingsSection, { title: "المحتوى والفلاتر", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "⚠️", title: "إظهار المحتوى الحساس", description: "تعطيل المرشحات الافتراضية", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.showSensitiveContent, onChange: (v) => u("showSensitiveContent", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🌫️", title: "ضبابية المحتوى الحساس", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.blurSensitive, onChange: (v) => u("blurSensitive", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🛡️", title: "فلترة السبام تلقائيًا", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.filterSpam, onChange: (v) => u("filterSpam", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "📢", title: "فلترة المعلومات المضللة", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.filterMisinformation, onChange: (v) => u("filterMisinformation", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🚫", title: "كلمات محظورة", description: "افصل بفاصلة، مثل: spam, ads", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "settings-input", placeholder: "spam, ads, ...", value: prefs.mutedWords, onChange: (e) => u("mutedWords", e.target.value) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🌍", title: "لغات المحتوى", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "settings-select", value: prefs.contentLanguages, onChange: (e) => u("contentLanguages", e.target.value), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "all", children: "كل اللغات" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "ar", children: "العربية فقط" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "en", children: "الإنجليزية فقط" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "ar-en", children: "العربية والإنجليزية" })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(SettingsSection, { title: "المقترحات والإعلانات", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "✨", title: "منشورات مقترحة", description: "إظهار منشورات من حسابات لا تتابعها", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.showSuggestedPosts, onChange: (v) => u("showSuggestedPosts", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "👤", title: "حسابات مقترحة", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.showSuggestedAccounts, onChange: (v) => u("showSuggestedAccounts", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "📣", title: "إظهار الإعلانات", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.showAds, onChange: (v) => u("showAds", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🔥", title: "إظهار المواضيع الرائجة", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.showTrendingTopics, onChange: (v) => u("showTrendingTopics", v) }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(SettingsSection, { title: "العرض والتفاعل", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "📱", title: "عرض مدمج (Compact)", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.compactView, onChange: (v) => u("compactView", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "▶️", title: "تشغيل تلقائي للفيديوهات", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.autoplayVideos, onChange: (v) => u("autoplayVideos", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "❤️", title: "إظهار عدد الإعجابات", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.showLikesCount, onChange: (v) => u("showLikesCount", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "💬", title: "معاينة التعليقات", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.showCommentsPreview, onChange: (v) => u("showCommentsPreview", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "😀", title: "إظهار التفاعلات (Reactions)", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.showReactions, onChange: (v) => u("showReactions", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🕒", title: "إظهار وقت النشر", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.showPostedTime, onChange: (v) => u("showPostedTime", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "👁️‍🗨️", title: "إخفاء المنشورات المقروءة", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.hideSeenPosts, onChange: (v) => u("hideSeenPosts", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🔁", title: "إخفاء إعادة النشر", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.hideReposts, onChange: (v) => u("hideReposts", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "📊", title: "إخفاء استطلاعات الرأي", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.hidePolls, onChange: (v) => u("hidePolls", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🔄", title: "تحديث بالسحب", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.refreshOnPullDown, onChange: (v) => u("refreshOnPullDown", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "♾️", title: "التمرير اللانهائي", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.infiniteScroll, onChange: (v) => u("infiniteScroll", v) }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsSection, { title: "مسح وإعادة", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🗑️", title: "مسح سجل التصفح", description: "إعادة تعيين بيانات الخوارزمية", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", size: "small", className: "settings-danger", onClick: () => {
      if (confirm("تأكيد المسح؟")) {
        try {
          localStorage.removeItem("yamshat:feed-history");
          setMsg("تم المسح.");
          setTimeout(() => setMsg(""), 1500);
        } catch {
        }
      }
    }, children: "مسح" }) }) })
  ] });
}
export {
  FeedSettingsPage as default
};

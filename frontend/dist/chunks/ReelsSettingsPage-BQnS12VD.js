import { b0 as reactExports, ar as jsxRuntimeExports } from "../index-TztUfWYS.js";
import { b as SettingsShell, a as SettingsSection, S as SettingsRow, c as SettingsToggle } from "./SettingsShell-Hmy2dSGe.js";
const KEY = "yamshat:reels-settings";
function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}
function save(p) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
  }
}
function ReelsSettingsPage() {
  const [prefs, setPrefs] = reactExports.useState(() => ({
    autoplay: true,
    autoplayOnWifi: true,
    autoplayOnMobileData: false,
    quality: "auto",
    captionsEnabled: true,
    captionsLanguage: "ar",
    soundEnabled: true,
    soundDefault: "muted",
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
    contentLanguage: "ar",
    interestCategories: "mixed",
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
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(SettingsShell, { title: "إعدادات الريلز", subtitle: "تشغيل، جودة، تعليقات، ومشاركة الريلز.", icon: "🎬", backTo: "/reels", message: msg, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(SettingsSection, { title: "التشغيل التلقائي", description: "كيف ومتى يتم تشغيل الريلز", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "▶️", title: "تشغيل تلقائي", description: "بدء التشغيل عند ظهور الريل", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.autoplay, onChange: (v) => u("autoplay", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "📶", title: "تلقائي على الواي فاي", description: "فقط عند الاتصال بشبكة WiFi", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.autoplayOnWifi, onChange: (v) => u("autoplayOnWifi", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "📱", title: "تلقائي على بيانات الجوال", description: "استخدام بيانات الجوال للتشغيل", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.autoplayOnMobileData, onChange: (v) => u("autoplayOnMobileData", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🔁", title: "تكرار الريل", description: "إعادة الفيديو تلقائيًا عند انتهائه", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.loopReels, onChange: (v) => u("loopReels", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "⏩", title: "تحميل مسبق للتالي", description: "تسريع التنقل بين الريلز", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.preloadNext, onChange: (v) => u("preloadNext", v) }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(SettingsSection, { title: "الجودة والبيانات", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🎚️", title: "جودة الفيديو", description: "اختر جودة الفيديو الافتراضية", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "settings-select", value: prefs.quality, onChange: (e) => u("quality", e.target.value), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "auto", children: "تلقائي" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "1080p", children: "عالية 1080p" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "720p", children: "متوسطة 720p" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "480p", children: "منخفضة 480p" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "360p", children: "موفر بيانات 360p" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "💾", title: "وضع توفير البيانات", description: "خفض جودة الفيديو لتوفير البيانات", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.saveDataMode, onChange: (v) => u("saveDataMode", v) }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(SettingsSection, { title: "الصوت والترجمة", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🔊", title: "تفعيل الصوت", description: "السماح بتشغيل الصوت", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.soundEnabled, onChange: (v) => u("soundEnabled", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🔇", title: "حالة الصوت الافتراضية", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "settings-select", value: prefs.soundDefault, onChange: (e) => u("soundDefault", e.target.value), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "muted", children: "مكتوم" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "unmuted", children: "صوت مفتوح" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "last", children: "آخر اختيار" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "📝", title: "الترجمة التلقائية (Captions)", description: "عرض ترجمة الفيديو تلقائيًا", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.captionsEnabled, onChange: (v) => u("captionsEnabled", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🌐", title: "لغة الترجمة", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "settings-select", value: prefs.captionsLanguage, onChange: (e) => u("captionsLanguage", e.target.value), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "ar", children: "العربية" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "en", children: "English" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "auto", children: "تلقائي" })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(SettingsSection, { title: "التفاعلات والمشاركة", description: "من يستطيع التفاعل مع ريلزك", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "💬", title: "السماح بالتعليقات", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.allowComments, onChange: (v) => u("allowComments", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🔗", title: "السماح بالمشاركة", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.allowSharing, onChange: (v) => u("allowSharing", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🎭", title: "السماح بالـ Duet", description: "السماح للآخرين بإنشاء duet مع ريلزك", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.allowDuet, onChange: (v) => u("allowDuet", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🧵", title: "السماح بالـ Stitch", description: "السماح بدمج جزء من ريلك في ريل آخر", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.allowStitch, onChange: (v) => u("allowStitch", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "⬇️", title: "السماح بالتحميل", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.allowDownloads, onChange: (v) => u("allowDownloads", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "👀", title: "إخفاء عدد المشاهدات", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.hideViewCount, onChange: (v) => u("hideViewCount", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "💧", title: "علامة مائية على التحميلات", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.showWatermark, onChange: (v) => u("showWatermark", v) }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(SettingsSection, { title: "المحتوى والاهتمامات", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🌍", title: "لغة المحتوى المفضلة", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "settings-select", value: prefs.contentLanguage, onChange: (e) => u("contentLanguage", e.target.value), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "ar", children: "العربية" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "en", children: "English" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "all", children: "كل اللغات" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🎯", title: "فئات الاهتمام", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "settings-select", value: prefs.interestCategories, onChange: (e) => u("interestCategories", e.target.value), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "mixed", children: "متنوع" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "entertainment", children: "ترفيه" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "education", children: "تعليمي" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "sports", children: "رياضة" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "music", children: "موسيقى" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "comedy", children: "كوميدي" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🚫", title: "تخطي المحتوى الحساس", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.skipSensitive, onChange: (v) => u("skipSensitive", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "📳", title: "اهتزاز عند التفاعل (Haptics)", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.hapticFeedback, onChange: (v) => u("hapticFeedback", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🌙", title: "تحسين الرؤية الليلية", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.nightModeBoost, onChange: (v) => u("nightModeBoost", v) }) })
    ] })
  ] });
}
export {
  ReelsSettingsPage as default
};

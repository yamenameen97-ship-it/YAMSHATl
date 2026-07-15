import { b0 as reactExports, as as jsxRuntimeExports, f as Link } from "../index-D_Nx8mZz.js";
import { b as SettingsShell, a as SettingsSection, S as SettingsRow, c as SettingsToggle } from "./SettingsShell-BgR7wfkG.js";
const KEY = "yamshat:stories-settings";
function _normalizePrivacy(p) {
  if (typeof p !== "string") return p;
  if (p === "close-friends") return "close_friends";
  return p;
}
const load = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "{}");
    if (raw && typeof raw === "object") {
      if (raw.whoCanSeeMyStory) raw.whoCanSeeMyStory = _normalizePrivacy(raw.whoCanSeeMyStory);
      if (raw.allowReplies) raw.allowReplies = _normalizePrivacy(raw.allowReplies);
    }
    return raw;
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
function StoriesSettingsPage() {
  const [prefs, setPrefs] = reactExports.useState(() => ({
    // v59.1: السياسة الجديدة — لا توجد قصص عامة، الأصدقاء فقط
    whoCanSeeMyStory: "friends",
    hideStoryFrom: [],
    allowReplies: "friends",
    allowSharing: false,
    // معطّل افتراضيًا لأن القصص خاصة بالأصدقاء
    autoArchive: true,
    saveToCameraRoll: false,
    showInExplore: false,
    // غير متاح في السياسة الجديدة
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
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(SettingsShell, { title: "إعدادات الستوري", subtitle: "خصوصية، أرشيف، ومشاركة الستوريز.", icon: "📖", backTo: "/stories", message: msg, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { dir: "rtl", style: { fontFamily: "'Noto Sans Arabic', 'Tajawal', system-ui, sans-serif" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(SettingsSection, { title: "من يستطيع رؤية ستوري", description: "القصص خاصة بالأصدقاء فقط ولا تظهر للعامة", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "👥", title: "جمهور الستوري الافتراضي", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "settings-select", value: prefs.whoCanSeeMyStory, onChange: (e) => u("whoCanSeeMyStory", e.target.value), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "friends", children: "الأصدقاء فقط" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "close_friends", children: "الأصدقاء المقربون" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "private", children: "خاص (أنا فقط)" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "💚", title: "مشاركة فقط مع المقربين", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.closeFriendsOnly, onChange: (v) => u("closeFriendsOnly", v) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "💚", title: "إدارة قائمة الأصدقاء المقربين", description: "إضافة/إزالة الأشخاص الذين يرون قصص «المقربون فقط»", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/settings/stories/close-friends", className: "settings-link-btn", children: "فتح" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🙈", title: "إخفاء قصتي من أشخاص محددين", description: "لن يرى المستخدمون المُختارون أياً من قصصك", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/settings/stories/hide-from", className: "settings-link-btn", children: "فتح" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🔕", title: "قصص مكتومة", description: "المستخدمون الذين كتمت قصصهم من شريط الستوري", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/settings/stories/muted", className: "settings-link-btn", children: "فتح" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "👁️", title: "عرض قائمة المشاهدين", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.showViewerList, onChange: (v) => u("showViewerList", v) }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(SettingsSection, { title: "التفاعل والردود", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "💬", title: "السماح بالردود", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "settings-select", value: prefs.allowReplies, onChange: (e) => u("allowReplies", e.target.value), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "friends", children: "الأصدقاء" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "close_friends", children: "المقربون فقط" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "nobody", children: "لا أحد" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "😍", title: "السماح بالتفاعلات (إعجاب، إيموجي)", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.allowReactions, onChange: (v) => u("allowReactions", v) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🔁", title: "السماح بإعادة المشاركة", description: "ضمن الأصدقاء فقط", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.allowSharing, onChange: (v) => u("allowSharing", v) }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(SettingsSection, { title: "الأرشيف والحفظ", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "📦", title: "الأرشفة التلقائية", description: "حفظ الستوريز في الأرشيف بعد 24 ساعة", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.autoArchive, onChange: (v) => u("autoArchive", v) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "💾", title: "حفظ في الكاميرا", description: "حفظ نسخة محلية على الجهاز", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.saveToCameraRoll, onChange: (v) => u("saveToCameraRoll", v) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🌟", title: "تفعيل القصص المميزة (Highlights)", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.storyHighlights, onChange: (v) => u("storyHighlights", v) }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(SettingsSection, { title: "عرض الستوريز والجودة", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "▶️", title: "تشغيل تلقائي للستوريز", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.autoPlayStories, onChange: (v) => u("autoPlayStories", v) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🔇", title: "كتم صوت الستوريز افتراضيًا", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.muteStoryAudio, onChange: (v) => u("muteStoryAudio", v) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "⏱️", title: "مدة عرض كل صورة (بالثواني)", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "settings-select", value: prefs.storyDuration, onChange: (e) => u("storyDuration", Number(e.target.value)), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: 3, children: "3 ثوان" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: 5, children: "5 ثوان" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: 7, children: "7 ثوان" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: 10, children: "10 ثوان" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🎨", title: "رفع بجودة عالية", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.highQualityUpload, onChange: (v) => u("highQualityUpload", v) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "📤", title: "رفع في الخلفية", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.bgUploadEnabled, onChange: (v) => u("bgUploadEnabled", v) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🎬", title: "نشر الستوري في الريلز تلقائيًا", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.crossPostToReels, onChange: (v) => u("crossPostToReels", v) }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
        .settings-link-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 6px 14px; border-radius: 10px;
          background: linear-gradient(135deg, #4f9cff, #6b7cff);
          color: #fff; font-weight: 700; font-size: 12px;
          text-decoration: none; cursor: pointer;
          transition: transform 0.15s ease, opacity 0.15s ease;
        }
        .settings-link-btn:hover { transform: translateY(-1px); opacity: 0.94; }
      ` })
  ] });
}
export {
  StoriesSettingsPage as default
};

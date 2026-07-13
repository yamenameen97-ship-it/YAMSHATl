import { b0 as reactExports, ar as jsxRuntimeExports, c as Button } from "../index-CbZjTFV4.js";
import { b as SettingsShell, a as SettingsSection, S as SettingsRow, c as SettingsToggle } from "./SettingsShell-DGHmPchu.js";
const PROFILE_KEY = "yamshat:profile-settings";
function loadPrefs() {
  try {
    return JSON.parse(localStorage.getItem(PROFILE_KEY) || "{}");
  } catch {
    return {};
  }
}
function savePrefs(prefs) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(prefs));
  } catch {
  }
}
function ProfileSettingsPage() {
  const [prefs, setPrefs] = reactExports.useState(() => ({
    privateAccount: false,
    showOnlineStatus: true,
    showLastSeen: true,
    allowFollowRequests: true,
    allowProfileTagging: true,
    allowMentions: "everyone",
    showActivityStatus: true,
    showProfilePhoto: "everyone",
    showStoryToFollowers: true,
    allowDirectMessages: "followers",
    allowProfileSharing: true,
    showVerificationBadge: true,
    hideFromSearch: false,
    blurSensitiveContent: true,
    autoTranslateBio: false,
    ...loadPrefs()
  }));
  const [message, setMessage] = reactExports.useState("");
  const update = (key, value) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    savePrefs(next);
    setMessage("تم حفظ الإعدادات.");
    setTimeout(() => setMessage(""), 2e3);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    SettingsShell,
    {
      title: "إعدادات الملف الشخصي",
      subtitle: "تحكم في خصوصية ملفك، من يستطيع رؤيتك، التفاعل معك، ومراسلتك.",
      icon: "👤",
      backTo: "/profile",
      message,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(SettingsSection, { title: "الخصوصية الأساسية", description: "من يستطيع رؤية محتواك ومتابعتك", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🔒", title: "حساب خاص", description: "يجب الموافقة على طلبات المتابعة قبل رؤية محتواك", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.privateAccount, onChange: (v) => update("privateAccount", v) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🟢", title: "إظهار حالة الاتصال", description: "السماح للآخرين برؤية أنك متصل الآن", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.showOnlineStatus, onChange: (v) => update("showOnlineStatus", v) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "⏱️", title: "إظهار آخر ظهور", description: "عرض وقت آخر نشاط لك", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.showLastSeen, onChange: (v) => update("showLastSeen", v) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "📊", title: "حالة النشاط", description: "إظهار آخر نشاطك في التطبيق", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.showActivityStatus, onChange: (v) => update("showActivityStatus", v) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🔍", title: "إخفاء من البحث", description: "عدم ظهور حسابك في نتائج البحث للغرباء", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.hideFromSearch, onChange: (v) => update("hideFromSearch", v) }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(SettingsSection, { title: "من يستطيع التفاعل معي", description: "تحكم في الرسائل والذكر والإشارات", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "💬", title: "السماح بالرسائل المباشرة", description: "من يستطيع إرسال رسائل لك", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "settings-select", value: prefs.allowDirectMessages, onChange: (e) => update("allowDirectMessages", e.target.value), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "everyone", children: "الجميع" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "followers", children: "المتابعون فقط" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "mutual", children: "المتابعة المتبادلة" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "nobody", children: "لا أحد" })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "@", title: "من يستطيع الإشارة لي (@)", description: "التحكم في إشارات @", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "settings-select", value: prefs.allowMentions, onChange: (e) => update("allowMentions", e.target.value), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "everyone", children: "الجميع" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "followers", children: "المتابعون" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "nobody", children: "لا أحد" })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🏷️", title: "السماح بتعليمي في الصور", description: "عند رفع صور للآخرين", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.allowProfileTagging, onChange: (v) => update("allowProfileTagging", v) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "👥", title: "السماح بطلبات المتابعة", description: "استقبال طلبات متابعة جديدة", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.allowFollowRequests, onChange: (v) => update("allowFollowRequests", v) }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(SettingsSection, { title: "الصورة والمحتوى", description: "إعدادات الصورة الشخصية وعرض المحتوى", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🖼️", title: "من يستطيع رؤية صورة الملف", description: "عرض الصورة الشخصية الرئيسية", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "settings-select", value: prefs.showProfilePhoto, onChange: (e) => update("showProfilePhoto", e.target.value), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "everyone", children: "الجميع" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "followers", children: "المتابعون" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "nobody", children: "لا أحد" })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "📖", title: "مشاركة قصصي مع المتابعين", description: "السماح للمتابعين برؤية ستوريز", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.showStoryToFollowers, onChange: (v) => update("showStoryToFollowers", v) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🔁", title: "السماح بمشاركة ملفي", description: "تمكين زر المشاركة في صفحتك", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.allowProfileSharing, onChange: (v) => update("allowProfileSharing", v) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "✅", title: "إظهار شارة التوثيق", description: "عرض شارة الحساب الموثق", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.showVerificationBadge, onChange: (v) => update("showVerificationBadge", v) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🌫️", title: "ضبابية المحتوى الحساس", description: "تمويه المحتوى الحساس قبل عرضه", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.blurSensitiveContent, onChange: (v) => update("blurSensitiveContent", v) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🌐", title: "ترجمة السيرة الذاتية تلقائيًا", description: "ترجمة Bio إلى لغتك", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.autoTranslateBio, onChange: (v) => update("autoTranslateBio", v) }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(SettingsSection, { title: "الحسابات المحظورة والمكتومة", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🚫", title: "الحسابات المحظورة", description: "عرض وإدارة الحسابات التي حظرتها", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", size: "small", onClick: () => window.location.href = "/settings?tab=blocked", children: "إدارة" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🔇", title: "الحسابات المكتومة", description: "حسابات لا ترى محتواها", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", size: "small", onClick: () => window.location.href = "/settings?tab=muted", children: "إدارة" }) })
        ] })
      ]
    }
  );
}
export {
  ProfileSettingsPage as default
};

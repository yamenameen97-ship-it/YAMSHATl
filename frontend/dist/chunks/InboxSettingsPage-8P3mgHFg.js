import { a_ as reactExports, aq as jsxRuntimeExports, c as Button } from "../index-2I4hYPnI.js";
import { b as SettingsShell, a as SettingsSection, S as SettingsRow, c as SettingsToggle } from "./SettingsShell-bXNYH2-6.js";
const KEY = "yamshat:inbox-settings";
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
function InboxSettingsPage() {
  const [prefs, setPrefs] = reactExports.useState(() => ({
    showReadReceipts: true,
    sendReadReceipts: true,
    showTypingIndicator: true,
    sendTypingIndicator: true,
    enterToSend: true,
    autoDownloadMedia: "wifi",
    autoDownloadDocs: "never",
    autoPlayGifs: true,
    autoPlayVideos: true,
    autoSaveMedia: false,
    chatBackup: true,
    backupFrequency: "daily",
    encryptedBackup: true,
    deleteMessagesAfter: "never",
    chatTheme: "default",
    bubbleStyle: "rounded",
    fontSize: "medium",
    showAvatars: true,
    showGroupAvatars: true,
    soundOnSend: true,
    soundOnReceive: true,
    vibrationOnMessage: true,
    archiveOldChats: false,
    archiveAfterDays: 90,
    organizeBy: "recent",
    showUnreadFirst: true,
    pinFavorites: true,
    requestsFolderEnabled: true,
    spamFilter: true,
    translateMessages: false,
    autoTranslateLang: "ar",
    voiceMessageAutoplay: false,
    transcribeVoiceMessages: false,
    disappearingMessages: false,
    disappearingDuration: "24h",
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
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(SettingsShell, { title: "إعدادات الرسائل والصندوق", subtitle: "الإشعارات، الإيصالات، النسخ الاحتياطي، ومظهر المحادثات.", icon: "✉️", backTo: "/inbox", message: msg, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(SettingsSection, { title: "المؤشرات والإيصالات", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "✓✓", title: "إرسال إيصال القراءة", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.sendReadReceipts, onChange: (v) => u("sendReadReceipts", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "👁️", title: "رؤية إيصالات قراءة الآخرين", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.showReadReceipts, onChange: (v) => u("showReadReceipts", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "✏️", title: "إرسال مؤشر الكتابة", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.sendTypingIndicator, onChange: (v) => u("sendTypingIndicator", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "....", title: "رؤية مؤشر كتابة الآخرين", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.showTypingIndicator, onChange: (v) => u("showTypingIndicator", v) }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(SettingsSection, { title: "الإرسال والوسائط", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "⏎", title: "Enter للإرسال", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.enterToSend, onChange: (v) => u("enterToSend", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "📥", title: "تنزيل الوسائط تلقائيًا", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "settings-select", value: prefs.autoDownloadMedia, onChange: (e) => u("autoDownloadMedia", e.target.value), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "never", children: "أبدًا" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "wifi", children: "WiFi فقط" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "always", children: "دائمًا" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "📄", title: "تنزيل الملفات تلقائيًا", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "settings-select", value: prefs.autoDownloadDocs, onChange: (e) => u("autoDownloadDocs", e.target.value), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "never", children: "أبدًا" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "wifi", children: "WiFi فقط" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "always", children: "دائمًا" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🎞️", title: "تشغيل GIF تلقائيًا", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.autoPlayGifs, onChange: (v) => u("autoPlayGifs", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "▶️", title: "تشغيل الفيديو تلقائيًا", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.autoPlayVideos, onChange: (v) => u("autoPlayVideos", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "💾", title: "حفظ الوسائط في المعرض", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.autoSaveMedia, onChange: (v) => u("autoSaveMedia", v) }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(SettingsSection, { title: "الرسائل الصوتية", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🎙️", title: "تشغيل تلقائي للرسائل الصوتية", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.voiceMessageAutoplay, onChange: (v) => u("voiceMessageAutoplay", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "📝", title: "تحويل الصوت إلى نص", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.transcribeVoiceMessages, onChange: (v) => u("transcribeVoiceMessages", v) }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(SettingsSection, { title: "النسخ الاحتياطي والاحتفاظ", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "☁️", title: "نسخ احتياطي للمحادثات", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.chatBackup, onChange: (v) => u("chatBackup", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🔁", title: "تكرار النسخ الاحتياطي", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "settings-select", value: prefs.backupFrequency, onChange: (e) => u("backupFrequency", e.target.value), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "daily", children: "يومي" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "weekly", children: "أسبوعي" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "monthly", children: "شهري" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "manual", children: "يدوي" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🔐", title: "نسخ احتياطي مشفر (E2E)", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.encryptedBackup, onChange: (v) => u("encryptedBackup", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🕒", title: "حذف الرسائل بعد فترة", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "settings-select", value: prefs.deleteMessagesAfter, onChange: (e) => u("deleteMessagesAfter", e.target.value), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "never", children: "أبدًا" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "7days", children: "7 أيام" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "30days", children: "30 يوم" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "90days", children: "90 يوم" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "1year", children: "سنة" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🔥", title: "الرسائل المختفية", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.disappearingMessages, onChange: (v) => u("disappearingMessages", v) }) }),
      prefs.disappearingMessages ? /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "⏱️", title: "مدة الاختفاء", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "settings-select", value: prefs.disappearingDuration, onChange: (e) => u("disappearingDuration", e.target.value), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "24h", children: "24 ساعة" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "7d", children: "7 أيام" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "90d", children: "90 يوم" })
      ] }) }) : null
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(SettingsSection, { title: "المظهر", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🎨", title: "ثيم المحادثة", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "settings-select", value: prefs.chatTheme, onChange: (e) => u("chatTheme", e.target.value), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "default", children: "افتراضي" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "dark", children: "داكن" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "light", children: "فاتح" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "purple", children: "بنفسجي" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "blue", children: "أزرق" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "green", children: "أخضر" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "💭", title: "شكل الفقاعة", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "settings-select", value: prefs.bubbleStyle, onChange: (e) => u("bubbleStyle", e.target.value), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "rounded", children: "دائرية" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "square", children: "مربعة" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "minimal", children: "بسيطة" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🔤", title: "حجم الخط", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "settings-select", value: prefs.fontSize, onChange: (e) => u("fontSize", e.target.value), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "small", children: "صغير" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "medium", children: "متوسط" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "large", children: "كبير" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "xl", children: "كبير جدًا" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🖼️", title: "عرض الصور الرمزية", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.showAvatars, onChange: (v) => u("showAvatars", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "👥", title: "عرض صور المجموعات", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.showGroupAvatars, onChange: (v) => u("showGroupAvatars", v) }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(SettingsSection, { title: "الأصوات والاهتزاز", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "📤", title: "صوت عند الإرسال", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.soundOnSend, onChange: (v) => u("soundOnSend", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "📥", title: "صوت عند الاستلام", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.soundOnReceive, onChange: (v) => u("soundOnReceive", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "📳", title: "اهتزاز عند الرسالة", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.vibrationOnMessage, onChange: (v) => u("vibrationOnMessage", v) }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(SettingsSection, { title: "تنظيم الصندوق", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🔃", title: "ترتيب المحادثات", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "settings-select", value: prefs.organizeBy, onChange: (e) => u("organizeBy", e.target.value), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "recent", children: "الأحدث" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "unread", children: "غير المقروء أولاً" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "pinned", children: "المثبتة أولاً" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "alphabetical", children: "أبجدي" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🔝", title: "غير المقروء أولاً", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.showUnreadFirst, onChange: (v) => u("showUnreadFirst", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "⭐", title: "تثبيت المفضلة", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.pinFavorites, onChange: (v) => u("pinFavorites", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "📁", title: "مجلد طلبات الرسائل", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.requestsFolderEnabled, onChange: (v) => u("requestsFolderEnabled", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🛡️", title: "فلتر السبام", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.spamFilter, onChange: (v) => u("spamFilter", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "📦", title: "أرشفة المحادثات القديمة تلقائيًا", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.archiveOldChats, onChange: (v) => u("archiveOldChats", v) }) }),
      prefs.archiveOldChats ? /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "📅", title: "أرشفة بعد (أيام)", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "settings-input", type: "number", value: prefs.archiveAfterDays, onChange: (e) => u("archiveAfterDays", Number(e.target.value)) }) }) : null
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(SettingsSection, { title: "الترجمة", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🌐", title: "ترجمة الرسائل تلقائيًا", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.translateMessages, onChange: (v) => u("translateMessages", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🔤", title: "لغة الترجمة", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "settings-select", value: prefs.autoTranslateLang, onChange: (e) => u("autoTranslateLang", e.target.value), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "ar", children: "العربية" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "en", children: "English" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "fr", children: "Français" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "es", children: "Español" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "tr", children: "Türkçe" })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(SettingsSection, { title: "إجراءات", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "📥", title: "تصدير المحادثات", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", size: "small", children: "تصدير" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🗑️", title: "حذف كل المحادثات", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", size: "small", className: "settings-danger", children: "حذف" }) })
    ] })
  ] });
}
export {
  InboxSettingsPage as default
};

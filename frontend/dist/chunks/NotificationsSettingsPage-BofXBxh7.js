import { b0 as reactExports, ar as jsxRuntimeExports, c as Button } from "../index-CbZjTFV4.js";
import { b as SettingsShell, a as SettingsSection, S as SettingsRow, c as SettingsToggle } from "./SettingsShell-DGHmPchu.js";
const KEY = "yamshat:notifications-settings:v2";
const EVT = "yamshat:notifications-settings-changed";
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
    try {
      window.dispatchEvent(new CustomEvent(EVT, { detail: p }));
    } catch {
    }
  } catch {
  }
};
async function requestBrowserPushPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return { ok: false, reason: "unsupported" };
  }
  if (Notification.permission === "granted") return { ok: true, reason: "already-granted" };
  if (Notification.permission === "denied") return { ok: false, reason: "denied-previously" };
  try {
    const result = await Notification.requestPermission();
    return { ok: result === "granted", reason: result };
  } catch (e) {
    return { ok: false, reason: "error" };
  }
}
function NotificationsSettingsPage() {
  const [prefs, setPrefs] = reactExports.useState(() => ({
    pushEnabled: false,
    // ⚠️ افتراضي OFF لأن المتصفح يحتاج إذن صريح
    realtimeEnabled: true,
    // ✅ v59.13.16: WebSocket Realtime
    deepLinkEnabled: true,
    // ✅ v59.13.16: Deep Link داخل التطبيق
    emailEnabled: true,
    smsEnabled: false,
    inAppEnabled: true,
    likes: true,
    comments: true,
    mentions: true,
    follows: true,
    followRequests: true,
    messages: true,
    groupActivity: true,
    storyViews: false,
    storyReplies: true,
    reelsActivity: true,
    liveStreams: true,
    voiceRooms: true,
    pkBattles: true,
    accountSecurity: true,
    loginAlerts: true,
    paymentAlerts: true,
    productUpdates: true,
    tipsAndTutorials: false,
    marketing: false,
    weeklyDigest: true,
    eventReminders: true,
    sound: true,
    vibration: true,
    badge: true,
    preview: "full",
    quietHoursEnabled: false,
    quietStart: "22:00",
    quietEnd: "07:00",
    groupNotifications: "mentions",
    notificationTone: "default",
    ...load()
  }));
  const [msg, setMsg] = reactExports.useState("");
  const [busy, setBusy] = reactExports.useState(false);
  reactExports.useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (prefs.pushEnabled && Notification.permission !== "granted") {
      const next = { ...prefs, pushEnabled: false };
      setPrefs(next);
      save(next);
    }
  }, []);
  const u = (k, v) => {
    const n = { ...prefs, [k]: v };
    setPrefs(n);
    save(n);
    setMsg("تم الحفظ.");
    setTimeout(() => setMsg(""), 1500);
  };
  const onTogglePush = async (next) => {
    if (busy) return;
    if (!next) {
      u("pushEnabled", false);
      return;
    }
    setBusy(true);
    setMsg("جارٍ طلب صلاحية الإشعارات...");
    const r = await requestBrowserPushPermission();
    setBusy(false);
    if (r.ok) {
      u("pushEnabled", true);
      setMsg("تم تفعيل إشعارات Push.");
      setTimeout(() => setMsg(""), 1800);
    } else {
      u("pushEnabled", false);
      if (r.reason === "unsupported") setMsg("متصفحك لا يدعم إشعارات Push.");
      else if (r.reason === "denied" || r.reason === "denied-previously") {
        setMsg("تم رفض الإذن. يرجى السماح يدوياً من إعدادات المتصفح.");
      } else {
        setMsg("تعذّر تفعيل Push.");
      }
      setTimeout(() => setMsg(""), 2500);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(SettingsShell, { title: "إعدادات الإشعارات", subtitle: "تحكم تفصيلي في كل نوع إشعار.", icon: "🔔", backTo: "/notifications", message: msg, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(SettingsSection, { title: "قنوات الإشعارات", description: "كيف تستلم الإشعارات", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "📲", title: "إشعارات Push", description: "إشعارات على الجهاز (تتطلب إذن المتصفح)", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.pushEnabled, onChange: onTogglePush }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "⚡", title: "Realtime (WebSocket)", description: "استقبال فوري داخل التطبيق", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.realtimeEnabled, onChange: (v) => u("realtimeEnabled", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🔗", title: "Deep Link", description: "فتح المحتوى مباشرة عند الضغط على الإشعار", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.deepLinkEnabled, onChange: (v) => u("deepLinkEnabled", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "📧", title: "البريد الإلكتروني", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.emailEnabled, onChange: (v) => u("emailEnabled", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "📱", title: "رسائل SMS", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.smsEnabled, onChange: (v) => u("smsEnabled", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🔔", title: "داخل التطبيق", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.inAppEnabled, onChange: (v) => u("inAppEnabled", v) }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(SettingsSection, { title: "التفاعلات الاجتماعية", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "❤️", title: "الإعجابات", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.likes, onChange: (v) => u("likes", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "💬", title: "التعليقات", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.comments, onChange: (v) => u("comments", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "@", title: "الإشارات (@mentions)", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.mentions, onChange: (v) => u("mentions", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "👤", title: "متابعون جدد", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.follows, onChange: (v) => u("follows", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🙋", title: "طلبات المتابعة", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.followRequests, onChange: (v) => u("followRequests", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "✉️", title: "الرسائل المباشرة", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.messages, onChange: (v) => u("messages", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "👥", title: "نشاط المجموعات", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.groupActivity, onChange: (v) => u("groupActivity", v) }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(SettingsSection, { title: "الستوريز والريلز والبث", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "👁️", title: "مشاهدات الستوري", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.storyViews, onChange: (v) => u("storyViews", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "💭", title: "ردود الستوري", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.storyReplies, onChange: (v) => u("storyReplies", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🎬", title: "نشاط الريلز", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.reelsActivity, onChange: (v) => u("reelsActivity", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🔴", title: "بث مباشر من المتابعين", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.liveStreams, onChange: (v) => u("liveStreams", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🎙️", title: "غرف صوتية", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.voiceRooms, onChange: (v) => u("voiceRooms", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "⚔️", title: "معارك PK", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.pkBattles, onChange: (v) => u("pkBattles", v) }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(SettingsSection, { title: "الأمان والحساب", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🔐", title: "أمان الحساب", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.accountSecurity, onChange: (v) => u("accountSecurity", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🚨", title: "تنبيهات تسجيل الدخول", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.loginAlerts, onChange: (v) => u("loginAlerts", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "💳", title: "تنبيهات الدفع والمحفظة", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.paymentAlerts, onChange: (v) => u("paymentAlerts", v) }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(SettingsSection, { title: "تحديثات ومحتوى تسويقي", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🆕", title: "تحديثات المنتج", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.productUpdates, onChange: (v) => u("productUpdates", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "💡", title: "نصائح ودروس", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.tipsAndTutorials, onChange: (v) => u("tipsAndTutorials", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "📢", title: "عروض تسويقية", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.marketing, onChange: (v) => u("marketing", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "📊", title: "ملخص أسبوعي", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.weeklyDigest, onChange: (v) => u("weeklyDigest", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "📅", title: "تذكيرات الأحداث", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.eventReminders, onChange: (v) => u("eventReminders", v) }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(SettingsSection, { title: "السلوك العام", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🔊", title: "الصوت", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.sound, onChange: (v) => u("sound", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "📳", title: "الاهتزاز", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.vibration, onChange: (v) => u("vibration", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🔢", title: "شارة العدد (Badge)", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.badge, onChange: (v) => u("badge", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "👀", title: "معاينة الإشعار", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "settings-select", value: prefs.preview, onChange: (e) => u("preview", e.target.value), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "full", children: "كامل" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "short", children: "مختصر" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "hidden", children: "مخفي" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🎵", title: "نغمة الإشعار", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "settings-select", value: prefs.notificationTone, onChange: (e) => u("notificationTone", e.target.value), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "default", children: "افتراضي" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "chime", children: "رنين" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "ding", children: "بسيط" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "soft", children: "ناعم" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "silent", children: "صامت" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🌙", title: "ساعات الهدوء (Do Not Disturb)", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.quietHoursEnabled, onChange: (v) => u("quietHoursEnabled", v) }) }),
      prefs.quietHoursEnabled ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🌃", title: "بداية الهدوء", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "settings-input", type: "time", value: prefs.quietStart, onChange: (e) => u("quietStart", e.target.value) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🌅", title: "نهاية الهدوء", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "settings-input", type: "time", value: prefs.quietEnd, onChange: (e) => u("quietEnd", e.target.value) }) })
      ] }) : null,
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "👥", title: "إشعارات المجموعات", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "settings-select", value: prefs.groupNotifications, onChange: (e) => u("groupNotifications", e.target.value), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "all", children: "كل الرسائل" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "mentions", children: "الإشارات فقط" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "none", children: "صامت" })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(SettingsSection, { title: "إجراءات", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "✅", title: "تمييز الكل كمقروء", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", size: "small", onClick: () => {
        setMsg("تم التمييز كمقروء.");
        setTimeout(() => setMsg(""), 1500);
      }, children: "تنفيذ" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🗑️", title: "مسح كل الإشعارات", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", size: "small", className: "settings-danger", onClick: () => {
        if (confirm("تأكيد المسح؟")) {
          setMsg("تم المسح.");
          setTimeout(() => setMsg(""), 1500);
        }
      }, children: "مسح" }) })
    ] })
  ] });
}
export {
  NotificationsSettingsPage as default
};

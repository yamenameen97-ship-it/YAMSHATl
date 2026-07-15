import { b0 as reactExports, as as jsxRuntimeExports } from "../index-D_Nx8mZz.js";
import { b as SettingsShell, a as SettingsSection, S as SettingsRow, c as SettingsToggle } from "./SettingsShell-BgR7wfkG.js";
const KEY = "yamshat:voice-settings";
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
function VoiceRoomsSettingsPage() {
  const [prefs, setPrefs] = reactExports.useState(() => ({
    micEnabled: true,
    autoMuteOnJoin: true,
    noiseCancellation: true,
    echoCancellation: true,
    autoGainControl: true,
    audioQuality: "high",
    pushToTalk: false,
    voiceActivation: true,
    voiceActivationThreshold: 50,
    allowSpeakerRequest: true,
    autoAcceptFromFollowers: false,
    backgroundNoiseSuppress: true,
    headphoneSafeMode: true,
    spatialAudio: false,
    showSpeakerIndicator: true,
    showWaveform: true,
    recordRooms: false,
    allowGuests: true,
    moderationEnabled: true,
    autoKickInactive: false,
    inactivityMinutes: 15,
    maxRoomSize: 50,
    languagePreference: "ar",
    allowTranslation: false,
    notifyOnRoomStart: true,
    privateRoomDefault: false,
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
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(SettingsShell, { title: "إعدادات الغرف الصوتية", subtitle: "الميكروفون، الصوت، والتحكم في الغرف.", icon: "🎙️", backTo: "/voice", message: msg, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(SettingsSection, { title: "الميكروفون والصوت", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🎤", title: "تفعيل الميكروفون", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.micEnabled, onChange: (v) => u("micEnabled", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🔇", title: "كتم الميكروفون عند الانضمام", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.autoMuteOnJoin, onChange: (v) => u("autoMuteOnJoin", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🎚️", title: "جودة الصوت", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "settings-select", value: prefs.audioQuality, onChange: (e) => u("audioQuality", e.target.value), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "auto", children: "تلقائي" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "low", children: "منخفضة (موفر بيانات)" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "medium", children: "متوسطة" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "high", children: "عالية" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "studio", children: "استوديو HD" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🌐", title: "الصوت المكاني (Spatial Audio)", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.spatialAudio, onChange: (v) => u("spatialAudio", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🎧", title: "وضع السماعات الآمن", description: "حماية السمع من الأصوات العالية", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.headphoneSafeMode, onChange: (v) => u("headphoneSafeMode", v) }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(SettingsSection, { title: "معالجة الصوت", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🔇", title: "إلغاء الضوضاء", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.noiseCancellation, onChange: (v) => u("noiseCancellation", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🔁", title: "إلغاء الصدى", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.echoCancellation, onChange: (v) => u("echoCancellation", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "📊", title: "تعديل الكسب التلقائي", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.autoGainControl, onChange: (v) => u("autoGainControl", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🌫️", title: "كبت الضوضاء الخلفية", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.backgroundNoiseSuppress, onChange: (v) => u("backgroundNoiseSuppress", v) }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(SettingsSection, { title: "طريقة التحدث", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🗣️", title: "التنشيط الصوتي (Voice Activation)", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.voiceActivation, onChange: (v) => u("voiceActivation", v) }) }),
      prefs.voiceActivation ? /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "📈", title: "حساسية التنشيط الصوتي (0-100)", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "settings-input", type: "number", min: "0", max: "100", value: prefs.voiceActivationThreshold, onChange: (e) => u("voiceActivationThreshold", Number(e.target.value)) }) }) : null,
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🔘", title: "اضغط للتحدث (Push to Talk)", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.pushToTalk, onChange: (v) => u("pushToTalk", v) }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(SettingsSection, { title: "غرفي وإدارتها (للمضيف)", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🙋", title: "السماح بطلبات التحدث", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.allowSpeakerRequest, onChange: (v) => u("allowSpeakerRequest", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "✅", title: "قبول المتابعين تلقائيًا", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.autoAcceptFromFollowers, onChange: (v) => u("autoAcceptFromFollowers", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🎁", title: "السماح بالضيوف من خارج التطبيق", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.allowGuests, onChange: (v) => u("allowGuests", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🛡️", title: "وضع الإشراف", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.moderationEnabled, onChange: (v) => u("moderationEnabled", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🚪", title: "طرد غير النشطين تلقائيًا", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.autoKickInactive, onChange: (v) => u("autoKickInactive", v) }) }),
      prefs.autoKickInactive ? /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "⏱️", title: "فترة عدم النشاط (دقائق)", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "settings-input", type: "number", value: prefs.inactivityMinutes, onChange: (e) => u("inactivityMinutes", Number(e.target.value)) }) }) : null,
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "👥", title: "الحد الأقصى للمشاركين", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "settings-input", type: "number", value: prefs.maxRoomSize, onChange: (e) => u("maxRoomSize", Number(e.target.value)) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🔒", title: "غرفة خاصة افتراضيًا", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.privateRoomDefault, onChange: (v) => u("privateRoomDefault", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "⏺️", title: "تسجيل الغرف تلقائيًا", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.recordRooms, onChange: (v) => u("recordRooms", v) }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(SettingsSection, { title: "العرض والتنبيهات", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "💡", title: "مؤشر المتحدث", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.showSpeakerIndicator, onChange: (v) => u("showSpeakerIndicator", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "〰️", title: "عرض موجة الصوت", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.showWaveform, onChange: (v) => u("showWaveform", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🔔", title: "إشعار عند بدء غرفة من المتابعين", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.notifyOnRoomStart, onChange: (v) => u("notifyOnRoomStart", v) }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(SettingsSection, { title: "اللغة والترجمة", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🌍", title: "اللغة المفضلة", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "settings-select", value: prefs.languagePreference, onChange: (e) => u("languagePreference", e.target.value), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "ar", children: "العربية" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "en", children: "English" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "all", children: "كل اللغات" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🔤", title: "ترجمة فورية للكلام", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.allowTranslation, onChange: (v) => u("allowTranslation", v) }) })
    ] })
  ] });
}
export {
  VoiceRoomsSettingsPage as default
};

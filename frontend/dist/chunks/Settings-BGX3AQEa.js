import { b0 as reactExports, s as audioService, ar as jsxRuntimeExports, m as SOUND_CATALOG, bx as useLanguage, n as SUPPORTED_LANGUAGES, aa as getLanguageMeta, bt as useAppStore, A as API, bz as useNavigate, by as useLocation, aQ as notificationService, a1 as getCDNConfig, ac as getMediaDeliveryProfile, aB as logoutUser, z as clearStoredUser, h as MainLayout, d as Card, r as applyFontSize, F as FontSizeSettings, M as MEDIA_SECURITY, S as SIGNED_URL_TTL_SECONDS, H as currentMediaProviderLabel, Y as YamServicesMenu } from "../index-CbZjTFV4.js";
import { g as getTranslationPrefs, s as saveTranslationPrefs, c as clearTranslationCache } from "./translationService-tb0zyizg.js";
import { S as SettingsRow, c as SettingsToggle } from "./SettingsShell-DGHmPchu.js";
function useAudio() {
  const [settings, setSettings] = reactExports.useState(() => audioService.getSettings());
  reactExports.useEffect(() => {
    setSettings(audioService.getSettings());
    audioService.preload();
    const unsubscribe = audioService.subscribe((nextSettings) => {
      setSettings(nextSettings);
    });
    return () => unsubscribe();
  }, []);
  const update = reactExports.useCallback((patch = {}) => {
    audioService.updateSettings(patch);
  }, []);
  const setVolume = reactExports.useCallback((value) => {
    audioService.setVolume(value);
  }, []);
  const setEnabled = reactExports.useCallback((flag) => {
    audioService.setEnabled(flag);
  }, []);
  const setCategory = reactExports.useCallback((category, enabled) => {
    audioService.setCategory(category, enabled);
  }, []);
  const play = reactExports.useCallback((key, options = {}) => audioService.play(key, options), []);
  const stop = reactExports.useCallback((key) => audioService.stop(key), []);
  return {
    settings,
    update,
    setVolume,
    setEnabled,
    setCategory,
    play,
    stop,
    onMessageReceived: () => audioService.onMessageReceived(),
    onMessageSent: () => audioService.onMessageSent(),
    onMessageSeen: () => audioService.onMessageSeen(),
    onMessageFailed: () => audioService.onMessageFailed(),
    onTyping: () => audioService.onTyping(),
    onNotification: (type) => audioService.onNotification(type),
    startIncomingCall: (video = false) => audioService.startIncomingCall(video),
    stopIncomingCall: () => audioService.stopIncomingCall(),
    endCall: () => audioService.endCall(),
    liveStarted: () => audioService.liveStarted(),
    liveEnded: () => audioService.liveEnded()
  };
}
const RINGTONE_KEYS = ["ring_voice", "ring_video"];
const ROW = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "12px 0",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
  gap: 12
};
function Toggle({ checked, onChange, label }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { style: { display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer" }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", checked: !!checked, onChange: (e) => onChange(e.target.checked) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: label })
  ] });
}
function SoundSettingsPanel() {
  const { settings, update, setVolume, setEnabled, setCategory, play } = useAudio();
  const previewRingtone = (key) => {
    audioService.stop("ring_voice");
    audioService.stop("ring_video");
    audioService.play(key, { force: true });
    setTimeout(() => audioService.stop(key), 1500);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yamshat-sound-settings", style: {
    padding: 16,
    borderRadius: 16,
    background: "var(--surface, rgba(255,255,255,0.04))",
    color: "var(--text, #fff)",
    maxWidth: 640
  }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { style: { margin: 0, marginBottom: 12 }, children: "إعدادات الأصوات" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: { opacity: 0.7, margin: "0 0 16px", fontSize: 13 }, children: "تحكم كامل في أصوات التطبيق: الرسائل، الإشعارات، الرنين، الكتابة، والنظام." }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: ROW, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "تشغيل الأصوات بشكل عام" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Toggle, { checked: settings.enabled, onChange: setEnabled, label: settings.enabled ? "مفعلة" : "صامت" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { ...ROW, flexDirection: "column", alignItems: "stretch" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "مستوى الصوت" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
          Math.round(settings.volume * 100),
          "%"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          type: "range",
          min: "0",
          max: "1",
          step: "0.05",
          value: settings.volume,
          onChange: (e) => setVolume(parseFloat(e.target.value)),
          style: { width: "100%", marginTop: 8 }
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: ROW, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "الاهتزاز" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Toggle, { checked: settings.vibrate, onChange: (b) => update({ vibrate: b }), label: settings.vibrate ? "مفعّل" : "متوقف" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: ROW, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "الوضع الليلي للصوت (خفض تلقائي 22:00 - 07:00)" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Toggle, { checked: settings.nightMode, onChange: (b) => update({ nightMode: b }), label: settings.nightMode ? "مفعّل" : "متوقف" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { style: { marginTop: 20, marginBottom: 6 }, children: "الفئات" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: ROW, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "أصوات الرسائل" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Toggle, { checked: settings.categories.messages, onChange: (b) => setCategory("messages", b), label: "" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: ROW, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "أصوات الإشعارات" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Toggle, { checked: settings.categories.notifications, onChange: (b) => setCategory("notifications", b), label: "" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: ROW, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "أصوات المكالمات والبث" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Toggle, { checked: settings.categories.calls, onChange: (b) => setCategory("calls", b), label: "" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: ROW, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "صوت الكتابة (typing click)" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Toggle, { checked: settings.categories.typing, onChange: (b) => setCategory("typing", b), label: "" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: ROW, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "أصوات النظام (فتح/رجوع/تحديث)" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Toggle, { checked: settings.categories.system, onChange: (b) => setCategory("system", b), label: "" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { style: { marginTop: 20, marginBottom: 6 }, children: "نغمة الرنين" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: ROW, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "نغمة المكالمة الصوتية" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 8 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "select",
          {
            value: settings.ringtone,
            onChange: (e) => update({ ringtone: e.target.value }),
            style: { padding: "6px 10px", borderRadius: 8 },
            children: RINGTONE_KEYS.map((k) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: k, children: k === "ring_voice" ? "كلاسيكية" : "عصرية" }, k))
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => previewRingtone(settings.ringtone), style: btnSm, children: "تجربة" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: ROW, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "نغمة مكالمة الفيديو" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 8 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "select",
          {
            value: settings.videoRingtone,
            onChange: (e) => update({ videoRingtone: e.target.value }),
            style: { padding: "6px 10px", borderRadius: 8 },
            children: RINGTONE_KEYS.map((k) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: k, children: k === "ring_voice" ? "كلاسيكية" : "عصرية" }, k))
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => previewRingtone(settings.videoRingtone), style: btnSm, children: "تجربة" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { style: { marginTop: 20, marginBottom: 6 }, children: "معاينة سريعة" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", flexWrap: "wrap", gap: 8 }, children: Object.keys(SOUND_CATALOG).filter((k) => !SOUND_CATALOG[k].loop).slice(0, 12).map((k) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        type: "button",
        onClick: () => play(k, { force: true }),
        style: chipStyle,
        children: [
          "▶ ",
          k
        ]
      },
      k
    )) })
  ] });
}
const btnSm = {
  padding: "6px 12px",
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,0.15)",
  background: "rgba(255,255,255,0.06)",
  color: "inherit",
  cursor: "pointer",
  fontSize: 12
};
const chipStyle = {
  padding: "6px 10px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.05)",
  color: "inherit",
  cursor: "pointer",
  fontSize: 11
};
const styles = {
  card: {
    background: "var(--panel, #1a1a2e)",
    border: "1px solid var(--line, rgba(255,255,255,0.08))",
    borderRadius: 16,
    padding: "var(--gap-6, 24px)",
    boxShadow: "0 10px 24px rgba(0,0,0,0.12)"
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "var(--gap-3, 12px)",
    marginBottom: "var(--gap-5, 20px)",
    fontSize: "var(--fs-xl, 20px)",
    fontWeight: 700
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
    gap: "var(--gap-3, 12px)",
    marginTop: "var(--gap-4, 16px)"
  },
  langBtn: (active) => ({
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "14px 16px",
    borderRadius: 12,
    border: `2px solid ${active ? "var(--primary, #7C3AED)" : "var(--line, rgba(255,255,255,0.1))"}`,
    background: active ? "var(--primary-soft, rgba(124,58,237,0.12))" : "var(--panel-strong, rgba(255,255,255,0.03))",
    color: "inherit",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: "var(--fs-base, 15px)",
    fontWeight: 600,
    textAlign: "start",
    transition: "all 180ms cubic-bezier(0.22,1,0.36,1)"
  }),
  flag: { fontSize: 24, lineHeight: 1 },
  meta: { display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2 },
  name: { fontSize: "var(--fs-base, 15px)", fontWeight: 700 },
  native: { fontSize: "var(--fs-xs, 12px)", opacity: 0.65 },
  hint: {
    marginTop: "var(--gap-4, 16px)",
    padding: "12px 14px",
    borderRadius: 10,
    background: "var(--info-soft, rgba(59,130,246,0.08))",
    border: "1px solid rgba(59,130,246,0.2)",
    fontSize: "var(--fs-sm, 13px)",
    opacity: 0.9
  },
  toast: {
    position: "fixed",
    top: 24,
    insetInlineEnd: 24,
    padding: "12px 20px",
    borderRadius: 10,
    background: "var(--success, #10B981)",
    color: "#fff",
    fontWeight: 600,
    zIndex: 9999,
    boxShadow: "0 10px 30px rgba(16,185,129,0.4)",
    animation: "slideIn 240ms ease-out"
  }
};
function LanguageSettings() {
  const { lang, setLang, t } = useLanguage();
  const [toast, setToast] = reactExports.useState("");
  const [banner, setBanner] = reactExports.useState(null);
  const handleSelect = (code) => {
    if (code === lang) return;
    const prevMeta = getLanguageMeta(lang);
    const nextMeta = getLanguageMeta(code);
    setLang(code);
    setToast(true);
    setBanner({ from: prevMeta, to: nextMeta, at: Date.now() });
    try {
      fetch("/api/users/me/language", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: code }),
        credentials: "include"
      }).catch(() => {
      });
    } catch (_) {
    }
    setTimeout(() => setToast(""), 2400);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: styles.card, children: [
    banner && /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        role: "status",
        "aria-live": "polite",
        style: {
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "14px 16px",
          borderRadius: 14,
          background: "linear-gradient(135deg, rgba(124,58,237,0.18), rgba(59,130,246,0.18))",
          border: "1px solid rgba(124,58,237,0.35)",
          marginBottom: 18,
          position: "relative",
          overflow: "hidden"
        },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { "aria-hidden": true, style: { fontSize: 32 }, children: banner.to.flag }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontWeight: 700, fontSize: 15, marginBottom: 2 }, children: [
              "✨ ",
              t("settings.languageSaved")
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: 13, opacity: 0.8 }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { "aria-hidden": true, children: banner.from.flag }),
              " ",
              banner.from.nativeName,
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { margin: "0 8px", opacity: 0.6 }, children: "←" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: banner.to.nativeName }),
              " ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { "aria-hidden": true, children: banner.to.flag }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { marginInlineStart: 8, opacity: 0.6 }, children: [
                "(",
                banner.to.dir.toUpperCase(),
                ")"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: () => setBanner(null),
              "aria-label": "إغلاق",
              style: {
                background: "transparent",
                border: "none",
                color: "inherit",
                fontSize: 18,
                cursor: "pointer",
                opacity: 0.6,
                padding: 6
              },
              children: "✕"
            }
          )
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: styles.header, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { "aria-hidden": true, style: { fontSize: 24 }, children: "🌐" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: t("settings.language") })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "var(--fs-base,15px)", fontWeight: 600, marginBottom: 4 }, children: t("settings.languageLabel") }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "var(--fs-sm,13px)", opacity: 0.7 }, children: t("settings.languageHint") }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: styles.grid, role: "radiogroup", "aria-label": t("settings.languageLabel"), children: SUPPORTED_LANGUAGES.map((l) => {
      const active = l.code === lang;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          type: "button",
          role: "radio",
          "aria-checked": active,
          onClick: () => handleSelect(l.code),
          style: styles.langBtn(active),
          onMouseEnter: (e) => {
            if (!active) e.currentTarget.style.borderColor = "var(--primary,#7C3AED)";
          },
          onMouseLeave: (e) => {
            if (!active) e.currentTarget.style.borderColor = "var(--line,rgba(255,255,255,0.1))";
          },
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: styles.flag, "aria-hidden": true, children: l.flag }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: styles.meta, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: styles.name, children: l.nativeName }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: styles.native, children: [
                l.name,
                " · ",
                l.dir.toUpperCase()
              ] })
            ] }),
            active && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { marginInlineStart: "auto", color: "var(--primary,#7C3AED)" }, children: "✓" })
          ]
        },
        l.code
      );
    }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: styles.hint, children: [
      "💡 ",
      t("settings.languageHint"),
      " — RTL/LTR يُطبَّق تلقائياً."
    ] }),
    toast && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: styles.toast, role: "status", "aria-live": "polite", children: [
      "✓ ",
      t("settings.languageSaved")
    ] })
  ] });
}
function TranslationSettings() {
  const { lang } = useLanguage();
  const isAr = lang === "ar" || lang === "ur";
  const [prefs, setPrefs] = reactExports.useState(() => ({
    autoTranslate: true,
    translateOutgoing: false,
    targetLang: lang || "ar",
    ...getTranslationPrefs()
  }));
  const [toast, setToast] = reactExports.useState("");
  reactExports.useEffect(() => {
    saveTranslationPrefs(prefs);
  }, [prefs]);
  const update = (k, v) => setPrefs((p) => ({ ...p, [k]: v }));
  const showToast = (text) => {
    setToast(text);
    window.setTimeout(() => setToast(""), 2200);
  };
  const handleClearCache = () => {
    clearTranslationCache();
    showToast(isAr ? "✓ تم مسح ذاكرة الترجمة المؤقتة" : "✓ Translation cache cleared");
  };
  const styles2 = {
    card: {
      background: "var(--panel, #1a1a2e)",
      border: "1px solid var(--line, rgba(255,255,255,0.08))",
      borderRadius: 16,
      padding: 22,
      boxShadow: "0 10px 24px rgba(0,0,0,0.12)"
    },
    header: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      marginBottom: 14,
      fontSize: 20,
      fontWeight: 700
    },
    row: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "14px 0",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
      gap: 14
    },
    rowMain: { flex: 1, minWidth: 0 },
    rowTitle: { fontSize: 15, fontWeight: 600 },
    rowDesc: { fontSize: 12, opacity: 0.65, marginTop: 4, lineHeight: 1.5 },
    toggle: (on) => ({
      width: 46,
      height: 26,
      borderRadius: 13,
      background: on ? "#10B981" : "rgba(148,163,184,0.4)",
      position: "relative",
      cursor: "pointer",
      transition: "background 180ms ease",
      flexShrink: 0,
      border: "none"
    }),
    toggleKnob: (on) => ({
      position: "absolute",
      top: 3,
      insetInlineStart: on ? 23 : 3,
      width: 20,
      height: 20,
      borderRadius: 10,
      background: "#fff",
      transition: "inset-inline-start 180ms ease",
      boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
    }),
    select: {
      padding: "8px 12px",
      borderRadius: 8,
      background: "rgba(15,23,42,0.6)",
      border: "1px solid rgba(255,255,255,0.1)",
      color: "inherit",
      fontFamily: "inherit",
      cursor: "pointer"
    },
    btn: {
      padding: "10px 18px",
      borderRadius: 10,
      background: "rgba(239,68,68,0.12)",
      border: "1px solid rgba(239,68,68,0.3)",
      color: "#fca5a5",
      cursor: "pointer",
      fontFamily: "inherit",
      fontWeight: 600,
      fontSize: 13
    },
    info: {
      marginTop: 14,
      padding: "10px 14px",
      borderRadius: 10,
      background: "rgba(59,130,246,0.08)",
      border: "1px solid rgba(59,130,246,0.2)",
      fontSize: 12,
      lineHeight: 1.6
    },
    toast: {
      position: "fixed",
      top: 24,
      insetInlineEnd: 24,
      padding: "12px 20px",
      borderRadius: 10,
      background: "var(--success, #10B981)",
      color: "#fff",
      fontWeight: 600,
      zIndex: 9999,
      boxShadow: "0 10px 30px rgba(16,185,129,0.4)"
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: styles2.card, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: styles2.header, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { "aria-hidden": true, style: { fontSize: 24 }, children: "🌍" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: isAr ? "الترجمة الفورية للمحادثات" : "Real-time Chat Translation" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: 13, opacity: 0.75, marginBottom: 6, lineHeight: 1.6 }, children: isAr ? "تظهر الرسائل القادمة بلغة مختلفة عن لغتك مع ترجمة تلقائية أسفل النص الأصلي. مثال: إن كتب لك شخص بالإنجليزية، تصلك رسالته كما كتبها وأسفلها ترجمتها للعربية." : "Incoming messages in a different language show the original text plus an automatic translation below." }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: styles2.row, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: styles2.rowMain, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: styles2.rowTitle, children: isAr ? "🔄 ترجمة الرسائل الواردة تلقائياً" : "🔄 Auto-translate incoming messages" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: styles2.rowDesc, children: isAr ? "تظهر الترجمة أسفل النص الأصلي مباشرة داخل فقاعة الرسالة." : "Translation appears under the original text inside the message bubble." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          "aria-pressed": prefs.autoTranslate,
          onClick: () => update("autoTranslate", !prefs.autoTranslate),
          style: styles2.toggle(prefs.autoTranslate),
          children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: styles2.toggleKnob(prefs.autoTranslate) })
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: styles2.row, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: styles2.rowMain, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: styles2.rowTitle, children: isAr ? "✉️ ترجمة رسائلي قبل الإرسال" : "✉️ Translate my messages before sending" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: styles2.rowDesc, children: isAr ? "عند إرسال رسالة، يتم اكتشاف لغة الطرف الآخر تلقائياً وترجمة رسالتك إليها قبل الإرسال. ستظهر لك معاينة قبل الإرسال." : "When you send a message, your text is automatically translated into the recipient's language." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          "aria-pressed": prefs.translateOutgoing,
          onClick: () => update("translateOutgoing", !prefs.translateOutgoing),
          style: styles2.toggle(prefs.translateOutgoing),
          children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: styles2.toggleKnob(prefs.translateOutgoing) })
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: styles2.row, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: styles2.rowMain, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: styles2.rowTitle, children: isAr ? "🎯 لغة الترجمة المفضلة" : "🎯 Preferred translation language" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: styles2.rowDesc, children: isAr ? "اللغة التي تترجم إليها الرسائل الواردة. الافتراضي = لغة الواجهة الحالية." : "Language to translate incoming messages into. Default = current UI language." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "select",
        {
          value: prefs.targetLang || lang,
          onChange: (e) => update("targetLang", e.target.value),
          style: styles2.select,
          children: SUPPORTED_LANGUAGES.map((l) => /* @__PURE__ */ jsxRuntimeExports.jsxs("option", { value: l.code, children: [
            l.flag,
            " ",
            l.nativeName
          ] }, l.code))
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { ...styles2.row, borderBottom: "none" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: styles2.rowMain, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: styles2.rowTitle, children: isAr ? "🗑️ مسح ذاكرة الترجمة" : "🗑️ Clear translation cache" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: styles2.rowDesc, children: isAr ? "يحذف الترجمات المخزنة محلياً لتوفير المساحة وإعادة الترجمة من جديد." : "Removes stored translations to free space and re-translate fresh." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: handleClearCache, style: styles2.btn, children: isAr ? "مسح" : "Clear" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: styles2.info, children: [
      "💡 ",
      isAr ? "الترجمة تتم محلياً مع كاش ذكي لتوفير الإنترنت. تدعم 8 لغات: العربية، الإنجليزية، الفرنسية، التركية، الإسبانية، الأردية، الإندونيسية، الروسية." : "Translation is cached locally to save bandwidth. Supports 8 languages."
    ] }),
    toast && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: styles2.toast, role: "status", "aria-live": "polite", children: toast })
  ] });
}
const RATE_LIMIT_PREFIX = "yamshat-rate-limit";
const SHADOW_BAN_KEY = "yamshat-shadow-bans";
function now() {
  return Date.now();
}
function readJson(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function writeJson(key, value) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}
class RateLimiter {
  constructor(maxRequests = 10, windowMs = 6e4, storageKey = "") {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.storageKey = storageKey || `${RATE_LIMIT_PREFIX}:${maxRequests}:${windowMs}`;
    this.requests = readJson(this.storageKey, []);
  }
  prune() {
    const threshold = now() - this.windowMs;
    this.requests = this.requests.filter((time) => Number(time) > threshold);
    writeJson(this.storageKey, this.requests);
  }
  isAllowed(weight = 1) {
    this.prune();
    if (this.requests.length + weight > this.maxRequests) return false;
    for (let index = 0; index < weight; index += 1) {
      this.requests.push(now());
    }
    writeJson(this.storageKey, this.requests);
    return true;
  }
  getRemainingRequests() {
    this.prune();
    return Math.max(0, this.maxRequests - this.requests.length);
  }
  getResetTime() {
    this.prune();
    if (!this.requests.length) return 0;
    return Math.max(0, this.requests[0] + this.windowMs - now());
  }
  reset() {
    this.requests = [];
    writeJson(this.storageKey, this.requests);
  }
}
class DuplicateDetector {
  constructor(timeWindowMs = 5e3) {
    this.timeWindowMs = timeWindowMs;
    this.history = [];
  }
  hashContent(content) {
    let hash = 0;
    const str = JSON.stringify(content);
    for (let i = 0; i < str.length; i += 1) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return String(hash);
  }
  isDuplicate(content) {
    const threshold = now() - this.timeWindowMs;
    this.history = this.history.filter((entry) => entry.time > threshold);
    const hash = this.hashContent(content);
    const duplicate = this.history.some((entry) => entry.hash === hash);
    this.history.push({ hash, time: now() });
    return duplicate;
  }
  clear() {
    this.history = [];
  }
}
class BotDetector {
  analyze(payload = {}) {
    const pointerMoves = Number(payload.pointerMoves || 0);
    const keyStrokes = Number(payload.keyStrokes || 0);
    const typingDurationMs = Number(payload.typingDurationMs || 0);
    const pasteRatio = Number(payload.pasteRatio || 0);
    const retryBursts = Number(payload.retryBursts || 0);
    const formFillMs = Number(payload.formFillMs || 0);
    let score = 0;
    if (typingDurationMs > 0 && keyStrokes > 0) {
      const cps = keyStrokes / Math.max(typingDurationMs / 1e3, 1);
      if (cps > 11) score += 24;
      else if (cps > 7) score += 12;
    }
    if (pointerMoves < 2 && keyStrokes > 12) score += 18;
    if (pasteRatio > 0.85) score += 14;
    if (retryBursts > 4) score += 20;
    if (formFillMs > 0 && formFillMs < 1200) score += 18;
    const verdict = score >= 60 ? "high-risk" : score >= 35 ? "review" : "human-like";
    return {
      score,
      verdict,
      humanConfidence: Math.max(0, 100 - score),
      flags: [
        pointerMoves < 2 && keyStrokes > 12 ? "low-pointer-activity" : "",
        pasteRatio > 0.85 ? "high-paste-ratio" : "",
        retryBursts > 4 ? "burst-retries" : ""
      ].filter(Boolean)
    };
  }
}
class ShadowBanRegistry {
  list() {
    return readJson(SHADOW_BAN_KEY, []);
  }
  isShadowBanned(identifier) {
    return this.list().some((item) => item.identifier === identifier && item.active !== false);
  }
  set(identifier, reason = "spam-risk") {
    const current = this.list().filter((item) => item.identifier !== identifier);
    const next = [{ identifier, reason, active: true, createdAt: (/* @__PURE__ */ new Date()).toISOString() }, ...current].slice(0, 100);
    writeJson(SHADOW_BAN_KEY, next);
    return next[0];
  }
  clear(identifier) {
    const next = this.list().filter((item) => item.identifier !== identifier);
    writeJson(SHADOW_BAN_KEY, next);
    return next;
  }
}
function createAntiSpamReport({ actionKey = "generic", content = "", behavior = {} } = {}) {
  const limiter = new RateLimiter(8, 6e4, `${RATE_LIMIT_PREFIX}:${actionKey}`);
  const duplicateDetector = new DuplicateDetector(8e3);
  const botDetector = new BotDetector();
  const shadowBans = new ShadowBanRegistry();
  const allowed = limiter.isAllowed();
  const duplicate = duplicateDetector.isDuplicate(content);
  const bot = botDetector.analyze(behavior);
  const shouldShadowBan = duplicate && bot.score >= 35;
  if (shouldShadowBan) shadowBans.set(actionKey, "duplicate + automated behavior");
  return {
    allowed,
    duplicate,
    bot,
    shadowBanned: shadowBans.isShadowBanned(actionKey),
    remainingRequests: limiter.getRemainingRequests(),
    resetInMs: limiter.getResetTime()
  };
}
function RateLimitUI({ remaining, resetTime }) {
  if (remaining > 0) return null;
  const seconds = Math.ceil(resetTime / 1e3);
  return reactExports.createElement(
    "div",
    { style: { padding: "12px 16px", background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: 10, fontSize: 14, color: "#92400e" } },
    `⏱️ تم الوصول للحد الأقصى من المحاولات. حاول تاني بعد ${seconds} ثانية.`
  );
}
function CooldownUI({ remaining, action = "الإجراء" }) {
  if (remaining <= 0) return null;
  const seconds = Math.ceil(remaining / 1e3);
  return reactExports.createElement(
    "div",
    { style: { padding: "12px 16px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, fontSize: 14, color: "#1d4ed8" } },
    `🛡️ انتظر ${seconds} ثانية قبل ${action} لتقليل الـ spam.`
  );
}
const DEVICE_STORE_KEY = "yamshat.trusted.devices";
const SESSION_STORE_KEY = "yamshat.device.sessions";
const ALERTS_STORE_KEY = "yamshat.device.alerts";
const SYNC_STORE_KEY = "yamshat.device.sync";
const CHANNEL_NAME = "yamshat-multi-device";
function safeParse(raw, fallback) {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function persist(key, value) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}
function read(key, fallback) {
  if (typeof window === "undefined") return fallback;
  return safeParse(window.localStorage.getItem(key), fallback);
}
function getCurrentDeviceFingerprint() {
  if (typeof window === "undefined") return "server-device";
  const platform = navigator.userAgentData?.platform || navigator.platform || "unknown";
  const seed = [
    navigator.userAgent,
    platform,
    navigator.language,
    window.screen?.width || 0,
    window.screen?.height || 0,
    Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
  ].join("|");
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(index);
    hash |= 0;
  }
  return `device_${Math.abs(hash)}`;
}
function getCurrentDeviceLabel() {
  if (typeof navigator === "undefined") return "Unknown device";
  const ua = navigator.userAgent;
  const platform = /android/i.test(ua) ? "Android" : /iphone|ipad|ipod/i.test(ua) ? "iPhone / iPad" : /mac/i.test(ua) ? "macOS" : /win/i.test(ua) ? "Windows" : /linux/i.test(ua) ? "Linux" : "Web";
  const browser = /edg/i.test(ua) ? "Edge" : /chrome/i.test(ua) ? "Chrome" : /firefox/i.test(ua) ? "Firefox" : /safari/i.test(ua) ? "Safari" : "Browser";
  return `${browser} • ${platform}`;
}
function fallbackTrustedDevices() {
  const currentId = getCurrentDeviceFingerprint();
  const list = read(DEVICE_STORE_KEY, []);
  if (list.length) return list;
  const initial = [{
    id: currentId,
    label: getCurrentDeviceLabel(),
    trusted: true,
    current: true,
    lastSeenAt: (/* @__PURE__ */ new Date()).toISOString(),
    trustedAt: (/* @__PURE__ */ new Date()).toISOString(),
    ipLabel: "Current network"
  }];
  persist(DEVICE_STORE_KEY, initial);
  return initial;
}
function fallbackSessions() {
  const currentId = getCurrentDeviceFingerprint();
  const sessions = read(SESSION_STORE_KEY, []);
  if (sessions.length) return sessions;
  const initial = [{
    id: `session-${currentId}`,
    device_id: currentId,
    device_label: getCurrentDeviceLabel(),
    current: true,
    trusted: true,
    last_active_at: (/* @__PURE__ */ new Date()).toISOString(),
    sync_state: "healthy",
    push_enabled: "Notification" in window ? Notification.permission === "granted" : false
  }];
  persist(SESSION_STORE_KEY, initial);
  return initial;
}
function fallbackAlerts() {
  const alerts = read(ALERTS_STORE_KEY, []);
  if (alerts.length) return alerts;
  const initial = [{
    id: "alert-current-login",
    severity: "info",
    title: "تم التحقق من الجهاز الحالي",
    description: "تم تمييز هذا الجهاز كجهاز موثوق ويمكنه استلام تنبيهات الدخول والجلسات.",
    created_at: (/* @__PURE__ */ new Date()).toISOString()
  }];
  persist(ALERTS_STORE_KEY, initial);
  return initial;
}
function updateCollection(collection, predicate, updater) {
  return collection.map((item) => predicate(item) ? typeof updater === "function" ? updater(item) : { ...item, ...updater } : item);
}
async function attemptRemote(method, url, config) {
  try {
    const response = await API[method](url, ...Array.isArray(config) ? config : [config].filter((value) => value !== void 0));
    return response?.data;
  } catch {
    return null;
  }
}
const deviceTrustService = {
  async getTrustedDevices() {
    const remote = await attemptRemote("get", "/users/trusted-devices");
    if (Array.isArray(remote?.items || remote)) return remote.items || remote;
    return fallbackTrustedDevices();
  },
  async trustCurrentDevice() {
    const payload = {
      device_id: getCurrentDeviceFingerprint(),
      label: getCurrentDeviceLabel(),
      trusted: true
    };
    const remote = await attemptRemote("post", "/users/trusted-devices", payload);
    if (remote) return remote;
    const list = fallbackTrustedDevices();
    const currentId = payload.device_id;
    const existing = list.find((item) => item.id === currentId || item.device_id === currentId);
    const next = existing ? updateCollection(list, (item) => item.id === currentId || item.device_id === currentId, { trusted: true, current: true, trustedAt: (/* @__PURE__ */ new Date()).toISOString(), lastSeenAt: (/* @__PURE__ */ new Date()).toISOString() }) : [{ ...payload, id: currentId, current: true, trustedAt: (/* @__PURE__ */ new Date()).toISOString(), lastSeenAt: (/* @__PURE__ */ new Date()).toISOString() }, ...list];
    persist(DEVICE_STORE_KEY, next);
    return next;
  },
  async untrustDevice(deviceId) {
    const remote = await attemptRemote("delete", `/users/trusted-devices/${encodeURIComponent(deviceId)}`);
    if (remote) return remote;
    const next = fallbackTrustedDevices().filter((item) => (item.id || item.device_id) !== deviceId);
    persist(DEVICE_STORE_KEY, next);
    return next;
  },
  async getSessions() {
    const remote = await attemptRemote("get", "/users/sessions");
    const list = Array.isArray(remote?.items || remote) ? remote.items || remote : fallbackSessions();
    persist(SESSION_STORE_KEY, list);
    return list;
  },
  async revokeSession(sessionId) {
    const remote = await attemptRemote("delete", `/users/sessions/${encodeURIComponent(sessionId)}`);
    if (remote) return remote;
    const next = fallbackSessions().filter((item) => item.id !== sessionId);
    persist(SESSION_STORE_KEY, next);
    return next;
  },
  async getLoginAlerts() {
    const remote = await attemptRemote("get", "/users/login-alerts");
    if (Array.isArray(remote?.items || remote)) return remote.items || remote;
    return fallbackAlerts();
  },
  async createLoginAlert(alert) {
    const payload = {
      id: `alert-${Date.now()}`,
      severity: alert?.severity || "warning",
      title: alert?.title || "تنبيه تسجيل دخول",
      description: alert?.description || "تم رصد محاولة دخول جديدة وتحتاج لمراجعتك.",
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    await attemptRemote("post", "/users/login-alerts", payload);
    const next = [payload, ...fallbackAlerts()].slice(0, 20);
    persist(ALERTS_STORE_KEY, next);
    return payload;
  },
  getSyncState() {
    const session = useAppStore.getState().session;
    const snapshot = read(SYNC_STORE_KEY, {
      profile_revision: 1,
      notifications_revision: 1,
      inbox_revision: 1,
      last_sync_at: (/* @__PURE__ */ new Date()).toISOString(),
      session_id: session?.session_id || session?.id || null,
      strategy: "broadcast-channel + storage event fallback",
      conflicts: 0,
      devices_online: 1
    });
    return snapshot;
  },
  updateSyncState(patch = {}) {
    const next = {
      ...this.getSyncState(),
      ...patch,
      last_sync_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    persist(SYNC_STORE_KEY, next);
    this.broadcastSyncState(next);
    return next;
  },
  broadcastSyncState(payload = {}) {
    if (typeof window === "undefined") return;
    try {
      const channel = new BroadcastChannel(CHANNEL_NAME);
      channel.postMessage({ type: "sync-state", payload });
      channel.close();
    } catch {
      window.localStorage.setItem(`${SYNC_STORE_KEY}.broadcast`, JSON.stringify({ payload, sentAt: Date.now() }));
    }
  },
  subscribe(handler) {
    if (typeof window === "undefined" || typeof handler !== "function") return () => {
    };
    const onStorage = (event) => {
      if (event.key !== `${SYNC_STORE_KEY}.broadcast`) return;
      const payload = safeParse(event.newValue, null);
      if (payload?.payload) handler(payload.payload);
    };
    window.addEventListener("storage", onStorage);
    let channel = null;
    try {
      channel = new BroadcastChannel(CHANNEL_NAME);
      channel.onmessage = (event) => {
        if (event?.data?.type === "sync-state") handler(event.data.payload);
      };
    } catch {
      channel = null;
    }
    return () => {
      window.removeEventListener("storage", onStorage);
      channel?.close?.();
    };
  }
};
const TAB_GROUPS = [
  {
    label: "الحساب",
    tabs: [
      { key: "account", label: "👤 الحساب" },
      { key: "profile", label: "🪪 الملف الشخصي" },
      { key: "privacy", label: "🔒 الخصوصية" },
      { key: "security", label: "🛡️ الأمان" },
      { key: "two-factor", label: "🔑 المصادقة الثنائية" },
      { key: "devices", label: "💻 الأجهزة الموثوقة" },
      { key: "sessions", label: "🪟 الجلسات" },
      { key: "connected-apps", label: "🔗 التطبيقات المرتبطة" },
      { key: "blocked", label: "🚫 المحظورون" },
      { key: "muted", label: "🔇 المكتومون" }
    ]
  },
  {
    label: "المحتوى والخدمات",
    tabs: [
      { key: "feed", label: "📰 الخلاصة" },
      { key: "reels", label: "🎬 الريلز" },
      { key: "stories", label: "📖 الستوريز" },
      { key: "inbox", label: "✉️ الرسائل" },
      { key: "voice", label: "🎙️ الغرف الصوتية" },
      { key: "engagement", label: "⚔️ التفاعل والمعارك" },
      { key: "wallet", label: "💰 المحفظة" }
    ]
  },
  {
    label: "التطبيق",
    tabs: [
      { key: "appearance", label: "🎨 المظهر" },
      { key: "language", label: "🌐 اللغة" },
      { key: "font-size", label: "🔤 حجم الخط" },
      { key: "translation", label: "🌍 الترجمة" },
      { key: "accessibility", label: "♿ سهولة الوصول" },
      { key: "notifications", label: "🔔 الإشعارات" },
      { key: "sounds", label: "🔊 الأصوات" },
      { key: "data-storage", label: "💾 البيانات" },
      { key: "media", label: "🎞️ حماية الوسائط" },
      { key: "sync", label: "🔄 المزامنة" },
      { key: "performance", label: "⚡ الأداء" }
    ]
  },
  {
    label: "الدعم",
    tabs: [
      { key: "download-data", label: "📥 تنزيل بياناتي" },
      { key: "help", label: "❓ المساعدة" },
      { key: "feedback", label: "💬 ملاحظات" },
      { key: "about", label: "ℹ️ عن التطبيق" },
      { key: "legal", label: "📜 القانوني" }
    ]
  }
];
const FULL_PAGE_LINKS = {
  profile: "/settings/profile",
  feed: "/settings/feed",
  reels: "/settings/reels",
  stories: "/settings/stories",
  inbox: "/settings/inbox",
  voice: "/settings/voice",
  engagement: "/settings/engagement",
  wallet: "/settings/wallet",
  notifications: "/settings/notifications"
};
const PREFS_KEY = "yamshat:app-prefs";
const loadPrefs = () => {
  try {
    return JSON.parse(localStorage.getItem(PREFS_KEY) || "{}");
  } catch {
    return {};
  }
};
const savePrefs = (p) => {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(p));
  } catch {
  }
};
function SettingsModal({ open, title, description, fields = [], confirmLabel = "حفظ", cancelLabel = "إلغاء", danger = false, onConfirm, onClose }) {
  const [values, setValues] = reactExports.useState({});
  const [submitting, setSubmitting] = reactExports.useState(false);
  reactExports.useEffect(() => {
    if (open) {
      const init = {};
      fields.forEach((f) => {
        init[f.name] = f.defaultValue ?? "";
      });
      setValues(init);
      setSubmitting(false);
    }
  }, [open]);
  if (!open) return null;
  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await onConfirm?.(values);
    } finally {
      setSubmitting(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "settings-modal-backdrop", role: "dialog", "aria-modal": "true", onClick: onClose, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "settings-modal", onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "settings-modal-header", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { children: title }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "settings-modal-close", onClick: onClose, "aria-label": "إغلاق", children: "✕" })
    ] }),
    description ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "muted", style: { margin: "0 0 10px", fontSize: 12 }, children: description }) : null,
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "grid", gap: 8 }, children: fields.map((f) => /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { style: { display: "grid", gap: 4 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: 11.5, color: "rgba(226,232,240,0.8)" }, children: f.label }),
      f.type === "textarea" ? /* @__PURE__ */ jsxRuntimeExports.jsx(
        "textarea",
        {
          className: "settings-input",
          rows: 3,
          placeholder: f.placeholder || "",
          value: values[f.name] || "",
          onChange: (e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))
        }
      ) : f.type === "select" ? /* @__PURE__ */ jsxRuntimeExports.jsx(
        "select",
        {
          className: "settings-select",
          value: values[f.name] || "",
          onChange: (e) => setValues((v) => ({ ...v, [f.name]: e.target.value })),
          children: (f.options || []).map((o) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: o.value, children: o.label }, o.value))
        }
      ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          className: "settings-input",
          type: f.type || "text",
          placeholder: f.placeholder || "",
          value: values[f.name] || "",
          onChange: (e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))
        }
      ),
      f.hint ? /* @__PURE__ */ jsxRuntimeExports.jsx("small", { className: "muted", style: { fontSize: 10.5 }, children: f.hint }) : null
    ] }, f.name)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 6, justifyContent: "flex-end", marginTop: 12 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "settings-btn-mini", onClick: onClose, children: cancelLabel }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          className: `settings-btn-mini settings-btn-mini--primary ${danger ? "settings-btn-mini--danger" : ""}`,
          disabled: submitting,
          onClick: handleConfirm,
          children: submitting ? "..." : confirmLabel
        }
      )
    ] })
  ] }) });
}
function InfoModal({ open, title, content, onClose }) {
  if (!open) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "settings-modal-backdrop", role: "dialog", "aria-modal": "true", onClick: onClose, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "settings-modal", onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "settings-modal-header", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { children: title }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "settings-modal-close", onClick: onClose, "aria-label": "إغلاق", children: "✕" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "settings-modal-content", children: content }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", gap: 6, justifyContent: "flex-end", marginTop: 12 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "settings-btn-mini", onClick: onClose, children: "إغلاق" }) })
  ] }) });
}
function MiniBtn({ children, onClick, variant = "secondary", danger = false, disabled = false, loading = false, ...rest }) {
  const cls = [
    "settings-btn-mini",
    variant === "primary" ? "settings-btn-mini--primary" : "",
    danger ? "settings-btn-mini--danger" : "",
    loading ? "is-busy" : ""
  ].filter(Boolean).join(" ");
  return /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: cls, onClick, disabled: disabled || loading, ...rest, children: loading ? "..." : children });
}
function Settings() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = reactExports.useState("account");
  const [menuOpen, setMenuOpen] = reactExports.useState(false);
  const [mobileView, setMobileView] = reactExports.useState("menu");
  const [isMobile, setIsMobile] = reactExports.useState(() => typeof window !== "undefined" ? window.innerWidth <= 900 : false);
  const [trustedDevices, setTrustedDevices] = reactExports.useState([]);
  const [sessions, setSessions] = reactExports.useState([]);
  const [alerts, setAlerts] = reactExports.useState([]);
  const [pushState, setPushState] = reactExports.useState(notificationService.getPushReadiness());
  const [syncState, setSyncState] = reactExports.useState(deviceTrustService.getSyncState());
  const [message, setMessage] = reactExports.useState("");
  const [busy, setBusy] = reactExports.useState("");
  const [modal, setModal] = reactExports.useState(null);
  const [prefs, setPrefs] = reactExports.useState(() => ({
    theme: "dark",
    accentColor: "purple",
    fontSize: "medium",
    density: "normal",
    reducedMotion: false,
    highContrast: false,
    roundedCorners: true,
    animations: true,
    privateAccount: false,
    hideLastSeen: false,
    hideReadReceipts: false,
    incognitoMode: false,
    anonymousBrowsing: false,
    locationSharing: false,
    saveDataMode: false,
    lowPowerMode: false,
    prefetchEnabled: true,
    hardwareAcceleration: true,
    autoBackup: true,
    backupOnWifi: true,
    storageLimit: "5GB",
    screenReader: false,
    largeButtons: false,
    captionsAlways: false,
    reduceTransparency: false,
    email: "",
    phone: "",
    username: "",
    birthdate: "",
    country: "",
    twoFAEmail: false,
    twoFASms: false,
    biometric: true,
    googleLinked: true,
    appleLinked: false,
    facebookLinked: false,
    twitterLinked: false,
    // profile / content quick prefs
    showOnlineStatus: true,
    allowMentions: "everyone",
    allowDMs: "followers",
    // feed
    feedAlgo: "smart",
    autoplayVideos: true,
    showSensitive: false,
    // reels
    reelsAutoplay: true,
    reelsSaveData: false,
    // stories
    storiesReplies: "everyone",
    storiesShareable: true,
    // inbox
    inboxRequestFilter: "known",
    readReceipts: true,
    // voice rooms
    voiceAutoJoin: false,
    voiceNoiseSuppress: true,
    // engagement
    battleNotifs: true,
    streakReminders: true,
    // wallet
    walletPin: true,
    walletAutoConfirm: false,
    ...loadPrefs()
  }));
  const antiSpam = reactExports.useMemo(() => createAntiSpamReport({
    actionKey: "settings-preview",
    content: "preview",
    behavior: { pointerMoves: 6, keyStrokes: 14, typingDurationMs: 4200, pasteRatio: 0.1, retryBursts: 0, formFillMs: 4200 }
  }), []);
  const cdnConfig = reactExports.useMemo(() => getCDNConfig(), []);
  const imageDelivery = reactExports.useMemo(() => getMediaDeliveryProfile("image"), []);
  const videoDelivery = reactExports.useMemo(() => getMediaDeliveryProfile("video"), []);
  const fileDelivery = reactExports.useMemo(() => getMediaDeliveryProfile("file"), []);
  const updatePref = (k, v) => {
    const next = { ...prefs, [k]: v };
    setPrefs(next);
    savePrefs(next);
    setSuccess("تم الحفظ.");
  };
  reactExports.useEffect(() => {
    const requestedTab = new URLSearchParams(location.search).get("tab");
    const allTabs = TAB_GROUPS.flatMap((g) => g.tabs);
    if (requestedTab && allTabs.some((tab) => tab.key === requestedTab)) {
      setActiveTab(requestedTab);
      if (typeof window !== "undefined" && window.innerWidth <= 900) {
        setMobileView("section");
      }
    }
  }, [location.search]);
  reactExports.useEffect(() => {
    if (typeof window === "undefined") return void 0;
    const onResize = () => {
      const mobile = window.innerWidth <= 900;
      setIsMobile(mobile);
      if (!mobile) {
        setMobileView("section");
      }
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  reactExports.useEffect(() => {
    let unsubscribe = () => {
    };
    const load = async () => {
      try {
        const [devicesResult, sessionsResult, alertsResult] = await Promise.all([
          deviceTrustService.getTrustedDevices(),
          deviceTrustService.getSessions(),
          deviceTrustService.getLoginAlerts()
        ]);
        setTrustedDevices(Array.isArray(devicesResult) ? devicesResult : devicesResult?.items || []);
        setSessions(Array.isArray(sessionsResult) ? sessionsResult : sessionsResult?.items || []);
        setAlerts(Array.isArray(alertsResult) ? alertsResult : alertsResult?.items || []);
        setPushState(notificationService.getPushReadiness());
        setSyncState(deviceTrustService.getSyncState());
        unsubscribe = deviceTrustService.subscribe((payload) => setSyncState((prev) => ({ ...prev, ...payload || {} })));
      } catch {
      }
    };
    load();
    return () => unsubscribe();
  }, []);
  const setSuccess = (text) => {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 2e3);
  };
  const openEdit = (cfg) => setModal({ type: "edit", ...cfg });
  const openInfo = (cfg) => setModal({ type: "info", ...cfg });
  const closeModal = () => setModal(null);
  const handleEditEmail = () => openEdit({
    title: "تعديل البريد الإلكتروني",
    description: "سيتم إرسال رابط تأكيد للبريد الجديد.",
    fields: [{ name: "email", label: "البريد الجديد", type: "email", defaultValue: prefs.email, placeholder: "name@example.com" }],
    confirmLabel: "إرسال",
    onConfirm: (v) => {
      updatePref("email", v.email);
      setSuccess("تم إرسال التأكيد.");
      closeModal();
    }
  });
  const handleEditPhone = () => openEdit({
    title: "تعديل رقم الهاتف",
    description: "سيتم إرسال رمز تحقق عبر SMS.",
    fields: [{ name: "phone", label: "رقم الهاتف", type: "tel", defaultValue: prefs.phone, placeholder: "+966 5xxxxxxxx" }],
    confirmLabel: "إرسال",
    onConfirm: (v) => {
      updatePref("phone", v.phone);
      setSuccess("تم إرسال الرمز.");
      closeModal();
    }
  });
  const handleChangePassword = () => openEdit({
    title: "تغيير كلمة المرور",
    fields: [
      { name: "current", label: "الحالية", type: "password" },
      { name: "next", label: "الجديدة", type: "password", hint: "8 أحرف على الأقل" },
      { name: "confirm", label: "تأكيد الجديدة", type: "password" }
    ],
    confirmLabel: "تغيير",
    onConfirm: (v) => {
      if (!v.current || !v.next) {
        setSuccess("يرجى تعبئة الحقول.");
        return;
      }
      if (v.next.length < 8) {
        setSuccess("كلمة المرور قصيرة.");
        return;
      }
      if (v.next !== v.confirm) {
        setSuccess("غير متطابقتين.");
        return;
      }
      setSuccess("تم التغيير.");
      closeModal();
    }
  });
  const handleEditUsername = () => openEdit({
    title: "اسم المستخدم",
    fields: [{ name: "username", label: "اسم المستخدم", defaultValue: prefs.username, placeholder: "@username" }],
    onConfirm: (v) => {
      updatePref("username", v.username);
      setSuccess("تم التحديث.");
      closeModal();
    }
  });
  const handleEditBirthdate = () => openEdit({
    title: "تاريخ الميلاد",
    fields: [{ name: "birthdate", label: "التاريخ", type: "date", defaultValue: prefs.birthdate }],
    onConfirm: (v) => {
      updatePref("birthdate", v.birthdate);
      setSuccess("تم التحديث.");
      closeModal();
    }
  });
  const handleEditCountry = () => openEdit({
    title: "الدولة",
    fields: [
      { name: "country", label: "الدولة", type: "select", defaultValue: prefs.country || "SA", options: [
        { value: "SA", label: "السعودية" },
        { value: "AE", label: "الإمارات" },
        { value: "EG", label: "مصر" },
        { value: "JO", label: "الأردن" },
        { value: "KW", label: "الكويت" },
        { value: "QA", label: "قطر" },
        { value: "OM", label: "عُمان" },
        { value: "BH", label: "البحرين" },
        { value: "IQ", label: "العراق" },
        { value: "MA", label: "المغرب" },
        { value: "DZ", label: "الجزائر" },
        { value: "TN", label: "تونس" },
        { value: "LY", label: "ليبيا" },
        { value: "YE", label: "اليمن" },
        { value: "SY", label: "سوريا" },
        { value: "LB", label: "لبنان" },
        { value: "PS", label: "فلسطين" },
        { value: "SD", label: "السودان" },
        { value: "OTHER", label: "أخرى" }
      ] }
    ],
    onConfirm: (v) => {
      updatePref("country", v.country);
      setSuccess("تم التحديث.");
      closeModal();
    }
  });
  const handleSuspendAccount = () => openEdit({
    title: "إيقاف مؤقت",
    description: "سيُخفى حسابك دون حذف بياناتك.",
    fields: [{ name: "reason", label: "السبب (اختياري)", type: "textarea", placeholder: "أحتاج استراحة..." }],
    confirmLabel: "إيقاف",
    danger: true,
    onConfirm: () => {
      setSuccess("تم الإيقاف.");
      closeModal();
      window.setTimeout(performLogout, 1200);
    }
  });
  const handleDeleteAccount = () => openEdit({
    title: "حذف الحساب",
    description: "⚠️ لا يمكن التراجع. سيتم حذف بياناتك خلال 30 يومًا.",
    fields: [{ name: "confirm", label: 'اكتب "حذف نهائي"', placeholder: "حذف نهائي" }],
    confirmLabel: "حذف",
    danger: true,
    onConfirm: (v) => {
      if (v.confirm !== "حذف نهائي") {
        setSuccess('اكتب "حذف نهائي".');
        return;
      }
      setSuccess("تم تسجيل الطلب.");
      closeModal();
    }
  });
  const handleConvertBusiness = () => openEdit({
    title: "حساب أعمال",
    fields: [
      { name: "category", label: "الفئة", type: "select", defaultValue: "creator", options: [
        { value: "creator", label: "صانع محتوى" },
        { value: "shop", label: "متجر" },
        { value: "service", label: "خدمات" },
        { value: "media", label: "وسائل إعلام" },
        { value: "other", label: "أخرى" }
      ] },
      { name: "website", label: "الموقع (اختياري)", type: "url", placeholder: "https://..." }
    ],
    confirmLabel: "تحويل",
    onConfirm: () => {
      setSuccess("تم التحويل.");
      closeModal();
    }
  });
  const handle2FAApp = () => openEdit({
    title: "تطبيق المصادقة",
    description: "امسح QR ثم أدخل الرمز.",
    fields: [{ name: "code", label: "رمز 6 أرقام", placeholder: "123456" }],
    confirmLabel: "تفعيل",
    onConfirm: (v) => {
      if (!/^\d{6}$/.test(v.code || "")) {
        setSuccess("6 أرقام مطلوبة.");
        return;
      }
      setSuccess("تم التفعيل.");
      closeModal();
    }
  });
  const handleAddHardwareKey = () => openEdit({
    title: "مفتاح أمان",
    fields: [{ name: "label", label: "اسم المفتاح", placeholder: "YubiKey" }],
    confirmLabel: "تسجيل",
    onConfirm: () => {
      setSuccess("تم التسجيل.");
      closeModal();
    }
  });
  const handleRecoveryCodes = () => {
    openEdit({
      title: "رموز الاسترداد",
      description: "رموز استخدام‑مرة‑واحدة لاسترداد الحساب عند فقد الجهاز الرئيسي. توليد رموز جديدة يُبطل كل الرموز القديمة فوراً.",
      fields: [
        { name: "count", label: "عدد الرموز", type: "select", defaultValue: "10", options: [
          { value: "6", label: "6 رموز (خفيف)" },
          { value: "10", label: "10 رموز (موصى به)" },
          { value: "16", label: "16 رمز (احتياط ممتد)" }
        ] },
        { name: "invalidateOld", label: "إبطال الرموز القديمة", type: "select", defaultValue: "yes", options: [
          { value: "yes", label: "نعم — إبطال كل الرموز السابقة (موصى به)" },
          { value: "no", label: "لا — إبقاء القديمة صالحة (غير موصى به)" }
        ] },
        { name: "delivery", label: "طريقة العرض", type: "select", defaultValue: "screen", options: [
          { value: "screen", label: "عرض على الشاشة فقط" },
          { value: "email", label: "عرض + إرسال نسخة مشفّرة للبريد" },
          { value: "download", label: "عرض + تنزيل ملف نصي" }
        ] },
        { name: "notify", label: "تنبيه عبر الجلسات الأخرى", type: "select", defaultValue: "yes", options: [
          { value: "yes", label: "نعم — إشعار الأجهزة الأخرى بتوليد رموز جديدة" },
          { value: "no", label: "لا" }
        ] }
      ],
      confirmLabel: "توليد",
      cancelLabel: "إلغاء",
      danger: true,
      onConfirm: (v) => {
        const count = Number(v.count || 10);
        const codes = Array.from(
          { length: count },
          () => Math.random().toString(36).slice(2, 8).toUpperCase() + "-" + Math.random().toString(36).slice(2, 6).toUpperCase()
        );
        if (v.delivery === "download") {
          try {
            const blob = new Blob([codes.join("\n")], { type: "text/plain" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "recovery-codes.txt";
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 500);
          } catch {
          }
        }
        closeModal();
        openInfo({
          title: "رموز الاسترداد الجديدة",
          content: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "muted", style: { fontSize: 12 }, children: [
              v.invalidateOld === "yes" ? "✅ تم إبطال الرموز السابقة. " : "",
              "احفظ الرموز — كل رمز يُستخدم مرة واحدة فقط.",
              v.delivery === "email" ? " تم إرسال نسخة مشفّرة لبريدك." : ""
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 6, marginTop: 8 }, children: codes.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsx("code", { style: { padding: "5px 7px", background: "rgba(15,23,42,0.6)", borderRadius: 6, fontFamily: "monospace", textAlign: "center", fontSize: 11.5 }, children: c }, c)) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { marginTop: 8 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "settings-btn-mini", onClick: () => {
              navigator.clipboard?.writeText(codes.join("\n")).then(() => setSuccess("تم النسخ.")).catch(() => {
              });
            }, children: "📋 نسخ الكل" }) })
          ] })
        });
        setSuccess(`تم توليد ${count} رموز جديدة.${v.notify === "yes" ? " وتم إشعار الأجهزة الأخرى." : ""}`);
      }
    });
  };
  const handleOAuth = (provider) => {
    const key = provider + "Linked";
    const isLinked = !!prefs[key];
    const providerLabels = { google: "Google", apple: "Apple", facebook: "Facebook", twitter: "Twitter" };
    const providerName = providerLabels[provider] || provider;
    if (isLinked) {
      openEdit({
        title: `إلغاء ربط ${providerName}`,
        description: `سيُلغى ربط حساب ${providerName} من حسابك. يمكنك اختيار سلوك الجلسات المرتبطة.`,
        fields: [
          { name: "revokeToken", label: "إبطال الرمز على الخادم", type: "select", defaultValue: "yes", options: [
            { value: "yes", label: "نعم — إبطال فوري (موصى به)" },
            { value: "no", label: "لا — الاحتفاظ بالرمز مؤقتاً" }
          ] },
          { name: "endSessions", label: "إنهاء الجلسات المفتوحة عبر هذا المزود", type: "select", defaultValue: "no", options: [
            { value: "no", label: "لا — إبقاء الجلسات مفتوحة" },
            { value: "yes", label: "نعم — إنهاء الجلسات المرتبطة" }
          ] }
        ],
        confirmLabel: "إلغاء الربط",
        cancelLabel: "رجوع",
        danger: true,
        onConfirm: async (v) => {
          try {
            updatePref(key, false);
            if (v.endSessions === "yes") {
              try {
                await Promise.all(sessions.filter((s) => !s.current && (s.provider === provider || s.oauth_provider === provider)).map((s) => deviceTrustService.revokeSession(s.id).catch(() => null)));
                setSessions(await deviceTrustService.getSessions());
              } catch {
              }
            }
            closeModal();
            setSuccess(`أُلغي ربط ${providerName}.`);
          } catch {
            closeModal();
            setSuccess("تعذّر إلغاء الربط.");
          }
        }
      });
    } else {
      openEdit({
        title: `ربط حساب ${providerName}`,
        description: `سيتم فتح صفحة ${providerName} للسماح بمنح الأذونات. يمكنك اختيار نطاق الأذونات المطلوبة.`,
        fields: [
          { name: "scope", label: "نطاق الأذونات", type: "select", defaultValue: "basic", options: [
            { value: "basic", label: "أساسية — الملف الشخصي والبريد فقط" },
            { value: "extended", label: "موسّعة — تشمل جهات الاتصال (اختياري)" }
          ] },
          { name: "rememberDevice", label: "تذكّر هذا الجهاز", type: "select", defaultValue: "yes", options: [
            { value: "yes", label: "نعم — تسجيل دخول أسرع لاحقاً" },
            { value: "no", label: "لا — طلب المصادقة في كل مرة" }
          ] }
        ],
        confirmLabel: "متابعة",
        cancelLabel: "إلغاء",
        onConfirm: async (v) => {
          try {
            updatePref(key, true);
            updatePref(`${provider}Scope`, v.scope || "basic");
            if (v.rememberDevice === "yes") {
              try {
                await deviceTrustService.trustCurrentDevice();
              } catch {
              }
            }
            closeModal();
            setSuccess(`تم ربط ${providerName}.`);
          } catch {
            closeModal();
            setSuccess("تعذّر الربط.");
          }
        }
      });
    }
  };
  const handleRevokeAllSessions = () => {
    const otherCount = sessions.filter((s) => !s.current).length;
    openEdit({
      title: "إنهاء الجلسات الأخرى",
      description: `سيتم إنهاء ${otherCount} جلسة نشطة على أجهزة أخرى. الجلسة الحالية على هذا الجهاز لن تتأثر.`,
      fields: [
        { name: "scope", label: "نطاق الإنهاء", type: "select", defaultValue: "others", options: [
          { value: "others", label: `كل الجلسات الأخرى (${otherCount})` },
          { value: "mobile", label: "جلسات الأجهزة المحمولة فقط" },
          { value: "desktop", label: "جلسات الحواسيب فقط" },
          { value: "old", label: "الجلسات غير النشطة أكثر من 7 أيام" }
        ] },
        { name: "untrustDevices", label: "إزالة توثيق الأجهزة المرتبطة", type: "select", defaultValue: "no", options: [
          { value: "no", label: "لا — الاحتفاظ بتوثيق الأجهزة" },
          { value: "yes", label: "نعم — إلغاء توثيق كل الأجهزة الأخرى" }
        ] },
        { name: "notify", label: "إشعار الأجهزة بالإنهاء", type: "select", defaultValue: "yes", options: [
          { value: "yes", label: "نعم — إرسال إشعار قبل الإنهاء" },
          { value: "no", label: "لا — إنهاء صامت" }
        ] }
      ],
      confirmLabel: "إنهاء",
      cancelLabel: "إلغاء",
      danger: true,
      onConfirm: async (v) => {
        setBusy("revoke-all");
        try {
          const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1e3;
          const targets = sessions.filter((s) => {
            if (s.current) return false;
            const kind = (s.device_type || s.platform || "").toLowerCase();
            const lastSeen = s.last_seen ? new Date(s.last_seen).getTime() : 0;
            if (v.scope === "mobile") return /mobile|android|ios|iphone|ipad/.test(kind);
            if (v.scope === "desktop") return /desktop|mac|windows|linux/.test(kind);
            if (v.scope === "old") return lastSeen && lastSeen < cutoff;
            return true;
          });
          await Promise.all(targets.map(
            (s) => deviceTrustService.revokeSession(s.id, { notify: v.notify === "yes" }).catch(() => null)
          ));
          if (v.untrustDevices === "yes") {
            try {
              const devs = await deviceTrustService.getTrustedDevices();
              await Promise.all(devs.filter((d) => !d.current).map(
                (d) => deviceTrustService.untrustDevice(d.id || d.device_id).catch(() => null)
              ));
              setTrustedDevices(await deviceTrustService.getTrustedDevices());
            } catch {
            }
          }
          setSessions(await deviceTrustService.getSessions());
          closeModal();
          setSuccess(`تم إنهاء ${targets.length} جلسة.`);
        } catch {
          closeModal();
          setSuccess("تعذّر إنهاء الجلسات.");
        } finally {
          setBusy("");
        }
      }
    });
  };
  const handleClearMedia = () => {
    openEdit({
      title: "مسح الوسائط المنزّلة",
      description: "يزيل الوسائط المخزّنة محلياً (صور/فيديو/ملفات). لن يؤثر ذلك على الوسائط الأصلية على الخادم.",
      fields: [
        { name: "scope", label: "نطاق المسح", type: "select", defaultValue: "all", options: [
          { value: "all", label: "كل الوسائط (صور + فيديو + ملفات)" },
          { value: "images", label: "الصور فقط" },
          { value: "videos", label: "الفيديو فقط" },
          { value: "downloads", label: "التنزيلات فقط" }
        ] },
        { name: "olderThan", label: "مسح ما أقدم من", type: "select", defaultValue: "any", options: [
          { value: "any", label: "كل شيء (بدون تحديد فترة)" },
          { value: "7", label: "أقدم من 7 أيام" },
          { value: "30", label: "أقدم من 30 يوماً" },
          { value: "90", label: "أقدم من 90 يوماً" }
        ] },
        { name: "clearCaches", label: "مسح ذاكرة التخزين المؤقت (Cache API)", type: "select", defaultValue: "yes", options: [
          { value: "yes", label: "نعم — يحرّر مساحة أكثر" },
          { value: "no", label: "لا — الاحتفاظ بذاكرة المتصفح" }
        ] }
      ],
      confirmLabel: "مسح",
      cancelLabel: "إلغاء",
      danger: true,
      onConfirm: async (v) => {
        try {
          const scope = v.scope || "all";
          const cutoff = v.olderThan && v.olderThan !== "any" ? Date.now() - parseInt(v.olderThan, 10) * 24 * 60 * 60 * 1e3 : null;
          const matchesScope = (k) => {
            if (scope === "images") return k.includes(":media:image") || k.includes(":images");
            if (scope === "videos") return k.includes(":media:video") || k.includes(":videos");
            if (scope === "downloads") return k.includes(":downloads");
            return k.includes(":media") || k.includes(":downloads");
          };
          Object.keys(localStorage).filter(matchesScope).forEach((k) => {
            if (cutoff) {
              try {
                const raw = localStorage.getItem(k);
                const parsed = raw && raw.startsWith("{") ? JSON.parse(raw) : null;
                const ts = parsed && (parsed.savedAt || parsed.updatedAt || parsed.time);
                if (ts && new Date(ts).getTime() > cutoff) return;
              } catch {
              }
            }
            localStorage.removeItem(k);
          });
          if (v.clearCaches === "yes" && "caches" in window) {
            const keys = await caches.keys();
            await Promise.all(keys.filter((k) => {
              if (scope === "images") return k.includes("image");
              if (scope === "videos") return k.includes("video");
              if (scope === "downloads") return k.includes("download");
              return k.includes("media") || k.includes("image") || k.includes("video");
            }).map((k) => caches.delete(k)));
          }
          closeModal();
          setSuccess("تم مسح الوسائط.");
        } catch {
          closeModal();
          setSuccess("تعذّر المسح.");
        }
      }
    });
  };
  const handleRate = () => openEdit({
    title: "قيّم التطبيق",
    fields: [
      { name: "stars", label: "التقييم", type: "select", defaultValue: "5", options: [
        { value: "5", label: "⭐⭐⭐⭐⭐" },
        { value: "4", label: "⭐⭐⭐⭐" },
        { value: "3", label: "⭐⭐⭐" },
        { value: "2", label: "⭐⭐" },
        { value: "1", label: "⭐" }
      ] },
      { name: "comment", label: "تعليق (اختياري)", type: "textarea" }
    ],
    confirmLabel: "إرسال",
    onConfirm: () => {
      setSuccess("شكراً! 🌟");
      closeModal();
    }
  });
  const handleSuggest = () => openEdit({
    title: "اقترح ميزة",
    fields: [
      { name: "title", label: "العنوان" },
      { name: "desc", label: "التفاصيل", type: "textarea" }
    ],
    confirmLabel: "إرسال",
    onConfirm: () => {
      setSuccess("تم الإرسال. 💡");
      closeModal();
    }
  });
  const handleReport = (defaultType = "bug") => openEdit({
    title: "الإبلاغ عن مشكلة",
    fields: [
      { name: "type", label: "النوع", type: "select", defaultValue: defaultType, options: [
        { value: "bug", label: "🐞 خطأ تقني" },
        { value: "ui", label: "🎨 واجهة" },
        { value: "perf", label: "⚡ بطء" },
        { value: "crash", label: "💥 توقف" },
        { value: "other", label: "أخرى" }
      ] },
      { name: "desc", label: "الوصف", type: "textarea" }
    ],
    confirmLabel: "إبلاغ",
    onConfirm: () => {
      setSuccess("تم الاستلام. 🙏");
      closeModal();
    }
  });
  const handleContactSupport = () => openEdit({
    title: "الدعم الفني",
    description: "متوسط الرد: أقل من ساعتين.",
    fields: [
      { name: "topic", label: "الموضوع" },
      { name: "msg", label: "التفاصيل", type: "textarea" }
    ],
    confirmLabel: "إرسال",
    onConfirm: () => {
      setSuccess("تم الإرسال.");
      closeModal();
    }
  });
  const showFAQ = () => openInfo({
    title: "الأسئلة الشائعة",
    content: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "grid", gap: 8 }, children: [
      { q: "كيف أغيّر كلمة المرور؟", a: 'من "الحساب" ← "تغيير كلمة المرور".' },
      { q: "كيف أفعّل 2FA؟", a: 'من "المصادقة الثنائية".' },
      { q: "كيف أوقف الإشعارات؟", a: 'من "الإشعارات".' },
      { q: "كيف أحذف حسابي؟", a: '"الحساب" ← "حذف نهائي".' },
      { q: "هل بياناتي مشفّرة؟", a: "نعم، جميع الرسائل E2E." }
    ].map((item, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: 8, background: "rgba(15,23,42,0.5)", borderRadius: 8 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { style: { display: "block", marginBottom: 4, fontSize: 12.5 }, children: item.q }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "muted", style: { fontSize: 11.5 }, children: item.a })
    ] }, i)) })
  });
  const showTutorials = () => openInfo({
    title: "دروس البدء",
    content: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "grid", gap: 6 }, children: ["🎬 رفع أول ريل", "📖 نشر ستوري", "💬 محادثة جماعية", "🎙️ غرفة صوتية", "⚔️ معارك التفاعل", "💰 شحن المحفظة"].map((t, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: 8, background: "rgba(15,23,42,0.5)", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: 12.5 }, children: t }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "settings-btn-mini", onClick: () => {
        closeModal();
        navigate("/support");
      }, children: "عرض" })
    ] }, i)) })
  });
  const showWhatsNew = () => openInfo({
    title: "ما الجديد",
    content: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "grid", gap: 8 }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: 10, background: "rgba(99,102,241,0.12)", borderRadius: 8, borderInlineStart: "3px solid #6366f1" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { style: { fontSize: 12.5 }, children: "v76 — إعدادات مضغوطة" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { style: { margin: "4px 0 0", paddingInlineStart: 16, fontSize: 11.5, color: "rgba(226,232,240,0.8)" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "كل الأقسام في صفحة واحدة." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "أزرار مصغّرة وخط مدمج." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "لا تنقل بين الصفحات إلا اختيارياً." })
      ] })
    ] }) })
  });
  const showLegal = (kind) => {
    const contents = {
      cookies: { title: "الكوكيز", body: "نستخدم الكوكيز لحفظ الجلسة وتخصيص الواجهة وقياس الأداء." },
      dmca: { title: "DMCA", body: "لشكوى: copyright@yamshat.com يتضمن وصف العمل ورابط المحتوى." },
      community: { title: "إرشادات المجتمع", body: "يُمنع: التحرش، خطاب الكراهية، السبام، انتحال الهوية." }
    };
    const c = contents[kind];
    openInfo({ title: c.title, content: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: { margin: 0, lineHeight: 1.7, fontSize: 12.5 }, children: c.body }) });
  };
  const showAbout = (kind) => {
    const contents = { site: { title: "الموقع", body: "yamshat.com — الأخبار والتحديثات." } };
    const c = contents[kind];
    openInfo({ title: c.title, content: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: { margin: 0, fontSize: 12.5 }, children: c.body }) });
  };
  const handleTrustCurrentDevice = () => {
    openEdit({
      title: "توثيق هذا الجهاز",
      description: "توثيق الجهاز يقلل من طلبات المصادقة المتكررة ويمنحك تجربة أسرع. يمكنك ضبط مدة الثقة وخيارات الأمان.",
      fields: [
        { name: "label", label: "اسم مميز للجهاز (اختياري)", type: "text", defaultValue: "", placeholder: "مثال: iPhone الشخصي" },
        { name: "duration", label: "مدة الثقة", type: "select", defaultValue: "30", options: [
          { value: "7", label: "7 أيام" },
          { value: "30", label: "30 يوماً (موصى به)" },
          { value: "90", label: "90 يوماً" },
          { value: "permanent", label: "دائم — حتى إلغاء يدوي" }
        ] },
        { name: "requireBiometric", label: "طلب البصمة/الوجه للعمليات الحساسة", type: "select", defaultValue: "yes", options: [
          { value: "yes", label: "نعم — أمان أعلى" },
          { value: "no", label: "لا — لا يُطلب" }
        ] }
      ],
      confirmLabel: "توثيق",
      cancelLabel: "إلغاء",
      onConfirm: async (v) => {
        setBusy("trust-device");
        try {
          const opts = {
            label: v.label || void 0,
            duration_days: v.duration === "permanent" ? null : parseInt(v.duration, 10),
            require_biometric: v.requireBiometric === "yes"
          };
          await deviceTrustService.trustCurrentDevice(opts);
          setTrustedDevices(await deviceTrustService.getTrustedDevices());
          closeModal();
          setSuccess("تم توثيق الجهاز.");
        } catch {
          closeModal();
          setSuccess("تعذّر توثيق الجهاز.");
        } finally {
          setBusy("");
        }
      }
    });
  };
  const handleRemoveDevice = (deviceId) => {
    const device = (trustedDevices || []).find((d) => (d.id || d.device_id) === deviceId) || {};
    const deviceName = device.label || device.name || device.device_name || "جهاز موثوق";
    openEdit({
      title: `إزالة ${deviceName}`,
      description: "إزالة الجهاز من قائمة الأجهزة الموثوقة. عند تسجيل الدخول التالي على هذا الجهاز سيُطلب التحقق من جديد.",
      fields: [
        { name: "endSession", label: "إنهاء الجلسة النشطة على الجهاز", type: "select", defaultValue: "yes", options: [
          { value: "yes", label: "نعم — تسجيل الخروج فوراً من الجهاز" },
          { value: "no", label: "لا — إزالة الثقة فقط دون تسجيل الخروج" }
        ] },
        { name: "blockFuture", label: "حظر إعادة التوثيق التلقائي", type: "select", defaultValue: "no", options: [
          { value: "no", label: "لا — يمكن إعادة التوثيق لاحقاً" },
          { value: "yes", label: "نعم — منع أي توثيق مستقبلي لهذا الجهاز" }
        ] }
      ],
      confirmLabel: "إزالة",
      cancelLabel: "إلغاء",
      danger: true,
      onConfirm: async (v) => {
        setBusy(deviceId);
        try {
          await deviceTrustService.untrustDevice(deviceId, {
            end_session: v.endSession === "yes",
            block_future: v.blockFuture === "yes"
          });
          setTrustedDevices(await deviceTrustService.getTrustedDevices());
          if (v.endSession === "yes") {
            try {
              setSessions(await deviceTrustService.getSessions());
            } catch {
            }
          }
          closeModal();
          setSuccess("تمت إزالة الجهاز.");
        } catch {
          closeModal();
          setSuccess("تعذّرت الإزالة.");
        } finally {
          setBusy("");
        }
      }
    });
  };
  const handleRevokeSession = (sessionId) => {
    const session = (sessions || []).find((s) => s.id === sessionId) || {};
    const label = session.device_name || session.user_agent || session.platform || "جلسة";
    const location2 = session.location || session.ip || "";
    openEdit({
      title: "إنهاء الجلسة",
      description: `سيتم إنهاء الجلسة على: ${label}${location2 ? ` — ${location2}` : ""}. سيُطلب من الجهاز تسجيل الدخول من جديد.`,
      fields: [
        { name: "reason", label: "سبب الإنهاء (اختياري لسجل الأمان)", type: "select", defaultValue: "unused", options: [
          { value: "unused", label: "الجهاز لم يعد مستخدماً" },
          { value: "suspicious", label: "نشاط مشبوه على هذه الجلسة" },
          { value: "shared", label: "جهاز مشترك/عام" },
          { value: "other", label: "سبب آخر" }
        ] },
        { name: "untrust", label: "إزالة توثيق الجهاز أيضاً", type: "select", defaultValue: "no", options: [
          { value: "no", label: "لا — إنهاء الجلسة فقط" },
          { value: "yes", label: "نعم — إنهاء الجلسة + إزالة الثقة" }
        ] }
      ],
      confirmLabel: "إنهاء",
      cancelLabel: "إلغاء",
      danger: true,
      onConfirm: async (v) => {
        setBusy(sessionId);
        try {
          await deviceTrustService.revokeSession(sessionId, { reason: v.reason });
          if (v.untrust === "yes" && session.device_id) {
            try {
              await deviceTrustService.untrustDevice(session.device_id);
              setTrustedDevices(await deviceTrustService.getTrustedDevices());
            } catch {
            }
          }
          setSessions(await deviceTrustService.getSessions());
          closeModal();
          setSuccess("تم إنهاء الجلسة.");
        } catch {
          closeModal();
          setSuccess("تعذّر الإنهاء.");
        } finally {
          setBusy("");
        }
      }
    });
  };
  const handleEnablePush = () => {
    const currentPerm = pushState.permission || "default";
    openEdit({
      title: "تفعيل إشعارات Push",
      description: `الحالة الحالية: ${currentPerm}. يستخدم Web Push + Service Worker + Android FCM حسب توفّر المنصّة.`,
      fields: [
        { name: "scope", label: "نطاق الإشعارات", type: "select", defaultValue: "all", options: [
          { value: "all", label: "كل الأنواع (تفاعلات + رسائل + متابعات)" },
          { value: "social", label: "التفاعلات فقط (إعجاب/تعليق/إشارة)" },
          { value: "messages", label: "الرسائل فقط" },
          { value: "important", label: "المهمة فقط (أمان + خصوصية)" }
        ] },
        { name: "sound", label: "الصوت والاهتزاز", type: "select", defaultValue: "both", options: [
          { value: "both", label: "صوت + اهتزاز" },
          { value: "sound", label: "صوت فقط" },
          { value: "vibrate", label: "اهتزاز فقط" },
          { value: "silent", label: "صامت" }
        ] },
        { name: "quietHours", label: "ساعات الهدوء", type: "select", defaultValue: "off", options: [
          { value: "off", label: "إيقاف" },
          { value: "night", label: "ليلاً (10م — 7ص)" },
          { value: "work", label: "ساعات العمل (9ص — 5م)" },
          { value: "custom", label: "مخصّص (يُضبط لاحقاً)" }
        ] },
        { name: "preview", label: "إظهار المحتوى في الإشعار", type: "select", defaultValue: "yes", options: [
          { value: "yes", label: "نعم — عنوان + معاينة" },
          { value: "title", label: "العنوان فقط (لا معاينة)" },
          { value: "no", label: 'مخفي ("إشعار جديد" فقط)' }
        ] }
      ],
      confirmLabel: "تفعيل",
      cancelLabel: "إلغاء",
      onConfirm: async (v) => {
        setBusy("push");
        try {
          await notificationService.initialize();
          await notificationService.subscribeToPushNotifications({
            scope: v.scope,
            sound: v.sound,
            quietHours: v.quietHours,
            preview: v.preview
          }).catch(() => null);
          setPushState(notificationService.getPushReadiness());
          updatePref("pushScope", v.scope);
          updatePref("pushSound", v.sound);
          updatePref("pushQuietHours", v.quietHours);
          updatePref("pushPreview", v.preview);
          setSuccess("تم تفعيل الإشعارات.");
        } catch {
          setSuccess("تعذّر التفعيل — تأكّد من أذونات المتصفح.");
        } finally {
          setBusy("");
          closeModal();
        }
      }
    });
  };
  const handleSyncNow = () => {
    openEdit({
      title: "مزامنة الأجهزة الآن",
      description: `متصل: ${syncState.devices_online || trustedDevices.length || 1} جهاز. تستخدم BroadcastChannel + WebSocket + fallback عبر HTTP.`,
      fields: [
        { name: "targets", label: "ما الذي يُزامَن", type: "select", defaultValue: "all", options: [
          { value: "all", label: "كل شيء (ملف + إشعارات + صندوق)" },
          { value: "profile", label: "الملف الشخصي فقط" },
          { value: "notifications", label: "الإشعارات فقط" },
          { value: "inbox", label: "صندوق الرسائل فقط" }
        ] },
        { name: "direction", label: "اتجاه المزامنة", type: "select", defaultValue: "push_pull", options: [
          { value: "push_pull", label: "دفع + سحب (كامل)" },
          { value: "push", label: "دفع فقط (من هذا الجهاز إلى الآخرين)" },
          { value: "pull", label: "سحب فقط (من الآخرين إلى هذا الجهاز)" }
        ] },
        { name: "force", label: "المزامنة القسرية", type: "select", defaultValue: "no", options: [
          { value: "no", label: "لا — مزامنة تدريجية فقط" },
          { value: "yes", label: "نعم — إعادة بناء كاملة (أبطأ)" }
        ] },
        { name: "notify", label: "إشعار الأجهزة الأخرى", type: "select", defaultValue: "yes", options: [
          { value: "yes", label: "نعم — إشعار بأن مزامنة يدوية جرت" },
          { value: "no", label: "لا — مزامنة صامتة" }
        ] }
      ],
      confirmLabel: "مزامنة الآن",
      cancelLabel: "إلغاء",
      onConfirm: (v) => {
        const patch = { devices_online: Math.max(1, trustedDevices.length) };
        const bumpAll = v.targets === "all";
        if (bumpAll || v.targets === "profile") patch.profile_revision = Number(syncState.profile_revision || 1) + 1;
        if (bumpAll || v.targets === "notifications") patch.notifications_revision = Number(syncState.notifications_revision || 1) + 1;
        if (bumpAll || v.targets === "inbox") patch.inbox_revision = Number(syncState.inbox_revision || 1) + 1;
        patch.last_sync_direction = v.direction;
        patch.last_sync_force = v.force === "yes";
        patch.last_sync_notify = v.notify === "yes";
        patch.last_sync_at = Date.now();
        const next = deviceTrustService.updateSyncState(patch);
        setSyncState(next);
        const scopeLabel = v.targets === "all" ? "كل شيء" : v.targets;
        setSuccess(`تمت المزامنة (${scopeLabel}${v.force === "yes" ? " — قسرية" : ""}).`);
        closeModal();
      }
    });
  };
  const performLogout = reactExports.useCallback(async () => {
    try {
      await logoutUser();
    } catch {
    }
    clearStoredUser();
    setMenuOpen(false);
    navigate("/login", { replace: true });
  }, [navigate]);
  const handleLogout = reactExports.useCallback(() => {
    openEdit({
      title: "تسجيل الخروج",
      description: "سيتم إنهاء الجلسة على هذا الجهاز. يمكنك اختيار إنهاء الجلسات الأخرى أيضاً.",
      fields: [
        { name: "scope", label: "نطاق الخروج", type: "select", defaultValue: "this", options: [
          { value: "this", label: "هذا الجهاز فقط" },
          { value: "all", label: "كل الأجهزة (الجلسات الأخرى أيضاً)" }
        ] },
        { name: "clearLocal", label: "مسح البيانات المحلية", type: "select", defaultValue: "no", options: [
          { value: "no", label: "لا — احتفظ بالمسودات والتفضيلات" },
          { value: "yes", label: "نعم — مسح كل شيء (كاش، مسودات، تفضيلات)" }
        ] }
      ],
      confirmLabel: "خروج",
      cancelLabel: "إلغاء",
      danger: true,
      onConfirm: async (v) => {
        if (v.scope === "all") {
          try {
            await Promise.all(sessions.filter((s) => !s.current).map((s) => deviceTrustService.revokeSession(s.id).catch(() => null)));
          } catch {
          }
        }
        if (v.clearLocal === "yes") {
          try {
            Object.keys(localStorage).forEach((k) => localStorage.removeItem(k));
            if ("caches" in window) caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
          } catch {
          }
        }
        closeModal();
        await performLogout();
      }
    });
  }, [openEdit, closeModal, performLogout, sessions]);
  const updateActiveTab = (tabKey) => {
    setActiveTab(tabKey);
    const params = new URLSearchParams(location.search);
    params.set("tab", tabKey);
    navigate({ pathname: "/settings", search: `?${params.toString()}` }, { replace: true });
    if (typeof window !== "undefined" && window.innerWidth <= 900) {
      setMobileView("section");
      window.setTimeout(() => {
        try {
          window.scrollTo({ top: 0, behavior: "smooth" });
          const el = document.querySelector(".settings-main");
          if (el && typeof el.scrollIntoView === "function") {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        } catch {
        }
      }, 30);
    }
  };
  const backToMenu = () => {
    setMobileView("menu");
    try {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
    }
  };
  const handleDownloadData = (kind = "full") => {
    const labels = { full: "الأرشيف الكامل", activity: "سجل النشاط", media: "الوسائط" };
    const descs = {
      full: "أرشيف شامل: ملفك الشخصي، منشوراتك، رسائلك، متابعاتك، وسائطك.",
      activity: "سجل النشاط: تسجيلات الدخول، التفاعلات، البحث، المشاهدات.",
      media: "كل الوسائط التي رفعتها: صور، فيديوهات، ملفات صوتية."
    };
    openEdit({
      title: `طلب تنزيل: ${labels[kind]}`,
      description: `${descs[kind]}

سيتم تجهيز الأرشيف خلال 48 ساعة وإرساله لبريدك.`,
      fields: [
        { name: "format", label: "الصيغة", type: "select", defaultValue: "zip", options: [
          { value: "zip", label: "ZIP (مضغوط)" },
          { value: "json", label: "JSON (بيانات خام)" },
          { value: "csv", label: "CSV (جداول)" },
          { value: "html", label: "HTML (قابل للتصفح)" }
        ] },
        { name: "range", label: "الفترة الزمنية", type: "select", defaultValue: "all", options: [
          { value: "all", label: "كل البيانات" },
          { value: "30d", label: "آخر 30 يوم" },
          { value: "90d", label: "آخر 90 يوم" },
          { value: "1y", label: "آخر سنة" }
        ] },
        { name: "email", label: "إرسال إلى بريد (اختياري)", type: "email", defaultValue: prefs.email || "", placeholder: prefs.email || "name@example.com", hint: "اتركه فارغاً لاستخدام بريدك المسجّل." },
        { name: "includeDeleted", label: "تضمين العناصر المحذوفة", type: "select", defaultValue: "no", options: [
          { value: "no", label: "لا" },
          { value: "yes", label: "نعم (خلال 30 يوم)" }
        ] }
      ],
      confirmLabel: "إرسال الطلب",
      onConfirm: (v) => {
        const fmt = (v.format || "zip").toUpperCase();
        setSuccess(`تم تسجيل طلب ${labels[kind]} (${fmt}). سيصل الرابط لبريدك.`);
        closeModal();
      }
    });
  };
  const handleClearCache = () => {
    openEdit({
      title: "مسح الكاش",
      description: "يفرغ ذاكرة التطبيق المؤقتة. لن تُمسّ بيانات الحساب أو المسودات.",
      fields: [
        { name: "target", label: "ما الذي يُمسح", type: "select", defaultValue: "app", options: [
          { value: "app", label: "كاش التطبيق فقط (سريع وآمن)" },
          { value: "sw", label: "كاش التطبيق + Service Worker" },
          { value: "all", label: "كل شيء (تطبيق + Service Worker + IndexedDB مؤقت)" }
        ] },
        { name: "keepPrefs", label: "الاحتفاظ بالتفضيلات", type: "select", defaultValue: "yes", options: [
          { value: "yes", label: "نعم — احتفظ بالسمة واللغة وتفضيلات الواجهة" },
          { value: "no", label: "لا — امسح التفضيلات أيضاً" }
        ] },
        { name: "reload", label: "إعادة تحميل الصفحة بعد المسح", type: "select", defaultValue: "no", options: [
          { value: "no", label: "لا — تابع في الجلسة الحالية" },
          { value: "yes", label: "نعم — إعادة تحميل لتطبيق التغييرات" }
        ] }
      ],
      confirmLabel: "مسح",
      cancelLabel: "إلغاء",
      danger: true,
      onConfirm: async (v) => {
        try {
          const keepPrefs = v.keepPrefs !== "no";
          const target = v.target || "app";
          Object.keys(localStorage).forEach((k) => {
            const isCache = k.includes(":cache");
            const isPref = k.includes(":prefs") || k.includes(":theme") || k.includes(":locale") || k.includes(":ui");
            if (isCache) {
              localStorage.removeItem(k);
            } else if (!keepPrefs && isPref) {
              localStorage.removeItem(k);
            }
          });
          if ((target === "sw" || target === "all") && "caches" in window) {
            const keys = await caches.keys();
            await Promise.all(keys.map((k) => caches.delete(k)));
          }
          if (target === "sw" || target === "all") {
            try {
              if (navigator.serviceWorker) {
                const regs = await navigator.serviceWorker.getRegistrations();
                await Promise.all(regs.map((r) => r.update().catch(() => null)));
              }
            } catch {
            }
          }
          if (target === "all" && "indexedDB" in window && indexedDB.databases) {
            try {
              const dbs = await indexedDB.databases();
              await Promise.all((dbs || []).filter((d) => d && d.name && /cache|tmp|temp/i.test(d.name)).map((d) => new Promise((resolve) => {
                const req = indexedDB.deleteDatabase(d.name);
                req.onsuccess = req.onerror = req.onblocked = () => resolve();
              })));
            } catch {
            }
          }
          closeModal();
          setSuccess("تم مسح الكاش.");
          if (v.reload === "yes") {
            window.setTimeout(() => window.location.reload(), 400);
          }
        } catch {
          closeModal();
          setSuccess("تعذّر المسح.");
        }
      }
    });
  };
  const FullPageLink = ({ tabKey }) => {
    const link = FULL_PAGE_LINKS[tabKey];
    if (!link) return null;
    return /* @__PURE__ */ jsxRuntimeExports.jsx(MiniBtn, { onClick: () => navigate(link), children: "فتح الصفحة الكاملة ›" });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(MainLayout, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "settings-wrap", dir: "rtl", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "settings-hero", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { children: "الإعدادات" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "muted", children: "تحكم كامل في حسابك، خصوصيتك، أمانك، ومحتواك." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "settings-quick-menu-btn", "aria-label": "القائمة السريعة", onClick: () => setMenuOpen(true), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", {}),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", {}),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", {})
        ] })
      ] }),
      message ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "settings-banner", children: message }) : null,
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `settings-layout ${isMobile ? mobileView === "section" ? "mobile-showing-section" : "mobile-showing-menu" : ""}`, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("aside", { className: "settings-sidebar", children: TAB_GROUPS.map((group) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "settings-group", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "settings-group-label", children: group.label }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "settings-group-tabs", children: group.tabs.map((tab) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              className: `settings-tab-btn ${activeTab === tab.key ? "active" : ""}`,
              onClick: () => updateActiveTab(tab.key),
              title: tab.label,
              children: tab.label
            },
            tab.key
          )) })
        ] }, group.label)) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("main", { className: "settings-main", children: [
          isMobile && mobileView === "section" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              type: "button",
              className: "settings-mobile-back",
              onClick: backToMenu,
              "aria-label": "العودة لقائمة الإعدادات",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { "aria-hidden": true, children: "→" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "العودة للإعدادات" })
              ]
            }
          ) : null,
          activeTab === "account" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "s-card", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "s-h3", children: "معلومات الحساب" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "📧", title: "البريد الإلكتروني", description: prefs.email || "تغيير البريد المرتبط", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MiniBtn, { onClick: handleEditEmail, children: "تعديل" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "📱", title: "رقم الهاتف", description: prefs.phone || "رقم للتحقق والاسترداد", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MiniBtn, { onClick: handleEditPhone, children: "تعديل" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🔑", title: "كلمة المرور", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MiniBtn, { onClick: handleChangePassword, children: "تغيير" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🆔", title: "اسم المستخدم", description: prefs.username || "—", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MiniBtn, { onClick: handleEditUsername, children: "تعديل" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🎂", title: "تاريخ الميلاد", description: prefs.birthdate || "—", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MiniBtn, { onClick: handleEditBirthdate, children: "تعديل" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🌍", title: "الدولة", description: prefs.country || "—", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MiniBtn, { onClick: handleEditCountry, children: "تعديل" }) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "s-card", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "s-h3", children: "إدارة الحساب" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "⏸️", title: "إيقاف مؤقت", description: "إخفاء دون حذف", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MiniBtn, { danger: true, onClick: handleSuspendAccount, children: "إيقاف" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "❌", title: "حذف نهائي", description: "حذف دائم لجميع البيانات", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MiniBtn, { danger: true, onClick: handleDeleteAccount, children: "حذف" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🔄", title: "تحويل لحساب أعمال", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MiniBtn, { onClick: handleConvertBusiness, children: "تحويل" }) })
            ] })
          ] }) : null,
          activeTab === "profile" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "s-card", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "s-card-header", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "s-h3", children: "الملف الشخصي" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(FullPageLink, { tabKey: "profile" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🔒", title: "حساب خاص", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.privateAccount, onChange: (v) => updatePref("privateAccount", v) }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🟢", title: "إظهار حالة الاتصال", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.showOnlineStatus, onChange: (v) => updatePref("showOnlineStatus", v) }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "@", title: "من يمكنه الإشارة إليك", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "settings-select", value: prefs.allowMentions, onChange: (e) => updatePref("allowMentions", e.target.value), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "everyone", children: "الجميع" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "followers", children: "المتابعون" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "nobody", children: "لا أحد" })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "✉️", title: "من يمكنه مراسلتك", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "settings-select", value: prefs.allowDMs, onChange: (e) => updatePref("allowDMs", e.target.value), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "everyone", children: "الجميع" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "followers", children: "المتابعون" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "nobody", children: "لا أحد" })
            ] }) })
          ] }) : null,
          activeTab === "privacy" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "s-card", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "s-h3", children: "الخصوصية" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🔒", title: "حساب خاص", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.privateAccount, onChange: (v) => updatePref("privateAccount", v) }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "⏱️", title: "إخفاء آخر ظهور", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.hideLastSeen, onChange: (v) => updatePref("hideLastSeen", v) }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "✓✓", title: "إخفاء إيصالات القراءة", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.hideReadReceipts, onChange: (v) => updatePref("hideReadReceipts", v) }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🕵️", title: "التصفح الخفي", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.incognitoMode, onChange: (v) => updatePref("incognitoMode", v) }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "👤", title: "تصفح دون تسجيل مشاهدة", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.anonymousBrowsing, onChange: (v) => updatePref("anonymousBrowsing", v) }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "📍", title: "مشاركة الموقع", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.locationSharing, onChange: (v) => updatePref("locationSharing", v) }) })
          ] }) : null,
          activeTab === "security" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "s-card", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "s-h3", children: "مكافحة السبام والبوتات" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "stats-grid", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "metric-card", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Rate limit" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: antiSpam.remainingRequests })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "metric-card", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Bot score" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("strong", { children: [
                    antiSpam.bot.score,
                    "/100"
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "metric-card", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Verdict" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: antiSpam.bot.verdict })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "metric-card", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Shadow ban" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: antiSpam.shadowBanned ? "ON" : "OFF" })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginTop: 10, display: "grid", gap: 8 }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(RateLimitUI, { remaining: antiSpam.remainingRequests, resetTime: antiSpam.resetInMs }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(CooldownUI, { remaining: antiSpam.bot.score >= 35 ? 9e3 : 0, action: "إعادة المحاولة" })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "s-card", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "s-h3", children: "تنبيهات تسجيل الدخول" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "grid", gap: 8 }, children: [
                alerts.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "muted", style: { padding: 12, textAlign: "center", fontSize: 12 }, children: "لا تنبيهات." }) : null,
                alerts.map((alert) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "list-row", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: alert.title }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "muted", children: alert.description })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "score-pill", children: alert.severity })
                ] }, alert.id))
              ] })
            ] })
          ] }) : null,
          activeTab === "two-factor" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "s-card", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "s-h3", children: "المصادقة الثنائية" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "muted s-p", children: "طبقة حماية إضافية. اختر طريقة واحدة على الأقل." }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "📱", title: "تطبيق مصادقة", description: "Google Authenticator, Authy", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MiniBtn, { onClick: handle2FAApp, children: "إعداد" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "📧", title: "عبر البريد", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.twoFAEmail, onChange: (v) => {
              updatePref("twoFAEmail", v);
            } }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "📩", title: "عبر SMS", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.twoFASms, onChange: (v) => {
              updatePref("twoFASms", v);
            } }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🗝️", title: "مفتاح أمان", description: "YubiKey", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MiniBtn, { onClick: handleAddHardwareKey, children: "إضافة" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🆘", title: "رموز الاسترداد", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MiniBtn, { onClick: handleRecoveryCodes, children: "عرض" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "👆", title: "البصمة / Face ID", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.biometric, onChange: (v) => updatePref("biometric", v) }) })
          ] }) : null,
          activeTab === "devices" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "s-card", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "s-card-header", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "s-h3", children: "الأجهزة الموثوقة" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "muted s-p", children: "إدارة الأجهزة المسجل دخولها." })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(MiniBtn, { variant: "primary", onClick: handleTrustCurrentDevice, loading: busy === "trust-device", children: "توثيق الحالي" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "grid", gap: 6, marginTop: 8 }, children: [
              trustedDevices.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "muted", style: { padding: 12, textAlign: "center", fontSize: 12 }, children: "لا أجهزة." }) : null,
              trustedDevices.map((device) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "list-row", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: device.label || device.device_label || "Device" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "muted", children: [
                    "آخر ظهور: ",
                    new Date(device.lastSeenAt || device.last_active_at || Date.now()).toLocaleString("ar-EG")
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 4, alignItems: "center", flexWrap: "wrap" }, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "score-pill", children: device.current ? "حالي" : "موثوق" }),
                  !device.current ? /* @__PURE__ */ jsxRuntimeExports.jsx(MiniBtn, { onClick: () => handleRemoveDevice(device.id || device.device_id), loading: busy === (device.id || device.device_id), children: "إزالة" }) : null
                ] })
              ] }, device.id || device.device_id))
            ] })
          ] }) : null,
          activeTab === "sessions" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "s-card", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "s-h3", children: "الجلسات النشطة" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "grid", gap: 6 }, children: [
              sessions.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "muted", style: { padding: 12, textAlign: "center", fontSize: 12 }, children: "لا جلسات." }) : null,
              sessions.map((session) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "list-row", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: session.device_label || session.label || "Session" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "muted", children: [
                    "آخر نشاط: ",
                    new Date(session.last_active_at || Date.now()).toLocaleString("ar-EG")
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 4, alignItems: "center", flexWrap: "wrap" }, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "score-pill", children: session.sync_state || "صحية" }),
                  !session.current ? /* @__PURE__ */ jsxRuntimeExports.jsx(MiniBtn, { onClick: () => handleRevokeSession(session.id), loading: busy === session.id, children: "إنهاء" }) : null
                ] })
              ] }, session.id))
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { marginTop: 10 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(MiniBtn, { danger: true, onClick: handleRevokeAllSessions, loading: busy === "revoke-all", children: "إنهاء الكل عدا الحالية" }) })
          ] }) : null,
          activeTab === "connected-apps" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "s-card", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "s-h3", children: "التطبيقات المرتبطة (OAuth)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "G", title: "Google", description: prefs.googleLinked ? "مرتبط" : "غير مرتبط", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MiniBtn, { danger: prefs.googleLinked, onClick: () => handleOAuth("google"), children: prefs.googleLinked ? "إلغاء" : "ربط" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🍎", title: "Apple", description: prefs.appleLinked ? "مرتبط" : "غير مرتبط", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MiniBtn, { danger: prefs.appleLinked, onClick: () => handleOAuth("apple"), children: prefs.appleLinked ? "إلغاء" : "ربط" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "📘", title: "Facebook", description: prefs.facebookLinked ? "مرتبط" : "غير مرتبط", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MiniBtn, { danger: prefs.facebookLinked, onClick: () => handleOAuth("facebook"), children: prefs.facebookLinked ? "إلغاء" : "ربط" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "X", title: "X (Twitter)", description: prefs.twitterLinked ? "مرتبط" : "غير مرتبط", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MiniBtn, { danger: prefs.twitterLinked, onClick: () => handleOAuth("twitter"), children: prefs.twitterLinked ? "إلغاء" : "ربط" }) })
          ] }) : null,
          activeTab === "blocked" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "s-card", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "s-h3", children: "المحظورون" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "muted s-p", children: "لا يمكن للمحظورين رؤيتك أو التواصل معك." }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "muted", style: { padding: 16, textAlign: "center", fontSize: 12 }, children: "لا حسابات محظورة." })
          ] }) : null,
          activeTab === "muted" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "s-card", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "s-h3", children: "المكتومون" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "muted s-p", children: "لن ترى منشورات أو ستوريز هذه الحسابات." }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "muted", style: { padding: 16, textAlign: "center", fontSize: 12 }, children: "لا حسابات مكتومة." })
          ] }) : null,
          activeTab === "feed" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "s-card", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "s-card-header", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "s-h3", children: "الخلاصة (Feed)" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(FullPageLink, { tabKey: "feed" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🧠", title: "خوارزمية الخلاصة", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "settings-select", value: prefs.feedAlgo, onChange: (e) => updatePref("feedAlgo", e.target.value), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "smart", children: "ذكية" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "chronological", children: "زمنية" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "following", children: "المتابعون فقط" })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "▶️", title: "تشغيل الفيديو تلقائياً", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.autoplayVideos, onChange: (v) => updatePref("autoplayVideos", v) }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "⚠️", title: "إظهار المحتوى الحساس", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.showSensitive, onChange: (v) => updatePref("showSensitive", v) }) })
          ] }) : null,
          activeTab === "reels" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "s-card", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "s-card-header", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "s-h3", children: "الريلز" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(FullPageLink, { tabKey: "reels" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "▶️", title: "التشغيل التلقائي", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.reelsAutoplay, onChange: (v) => updatePref("reelsAutoplay", v) }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "💾", title: "توفير البيانات", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.reelsSaveData, onChange: (v) => updatePref("reelsSaveData", v) }) })
          ] }) : null,
          activeTab === "stories" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "s-card", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "s-card-header", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "s-h3", children: "الستوريز" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(FullPageLink, { tabKey: "stories" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "💬", title: "من يمكنه الرد", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "settings-select", value: prefs.storiesReplies, onChange: (e) => updatePref("storiesReplies", e.target.value), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "everyone", children: "الجميع" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "followers", children: "المتابعون" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "nobody", children: "لا أحد" })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "↗️", title: "السماح بمشاركة الستوري", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.storiesShareable, onChange: (v) => updatePref("storiesShareable", v) }) })
          ] }) : null,
          activeTab === "inbox" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "s-card", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "s-card-header", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "s-h3", children: "الرسائل" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(FullPageLink, { tabKey: "inbox" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🔍", title: "فلترة طلبات الرسائل", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "settings-select", value: prefs.inboxRequestFilter, onChange: (e) => updatePref("inboxRequestFilter", e.target.value), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "all", children: "الكل" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "known", children: "المعروفون" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "followers", children: "المتابعون فقط" })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "✓✓", title: "إيصالات القراءة", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.readReceipts, onChange: (v) => updatePref("readReceipts", v) }) })
          ] }) : null,
          activeTab === "voice" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "s-card", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "s-card-header", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "s-h3", children: "الغرف الصوتية" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(FullPageLink, { tabKey: "voice" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🎙️", title: "الانضمام التلقائي", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.voiceAutoJoin, onChange: (v) => updatePref("voiceAutoJoin", v) }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🔇", title: "إلغاء الضوضاء", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.voiceNoiseSuppress, onChange: (v) => updatePref("voiceNoiseSuppress", v) }) })
          ] }) : null,
          activeTab === "engagement" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "s-card", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "s-card-header", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "s-h3", children: "التفاعل والمعارك" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(FullPageLink, { tabKey: "engagement" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "⚔️", title: "إشعارات المعارك", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.battleNotifs, onChange: (v) => updatePref("battleNotifs", v) }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🔥", title: "تذكير السلاسل اليومية", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.streakReminders, onChange: (v) => updatePref("streakReminders", v) }) })
          ] }) : null,
          activeTab === "wallet" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "s-card", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "s-card-header", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "s-h3", children: "المحفظة" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(FullPageLink, { tabKey: "wallet" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🔐", title: "حماية بـ PIN", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.walletPin, onChange: (v) => updatePref("walletPin", v) }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "⚡", title: "تأكيد تلقائي للمبالغ الصغيرة", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.walletAutoConfirm, onChange: (v) => updatePref("walletAutoConfirm", v) }) })
          ] }) : null,
          activeTab === "appearance" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "s-card", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "s-h3", children: "المظهر والثيم" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🌓", title: "ثيم التطبيق", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "settings-select", value: prefs.theme, onChange: (e) => updatePref("theme", e.target.value), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "dark", children: "داكن" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "light", children: "فاتح" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "auto", children: "تلقائي" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "amoled", children: "AMOLED" })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🎨", title: "اللون المميز", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "settings-select", value: prefs.accentColor, onChange: (e) => updatePref("accentColor", e.target.value), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "purple", children: "بنفسجي" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "blue", children: "أزرق" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "green", children: "أخضر" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "orange", children: "برتقالي" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "pink", children: "وردي" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "red", children: "أحمر" })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🔤", title: "حجم الخط", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "settings-select", value: prefs.fontSize, onChange: (e) => {
              updatePref("fontSize", e.target.value);
              applyFontSize(e.target.value);
            }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "small", children: "صغير" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "medium", children: "متوسط" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "large", children: "كبير" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "xl", children: "كبير جدًا" })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "📐", title: "كثافة العرض", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "settings-select", value: prefs.density, onChange: (e) => updatePref("density", e.target.value), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "compact", children: "مدمج" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "normal", children: "عادي" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "comfortable", children: "مريح" })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🔘", title: "الزوايا الدائرية", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.roundedCorners, onChange: (v) => updatePref("roundedCorners", v) }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "✨", title: "الحركات والانتقالات", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.animations, onChange: (v) => updatePref("animations", v) }) })
          ] }) : null,
          activeTab === "language" ? /* @__PURE__ */ jsxRuntimeExports.jsx(LanguageSettings, {}) : null,
          activeTab === "font-size" ? /* @__PURE__ */ jsxRuntimeExports.jsx(FontSizeSettings, { value: prefs.fontSize, onChange: (v) => {
            updatePref("fontSize", v);
            applyFontSize(v);
          } }) : null,
          activeTab === "translation" ? /* @__PURE__ */ jsxRuntimeExports.jsx(TranslationSettings, {}) : null,
          activeTab === "accessibility" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "s-card", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "s-h3", children: "سهولة الوصول" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🎙️", title: "قارئ الشاشة", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.screenReader, onChange: (v) => updatePref("screenReader", v) }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🔲", title: "أزرار كبيرة", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.largeButtons, onChange: (v) => updatePref("largeButtons", v) }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "📝", title: "ترجمة دائماً", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.captionsAlways, onChange: (v) => updatePref("captionsAlways", v) }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🎬", title: "تقليل الحركة", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.reducedMotion, onChange: (v) => updatePref("reducedMotion", v) }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🌓", title: "تباين عالي", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.highContrast, onChange: (v) => updatePref("highContrast", v) }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🪟", title: "تقليل الشفافية", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.reduceTransparency, onChange: (v) => updatePref("reduceTransparency", v) }) })
          ] }) : null,
          activeTab === "notifications" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "s-card", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "s-card-header", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "s-h3", children: "إشعارات Push" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "muted s-p", children: "Android + PWA + service worker." })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(MiniBtn, { variant: "primary", onClick: handleEnablePush, loading: busy === "push", children: "تفعيل" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "stats-grid", style: { marginTop: 10 }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "metric-card", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Permission" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: pushState.permission })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "metric-card", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Android" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: pushState.androidReady ? "جاهز" : "لا" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "metric-card", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "PWA" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: pushState.pwaReady ? "ثابت" : "متصفح" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "metric-card", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Background" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: pushState.supportsBackground ? "On" : "Off" })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "s-card", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🔔", title: "إعدادات تفصيلية", description: "تحكم كامل بأنواع الإشعارات", children: /* @__PURE__ */ jsxRuntimeExports.jsx(FullPageLink, { tabKey: "notifications" }) }) })
          ] }) : null,
          activeTab === "sounds" ? /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "s-card", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SoundSettingsPanel, {}) }) : null,
          activeTab === "data-storage" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "s-card", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "s-h3", children: "البيانات والتخزين" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "💾", title: "توفير البيانات", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.saveDataMode, onChange: (v) => updatePref("saveDataMode", v) }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "📦", title: "حد التخزين", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "settings-select", value: prefs.storageLimit, onChange: (e) => updatePref("storageLimit", e.target.value), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "500MB", children: "500 MB" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "1GB", children: "1 GB" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "2GB", children: "2 GB" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "5GB", children: "5 GB" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "10GB", children: "10 GB" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "unlimited", children: "بلا حد" })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "☁️", title: "نسخ احتياطي تلقائي", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.autoBackup, onChange: (v) => updatePref("autoBackup", v) }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "📶", title: "على WiFi فقط", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.backupOnWifi, onChange: (v) => updatePref("backupOnWifi", v) }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🧹", title: "مسح الكاش", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MiniBtn, { onClick: handleClearCache, children: "مسح" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "📥", title: "مسح الوسائط المنزّلة", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MiniBtn, { danger: true, onClick: handleClearMedia, children: "مسح" }) })
          ] }) : null,
          activeTab === "media" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "s-card", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "s-h3", children: "حماية الوسائط" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "stats-grid", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "metric-card", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Signed URLs" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: MEDIA_SECURITY.signedUrls ? "On" : "Off" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "metric-card", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Expiring" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: MEDIA_SECURITY.expiringLinks ? `${SIGNED_URL_TTL_SECONDS}s` : "Off" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "metric-card", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Encrypted" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: MEDIA_SECURITY.encryptedUploads ? "On" : "Off" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "metric-card", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Provider" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: currentMediaProviderLabel() })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "s-card", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "s-h3", children: "تسريع CDN" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "muted s-p", children: "الوسائط تُسرَّع عبر CDN عالمي." }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "grid", gap: 6 }, children: [imageDelivery, videoDelivery, fileDelivery].map((profile) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "list-row", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: profile.strategy }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "muted", children: profile.preferredCdn })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "score-pill", children: [
                  "TTL ",
                  profile.ttl
                ] })
              ] }, profile.strategy)) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "muted", style: { marginTop: 8, fontSize: 11 }, children: [
                "المناطق: ",
                cdnConfig.regions.join(" • ")
              ] })
            ] })
          ] }) : null,
          activeTab === "sync" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "s-card", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "s-card-header", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "s-h3", children: "مزامنة الأجهزة" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "muted s-p", children: "BroadcastChannel + fallback." })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(MiniBtn, { variant: "primary", onClick: handleSyncNow, children: "مزامنة الآن" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "stats-grid", style: { marginTop: 10 }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "metric-card", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Devices" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: syncState.devices_online || trustedDevices.length || 1 })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "metric-card", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Profile" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: syncState.profile_revision || 1 })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "metric-card", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Notifs" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: syncState.notifications_revision || 1 })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "metric-card", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Inbox" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: syncState.inbox_revision || 1 })
              ] })
            ] })
          ] }) : null,
          activeTab === "performance" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "s-card", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "s-h3", children: "الأداء" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "⚡", title: "توفير الطاقة", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.lowPowerMode, onChange: (v) => updatePref("lowPowerMode", v) }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🚀", title: "التحميل المسبق", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.prefetchEnabled, onChange: (v) => updatePref("prefetchEnabled", v) }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🎮", title: "تسريع الأجهزة", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.hardwareAcceleration, onChange: (v) => updatePref("hardwareAcceleration", v) }) })
          ] }) : null,
          activeTab === "download-data" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "s-card", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "s-h3", children: "تنزيل بياناتي (GDPR)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "muted s-p", children: "سيتم تجهيز الأرشيف خلال 48 ساعة وإرسال رابط لبريدك." }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "📥", title: "بياناتي الكاملة", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MiniBtn, { variant: "primary", onClick: () => handleDownloadData("full"), children: "طلب" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "📊", title: "سجل النشاط", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MiniBtn, { onClick: () => handleDownloadData("activity"), children: "طلب" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🎬", title: "وسائطي", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MiniBtn, { onClick: () => handleDownloadData("media"), children: "طلب" }) })
          ] }) : null,
          activeTab === "help" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "s-card", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "s-h3", children: "المساعدة والدعم" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "❓", title: "مركز المساعدة", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MiniBtn, { onClick: () => navigate("/support"), children: "فتح" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "💬", title: "تواصل مع الدعم", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MiniBtn, { onClick: handleContactSupport, children: "تواصل" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "📚", title: "الأسئلة الشائعة", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MiniBtn, { onClick: showFAQ, children: "عرض" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🚨", title: "الإبلاغ عن مشكلة", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MiniBtn, { onClick: () => handleReport("bug"), children: "إبلاغ" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🎓", title: "دروس البدء", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MiniBtn, { onClick: showTutorials, children: "عرض" }) })
          ] }) : null,
          activeTab === "feedback" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "s-card", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "s-h3", children: "إرسال ملاحظات" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "muted s-p", children: "رأيك يهمنا." }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "⭐", title: "قيّم التطبيق", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MiniBtn, { onClick: handleRate, children: "تقييم" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "💡", title: "اقترح ميزة", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MiniBtn, { onClick: handleSuggest, children: "اقتراح" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🐞", title: "بلّغ عن خطأ", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MiniBtn, { onClick: () => handleReport("bug"), children: "إبلاغ" }) })
          ] }) : null,
          activeTab === "about" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "s-card", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "s-h3", children: "عن يمشات" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "📦", title: "الإصدار", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "muted s-p", style: { fontSize: 11.5 }, children: `v${"78.0.0"}` }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🏗️", title: "رقم البناء", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "muted", style: { fontSize: 11.5 }, children: "2026.07.13" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🆕", title: "ما الجديد", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MiniBtn, { onClick: showWhatsNew, children: "عرض" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🌐", title: "الموقع الرسمي", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MiniBtn, { onClick: () => showAbout("site"), children: "زيارة" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "📱", title: "تابعنا", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "muted", style: { fontSize: 11.5 }, children: "@yamshat" }) })
          ] }) : null,
          activeTab === "legal" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "s-card", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "s-h3", children: "الشروط والسياسات" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "📜", title: "شروط الاستخدام", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MiniBtn, { onClick: () => navigate("/terms"), children: "عرض" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🔐", title: "سياسة الخصوصية", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MiniBtn, { onClick: () => navigate("/privacy"), children: "عرض" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🍪", title: "سياسة Cookies", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MiniBtn, { onClick: () => showLegal("cookies"), children: "عرض" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "©️", title: "DMCA", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MiniBtn, { onClick: () => showLegal("dmca"), children: "عرض" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "⚖️", title: "إرشادات المجتمع", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MiniBtn, { onClick: () => showLegal("community"), children: "عرض" }) })
          ] }) : null,
          /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "s-card", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🚪", title: "تسجيل الخروج", description: "إنهاء الجلسة على هذا الجهاز", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MiniBtn, { danger: true, onClick: handleLogout, children: "خروج" }) }) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(YamServicesMenu, { open: menuOpen, onClose: () => setMenuOpen(false), onLogout: performLogout, brandLabel: "Yamshat" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      SettingsModal,
      {
        open: modal?.type === "edit",
        title: modal?.title,
        description: modal?.description,
        fields: modal?.fields,
        confirmLabel: modal?.confirmLabel,
        cancelLabel: modal?.cancelLabel,
        danger: modal?.danger,
        onConfirm: modal?.onConfirm,
        onClose: closeModal
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      InfoModal,
      {
        open: modal?.type === "info",
        title: modal?.title,
        content: modal?.content,
        onClose: closeModal
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
        .settings-wrap {
          max-width: 1180px;
          margin: 0 auto;
          padding: 12px 14px 40px;
          font-size: 13px;
        }
        .settings-hero {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 12px;
        }
        .settings-hero h1 { margin: 0 0 3px; font-size: 20px; }
        .settings-hero p { margin: 0; font-size: 12px; }
        .settings-quick-menu-btn {
          width: 38px; height: 38px; padding: 0; flex-shrink: 0;
          border-radius: 10px; border: 1px solid rgba(167,139,250,0.25);
          background: rgba(15,23,42,0.78);
          display: inline-flex; flex-direction: column;
          align-items: center; justify-content: center;
          gap: 3px; cursor: pointer;
        }
        .settings-quick-menu-btn span {
          display: block; width: 16px; height: 2px;
          border-radius: 999px; background: #e2e8f0;
        }
        .settings-banner {
          padding: 8px 10px; border-radius: 10px;
          background: rgba(34,197,94,0.14); color: #86efac;
          border: 1px solid rgba(34,197,94,0.24);
          margin-bottom: 10px; font-size: 12px;
        }
        .settings-layout {
          display: grid;
          grid-template-columns: 200px 1fr;
          gap: 12px;
          align-items: start;
        }
        .settings-sidebar {
          display: grid; gap: 8px;
          position: sticky; top: 70px;
          max-height: calc(100vh - 90px);
          overflow-y: auto;
          padding-inline-end: 4px;
        }
        /* ✅ v85.8: عرض التبويبات داخل كل مجموعة على 3 أعمدة لتقليل الارتفاع
           بدل عمود واحد يشغل مساحة كبيرة. الخط أصغر و padding مضغوط. */
        .settings-group {
          display: block;
          padding: 6px 6px 7px;
          background: rgba(15,23,42,0.4);
          border-radius: 10px;
          border: 1px solid rgba(148,163,184,0.10);
        }
        .settings-group-label {
          font-size: 9.5px; font-weight: 700;
          text-transform: uppercase;
          color: rgba(226,232,240,0.55);
          padding: 2px 4px 4px;
          letter-spacing: 0.35px;
        }
        .settings-group-tabs {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 3px;
        }
        .settings-tab-btn {
          display: flex; align-items: center; gap: 3px;
          padding: 5px 5px;
          border-radius: 6px; border: none;
          background: transparent; color: #e2e8f0;
          font-size: 10.5px; cursor: pointer;
          text-align: start; width: 100%;
          transition: all 0.12s;
          line-height: 1.2;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          min-width: 0;
        }
        .settings-tab-btn:hover { background: rgba(99,102,241,0.12); }
        .settings-tab-btn.active {
          background: rgba(99,102,241,0.22);
          color: #c4b5fd; font-weight: 600;
        }

        .settings-main { display: grid; gap: 10px; min-width: 0; }

        /* Cards مضغوطة */
        .s-card {
          padding: 12px 14px !important;
        }
        .s-h3 {
          margin: 0 0 8px;
          font-size: 14.5px;
          font-weight: 700;
        }
        .s-p { font-size: 11.5px !important; margin: 0 0 8px !important; }
        .s-card-header {
          display: flex; align-items: center;
          justify-content: space-between; gap: 8px;
          margin-bottom: 4px;
        }
        .s-card-header h3 { margin: 0; }

        /* Rows مضغوطة */
        .settings-row {
          display: flex; align-items: center;
          justify-content: space-between; gap: 8px;
          padding: 7px 0 !important;
          border-bottom: 1px solid rgba(148,163,184,0.08);
        }
        .settings-row:last-child { border-bottom: none; }
        .settings-row-info { flex: 1; min-width: 0; }
        .settings-row-info strong {
          display: block; margin-bottom: 1px;
          font-size: 12.5px !important; font-weight: 600;
        }
        .settings-row-info .muted { font-size: 11px !important; line-height: 1.35; }

        /* Toggle مصغّر */
        .settings-toggle {
          position: relative; width: 36px; height: 20px;
          border-radius: 999px; background: rgba(100,116,139,0.35);
          cursor: pointer; transition: background 0.2s; border: none;
          flex-shrink: 0;
        }
        .settings-toggle::after {
          content: ''; position: absolute;
          top: 2px; right: 2px;
          width: 16px; height: 16px;
          background: #fff; border-radius: 50%;
          transition: all 0.2s;
        }
        .settings-toggle[data-on='true'] { background: #6366f1; }
        .settings-toggle[data-on='true']::after { right: 18px; }

        /* Selects / Inputs مصغّرة */
        .settings-select, .settings-input {
          padding: 4px 8px;
          border-radius: 7px;
          background: rgba(15,23,42,0.6);
          border: 1px solid rgba(148,163,184,0.18);
          color: #e2e8f0;
          font-size: 12px !important;
          min-width: 110px;
          min-height: 26px;
          font-family: inherit;
        }
        textarea.settings-input { resize: vertical; min-height: 60px; width: 100%; padding: 6px 8px; }

        /* =========================
           الأزرار المصغّرة الأساسية
           ========================= */
        .settings-btn-mini {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          padding: 3px 10px;
          min-height: 24px;
          height: 24px;
          border-radius: 6px;
          border: 1px solid rgba(148,163,184,0.25);
          background: rgba(15,23,42,0.65);
          color: #e2e8f0;
          font-size: 11.5px;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.12s;
          line-height: 1;
        }
        .settings-btn-mini:hover:not(:disabled) {
          background: rgba(99,102,241,0.18);
          border-color: rgba(167,139,250,0.4);
        }
        .settings-btn-mini:disabled {
          opacity: 0.55; cursor: not-allowed;
        }
        .settings-btn-mini--primary {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border-color: rgba(139,92,246,0.6);
          color: #fff;
        }
        .settings-btn-mini--primary:hover:not(:disabled) {
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
        }
        .settings-btn-mini--danger {
          color: #fca5a5;
          border-color: rgba(239,68,68,0.35);
          background: rgba(239,68,68,0.08);
        }
        .settings-btn-mini--danger:hover:not(:disabled) {
          background: rgba(239,68,68,0.18);
        }
        .settings-btn-mini.is-busy { opacity: 0.6; pointer-events: none; }

        /* Grid statistics مضغوطة */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 6px;
        }
        .metric-card {
          padding: 8px 10px;
          border-radius: 10px;
          background: rgba(15,23,42,0.45);
          border: 1px solid rgba(148,163,184,0.12);
          display: grid; gap: 2px;
        }
        .metric-card span { color: rgba(226,232,240,0.72); font-size: 11px; }
        .metric-card strong { font-size: 13.5px; }

        /* Lists مضغوطة */
        .list-row {
          border: 1px solid rgba(148,163,184,0.12);
          background: rgba(15,23,42,0.38);
          border-radius: 10px;
          padding: 8px 10px;
          display: flex; justify-content: space-between;
          gap: 8px; align-items: center;
          font-size: 12px;
        }
        .list-row strong { font-size: 12.5px; display: block; margin-bottom: 1px; }
        .list-row .muted { font-size: 11px; }
        .score-pill {
          display: inline-flex; align-items: center;
          justify-content: center; min-width: 52px;
          padding: 3px 7px; border-radius: 999px;
          background: rgba(59,130,246,0.14);
          color: #93c5fd;
          border: 1px solid rgba(147,197,253,0.26);
          font-size: 10.5px;
        }

        /* Modals */
        .settings-modal-backdrop {
          position: fixed; inset: 0;
          background: rgba(2, 6, 23, 0.72);
          backdrop-filter: blur(6px);
          z-index: 9999;
          display: flex; align-items: center; justify-content: center;
          padding: 12px;
          animation: settings-modal-fade 0.15s ease-out;
        }
        .settings-modal {
          background: linear-gradient(180deg, rgba(15,23,42,0.98), rgba(15,23,42,0.95));
          border: 1px solid rgba(167,139,250,0.25);
          border-radius: 14px;
          padding: 16px;
          max-width: 460px; width: 100%;
          max-height: 88vh; overflow-y: auto;
          box-shadow: 0 22px 60px rgba(0,0,0,0.5);
          animation: settings-modal-pop 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .settings-modal-header {
          display: flex; justify-content: space-between;
          align-items: center; gap: 8px;
          margin-bottom: 6px;
        }
        .settings-modal-header h3 { margin: 0; font-size: 15px; }
        .settings-modal-close {
          width: 26px; height: 26px;
          border-radius: 7px; border: 1px solid rgba(148,163,184,0.2);
          background: rgba(15,23,42,0.6);
          color: #e2e8f0; cursor: pointer;
          display: inline-flex; align-items: center; justify-content: center;
          font-size: 13px; flex-shrink: 0;
        }
        .settings-modal-close:hover { background: rgba(239,68,68,0.18); }
        .settings-modal-content { font-size: 12.5px; line-height: 1.55; color: rgba(226,232,240,0.9); }

        @keyframes settings-modal-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes settings-modal-pop {
          from { opacity: 0; transform: scale(0.94) translateY(6px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        /* v87.7 — زر الرجوع على الموبايل */
        .settings-mobile-back {
          display: none;
          align-items: center;
          gap: 8px;
          padding: 9px 12px;
          margin: 0 0 10px;
          border-radius: 10px;
          border: 1px solid rgba(167,139,250,0.30);
          background: rgba(99,102,241,0.14);
          color: #c4b5fd;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          width: 100%;
          text-align: start;
          transition: background 0.15s;
        }
        .settings-mobile-back:hover { background: rgba(99,102,241,0.22); }
        .settings-mobile-back span:first-child {
          font-size: 16px;
          line-height: 1;
        }

        /* Responsive */
        @media (max-width: 900px) {
          .settings-layout { grid-template-columns: 1fr; }
          .settings-sidebar {
            position: static; max-height: none;
            display: grid; gap: 8px;
          }
          /* v87.7 — Drill-down على الموبايل: إظهار إما القائمة أو القسم */
          .settings-layout.mobile-showing-menu .settings-main { display: none; }
          .settings-layout.mobile-showing-section .settings-sidebar { display: none; }
          .settings-layout.mobile-showing-section .settings-mobile-back { display: inline-flex; }
        }
        /* ✅ v85.8: على الموبايل — 3 أعمدة داخل كل مجموعة (كما طلب المستخدم) */
        @media (max-width: 600px) {
          .settings-wrap { padding: 10px 10px 30px; }
          .s-card { padding: 10px 12px !important; }
          .settings-row { flex-wrap: wrap; gap: 6px; }
          .settings-group-tabs {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
          .settings-tab-btn {
            font-size: 10px;
            padding: 5px 4px;
          }
        }
        @media (max-width: 380px) {
          .settings-tab-btn { font-size: 9.5px; }
        }

        /* Overrides قوية لتصغير أي أزرار قديمة داخل الإعدادات */
        .settings-main .btn,
        .settings-main button.btn,
        .settings-main .btn-small,
        .settings-main .btn-medium {
          min-height: 24px !important;
          height: 24px !important;
          padding: 3px 10px !important;
          font-size: 11.5px !important;
          border-radius: 6px !important;
        }
        .settings-main .btn-large {
          min-height: 28px !important;
          height: 28px !important;
          padding: 4px 12px !important;
          font-size: 12px !important;
        }
      ` })
  ] });
}
export {
  Settings as default
};

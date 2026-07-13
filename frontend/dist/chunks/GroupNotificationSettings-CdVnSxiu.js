import { bB as useParams, bG as useToast, b0 as reactExports, ar as jsxRuntimeExports, h as MainLayout } from "../index-D5NOBPt4.js";
import { G as GroupSubHeader } from "./GroupSubHeader-DPp3FYn6.js";
import { s as getGroupNotificationSettings, p as getGroupDetails, L as updateGroupNotificationSettings } from "./groups-CWhM7-Cw.js";
/* empty css                         */
const MODES = [
  { id: "all", icon: "🔔", label: "كل الرسائل", hint: "إشعار لكل رسالة جديدة" },
  { id: "mentions", icon: "@", label: "الإشارات فقط", hint: "فقط عند الإشارة إليك" },
  { id: "highlights", icon: "⭐", label: "المهمّ فقط", hint: "الإعلانات والأحداث الكبرى" },
  { id: "none", icon: "🔕", label: "صامت", hint: "لا إشعارات نهائياً" }
];
const MUTE_PRESETS = [
  { value: 0, label: "إلغاء الكتم" },
  { value: 60 * 60, label: "ساعة" },
  { value: 8 * 3600, label: "8 ساعات" },
  { value: 24 * 3600, label: "يوم" },
  { value: 7 * 86400, label: "أسبوع" },
  { value: -1, label: "دائماً" }
];
const SOUNDS = [
  { id: "default", label: "الافتراضي" },
  { id: "ping", label: "Ping" },
  { id: "chime", label: "Chime" },
  { id: "pop", label: "Pop" },
  { id: "none", label: "بدون صوت" }
];
const GroupNotificationSettings = () => {
  const { groupId } = useParams();
  const { pushToast } = useToast();
  const [loading, setLoading] = reactExports.useState(true);
  const [saving, setSaving] = reactExports.useState(false);
  const [group, setGroup] = reactExports.useState(null);
  const [settings, setSettings] = reactExports.useState({
    mode: "all",
    mute_until: null,
    mute_mentions: false,
    sound: "default",
    vibrate: true,
    preview: true,
    notify_new_post: true,
    notify_new_event: true,
    notify_new_poll: false,
    notify_join_requests: true,
    notify_announcements: true,
    notify_calls: true
  });
  reactExports.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const [s, det] = await Promise.allSettled([
          getGroupNotificationSettings(groupId),
          getGroupDetails(groupId)
        ]);
        if (cancelled) return;
        if (s.status === "fulfilled" && s.value?.data) {
          setSettings((prev) => ({ ...prev, ...s.value.data }));
        }
        if (det.status === "fulfilled") setGroup(det.value?.data || null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [groupId]);
  const update = (patch) => setSettings((s) => ({ ...s, ...patch }));
  const save = async () => {
    setSaving(true);
    try {
      await updateGroupNotificationSettings(groupId, settings);
      pushToast?.({ type: "success", title: "تم الحفظ", description: "حُفظت إعدادات الإشعارات." });
    } catch (e) {
      pushToast?.({ type: "error", title: "تعذر الحفظ", description: e?.message });
    } finally {
      setSaving(false);
    }
  };
  const applyMute = (seconds) => {
    if (seconds === 0) {
      update({ mute_until: null });
    } else if (seconds === -1) {
      update({ mute_until: "forever" });
    } else {
      const ts = new Date(Date.now() + seconds * 1e3).toISOString();
      update({ mute_until: ts });
    }
  };
  const isMuted = settings.mute_until === "forever" || settings.mute_until && new Date(settings.mute_until).getTime() > Date.now();
  const muteLabel = settings.mute_until === "forever" ? "مكتومة دائماً" : isMuted ? `حتى ${new Date(settings.mute_until).toLocaleString("ar-EG")}` : "";
  return /* @__PURE__ */ jsxRuntimeExports.jsx(MainLayout, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yamg-page", dir: "rtl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      GroupSubHeader,
      {
        title: `إشعارات ${group?.name || "المجموعة"}`,
        subtitle: "تحكم في الإشعارات الخاصة بهذه المجموعة فقط",
        action: /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "yamg-btn", onClick: save, disabled: saving || loading, children: saving ? "...حفظ" : "💾 حفظ" })
      }
    ),
    loading ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yamg-loading", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yamg-spinner" }),
      "جاري التحميل..."
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yamg-card", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { style: { margin: "0 0 12px", fontSize: 15 }, children: "وضع الإشعارات" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yamg-noti-modes", children: MODES.map((m) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: `mode ${settings.mode === m.id ? "active" : ""}`,
            onClick: () => update({ mode: m.id }),
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: 16, marginBottom: 2 }, children: [
                m.icon,
                " ",
                m.label
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: 11, opacity: 0.8 }, children: m.hint })
            ]
          },
          m.id
        )) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yamg-card", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { style: { margin: "0 0 4px", fontSize: 15 }, children: "كتم مؤقت" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: 12, color: "var(--yamg-muted)", marginBottom: 12 }, children: isMuted ? `🔇 ${muteLabel}` : "الإشعارات نشطة حالياً" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yamg-noti-modes", children: MUTE_PRESETS.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: "mode",
            onClick: () => applyMute(p.value),
            children: p.label
          },
          p.value
        )) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yamg-card", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { style: { margin: "0 0 4px", fontSize: 15 }, children: "ما الذي يُنبّهك؟" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: 12, color: "var(--yamg-muted)", marginBottom: 12 }, children: "تحكّم دقيق بنوع الإشعارات المُرسلة إليك" }),
        [
          { k: "notify_new_post", label: "منشورات جديدة", hint: "إشعار عند نشر عضو منشوراً" },
          { k: "notify_new_event", label: "الأحداث", hint: "إنشاء حدث جديد أو تذكير" },
          { k: "notify_new_poll", label: "الاستطلاعات", hint: "استطلاع جديد للمشاركة" },
          { k: "notify_join_requests", label: "طلبات الانضمام", hint: "للمشرفين فقط" },
          { k: "notify_announcements", label: "الإعلانات الإدارية", hint: "دائماً ما يُوصى بتفعيلها" },
          { k: "notify_calls", label: "المكالمات الجماعية", hint: "صوت أو فيديو" }
        ].map((row) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yamg-noti-row", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yamg-noti-label", children: row.label }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yamg-noti-hint", children: row.hint })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "yamg-switch", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "checkbox",
                checked: !!settings[row.k],
                onChange: (e) => update({ [row.k]: e.target.checked })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "slider" })
          ] })
        ] }, row.k))
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yamg-card", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { style: { margin: "0 0 12px", fontSize: 15 }, children: "الصوت والاهتزاز" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yamg-noti-row", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yamg-noti-label", children: "نغمة الإشعار" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yamg-noti-hint", children: "صوت يُسمع عند وصول رسالة" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "select",
            {
              className: "yamg-select",
              style: { maxWidth: 180 },
              value: settings.sound,
              onChange: (e) => update({ sound: e.target.value }),
              children: SOUNDS.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: s.id, children: s.label }, s.id))
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yamg-noti-row", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yamg-noti-label", children: "الاهتزاز" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yamg-noti-hint", children: "اهتزاز عند وصول إشعار (الجوال فقط)" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "yamg-switch", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "checkbox",
                checked: !!settings.vibrate,
                onChange: (e) => update({ vibrate: e.target.checked })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "slider" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yamg-noti-row", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yamg-noti-label", children: "معاينة محتوى الرسالة" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yamg-noti-hint", children: "إظهار نص الرسالة في الإشعار" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "yamg-switch", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "checkbox",
                checked: !!settings.preview,
                onChange: (e) => update({ preview: e.target.checked })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "slider" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yamg-noti-row", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yamg-noti-label", children: "كتم الإشارات أيضاً" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yamg-noti-hint", children: "عند الكتم، لا تستثني الإشارات إليك" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "yamg-switch", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "checkbox",
                checked: !!settings.mute_mentions,
                onChange: (e) => update({ mute_mentions: e.target.checked })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "slider" })
          ] })
        ] })
      ] })
    ] })
  ] }) });
};
export {
  GroupNotificationSettings as default
};

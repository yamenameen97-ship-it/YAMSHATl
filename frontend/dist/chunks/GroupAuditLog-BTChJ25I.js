import { bB as useParams, bz as useNavigate, a7 as getCurrentUsername, b0 as reactExports, ar as jsxRuntimeExports, h as MainLayout } from "../index-D5NOBPt4.js";
import { G as GroupSubHeader } from "./GroupSubHeader-DPp3FYn6.js";
import { o as getGroupAuditLog, p as getGroupDetails } from "./groups-CWhM7-Cw.js";
/* empty css                         */
const ACTION_META = {
  member_join: { icon: "➕", label: "انضمام عضو", color: "success" },
  member_leave: { icon: "➖", label: "مغادرة عضو", color: "muted" },
  member_kick: { icon: "🚪", label: "طرد عضو", color: "danger" },
  member_ban: { icon: "⛔", label: "حظر عضو", color: "danger" },
  member_unban: { icon: "✅", label: "رفع حظر", color: "success" },
  member_mute: { icon: "🔇", label: "كتم عضو", color: "warning" },
  member_unmute: { icon: "🔊", label: "إلغاء كتم", color: "success" },
  role_change: { icon: "👑", label: "تغيير الصلاحية", color: "warning" },
  ownership_transfer: { icon: "🔑", label: "نقل الملكية", color: "warning" },
  settings_update: { icon: "⚙️", label: "تحديث الإعدادات", color: "muted" },
  group_create: { icon: "✨", label: "إنشاء المجموعة", color: "success" },
  group_update: { icon: "✏️", label: "تحديث المجموعة", color: "muted" },
  message_pin: { icon: "📌", label: "تثبيت رسالة", color: "warning" },
  message_unpin: { icon: "📍", label: "إلغاء تثبيت", color: "muted" },
  message_delete: { icon: "🗑️", label: "حذف رسالة", color: "danger" },
  message_report: { icon: "🚩", label: "بلاغ على رسالة", color: "danger" },
  post_create: { icon: "📝", label: "منشور جديد", color: "success" },
  post_delete: { icon: "🗑️", label: "حذف منشور", color: "danger" },
  post_pin: { icon: "📌", label: "تثبيت منشور", color: "warning" },
  event_create: { icon: "📅", label: "حدث جديد", color: "success" },
  poll_create: { icon: "📊", label: "استطلاع جديد", color: "success" },
  announcement: { icon: "📢", label: "إعلان", color: "warning" },
  invitation_send: { icon: "✉️", label: "إرسال دعوة", color: "muted" },
  join_request: { icon: "📩", label: "طلب انضمام", color: "muted" },
  rule_create: { icon: "📜", label: "إضافة قاعدة", color: "muted" }
};
const GroupAuditLog = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const currentUser = getCurrentUsername();
  const [log, setLog] = reactExports.useState([]);
  const [group, setGroup] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(true);
  const [filter, setFilter] = reactExports.useState("all");
  const [denied, setDenied] = reactExports.useState(false);
  reactExports.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const [logRes, det] = await Promise.allSettled([
          getGroupAuditLog(groupId, { limit: 200 }),
          getGroupDetails(groupId)
        ]);
        if (cancelled) return;
        if (det.status === "fulfilled") {
          const g = det.value?.data || null;
          setGroup(g);
          const m = g?.members?.find((x) => (x.username || x.user_id) === currentUser);
          const role = m?.role || "member";
          if (role !== "owner" && role !== "admin") {
            setDenied(true);
          }
        }
        if (logRes.status === "fulfilled") {
          const list = Array.isArray(logRes.value?.data) ? logRes.value.data : logRes.value?.data?.items || logRes.value?.data?.entries || [];
          setLog(list);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [groupId, currentUser]);
  const categories = reactExports.useMemo(() => {
    const set = new Set(log.map((e) => e.action || e.type || "unknown"));
    return ["all", ...Array.from(set)];
  }, [log]);
  const filtered = reactExports.useMemo(() => {
    if (filter === "all") return log;
    return log.filter((e) => (e.action || e.type) === filter);
  }, [log, filter]);
  if (denied) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(MainLayout, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yamg-page", dir: "rtl", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(GroupSubHeader, { title: "سجل التدقيق", subtitle: "غير مصرّح" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yamg-empty", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ic", children: "🔒" }),
        "هذا السجل مخصّص للملّاك والمشرفين فقط.",
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { marginTop: 12 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "yamg-btn secondary", onClick: () => navigate(`/groups/${groupId}/chat`), children: "العودة للدردشة" }) })
      ] })
    ] }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(MainLayout, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yamg-page", dir: "rtl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      GroupSubHeader,
      {
        title: `سجل التدقيق — ${group?.name || ""}`,
        subtitle: `${log.length} حدث مسجّل`
      }
    ),
    categories.length > 2 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yamg-trending-bar", children: categories.map((c) => {
      const meta = ACTION_META[c];
      return /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          className: `yamg-trending-pill ${filter === c ? "active" : ""}`,
          onClick: () => setFilter(c),
          children: c === "all" ? `الكل (${log.length})` : `${meta?.icon || "•"} ${meta?.label || c}`
        },
        c
      );
    }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yamg-card", children: loading ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yamg-loading", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yamg-spinner" }),
      "جاري التحميل..."
    ] }) : filtered.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yamg-empty", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ic", children: "📜" }),
      "لا توجد أحداث في هذا الفلتر."
    ] }) : filtered.map((e, i) => {
      const key = e.action || e.type || "unknown";
      const meta = ACTION_META[key] || { icon: "•", label: key, color: "muted" };
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yamg-audit-row", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yamg-audit-icon", children: meta.icon }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yamg-audit-desc", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: e.actor_name || e.actor || "النظام" }),
            " ",
            e.description || meta.label,
            e.target_name && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              " · ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("em", { style: { color: "#cbd5e1" }, children: e.target_name })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yamg-audit-meta", children: [
            e.created_at ? new Date(e.created_at).toLocaleString("ar-EG") : "",
            e.ip && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              " · IP: ",
              e.ip
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `yamg-tag ${meta.color === "muted" ? "" : meta.color}`, children: meta.label })
      ] }, e.id || i);
    }) })
  ] }) });
};
export {
  GroupAuditLog as default
};

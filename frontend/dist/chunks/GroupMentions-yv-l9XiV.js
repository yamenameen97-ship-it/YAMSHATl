import { bx as useParams, bv as useNavigate, a_ as reactExports, aq as jsxRuntimeExports, h as MainLayout } from "../index-2I4hYPnI.js";
import { G as GroupSubHeader } from "./GroupSubHeader-CtZ2haqi.js";
import { z as listGroupMentions, p as getGroupDetails, C as markMentionRead } from "./groups-DqmtpX-5.js";
/* empty css                         */
const GroupMentions = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [mentions, setMentions] = reactExports.useState([]);
  const [group, setGroup] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(true);
  const [filter, setFilter] = reactExports.useState("all");
  reactExports.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const [m, det] = await Promise.allSettled([
          listGroupMentions(groupId, { limit: 100 }),
          getGroupDetails(groupId)
        ]);
        if (cancelled) return;
        if (m.status === "fulfilled") {
          const list = Array.isArray(m.value?.data) ? m.value.data : m.value?.data?.mentions || [];
          setMentions(list);
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
  const handleOpen = async (m) => {
    if (!m.read) {
      setMentions((p) => p.map((x) => x.id === m.id ? { ...x, read: true } : x));
      try {
        await markMentionRead(groupId, m.id);
      } catch {
      }
    }
    if (m.message_id) {
      navigate(`/groups/${groupId}/chat?msg=${encodeURIComponent(m.message_id)}`);
    } else {
      navigate(`/groups/${groupId}/chat`);
    }
  };
  const markAll = async () => {
    const unread = mentions.filter((m) => !m.read);
    setMentions((p) => p.map((x) => ({ ...x, read: true })));
    for (const m of unread) {
      try {
        await markMentionRead(groupId, m.id);
      } catch {
      }
    }
  };
  const filtered = filter === "unread" ? mentions.filter((m) => !m.read) : mentions;
  const unreadCount = mentions.filter((m) => !m.read).length;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(MainLayout, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yamg-page", dir: "rtl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      GroupSubHeader,
      {
        title: `الإشارات في ${group?.name || "المجموعة"}`,
        subtitle: `${unreadCount} غير مقروءة من ${mentions.length}`,
        action: unreadCount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "yamg-btn secondary", onClick: markAll, children: "تعليم الكل كمقروء" })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yamg-media-tabs", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `tab ${filter === "all" ? "active" : ""}`, onClick: () => setFilter("all"), children: [
        "الكل (",
        mentions.length,
        ")"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `tab ${filter === "unread" ? "active" : ""}`, onClick: () => setFilter("unread"), children: [
        "غير مقروء (",
        unreadCount,
        ")"
      ] })
    ] }),
    loading ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yamg-loading", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yamg-spinner" }),
      "جاري التحميل..."
    ] }) : filtered.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yamg-empty", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ic", children: "@" }),
      filter === "unread" ? "لا توجد إشارات جديدة." : "لم يُشر إليك في هذه المجموعة بعد."
    ] }) : filtered.map((m) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        type: "button",
        className: `yamg-mention ${m.read ? "" : "unread"}`,
        onClick: () => handleOpen(m),
        style: { textAlign: "right", width: "100%" },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "img",
            {
              src: m.from_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.from || "u"}`,
              alt: "",
              style: { width: 40, height: 40, borderRadius: "50%" }
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "who", children: [
              "@",
              m.from || m.from_user || "مستخدم"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "txt", children: m.text || m.message_preview || m.content || "ذكرك في رسالة" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "meta", children: [
              m.created_at ? new Date(m.created_at).toLocaleString("ar-EG") : "",
              !m.read && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yamg-tag", style: { marginInlineStart: 8 }, children: "جديد" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { alignSelf: "center", color: "var(--yamg-muted)" }, children: "←" })
        ]
      },
      m.id
    ))
  ] }) });
};
export {
  GroupMentions as default
};

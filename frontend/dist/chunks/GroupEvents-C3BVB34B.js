import { bx as useParams, bC as useToast, a7 as getCurrentUsername, a_ as reactExports, aq as jsxRuntimeExports, h as MainLayout } from "../index-2I4hYPnI.js";
import { G as GroupSubHeader } from "./GroupSubHeader-CtZ2haqi.js";
import { x as listGroupEvents, p as getGroupDetails, b as createGroupEvent } from "./groups-DqmtpX-5.js";
/* empty css                         */
const AR_MONTHS = ["ينا", "فبر", "مار", "أبر", "ماي", "يون", "يول", "أغس", "سبت", "أكت", "نوف", "ديس"];
const fmtDate = (iso) => {
  if (!iso) return { d: "—", m: "" };
  try {
    const d = new Date(iso);
    return { d: d.getDate(), m: AR_MONTHS[d.getMonth()] };
  } catch {
    return { d: "—", m: "" };
  }
};
const fmtTime = (iso) => {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("ar-EG", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return "";
  }
};
const GroupEvents = () => {
  const { groupId } = useParams();
  const { pushToast } = useToast();
  const currentUser = getCurrentUsername();
  const [events, setEvents] = reactExports.useState([]);
  const [group, setGroup] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(true);
  const [showForm, setShowForm] = reactExports.useState(false);
  const [creating, setCreating] = reactExports.useState(false);
  const [form, setForm] = reactExports.useState({
    title: "",
    description: "",
    location: "",
    starts_at: "",
    ends_at: ""
  });
  const role = reactExports.useMemo(() => {
    const m = group?.members?.find((x) => (x.username || x.user_id) === currentUser);
    return m?.role || "member";
  }, [group, currentUser]);
  const canCreate = role !== "member" || group?.settings?.members_can_create_events;
  reactExports.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const [evs, det] = await Promise.allSettled([
          listGroupEvents(groupId),
          getGroupDetails(groupId)
        ]);
        if (cancelled) return;
        if (evs.status === "fulfilled") {
          const list = Array.isArray(evs.value?.data) ? evs.value.data : evs.value?.data?.events || [];
          const sorted = [...list].sort((a, b) => new Date(a.starts_at || 0) - new Date(b.starts_at || 0));
          setEvents(sorted);
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
  const submit = async () => {
    if (!form.title.trim() || !form.starts_at) {
      pushToast?.({ type: "error", title: "بيانات ناقصة", description: "العنوان وتاريخ البداية مطلوبان" });
      return;
    }
    setCreating(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        location: form.location.trim(),
        starts_at: new Date(form.starts_at).toISOString(),
        ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null
      };
      const res = await createGroupEvent(groupId, payload);
      const ev = res?.data?.event || res?.data || { ...payload, id: `tmp-${Date.now()}` };
      setEvents((p) => [...p, ev].sort((a, b) => new Date(a.starts_at || 0) - new Date(b.starts_at || 0)));
      setForm({ title: "", description: "", location: "", starts_at: "", ends_at: "" });
      setShowForm(false);
      pushToast?.({ type: "success", title: "تم إنشاء الحدث" });
    } catch (e) {
      pushToast?.({ type: "error", title: "تعذر إنشاء الحدث", description: e?.message });
    } finally {
      setCreating(false);
    }
  };
  const now = Date.now();
  const upcoming = events.filter((e) => new Date(e.starts_at || 0).getTime() >= now);
  const past = events.filter((e) => new Date(e.starts_at || 0).getTime() < now);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(MainLayout, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yamg-page", dir: "rtl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      GroupSubHeader,
      {
        title: `أحداث ${group?.name || "المجموعة"}`,
        subtitle: `${upcoming.length} قادم · ${past.length} منتهٍ`,
        action: canCreate && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "yamg-btn", onClick: () => setShowForm((v) => !v), children: showForm ? "✕ إغلاق" : "+ حدث جديد" })
      }
    ),
    showForm && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yamg-card", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yamg-col", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          className: "yamg-input",
          placeholder: "عنوان الحدث",
          value: form.title,
          onChange: (e) => setForm({ ...form, title: e.target.value })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "textarea",
        {
          className: "yamg-textarea",
          placeholder: "وصف الحدث",
          value: form.description,
          onChange: (e) => setForm({ ...form, description: e.target.value })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          className: "yamg-input",
          placeholder: "الموقع (اختياري)",
          value: form.location,
          onChange: (e) => setForm({ ...form, location: e.target.value })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yamg-row", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { style: { flex: 1 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: 12, color: "var(--yamg-muted)", marginBottom: 4 }, children: "يبدأ" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "datetime-local",
              className: "yamg-input",
              value: form.starts_at,
              onChange: (e) => setForm({ ...form, starts_at: e.target.value })
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { style: { flex: 1 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: 12, color: "var(--yamg-muted)", marginBottom: 4 }, children: "ينتهي" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "datetime-local",
              className: "yamg-input",
              value: form.ends_at,
              onChange: (e) => setForm({ ...form, ends_at: e.target.value })
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yamg-row", style: { justifyContent: "flex-end" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "yamg-btn secondary", onClick: () => setShowForm(false), children: "إلغاء" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "yamg-btn", onClick: submit, disabled: creating, children: creating ? "...إنشاء" : "إنشاء الحدث" })
      ] })
    ] }) }),
    loading ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yamg-loading", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yamg-spinner" }),
      "جاري التحميل..."
    ] }) : events.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yamg-empty", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ic", children: "📅" }),
      "لا توجد أحداث بعد."
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      upcoming.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { style: { fontSize: 14, color: "var(--yamg-muted)", margin: "12px 4px" }, children: "القادمة" }),
        upcoming.map((ev) => {
          const d = fmtDate(ev.starts_at);
          return /* @__PURE__ */ jsxRuntimeExports.jsx("article", { className: "yamg-card", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yamg-event-row", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yamg-event-date", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "d", children: d.d }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "m", children: d.m })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { style: { margin: 0, fontSize: 15 }, children: ev.title }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yamg-event-meta", children: [
                "🕒 ",
                fmtTime(ev.starts_at)
              ] }),
              ev.location && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yamg-event-meta", children: [
                "📍 ",
                ev.location
              ] }),
              ev.description && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: { marginTop: 8, fontSize: 13 }, children: ev.description }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yamg-row", style: { marginTop: 8 }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yamg-tag success", children: "قادم" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "yamg-tag", children: [
                  ev.rsvp_count || 0,
                  " مهتم"
                ] })
              ] })
            ] })
          ] }) }, ev.id);
        })
      ] }),
      past.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { style: { fontSize: 14, color: "var(--yamg-muted)", margin: "20px 4px 12px" }, children: "المنتهية" }),
        past.map((ev) => {
          const d = fmtDate(ev.starts_at);
          return /* @__PURE__ */ jsxRuntimeExports.jsx("article", { className: "yamg-card", style: { opacity: 0.7 }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yamg-event-row", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yamg-event-date", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "d", children: d.d }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "m", children: d.m })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1 }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { style: { margin: 0, fontSize: 15 }, children: ev.title }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yamg-event-meta", children: [
                "🕒 ",
                fmtTime(ev.starts_at)
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yamg-tag", children: "منتهٍ" })
            ] })
          ] }) }, ev.id);
        })
      ] })
    ] })
  ] }) });
};
export {
  GroupEvents as default
};

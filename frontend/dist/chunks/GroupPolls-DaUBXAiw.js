import { bB as useParams, bG as useToast, a7 as getCurrentUsername, b0 as reactExports, ar as jsxRuntimeExports, h as MainLayout } from "../index-D5NOBPt4.js";
import { G as GroupSubHeader } from "./GroupSubHeader-DPp3FYn6.js";
import { A as listGroupPolls, p as getGroupDetails, d as createGroupPoll, Q as voteInPoll } from "./groups-CWhM7-Cw.js";
/* empty css                         */
const computePct = (poll) => {
  const total = (poll.options || []).reduce((s, o) => s + (o.votes || 0), 0);
  return { total, pct: (opt) => total ? Math.round((opt.votes || 0) * 100 / total) : 0 };
};
const GroupPolls = () => {
  const { groupId } = useParams();
  const { pushToast } = useToast();
  const currentUser = getCurrentUsername();
  const [polls, setPolls] = reactExports.useState([]);
  const [group, setGroup] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(true);
  const [showForm, setShowForm] = reactExports.useState(false);
  const [creating, setCreating] = reactExports.useState(false);
  const [form, setForm] = reactExports.useState({
    question: "",
    options: ["", ""],
    multi: false,
    closes_at: ""
  });
  const role = reactExports.useMemo(() => {
    const m = group?.members?.find((x) => (x.username || x.user_id) === currentUser);
    return m?.role || "member";
  }, [group, currentUser]);
  const canCreate = role !== "member" || group?.settings?.members_can_create_polls;
  const refresh = async () => {
    try {
      setLoading(true);
      const [pl, det] = await Promise.allSettled([
        listGroupPolls(groupId),
        getGroupDetails(groupId)
      ]);
      if (pl.status === "fulfilled") {
        const list = Array.isArray(pl.value?.data) ? pl.value.data : pl.value?.data?.polls || [];
        setPolls(list);
      }
      if (det.status === "fulfilled") setGroup(det.value?.data || null);
    } finally {
      setLoading(false);
    }
  };
  reactExports.useEffect(() => {
    refresh();
  }, [groupId]);
  const submit = async () => {
    const q = form.question.trim();
    const opts = form.options.map((o) => o.trim()).filter(Boolean);
    if (!q || opts.length < 2) {
      pushToast?.({ type: "error", title: "بيانات ناقصة", description: "السؤال وخياران على الأقل مطلوبان" });
      return;
    }
    setCreating(true);
    try {
      await createGroupPoll(groupId, {
        question: q,
        options: opts,
        multi_choice: form.multi,
        closes_at: form.closes_at ? new Date(form.closes_at).toISOString() : null
      });
      setForm({ question: "", options: ["", ""], multi: false, closes_at: "" });
      setShowForm(false);
      await refresh();
      pushToast?.({ type: "success", title: "تم إنشاء الاستطلاع" });
    } catch (e) {
      pushToast?.({ type: "error", title: "تعذر الإنشاء", description: e?.message });
    } finally {
      setCreating(false);
    }
  };
  const handleVote = async (poll, optIndex) => {
    if (poll._voting) return;
    setPolls((p) => p.map((x) => x.id === poll.id ? { ...x, _voting: true } : x));
    try {
      await voteInPoll(groupId, poll.id, String(optIndex));
      setPolls((p) => p.map((x) => {
        if (x.id !== poll.id) return x;
        const options = (x.options || []).map((o, i) => {
          if (i !== optIndex) return o;
          return { ...o, votes: (o.votes || 0) + 1, _voted: true };
        });
        return { ...x, options, _voted_index: optIndex, _voting: false };
      }));
      pushToast?.({ type: "success", title: "تم تصويتك" });
    } catch (e) {
      setPolls((p) => p.map((x) => x.id === poll.id ? { ...x, _voting: false } : x));
      pushToast?.({ type: "error", title: "تعذر التصويت" });
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(MainLayout, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yamg-page", dir: "rtl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      GroupSubHeader,
      {
        title: `استطلاعات ${group?.name || "المجموعة"}`,
        subtitle: `${polls.length} استطلاع`,
        action: canCreate && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "yamg-btn", onClick: () => setShowForm((v) => !v), children: showForm ? "✕ إغلاق" : "+ استطلاع" })
      }
    ),
    showForm && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yamg-card", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yamg-col", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          className: "yamg-input",
          placeholder: "سؤال الاستطلاع",
          value: form.question,
          onChange: (e) => setForm({ ...form, question: e.target.value })
        }
      ),
      form.options.map((opt, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yamg-row", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            className: "yamg-input",
            placeholder: `الخيار ${i + 1}`,
            value: opt,
            onChange: (e) => {
              const next = [...form.options];
              next[i] = e.target.value;
              setForm({ ...form, options: next });
            }
          }
        ),
        form.options.length > 2 && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            className: "yamg-btn secondary",
            onClick: () => setForm({ ...form, options: form.options.filter((_, idx) => idx !== i) }),
            children: "✕"
          }
        )
      ] }, i)),
      form.options.length < 8 && /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          className: "yamg-btn secondary",
          onClick: () => setForm({ ...form, options: [...form.options, ""] }),
          children: "+ إضافة خيار"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "yamg-row", style: { cursor: "pointer" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "checkbox",
            checked: form.multi,
            onChange: (e) => setForm({ ...form, multi: e.target.checked })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "السماح بتعدد الاختيار" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: 12, color: "var(--yamg-muted)", marginBottom: 4 }, children: "تاريخ الإغلاق (اختياري)" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "datetime-local",
            className: "yamg-input",
            value: form.closes_at,
            onChange: (e) => setForm({ ...form, closes_at: e.target.value })
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yamg-row", style: { justifyContent: "flex-end" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "yamg-btn secondary", onClick: () => setShowForm(false), children: "إلغاء" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "yamg-btn", disabled: creating, onClick: submit, children: creating ? "...إنشاء" : "نشر الاستطلاع" })
      ] })
    ] }) }),
    loading ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yamg-loading", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yamg-spinner" }),
      "جاري التحميل..."
    ] }) : polls.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yamg-empty", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ic", children: "📊" }),
      "لا توجد استطلاعات بعد."
    ] }) : polls.map((poll) => {
      const { total, pct } = computePct(poll);
      const voted = poll._voted_index !== void 0 || poll.user_vote !== void 0 && poll.user_vote !== null;
      const closed = poll.closes_at && new Date(poll.closes_at).getTime() < Date.now();
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("article", { className: "yamg-card", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yamg-poll-q", children: poll.question }),
        (poll.options || []).map((opt, i) => {
          const p = pct(opt);
          const isVoted = poll._voted_index === i || poll.user_vote === i;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              className: `yamg-poll-opt ${isVoted ? "voted" : ""}`,
              onClick: () => !voted && !closed && handleVote(poll, i),
              style: { cursor: voted || closed ? "default" : "pointer" },
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bar", style: { width: `${p}%` } }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "label", children: [
                  isVoted && "✓ ",
                  opt.text || opt.label || opt
                ] }),
                (voted || closed) && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "pct", children: [
                  p,
                  "% · ",
                  opt.votes || 0
                ] })
              ]
            },
            i
          );
        }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yamg-row", style: { marginTop: 8, fontSize: 11, color: "var(--yamg-muted)" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            total,
            " صوت"
          ] }),
          poll.multi_choice && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yamg-tag", children: "متعدد الخيارات" }),
          closed && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yamg-tag danger", children: "مغلق" }),
          poll.closes_at && !closed && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            "يُغلق: ",
            new Date(poll.closes_at).toLocaleString("ar-EG")
          ] })
        ] })
      ] }, poll.id);
    })
  ] }) });
};
export {
  GroupPolls as default
};

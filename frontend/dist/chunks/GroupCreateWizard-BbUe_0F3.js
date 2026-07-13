import { bz as useNavigate, bG as useToast, b0 as reactExports, ar as jsxRuntimeExports, h as MainLayout } from "../index-D5NOBPt4.js";
import { G as GroupSubHeader } from "./GroupSubHeader-DPp3FYn6.js";
import { c as createGroup, M as updateGroupSettings, f as createGroupRule } from "./groups-CWhM7-Cw.js";
/* empty css                         */
const CATEGORIES = [
  { id: "study", icon: "🎓", label: "دراسة" },
  { id: "tech", icon: "💻", label: "تقنية" },
  { id: "games", icon: "🎮", label: "ألعاب" },
  { id: "design", icon: "🖋️", label: "تصميم" },
  { id: "sports", icon: "⚽", label: "رياضة" },
  { id: "music", icon: "🎵", label: "موسيقى" },
  { id: "family", icon: "👨‍👩‍👧", label: "عائلة" },
  { id: "business", icon: "💼", label: "أعمال" },
  { id: "fun", icon: "😄", label: "ترفيه" },
  { id: "other", icon: "✨", label: "أخرى" }
];
const PRIVACY = [
  { id: "public", icon: "🌐", label: "عامة", hint: "يمكن لأي شخص الانضمام والمشاهدة" },
  { id: "private", icon: "🔒", label: "خاصة", hint: "يتطلب موافقة على طلبات الانضمام" },
  { id: "secret", icon: "🔐", label: "سرّية", hint: "بالدعوة فقط، لا تظهر في البحث" }
];
const STEPS = [
  { id: 0, title: "النوع", label: "اختر تصنيف مجموعتك" },
  { id: 1, title: "الهوية", label: "الاسم والوصف" },
  { id: 2, title: "الخصوصية", label: "من يمكنه الانضمام؟" },
  { id: 3, title: "القواعد", label: "قواعد المجموعة (اختياري)" },
  { id: 4, title: "مراجعة", label: "تحقق وأنشئ" }
];
const GroupCreateWizard = () => {
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const [step, setStep] = reactExports.useState(0);
  const [creating, setCreating] = reactExports.useState(false);
  const [data, setData] = reactExports.useState({
    category: "tech",
    name: "",
    description: "",
    privacy: "public",
    rules: [],
    newRule: "",
    allowPosts: true,
    allowMedia: true,
    requireApproval: false
  });
  const update = (patch) => setData((d) => ({ ...d, ...patch }));
  const canNext = () => {
    if (step === 0) return !!data.category;
    if (step === 1) return data.name.trim().length >= 2;
    return true;
  };
  const addRule = () => {
    const r = data.newRule.trim();
    if (!r) return;
    update({ rules: [...data.rules, r], newRule: "" });
  };
  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await createGroup({
        name: data.name.trim(),
        description: data.description.trim(),
        category: data.category,
        privacy: data.privacy
      });
      const created = res?.data?.group || res?.data || {};
      const gid = created.id;
      if (!gid) throw new Error("لم يتم استلام معرّف المجموعة من الخادم");
      try {
        await updateGroupSettings(gid, {
          allow_posts: data.allowPosts,
          allow_media: data.allowMedia,
          require_join_approval: data.requireApproval || data.privacy === "private"
        });
      } catch {
      }
      for (const rule of data.rules) {
        try {
          await createGroupRule(gid, { title: rule, body: rule });
        } catch {
        }
      }
      pushToast?.({ type: "success", title: "تم!", description: "تم إنشاء مجموعتك بنجاح." });
      navigate(`/groups/${gid}/chat`);
    } catch (e) {
      pushToast?.({ type: "error", title: "تعذر إنشاء المجموعة", description: e?.message });
    } finally {
      setCreating(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(MainLayout, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yamg-page", dir: "rtl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      GroupSubHeader,
      {
        title: "معالج إنشاء مجموعة",
        subtitle: `الخطوة ${step + 1} من ${STEPS.length} — ${STEPS[step].title}`
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yamg-wizard-steps", children: STEPS.map((s, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `step ${i < step ? "done" : i === step ? "active" : ""}` }, s.id)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yamg-card", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yamg-wizard-step-title", children: [
        "الخطوة ",
        step + 1
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "yamg-wizard-step-h", children: STEPS[step].label }),
      step === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yamg-wizard-grid", children: CATEGORIES.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          className: `yamg-wizard-tile ${data.category === c.id ? "active" : ""}`,
          onClick: () => update({ category: c.id }),
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ic", children: c.icon }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: 13, fontWeight: 700 }, children: c.label })
          ]
        },
        c.id
      )) }),
      step === 1 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yamg-col", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            className: "yamg-input",
            placeholder: "اسم المجموعة (2 حروف على الأقل)",
            value: data.name,
            onChange: (e) => update({ name: e.target.value })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "textarea",
          {
            className: "yamg-textarea",
            placeholder: "وصف مختصر — عن ماذا تتحدّث هذه المجموعة؟",
            value: data.description,
            onChange: (e) => update({ description: e.target.value })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: 12, color: "var(--yamg-muted)" }, children: [
          data.name.length,
          "/40 حرف للاسم · ",
          data.description.length,
          "/200 للوصف"
        ] })
      ] }),
      step === 2 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yamg-col", children: PRIVACY.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          className: `yamg-wizard-tile ${data.privacy === p.id ? "active" : ""}`,
          style: { textAlign: "right", padding: 14 },
          onClick: () => update({ privacy: p.id }),
          children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yamg-row", style: { alignItems: "flex-start" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: 28 }, children: p.icon }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontWeight: 700, fontSize: 15 }, children: p.label }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: 12, color: "var(--yamg-muted)", marginTop: 4 }, children: p.hint })
            ] })
          ] })
        },
        p.id
      )) }),
      step === 3 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yamg-col", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: { color: "var(--yamg-muted)", fontSize: 13, margin: 0 }, children: "يمكنك إضافة قواعد لاحقاً من الإعدادات. اكتب قاعدة واضغط زر الإضافة." }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yamg-row", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              className: "yamg-input",
              placeholder: "مثال: ممنوع المحتوى المسيء",
              value: data.newRule,
              onChange: (e) => update({ newRule: e.target.value }),
              onKeyDown: (e) => e.key === "Enter" && addRule()
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "yamg-btn", onClick: addRule, children: "+ إضافة" })
        ] }),
        data.rules.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "var(--yamg-muted)", fontSize: 12, padding: 10 }, children: "لم تُضف قواعد بعد." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("ol", { style: { paddingInlineStart: 20, color: "#e2e8f0", fontSize: 14 }, children: data.rules.map((r, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { style: { marginBottom: 6 }, children: [
          r,
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: () => update({ rules: data.rules.filter((_, idx) => idx !== i) }),
              style: { marginInlineStart: 8, background: "transparent", color: "#fca5a5", border: 0, cursor: "pointer" },
              children: "✕"
            }
          )
        ] }, i)) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yamg-noti-row", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yamg-noti-label", children: "السماح بالمنشورات" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yamg-noti-hint", children: "يمكن للأعضاء نشر منشورات في خلاصة المجموعة" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "yamg-switch", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", checked: data.allowPosts, onChange: (e) => update({ allowPosts: e.target.checked }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "slider" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yamg-noti-row", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yamg-noti-label", children: "السماح برفع الوسائط" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yamg-noti-hint", children: "صور، فيديو، ملفات في الدردشة والمنشورات" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "yamg-switch", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", checked: data.allowMedia, onChange: (e) => update({ allowMedia: e.target.checked }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "slider" })
          ] })
        ] })
      ] }),
      step === 4 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yamg-col", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yamg-row", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "الاسم:" }),
          " ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: data.name })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yamg-row", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "التصنيف:" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "yamg-tag", children: [
            CATEGORIES.find((c) => c.id === data.category)?.icon,
            " ",
            CATEGORIES.find((c) => c.id === data.category)?.label
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yamg-row", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "الخصوصية:" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "yamg-tag", children: [
            PRIVACY.find((p) => p.id === data.privacy)?.icon,
            " ",
            PRIVACY.find((p) => p.id === data.privacy)?.label
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "الوصف:" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: { color: "var(--yamg-muted)", marginTop: 4 }, children: data.description || "— لا يوجد —" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("strong", { children: [
            "القواعد (",
            data.rules.length,
            "):"
          ] }),
          data.rules.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: { color: "var(--yamg-muted)", marginTop: 4 }, children: "— لا قواعد —" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { style: { paddingInlineStart: 20, marginTop: 4 }, children: data.rules.map((r, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("li", { style: { fontSize: 13 }, children: r }, i)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yamg-wizard-nav", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            className: "yamg-btn secondary",
            onClick: () => step === 0 ? navigate("/groups") : setStep((s) => s - 1),
            disabled: creating,
            children: step === 0 ? "✕ إلغاء" : "← السابق"
          }
        ),
        step < STEPS.length - 1 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            className: "yamg-btn",
            onClick: () => setStep((s) => s + 1),
            disabled: !canNext(),
            children: "التالي →"
          }
        ) : /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "yamg-btn", onClick: handleCreate, disabled: creating, children: creating ? "...جاري الإنشاء" : "✨ إنشاء المجموعة" })
      ] })
    ] })
  ] }) });
};
export {
  GroupCreateWizard as default
};

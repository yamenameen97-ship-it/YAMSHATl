import { bz as useNavigate, bG as useToast, b0 as reactExports, ar as jsxRuntimeExports, h as MainLayout } from "../index-CbZjTFV4.js";
import { G as GroupSubHeader } from "./GroupSubHeader-zqykCZvU.js";
import { H as searchGroups, v as getTrendingGroups, k as discoverGroups, g as createJoinRequest, w as joinGroup } from "./groups-iGSDUnA6.js";
/* empty css                         */
const CATEGORIES = [
  { id: "all", label: "الكل", icon: "✨" },
  { id: "trending", label: "الرائج", icon: "🔥" },
  { id: "study", label: "دراسة", icon: "🎓" },
  { id: "tech", label: "تقنية", icon: "💻" },
  { id: "games", label: "ألعاب", icon: "🎮" },
  { id: "design", label: "تصميم", icon: "🖋️" },
  { id: "sports", label: "رياضة", icon: "⚽" },
  { id: "music", label: "موسيقى", icon: "🎵" },
  { id: "business", label: "أعمال", icon: "💼" },
  { id: "fun", label: "ترفيه", icon: "😄" }
];
const GroupDiscover = () => {
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const [items, setItems] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [category, setCategory] = reactExports.useState("all");
  const [query, setQuery] = reactExports.useState("");
  const [joining, setJoining] = reactExports.useState({});
  const isMountedRef = reactExports.useRef(true);
  const searchSeqRef = reactExports.useRef(0);
  const loadSeqRef = reactExports.useRef(0);
  reactExports.useEffect(() => () => {
    isMountedRef.current = false;
  }, []);
  const load = async () => {
    const seq = ++loadSeqRef.current;
    try {
      setLoading(true);
      let res;
      if (category === "trending") {
        res = await getTrendingGroups(40);
      } else if (category === "all") {
        res = await discoverGroups({ limit: 60 });
      } else {
        res = await discoverGroups({ category, limit: 60 });
      }
      if (!isMountedRef.current || seq !== loadSeqRef.current) return;
      const list = Array.isArray(res?.data) ? res.data : res?.data?.groups || [];
      setItems(list);
    } catch {
      if (!isMountedRef.current || seq !== loadSeqRef.current) return;
      setItems([]);
    } finally {
      if (isMountedRef.current && seq === loadSeqRef.current) setLoading(false);
    }
  };
  reactExports.useEffect(() => {
    load();
  }, [category]);
  reactExports.useEffect(() => {
    const q = query.trim();
    if (!q) return;
    const seq = ++searchSeqRef.current;
    const h = setTimeout(async () => {
      try {
        const res = await searchGroups(q, 40);
        if (!isMountedRef.current || seq !== searchSeqRef.current) return;
        const list = Array.isArray(res?.data) ? res.data : res?.data?.groups || [];
        if (list.length) setItems(list);
      } catch {
      }
    }, 350);
    return () => clearTimeout(h);
  }, [query]);
  const filtered = reactExports.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (g) => String(g.name || "").toLowerCase().includes(q) || String(g.description || g.desc || "").toLowerCase().includes(q)
    );
  }, [items, query]);
  const handleJoin = async (g) => {
    if (joining[g.id]) return;
    setJoining((s) => ({ ...s, [g.id]: true }));
    try {
      if (g.privacy === "private") {
        await createJoinRequest(g.id, {});
        pushToast?.({ type: "success", title: "تم إرسال طلب الانضمام", description: "بانتظار موافقة المشرفين." });
      } else {
        await joinGroup(g.id);
        pushToast?.({ type: "success", title: "انضممت إلى المجموعة" });
        navigate(`/groups/${g.id}/chat`);
      }
    } catch (e) {
      pushToast?.({ type: "error", title: "تعذر الانضمام", description: e?.message });
    } finally {
      setJoining((s) => ({ ...s, [g.id]: false }));
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(MainLayout, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yamg-page", dir: "rtl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      GroupSubHeader,
      {
        title: "اكتشف مجموعات",
        subtitle: "انضم لمجتمعات تشاركك اهتماماتك",
        action: /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "yamg-btn", onClick: () => navigate("/groups/wizard"), children: "+ إنشاء مجموعة" })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yamg-card", style: { padding: 12 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      "input",
      {
        className: "yamg-input",
        placeholder: "🔍 ابحث باسم المجموعة أو الوصف...",
        value: query,
        onChange: (e) => setQuery(e.target.value),
        dir: "rtl"
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yamg-trending-bar", children: CATEGORIES.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: `yamg-trending-pill ${category === c.id ? "active" : ""}`,
        onClick: () => {
          setCategory(c.id);
          setQuery("");
        },
        children: [
          c.icon,
          " ",
          c.label
        ]
      },
      c.id
    )) }),
    loading ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yamg-loading", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yamg-spinner" }),
      "جاري التحميل..."
    ] }) : filtered.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yamg-empty", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ic", children: "🔭" }),
      "لا توجد مجموعات لعرضها في هذا التصنيف."
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yamg-discover-grid", children: filtered.map((g) => /* @__PURE__ */ jsxRuntimeExports.jsxs("article", { className: "yamg-card yamg-discover-card", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yamg-discover-cover", children: [
        g.cover_image_url ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: g.cover_image_url, alt: "" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 60
        }, children: g.icon || "👥" }),
        g.verified && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yamg-tag success", style: { position: "absolute", top: 10, right: 10 }, children: "✓ موثّقة" }),
        category === "trending" && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yamg-tag warning", style: { position: "absolute", top: 10, left: 10 }, children: "🔥 رائج" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yamg-discover-body", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { children: g.name }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: g.description || g.desc || "لا يوجد وصف." }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yamg-row", style: { fontSize: 12, color: "var(--yamg-muted)" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            "👥 ",
            g.members_count || g.members || 0,
            " عضو"
          ] }),
          g.privacy && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yamg-tag", children: g.privacy === "public" ? "🌐 عامة" : g.privacy === "private" ? "🔒 خاصة" : "🔐 سرّية" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yamg-discover-foot", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              className: "yamg-btn secondary",
              onClick: () => navigate(`/groups/${g.id}/chat`),
              children: "معاينة"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              className: "yamg-btn",
              onClick: () => handleJoin(g),
              disabled: joining[g.id],
              children: joining[g.id] ? "..." : g.privacy === "private" ? "طلب انضمام" : "انضم الآن"
            }
          )
        ] })
      ] })
    ] }, g.id)) })
  ] }) });
};
export {
  GroupDiscover as default
};

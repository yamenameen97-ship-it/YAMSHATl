import { bv as useNavigate, a_ as reactExports, aq as jsxRuntimeExports, h as MainLayout } from "../index-2I4hYPnI.js";
import { H as searchGroups, u as getGroups } from "./groups-DqmtpX-5.js";
const GroupsHome = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = reactExports.useState("الكل");
  const [groups, setGroups] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [error, setError] = reactExports.useState(null);
  const [searchQuery, setSearchQuery] = reactExports.useState("");
  const [showFilters, setShowFilters] = reactExports.useState(true);
  const baseGroupsRef = reactExports.useRef([]);
  const searchSeqRef = reactExports.useRef(0);
  const categories = [
    { id: 1, name: "الكل", icon: "📱" },
    { id: 2, name: "دراسة", icon: "🎓" },
    { id: 3, name: "تقنية", icon: "💻" },
    { id: 4, name: "ألعاب", icon: "🎮" },
    { id: 5, name: "تصميم", icon: "🖋️" },
    { id: 6, name: "ترفيه", icon: "😊" }
  ];
  reactExports.useEffect(() => {
    let cancelled = false;
    const fetchGroups = async () => {
      try {
        setLoading(true);
        const response = await getGroups();
        if (cancelled) return;
        const groupsData = Array.isArray(response.data) ? response.data : response.data?.items || [];
        baseGroupsRef.current = groupsData;
        setGroups(groupsData);
      } catch (err) {
        if (cancelled) return;
        console.error("Error fetching groups:", err);
        setError("تعذر تحميل المجموعات. يرجى المحاولة مرة أخرى.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchGroups();
    return () => {
      cancelled = true;
    };
  }, []);
  reactExports.useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      if (baseGroupsRef.current.length) setGroups(baseGroupsRef.current);
      return void 0;
    }
    const mySeq = ++searchSeqRef.current;
    const handle = setTimeout(async () => {
      try {
        const res = await searchGroups(q, 50);
        if (mySeq !== searchSeqRef.current) return;
        const data = res?.data?.groups || res?.data || [];
        if (Array.isArray(data) && data.length) {
          const map = new Map(baseGroupsRef.current.map((g) => [String(g.id), g]));
          for (const g of data) map.set(String(g.id), { ...map.get(String(g.id)), ...g });
          setGroups(Array.from(map.values()));
        }
      } catch {
      }
    }, 400);
    return () => clearTimeout(handle);
  }, [searchQuery]);
  const filteredGroups = reactExports.useMemo(() => {
    const byCategory = activeCategory === "الكل" ? groups : groups.filter((g) => g.category === activeCategory);
    const q = searchQuery.trim().toLowerCase();
    if (!q) return byCategory;
    return byCategory.filter(
      (g) => String(g.name || "").toLowerCase().includes(q) || String(g.description || g.desc || "").toLowerCase().includes(q)
    );
  }, [groups, activeCategory, searchQuery]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(MainLayout, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-groups-page", dir: "rtl", style: { fontFamily: "'Noto Sans Arabic','Cairo','Tahoma',sans-serif" }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("header", { className: "yam-groups-header", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-groups-title-section", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { children: "المجموعات" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "yam-groups-subtitle", children: "تواصل، شارك، وكن جزءاً من المجتمع ✨" })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 10, flexWrap: "wrap" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "yam-create-group-btn", onClick: () => navigate("/groups/wizard"), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "👥" }),
        " إنشاء مجموعة"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          className: "yam-create-group-btn",
          style: { background: "linear-gradient(135deg, #22c55e, #10b981)" },
          onClick: () => navigate("/voice?create=1"),
          "aria-label": "إنشاء غرفة صوتية",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "🎙️" }),
            " إنشاء غرفة صوتية"
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          className: "yam-create-group-btn",
          style: { background: "linear-gradient(135deg, #22d3ee, #0ea5e9)" },
          onClick: () => navigate("/groups/discover"),
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "🔭" }),
            " اكتشف مجموعات"
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        type: "button",
        onClick: () => navigate("/voice"),
        className: "yam-voicerooms-card",
        "aria-label": "الغرف الصوتية",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-voicerooms-icon", children: "🎙️" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-voicerooms-text", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "الغرف الصوتية" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("small", { children: "انضمّ إلى غرف صوتية مباشرة أو أنشئ غرفتك" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-voicerooms-arrow", "aria-hidden": "true", children: "‹" })
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
          .yam-voicerooms-card {
            display: flex;
            align-items: center;
            gap: 14px;
            width: 100%;
            margin-top: 16px;
            padding: 14px 16px;
            background: linear-gradient(135deg, rgba(34,197,94,0.12), rgba(16,185,129,0.08));
            border: 1px solid rgba(34,197,94,0.35);
            border-radius: 16px;
            color: #E5E7EB;
            cursor: pointer;
            font-family: inherit;
            text-align: right;
            transition: background 0.2s ease, transform 0.15s ease, border-color 0.2s ease;
          }
          .yam-voicerooms-card:hover {
            background: linear-gradient(135deg, rgba(34,197,94,0.18), rgba(16,185,129,0.14));
            border-color: rgba(34,197,94,0.6);
            transform: translateY(-1px);
          }
          .yam-voicerooms-icon {
            width: 48px;
            height: 48px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border-radius: 14px;
            background: linear-gradient(135deg, #22c55e, #10b981);
            font-size: 24px;
            box-shadow: 0 6px 16px rgba(16,185,129,0.35);
            flex-shrink: 0;
          }
          .yam-voicerooms-text {
            display: flex;
            flex-direction: column;
            gap: 2px;
            flex: 1;
            min-width: 0;
          }
          .yam-voicerooms-text strong {
            font-size: 15px;
            font-weight: 800;
            color: #F4F4F5;
          }
          .yam-voicerooms-text small {
            font-size: 12.5px;
            color: #94A3B8;
            font-weight: 500;
          }
          .yam-voicerooms-arrow {
            color: #22c55e;
            font-size: 28px;
            font-weight: 800;
            line-height: 1;
            transform: rotate(180deg);
          }
        ` }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "yam-search-filter-section", style: { marginTop: "24px" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          className: "yam-filter-btn",
          onClick: () => setShowFilters((v) => !v),
          title: "إظهار/إخفاء التصنيفات",
          "aria-label": "إظهار/إخفاء التصنيفات",
          "aria-expanded": showFilters,
          "aria-controls": "yam-groups-categories",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { "aria-hidden": "true", children: "⚙️" })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "form",
        {
          className: "yam-search-bar-wrap",
          role: "search",
          onSubmit: (e) => {
            e.preventDefault();
          },
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { htmlFor: "yam-groups-search", className: "sr-only", style: {
              position: "absolute",
              width: 1,
              height: 1,
              padding: 0,
              margin: -1,
              overflow: "hidden",
              clip: "rect(0,0,0,0)",
              whiteSpace: "nowrap",
              border: 0
            }, children: "ابحث عن مجموعة" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                id: "yam-groups-search",
                type: "search",
                className: "yam-search-input",
                placeholder: "ابحث عن مجموعة...",
                value: searchQuery,
                onChange: (e) => setSearchQuery(e.target.value),
                dir: "rtl",
                enterKeyHint: "search",
                "aria-label": "بحث في المجموعات",
                autoComplete: "off"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-search-icon", "aria-hidden": "true", children: "🔍" })
          ]
        }
      )
    ] }),
    showFilters && /* @__PURE__ */ jsxRuntimeExports.jsx(
      "section",
      {
        id: "yam-groups-categories",
        className: "yam-categories-scroll",
        role: "tablist",
        "aria-label": "تصنيفات المجموعات",
        children: categories.map((cat) => {
          const isActive = activeCategory === cat.name;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              type: "button",
              role: "tab",
              "aria-selected": isActive,
              tabIndex: isActive ? 0 : -1,
              className: `yam-category-pill ${isActive ? "active" : ""}`,
              onClick: () => setActiveCategory(cat.name),
              onKeyDown: (e) => {
                const dir = e.currentTarget.closest('[dir="rtl"]') ? -1 : 1;
                const idx = categories.findIndex((c) => c.name === activeCategory);
                let next = -1;
                if (e.key === "ArrowRight") next = idx + dir;
                else if (e.key === "ArrowLeft") next = idx - dir;
                else if (e.key === "Home") next = 0;
                else if (e.key === "End") next = categories.length - 1;
                if (next >= 0 && next < categories.length) {
                  e.preventDefault();
                  setActiveCategory(categories[next].name);
                  const root = e.currentTarget.parentElement;
                  const btns = root?.querySelectorAll(".yam-category-pill");
                  try {
                    btns?.[next]?.focus();
                  } catch {
                  }
                }
              },
              "aria-label": `تصنيف ${cat.name}`,
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { "aria-hidden": "true", children: cat.icon }),
                cat.name
              ]
            },
            cat.id
          );
        })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "yam-groups-list", children: loading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { textAlign: "center", padding: "40px", color: "#94a3b8" }, children: "جاري التحميل..." }) : error ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { textAlign: "center", padding: "40px", color: "#ef4444" }, children: error }) : filteredGroups.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { textAlign: "center", padding: "40px", color: "#94a3b8" }, children: searchQuery.trim() ? "لا توجد نتائج مطابقة لبحثك." : "لا توجد مجموعات حالياً." }) : filteredGroups.map((group) => {
      const openGroup = () => navigate(`/groups/${group.id}/chat`);
      const openSettings = (e) => {
        e?.stopPropagation?.();
        navigate(`/groups/${group.id}/settings`);
      };
      return /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          className: "yam-group-card",
          role: "button",
          tabIndex: 0,
          "aria-label": `فتح مجموعة ${group.name}${group.unread_count > 0 ? `، ${group.unread_count} رسالة غير مقروءة` : ""}`,
          onClick: openGroup,
          onKeyDown: (e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              openGroup();
            }
          },
          style: { cursor: "pointer" },
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-group-main-info", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-group-neon-icon", style: { "--neon-color": group.color || "#8b5cf6" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { color: group.color || "#8b5cf6" }, "aria-hidden": "true", children: group.icon || "👥" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-group-text-details", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { children: [
                  group.name,
                  " ",
                  group.verified && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { color: "#8b5cf6", fontSize: "14px" }, "aria-label": "موثّقة", children: "✔️" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "yam-group-desc", children: group.description || group.desc || "لا يوجد وصف للمجموعة" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-group-meta", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "yam-member-count", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { "aria-hidden": "true", children: "👥" }),
                    " ",
                    group.members_count || group.members || 0,
                    " عضو"
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-status-dot", "aria-hidden": "true", style: { backgroundColor: "#22c55e", width: "8px", height: "8px", borderRadius: "50%" } })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-group-side-info", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "yam-last-active", children: [
                group.is_active && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-active-dot", "aria-hidden": "true" }),
                group.last_active_human || "نشط"
              ] }),
              group.unread_count > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-unread-badge", "aria-label": `${group.unread_count} غير مقروء`, children: group.unread_count }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  className: "yam-more-btn",
                  onClick: openSettings,
                  onKeyDown: (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openSettings(e);
                    }
                  },
                  "aria-label": `إعدادات مجموعة ${group.name}`,
                  style: { background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit" },
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { "aria-hidden": "true", children: "⋮" })
                }
              )
            ] })
          ]
        },
        group.id
      );
    }) })
  ] }) });
};
export {
  GroupsHome as default
};

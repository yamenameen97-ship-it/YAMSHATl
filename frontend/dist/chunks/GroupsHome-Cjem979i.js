import { b0 as useNavigate, aK as reactExports, ah as jsxRuntimeExports } from "../index-Dz8FA2T4.js";
import { e as getGroups } from "./groups-DBR9wOpb.js";
const GroupsHome = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = reactExports.useState("الكل");
  const [groups, setGroups] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [error, setError] = reactExports.useState(null);
  const categories = [
    { id: 1, name: "الكل", icon: "📱" },
    { id: 2, name: "دراسة", icon: "🎓" },
    { id: 3, name: "تقنية", icon: "💻" },
    { id: 4, name: "ألعاب", icon: "🎮" },
    { id: 5, name: "تصميم", icon: "🖋️" },
    { id: 6, name: "ترفيه", icon: "😊" }
  ];
  reactExports.useEffect(() => {
    const fetchGroups = async () => {
      try {
        setLoading(true);
        const response = await getGroups();
        const groupsData = Array.isArray(response.data) ? response.data : response.data?.items || [];
        setGroups(groupsData);
      } catch (err) {
        console.error("Error fetching groups:", err);
        setError("تعذر تحميل المجموعات. يرجى المحاولة مرة أخرى.");
      } finally {
        setLoading(false);
      }
    };
    fetchGroups();
  }, []);
  const filteredGroups = activeCategory === "الكل" ? groups : groups.filter((g) => g.category === activeCategory);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-groups-page", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("header", { className: "yam-groups-header", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-groups-title-section", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { children: "المجموعات" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "yam-groups-subtitle", children: "تواصل، شارك، وكن جزءاً من المجتمع ✨" })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "yam-create-group-btn", onClick: () => navigate("/groups/create"), children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "+" }),
      " إنشاء مجموعة"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "yam-search-filter-section", style: { marginTop: "24px" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-filter-btn", onClick: () => navigate("/groups/settings"), children: "⚙️" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-search-bar-wrap", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "text", className: "yam-search-input", placeholder: "ابحث عن مجموعة..." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-search-icon", children: "🔍" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "yam-categories-scroll", children: categories.map((cat) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: `yam-category-pill ${activeCategory === cat.name ? "active" : ""}`,
        onClick: () => setActiveCategory(cat.name),
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: cat.icon }),
          cat.name
        ]
      },
      cat.id
    )) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "yam-groups-list", children: loading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { textAlign: "center", padding: "40px", color: "#94a3b8" }, children: "جاري التحميل..." }) : error ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { textAlign: "center", padding: "40px", color: "#ef4444" }, children: error }) : filteredGroups.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { textAlign: "center", padding: "40px", color: "#94a3b8" }, children: "لا توجد مجموعات حالياً." }) : filteredGroups.map((group) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-group-card", onClick: () => navigate(`/groups/${group.id}/chat`), style: { cursor: "pointer" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-group-main-info", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-group-neon-icon", style: { "--neon-color": group.color || "#8b5cf6" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { color: group.color || "#8b5cf6" }, children: group.icon || "👥" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-group-text-details", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { children: [
            group.name,
            " ",
            group.verified && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { color: "#8b5cf6", fontSize: "14px" }, children: "✔️" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "yam-group-desc", children: group.description || group.desc || "لا يوجد وصف للمجموعة" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-group-meta", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "yam-member-count", children: [
              "👥 ",
              group.members_count || group.members || 0,
              " عضو"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-status-dot", style: { backgroundColor: "#22c55e", width: "8px", height: "8px", borderRadius: "50%" } })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-group-side-info", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "yam-last-active", children: [
          group.is_active && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-active-dot" }),
          group.last_active_human || "نشط"
        ] }),
        group.unread_count > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-unread-badge", children: group.unread_count }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-more-btn", onClick: (e) => {
          e.stopPropagation();
          navigate(`/groups/${group.id}/settings`);
        }, children: "⋮" })
      ] })
    ] }, group.id)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("nav", { className: "yam-bottom-nav", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-nav-item", onClick: () => navigate("/"), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-nav-icon", children: "🏠" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "الرئيسية" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-nav-item active", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-nav-icon", children: "👥" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "المجموعات" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-center-nav-btn", onClick: () => navigate("/"), children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Y" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-nav-item", onClick: () => navigate("/inbox"), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-nav-icon", children: "💬" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "الرسائل" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-nav-item", onClick: () => navigate("/settings"), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-nav-icon", children: "⋯" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "المزيد" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { height: "100px" } })
  ] });
};
export {
  GroupsHome as default
};

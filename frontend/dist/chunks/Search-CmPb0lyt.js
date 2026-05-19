import { r as reactExports, a as useLocation, u as useNavigate, j as jsxRuntimeExports, B as Button, l as ListSkeleton } from "../index-BAMQT-m6.js";
import { M as MainLayout } from "./MainLayout-R4-pAMZD.js";
import { C as Card } from "./Card-BJoniTPs.js";
import { I as Input } from "./Input-CRG5fsdt.js";
import { E as EmptyState } from "./EmptyState-a8e0B9JF.js";
import { E as ErrorState } from "./ErrorState-CDGi9dt6.js";
import { g as getPosts } from "./posts-IFBCXYyQ.js";
import { g as getUsers } from "./users-DOUT--_i.js";
import { b as buildTrendingHashtags, s as searchInCollections, g as groupSearchResults, e as explainRecommendation } from "./recommendationService-DXhvubKl.js";
import { A as AutoSizer, F as FixedSizeList } from "./react-virtualized-auto-sizer.esm-_F9403nZ.js";
import "./proxy--nYX4zu0.js";
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = reactExports.useState(value);
  reactExports.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}
const SEARCH_FILTERS = [
  { key: "all", label: "الكل" },
  { key: "users", label: "الأشخاص" },
  { key: "posts", label: "المنشورات" },
  { key: "reels", label: "الريلز" },
  { key: "hashtags", label: "الهاشتاجات" }
];
const SEARCH_HISTORY_KEY = "yamshat.search.history";
const TOPBAR_SEARCH_KEY = "yamshat.topbarSearch";
function isVideoUrl(url = "") {
  return /\.(mp4|webm|mov|m3u8)(\?.*)?$/i.test(String(url || ""));
}
function resolveIncomingSearch(search = "") {
  const params = new URLSearchParams(search);
  const queryFromUrl = params.get("q") || "";
  if (queryFromUrl) return queryFromUrl;
  if (typeof window === "undefined") return "";
  return window.sessionStorage.getItem(TOPBAR_SEARCH_KEY) || "";
}
const SearchResultRow = ({ index, style, data }) => {
  const { results, openResult, setQuery, explainRecommendation: explainRecommendation2 } = data;
  const item = results[index];
  if (!item) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { ...style, padding: "8px 0" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { style: { padding: 18, height: "100%", overflow: "hidden" }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 14, alignItems: "flex-start" }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: 54, height: 54, borderRadius: 16, background: "rgba(59,130,246,0.12)", display: "grid", placeItems: "center", fontSize: 20, overflow: "hidden", flexShrink: 0 }, children: item.avatar ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: item.avatar, alt: item.title, style: { width: "100%", height: "100%", objectFit: "cover" } }) : item.type === "hashtags" ? "#" : item.type === "reels" ? "🎬" : item.type === "posts" ? "📝" : "👤" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { style: { margin: "0 0 6px", fontSize: 16 }, children: item.title }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "muted", style: { fontSize: 12 }, children: item.type === "users" ? "شخص" : item.type === "posts" ? "منشور" : item.type === "reels" ? "ريل" : "هاشتاج" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "score-pill", children: [
          "match ",
          Math.round(item.score * 100),
          "%"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: { margin: "10px 0", opacity: 0.86, fontSize: 13, lineClamp: 2, display: "-webkit-box", WebkitBoxOrient: "vertical", overflow: "hidden" }, children: item.description || item.content || "بدون وصف إضافي" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 10, flexWrap: "wrap" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "small", onClick: () => openResult(item), children: item.type === "hashtags" ? "تصفية بالهاشتاج" : "فتح" }),
        item.type !== "hashtags" ? /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", size: "small", onClick: () => setQuery(item.name || item.title), children: "بحث مشابه" }) : null
      ] })
    ] })
  ] }) }) });
};
function Search() {
  const location = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = reactExports.useState(() => resolveIncomingSearch(location.search));
  const debouncedQuery = useDebounce(query, 250);
  const [filterKey, setFilterKey] = reactExports.useState("all");
  const [loading, setLoading] = reactExports.useState(true);
  const [searching, setSearching] = reactExports.useState(false);
  const [error, setError] = reactExports.useState("");
  const [collections, setCollections] = reactExports.useState({ users: [], posts: [], reels: [], hashtags: [] });
  const [history, setHistory] = reactExports.useState(() => {
    try {
      return JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY) || "[]");
    } catch {
      return [];
    }
  });
  reactExports.useEffect(() => {
    const incomingQuery = resolveIncomingSearch(location.search);
    if (incomingQuery && incomingQuery !== query) {
      setQuery(incomingQuery);
    }
  }, [location.search]);
  reactExports.useEffect(() => {
    if (typeof window === "undefined") return;
    if (query.trim()) window.sessionStorage.setItem(TOPBAR_SEARCH_KEY, query.trim());
    else window.sessionStorage.removeItem(TOPBAR_SEARCH_KEY);
  }, [query]);
  const hydrateCollections = reactExports.useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [{ data: usersData }, { data: postsData }] = await Promise.all([getUsers(), getPosts({ limit: 80, page: 1 })]);
      const users = Array.isArray(usersData) ? usersData : usersData?.items || [];
      const posts = Array.isArray(postsData) ? postsData : postsData?.items || [];
      const reels = posts.filter((item) => isVideoUrl(item.media_url || item.video_url || ""));
      const hashtags = buildTrendingHashtags(posts);
      setCollections({ users, posts, reels, hashtags });
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || "تعذر تحميل بيانات البحث الذكي.");
    } finally {
      setLoading(false);
    }
  }, []);
  reactExports.useEffect(() => {
    hydrateCollections();
  }, [hydrateCollections]);
  reactExports.useEffect(() => {
    if (!debouncedQuery.trim()) return;
    setSearching(true);
    const timer = window.setTimeout(() => {
      setSearching(false);
      if (!history.includes(debouncedQuery.trim())) {
        const next = [debouncedQuery.trim(), ...history].slice(0, 12);
        setHistory(next);
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(next));
      }
    }, 140);
    return () => window.clearTimeout(timer);
  }, [debouncedQuery, history]);
  const results = reactExports.useMemo(() => searchInCollections(debouncedQuery, collections, { filter: filterKey }), [debouncedQuery, collections, filterKey]);
  const grouped = reactExports.useMemo(() => groupSearchResults(results), [results]);
  reactExports.useMemo(() => {
    if (!query.trim()) return history.slice(0, 6);
    return history.filter((item) => item.toLowerCase().includes(query.toLowerCase())).slice(0, 6);
  }, [history, query]);
  const openResult = reactExports.useCallback((item) => {
    if (item.type === "hashtags") {
      setQuery(item.title.replace(/^#/, ""));
      setFilterKey("hashtags");
      return;
    }
    navigate(item.route || "/search");
  }, [navigate]);
  const listData = reactExports.useMemo(() => ({
    results,
    openResult,
    setQuery,
    explainRecommendation
  }), [results, openResult]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(MainLayout, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { maxWidth: 980, margin: "0 auto", padding: 20, height: "calc(100vh - 70px)", display: "flex", flexDirection: "column" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { style: { padding: 20, marginBottom: 18 }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "grid", gap: 14 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { style: { margin: "0 0 8px" }, children: "البحث الذكي" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "muted", style: { margin: 0 }, children: "Fuzzy search للناس والمنشورات والريلز والهاشتاجات." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: query, onChange: (event) => setQuery(event.target.value), placeholder: "ابحث باسم شخص أو هاشتاج أو محتوى..." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", gap: 10, flexWrap: "wrap" }, children: SEARCH_FILTERS.map((filter) => /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: filterKey === filter.key ? "primary" : "secondary", size: "small", onClick: () => setFilterKey(filter.key), children: filter.label }, filter.key)) })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1 }, children: [
        loading ? /* @__PURE__ */ jsxRuntimeExports.jsx(ListSkeleton, { count: 6 }) : null,
        !loading && error ? /* @__PURE__ */ jsxRuntimeExports.jsx(ErrorState, { title: "تعذر فتح البحث الذكي", description: error, onRetry: hydrateCollections }) : null,
        !loading && !error && !debouncedQuery ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "grid", gridTemplateColumns: "1.3fr 0.9fr", gap: 16 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { style: { padding: 18 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { style: { marginTop: 0 }, children: "جاهز تدور على إيه؟" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "grid", gap: 12, marginTop: 14 }, children: ["مصممين UI", "#yamshat", "ريلز طبخ", "منشورات الذكاء الاصطناعي"].map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "discovery-row", onClick: () => setQuery(item), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: item }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "↖" })
            ] }, item)) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { style: { padding: 18 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { style: { marginTop: 0 }, children: "الترند الآن" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "grid", gap: 12 }, children: collections.hashtags.slice(0, 8).map((item) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "trending-row", onClick: () => setQuery(item.tag.replace(/^#/, "")), children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: item.tag }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "muted", children: [
                item.count,
                " منشور"
              ] })
            ] }) }, item.tag)) })
          ] })
        ] }) : null,
        !loading && !error && debouncedQuery ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { height: "100%", display: "flex", flexDirection: "column", gap: 16 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { style: { padding: 16 }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("strong", { children: [
              "النتائج (",
              results.length,
              ")"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", gap: 8 }, children: Object.entries(grouped).map(([key, items]) => /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "score-pill", children: [
              key,
              " ",
              items.length
            ] }, key)) })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { flex: 1 }, children: !results.length ? /* @__PURE__ */ jsxRuntimeExports.jsx(EmptyState, { icon: "🔎", title: "مفيش نتائج مناسبة" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(AutoSizer, { children: ({ height, width }) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            FixedSizeList,
            {
              height,
              width,
              itemCount: results.length,
              itemSize: 180,
              itemData: listData,
              className: "no-scrollbar",
              children: SearchResultRow
            }
          ) }) })
        ] }) : null
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
        .discovery-row, .trending-row {
          width: 100%;
          border: 1px solid rgba(148,163,184,0.14);
          background: rgba(15,23,42,0.45);
          color: white;
          border-radius: 16px;
          padding: 14px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          text-align: inherit;
          cursor: pointer;
        }
        .score-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 4px 12px;
          border-radius: 999px;
          background: rgba(59,130,246,0.14);
          color: #93c5fd;
          border: 1px solid rgba(147,197,253,0.3);
          font-size: 11px;
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      ` })
  ] });
}
export {
  Search as default
};

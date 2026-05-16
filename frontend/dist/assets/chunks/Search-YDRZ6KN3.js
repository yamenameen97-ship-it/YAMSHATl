import {
  AutoSizer,
  FixedSizeList
} from "./chunk-U2HBZFH7.js";
import {
  buildTrendingHashtags,
  explainRecommendation,
  groupSearchResults,
  searchInCollections
} from "./chunk-LADVLV2U.js";
import {
  MainLayout,
  getUsers
} from "./chunk-ZOZSORVL.js";
import "./chunk-AB4CHF2R.js";
import {
  getPosts
} from "./chunk-QYGJVHBV.js";
import {
  ErrorState
} from "./chunk-X4EAIF56.js";
import {
  EmptyState
} from "./chunk-I2PPYNN4.js";
import {
  Card
} from "./chunk-WNGLVHI2.js";
import {
  ListSkeleton
} from "./chunk-4ZQ5VGKF.js";
import {
  Input
} from "./chunk-RYTW2TDG.js";
import "./chunk-BDBRQ2OX.js";
import {
  Button
} from "./chunk-EHD43N2I.js";
import {
  useNavigate
} from "./chunk-FJN4GIYV.js";
import {
  __toESM,
  init_define_import_meta_env,
  require_jsx_runtime,
  require_react
} from "./chunk-SOYW6UE7.js";

// src/pages/Search.jsx
init_define_import_meta_env();
var import_react2 = __toESM(require_react(), 1);

// src/hooks/useDebounce.js
init_define_import_meta_env();
var import_react = __toESM(require_react(), 1);
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = (0, import_react.useState)(value);
  (0, import_react.useEffect)(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

// src/pages/Search.jsx
var import_jsx_runtime = __toESM(require_jsx_runtime(), 1);
var SEARCH_FILTERS = [
  { key: "all", label: "\u0627\u0644\u0643\u0644" },
  { key: "users", label: "\u0627\u0644\u0623\u0634\u062E\u0627\u0635" },
  { key: "posts", label: "\u0627\u0644\u0645\u0646\u0634\u0648\u0631\u0627\u062A" },
  { key: "reels", label: "\u0627\u0644\u0631\u064A\u0644\u0632" },
  { key: "hashtags", label: "\u0627\u0644\u0647\u0627\u0634\u062A\u0627\u062C\u0627\u062A" }
];
var SEARCH_HISTORY_KEY = "yamshat.search.history";
function isVideoUrl(url = "") {
  return /\.(mp4|webm|mov|m3u8)(\?.*)?$/i.test(String(url || ""));
}
var SearchResultRow = ({ index, style, data }) => {
  const { results, openResult, setQuery, explainRecommendation: explainRecommendation2 } = data;
  const item = results[index];
  if (!item) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { ...style, padding: "8px 0" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { style: { padding: 18, height: "100%", overflow: "hidden" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: 14, alignItems: "flex-start" }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: 54, height: 54, borderRadius: 16, background: "rgba(59,130,246,0.12)", display: "grid", placeItems: "center", fontSize: 20, overflow: "hidden", flexShrink: 0 }, children: item.avatar ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", { src: item.avatar, alt: item.title, style: { width: "100%", height: "100%", objectFit: "cover" } }) : item.type === "hashtags" ? "#" : item.type === "reels" ? "\u{1F3AC}" : item.type === "posts" ? "\u{1F4DD}" : "\u{1F464}" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { flex: 1 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { style: { margin: "0 0 6px", fontSize: 16 }, children: item.title }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "muted", style: { fontSize: 12 }, children: item.type === "users" ? "\u0634\u062E\u0635" : item.type === "posts" ? "\u0645\u0646\u0634\u0648\u0631" : item.type === "reels" ? "\u0631\u064A\u0644" : "\u0647\u0627\u0634\u062A\u0627\u062C" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "score-pill", children: [
          "match ",
          Math.round(item.score * 100),
          "%"
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { margin: "10px 0", opacity: 0.86, fontSize: 13, lineClamp: 2, display: "-webkit-box", WebkitBoxOrient: "vertical", overflow: "hidden" }, children: item.description || item.content || "\u0628\u062F\u0648\u0646 \u0648\u0635\u0641 \u0625\u0636\u0627\u0641\u064A" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: 10, flexWrap: "wrap" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, { size: "small", onClick: () => openResult(item), children: item.type === "hashtags" ? "\u062A\u0635\u0641\u064A\u0629 \u0628\u0627\u0644\u0647\u0627\u0634\u062A\u0627\u062C" : "\u0641\u062A\u062D" }),
        item.type !== "hashtags" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, { variant: "secondary", size: "small", onClick: () => setQuery(item.name || item.title), children: "\u0628\u062D\u062B \u0645\u0634\u0627\u0628\u0647" }) : null
      ] })
    ] })
  ] }) }) });
};
function Search() {
  const navigate = useNavigate();
  const [query, setQuery] = (0, import_react2.useState)("");
  const debouncedQuery = useDebounce(query, 250);
  const [filterKey, setFilterKey] = (0, import_react2.useState)("all");
  const [loading, setLoading] = (0, import_react2.useState)(true);
  const [searching, setSearching] = (0, import_react2.useState)(false);
  const [error, setError] = (0, import_react2.useState)("");
  const [collections, setCollections] = (0, import_react2.useState)({ users: [], posts: [], reels: [], hashtags: [] });
  const [history, setHistory] = (0, import_react2.useState)(() => {
    try {
      return JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY) || "[]");
    } catch {
      return [];
    }
  });
  const hydrateCollections = (0, import_react2.useCallback)(async () => {
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
      setError(err?.response?.data?.detail || err?.message || "\u062A\u0639\u0630\u0631 \u062A\u062D\u0645\u064A\u0644 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0628\u062D\u062B \u0627\u0644\u0630\u0643\u064A.");
    } finally {
      setLoading(false);
    }
  }, []);
  (0, import_react2.useEffect)(() => {
    hydrateCollections();
  }, [hydrateCollections]);
  (0, import_react2.useEffect)(() => {
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
  const results = (0, import_react2.useMemo)(() => searchInCollections(debouncedQuery, collections, { filter: filterKey }), [debouncedQuery, collections, filterKey]);
  const grouped = (0, import_react2.useMemo)(() => groupSearchResults(results), [results]);
  const suggestions = (0, import_react2.useMemo)(() => {
    if (!query.trim()) return history.slice(0, 6);
    return history.filter((item) => item.toLowerCase().includes(query.toLowerCase())).slice(0, 6);
  }, [history, query]);
  const openResult = (0, import_react2.useCallback)((item) => {
    if (item.type === "hashtags") {
      setQuery(item.title.replace(/^#/, ""));
      setFilterKey("hashtags");
      return;
    }
    navigate(item.route || "/search");
  }, [navigate]);
  const listData = (0, import_react2.useMemo)(() => ({
    results,
    openResult,
    setQuery,
    explainRecommendation
  }), [results, openResult]);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(MainLayout, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { maxWidth: 980, margin: "0 auto", padding: 20, height: "calc(100vh - 70px)", display: "flex", flexDirection: "column" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { style: { padding: 20, marginBottom: 18 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "grid", gap: 14 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { style: { margin: "0 0 8px" }, children: "\u0627\u0644\u0628\u062D\u062B \u0627\u0644\u0630\u0643\u064A" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "muted", style: { margin: 0 }, children: "Fuzzy search \u0644\u0644\u0646\u0627\u0633 \u0648\u0627\u0644\u0645\u0646\u0634\u0648\u0631\u0627\u062A \u0648\u0627\u0644\u0631\u064A\u0644\u0632 \u0648\u0627\u0644\u0647\u0627\u0634\u062A\u0627\u062C\u0627\u062A." })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, { value: query, onChange: (event) => setQuery(event.target.value), placeholder: "\u0627\u0628\u062D\u062B \u0628\u0627\u0633\u0645 \u0634\u062E\u0635 \u0623\u0648 \u0647\u0627\u0634\u062A\u0627\u062C \u0623\u0648 \u0645\u062D\u062A\u0648\u0649..." }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", gap: 10, flexWrap: "wrap" }, children: SEARCH_FILTERS.map((filter) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, { variant: filterKey === filter.key ? "primary" : "secondary", size: "small", onClick: () => setFilterKey(filter.key), children: filter.label }, filter.key)) })
      ] }) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { flex: 1 }, children: [
        loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ListSkeleton, { count: 6 }) : null,
        !loading && error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorState, { title: "\u062A\u0639\u0630\u0631 \u0641\u062A\u062D \u0627\u0644\u0628\u062D\u062B \u0627\u0644\u0630\u0643\u064A", description: error, onRetry: hydrateCollections }) : null,
        !loading && !error && !debouncedQuery ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "grid", gridTemplateColumns: "1.3fr 0.9fr", gap: 16 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { style: { padding: 18 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { style: { marginTop: 0 }, children: "\u062C\u0627\u0647\u0632 \u062A\u062F\u0648\u0631 \u0639\u0644\u0649 \u0625\u064A\u0647\u061F" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "grid", gap: 12, marginTop: 14 }, children: ["\u0645\u0635\u0645\u0645\u064A\u0646 UI", "#yamshat", "\u0631\u064A\u0644\u0632 \u0637\u0628\u062E", "\u0645\u0646\u0634\u0648\u0631\u0627\u062A \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A"].map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { type: "button", className: "discovery-row", onClick: () => setQuery(item), children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: item }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u2196" })
            ] }, item)) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { style: { padding: 18 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { style: { marginTop: 0 }, children: "\u0627\u0644\u062A\u0631\u0646\u062F \u0627\u0644\u0622\u0646" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "grid", gap: 12 }, children: collections.hashtags.slice(0, 8).map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "trending-row", onClick: () => setQuery(item.tag.replace(/^#/, "")), children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: item.tag }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "muted", children: [
                item.count,
                " \u0645\u0646\u0634\u0648\u0631"
              ] })
            ] }) }, item.tag)) })
          ] })
        ] }) : null,
        !loading && !error && debouncedQuery ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { height: "100%", display: "flex", flexDirection: "column", gap: 16 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { style: { padding: 16 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", { children: [
              "\u0627\u0644\u0646\u062A\u0627\u0626\u062C (",
              results.length,
              ")"
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", gap: 8 }, children: Object.entries(grouped).map(([key, items]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "score-pill", children: [
              key,
              " ",
              items.length
            ] }, key)) })
          ] }) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { flex: 1 }, children: !results.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, { icon: "\u{1F50E}", title: "\u0645\u0641\u064A\u0634 \u0646\u062A\u0627\u0626\u062C \u0645\u0646\u0627\u0633\u0628\u0629" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AutoSizer, { children: ({ height, width }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
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
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("style", { children: `
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

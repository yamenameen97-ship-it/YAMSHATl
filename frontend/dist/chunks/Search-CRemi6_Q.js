import { a as __toESM } from "./rolldown-runtime-DuU1KJyR.js";
import { Z as useNavigate, ot as require_react } from "./vendor-BEGBKm-Y.js";
import { n as require_jsx_runtime } from "./vendor-motion-DouOFhvK.js";
import { t as axios } from "./vendor-network-H7MgKIFL.js";
import { S as Button, b as ListSkeleton } from "../index-RNpBu_Fp.js";
import { t as Card } from "./Card-TPneInOP.js";
import { t as Input } from "./Input-BNYQZD5U.js";
import { t as EmptyState } from "./EmptyState-Co07m3O6.js";
import "./ErrorState-Xz3LP_u1.js";
import { t as MainLayout } from "./MainLayout-DmJHsj7d.js";
//#region src/hooks/useDebounce.js
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
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
//#endregion
//#region src/pages/Search.jsx
var import_jsx_runtime = require_jsx_runtime();
var SEARCH_FILTERS = [
	{
		key: "all",
		label: "الكل"
	},
	{
		key: "users",
		label: "المستخدمون"
	},
	{
		key: "posts",
		label: "المنشورات"
	},
	{
		key: "groups",
		label: "المجموعات"
	},
	{
		key: "hashtags",
		label: "الهاشتاجات"
	}
];
var SEARCH_HISTORY_KEY = "yamshat.search.history";
var SEARCH_CACHE = /* @__PURE__ */ new Map();
function Search() {
	useNavigate();
	const [query, setQuery] = (0, import_react.useState)("");
	const debouncedQuery = useDebounce(query, 500);
	const [filterKey, setFilterKey] = (0, import_react.useState)("all");
	const [sortBy, setSortBy] = (0, import_react.useState)("relevance");
	const [loading, setLoading] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)("");
	const [results, setResults] = (0, import_react.useState)([]);
	const [page, setPage] = (0, import_react.useState)(1);
	const [hasMore, setHasMore] = (0, import_react.useState)(true);
	const abortControllerRef = (0, import_react.useRef)(null);
	const [history, setHistory] = (0, import_react.useState)(() => {
		const saved = localStorage.getItem(SEARCH_HISTORY_KEY);
		return saved ? JSON.parse(saved) : [];
	});
	const trending = [
		{
			id: 1,
			tag: "#Yamshat_2026",
			count: "120K"
		},
		{
			id: 2,
			tag: "#AI_Future",
			count: "85K"
		},
		{
			id: 3,
			tag: "#Web3",
			count: "45K"
		}
	];
	const suggestions = (0, import_react.useMemo)(() => {
		if (!query) return [];
		return history.filter((h) => h.toLowerCase().includes(query.toLowerCase())).slice(0, 5);
	}, [query, history]);
	const performSearch = (0, import_react.useCallback)(async (isNewSearch = true) => {
		if (!debouncedQuery.trim()) return;
		if (abortControllerRef.current) abortControllerRef.current.abort();
		abortControllerRef.current = new AbortController();
		const currentPage = isNewSearch ? 1 : page;
		const cacheKey = `${debouncedQuery}-${filterKey}-${sortBy}-${currentPage}`;
		if (isNewSearch && SEARCH_CACHE.has(cacheKey)) {
			setResults(SEARCH_CACHE.get(cacheKey));
			setLoading(false);
			return;
		}
		try {
			setLoading(true);
			setError("");
			const response = await axios.get("/api/search", {
				params: {
					q: debouncedQuery,
					filter: filterKey,
					sort: sortBy,
					page: currentPage
				},
				signal: abortControllerRef.current.signal
			}).catch((err) => {
				if (axios.isCancel(err)) return { data: {
					results: [],
					hasMore: false
				} };
				throw err;
			});
			const newResults = response.data.results || [];
			if (isNewSearch) {
				setResults(newResults);
				SEARCH_CACHE.set(cacheKey, newResults);
			} else setResults((prev) => [...prev, ...newResults]);
			setHasMore(response.data.hasMore);
			if (isNewSearch && !history.includes(debouncedQuery)) {
				const newHistory = [debouncedQuery, ...history].slice(0, 10);
				setHistory(newHistory);
				localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
			}
		} catch (err) {
			if (err.name !== "CanceledError") setError("حدث خطأ أثناء البحث. حاول مرة أخرى.");
		} finally {
			setLoading(false);
		}
	}, [
		debouncedQuery,
		filterKey,
		sortBy,
		page,
		history
	]);
	(0, import_react.useEffect)(() => {
		if (debouncedQuery) {
			setPage(1);
			performSearch(true);
		} else setResults([]);
	}, [
		debouncedQuery,
		filterKey,
		sortBy
	]);
	const loadMore = () => {
		if (!loading && hasMore) {
			setPage((prev) => prev + 1);
			performSearch(false);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MainLayout, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		style: {
			maxWidth: 800,
			margin: "0 auto",
			padding: 20,
			color: "white"
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				style: {
					padding: 20,
					marginBottom: 20
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					value: query,
					onChange: (e) => setQuery(e.target.value),
					placeholder: "ابحث عن أي شيء...",
					style: { fontSize: 18 }
				}), suggestions.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					style: {
						marginTop: 10,
						background: "#222",
						borderRadius: 8,
						padding: 10
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						style: {
							fontSize: 12,
							opacity: .5,
							marginBottom: 5
						},
						children: "مقترحات"
					}), suggestions.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						onClick: () => setQuery(s),
						style: {
							padding: "5px 0",
							cursor: "pointer"
						},
						children: ["🕒 ", s]
					}, s))]
				})]
			}),
			!debouncedQuery && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "search-discovery",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					style: { marginBottom: 30 },
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "البحث الأخير" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						style: {
							display: "flex",
							gap: 10,
							flexWrap: "wrap",
							marginTop: 10
						},
						children: history.map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							onClick: () => setQuery(h),
							style: {
								padding: "5px 15px",
								background: "#333",
								borderRadius: 20,
								cursor: "pointer"
							},
							children: h
						}, h))
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "الأكثر رواجاً 🔥" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					style: { marginTop: 10 },
					children: trending.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						style: {
							display: "flex",
							justifyContent: "space-between",
							padding: "10px 0",
							borderBottom: "1px solid #222"
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t.tag }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							style: { opacity: .5 },
							children: [t.count, " منشور"]
						})]
					}, t.id))
				})] })]
			}),
			debouncedQuery && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "results",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					style: {
						display: "flex",
						gap: 10,
						marginBottom: 20,
						overflowX: "auto"
					},
					children: SEARCH_FILTERS.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => setFilterKey(f.key),
						style: {
							padding: "5px 15px",
							borderRadius: 20,
							background: filterKey === f.key ? "var(--primary)" : "#222",
							border: "none",
							color: "white",
							whiteSpace: "nowrap"
						},
						children: f.label
					}, f.key))
				}), loading && page === 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ListSkeleton, {}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [results.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, { message: "لا توجد نتائج" }) : results.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
					style: {
						padding: 15,
						marginBottom: 10
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", { children: r.title || r.name }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						style: { opacity: .7 },
						children: r.description || r.content
					})]
				}, r.id)), hasMore && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					onClick: loadMore,
					disabled: loading,
					style: {
						width: "100%",
						marginTop: 20
					},
					children: loading ? "جاري التحميل..." : "تحميل المزيد"
				})] })]
			})
		]
	}) });
}
//#endregion
export { Search as default };

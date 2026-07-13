import { b0 as reactExports, A as API, by as useLocation, bz as useNavigate, al as getUsers, ar as jsxRuntimeExports, h as MainLayout, d as Card, c as Button, g as ListSkeleton, ak as getStoredUserSnapshot, a7 as getCurrentUsername } from "../index-CbZjTFV4.js";
import { I as Input } from "./Input-DGgw5m9X.js";
import { a as ErrorState, E as EmptyState } from "./ErrorState-B4QUjhuk.js";
import { e as getPosts } from "./posts-BEeH67OQ.js";
import { b as buildTrendingHashtags, n as normalizeSearchText, t as tokenize, r as rankSuggestedUsers, f as fuzzyScore, e as extractHashtags, g as groupSearchResults } from "./recommendationService-DClArXfj.js";
import { F as FixedSizeList } from "./index.esm-C1kz0sm2.js";
import { A as AutoSizer } from "./react-virtualized-auto-sizer.esm-DHxekI-Q.js";
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
const SUPPORTED_REMOTE_SEARCH_TYPES = /* @__PURE__ */ new Set(["all", "users", "posts", "reels", "hashtags"]);
function normalizeRemoteResult(item = {}) {
  const type = item.type || "posts";
  const title = item.title || item.name || item.description || "نتيجة";
  return {
    id: item.id || `${type}-${title}`,
    type,
    title,
    name: item.name || title,
    description: item.description || item.content || "",
    content: item.content || item.description || "",
    avatar: item.avatar || item.image || "",
    media: item.media || item.image || "",
    hashtags: Array.isArray(item.hashtags) ? item.hashtags : [],
    mentions: Array.isArray(item.mentions) ? item.mentions : [],
    isVerified: Boolean(item.isVerified || item.verified || item.metadata?.is_verified),
    score: Number(item.score ?? item.relevance_score ?? 0),
    route: item.route || (type === "users" ? `/profile/${encodeURIComponent(item.name || title)}` : type === "hashtags" ? `/search?q=${encodeURIComponent(String(title).replace(/^#/, ""))}` : `/post/${encodeURIComponent(item.id || "")}`),
    metrics: item.metrics || item.metadata || {},
    createdAt: item.createdAt || item.timestamp || "",
    source: "remote"
  };
}
async function liveSearch(params = {}) {
  const rawType = String(params?.type || "all").trim().toLowerCase();
  const sanitizedParams = {
    q: String(params?.q || "").trim(),
    type: SUPPORTED_REMOTE_SEARCH_TYPES.has(rawType) ? rawType : "all",
    limit: Math.min(Math.max(Number(params?.limit) || 12, 1), 50)
  };
  if (!sanitizedParams.q) {
    return { query: "", results: [], total: 0 };
  }
  const { data } = await API.get("/search", {
    params: sanitizedParams,
    cache: false,
    forceRefresh: true
  });
  return {
    ...data,
    results: Array.isArray(data?.results) ? data.results.map(normalizeRemoteResult) : []
  };
}
async function getSearchSuggestions(query, limit = 8) {
  const { data } = await API.get("/search/suggestions", {
    params: { q: query, limit },
    cache: false,
    forceRefresh: true
  });
  return data;
}
async function getTrendingSearches(limit = 8) {
  const { data } = await API.get("/search/trending", {
    params: { limit },
    cache: false,
    forceRefresh: true
  });
  return data;
}
const indexCache = /* @__PURE__ */ new Map();
function extractMentions(text = "") {
  return Array.from(new Set((String(text || "").match(/@[\p{L}\p{N}._-]+/gu) || []).map((item) => item.toLowerCase())));
}
function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}
function toTimestamp(value) {
  const time = new Date(value || 0).getTime();
  return Number.isFinite(time) ? time : 0;
}
function freshnessBoost(createdAt) {
  const timestamp = toTimestamp(createdAt);
  if (!timestamp) return 0;
  const hours = Math.max(1, (Date.now() - timestamp) / 36e5);
  return Math.max(0, 0.18 - hours / (24 * 30) * 0.1);
}
function normalizeHashtagValue(tag = "") {
  const value = String(tag || "").trim();
  if (!value) return "";
  return value.startsWith("#") ? value.toLowerCase() : `#${value.toLowerCase()}`;
}
function normalizeMentionValue(value = "") {
  const text = String(value || "").trim();
  if (!text) return "";
  return text.startsWith("@") ? text.toLowerCase() : `@${text.toLowerCase()}`;
}
function metricScore(metrics = {}) {
  return toNumber(metrics.likes) * 1.8 + toNumber(metrics.comments) * 2.2 + toNumber(metrics.shares) * 2.8 + toNumber(metrics.saves) * 2.4 + toNumber(metrics.views) * 0.015 + toNumber(metrics.followers) * 0.03;
}
function buildEntry(type, item = {}) {
  const username = item.username || item.handle || item.name || "";
  const title = item.title || item.name || item.content || username || "Untitled";
  const description = item.description || item.bio || item.caption || item.content || "";
  const content = item.content || item.caption || item.description || "";
  const hashtags = (Array.isArray(item.hashtags) ? item.hashtags : extractHashtags(`${content} ${description}`)).map((tag) => normalizeHashtagValue(tag)).filter(Boolean);
  const mentions = extractMentions(`${content} ${description} ${username}`).map((itemValue) => normalizeMentionValue(itemValue));
  const metrics = {
    likes: toNumber(item.likes_count || item.like_count || item.likes),
    comments: toNumber(item.comments_count || item.comment_count),
    shares: toNumber(item.share_count || item.shares || item.shareCount),
    saves: toNumber(item.saved_count || item.save_count),
    views: toNumber(item.views_count || item.view_count),
    followers: toNumber(item.followers_count || item.followers)
  };
  const route = type === "users" ? `/profile/${encodeURIComponent(username || item.id || "")}` : type === "hashtags" ? `/search?q=${encodeURIComponent(String(title).replace(/^#/, ""))}` : type === "reels" ? "/reels" : "/";
  const searchText = [
    title,
    username,
    description,
    content,
    hashtags.join(" "),
    mentions.join(" ")
  ].filter(Boolean).join(" • ");
  return {
    id: item.id || `${type}-${username || title}`,
    type,
    title: type === "hashtags" ? normalizeHashtagValue(title) : title,
    name: username,
    description,
    content,
    hashtags,
    mentions,
    avatar: item.avatar || item.avatar_url || item.user_avatar || "",
    media: item.media_url || item.video_url || item.image_url || item.media || "",
    createdAt: item.created_at || item.updated_at || "",
    isVerified: Boolean(item.is_verified || item.verified),
    metrics,
    route,
    searchText,
    searchableTokens: tokenize(searchText),
    discoveryScore: metricScore(metrics) + freshnessBoost(item.created_at) * 100,
    raw: item
  };
}
function createCollectionSignature(collections = {}) {
  const users = collections.users || [];
  const posts = collections.posts || [];
  const reels = collections.reels || [];
  const hashtags = collections.hashtags || [];
  const live = collections.live || [];
  const stamp = [
    users.length,
    posts.length,
    reels.length,
    hashtags.length,
    live.length,
    users[0]?.id || users[0]?.username || "",
    posts[0]?.id || posts[0]?.created_at || "",
    reels[0]?.id || reels[0]?.created_at || "",
    live[0]?.id || live[0]?.room_name || live[0]?.title || ""
  ].join(":");
  return stamp;
}
function buildSearchIndex(collections = {}) {
  const signature = createCollectionSignature(collections);
  if (indexCache.has(signature)) return indexCache.get(signature);
  const entries = [];
  (collections.users || []).forEach((item) => entries.push(buildEntry("users", item)));
  (collections.posts || []).forEach((item) => entries.push(buildEntry("posts", item)));
  (collections.reels || []).forEach((item) => entries.push(buildEntry("reels", item)));
  (collections.live || []).forEach((item) => entries.push(buildEntry("live", {
    ...item,
    title: item.title || item.room_name || item.host_name || item.username || "بث مباشر",
    description: item.description || item.topic || item.host_name || "غرفة بث مباشر",
    content: [item.description, item.topic, item.host_name, item.username].filter(Boolean).join(" • "),
    username: item.host_username || item.username || item.host_name || "",
    avatar: item.host_avatar || item.avatar || item.user_avatar || "",
    media_url: item.thumbnail || item.cover_image || item.preview_image || "",
    views_count: item.viewer_count || item.viewers || 0,
    likes_count: item.likes_count || item.engagement || 0,
    created_at: item.started_at || item.created_at || ""
  })));
  (collections.hashtags || []).forEach((item) => {
    const tag = typeof item === "string" ? item : item.tag || item.name || "";
    entries.push(buildEntry("hashtags", {
      ...item,
      id: `hashtag-${tag}`,
      title: normalizeHashtagValue(tag),
      description: typeof item === "string" ? "هاشتاج شائع" : item.description || `${item.count || 0} منشور`,
      likes_count: item.engagement || 0
    }));
  });
  const tokenMap = /* @__PURE__ */ new Map();
  entries.forEach((entry) => {
    entry.searchableTokens.forEach((token) => {
      if (!tokenMap.has(token)) tokenMap.set(token, /* @__PURE__ */ new Set());
      tokenMap.get(token).add(entry.id);
    });
    entry.hashtags.forEach((tag) => {
      if (!tokenMap.has(tag)) tokenMap.set(tag, /* @__PURE__ */ new Set());
      tokenMap.get(tag).add(entry.id);
    });
    entry.mentions.forEach((mention) => {
      if (!tokenMap.has(mention)) tokenMap.set(mention, /* @__PURE__ */ new Set());
      tokenMap.get(mention).add(entry.id);
    });
  });
  const index = {
    signature,
    entries,
    tokenMap,
    byId: new Map(entries.map((entry) => [entry.id, entry])),
    createdAt: Date.now()
  };
  indexCache.set(signature, index);
  return index;
}
function resolveCandidates(index, queryTokens = []) {
  if (!queryTokens.length) return index.entries;
  const matchedIds = /* @__PURE__ */ new Set();
  queryTokens.forEach((token) => {
    const direct = index.tokenMap.get(token);
    if (direct) {
      direct.forEach((id) => matchedIds.add(id));
      return;
    }
    index.tokenMap.forEach((ids, candidateToken) => {
      if (candidateToken.startsWith(token) || candidateToken.includes(token)) {
        ids.forEach((id) => matchedIds.add(id));
      }
    });
  });
  return matchedIds.size ? Array.from(matchedIds).map((id) => index.byId.get(id)).filter(Boolean) : index.entries;
}
function matchesAdvancedFilters(entry, filters = {}) {
  if (filters.type && filters.type !== "all" && entry.type !== filters.type) return false;
  if (filters.onlyVerified && !entry.isVerified) return false;
  if (filters.onlyMedia && !entry.media) return false;
  if (filters.requiredHashtag) {
    const required = normalizeHashtagValue(filters.requiredHashtag);
    if (!entry.hashtags.includes(required) && normalizeHashtagValue(entry.title) !== required) return false;
  }
  if (filters.requiredMention) {
    const mention = normalizeMentionValue(filters.requiredMention);
    if (!entry.mentions.includes(mention) && normalizeMentionValue(entry.name) !== mention) return false;
  }
  if (filters.minFollowers && entry.type === "users" && toNumber(entry.metrics.followers) < Number(filters.minFollowers)) return false;
  return true;
}
function scoreEntry(entry, normalizedQuery = "", queryTokens = [], filters = {}) {
  const relevance = normalizedQuery ? fuzzyScore(normalizedQuery, entry.searchText) : 0;
  const tokenCoverage = queryTokens.length ? queryTokens.reduce((score, token) => {
    if (entry.searchableTokens.some((candidate) => candidate === token)) return score + 0.16;
    if (entry.searchableTokens.some((candidate) => candidate.startsWith(token))) return score + 0.12;
    if (entry.hashtags.some((tag) => tag.includes(token)) || entry.mentions.some((mention) => mention.includes(token))) return score + 0.14;
    return score;
  }, 0) : 0;
  const popularity = Math.min(metricScore(entry.metrics) / 6e3, 0.22);
  const freshness = freshnessBoost(entry.createdAt);
  const discoveryBoost = filters.intent === "discover-users" && entry.type === "users" ? 0.12 : 0;
  return Number((relevance + tokenCoverage + popularity + freshness + discoveryBoost).toFixed(4));
}
function sortEntries(entries = [], sortBy = "relevance") {
  const list = [...entries];
  if (sortBy === "fresh") {
    return list.sort((left, right) => toTimestamp(right.createdAt) - toTimestamp(left.createdAt));
  }
  if (sortBy === "trending") {
    return list.sort((left, right) => metricScore(right.metrics) - metricScore(left.metrics));
  }
  if (sortBy === "people") {
    return list.sort((left, right) => {
      if (left.type === "users" && right.type !== "users") return -1;
      if (right.type === "users" && left.type !== "users") return 1;
      return right.score - left.score;
    });
  }
  return list.sort((left, right) => right.score - left.score);
}
function searchIndex(index, query = "", options = {}) {
  const normalizedQuery = normalizeSearchText(query);
  const queryTokens = tokenize(query).map((token) => {
    if (String(query).trim().startsWith("#") || token.startsWith("#")) return normalizeHashtagValue(token);
    if (String(query).trim().startsWith("@") || token.startsWith("@")) return normalizeMentionValue(token);
    return token;
  });
  const candidates = resolveCandidates(index, queryTokens);
  const filters = {
    ...options,
    requiredHashtag: options.requiredHashtag || (String(query).trim().startsWith("#") ? query : ""),
    requiredMention: options.requiredMention || (String(query).trim().startsWith("@") ? query : "")
  };
  const results = candidates.filter((entry) => matchesAdvancedFilters(entry, filters)).map((entry) => ({
    ...entry,
    score: scoreEntry(entry, normalizedQuery, queryTokens, filters),
    explanation: [entry.name, ...(entry.hashtags || []).slice(0, 2), ...(entry.mentions || []).slice(0, 1)].filter(Boolean).join(" • ")
  })).filter((entry) => !normalizedQuery || entry.score >= 0.22);
  return sortEntries(results, options.sortBy || "relevance");
}
function getSearchInsights(index, query = "") {
  const results = searchIndex(index, query, { sortBy: "trending" }).slice(0, 30);
  const hashtags = /* @__PURE__ */ new Map();
  const mentions = /* @__PURE__ */ new Map();
  results.forEach((entry) => {
    entry.hashtags.forEach((tag) => hashtags.set(tag, (hashtags.get(tag) || 0) + 1));
    entry.mentions.forEach((mention) => mentions.set(mention, (mentions.get(mention) || 0) + 1));
  });
  return {
    topHashtags: Array.from(hashtags.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([tag, count]) => ({ tag, count })),
    topMentions: Array.from(mentions.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([mention, count]) => ({ mention, count }))
  };
}
function buildSearchCollections(users = [], posts = [], live = []) {
  const reels = posts.filter((item) => /\.(mp4|webm|mov|m3u8)(\?.*)?$/i.test(String(item.media_url || item.video_url || "")));
  const hashtags = buildTrendingHashtags(posts);
  return { users, posts, reels, hashtags, live };
}
function buildUserDiscovery(index, query = "", limit = 8) {
  const queryText = normalizeSearchText(query);
  const users = index.entries.filter((entry) => entry.type === "users");
  const ranked = rankSuggestedUsers(users.map((entry) => ({
    ...entry.raw,
    username: entry.name,
    followers_count: entry.metrics.followers,
    is_verified: entry.isVerified
  })), "");
  return ranked.map((user) => {
    const matchScore = queryText ? fuzzyScore(queryText, `${user.username || ""} ${user.bio || ""} ${user.name || ""}`) : 0;
    return {
      id: user.id || user.username,
      username: user.username || user.name,
      name: user.name || user.username,
      avatar: user.avatar || user.avatar_url || "",
      bio: user.bio || user.description || "",
      isVerified: Boolean(user.is_verified || user.verified),
      followers: toNumber(user.followers_count || user.followers),
      score: Number((toNumber(user.recommendation_score) + matchScore * 100).toFixed(2)),
      reason: user.recommendation_reason || "مقترح ليك"
    };
  }).sort((left, right) => right.score - left.score).slice(0, limit);
}
const SEARCH_FILTERS = [
  { key: "all", label: "الكل" },
  { key: "users", label: "الأشخاص" },
  { key: "posts", label: "المنشورات" },
  { key: "reels", label: "الريلز" },
  { key: "live", label: "البث المباشر" },
  { key: "hashtags", label: "الهاشتاجات" }
];
const SEARCH_HISTORY_KEY = "yamshat.search.history";
const TOPBAR_SEARCH_KEY = "yamshat.topbarSearch";
const SEARCH_COLLECTIONS_CACHE_KEY = "yamshat.search.collections.cache.v2";
const SEARCH_RESULTS_CACHE_TTL = 5 * 60 * 1e3;
function resolveIncomingSearch(search = "") {
  const params = new URLSearchParams(search);
  const queryFromUrl = params.get("q") || "";
  if (queryFromUrl) return queryFromUrl;
  if (typeof window === "undefined") return "";
  return window.sessionStorage.getItem(TOPBAR_SEARCH_KEY) || "";
}
function restoreCollectionsCache() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SEARCH_COLLECTIONS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - Number(parsed.timestamp || 0) > SEARCH_RESULTS_CACHE_TTL) return null;
    return parsed.collections || null;
  } catch {
    return null;
  }
}
function persistCollectionsCache(collections) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SEARCH_COLLECTIONS_CACHE_KEY, JSON.stringify({ timestamp: Date.now(), collections }));
  } catch {
  }
}
function buildSessionUserFallback() {
  const session = getStoredUserSnapshot();
  const profile = session?.profile || {};
  const username = getCurrentUsername() || session?.username || session?.user || "";
  const displayName = profile.full_name || session?.name || session?.full_name || username;
  if (!username && !displayName) return [];
  return [{
    id: session?.id || username || "me",
    username,
    name: displayName || username || "أنت",
    avatar: profile.avatar || session?.avatar || profile.avatar_url || session?.avatar_url || "",
    bio: profile.bio || profile.activity_tagline || "",
    followers_count: Number(profile.followers_count || session?.followers_count || session?.followers || 0),
    is_verified: Boolean(session?.verified || session?.is_verified || profile.verified || profile.is_verified)
  }];
}
function SearchResultRow({ index, style, data }) {
  const { results, openResult, setQuery } = data;
  const item = results[index];
  if (!item) return null;
  const accent = item.type === "users" ? "👤" : item.type === "posts" ? "📝" : item.type === "reels" ? "🎬" : item.type === "live" ? "🔴" : "#";
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { ...style, padding: "8px 0" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { style: { padding: 18, height: "100%", overflow: "hidden" }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 14, alignItems: "flex-start" }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: 54, height: 54, borderRadius: 16, background: "rgba(59,130,246,0.12)", display: "grid", placeItems: "center", fontSize: 20, overflow: "hidden", flexShrink: 0 }, children: item.avatar ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: item.avatar, alt: item.title, style: { width: "100%", height: "100%", objectFit: "cover" } }) : accent }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { style: { margin: "0 0 6px", fontSize: 16 }, children: item.title }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "muted", style: { fontSize: 12 }, children: item.type === "users" ? "شخص" : item.type === "posts" ? "منشور" : item.type === "reels" ? "ريل" : item.type === "live" ? "بث مباشر" : "هاشتاج" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }, children: [
          item.isVerified ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "score-pill", children: "موثّق" }) : null,
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "score-pill", children: [
            "match ",
            Math.round(item.score * 100),
            "%"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: { margin: "10px 0", opacity: 0.86, fontSize: 13, lineClamp: 2, display: "-webkit-box", WebkitBoxOrient: "vertical", overflow: "hidden" }, children: item.description || item.content || "بدون وصف إضافي" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }, children: [
        (item.hashtags || []).slice(0, 3).map((tag) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "micro-chip", onClick: () => setQuery(tag), children: tag }, tag)),
        (item.mentions || []).slice(0, 2).map((mention) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "micro-chip mention", onClick: () => setQuery(mention), children: mention }, mention))
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 10, flexWrap: "wrap" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "small", onClick: () => openResult(item), children: item.type === "hashtags" ? "تصفية بالهاشتاج" : "فتح" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", size: "small", onClick: () => setQuery(item.name || item.title), children: "بحث مشابه" })
      ] })
    ] })
  ] }) }) });
}
function Search() {
  const location = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = reactExports.useState(() => resolveIncomingSearch(location.search));
  const debouncedQuery = useDebounce(query, 180);
  const [filterKey, setFilterKey] = reactExports.useState("all");
  const [sortBy, setSortBy] = reactExports.useState("relevance");
  const [onlyVerified, setOnlyVerified] = reactExports.useState(false);
  const [onlyMedia, setOnlyMedia] = reactExports.useState(false);
  const [requiredHashtag, setRequiredHashtag] = reactExports.useState("");
  const [requiredMention, setRequiredMention] = reactExports.useState("");
  const [loading, setLoading] = reactExports.useState(true);
  const [searching, setSearching] = reactExports.useState(false);
  const [error, setError] = reactExports.useState("");
  const [collections, setCollections] = reactExports.useState(() => restoreCollectionsCache() || { users: buildSessionUserFallback(), posts: [], reels: [], live: [], hashtags: [] });
  const [history, setHistory] = reactExports.useState(() => {
    try {
      return JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY) || "[]");
    } catch {
      return [];
    }
  });
  const [remoteResults, setRemoteResults] = reactExports.useState([]);
  const [remoteSuggestions, setRemoteSuggestions] = reactExports.useState([]);
  const [remoteTrending, setRemoteTrending] = reactExports.useState([]);
  const searchCacheRef = reactExports.useRef(/* @__PURE__ */ new Map());
  reactExports.useEffect(() => {
    const incomingQuery = resolveIncomingSearch(location.search);
    if (incomingQuery && incomingQuery !== query) setQuery(incomingQuery);
  }, [location.search]);
  reactExports.useEffect(() => {
    if (typeof window === "undefined") return;
    if (query.trim()) window.sessionStorage.setItem(TOPBAR_SEARCH_KEY, query.trim());
    else window.sessionStorage.removeItem(TOPBAR_SEARCH_KEY);
  }, [query]);
  const hydrateCollections = reactExports.useCallback(async () => {
    try {
      setLoading((prev) => prev && !(collections.users?.length || collections.posts?.length || collections.live?.length));
      setError("");
      const [usersResponse, postsResponse] = await Promise.allSettled([
        getUsers({ limit: 80, page: 1 }),
        getPosts({ limit: 120, page: 1 })
      ]);
      const usersData = usersResponse.status === "fulfilled" ? usersResponse.value?.data : [];
      const postsData = postsResponse.status === "fulfilled" ? postsResponse.value?.data : [];
      const users = Array.isArray(usersData) ? usersData : usersData?.items || [];
      const posts = Array.isArray(postsData) ? postsData : postsData?.items || [];
      const liveRooms = [];
      const mergedUsers = users.length ? users : buildSessionUserFallback();
      const nextCollections = buildSearchCollections(mergedUsers, posts, liveRooms);
      setCollections(nextCollections);
      persistCollectionsCache(nextCollections);
      const nothingLoaded = !users.length && !posts.length;
      if (nothingLoaded && !(collections.users?.length || collections.posts?.length || collections.hashtags?.length)) {
        const firstError = [usersResponse, postsResponse].find((response) => response.status === "rejected");
        if (firstError?.reason) {
          throw firstError.reason;
        }
      }
    } catch (err) {
      if (!(collections.users?.length || collections.posts?.length || collections.live?.length || collections.hashtags?.length)) {
        setError(err?.response?.data?.detail || err?.message || "تعذر تحميل بيانات البحث الذكي.");
      }
    } finally {
      setLoading(false);
    }
  }, [collections.live?.length, collections.posts?.length, collections.users?.length]);
  reactExports.useEffect(() => {
    hydrateCollections();
  }, [hydrateCollections]);
  reactExports.useEffect(() => {
    let cancelled = false;
    getTrendingSearches(8).then((data) => {
      if (cancelled) return;
      setRemoteTrending(Array.isArray(data?.trending) ? data.trending : []);
    }).catch(() => {
      if (!cancelled) setRemoteTrending([]);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  reactExports.useEffect(() => {
    let cancelled = false;
    const trimmedQuery = debouncedQuery.trim();
    if (trimmedQuery.length < 2) {
      setRemoteResults([]);
      setRemoteSuggestions([]);
      return () => {
        cancelled = true;
      };
    }
    const remoteType = ["all", "users", "posts", "reels", "hashtags"].includes(filterKey) ? filterKey : "all";
    Promise.allSettled([
      filterKey === "live" ? Promise.resolve({ results: [] }) : liveSearch({ q: trimmedQuery, type: remoteType, limit: 12 }),
      getSearchSuggestions(trimmedQuery, 8)
    ]).then((responses) => {
      if (cancelled) return;
      const [resultsResponse, suggestionsResponse] = responses;
      setRemoteResults(resultsResponse.status === "fulfilled" ? resultsResponse.value?.results || [] : []);
      setRemoteSuggestions(suggestionsResponse.status === "fulfilled" ? suggestionsResponse.value?.suggestions || [] : []);
    });
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, filterKey]);
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
    }, 120);
    return () => window.clearTimeout(timer);
  }, [debouncedQuery, history]);
  const searchIndexMemo = reactExports.useMemo(() => buildSearchIndex(collections), [collections]);
  const results = reactExports.useMemo(() => {
    const cacheKey = JSON.stringify({
      q: debouncedQuery,
      filterKey,
      sortBy,
      onlyVerified,
      onlyMedia,
      requiredHashtag,
      requiredMention,
      signature: searchIndexMemo.signature,
      remote: remoteResults.length
    });
    if (searchCacheRef.current.has(cacheKey)) return searchCacheRef.current.get(cacheKey);
    const localResults = searchIndex(searchIndexMemo, debouncedQuery, {
      type: filterKey,
      sortBy,
      onlyVerified,
      onlyMedia,
      requiredHashtag,
      requiredMention,
      intent: filterKey === "users" ? "discover-users" : "general-search"
    });
    const merged = [];
    const seen = /* @__PURE__ */ new Set();
    [...remoteResults, ...localResults].forEach((item) => {
      const key = `${item.type}:${item.id}`;
      if (seen.has(key)) return;
      seen.add(key);
      merged.push(item);
    });
    const nextResults = sortBy === "trending" ? merged.sort((left, right) => (right.metrics?.likes || right.metrics?.followers || right.score || 0) - (left.metrics?.likes || left.metrics?.followers || left.score || 0)) : merged.sort((left, right) => (right.score || 0) - (left.score || 0));
    searchCacheRef.current.set(cacheKey, nextResults);
    if (searchCacheRef.current.size > 30) {
      const oldestKey = searchCacheRef.current.keys().next().value;
      searchCacheRef.current.delete(oldestKey);
    }
    return nextResults;
  }, [debouncedQuery, filterKey, sortBy, onlyVerified, onlyMedia, requiredHashtag, requiredMention, searchIndexMemo, remoteResults]);
  const grouped = reactExports.useMemo(() => groupSearchResults(results), [results]);
  const suggestions = reactExports.useMemo(() => {
    if (!query.trim()) return history.slice(0, 6);
    const localSuggestions = history.filter((item) => item.toLowerCase().includes(query.toLowerCase()));
    const remoteSuggestionTexts = remoteSuggestions.map((item) => item.text).filter(Boolean);
    return Array.from(/* @__PURE__ */ new Set([...remoteSuggestionTexts, ...localSuggestions])).slice(0, 6);
  }, [history, query, remoteSuggestions]);
  const insights = reactExports.useMemo(() => getSearchInsights(searchIndexMemo, debouncedQuery || query), [searchIndexMemo, debouncedQuery, query]);
  const userDiscovery = reactExports.useMemo(() => buildUserDiscovery(searchIndexMemo, debouncedQuery || query, 8), [searchIndexMemo, debouncedQuery, query]);
  const openResult = reactExports.useCallback((item) => {
    if (item.type === "hashtags") {
      setQuery(item.title.replace(/^#/, ""));
      setRequiredHashtag(item.title);
      setFilterKey("hashtags");
      return;
    }
    navigate(item.route || "/search");
  }, [navigate]);
  const listData = reactExports.useMemo(() => ({ results, openResult, setQuery }), [results, openResult]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(MainLayout, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-search-page-shell", style: { maxWidth: 1120, margin: "0 auto", padding: 20, minHeight: "calc(var(--yam-vh, 100vh) - 70px)", display: "flex", flexDirection: "column", gap: 16 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { style: { padding: 20, marginBottom: 18 }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "grid", gap: 14 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { style: { margin: "0 0 8px" }, children: "البحث الذكي" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "muted yam-search-subtitle", style: { margin: 0 }, children: "بحث مفهرس مع تخزين مؤقت وفلاتر وهاشتاجات ومنشنات واكتشاف مستخدمين." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: query, onChange: (event) => setQuery(event.target.value), placeholder: "ابحث باسم شخص أو #هاشتاج أو @منشن", inputClassName: "yam-search-input", dir: "rtl" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", gap: 10, flexWrap: "wrap" }, children: SEARCH_FILTERS.map((filter) => /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: filterKey === filter.key ? "primary" : "secondary", size: "small", onClick: () => setFilterKey(filter.key), children: filter.label }, filter.key)) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "advanced-search-grid", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "search-select-field", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "الترتيب" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { value: sortBy, onChange: (event) => setSortBy(event.target.value), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "relevance", children: "الأكثر صلة" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "trending", children: "الأكثر تفاعلاً" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "fresh", children: "الأحدث" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "people", children: "اكتشاف أشخاص" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "search-inline-toggle", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", checked: onlyVerified, onChange: (event) => setOnlyVerified(event.target.checked) }),
            " موثّق فقط"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "search-inline-toggle", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", checked: onlyMedia, onChange: (event) => setOnlyMedia(event.target.checked) }),
            " محتوى فيه وسائط"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: requiredHashtag, onChange: (event) => setRequiredHashtag(event.target.value), placeholder: "#هاشتاج إضافي" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: requiredMention, onChange: (event) => setRequiredMention(event.target.value), placeholder: "@mention" })
        ] }),
        suggestions.length ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" }, children: suggestions.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "micro-chip", onClick: () => setQuery(item), children: item }, item)) }) : null
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1 }, children: [
        loading ? /* @__PURE__ */ jsxRuntimeExports.jsx(ListSkeleton, { count: 6 }) : null,
        !loading && error ? /* @__PURE__ */ jsxRuntimeExports.jsx(ErrorState, { title: "تعذر فتح البحث الذكي", description: error, onRetry: hydrateCollections }) : null,
        !loading && !error && !debouncedQuery ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "search-dashboard-grid", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { style: { padding: 18 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { style: { marginTop: 0 }, children: "سيرش سريع" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "grid", gap: 12, marginTop: 14 }, children: ["مصممين UI", "#yamshat", "@support", "ريلز طبخ", "منشورات الذكاء الاصطناعي"].map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "discovery-row", onClick: () => setQuery(item), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: item }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "↖" })
            ] }, item)) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { style: { padding: 18 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { style: { marginTop: 0 }, children: "الترند الآن" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "grid", gap: 12 }, children: (remoteTrending.length ? remoteTrending : (collections.hashtags || []).slice(0, 8)).map((item) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "trending-row", onClick: () => {
              setQuery(String(item.tag || "").replace(/^#/, ""));
              setRequiredHashtag(item.tag);
            }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: item.tag }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "muted", children: [
                item.count || item.score || 0,
                " نتيجة"
              ] })
            ] }) }, item.tag)) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { style: { padding: 18 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { style: { marginTop: 0 }, children: "اكتشاف أشخاص" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "grid", gap: 10 }, children: userDiscovery.slice(0, 6).map((user) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "discovery-user-card", onClick: () => navigate(`/profile/${encodeURIComponent(user.username)}`), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "discovery-avatar", children: user.avatar ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: user.avatar, alt: user.username }) : "👤" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { textAlign: "start" }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: user.name || user.username }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "muted", children: [
                  "@",
                  user.username
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "muted", children: user.reason })
              ] })
            ] }, user.id)) })
          ] })
        ] }) : null,
        !loading && !error && debouncedQuery ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-search-results-layout", style: { height: "100%", display: "grid", gridTemplateColumns: "1.4fr 0.78fr", gap: 16 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { minHeight: 0, display: "flex", flexDirection: "column", gap: 16 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { style: { padding: 16 }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("strong", { children: [
                "النتائج (",
                results.length,
                ") ",
                searching ? "• جاري التحديث" : ""
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" }, children: Object.entries(grouped).map(([key, items]) => /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "score-pill", children: [
                key,
                " ",
                items.length
              ] }, key)) })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { flex: 1, minHeight: 0 }, children: !results.length ? /* @__PURE__ */ jsxRuntimeExports.jsx(EmptyState, { icon: "🔎", title: "مفيش نتائج مناسبة" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(AutoSizer, { children: ({ height, width }) => /* @__PURE__ */ jsxRuntimeExports.jsx(FixedSizeList, { height, width, itemCount: results.length, itemSize: 190, itemData: listData, className: "no-scrollbar", children: SearchResultRow }) }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "grid", gap: 16, alignContent: "start" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { style: { padding: 18 }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { style: { marginTop: 0 }, children: "Top hashtags" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" }, children: insights.topHashtags.length ? insights.topHashtags.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "micro-chip", onClick: () => setQuery(item.tag), children: [
                item.tag,
                " • ",
                item.count
              ] }, item.tag)) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "muted", children: "لما تكتب بحث هتظهر لك الهاشتاجات الأقرب." }) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { style: { padding: 18 }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { style: { marginTop: 0 }, children: "Top mentions" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" }, children: insights.topMentions.length ? insights.topMentions.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "micro-chip mention", onClick: () => setQuery(item.mention), children: [
                item.mention,
                " • ",
                item.count
              ] }, item.mention)) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "muted", children: "المنشنات هتظهر هنا تلقائي." }) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { style: { padding: 18 }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { style: { marginTop: 0 }, children: "People discovery" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "grid", gap: 10 }, children: userDiscovery.map((user) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "discovery-user-card", onClick: () => navigate(`/profile/${encodeURIComponent(user.username)}`), children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "discovery-avatar", children: user.avatar ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: user.avatar, alt: user.username }) : "👤" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { textAlign: "start" }, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: user.name || user.username }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "muted", children: [
                    "@",
                    user.username,
                    " • ",
                    user.followers,
                    " متابع"
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "muted", children: user.reason })
                ] })
              ] }, user.id)) })
            ] })
          ] })
        ] }) : null
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
        .yam-search-page-shell {
          box-sizing: border-box;
        }
        .yam-search-input {
          direction: rtl;
          text-align: right;
        }
        .yam-search-subtitle {
          line-height: 1.7;
        }
        .yam-search-results-layout {
          height: 100%;
        }
        .search-dashboard-grid { display: grid; grid-template-columns: 1.1fr 0.9fr 1fr; gap: 16px; }
        .advanced-search-grid { display: grid; grid-template-columns: 180px repeat(2, auto) 1fr 1fr; gap: 10px; align-items: center; }
        .search-select-field { display: grid; gap: 6px; color: #cbd5e1; font-size: 13px; }
        .search-select-field select {
          border-radius: 14px; padding: 12px 14px; border: 1px solid rgba(148,163,184,0.18);
          background: rgba(15,23,42,0.68); color: white;
        }
        .search-inline-toggle { display: flex; align-items: center; gap: 8px; color: #cbd5e1; font-size: 13px; }
        .discovery-row, .trending-row, .discovery-user-card {
          width: 100%; border: 1px solid rgba(148,163,184,0.14); background: rgba(15,23,42,0.45); color: white;
          border-radius: 16px; padding: 14px 16px; display: flex; align-items: center; justify-content: space-between;
          text-align: inherit; cursor: pointer; gap: 12px;
        }
        .discovery-user-card { justify-content: flex-start; }
        .discovery-avatar {
          width: 48px; height: 48px; border-radius: 16px; overflow: hidden; display: grid; place-items: center;
          background: rgba(59,130,246,0.14); flex-shrink: 0;
        }
        .discovery-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .score-pill, .micro-chip {
          display: inline-flex; align-items: center; justify-content: center; padding: 4px 12px; border-radius: 999px;
          background: rgba(59,130,246,0.14); color: #93c5fd; border: 1px solid rgba(147,197,253,0.3); font-size: 11px;
        }
        .micro-chip { cursor: pointer; }
        .micro-chip.mention { background: rgba(168,85,247,0.14); color: #d8b4fe; border-color: rgba(216,180,254,0.35); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @media (max-width: 980px) {
          .yam-search-page-shell {
            padding: 14px !important;
            min-height: auto !important;
          }
          .search-dashboard-grid,
          .advanced-search-grid,
          .yam-search-results-layout {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 640px) {
          .yam-search-page-shell {
            padding: 12px 12px 96px !important;
          }
          .yam-search-subtitle {
            font-size: 13px;
          }
        }
      ` })
  ] });
}
export {
  Search as default
};

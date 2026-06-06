import { A as API } from "../index-Dz8FA2T4.js";
const ARABIC_DIACRITICS = /[\u064B-\u065F\u0670\u06D6-\u06ED]/g;
const NON_TEXT = /[^\p{L}\p{N}#@._\s-]/gu;
function normalizeSearchText(value = "") {
  return String(value || "").toLowerCase().replace(ARABIC_DIACRITICS, "").replace(/[أإآ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/ؤ/g, "و").replace(/ئ/g, "ي").replace(/ـ/g, "").replace(NON_TEXT, " ").replace(/\s+/g, " ").trim();
}
function tokenize(value = "") {
  return normalizeSearchText(value).split(" ").filter(Boolean);
}
function levenshteinDistance(a = "", b = "") {
  const left = normalizeSearchText(a);
  const right = normalizeSearchText(b);
  if (!left) return right.length;
  if (!right) return left.length;
  const matrix = Array.from({ length: left.length + 1 }, () => Array(right.length + 1).fill(0));
  for (let i = 0; i <= left.length; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= right.length; j += 1) matrix[0][j] = j;
  for (let i = 1; i <= left.length; i += 1) {
    for (let j = 1; j <= right.length; j += 1) {
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[left.length][right.length];
}
function fuzzyScore(query = "", candidate = "") {
  const q = normalizeSearchText(query);
  const text = normalizeSearchText(candidate);
  if (!q || !text) return 0;
  if (q === text) return 1;
  if (text.startsWith(q)) return 0.96;
  if (text.includes(q)) return 0.9;
  const qTokens = tokenize(q);
  const cTokens = tokenize(text);
  const tokenHits = qTokens.reduce((score, token) => {
    if (cTokens.some((item) => item.startsWith(token))) return score + 0.22;
    if (cTokens.some((item) => item.includes(token))) return score + 0.16;
    return score;
  }, 0);
  const distance = levenshteinDistance(q, text.slice(0, Math.max(q.length, Math.min(text.length, q.length + 8))));
  const distanceScore = Math.max(0, 1 - distance / Math.max(q.length, text.length, 1));
  return Math.min(0.89, Math.max(tokenHits, distanceScore * 0.78));
}
function extractHashtags(text = "") {
  return Array.from(new Set((String(text || "").match(/#[\p{L}\p{N}_-]+/gu) || []).map((item) => item.toLowerCase())));
}
function groupSearchResults(entries = []) {
  return entries.reduce((acc, item) => {
    const key = item.type || "all";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});
}
function hoursSince(value) {
  const timestamp = new Date(value || Date.now()).getTime();
  return Math.max(1, (Date.now() - timestamp) / 36e5);
}
function scoreSuggestedUser(user = {}) {
  const followers = Number(user.followers_count || 0);
  const engagement = Number(user.engagement_rate || 0);
  const mutual = Number(user.mutual_followers || user.mutual_count || 0);
  const posts = Number(user.posts_count || 0);
  const verifiedBoost = user.is_verified ? 20 : 0;
  const freshnessBoost = user.last_active_at ? Math.max(0, 24 - hoursSince(user.last_active_at)) : 4;
  return Number((followers * 0.04 + engagement * 1.5 + mutual * 4 + posts * 0.25 + verifiedBoost + freshnessBoost).toFixed(2));
}
function scoreReel(reel = {}) {
  const likes = Number(reel.likes_count || 0);
  const comments = Number(reel.comments_count || 0);
  const shares = Number(reel.share_count || 0);
  const saves = Number(reel.saved_count || 0);
  const views = Number(reel.views_count || reel.view_count || 0);
  const completionRate = Number(reel.completion_rate || reel.watch_ratio || 0.55);
  const freshness = Math.max(12, 140 / hoursSince(reel.created_at));
  return Number((likes * 1.8 + comments * 2.4 + shares * 3.1 + saves * 2.6 + views * 0.018 + completionRate * 90 + freshness).toFixed(2));
}
function buildTrendingHashtags(posts = []) {
  const counter = /* @__PURE__ */ new Map();
  posts.forEach((post) => {
    const list = Array.isArray(post.hashtags) && post.hashtags.length ? post.hashtags.map((item) => String(item).startsWith("#") ? item : `#${item}`) : extractHashtags(`${post.content || ""} ${post.description || ""}`);
    list.forEach((tag) => {
      const current = counter.get(tag) || { tag, count: 0, engagement: 0 };
      current.count += 1;
      current.engagement += Number(post.likes_count || 0) + Number(post.comments_count || 0) + Number(post.share_count || 0);
      counter.set(tag, current);
    });
  });
  return Array.from(counter.values()).map((item) => ({
    ...item,
    score: item.count * 8 + item.engagement
  })).sort((a, b) => b.score - a.score).slice(0, 12);
}
function rankSuggestedUsers(users = [], currentUsername = "") {
  return [...users].filter((user) => (user.username || user.name) && (user.username || user.name) !== currentUsername).map((user) => ({
    ...user,
    username: user.username || user.name,
    recommendation_score: scoreSuggestedUser(user),
    recommendation_reason: user.mutual_followers ? `${user.mutual_followers} متابع مشترك` : user.interest_match ? `تطابق اهتمامات ${Math.round(Number(user.interest_match) * 100)}%` : user.is_verified ? "حساب موثّق نشط" : "نشاط قوي هذا الأسبوع"
  })).sort((a, b) => b.recommendation_score - a.recommendation_score);
}
function rankReels(reels = []) {
  return [...reels].map((reel) => ({
    ...reel,
    ranking_score: scoreReel(reel),
    trending_badge: Number(reel.views_count || reel.view_count || 0) > 2e4 ? "Trending" : Number(reel.likes_count || 0) > 2e3 ? "Hot" : "Fresh",
    hashtags: reel.hashtags || extractHashtags(`${reel.content || ""} ${reel.caption || ""}`)
  })).sort((a, b) => b.ranking_score - a.ranking_score);
}
async function fetchSuggestedReels(reels = []) {
  try {
    const { data } = await API.get("/recommendations/reels", { params: { limit: 20 } });
    const remote = Array.isArray(data) ? data : data?.items || [];
    if (remote.length) return rankReels(remote);
  } catch {
  }
  return rankReels(reels).slice(0, 20);
}
export {
  fuzzyScore as a,
  buildTrendingHashtags as b,
  extractHashtags as e,
  fetchSuggestedReels as f,
  groupSearchResults as g,
  normalizeSearchText as n,
  rankSuggestedUsers as r,
  tokenize as t
};

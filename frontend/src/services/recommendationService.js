import API from '../api/axios.js';
import { extractHashtags, normalizeSearchText } from '../utils/fuzzySearch.js';

function hoursSince(value) {
  const timestamp = new Date(value || Date.now()).getTime();
  return Math.max(1, (Date.now() - timestamp) / 36e5);
}

export function scoreSuggestedUser(user = {}) {
  const followers = Number(user.followers_count || 0);
  const engagement = Number(user.engagement_rate || 0);
  const mutual = Number(user.mutual_followers || user.mutual_count || 0);
  const posts = Number(user.posts_count || 0);
  const verifiedBoost = user.is_verified ? 20 : 0;
  const freshnessBoost = user.last_active_at ? Math.max(0, 24 - hoursSince(user.last_active_at)) : 4;
  return Number((followers * 0.04 + engagement * 1.5 + mutual * 4 + posts * 0.25 + verifiedBoost + freshnessBoost).toFixed(2));
}

export function scoreReel(reel = {}) {
  const likes = Number(reel.likes_count || 0);
  const comments = Number(reel.comments_count || 0);
  const shares = Number(reel.share_count || 0);
  const saves = Number(reel.saved_count || 0);
  const views = Number(reel.views_count || reel.view_count || 0);
  const completionRate = Number(reel.completion_rate || reel.watch_ratio || 0.55);
  const freshness = Math.max(12, 140 / hoursSince(reel.created_at));
  return Number((likes * 1.8 + comments * 2.4 + shares * 3.1 + saves * 2.6 + views * 0.018 + completionRate * 90 + freshness).toFixed(2));
}

export function buildTrendingHashtags(posts = []) {
  const counter = new Map();
  posts.forEach((post) => {
    const list = Array.isArray(post.hashtags) && post.hashtags.length
      ? post.hashtags.map((item) => String(item).startsWith('#') ? item : `#${item}`)
      : extractHashtags(`${post.content || ''} ${post.description || ''}`);
    list.forEach((tag) => {
      const current = counter.get(tag) || { tag, count: 0, engagement: 0 };
      current.count += 1;
      current.engagement += Number(post.likes_count || 0) + Number(post.comments_count || 0) + Number(post.share_count || 0);
      counter.set(tag, current);
    });
  });

  return Array.from(counter.values())
    .map((item) => ({
      ...item,
      score: item.count * 8 + item.engagement,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);
}

export function rankSuggestedUsers(users = [], currentUsername = '') {
  return [...users]
    .filter((user) => (user.username || user.name) && (user.username || user.name) !== currentUsername)
    .map((user) => ({
      ...user,
      username: user.username || user.name,
      recommendation_score: scoreSuggestedUser(user),
      recommendation_reason: user.mutual_followers
        ? `${user.mutual_followers} متابع مشترك`
        : user.interest_match
          ? `تطابق اهتمامات ${Math.round(Number(user.interest_match) * 100)}%`
          : user.is_verified
            ? 'حساب موثّق نشط'
            : 'نشاط قوي هذا الأسبوع',
    }))
    .sort((a, b) => b.recommendation_score - a.recommendation_score);
}

export function rankReels(reels = []) {
  return [...reels]
    .map((reel) => ({
      ...reel,
      ranking_score: scoreReel(reel),
      trending_badge: Number(reel.views_count || reel.view_count || 0) > 20000 ? 'Trending' : Number(reel.likes_count || 0) > 2000 ? 'Hot' : 'Fresh',
      hashtags: reel.hashtags || extractHashtags(`${reel.content || ''} ${reel.caption || ''}`),
    }))
    .sort((a, b) => b.ranking_score - a.ranking_score);
}

export async function fetchSuggestedUsers(users = [], currentUsername = '') {
  try {
    const { data } = await API.get('/recommendations/users', { params: { limit: 12 } });
    const remote = Array.isArray(data) ? data : data?.items || [];
    if (remote.length) return rankSuggestedUsers(remote, currentUsername);
  } catch {
    // fall back to local ranking
  }
  return rankSuggestedUsers(users, currentUsername).slice(0, 12);
}

export async function fetchSuggestedReels(reels = []) {
  try {
    const { data } = await API.get('/recommendations/reels', { params: { limit: 20 } });
    const remote = Array.isArray(data) ? data : data?.items || [];
    if (remote.length) return rankReels(remote);
  } catch {
    // fall back to local ranking
  }
  return rankReels(reels).slice(0, 20);
}

export async function fetchTrendingTopics(posts = []) {
  try {
    const { data } = await API.get('/recommendations/trending', { params: { limit: 10 } });
    const remote = Array.isArray(data) ? data : data?.items || [];
    if (remote.length) {
      return remote.map((item) => ({
        tag: item.tag || item.name,
        count: item.count || item.posts_count || 0,
        score: item.score || 0,
      }));
    }
  } catch {
    // local fallback
  }
  return buildTrendingHashtags(posts);
}

export function explainRecommendation(item = {}) {
  const terms = [item.title, item.name, item.description, ...(item.hashtags || [])]
    .map((value) => normalizeSearchText(value))
    .filter(Boolean);
  return terms.slice(0, 3).join(' • ');
}

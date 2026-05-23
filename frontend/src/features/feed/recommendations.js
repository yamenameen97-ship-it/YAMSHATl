import API from '../../api/axios.js';
import { normalizeSearchText } from '../../utils/fuzzySearch.js';
import { dedupePosts, dedupeUsers } from './deduplication.js';
import { getProfileInterests, scorePostPersonalization } from './personalization.js';
import { rankFeedPosts } from './ranking.js';
import { buildTrendingHashtags } from './trending.js';
import { detectMediaType, getPostAuthor, getPostTopics, getUserId, hoursSince, safeNumber } from './utils.js';

function collectUserTopics(user = {}) {
  const interests = Array.isArray(user.interests) ? user.interests : [];
  const bioTokens = normalizeSearchText(`${user.bio || ''} ${user.description || ''} ${user.tagline || ''}`)
    .split(' ')
    .filter((token) => token.length > 2);
  return Array.from(new Set([...interests.map((item) => normalizeSearchText(item)), ...bioTokens].filter(Boolean)));
}

export function scoreSuggestedUser(user = {}, context = {}) {
  const profile = context.profile || {};
  const currentUsername = String(context.currentUsername || '').trim();
  const username = String(user.username || user.name || '').trim();
  if (!username || username === currentUsername) return Number.NEGATIVE_INFINITY;

  const followers = safeNumber(user.followers_count);
  const engagement = safeNumber(user.engagement_rate || user.avg_engagement);
  const mutual = safeNumber(user.mutual_followers || user.mutual_count);
  const posts = safeNumber(user.posts_count);
  const freshness = user.last_active_at ? Math.max(0, 24 - hoursSince(user.last_active_at)) : 2;
  const verifiedBoost = user.is_verified ? 10 : 0;
  const followingPenalty = user.following ? 12 : 0;

  const userTopics = collectUserTopics(user);
  const profileTopics = new Set(getProfileInterests(profile, 15));
  const topicOverlap = userTopics.reduce((sum, topic) => sum + (profileTopics.has(topic) ? 1 : 0), 0);

  return Number((
    followers * 0.035 +
    engagement * 1.6 +
    mutual * 4.8 +
    posts * 0.22 +
    freshness * 1.4 +
    verifiedBoost +
    topicOverlap * 7 -
    followingPenalty
  ).toFixed(2));
}

export function buildSuggestedUsers(users = [], context = {}) {
  return dedupeUsers(users)
    .map((user) => {
      const recommendationScore = scoreSuggestedUser(user, context);
      const userTopics = collectUserTopics(user);
      const profileTopics = new Set(getProfileInterests(context.profile || {}, 12));
      const overlap = userTopics.filter((topic) => profileTopics.has(topic));

      let reason = 'نشاط قوي هذا الأسبوع';
      if (safeNumber(user.mutual_followers || user.mutual_count) > 0) {
        reason = `${safeNumber(user.mutual_followers || user.mutual_count)} متابع مشترك`;
      } else if (overlap.length) {
        reason = `اهتمامات مشتركة: ${overlap.slice(0, 2).join(' • ')}`;
      } else if (user.is_verified) {
        reason = 'حساب موثّق ونشط';
      }

      return {
        ...user,
        id: user.id || getUserId(user),
        username: user.username || user.name || getUserId(user),
        recommendation_score: recommendationScore,
        recommendation_reason: reason,
      };
    })
    .filter((user) => Number.isFinite(user.recommendation_score))
    .sort((a, b) => b.recommendation_score - a.recommendation_score);
}

export function buildPostRecommendations(posts = [], context = {}) {
  return rankFeedPosts(dedupePosts(posts), context)
    .map((post) => ({
      ...post,
      recommendation_score: Number((post.feed_score + scorePostPersonalization(post, context.profile || {})).toFixed(2)),
      recommendation_reason: post.ranking_reason,
    }))
    .sort((a, b) => b.recommendation_score - a.recommendation_score);
}

export async function fetchSuggestedUsers(users = [], currentUsername = '', context = {}) {
  const local = buildSuggestedUsers(users, { ...context, currentUsername });
  try {
    const { data } = await API.get('/recommendations/users', { params: { limit: 12 } });
    const remote = Array.isArray(data) ? data : data?.items || [];
    if (!remote.length) return local.slice(0, 12);
    return buildSuggestedUsers([...remote, ...local], { ...context, currentUsername }).slice(0, 12);
  } catch {
    return local.slice(0, 12);
  }
}

export function buildTrendingFeedTopics(posts = [], options = {}) {
  return buildTrendingHashtags(posts, options);
}

export async function fetchTrendingTopics(posts = []) {
  const local = buildTrendingFeedTopics(posts, { limit: 10 });
  try {
    const { data } = await API.get('/recommendations/trending', { params: { limit: 10 } });
    const remote = Array.isArray(data) ? data : data?.items || [];
    if (!remote.length) return local;
    const merged = [...remote.map((item) => ({
      tag: item.tag || item.name,
      count: item.count || item.posts_count || 0,
      engagement: item.engagement || 0,
      velocity: item.velocity || 0,
      score: item.score || 0,
    })), ...local];
    const keyed = new Map();
    merged.forEach((item) => {
      if (!item?.tag) return;
      const current = keyed.get(item.tag) || { ...item, count: 0, engagement: 0, velocity: 0, score: 0 };
      keyed.set(item.tag, {
        ...current,
        ...item,
        count: Math.max(current.count || 0, item.count || 0),
        engagement: Math.max(current.engagement || 0, item.engagement || 0),
        velocity: Math.max(current.velocity || 0, item.velocity || 0),
        score: Math.max(current.score || 0, item.score || 0),
      });
    });
    return Array.from(keyed.values()).sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 10);
  } catch {
    return local;
  }
}

export function scoreReel(reel = {}) {
  const likes = safeNumber(reel.likes_count);
  const comments = safeNumber(reel.comments_count);
  const shares = safeNumber(reel.share_count);
  const saves = safeNumber(reel.saved_count);
  const views = safeNumber(reel.views_count || reel.view_count);
  const completionRate = safeNumber(reel.completion_rate || reel.watch_ratio, 0.55);
  const freshness = Math.max(10, 120 / Math.max(1, hoursSince(reel.created_at)));
  return Number((likes * 1.8 + comments * 2.4 + shares * 3.1 + saves * 2.6 + views * 0.018 + completionRate * 90 + freshness).toFixed(2));
}

export function rankReels(reels = []) {
  return [...(reels || [])]
    .map((reel) => ({
      ...reel,
      ranking_score: scoreReel(reel),
      media_type: detectMediaType(reel),
      author: getPostAuthor(reel),
      hashtags: reel.hashtags || getPostTopics(reel).filter((topic) => String(topic).startsWith('#')),
      trending_badge: safeNumber(reel.views_count || reel.view_count) > 20000 ? 'Trending' : safeNumber(reel.likes_count) > 2000 ? 'Hot' : 'Fresh',
    }))
    .sort((a, b) => b.ranking_score - a.ranking_score);
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

export function explainRecommendation(item = {}) {
  const terms = [item.title, item.name, item.description, ...(item.hashtags || [])]
    .map((value) => normalizeSearchText(value))
    .filter(Boolean);
  return terms.slice(0, 3).join(' • ');
}

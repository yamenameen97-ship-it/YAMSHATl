import { detectMediaType, getPostAuthor, getPostId, getPostTopics } from './utils.js';

const PROFILE_STORAGE_KEY = 'yamshat.feed.profile.v2';
const MAX_RECENT_POSTS = 120;
const INTERACTION_WEIGHTS = {
  impression: 0.35,
  view: 0.5,
  like: 1.4,
  comment: 1.8,
  save: 2.2,
  share: 2.4,
  dismiss: -1.2,
  hide: -2,
};

function isBrowser() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function normalizeProfile(profile = {}) {
  return {
    interests: { ...(profile.interests || {}) },
    authors: { ...(profile.authors || {}) },
    media: {
      text: Number(profile.media?.text || 0),
      image: Number(profile.media?.image || 0),
      video: Number(profile.media?.video || 0),
    },
    recentPostIds: Array.isArray(profile.recentPostIds) ? profile.recentPostIds.slice(0, MAX_RECENT_POSTS) : [],
    updatedAt: Number(profile.updatedAt || Date.now()),
  };
}

export function getFeedProfile() {
  if (!isBrowser()) return normalizeProfile();
  try {
    return normalizeProfile(JSON.parse(window.localStorage.getItem(PROFILE_STORAGE_KEY) || '{}'));
  } catch {
    return normalizeProfile();
  }
}

export function persistFeedProfile(profile = {}) {
  const normalized = normalizeProfile(profile);
  if (!isBrowser()) return normalized;
  try {
    window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify({
      ...normalized,
      updatedAt: Date.now(),
    }));
  } catch {
    // ignore storage failures
  }
  return normalized;
}

export function buildFeedProfile({ posts = [], currentUsername = '', explicitInterests = [] } = {}) {
  const stored = getFeedProfile();
  const profile = normalizeProfile(stored);

  explicitInterests
    .filter(Boolean)
    .slice(0, 30)
    .forEach((interest) => {
      profile.interests[interest] = Number(profile.interests[interest] || 0) + 1.5;
    });

  (posts || [])
    .filter((post) => getPostAuthor(post) === currentUsername)
    .slice(0, 20)
    .forEach((post) => {
      getPostTopics(post).forEach((topic) => {
        profile.interests[topic] = Number(profile.interests[topic] || 0) + 0.6;
      });
      const mediaType = detectMediaType(post);
      profile.media[mediaType] = Number(profile.media[mediaType] || 0) + 0.4;
    });

  return profile;
}

export function recordFeedInteraction({ type = 'view', post = {}, user = {} } = {}) {
  const weight = Number(INTERACTION_WEIGHTS[type] ?? INTERACTION_WEIGHTS.view);
  const nextProfile = getFeedProfile();
  const author = getPostAuthor(post) || user.username || user.name || '';
  const postId = getPostId(post);

  getPostTopics(post).forEach((topic) => {
    nextProfile.interests[topic] = Number(nextProfile.interests[topic] || 0) + weight;
  });

  if (author) {
    nextProfile.authors[author] = Number(nextProfile.authors[author] || 0) + weight;
  }

  const mediaType = detectMediaType(post);
  nextProfile.media[mediaType] = Number(nextProfile.media[mediaType] || 0) + weight;

  if (postId) {
    nextProfile.recentPostIds = [postId, ...nextProfile.recentPostIds.filter((item) => item !== postId)].slice(0, MAX_RECENT_POSTS);
  }

  return persistFeedProfile(nextProfile);
}

export function getProfileInterests(profile = {}, limit = 10) {
  return Object.entries(profile.interests || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([topic]) => topic);
}

export function scorePostPersonalization(post = {}, profile = {}) {
  const normalized = normalizeProfile(profile);
  const topics = getPostTopics(post);
  const topicScore = topics.reduce((sum, topic) => sum + Number(normalized.interests[topic] || 0), 0);
  const authorScore = Number(normalized.authors[getPostAuthor(post)] || 0);
  const mediaScore = Number(normalized.media[detectMediaType(post)] || 0);
  const seenPenalty = normalized.recentPostIds.includes(getPostId(post)) ? 4.5 : 0;
  return Number((topicScore * 2.4 + authorScore * 2 + mediaScore * 1.2 - seenPenalty).toFixed(2));
}

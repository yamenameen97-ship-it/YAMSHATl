import { dedupePosts } from './deduplication.js';
import { getEngagementSummary, getPostTopics, hoursSince } from './utils.js';

export function buildTrendingHashtags(posts = [], options = {}) {
  const limit = Number(options.limit || 12);
  const counter = new Map();

  dedupePosts(posts).forEach((post) => {
    const { likes, comments, shares, saves, views } = getEngagementSummary(post);
    const ageHours = hoursSince(post.created_at || post.updated_at || Date.now());
    const velocity = (likes * 1.4 + comments * 2 + shares * 2.6 + saves * 1.8 + views * 0.03) / Math.max(1, ageHours);

    getPostTopics(post)
      .filter((topic) => String(topic).startsWith('#'))
      .forEach((tag) => {
        const current = counter.get(tag) || { tag, count: 0, engagement: 0, velocity: 0 };
        current.count += 1;
        current.engagement += likes + comments + shares + saves;
        current.velocity += velocity;
        counter.set(tag, current);
      });
  });

  return Array.from(counter.values())
    .map((item) => ({
      ...item,
      score: Number((item.count * 7 + item.engagement * 0.45 + item.velocity).toFixed(2)),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function buildTrendingPosts(posts = [], options = {}) {
  const limit = Number(options.limit || 5);

  return dedupePosts(posts)
    .map((post) => {
      const { likes, comments, shares, saves, views } = getEngagementSummary(post);
      const ageHours = hoursSince(post.created_at || post.updated_at || Date.now());
      const momentum = (likes * 1.3 + comments * 1.9 + shares * 2.2 + saves * 1.7 + views * 0.025) / Math.max(1, Math.sqrt(ageHours));
      return {
        ...post,
        trending_score: Number(momentum.toFixed(2)),
      };
    })
    .sort((a, b) => b.trending_score - a.trending_score)
    .slice(0, limit);
}

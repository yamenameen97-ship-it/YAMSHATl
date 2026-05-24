import { dedupePosts } from './deduplication.js';
import { scorePostPersonalization } from './personalization.js';
import {
  clamp,
  detectMediaType,
  getEngagementSummary,
  getPostAuthor,
  hoursSince,
  logarithmicScore,
  safeNumber,
} from './utils.js';

function getFreshnessScore(post = {}) {
  const ageHours = hoursSince(post.created_at || post.updated_at || Date.now());
  return clamp(70 / Math.pow(ageHours + 1, 0.58), 0, 48);
}

function getEngagementScore(post = {}) {
  const { likes, comments, shares, saves, views } = getEngagementSummary(post);
  return (
    logarithmicScore(likes, 11.5) +
    logarithmicScore(comments, 14) +
    logarithmicScore(shares, 16) +
    logarithmicScore(saves, 13) +
    logarithmicScore(views, 5)
  );
}

function getContentPriorityScore(post = {}) {
  const mediaType = detectMediaType(post);
  const contentLength = String(post.content || post.description || post.caption || '').trim().length;
  const textDepth = clamp(contentLength / 220, 0, 1) * 5;
  const mediaBoost = mediaType === 'video' ? 10 : mediaType === 'image' ? 6 : 2;
  const verifiedBoost = post.is_verified ? 6 : 0;
  const pinnedBoost = post.is_pinned || post.is_brand_seed ? 12 : 0;
  const pollBoost = post.poll || post.poll_options ? 4 : 0;
  const liveBoost = String(post.type || '').toLowerCase().includes('live') ? 8 : 0;
  return mediaBoost + textDepth + verifiedBoost + pinnedBoost + pollBoost + liveBoost;
}

export function scoreFeedPost(post = {}, context = {}) {
  const personalization = scorePostPersonalization(post, context.profile || {});
  const freshness = getFreshnessScore(post);
  const engagement = getEngagementScore(post);
  const priority = getContentPriorityScore(post);
  const author = getPostAuthor(post);
  const authorBoost = (context.preferredAuthors || []).includes(author) ? 8 : 0;
  const authoredPenalty = author && context.recentAuthors?.[author] ? context.recentAuthors[author] * 9 : 0;

  const total = Number((engagement + freshness + priority + personalization + authorBoost - authoredPenalty).toFixed(2));
  return {
    ...post,
    feed_score: total,
    ranking_breakdown: {
      engagement: Number(engagement.toFixed(2)),
      freshness: Number(freshness.toFixed(2)),
      priority: Number(priority.toFixed(2)),
      personalization: Number(personalization.toFixed(2)),
      authorBoost,
      authoredPenalty,
    },
    ranking_reason: personalization > engagement
      ? 'مطابق لاهتماماتك الحالية'
      : freshness > 18
        ? 'حديث ويتحرك بسرعة'
        : priority > 12
          ? 'محتوى غني وله أولوية'
          : 'أداءه جيد مقارنة بباقي المنشورات',
  };
}

export function rankFeedPosts(posts = [], context = {}) {
  const uniquePosts = dedupePosts(posts);
  const baseRanked = uniquePosts
    .map((post) => scoreFeedPost(post, context))
    .sort((a, b) => b.feed_score - a.feed_score);

  const queue = [...baseRanked];
  const result = [];
  const recentAuthors = {};

  while (queue.length) {
    let selectedIndex = 0;
    let selectedScore = Number.NEGATIVE_INFINITY;
    const lookahead = Math.min(queue.length, 6);

    for (let index = 0; index < lookahead; index += 1) {
      const item = queue[index];
      const author = getPostAuthor(item);
      const authorPenalty = safeNumber(recentAuthors[author]) * 8;
      const previousMediaType = result.length ? detectMediaType(result[result.length - 1]) : '';
      const repeatedMediaPenalty = previousMediaType && previousMediaType === detectMediaType(item) ? 4 : 0;
      const adjustedScore = item.feed_score - authorPenalty - repeatedMediaPenalty;
      if (adjustedScore > selectedScore) {
        selectedScore = adjustedScore;
        selectedIndex = index;
      }
    }

    const [selected] = queue.splice(selectedIndex, 1);
    const author = getPostAuthor(selected);
    if (author) recentAuthors[author] = safeNumber(recentAuthors[author]) + 1;
    result.push({
      ...selected,
      ranking_position: result.length + 1,
      feed_score: Number(selectedScore.toFixed(2)),
    });
  }

  return result;
}

export function buildRecommendations(items = [], user = {}) {
  return items
    .filter((item) => item.category === user.interest)
    .slice(0, 20);
}

export function buildTrending(items = []) {
  return items.sort((a, b) => (b.views || 0) - (a.views || 0));
}

export function personalizedFeed(posts = [], profile = {}) {
  return posts.filter(
    (post) => post.topic === profile.favoriteTopic
  );
}

export function aiModeration(content = '') {
  const blocked = ['spam', 'abuse', 'hate'];
  return blocked.some((w) =>
    String(content).toLowerCase().includes(w)
  );
}

export function aiCaption(media = {}) {
  return `AI caption for ${media.type || 'media'}`;
}

export function aiTranslate(text = '', lang = 'en') {
  return {
    translated: text,
    target: lang,
  };
}

export function aiSearchRanking(results = []) {
  return results.sort((a, b) => (b.score || 0) - (a.score || 0));
}
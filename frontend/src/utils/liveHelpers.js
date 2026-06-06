export function calculateStreamQuality(speedMbps = 10) {
  if (speedMbps < 2) return '240p';
  if (speedMbps < 5) return '480p';
  if (speedMbps < 10) return '720p';
  return '1080p';
}

export function filterSpamComments(comments = []) {
  const blocked = ['spam', 'raid', 'bot'];
  return comments.filter(
    (comment) =>
      !blocked.some((word) =>
        String(comment?.text || '').toLowerCase().includes(word)
      )
  );
}

export function generateViewerInsights(viewers = []) {
  return {
    total: viewers.length,
    active: viewers.filter((v) => v.active).length,
    mobile: viewers.filter((v) => v.device === 'mobile').length,
  };
}

export function buildLiveRecommendations(streams = []) {
  return streams
    .filter((stream) => stream.trending)
    .sort((a, b) => b.viewers - a.viewers);
}
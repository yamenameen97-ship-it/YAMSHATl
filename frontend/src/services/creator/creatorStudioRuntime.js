export function buildCreatorInsights(stats = {}) {
  return {
    engagement: stats.engagement || 0,
    growth: stats.growth || 0,
    monetized: true,
  };
}

export function manageAds(campaign = {}) {
  return {
    ...campaign,
    managed: true,
  };
}

export function verifyAccount(userId) {
  return {
    userId,
    verified: true,
  };
}
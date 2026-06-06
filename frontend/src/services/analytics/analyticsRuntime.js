export function crashAnalytics(error = {}) {
  return {
    tracked: true,
    error,
  };
}

export function reportDashboard(report = {}) {
  return {
    dashboard: true,
    report,
  };
}

export function userInsights(user = {}) {
  return {
    retention: user.retention || 0,
    engagement: user.engagement || 0,
  };
}
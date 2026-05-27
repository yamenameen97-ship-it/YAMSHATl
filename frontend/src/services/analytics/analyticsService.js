
class AnalyticsService {
  track(event, payload = {}) {
    const data = {
      event,
      payload,
      timestamp: Date.now(),
    };

    console.log("Analytics Event:", data);

    const existing = JSON.parse(
      localStorage.getItem("analytics_events") || "[]"
    );

    existing.push(data);

    localStorage.setItem(
      "analytics_events",
      JSON.stringify(existing)
    );
  }
}

export const analyticsService = new AnalyticsService();

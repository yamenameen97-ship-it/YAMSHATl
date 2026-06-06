export function generateSitemap(routes = []) {
  return routes.map((route) => ({
    url: route,
    indexed: true,
  }));
}

export function buildMetadata(data = {}) {
  return {
    title: data.title || '',
    description: data.description || '',
    structured: true,
  };
}

export function optimizeSSR() {
  return {
    streamingSSR: true,
    hydrationOptimized: true,
  };
}
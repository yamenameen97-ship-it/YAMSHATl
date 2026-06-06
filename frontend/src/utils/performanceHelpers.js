export function buildAdaptiveImage(src, width = 1080) {
  return `${src}?w=${width}&adaptive=true`;
}

export function buildCDNUrl(src) {
  return `https://cdn.local/${src}`;
}

export function estimateStreamingQuality(speedMbps = 10) {
  if (speedMbps < 3) return '480p';
  if (speedMbps < 8) return '720p';
  return '1080p';
}

export function shouldLazyLoad(index = 0) {
  return index > 2;
}
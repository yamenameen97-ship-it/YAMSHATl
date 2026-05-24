/**
 * Video Optimizer Utility
 * Features: Adaptive streaming helpers, Preload strategies, Cleanup management
 */

const VIDEO_QUALITIES = {
  low: { bitrate: 500, resolution: '360p', width: 640, height: 360 },
  medium: { bitrate: 1500, resolution: '480p', width: 854, height: 480 },
  high: { bitrate: 3000, resolution: '720p', width: 1280, height: 720 },
  ultra: { bitrate: 6000, resolution: '1080p', width: 1920, height: 1080 },
};

const PRELOAD_STRATEGIES = {
  none: 'none',
  metadata: 'metadata',
  auto: 'auto',
};

/**
 * Detects network speed and returns optimal quality
 */
export async function detectNetworkQuality() {
  if (!navigator.connection) {
    return 'high'; // Default to high if API not available
  }

  const connection = navigator.connection;
  const effectiveType = connection.effectiveType;

  switch (effectiveType) {
    case '4g':
      return 'ultra';
    case '3g':
      return 'high';
    case '2g':
      return 'low';
    default:
      return 'medium';
  }
}

/**
 * Gets video quality based on viewport size
 */
export function getQualityForViewport(width = window.innerWidth) {
  if (width < 640) return 'low';
  if (width < 1024) return 'medium';
  if (width < 1920) return 'high';
  return 'ultra';
}

/**
 * Generates HLS playlist for adaptive streaming
 */
export function generateHLSPlaylist(baseUrl, qualities = Object.keys(VIDEO_QUALITIES)) {
  const playlist = ['#EXTM3U', '#EXT-X-VERSION:3', '#EXT-X-TARGETDURATION:10'];

  qualities.forEach((quality) => {
    const config = VIDEO_QUALITIES[quality];
    playlist.push(`#EXT-X-STREAM-INF:BANDWIDTH=${config.bitrate * 1000},RESOLUTION=${config.width}x${config.height}`);
    playlist.push(`${baseUrl}?quality=${quality}`);
  });

  return playlist.join('\n');
}

/**
 * Creates adaptive video element
 */
export function createAdaptiveVideoElement(videoUrl, options = {}) {
  const {
    autoplay = false,
    controls = true,
    muted = false,
    loop = false,
    preload = 'metadata',
    width = '100%',
    height = 'auto',
    className = '',
    poster = null,
  } = options;

  const video = document.createElement('video');
  video.className = `adaptive-video ${className}`;
  video.style.width = width;
  video.style.height = height;
  video.autoplay = autoplay;
  video.controls = controls;
  video.muted = muted;
  video.loop = loop;
  video.preload = preload;
  if (poster) video.poster = poster;

  // Add source
  const source = document.createElement('source');
  source.src = videoUrl;
  source.type = 'video/mp4';
  video.appendChild(source);

  // Add fallback message
  const fallback = document.createTextNode('Your browser does not support the video tag.');
  video.appendChild(fallback);

  return video;
}

/**
 * Implements lazy loading for videos
 */
export function lazyLoadVideo(videoElement, videoUrl, options = {}) {
  const { threshold = 0.5 } = options;

  if (!('IntersectionObserver' in window)) {
    // Fallback: load immediately
    videoElement.src = videoUrl;
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const video = entry.target;
          const source = video.querySelector('source');
          if (source) {
            source.src = videoUrl;
            video.load();
          }
          observer.unobserve(video);
        }
      });
    },
    { threshold }
  );

  observer.observe(videoElement);
  return observer;
}

/**
 * Preloads video metadata
 */
export async function preloadVideoMetadata(videoUrl) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.onloadedmetadata = () => {
      resolve({
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
      });
    };
    video.onerror = () => reject(new Error('Failed to load video metadata'));
    video.src = videoUrl;
    video.load();
  });
}

/**
 * Preloads video for playback
 */
export async function preloadVideo(videoUrl, quality = 'high') {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.oncanplay = () => {
      resolve(video);
    };
    video.onerror = () => reject(new Error('Failed to preload video'));
    video.src = `${videoUrl}?quality=${quality}`;
    video.load();
  });
}

/**
 * Gets optimal preload strategy based on network
 */
export async function getOptimalPreloadStrategy() {
  const quality = await detectNetworkQuality();

  switch (quality) {
    case 'ultra':
    case 'high':
      return PRELOAD_STRATEGIES.auto;
    case 'medium':
      return PRELOAD_STRATEGIES.metadata;
    case 'low':
      return PRELOAD_STRATEGIES.none;
    default:
      return PRELOAD_STRATEGIES.metadata;
  }
}

/**
 * Manages video element cleanup
 */
export function cleanupVideo(videoElement) {
  if (!videoElement) return;

  // Pause and stop playback
  videoElement.pause();
  videoElement.currentTime = 0;

  // Remove sources
  const sources = videoElement.querySelectorAll('source');
  sources.forEach((source) => {
    source.src = '';
    source.remove();
  });

  // Remove event listeners
  videoElement.onplay = null;
  videoElement.onpause = null;
  videoElement.onended = null;
  videoElement.onerror = null;
  videoElement.onloadedmetadata = null;
  videoElement.oncanplay = null;

  // Clear src
  videoElement.src = '';
  videoElement.load();
}

/**
 * Manages multiple video cleanup
 */
export function cleanupVideos(videoElements) {
  videoElements.forEach((video) => cleanupVideo(video));
}

/**
 * Creates video thumbnail
 */
export async function generateVideoThumbnail(videoUrl, time = 0) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.onloadedmetadata = () => {
      video.currentTime = time;
    };
    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      const thumbnail = canvas.toDataURL('image/jpeg', 0.8);
      cleanupVideo(video);
      resolve(thumbnail);
    };
    video.onerror = () => reject(new Error('Failed to generate thumbnail'));
    video.src = videoUrl;
  });
}

/**
 * Generates multiple thumbnails for video
 */
export async function generateVideoThumbnails(videoUrl, count = 5) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    const thumbnails = [];

    video.onloadedmetadata = () => {
      const duration = video.duration;
      const interval = duration / (count + 1);

      const generateNextThumbnail = (index) => {
        if (index >= count) {
          cleanupVideo(video);
          resolve(thumbnails);
          return;
        }

        video.currentTime = interval * (index + 1);
      };

      video.onseeked = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);
        thumbnails.push(canvas.toDataURL('image/jpeg', 0.8));
        generateNextThumbnail(thumbnails.length);
      };

      generateNextThumbnail(0);
    };

    video.onerror = () => reject(new Error('Failed to generate thumbnails'));
    video.src = videoUrl;
  });
}

/**
 * Gets video duration
 */
export async function getVideoDuration(videoUrl) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.onloadedmetadata = () => {
      const duration = video.duration;
      cleanupVideo(video);
      resolve(duration);
    };
    video.onerror = () => reject(new Error('Failed to get video duration'));
    video.src = videoUrl;
  });
}

/**
 * Formats time in seconds to HH:MM:SS
 */
export function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return '0:00';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts = [];
  if (hours > 0) parts.push(hours.toString().padStart(2, '0'));
  parts.push(minutes.toString().padStart(2, '0'));
  parts.push(secs.toString().padStart(2, '0'));

  return parts.join(':');
}

/**
 * Monitors video playback performance
 */
export function monitorVideoPerformance(videoElement, onMetrics) {
  let lastTime = 0;
  let stalls = 0;
  let totalStallTime = 0;

  const monitor = setInterval(() => {
    if (videoElement.paused || videoElement.ended) {
      clearInterval(monitor);
      return;
    }

    const currentTime = videoElement.currentTime;
    const buffered = videoElement.buffered;

    // Check for stalls
    if (currentTime === lastTime && !videoElement.paused) {
      stalls++;
      totalStallTime += 0.1;
    }

    lastTime = currentTime;

    const metrics = {
      currentTime,
      duration: videoElement.duration,
      buffered: buffered.length > 0 ? buffered.end(buffered.length - 1) : 0,
      stalls,
      totalStallTime,
      networkState: videoElement.networkState,
      readyState: videoElement.readyState,
    };

    if (onMetrics) onMetrics(metrics);
  }, 100);

  return () => clearInterval(monitor);
}

export default {
  detectNetworkQuality,
  getQualityForViewport,
  generateHLSPlaylist,
  createAdaptiveVideoElement,
  lazyLoadVideo,
  preloadVideoMetadata,
  preloadVideo,
  getOptimalPreloadStrategy,
  cleanupVideo,
  cleanupVideos,
  generateVideoThumbnail,
  generateVideoThumbnails,
  getVideoDuration,
  formatTime,
  monitorVideoPerformance,
};

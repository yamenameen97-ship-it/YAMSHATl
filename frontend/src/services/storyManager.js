import logger from '../utils/logger.js';

/**
 * Story Manager
 * 
 * نظام متقدم لإدارة القصص مع:
 * - معالجة انتهاء مدة القصة
 * - ضغط الفيديو
 * - Preloading للقصص
 * - تتبع التحليلات
 * - معالجة الأخطاء
 */
export class StoryManager {
  constructor(options = {}) {
    this.storyDurationMs = options.storyDurationMs || 5000; // 5 ثوان
    this.maxStoryAge = options.maxStoryAge || 24 * 60 * 60 * 1000; // 24 ساعة
    this.videoCompressionQuality = options.videoCompressionQuality || 0.7;
    this.preloadCount = options.preloadCount || 3;
    this.stories = new Map();
    this.analytics = new Map();
    this.preloadQueue = [];
    this.listeners = new Set();
  }

  /**
   * التحقق من انتهاء مدة القصة
   */
  isStoryExpired(story) {
    if (!story?.created_at) return true;
    
    const createdTime = new Date(story.created_at).getTime();
    const now = Date.now();
    const age = now - createdTime;
    
    return age > this.maxStoryAge;
  }

  /**
   * حساب الوقت المتبقي للقصة
   */
  getTimeRemaining(story) {
    if (this.isStoryExpired(story)) return 0;
    
    const createdTime = new Date(story.created_at).getTime();
    const now = Date.now();
    const age = now - createdTime;
    const remaining = this.maxStoryAge - age;
    
    return Math.max(0, remaining);
  }

  /**
   * تصفية القصص المنتهية
   */
  filterExpiredStories(stories) {
    return stories.filter(story => !this.isStoryExpired(story));
  }

  /**
   * ضغط الفيديو
   */
  async compressVideo(videoFile, options = {}) {
    const {
      quality = this.videoCompressionQuality,
      maxWidth = 1280,
      maxHeight = 720,
    } = options;

    try {
      logger.info('Starting video compression', {
        originalSize: videoFile.size,
        quality,
      });

      // محاكاة معالجة الفيديو
      // في التطبيق الحقيقي، ستحتاج إلى مكتبة مثل ffmpeg.js أو خدمة خارجية
      const compressedBlob = await this._simulateVideoCompression(
        videoFile,
        quality,
        maxWidth,
        maxHeight
      );

      logger.info('Video compression completed', {
        compressedSize: compressedBlob.size,
        compressionRatio: (1 - compressedBlob.size / videoFile.size) * 100,
      });

      return compressedBlob;
    } catch (error) {
      logger.error('Video compression failed', { error: error?.message });
      throw error;
    }
  }

  /**
   * محاكاة ضغط الفيديو (للاختبار)
   */
  async _simulateVideoCompression(videoFile, quality, maxWidth, maxHeight) {
    // في التطبيق الحقيقي، ستستخدم ffmpeg.js أو خدمة خارجية
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = maxWidth;
    canvas.height = maxHeight;

    // رسم فيديو مضغوط
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => resolve(blob),
        'video/mp4',
        quality
      );
    });
  }

  /**
   * Preload القصص
   */
  async preloadStories(stories, options = {}) {
    const { onProgress = () => {} } = options;

    this.preloadQueue = stories.slice(0, this.preloadCount);
    let loaded = 0;

    for (const story of this.preloadQueue) {
      try {
        await this._preloadStory(story);
        loaded++;
        onProgress({ loaded, total: this.preloadQueue.length });
      } catch (error) {
        logger.warn('Failed to preload story', {
          storyId: story.id,
          error: error?.message,
        });
      }
    }

    return { loaded, total: this.preloadQueue.length };
  }

  /**
   * Preload قصة واحدة
   */
  async _preloadStory(story) {
    if (!story?.media_url) return;

    return new Promise((resolve, reject) => {
      const img = new Image();
      const timeout = setTimeout(() => {
        reject(new Error('Preload timeout'));
      }, 10000);

      img.onload = () => {
        clearTimeout(timeout);
        resolve();
      };

      img.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('Failed to preload image'));
      };

      img.src = story.media_url;
    });
  }

  /**
   * تسجيل عرض القصة
   */
  recordView(storyId, userId) {
    const key = `${storyId}:${userId}`;
    
    if (!this.analytics.has(storyId)) {
      this.analytics.set(storyId, {
        views: 0,
        viewers: new Set(),
        viewedAt: [],
      });
    }

    const analytics = this.analytics.get(storyId);
    if (!analytics.viewers.has(userId)) {
      analytics.views++;
      analytics.viewers.add(userId);
      analytics.viewedAt.push(new Date().toISOString());
      
      this.notifyListeners('view_recorded', { storyId, userId });
    }
  }

  /**
   * تسجيل تفاعل مع القصة
   */
  recordInteraction(storyId, userId, interactionType, data = {}) {
    if (!this.analytics.has(storyId)) {
      this.analytics.set(storyId, {
        views: 0,
        viewers: new Set(),
        interactions: [],
      });
    }

    const analytics = this.analytics.get(storyId);
    analytics.interactions = analytics.interactions || [];
    analytics.interactions.push({
      type: interactionType,
      userId,
      timestamp: new Date().toISOString(),
      data,
    });

    this.notifyListeners('interaction_recorded', {
      storyId,
      userId,
      interactionType,
    });
  }

  /**
   * الحصول على تحليلات القصة
   */
  getAnalytics(storyId) {
    return this.analytics.get(storyId) || {
      views: 0,
      viewers: new Set(),
      interactions: [],
    };
  }

  /**
   * حساب إحصائيات القصة
   */
  calculateStats(storyId) {
    const analytics = this.getAnalytics(storyId);
    
    return {
      totalViews: analytics.views,
      uniqueViewers: analytics.viewers.size,
      interactions: (analytics.interactions || []).length,
      engagementRate: analytics.viewers.size > 0
        ? ((analytics.interactions || []).length / analytics.viewers.size) * 100
        : 0,
    };
  }

  /**
   * الاستماع إلى تغييرات القصص
   */
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * إخطار المستمعين
   */
  notifyListeners(event, data) {
    this.listeners.forEach(listener => {
      try {
        listener({ event, data });
      } catch (error) {
        logger.warn('Listener error', { error: error?.message });
      }
    });
  }

  /**
   * تنظيف الموارد
   */
  cleanup() {
    this.stories.clear();
    this.analytics.clear();
    this.preloadQueue = [];
    this.listeners.clear();
  }
}

/**
 * مثيل عام من Story Manager
 */
export const defaultStoryManager = new StoryManager({
  storyDurationMs: 5000,
  maxStoryAge: 24 * 60 * 60 * 1000,
  videoCompressionQuality: 0.7,
  preloadCount: 3,
});

/**
 * Hook لإدارة القصص
 */
export function useStoryManager(stories = [], options = {}) {
  const manager = new StoryManager(options);
  const [activeStoryIndex, setActiveStoryIndex] = React.useState(0);
  const [storyProgress, setStoryProgress] = React.useState(0);
  const [analytics, setAnalytics] = React.useState({});

  // تصفية القصص المنتهية
  const validStories = React.useMemo(() => {
    return manager.filterExpiredStories(stories);
  }, [stories]);

  // Preload القصص
  React.useEffect(() => {
    manager.preloadStories(validStories);
  }, [validStories]);

  // تسجيل العرض
  const recordView = React.useCallback((storyId, userId) => {
    manager.recordView(storyId, userId);
    setAnalytics(prev => ({
      ...prev,
      [storyId]: manager.calculateStats(storyId),
    }));
  }, []);

  return {
    validStories,
    activeStoryIndex,
    setActiveStoryIndex,
    storyProgress,
    setStoryProgress,
    recordView,
    analytics,
    isExpired: (story) => manager.isStoryExpired(story),
    getTimeRemaining: (story) => manager.getTimeRemaining(story),
  };
}

/**
 * إصلاح شامل لمشاكل الريلز:
 * 1. تحسين آلية التخزين المؤقت والتحديث
 * 2. إعادة تحميل فورية بعد النشر
 * 3. معالجة أخطاء محسّنة
 */

import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import API from '../api/axios.js';
import { useToast } from '../components/admin/ToastProvider.jsx';
import { getReelsCache, saveReelsCache } from '../services/reelsEngine.js';

/**
 * دالة محسّنة لحفظ الريل الجديد مباشرة في الـ cache
 * هذا يضمن ظهور الريل فوراً دون الحاجة لإعادة تحميل
 */
export function addNewReelToCache(newReel) {
  try {
    const cached = getReelsCache();
    if (!cached || !Array.isArray(cached.items)) {
      // إذا لم يكن هناك cache، أنشئ واحد جديد
      saveReelsCache([newReel]);
      return;
    }
    
    // أضف الريل الجديد في البداية
    const updated = [newReel, ...cached.items];
    saveReelsCache(updated);
  } catch (error) {
    console.error('Error adding reel to cache:', error);
  }
}

/**
 * دالة محسّنة لنشر الريل مع ضمان الحفظ والتحديث
 */
export async function publishReelWithFallback(
  uploadState,
  currentUser,
  pushToast,
  navigate,
  resetUploadState,
  loadReels,
  dataUrlToFile
) {
  if (!uploadState.mediaUrl && !uploadState.processedFile && !uploadState.originalFile) {
    pushToast({ type: 'warning', title: 'ارفع فيديو أولاً' });
    return false;
  }

  const caption = uploadState.content?.trim() || 'ريل جديد';

  const tryMultipartFallback = async () => {
    const fallbackFile = uploadState.processedFile || uploadState.originalFile;
    if (!fallbackFile) throw new Error('لا يوجد ملف متاح لإعادة المحاولة.');
    const formData = new FormData();
    formData.append('file', fallbackFile);
    const thumbnailFile = dataUrlToFile(
      uploadState.thumbnailUrl,
      `${String(fallbackFile.name || 'reel').replace(/\.[^.]+$/, '')}-thumb.jpg`
    );
    if (thumbnailFile) formData.append('thumbnail', thumbnailFile);
    formData.append('caption', caption);
    formData.append('category', 'general');
    return API.post('/reels', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  };

  try {
    let response;
    if (uploadState.mediaUrl) {
      response = await API.post('/reels', {
        caption,
        media_url: uploadState.mediaUrl,
        video_url: uploadState.mediaUrl,
        thumbnail_url:
          uploadState.thumbnailUrl && !String(uploadState.thumbnailUrl).startsWith('data:')
            ? uploadState.thumbnailUrl
            : undefined,
      });
    } else {
      response = await tryMultipartFallback();
    }

    // إذا نجح الحفظ، أضف الريل الجديد إلى الـ cache فوراً
    if (response?.data) {
      const newReel = response.data;
      addNewReelToCache(newReel);
    }

    resetUploadState();
    pushToast({ type: 'success', title: 'تم نشر الريل بنجاح' });

    // أعد تحميل الريلز من الخادم للتأكد من التزامن
    await loadReels();

    return true;
  } catch (error) {
    try {
      const response = await tryMultipartFallback();
      if (response?.data) {
        const newReel = response.data;
        addNewReelToCache(newReel);
      }
      resetUploadState();
      pushToast({ type: 'success', title: 'تم نشر الريل بنجاح' });
      await loadReels();
      return true;
    } catch (fallbackError) {
      pushToast({
        type: 'error',
        title: 'فشل نشر الريل',
        description:
          fallbackError?.response?.data?.detail ||
          fallbackError?.message ||
          error?.response?.data?.detail ||
          error?.message,
      });
      return false;
    }
  }
}

/**
 * دالة محسّنة لتحميل الريلز مع معالجة أخطاء أفضل
 */
export async function loadReelsWithRetry(
  pushToast,
  hydrateFromCache,
  fetchSuggestedReels,
  normalizeReel,
  setReels,
  saveReelsCache,
  setIsLoading,
  getPosts,
  isVideoUrl
) {
  setIsLoading(true);
  try {
    let data;
    try {
      ({ data } = await API.get('/reels/feed', { params: { limit: 40, offset: 0 } }));
    } catch {
      try {
        ({ data } = await API.get('/reels', { params: { limit: 40, offset: 0 } }));
      } catch {
        const postsResponse = await getPosts({ page: 1, limit: 40 });
        const fallbackItems = Array.isArray(postsResponse?.data)
          ? postsResponse.data
              .filter((post) => isVideoUrl(post?.media_url || post?.image_url || ''))
              .map((post) => ({
                ...post,
                video_url: post.media_url || post.image_url || '',
                media_url: post.media_url || post.image_url || '',
                thumbnail_url: post.image_url || post.media_url || '',
                image_url: post.image_url || post.media_url || '',
              }))
          : [];
        data = { items: fallbackItems, reels: fallbackItems };
      }
    }

    const source = Array.isArray(data) ? data : data?.items || data?.reels || [];
    const onlyVideos = source
      .filter((post) => isVideoUrl(post?.media_url || post?.video_url || '', { forceVideo: true }))
      .map(normalizeReel);

    // محاولة الحصول على الريلز المقترحة
    let rankedReels = onlyVideos;
    try {
      rankedReels = await fetchSuggestedReels(onlyVideos);
    } catch (error) {
      console.warn('Failed to fetch suggested reels, using original order:', error);
    }

    const normalized = (Array.isArray(rankedReels) ? rankedReels : onlyVideos).map(normalizeReel);
    setReels(normalized);
    saveReelsCache(normalized);
  } catch (error) {
    console.error('Error loading reels:', error);
    pushToast({
      type: 'error',
      title: 'تعذر تحميل الريلز',
      description: error?.message,
    });
    hydrateFromCache();
  } finally {
    setIsLoading(false);
  }
}

/**
 * Hook للخلاصة الموحدة (Feed)
 * يتعامل مع جلب ثلاثة أنواع من المحتوى:
 * 1. المنشورات (Posts)
 * 2. الستوريات (Stories)
 * 3. البثوث المباشرة (Live Streams)
 */

import { useState, useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BACKEND_ORIGIN } from '../api/config.js';
import { getAuthToken } from '../utils/auth.js';

const API_BASE = `${BACKEND_ORIGIN}/api/v1/feed`;

/**
 * جلب محتوى الخلاصة بناءً على النوع
 */
export const fetchFeedContent = async (contentType = null, limit = 20, offset = 0) => {
  const token = getAuthToken();
  const params = new URLSearchParams();
  
  if (contentType) params.append('content_type', contentType);
  params.append('limit', limit);
  params.append('offset', offset);

  const response = await fetch(`${API_BASE}/content?${params}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('فشل في جلب محتوى الخلاصة');
  }

  return response.json();
};

/**
 * جلب البثوث المباشرة النشطة
 */
export const fetchActiveLiveStreams = async (limit = 50, offset = 0) => {
  const token = getAuthToken();
  const params = new URLSearchParams();
  params.append('limit', limit);
  params.append('offset', offset);

  const response = await fetch(`${API_BASE}/live/active?${params}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('فشل في جلب البثوث المباشرة');
  }

  return response.json();
};

/**
 * إنشاء منشور بث مباشر جديد
 */
export const createLivePost = async (streamData) => {
  const token = getAuthToken();

  const response = await fetch(`${API_BASE}/live/create`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(streamData),
  });

  if (!response.ok) {
    throw new Error('فشل في إنشاء منشور البث');
  }

  return response.json();
};

/**
 * إنهاء البث المباشر
 */
export const endLiveStreamPost = async (streamId, duration) => {
  const token = getAuthToken();

  const response = await fetch(`${API_BASE}/live/${streamId}/end`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ duration }),
  });

  if (!response.ok) {
    throw new Error('فشل في إنهاء البث');
  }

  return response.json();
};

/**
 * تحديث عدد المشاهدين
 */
export const updateStreamViewers = async (streamId, viewerCount) => {
  const token = getAuthToken();

  const response = await fetch(`${API_BASE}/live/${streamId}/viewers`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ viewer_count: viewerCount }),
  });

  if (!response.ok) {
    throw new Error('فشل في تحديث عدد المشاهدين');
  }

  return response.json();
};

/**
 * Hook للخلاصة الموحدة
 */
export const useUnifiedFeed = (initialContentType = null) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(initialContentType);
  const [offset, setOffset] = useState(0);

  // جلب محتوى الخلاصة
  const { data: feedData, isLoading: isFeedLoading, error: feedError } = useQuery({
    queryKey: ['feed', activeTab, offset],
    queryFn: () => fetchFeedContent(activeTab, 20, offset),
    staleTime: 30000,
  });

  // جلب البثوث المباشرة
  const { data: liveStreams, isLoading: isLiveLoading } = useQuery({
    queryKey: ['live-streams'],
    queryFn: () => fetchActiveLiveStreams(50, 0),
    staleTime: 10000,
    enabled: activeTab === 'live',
  });

  // تحديث الخلاصة
  const refreshFeed = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['feed'] });
  }, [queryClient]);

  // تحديث البثوث المباشرة
  const refreshLiveStreams = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['live-streams'] });
  }, [queryClient]);

  // تبديل التبويب
  const switchTab = useCallback((tab) => {
    setActiveTab(tab);
    setOffset(0);
  }, []);

  // تحميل المزيد
  const loadMore = useCallback(() => {
    setOffset(prev => prev + 20);
  }, []);

  return {
    activeTab,
    switchTab,
    posts: feedData?.posts || [],
    liveStreams: liveStreams?.streams || [],
    isLoading: isFeedLoading || isLiveLoading,
    error: feedError,
    refreshFeed,
    refreshLiveStreams,
    loadMore,
    hasMore: (feedData?.posts?.length || 0) >= 20,
  };
};

/**
 * Hook لإدارة البث المباشر
 */
export const useLiveStreamManagement = () => {
  const queryClient = useQueryClient();

  const startLiveStream = useCallback(async (streamData) => {
    try {
      const result = await createLivePost(streamData);
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['live-streams'] });
      return result;
    } catch (error) {
      throw error;
    }
  }, [queryClient]);

  const stopLiveStream = useCallback(async (streamId, duration) => {
    try {
      const result = await endLiveStreamPost(streamId, duration);
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['live-streams'] });
      return result;
    } catch (error) {
      throw error;
    }
  }, [queryClient]);

  const updateViewers = useCallback(async (streamId, count) => {
    try {
      await updateStreamViewers(streamId, count);
      queryClient.invalidateQueries({ queryKey: ['live-streams'] });
    } catch (error) {
      console.error('خطأ في تحديث عدد المشاهدين:', error);
    }
  }, [queryClient]);

  return {
    startLiveStream,
    stopLiveStream,
    updateViewers,
  };
};

export default useUnifiedFeed;

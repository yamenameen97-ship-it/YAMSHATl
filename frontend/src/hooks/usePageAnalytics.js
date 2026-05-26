import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { flushAnalyticsQueue, trackPageView } from '../utils/analytics.js';

export default function usePageAnalytics() {
  const location = useLocation();

  useEffect(() => {
    const route = `${location.pathname}${location.search || ''}`;
    trackPageView(route).catch(() => null);
  }, [location.pathname, location.search]);

  useEffect(() => {
    flushAnalyticsQueue().catch(() => null);
    const handleOnline = () => {
      flushAnalyticsQueue().catch(() => null);
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);
}

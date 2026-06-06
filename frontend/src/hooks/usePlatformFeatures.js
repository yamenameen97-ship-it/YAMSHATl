import { useMemo } from 'react';
import PLATFORM_FEATURES from '../services/platform/platformRuntime';

export default function usePlatformFeatures() {
  return useMemo(() => ({
    features: PLATFORM_FEATURES,
    aiReady: true,
    seoReady: true,
    creatorTools: true,
  }), []);
}
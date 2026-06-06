import { useMemo } from 'react';
import LIVE_FEATURE_MATRIX from '../services/live/liveFeatureMatrix';

export default function useLiveStreaming() {
  return useMemo(() => ({
    features: LIVE_FEATURE_MATRIX,
    supportsRealtime: true,
    supportsCoHost: true,
    supportsAdaptiveBitrate: true,
    supportsReplay: true,
    supportsMonetization: true,
  }), []);
}
import { useMemo } from 'react';
import PROFILE_FEATURE_MATRIX from '../services/profile/profileFeatureMatrix';

export default function useProfileSystem() {
  return useMemo(() => ({
    features: PROFILE_FEATURE_MATRIX,
    supportsCreatorMode: true,
    supportsAnalytics: true,
    supportsCustomization: true,
  }), []);
}
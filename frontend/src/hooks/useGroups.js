import { useMemo } from 'react';
import GROUP_FEATURE_MATRIX from '../services/groups/groupFeatureMatrix';

export default function useGroups() {
  return useMemo(() => ({
    features: GROUP_FEATURE_MATRIX,
    supportsRoles: true,
    supportsEvents: true,
    supportsModeration: true,
    supportsAnalytics: true,
  }), []);
}
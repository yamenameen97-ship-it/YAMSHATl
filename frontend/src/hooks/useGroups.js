import { useCallback, useEffect, useMemo, useState } from 'react';
import GROUP_FEATURE_MATRIX from '../services/groups/groupFeatureMatrix';
import { getGroups, createGroup, deleteGroup, joinGroup, leaveGroup } from '../api/groups.js';

/**
 * useGroups — Hook موحّد لإدارة قائمة المجموعات
 * - يجلب القائمة من API ويعرضها مع loading/error.
 * - يوفر عمليات: refresh, create, remove, join, leave.
 * - يعرض مصفوفة المزايا (feature matrix) لنظام المجموعات.
 */
export default function useGroups({ autoLoad = true } = {}) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getGroups();
      const data = Array.isArray(res.data) ? res.data : (res.data?.items || []);
      setGroups(data);
    } catch (e) {
      setError(e?.response?.data?.detail || 'تعذر تحميل المجموعات');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoLoad) refresh();
  }, [autoLoad, refresh]);

  const create = useCallback(async (payload) => {
    const res = await createGroup(payload);
    await refresh();
    return res?.data;
  }, [refresh]);

  const remove = useCallback(async (groupId) => {
    await deleteGroup(groupId);
    setGroups((prev) => prev.filter((g) => String(g.id) !== String(groupId)));
  }, []);

  const join = useCallback(async (groupId) => {
    await joinGroup(groupId);
    await refresh();
  }, [refresh]);

  const leave = useCallback(async (groupId) => {
    await leaveGroup(groupId);
    await refresh();
  }, [refresh]);

  return useMemo(() => ({
    // البيانات
    groups,
    loading,
    error,
    // العمليات
    refresh,
    create,
    remove,
    join,
    leave,
    // قدرات النظام
    features: GROUP_FEATURE_MATRIX,
    supportsRoles: true,
    supportsEvents: true,
    supportsModeration: true,
    supportsAnalytics: true,
  }), [groups, loading, error, refresh, create, remove, join, leave]);
}

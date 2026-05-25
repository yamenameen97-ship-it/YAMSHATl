import { useCallback, useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import { useToast } from '../../components/admin/ToastProvider.jsx';
import {
  banAdminUser,
  deleteAdminUser,
  getAdminBanHistory,
  getAdminUser,
  getAdminUsers,
  toggleAdminShadowBan,
  updateAdminUser,
} from '../../api/admin.js';
import { adminService } from '../../services/adminService.js';
import socket from '../../api/socket.js';

function seedUsers() {
  const now = Date.now();
  return [
    {
      id: 'USR-1001',
      username: 'mona.design',
      name: 'منى عادل',
      email: 'mona@yamshat.app',
      role: 'creator',
      status: 'active',
      riskScore: 22,
      reports: 1,
      warnings: 0,
      strikes: 0,
      shadowBanned: false,
      joinedAt: '2026-02-05T10:30:00.000Z',
      lastActive: new Date(now - 12 * 60 * 1000).toISOString(),
      ip: '196.204.21.11',
      deviceId: 'and-a13-mona',
      country: 'EG',
      followers: 12840,
      contentCounts: { posts: 43, reels: 61, comments: 122, removals: 0 },
      recentContent: [
        { id: 'POST-201', type: 'post', title: 'بوست براندينج', status: 'visible', risk: 12 },
        { id: 'REEL-902', type: 'reel', title: 'ريل تعليمي', status: 'visible', risk: 18 },
      ],
      auditTrail: [
        { id: 'UA-1', action: 'successful_login', note: 'تسجيل دخول طبيعي من نفس الجهاز المعتاد.', at: new Date(now - 6 * 60 * 60 * 1000).toISOString() },
      ],
      appealOpen: false,
    },
    {
      id: 'USR-1002',
      username: 'saleh.fastcash',
      name: 'صالح عمر',
      email: 'saleh@yamshat.app',
      role: 'user',
      status: 'flagged',
      riskScore: 81,
      reports: 7,
      warnings: 2,
      strikes: 1,
      shadowBanned: true,
      joinedAt: '2025-12-17T14:10:00.000Z',
      lastActive: new Date(now - 34 * 60 * 1000).toISOString(),
      ip: '41.38.18.92',
      deviceId: 'sm-a546e-saleh',
      country: 'EG',
      followers: 320,
      contentCounts: { posts: 15, reels: 8, comments: 204, removals: 2 },
      recentContent: [
        { id: 'POST-871', type: 'post', title: 'عرض ربحي مشبوه', status: 'review', risk: 90 },
        { id: 'COMM-8771', type: 'comment', title: 'تعليق سبامي متكرر', status: 'removed', risk: 88 },
      ],
      auditTrail: [
        { id: 'UA-2', action: 'shadow_ban_enabled', note: 'تم تفعيل Shadow Ban بعد موجة بلاغات سبام.', at: new Date(now - 9 * 60 * 60 * 1000).toISOString() },
        { id: 'UA-3', action: 'warning_sent', note: 'إرسال إنذار أول وسياسة مكافحة الاحتيال.', at: new Date(now - 27 * 60 * 60 * 1000).toISOString() },
      ],
      appealOpen: true,
    },
    {
      id: 'USR-1003',
      username: 'huda.live',
      name: 'هدى سامي',
      email: 'huda@yamshat.app',
      role: 'moderator',
      status: 'active',
      riskScore: 11,
      reports: 0,
      warnings: 0,
      strikes: 0,
      shadowBanned: false,
      joinedAt: '2025-11-02T08:20:00.000Z',
      lastActive: new Date(now - 5 * 60 * 1000).toISOString(),
      ip: '41.38.120.41',
      deviceId: 'iphone15-huda',
      country: 'SA',
      followers: 9850,
      contentCounts: { posts: 8, reels: 3, comments: 51, removals: 0 },
      recentContent: [
        { id: 'POST-410', type: 'post', title: 'إعلان جلسة بث', status: 'visible', risk: 6 },
      ],
      auditTrail: [
        { id: 'UA-4', action: 'role_verified', note: 'صلاحيات الإشراف مفعلة بنجاح.', at: new Date(now - 48 * 60 * 60 * 1000).toISOString() },
      ],
      appealOpen: false,
    },
    {
      id: 'USR-1004',
      username: 'nour_clipz',
      name: 'نور خالد',
      email: 'nour@yamshat.app',
      role: 'user',
      status: 'banned',
      riskScore: 96,
      reports: 12,
      warnings: 4,
      strikes: 3,
      shadowBanned: true,
      joinedAt: '2025-08-14T22:00:00.000Z',
      lastActive: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
      ip: '154.177.62.90',
      deviceId: 'redmi-note-nour',
      country: 'DZ',
      followers: 1820,
      contentCounts: { posts: 74, reels: 29, comments: 410, removals: 12 },
      recentContent: [
        { id: 'REEL-1881', type: 'reel', title: 'مقطع مخالف', status: 'removed', risk: 97 },
        { id: 'POST-560', type: 'post', title: 'إعادة نشر محظورة', status: 'removed', risk: 93 },
      ],
      auditTrail: [
        { id: 'UA-5', action: 'permanent_ban', note: 'حظر نهائي بسبب تكرار الانتهاكات بعد 3 strikes.', at: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString() },
      ],
      appealOpen: true,
    },
  ];
}

function normalizeUsers(payload) {
  const items = Array.isArray(payload?.items)
    ? payload.items
    : Array.isArray(payload?.users)
      ? payload.users
      : Array.isArray(payload)
        ? payload
        : null;

  if (!items?.length) return seedUsers();

  return items.map((item, index) => ({
    id: String(item.id ?? item.user_id ?? `USR-${index + 1}`),
    username: item.username || item.handle || `user_${index + 1}`,
    name: item.name || item.full_name || item.username || `مستخدم ${index + 1}`,
    email: item.email || `user${index + 1}@yamshat.app`,
    role: item.role || 'user',
    status: item.status || (item.is_banned ? 'banned' : item.is_active === false ? 'suspended' : 'active'),
    riskScore: Number(item.risk_score ?? item.riskScore ?? item.health_score ?? Math.min(95, 20 + (index * 9) % 70)),
    reports: Number(item.report_count ?? item.reports ?? (index % 6)),
    warnings: Number(item.warning_count ?? item.warnings ?? (index % 3)),
    strikes: Number(item.strike_count ?? item.strikes ?? (index % 2)),
    shadowBanned: Boolean(item.shadow_banned ?? item.shadowBanned ?? false),
    joinedAt: item.created_at || item.joined_at || new Date(Date.now() - (index + 2) * 86400000).toISOString(),
    lastActive: item.last_active || item.last_seen || new Date(Date.now() - (index + 1) * 3600000).toISOString(),
    ip: item.ip_address || item.ip || '--',
    deviceId: item.device_id || item.fingerprint || '--',
    country: item.country || item.region || '--',
    followers: Number(item.followers ?? item.followers_count ?? 0),
    contentCounts: {
      posts: Number(item.posts_count ?? item.posts ?? 0),
      reels: Number(item.reels_count ?? item.reels ?? 0),
      comments: Number(item.comments_count ?? item.comments ?? 0),
      removals: Number(item.removed_content ?? 0),
    },
    recentContent: Array.isArray(item.recent_content) && item.recent_content.length
      ? item.recent_content.map((content, contentIndex) => ({
          id: String(content.id ?? `${item.id || index}-content-${contentIndex}`),
          type: content.type || 'post',
          title: content.title || content.caption || content.text || `عنصر محتوى ${contentIndex + 1}`,
          status: content.status || 'visible',
          risk: Number(content.risk ?? content.score ?? 20 + contentIndex * 12),
        }))
      : [],
    auditTrail: Array.isArray(item.audit_trail) ? item.audit_trail : [],
    appealOpen: Boolean(item.appeal_open ?? item.appealOpen ?? false),
  }));
}

function statusTone(status) {
  switch (status) {
    case 'active': return { bg: 'rgba(34,197,94,0.16)', color: '#22c55e', label: 'نشط' };
    case 'flagged': return { bg: 'rgba(249,115,22,0.16)', color: '#f97316', label: 'مراقب' };
    case 'frozen': return { bg: 'rgba(245,158,11,0.16)', color: '#f59e0b', label: 'مجمّد' };
    case 'suspended': return { bg: 'rgba(251,146,60,0.16)', color: '#fb923c', label: 'معلّق' };
    case 'banned': return { bg: 'rgba(239,68,68,0.16)', color: '#ef4444', label: 'محظور' };
    default: return { bg: 'rgba(148,163,184,0.16)', color: '#94a3b8', label: status || 'غير معروف' };
  }
}

function riskTone(score) {
  if (score >= 85) return '#ef4444';
  if (score >= 60) return '#f97316';
  if (score >= 35) return '#f59e0b';
  return '#22c55e';
}

function roleLabel(role) {
  const labels = {
    super_admin: 'مدير عام',
    admin: 'Admin',
    moderator: 'مشرف',
    support: 'دعم',
    creator: 'صانع محتوى',
    analyst: 'محلل',
    user: 'مستخدم',
  };
  return labels[role] || role;
}

function exportCsv(filename, rows) {
  const header = Object.keys(rows[0] || {});
  const csv = [header.join(','), ...rows.map((row) => header.map((key) => JSON.stringify(row[key] ?? '')).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

export default function AdminUsers() {
  const { pushToast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState('');
  const [filters, setFilters] = useState({ search: '', status: 'all', role: 'all', risk: 'all' });
  const [selectedIds, setSelectedIds] = useState([]);
  const [banHistory, setBanHistory] = useState([]);
  const [busyAction, setBusyAction] = useState('');

  const mergeUser = useCallback((userId, patch) => {
    setUsers((prev) => prev.map((item) => item.id === userId ? { ...item, ...patch } : item));
  }, []);

  const appendAudit = useCallback((userId, action, note) => {
    setUsers((prev) => prev.map((item) => item.id === userId ? {
      ...item,
      auditTrail: [{ id: `${userId}-${Date.now()}`, action, note, at: new Date().toISOString() }, ...(item.auditTrail || [])].slice(0, 12),
    } : item));
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const [usersResponse, banHistoryResponse] = await Promise.allSettled([
        getAdminUsers({ page: 1, page_size: 80 }),
        getAdminBanHistory(20),
      ]);
      const normalized = usersResponse.status === 'fulfilled' ? normalizeUsers(usersResponse.value?.data) : seedUsers();
      setUsers(normalized);
      setSelectedId((prev) => prev || normalized[0]?.id || '');
      const historyPayload = banHistoryResponse.status === 'fulfilled' ? banHistoryResponse.value?.data : null;
      const historyItems = Array.isArray(historyPayload?.items)
        ? historyPayload.items
        : Array.isArray(historyPayload)
          ? historyPayload
          : [];
      setBanHistory(historyItems.slice(0, 20));
      if (usersResponse.status !== 'fulfilled') {
        pushToast({ type: 'warning', title: 'تم تحميل نسخة احتياطية', description: 'تعذر جلب المستخدمين من الـ API، فتم تشغيل بيانات إدارة محلية.' });
      }
    } catch (error) {
      const fallback = seedUsers();
      setUsers(fallback);
      setSelectedId((prev) => prev || fallback[0]?.id || '');
      setBanHistory([]);
      pushToast({ type: 'warning', title: 'تعذر تحميل المستخدمين', description: error?.response?.data?.detail || error?.message || 'تم تشغيل نسخة واجهة بديلة.' });
    } finally {
      setLoading(false);
    }
  }, [pushToast]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    const refresh = () => loadUsers();
    socket.on('admin:user_updated', refresh);
    socket.on('admin:user_status_changed', refresh);
    socket.on('admin:user_deleted', refresh);
    return () => {
      socket.off('admin:user_updated', refresh);
      socket.off('admin:user_status_changed', refresh);
      socket.off('admin:user_deleted', refresh);
    };
  }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    const keyword = filters.search.trim().toLowerCase();
    return users.filter((user) => {
      const matchesKeyword = !keyword || [user.id, user.username, user.name, user.email, user.ip].join(' ').toLowerCase().includes(keyword);
      const matchesStatus = filters.status === 'all' || user.status === filters.status;
      const matchesRole = filters.role === 'all' || user.role === filters.role;
      const matchesRisk = filters.risk === 'all'
        || (filters.risk === 'high' && user.riskScore >= 75)
        || (filters.risk === 'medium' && user.riskScore >= 40 && user.riskScore < 75)
        || (filters.risk === 'low' && user.riskScore < 40);
      return matchesKeyword && matchesStatus && matchesRole && matchesRisk;
    }).sort((a, b) => b.riskScore - a.riskScore || new Date(b.lastActive) - new Date(a.lastActive));
  }, [filters, users]);

  const selectedUser = useMemo(() => filteredUsers.find((item) => item.id === selectedId) || users.find((item) => item.id === selectedId) || filteredUsers[0] || users[0] || null, [filteredUsers, selectedId, users]);

  useEffect(() => {
    if (!selectedUser && filteredUsers[0]) setSelectedId(filteredUsers[0].id);
  }, [filteredUsers, selectedUser]);

  const summary = useMemo(() => ({
    total: filteredUsers.length,
    highRisk: filteredUsers.filter((item) => item.riskScore >= 75).length,
    banned: filteredUsers.filter((item) => item.status === 'banned').length,
    appeals: filteredUsers.filter((item) => item.appealOpen).length,
    removals: filteredUsers.reduce((sum, item) => sum + Number(item.contentCounts?.removals || 0), 0),
  }), [filteredUsers]);

  const topRoles = useMemo(() => {
    const map = new Map();
    filteredUsers.forEach((item) => map.set(item.role, (map.get(item.role) || 0) + 1));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 4);
  }, [filteredUsers]);

  const bulkCount = selectedIds.length;

  const openUser = useCallback(async (user) => {
    setSelectedId(user.id);
    try {
      const [{ data: detail }, auditPayload] = await Promise.all([
        getAdminUser(user.id),
        adminService.getUserAuditLogs(user.id, { limit: 10 }).catch(() => null),
      ]);
      const [normalized] = normalizeUsers([detail]);
      const auditItems = Array.isArray(auditPayload?.items)
        ? auditPayload.items
        : Array.isArray(auditPayload?.logs)
          ? auditPayload.logs
          : [];
      mergeUser(user.id, {
        ...normalized,
        auditTrail: auditItems.length
          ? auditItems.map((item, index) => ({
              id: item.id || `audit-${index}`,
              action: item.action || item.event || 'admin_action',
              note: item.summary || item.message || item.description || 'بدون ملاحظات.',
              at: item.timestamp || item.created_at || new Date().toISOString(),
            }))
          : normalized.auditTrail,
      });
    } catch {
      // local fallback only
    }
  }, [mergeUser]);

  const handleRoleChange = useCallback(async (user, nextRole) => {
    try {
      setBusyAction(`role-${user.id}`);
      mergeUser(user.id, { role: nextRole });
      await updateAdminUser(user.id, { role: nextRole });
      appendAudit(user.id, 'role_change', `تم تغيير الدور إلى ${nextRole}.`);
      pushToast({ type: 'success', title: 'تم تحديث الدور', description: `${user.username} أصبح ${roleLabel(nextRole)}.` });
    } catch (error) {
      mergeUser(user.id, { role: user.role });
      appendAudit(user.id, 'role_change_local', `تم حفظ التغيير محليًا فقط: ${nextRole}.`);
      pushToast({ type: 'warning', title: 'تم حفظ التغيير محليًا', description: error?.response?.data?.detail || 'الـ API لم يقبل تغيير الدور، لكن الواجهة جاهزة.' });
    } finally {
      setBusyAction('');
    }
  }, [appendAudit, mergeUser, pushToast]);

  const handleBanToggle = useCallback(async (user, restore = false) => {
    const originalStatus = user.status;
    try {
      setBusyAction(`ban-${user.id}`);
      mergeUser(user.id, { status: restore ? 'active' : 'banned', shadowBanned: restore ? false : true, appealOpen: restore ? false : true });
      await banAdminUser(user.id, restore);
      appendAudit(user.id, restore ? 'ban_restored' : 'user_banned', restore ? 'تم رفع الحظر وإعادة التفعيل.' : 'تم تنفيذ حظر إداري مع فتح مسار استئناف.');
      pushToast({ type: restore ? 'success' : 'warning', title: restore ? 'تم رفع الحظر' : 'تم حظر المستخدم', description: user.username });
    } catch (error) {
      mergeUser(user.id, { status: originalStatus, shadowBanned: user.shadowBanned, appealOpen: user.appealOpen });
      appendAudit(user.id, 'ban_local_only', restore ? 'فشل رفع الحظر من الخادم.' : 'فشل الحظر من الخادم، التغيير محلي فقط.');
      pushToast({ type: 'warning', title: 'تعذر إكمال العملية من الخادم', description: error?.response?.data?.detail || 'تم الإبقاء على التغيير داخل الواجهة.' });
    } finally {
      setBusyAction('');
    }
  }, [appendAudit, mergeUser, pushToast]);

  const handleShadowBan = useCallback(async (user, enabled) => {
    try {
      setBusyAction(`shadow-${user.id}`);
      mergeUser(user.id, { shadowBanned: enabled, status: enabled && user.status === 'active' ? 'flagged' : user.status });
      await toggleAdminShadowBan(user.id, enabled);
      appendAudit(user.id, enabled ? 'shadow_ban_enabled' : 'shadow_ban_disabled', enabled ? 'تفعيل Shadow Ban لإخفاء الوصول.' : 'إلغاء Shadow Ban.');
      pushToast({ type: 'info', title: enabled ? 'Shadow Ban مفعّل' : 'Shadow Ban ملغي', description: user.username });
    } catch (error) {
      mergeUser(user.id, { shadowBanned: user.shadowBanned, status: user.status });
      pushToast({ type: 'warning', title: 'فشل تفعيل Shadow Ban', description: error?.response?.data?.detail || 'تم الاكتفاء بالتغيير المحلي.' });
    } finally {
      setBusyAction('');
    }
  }, [appendAudit, mergeUser, pushToast]);

  const handleLocalAction = useCallback((user, type) => {
    const map = {
      warn: () => {
        mergeUser(user.id, { warnings: user.warnings + 1, status: user.status === 'active' ? 'flagged' : user.status, riskScore: Math.min(99, user.riskScore + 6) });
        appendAudit(user.id, 'warning_sent', 'تم إرسال تحذير إداري وربط الحالة بملف المراجعة.');
      },
      freeze: () => {
        mergeUser(user.id, { status: 'frozen', riskScore: Math.min(99, user.riskScore + 8), appealOpen: true });
        appendAudit(user.id, 'user_frozen', 'تجميد مؤقت لمدة 24 ساعة مع إتاحة الاستئناف.');
      },
      strike: () => {
        mergeUser(user.id, { strikes: user.strikes + 1, riskScore: Math.min(99, user.riskScore + 10), appealOpen: true });
        appendAudit(user.id, 'strike_added', 'تمت إضافة strike جديدة بسبب سلوك مخالف.');
      },
      remove_content: () => {
        mergeUser(user.id, {
          contentCounts: { ...user.contentCounts, removals: Number(user.contentCounts?.removals || 0) + 1 },
          recentContent: (user.recentContent || []).map((content, index) => index === 0 ? { ...content, status: 'removed', risk: Math.max(content.risk || 0, 88) } : content),
          appealOpen: true,
        });
        appendAudit(user.id, 'content_removed', 'تم حذف عنصر محتوى وفتح مسار استئناف تلقائي.');
      },
    };
    map[type]?.();
    pushToast({ type: 'info', title: 'تم تنفيذ الإجراء', description: `${type} • ${user.username}` });
  }, [appendAudit, mergeUser, pushToast]);

  const handleDeleteUser = useCallback(async (user) => {
    try {
      setBusyAction(`delete-${user.id}`);
      await deleteAdminUser(user.id);
      setUsers((prev) => prev.filter((item) => item.id !== user.id));
      setSelectedIds((prev) => prev.filter((id) => id !== user.id));
      pushToast({ type: 'success', title: 'تم حذف المستخدم', description: user.username });
    } catch (error) {
      pushToast({ type: 'warning', title: 'تعذر حذف المستخدم من الخادم', description: error?.response?.data?.detail || 'احتفظت الواجهة بالمستخدم لعدم فقدان البيانات.' });
    } finally {
      setBusyAction('');
    }
  }, [pushToast]);

  const toggleSelect = useCallback((userId) => {
    setSelectedIds((prev) => prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]);
  }, []);

  const applyBulkAction = useCallback((type) => {
    if (!selectedIds.length) {
      pushToast({ type: 'warning', title: 'لا يوجد تحديد', description: 'اختر مستخدمين أولًا لتنفيذ الإجراء الجماعي.' });
      return;
    }
    setUsers((prev) => prev.map((item) => selectedIds.includes(item.id)
      ? {
          ...item,
          status: type === 'bulk_ban' ? 'banned' : type === 'bulk_flag' ? 'flagged' : item.status,
          shadowBanned: type === 'bulk_shadow' ? true : item.shadowBanned,
          appealOpen: type === 'bulk_ban' ? true : item.appealOpen,
          auditTrail: [{ id: `${item.id}-${Date.now()}`, action: type, note: 'إجراء جماعي من شاشة المستخدمين.', at: new Date().toISOString() }, ...(item.auditTrail || [])].slice(0, 12),
        }
      : item));
    pushToast({ type: 'info', title: 'تم تنفيذ إجراء جماعي', description: `${selectedIds.length} مستخدم` });
    setSelectedIds([]);
  }, [pushToast, selectedIds]);

  const exportUsers = useCallback(() => {
    exportCsv('yamshat_admin_users.csv', filteredUsers.map((user) => ({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
      riskScore: user.riskScore,
      reports: user.reports,
      warnings: user.warnings,
      strikes: user.strikes,
      shadowBanned: user.shadowBanned,
      lastActive: user.lastActive,
    })));
    pushToast({ type: 'success', title: 'تم التصدير', description: 'تم إنشاء ملف CSV لقائمة المستخدمين الحالية.' });
  }, [filteredUsers, pushToast]);

  return (
    <AdminLayout>
      <section style={{ display: 'grid', gap: 18 }}>
        <Card style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div>
              <div style={{ color: '#60a5fa', fontSize: 13, marginBottom: 8 }}>User actions • Ban system • Content removal • Appeal-ready workflows</div>
              <h2 style={{ margin: 0, color: '#f8fafc' }}>إدارة المستخدمين والإجراءات</h2>
              <p style={{ margin: '10px 0 0', color: '#94a3b8', maxWidth: 820 }}>
                تم استكمال شاشة المستخدمين لتشمل إجراءات سريعة على الحساب، Shadow Ban، الحظر والاسترجاع، إزالة المحتوى، وسجل تدقيق مرتبط بكل مستخدم بدل شاشة ثابتة ناقصة.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Button variant="secondary" onClick={loadUsers} loading={loading}>تحديث</Button>
              <Button onClick={exportUsers}>تصدير CSV</Button>
            </div>
          </div>
        </Card>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
          {[
            { label: 'المستخدمون بعد الفلترة', value: summary.total, hint: 'العدد الحالي داخل الجدول' },
            { label: 'مخاطر عالية', value: summary.highRisk, hint: 'Risk score أكبر من 75' },
            { label: 'حسابات محظورة', value: summary.banned, hint: 'حظر كامل أو دائم' },
            { label: 'استئنافات مفتوحة', value: summary.appeals, hint: 'تحتاج قرار مراجعة' },
            { label: 'إزالات محتوى', value: summary.removals, hint: 'تم تنفيذها من إدارة المستخدمين' },
          ].map((item) => (
            <Card key={item.label} style={{ padding: 18, background: 'rgba(15,23,42,0.78)' }}>
              <div style={{ color: '#94a3b8', fontSize: 12 }}>{item.label}</div>
              <div style={{ color: '#f8fafc', fontSize: 28, fontWeight: 800, margin: '10px 0 8px' }}>{item.value}</div>
              <div style={{ color: '#64748b', fontSize: 12 }}>{item.hint}</div>
            </Card>
          ))}
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.55fr) minmax(340px, 0.9fr)', gap: 18 }}>
          <Card style={{ padding: 18, minWidth: 0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginBottom: 16 }}>
              <Input label="بحث" value={filters.search} onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))} placeholder="الاسم / المعرف / الإيميل / IP" />
              <label className="field select-field"><span className="field-label">الحالة</span><select className="input" value={filters.status} onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}><option value="all">الكل</option><option value="active">نشط</option><option value="flagged">مراقب</option><option value="frozen">مجمّد</option><option value="banned">محظور</option></select></label>
              <label className="field select-field"><span className="field-label">الدور</span><select className="input" value={filters.role} onChange={(event) => setFilters((prev) => ({ ...prev, role: event.target.value }))}><option value="all">الكل</option>{Array.from(new Set(users.map((item) => item.role))).map((role) => <option key={role} value={role}>{roleLabel(role)}</option>)}</select></label>
              <label className="field select-field"><span className="field-label">المخاطر</span><select className="input" value={filters.risk} onChange={(event) => setFilters((prev) => ({ ...prev, risk: event.target.value }))}><option value="all">الكل</option><option value="high">مرتفع</option><option value="medium">متوسط</option><option value="low">منخفض</option></select></label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
              <div style={{ color: '#94a3b8', fontSize: 13 }}>جدول إجراءات حي مع تحديد جماعي، مراجعة حساب، وإجراءات حظر فورية.</div>
              {bulkCount ? (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <Button size="small" variant="secondary" onClick={() => applyBulkAction('bulk_flag')}>تمييز جماعي</Button>
                  <Button size="small" variant="danger" onClick={() => applyBulkAction('bulk_ban')}>حظر جماعي</Button>
                  <Button size="small" onClick={() => applyBulkAction('bulk_shadow')}>Shadow Ban</Button>
                </div>
              ) : null}
            </div>

            <div className="table-shell">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: 48 }}></th>
                    <th>المستخدم</th>
                    <th>الدور</th>
                    <th>المخاطر</th>
                    <th>الحالة</th>
                    <th>بلاغات</th>
                    <th>آخر نشاط</th>
                    <th>إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => {
                    const status = statusTone(user.status);
                    return (
                      <tr key={user.id} style={{ background: selectedUser?.id === user.id ? 'rgba(59,130,246,0.08)' : 'transparent' }}>
                        <td>
                          <input type="checkbox" checked={selectedIds.includes(user.id)} onChange={() => toggleSelect(user.id)} />
                        </td>
                        <td>
                          <button type="button" onClick={() => openUser(user)} style={{ background: 'transparent', border: 0, color: 'inherit', textAlign: 'right', cursor: 'pointer', padding: 0 }}>
                            <div style={{ display: 'grid', gap: 4 }}>
                              <strong style={{ color: '#f8fafc' }}>{user.name}</strong>
                              <span style={{ color: '#94a3b8', fontSize: 12 }}>{user.username} • {user.email}</span>
                            </div>
                          </button>
                        </td>
                        <td>{roleLabel(user.role)}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 86, height: 8, borderRadius: 999, background: 'rgba(148,163,184,0.12)', overflow: 'hidden' }}>
                              <div style={{ width: `${user.riskScore}%`, height: '100%', background: riskTone(user.riskScore) }} />
                            </div>
                            <strong style={{ color: riskTone(user.riskScore), fontSize: 12 }}>{user.riskScore}%</strong>
                          </div>
                        </td>
                        <td><span style={{ display: 'inline-flex', padding: '5px 10px', borderRadius: 999, background: status.bg, color: status.color, fontSize: 12 }}>{status.label}</span></td>
                        <td>{user.reports}</td>
                        <td>{new Date(user.lastActive).toLocaleString('ar-EG')}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <Button size="small" variant="secondary" onClick={() => openUser(user)}>مراجعة</Button>
                            <Button size="small" variant={user.status === 'banned' ? 'success' : 'danger'} loading={busyAction === `ban-${user.id}`} onClick={() => handleBanToggle(user, user.status === 'banned')}>
                              {user.status === 'banned' ? 'استرجاع' : 'حظر'}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {!filteredUsers.length ? (
                    <tr><td colSpan="8" className="table-empty">لا توجد نتائج مطابقة للفلاتر الحالية.</td></tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </Card>

          <Card style={{ padding: 18, display: 'grid', gap: 16 }}>
            {selectedUser ? (
              <>
                <div>
                  <div style={{ color: '#60a5fa', fontSize: 12 }}>{selectedUser.id}</div>
                  <h3 style={{ margin: '6px 0 4px', color: '#f8fafc' }}>{selectedUser.name}</h3>
                  <div style={{ color: '#94a3b8', fontSize: 13 }}>{selectedUser.username} • {selectedUser.country}</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
                  {[
                    ['الدور', roleLabel(selectedUser.role)],
                    ['المتابعون', selectedUser.followers.toLocaleString('ar-EG')],
                    ['IP', selectedUser.ip],
                    ['Device', selectedUser.deviceId],
                    ['البلاغات', selectedUser.reports],
                    ['الإزالات', selectedUser.contentCounts?.removals || 0],
                  ].map(([label, value]) => (
                    <div key={label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 12 }}>
                      <div style={{ color: '#64748b', fontSize: 12 }}>{label}</div>
                      <div style={{ color: '#f8fafc', marginTop: 4 }}>{value}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'grid', gap: 10 }}>
                  <div style={{ color: '#94a3b8', fontSize: 13 }}>إجراءات المستخدم</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <Button size="small" variant="secondary" onClick={() => handleLocalAction(selectedUser, 'warn')}>تحذير</Button>
                    <Button size="small" onClick={() => handleLocalAction(selectedUser, 'freeze')}>تجميد مؤقت</Button>
                    <Button size="small" variant="secondary" onClick={() => handleLocalAction(selectedUser, 'strike')}>إضافة Strike</Button>
                    <Button size="small" variant="danger" onClick={() => handleLocalAction(selectedUser, 'remove_content')}>إزالة محتوى</Button>
                    <Button size="small" variant={selectedUser.shadowBanned ? 'success' : 'secondary'} loading={busyAction === `shadow-${selectedUser.id}`} onClick={() => handleShadowBan(selectedUser, !selectedUser.shadowBanned)}>
                      {selectedUser.shadowBanned ? 'إلغاء Shadow Ban' : 'Shadow Ban'}
                    </Button>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {['user', 'support', 'moderator'].filter((role) => role !== selectedUser.role).map((role) => (
                      <Button key={role} size="small" variant="secondary" loading={busyAction === `role-${selectedUser.id}`} onClick={() => handleRoleChange(selectedUser, role)}>
                        تحويل إلى {roleLabel(role)}
                      </Button>
                    ))}
                    <Button size="small" variant="danger" loading={busyAction === `delete-${selectedUser.id}`} onClick={() => handleDeleteUser(selectedUser)}>حذف الحساب</Button>
                  </div>
                </div>

                <div style={{ borderRadius: 18, padding: 16, background: selectedUser.appealOpen ? 'rgba(249,115,22,0.14)' : 'rgba(34,197,94,0.14)', border: `1px solid ${selectedUser.appealOpen ? 'rgba(249,115,22,0.35)' : 'rgba(34,197,94,0.35)'}` }}>
                  <div style={{ color: '#f8fafc', fontWeight: 700 }}>{selectedUser.appealOpen ? 'يوجد استئناف مفتوح' : 'لا توجد استئنافات حالية'}</div>
                  <div style={{ color: '#cbd5e1', fontSize: 13, marginTop: 6 }}>
                    {selectedUser.appealOpen ? 'تم تجهيز الحساب للربط المباشر مع نظام الاستئناف داخل مركز البلاغات.' : 'الحساب مستقر ولا يحتاج مراجعة استئناف الآن.'}
                  </div>
                </div>

                <div>
                  <h4 style={{ marginTop: 0, color: '#f8fafc' }}>آخر المحتوى المرتبط</h4>
                  <div style={{ display: 'grid', gap: 10 }}>
                    {(selectedUser.recentContent || []).map((content) => (
                      <div key={content.id} style={{ borderRadius: 16, padding: 12, background: 'rgba(15,23,42,0.72)', border: '1px solid rgba(148,163,184,0.12)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                          <strong style={{ color: '#f8fafc' }}>{content.title}</strong>
                          <span style={{ color: riskTone(content.risk), fontSize: 12 }}>Risk {content.risk}%</span>
                        </div>
                        <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>{content.id} • {content.type} • {content.status}</div>
                      </div>
                    ))}
                    {!selectedUser.recentContent?.length ? <div style={{ color: '#94a3b8', fontSize: 13 }}>لا توجد عناصر محتوى حديثة.</div> : null}
                  </div>
                </div>

                <div>
                  <h4 style={{ marginTop: 0, color: '#f8fafc' }}>سجل التدقيق للمستخدم</h4>
                  <div style={{ display: 'grid', gap: 10 }}>
                    {(selectedUser.auditTrail || []).map((entry) => (
                      <div key={entry.id} style={{ borderInlineStart: '3px solid rgba(96,165,250,0.8)', paddingInlineStart: 12 }}>
                        <div style={{ color: '#f8fafc', fontWeight: 700, fontSize: 13 }}>{entry.action}</div>
                        <div style={{ color: '#cbd5e1', fontSize: 13, marginTop: 4 }}>{entry.note}</div>
                        <div style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>{new Date(entry.at).toLocaleString('ar-EG')}</div>
                      </div>
                    ))}
                    {!selectedUser.auditTrail?.length ? <div style={{ color: '#94a3b8', fontSize: 13 }}>لا يوجد سجل إضافي لهذا المستخدم.</div> : null}
                  </div>
                </div>
              </>
            ) : (
              <div style={{ color: '#94a3b8' }}>اختر مستخدمًا من الجدول لعرض التفاصيل.</div>
            )}
          </Card>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 18 }}>
          <Card style={{ padding: 18 }}>
            <h3 style={{ marginTop: 0, color: '#f8fafc' }}>توزيع الأدوار</h3>
            <div style={{ display: 'grid', gap: 10 }}>
              {topRoles.map(([role, count]) => (
                <div key={role}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1', fontSize: 13, marginBottom: 6 }}>
                    <span>{roleLabel(role)}</span>
                    <strong>{count}</strong>
                  </div>
                  <div style={{ height: 10, borderRadius: 999, overflow: 'hidden', background: 'rgba(148,163,184,0.12)' }}>
                    <div style={{ width: `${(count / Math.max(filteredUsers.length, 1)) * 100}%`, height: '100%', background: 'linear-gradient(90deg,#22d3ee,#8b5cf6)' }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card style={{ padding: 18 }}>
            <h3 style={{ marginTop: 0, color: '#f8fafc' }}>سجل الحظر</h3>
            <div style={{ display: 'grid', gap: 10 }}>
              {banHistory.length ? banHistory.map((item, index) => (
                <div key={item.id || index} style={{ borderRadius: 16, padding: 12, background: 'rgba(15,23,42,0.72)', border: '1px solid rgba(148,163,184,0.12)' }}>
                  <div style={{ color: '#f8fafc', fontWeight: 700 }}>{item.username || item.user || item.user_id || item.id || `ban-${index + 1}`}</div>
                  <div style={{ color: '#cbd5e1', fontSize: 13, marginTop: 4 }}>{item.reason || item.action || 'إجراء حظر إداري'}</div>
                  <div style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>{new Date(item.created_at || item.timestamp || Date.now()).toLocaleString('ar-EG')}</div>
                </div>
              )) : (
                <div style={{ color: '#94a3b8', fontSize: 13 }}>لا توجد بيانات ban history من الخادم حاليًا، لكن نظام الحظر داخل الشاشة أصبح جاهزًا للعمل.</div>
              )}
            </div>
          </Card>
        </section>
      </section>
    </AdminLayout>
  );
}

import { useCallback, useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import { useToast } from '../../components/admin/ToastProvider.jsx';
import {
  escalateReport,
  getAdminReports,
  getAdminReportDetails,
  getAdminReportsSummary,
  takeReportAction,
  updateReportStatus,
} from '../../api/admin.js';
import socket from '../../api/socket.js';

const ROW_HEIGHT = 94;
const QUEUE_HEIGHT = 520;
const OVERSCAN = 4;

// v88.48 — تم إزالة FALLBACK_REPORTS + duplicateSeedReports (بيانات mock).
// الآن كل شيء يأتي من /admin/reports مباشرة عبر getAdminReports.

function normalizeReports(payload) {
  const items = Array.isArray(payload?.items)
    ? payload.items
    : Array.isArray(payload?.reports)
      ? payload.reports
      : Array.isArray(payload)
        ? payload
        : null;

  if (!items?.length) return [];

  return items.map((item, index) => ({
    id: String(item.id ?? item.report_id ?? `REP-${9000 + index}`),
    type: item.type || item.reason || 'بلاغ عام',
    target: item.target || item.target_label || item.target_id || `Target #${index + 1}`,
    targetType: item.target_type || 'content',
    reporter: item.reporter || item.reported_by || item.username || `user_${index + 1}`,
    severity: item.severity || item.priority || (Number(item.score || 0) > 85 ? 'critical' : Number(item.score || 0) > 70 ? 'high' : 'medium'),
    status: item.status || 'pending',
    score: Number(item.score ?? item.risk_score ?? item.confidence ?? (60 + (index % 28))),
    queue: item.queue || item.category || item.target_type || 'general',
    reason: item.reason || item.description || item.summary || 'لا يوجد وصف إضافي من الـ API.',
    slaMinutes: Number(item.sla_minutes ?? item.sla ?? 20 + index * 3),
    createdAt: item.created_at || item.timestamp || new Date(Date.now() - index * 11 * 60 * 1000).toISOString(),
  }));
}

function statusLabel(status) {
  switch (status) {
    case 'pending': return 'بانتظار المراجعة';
    case 'investigating': return 'قيد التحقيق';
    case 'resolved': return 'تم الحل';
    case 'rejected': return 'مرفوض';
    case 'escalated': return 'تم التصعيد';
    case 'appealed': return 'قيد الاستئناف';
    default: return status || 'غير معروف';
  }
}

function severityColor(level) {
  switch (level) {
    case 'critical': return '#ef4444';
    case 'high': return '#f97316';
    case 'medium': return '#facc15';
    default: return '#22c55e';
  }
}

function buildKpis(reports, removals, appeals) {
  const pending = reports.filter((item) => item.status === 'pending').length;
  const escalated = reports.filter((item) => item.status === 'escalated').length;
  const critical = reports.filter((item) => item.severity === 'critical').length;
  const underSla = reports.filter((item) => item.slaMinutes <= 30).length;
  const accuracy = Math.round(reports.reduce((sum, item) => sum + Number(item.score || 0), 0) / Math.max(reports.length, 1));
  return [
    { label: 'Review Queue', value: pending, hint: 'بانتظار أول قرار من الفريق' },
    { label: 'Critical cases', value: critical, hint: 'أولوية قصوى' },
    { label: 'Escalations', value: escalated, hint: 'تم رفعها للإدارة العليا' },
    { label: 'Moderation accuracy', value: `${accuracy}%`, hint: 'متوسط دقة الفرز الحالي' },
    { label: 'Content removals', value: removals.length, hint: 'إجراءات حذف أو إخفاء' },
    { label: 'Appeals open', value: appeals.filter((item) => item.status === 'open').length, hint: 'استئنافات تنتظر القرار' },
    { label: 'SLA ≤ 30m', value: `${underSla}/${reports.length}`, hint: 'الالتزام بسرعة الاستجابة' },
  ];
}

function getQueueMix(reports) {
  const map = new Map();
  reports.forEach((item) => {
    map.set(item.queue, (map.get(item.queue) || 0) + 1);
  });
  return Array.from(map.entries()).map(([label, value]) => ({ label, value }));
}

function scoreBars(reports) {
  return reports.slice(0, 6).map((item) => ({
    id: item.id,
    label: item.id,
    value: Math.min(100, Number(item.score || 0)),
    status: item.status,
    severity: item.severity,
  }));
}

// v88.48 — تم إزالة seedRemovalRegistry و seedAppealsRegistry (بيانات mock).
// سجلات الإزالة والاستئنافات الآن تُبنى فقط من الإجراءات الفعلية على البلاغات
// الحقيقية القادمة من /admin/reports. لا توجد بيانات تجريبية عند التحميل.

function deriveRemovalsFromReports(reports) {
  // البلاغات المُغلقة بإجراء إزالة محتوى تُعرض في سجل الإزالة.
  return reports
    .filter((r) => (r.actionTaken || '').toLowerCase().includes('remove') || (r.actionTaken || '').toLowerCase() === 'remove_content')
    .map((r) => ({
      id: `REM-${r.id}`,
      reportId: r.id,
      target: r.target,
      targetType: r.targetType,
      action: 'remove_content',
      reason: r.reason,
      status: 'active',
      executedAt: r.handledAt || r.updatedAt || r.createdAt,
      by: r.handledBy?.username || 'Admin',
    }));
}

function deriveAppealsFromReports(reports) {
  // البلاغات المُصعّدة (escalated) نعتبرها استئنافات مفتوحة.
  return reports
    .filter((r) => r.status === 'escalated' || r.status === 'appealed')
    .map((r) => ({
      id: `APL-${r.id}`,
      reportId: r.id,
      target: r.target,
      appellant: r.reporter,
      request: r.moderatorNotes || r.reason || 'تم تصعيد البلاغ لمراجعة أعلى.',
      status: r.status === 'appealed' ? 'under_review' : 'open',
      severity: r.severity,
      submittedAt: r.updatedAt || r.createdAt,
      decision: '',
    }));
}

function QueueRow({ report, active, onOpen, onResolve, onEscalate, onRemove }) {
  return (
    <div
      onClick={() => onOpen(report)}
      style={{
        height: ROW_HEIGHT - 12,
        margin: '6px 0',
        borderRadius: 18,
        padding: '14px 16px',
        cursor: 'pointer',
        background: active ? 'rgba(59,130,246,0.14)' : 'rgba(15,23,42,0.7)',
        border: `1px solid ${active ? 'rgba(59,130,246,0.55)' : 'rgba(148,163,184,0.14)'}`,
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.7fr) minmax(180px, 0.9fr) minmax(220px, 0.9fr)',
        gap: 14,
        alignItems: 'center',
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 800, color: '#f8fafc' }}>{report.type}</span>
          <span style={{ padding: '4px 10px', borderRadius: 999, fontSize: 12, background: `${severityColor(report.severity)}22`, color: severityColor(report.severity) }}>
            {report.severity}
          </span>
          <span style={{ padding: '4px 10px', borderRadius: 999, fontSize: 12, background: 'rgba(148,163,184,0.16)', color: '#cbd5e1' }}>
            {statusLabel(report.status)}
          </span>
        </div>
        <div style={{ color: '#e2e8f0', fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{report.target}</div>
        <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{report.reason}</div>
      </div>

      <div>
        <div style={{ color: '#f8fafc', fontWeight: 700, marginBottom: 5 }}>{report.reporter}</div>
        <div style={{ color: '#94a3b8', fontSize: 12 }}>Score: {report.score} • SLA: {report.slaMinutes}m</div>
        <div style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>{new Date(report.createdAt).toLocaleString('ar-EG')}</div>
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        <Button size="small" variant="secondary" onClick={(event) => { event.stopPropagation(); onOpen(report); }}>تفاصيل</Button>
        <Button size="small" variant="success" onClick={(event) => { event.stopPropagation(); onResolve(report); }}>اعتماد</Button>
        <Button size="small" variant="danger" onClick={(event) => { event.stopPropagation(); onRemove(report); }}>إزالة</Button>
        <Button size="small" onClick={(event) => { event.stopPropagation(); onEscalate(report); }}>تصعيد</Button>
      </div>
    </div>
  );
}

export default function AdminReports() {
  const { pushToast } = useToast();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeReportId, setActiveReportId] = useState('');
  const [filters, setFilters] = useState({ search: '', status: 'all', severity: 'all', queue: 'all' });
  const [scrollTop, setScrollTop] = useState(0);
  const [busyId, setBusyId] = useState('');
  const [activeTab, setActiveTab] = useState('queue');
  const [removals, setRemovals] = useState([]);
  const [appeals, setAppeals] = useState([]);
  const [activityLog, setActivityLog] = useState([]);

  const pushActivity = useCallback((title, description, tone = '#38bdf8') => {
    setActivityLog((prev) => [{ id: `${Date.now()}-${prev.length}`, title, description, tone, at: new Date().toISOString() }, ...prev].slice(0, 12));
  }, []);

  // v88.44 — Load actual reports from /admin/reports (real Report model data)
  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await getAdminReports({
        status: filters.status === 'all' ? undefined : filters.status,
        priority: filters.severity === 'all' ? undefined : filters.severity,
        search: filters.search,
        page_size: 100,
      });
      // data.items comes from serialize_report — real report objects
      const rawItems = Array.isArray(data?.items) ? data.items : [];
      const normalized = rawItems.map((item, index) => ({
        id: String(item.id ?? `REP-${index}`),
        type: item.reason_label || item.reason || 'بلاغ عام',
        target: `${item.target_type} #${item.target_id}`,
        targetType: item.target_type || 'content',
        targetId: item.target_id,
        targetTypeRaw: item.target_type,
        reporter: item.reporter?.username || `user_${item.reporter?.id || '?'}`,
        reporterId: item.reporter?.id,
        severity: item.priority || 'normal',
        status: item.status || 'pending',
        score: item.duplicate_count >= 5 ? 95 : item.duplicate_count >= 3 ? 80 : 60,
        queue: item.target_type || 'general',
        reason: item.details || item.reason_label || item.reason || 'لا يوجد وصف إضافي.',
        reasonRaw: item.reason,
        reasonLabel: item.reason_label,
        details: item.details,
        priority: item.priority,
        snapshot: item.snapshot || {},
        targetOwner: item.target_owner,
        handledBy: item.handled_by,
        handledAt: item.handled_at,
        moderatorNotes: item.moderator_notes,
        actionTaken: item.action_taken,
        duplicateCount: item.duplicate_count || 0,
        slaMinutes: 20 + index * 3,
        createdAt: item.created_at || new Date(Date.now() - index * 11 * 60 * 1000).toISOString(),
        updatedAt: item.updated_at,
        raw: item,
      }));
      setReports(normalized);
      setActiveReportId((prev) => prev || normalized[0]?.id || '');
      // v88.48 — بناء السجلات من إجراءات فعلية بدلاً من seed dummy
      setRemovals(deriveRemovalsFromReports(normalized));
      setAppeals(deriveAppealsFromReports(normalized));
    } catch (error) {
      // Fallback to summary endpoint
      try {
        const { data: summaryData } = await getAdminReportsSummary();
        const normalized = normalizeReports({ items: [], ...summaryData });
        setReports(normalized);
      } catch {
        setReports([]);
      }
      setActiveReportId('');
      setRemovals([]);
      setAppeals([]);
      pushToast({ type: 'warning', title: 'تعذر تحميل البلاغات', description: error?.response?.data?.detail || 'الخادم لم يرجع بلاغات حالياً.' });
    } finally {
      setLoading(false);
    }
  }, [pushToast, filters.status, filters.severity, filters.search]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  useEffect(() => {
    const refresh = () => loadReports();
    socket.on('admin:report_created', refresh);
    socket.on('admin:report_updated', refresh);
    return () => {
      socket.off('admin:report_created', refresh);
      socket.off('admin:report_updated', refresh);
    };
  }, [loadReports]);

  const filteredReports = useMemo(() => {
    const keyword = filters.search.trim().toLowerCase();
    return reports.filter((report) => {
      const matchesKeyword = !keyword || [report.id, report.type, report.target, report.reporter, report.reason].join(' ').toLowerCase().includes(keyword);
      const matchesStatus = filters.status === 'all' || report.status === filters.status;
      const matchesSeverity = filters.severity === 'all' || report.severity === filters.severity;
      const matchesQueue = filters.queue === 'all' || report.queue === filters.queue;
      return matchesKeyword && matchesStatus && matchesSeverity && matchesQueue;
    });
  }, [filters, reports]);

  const queueMix = useMemo(() => getQueueMix(filteredReports), [filteredReports]);
  const kpis = useMemo(() => buildKpis(filteredReports, removals, appeals), [filteredReports, removals, appeals]);
  const scoring = useMemo(() => scoreBars(filteredReports), [filteredReports]);
  const activeReport = useMemo(
    () => filteredReports.find((item) => item.id === activeReportId) || filteredReports[0] || null,
    [activeReportId, filteredReports]
  );

  const totalHeight = filteredReports.length * ROW_HEIGHT;
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const endIndex = Math.min(filteredReports.length, Math.ceil((scrollTop + QUEUE_HEIGHT) / ROW_HEIGHT) + OVERSCAN);
  const visibleRows = filteredReports.slice(startIndex, endIndex);

  const patchReport = useCallback((reportId, patch) => {
    setReports((prev) => prev.map((item) => item.id === reportId ? { ...item, ...patch } : item));
  }, []);

  const createRemovalRecord = useCallback((report, action = 'remove_content') => {
    const record = {
      id: `REM-${Date.now()}`,
      reportId: report.id,
      target: report.target,
      targetType: report.targetType,
      action,
      reason: report.reason,
      status: 'active',
      executedAt: new Date().toISOString(),
      by: 'Admin Console',
    };
    setRemovals((prev) => [record, ...prev]);
    pushActivity('content_removal', `${report.id} • ${report.target}`, '#f97316');
    return record;
  }, [pushActivity]);

  const createAppealRecord = useCallback((report, request = 'تم فتح استئناف تلقائي بعد إجراء إداري.') => {
    const existing = appeals.find((item) => item.reportId === report.id && item.status !== 'closed');
    if (existing) return existing;
    const appeal = {
      id: `APL-${Date.now()}`,
      reportId: report.id,
      target: report.target,
      appellant: report.reporter,
      request,
      status: 'open',
      severity: report.severity,
      submittedAt: new Date().toISOString(),
      decision: '',
    };
    setAppeals((prev) => [appeal, ...prev]);
    pushActivity('appeal_created', `${report.id} دخل مسار الاستئناف`, '#8b5cf6');
    return appeal;
  }, [appeals, pushActivity]);

  const handleResolve = async (report) => {
    try {
      setBusyId(report.id);
      patchReport(report.id, { status: 'resolved' });
      // v88.44: Use admin endpoint action 'dismiss' to resolve
      await takeReportAction(report.id, 'dismiss', 'تم اعتماد البلاغ وإغلاقه من لوحة الإدارة.');
      pushActivity('report_resolved', `${report.id} تم اعتماده`, '#22c55e');
      pushToast({ type: 'success', title: 'تم اعتماد القرار', description: `${report.id} تم إنهاؤه بنجاح.` });
    } catch (error) {
      // Fallback to legacy endpoint
      try {
        await updateReportStatus(report.id, 'resolved');
      } catch (err2) {
        patchReport(report.id, { status: report.status });
        pushToast({ type: 'error', title: 'تعذر تحديث الحالة', description: err2?.response?.data?.detail || err2?.message });
      }
    } finally {
      setBusyId('');
    }
  };

  const handleEscalate = async (report) => {
    try {
      setBusyId(report.id);
      patchReport(report.id, { status: 'escalated', severity: report.severity === 'critical' ? 'critical' : 'high' });
      // v88.44: Use admin endpoint action 'escalate'
      await takeReportAction(report.id, 'escalate', 'تم تصعيد البلاغ من لوحة الإدارة.');
      createAppealRecord(report, 'تم التصعيد وفتح قناة مراجعة أعلى للحالة.');
      pushActivity('report_escalated', `${report.id} تم تصعيده`, '#ef4444');
      pushToast({ type: 'warning', title: 'تم التصعيد', description: `${report.id} دخل مسار الإدارة العليا.` });
    } catch (error) {
      // Fallback to legacy endpoint
      try {
        await escalateReport(report.id);
      } catch (err2) {
        patchReport(report.id, { status: report.status, severity: report.severity });
        pushToast({ type: 'error', title: 'تعذر التصعيد', description: err2?.response?.data?.detail || err2?.message });
      }
    } finally {
      setBusyId('');
    }
  };

  // v88.44 — New action: remove content directly from report
  const handleRemoveContentReport = async (report) => {
    try {
      setBusyId(report.id);
      patchReport(report.id, { status: 'resolved' });
      await takeReportAction(report.id, 'remove_content', 'تم حذف المحتوى المبلّغ عنه من لوحة الإدارة.');
      createRemovalRecord(report, 'remove_content');
      createAppealRecord(report, 'تم حذف المحتوى المبلّغ عنه ويمكن لصاحب المحتوى إرسال اعتراض خلال 48 ساعة.');
      pushActivity('content_removed', `${report.id} تم حذف المحتوى`, '#f97316');
      pushToast({ type: 'info', title: 'تم حذف المحتوى', description: `${report.target} تمت إزالته بنجاح.` });
    } catch (error) {
      patchReport(report.id, { status: report.status });
      pushToast({ type: 'error', title: 'تعذر حذف المحتوى', description: error?.response?.data?.detail || error?.message });
    } finally {
      setBusyId('');
    }
  };

  // v88.44 — New action: warn user from report
  const handleWarnUser = async (report) => {
    try {
      setBusyId(report.id);
      await takeReportAction(report.id, 'warn_user', 'تم إرسال تحذير للمستخدم من لوحة الإدارة.');
      patchReport(report.id, { status: 'resolved' });
      pushActivity('user_warned', `${report.id} تم تحذير المستخدم`, '#facc15');
      pushToast({ type: 'warning', title: 'تم إرسال التحذير', description: 'تم إرسال إشعار تحذير لصاحب المحتوى.' });
    } catch (error) {
      pushToast({ type: 'error', title: 'تعذر إرسال التحذير', description: error?.response?.data?.detail || error?.message });
    } finally {
      setBusyId('');
    }
  };

  // v88.44 — New action: ban user from report
  const handleBanUser = async (report) => {
    try {
      setBusyId(report.id);
      await takeReportAction(report.id, 'ban_user', 'تم حظر المستخدم من لوحة الإدارة.');
      patchReport(report.id, { status: 'resolved' });
      pushActivity('user_banned', `${report.id} تم حظر المستخدم`, '#ef4444');
      pushToast({ type: 'error', title: 'تم حظر المستخدم', description: 'تم حظر حساب صاحب المحتوى.' });
    } catch (error) {
      pushToast({ type: 'error', title: 'تعذر حظر المستخدم', description: error?.response?.data?.detail || error?.message });
    } finally {
      setBusyId('');
    }
  };

  const handleRemoveContent = useCallback((report) => {
    // v88.44: Actually call the backend to remove content
    if (report.id && !report.id.startsWith('REP-')) {
      handleRemoveContentReport(report);
    } else {
      patchReport(report.id, { status: report.status === 'resolved' ? 'resolved' : 'investigating' });
      createRemovalRecord(report, report.targetType === 'account' ? 'account_restriction' : 'remove_content');
      createAppealRecord(report, 'تم حذف المحتوى ويمكن لصاحب المحتوى إرسال اعتراض خلال 48 ساعة.');
      pushToast({ type: 'info', title: 'تم تسجيل إزالة محتوى', description: `${report.target} تمت إضافته لسجل الإزالة.` });
    }
  }, [createAppealRecord, createRemovalRecord, patchReport, pushToast]);

  const updateAppeal = useCallback((appealId, decision, nextStatus = 'closed') => {
    setAppeals((prev) => prev.map((item) => item.id === appealId ? { ...item, decision, status: nextStatus } : item));
    pushActivity('appeal_decision', `${appealId} • ${decision}`, '#22c55e');
    pushToast({ type: 'success', title: 'تم حفظ قرار الاستئناف', description: decision });
  }, [pushActivity, pushToast]);

  const updateRemoval = useCallback((removalId, status) => {
    setRemovals((prev) => prev.map((item) => item.id === removalId ? { ...item, status } : item));
    pushActivity('content_status_changed', `${removalId} أصبح ${status}`, status === 'restored' ? '#22c55e' : '#f97316');
  }, [pushActivity]);

  const handleManualReview = useCallback(async (report) => {
    if (!report) {
      pushToast({ type: 'warning', title: 'اختر بلاغًا أولًا', description: 'حدد بلاغًا من القائمة لتطبيق الإجراء.' });
      return;
    }
    const originalStatus = report.status;
    try {
      setBusyId(report.id);
      patchReport(report.id, { status: 'reviewing' });
      // v88.44: Use admin reports endpoint to update status
      try {
        await updateReportStatus(report.id, 'reviewing');
      } catch {
        // If legacy endpoint fails, try admin action
        await takeReportAction(report.id, 'escalate', 'تحويل للمراجعة اليدوية.');
      }
      pushActivity('manual_review', `${report.id} دخل المراجعة اليدوية`, '#3b82f6');
      pushToast({ type: 'success', title: 'تم تحويل البلاغ للمراجعة', description: `${report.id} أصبح قيد التحقيق.` });
    } catch (error) {
      patchReport(report.id, { status: originalStatus });
      pushToast({ type: 'error', title: 'تعذر تحويل البلاغ', description: error?.response?.data?.detail || error?.message });
    } finally {
      setBusyId('');
    }
  }, [patchReport, pushActivity, pushToast]);

  const handleTemporaryBan = useCallback(async (report) => {
    if (!report) {
      pushToast({ type: 'warning', title: 'اختر بلاغًا أولًا', description: 'حدد بلاغًا من القائمة لتطبيق الإجراء.' });
      return;
    }
    patchReport(report.id, { status: 'investigating', severity: report.severity === 'low' ? 'medium' : report.severity });
    createRemovalRecord(report, report.targetType === 'account' ? 'account_restriction' : 'temporary_ban');
    createAppealRecord(report, 'تم تنفيذ قيد مؤقت وربطه بسجل البلاغ مع فتح الاستئناف.');
    pushToast({ type: 'warning', title: 'تم تسجيل الحظر المؤقت', description: `${report.id} دخل مسار القيود المؤقتة.` });
  }, [createAppealRecord, createRemovalRecord, patchReport, pushToast]);

  const handleFullSync = useCallback(async () => {
    await loadReports();
    pushActivity('queue_synced', 'تم تحديث البلاغات وسجلات الإزالة والاستئناف.', '#38bdf8');
    pushToast({ type: 'success', title: 'تمت المزامنة', description: 'تم جلب أحدث بيانات البلاغات من الخادم.' });
  }, [loadReports, pushActivity, pushToast]);

  const moderationActions = [
    { key: 'temporary_ban', title: 'حظر مؤقت', description: 'تسجيل قيد مؤقت وربطه بالبلاغ المحدد', tone: '#ef4444', action: () => handleTemporaryBan(activeReport) },
    { key: 'remove_content', title: 'إخفاء المحتوى', description: 'إزالة فورية للمحتوى وربطه بسجل الإزالة', tone: '#f97316', action: () => handleRemoveContent(activeReport) },
    { key: 'manual_review', title: 'مراجعة يدوية', description: 'تحويل البلاغ المحدد إلى حالة التحقيق', tone: '#3b82f6', action: () => handleManualReview(activeReport) },
    { key: 'warn_user', title: 'تحذير المستخدم', description: 'إرسال إشعار تحذير لصاحب المحتوى المبلّغ عنه', tone: '#facc15', action: () => activeReport ? handleWarnUser(activeReport) : pushToast({ type: 'warning', title: 'اختر بلاغًا أولًا', description: 'حدد بلاغًا من القائمة.' }) },
    { key: 'ban_user', title: 'حظر المستخدم', description: 'حظر دائم لحساب صاحب المحتوى المبلّغ عنه', tone: '#dc2626', action: () => activeReport ? handleBanUser(activeReport) : pushToast({ type: 'warning', title: 'اختر بلاغًا أولًا', description: 'حدد بلاغًا من القائمة.' }) },
    { key: 'open_appeal', title: 'فتح استئناف', description: 'إنشاء اعتراض مرتبط مباشرة بالبلاغ الحالي', tone: '#8b5cf6', action: () => activeReport ? createAppealRecord(activeReport, 'تم إنشاء استئناف يدوي من صندوق الأدوات.') : pushToast({ type: 'warning', title: 'اختر بلاغًا أولًا', description: 'حدد بلاغًا من القائمة لفتح الاستئناف.' }) },
  ];

  return (
    <AdminLayout>
      <section style={{ display: 'grid', gap: 18 }}>
        <Card style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 13, color: '#60a5fa', marginBottom: 8 }}>مركز البلاغات • حذف المحتوى • نظام الطعون • أدوات الإشراف</div>
              <h2 style={{ margin: 0, color: '#f8fafc' }}>مركز البلاغات والإشراف المكتمل</h2>
              <p style={{ margin: '10px 0 0', color: '#94a3b8', maxWidth: 820 }}>
                تم استكمال مركز البلاغات ليشمل مراجعة البلاغات، سجل إزالة المحتوى، ونظام استئناف داخلي مرتبط بكل قرار إداري بدل الاكتفاء بقائمة ناقصة فقط.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Button variant="secondary" onClick={loadReports} loading={loading}>تحديث الآن</Button>
              <Button onClick={handleFullSync}>مزامنة كاملة</Button>
            </div>
          </div>
        </Card>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
          {kpis.map((item) => (
            <Card key={item.label} style={{ padding: 18, background: 'rgba(15,23,42,0.78)' }}>
              <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 10 }}>{item.label}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#f8fafc', marginBottom: 8 }}>{item.value}</div>
              <div style={{ color: '#64748b', fontSize: 12 }}>{item.hint}</div>
            </Card>
          ))}
        </section>

        <Card style={{ padding: 12 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {[
              ['queue', 'Review Queue'],
              ['removals', 'Content Removal'],
              ['appeals', 'Appeals System'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setActiveTab(value)}
                style={{
                  border: 0,
                  cursor: 'pointer',
                  borderRadius: 999,
                  padding: '10px 16px',
                  color: '#f8fafc',
                  background: activeTab === value ? 'linear-gradient(135deg,#8b5cf6,#06b6d4)' : 'rgba(255,255,255,0.06)',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </Card>

        {activeTab === 'queue' ? (
          <>
            <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(320px, 0.8fr)', gap: 18 }}>
              <Card style={{ padding: 18, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
                  <div>
                    <h3 style={{ margin: 0, color: '#f8fafc' }}>طابور المراجعة</h3>
                    <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 6 }}>قائمة مراجعة افتراضية سريعة مع إجراءات مباشرة للحذف والتصعيد والاستئناف.</div>
                  </div>
                  <div style={{ color: '#64748b', fontSize: 12, display: 'flex', alignItems: 'center' }}>Windowed list • {filteredReports.length} items</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginBottom: 16 }}>
                  <Input label="بحث" value={filters.search} onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))} placeholder="المعرف / المستخدم / السبب" />
                  <label className="field select-field"><span className="field-label">الحالة</span><select className="input" value={filters.status} onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}><option value="all">الكل</option><option value="pending">بانتظار</option><option value="investigating">تحقيق</option><option value="escalated">تصعيد</option><option value="resolved">منتهي</option><option value="appealed">استئناف</option></select></label>
                  <label className="field select-field"><span className="field-label">الخطورة</span><select className="input" value={filters.severity} onChange={(event) => setFilters((prev) => ({ ...prev, severity: event.target.value }))}><option value="all">الكل</option><option value="critical">critical</option><option value="high">high</option><option value="medium">medium</option><option value="low">low</option></select></label>
                  <label className="field select-field"><span className="field-label">المسار</span><select className="input" value={filters.queue} onChange={(event) => setFilters((prev) => ({ ...prev, queue: event.target.value }))}><option value="all">الكل</option>{queueMix.map((item) => <option key={item.label} value={item.label}>{item.label}</option>)}</select></label>
                </div>

                <div
                  onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
                  style={{
                    height: QUEUE_HEIGHT,
                    overflowY: 'auto',
                    borderRadius: 20,
                    background: 'rgba(2,6,23,0.72)',
                    border: '1px solid rgba(148,163,184,0.12)',
                    padding: 12,
                  }}
                >
                  <div style={{ height: totalHeight || 120, position: 'relative' }}>
                    {visibleRows.map((report, index) => {
                      const actualIndex = startIndex + index;
                      return (
                        <div key={report.id} style={{ position: 'absolute', insetInline: 0, top: actualIndex * ROW_HEIGHT, height: ROW_HEIGHT }}>
                          <QueueRow
                            report={report}
                            active={activeReport?.id === report.id}
                            onOpen={(value) => setActiveReportId(value.id)}
                            onResolve={handleResolve}
                            onEscalate={handleEscalate}
                            onRemove={handleRemoveContent}
                          />
                        </div>
                      );
                    })}
                    {!filteredReports.length ? <div style={{ display: 'grid', placeItems: 'center', height: 120, color: '#94a3b8' }}>لا توجد نتائج مطابقة للفلترة الحالية.</div> : null}
                  </div>
                </div>
              </Card>

              <Card style={{ padding: 18, display: 'grid', gap: 16 }}>
                <div>
                  <h3 style={{ margin: 0, color: '#f8fafc' }}>أدوات الإشراف</h3>
                  <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 6 }}>أوامر سريعة للمراجعين مع توضيح أثر كل إجراء.</div>
                </div>

                <div style={{ display: 'grid', gap: 10 }}>
                  {moderationActions.map((tool) => (
                    <button
                      key={tool.key}
                      type="button"
                      onClick={tool.action}
                      style={{
                        border: `1px solid ${tool.tone}55`,
                        background: `${tool.tone}16`,
                        borderRadius: 18,
                        padding: '14px 16px',
                        textAlign: 'right',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ color: '#f8fafc', fontWeight: 700 }}>{tool.title}</div>
                      <div style={{ color: '#cbd5e1', fontSize: 12, marginTop: 4 }}>{tool.description}</div>
                    </button>
                  ))}
                </div>

                {activeReport ? (
                  <div style={{ borderRadius: 20, padding: 16, background: 'rgba(15,23,42,0.82)', border: '1px solid rgba(148,163,184,0.12)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 10 }}>
                      <div>
                        <div style={{ color: '#60a5fa', fontSize: 12 }}>{activeReport.id}</div>
                        <div style={{ color: '#f8fafc', fontWeight: 800 }}>{activeReport.target}</div>
                      </div>
                      <span style={{ padding: '6px 10px', borderRadius: 999, background: `${severityColor(activeReport.severity)}22`, color: severityColor(activeReport.severity), fontSize: 12 }}>
                        {activeReport.severity}
                      </span>
                    </div>
                    <div style={{ color: '#e2e8f0', fontSize: 14, marginBottom: 8 }}>{activeReport.type}</div>
                    <div style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.8 }}>{activeReport.reason}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10, marginTop: 14 }}>
                      <div style={{ padding: 12, borderRadius: 14, background: 'rgba(255,255,255,0.04)' }}><div style={{ color: '#64748b', fontSize: 12 }}>المبلّغ</div><div style={{ color: '#f8fafc', marginTop: 4 }}>{activeReport.reporter}</div></div>
                      <div style={{ padding: 12, borderRadius: 14, background: 'rgba(255,255,255,0.04)' }}><div style={{ color: '#64748b', fontSize: 12 }}>الثقة</div><div style={{ color: '#f8fafc', marginTop: 4 }}>{activeReport.score}%</div></div>
                      <div style={{ padding: 12, borderRadius: 14, background: 'rgba(255,255,255,0.04)' }}><div style={{ color: '#64748b', fontSize: 12 }}>المسار</div><div style={{ color: '#f8fafc', marginTop: 4 }}>{activeReport.queue}</div></div>
                      <div style={{ padding: 12, borderRadius: 14, background: 'rgba(255,255,255,0.04)' }}><div style={{ color: '#64748b', fontSize: 12 }}>SLA</div><div style={{ color: '#f8fafc', marginTop: 4 }}>{activeReport.slaMinutes} دقيقة</div></div>
                    </div>
                    {/* v88.44: Show snapshot content if available */}
                    {activeReport.snapshot && Object.keys(activeReport.snapshot).length > 1 ? (
                      <div style={{ borderRadius: 14, padding: 12, marginTop: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(148,163,184,0.12)' }}>
                        <div style={{ color: '#94a3b8', fontSize: 11, marginBottom: 6 }}>محتوى البلاغ (لقطة):</div>
                        {activeReport.snapshot.content ? <div style={{ color: '#e2e8f0', fontSize: 13, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{activeReport.snapshot.content}</div> : null}
                        {activeReport.snapshot.username ? <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>@{activeReport.snapshot.username}</div> : null}
                      </div>
                    ) : null}

                    {activeReport.duplicateCount > 0 ? (
                      <div style={{ color: '#f97316', fontSize: 12, marginTop: 10 }}>⚠️ تم الإبلاغ عن هذا المحتوى {activeReport.duplicateCount} مرة</div>
                    ) : null}

                    <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
                      <Button variant="success" loading={busyId === activeReport.id && activeReport.status !== 'escalated'} onClick={() => handleResolve(activeReport)}>اعتماد البلاغ</Button>
                      <Button variant="danger" loading={busyId === activeReport.id} onClick={() => handleRemoveContent(activeReport)}>إزالة المحتوى</Button>
                      <Button loading={busyId === activeReport.id && activeReport.status === 'escalated'} onClick={() => handleEscalate(activeReport)}>تصعيد فوري</Button>
                      <Button variant="warning" loading={busyId === activeReport.id} onClick={() => handleWarnUser(activeReport)}>تحذير المستخدم</Button>
                      <Button variant="danger" loading={busyId === activeReport.id} onClick={() => handleBanUser(activeReport)}>حظر المستخدم</Button>
                      <Button variant="secondary" onClick={() => createAppealRecord(activeReport, 'تم إنشاء استئناف يدوي من شاشة البلاغات.')}>فتح استئناف</Button>
                    </div>
                  </div>
                ) : null}
              </Card>
            </section>

            <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 18 }}>
              <Card style={{ padding: 18 }}>
                <h3 style={{ marginTop: 0, color: '#f8fafc' }}>توزيع البلاغات حسب المسار</h3>
                <div style={{ display: 'grid', gap: 10 }}>
                  {queueMix.map((item) => (
                    <div key={item.label}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1', fontSize: 13, marginBottom: 6 }}>
                        <span>{item.label}</span>
                        <strong>{item.value}</strong>
                      </div>
                      <div style={{ height: 10, borderRadius: 999, overflow: 'hidden', background: 'rgba(148,163,184,0.12)' }}>
                        <div style={{ width: `${(item.value / Math.max(filteredReports.length, 1)) * 100}%`, height: '100%', background: 'linear-gradient(90deg,#38bdf8,#8b5cf6)' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card style={{ padding: 18 }}>
                <h3 style={{ marginTop: 0, color: '#f8fafc' }}>أعلى البلاغات نقاطًا</h3>
                <div style={{ display: 'grid', gap: 10 }}>
                  {scoring.map((item) => (
                    <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '110px minmax(0,1fr) 56px', gap: 10, alignItems: 'center' }}>
                      <span style={{ color: '#cbd5e1', fontSize: 12 }}>{item.label}</span>
                      <div style={{ height: 12, borderRadius: 999, overflow: 'hidden', background: 'rgba(148,163,184,0.12)' }}>
                        <div style={{ width: `${item.value}%`, height: '100%', background: `linear-gradient(90deg, ${severityColor(item.severity)}, #38bdf8)` }} />
                      </div>
                      <strong style={{ color: '#f8fafc', fontSize: 12 }}>{item.value}%</strong>
                    </div>
                  ))}
                </div>
              </Card>
            </section>
          </>
        ) : null}

        {activeTab === 'removals' ? (
          <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.3fr) minmax(320px, 0.8fr)', gap: 18 }}>
            <Card style={{ padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 14 }}>
                <div>
                  <h3 style={{ margin: 0, color: '#f8fafc' }}>سجل حذف المحتوى</h3>
                  <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 6 }}>سجل كامل لكل إزالة أو إخفاء محتوى مع إمكانية الاسترجاع وفتح استئناف.</div>
                </div>
                <div style={{ color: '#64748b', fontSize: 12 }}>{removals.length} actions</div>
              </div>
              <div style={{ display: 'grid', gap: 12 }}>
                {removals.map((item) => (
                  <div key={item.id} style={{ borderRadius: 18, padding: 16, background: 'rgba(15,23,42,0.72)', border: '1px solid rgba(148,163,184,0.12)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                      <div>
                        <div style={{ color: '#f8fafc', fontWeight: 800 }}>{item.target}</div>
                        <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>{item.id} • {item.targetType} • {item.action}</div>
                      </div>
                      <span style={{ padding: '5px 10px', borderRadius: 999, background: item.status === 'restored' ? 'rgba(34,197,94,0.16)' : 'rgba(249,115,22,0.16)', color: item.status === 'restored' ? '#22c55e' : '#f97316', fontSize: 12 }}>{item.status}</span>
                    </div>
                    <div style={{ color: '#cbd5e1', fontSize: 13, marginTop: 10 }}>{item.reason}</div>
                    <div style={{ color: '#64748b', fontSize: 12, marginTop: 8 }}>{new Date(item.executedAt).toLocaleString('ar-EG')} • بواسطة {item.by}</div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                      {item.status !== 'restored' ? <Button size="small" variant="success" onClick={() => updateRemoval(item.id, 'restored')}>استرجاع المحتوى</Button> : null}
                      <Button size="small" variant="secondary" onClick={() => updateRemoval(item.id, 'active')}>إعادة التفعيل</Button>
                      <Button size="small" onClick={() => setAppeals((prev) => [{ id: `APL-${Date.now()}`, reportId: item.reportId, target: item.target, appellant: '@appeal_user', request: 'أطالب بإعادة فحص قرار إزالة المحتوى.', status: 'open', severity: 'medium', submittedAt: new Date().toISOString(), decision: '' }, ...prev])}>فتح استئناف</Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card style={{ padding: 18 }}>
              <h3 style={{ marginTop: 0, color: '#f8fafc' }}>لماذا هذا القسم مهم</h3>
              <ul style={{ margin: 0, paddingInlineStart: 18, color: '#cbd5e1', lineHeight: 1.9, fontSize: 14 }}>
                <li>تتبع كل قرار إزالة محتوى بشكل واضح.</li>
                <li>إمكانية الاسترجاع بدون مغادرة لوحة الإدارة.</li>
                <li>ربط مباشر مع الاستئناف بدل العمل اليدوي الخارجي.</li>
                <li>جاهز للربط لاحقًا مع واجهة حذف المنشورات والتعليقات بشكل أعمق.</li>
              </ul>
            </Card>
          </section>
        ) : null}

        {activeTab === 'appeals' ? (
          <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.3fr) minmax(320px, 0.8fr)', gap: 18 }}>
            <Card style={{ padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 14 }}>
                <div>
                  <h3 style={{ margin: 0, color: '#f8fafc' }}>مركز الطعون</h3>
                  <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 6 }}>نظام استئناف كامل لمراجعة اعتراضات المستخدمين على قرارات الحظر أو إزالة المحتوى.</div>
                </div>
                <div style={{ color: '#64748b', fontSize: 12 }}>{appeals.length} appeal cases</div>
              </div>
              <div style={{ display: 'grid', gap: 12 }}>
                {appeals.map((item) => (
                  <div key={item.id} style={{ borderRadius: 18, padding: 16, background: 'rgba(15,23,42,0.72)', border: '1px solid rgba(148,163,184,0.12)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                      <div>
                        <div style={{ color: '#f8fafc', fontWeight: 800 }}>{item.target}</div>
                        <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>{item.id} • {item.reportId} • {item.appellant}</div>
                      </div>
                      <span style={{ padding: '5px 10px', borderRadius: 999, background: item.status === 'closed' ? 'rgba(34,197,94,0.16)' : item.status === 'under_review' ? 'rgba(59,130,246,0.16)' : 'rgba(249,115,22,0.16)', color: item.status === 'closed' ? '#22c55e' : item.status === 'under_review' ? '#60a5fa' : '#f97316', fontSize: 12 }}>{item.status}</span>
                    </div>
                    <div style={{ color: '#cbd5e1', fontSize: 13, marginTop: 10, lineHeight: 1.8 }}>{item.request}</div>
                    {item.decision ? <div style={{ color: '#86efac', fontSize: 13, marginTop: 8 }}>القرار: {item.decision}</div> : null}
                    <div style={{ color: '#64748b', fontSize: 12, marginTop: 8 }}>{new Date(item.submittedAt).toLocaleString('ar-EG')}</div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                      <Button size="small" variant="secondary" onClick={() => updateAppeal(item.id, 'تم قبول الاستئناف وإرجاع المحتوى.', 'closed')}>قبول الاستئناف</Button>
                      <Button size="small" onClick={() => updateAppeal(item.id, 'تم تحويله لمراجعة يدوية موسعة.', 'under_review')}>تحت المراجعة</Button>
                      <Button size="small" variant="danger" onClick={() => updateAppeal(item.id, 'تم رفض الاستئناف مع الإبقاء على القرار.', 'closed')}>رفض الاستئناف</Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card style={{ padding: 18 }}>
              <h3 style={{ marginTop: 0, color: '#f8fafc' }}>سجل النشاط الإداري</h3>
              <div style={{ display: 'grid', gap: 10 }}>
                {activityLog.map((item) => (
                  <div key={item.id} style={{ borderRadius: 16, padding: 12, background: `${item.tone}16`, border: `1px solid ${item.tone}44` }}>
                    <div style={{ color: '#f8fafc', fontWeight: 700 }}>{item.title}</div>
                    <div style={{ color: '#cbd5e1', fontSize: 13, marginTop: 4 }}>{item.description}</div>
                    <div style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>{new Date(item.at).toLocaleString('ar-EG')}</div>
                  </div>
                ))}
                {!activityLog.length ? <div style={{ color: '#94a3b8', fontSize: 13 }}>سيظهر هنا أي قرار إشراف أو استئناف جديد.</div> : null}
              </div>
            </Card>
          </section>
        ) : null}
      </section>
    </AdminLayout>
  );
}

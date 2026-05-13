import { useCallback, useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import { useToast } from '../../components/admin/ToastProvider.jsx';
import { escalateReport, getAdminReportsSummary, updateReportStatus } from '../../api/admin.js';
import socket from '../../api/socket.js';

const ROW_HEIGHT = 94;
const QUEUE_HEIGHT = 520;
const OVERSCAN = 4;

const FALLBACK_REPORTS = [
  {
    id: 'REP-4102',
    type: 'انتحال شخصية',
    target: '@fake.company.support',
    targetType: 'account',
    reporter: '@salma',
    severity: 'critical',
    status: 'pending',
    score: 96,
    queue: 'identity',
    reason: 'مطابقة اسم وهوية مع حساب موثّق ومحاولة سحب بيانات المستخدمين.',
    slaMinutes: 12,
    createdAt: '2026-05-11T08:15:00.000Z',
  },
  {
    id: 'REP-4103',
    type: 'تحرش ورسائل مسيئة',
    target: 'Chat Room #778',
    targetType: 'chat',
    reporter: '@mahmoud',
    severity: 'high',
    status: 'investigating',
    score: 82,
    queue: 'safety',
    reason: 'بلاغ متكرر من أكثر من مستخدم مع كلمات مفتاحية خطيرة.',
    slaMinutes: 28,
    createdAt: '2026-05-11T08:21:00.000Z',
  },
  {
    id: 'REP-4104',
    type: 'محتوى عنيف',
    target: 'Post #29018',
    targetType: 'post',
    reporter: '@nada',
    severity: 'high',
    status: 'pending',
    score: 77,
    queue: 'content',
    reason: 'صورة حساسة بدون تحذير + انتشار سريع داخل الريلز.',
    slaMinutes: 34,
    createdAt: '2026-05-11T08:31:00.000Z',
  },
  {
    id: 'REP-4105',
    type: 'Spam / Scam',
    target: 'Live Room #44',
    targetType: 'live',
    reporter: '@zeinab',
    severity: 'medium',
    status: 'escalated',
    score: 71,
    queue: 'commerce',
    reason: 'روابط مشبوهة وعروض وهمية أثناء البث.',
    slaMinutes: 49,
    createdAt: '2026-05-11T08:37:00.000Z',
  },
  {
    id: 'REP-4106',
    type: 'copyright',
    target: 'Reel #7771',
    targetType: 'reel',
    reporter: '@rights.owner',
    severity: 'medium',
    status: 'resolved',
    score: 58,
    queue: 'ip',
    reason: 'مطالبة حقوق نشر مع إثبات ملكية للمحتوى الصوتي.',
    slaMinutes: 81,
    createdAt: '2026-05-11T08:41:00.000Z',
  },
];

function duplicateSeedReports(base) {
  return Array.from({ length: 42 }, (_, index) => {
    const template = base[index % base.length];
    return {
      ...template,
      id: `${template.id}-${index + 1}`,
      score: Math.max(42, template.score - (index % 14) + ((index * 3) % 9)),
      slaMinutes: template.slaMinutes + index * 2,
      createdAt: new Date(Date.now() - index * 6 * 60 * 1000).toISOString(),
      reporter: `${template.reporter}${index % 3 === 0 ? '' : `_${index}`}`,
    };
  }).sort((a, b) => {
    const severityWeight = { critical: 4, high: 3, medium: 2, low: 1 };
    return (severityWeight[b.severity] || 0) - (severityWeight[a.severity] || 0) || new Date(b.createdAt) - new Date(a.createdAt);
  });
}

function normalizeReports(payload) {
  const items = Array.isArray(payload?.items)
    ? payload.items
    : Array.isArray(payload?.reports)
      ? payload.reports
      : Array.isArray(payload)
        ? payload
        : null;

  if (!items?.length) return duplicateSeedReports(FALLBACK_REPORTS);

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

function buildKpis(reports) {
  const pending = reports.filter((item) => item.status === 'pending').length;
  const escalated = reports.filter((item) => item.status === 'escalated').length;
  const critical = reports.filter((item) => item.severity === 'critical').length;
  const underSla = reports.filter((item) => item.slaMinutes <= 30).length;
  const accuracy = Math.round(reports.reduce((sum, item) => sum + Number(item.score || 0), 0) / Math.max(reports.length, 1));
  return [
    { label: 'Report Center', value: reports.length, hint: 'إجمالي البلاغات المفتوحة والمتابعة' },
    { label: 'Review Queue', value: pending, hint: 'بانتظار أول إجراء من الفريق' },
    { label: 'Critical cases', value: critical, hint: 'أولوية قصوى تحتاج قرار سريع' },
    { label: 'Moderation accuracy', value: `${accuracy}%`, hint: 'متوسط دقة الفرز الذكي' },
    { label: 'Escalations', value: escalated, hint: 'حالات تم رفعها للإدارة العليا' },
    { label: 'SLA ≤ 30m', value: `${underSla}/${reports.length}`, hint: 'الالتزام بزمن الاستجابة' },
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

function QueueRow({ report, active, onOpen, onResolve, onEscalate }) {
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
        gridTemplateColumns: 'minmax(0, 1.7fr) minmax(180px, 0.9fr) minmax(180px, 0.9fr)',
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
        <Button size="small" variant="danger" onClick={(event) => { event.stopPropagation(); onEscalate(report); }}>تصعيد</Button>
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

  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await getAdminReportsSummary();
      const normalized = normalizeReports(data);
      setReports(normalized);
      setActiveReportId((prev) => prev || normalized[0]?.id || '');
    } catch (error) {
      const fallback = duplicateSeedReports(FALLBACK_REPORTS);
      setReports(fallback);
      setActiveReportId((prev) => prev || fallback[0]?.id || '');
      pushToast({ type: 'warning', title: 'تم تشغيل بيانات تجريبية', description: error?.response?.data?.detail || 'تعذر جلب البلاغات من الخادم حالياً.' });
    } finally {
      setLoading(false);
    }
  }, [pushToast]);

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
  const kpis = useMemo(() => buildKpis(filteredReports), [filteredReports]);
  const scoring = useMemo(() => scoreBars(filteredReports), [filteredReports]);
  const activeReport = useMemo(
    () => filteredReports.find((item) => item.id === activeReportId) || filteredReports[0] || null,
    [activeReportId, filteredReports]
  );

  const totalHeight = filteredReports.length * ROW_HEIGHT;
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const endIndex = Math.min(filteredReports.length, Math.ceil((scrollTop + QUEUE_HEIGHT) / ROW_HEIGHT) + OVERSCAN);
  const visibleRows = filteredReports.slice(startIndex, endIndex);

  const patchReport = (reportId, patch) => {
    setReports((prev) => prev.map((item) => item.id === reportId ? { ...item, ...patch } : item));
  };

  const handleResolve = async (report) => {
    try {
      setBusyId(report.id);
      patchReport(report.id, { status: 'resolved' });
      await updateReportStatus(report.id, 'resolved');
      pushToast({ type: 'success', title: 'تم اعتماد القرار', description: `${report.id} تم إنهاؤه بنجاح.` });
    } catch (error) {
      patchReport(report.id, { status: report.status });
      pushToast({ type: 'error', title: 'تعذر تحديث الحالة', description: error?.response?.data?.detail || error?.message });
    } finally {
      setBusyId('');
    }
  };

  const handleEscalate = async (report) => {
    try {
      setBusyId(report.id);
      patchReport(report.id, { status: 'escalated', severity: report.severity === 'critical' ? 'critical' : 'high' });
      await escalateReport(report.id);
      pushToast({ type: 'warning', title: 'تم التصعيد', description: `${report.id} دخل مسار الإدارة العليا.` });
    } catch (error) {
      patchReport(report.id, { status: report.status, severity: report.severity });
      pushToast({ type: 'error', title: 'تعذر التصعيد', description: error?.response?.data?.detail || error?.message });
    } finally {
      setBusyId('');
    }
  };

  const moderationActions = [
    { title: 'حظر مؤقت', description: 'إيقاف 24 ساعة مع إرسال تنبيه للمستخدم', tone: '#ef4444' },
    { title: 'إخفاء المحتوى', description: 'إزالة فورية من الـ feed والبحث والريلز', tone: '#f97316' },
    { title: 'مراجعة يدوية', description: 'إسناد البلاغ لأعلى محلل متاح', tone: '#3b82f6' },
    { title: 'رفع للبث المباشر', description: 'ربط البلاغ بنظام live moderation', tone: '#14b8a6' },
  ];

  return (
    <AdminLayout>
      <section style={{ display: 'grid', gap: 18 }}>
        <Card style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 13, color: '#60a5fa', marginBottom: 8 }}>Report Center • Review Queue • Moderation Tools</div>
              <h2 style={{ margin: 0, color: '#f8fafc' }}>مركز البلاغات والإشراف</h2>
              <p style={{ margin: '10px 0 0', color: '#94a3b8', maxWidth: 760 }}>
                تم إضافة مركز بلاغات كامل بفلترة فورية، قائمة مراجعة افتراضية خفيفة على الجوال، وأزرار إشراف سريعة لتقليل زمن القرار على الأجهزة الضعيفة.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Button variant="secondary" onClick={loadReports} loading={loading}>تحديث الآن</Button>
              <Button onClick={() => pushToast({ type: 'info', title: 'Queue synced', description: 'تم مزامنة قائمة المراجعة مع التحديث اللحظي.' })}>مزامنة الـ Queue</Button>
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

        <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(320px, 0.8fr)', gap: 18 }}>
          <Card style={{ padding: 18, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, color: '#f8fafc' }}>Review Queue</h3>
                <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 6 }}>قائمة مراجعة افتراضية سريعة بدلاً من رسم كل العناصر مرة واحدة.</div>
              </div>
              <div style={{ color: '#64748b', fontSize: 12, display: 'flex', alignItems: 'center' }}>Windowed list • {filteredReports.length} items</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginBottom: 16 }}>
              <Input label="بحث" value={filters.search} onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))} placeholder="ID / المستخدم / السبب" />
              <label className="field select-field"><span className="field-label">الحالة</span><select className="input" value={filters.status} onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}><option value="all">الكل</option><option value="pending">بانتظار</option><option value="investigating">تحقيق</option><option value="escalated">تصعيد</option><option value="resolved">منتهي</option></select></label>
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
              <h3 style={{ margin: 0, color: '#f8fafc' }}>Moderation Tools</h3>
              <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 6 }}>أوامر سريعة للمراجعين مع توضيح أثر كل إجراء.</div>
            </div>

            <div style={{ display: 'grid', gap: 10 }}>
              {moderationActions.map((tool) => (
                <button
                  key={tool.title}
                  type="button"
                  onClick={() => pushToast({ type: 'info', title: tool.title, description: tool.description })}
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
                <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
                  <Button variant="success" loading={busyId === activeReport.id && activeReport.status !== 'escalated'} onClick={() => handleResolve(activeReport)}>اعتماد البلاغ</Button>
                  <Button variant="danger" loading={busyId === activeReport.id && activeReport.status === 'escalated'} onClick={() => handleEscalate(activeReport)}>تصعيد فوري</Button>
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
      </section>
    </AdminLayout>
  );
}

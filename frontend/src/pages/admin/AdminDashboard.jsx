import { useCallback, useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import { BarChart, DonutChart, LineChart } from '../../components/admin/Charts.jsx';
import { getAdminOverview } from '../../api/admin.js';
import { adminService } from '../../services/adminService.js';
import socket from '../../api/socket.js';
import { useToast } from '../../components/admin/ToastProvider.jsx';
import { getDeviceProfile } from '../../utils/deviceProfile.js';

function createFallbackSnapshot() {
  const now = Date.now();
  return {
    sources: {
      overview: { status: 'fallback', updatedAt: new Date(now).toISOString() },
      analytics: { status: 'fallback', updatedAt: new Date(now).toISOString() },
      reports: { status: 'fallback', updatedAt: new Date(now).toISOString() },
      audit: { status: 'fallback', updatedAt: new Date(now).toISOString() },
      system: { status: 'fallback', updatedAt: new Date(now).toISOString() },
    },
    metrics: {
      activeUsers: 4860,
      trafficPerMinute: 1284,
      growthRate: 12.4,
      liveMetricsScore: 91,
      moderationQueue: 34,
      reportsOpen: 18,
      cpuUsage: 42,
      memoryUsage: 51,
      diskUsage: 39,
      apiResponseTime: 182,
      retentionRate: 71,
      removalRate: 9,
      appealsOpen: 6,
      revenueEstimate: 1845,
      trafficHistory: Array.from({ length: 8 }, (_, index) => ({ label: `${index + 9}:00`, value: 1200 + index * 190 + ((index % 2) * 140) })),
      growthHistory: Array.from({ length: 7 }, (_, index) => ({ label: `D${index + 1}`, value: 4 + index * 1.6 + ((index % 3) * 0.8) })),
      audienceMix: [
        { label: 'Android', value: 58 },
        { label: 'iOS', value: 23 },
        { label: 'Web', value: 19 },
      ],
      moderationMix: [
        { label: 'بلاغات المستخدمين', value: 11 },
        { label: 'إزالة محتوى', value: 9 },
        { label: 'استئنافات', value: 6 },
        { label: 'حظر وظلي', value: 4 },
      ],
      liveMix: [
        { label: 'Live rooms', value: 16 },
        { label: 'Reels now', value: 41 },
        { label: 'Stories active', value: 22 },
      ],
    },
    auditLogs: Array.from({ length: 7 }, (_, index) => ({
      id: `AUD-${index + 1}`,
      type: index === 0 ? 'critical' : index % 2 ? 'warning' : 'info',
      message: index === 0 ? 'تم تسجيل خروج إجباري لعدة جلسات غير موثقة.' : `إجراء إداري رقم ${index + 1} تم بنجاح.`,
      admin_name: ['Super Admin', 'Content Lead', 'Security Admin'][index % 3],
      timestamp: new Date(now - index * 12 * 60 * 1000).toISOString(),
    })),
    activityStream: Array.from({ length: 6 }, (_, index) => ({
      id: `ACT-${index + 1}`,
      action: ['New report', 'Post approved', 'Live room flagged', 'User restored'][index % 4],
      description: 'تحديث حي على لوحة الإدارة مرتبط بالـ socket أو polling.',
      timestamp: new Date(now - index * 7 * 60 * 1000).toISOString(),
    })),
  };
}

function normalizeOverviewPayload(payload) {
  const fallback = createFallbackSnapshot();
  const metrics = payload?.metrics || {};
  return {
    metrics: {
      ...fallback.metrics,
      activeUsers: Number(metrics.active_users ?? metrics.activeUsers ?? fallback.metrics.activeUsers),
      trafficPerMinute: Number(metrics.traffic_per_minute ?? metrics.total_requests ?? fallback.metrics.trafficPerMinute),
      growthRate: Number(metrics.growth_rate ?? fallback.metrics.growthRate),
      liveMetricsScore: Number(metrics.live_metrics_score ?? fallback.metrics.liveMetricsScore),
      moderationQueue: Number(metrics.moderation_queue ?? metrics.queue_size ?? fallback.metrics.moderationQueue),
      reportsOpen: Number(metrics.reports_open ?? fallback.metrics.reportsOpen),
      cpuUsage: Number(metrics.cpu_usage ?? fallback.metrics.cpuUsage),
      memoryUsage: Number(metrics.memory_usage ?? fallback.metrics.memoryUsage),
      diskUsage: Number(metrics.disk_usage ?? fallback.metrics.diskUsage),
      apiResponseTime: Number(metrics.api_response_time ?? fallback.metrics.apiResponseTime),
      trafficHistory: Array.isArray(metrics.traffic_history) && metrics.traffic_history.length ? metrics.traffic_history : fallback.metrics.trafficHistory,
      growthHistory: Array.isArray(metrics.growth_history) && metrics.growth_history.length ? metrics.growth_history : fallback.metrics.growthHistory,
      audienceMix: Array.isArray(metrics.audience_mix) && metrics.audience_mix.length ? metrics.audience_mix : fallback.metrics.audienceMix,
      liveMix: Array.isArray(metrics.live_mix) && metrics.live_mix.length ? metrics.live_mix : fallback.metrics.liveMix,
    },
    auditLogs: Array.isArray(payload?.audit_logs) && payload.audit_logs.length ? payload.audit_logs : fallback.auditLogs,
    activityStream: Array.isArray(payload?.activity_stream) && payload.activity_stream.length ? payload.activity_stream : fallback.activityStream,
  };
}

function getPerformanceSnapshot() {
  const profile = getDeviceProfile();
  const store = typeof window !== 'undefined' ? window.__YAMSHAT_PERF__ : null;
  const memory = typeof window !== 'undefined' ? window.performance?.memory : null;
  const navigationEntries = typeof performance !== 'undefined' ? performance.getEntriesByType?.('navigation') || [] : [];
  const nav = navigationEntries[0];
  return {
    jsHeapMb: memory ? Math.round(memory.usedJSHeapSize / 1024 / 1024) : 0,
    longTasks: Number(store?.longTasks || 0),
    metricCount: Number(store?.metrics?.length || 0),
    ttfb: nav ? Math.round(nav.responseStart || 0) : 0,
    lowEnd: profile.isLowEndDevice,
    connection: profile.effectiveType,
    quality: profile.preferredVideoQuality,
  };
}

function levelTone(level = 'info') {
  if (['critical', 'error'].includes(level)) return '#ef4444';
  if (['warning', 'pending'].includes(level)) return '#f97316';
  return '#22c55e';
}

function sourceLabel(status) {
  return status === 'live' ? 'API حي' : 'Fallback';
}

export default function AdminDashboard() {
  const { pushToast } = useToast();
  const [dashboard, setDashboard] = useState(() => createFallbackSnapshot());
  const [performanceSnapshot, setPerformanceSnapshot] = useState(() => getPerformanceSnapshot());
  const [refreshInterval, setRefreshInterval] = useState(7000);
  const [loading, setLoading] = useState(true);
  const [tableFilter, setTableFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const loadDashboard = useCallback(async () => {
    const fallback = createFallbackSnapshot();
    try {
      setLoading(true);
      const [overviewResponse, analyticsResponse, reportsResponse, auditResponse, systemResponse] = await Promise.allSettled([
        getAdminOverview(),
        adminService.getAnalyticsDashboard(),
        adminService.getReportsSummary({ period: '24h' }),
        adminService.getAuditLogs({ limit: 12 }),
        adminService.getSystemHealth(),
      ]);

      const overviewNormalized = overviewResponse.status === 'fulfilled'
        ? normalizeOverviewPayload(overviewResponse.value?.data)
        : normalizeOverviewPayload({});

      const analyticsData = analyticsResponse.status === 'fulfilled' ? analyticsResponse.value : null;
      const reportsData = reportsResponse.status === 'fulfilled' ? reportsResponse.value : null;
      const auditData = auditResponse.status === 'fulfilled' ? auditResponse.value : null;
      const systemData = systemResponse.status === 'fulfilled' ? systemResponse.value : null;

      const totals = reportsData?.totals || {};
      const reportManagement = reportsData?.report_management || {};
      const revenueDashboard = reportsData?.revenue_dashboard || {};
      const auditItems = Array.isArray(auditData?.items)
        ? auditData.items
        : Array.isArray(auditData?.logs)
          ? auditData.logs
          : Array.isArray(reportsData?.audit_logs)
            ? reportsData.audit_logs
            : overviewNormalized.auditLogs;

      const mergedMetrics = {
        ...overviewNormalized.metrics,
        activeUsers: Number(analyticsData?.active_users ?? totals.active_users ?? overviewNormalized.metrics.activeUsers),
        moderationQueue: Number(reportManagement.open_reports ?? overviewNormalized.metrics.moderationQueue),
        reportsOpen: Number(reportManagement.open_reports ?? overviewNormalized.metrics.reportsOpen),
        appealsOpen: Number(analyticsData?.appeals_open ?? fallback.metrics.appealsOpen),
        retentionRate: Number(analyticsData?.retention_rate ?? fallback.metrics.retentionRate),
        removalRate: Number(analyticsData?.content_removal_rate ?? fallback.metrics.removalRate),
        revenueEstimate: Number(revenueDashboard.estimated_revenue ?? analyticsData?.revenue_estimate ?? fallback.metrics.revenueEstimate),
        cpuUsage: Number(systemData?.cpu_usage ?? systemData?.statistics?.cpu_usage ?? overviewNormalized.metrics.cpuUsage),
        memoryUsage: Number(systemData?.memory_usage ?? systemData?.statistics?.memory_usage ?? overviewNormalized.metrics.memoryUsage),
        diskUsage: Number(systemData?.disk_usage ?? systemData?.statistics?.disk_usage ?? overviewNormalized.metrics.diskUsage),
        apiResponseTime: Number(systemData?.api_response_time ?? systemData?.statistics?.api_latency ?? overviewNormalized.metrics.apiResponseTime),
        moderationMix: [
          { label: 'بلاغات مفتوحة', value: Number(reportManagement.open_reports ?? fallback.metrics.reportsOpen) },
          { label: 'بلاغات مستخدمين', value: Number(reportManagement.user_reports ?? 0) },
          { label: 'بلاغات البث', value: Number(reportManagement.stream_reports ?? 0) },
          { label: 'Shadow banned', value: Number(reportManagement.shadow_banned_users ?? 0) },
        ],
      };

      setDashboard({
        sources: {
          overview: { status: overviewResponse.status === 'fulfilled' ? 'live' : 'fallback', updatedAt: new Date().toISOString() },
          analytics: { status: analyticsResponse.status === 'fulfilled' ? 'live' : 'fallback', updatedAt: new Date().toISOString() },
          reports: { status: reportsResponse.status === 'fulfilled' ? 'live' : 'fallback', updatedAt: new Date().toISOString() },
          audit: { status: auditResponse.status === 'fulfilled' ? 'live' : 'fallback', updatedAt: new Date().toISOString() },
          system: { status: systemResponse.status === 'fulfilled' ? 'live' : 'fallback', updatedAt: new Date().toISOString() },
        },
        metrics: mergedMetrics,
        auditLogs: auditItems.length ? auditItems : overviewNormalized.auditLogs,
        activityStream: Array.isArray(reportsData?.admin_activity) && reportsData.admin_activity.length
          ? reportsData.admin_activity.map((item, index) => ({ id: `admin-activity-${index}`, action: item.label, description: item.description, timestamp: new Date().toISOString() }))
          : overviewNormalized.activityStream,
      });
      setPerformanceSnapshot(getPerformanceSnapshot());
      if ([overviewResponse, analyticsResponse, reportsResponse, auditResponse, systemResponse].every((item) => item.status !== 'fulfilled')) {
        pushToast({ type: 'warning', title: 'تم تشغيل بيانات احتياطية', description: 'تعذر الوصول إلى خدمات التحليلات الحية بالكامل.' });
      }
    } catch (error) {
      setDashboard(fallback);
      pushToast({ type: 'warning', title: 'Fallback analytics active', description: error?.response?.data?.detail || 'تعذر تحميل بعض المقاييس الحية.' });
    } finally {
      setLoading(false);
    }
  }, [pushToast]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      loadDashboard();
      setPerformanceSnapshot(getPerformanceSnapshot());
    }, refreshInterval);
    return () => window.clearInterval(timer);
  }, [loadDashboard, refreshInterval]);

  useEffect(() => {
    const onMetric = () => setPerformanceSnapshot(getPerformanceSnapshot());
    const onMemoryCritical = () => pushToast({ type: 'warning', title: 'ذاكرة المتصفح مرتفعة', description: 'تم رصد استهلاك عالٍ للذاكرة على الجهاز الحالي.' });
    const onRealtimeMetrics = (nextMetrics) => {
      setDashboard((prev) => ({
        ...prev,
        metrics: {
          ...prev.metrics,
          activeUsers: Number(nextMetrics?.active_users ?? prev.metrics.activeUsers),
          trafficPerMinute: Number(nextMetrics?.traffic_per_minute ?? prev.metrics.trafficPerMinute),
          cpuUsage: Number(nextMetrics?.cpu_usage ?? prev.metrics.cpuUsage),
          memoryUsage: Number(nextMetrics?.memory_usage ?? prev.metrics.memoryUsage),
          apiResponseTime: Number(nextMetrics?.api_response_time ?? prev.metrics.apiResponseTime),
          trafficHistory: Array.isArray(nextMetrics?.traffic_history) && nextMetrics.traffic_history.length ? nextMetrics.traffic_history : prev.metrics.trafficHistory,
          growthHistory: Array.isArray(nextMetrics?.growth_history) && nextMetrics.growth_history.length ? nextMetrics.growth_history : prev.metrics.growthHistory,
        },
        sources: {
          ...prev.sources,
          overview: { status: 'live', updatedAt: new Date().toISOString() },
          system: { status: 'live', updatedAt: new Date().toISOString() },
        },
      }));
    };
    const onAuditLog = (log) => {
      setDashboard((prev) => ({ ...prev, auditLogs: [log, ...prev.auditLogs].slice(0, 10) }));
    };
    const onActivity = (activity) => {
      setDashboard((prev) => ({ ...prev, activityStream: [{ ...activity, id: activity.id || `act-${Date.now()}` }, ...prev.activityStream].slice(0, 10) }));
    };

    window.addEventListener('yamshat:performance-metric', onMetric);
    window.addEventListener('yamshat:memory-critical', onMemoryCritical);
    socket.on('realtime_metrics', onRealtimeMetrics);
    socket.on('new_audit_log', onAuditLog);
    socket.on('activity_update', onActivity);
    return () => {
      window.removeEventListener('yamshat:performance-metric', onMetric);
      window.removeEventListener('yamshat:memory-critical', onMemoryCritical);
      socket.off('realtime_metrics', onRealtimeMetrics);
      socket.off('new_audit_log', onAuditLog);
      socket.off('activity_update', onActivity);
    };
  }, [pushToast]);

  const { metrics, auditLogs, activityStream, sources } = dashboard;

  const kpis = useMemo(() => ([
    { label: 'Active users', value: metrics.activeUsers, tone: '#60a5fa', hint: 'المستخدمون النشطون الآن' },
    { label: 'Traffic / minute', value: metrics.trafficPerMinute || 0, tone: '#22c55e', hint: 'تدفق الحركة الحي' },
    { label: 'Growth', value: `${Number(metrics.growthRate || 0).toFixed(1)}%`, tone: '#f59e0b', hint: 'نمو آخر دورة' },
    { label: 'Moderation queue', value: metrics.moderationQueue || 0, tone: '#fb7185', hint: 'حالات تحتاج قرار' },
    { label: 'Appeals', value: metrics.appealsOpen || 0, tone: '#8b5cf6', hint: 'استئنافات مفتوحة' },
    { label: 'Revenue est.', value: `$${Number(metrics.revenueEstimate || 0).toLocaleString('en-US')}`, tone: '#34d399', hint: 'تقدير إيرادات اللوحة' },
  ]), [metrics]);

  const healthLevel = useMemo(() => {
    const penalty = Number(metrics.cpuUsage || 0) + Number(metrics.memoryUsage || 0) + Number(performanceSnapshot.longTasks || 0) * 4;
    if (penalty > 140) return { label: 'حرج', color: '#ef4444' };
    if (penalty > 95) return { label: 'مراقبة', color: '#f97316' };
    return { label: 'مستقر', color: '#22c55e' };
  }, [metrics.cpuUsage, metrics.memoryUsage, performanceSnapshot.longTasks]);

  const liveTableRows = useMemo(() => {
    const auditRows = auditLogs.map((log, index) => ({
      id: log.id || `audit-${index}`,
      kind: 'audit',
      title: log.message || log.summary || 'Audit log',
      actor: log.admin_name || log.actor || 'Admin',
      level: log.type || log.severity || 'info',
      time: log.timestamp,
    }));
    const activityRows = activityStream.map((activity, index) => ({
      id: activity.id || `activity-${index}`,
      kind: 'activity',
      title: activity.action || activity.label || activity.title || 'Activity',
      actor: activity.actor || 'Realtime engine',
      level: activity.level || 'info',
      time: activity.timestamp || new Date().toISOString(),
      description: activity.description,
    }));

    return [...auditRows, ...activityRows]
      .filter((item) => tableFilter === 'all' ? true : item.kind === tableFilter)
      .filter((item) => `${item.title} ${item.actor} ${item.description || ''}`.toLowerCase().includes(searchTerm.trim().toLowerCase()))
      .sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0));
  }, [activityStream, auditLogs, searchTerm, tableFilter]);

  const sourceCards = useMemo(() => ([
    ['Overview API', sources.overview],
    ['Analytics API', sources.analytics],
    ['Reports API', sources.reports],
    ['Audit API', sources.audit],
    ['System API', sources.system],
  ]), [sources]);

  return (
    <AdminLayout>
      <section style={{ display: 'grid', gap: 18 }}>
        <Card style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div>
              <div style={{ color: '#60a5fa', fontSize: 13, marginBottom: 8 }}>Live dashboards • Real API fusion • Reports + audit + system health</div>
              <h2 style={{ margin: 0, color: '#f8fafc' }}>لوحة الإدارة الحية والتحليلات</h2>
              <p style={{ margin: '10px 0 0', color: '#94a3b8', maxWidth: 820 }}>
                تم تقوية الداشبورد لتجميع بيانات اللوحة العامة، التقارير، سجل التدقيق، وصحة النظام في شاشة واحدة، مع تمييز واضح بين البيانات الحية وبيانات الـ fallback.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <label className="field select-field" style={{ minWidth: 170 }}>
                <span className="field-label">التحديث التلقائي</span>
                <select className="input" value={refreshInterval} onChange={(event) => setRefreshInterval(Number(event.target.value))}>
                  <option value={5000}>كل 5 ثواني</option>
                  <option value={7000}>كل 7 ثواني</option>
                  <option value={15000}>كل 15 ثانية</option>
                  <option value={30000}>كل 30 ثانية</option>
                </select>
              </label>
              <Button variant="secondary" onClick={loadDashboard} loading={loading}>تحديث الآن</Button>
            </div>
          </div>
        </Card>

        <Card style={{ padding: 18, background: `${healthLevel.color}16`, border: `1px solid ${healthLevel.color}44` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ width: 14, height: 14, borderRadius: '50%', background: healthLevel.color, boxShadow: `0 0 24px ${healthLevel.color}` }} />
              <div>
                <div style={{ color: '#f8fafc', fontWeight: 800 }}>حالة النظام: {healthLevel.label}</div>
                <div style={{ color: '#cbd5e1', fontSize: 13 }}>CPU {metrics.cpuUsage || 0}% • RAM {metrics.memoryUsage || 0}% • Latency {metrics.apiResponseTime || 0}ms</div>
              </div>
            </div>
            <div style={{ color: '#94a3b8', fontSize: 13 }}>Connection {performanceSnapshot.connection} • Recommended quality {performanceSnapshot.quality}</div>
          </div>
        </Card>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
          {kpis.map((item) => (
            <Card key={item.label} style={{ padding: 18, background: 'rgba(15,23,42,0.78)' }}>
              <div style={{ color: '#94a3b8', fontSize: 12 }}>{item.label}</div>
              <div style={{ fontSize: 30, fontWeight: 800, margin: '10px 0 8px', color: item.tone }}>{typeof item.value === 'number' ? item.value.toLocaleString('ar-EG') : item.value}</div>
              <div style={{ color: '#64748b', fontSize: 12 }}>{item.hint}</div>
            </Card>
          ))}
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
          {sourceCards.map(([label, source]) => (
            <Card key={label} style={{ padding: 16 }}>
              <div style={{ color: '#94a3b8', fontSize: 12 }}>{label}</div>
              <div style={{ margin: '8px 0', color: source.status === 'live' ? '#22c55e' : '#f59e0b', fontWeight: 800 }}>{sourceLabel(source.status)}</div>
              <div style={{ color: '#64748b', fontSize: 12 }}>{new Date(source.updatedAt).toLocaleString('ar-EG')}</div>
            </Card>
          ))}
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.45fr) minmax(320px, 0.8fr)', gap: 18 }}>
          <Card style={{ padding: 18 }}>
            <h3 style={{ marginTop: 0, color: '#f8fafc' }}>Traffic & growth charts</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 14 }}>
              <div>
                <div style={{ color: '#94a3b8', fontSize: 13, marginBottom: 12 }}>حركة المرور الحية</div>
                <LineChart data={metrics.trafficHistory || []} />
              </div>
              <div>
                <div style={{ color: '#94a3b8', fontSize: 13, marginBottom: 12 }}>معدل النمو</div>
                <BarChart data={metrics.growthHistory || []} />
              </div>
            </div>
          </Card>

          <Card style={{ padding: 18 }}>
            <h3 style={{ marginTop: 0, color: '#f8fafc' }}>Audience mix</h3>
            <DonutChart data={metrics.audienceMix || []} />
          </Card>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 18 }}>
          <Card style={{ padding: 18 }}>
            <h3 style={{ marginTop: 0, color: '#f8fafc' }}>Moderation & appeals distribution</h3>
            <DonutChart data={metrics.moderationMix || []} />
          </Card>

          <Card style={{ padding: 18 }}>
            <div style={{ display: 'grid', gap: 12 }}>
              {[
                { label: 'Retention rate', value: `${metrics.retentionRate || 0}%`, hint: 'استقرار المستخدمين' },
                { label: 'Content removal rate', value: `${metrics.removalRate || 0}%`, hint: 'نسبة قرارات الإزالة' },
                { label: 'Reports open', value: metrics.reportsOpen || 0, hint: 'قضايا مفتوحة الآن' },
                { label: 'Live metrics score', value: `${metrics.liveMetricsScore || 0}/100`, hint: 'تقييم التشغيل الحالي' },
              ].map((item) => (
                <div key={item.label} style={{ borderRadius: 16, padding: 14, background: 'rgba(15,23,42,0.72)', border: '1px solid rgba(148,163,184,0.12)' }}>
                  <div style={{ color: '#94a3b8', fontSize: 12 }}>{item.label}</div>
                  <div style={{ color: '#f8fafc', fontSize: 24, fontWeight: 800, margin: '8px 0 6px' }}>{item.value}</div>
                  <div style={{ color: '#64748b', fontSize: 12 }}>{item.hint}</div>
                </div>
              ))}
            </div>
          </Card>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(320px, 0.9fr)', gap: 18 }}>
          <Card style={{ padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
              <div>
                <h3 style={{ margin: 0, color: '#f8fafc' }}>الجدول الحي المحسّن</h3>
                <div className="muted" style={{ marginTop: 6 }}>بحث + فلاتر + دمج النشاطات والتدقيق في جدول واحد</div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[
                  ['all', 'الكل'],
                  ['audit', 'Audit'],
                  ['activity', 'Activity'],
                ].map(([value, label]) => (
                  <button key={value} type="button" className={`dashboard-filter-chip ${tableFilter === value ? 'active' : ''}`} onClick={() => setTableFilter(value)}>{label}</button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
              <input className="input" style={{ flex: 1, minWidth: 220 }} value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="ابحث في الجداول..." />
            </div>
            <div className="table-shell">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>النوع</th>
                    <th>العنوان</th>
                    <th>المسؤول</th>
                    <th>الحالة</th>
                    <th>الوقت</th>
                  </tr>
                </thead>
                <tbody>
                  {liveTableRows.map((row) => (
                    <tr key={row.id}>
                      <td><span className="row-kind-pill">{row.kind === 'audit' ? 'Audit' : 'Activity'}</span></td>
                      <td>
                        <div style={{ display: 'grid', gap: 4 }}>
                          <strong style={{ color: '#f8fafc' }}>{row.title}</strong>
                          {row.description ? <span className="muted" style={{ fontSize: 12 }}>{row.description}</span> : null}
                        </div>
                      </td>
                      <td>{row.actor}</td>
                      <td><span className="row-level-pill" style={{ '--level-tone': levelTone(row.level) }}>{row.level}</span></td>
                      <td>{new Date(row.time).toLocaleString('ar-EG')}</td>
                    </tr>
                  ))}
                  {!liveTableRows.length ? (
                    <tr>
                      <td colSpan="5" className="table-empty">لا توجد بيانات مطابقة للفلاتر الحالية.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </Card>

          <Card style={{ padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0, color: '#f8fafc' }}>Admin activity stream</h3>
              <span style={{ color: '#94a3b8', fontSize: 12 }}>live updates</span>
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              {activityStream.map((activity, index) => (
                <div key={`${activity.action}-${index}`} style={{ borderRadius: 16, padding: 14, background: 'rgba(15,23,42,0.72)', border: '1px solid rgba(148,163,184,0.12)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', color: '#f8fafc', fontWeight: 700 }}>
                    <span>{activity.action || activity.label}</span>
                    <span style={{ color: '#64748b', fontSize: 12 }}>{new Date(activity.timestamp).toLocaleTimeString('ar-EG')}</span>
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 6 }}>{activity.description}</div>
                </div>
              ))}
            </div>
          </Card>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
          {[
            { label: 'JS heap', value: `${performanceSnapshot.jsHeapMb} MB`, hint: 'قياس ذاكرة المتصفح الحالية' },
            { label: 'Tracked metrics', value: performanceSnapshot.metricCount, hint: 'LCP / CLS / longtask events' },
            { label: 'TTFB', value: `${performanceSnapshot.ttfb} ms`, hint: 'زمن أول استجابة للملاحة' },
            { label: 'Device profile', value: performanceSnapshot.lowEnd ? 'Low-end' : 'Standard', hint: 'تقدير آلي للأجهزة الضعيفة' },
          ].map((item) => (
            <Card key={item.label} style={{ padding: 18 }}>
              <div style={{ color: '#94a3b8', fontSize: 12 }}>{item.label}</div>
              <div style={{ color: '#f8fafc', fontSize: 24, fontWeight: 800, margin: '10px 0 8px' }}>{item.value}</div>
              <div style={{ color: '#64748b', fontSize: 12 }}>{item.hint}</div>
            </Card>
          ))}
        </section>
      </section>

      <style>{`
        .dashboard-filter-chip {
          border: 1px solid rgba(148,163,184,0.18);
          background: rgba(255,255,255,0.04);
          color: #e2e8f0;
          padding: 8px 12px;
          border-radius: 999px;
          cursor: pointer;
        }
        .dashboard-filter-chip.active {
          background: linear-gradient(135deg, #8b5cf6, #06b6d4);
          border-color: transparent;
        }
        .row-kind-pill,
        .row-level-pill {
          display: inline-flex;
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
        }
        .row-kind-pill {
          background: rgba(59,130,246,0.12);
          color: #bfdbfe;
        }
        .row-level-pill {
          --level-tone: #22c55e;
          background: color-mix(in srgb, var(--level-tone) 16%, transparent);
          color: var(--level-tone);
        }
      `}</style>
    </AdminLayout>
  );
}

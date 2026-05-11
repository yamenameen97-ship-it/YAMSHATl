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

function fallbackOverview() {
  const now = Date.now();
  const trafficHistory = Array.from({ length: 8 }, (_, index) => ({
    label: `${index + 9}:00`,
    value: 1200 + index * 190 + ((index % 2) * 140),
  }));

  const growthHistory = Array.from({ length: 7 }, (_, index) => ({
    label: `D${index + 1}`,
    value: 4 + index * 1.6 + ((index % 3) * 0.8),
  }));

  const auditLogs = Array.from({ length: 7 }, (_, index) => ({
    id: `AUD-${index + 1}`,
    type: index === 0 ? 'critical' : index % 2 ? 'warning' : 'info',
    message: index === 0 ? 'تم تسجيل خروج إجباري لعدة جلسات غير موثقة.' : `إجراء إداري رقم ${index + 1} تم بنجاح.`,
    admin_name: ['Super Admin', 'Content Lead', 'Security Admin'][index % 3],
    timestamp: new Date(now - index * 12 * 60 * 1000).toISOString(),
  }));

  const activityStream = Array.from({ length: 6 }, (_, index) => ({
    id: `ACT-${index + 1}`,
    action: ['New report', 'Post approved', 'Live room flagged', 'User restored'][index % 4],
    description: 'تحديث حي على لوحة الإدارة مرتبط بالـ socket أو polling.',
    timestamp: new Date(now - index * 7 * 60 * 1000).toISOString(),
  }));

  return {
    metrics: {
      active_users: 4860,
      traffic_per_minute: 1284,
      growth_rate: 12.4,
      live_metrics_score: 91,
      moderation_queue: 34,
      reports_open: 18,
      cpu_usage: 42,
      memory_usage: 51,
      disk_usage: 39,
      api_response_time: 182,
      traffic_history: trafficHistory,
      growth_history: growthHistory,
      audience_mix: [
        { label: 'Android', value: 58 },
        { label: 'iOS', value: 23 },
        { label: 'Web', value: 19 },
      ],
      live_mix: [
        { label: 'Live rooms', value: 16 },
        { label: 'Reels now', value: 41 },
        { label: 'Stories active', value: 22 },
      ],
    },
    audit_logs: auditLogs,
    activity_stream: activityStream,
  };
}

function normalizeOverview(payload) {
  const fallback = fallbackOverview();
  const source = payload?.metrics ? payload : fallback;
  const metrics = { ...fallback.metrics, ...(source.metrics || {}) };
  return {
    metrics: {
      ...metrics,
      traffic_history: Array.isArray(metrics.traffic_history) && metrics.traffic_history.length ? metrics.traffic_history : fallback.metrics.traffic_history,
      growth_history: Array.isArray(metrics.growth_history) && metrics.growth_history.length ? metrics.growth_history : fallback.metrics.growth_history,
      audience_mix: Array.isArray(metrics.audience_mix) && metrics.audience_mix.length ? metrics.audience_mix : fallback.metrics.audience_mix,
      live_mix: Array.isArray(metrics.live_mix) && metrics.live_mix.length ? metrics.live_mix : fallback.metrics.live_mix,
    },
    audit_logs: Array.isArray(source.audit_logs) && source.audit_logs.length ? source.audit_logs : fallback.audit_logs,
    activity_stream: Array.isArray(source.activity_stream) && source.activity_stream.length ? source.activity_stream : fallback.activity_stream,
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

export default function AdminDashboard() {
  const { pushToast } = useToast();
  const [dashboard, setDashboard] = useState(() => normalizeOverview(fallbackOverview()));
  const [performanceSnapshot, setPerformanceSnapshot] = useState(() => getPerformanceSnapshot());
  const [refreshInterval, setRefreshInterval] = useState(7000);
  const [loading, setLoading] = useState(true);
  const [tableFilter, setTableFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const [overviewResponse, auditResponse] = await Promise.allSettled([
        getAdminOverview(),
        adminService.getAuditLogs({ limit: 12 }),
      ]);

      const overviewPayload = overviewResponse.status === 'fulfilled' ? overviewResponse.value.data : fallbackOverview();
      const normalized = normalizeOverview(overviewPayload);
      if (auditResponse.status === 'fulfilled') {
        normalized.audit_logs = Array.isArray(auditResponse.value?.items)
          ? auditResponse.value.items.slice(0, 10)
          : normalized.audit_logs;
      }
      setDashboard(normalized);
      setPerformanceSnapshot(getPerformanceSnapshot());
    } catch (error) {
      setDashboard(normalizeOverview(fallbackOverview()));
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
          ...nextMetrics,
          traffic_history: Array.isArray(nextMetrics?.traffic_history) && nextMetrics.traffic_history.length ? nextMetrics.traffic_history : prev.metrics.traffic_history,
          growth_history: Array.isArray(nextMetrics?.growth_history) && nextMetrics.growth_history.length ? nextMetrics.growth_history : prev.metrics.growth_history,
        },
      }));
    };
    const onAuditLog = (log) => {
      setDashboard((prev) => ({ ...prev, audit_logs: [log, ...prev.audit_logs].slice(0, 10) }));
    };
    const onActivity = (activity) => {
      setDashboard((prev) => ({ ...prev, activity_stream: [{ ...activity, id: activity.id || `act-${Date.now()}` }, ...prev.activity_stream].slice(0, 10) }));
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

  const { metrics, audit_logs: auditLogs, activity_stream: activityStream } = dashboard;

  const kpis = useMemo(() => ([
    { label: 'Active users', value: metrics.active_users, tone: '#60a5fa', hint: 'المستخدمون النشطون الآن' },
    { label: 'Traffic / minute', value: metrics.traffic_per_minute || metrics.total_requests || 0, tone: '#22c55e', hint: 'تدفق الحركة الحي' },
    { label: 'Growth', value: `${Number(metrics.growth_rate || 0).toFixed(1)}%`, tone: '#f59e0b', hint: 'نمو آخر دورة' },
    { label: 'Live metrics', value: `${metrics.live_metrics_score || 0}/100`, tone: '#a78bfa', hint: 'جودة التشغيل اللحظي' },
    { label: 'Moderation queue', value: metrics.moderation_queue || metrics.queue_size || 0, tone: '#fb7185', hint: 'محتوى ينتظر القرار' },
    { label: 'API response', value: `${Math.round(metrics.api_response_time || 0)}ms`, tone: '#38bdf8', hint: 'متوسط الاستجابة الحالية' },
  ]), [metrics]);

  const healthLevel = useMemo(() => {
    const penalty = Number(metrics.cpu_usage || 0) + Number(metrics.memory_usage || 0) + Number(performanceSnapshot.longTasks || 0) * 4;
    if (penalty > 140) return { label: 'حرج', color: '#ef4444' };
    if (penalty > 95) return { label: 'مراقبة', color: '#f97316' };
    return { label: 'مستقر', color: '#22c55e' };
  }, [metrics.cpu_usage, metrics.memory_usage, performanceSnapshot.longTasks]);

  const liveTableRows = useMemo(() => {
    const auditRows = auditLogs.map((log, index) => ({
      id: log.id || `audit-${index}`,
      kind: 'audit',
      title: log.message || log.summary || 'Audit log',
      actor: log.admin_name || log.actor || 'Admin',
      level: log.type || 'info',
      time: log.timestamp,
    }));
    const activityRows = activityStream.map((activity, index) => ({
      id: activity.id || `activity-${index}`,
      kind: 'activity',
      title: activity.action || activity.title || 'Activity',
      actor: activity.actor || 'Realtime engine',
      level: activity.level || 'info',
      time: activity.timestamp,
      description: activity.description,
    }));

    return [...auditRows, ...activityRows]
      .filter((item) => tableFilter === 'all' ? true : item.kind === tableFilter)
      .filter((item) => `${item.title} ${item.actor} ${item.description || ''}`.toLowerCase().includes(searchTerm.trim().toLowerCase()))
      .sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0));
  }, [activityStream, auditLogs, searchTerm, tableFilter]);

  return (
    <AdminLayout>
      <section style={{ display: 'grid', gap: 18 }}>
        <Card style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div>
              <div style={{ color: '#60a5fa', fontSize: 13, marginBottom: 8 }}>Charts • Live dashboards • Better tables • Filters</div>
              <h2 style={{ margin: 0, color: '#f8fafc' }}>لوحة الإدارة الحية</h2>
              <p style={{ margin: '10px 0 0', color: '#94a3b8', maxWidth: 820 }}>
                تم تطوير لوحة الأدمن بواجهات Dashboard مباشرة، وجداول محسّنة مع فلترة وبحث، ورسوم بيانية تساعد الفريق يتابع الأداء والعمليات في لحظتها.
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
                <div style={{ color: '#cbd5e1', fontSize: 13 }}>CPU {metrics.cpu_usage || 0}% • RAM {metrics.memory_usage || 0}% • Long tasks {performanceSnapshot.longTasks}</div>
              </div>
            </div>
            <div style={{ color: '#94a3b8', fontSize: 13 }}>Connection {performanceSnapshot.connection} • Recommended quality {performanceSnapshot.quality}</div>
          </div>
        </Card>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
          {kpis.map((item) => (
            <Card key={item.label} style={{ padding: 18, background: 'rgba(15,23,42,0.78)' }}>
              <div style={{ color: '#94a3b8', fontSize: 12 }}>{item.label}</div>
              <div style={{ fontSize: 30, fontWeight: 800, margin: '10px 0 8px', color: item.tone }}>{item.value}</div>
              <div style={{ color: '#64748b', fontSize: 12 }}>{item.hint}</div>
            </Card>
          ))}
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.45fr) minmax(320px, 0.8fr)', gap: 18 }}>
          <Card style={{ padding: 18 }}>
            <h3 style={{ marginTop: 0, color: '#f8fafc' }}>Traffic & growth charts</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 14 }}>
              <div>
                <div style={{ color: '#94a3b8', fontSize: 13, marginBottom: 12 }}>حركة المرور الحية</div>
                <LineChart data={metrics.traffic_history || []} />
              </div>
              <div>
                <div style={{ color: '#94a3b8', fontSize: 13, marginBottom: 12 }}>معدل النمو</div>
                <BarChart data={metrics.growth_history || []} />
              </div>
            </div>
          </Card>

          <Card style={{ padding: 18 }}>
            <h3 style={{ marginTop: 0, color: '#f8fafc' }}>Audience mix</h3>
            <DonutChart data={metrics.audience_mix || []} />
          </Card>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
          {[
            { label: 'البث المباشر', value: metrics.live_mix?.[0]?.value || 0, hint: 'الغرف النشطة الآن' },
            { label: 'الريلز النشطة', value: metrics.live_mix?.[1]?.value || 0, hint: 'محتوى سريع مباشر' },
            { label: 'القصص النشطة', value: metrics.live_mix?.[2]?.value || 0, hint: 'قصص قيد العرض' },
            { label: 'التقارير المفتوحة', value: metrics.reports_open || 0, hint: 'يحتاج متابعة' },
          ].map((item) => (
            <Card key={item.label} style={{ padding: 18 }}>
              <div style={{ color: '#94a3b8', fontSize: 12 }}>{item.label}</div>
              <div style={{ color: '#f8fafc', fontSize: 24, fontWeight: 800, margin: '10px 0 8px' }}>{item.value}</div>
              <div style={{ color: '#64748b', fontSize: 12 }}>{item.hint}</div>
            </Card>
          ))}
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
                    <span>{activity.action}</span>
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

import { useCallback, useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import { useToast } from '../../components/admin/ToastProvider.jsx';
import { adminService } from '../../services/adminService.js';
import socket from '../../api/socket.js';

const FALLBACK_LOGS = [];

function normalizeLogs(payload) {
  const items = Array.isArray(payload?.items)
    ? payload.items
    : Array.isArray(payload?.logs)
      ? payload.logs
      : Array.isArray(payload)
        ? payload
        : null;

  if (!items?.length) {
    return [];
  }

  return items.map((item, index) => ({
    id: String(item.id ?? `AUD-${index + 1}`),
    action: item.action || item.event || 'admin_action',
    admin_name: item.admin_name || item.username || item.actor_name || 'Admin',
    actor: item.actor || item.email || item.admin_email || 'admin@yamshat.local',
    scope: item.scope || item.module || item.category || 'general',
    severity: item.severity || item.level || 'info',
    summary: item.summary || item.message || item.description || 'لا يوجد وصف إضافي.',
    ip_address: item.ip_address || item.ip || '--',
    entity: item.entity || item.entity_id || item.target || '--',
    timestamp: item.timestamp || item.created_at || new Date(Date.now() - index * 8 * 60 * 1000).toISOString(),
  }));
}

function severityTone(level) {
  switch (level) {
    case 'critical': return { bg: 'rgba(239,68,68,0.16)', color: '#ef4444' };
    case 'warning': return { bg: 'rgba(249,115,22,0.16)', color: '#f97316' };
    case 'success': return { bg: 'rgba(34,197,94,0.16)', color: '#22c55e' };
    default: return { bg: 'rgba(59,130,246,0.16)', color: '#60a5fa' };
  }
}

export default function AdminAudit() {
  const { pushToast } = useToast();
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState({ today: 0, critical: 0, exports: 0, security: 0 });
  const [filters, setFilters] = useState({ search: '', scope: 'all', severity: 'all' });
  const [loading, setLoading] = useState(true);

  const loadAuditLogs = useCallback(async () => {
    try {
      setLoading(true);
      const [logsData, summaryData] = await Promise.all([
        adminService.getAuditLogs({ limit: 120 }),
        adminService.getAuditLogsSummary({ period: '24h' }),
      ]);
      const normalized = normalizeLogs(logsData);
      setLogs(normalized);
      setSummary({
        today: Number(summaryData?.today ?? normalized.length),
        critical: Number(summaryData?.critical ?? normalized.filter((item) => item.severity === 'critical').length),
        exports: Number(summaryData?.exports ?? normalized.filter((item) => item.action.includes('export')).length),
        security: Number(summaryData?.security ?? normalized.filter((item) => item.scope === 'security').length),
      });
    } catch (error) {
      setLogs([]);
      setSummary({ today: 0, critical: 0, exports: 0, security: 0 });
      pushToast({ type: 'warning', title: 'تعذر تحميل سجل النشاط', description: error?.response?.data?.detail || 'الخادم لم يرجع سجلات حالياً.' });
    } finally {
      setLoading(false);
    }
  }, [pushToast]);

  useEffect(() => {
    loadAuditLogs();
  }, [loadAuditLogs]);

  useEffect(() => {
    const onSocketLog = (payload) => {
      const [nextLog] = normalizeLogs([payload]);
      setLogs((prev) => [nextLog, ...prev].slice(0, 150));
    };
    socket.on('new_audit_log', onSocketLog);
    return () => socket.off('new_audit_log', onSocketLog);
  }, []);

  const filteredLogs = useMemo(() => {
    const keyword = filters.search.trim().toLowerCase();
    return logs.filter((log) => {
      const matchesKeyword = !keyword || [log.id, log.action, log.admin_name, log.actor, log.summary, log.entity].join(' ').toLowerCase().includes(keyword);
      const matchesScope = filters.scope === 'all' || log.scope === filters.scope;
      const matchesSeverity = filters.severity === 'all' || log.severity === filters.severity;
      return matchesKeyword && matchesScope && matchesSeverity;
    });
  }, [filters, logs]);

  const scopes = useMemo(() => Array.from(new Set(logs.map((item) => item.scope))), [logs]);
  const breakdown = useMemo(() => {
    const map = new Map();
    filteredLogs.forEach((log) => map.set(log.scope, (map.get(log.scope) || 0) + 1));
    return Array.from(map.entries());
  }, [filteredLogs]);

  return (
    <AdminLayout>
      <section style={{ display: 'grid', gap: 18 }}>
        <Card style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div>
              <div style={{ color: '#60a5fa', fontSize: 13, marginBottom: 8 }}>Admin Activity Log • Tracking • Audit System</div>
              <h2 style={{ margin: 0, color: '#f8fafc' }}>سجل نشاط الأدمن</h2>
              <p style={{ margin: '10px 0 0', color: '#94a3b8', maxWidth: 760 }}>
                شاشة مخصصة لتتبع كل حركة إدارية مع فلترة حسب النطاق والخطورة، ومناسبة للمراجعة السريعة والتدقيق الأمني.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Button variant="secondary" onClick={loadAuditLogs} loading={loading}>تحديث</Button>
              <Button onClick={() => pushToast({ type: 'info', title: 'Audit export queued', description: 'جاهز لربط التصدير مع الـ backend.' })}>تصدير السجل</Button>
            </div>
          </div>
        </Card>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
          {[
            { label: 'إجمالي أحداث اليوم', value: summary.today, hint: 'كل الإجراءات المسجلة خلال 24 ساعة' },
            { label: 'حوادث حرجة', value: summary.critical, hint: 'تحتاج مراجعة أمنية أو إدارية' },
            { label: 'عمليات تصدير', value: summary.exports, hint: 'سحب بيانات أو لوحات متابعة' },
            { label: 'أحداث الأمن', value: summary.security, hint: 'جلسات، IP، وتدخلات حماية' },
          ].map((item) => (
            <Card key={item.label} style={{ padding: 18, background: 'rgba(15,23,42,0.78)' }}>
              <div style={{ color: '#94a3b8', fontSize: 12 }}>{item.label}</div>
              <div style={{ color: '#f8fafc', fontSize: 28, fontWeight: 800, margin: '10px 0 8px' }}>{item.value}</div>
              <div style={{ color: '#64748b', fontSize: 12 }}>{item.hint}</div>
            </Card>
          ))}
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(320px, 0.8fr)', gap: 18 }}>
          <Card style={{ padding: 18 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginBottom: 16 }}>
              <Input label="بحث" value={filters.search} onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))} placeholder="الإجراء / الإدمن / الكيان" />
              <label className="field select-field"><span className="field-label">النطاق</span><select className="input" value={filters.scope} onChange={(event) => setFilters((prev) => ({ ...prev, scope: event.target.value }))}><option value="all">الكل</option>{scopes.map((scope) => <option key={scope} value={scope}>{scope}</option>)}</select></label>
              <label className="field select-field"><span className="field-label">الخطورة</span><select className="input" value={filters.severity} onChange={(event) => setFilters((prev) => ({ ...prev, severity: event.target.value }))}><option value="all">الكل</option><option value="info">info</option><option value="warning">warning</option><option value="critical">critical</option><option value="success">success</option></select></label>
            </div>

            <div style={{ display: 'grid', gap: 12 }}>
              {filteredLogs.map((log) => {
                const tone = severityTone(log.severity);
                return (
                  <div key={log.id} style={{ borderRadius: 18, padding: 16, background: 'rgba(15,23,42,0.72)', border: '1px solid rgba(148,163,184,0.12)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                        <strong style={{ color: '#f8fafc' }}>{log.action}</strong>
                        <span style={{ padding: '4px 10px', borderRadius: 999, background: tone.bg, color: tone.color, fontSize: 12 }}>{log.severity}</span>
                        <span style={{ padding: '4px 10px', borderRadius: 999, background: 'rgba(148,163,184,0.14)', color: '#cbd5e1', fontSize: 12 }}>{log.scope}</span>
                      </div>
                      <div style={{ color: '#64748b', fontSize: 12 }}>{new Date(log.timestamp).toLocaleString('ar-EG')}</div>
                    </div>
                    <div style={{ marginTop: 10, color: '#e2e8f0', fontSize: 14 }}>{log.summary}</div>
                    <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
                      <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 12 }}><div style={{ color: '#64748b', fontSize: 12 }}>الإدمن</div><div style={{ color: '#f8fafc', marginTop: 4 }}>{log.admin_name}</div><div style={{ color: '#94a3b8', fontSize: 12 }}>{log.actor}</div></div>
                      <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 12 }}><div style={{ color: '#64748b', fontSize: 12 }}>الكيان</div><div style={{ color: '#f8fafc', marginTop: 4 }}>{log.entity}</div></div>
                      <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 12 }}><div style={{ color: '#64748b', fontSize: 12 }}>IP</div><div style={{ color: '#f8fafc', marginTop: 4 }}>{log.ip_address}</div></div>
                    </div>
                  </div>
                );
              })}
              {!filteredLogs.length ? <div style={{ color: '#94a3b8', textAlign: 'center', padding: 30 }}>لا توجد نتائج في سجل الأدمن.</div> : null}
            </div>
          </Card>

          <Card style={{ padding: 18, display: 'grid', gap: 16 }}>
            <div>
              <h3 style={{ marginTop: 0, color: '#f8fafc' }}>Tracking summary</h3>
              <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 6 }}>تفصيل النشاط حسب كل نطاق إداري.</div>
            </div>
            {breakdown.map(([scope, count]) => (
              <div key={scope}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1', fontSize: 13, marginBottom: 6 }}>
                  <span>{scope}</span>
                  <strong>{count}</strong>
                </div>
                <div style={{ height: 10, borderRadius: 999, overflow: 'hidden', background: 'rgba(148,163,184,0.12)' }}>
                  <div style={{ width: `${(count / Math.max(filteredLogs.length, 1)) * 100}%`, height: '100%', background: 'linear-gradient(90deg,#22d3ee,#8b5cf6)' }} />
                </div>
              </div>
            ))}
            <div style={{ borderRadius: 18, padding: 16, background: 'rgba(15,23,42,0.78)', border: '1px solid rgba(148,163,184,0.12)' }}>
              <h4 style={{ marginTop: 0, color: '#f8fafc' }}>Audit system notes</h4>
              <ul style={{ margin: 0, paddingInlineStart: 18, color: '#cbd5e1', lineHeight: 1.9, fontSize: 14 }}>
                <li>فلترة حسب مستوى الخطورة والنطاق.</li>
                <li>استقبال مباشر عبر socket لسجلات audit الجديدة.</li>
                <li>مناسب لتتبع الإجراءات الحرجة أثناء التشغيل المباشر.</li>
                <li>قابل للربط مع التصدير وSIEM لاحقًا بدون تغيير الواجهة.</li>
              </ul>
            </div>
          </Card>
        </section>
      </section>
    </AdminLayout>
  );
}

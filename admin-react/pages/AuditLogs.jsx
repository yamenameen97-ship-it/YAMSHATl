import { useMemo, useState } from "react";
import { Badge, ErrorState, LoadingState, SectionCard, formatDateTime, useLiveData } from "./shared.jsx";

export default function AuditLogs() {
  const { data: logs, error, loading, refresh } = useLiveData("/admin_audit_logs?limit=200", { interval: 6000 });
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const list = logs || [];
    const needle = query.trim().toLowerCase();
    if (!needle) return list;
    return list.filter((item) => [item.actor, item.action, item.target_value, item.details].some((value) => String(value || "").toLowerCase().includes(needle)));
  }, [logs, query]);

  if (error) return <ErrorState message={error} retry={refresh} />;
  if (loading || !logs) return <LoadingState />;

  return (
    <SectionCard title="Audit Logs" subtitle="كل حركة إدارية ومخالفات السبام والتقارير محفوظة هنا">
      <input className="admin-input" placeholder="بحث في السجل" value={query} onChange={(e) => setQuery(e.target.value)} />
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>الوقت</th>
              <th>Actor</th>
              <th>Action</th>
              <th>Target</th>
              <th>Details</th>
              <th>Severity</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((log) => (
              <tr key={log.id}>
                <td>{formatDateTime(log.created_at)}</td>
                <td>{log.actor}</td>
                <td>{log.action}</td>
                <td>{log.target_value || log.target_type || "—"}</td>
                <td>{log.details || "—"}</td>
                <td><Badge tone={log.severity === "warning" ? "red" : log.severity === "info" ? "info" : "default"}>{log.severity}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

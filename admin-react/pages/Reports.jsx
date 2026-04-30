import { useMemo, useState } from "react";
import { ActionButton, Badge, ErrorState, LoadingState, SectionCard, api, formatDateTime, useLiveData } from "./shared.jsx";

export default function Reports() {
  const { data: reports, error, loading, refresh } = useLiveData("/admin_reports", { interval: 6000 });
  const [busyKey, setBusyKey] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    const list = reports || [];
    if (statusFilter === "all") return list;
    return list.filter((item) => item.status === statusFilter);
  }, [reports, statusFilter]);

  async function updateReport(id, status) {
    setBusyKey(`report-${id}-${status}`);
    try {
      await api.post(`/admin_resolve_report/${id}`, { status });
      await refresh();
    } catch (err) {
      window.alert(err.response?.data?.message || err.message || "تعذر تحديث البلاغ");
    } finally {
      setBusyKey("");
    }
  }

  async function removeMessage(id) {
    setBusyKey(`message-${id}`);
    try {
      await api.post(`/admin_remove_message/${id}`);
      await refresh();
    } catch (err) {
      window.alert(err.response?.data?.message || err.message || "تعذر حذف الرسالة");
    } finally {
      setBusyKey("");
    }
  }

  async function moderateUser(username, action) {
    const reason = window.prompt("سبب الإجراء", "بلاغات متكررة / محتوى مخالف");
    if (reason === null) return;
    setBusyKey(`${username}-${action}`);
    try {
      await api.post("/admin_moderate_user", { username, action, reason, duration_minutes: action === "ban" ? 0 : 60 });
      await refresh();
    } catch (err) {
      window.alert(err.response?.data?.message || err.message || "تعذر تنفيذ الإجراء");
    } finally {
      setBusyKey("");
    }
  }

  if (error) return <ErrorState message={error} retry={refresh} />;
  if (loading || !reports) return <LoadingState />;

  return (
    <SectionCard
      title="مركز البلاغات"
      subtitle="Report user / Report message مع معالجة مباشرة"
      actions={
        <select className="admin-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">كل الحالات</option>
          <option value="open">Open</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
        </select>
      }
    >
      <div className="list-grid">
        {filtered.map((report) => (
          <div className="report-card" key={report.id}>
            <div className="report-top">
              <div>
                <strong>{report.target_type} / {report.target_value}</strong>
                <p>{report.reason}</p>
              </div>
              <Badge tone={report.status === "open" ? "orange" : report.status === "resolved" ? "success" : "default"}>{report.status}</Badge>
            </div>
            <div className="report-meta">
              <small>المبلّغ: {report.reporter}</small>
              <small>{formatDateTime(report.created_at)}</small>
            </div>
            {report.preview ? <div className="report-preview">{report.preview}</div> : null}
            <div className="action-grid">
              <ActionButton busy={busyKey === `report-${report.id}-resolved`} onClick={() => updateReport(report.id, "resolved")}>Resolve</ActionButton>
              <ActionButton tone="warning" busy={busyKey === `report-${report.id}-dismissed`} onClick={() => updateReport(report.id, "dismissed")}>Dismiss</ActionButton>
              {report.target_type === "message" && /^\d+$/.test(String(report.target_value || "")) ? (
                <ActionButton tone="red" busy={busyKey === `message-${report.target_value}`} onClick={() => removeMessage(report.target_value)}>Delete message</ActionButton>
              ) : null}
              {report.target_type === "user" ? (
                <>
                  <ActionButton tone="orange" busy={busyKey === `${report.target_value}-mute`} onClick={() => moderateUser(report.target_value, "mute")}>Mute user</ActionButton>
                  <ActionButton tone="red" busy={busyKey === `${report.target_value}-ban`} onClick={() => moderateUser(report.target_value, "ban")}>Ban user</ActionButton>
                </>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

import { useMemo, useState } from "react";
import { ActionButton, Badge, ErrorState, LoadingState, SectionCard, api, formatRelativeTime, useLiveData } from "./shared.jsx";

export default function Users() {
  const { data: users, error, loading, refresh } = useLiveData("/admin_users", { interval: 7000 });
  const [query, setQuery] = useState("");
  const [busyKey, setBusyKey] = useState("");

  const filtered = useMemo(() => {
    const list = users || [];
    const needle = query.trim().toLowerCase();
    if (!needle) return list;
    return list.filter((user) => [user.name, user.email, user.role].some((value) => String(value || "").toLowerCase().includes(needle)));
  }, [users, query]);

  async function runAction(username, action) {
    const duration = ["ban", "mute", "restrict"].includes(action)
      ? Number(window.prompt("المدة بالدقائق - اكتب 0 لو دائم", action === "mute" ? "15" : action === "restrict" ? "60" : "0") || 0)
      : 0;
    const reason = window.prompt("سبب الإجراء", "مخالفة سياسات المنصة");
    if (reason === null) return;
    const key = `${username}-${action}`;
    setBusyKey(key);
    try {
      await api.post("/admin_moderate_user", { username, action, reason, duration_minutes: duration });
      await refresh();
    } catch (err) {
      window.alert(err.response?.data?.message || err.message || "تعذر تنفيذ الإجراء");
    } finally {
      setBusyKey("");
    }
  }

  if (error) return <ErrorState message={error} retry={refresh} />;
  if (loading || !users) return <LoadingState />;

  return (
    <SectionCard title="إدارة المستخدمين والموديريشن" subtitle="Ban / mute / restrict مع تحديث حي">
      <input className="admin-input" placeholder="بحث بالاسم أو البريد أو الدور" value={query} onChange={(e) => setQuery(e.target.value)} />
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>المستخدم</th>
              <th>الحالة</th>
              <th>النشاط</th>
              <th>الموديريشن</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => (
              <tr key={user.email}>
                <td>
                  <div className="cell-stack">
                    <strong>{user.name}</strong>
                    <small>{user.email}</small>
                    <small>{user.role || "user"}</small>
                  </div>
                </td>
                <td>
                  <div className="cell-stack">
                    <Badge tone={user.is_online ? "success" : "default"}>{user.is_online ? "أونلاين" : formatRelativeTime(user.last_seen)}</Badge>
                    <small>بلاغات مفتوحة: {user.reports_count || 0}</small>
                  </div>
                </td>
                <td>
                  <div className="cell-stack">
                    <small>Posts: {user.posts_count || 0}</small>
                    <small>Reels: {user.reels_count || 0}</small>
                    <small>Msgs: {user.messages_count || 0}</small>
                  </div>
                </td>
                <td>
                  <div className="badge-group">
                    {user.moderation?.ban ? <Badge tone="red">Ban</Badge> : null}
                    {user.moderation?.mute ? <Badge tone="orange">Mute</Badge> : null}
                    {user.moderation?.restrict ? <Badge tone="warning">Restrict</Badge> : <Badge tone="default">نظيف</Badge>}
                  </div>
                </td>
                <td>
                  <div className="action-grid compact-actions">
                    <ActionButton tone="red" busy={busyKey === `${user.name}-ban`} onClick={() => runAction(user.name, "ban")}>Ban</ActionButton>
                    <ActionButton tone="orange" busy={busyKey === `${user.name}-mute`} onClick={() => runAction(user.name, "mute")}>Mute</ActionButton>
                    <ActionButton tone="warning" busy={busyKey === `${user.name}-restrict`} onClick={() => runAction(user.name, "restrict")}>Restrict</ActionButton>
                    <ActionButton busy={busyKey === `${user.name}-unban`} onClick={() => runAction(user.name, "unban")}>Unban</ActionButton>
                    <ActionButton busy={busyKey === `${user.name}-unmute`} onClick={() => runAction(user.name, "unmute")}>Unmute</ActionButton>
                    <ActionButton busy={busyKey === `${user.name}-unrestrict`} onClick={() => runAction(user.name, "unrestrict")}>Unrestrict</ActionButton>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

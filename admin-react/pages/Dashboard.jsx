import { Badge, ErrorState, LoadingState, ProgressList, SectionCard, SimpleLineChart, StatCard, formatDateTime, formatRelativeTime, useLiveData } from "./shared.jsx";

export default function Dashboard() {
  const { data, error, loading, refresh, lastUpdated } = useLiveData("/admin_overview", { interval: 5000 });

  if (error) return <ErrorState message={error} retry={refresh} />;
  if (loading || !data) return <LoadingState />;

  const stats = data.stats || {};
  const realtime = data.realtime || {};

  return (
    <div className="page-stack">
      <section className="hero-card">
        <div>
          <p className="eyebrow">Realtime command center</p>
          <h2>مركز إدارة Yamshat المباشر</h2>
          <p>لوحة مبنية على React مع جداول وتحليلات وتحديث تلقائي كل 5 ثواني لمتابعة التشغيل والإشراف والبلاغات.</p>
          <div className="hero-inline">
            <Badge tone="success">آخر تحديث: {lastUpdated ? lastUpdated.toLocaleTimeString("ar-EG") : "الآن"}</Badge>
            <Badge tone="warning">Users online: {realtime.online_users ?? 0}</Badge>
            <Badge tone="info">Messages/min: {realtime.messages_per_minute ?? 0}</Badge>
          </div>
        </div>
        <div className="hero-pill">Analytics + Moderation + Audit + Live</div>
      </section>

      <div className="stats-grid">
        <StatCard title="المستخدمون أونلاين" value={realtime.online_users} helper="آخر 5 دقائق" accent="green" />
        <StatCard title="الرسائل / الدقيقة" value={realtime.messages_per_minute} helper="سرعة النشاط اللحظي" accent="blue" />
        <StatCard title="البلاغات المفتوحة" value={realtime.open_reports} helper="تحتاج تدخل" accent="orange" />
        <StatCard title="الحسابات المحظورة" value={realtime.active_bans} helper="حظر إداري نشط" accent="red" />
      </div>

      <div className="two-col-grid">
        <SectionCard title="حركة الرسائل آخر ساعة" subtitle="مؤشر الحمل المباشر على الشات">
          <SimpleLineChart data={data.charts?.messages_last_hour || []} />
        </SectionCard>
        <SectionCard title="توزيع البلاغات" subtitle="أنواع البلاغات المفتوحة حالياً">
          <ProgressList data={data.charts?.report_breakdown || []} />
        </SectionCard>
      </div>

      <div className="stats-grid compact-grid">
        <StatCard title="إجمالي المستخدمين" value={stats.users} helper="كل الحسابات" />
        <StatCard title="إجمالي الرسائل" value={stats.messages} helper="رسائل غير محذوفة" />
        <StatCard title="البثوث المباشرة" value={stats.live_rooms} helper="غرف حية الآن" />
        <StatCard title="التقييدات النشطة" value={(data.moderation?.mute || 0) + (data.moderation?.restrict || 0)} helper="Mute + Restrict" />
      </div>

      <div className="two-col-grid">
        <SectionCard title="أحدث المستخدمين" subtitle="آخر من انضم للمنصة">
          <div className="list-grid">
            {(data.recent_users || []).map((user) => (
              <div key={`${user.email}-${user.created_at}`} className="list-row split-row">
                <div>
                  <strong>{user.name}</strong>
                  <span>{user.email}</span>
                </div>
                <div className="align-end">
                  <Badge tone={user.is_online ? "success" : "default"}>{user.is_online ? "أونلاين" : formatRelativeTime(user.last_seen)}</Badge>
                  <small>{user.role || "user"}</small>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
        <SectionCard title="غرف اللايف الساخنة" subtitle="مشاهدة وتعليقات وهدايا">
          <div className="list-grid">
            {(data.live_rooms || []).slice(0, 6).map((room) => (
              <div key={room.id} className="list-row split-row">
                <div>
                  <strong>{room.title || `Room #${room.id}`}</strong>
                  <span>{room.username}</span>
                </div>
                <div className="align-end">
                  <Badge tone="info">{room.viewer_count || 0} مشاهد</Badge>
                  <small>{room.comments_count || 0} تعليق • {room.gifts_count || 0} هدية</small>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="two-col-grid">
        <SectionCard title="آخر البلاغات" subtitle="Queue سريع للمراجعة">
          <div className="list-grid">
            {(data.reports || []).slice(0, 5).map((report) => (
              <div key={report.id} className="list-row split-row">
                <div>
                  <strong>{report.target_type} / {report.target_value}</strong>
                  <span>{report.reason}</span>
                </div>
                <div className="align-end">
                  <Badge tone="orange">{report.status}</Badge>
                  <small>{formatRelativeTime(report.created_at)}</small>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
        <SectionCard title="سجل التدقيق السريع" subtitle="آخر الحركات المسجلة">
          <div className="list-grid">
            {(data.audit_logs || []).slice(0, 6).map((log) => (
              <div key={log.id} className="list-row split-row">
                <div>
                  <strong>{log.action}</strong>
                  <span>{log.actor} → {log.target_value || log.target_type || "system"}</span>
                </div>
                <div className="align-end">
                  <Badge tone={log.severity === "warning" ? "red" : log.severity === "info" ? "info" : "default"}>{log.severity}</Badge>
                  <small title={formatDateTime(log.created_at)}>{formatRelativeTime(log.created_at)}</small>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

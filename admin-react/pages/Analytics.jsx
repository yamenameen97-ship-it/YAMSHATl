import { ErrorState, LoadingState, ProgressList, SectionCard, SimpleLineChart, StatCard, useLiveData } from "./shared.jsx";

export default function Analytics() {
  const { data, error, loading, refresh } = useLiveData("/admin_analytics", { interval: 7000 });

  if (error) return <ErrorState message={error} retry={refresh} />;
  if (loading || !data) return <LoadingState />;

  const growth = data.growth || {};

  return (
    <div className="page-stack">
      <div className="stats-grid">
        <StatCard title="نمو المستخدمين" value={`${growth.users?.delta ?? 0}%`} helper={`الحالي ${growth.users?.current ?? 0} / السابق ${growth.users?.previous ?? 0}`} accent="green" />
        <StatCard title="نمو الرسائل" value={`${growth.messages?.delta ?? 0}%`} helper={`الحالي ${growth.messages?.current ?? 0} / السابق ${growth.messages?.previous ?? 0}`} accent="blue" />
        <StatCard title="نمو البلاغات" value={`${growth.reports?.delta ?? 0}%`} helper={`الحالي ${growth.reports?.current ?? 0} / السابق ${growth.reports?.previous ?? 0}`} accent="orange" />
        <StatCard title="أكثر الفاعلين" value={(data.leaderboards?.actors || []).length} helper="نشاط مسجل خلال 24 ساعة" accent="purple" />
      </div>

      <div className="two-col-grid">
        <SectionCard title="الحمل على الرسائل خلال 24 ساعة" subtitle="تغير عدد الرسائل بالساعة">
          <SimpleLineChart data={data.charts?.hourly_messages || []} color="#36d399" />
        </SectionCard>
        <SectionCard title="اكتساب المستخدمين" subtitle="تسجيلات آخر 14 يوم">
          <SimpleLineChart data={data.charts?.user_growth || []} color="#8b5cf6" />
        </SectionCard>
      </div>

      <div className="two-col-grid">
        <SectionCard title="أعلى مرسلين للرسائل" subtitle="آخر 24 ساعة">
          <ProgressList data={data.charts?.top_senders || []} />
        </SectionCard>
        <SectionCard title="أكثر العمليات تسجيلاً" subtitle="من سجلات التدقيق">
          <ProgressList data={data.charts?.audit_activity || []} />
        </SectionCard>
      </div>

      <SectionCard title="Top Actors" subtitle="المستخدمون الأكثر ظهورًا في السجل خلال آخر 24 ساعة">
        <div className="list-grid">
          {(data.leaderboards?.actors || []).map((actor, index) => (
            <div key={`${actor.username}-${index}`} className="list-row split-row">
              <div>
                <strong>{actor.username}</strong>
                <span>ترتيب #{index + 1}</span>
              </div>
              <div className="align-end">
                <strong>{actor.total}</strong>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

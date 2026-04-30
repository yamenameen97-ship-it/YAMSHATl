import { useState } from "react";
import { ActionButton, Badge, ErrorState, LoadingState, SectionCard, StatCard, api, formatDateTime, useLiveData } from "./shared.jsx";

export default function LiveRooms() {
  const { data, error, loading, refresh } = useLiveData("/admin_live_panel", { interval: 5000 });
  const [busyRoom, setBusyRoom] = useState("");

  async function endLive(id) {
    setBusyRoom(String(id));
    try {
      await api.post(`/admin_end_live/${id}`);
      await refresh();
    } catch (err) {
      window.alert(err.response?.data?.message || err.message || "تعذر إنهاء البث");
    } finally {
      setBusyRoom("");
    }
  }

  if (error) return <ErrorState message={error} retry={refresh} />;
  if (loading || !data) return <LoadingState />;

  const summary = data.summary || {};

  return (
    <div className="page-stack">
      <div className="stats-grid compact-grid">
        <StatCard title="غرف Live" value={summary.live_rooms} helper="غرف نشطة" accent="red" />
        <StatCard title="مشاهدون نشطون" value={summary.active_viewers} helper="آخر 90 ثانية" accent="green" />
        <StatCard title="تعليقات" value={summary.comments} helper="إجمالي التعليقات" accent="blue" />
        <StatCard title="هدايا" value={summary.gifts} helper="إجمالي الهدايا" accent="purple" />
      </div>

      <SectionCard title="Live Admin Panel" subtitle="مراقبة البث وإنهاء الغرف المخالفة">
        <div className="list-grid">
          {(data.rooms || []).map((room) => (
            <div className="report-card" key={room.id}>
              <div className="report-top">
                <div>
                  <strong>{room.title || `Room #${room.id}`}</strong>
                  <p>{room.username}</p>
                </div>
                <Badge tone={room.status === "live" ? "red" : "default"}>{room.status}</Badge>
              </div>
              <div className="meta-grid">
                <small>مشاهدون: {room.viewer_count || 0}</small>
                <small>تعليقات: {room.comments_count || 0}</small>
                <small>إعجابات: {room.likes_count || 0}</small>
                <small>هدايا: {room.gifts_count || 0}</small>
                <small>البدء: {formatDateTime(room.created_at)}</small>
              </div>
              <ActionButton tone="red" busy={busyRoom === String(room.id)} onClick={() => endLive(room.id)} disabled={room.status === "ended"}>إنهاء البث</ActionButton>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

/**
 * مركز المهام اليومية - DailyTasksCenter
 * RTL + Noto Sans Arabic
 */
import React, { useEffect, useState } from "react";
import { engagementApi } from "../api/engagementApi";

export default function DailyTasksCenter() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const d = await engagementApi.getTasks();
      setTasks(d.tasks || []);
    } catch (e) { setError(e?.message || "خطأ"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const claim = async (id) => {
    try {
      await engagementApi.claimTask(id);
      await load();
    } catch (e) { alert("تعذر استلام المكافأة"); }
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;

  return (
    <div dir="rtl" className="daily-tasks-center" style={{
      fontFamily: "'Noto Sans Arabic', system-ui, sans-serif",
      padding: 16, maxWidth: 720, margin: "0 auto",
    }}>
      <header style={{ display: "flex", justifyContent: "space-between",
                       alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>
          🎯 مركز المهام اليومية
        </h2>
        <span style={{
          background: "#1F2937", color: "#FBBF24", padding: "6px 14px",
          borderRadius: 20, fontWeight: 600, fontSize: 14,
        }}>
          {completedCount} / {totalCount}
        </span>
      </header>

      {loading && <div>جاري التحميل...</div>}
      {error && <div style={{ color: "#EF4444" }}>{error}</div>}

      <div style={{ display: "grid", gap: 12 }}>
        {tasks.map(t => {
          const pct = Math.min(100, (t.progress / Math.max(1, t.target_count)) * 100);
          return (
            <div key={t.id} style={{
              background: t.completed ? "#064E3B" : "#1F2937",
              borderRadius: 14, padding: 14,
              border: t.claimed ? "1px solid #10B981" : "1px solid transparent",
              opacity: t.claimed ? 0.65 : 1,
            }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ fontSize: 30 }}>{t.icon || "✨"}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: "#fff" }}>{t.title}</div>
                  <div style={{ fontSize: 13, color: "#9CA3AF", marginTop: 2 }}>
                    {t.description}
                  </div>
                  <div style={{ marginTop: 8, background: "#111827",
                                 borderRadius: 8, overflow: "hidden", height: 8 }}>
                    <div style={{
                      width: `${pct}%`, height: "100%",
                      background: "linear-gradient(90deg,#10B981,#34D399)",
                      transition: "width .3s",
                    }} />
                  </div>
                  <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 4 }}>
                    {t.progress} / {t.target_count}
                  </div>
                </div>
                <div style={{ textAlign: "center", minWidth: 90 }}>
                  <div style={{ color: "#FBBF24", fontSize: 13 }}>
                    🪙 +{t.reward_coins}
                  </div>
                  <div style={{ color: "#A78BFA", fontSize: 12 }}>
                    ⭐ +{t.reward_xp} XP
                  </div>
                  {t.completed && !t.claimed ? (
                    <button onClick={() => claim(t.id)} style={{
                      marginTop: 6, background: "#F59E0B", color: "#111",
                      border: "none", padding: "6px 12px", borderRadius: 10,
                      fontWeight: 700, cursor: "pointer",
                    }}>استلم</button>
                  ) : t.claimed ? (
                    <div style={{ marginTop: 6, color: "#10B981", fontWeight: 600 }}>
                      ✓ تم
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

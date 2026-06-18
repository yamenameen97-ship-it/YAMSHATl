/**
 * شبكة شارات الإنجازات - AchievementsGrid
 * RTL + Noto Sans Arabic
 */
import React, { useEffect, useState } from "react";
import { engagementApi } from "../api/engagementApi";

const RARITY_COLORS = {
  common:    { bg: "#374151", border: "#6B7280", text: "عادية" },
  rare:      { bg: "#1E3A8A", border: "#3B82F6", text: "نادرة" },
  epic:      { bg: "#5B21B6", border: "#8B5CF6", text: "ملحمية" },
  legendary: { bg: "#92400E", border: "#FBBF24", text: "أسطورية" },
};

export default function AchievementsGrid() {
  const [list, setList] = useState([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    engagementApi.getAchievements()
      .then(d => setList(d.achievements || []))
      .catch(() => {});
  }, []);

  const filtered = list.filter(a => {
    if (filter === "unlocked") return a.unlocked;
    if (filter === "locked") return !a.unlocked;
    return true;
  });

  const unlockedCount = list.filter(a => a.unlocked).length;

  return (
    <div dir="rtl" style={{
      fontFamily: "'Noto Sans Arabic', sans-serif",
      padding: 16, maxWidth: 900, margin: "0 auto",
    }}>
      <header style={{ display: "flex", justifyContent: "space-between",
                       alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontWeight: 800 }}>🏆 شارات الإنجازات</h2>
        <div style={{ fontSize: 14, color: "#9CA3AF" }}>
          {unlockedCount} / {list.length} مفتوحة
        </div>
      </header>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[
          ["all", "الكل"], ["unlocked", "مفتوحة"], ["locked", "مغلقة"],
        ].map(([k, label]) => (
          <button key={k} onClick={() => setFilter(k)} style={{
            padding: "6px 16px", borderRadius: 20,
            background: filter === k ? "#F59E0B" : "#1F2937",
            color: filter === k ? "#111" : "#fff",
            border: "none", cursor: "pointer", fontWeight: 600,
          }}>{label}</button>
        ))}
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
        gap: 12,
      }}>
        {filtered.map(a => {
          const r = RARITY_COLORS[a.rarity] || RARITY_COLORS.common;
          return (
            <div key={a.id} style={{
              background: a.unlocked ? r.bg : "#111827",
              border: `2px solid ${a.unlocked ? r.border : "#374151"}`,
              borderRadius: 14, padding: 12, textAlign: "center",
              opacity: a.unlocked ? 1 : 0.55,
              filter: a.unlocked ? "none" : "grayscale(0.8)",
              cursor: "pointer", transition: "transform .2s",
            }}>
              <div style={{ fontSize: 42 }}>{a.icon || "🏅"}</div>
              <div style={{ fontWeight: 700, color: "#fff", marginTop: 6,
                            fontSize: 14 }}>{a.title}</div>
              <div style={{ fontSize: 11, color: r.border, marginTop: 2 }}>
                {r.text}
              </div>
              <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4,
                            minHeight: 32 }}>
                {a.description}
              </div>
              <div style={{ marginTop: 6, fontSize: 12 }}>
                <span style={{ color: "#FBBF24" }}>🪙 {a.reward_coins}</span>
                {" · "}
                <span style={{ color: "#A78BFA" }}>⭐ {a.reward_xp}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

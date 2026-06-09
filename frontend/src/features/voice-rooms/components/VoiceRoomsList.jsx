/**
 * قائمة الغرف الصوتية الجماعية - VoiceRoomsList
 * RTL + Noto Sans Arabic
 */
import React, { useEffect, useState } from "react";
import { voiceRoomsApi } from "../../engagement/api/engagementApi";

const CATEGORIES = [
  { key: null, label: "🔥 الكل" },
  { key: "general", label: "💬 عام" },
  { key: "music", label: "🎵 موسيقى" },
  { key: "games", label: "🎮 ألعاب" },
  { key: "education", label: "📚 تعليم" },
  { key: "comedy", label: "😂 تسلية" },
  { key: "religion", label: "🕌 ديني" },
];

export default function VoiceRoomsList({ onOpen, onCreate }) {
  const [category, setCategory] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const d = await voiceRoomsApi.list(category);
      setRooms(d.rooms || []);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [category]);

  return (
    <div dir="rtl" style={{
      fontFamily: "'Noto Sans Arabic', sans-serif",
      padding: 16, maxWidth: 1100, margin: "0 auto",
    }}>
      <header style={{ display: "flex", justifyContent: "space-between",
                       alignItems: "center", marginBottom: 14 }}>
        <h2 style={{ margin: 0, fontWeight: 800 }}>🔊 الغرف الصوتية</h2>
        <button onClick={onCreate} style={{
          background: "linear-gradient(135deg,#F59E0B,#EF4444)",
          color: "#fff", border: "none", padding: "10px 18px",
          borderRadius: 12, fontWeight: 700, cursor: "pointer",
        }}>➕ إنشاء غرفة</button>
      </header>

      <div style={{ display: "flex", gap: 8, overflowX: "auto", padding: "8px 0" }}>
        {CATEGORIES.map(c => (
          <button key={c.key || "all"} onClick={() => setCategory(c.key)} style={{
            padding: "6px 14px", borderRadius: 18, whiteSpace: "nowrap",
            background: category === c.key ? "#F59E0B" : "#1F2937",
            color: category === c.key ? "#111" : "#fff",
            border: "none", cursor: "pointer", fontWeight: 600,
          }}>{c.label}</button>
        ))}
      </div>

      {loading && <div style={{ marginTop: 20 }}>جاري التحميل...</div>}

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
        gap: 12, marginTop: 12,
      }}>
        {rooms.map(r => (
          <div key={r.id} onClick={() => onOpen?.(r.id)} style={{
            background: r.cover_image
              ? `linear-gradient(180deg, rgba(15,23,42,0.45), rgba(15,23,42,0.95)), url(${r.cover_image}) center/cover`
              : "linear-gradient(135deg,#1F2937,#0F172A)",
            borderRadius: 16, padding: 14, cursor: "pointer",
            border: "1px solid #374151", color: "#fff",
            minHeight: 140, display: "flex", flexDirection: "column",
            justifyContent: "space-between",
          }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{
                  background: "rgba(239,68,68,0.85)", color: "#fff",
                  padding: "2px 8px", borderRadius: 8, fontSize: 11, fontWeight: 700,
                }}>● مباشر</span>
                {r.is_private && <span style={{ fontSize: 14 }}>🔒</span>}
              </div>
              <div style={{ fontWeight: 700, marginTop: 8, fontSize: 16 }}>
                {r.title}
              </div>
              <div style={{ color: "#9CA3AF", fontSize: 12, marginTop: 4 }}>
                {r.description?.slice(0, 60)}
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between",
                          fontSize: 12, color: "#D1D5DB", marginTop: 8 }}>
              <span>👥 {r.current_listeners}</span>
              <span>💺 {r.seats_count} مقاعد</span>
            </div>
          </div>
        ))}
        {!loading && rooms.length === 0 && (
          <div style={{ color: "#9CA3AF", gridColumn: "1/-1", textAlign: "center",
                         padding: 40 }}>
            لا توجد غرف نشطة الآن. كن أول من يبدأ غرفة!
          </div>
        )}
      </div>
    </div>
  );
}

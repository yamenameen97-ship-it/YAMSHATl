/**
 * شارة مستوى المستخدم - مع شريط تقدم XP
 * RTL + Noto Sans Arabic
 */
import React, { useEffect, useState } from "react";
import { engagementApi } from "../api/engagementApi";

export default function UserLevelBadge({ compact = false }) {
  const [lvl, setLvl] = useState(null);

  useEffect(() => {
    engagementApi.getMyLevel().then(setLvl).catch(() => {});
  }, []);

  if (!lvl) return null;

  if (compact) {
    return (
      <div dir="rtl" style={{
        fontFamily: "'Noto Sans Arabic', sans-serif",
        display: "inline-flex", alignItems: "center", gap: 6,
        background: lvl.badge_color, color: "#fff",
        padding: "3px 10px", borderRadius: 12, fontWeight: 700, fontSize: 12,
      }}>
        <span>Lv. {lvl.level}</span>
        <span style={{ opacity: 0.9 }}>{lvl.title}</span>
      </div>
    );
  }

  return (
    <div dir="rtl" style={{
      fontFamily: "'Noto Sans Arabic', sans-serif",
      background: `linear-gradient(135deg, ${lvl.badge_color}, #111827)`,
      borderRadius: 16, padding: 18, color: "#fff",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 14, opacity: 0.85 }}>المستوى</div>
          <div style={{ fontSize: 32, fontWeight: 800, lineHeight: 1 }}>
            {lvl.level}
          </div>
          <div style={{ marginTop: 4, fontWeight: 600 }}>{lvl.title}</div>
        </div>
        <div style={{ textAlign: "left", fontSize: 13, opacity: 0.9 }}>
          <div>XP: {lvl.xp} / {lvl.next_level_xp}</div>
          <div>إجمالي: {lvl.total_xp}</div>
        </div>
      </div>
      <div style={{ marginTop: 12, background: "rgba(0,0,0,0.35)",
                    borderRadius: 8, height: 10, overflow: "hidden" }}>
        <div style={{
          width: `${lvl.progress_pct}%`, height: "100%",
          background: "linear-gradient(90deg,#FBBF24,#F59E0B)",
          transition: "width .4s",
        }} />
      </div>
    </div>
  );
}

export function HostLevelBadge() {
  const [hl, setHl] = useState(null);
  useEffect(() => {
    engagementApi.getMyHostLevel().then(setHl).catch(() => {});
  }, []);
  if (!hl) return null;
  return (
    <div dir="rtl" style={{
      fontFamily: "'Noto Sans Arabic', sans-serif",
      background: "linear-gradient(135deg,#7C3AED,#1F2937)",
      borderRadius: 16, padding: 18, color: "#fff",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 14, opacity: 0.85 }}>مستوى المضيف</div>
          <div style={{ fontSize: 32, fontWeight: 800 }}>{hl.level}</div>
          <div style={{ fontWeight: 600 }}>{hl.title}</div>
        </div>
        <div style={{ textAlign: "left", fontSize: 13 }}>
          <div>🎙️ {hl.total_live_minutes} دقيقة بث</div>
          <div>💎 {hl.total_diamonds_received}</div>
          <div>👁️ {hl.total_viewers}</div>
        </div>
      </div>
      <div style={{ marginTop: 12, background: "rgba(0,0,0,0.35)",
                    borderRadius: 8, height: 10, overflow: "hidden" }}>
        <div style={{
          width: `${hl.progress_pct}%`, height: "100%",
          background: "linear-gradient(90deg,#EC4899,#F43F5E)",
        }} />
      </div>
    </div>
  );
}

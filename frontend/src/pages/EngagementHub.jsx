/**
 * مركز التفاعل - يجمع كل الميزات الجديدة في صفحة واحدة بتبويبات.
 * RTL + Noto Sans Arabic
 */
import React, { useState } from "react";
import DailyTasksCenter from "@/features/engagement/components/DailyTasksCenter";
import UserLevelBadge, { HostLevelBadge } from "@/features/engagement/components/UserLevelBadge";
import AchievementsGrid from "@/features/engagement/components/AchievementsGrid";
import LuckyWheel from "@/features/engagement/components/LuckyWheel";
import ReferralPanel from "@/features/engagement/components/ReferralPanel";
import ShopPage from "@/features/engagement/components/ShopPage";

const TABS = [
  { key: "overview",     label: "🏠 نظرة عامة" },
  { key: "tasks",        label: "🎯 المهام اليومية" },
  { key: "achievements", label: "🏆 الشارات" },
  { key: "wheel",        label: "🎡 عجلة الحظ" },
  { key: "referral",     label: "👥 الإحالة" },
  { key: "shop",         label: "🛍️ المتجر" },
];

export default function EngagementHub() {
  const [tab, setTab] = useState("overview");

  return (
    <div dir="rtl" style={{
      fontFamily: "'Noto Sans Arabic', system-ui, sans-serif",
      minHeight: "100vh", background: "#0F172A", color: "#fff",
    }}>
      <div style={{
        padding: "14px 16px",
        background: "linear-gradient(135deg,#7C3AED,#1F2937)",
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>
          ⭐ مركز التفاعل والمكافآت
        </h1>
        <div style={{ display: "flex", gap: 8, overflowX: "auto",
                       marginTop: 12, paddingBottom: 4 }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: "8px 16px", borderRadius: 20, whiteSpace: "nowrap",
              background: tab === t.key ? "#FBBF24" : "rgba(0,0,0,0.35)",
              color: tab === t.key ? "#111" : "#fff",
              border: "none", cursor: "pointer", fontWeight: 700,
              fontFamily: "inherit",
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: 16 }}>
        {tab === "overview" && (
          <div style={{ display: "grid", gap: 14 }}>
            <UserLevelBadge />
            <HostLevelBadge />
            <DailyTasksCenter />
          </div>
        )}
        {tab === "tasks"        && <DailyTasksCenter />}
        {tab === "achievements" && <AchievementsGrid />}
        {tab === "wheel"        && <LuckyWheel />}
        {tab === "referral"     && <ReferralPanel />}
        {tab === "shop"         && <ShopPage />}
      </div>
    </div>
  );
}

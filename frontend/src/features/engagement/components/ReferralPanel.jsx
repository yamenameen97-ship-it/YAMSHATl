/**
 * لوحة الإحالة وكود الإحالة - ReferralPanel
 * RTL + Noto Sans Arabic
 */
import React, { useEffect, useState } from "react";
import { engagementApi } from "../api/engagementApi";

export default function ReferralPanel() {
  const [data, setData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [applyCode, setApplyCode] = useState("");
  const [applyMsg, setApplyMsg] = useState(null);

  const load = () => engagementApi.getReferral().then(setData).catch(() => {});
  useEffect(() => { load(); }, []);

  const copy = (text) => {
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const onApply = async () => {
    if (!applyCode.trim()) return;
    try {
      const r = await engagementApi.applyReferral(applyCode.trim().toUpperCase());
      setApplyMsg({ ok: true,
        text: `✅ تم! حصلت على ${r.referred_reward} عملة وصديقك على ${r.referrer_reward}` });
      load();
    } catch (e) {
      setApplyMsg({ ok: false, text: "❌ كود غير صالح أو سبق استخدامه" });
    }
  };

  if (!data) return null;
  return (
    <div dir="rtl" style={{
      fontFamily: "'Noto Sans Arabic', sans-serif",
      padding: 16, maxWidth: 640, margin: "0 auto",
    }}>
      <h2 style={{ fontWeight: 800 }}>👥 ادعُ أصدقاءك واربح</h2>
      <p style={{ color: "#9CA3AF", fontSize: 14 }}>
        ادعُ صديقاً يسجّل عبر كودك واحصل على {data.referrer_reward} عملة، وصديقك يحصل على {data.referred_reward} عملة.
      </p>

      {/* بطاقة الكود */}
      <div style={{
        background: "linear-gradient(135deg,#7C3AED,#3B82F6)",
        borderRadius: 16, padding: 18, color: "#fff", marginTop: 12,
      }}>
        <div style={{ fontSize: 13, opacity: 0.85 }}>كود الإحالة الخاص بك</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
          <code style={{
            background: "rgba(0,0,0,0.3)", padding: "8px 16px",
            borderRadius: 10, fontSize: 22, letterSpacing: 2,
            fontWeight: 800, flex: 1, textAlign: "center",
          }}>{data.code}</code>
          <button onClick={() => copy(data.code)} style={{
            background: "#FBBF24", color: "#111", border: "none",
            padding: "10px 16px", borderRadius: 10, fontWeight: 700,
            cursor: "pointer",
          }}>{copied ? "✓ نُسخ" : "نسخ"}</button>
        </div>
        <div style={{ marginTop: 10, fontSize: 13 }}>
          🔗 رابط الدعوة:
          <div onClick={() => copy(data.share_url)} style={{
            background: "rgba(0,0,0,0.25)", padding: "6px 10px",
            borderRadius: 8, marginTop: 4, cursor: "pointer", direction: "ltr",
            wordBreak: "break-all",
          }}>{data.share_url}</div>
        </div>
      </div>

      {/* إحصائيات */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr",
                     gap: 10, marginTop: 14 }}>
        <Stat label="إجمالي الدعوات" value={data.uses_count} icon="👥" />
        <Stat label="عملات مكتسبة" value={data.total_earned_coins} icon="🪙" />
      </div>

      {/* استخدام كود إحالة */}
      <div style={{ background: "#1F2937", borderRadius: 14, padding: 14, marginTop: 14 }}>
        <div style={{ color: "#fff", fontWeight: 700, marginBottom: 8 }}>
          هل لديك كود من صديق؟ أدخله هنا
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={applyCode} onChange={e => setApplyCode(e.target.value)}
                 placeholder="ABC12345" maxLength={20}
                 style={{
                   flex: 1, padding: "10px 14px", borderRadius: 10,
                   border: "1px solid #374151", background: "#111827",
                   color: "#fff", textAlign: "center", letterSpacing: 2,
                   fontWeight: 700, fontFamily: "inherit",
                 }} />
          <button onClick={onApply} style={{
            background: "#10B981", color: "#fff", border: "none",
            padding: "10px 18px", borderRadius: 10, fontWeight: 700, cursor: "pointer",
          }}>تطبيق</button>
        </div>
        {applyMsg && (
          <div style={{ marginTop: 8, color: applyMsg.ok ? "#10B981" : "#EF4444",
                         fontWeight: 600 }}>{applyMsg.text}</div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, icon }) {
  return (
    <div style={{
      background: "#1F2937", borderRadius: 12, padding: 12, textAlign: "center",
    }}>
      <div style={{ fontSize: 24 }}>{icon}</div>
      <div style={{ color: "#FBBF24", fontWeight: 800, fontSize: 22 }}>{value}</div>
      <div style={{ color: "#9CA3AF", fontSize: 12 }}>{label}</div>
    </div>
  );
}

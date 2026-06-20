/**
 * عجلة الحظ - LuckyWheel
 * RTL + Noto Sans Arabic - دون مدوالس، النتيجة تظهر inline.
 */
import React, { useEffect, useState, useRef } from "react";
import { engagementApi } from "../api/engagementApi";

export default function LuckyWheel() {
  const [state, setState] = useState(null);
  const [spinning, setSpinning] = useState(false);
  const [angle, setAngle] = useState(0);
  const [result, setResult] = useState(null);
  const wheelRef = useRef(null);

  const load = async () => {
    try {
      const d = await engagementApi.getWheelState();
      setState(d);
    } catch (e) {}
  };

  useEffect(() => { load(); }, []);

  const doSpin = async (paid) => {
    if (spinning) return;
    setResult(null);
    setSpinning(true);
    try {
      const r = await engagementApi.spinWheel(paid);
      const prizes = state.prizes || [];
      const slice = 360 / Math.max(1, prizes.length);
      const idx = prizes.findIndex(p => p.id === r.prize_id);
      const targetAngle = 360 * 6 + (idx >= 0 ? (360 - idx * slice - slice / 2) : 0);
      setAngle(prev => prev + targetAngle);
      setTimeout(() => {
        setResult(r.prize);
        setSpinning(false);
        load();
      }, 4200);
    } catch (e) {
      setSpinning(false);
      setResult({ label: "تعذر الدوران", type: "error" });
    }
  };

  if (!state) return null;
  const prizes = state.prizes || [];
  const slice = 360 / Math.max(1, prizes.length);

  return (
    <div dir="rtl" style={{
      fontFamily: "'Noto Sans Arabic', sans-serif",
      padding: 16, maxWidth: 480, margin: "0 auto", textAlign: "center",
    }}>
      <h2 style={{ fontWeight: 800 }}>🎡 عجلة الحظ</h2>
      <p style={{ color: "#9CA3AF", fontSize: 14 }}>
        لديك دورة مجانية يومياً. الدورة الإضافية بـ {state.spin_cost_coins} عملة.
      </p>

      <div style={{ position: "relative", width: 320, height: 320, margin: "20px auto" }}>
        {/* مؤشر */}
        <div style={{
          position: "absolute", top: -8, left: "50%", transform: "translateX(-50%)",
          width: 0, height: 0,
          borderLeft: "16px solid transparent",
          borderRight: "16px solid transparent",
          borderTop: "28px solid #EF4444",
          zIndex: 5,
        }} />
        <div ref={wheelRef} style={{
          width: "100%", height: "100%", borderRadius: "50%",
          background: "conic-gradient(" + prizes.map((p, i) =>
            `${p.color} ${i * slice}deg ${(i + 1) * slice}deg`).join(",") + ")",
          transition: spinning ? "transform 4s cubic-bezier(.17,.67,.25,1)" : "none",
          transform: `rotate(${angle}deg)`,
          border: "6px solid #FBBF24",
          boxShadow: "0 0 30px rgba(251,191,36,0.5)",
          position: "relative",
        }}>
          {prizes.map((p, i) => (
            <div key={p.id} style={{
              position: "absolute", top: "50%", left: "50%",
              transform: `translate(-50%,-50%) rotate(${i * slice + slice / 2}deg) translateY(-110px)`,
              color: "#fff", fontWeight: 700, fontSize: 12, textShadow: "0 1px 2px rgba(0,0,0,0.7)",
              width: 70, textAlign: "center",
            }}>
              <div style={{ fontSize: 18 }}>{p.icon}</div>
              <div>{p.label}</div>
            </div>
          ))}
        </div>
        {/* مركز */}
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%,-50%)",
          width: 70, height: 70, borderRadius: "50%",
          background: "#1F2937", border: "4px solid #FBBF24",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#FBBF24", fontWeight: 800, fontSize: 18,
        }}>🎁</div>
      </div>

      <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 14 }}>
        <button
          disabled={spinning || !state.free_spin_available}
          onClick={() => doSpin(false)}
          style={{
            background: state.free_spin_available ? "#10B981" : "#374151",
            color: "#fff", border: "none", padding: "10px 22px",
            borderRadius: 14, fontWeight: 700, fontSize: 15,
            cursor: state.free_spin_available && !spinning ? "pointer" : "not-allowed",
          }}>
          {state.free_spin_available ? "دورة مجانية" : "تم استخدام الدورة"}
        </button>
        <button
          disabled={spinning}
          onClick={() => doSpin(true)}
          style={{
            background: "#F59E0B", color: "#111", border: "none",
            padding: "10px 22px", borderRadius: 14, fontWeight: 700, fontSize: 15,
            cursor: spinning ? "not-allowed" : "pointer",
          }}>
          🪙 ادفع {state.spin_cost_coins}
        </button>
      </div>

      {result && (
        <div style={{
          marginTop: 18, padding: 14, borderRadius: 14,
          background: "linear-gradient(135deg,#1F2937,#0F172A)",
          border: "2px solid #FBBF24", color: "#fff", fontWeight: 700,
        }}>
          🎉 ربحت: {result.label}
          {result.value > 0 && <span> (+{result.value})</span>}
        </div>
      )}
    </div>
  );
}

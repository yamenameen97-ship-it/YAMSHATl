/**
 * متجر الإطارات والصور الشخصية والخلفيات - ShopPage
 * RTL + Noto Sans Arabic - بدون مدوالس، الشراء inline.
 */
import React, { useEffect, useState } from "react";
import { engagementApi } from "../api/engagementApi";

const TYPE_TABS = [
  { key: "frame",      label: "🖼️ الإطارات" },
  { key: "avatar",     label: "👤 الصور الشخصية" },
  { key: "background", label: "🌌 الخلفيات" },
  { key: "entrance",   label: "✨ تأثيرات الدخول" },
];

const RARITY_BORDER = {
  common: "#6B7280", rare: "#3B82F6",
  epic: "#8B5CF6", legendary: "#FBBF24",
};

export default function ShopPage() {
  const [type, setType] = useState("frame");
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState({});

  const load = async () => {
    const d = await engagementApi.getShop({ item_type: type });
    setItems(d.items || []);
  };

  useEffect(() => { load(); }, [type]);

  const buy = async (id) => {
    setStatus(s => ({ ...s, [id]: { loading: true } }));
    try {
      await engagementApi.buyItem(id);
      setStatus(s => ({ ...s, [id]: { ok: true, msg: "✓ تم الشراء" } }));
      load();
    } catch (e) {
      const err = e?.response?.data?.detail || "تعذر الشراء";
      setStatus(s => ({ ...s, [id]: { ok: false, msg: "✗ " + err } }));
    }
  };

  const equip = async (id) => {
    try {
      await engagementApi.equipItem(id);
      setStatus(s => ({ ...s, [id]: { ok: true, msg: "✓ مُجهَّز" } }));
    } catch (e) {
      setStatus(s => ({ ...s, [id]: { ok: false, msg: "✗ فشل التجهيز" } }));
    }
  };

  return (
    <div dir="rtl" style={{
      fontFamily: "'Noto Sans Arabic', sans-serif",
      padding: 16, maxWidth: 1000, margin: "0 auto",
    }}>
      <h2 style={{ fontWeight: 800 }}>🛍️ متجر يمشات</h2>

      <div style={{ display: "flex", gap: 8, overflowX: "auto", padding: "8px 0" }}>
        {TYPE_TABS.map(t => (
          <button key={t.key} onClick={() => setType(t.key)} style={{
            padding: "8px 16px", borderRadius: 20, whiteSpace: "nowrap",
            background: type === t.key ? "#F59E0B" : "#1F2937",
            color: type === t.key ? "#111" : "#fff",
            border: "none", cursor: "pointer", fontWeight: 600,
          }}>{t.label}</button>
        ))}
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
        gap: 12, marginTop: 12,
      }}>
        {items.map(it => {
          const st = status[it.id];
          const border = RARITY_BORDER[it.rarity] || "#6B7280";
          return (
            <div key={it.id} style={{
              background: "#1F2937", borderRadius: 14,
              border: `2px solid ${border}`, padding: 12, textAlign: "center",
              position: "relative",
            }}>
              {it.is_limited && <div style={{
                position: "absolute", top: 6, right: 6,
                background: "#EF4444", color: "#fff", fontSize: 10,
                padding: "2px 8px", borderRadius: 8, fontWeight: 700,
              }}>محدود</div>}
              {it.is_vip_only && <div style={{
                position: "absolute", top: 6, left: 6,
                background: "#FBBF24", color: "#111", fontSize: 10,
                padding: "2px 8px", borderRadius: 8, fontWeight: 700,
              }}>VIP</div>}

              <div style={{
                width: 100, height: 100, margin: "8px auto",
                background: `url(${it.image_url}) center/cover no-repeat, #111827`,
                borderRadius: it.item_type === "avatar" ? "50%" : 12,
                border: "2px solid #374151",
              }} />
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>{it.name}</div>
              <div style={{ fontSize: 11, color: border, marginTop: 2 }}>
                {it.rarity} {it.required_level > 0 && `· Lv. ${it.required_level}+`}
              </div>
              <div style={{ marginTop: 6, color: "#FBBF24", fontWeight: 700 }}>
                {it.price_diamonds > 0
                  ? <>💎 {it.price_diamonds}</>
                  : <>🪙 {it.price_coins}</>}
                {it.duration_days && <span style={{ color: "#9CA3AF", fontSize: 11 }}>
                  {" "}({it.duration_days} يوم)
                </span>}
              </div>

              <div style={{ marginTop: 8 }}>
                {it.owned ? (
                  <button onClick={() => equip(it.id)} style={{
                    background: "#10B981", color: "#fff", border: "none",
                    padding: "6px 14px", borderRadius: 10, fontWeight: 700,
                    cursor: "pointer", width: "100%",
                  }}>تجهيز</button>
                ) : (
                  <button onClick={() => buy(it.id)} disabled={st?.loading}
                    style={{
                      background: "#F59E0B", color: "#111", border: "none",
                      padding: "6px 14px", borderRadius: 10, fontWeight: 700,
                      cursor: st?.loading ? "wait" : "pointer", width: "100%",
                    }}>{st?.loading ? "..." : "شراء"}</button>
                )}
                {st?.msg && (
                  <div style={{
                    marginTop: 6, fontSize: 12,
                    color: st.ok ? "#10B981" : "#EF4444",
                  }}>{st.msg}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

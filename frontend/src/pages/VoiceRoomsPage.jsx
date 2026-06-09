/**
 * صفحة الغرف الصوتية - VoiceRoomsPage
 * RTL + Noto Sans Arabic. تتنقل بين القائمة وإنشاء غرفة وعرض غرفة inline (لا مدوالس).
 */
import React, { useState } from "react";
import VoiceRoomsList from "@/features/voice-rooms/components/VoiceRoomsList";
import VoiceRoomView from "@/features/voice-rooms/components/VoiceRoomView";
import { voiceRoomsApi } from "@/features/engagement/api/engagementApi";
import { useAppStore } from "../store/appStore.js";

export default function VoiceRoomsPage() {
  const [mode, setMode] = useState("list"); // list | create | room
  const [activeRoomId, setActiveRoomId] = useState(null);
  // ⚡ المشروع يستخدم Zustand وليس Redux
  const currentUserId = useAppStore((s) => s?.session?.id ?? s?.session?.user?.id ?? null);

  if (mode === "room" && activeRoomId) {
    return (
      <VoiceRoomView
        roomId={activeRoomId}
        currentUserId={currentUserId}
        onLeave={() => { setMode("list"); setActiveRoomId(null); }}
      />
    );
  }

  if (mode === "create") {
    return <CreateRoomInline
      onCancel={() => setMode("list")}
      onCreated={(id) => { setActiveRoomId(id); setMode("room"); }}
    />;
  }

  return (
    <VoiceRoomsList
      onOpen={(id) => { setActiveRoomId(id); setMode("room"); }}
      onCreate={() => setMode("create")}
    />
  );
}

function CreateRoomInline({ onCancel, onCreated }) {
  const [form, setForm] = useState({
    title: "", description: "", category: "general",
    seats_count: 8, is_private: false, password: "",
  });
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!form.title.trim()) { setErr("أدخل عنواناً للغرفة"); return; }
    setBusy(true); setErr(null);
    try {
      const r = await voiceRoomsApi.create(form);
      onCreated(r.id);
    } catch (e) {
      setErr(e?.response?.data?.detail || "تعذر إنشاء الغرفة");
    } finally { setBusy(false); }
  };

  return (
    <div dir="rtl" style={{
      fontFamily: "'Noto Sans Arabic', sans-serif",
      padding: 16, maxWidth: 520, margin: "0 auto", color: "#fff",
    }}>
      <h2 style={{ fontWeight: 800 }}>➕ إنشاء غرفة صوتية</h2>
      <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
        <Field label="عنوان الغرفة">
          <input value={form.title}
                 onChange={e => setForm({ ...form, title: e.target.value })}
                 maxLength={100} style={inputStyle} />
        </Field>
        <Field label="وصف مختصر (اختياري)">
          <textarea value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    rows={3} maxLength={300} style={inputStyle} />
        </Field>
        <Field label="التصنيف">
          <select value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  style={inputStyle}>
            <option value="general">عام</option>
            <option value="music">موسيقى</option>
            <option value="games">ألعاب</option>
            <option value="education">تعليم</option>
            <option value="comedy">تسلية</option>
            <option value="religion">ديني</option>
          </select>
        </Field>
        <Field label={`عدد المقاعد: ${form.seats_count}`}>
          <input type="range" min={2} max={15} value={form.seats_count}
                 onChange={e => setForm({ ...form, seats_count: +e.target.value })}
                 style={{ width: "100%" }} />
        </Field>
        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input type="checkbox" checked={form.is_private}
                 onChange={e => setForm({ ...form, is_private: e.target.checked })} />
          <span>غرفة خاصة (محمية بكلمة مرور)</span>
        </label>
        {form.is_private && (
          <Field label="كلمة المرور">
            <input value={form.password}
                   onChange={e => setForm({ ...form, password: e.target.value })}
                   style={inputStyle} />
          </Field>
        )}
        {err && <div style={{ color: "#EF4444" }}>{err}</div>}
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onCancel} style={btnStyle("#374151")}>إلغاء</button>
          <button onClick={submit} disabled={busy}
                  style={{ ...btnStyle("#10B981"), flex: 1 }}>
            {busy ? "جاري الإنشاء..." : "🚀 إنشاء وبدء الغرفة"}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "10px 12px", borderRadius: 10,
  border: "1px solid #374151", background: "#111827", color: "#fff",
  fontFamily: "inherit", fontSize: 14,
};

const btnStyle = (bg) => ({
  background: bg, color: "#fff", border: "none",
  padding: "10px 18px", borderRadius: 12, fontWeight: 700,
  cursor: "pointer", fontFamily: "inherit",
});

function Field({ label, children }) {
  return (
    <div>
      <div style={{ marginBottom: 4, fontSize: 13, color: "#9CA3AF" }}>{label}</div>
      {children}
    </div>
  );
}

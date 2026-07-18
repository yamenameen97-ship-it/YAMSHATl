/**
 * صفحة الغرف الصوتية - VoiceRoomsPage
 * RTL + Noto Sans Arabic. تتنقل بين القائمة وإنشاء غرفة وعرض غرفة inline (لا مدوالس).
 */
import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout.jsx";
import VoiceRoomsList from "@/features/voice-rooms/components/VoiceRoomsList";
import VoiceRoomView from "@/features/voice-rooms/components/VoiceRoomView";
import { voiceRoomsApi } from "@/features/engagement/api/engagementApi";
import { useAppStore } from "../store/appStore.js";

export default function VoiceRoomsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  // v59.13: دعم ?create=1 لفتح وضع الإنشاء مباشرة (عند الدخول من صفحة المجموعات)
  const wantsCreate = searchParams.get('create') === '1';
  const [mode, setMode] = useState(wantsCreate ? "create" : "list"); // list | create | room
  const [activeRoomId, setActiveRoomId] = useState(null);
  // ⚡ المشروع يستخدم Zustand وليس Redux
  const currentUserId = useAppStore((s) => s?.session?.id ?? s?.session?.user?.id ?? null);

  // بعد فتح وضع الإنشاء تلقائيًا، ننظّف الـquery param لأن المستخدم إذا ضغط رجوع
  // ثم فتح الصفحة مجددًا لا تفتح على وضع الإنشاء دون قصد.
  useEffect(() => {
    if (wantsCreate) {
      const next = new URLSearchParams(searchParams);
      next.delete('create');
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (mode === "room" && activeRoomId) {
    return (
      <MainLayout>
        <VoiceRoomView
          roomId={activeRoomId}
          currentUserId={currentUserId}
          onLeave={() => { setMode("list"); setActiveRoomId(null); }}
        />
      </MainLayout>
    );
  }

  if (mode === "create") {
    return (
      <MainLayout>
        <CreateRoomInline
          onCancel={() => {
            // v59.13: إذا أتى المستخدم من /groups عبر ?create=1، ارجع للمجموعات
            if (wantsCreate) {
              navigate('/groups');
              return;
            }
            setMode("list");
          }}
          onCreated={(id) => { setActiveRoomId(id); setMode("room"); }}
        />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <VoiceRoomsList
        onOpen={(id) => { setActiveRoomId(id); setMode("room"); }}
        onCreate={() => setMode("create")}
      />
    </MainLayout>
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
    // v88.3.5: تحقق من كلمة المرور إذا كانت الغرفة خاصة
    if (form.is_private && !form.password.trim()) {
      setErr("الغرفة الخاصة تتطلب كلمة مرور");
      return;
    }
    setBusy(true); setErr(null);
    try {
      // v88.3.5: تنظيف الحمولة قبل الإرسال — أمان مقابل backend Pydantic strict
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        category: form.category || "general",
        seats_count: Number(form.seats_count) || 8,
        is_private: Boolean(form.is_private),
        password: form.is_private ? (form.password || null) : null,
      };
      const r = await voiceRoomsApi.create(payload);
      if (!r || !r.id) throw new Error("السيرفر لم يرجع معرّف الغرفة");
      onCreated(r.id);
    } catch (e) {
      // v88.3.5: عند 404 نتحقّق إذا كان الراوتر محملاً فعلاً (ping)
      // حتى نميّز بين "الخدمة غير متوفرة" و "مشكلة في طلبيك"
      const status = e?.response?.status;
      const detail = e?.response?.data?.detail;
      let msg;
      if (status === 401) {
        msg = "يرجى تسجيل الدخول أولاً";
      } else if (status === 403) {
        msg = (typeof detail === 'string' ? detail : null) || "ليس لديك صلاحية لإنشاء غرفة صوتية";
      } else if (status === 404) {
        // تحقق من حالة الراوتر حتى نتأكد
        try {
          const p = await voiceRoomsApi.ping();
          if (p?.available) {
            // الراوتر موجود، لكن مسار الإنشاء فشل — غالباً مشكلة متصفح/كوكيز
            msg = "تعذر إنشاء الغرفة — جرّب تحديث الصفحة وإعادة تسجيل الدخول";
          } else {
            msg = "خدمة الغرف الصوتية غير متوفرة حالياً — حاول مجدداً بعد قليل";
          }
        } catch (_) {
          msg = "خدمة الغرف الصوتية غير متوفرة حالياً — حاول مجدداً بعد قليل";
        }
      } else if (status === 400 && detail) {
        msg = typeof detail === 'string' ? detail : JSON.stringify(detail);
      } else if (status === 422 && detail) {
        // Pydantic validation error
        msg = typeof detail === 'string' ? detail : "بعض الحقول غير صحيحة — تحقّق من العنوان وعدد المقاعد";
      } else if (status === 503) {
        msg = (typeof detail === 'string' ? detail : null) || "خدمة الغرف الصوتية تحت الصيانة — حاول لاحقاً";
      } else if (status === 500) {
        msg = (typeof detail === 'string' ? detail : null) || "خطأ في السيرفر — حاول مجدداً";
      } else if (!e?.response) {
        msg = "لا يوجد اتصال بالإنترنت";
      } else {
        msg = (typeof detail === 'string' ? detail : null) || e?.message || "تعذر إنشاء الغرفة";
      }
      console.error('[VoiceRoom.create] failed:', { status, detail, err: e });
      setErr(msg);
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

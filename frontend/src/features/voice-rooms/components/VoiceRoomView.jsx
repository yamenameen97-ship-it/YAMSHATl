/**
 * شاشة غرفة صوتية - VoiceRoomView
 * RTL + Noto Sans Arabic - تعرض المقاعد والشات والمستمعين inline (لا مدوالس).
 */
import React, { useEffect, useState, useRef } from "react";
import { voiceRoomsApi } from "../../engagement/api/engagementApi";

export default function VoiceRoomView({ roomId, onLeave, currentUserId }) {
  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const chatEndRef = useRef(null);
  const pollRef = useRef(null);

  const refresh = async () => {
    try {
      const r = await voiceRoomsApi.get(roomId);
      setRoom(r);
      const m = await voiceRoomsApi.getMessages(roomId, 50);
      setMessages(m.messages || []);
    } catch (e) {}
  };

  useEffect(() => {
    voiceRoomsApi.join(roomId).then(refresh).catch(refresh);
    pollRef.current = setInterval(refresh, 5000);
    return () => {
      clearInterval(pollRef.current);
      voiceRoomsApi.leave(roomId).catch(() => {});
    };
  }, [roomId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const takeSeat = async (idx) => {
    try { await voiceRoomsApi.takeSeat(roomId, idx); refresh(); }
    catch (e) {}
  };

  const leaveSeat = async () => {
    try { await voiceRoomsApi.leaveSeat(roomId); refresh(); } catch (e) {}
  };

  const send = async () => {
    if (!text.trim()) return;
    try {
      await voiceRoomsApi.sendMessage(roomId, text.trim());
      setText("");
      refresh();
    } catch (e) {}
  };

  const onLeaveRoom = async () => {
    try { await voiceRoomsApi.leave(roomId); } catch {}
    onLeave?.();
  };

  if (!room) return <div dir="rtl" style={{ padding: 20 }}>جاري التحميل...</div>;

  const mySeatIndex = (room.seats || []).findIndex(s => s && s.user_id === currentUserId);
  const isOwner = room.owner_id === currentUserId;

  return (
    <div dir="rtl" style={{
      fontFamily: "'Noto Sans Arabic', sans-serif",
      minHeight: "100vh", background: "linear-gradient(180deg,#0F172A,#1F2937)",
      color: "#fff", display: "flex", flexDirection: "column",
    }}>
      {/* Header */}
      <div style={{ padding: 14, background: "rgba(0,0,0,0.35)",
                    display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button onClick={onLeaveRoom} style={{
          background: "#EF4444", color: "#fff", border: "none",
          padding: "8px 14px", borderRadius: 10, fontWeight: 700, cursor: "pointer",
        }}>✕ مغادرة</button>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 800, fontSize: 17 }}>{room.title}</div>
          <div style={{ fontSize: 12, color: "#9CA3AF" }}>
            👥 {room.current_listeners} مستمع · 💎 {room.total_gifts_value}
          </div>
        </div>
        <div style={{ width: 80 }} />
      </div>

      {/* المقاعد */}
      <div style={{ padding: 18 }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 12, justifyItems: "center",
        }}>
          {(room.seats || []).map((s, idx) => (
            <SeatBubble key={idx} seat={s} index={idx}
                        onTake={() => takeSeat(idx)} />
          ))}
        </div>

        {mySeatIndex >= 0 && (
          <div style={{ textAlign: "center", marginTop: 14 }}>
            <button onClick={leaveSeat} style={{
              background: "#374151", color: "#fff", border: "none",
              padding: "6px 16px", borderRadius: 10, fontWeight: 600, cursor: "pointer",
            }}>أنزل من المقعد</button>
          </div>
        )}
      </div>

      {/* الشات */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 16px",
                    display: "flex", flexDirection: "column", gap: 6 }}>
        {messages.map(m => (
          <div key={m.id} style={{
            display: "flex", gap: 8, alignItems: "flex-start",
            background: "rgba(31,41,55,0.6)", padding: "6px 10px",
            borderRadius: 10, maxWidth: "80%",
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              background: m.avatar ? `url(${m.avatar}) center/cover` : "#374151",
            }} />
            <div>
              <div style={{ fontSize: 12, color: "#FBBF24", fontWeight: 700 }}>
                {m.username}
              </div>
              <div style={{ fontSize: 14 }}>{m.content}</div>
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* صندوق الإدخال */}
      <div style={{ display: "flex", gap: 8, padding: 12,
                    background: "rgba(0,0,0,0.35)" }}>
        <input value={text} onChange={e => setText(e.target.value)}
               onKeyDown={e => e.key === "Enter" && send()}
               placeholder="اكتب رسالة..." style={{
                 flex: 1, padding: "10px 14px", borderRadius: 12,
                 border: "1px solid #374151", background: "#111827",
                 color: "#fff", fontFamily: "inherit",
               }} />
        <button onClick={send} style={{
          background: "#10B981", color: "#fff", border: "none",
          padding: "10px 18px", borderRadius: 12, fontWeight: 700, cursor: "pointer",
        }}>إرسال</button>
      </div>
    </div>
  );
}

function SeatBubble({ seat, index, onTake }) {
  if (!seat) {
    return (
      <button onClick={onTake} style={{
        width: 72, height: 72, borderRadius: "50%",
        border: "2px dashed #6B7280", background: "rgba(255,255,255,0.05)",
        color: "#9CA3AF", cursor: "pointer", fontSize: 22,
      }}>+</button>
    );
  }
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{
        width: 72, height: 72, borderRadius: "50%",
        background: seat.avatar ? `url(${seat.avatar}) center/cover` : "#374151",
        border: seat.role === "owner" ? "3px solid #FBBF24"
              : seat.role === "speaker" ? "3px solid #10B981"
              : "3px solid #6B7280",
        position: "relative",
      }}>
        {seat.is_muted && <div style={{
          position: "absolute", bottom: -4, left: -4,
          background: "#EF4444", width: 22, height: 22, borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12,
        }}>🔇</div>}
      </div>
      <div style={{ fontSize: 11, marginTop: 4, fontWeight: 600 }}>
        {seat.username}
      </div>
      <div style={{ fontSize: 10, color: "#9CA3AF" }}>
        {seat.role === "owner" ? "👑 المالك"
         : seat.role === "admin" ? "🛡️ مشرف"
         : "🎤 متحدث"}
      </div>
    </div>
  );
}

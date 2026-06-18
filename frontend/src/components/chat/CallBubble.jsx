/**
 * CallBubble
 * --------------------------------------------------------------------------
 * فقاعة سجلّ مكالمة داخل سياق الدردشة (نمط واتساب).
 *
 * أنواع المكالمة:
 *   - voice / video
 *   - incoming / outgoing
 *   - missed (لم يتم الرد) / answered / declined / canceled
 *
 * Props:
 *   call : {
 *     id, mode: 'voice'|'video',
 *     direction: 'incoming'|'outgoing',
 *     status: 'missed'|'answered'|'declined'|'canceled',
 *     duration_sec: number,
 *     time: string,
 *     isMe: boolean,        // outgoing = isMe = true
 *   }
 *   onCallBack : () => void   // إعادة الاتصال عند الضغط
 */
export default function CallBubble({ call, onCallBack }) {
  if (!call) return null;

  const isVideo = call.mode === 'video';
  const isMissed = call.status === 'missed' || call.status === 'canceled' || call.status === 'declined';
  const isOutgoing = call.direction === 'outgoing' || call.isMe;

  const icon = isVideo ? '🎥' : '📞';
  const arrow = isMissed
    ? (isOutgoing ? '↗' : '↙')
    : (isOutgoing ? '↗' : '↙');

  const title = isMissed
    ? (isVideo ? 'مكالمة فيديو فائتة' : 'مكالمة صوتية فائتة')
    : (isVideo ? 'مكالمة فيديو' : 'مكالمة صوتية');

  const subtitle = isMissed
    ? 'اضغط لمعاودة الاتصال'
    : call.duration_sec
      ? formatDuration(call.duration_sec)
      : (isOutgoing ? 'لم يتم الرد' : 'تم الرد');

  return (
    <div
      className={`yam-call-bubble ${call.isMe ? 'me' : 'them'} ${isMissed ? 'missed' : ''}`}
      dir="rtl"
      role="button"
      tabIndex={0}
      onClick={onCallBack}
      onKeyDown={(e) => { if (e.key === 'Enter') onCallBack?.(); }}
      aria-label={`${title} - ${subtitle}`}
    >
      <style>{`
        .yam-call-bubble {
          display: inline-flex; align-items: center; gap: 12px;
          padding: 10px 14px;
          border-radius: 14px;
          font-family: 'Noto Sans Arabic', 'Cairo', 'Tahoma', sans-serif;
          cursor: pointer;
          max-width: 280px;
          min-width: 200px;
          transition: transform 0.12s, box-shadow 0.12s;
          border: 1px solid transparent;
        }
        .yam-call-bubble:hover { transform: translateY(-1px); }
        .yam-call-bubble.me {
          background: linear-gradient(135deg, rgba(34,197,94,0.18), rgba(16,185,129,0.10));
          border-color: rgba(34,197,94,0.3);
          color: #d1fae5;
        }
        .yam-call-bubble.them {
          background: rgba(255,255,255,0.06);
          border-color: rgba(255,255,255,0.1);
          color: #e5e7eb;
        }
        .yam-call-bubble.missed.me,
        .yam-call-bubble.missed.them {
          border-color: rgba(239,68,68,0.4);
          background: rgba(239,68,68,0.12);
          color: #fecaca;
        }
        .yam-call-bubble .icon-wrap {
          width: 40px; height: 40px;
          border-radius: 50%;
          background: rgba(255,255,255,0.08);
          display: flex; align-items: center; justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
        }
        .yam-call-bubble.missed .icon-wrap {
          background: rgba(239,68,68,0.2);
          color: #ef4444;
        }
        .yam-call-bubble .body {
          display: flex; flex-direction: column; gap: 2px;
          min-width: 0;
        }
        .yam-call-bubble .title-row {
          display: flex; align-items: center; gap: 6px;
          font-size: 14px; font-weight: 600;
        }
        .yam-call-bubble .arrow {
          font-size: 13px;
          opacity: 0.7;
        }
        .yam-call-bubble.missed .arrow { color: #ef4444; opacity: 1; }
        .yam-call-bubble .sub {
          font-size: 12px;
          opacity: 0.7;
        }
        .yam-call-bubble .time {
          font-size: 11px;
          opacity: 0.55;
          margin-inline-start: auto;
          white-space: nowrap;
        }
      `}</style>

      <div className="icon-wrap" aria-hidden="true">{icon}</div>
      <div className="body">
        <div className="title-row">
          <span className="arrow">{arrow}</span>
          <span>{title}</span>
        </div>
        <span className="sub">{subtitle}</span>
      </div>
      {call.time ? <span className="time">{call.time}</span> : null}
    </div>
  );
}

function formatDuration(sec) {
  const s = Number(sec) || 0;
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m > 0) return `المدة: ${m}:${String(r).padStart(2, '0')}`;
  return `المدة: ${r} ث`;
}

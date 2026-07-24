/**
 * CallBubble
 * --------------------------------------------------------------------------
 * فقاعة سجلّ مكالمة داخل سياق الدردشة (نمط واتساب — مطابقة للصورة المرجعية).
 *
 * ✅ v88.56 (2026-07-24) — CALL RECORDS IN CHAT
 *  - أيقونات SVG لسماعة الهاتف الثابت (صوت) وكاميرا الفيديو
 *  - "مكالمة صادرة" لخط أخضر عند الإجراء
 *  - "مكالمة واردة" عند الاستقبال
 *  - "مكالمة فائتة" باللون الأحمر (فيديو أو صوت) عند عدم الرد
 *  - سهم الاتجاه (↗ صادرة / ↙ واردة) بجانب النص
 *  - الوقت يظهر في نهاية الفقاعة
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
 *     isMe: boolean,
 *   }
 *   onCallBack : () => void
 */

// ── SVG Icons (stroke-based, currentColor) ──────────────────────────────────
const PhoneIcon = ({ size = 18 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none"
       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0 1 22 16.92z" />
  </svg>
);

const VideoIcon = ({ size = 18 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none"
       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="23 7 16 12 23 17 23 7" />
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
  </svg>
);

const ArrowIcon = ({ direction = 'out', size = 14 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none"
       stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {direction === 'out' ? (
      // ↗ سهم صادر (يمين-أعلى)
      <>
        <line x1="7" y1="17" x2="17" y2="7" />
        <polyline points="9 7 17 7 17 15" />
      </>
    ) : (
      // ↙ سهم وارد (يسار-أسفل)
      <>
        <line x1="17" y1="7" x2="7" y2="17" />
        <polyline points="15 17 7 17 7 9" />
      </>
    )}
  </svg>
);

export default function CallBubble({ call, onCallBack }) {
  if (!call) return null;

  const isVideo = call.mode === 'video';
  const isMissed =
    call.status === 'missed' ||
    call.status === 'canceled' ||
    call.status === 'declined' ||
    (call.status === 'no_answer');
  const isOutgoing = call.direction === 'outgoing' || call.isMe;

  // العنوان الرئيسي: صادرة/واردة/فائتة (يشمل نوع المكالمة)
  const title = isMissed
    ? (isVideo ? 'مكالمة فيديو فائتة' : 'مكالمة فائتة')
    : (isOutgoing
        ? (isVideo ? 'مكالمة فيديو صادرة' : 'مكالمة صادرة')
        : (isVideo ? 'مكالمة فيديو واردة' : 'مكالمة واردة'));

  const subtitle = isMissed
    ? 'اضغط لمعاودة الاتصال'
    : (call.duration_sec
        ? formatDuration(call.duration_sec)
        : (isOutgoing ? 'لم يتم الرد' : 'تم الرد'));

  // فئة اللون: صادرة (خضراء) / واردة (عادي) / فائتة (حمراء)
  const toneClass = isMissed
    ? 'missed'
    : (isOutgoing ? 'outgoing' : 'incoming');

  return (
    <div
      className={`yam-call-bubble ${toneClass}`}
      dir="rtl"
      role="button"
      tabIndex={0}
      onClick={onCallBack}
      onKeyDown={(e) => { if (e.key === 'Enter') onCallBack?.(); }}
      aria-label={`${title} - ${subtitle}`}
    >
      <style>{`
        .yam-call-bubble {
          display: inline-flex; align-items: center; gap: 10px;
          padding: 10px 14px;
          border-radius: 14px;
          font-family: 'Noto Sans Arabic', 'Cairo', 'Tahoma', sans-serif;
          cursor: pointer;
          width: 100%;
          max-width: 320px;
          min-width: 230px;
          transition: transform 0.12s, box-shadow 0.12s, background 0.15s;
          border: 1px solid transparent;
          background: rgba(255,255,255,0.05);
        }
        .yam-call-bubble:hover { transform: translateY(-1px); }
        .yam-call-bubble:active { transform: translateY(0); }

        /* صادرة — أخضر خفيف */
        .yam-call-bubble.outgoing {
          background: rgba(34,197,94,0.10);
          border-color: rgba(34,197,94,0.25);
          color: #d1fae5;
        }
        .yam-call-bubble.outgoing .icon-wrap { color: #22c55e; background: rgba(34,197,94,0.18); }
        .yam-call-bubble.outgoing .arrow { color: #22c55e; }

        /* واردة — بنفسجي/رمادي هادئ */
        .yam-call-bubble.incoming {
          background: rgba(139,92,246,0.10);
          border-color: rgba(139,92,246,0.25);
          color: #e9d5ff;
        }
        .yam-call-bubble.incoming .icon-wrap { color: #a78bfa; background: rgba(139,92,246,0.18); }
        .yam-call-bubble.incoming .arrow { color: #a78bfa; }

        /* فائتة — أحمر واضح (صوت أو فيديو) */
        .yam-call-bubble.missed {
          background: rgba(239,68,68,0.10);
          border-color: rgba(239,68,68,0.35);
          color: #fecaca;
        }
        .yam-call-bubble.missed .icon-wrap { color: #ef4444; background: rgba(239,68,68,0.18); }
        .yam-call-bubble.missed .arrow { color: #ef4444; }
        .yam-call-bubble.missed .title-text { color: #fecaca; }

        .yam-call-bubble .icon-wrap {
          width: 38px; height: 38px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .yam-call-bubble .body {
          display: flex; flex-direction: column; gap: 3px;
          min-width: 0; flex: 1;
        }
        .yam-call-bubble .title-row {
          display: flex; align-items: center; gap: 6px;
          font-size: 14px; font-weight: 600;
        }
        .yam-call-bubble .arrow {
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .yam-call-bubble .title-text { color: inherit; }
        .yam-call-bubble .sub {
          font-size: 12px;
          opacity: 0.75;
        }
        .yam-call-bubble .time {
          font-size: 11px;
          opacity: 0.6;
          margin-inline-start: auto;
          white-space: nowrap;
          font-variant-numeric: tabular-nums;
        }
      `}</style>

      <div className="icon-wrap">
        {isVideo ? <VideoIcon /> : <PhoneIcon />}
      </div>

      <div className="body">
        <div className="title-row">
          <span className="arrow"><ArrowIcon direction={isOutgoing ? 'out' : 'in'} /></span>
          <span className="title-text">{title}</span>
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
  if (m > 0) return `المدة ${m}:${String(r).padStart(2, '0')}`;
  return `المدة ${r} ث`;
}

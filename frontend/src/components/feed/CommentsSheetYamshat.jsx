/**
 * CommentsSheetYamshat
 * شيت التعليقات بتصميم Yamshat (يطابق الصورة الثانية تماماً)
 *
 * Props:
 *  - open: boolean
 *  - onClose: () => void
 *  - postOwner: { username, verified, bio, dateLabel, avatarUrl }
 *  - comments: Array<{
 *      id, username, content, created_at, likes_count, replies_count,
 *      avatarUrl, verified, isOwner
 *    }>
 *  - totalCount: number
 *  - currentUserAvatar?: string
 *  - onSubmit: (text: string) => Promise<void> | void
 *  - onLike?: (commentId) => void
 *  - sort: 'newest' | 'top'
 *  - onSortChange?: (sort) => void
 */
import { useEffect, useMemo, useRef, useState } from 'react';

function formatTimeAgo(iso) {
  if (!iso) return 'الآن';
  try {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return 'الآن';
    if (diff < 3600) return `${Math.floor(diff / 60)} د`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} س`;
    if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} ي`;
    return `${Math.floor(diff / (86400 * 7))} أ`;
  } catch (_) { return ''; }
}

function formatCount(n) {
  const v = Number(n || 0);
  if (v >= 1000000) return (v / 1000000).toFixed(1).replace(/\.0$/, '') + 'م';
  if (v >= 1000) return (v / 1000).toFixed(1).replace(/\.0$/, '') + 'ك';
  return String(v);
}

export default function CommentsSheetYamshat({
  open,
  onClose,
  postOwner,
  comments = [],
  totalCount = 0,
  currentUserAvatar = '',
  onSubmit,
  onLike,
  sort = 'newest',
  onSortChange,
}) {
  const [draft, setDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef(null);
  const [sortMenuOpen, setSortMenuOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      setDraft('');
      setSortMenuOpen(false);
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    const text = String(draft || '').trim();
    if (!text || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit?.(text);
      setDraft('');
    } finally {
      setSubmitting(false);
    }
  };

  const owner = postOwner || {};
  const ownerName = owner.username || 'yamenameen97';
  const ownerVerified = owner.verified ?? true;
  const ownerBioLines = (owner.bio || 'صانع محتوى تقني | عاشق للتصميم والمونتاج 💜\nشارك شغفي واستمتع بالمحتوى').split('\n');
  const ownerDate = owner.dateLabel || '12 مايو';

  return (
    <div className="ycs-overlay" role="dialog" aria-label="التعليقات" dir="rtl" onClick={onClose}>
      <style>{commentsSheetStyles}</style>

      <div className="ycs-sheet" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <header className="ycs-header">
          <button type="button" className="ycs-back" onClick={onClose} aria-label="رجوع">
            <ChevronStartIcon />
          </button>
          <h2 className="ycs-title">المنشورات</h2>
          <span className="ycs-header-spacer" />
        </header>

        <div className="ycs-scroll">
          {/* Post owner info */}
          <div className="ycs-owner">
            <div className="ycs-owner-row">
              <div className="ycs-avatar-wrap ycs-owner-avatar">
                {owner.avatarUrl ? (
                  <img src={owner.avatarUrl} alt={ownerName} />
                ) : (
                  <span className="ycs-avatar-fallback">Y</span>
                )}
                <span className="ycs-avatar-plus" aria-hidden>+</span>
              </div>
              <div className="ycs-owner-meta">
                <div className="ycs-owner-name-row">
                  <strong>{ownerName}</strong>
                  {ownerVerified ? <VerifiedBadge /> : null}
                </div>
                {ownerBioLines.map((line, idx) => (
                  <p key={idx} className="ycs-owner-bio">{line}</p>
                ))}
                <span className="ycs-owner-date">{ownerDate}</span>
              </div>
            </div>
          </div>

          {/* Comments header (count + sort) */}
          <div className="ycs-section-head">
            <div
              className="ycs-sort"
              role="button"
              tabIndex={0}
              onClick={() => setSortMenuOpen(v => !v)}
              onKeyDown={(e) => { if (e.key === 'Enter') setSortMenuOpen(v => !v); }}
            >
              <span>{sort === 'newest' ? 'الأحدث' : 'الأعلى'}</span>
              <ChevronDownIcon />
              {sortMenuOpen ? (
                <div className="ycs-sort-menu" onClick={(e) => e.stopPropagation()}>
                  <button type="button" className={sort === 'newest' ? 'active' : ''} onClick={() => { onSortChange?.('newest'); setSortMenuOpen(false); }}>الأحدث</button>
                  <button type="button" className={sort === 'top' ? 'active' : ''} onClick={() => { onSortChange?.('top'); setSortMenuOpen(false); }}>الأعلى</button>
                </div>
              ) : null}
            </div>
            <h3 className="ycs-section-title">
              التعليقات ({formatCount(totalCount || comments.length)})
            </h3>
          </div>

          {/* Comments list */}
          <ul className="ycs-list">
            {comments.length === 0 ? (
              <li className="ycs-empty">لا توجد تعليقات بعد. كن أول من يعلق.</li>
            ) : null}
            {comments.map((c) => (
              <li key={c.id} className="ycs-item">
                {/* Side actions (more / like) */}
                <div className="ycs-item-side">
                  <button type="button" className="ycs-icon-btn" aria-label="المزيد">
                    <MoreIcon />
                  </button>
                  <button
                    type="button"
                    className={`ycs-like ${c.liked ? 'liked' : ''}`}
                    onClick={() => onLike?.(c.id)}
                    aria-label="إعجاب"
                  >
                    <HeartIcon filled={c.liked} />
                    <span className="ycs-like-count">{formatCount(c.likes_count)}</span>
                  </button>
                </div>

                {/* Comment body (right side in RTL: avatar at far right) */}
                <div className="ycs-item-body">
                  <div className="ycs-item-text">
                    <div className="ycs-item-name-row">
                      <strong>{c.username || 'مستخدم'}</strong>
                      {c.verified ? <VerifiedBadge size={12} /> : null}
                    </div>
                    <p className="ycs-item-content">{c.content}</p>
                    <div className="ycs-item-meta">
                      <span className="ycs-item-time">{formatTimeAgo(c.created_at)}</span>
                      <span className="ycs-item-dot">·</span>
                      <button type="button" className="ycs-item-reply-link">رد</button>
                    </div>
                    {Number(c.replies_count || 0) > 0 ? (
                      <button type="button" className="ycs-show-replies">
                        <span className="ycs-show-replies-line" />
                        <span>عرض {c.replies_count === 1 ? 'رد واحد' : c.replies_count === 2 ? 'ردين' : `${c.replies_count} ردود`}</span>
                      </button>
                    ) : null}
                  </div>

                  <div className={`ycs-avatar-wrap ${c.isOwner ? 'is-owner' : ''}`}>
                    {c.avatarUrl ? (
                      <img src={c.avatarUrl} alt={c.username || ''} />
                    ) : (
                      <span className="ycs-avatar-fallback">
                        {(c.username || 'U').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Composer */}
        <form className="ycs-composer" onSubmit={handleSubmit}>
          <button type="submit" className="ycs-send" aria-label="إرسال" disabled={!draft.trim() || submitting}>
            <SendIcon />
          </button>
          <input
            ref={inputRef}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="أضف تعليقا..."
            className="ycs-input"
          />
          <div className="ycs-avatar-wrap ycs-composer-avatar">
            {currentUserAvatar ? (
              <img src={currentUserAvatar} alt="" />
            ) : (
              <span className="ycs-avatar-fallback">Y</span>
            )}
          </div>
        </form>

        <div className="ycs-home-indicator" aria-hidden />
      </div>
    </div>
  );
}

/* -------- Icons -------- */
const s = { stroke: 'currentColor', strokeWidth: 1.8, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' };

function ChevronStartIcon() {
  // RTL: visual back arrow points to the right (parent dir=rtl handles flip naturally; we draw right-pointing)
  return (<svg width="22" height="22" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6" {...s} /></svg>);
}
function ChevronDownIcon() {
  return (<svg width="14" height="14" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" {...s} /></svg>);
}
function MoreIcon() {
  return (<svg width="18" height="18" viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.6" fill="currentColor" /><circle cx="12" cy="12" r="1.6" fill="currentColor" /><circle cx="19" cy="12" r="1.6" fill="currentColor" /></svg>);
}
function HeartIcon({ filled }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path
        d="M12 20.5s-7-4.4-7-10A4.5 4.5 0 0 1 12 6.5 4.5 4.5 0 0 1 19 10.5c0 5.6-7 10-7 10z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function SendIcon() {
  return (<svg width="20" height="20" viewBox="0 0 24 24"><path d="M21 3L3 11l7 2 2 7 9-17z" {...s} /></svg>);
}
function VerifiedBadge({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-label="موثق">
      <path
        d="M12 2l2 2 3-.5 1 3 3 1-.5 3 2 2-2 2 .5 3-3 1-1 3-3-.5-2 2-2-2-3 .5-1-3-3-1 .5-3-2-2 2-2L4 4.5l3-1 1-3 3 .5 1-2z"
        fill="#7c3aed"
      />
      <path d="M8.5 12.2l2.3 2.3 4.7-4.7" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* -------- Styles -------- */
const commentsSheetStyles = `
.ycs-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.72);
  z-index: 9998;
  display: flex; align-items: stretch; justify-content: stretch;
  font-family: 'Tajawal', 'Cairo', system-ui, -apple-system, sans-serif;
  animation: ycsFade 0.18s ease;
}
@keyframes ycsFade { from { opacity: 0 } to { opacity: 1 } }

.ycs-sheet {
  width: 100%;
  max-width: 540px;
  margin: 0 auto;
  background: #0a0a14;
  color: #fff;
  display: flex;
  flex-direction: column;
  height: 100dvh;
  position: relative;
  animation: ycsSlideUp 0.22s ease-out;
}
@keyframes ycsSlideUp {
  from { transform: translateY(40px); opacity: 0.5; }
  to   { transform: translateY(0);     opacity: 1; }
}

/* Header */
.ycs-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 14px 12px;
  border-bottom: 1px solid rgba(255,255,255,0.04);
}
.ycs-back {
  width: 32px; height: 32px;
  background: transparent; border: none; color: #fff;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; border-radius: 999px;
}
.ycs-back:active { background: rgba(255,255,255,0.08); }
.ycs-title { margin: 0; font-size: 17px; font-weight: 700; }
.ycs-header-spacer { width: 32px; }

.ycs-scroll {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 8px;
}

/* Post owner */
.ycs-owner {
  padding: 14px 16px 18px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.ycs-owner-row {
  display: flex;
  flex-direction: row-reverse;
  gap: 12px;
  align-items: flex-start;
}
.ycs-owner-avatar {
  width: 44px; height: 44px;
  position: relative;
  flex-shrink: 0;
}
.ycs-owner-meta { flex: 1; min-width: 0; }
.ycs-owner-name-row {
  display: flex; align-items: center; gap: 6px;
  margin-bottom: 6px;
}
.ycs-owner-name-row strong { font-size: 15px; font-weight: 700; }
.ycs-owner-bio {
  margin: 0;
  font-size: 13.5px;
  color: rgba(255,255,255,0.82);
  line-height: 1.55;
}
.ycs-owner-date {
  display: inline-block;
  margin-top: 8px;
  font-size: 12px;
  color: rgba(255,255,255,0.45);
}

/* Avatar generic */
.ycs-avatar-wrap {
  width: 40px; height: 40px;
  border-radius: 999px;
  overflow: hidden;
  background: linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  position: relative;
}
.ycs-avatar-wrap img { width: 100%; height: 100%; object-fit: cover; display: block; }
.ycs-avatar-fallback { color: #fff; font-weight: 700; font-size: 16px; }

.ycs-avatar-plus {
  position: absolute;
  bottom: -2px;
  inset-inline-end: -2px;
  background: #7c3aed;
  color: #fff;
  width: 16px; height: 16px;
  border-radius: 999px;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; line-height: 1;
  border: 2px solid #0a0a14;
  font-weight: 600;
}

/* Section head */
.ycs-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 16px 8px;
}
.ycs-section-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: rgba(255,255,255,0.86);
}
.ycs-sort {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: rgba(255,255,255,0.65);
  font-size: 13px;
  cursor: pointer;
  position: relative;
  padding: 4px 6px;
  border-radius: 8px;
}
.ycs-sort:active { background: rgba(255,255,255,0.06); }
.ycs-sort-menu {
  position: absolute;
  top: calc(100% + 4px);
  inset-inline-start: 0;
  background: #15152a;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 10px;
  padding: 4px;
  display: flex; flex-direction: column;
  min-width: 110px;
  z-index: 10;
  box-shadow: 0 8px 24px rgba(0,0,0,0.4);
}
.ycs-sort-menu button {
  background: transparent; border: none; color: #fff;
  padding: 8px 12px;
  font-size: 13px;
  text-align: start;
  cursor: pointer;
  border-radius: 6px;
  font-family: inherit;
}
.ycs-sort-menu button:hover, .ycs-sort-menu button.active {
  background: rgba(124,58,237,0.18);
  color: #c4b5fd;
}

/* Comments list */
.ycs-list {
  list-style: none;
  margin: 0;
  padding: 0 0 12px;
}
.ycs-empty {
  padding: 30px 20px;
  text-align: center;
  color: rgba(255,255,255,0.5);
  font-size: 14px;
}
.ycs-item {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  position: relative;
}
.ycs-item-side {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding-top: 4px;
  min-width: 30px;
}
.ycs-icon-btn {
  background: transparent; border: none; color: rgba(255,255,255,0.55);
  cursor: pointer;
  width: 24px; height: 24px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 6px;
  padding: 0;
}
.ycs-icon-btn:active { background: rgba(255,255,255,0.08); }

.ycs-like {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  background: transparent;
  border: none;
  color: #a78bfa;
  cursor: pointer;
  padding: 0;
  font-family: inherit;
}
.ycs-like.liked { color: #ef4444; }
.ycs-like-count {
  font-size: 12px;
  color: #a78bfa;
  font-weight: 600;
}
.ycs-like.liked .ycs-like-count { color: #ef4444; }

.ycs-item-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: row;
  gap: 12px;
  align-items: flex-start;
}
.ycs-item-text {
  flex: 1;
  min-width: 0;
  text-align: end;
}
.ycs-item-name-row {
  display: flex;
  align-items: center;
  gap: 5px;
  justify-content: flex-end;
  margin-bottom: 4px;
}
.ycs-item-name-row strong {
  font-size: 14.5px;
  font-weight: 700;
  color: #fff;
}
.ycs-item-content {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: rgba(255,255,255,0.92);
  word-wrap: break-word;
}
.ycs-item-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  justify-content: flex-end;
  margin-top: 6px;
  font-size: 12px;
  color: rgba(255,255,255,0.5);
}
.ycs-item-dot { opacity: 0.6; }
.ycs-item-reply-link {
  background: transparent; border: none; color: rgba(255,255,255,0.5);
  padding: 0; font-size: 12px;
  cursor: pointer;
  font-family: inherit;
}
.ycs-item-reply-link:active { color: #a78bfa; }

.ycs-show-replies {
  display: flex;
  align-items: center;
  gap: 10px;
  background: transparent;
  border: none;
  color: rgba(255,255,255,0.5);
  font-size: 12.5px;
  padding: 8px 0 0;
  cursor: pointer;
  font-family: inherit;
  margin-inline-start: auto;
  margin-top: 4px;
}
.ycs-show-replies-line {
  display: inline-block;
  width: 22px;
  height: 1px;
  background: rgba(255,255,255,0.25);
}

/* Owner ring on avatar */
.ycs-avatar-wrap.is-owner {
  box-shadow: 0 0 0 2px #7c3aed, 0 0 0 4px #0a0a14;
}

/* Composer */
.ycs-composer {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10px;
  padding: 10px 14px 8px;
  border-top: 1px solid rgba(255,255,255,0.06);
  background: #0a0a14;
}
.ycs-send {
  background: transparent;
  border: none;
  color: #a78bfa;
  width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  border-radius: 999px;
  transform: scaleX(-1); /* paper-plane points correctly in RTL */
}
.ycs-send:disabled { color: rgba(255,255,255,0.25); cursor: not-allowed; }
.ycs-send:active:not(:disabled) { background: rgba(167,139,250,0.12); }

.ycs-input {
  flex: 1;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.06);
  color: #fff;
  font-size: 14px;
  padding: 10px 16px;
  border-radius: 999px;
  outline: none;
  font-family: inherit;
}
.ycs-input::placeholder { color: rgba(255,255,255,0.45); }
.ycs-input:focus { border-color: rgba(167,139,250,0.45); }

.ycs-composer-avatar {
  width: 34px; height: 34px;
  box-shadow: 0 0 0 2px #7c3aed;
}

.ycs-home-indicator {
  height: 5px;
  width: 130px;
  margin: 6px auto 8px;
  border-radius: 999px;
  background: rgba(255,255,255,0.5);
}

/* Scrollbar minimal */
.ycs-scroll::-webkit-scrollbar { width: 4px; }
.ycs-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 999px; }
.ycs-scroll::-webkit-scrollbar-track { background: transparent; }
`;

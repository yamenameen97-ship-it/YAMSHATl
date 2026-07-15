/**
 * مكوّن نافذة الإبلاغ — Report Modal
 *
 * يستخدم في كل مكان (المنشورات، الريلز، الستوري، الشات، المجموعات،
 * التعليقات، الملفات الشخصية) عبر فتحه من قائمة الثلاث نقاط (•••).
 *
 * Usage:
 *   <ReportModal
 *     open={isOpen}
 *     onClose={() => setOpen(false)}
 *     targetType="post" | "reel" | "story" | "comment" | "reel_comment"
 *                | "message" | "group_message" | "user" | "group" | "voice_room"
 *     targetId={123}
 *     targetLabel="منشور فلان"   // اختياري للعرض فقط
 *   />
 */
import React, { useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';
import { API_BASE } from '../../api/config.js';

const REASONS = [
  { value: 'abuse',          label: 'إساءة وتنمر',                icon: '🚫' },
  { value: 'impersonation',  label: 'انتحال شخصية',                icon: '🎭' },
  { value: 'inappropriate',  label: 'محتوى غير لائق',              icon: '⚠️' },
  { value: 'spam',           label: 'محتوى مزعج (سبام)',           icon: '📧' },
  { value: 'unwanted',       label: 'محتوى غير مرغوب فيه',         icon: '🙅' },
  { value: 'hate_speech',    label: 'خطاب كراهية',                 icon: '😡' },
  { value: 'violence',       label: 'عنف',                          icon: '⚔️' },
  { value: 'nudity',         label: 'محتوى إباحي / عُري',          icon: '🔞' },
  { value: 'self_harm',      label: 'إيذاء النفس',                  icon: '🆘' },
  { value: 'misinformation', label: 'معلومات مضللة',                icon: '❗' },
  { value: 'scam',           label: 'احتيال',                       icon: '💰' },
  { value: 'copyright',      label: 'انتهاك حقوق ملكية',           icon: '©️' },
  { value: 'other',          label: 'سبب آخر',                      icon: '✏️' },
];

export default function ReportModal({
  open,
  onClose,
  targetType,
  targetId,
  targetLabel = '',
}) {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  // ✅ v59.13.9 FIX #3: حماية الـ setState بعد unmount + إلغاء طلب axios إذا أغلق المودال أثناء الإرسال
  const isMountedRef = useRef(true);
  const abortRef = useRef(null);
  // ✅ v59.13.14 FIX #1: مراجع لإمكانية الوصول (a11y) — focus trap + auto-focus + إعادة التركيز للمشغّل بعد الإغلاق
  const dialogRef = useRef(null);
  const closeBtnRef = useRef(null);
  const detailsId = React.useId ? React.useId() : 'report-details-field';
  const titleId = React.useId ? React.useId() : 'report-modal-title';
  const previouslyFocusedRef = useRef(null);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      // إلغاء أي طلب بلاغ قيد التنفيذ عند إزالة المكوّن
      try { abortRef.current?.abort?.(); } catch { /* ignore */ }
    };
  }, []);

  useEffect(() => {
    if (open) {
      setReason('');
      setDetails('');
      setDone(false);
      setError('');
      setSubmitting(false);
    } else {
      try { abortRef.current?.abort?.(); } catch { /* ignore */ }
    }
  }, [open]);

  // ✅ v59.13.12 FIX #2 + v59.13.14 FIX #1: ESC + قفل التمرير + focus trap + auto-focus + استعادة التركيز السابق
  useEffect(() => {
    if (!open) return undefined;

    // احفظ العنصر الذي كان مركَّزًا قبل فتح المودال لإعادة التركيز إليه عند الإغلاق
    try {
      previouslyFocusedRef.current = (typeof document !== 'undefined' && document.activeElement) || null;
    } catch { /* ignore */ }

    // ركّز تلقائيًا على زر الإغلاق (نقطة دخول آمنة) بعد paint قصير
    const focusTimer = window.setTimeout(() => {
      try { closeBtnRef.current?.focus?.(); } catch { /* ignore */ }
    }, 30);

    const getFocusables = () => {
      const root = dialogRef.current;
      if (!root) return [];
      const sel = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
      return Array.from(root.querySelectorAll(sel)).filter((el) => !el.hasAttribute('hidden'));
    };

    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose?.();
        return;
      }
      if (e.key === 'Tab') {
        const list = getFocusables();
        if (list.length === 0) return;
        const first = list[0];
        const last = list[list.length - 1];
        const active = document.activeElement;
        if (e.shiftKey && active === first) {
          e.preventDefault();
          try { last.focus(); } catch { /* ignore */ }
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          try { first.focus(); } catch { /* ignore */ }
        }
      }
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      window.clearTimeout(focusTimer);
      // أعِد التركيز إلى العنصر السابق (إن كان لا يزال في الـ DOM)
      try {
        const prev = previouslyFocusedRef.current;
        if (prev && typeof prev.focus === 'function' && document.contains(prev)) {
          prev.focus();
        }
      } catch { /* ignore */ }
      previouslyFocusedRef.current = null;
    };
  }, [open, onClose]);

  const submit = useCallback(async () => {
    if (!reason) {
      setError('يرجى اختيار سبب البلاغ');
      return;
    }
    setSubmitting(true);
    setError('');
    // ✅ v59.13.9 FIX #3: AbortController جديد لكل محاولة إرسال
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      await axios.post(
        `${API_BASE}/reports`,
        {
          target_type: targetType,
          target_id: String(targetId),
          reason,
          details: details.trim() || null,
          context: { source: 'web', target_label: targetLabel },
        },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          signal: controller.signal,
        },
      );
      if (isMountedRef.current) setDone(true);
    } catch (e) {
      // تجاهل أخطاء الإلغاء المقصود
      if (axios.isCancel?.(e) || e?.name === 'CanceledError' || e?.code === 'ERR_CANCELED') {
        return;
      }
      if (!isMountedRef.current) return;
      const msg = e?.response?.data?.detail || 'تعذّر إرسال البلاغ، حاول مرة أخرى';
      setError(typeof msg === 'string' ? msg : 'حدث خطأ');
    } finally {
      if (isMountedRef.current) setSubmitting(false);
      if (abortRef.current === controller) abortRef.current = null;
    }
  }, [reason, details, targetType, targetId, targetLabel]);

  if (!open) return null;

  return (
    <div
      dir="rtl"
      className="report-modal-backdrop"
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        fontFamily: '"Noto Sans Arabic", "Cairo", system-ui, sans-serif',
        backdropFilter: 'blur(6px)',
      }}
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        className="report-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 520,
          background: 'linear-gradient(180deg, #1e1b3a 0%, #14122a 100%)',
          borderTopRightRadius: 24, borderTopLeftRadius: 24,
          padding: '20px 18px 0', color: '#fff',
          maxHeight: 'min(90dvh, calc(100dvh - env(safe-area-inset-top, 0px) - 8px))', overflowY: 'auto',
          boxShadow: '0 -8px 32px rgba(124,58,237,0.35)',
          border: '1px solid rgba(124,58,237,0.3)',
          paddingBottom: 'max(12px, env(safe-area-inset-bottom, 0px))',
        }}
      >
        {/* Handle */}
        <div style={{
          width: 48, height: 4, background: 'rgba(255,255,255,0.25)',
          borderRadius: 4, margin: '0 auto 16px',
        }} />

        {!done ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span style={{ fontSize: 24 }} aria-hidden="true">🚨</span>
              <h3 id={titleId} style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                الإبلاغ عن مخالفة
              </h3>
            </div>
            <p style={{ margin: '0 0 18px', fontSize: 13, opacity: 0.75 }}>
              ساعدنا في الحفاظ على مجتمع آمن. اختر سبب البلاغ وسيتم مراجعته بسرية.
              {targetLabel ? <> — <b>{targetLabel}</b></> : null}
            </p>

            {/* أسباب البلاغ */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {REASONS.map((r) => (
                <label
                  key={r.value}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '12px 14px', borderRadius: 12, cursor: 'pointer',
                    background: reason === r.value
                      ? 'linear-gradient(90deg,#7c3aed,#a855f7)'
                      : 'rgba(255,255,255,0.05)',
                    border: '1px solid ' + (reason === r.value
                      ? 'rgba(168,85,247,0.6)' : 'rgba(255,255,255,0.08)'),
                    transition: 'all .15s',
                  }}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={r.value}
                    checked={reason === r.value}
                    onChange={() => setReason(r.value)}
                    style={{ display: 'none' }}
                  />
                  <span style={{ fontSize: 20 }}>{r.icon}</span>
                  <span style={{ fontSize: 15, fontWeight: 600 }}>{r.label}</span>
                  {reason === r.value && (
                    <span style={{ marginInlineStart: 'auto', fontSize: 18 }}>✓</span>
                  )}
                </label>
              ))}
            </div>

            {/* تفاصيل إضافية */}
            <div style={{ marginTop: 16 }}>
              <label htmlFor={detailsId} style={{ fontSize: 13, opacity: 0.85, marginBottom: 6, display: 'block' }}>
                تفاصيل إضافية (اختياري)
              </label>
              <textarea
                id={detailsId}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                maxLength={2000}
                rows={3}
                placeholder="اكتب أي تفاصيل تساعد فريق الإشراف..."
                style={{
                  width: '100%', padding: 12, borderRadius: 12,
                  background: 'rgba(255,255,255,0.06)',
                  color: '#fff', resize: 'vertical',
                  border: '1px solid rgba(255,255,255,0.1)',
                  fontFamily: 'inherit', fontSize: 14,
                }}
              />
              <div style={{ fontSize: 11, opacity: 0.5, textAlign: 'start', marginTop: 4 }}>
                {details.length}/2000
              </div>
            </div>

            {error && (
              <div style={{
                marginTop: 12, padding: '10px 12px', borderRadius: 10,
                background: 'rgba(239,68,68,0.15)', color: '#fca5a5',
                fontSize: 13, border: '1px solid rgba(239,68,68,0.3)',
              }}>
                ⚠️ {error}
              </div>
            )}

            <div
              style={{
                display: 'flex',
                gap: 10,
                marginTop: 18,
                position: 'sticky',
                bottom: 0,
                padding: '14px 18px calc(14px + env(safe-area-inset-bottom, 0px))',
                marginInline: '-18px',
                marginBottom: '-12px',
                background: 'linear-gradient(180deg, rgba(20,18,42,0.08) 0%, rgba(20,18,42,0.92) 24%, rgba(20,18,42,1) 100%)',
                borderTop: '1px solid rgba(255,255,255,0.08)',
                zIndex: 2,
              }}
            >
              <button
                ref={closeBtnRef}
                onClick={onClose}
                disabled={submitting}
                aria-label="إلغاء وإغلاق نافذة البلاغ"
                style={{
                  flex: 1, padding: '12px 16px', borderRadius: 12,
                  background: 'rgba(255,255,255,0.08)', color: '#fff',
                  border: '1px solid rgba(255,255,255,0.1)',
                  fontSize: 15, fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                إلغاء
              </button>
              <button
                onClick={submit}
                disabled={submitting || !reason}
                aria-label="إرسال البلاغ"
                style={{
                  flex: 1.4, padding: '12px 16px', borderRadius: 12,
                  background: !reason
                    ? 'rgba(124,58,237,0.4)'
                    : 'linear-gradient(90deg,#7c3aed,#a855f7)',
                  color: '#fff', border: 'none',
                  fontSize: 15, fontWeight: 700,
                  cursor: !reason ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  opacity: submitting ? 0.6 : 1,
                  boxShadow: '0 10px 24px rgba(124,58,237,0.28)',
                }}
              >
                {submitting ? 'جارٍ الإرسال...' : 'إرسال البلاغ'}
              </button>
            </div>
          </>
        ) : (
          /* بعد الإرسال */
          <div style={{ textAlign: 'center', padding: '20px 10px' }} role="status" aria-live="polite">
            <div style={{ fontSize: 56, marginBottom: 10 }} aria-hidden="true">✅</div>
            <h3 id={titleId} style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700 }}>
              تم استلام بلاغك
            </h3>
            <p style={{ margin: '0 0 18px', fontSize: 14, opacity: 0.8, lineHeight: 1.7 }}>
              شكراً لمساعدتك في الحفاظ على مجتمع آمن.
              سيقوم فريق الإشراف بمراجعة البلاغ خلال 24 ساعة،
              وستصلك إشعار بنتيجة المراجعة.
            </p>
            <button
              onClick={onClose}
              style={{
                padding: '12px 28px', borderRadius: 12,
                background: 'linear-gradient(90deg,#7c3aed,#a855f7)',
                color: '#fff', border: 'none',
                fontSize: 15, fontWeight: 700, cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              تم
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

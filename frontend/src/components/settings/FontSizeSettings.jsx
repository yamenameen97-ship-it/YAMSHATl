/* ============================================================
   Yamshat — Font Size Settings (v59.13.35)
   إعداد فعّال لحجم الخط — يطبّق فوراً على كامل المنصة
   ============================================================ */
import React, { useEffect, useState, useCallback } from 'react';
import { useLanguage } from '../../i18n/LanguageProvider.jsx';

const STORAGE_KEY = 'yamshat:font-size';

const OPTIONS = [
  { code: 'small',  ar: 'صغير',       en: 'Small',      scale: '0.875×', preview: 13 },
  { code: 'medium', ar: 'متوسط',      en: 'Medium',     scale: '1×',     preview: 15 },
  { code: 'large',  ar: 'كبير',       en: 'Large',      scale: '1.125×', preview: 17 },
  { code: 'xl',     ar: 'كبير جدًا',  en: 'Extra Large', scale: '1.25×',  preview: 19 },
];

/** تطبيق حجم الخط على عنصر <html> فوراً + حفظه */
export function applyFontSize(value) {
  if (typeof document === 'undefined') return;
  const safe = ['small', 'medium', 'large', 'xl'].includes(value) ? value : 'medium';
  document.documentElement.setAttribute('data-font-size', safe);
  try { localStorage.setItem(STORAGE_KEY, safe); } catch { /* ignore */ }
  // إعلام بقية أجزاء التطبيق
  try {
    window.dispatchEvent(new CustomEvent('yamshat:font-size-changed', { detail: { value: safe } }));
  } catch { /* ignore */ }
}

/** قراءة القيمة المحفوظة */
export function getStoredFontSize() {
  try {
    return localStorage.getItem(STORAGE_KEY) || 'medium';
  } catch {
    return 'medium';
  }
}

export default function FontSizeSettings({ value, onChange }) {
  const { lang } = useLanguage();
  const isAr = lang === 'ar' || lang === 'ur';

  const [current, setCurrent] = useState(value || getStoredFontSize());
  const [toast, setToast] = useState('');

  useEffect(() => {
    // تأكيد التطبيق عند تحميل المكون
    applyFontSize(current);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (value && value !== current) setCurrent(value);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelect = useCallback((code) => {
    setCurrent(code);
    applyFontSize(code);
    onChange?.(code);
    setToast(isAr ? '✓ تم تطبيق حجم الخط الجديد على كامل المنصة' : '✓ Font size applied across the platform');
    window.setTimeout(() => setToast(''), 2400);
  }, [onChange, isAr]);

  const styles = {
    card: {
      background: 'var(--panel, #1a1a2e)',
      border: '1px solid var(--line, rgba(255,255,255,0.08))',
      borderRadius: 16,
      padding: 22,
      boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      marginBottom: 18,
      fontSize: 20,
      fontWeight: 700,
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
      gap: 12,
      marginTop: 14,
    },
    btn: (active) => ({
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: 8,
      padding: '14px 16px',
      borderRadius: 12,
      border: `2px solid ${active ? 'var(--primary, #7C3AED)' : 'var(--line, rgba(255,255,255,0.1))'}`,
      background: active ? 'var(--primary-soft, rgba(124,58,237,0.12))' : 'var(--panel-strong, rgba(255,255,255,0.03))',
      color: 'inherit',
      cursor: 'pointer',
      fontFamily: 'inherit',
      textAlign: 'start',
      transition: 'all 180ms cubic-bezier(0.22,1,0.36,1)',
    }),
    preview: (px) => ({
      fontSize: `${px}px`,
      lineHeight: 1.4,
      fontWeight: 600,
    }),
    meta: { fontSize: 12, opacity: 0.7, marginTop: 'auto' },
    previewBox: {
      marginTop: 18,
      padding: 14,
      borderRadius: 12,
      background: 'rgba(124,58,237,0.08)',
      border: '1px solid rgba(124,58,237,0.25)',
      lineHeight: 1.7,
    },
    toast: {
      position: 'fixed',
      top: 24,
      insetInlineEnd: 24,
      padding: '12px 20px',
      borderRadius: 10,
      background: 'var(--success, #10B981)',
      color: '#fff',
      fontWeight: 600,
      zIndex: 9999,
      boxShadow: '0 10px 30px rgba(16,185,129,0.4)',
    },
  };

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <span aria-hidden style={{ fontSize: 24 }}>🔤</span>
        <span>{isAr ? 'حجم خط المنصة' : 'Platform Font Size'}</span>
      </div>

      <div style={{ fontSize: 14, opacity: 0.75, marginBottom: 4 }}>
        {isAr
          ? 'اختر حجم الخط المريح لك. سيتم تطبيقه فوراً على كل صفحات يمشات: المنشورات، المحادثات، التعليقات والإعدادات.'
          : 'Choose your comfortable font size. It applies instantly to posts, chats, comments, and settings.'}
      </div>

      <div style={styles.grid} role="radiogroup" aria-label={isAr ? 'حجم الخط' : 'Font size'}>
        {OPTIONS.map((opt) => {
          const active = opt.code === current;
          return (
            <button
              key={opt.code}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => handleSelect(opt.code)}
              style={styles.btn(active)}
            >
              <span style={styles.preview(opt.preview)}>Aa</span>
              <span style={{ fontSize: 14, fontWeight: 700 }}>{isAr ? opt.ar : opt.en}</span>
              <span style={styles.meta}>{opt.scale}</span>
              {active && <span style={{ position: 'absolute', insetInlineEnd: 10, top: 10, color: 'var(--primary,#7C3AED)' }}>✓</span>}
            </button>
          );
        })}
      </div>

      <div style={styles.previewBox} className="yam-font-preview">
        <strong style={{ display: 'block', marginBottom: 6 }}>
          {isAr ? '🔍 معاينة مباشرة' : '🔍 Live preview'}
        </strong>
        <div>
          {isAr
            ? 'مرحباً بك في يمشات! هذا نص تجريبي يوضح حجم الخط المختار. غيّر الحجم لترى التأثير الفوري على كل عناصر المنصة.'
            : 'Welcome to Yamshat! This is a sample text showing the selected font size. Change it to see the instant effect across the platform.'}
        </div>
      </div>

      {toast && (
        <div style={styles.toast} role="status" aria-live="polite">{toast}</div>
      )}
    </div>
  );
}

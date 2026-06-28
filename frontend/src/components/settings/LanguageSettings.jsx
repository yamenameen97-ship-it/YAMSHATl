/* ============================================================
   Yamshat — مكوّن إعدادات اللغة الوظيفي
   يطبّق اللغة فوراً على كامل المنصة عبر LanguageProvider
   ويحفظ الاختيار في localStorage + يخطر الخادم (اختياري)
   ============================================================ */
import React, { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageProvider.jsx';
import { SUPPORTED_LANGUAGES, getLanguageMeta } from '../../i18n/translations.js';

const styles = {
  card: {
    background: 'var(--panel, #1a1a2e)',
    border: '1px solid var(--line, rgba(255,255,255,0.08))',
    borderRadius: 16,
    padding: 'var(--gap-6, 24px)',
    boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--gap-3, 12px)',
    marginBottom: 'var(--gap-5, 20px)',
    fontSize: 'var(--fs-xl, 20px)',
    fontWeight: 700,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: 'var(--gap-3, 12px)',
    marginTop: 'var(--gap-4, 16px)',
  },
  langBtn: (active) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '14px 16px',
    borderRadius: 12,
    border: `2px solid ${active ? 'var(--primary, #7C3AED)' : 'var(--line, rgba(255,255,255,0.1))'}`,
    background: active
      ? 'var(--primary-soft, rgba(124,58,237,0.12))'
      : 'var(--panel-strong, rgba(255,255,255,0.03))',
    color: 'inherit',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: 'var(--fs-base, 15px)',
    fontWeight: 600,
    textAlign: 'start',
    transition: 'all 180ms cubic-bezier(0.22,1,0.36,1)',
  }),
  flag: { fontSize: 24, lineHeight: 1 },
  meta: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 },
  name: { fontSize: 'var(--fs-base, 15px)', fontWeight: 700 },
  native: { fontSize: 'var(--fs-xs, 12px)', opacity: 0.65 },
  hint: {
    marginTop: 'var(--gap-4, 16px)',
    padding: '12px 14px',
    borderRadius: 10,
    background: 'var(--info-soft, rgba(59,130,246,0.08))',
    border: '1px solid rgba(59,130,246,0.2)',
    fontSize: 'var(--fs-sm, 13px)',
    opacity: 0.9,
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
    animation: 'slideIn 240ms ease-out',
  },
};

export default function LanguageSettings() {
  const { lang, setLang, t } = useLanguage();
  const [toast, setToast] = useState('');
  const [banner, setBanner] = useState(null); // v59.13.35 — بوست التغيير

  const handleSelect = (code) => {
    if (code === lang) return;
    const prevMeta = getLanguageMeta(lang);
    const nextMeta = getLanguageMeta(code);
    setLang(code);
    setToast(true);
    // v59.13.35 — عرض بوست (banner) دائم حتى يغلقه المستخدم يوضح تغيير اللغة
    setBanner({ from: prevMeta, to: nextMeta, at: Date.now() });
    // أيضاً ابلاغ الخادم (إن وُجد) — لا يفشل إن لم يكن متاحاً
    try {
      fetch('/api/users/me/language', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: code }),
        credentials: 'include',
      }).catch(() => {});
    } catch (_) { /* ignore */ }
    setTimeout(() => setToast(''), 2400);
  };

  return (
    <div style={styles.card}>
      {/* v59.13.35 — بوست إعلان تغيير اللغة */}
      {banner && (
        <div
          role="status"
          aria-live="polite"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '14px 16px',
            borderRadius: 14,
            background: 'linear-gradient(135deg, rgba(124,58,237,0.18), rgba(59,130,246,0.18))',
            border: '1px solid rgba(124,58,237,0.35)',
            marginBottom: 18,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <span aria-hidden style={{ fontSize: 32 }}>{banner.to.flag}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>
              ✨ {t('settings.languageSaved')}
            </div>
            <div style={{ fontSize: 13, opacity: 0.8 }}>
              <span aria-hidden>{banner.from.flag}</span> {banner.from.nativeName}
              <span style={{ margin: '0 8px', opacity: 0.6 }}>←</span>
              <strong>{banner.to.nativeName}</strong> <span aria-hidden>{banner.to.flag}</span>
              <span style={{ marginInlineStart: 8, opacity: 0.6 }}>({banner.to.dir.toUpperCase()})</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setBanner(null)}
            aria-label="إغلاق"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'inherit',
              fontSize: 18,
              cursor: 'pointer',
              opacity: 0.6,
              padding: 6,
            }}
          >✕</button>
        </div>
      )}

      <div style={styles.header}>
        <span aria-hidden style={{ fontSize: 24 }}>🌐</span>
        <span>{t('settings.language')}</span>
      </div>

      <div style={{ fontSize: 'var(--fs-base,15px)', fontWeight: 600, marginBottom: 4 }}>
        {t('settings.languageLabel')}
      </div>
      <div style={{ fontSize: 'var(--fs-sm,13px)', opacity: 0.7 }}>
        {t('settings.languageHint')}
      </div>

      <div style={styles.grid} role="radiogroup" aria-label={t('settings.languageLabel')}>
        {SUPPORTED_LANGUAGES.map((l) => {
          const active = l.code === lang;
          return (
            <button
              key={l.code}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => handleSelect(l.code)}
              style={styles.langBtn(active)}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.borderColor = 'var(--primary,#7C3AED)'; }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.borderColor = 'var(--line,rgba(255,255,255,0.1))'; }}
            >
              <span style={styles.flag} aria-hidden>{l.flag}</span>
              <span style={styles.meta}>
                <span style={styles.name}>{l.nativeName}</span>
                <span style={styles.native}>{l.name} · {l.dir.toUpperCase()}</span>
              </span>
              {active && <span style={{ marginInlineStart: 'auto', color: 'var(--primary,#7C3AED)' }}>✓</span>}
            </button>
          );
        })}
      </div>

      <div style={styles.hint}>
        💡 {t('settings.languageHint')} — RTL/LTR يُطبَّق تلقائياً.
      </div>

      {toast && (
        <div style={styles.toast} role="status" aria-live="polite">
          ✓ {t('settings.languageSaved')}
        </div>
      )}
    </div>
  );
}

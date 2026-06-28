/* ============================================================
   Yamshat — Translation Settings (v59.13.35)
   إعدادات الترجمة الفورية للمحادثات
   ============================================================ */
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../i18n/LanguageProvider.jsx';
import {
  getTranslationPrefs,
  saveTranslationPrefs,
  clearTranslationCache,
} from '../../services/translationService.js';
import { SUPPORTED_LANGUAGES } from '../../i18n/translations.js';

export default function TranslationSettings() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar' || lang === 'ur';

  const [prefs, setPrefs] = useState(() => ({
    autoTranslate: true,
    translateOutgoing: false,
    targetLang: lang || 'ar',
    ...getTranslationPrefs(),
  }));
  const [toast, setToast] = useState('');

  useEffect(() => {
    saveTranslationPrefs(prefs);
  }, [prefs]);

  const update = (k, v) => setPrefs((p) => ({ ...p, [k]: v }));

  const showToast = (text) => {
    setToast(text);
    window.setTimeout(() => setToast(''), 2200);
  };

  const handleClearCache = () => {
    clearTranslationCache();
    showToast(isAr ? '✓ تم مسح ذاكرة الترجمة المؤقتة' : '✓ Translation cache cleared');
  };

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
      marginBottom: 14,
      fontSize: 20,
      fontWeight: 700,
    },
    row: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '14px 0',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      gap: 14,
    },
    rowMain: { flex: 1, minWidth: 0 },
    rowTitle: { fontSize: 15, fontWeight: 600 },
    rowDesc: { fontSize: 12, opacity: 0.65, marginTop: 4, lineHeight: 1.5 },
    toggle: (on) => ({
      width: 46,
      height: 26,
      borderRadius: 13,
      background: on ? '#10B981' : 'rgba(148,163,184,0.4)',
      position: 'relative',
      cursor: 'pointer',
      transition: 'background 180ms ease',
      flexShrink: 0,
      border: 'none',
    }),
    toggleKnob: (on) => ({
      position: 'absolute',
      top: 3,
      insetInlineStart: on ? 23 : 3,
      width: 20,
      height: 20,
      borderRadius: 10,
      background: '#fff',
      transition: 'inset-inline-start 180ms ease',
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    }),
    select: {
      padding: '8px 12px',
      borderRadius: 8,
      background: 'rgba(15,23,42,0.6)',
      border: '1px solid rgba(255,255,255,0.1)',
      color: 'inherit',
      fontFamily: 'inherit',
      cursor: 'pointer',
    },
    btn: {
      padding: '10px 18px',
      borderRadius: 10,
      background: 'rgba(239,68,68,0.12)',
      border: '1px solid rgba(239,68,68,0.3)',
      color: '#fca5a5',
      cursor: 'pointer',
      fontFamily: 'inherit',
      fontWeight: 600,
      fontSize: 13,
    },
    info: {
      marginTop: 14,
      padding: '10px 14px',
      borderRadius: 10,
      background: 'rgba(59,130,246,0.08)',
      border: '1px solid rgba(59,130,246,0.2)',
      fontSize: 12,
      lineHeight: 1.6,
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
        <span aria-hidden style={{ fontSize: 24 }}>🌍</span>
        <span>{isAr ? 'الترجمة الفورية للمحادثات' : 'Real-time Chat Translation'}</span>
      </div>

      <div style={{ fontSize: 13, opacity: 0.75, marginBottom: 6, lineHeight: 1.6 }}>
        {isAr
          ? 'تظهر الرسائل القادمة بلغة مختلفة عن لغتك مع ترجمة تلقائية أسفل النص الأصلي. مثال: إن كتب لك شخص بالإنجليزية، تصلك رسالته كما كتبها وأسفلها ترجمتها للعربية.'
          : 'Incoming messages in a different language show the original text plus an automatic translation below.'}
      </div>

      {/* تفعيل الترجمة التلقائية */}
      <div style={styles.row}>
        <div style={styles.rowMain}>
          <div style={styles.rowTitle}>
            {isAr ? '🔄 ترجمة الرسائل الواردة تلقائياً' : '🔄 Auto-translate incoming messages'}
          </div>
          <div style={styles.rowDesc}>
            {isAr
              ? 'تظهر الترجمة أسفل النص الأصلي مباشرة داخل فقاعة الرسالة.'
              : 'Translation appears under the original text inside the message bubble.'}
          </div>
        </div>
        <button
          type="button"
          aria-pressed={prefs.autoTranslate}
          onClick={() => update('autoTranslate', !prefs.autoTranslate)}
          style={styles.toggle(prefs.autoTranslate)}
        >
          <span style={styles.toggleKnob(prefs.autoTranslate)} />
        </button>
      </div>

      {/* ترجمة الرسائل الصادرة */}
      <div style={styles.row}>
        <div style={styles.rowMain}>
          <div style={styles.rowTitle}>
            {isAr ? '✉️ ترجمة رسائلي قبل الإرسال' : '✉️ Translate my messages before sending'}
          </div>
          <div style={styles.rowDesc}>
            {isAr
              ? 'عند إرسال رسالة، يتم اكتشاف لغة الطرف الآخر تلقائياً وترجمة رسالتك إليها قبل الإرسال. ستظهر لك معاينة قبل الإرسال.'
              : 'When you send a message, your text is automatically translated into the recipient\'s language.'}
          </div>
        </div>
        <button
          type="button"
          aria-pressed={prefs.translateOutgoing}
          onClick={() => update('translateOutgoing', !prefs.translateOutgoing)}
          style={styles.toggle(prefs.translateOutgoing)}
        >
          <span style={styles.toggleKnob(prefs.translateOutgoing)} />
        </button>
      </div>

      {/* لغة الترجمة المستهدفة */}
      <div style={styles.row}>
        <div style={styles.rowMain}>
          <div style={styles.rowTitle}>
            {isAr ? '🎯 لغة الترجمة المفضلة' : '🎯 Preferred translation language'}
          </div>
          <div style={styles.rowDesc}>
            {isAr
              ? 'اللغة التي تترجم إليها الرسائل الواردة. الافتراضي = لغة الواجهة الحالية.'
              : 'Language to translate incoming messages into. Default = current UI language.'}
          </div>
        </div>
        <select
          value={prefs.targetLang || lang}
          onChange={(e) => update('targetLang', e.target.value)}
          style={styles.select}
        >
          {SUPPORTED_LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>{l.flag} {l.nativeName}</option>
          ))}
        </select>
      </div>

      <div style={{ ...styles.row, borderBottom: 'none' }}>
        <div style={styles.rowMain}>
          <div style={styles.rowTitle}>
            {isAr ? '🗑️ مسح ذاكرة الترجمة' : '🗑️ Clear translation cache'}
          </div>
          <div style={styles.rowDesc}>
            {isAr
              ? 'يحذف الترجمات المخزنة محلياً لتوفير المساحة وإعادة الترجمة من جديد.'
              : 'Removes stored translations to free space and re-translate fresh.'}
          </div>
        </div>
        <button type="button" onClick={handleClearCache} style={styles.btn}>
          {isAr ? 'مسح' : 'Clear'}
        </button>
      </div>

      <div style={styles.info}>
        💡 {isAr
          ? 'الترجمة تتم محلياً مع كاش ذكي لتوفير الإنترنت. تدعم 8 لغات: العربية، الإنجليزية، الفرنسية، التركية، الإسبانية، الأردية، الإندونيسية، الروسية.'
          : 'Translation is cached locally to save bandwidth. Supports 8 languages.'}
      </div>

      {toast && (
        <div style={styles.toast} role="status" aria-live="polite">{toast}</div>
      )}
    </div>
  );
}

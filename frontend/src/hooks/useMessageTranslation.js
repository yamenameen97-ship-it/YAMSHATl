/* ============================================================
   Yamshat — useMessageTranslation Hook (v59.13.35)
   يقوم بترجمة محتوى الرسائل تلقائياً عند الحاجة
   ============================================================ */
import { useEffect, useState, useRef } from 'react';
import { translateText, quickDetectLang, getTranslationPrefs } from '../services/translationService.js';
import { useLanguage } from '../i18n/LanguageProvider.jsx';

/**
 * @param {string} content نص الرسالة الأصلي
 * @param {object} options { skip?: boolean, isMe?: boolean }
 * @returns {{
 *   enabled: boolean,
 *   loading: boolean,
 *   translated: string,
 *   detected: string,
 *   provider: string,
 *   showTranslation: boolean,
 * }}
 */
export default function useMessageTranslation(content, { skip = false, isMe = false } = {}) {
  const { lang: viewerLang } = useLanguage();
  const [state, setState] = useState({
    loading: false,
    translated: '',
    detected: 'unknown',
    provider: 'idle',
  });
  const lastRequest = useRef({ content: '', viewerLang: '' });

  // قراءة التفضيلات (هل المستخدم فعّل الترجمة التلقائية؟)
  const prefs = getTranslationPrefs();
  const autoTranslate = prefs.autoTranslate !== false; // افتراضي: مفعّل

  useEffect(() => {
    if (skip || !autoTranslate) return undefined;
    const trimmed = String(content || '').trim();
    if (!trimmed) return undefined;

    // لا نترجم رسائلي الصادرة (المستخدم كاتبها بنفسه)
    if (isMe) return undefined;

    const detected = quickDetectLang(trimmed);
    if (detected === 'unknown' || detected === viewerLang) {
      setState({ loading: false, translated: '', detected, provider: 'noop' });
      return undefined;
    }

    // تجنّب الطلبات المكررة
    if (lastRequest.current.content === trimmed && lastRequest.current.viewerLang === viewerLang) {
      return undefined;
    }
    lastRequest.current = { content: trimmed, viewerLang };

    let active = true;
    setState((prev) => ({ ...prev, loading: true, detected }));

    translateText(trimmed, viewerLang, detected)
      .then((result) => {
        if (!active) return;
        if (!result || !result.text || result.text === trimmed) {
          setState({ loading: false, translated: '', detected, provider: result?.provider || 'noop' });
          return;
        }
        setState({
          loading: false,
          translated: result.text,
          detected: result.detected || detected,
          provider: result.provider || 'unknown',
        });
      })
      .catch(() => {
        if (!active) return;
        setState({ loading: false, translated: '', detected, provider: 'error' });
      });

    return () => { active = false; };
  }, [content, viewerLang, skip, autoTranslate, isMe]);

  const showTranslation = autoTranslate && !isMe && Boolean(state.translated) && state.translated !== content;

  return {
    enabled: autoTranslate,
    loading: state.loading,
    translated: state.translated,
    detected: state.detected,
    provider: state.provider,
    showTranslation,
  };
}

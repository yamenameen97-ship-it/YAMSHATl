import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * MessageTranslator - مكون الترجمة الفورية للرسائل
 * يوفر ترجمة فورية من العربية إلى الإنجليزية والعكس
 * مع دعم لغات إضافية
 */
export default function MessageTranslator({
  message,
  onTranslate,
  isOpen = false,
  onClose,
}) {
  const [translatedText, setTranslatedText] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const translatorRef = useRef(null);

  // اللغات المدعومة
  const SUPPORTED_LANGUAGES = [
    { code: 'ar', name: 'العربية', flag: '🇸🇦', direction: 'rtl' },
    { code: 'en', name: 'English', flag: '🇺🇸', direction: 'ltr' },
    { code: 'fr', name: 'Français', flag: '🇫🇷', direction: 'ltr' },
    { code: 'es', name: 'Español', flag: '🇪🇸', direction: 'ltr' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪', direction: 'ltr' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹', direction: 'ltr' },
    { code: 'pt', name: 'Português', flag: '🇵🇹', direction: 'ltr' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺', direction: 'ltr' },
    { code: 'ja', name: '日本語', flag: '🇯🇵', direction: 'ltr' },
    { code: 'zh', name: '中文', flag: '🇨🇳', direction: 'ltr' },
    { code: 'ko', name: '한국어', flag: '🇰🇷', direction: 'ltr' },
    { code: 'tr', name: 'Türkçe', flag: '🇹🇷', direction: 'ltr' },
  ];

  // كشف لغة النص
  const detectLanguage = useCallback((text) => {
    if (!text) return 'auto';
    
    // نمط للكشف عن العربية
    const arabicPattern = /[\u0600-\u06FF]/g;
    // نمط للكشف عن الصينية
    const chinesePattern = /[\u4E00-\u9FFF]/g;
    // نمط للكشف عن اليابانية
    const japanesePattern = /[\u3040-\u309F\u30A0-\u30FF]/g;
    // نمط للكشف عن الكورية
    const koreanPattern = /[\uAC00-\uD7AF]/g;
    // نمط للكشف عن الروسية
    const russianPattern = /[\u0400-\u04FF]/g;

    if (arabicPattern.test(text)) return 'ar';
    if (chinesePattern.test(text)) return 'zh';
    if (japanesePattern.test(text)) return 'ja';
    if (koreanPattern.test(text)) return 'ko';
    if (russianPattern.test(text)) return 'ru';
    
    return 'en';
  }, []);

  // معالج الترجمة
  const handleTranslate = useCallback(async (targetLang) => {
    if (!message || !targetLang) return;

    setLoading(true);
    setError(null);

    try {
      const sourceLanguage = detectLanguage(message.content || message.message || '');
      
      // تجنب ترجمة الرسالة إلى نفس اللغة
      if (sourceLanguage === targetLang) {
        setError('الرسالة مكتوبة بالفعل بهذه اللغة');
        setLoading(false);
        return;
      }

      // استدعاء دالة الترجمة
      const result = await onTranslate?.({
        text: message.content || message.message,
        targetLanguage: targetLang,
        sourceLanguage,
      });

      if (result) {
        setTranslatedText(result);
        setSelectedLanguage(targetLang);
      }
    } catch (err) {
      setError('حدث خطأ في الترجمة. حاول مرة أخرى.');
      console.error('Translation error:', err);
    } finally {
      setLoading(false);
    }
  }, [message, detectLanguage, onTranslate]);

  // معالج النقر خارج المترجم
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (translatorRef.current && !translatorRef.current.contains(event.target)) {
        onClose?.();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  if (!isOpen || !message) return null;

  const sourceLanguage = detectLanguage(message.content || message.message || '');
  const sourceLanguageObj = SUPPORTED_LANGUAGES.find(l => l.code === sourceLanguage) || 
                            SUPPORTED_LANGUAGES.find(l => l.code === 'en');

  return (
    <AnimatePresence>
      <motion.div
        ref={translatorRef}
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        transition={{ duration: 0.2 }}
        className="message-translator"
        dir="rtl"
      >
        <div className="translator-header">
          <strong>🌐 ترجمة الرسالة</strong>
          <button
            type="button"
            className="translator-close"
            onClick={onClose}
            aria-label="إغلاق"
          >
            ✕
          </button>
        </div>

        {/* الرسالة الأصلية */}
        <div className="original-message">
          <div className="message-language">
            <span className="language-flag">{sourceLanguageObj.flag}</span>
            <span className="language-name">{sourceLanguageObj.name}</span>
          </div>
          <div className="message-text" dir={sourceLanguageObj.direction}>
            {message.content || message.message}
          </div>
        </div>

        {/* الرسالة المترجمة */}
        {translatedText && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="translated-message"
          >
            <div className="message-language">
              <span className="language-flag">
                {SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage)?.flag}
              </span>
              <span className="language-name">
                {SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage)?.name}
              </span>
            </div>
            <div
              className="message-text"
              dir={SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage)?.direction}
            >
              {translatedText}
            </div>
          </motion.div>
        )}

        {/* حالة التحميل */}
        {loading && (
          <div className="loading-state">
            <div className="spinner"></div>
            <span>جارٍ الترجمة...</span>
          </div>
        )}

        {/* رسالة الخطأ */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="error-message"
          >
            ⚠️ {error}
          </motion.div>
        )}

        {/* قائمة اللغات */}
        <div className="language-selector">
          <button
            type="button"
            className="language-menu-btn"
            onClick={() => setShowLanguageMenu(!showLanguageMenu)}
          >
            <span className="menu-icon">🌍</span>
            <span>اختر لغة الترجمة</span>
            <span className="dropdown-arrow">▼</span>
          </button>

          <AnimatePresence>
            {showLanguageMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="language-menu"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    className={`language-option ${selectedLanguage === lang.code ? 'selected' : ''} ${sourceLanguage === lang.code ? 'disabled' : ''}`}
                    onClick={() => {
                      if (sourceLanguage !== lang.code) {
                        handleTranslate(lang.code);
                        setShowLanguageMenu(false);
                      }
                    }}
                    disabled={sourceLanguage === lang.code}
                  >
                    <span className="option-flag">{lang.flag}</span>
                    <span className="option-name">{lang.name}</span>
                    {selectedLanguage === lang.code && (
                      <span className="option-check">✓</span>
                    )}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* أزرار الإجراءات */}
        <div className="translator-actions">
          <button
            type="button"
            className="action-btn copy-btn"
            onClick={() => {
              if (translatedText) {
                navigator.clipboard.writeText(translatedText);
              }
            }}
            disabled={!translatedText}
          >
            📋 نسخ الترجمة
          </button>
          <button
            type="button"
            className="action-btn share-btn"
            onClick={() => {
              if (translatedText) {
                // يمكن إضافة وظيفة مشاركة هنا
              }
            }}
            disabled={!translatedText}
          >
            📤 مشاركة
          </button>
        </div>

        <style>{`
          .message-translator {
            position: fixed;
            bottom: 20px;
            left: 20px;
            right: 20px;
            max-width: 400px;
            background: linear-gradient(135deg, rgba(7, 12, 24, 0.98) 0%, rgba(17, 24, 39, 0.98) 100%);
            border: 1px solid rgba(124, 58, 237, 0.3);
            border-radius: 12px;
            padding: 16px;
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
            z-index: 1000;
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .translator-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            color: white;
            font-weight: 600;
            font-size: 14px;
            margin-bottom: 8px;
          }

          .translator-close {
            background: none;
            border: none;
            color: white;
            font-size: 18px;
            cursor: pointer;
            padding: 0;
            transition: all 0.2s ease;
          }

          .translator-close:hover {
            color: rgba(255, 255, 255, 0.7);
          }

          .original-message,
          .translated-message {
            display: flex;
            flex-direction: column;
            gap: 8px;
            padding: 12px;
            background: rgba(124, 58, 237, 0.1);
            border: 1px solid rgba(124, 58, 237, 0.2);
            border-radius: 8px;
          }

          .translated-message {
            background: rgba(16, 185, 129, 0.1);
            border-color: rgba(16, 185, 129, 0.2);
          }

          .message-language {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 11px;
            font-weight: 600;
            color: rgba(255, 255, 255, 0.7);
          }

          .language-flag {
            font-size: 14px;
          }

          .message-text {
            color: white;
            font-size: 13px;
            line-height: 1.4;
            word-break: break-word;
          }

          .loading-state {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 12px;
            color: rgba(255, 255, 255, 0.7);
            font-size: 12px;
          }

          .spinner {
            width: 16px;
            height: 16px;
            border: 2px solid rgba(124, 58, 237, 0.2);
            border-top-color: rgba(124, 58, 237, 0.8);
            border-radius: 50%;
            animation: spin 0.6s linear infinite;
          }

          @keyframes spin {
            to { transform: rotate(360deg); }
          }

          .error-message {
            padding: 10px 12px;
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.3);
            border-radius: 6px;
            color: rgba(239, 68, 68, 0.9);
            font-size: 12px;
            text-align: center;
          }

          .language-selector {
            position: relative;
          }

          .language-menu-btn {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            padding: 10px 12px;
            background: rgba(124, 58, 237, 0.15);
            border: 1px solid rgba(124, 58, 237, 0.3);
            border-radius: 6px;
            color: white;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
          }

          .language-menu-btn:hover {
            background: rgba(124, 58, 237, 0.25);
            border-color: rgba(124, 58, 237, 0.5);
          }

          .menu-icon {
            font-size: 14px;
          }

          .dropdown-arrow {
            font-size: 10px;
            transition: transform 0.3s ease;
          }

          .language-menu {
            position: absolute;
            top: 100%;
            right: 0;
            left: 0;
            margin-top: 6px;
            background: rgba(7, 12, 24, 0.95);
            border: 1px solid rgba(124, 58, 237, 0.3);
            border-radius: 8px;
            backdrop-filter: blur(10px);
            max-height: 300px;
            overflow-y: auto;
            z-index: 1001;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
          }

          .language-option {
            width: 100%;
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 10px 12px;
            background: none;
            border: none;
            border-bottom: 1px solid rgba(124, 58, 237, 0.1);
            color: white;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.2s ease;
            text-align: right;
          }

          .language-option:last-child {
            border-bottom: none;
          }

          .language-option:hover:not(.disabled) {
            background: rgba(124, 58, 237, 0.15);
          }

          .language-option.selected {
            background: rgba(16, 185, 129, 0.15);
            color: rgba(16, 185, 129, 0.9);
          }

          .language-option.disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          .option-flag {
            font-size: 14px;
            flex-shrink: 0;
          }

          .option-name {
            flex: 1;
          }

          .option-check {
            font-size: 12px;
            color: rgba(16, 185, 129, 0.9);
            font-weight: bold;
          }

          .translator-actions {
            display: flex;
            gap: 8px;
          }

          .action-btn {
            flex: 1;
            padding: 8px 10px;
            background: rgba(124, 58, 237, 0.15);
            border: 1px solid rgba(124, 58, 237, 0.3);
            border-radius: 6px;
            color: white;
            font-size: 11px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
          }

          .action-btn:hover:not(:disabled) {
            background: rgba(124, 58, 237, 0.25);
            border-color: rgba(124, 58, 237, 0.5);
          }

          .action-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          .copy-btn:hover:not(:disabled) {
            background: rgba(16, 185, 129, 0.15);
            border-color: rgba(16, 185, 129, 0.3);
          }

          .share-btn:hover:not(:disabled) {
            background: rgba(59, 130, 246, 0.15);
            border-color: rgba(59, 130, 246, 0.3);
          }

          @media (max-width: 480px) {
            .message-translator {
              left: 10px;
              right: 10px;
              bottom: 10px;
              max-width: none;
            }

            .message-text {
              font-size: 12px;
            }

            .translator-header {
              font-size: 13px;
            }
          }
        `}</style>
      </motion.div>
    </AnimatePresence>
  );
}

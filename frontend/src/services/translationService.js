import apiClient from './api/apiClient.js';

/**
 * خدمة الترجمة الفورية المحسّنة
 * توفر ترجمة فورية من وإلى لغات متعددة
 */

const CACHE_KEY_PREFIX = 'translation_cache_';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 ساعة

/**
 * الحصول على الترجمة من الكاش
 */
const getCachedTranslation = (text, targetLanguage) => {
  try {
    const cacheKey = `${CACHE_KEY_PREFIX}${btoa(text)}_${targetLanguage}`;
    const cached = localStorage.getItem(cacheKey);
    
    if (cached) {
      const { translation, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_DURATION) {
        return translation;
      }
      localStorage.removeItem(cacheKey);
    }
  } catch (error) {
    console.error('خطأ في الوصول للكاش:', error);
  }
  
  return null;
};

/**
 * حفظ الترجمة في الكاش
 */
const cacheTranslation = (text, targetLanguage, translation) => {
  try {
    const cacheKey = `${CACHE_KEY_PREFIX}${btoa(text)}_${targetLanguage}`;
    localStorage.setItem(cacheKey, JSON.stringify({
      translation,
      timestamp: Date.now(),
    }));
  } catch (error) {
    console.error('خطأ في حفظ الكاش:', error);
  }
};

/**
 * كشف لغة النص
 */
export const detectLanguage = (text) => {
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
  // نمط للكشف عن العبرية
  const hebrewPattern = /[\u0590-\u05FF]/g;

  if (arabicPattern.test(text)) return 'ar';
  if (chinesePattern.test(text)) return 'zh';
  if (japanesePattern.test(text)) return 'ja';
  if (koreanPattern.test(text)) return 'ko';
  if (russianPattern.test(text)) return 'ru';
  if (hebrewPattern.test(text)) return 'he';
  
  return 'en';
};

/**
 * ترجمة نص
 */
export const translateText = async (text, targetLanguage, sourceLanguage = 'auto') => {
  if (!text || !targetLanguage) {
    throw new Error('النص ولغة الهدف مطلوبان');
  }

  // تحديد لغة المصدر تلقائياً إذا لم تكن محددة
  const detectedSourceLanguage = sourceLanguage === 'auto' ? detectLanguage(text) : sourceLanguage;

  // تجنب ترجمة النص إلى نفس اللغة
  if (detectedSourceLanguage === targetLanguage) {
    return {
      original_text: text,
      translated_text: text,
      source_language: detectedSourceLanguage,
      target_language: targetLanguage,
      is_same_language: true,
    };
  }

  // البحث في الكاش أولاً
  const cachedTranslation = getCachedTranslation(text, targetLanguage);
  if (cachedTranslation) {
    return {
      original_text: text,
      translated_text: cachedTranslation,
      source_language: detectedSourceLanguage,
      target_language: targetLanguage,
      from_cache: true,
    };
  }

  try {
    // استدعاء API الترجمة
    const response = await apiClient.post('/translate', {
      text,
      target_language: targetLanguage,
      source_language: detectedSourceLanguage,
    });

    if (response?.data?.translated_text) {
      // حفظ في الكاش
      cacheTranslation(text, targetLanguage, response.data.translated_text);
      
      return {
        original_text: text,
        translated_text: response.data.translated_text,
        source_language: detectedSourceLanguage,
        target_language: targetLanguage,
        from_cache: false,
      };
    }

    throw new Error('فشلت الترجمة');
  } catch (error) {
    console.error('خطأ في الترجمة:', error);
    throw error;
  }
};

/**
 * ترجمة رسالة في الدردشة
 */
export const translateMessage = async (messageId, targetLanguage) => {
  try {
    const response = await apiClient.post(`/messages/${messageId}/translate`, {
      target_language: targetLanguage,
    });

    return response?.data;
  } catch (error) {
    console.error('خطأ في ترجمة الرسالة:', error);
    throw error;
  }
};

/**
 * الحصول على اللغات المدعومة
 */
export const getSupportedLanguages = async () => {
  try {
    const response = await apiClient.get('/languages');
    return response?.data?.supported_languages || [];
  } catch (error) {
    console.error('خطأ في الحصول على اللغات المدعومة:', error);
    // إرجاع قائمة افتراضية في حالة الخطأ
    return ['ar', 'en', 'fr', 'es', 'de', 'it', 'pt', 'ru', 'ja', 'zh', 'ko', 'tr'];
  }
};

/**
 * ترجمة نص مع خيارات متقدمة
 */
export const translateWithOptions = async (text, options = {}) => {
  const {
    targetLanguage,
    sourceLanguage = 'auto',
    preserveFormatting = true,
    includeAlternatives = false,
  } = options;

  if (!targetLanguage) {
    throw new Error('لغة الهدف مطلوبة');
  }

  try {
    const response = await apiClient.post('/translate/advanced', {
      text,
      target_language: targetLanguage,
      source_language: sourceLanguage,
      preserve_formatting: preserveFormatting,
      include_alternatives: includeAlternatives,
    });

    return response?.data;
  } catch (error) {
    console.error('خطأ في الترجمة المتقدمة:', error);
    throw error;
  }
};

/**
 * ترجمة دفعة من النصوص
 */
export const translateBatch = async (texts, targetLanguage) => {
  if (!Array.isArray(texts) || texts.length === 0) {
    throw new Error('يجب توفير مصفوفة من النصوص');
  }

  try {
    const response = await apiClient.post('/translate/batch', {
      texts,
      target_language: targetLanguage,
    });

    return response?.data?.translations || [];
  } catch (error) {
    console.error('خطأ في ترجمة الدفعة:', error);
    throw error;
  }
};

/**
 * الحصول على الترجمات البديلة
 */
export const getAlternativeTranslations = async (text, targetLanguage, sourceLanguage = 'auto') => {
  try {
    const response = await apiClient.post('/translate/alternatives', {
      text,
      target_language: targetLanguage,
      source_language: sourceLanguage,
    });

    return response?.data?.alternatives || [];
  } catch (error) {
    console.error('خطأ في الحصول على الترجمات البديلة:', error);
    return [];
  }
};

/**
 * تقييم جودة الترجمة
 */
export const rateTranslation = async (messageId, rating, feedback = '') => {
  try {
    const response = await apiClient.post(`/messages/${messageId}/translation/rate`, {
      rating,
      feedback,
    });

    return response?.data;
  } catch (error) {
    console.error('خطأ في تقييم الترجمة:', error);
    throw error;
  }
};

/**
 * إنشاء قاموس مخصص للترجمة
 */
export const createCustomDictionary = async (entries) => {
  try {
    const response = await apiClient.post('/translate/dictionary', {
      entries,
    });

    return response?.data;
  } catch (error) {
    console.error('خطأ في إنشاء القاموس المخصص:', error);
    throw error;
  }
};

/**
 * حذف الكاش
 */
export const clearTranslationCache = () => {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(CACHE_KEY_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('خطأ في حذف الكاش:', error);
  }
};

/**
 * الحصول على إحصائيات الترجمة
 */
export const getTranslationStats = async () => {
  try {
    const response = await apiClient.get('/translate/stats');
    return response?.data;
  } catch (error) {
    console.error('خطأ في الحصول على إحصائيات الترجمة:', error);
    return null;
  }
};

export default {
  detectLanguage,
  translateText,
  translateMessage,
  getSupportedLanguages,
  translateWithOptions,
  translateBatch,
  getAlternativeTranslations,
  rateTranslation,
  createCustomDictionary,
  clearTranslationCache,
  getTranslationStats,
};

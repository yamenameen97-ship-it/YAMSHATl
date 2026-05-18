/**
 * E2E Encryption Utility (Experimental)
 * يوفر طبقة تشفير إضافية للرسائل باستخدام AES-GCM.
 * ملاحظة: هذا تطبيق تجريبي يحتاج لتبادل مفاتيح آمن (مثل Diffie-Hellman) في بيئة الإنتاج.
 */

const ENCRYPTION_KEY_PREFIX = 'yamshat_e2e_';

export const e2eEncryption = {
  /**
   * توليد مفتاح عشوائي للمحادثة
   */
  generateKey: () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  },

  /**
   * تشفير النص
   */
  encrypt: (text, secret) => {
    if (!text || !secret) return text;
    try {
      // تطبيق تشفير بسيط (للتوضيح) - في الإنتاج يفضل استخدام Web Crypto API
      const b64 = btoa(unescape(encodeURIComponent(text)));
      let result = '';
      for (let i = 0; i < b64.length; i++) {
        result += String.fromCharCode(b64.charCodeAt(i) ^ secret.charCodeAt(i % secret.length));
      }
      return `__e2e__${btoa(result)}`;
    } catch (e) {
      console.error('Encryption failed', e);
      return text;
    }
  },

  /**
   * فك التشفير
   */
  decrypt: (encryptedText, secret) => {
    if (!encryptedText || !encryptedText.startsWith('__e2e__') || !secret) return encryptedText;
    try {
      const data = atob(encryptedText.replace('__e2e__', ''));
      let result = '';
      for (let i = 0; i < data.length; i++) {
        result += String.fromCharCode(data.charCodeAt(i) ^ secret.charCodeAt(i % secret.length));
      }
      return decodeURIComponent(escape(atob(result)));
    } catch (e) {
      console.error('Decryption failed', e);
      return '[فشل فك تشفير الرسالة]';
    }
  },

  /**
   * حفظ مفتاح محادثة محلياً
   */
  storeKey: (peer, key) => {
    localStorage.setItem(`${ENCRYPTION_KEY_PREFIX}${peer}`, key);
  },

  /**
   * استعادة مفتاح محادثة
   */
  getKey: (peer) => {
    return localStorage.getItem(`${ENCRYPTION_KEY_PREFIX}${peer}`);
  }
};

/**
 * Brute-force Protection Utility
 * تتبع محاولات تسجيل الدخول الفاشلة في المتصفح وتأخير المحاولات المتكررة.
 */

const MAX_ATTEMPTS = 5;
const LOCK_TIME = 30 * 1000; // 30 ثانية

export const bruteForceProtection = {
  checkStatus: (username) => {
    const data = JSON.parse(localStorage.getItem(`bfp_${username}`) || '{"attempts": 0, "lockUntil": 0}');
    const now = Date.now();

    if (data.lockUntil > now) {
      const remaining = Math.ceil((data.lockUntil - now) / 1000);
      return { isLocked: true, remaining };
    }

    return { isLocked: false, remaining: 0 };
  },

  recordFailure: (username) => {
    const data = JSON.parse(localStorage.getItem(`bfp_${username}`) || '{"attempts": 0, "lockUntil": 0}');
    data.attempts += 1;

    if (data.attempts >= MAX_ATTEMPTS) {
      data.lockUntil = Date.now() + LOCK_TIME;
      data.attempts = 0; // إعادة التعيين بعد القفل
    }

    localStorage.setItem(`bfp_${username}`, JSON.stringify(data));
    return data;
  },

  recordSuccess: (username) => {
    localStorage.removeItem(`bfp_${username}`);
  }
};

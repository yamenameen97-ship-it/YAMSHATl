import logger from '../utils/logger.js';

/**
 * Retry Manager
 * 
 * نظام متقدم لإعادة المحاولة مع:
 * - Exponential Backoff
 * - Jitter لتجنب Thundering Herd
 * - معالجة أنواع الأخطاء المختلفة
 * - تتبع محاولات الإعادة
 * - معالجة الحالات الخاصة (429, 503, etc)
 */
export class RetryManager {
  constructor(options = {}) {
    this.baseDelayMs = options.baseDelayMs || 1000;
    this.maxDelayMs = options.maxDelayMs || 60000;
    this.maxAttempts = options.maxAttempts || 5;
    this.jitterRatio = options.jitterRatio || 0.1;
    this.backoffMultiplier = options.backoffMultiplier || 2;
    this.retryableStatusCodes = options.retryableStatusCodes || [408, 429, 500, 502, 503, 504];
    this.retryableErrors = options.retryableErrors || [
      'ECONNABORTED',
      'ECONNREFUSED',
      'ENOTFOUND',
      'ENETUNREACH',
      'ETIMEDOUT',
      'ERR_NETWORK',
    ];
  }

  /**
   * حساب التأخير مع Exponential Backoff و Jitter
   */
  calculateDelay(attempt) {
    const exponentialDelay = this.baseDelayMs * Math.pow(this.backoffMultiplier, attempt);
    const cappedDelay = Math.min(exponentialDelay, this.maxDelayMs);
    const jitter = cappedDelay * this.jitterRatio * Math.random();
    return Math.floor(cappedDelay + jitter);
  }

  /**
   * التحقق من إمكانية إعادة المحاولة
   */
  isRetryable(error, attempt) {
    if (attempt >= this.maxAttempts) {
      return false;
    }

    // التحقق من رموز الحالة HTTP
    if (error?.response?.status) {
      return this.retryableStatusCodes.includes(error.response.status);
    }

    // التحقق من أنواع الأخطاء
    if (error?.code) {
      return this.retryableErrors.includes(error.code);
    }

    // التحقق من رسالة الخطأ
    if (error?.message) {
      return this.retryableErrors.some(code => error.message.includes(code));
    }

    return false;
  }

  /**
   * تنفيذ دالة مع إعادة المحاولة
   */
  async execute(fn, context = {}) {
    let lastError;
    let attempt = 0;

    while (attempt < this.maxAttempts) {
      try {
        logger.debug('Executing with retry', {
          attempt: attempt + 1,
          maxAttempts: this.maxAttempts,
          ...context,
        });

        const result = await fn();
        
        if (attempt > 0) {
          logger.info('Retry succeeded', {
            attempt,
            context,
          });
        }

        return result;
      } catch (error) {
        lastError = error;

        if (!this.isRetryable(error, attempt)) {
          logger.warn('Error is not retryable', {
            attempt,
            status: error?.response?.status,
            code: error?.code,
            message: error?.message,
            context,
          });
          throw error;
        }

        attempt++;

        if (attempt < this.maxAttempts) {
          const delayMs = this.calculateDelay(attempt - 1);
          logger.info('Retrying after delay', {
            attempt,
            delayMs,
            status: error?.response?.status,
            context,
          });

          await this.sleep(delayMs);
        }
      }
    }

    logger.error('Max retry attempts exceeded', {
      maxAttempts: this.maxAttempts,
      lastError: lastError?.message,
      context,
    });

    throw lastError;
  }

  /**
   * تنفيذ دالة مع معالج مخصص للأخطاء
   */
  async executeWithHandler(fn, errorHandler, context = {}) {
    let lastError;
    let attempt = 0;

    while (attempt < this.maxAttempts) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        if (!this.isRetryable(error, attempt)) {
          throw error;
        }

        attempt++;

        if (attempt < this.maxAttempts) {
          const delayMs = this.calculateDelay(attempt - 1);
          
          // استدعاء معالج الخطأ
          const shouldContinue = await errorHandler({
            error,
            attempt,
            maxAttempts: this.maxAttempts,
            delayMs,
            context,
          });

          if (!shouldContinue) {
            throw error;
          }

          await this.sleep(delayMs);
        }
      }
    }

    throw lastError;
  }

  /**
   * تنفيذ دالة مع Timeout
   */
  async executeWithTimeout(fn, timeoutMs, context = {}) {
    return Promise.race([
      this.execute(fn, context),
      new Promise((_, reject) =>
        setTimeout(() => {
          const error = new Error('Operation timeout');
          error.code = 'ETIMEDOUT';
          reject(error);
        }, timeoutMs)
      ),
    ]);
  }

  /**
   * دالة مساعدة للانتظار
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * إنشاء معالج للعمليات المتكررة
   */
  createRetryableFunction(fn, options = {}) {
    const mergedOptions = { ...this, ...options };
    const manager = new RetryManager(mergedOptions);

    return async (...args) => {
      return manager.execute(() => fn(...args));
    };
  }
}

/**
 * مثيل عام من Retry Manager
 */
export const defaultRetryManager = new RetryManager({
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  maxAttempts: 5,
  jitterRatio: 0.1,
});

/**
 * مثيل متحفظ للعمليات الحساسة
 */
export const conservativeRetryManager = new RetryManager({
  baseDelayMs: 500,
  maxDelayMs: 15000,
  maxAttempts: 3,
  jitterRatio: 0.05,
});

/**
 * مثيل عدواني للعمليات غير الحساسة
 */
export const aggressiveRetryManager = new RetryManager({
  baseDelayMs: 2000,
  maxDelayMs: 60000,
  maxAttempts: 10,
  jitterRatio: 0.2,
});

/**
 * Decorator لإضافة إعادة محاولة تلقائية
 */
export function withRetry(options = {}) {
  const manager = new RetryManager(options);

  return function (target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args) {
      return manager.execute(() => originalMethod.apply(this, args));
    };

    return descriptor;
  };
}

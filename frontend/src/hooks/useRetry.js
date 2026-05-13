import { useState, useCallback, useRef } from 'react';
import { useMemoryCleanup } from './useMemoryCleanup.js';

/**
 * useRetry Hook
 * 
 * إدارة إعادة المحاولة مع:
 * - Exponential backoff
 * - Max retries limit
 * - Retry callbacks
 * - Error tracking
 */
export function useRetry({
  maxRetries = 3,
  initialDelay = 1000,
  backoffMultiplier = 2,
  maxDelay = 30000,
  onRetry,
  onMaxRetriesExceeded,
} = {}) {
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [lastError, setLastError] = useState(null);
  const timeoutRef = useRef(null);
  const { registerTimeout, registerCleanup } = useMemoryCleanup();

  // Calculate delay with exponential backoff
  const calculateDelay = useCallback((attempt) => {
    const delay = Math.min(
      initialDelay * Math.pow(backoffMultiplier, attempt),
      maxDelay
    );
    // Add jitter to prevent thundering herd
    return delay + Math.random() * delay * 0.1;
  }, [initialDelay, backoffMultiplier, maxDelay]);

  // Attempt retry
  const retry = useCallback(async (error) => {
    setLastError(error);

    if (retryCount >= maxRetries) {
      setIsRetrying(false);
      onMaxRetriesExceeded?.(error);
      return false;
    }

    setIsRetrying(true);
    const delay = calculateDelay(retryCount);

    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        setRetryCount(prev => prev + 1);
        setIsRetrying(false);
        onRetry?.(retryCount + 1);
        resolve(true);
      }, delay);

      timeoutRef.current = timeoutId;
      registerTimeout(() => clearTimeout(timeoutId), delay);
    });
  }, [retryCount, maxRetries, calculateDelay, onRetry, onMaxRetriesExceeded, registerTimeout]);

  // Reset retry state
  const reset = useCallback(() => {
    setRetryCount(0);
    setIsRetrying(false);
    setLastError(null);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  // Cleanup on unmount
  registerCleanup(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  });

  return {
    retryCount,
    isRetrying,
    lastError,
    canRetry: retryCount < maxRetries,
    retry,
    reset,
  };
}

/**
 * useAsyncRetry Hook
 * 
 * تنفيذ دالة غير متزامنة مع إعادة محاولة تلقائية
 */
export function useAsyncRetry({
  asyncFn,
  maxRetries = 3,
  initialDelay = 1000,
  onSuccess,
  onError,
  onRetry,
} = {}) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { retry, retryCount, reset } = useRetry({
    maxRetries,
    initialDelay,
    onRetry,
    onMaxRetriesExceeded: (err) => {
      onError?.(err);
    },
  });

  const execute = useCallback(async (...args) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await asyncFn(...args);
      setData(result);
      onSuccess?.(result);
      reset();
      return result;
    } catch (err) {
      setError(err);
      const shouldRetry = await retry(err);
      if (!shouldRetry) {
        setIsLoading(false);
      }
    }
  }, [asyncFn, retry, reset, onSuccess, onError]);

  return {
    data,
    error,
    isLoading,
    retryCount,
    execute,
    reset,
  };
}

/**
 * RetryableRequest Component
 * 
 * مكون لعرض حالة إعادة المحاولة
 */
export function RetryableRequest({
  isRetrying,
  retryCount,
  maxRetries,
  error,
  onRetry,
}) {
  if (!isRetrying && !error) return null;

  return (
    <div style={{
      padding: '12px 16px',
      background: '#fef3c7',
      border: '1px solid #fcd34d',
      borderRadius: '6px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
      fontSize: '14px',
      color: '#92400e',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {isRetrying && (
          <div style={{
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            border: '2px solid #fcd34d',
            borderTopColor: '#92400e',
            animation: 'spin 1s linear infinite',
          }} />
        )}
        {error && !isRetrying && <span>⚠️</span>}
        <span>
          {isRetrying
            ? `جاري إعادة المحاولة (${retryCount}/${maxRetries})...`
            : `فشل الطلب. ${retryCount < maxRetries ? 'سيتم إعادة المحاولة...' : 'تم تجاوز عدد المحاولات.'}`}
        </span>
      </div>

      {error && retryCount < maxRetries && (
        <button
          onClick={onRetry}
          style={{
            background: 'none',
            border: 'none',
            color: '#92400e',
            cursor: 'pointer',
            fontWeight: '600',
            textDecoration: 'underline',
          }}
        >
          إعادة الآن
        </button>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

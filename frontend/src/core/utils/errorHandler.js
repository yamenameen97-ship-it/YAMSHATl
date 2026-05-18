/**
 * Unified Error Handler
 * 
 * Provides:
 * - Centralized error handling
 * - Error logging and reporting
 * - User-friendly error messages
 * - Error recovery strategies
 */

import logger from './logger.js';

// ============================================
// Error Types
// ============================================

export class AppError extends Error {
  constructor(message, code, statusCode, details = {}) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = Date.now();
  }
}

export class NetworkError extends AppError {
  constructor(message, details = {}) {
    super(message, 'NETWORK_ERROR', 0, details);
    this.name = 'NetworkError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message, details = {}) {
    super(message, 'AUTH_ERROR', 401, details);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message, details = {}) {
    super(message, 'AUTHZ_ERROR', 403, details);
    this.name = 'AuthorizationError';
  }
}

export class ValidationError extends AppError {
  constructor(message, details = {}) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message, details = {}) {
    super(message, 'NOT_FOUND', 404, details);
    this.name = 'NotFoundError';
  }
}

export class ServerError extends AppError {
  constructor(message, details = {}) {
    super(message, 'SERVER_ERROR', 500, details);
    this.name = 'ServerError';
  }
}

// ============================================
// Error Handler
// ============================================

class ErrorHandler {
  constructor() {
    this.errorListeners = [];
    this.setupGlobalErrorHandlers();
  }

  // ============================================
  // Global Error Handlers
  // ============================================

  setupGlobalErrorHandlers() {
    if (typeof window === 'undefined') return;

    // Handle uncaught errors
    window.addEventListener('error', (event) => {
      this.handleError(event.error || new Error(event.message));
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(event.reason);
    });
  }

  // ============================================
  // Error Handling
  // ============================================

  handleError(error, context = {}) {
    const appError = this.normalizeError(error);

    logger.error('[Error Handler]', {
      error: appError,
      context,
    });

    // Notify listeners
    this.notifyListeners(appError, context);

    return appError;
  }

  normalizeError(error) {
    // Already an AppError
    if (error instanceof AppError) {
      return error;
    }

    // Axios error
    if (error.response) {
      return this.handleAxiosError(error);
    }

    // Network error
    if (error.message === 'Network Error' || error instanceof TypeError) {
      return new NetworkError(error.message);
    }

    // Generic error
    return new AppError(
      error.message || 'An unknown error occurred',
      'UNKNOWN_ERROR',
      500,
      { originalError: error }
    );
  }

  handleAxiosError(error) {
    const { response, request, message } = error;

    if (response) {
      const { status, data } = response;

      switch (status) {
        case 400:
          return new ValidationError(data.message || 'Invalid request', { data });
        case 401:
          return new AuthenticationError(data.message || 'Authentication required', { data });
        case 403:
          return new AuthorizationError(data.message || 'Access denied', { data });
        case 404:
          return new NotFoundError(data.message || 'Resource not found', { data });
        case 500:
        case 502:
        case 503:
        case 504:
          return new ServerError(data.message || 'Server error', { data });
        default:
          return new AppError(data.message || message, 'HTTP_ERROR', status, { data });
      }
    }

    if (request && !response) {
      return new NetworkError('No response from server');
    }

    return new NetworkError(message || 'Network error');
  }

  // ============================================
  // Error Messages
  // ============================================

  getUserMessage(error) {
    const appError = error instanceof AppError ? error : this.normalizeError(error);

    const messages = {
      NETWORK_ERROR: 'Connection error. Please check your internet connection.',
      AUTH_ERROR: 'Your session has expired. Please log in again.',
      AUTHZ_ERROR: 'You do not have permission to perform this action.',
      VALIDATION_ERROR: 'Please check your input and try again.',
      NOT_FOUND: 'The requested resource was not found.',
      SERVER_ERROR: 'Server error. Please try again later.',
      UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
    };

    return messages[appError.code] || appError.message;
  }

  getErrorDetails(error) {
    const appError = error instanceof AppError ? error : this.normalizeError(error);

    return {
      code: appError.code,
      message: appError.message,
      statusCode: appError.statusCode,
      userMessage: this.getUserMessage(appError),
      details: appError.details,
      timestamp: appError.timestamp,
    };
  }

  // ============================================
  // Error Recovery
  // ============================================

  async retry(fn, options = {}) {
    const {
      maxAttempts = 3,
      delay = 1000,
      backoff = 2,
      onRetry = null,
    } = options;

    let lastError;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        if (attempt < maxAttempts) {
          const waitTime = delay * Math.pow(backoff, attempt - 1);

          if (onRetry) {
            onRetry(attempt, waitTime, error);
          }

          logger.warn(`[Retry] Attempt ${attempt}/${maxAttempts} failed, retrying in ${waitTime}ms`);

          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }

    throw lastError;
  }

  // ============================================
  // Error Listeners
  // ============================================

  subscribe(listener) {
    this.errorListeners.push(listener);

    // Return unsubscribe function
    return () => {
      const index = this.errorListeners.indexOf(listener);
      if (index > -1) {
        this.errorListeners.splice(index, 1);
      }
    };
  }

  notifyListeners(error, context) {
    this.errorListeners.forEach(listener => {
      try {
        listener(error, context);
      } catch (err) {
        logger.error('[Error Handler] Listener error', err);
      }
    });
  }

  // ============================================
  // Error Reporting
  // ============================================

  async reportError(error, context = {}) {
    const appError = this.normalizeError(error);

    try {
      // TODO: Send to error tracking service (Sentry, etc.)
      logger.error('[Error Report]', {
        error: appError,
        context,
        userAgent: navigator.userAgent,
        url: window.location.href,
      });
    } catch (err) {
      logger.error('[Error Reporting] Failed', err);
    }
  }

  // ============================================
  // Utility Methods
  // ============================================

  isNetworkError(error) {
    return error instanceof NetworkError;
  }

  isAuthError(error) {
    return error instanceof AuthenticationError;
  }

  isValidationError(error) {
    return error instanceof ValidationError;
  }

  isServerError(error) {
    return error instanceof ServerError;
  }

  isRecoverable(error) {
    const appError = error instanceof AppError ? error : this.normalizeError(error);
    return [
      'NETWORK_ERROR',
      'SERVER_ERROR',
    ].includes(appError.code);
  }
}

// ============================================
// Export Singleton Instance
// ============================================

export const errorHandler = new ErrorHandler();

export default errorHandler;

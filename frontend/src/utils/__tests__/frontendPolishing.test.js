/**
 * اختبارات تحسينات الفرونت إند
 */

import {
  ErrorHandler,
  InputValidator,
  DataSanitizer,
  ResponseFormatter,
  PerformanceMonitor,
  RequestHandler,
  LocalStateManager,
  SessionManager
} from '../frontendPolishing';

describe('ErrorHandler', () => {
  test('يجب أن يتعامل مع الأخطاء بشكل صحيح', () => {
    const error = new Error('Test error');
    const result = ErrorHandler.handle(error, 'test-context');

    expect(result.success).toBe(false);
    expect(result.context).toBe('test-context');
    expect(result.error).toBeDefined();
  });

  test('يجب أن يتعامل مع أخطاء الشبكة', () => {
    const error = new Error('Network failed');
    const result = ErrorHandler.handleNetworkError(error);

    expect(result.success).toBe(false);
    expect(result.error_code).toBe('NETWORK_ERROR');
  });

  test('يجب أن يتعامل مع أخطاء التحقق', () => {
    const errors = ['البريد غير صحيح', 'كلمة المرور ضعيفة'];
    const result = ErrorHandler.handleValidationError(errors);

    expect(result.success).toBe(false);
    expect(result.error_code).toBe('VALIDATION_ERROR');
    expect(result.details).toEqual(errors);
  });

  test('يجب أن يتعامل مع أخطاء المصادقة', () => {
    const result = ErrorHandler.handleAuthError();

    expect(result.success).toBe(false);
    expect(result.error_code).toBe('AUTH_ERROR');
  });
});

describe('InputValidator', () => {
  test('يجب أن يتحقق من البريد الإلكتروني الصحيح', () => {
    expect(InputValidator.validateEmail('user@example.com')).toBe(true);
    expect(InputValidator.validateEmail('test.email@domain.co.uk')).toBe(true);
  });

  test('يجب أن يرفض البريد الإلكتروني غير الصحيح', () => {
    expect(InputValidator.validateEmail('invalid.email')).toBe(false);
    expect(InputValidator.validateEmail('@example.com')).toBe(false);
  });

  test('يجب أن يتحقق من رقم الهاتف الصحيح', () => {
    expect(InputValidator.validatePhone('1234567890')).toBe(true);
    expect(InputValidator.validatePhone('+1-234-567-8900')).toBe(true);
  });

  test('يجب أن يرفض رقم الهاتف غير الصحيح', () => {
    expect(InputValidator.validatePhone('123')).toBe(false);
    expect(InputValidator.validatePhone('abc')).toBe(false);
  });

  test('يجب أن يتحقق من URL الصحيح', () => {
    expect(InputValidator.validateUrl('https://example.com')).toBe(true);
    expect(InputValidator.validateUrl('http://test.org/path')).toBe(true);
  });

  test('يجب أن يرفض URL غير الصحيح', () => {
    expect(InputValidator.validateUrl('not a url')).toBe(false);
  });

  test('يجب أن يتحقق من قوة كلمة المرور', () => {
    const weakResult = InputValidator.validatePasswordStrength('weak');
    expect(weakResult.isStrong).toBe(false);
    expect(weakResult.issues.length).toBeGreaterThan(0);

    const strongResult = InputValidator.validatePasswordStrength('StrongPass123!@#');
    expect(strongResult.isStrong).toBe(true);
    expect(strongResult.strengthScore).toBe(100);
  });

  test('يجب أن يتحقق من الحقول المطلوبة', () => {
    const data = { name: 'أحمد', email: 'test@example.com' };
    const result = InputValidator.validateRequiredFields(data, ['name', 'email']);

    expect(result.isValid).toBe(true);
    expect(result.missingFields.length).toBe(0);
  });

  test('يجب أن يكتشف الحقول المفقودة', () => {
    const data = { name: 'أحمد' };
    const result = InputValidator.validateRequiredFields(data, ['name', 'email']);

    expect(result.isValid).toBe(false);
    expect(result.missingFields).toContain('email');
  });

  test('يجب أن يتحقق من حجم الملف', () => {
    const smallFile = { size: 5 * 1024 * 1024 }; // 5MB
    expect(InputValidator.validateFileSize(smallFile, 10)).toBe(true);

    const largeFile = { size: 15 * 1024 * 1024 }; // 15MB
    expect(InputValidator.validateFileSize(largeFile, 10)).toBe(false);
  });

  test('يجب أن يتحقق من نوع الملف', () => {
    const imageFile = { type: 'image/jpeg' };
    expect(InputValidator.validateFileType(imageFile, ['image/jpeg', 'image/png'])).toBe(true);

    const exeFile = { type: 'application/x-msdownload' };
    expect(InputValidator.validateFileType(exeFile, ['image/jpeg'])).toBe(false);
  });
});

describe('DataSanitizer', () => {
  test('يجب أن ينظف النص الأساسي', () => {
    const result = DataSanitizer.sanitizeString('  hello world  ');
    expect(result).toBe('hello world');
  });

  test('يجب أن يزيل الأحرف الخطرة', () => {
    const result = DataSanitizer.sanitizeString("<script>alert('xss')</script>");
    expect(result).not.toContain('<');
    expect(result).not.toContain('>');
  });

  test('يجب أن يحترم الحد الأقصى للطول', () => {
    const longText = 'a'.repeat(2000);
    const result = DataSanitizer.sanitizeString(longText, 100);
    expect(result.length).toBe(100);
  });

  test('يجب أن ينظف البريد الإلكتروني', () => {
    const result = DataSanitizer.sanitizeEmail('  USER@EXAMPLE.COM  ');
    expect(result).toBe('user@example.com');
  });

  test('يجب أن ينظف JSON', () => {
    const data = {
      name: '  أحمد  ',
      email: '  TEST@EXAMPLE.COM  ',
      tags: ['tag1', '  tag2  ']
    };

    const result = DataSanitizer.sanitizeJSON(data);
    expect(result.name).toBe('أحمد');
    expect(result.email).toBe('test@example.com');
    expect(result.tags[1]).toBe('tag2');
  });

  test('يجب أن يهرب من HTML', () => {
    const result = DataSanitizer.escapeHTML('<div>Test</div>');
    expect(result).toContain('&lt;');
    expect(result).toContain('&gt;');
  });
});

describe('ResponseFormatter', () => {
  test('يجب أن ينسق استجابة ناجحة', () => {
    const result = ResponseFormatter.successResponse(
      { id: 1, name: 'أحمد' },
      'تم بنجاح'
    );

    expect(result.success).toBe(true);
    expect(result.message).toBe('تم بنجاح');
    expect(result.data.id).toBe(1);
    expect(result.timestamp).toBeDefined();
  });

  test('يجب أن ينسق استجابة خطأ', () => {
    const result = ResponseFormatter.errorResponse(
      'حدث خطأ',
      'ERROR_CODE',
      'تفاصيل'
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe('حدث خطأ');
    expect(result.error_code).toBe('ERROR_CODE');
  });

  test('يجب أن ينسق استجابة مع ترقيم', () => {
    const items = [{ id: 1 }, { id: 2 }];
    const result = ResponseFormatter.paginatedResponse(items, 100, 1, 2);

    expect(result.success).toBe(true);
    expect(result.pagination.total).toBe(100);
    expect(result.pagination.page).toBe(1);
    expect(result.pagination.totalPages).toBe(50);
    expect(result.pagination.hasNext).toBe(true);
  });

  test('يجب أن ينسق استجابة قائمة', () => {
    const items = [{ id: 1 }, { id: 2 }];
    const result = ResponseFormatter.listResponse(items);

    expect(result.success).toBe(true);
    expect(result.count).toBe(2);
  });
});

describe('PerformanceMonitor', () => {
  test('يجب أن يسجل المقاييس', () => {
    const monitor = new PerformanceMonitor();
    monitor.recordMetric('api_call', 150.5, 'ms');

    expect(monitor.metrics.api_call).toBeDefined();
    expect(monitor.metrics.api_call[0].value).toBe(150.5);
  });

  test('يجب أن يحسب ملخص المقاييس', () => {
    const monitor = new PerformanceMonitor();
    monitor.recordMetric('response_time', 100, 'ms');
    monitor.recordMetric('response_time', 200, 'ms');
    monitor.recordMetric('response_time', 300, 'ms');

    const summary = monitor.getMetricsSummary();

    expect(summary.response_time.count).toBe(3);
    expect(summary.response_time.min).toBe(100);
    expect(summary.response_time.max).toBe(300);
    expect(summary.response_time.avg).toBe(200);
  });

  test('يجب أن يمسح المقاييس', () => {
    const monitor = new PerformanceMonitor();
    monitor.recordMetric('test', 100, 'ms');
    expect(Object.keys(monitor.metrics).length).toBeGreaterThan(0);

    monitor.clearMetrics();
    expect(Object.keys(monitor.metrics).length).toBe(0);
  });
});

describe('LocalStateManager', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('يجب أن يحفظ ويسترجع الحالة', () => {
    const manager = new LocalStateManager();
    manager.setState('user', { id: 1, name: 'أحمد' });

    expect(manager.getState('user')).toEqual({ id: 1, name: 'أحمد' });
  });

  test('يجب أن يحمل الحالة من التخزين المحلي', () => {
    const manager1 = new LocalStateManager();
    manager1.setState('counter', 5);

    const manager2 = new LocalStateManager();
    expect(manager2.getState('counter')).toBe(5);
  });

  test('يجب أن يخطر المستمعين بالتغييرات', () => {
    const manager = new LocalStateManager();
    const listener = jest.fn();
    manager.subscribe(listener);

    manager.setState('test', 'value');

    expect(listener).toHaveBeenCalled();
  });

  test('يجب أن يمسح الحالة', () => {
    const manager = new LocalStateManager();
    manager.setState('test', 'value');
    expect(manager.getState('test')).toBe('value');

    manager.clear();
    expect(manager.getState('test')).toBeUndefined();
  });
});

describe('SessionManager', () => {
  test('يجب أن يبدأ الجلسة', () => {
    const manager = new SessionManager(5000);
    manager.startSession();

    expect(manager.isSessionActive()).toBe(true);
  });

  test('يجب أن ينهي الجلسة', (done) => {
    const manager = new SessionManager(100);
    manager.startSession();

    setTimeout(() => {
      expect(manager.isSessionActive()).toBe(false);
      done();
    }, 150);
  });

  test('يجب أن يعيد تعيين مؤقت الجلسة', () => {
    const manager = new SessionManager(5000);
    manager.startSession();
    manager.resetSessionTimer();

    expect(manager.isSessionActive()).toBe(true);
  });

  test('يجب أن يدمر الجلسة', () => {
    const manager = new SessionManager();
    manager.startSession();
    manager.destroy();

    expect(manager.isSessionActive()).toBe(false);
  });
});

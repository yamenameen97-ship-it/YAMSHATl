/**
 * اختبارات تحسينات تجربة المستخدم
 */

import {
  PerformanceOptimizer,
  StateManager,
  CacheManager,
  LoadingManager,
  AccessibilityManager,
  NotificationManager,
  AnimationManager
} from '../uxOptimization';

describe('PerformanceOptimizer', () => {
  let optimizer;

  beforeEach(() => {
    optimizer = new PerformanceOptimizer();
  });

  test('يجب أن يقيس الأداء بشكل صحيح', () => {
    const perf = optimizer.measurePerformance('test-operation');
    perf.start();
    
    // محاكاة عملية
    for (let i = 0; i < 1000000; i++) {
      Math.sqrt(i);
    }
    
    const duration = perf.end();
    expect(duration).toBeGreaterThan(0);
    expect(optimizer.metrics['test-operation']).toBeDefined();
  });

  test('يجب أن يحصل على تقرير الأداء', () => {
    optimizer.metrics['op1'] = 100;
    optimizer.metrics['op2'] = 200;
    optimizer.metrics['op3'] = 300;

    const report = optimizer.getPerformanceReport();
    
    expect(report.metrics).toHaveProperty('op1', 100);
    expect(report.totalTime).toBe(600);
    expect(report.averageTime).toBe(200);
  });

  test('يجب أن ينظف المراقبين', () => {
    optimizer.observePerformance();
    expect(optimizer.observers.size).toBeGreaterThan(0);
    
    optimizer.cleanup();
    expect(optimizer.observers.size).toBe(0);
  });
});

describe('StateManager', () => {
  let stateManager;

  beforeEach(() => {
    stateManager = new StateManager();
  });

  test('يجب أن يعيّن الحالة بشكل صحيح', () => {
    stateManager.setState('user', { id: 1, name: 'أحمد' });
    expect(stateManager.getState('user')).toEqual({ id: 1, name: 'أحمد' });
  });

  test('يجب أن يحصل على الحالة الكاملة', () => {
    stateManager.setState('user', { id: 1 });
    stateManager.setState('theme', 'dark');
    
    const state = stateManager.getState();
    expect(state).toHaveProperty('user');
    expect(state).toHaveProperty('theme');
  });

  test('يجب أن يخطر المستمعين بالتغييرات', () => {
    const listener = jest.fn();
    stateManager.subscribe(listener);
    
    stateManager.setState('counter', 1);
    
    expect(listener).toHaveBeenCalledWith(stateManager.state);
  });

  test('يجب أن يحتفظ بسجل التغييرات', () => {
    stateManager.setState('counter', 1);
    stateManager.setState('counter', 2);
    stateManager.setState('counter', 3);
    
    const history = stateManager.getHistory();
    expect(history.length).toBe(3);
    expect(history[0].newValue).toBe(1);
    expect(history[2].newValue).toBe(3);
  });

  test('يجب أن يحافظ على حد أقصى لحجم السجل', () => {
    for (let i = 0; i < 100; i++) {
      stateManager.setState('counter', i);
    }
    
    const history = stateManager.getHistory();
    expect(history.length).toBeLessThanOrEqual(50);
  });
});

describe('CacheManager', () => {
  let cache;

  beforeEach(() => {
    cache = new CacheManager(1000); // 1 ثانية TTL
  });

  afterEach(() => {
    cache.clear();
  });

  test('يجب أن يخزن البيانات بشكل صحيح', () => {
    cache.set('key1', 'value1');
    expect(cache.get('key1')).toBe('value1');
  });

  test('يجب أن يحذف البيانات المنتهية الصلاحية', (done) => {
    cache.set('key1', 'value1', 100); // 100ms TTL
    
    setTimeout(() => {
      expect(cache.get('key1')).toBeNull();
      done();
    }, 150);
  });

  test('يجب أن يحصل على إحصائيات الكاش', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    
    const stats = cache.getStats();
    expect(stats.size).toBe(2);
    expect(stats.items.length).toBe(2);
  });

  test('يجب أن يمسح الكاش بشكل صحيح', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    
    cache.clear();
    
    expect(cache.get('key1')).toBeNull();
    expect(cache.get('key2')).toBeNull();
    expect(cache.getStats().size).toBe(0);
  });
});

describe('LoadingManager', () => {
  let loadingManager;

  beforeEach(() => {
    loadingManager = new LoadingManager();
  });

  afterEach(() => {
    loadingManager.cleanup();
  });

  test('يجب أن يعيّن حالة التحميل', () => {
    loadingManager.setLoading('api-call', true);
    expect(loadingManager.isLoading('api-call')).toBe(true);
  });

  test('يجب أن يعود false للحالات غير المعرّفة', () => {
    expect(loadingManager.isLoading('undefined-key')).toBe(false);
  });

  test('يجب أن يؤخر الدالة (Debounce)', (done) => {
    const mockFunc = jest.fn();
    
    loadingManager.debounce('search', mockFunc, 100);
    loadingManager.debounce('search', mockFunc, 100);
    loadingManager.debounce('search', mockFunc, 100);
    
    setTimeout(() => {
      expect(mockFunc).toHaveBeenCalledTimes(1);
      done();
    }, 150);
  });

  test('يجب أن يقلل عدد الاستدعاءات (Throttle)', () => {
    const mockFunc = jest.fn(() => 'result');
    const throttledFunc = loadingManager.throttle(mockFunc, 100);
    
    throttledFunc();
    throttledFunc();
    throttledFunc();
    
    expect(mockFunc).toHaveBeenCalledTimes(1);
  });
});

describe('AccessibilityManager', () => {
  test('يجب أن يضيف ARIA labels', () => {
    const element = document.createElement('button');
    AccessibilityManager.addAriaLabel(element, 'إرسال');
    
    expect(element.getAttribute('aria-label')).toBe('إرسال');
  });

  test('يجب أن يضيف ARIA roles', () => {
    const element = document.createElement('div');
    AccessibilityManager.addAriaRole(element, 'navigation');
    
    expect(element.getAttribute('role')).toBe('navigation');
  });

  test('يجب أن يضيف نصوص مساعدة', () => {
    const element = document.createElement('input');
    document.body.appendChild(element);
    
    AccessibilityManager.addHelpText(element, 'أدخل بريدك الإلكتروني');
    
    expect(element.getAttribute('aria-describedby')).toBeDefined();
    
    document.body.removeChild(element);
  });
});

describe('NotificationManager', () => {
  let notificationManager;

  beforeEach(() => {
    notificationManager = new NotificationManager();
  });

  test('يجب أن يضيف تنبيهات', () => {
    const id = notificationManager.addNotification('رسالة نجاح', 'success', 0);
    
    expect(id).toBeDefined();
    expect(notificationManager.getNotifications().length).toBe(1);
  });

  test('يجب أن يزيل التنبيهات', () => {
    const id = notificationManager.addNotification('رسالة', 'info', 0);
    notificationManager.removeNotification(id);
    
    expect(notificationManager.getNotifications().length).toBe(0);
  });

  test('يجب أن يحافظ على الحد الأقصى للتنبيهات', () => {
    for (let i = 0; i < 10; i++) {
      notificationManager.addNotification(`رسالة ${i}`, 'info', 0);
    }
    
    expect(notificationManager.getNotifications().length).toBeLessThanOrEqual(5);
  });

  test('يجب أن يمسح جميع التنبيهات', () => {
    notificationManager.addNotification('رسالة 1', 'info', 0);
    notificationManager.addNotification('رسالة 2', 'info', 0);
    
    notificationManager.clearAll();
    
    expect(notificationManager.getNotifications().length).toBe(0);
  });
});

describe('AnimationManager', () => {
  test('يجب أن يطبق تأثير التلاشي', (done) => {
    const element = document.createElement('div');
    document.body.appendChild(element);
    
    AnimationManager.fadeIn(element, 100);
    
    setTimeout(() => {
      expect(element.style.opacity).toBe('1');
      document.body.removeChild(element);
      done();
    }, 150);
  });

  test('يجب أن يطبق تأثير الانزلاق', (done) => {
    const element = document.createElement('div');
    document.body.appendChild(element);
    
    AnimationManager.slide(element, 'left', 100);
    
    setTimeout(() => {
      expect(element.style.transform).toBe('translateX(0)');
      document.body.removeChild(element);
      done();
    }, 150);
  });
});

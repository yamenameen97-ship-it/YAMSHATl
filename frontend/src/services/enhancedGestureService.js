/**
 * خدمة الإيماءات المحسّنة (Enhanced Gesture Service)
 * تحسينات:
 * - دعم أفضل للسحب بإصبع واحدة
 * - معالجة محسّنة لـ touch-action
 * - تحسين الاستجابة والسلاسة
 * - دعم الإيماءات المتقدمة
 */

export class EnhancedGestureService {
  constructor() {
    this.touches = new Map();
    this.gestures = [];
    this.listeners = new Map();
    this.config = {
      swipeThreshold: 50,
      swipeVelocityThreshold: 0.5,
      doubleTapDelay: 300,
      longPressDelay: 500,
      pinchThreshold: 10,
      animationFrameId: null,
      enableHaptic: this.checkHapticSupport(),
      enableTouchFeedback: true,
      smoothingFactor: 0.3,
      // تحسينات جديدة
      enableSingleFingerScroll: true,
      singleFingerScrollThreshold: 5,
      preventDefaultOnScroll: false,
    };
    this.lastTapTime = 0;
    this.lastTapElement = null;
    this.velocityTracker = [];
    this.maxVelocityHistory = 5;
    this.isScrolling = false;
    this.scrollStartTime = 0;
  }

  /**
   * التحقق من دعم الاهتزاز
   */
  checkHapticSupport() {
    return (
      'vibrate' in navigator ||
      'webkitVibrate' in navigator ||
      'mozVibrate' in navigator
    );
  }

  /**
   * تفعيل الاهتزاز
   */
  triggerHaptic(pattern = 10) {
    if (!this.config.enableHaptic) return;

    try {
      if (navigator.vibrate) {
        navigator.vibrate(pattern);
      } else if (navigator.webkitVibrate) {
        navigator.webkitVibrate(pattern);
      } else if (navigator.mozVibrate) {
        navigator.mozVibrate(pattern);
      }
    } catch (error) {
      console.warn('Haptic feedback not available:', error);
    }
  }

  /**
   * تفعيل ردود فعل اللمس
   */
  triggerTouchFeedback(element, type = 'light') {
    if (!this.config.enableTouchFeedback) return;

    // تأثير بصري
    const originalBg = element.style.backgroundColor;
    const originalTransform = element.style.transform;
    element.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
    element.style.transform = 'scale(0.98)';

    setTimeout(() => {
      element.style.backgroundColor = originalBg;
      element.style.transform = originalTransform;
    }, 100);

    // ردود فعل اهتزاز
    const hapticPatterns = {
      light: 10,
      medium: [10, 20, 10],
      heavy: [20, 30, 20],
      success: [10, 20, 10, 20, 10]
    };

    this.triggerHaptic(hapticPatterns[type] || 10);
  }

  /**
   * تسجيل مستمع الحركة
   */
  on(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType).push(callback);

    return () => {
      const callbacks = this.listeners.get(eventType);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    };
  }

  /**
   * إطلاق حدث الحركة
   */
  emit(eventType, data) {
    const callbacks = this.listeners.get(eventType) || [];
    callbacks.forEach(callback => callback(data));
  }

  /**
   * معالجة بداية اللمس
   */
  handleTouchStart(event) {
    const now = Date.now();
    const touch = event.touches[0];

    if (!touch) return;

    const touchId = Math.random().toString(36);
    const touchData = {
      id: touchId,
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
      startTime: now,
      element: event.target,
      isLongPress: false,
      longPressTimer: null,
      velocities: [],
      isVerticalScroll: false,
    };

    this.touches.set(touchId, touchData);
    this.isScrolling = false;
    this.scrollStartTime = now;

    // تفعيل ردود فعل اللمس
    this.triggerTouchFeedback(event.target, 'light');

    // إعداد مؤقت الضغط الطويل
    touchData.longPressTimer = setTimeout(() => {
      touchData.isLongPress = true;
      this.emit('longpress', {
        x: touch.clientX,
        y: touch.clientY,
        element: event.target
      });
      this.triggerHaptic([20, 10, 20]);
    }, this.config.longPressDelay);

    this.emit('touchstart', touchData);
  }

  /**
   * معالجة حركة اللمس
   */
  handleTouchMove(event) {
    const touch = event.touches[0];
    if (!touch) return;

    const touchId = Array.from(this.touches.keys())[0];
    const touchData = this.touches.get(touchId);

    if (!touchData) return;

    // تحديث الموضع الحالي
    touchData.currentX = touch.clientX;
    touchData.currentY = touch.clientY;

    // حساب الحركة
    const deltaX = touch.clientX - touchData.startX;
    const deltaY = touch.clientY - touchData.startY;
    const deltaTime = Date.now() - touchData.startTime;

    // تحديد نوع الحركة
    if (!touchData.isVerticalScroll && Math.abs(deltaY) > this.config.singleFingerScrollThreshold) {
      touchData.isVerticalScroll = true;
      this.isScrolling = true;
    }

    const velocityX = deltaX / deltaTime;
    const velocityY = deltaY / deltaTime;

    // تتبع السرعة
    touchData.velocities.push({ x: velocityX, y: velocityY });
    if (touchData.velocities.length > this.maxVelocityHistory) {
      touchData.velocities.shift();
    }

    // إلغاء مؤقت الضغط الطويل إذا تحرك اللمس
    if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
      if (touchData.longPressTimer) {
        clearTimeout(touchData.longPressTimer);
        touchData.longPressTimer = null;
      }
    }

    this.emit('touchmove', {
      deltaX,
      deltaY,
      velocityX,
      velocityY,
      touchData,
      isVerticalScroll: touchData.isVerticalScroll,
    });
  }

  /**
   * معالجة نهاية اللمس
   */
  handleTouchEnd(event) {
    const touchId = Array.from(this.touches.keys())[0];
    const touchData = this.touches.get(touchId);

    if (!touchData) return;

    // إلغاء مؤقت الضغط الطويل
    if (touchData.longPressTimer) {
      clearTimeout(touchData.longPressTimer);
    }

    const deltaX = touchData.currentX - touchData.startX;
    const deltaY = touchData.currentY - touchData.startY;
    const deltaTime = Date.now() - touchData.startTime;

    // حساب السرعة النهائية (متوسط السرعات الأخيرة)
    const avgVelocity = this.calculateAverageVelocity(touchData.velocities);

    // كشف الحركات
    this.detectGestures(deltaX, deltaY, deltaTime, avgVelocity, touchData);

    this.emit('touchend', touchData);

    // تنظيف
    this.touches.delete(touchId);
    this.isScrolling = false;
  }

  /**
   * حساب متوسط السرعة
   */
  calculateAverageVelocity(velocities) {
    if (velocities.length === 0) return { x: 0, y: 0 };

    const sum = velocities.reduce(
      (acc, v) => ({ x: acc.x + v.x, y: acc.y + v.y }),
      { x: 0, y: 0 }
    );

    return {
      x: sum.x / velocities.length,
      y: sum.y / velocities.length
    };
  }

  /**
   * كشف الحركات
   */
  detectGestures(deltaX, deltaY, deltaTime, velocity, touchData) {
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // كشف السحب الأفقي
    if (absDeltaX > this.config.swipeThreshold && absDeltaX > absDeltaY) {
      const direction = deltaX > 0 ? 'right' : 'left';
      const speed = Math.abs(velocity.x);

      if (speed > this.config.swipeVelocityThreshold) {
        this.emit('swipe', {
          direction,
          distance: absDeltaX,
          speed,
          duration: deltaTime
        });

        this.triggerHaptic([15, 10, 15]);
      }
    }

    // كشف السحب العمودي
    if (absDeltaY > this.config.swipeThreshold && absDeltaY > absDeltaX) {
      const direction = deltaY > 0 ? 'down' : 'up';
      const speed = Math.abs(velocity.y);

      if (speed > this.config.swipeVelocityThreshold) {
        this.emit('swipeVertical', {
          direction,
          distance: absDeltaY,
          speed,
          duration: deltaTime
        });

        this.triggerHaptic([15, 10, 15]);
      }
    }

    // كشف النقر المزدوج
    if (deltaTime < 300 && absDeltaX < 10 && absDeltaY < 10) {
      const now = Date.now();

      if (
        now - this.lastTapTime < this.config.doubleTapDelay &&
        this.lastTapElement === touchData.element
      ) {
        this.emit('doubletap', {
          x: touchData.startX,
          y: touchData.startY,
          element: touchData.element
        });

        this.triggerHaptic([10, 5, 10, 5, 10]);
      }

      this.lastTapTime = now;
      this.lastTapElement = touchData.element;
    }
  }

  /**
   * إضافة مستمع الحركات إلى عنصر
   * ملاحظة (إصلاح نعومة الشاشة على Desktop):
   * - تم حذف معالجات mousedown/mousemove/mouseup التي كانت تحاكي اللمس.
   * - السبب: محاكاة اللمس عبر الماوس كانت تتداخل مع touch-action في CSS
   *   وتسبب اهتزاز/تخفّت الشاشة عند الضغط بالماوس على Desktop.
   * - الآن: لا نُسجّل أي مستمعات touch على الأجهزة التي ليس فيها لمس فعلي
   *   (نتحقق عبر window.matchMedia('(pointer: coarse)') و'ontouchstart').
   */
  attachToElement(element) {
    if (!element) return () => {};

    // لا نُفعّل خدمة الإيماءات على Desktop / أجهزة الماوس
    const isTouchDevice = (
      typeof window !== 'undefined' &&
      (
        ('ontouchstart' in window) ||
        (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) ||
        (navigator.maxTouchPoints && navigator.maxTouchPoints > 0)
      )
    );

    if (!isTouchDevice) {
      // Desktop: لا نُسجّل أي مستمعات → استجابة ماوس أصلية وسلسة
      return () => {};
    }

    const handleTouchStart = (e) => this.handleTouchStart(e);
    const handleTouchMove = (e) => this.handleTouchMove(e);
    const handleTouchEnd = (e) => this.handleTouchEnd(e);

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }

  /**
   * تنظيف الخدمة
   */
  cleanup() {
    this.touches.forEach((touchData) => {
      if (touchData.longPressTimer) {
        clearTimeout(touchData.longPressTimer);
      }
    });

    this.touches.clear();
    this.listeners.clear();

    if (this.config.animationFrameId) {
      cancelAnimationFrame(this.config.animationFrameId);
    }
  }
}

// إنشاء مثيل عام
export const enhancedGestureService = new EnhancedGestureService();

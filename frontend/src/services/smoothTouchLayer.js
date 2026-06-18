/**
 * طبقة اللمس والسحب السلس المحسّنة (Smooth Touch Layer)
 * 
 * المميزات:
 * - دعم اللمس السلس والناعم على جميع الأجهزة
 * - سحب بإصبع واحدة بشكل مرن وخفيف
 * - تأثيرات بصرية وملموسة ناعمة
 * - دعم الأجهزة القديمة (Redmi, Honor, Galaxy A32 وغيرها)
 * - تحسين الأداء والاستجابة
 * - معالجة متقدمة للتصادمات والتأخيرات
 */

export class SmoothTouchLayer {
  constructor(options = {}) {
    this.config = {
      // معايير السحب
      swipeThreshold: 30, // تقليل الحد الأدنى للسحب
      swipeVelocityThreshold: 0.3,
      doubleTapDelay: 300,
      longPressDelay: 500,

      // معايير السلاسة
      smoothingFactor: 0.15, // تقليل لسلاسة أكثر
      animationDuration: 300,
      useRAF: true, // استخدام requestAnimationFrame

      // دعم الأجهزة القديمة
      legacyDeviceOptimization: true,
      reduceMotion: this.prefersReducedMotion(),

      // 🚀 v48.0 — تعطيل التأثيرات الثقيلة على المستوى الجذري لتسريع اللمس على Chrome Mobile / PWA
      // (كانت تسبب "اللمس الثقيل" وعدم استجابة السحب لأنها تُطبَّق على كل عنصر يُلمس)
      enableHaptic: false,
      enableTouchFeedback: false,
      enableVisualFeedback: false,

      // الأداء
      throttleDelay: 8, // ~120fps
      maxTouchPoints: 1, // إصبع واحدة فقط

      ...options
    };

    this.state = {
      isActive: false,
      touches: new Map(),
      currentGesture: null,
      lastTapTime: 0,
      lastTapElement: null,
      velocityTracker: [],
      maxVelocityHistory: 3,
      isScrolling: false,
      scrollDirection: null,
      lastFrameTime: 0,
      fps: 60,
    };

    this.listeners = new Map();
    this.elements = new WeakMap();
    this.cleanupFunctions = [];
  }

  /**
   * التحقق من تفضيل تقليل الحركة
   */
  prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /**
   * التحقق من دعم الاهتزاز
   */
  checkHapticSupport() {
    return !!(
      navigator.vibrate ||
      navigator.webkitVibrate ||
      navigator.mozVibrate ||
      (navigator.permissions && navigator.permissions.query)
    );
  }

  /**
   * تفعيل الاهتزاز الناعم
   */
  triggerHaptic(pattern = 8) {
    if (!this.config.enableHaptic) return;

    try {
      const vibrate = navigator.vibrate || navigator.webkitVibrate || navigator.mozVibrate;
      if (vibrate) {
        vibrate(pattern);
      }
    } catch (error) {
      // صامت في حالة الفشل
    }
  }

  /**
   * تأثير بصري ناعم عند اللمس
   */
  triggerVisualFeedback(element, type = 'light') {
    if (!this.config.enableVisualFeedback || !element) return;

    const feedbackStyles = {
      light: {
        scale: 0.98,
        opacity: 0.9,
        duration: 100
      },
      medium: {
        scale: 0.95,
        opacity: 0.85,
        duration: 150
      },
      heavy: {
        scale: 0.90,
        opacity: 0.80,
        duration: 200
      }
    };

    const style = feedbackStyles[type] || feedbackStyles.light;
    const originalTransform = element.style.transform;
    const originalOpacity = element.style.opacity;

    // تطبيق التأثير
    element.style.transform = `scale(${style.scale})`;
    element.style.opacity = style.opacity;
    element.style.transition = `all ${style.duration}ms cubic-bezier(0.4, 0, 0.2, 1)`;

    // إعادة تعيين
    setTimeout(() => {
      element.style.transform = originalTransform;
      element.style.opacity = originalOpacity;
      element.style.transition = '';
    }, style.duration);
  }

  /**
   * معالجة بداية اللمس
   */
  handleTouchStart(event) {
    // تجاهل اللمسات المتعددة
    if (event.touches.length > this.config.maxTouchPoints) return;

    const touch = event.touches[0];
    if (!touch) return;

    const touchId = `touch_${Date.now()}_${Math.random()}`;
    const now = Date.now();

    const touchData = {
      id: touchId,
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
      prevX: touch.clientX,
      prevY: touch.clientY,
      startTime: now,
      lastUpdateTime: now,
      element: event.target,
      velocities: [],
      isLongPress: false,
      longPressTimer: null,
      isVerticalScroll: false,
      isHorizontalScroll: false,
      scrollDelta: 0,
      pressure: touch.force || 1,
    };

    this.state.touches.set(touchId, touchData);
    this.state.isActive = true;

    // 🚀 v48.0 — تم تعطيل visual feedback و haptic على كل لمسة
    // لأنها كانت تسبب تأخيراً ملموساً على Chrome Mobile / PWA.
    // يتم تطبيق feedback بصري بسيط الآن عبر CSS :active فقط.
    if (this.config.enableVisualFeedback) {
      this.triggerVisualFeedback(event.target, 'light');
    }
    if (this.config.enableHaptic) {
      this.triggerHaptic(5);
    }

    // إعداد مؤقت الضغط الطويل
    touchData.longPressTimer = setTimeout(() => {
      if (this.state.touches.has(touchId)) {
        touchData.isLongPress = true;
        this.emit('longpress', {
          x: touch.clientX,
          y: touch.clientY,
          element: event.target,
          touchId
        });
        if (this.config.enableHaptic) {
          this.triggerHaptic([10, 5, 10]);
        }
      }
    }, this.config.longPressDelay);

    this.emit('touchstart', touchData);
  }

  /**
   * معالجة حركة اللمس مع السلاسة
   */
  handleTouchMove(event) {
    const touch = event.touches[0];
    if (!touch) return;

    const touchId = Array.from(this.state.touches.keys())[0];
    const touchData = this.state.touches.get(touchId);

    if (!touchData) return;

    const now = Date.now();
    const deltaTime = now - touchData.lastUpdateTime;

    // تحديث الموضع
    touchData.prevX = touchData.currentX;
    touchData.prevY = touchData.currentY;
    touchData.currentX = touch.clientX;
    touchData.currentY = touch.clientY;
    touchData.lastUpdateTime = now;
    touchData.pressure = touch.force || 1;

    // حساب الحركة الكلية
    const totalDeltaX = touchData.currentX - touchData.startX;
    const totalDeltaY = touchData.currentY - touchData.startY;

    // حساب السرعة الفورية
    const instantVelocityX = (touchData.currentX - touchData.prevX) / Math.max(deltaTime, 1);
    const instantVelocityY = (touchData.currentY - touchData.prevY) / Math.max(deltaTime, 1);

    // تتبع السرعة مع التمويه
    const smoothedVelocityX = this.smoothVelocity(instantVelocityX);
    const smoothedVelocityY = this.smoothVelocity(instantVelocityY);

    touchData.velocities.push({
      x: smoothedVelocityX,
      y: smoothedVelocityY,
      time: now
    });

    if (touchData.velocities.length > this.config.maxVelocityHistory) {
      touchData.velocities.shift();
    }

    // تحديد نوع الحركة
    const absDeltaX = Math.abs(totalDeltaX);
    const absDeltaY = Math.abs(totalDeltaY);

    if (!touchData.isVerticalScroll && !touchData.isHorizontalScroll) {
      if (absDeltaY > 5 && absDeltaY > absDeltaX) {
        touchData.isVerticalScroll = true;
        this.state.scrollDirection = totalDeltaY > 0 ? 'down' : 'up';
        this.state.isScrolling = true;
      } else if (absDeltaX > 5 && absDeltaX > absDeltaY) {
        touchData.isHorizontalScroll = true;
        this.state.scrollDirection = totalDeltaX > 0 ? 'right' : 'left';
      }
    }

    // إلغاء مؤقت الضغط الطويل عند الحركة
    if ((absDeltaX > 8 || absDeltaY > 8) && touchData.longPressTimer) {
      clearTimeout(touchData.longPressTimer);
      touchData.longPressTimer = null;
    }

    this.emit('touchmove', {
      touchId,
      totalDeltaX,
      totalDeltaY,
      instantVelocityX,
      instantVelocityY,
      smoothedVelocityX,
      smoothedVelocityY,
      isVerticalScroll: touchData.isVerticalScroll,
      isHorizontalScroll: touchData.isHorizontalScroll,
      scrollDirection: this.state.scrollDirection,
      pressure: touchData.pressure,
      touchData
    });
  }

  /**
   * تمويه السرعة للحصول على حركة أكثر سلاسة
   */
  smoothVelocity(velocity) {
    if (this.state.velocityTracker.length === 0) {
      this.state.velocityTracker.push(velocity);
      return velocity;
    }

    const lastVelocity = this.state.velocityTracker[this.state.velocityTracker.length - 1];
    const smoothed = lastVelocity * (1 - this.config.smoothingFactor) + 
                     velocity * this.config.smoothingFactor;

    this.state.velocityTracker.push(smoothed);
    if (this.state.velocityTracker.length > 5) {
      this.state.velocityTracker.shift();
    }

    return smoothed;
  }

  /**
   * معالجة نهاية اللمس
   */
  handleTouchEnd(event) {
    const touchId = Array.from(this.state.touches.keys())[0];
    const touchData = this.state.touches.get(touchId);

    if (!touchData) return;

    // إلغاء مؤقت الضغط الطويل
    if (touchData.longPressTimer) {
      clearTimeout(touchData.longPressTimer);
    }

    const totalDeltaX = touchData.currentX - touchData.startX;
    const totalDeltaY = touchData.currentY - touchData.startY;
    const totalDeltaTime = Date.now() - touchData.startTime;

    // حساب السرعة النهائية
    const finalVelocity = this.calculateFinalVelocity(touchData.velocities);

    // كشف الحركات
    this.detectGestures(
      totalDeltaX,
      totalDeltaY,
      totalDeltaTime,
      finalVelocity,
      touchData
    );

    this.emit('touchend', {
      touchId,
      totalDeltaX,
      totalDeltaY,
      totalDeltaTime,
      finalVelocity,
      touchData
    });

    // تنظيف
    this.state.touches.delete(touchId);
    this.state.isActive = false;
    this.state.isScrolling = false;
    this.state.scrollDirection = null;
    this.state.velocityTracker = [];
  }

  /**
   * حساب السرعة النهائية
   */
  calculateFinalVelocity(velocities) {
    if (velocities.length === 0) return { x: 0, y: 0 };

    // استخدام آخر 3 سرعات فقط
    const recentVelocities = velocities.slice(-3);
    const sum = recentVelocities.reduce(
      (acc, v) => ({ x: acc.x + v.x, y: acc.y + v.y }),
      { x: 0, y: 0 }
    );

    return {
      x: sum.x / recentVelocities.length,
      y: sum.y / recentVelocities.length
    };
  }

  /**
   * كشف الحركات
   */
  detectGestures(deltaX, deltaY, deltaTime, velocity, touchData) {
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);
    const absVelocityX = Math.abs(velocity.x);
    const absVelocityY = Math.abs(velocity.y);

    // كشف السحب الأفقي
    if (absDeltaX > this.config.swipeThreshold && absDeltaX > absDeltaY * 1.5) {
      if (absVelocityX > this.config.swipeVelocityThreshold) {
        const direction = deltaX > 0 ? 'right' : 'left';

        this.emit('swipe', {
          direction,
          distance: absDeltaX,
          velocity: absVelocityX,
          duration: deltaTime,
          touchId: touchData.id
        });

        if (this.config.enableHaptic) this.triggerHaptic([8, 3, 8]);
      }
    }

    // كشف السحب العمودي
    if (absDeltaY > this.config.swipeThreshold && absDeltaY > absDeltaX * 1.5) {
      if (absVelocityY > this.config.swipeVelocityThreshold) {
        const direction = deltaY > 0 ? 'down' : 'up';

        this.emit('swipeVertical', {
          direction,
          distance: absDeltaY,
          velocity: absVelocityY,
          duration: deltaTime,
          touchId: touchData.id
        });

        if (this.config.enableHaptic) this.triggerHaptic([8, 3, 8]);
      }
    }

    // كشف النقر المزدوج
    if (deltaTime < 300 && absDeltaX < 10 && absDeltaY < 10) {
      const now = Date.now();

      if (
        now - this.state.lastTapTime < this.config.doubleTapDelay &&
        this.state.lastTapElement === touchData.element
      ) {
        this.emit('doubletap', {
          x: touchData.startX,
          y: touchData.startY,
          element: touchData.element,
          touchId: touchData.id
        });

        if (this.config.enableHaptic) this.triggerHaptic([5, 2, 5, 2, 5]);
      }

      this.state.lastTapTime = now;
      this.state.lastTapElement = touchData.element;

      // إطلاق حدث النقر
      this.emit('tap', {
        x: touchData.startX,
        y: touchData.startY,
        element: touchData.element,
        touchId: touchData.id
      });
    }
  }

  /**
   * تسجيل مستمع الحدث
   */
  on(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType).push(callback);

    // إرجاع دالة إلغاء الاشتراك
    return () => {
      const callbacks = this.listeners.get(eventType);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    };
  }

  /**
   * إطلاق حدث
   */
  emit(eventType, data) {
    const callbacks = this.listeners.get(eventType) || [];
    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in ${eventType} listener:`, error);
      }
    });
  }

  /**
   * إرفاق الطبقة إلى عنصر
   */
  attachToElement(element) {
    if (!element) return () => {};

    const handleTouchStart = (e) => this.handleTouchStart(e);
    const handleTouchMove = (e) => this.handleTouchMove(e);
    const handleTouchEnd = (e) => this.handleTouchEnd(e);
    const handleTouchCancel = (e) => this.handleTouchEnd(e);

    // إضافة مستمعي اللمس
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });
    element.addEventListener('touchcancel', handleTouchCancel, { passive: true });

    // تم تعطيل دعم الماوس لمنع التشويش والاهتزاز على اللابتوب
    /*
    element.addEventListener('mousedown', (e) => {
      this.handleTouchStart({
        touches: [{ clientX: e.clientX, clientY: e.clientY, force: 1 }],
        target: e.target
      });
    });

    element.addEventListener('mousemove', (e) => {
      if (this.state.isActive) {
        this.handleTouchMove({
          touches: [{ clientX: e.clientX, clientY: e.clientY, force: 1 }],
          target: e.target
        });
      }
    });

    element.addEventListener('mouseup', (e) => {
      this.handleTouchEnd({
        touches: [],
        target: e.target
      });
    });
    */

    // حفظ دالة التنظيف
    const cleanup = () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchCancel);
    };

    this.cleanupFunctions.push(cleanup);
    return cleanup;
  }

  /**
   * تنظيف الخدمة
   */
  cleanup() {
    this.cleanupFunctions.forEach(fn => fn());
    this.cleanupFunctions = [];
    this.listeners.clear();
    this.state.touches.clear();
  }

  /**
   * الحصول على حالة اللمس الحالية
   */
  getState() {
    return {
      isActive: this.state.isActive,
      touchCount: this.state.touches.size,
      isScrolling: this.state.isScrolling,
      scrollDirection: this.state.scrollDirection,
      fps: this.state.fps
    };
  }
}

// إنشاء مثيل عام
export const smoothTouchLayer = new SmoothTouchLayer();

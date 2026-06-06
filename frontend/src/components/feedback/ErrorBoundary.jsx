import { Component } from 'react';

/**
 * ErrorBoundary
 * =============
 * مكون لمعالجة الأخطاء في الواجهة
 * 
 * يعرض رسالة خطأ ودية بدلاً من تعطل التطبيق
 * يسمح بإعادة محاولة تحميل المكون
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState((prevState) => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));

    // تسجيل الخطأ في وحدة التحكم
    console.error('Error caught by boundary:', error, errorInfo);

    // يمكن إرسال الخطأ إلى خدمة تتبع الأخطاء
    if (typeof window !== 'undefined' && window.errorTracker) {
      window.errorTracker.captureException(error, { errorInfo });
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-container">
          <div className="error-boundary-content">
            <div className="error-icon">⚠️</div>
            <h2 className="error-title">حدث خطأ ما</h2>
            <p className="error-message">
              عذراً، حدث خطأ غير متوقع. يرجى محاولة تحديث الصفحة أو الاتصال بالدعم.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="error-details">
                <summary>تفاصيل الخطأ (للمطورين فقط)</summary>
                <pre className="error-stack">
                  {this.state.error.toString()}
                  {'\n\n'}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="error-actions">
              <button
                type="button"
                className="error-action-btn primary"
                onClick={this.handleReset}
              >
                إعادة محاولة
              </button>
              <button
                type="button"
                className="error-action-btn secondary"
                onClick={() => window.location.href = '/'}
              >
                العودة للرئيسية
              </button>
            </div>

            {this.state.errorCount > 3 && (
              <p className="error-warning">
                حدثت عدة أخطاء متتالية. يرجى تحديث الصفحة أو مسح ذاكرة التخزين المؤقتة.
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

/**
 * CSS Styles for ErrorBoundary
 * ===========================
 * 
 * أضف هذا إلى global.css:
 * 
 * .error-boundary-container {
 *   display: flex;
 *   align-items: center;
 *   justify-content: center;
 *   min-height: 100vh;
 *   padding: 20px;
 *   background: linear-gradient(135deg, rgba(6, 10, 23, 0.95), rgba(10, 15, 31, 0.98));
 * }
 * 
 * .error-boundary-content {
 *   display: flex;
 *   flex-direction: column;
 *   align-items: center;
 *   gap: 20px;
 *   max-width: 500px;
 *   padding: 40px 30px;
 *   border-radius: 20px;
 *   border: 1px solid rgba(239, 68, 68, 0.2);
 *   background: linear-gradient(135deg, rgba(239, 68, 68, 0.08), rgba(220, 38, 38, 0.04));
 *   text-align: center;
 * }
 * 
 * .error-icon {
 *   font-size: 3rem;
 *   line-height: 1;
 * }
 * 
 * .error-title {
 *   font-size: 1.5rem;
 *   font-weight: 700;
 *   color: #fff;
 *   margin: 0;
 * }
 * 
 * .error-message {
 *   font-size: 0.95rem;
 *   color: #cbd5e1;
 *   margin: 0;
 *   line-height: 1.6;
 * }
 * 
 * .error-details {
 *   width: 100%;
 *   padding: 12px;
 *   border-radius: 12px;
 *   background: rgba(0, 0, 0, 0.3);
 *   border: 1px solid rgba(239, 68, 68, 0.2);
 *   cursor: pointer;
 * }
 * 
 * .error-details summary {
 *   font-size: 0.85rem;
 *   color: #fca5a5;
 *   font-weight: 600;
 *   user-select: none;
 * }
 * 
 * .error-stack {
 *   margin: 12px 0 0 0;
 *   padding: 12px;
 *   border-radius: 8px;
 *   background: rgba(0, 0, 0, 0.5);
 *   color: #fca5a5;
 *   font-size: 0.75rem;
 *   font-family: 'Courier New', monospace;
 *   overflow-x: auto;
 *   text-align: left;
 * }
 * 
 * .error-actions {
 *   display: flex;
 *   gap: 12px;
 *   justify-content: center;
 *   flex-wrap: wrap;
 *   width: 100%;
 * }
 * 
 * .error-action-btn {
 *   padding: 12px 24px;
 *   border-radius: 12px;
 *   border: none;
 *   font-size: 0.95rem;
 *   font-weight: 600;
 *   cursor: pointer;
 *   transition: all 200ms ease;
 *   min-width: 140px;
 * }
 * 
 * .error-action-btn.primary {
 *   background: linear-gradient(135deg, #ef4444, #dc2626);
 *   color: #fff;
 * }
 * 
 * .error-action-btn.primary:hover {
 *   background: linear-gradient(135deg, #dc2626, #b91c1c);
 * }
 * 
 * .error-action-btn.secondary {
 *   background: rgba(148, 163, 184, 0.1);
 *   color: #94a3b8;
 *   border: 1px solid rgba(148, 163, 184, 0.2);
 * }
 * 
 * .error-action-btn.secondary:hover {
 *   background: rgba(148, 163, 184, 0.2);
 *   border-color: rgba(148, 163, 184, 0.4);
 * }
 * 
 * .error-action-btn:active {
 *   transform: scale(0.97);
 * }
 * 
 * .error-warning {
 *   font-size: 0.85rem;
 *   color: #fca5a5;
 *   margin: 0;
 *   padding: 12px;
 *   border-radius: 8px;
 *   background: rgba(239, 68, 68, 0.1);
 *   border: 1px solid rgba(239, 68, 68, 0.2);
 * }
 */

import React from 'react';
import Card from '../ui/Card.jsx';
import Button from '../ui/Button.jsx';

/**
 * AppErrorBoundary Component
 * 
 * معالج أخطاء شامل لكل التطبيق
 * يوفر:
 * - التقاط الأخطاء غير المتوقعة
 * - تسجيل الأخطاء
 * - واجهة خطأ ودية للمستخدم
 * - خيار إعادة المحاولة
 */
class AppErrorBoundary extends React.Component {
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
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by boundary:', error, errorInfo);
    }

    // Log to error tracking service (e.g., Sentry)
    this.logErrorToService(error, errorInfo);

    this.setState(prevState => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));
  }

  logErrorToService = (error, errorInfo) => {
    // TODO: Integrate with error tracking service
    // Example: Sentry, LogRocket, etc.
    const errorData = {
      message: error.toString(),
      stack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // Send to backend
    fetch('/api/errors/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(errorData),
    }).catch(err => console.warn('Failed to log error:', err));
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: 'var(--bg)',
          padding: '20px',
        }}>
          <Card style={{
            maxWidth: '500px',
            padding: '40px',
            textAlign: 'center',
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '20px',
            }}>
              ⚠️
            </div>

            <h1 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              marginBottom: '12px',
              color: 'var(--text)',
            }}>
              حدث خطأ غير متوقع
            </h1>

            <p style={{
              color: 'var(--text-muted)',
              marginBottom: '20px',
              lineHeight: '1.6',
            }}>
              نعتذر عن الإزعاج. حدث خطأ في التطبيق. يرجى محاولة إعادة تحميل الصفحة أو العودة للصفحة الرئيسية.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div style={{
                background: 'var(--bg-soft)',
                border: '1px solid var(--line)',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '20px',
                textAlign: 'left',
                maxHeight: '200px',
                overflow: 'auto',
              }}>
                <p style={{
                  fontSize: '12px',
                  color: '#ef4444',
                  fontFamily: 'monospace',
                  margin: '0',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}>
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
            }}>
              <Button
                variant="secondary"
                onClick={this.handleReset}
              >
                العودة للتطبيق
              </Button>
              <Button
                onClick={this.handleReload}
              >
                إعادة تحميل
              </Button>
            </div>

            {this.state.errorCount > 3 && (
              <div style={{
                marginTop: '20px',
                padding: '12px',
                background: '#fef3c7',
                border: '1px solid #fcd34d',
                borderRadius: '6px',
                color: '#92400e',
                fontSize: '14px',
              }}>
                ⚠️ يبدو أن هناك مشكلة متكررة. يرجى الاتصال بالدعم الفني.
              </div>
            )}
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AppErrorBoundary;

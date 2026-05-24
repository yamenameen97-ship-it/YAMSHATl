import React from 'react';
import Card from '../ui/Card.jsx';
import Button from '../ui/Button.jsx';
import { buildApiUrl } from '../../api/config.js';

/**
 * PageErrorBoundary Component
 * 
 * معالج أخطاء لصفحة واحدة
 * يوفر:
 * - التقاط الأخطاء في صفحة معينة فقط
 * - عدم تأثر باقي التطبيق
 * - واجهة خطأ محسّنة للصفحة
 */
class PageErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Page error caught:', error, errorInfo);
    }

    this.setState({
      error,
      errorInfo,
    });

    // Log to service
    this.logError(error, errorInfo);
  }

  logError = (error, errorInfo) => {
    const errorData = {
      type: 'page_error',
      message: error.toString(),
      stack: errorInfo.componentStack,
      page: window.location.pathname,
      timestamp: new Date().toISOString(),
    };

    fetch(buildApiUrl('/errors/log'), {
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

  handleGoBack = () => {
    window.history.back();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          padding: '20px',
        }}>
          <Card style={{
            maxWidth: '400px',
            padding: '30px',
            textAlign: 'center',
          }}>
            <div style={{
              fontSize: '40px',
              marginBottom: '16px',
            }}>
              😕
            </div>

            <h2 style={{
              fontSize: '18px',
              fontWeight: 'bold',
              marginBottom: '12px',
              color: 'var(--text)',
            }}>
              حدث خطأ في هذه الصفحة
            </h2>

            <p style={{
              color: 'var(--text-muted)',
              marginBottom: '20px',
              fontSize: '14px',
              lineHeight: '1.5',
            }}>
              نعتذر عن الإزعاج. يرجى محاولة إعادة تحميل الصفحة أو العودة للخلف.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div style={{
                background: 'var(--bg-soft)',
                border: '1px solid #ef4444',
                borderRadius: '6px',
                padding: '10px',
                marginBottom: '16px',
                textAlign: 'left',
                maxHeight: '150px',
                overflow: 'auto',
              }}>
                <p style={{
                  fontSize: '11px',
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
              gap: '10px',
            }}>
              <Button
                variant="secondary"
                onClick={this.handleGoBack}
              >
                رجوع
              </Button>
              <Button
                onClick={this.handleReset}
              >
                إعادة محاولة
              </Button>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default PageErrorBoundary;

import React from 'react';
import Button from '../ui/Button.jsx';
import logger from '../../utils/logger.js';

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      message: error?.message || 'حدث خطأ غير متوقع.',
    };
  }

  componentDidCatch(error, errorInfo) {
    logger.error('app error boundary caught an error', {
      message: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
    });
  }

  handleReload = () => {
    if (typeof window !== 'undefined') window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="page-loader-shell" style={{ minHeight: '100vh', padding: 24 }}>
        <div className="empty-state" style={{ maxWidth: 560 }}>
          <div className="empty-icon">⚠️</div>
          <h3>حصل خطأ غير متوقع</h3>
          <p>{this.state.message || 'تم إيقاف الجزء المتأثر لحماية الجلسة والبيانات.'}</p>
          <Button onClick={this.handleReload}>إعادة تحميل التطبيق</Button>
        </div>
      </div>
    );
  }
}

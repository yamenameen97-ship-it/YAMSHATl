import React from 'react';
import Button from '../ui/Button.jsx';
import logger from '../../utils/logger.js';

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '', isChunkError: false };
  }

  static getDerivedStateFromError(error) {
    // التحقق مما إذا كان الخطأ ناتجاً عن فشل تحميل وحدة ديناميكية (Dynamic Import/Chunk)
    const isChunkError = 
      error?.message?.includes('Failed to fetch dynamically imported module') ||
      error?.name === 'ChunkLoadError' ||
      error?.message?.includes('Loading chunk');

    return {
      hasError: true,
      message: error?.message || 'حدث خطأ غير متوقع.',
      isChunkError
    };
  }

  componentDidCatch(error, errorInfo) {
    logger.error('app error boundary caught an error', {
      message: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
    });

    // إذا كان خطأ في تحميل الـ chunk، نقوم بإعادة تحميل الصفحة تلقائياً لمرة واحدة
    if (this.state.isChunkError) {
      const lastReload = sessionStorage.getItem('last_chunk_error_reload');
      const now = Date.now();
      
      // نمنع حلقة إعادة التحميل اللانهائية (إعادة تحميل فقط إذا مر أكثر من 10 ثوانٍ على آخر محاولة)
      if (!lastReload || now - parseInt(lastReload) > 10000) {
        sessionStorage.setItem('last_chunk_error_reload', now.toString());
        logger.info('Chunk load error detected, attempting auto-reload...');
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    }
  }

  handleReload = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('last_chunk_error_reload');
      window.location.reload();
    }
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="page-loader-shell" style={{ minHeight: '100vh', padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0b0f1a' }}>
        <div className="empty-state" style={{ maxWidth: 560, textAlign: 'center', color: '#fff' }}>
          <div className="empty-icon" style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <h3 style={{ fontSize: '24px', marginBottom: '12px' }}>
            {this.state.isChunkError ? 'تحديث مطلوب للتطبيق' : 'حصل خطأ غير متوقع'}
          </h3>
          <p style={{ opacity: 0.8, marginBottom: '24px' }}>
            {this.state.isChunkError 
              ? 'نواجه مشكلة في تحميل بعض أجزاء التطبيق، قد يكون ذلك بسبب تحديث جديد. يرجى إعادة تحميل الصفحة.'
              : (this.state.message || 'تم إيقاف الجزء المتأثر لحماية الجلسة والبيانات.')}
          </p>
          <Button onClick={this.handleReload} variant="primary">إعادة تحميل التطبيق</Button>
        </div>
      </div>
    );
  }
}

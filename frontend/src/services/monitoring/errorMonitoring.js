const MAX_ERRORS = 50;

const normalizeError = (error, metadata = {}) => ({
  message: error?.message || 'Unknown error',
  stack: error?.stack || null,
  timestamp: new Date().toISOString(),
  metadata,
  userAgent: navigator.userAgent,
  url: window.location.href,
});

export function reportError(error, metadata = {}) {
  try {
    const payload = normalizeError(error, metadata);
    const existing = JSON.parse(localStorage.getItem('yamshat:error-log') || '[]');
    existing.unshift(payload);
    localStorage.setItem(
      'yamshat:error-log',
      JSON.stringify(existing.slice(0, MAX_ERRORS)),
    );

    console.error('[Monitoring]', payload);
  } catch (monitoringError) {
    console.error('Monitoring failure', monitoringError);
  }
}

export function setupGlobalErrorMonitoring() {
  window.addEventListener('error', (event) => {
    reportError(event.error || new Error(event.message), {
      type: 'window-error',
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    reportError(event.reason || new Error('Unhandled promise rejection'), {
      type: 'promise-rejection',
    });
  });
}

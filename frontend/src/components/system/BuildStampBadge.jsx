const buildId = typeof __APP_BUILD_ID__ !== 'undefined' ? __APP_BUILD_ID__ : 'local';
const buildTime = typeof __APP_BUILD_TIME__ !== 'undefined' ? __APP_BUILD_TIME__ : '';

function formatBuildTime(value) {
  if (!value) return 'local build';
  try {
    return new Intl.DateTimeFormat('ar-EG', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export default function BuildStampBadge() {
  return (
    <div className="build-stamp-badge" dir="rtl" title={`Build ${buildId}`}>
      <strong>نسخة Vite المباشرة</strong>
      <span>الإصدار: {String(buildId).slice(0, 12)}</span>
      <small>{formatBuildTime(buildTime)}</small>
      <style>{`
        .build-stamp-badge {
          position: fixed;
          inset-inline-end: 14px;
          bottom: 14px;
          z-index: 70;
          display: grid;
          gap: 4px;
          min-width: 170px;
          padding: 10px 12px;
          border-radius: 16px;
          background: rgba(15, 23, 42, 0.92);
          color: #e2e8f0;
          border: 1px solid rgba(96, 165, 250, 0.3);
          box-shadow: 0 14px 40px rgba(2, 6, 23, 0.35);
          backdrop-filter: blur(14px);
          font-size: 12px;
        }
        .build-stamp-badge strong {
          color: #93c5fd;
          font-size: 12px;
        }
        .build-stamp-badge span,
        .build-stamp-badge small {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .build-stamp-badge small {
          color: rgba(226, 232, 240, 0.74);
        }
        @media (max-width: 640px) {
          .build-stamp-badge {
            inset-inline: 12px;
            bottom: 12px;
            min-width: auto;
          }
        }
      `}</style>
    </div>
  );
}

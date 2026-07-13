import { useNavigate } from 'react-router-dom';
import MainLayout from '../layout/MainLayout.jsx';
import Card from '../ui/Card.jsx';
import Button from '../ui/Button.jsx';

/**
 * SettingsShell — Layout مشترك لكل صفحات الإعدادات الفرعية
 * يدعم: زر رجوع، رأس صفحة، تبويبات اختيارية، Cards احترافية، إشعار حفظ.
 */
export default function SettingsShell({
  title,
  subtitle,
  icon = '⚙️',
  backTo,
  tabs = null,
  activeTab = null,
  onTabChange = () => {},
  message = '',
  children,
}) {
  const navigate = useNavigate();

  return (
    <MainLayout>
      <div className="settings-shell" dir="rtl">
        <div className="settings-shell-header">
          <button
            type="button"
            className="settings-shell-back"
            onClick={() => (backTo ? navigate(backTo) : navigate(-1))}
            aria-label="رجوع"
          >
            ←
          </button>
          <div className="settings-shell-title-block">
            <h1>
              <span className="settings-shell-icon" aria-hidden>{icon}</span>
              {title}
            </h1>
            {subtitle ? <p className="muted">{subtitle}</p> : null}
          </div>
        </div>

        {message ? <div className="settings-banner">{message}</div> : null}

        {tabs && tabs.length ? (
          <div className="settings-shell-tabs">
            {tabs.map((tab) => (
              <Button
                key={tab.key}
                variant={activeTab === tab.key ? 'primary' : 'secondary'}
                size="small"
                onClick={() => onTabChange(tab.key)}
              >
                {tab.label}
              </Button>
            ))}
          </div>
        ) : null}

        <div className="settings-shell-body">{children}</div>
      </div>

      <style>{`
        .settings-shell {
          max-width: 1080px;
          margin: 0 auto;
          padding: 12px 14px calc(118px + env(safe-area-inset-bottom, 0px));
          font-size: 13px;
          box-sizing: border-box;
          touch-action: pan-y;
          -ms-touch-action: pan-y;
          -webkit-overflow-scrolling: touch;
          overscroll-behavior-y: contain;
          overscroll-behavior-x: none;
          pointer-events: auto;
          transform: none;
          filter: none;
          perspective: none;
        }
        .settings-shell-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
        }
        .settings-shell-back {
          width: 32px;
          height: 32px;
          border-radius: 9px;
          border: 1px solid rgba(167,139,250,0.25);
          background: rgba(15,23,42,0.7);
          color: #e2e8f0;
          font-size: 16px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .settings-shell-back:hover { background: rgba(99,102,241,0.18); }
        .settings-shell-title-block h1 {
          margin: 0 0 2px;
          font-size: 17px;
          display: flex;
          align-items: center;
          gap: 7px;
        }
        .settings-shell-icon { font-size: 18px; }
        .settings-shell-title-block p { margin: 0; font-size: 11.5px; }
        .settings-banner {
          padding: 8px 10px;
          border-radius: 10px;
          background: rgba(34,197,94,0.14);
          color: #86efac;
          border: 1px solid rgba(34,197,94,0.24);
          margin-bottom: 10px;
          font-size: 12px;
        }
        .settings-shell-tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 10px;
          overflow-x: auto;
        }
        .settings-shell-body {
          display: grid;
          gap: 10px;
          overflow: visible;
          touch-action: pan-y;
          pointer-events: auto;
        }
        .settings-shell-header,
        .settings-shell-tabs,
        .settings-shell-body > *,
        .settings-row,
        .stats-grid,
        .metric-card {
          touch-action: pan-y;
          pointer-events: auto;
        }
        .settings-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding: 7px 0;
          border-bottom: 1px solid rgba(148,163,184,0.08);
        }
        .settings-row:last-child { border-bottom: none; }
        .settings-row-info { flex: 1; min-width: 0; }
        .settings-row-info strong { display: block; margin-bottom: 1px; font-size: 12.5px; font-weight: 600; }
        .settings-row-info .muted { font-size: 11px; line-height: 1.35; }
        .settings-section-title {
          margin: 0 0 3px;
          font-size: 14.5px;
          font-weight: 700;
        }
        .settings-section-desc {
          margin: 0 0 8px;
          color: rgba(226,232,240,0.66);
          font-size: 11.5px;
        }
        .settings-toggle {
          position: relative;
          width: 36px;
          height: 20px;
          border-radius: 999px;
          background: rgba(100,116,139,0.35);
          cursor: pointer;
          transition: background 0.2s;
          border: none;
          flex-shrink: 0;
        }
        .settings-toggle::after {
          content: '';
          position: absolute;
          top: 2px;
          right: 2px;
          width: 16px;
          height: 16px;
          background: #fff;
          border-radius: 50%;
          transition: all 0.2s;
        }
        .settings-toggle[data-on='true'] { background: #6366f1; }
        .settings-toggle[data-on='true']::after { right: 18px; }
        .settings-select, .settings-input {
          padding: 4px 8px;
          border-radius: 7px;
          background: rgba(15,23,42,0.6);
          border: 1px solid rgba(148,163,184,0.18);
          color: #e2e8f0;
          font-size: 12px;
          min-width: 110px;
          min-height: 26px;
        }
        .settings-danger {
          color: #fca5a5;
          border-color: rgba(239,68,68,0.3);
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 6px;
        }
        .metric-card {
          padding: 8px 10px;
          border-radius: 10px;
          background: rgba(15,23,42,0.45);
          border: 1px solid rgba(148,163,184,0.12);
          display: grid;
          gap: 2px;
        }
        .metric-card span { color: rgba(226,232,240,0.72); font-size: 11px; }
        .metric-card strong { font-size: 13.5px; }

        /* v76 — overrides لتصغير الأزرار داخل SettingsShell */
        .settings-shell button,
        .settings-shell a,
        .settings-shell [role='button'],
        .settings-shell [role='tab'],
        .settings-shell [role='link'],
        .settings-shell .settings-toggle,
        .settings-shell .settings-shell-back,
        .settings-shell .settings-link-btn,
        .settings-shell .btn,
        .settings-shell button.btn {
          touch-action: manipulation;
        }
        .settings-shell input,
        .settings-shell textarea,
        .settings-shell select,
        .settings-shell [contenteditable='true'] {
          touch-action: auto;
        }
        .settings-shell-body .btn,
        .settings-shell-body button.btn,
        .settings-shell-body .btn-small,
        .settings-shell-body .btn-medium {
          min-height: 24px !important;
          height: 24px !important;
          padding: 3px 10px !important;
          font-size: 11.5px !important;
          border-radius: 6px !important;
        }
        .settings-shell-body .btn-large {
          min-height: 28px !important;
          height: 28px !important;
          padding: 4px 12px !important;
          font-size: 12px !important;
        }

        @media (max-width: 600px) {
          .settings-shell {
            padding: 10px 10px calc(124px + env(safe-area-inset-bottom, 0px));
          }
          .settings-shell-title-block h1 { font-size: 15px; }
          .settings-row { flex-wrap: wrap; gap: 6px; }
        }
      `}</style>
    </MainLayout>
  );
}

export function SettingsToggle({ on, onChange, ariaLabel }) {
  return (
    <button
      type="button"
      className="settings-toggle"
      data-on={on ? 'true' : 'false'}
      onClick={() => onChange(!on)}
      aria-label={ariaLabel || 'toggle'}
      aria-pressed={on}
    />
  );
}

export function SettingsRow({ icon, title, description, children }) {
  return (
    <div className="settings-row">
      <div className="settings-row-info">
        <strong>{icon ? <span style={{ marginInlineEnd: 6 }}>{icon}</span> : null}{title}</strong>
        {description ? <div className="muted">{description}</div> : null}
      </div>
      {children}
    </div>
  );
}

export function SettingsSection({ title, description, children }) {
  return (
    <Card style={{ padding: 18 }}>
      {title ? <h3 className="settings-section-title">{title}</h3> : null}
      {description ? <p className="settings-section-desc">{description}</p> : null}
      {children}
    </Card>
  );
}

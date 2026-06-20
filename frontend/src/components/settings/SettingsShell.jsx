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
          padding: 18px 16px 80px;
        }
        .settings-shell-header {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 18px;
        }
        .settings-shell-back {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          border: 1px solid rgba(167,139,250,0.25);
          background: rgba(15,23,42,0.7);
          color: #e2e8f0;
          font-size: 22px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .settings-shell-back:hover { background: rgba(99,102,241,0.18); }
        .settings-shell-title-block h1 {
          margin: 0 0 6px;
          font-size: 22px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .settings-shell-icon { font-size: 26px; }
        .settings-shell-title-block p { margin: 0; }
        .settings-banner {
          padding: 12px 14px;
          border-radius: 12px;
          background: rgba(34,197,94,0.14);
          color: #86efac;
          border: 1px solid rgba(34,197,94,0.24);
          margin-bottom: 16px;
          font-size: 14px;
        }
        .settings-shell-tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 16px;
          overflow-x: auto;
        }
        .settings-shell-body {
          display: grid;
          gap: 14px;
        }
        .settings-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 14px 0;
          border-bottom: 1px solid rgba(148,163,184,0.10);
        }
        .settings-row:last-child { border-bottom: none; }
        .settings-row-info { flex: 1; }
        .settings-row-info strong { display: block; margin-bottom: 4px; font-size: 15px; }
        .settings-row-info .muted { font-size: 13px; }
        .settings-section-title {
          margin: 0 0 4px;
          font-size: 17px;
        }
        .settings-section-desc {
          margin: 0 0 14px;
          color: rgba(226,232,240,0.66);
          font-size: 13px;
        }
        .settings-toggle {
          position: relative;
          width: 50px;
          height: 28px;
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
          top: 3px;
          right: 3px;
          width: 22px;
          height: 22px;
          background: #fff;
          border-radius: 50%;
          transition: all 0.2s;
        }
        .settings-toggle[data-on='true'] { background: #6366f1; }
        .settings-toggle[data-on='true']::after { right: 25px; }
        .settings-select, .settings-input {
          padding: 10px 12px;
          border-radius: 10px;
          background: rgba(15,23,42,0.6);
          border: 1px solid rgba(148,163,184,0.18);
          color: #e2e8f0;
          font-size: 14px;
          min-width: 140px;
        }
        .settings-danger {
          color: #fca5a5;
          border-color: rgba(239,68,68,0.3);
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 10px;
        }
        .metric-card {
          padding: 14px;
          border-radius: 14px;
          background: rgba(15,23,42,0.45);
          border: 1px solid rgba(148,163,184,0.12);
          display: grid;
          gap: 4px;
        }
        .metric-card span { color: rgba(226,232,240,0.72); font-size: 12px; }
        .metric-card strong { font-size: 16px; }
        @media (max-width: 600px) {
          .settings-shell-title-block h1 { font-size: 19px; }
          .settings-row { flex-wrap: wrap; }
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

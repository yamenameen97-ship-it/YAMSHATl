import { motion } from 'framer-motion';
import BrandLogo from '../ui/BrandLogo.jsx';

export default function AuthShell({ badge, title, description, footer, alternateAction, children }) {
  return (
    <div className="auth-shell auth-shell-fb" dir="rtl" style={{ fontFamily: "'Noto Sans Arabic', 'Cairo', system-ui, sans-serif" }}>
      <motion.div
        className="auth-card auth-card-fb"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* رأس الصفحة: شعار + اسم المنصة بخط صغير (نمط فيسبوك) */}
        <div className="auth-fb-header">
          <BrandLogo size={44} alt="شعار يام شات" className="auth-fb-logo" />
          <div className="auth-fb-brand-text">
            <span className="auth-fb-brand-name">{badge || 'YAMSHAT'}</span>
            <span className="auth-fb-brand-tagline">{description || 'سجل دخولك للمتابعة'}</span>
          </div>
        </div>

        <div className="auth-form-panel auth-form-panel-fb">
          <motion.div
            className="auth-floating-watermark"
            aria-hidden="true"
            initial={{ opacity: 0, scale: 0.94, rotate: -8 }}
            animate={{ opacity: 0.06, scale: [0.96, 1.04, 0.98], rotate: [-8, -2, -10] }}
            transition={{ duration: 14, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
          >
            <BrandLogo size={260} alt="" className="auth-floating-watermark-logo" shadow={false} />
          </motion.div>

          <div className="auth-form-panel-content auth-form-panel-content-fb">
            {alternateAction ? <div className="auth-switch-row">{alternateAction}</div> : null}
            {children}
            {footer ? <div className="auth-note auth-note-small">{footer}</div> : null}
          </div>
        </div>
      </motion.div>

      <style>{`
        .auth-shell-fb {
          min-height: 100vh;
          display: grid;
          place-items: start center;
          padding: 16px 14px;
          font-family: 'Noto Sans Arabic','Cairo',system-ui,sans-serif;
        }
        .auth-card-fb {
          width: min(420px, 100%);
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 14px 14px 18px;
          border-radius: 18px;
          border: 1px solid var(--line, rgba(148,163,184,0.14));
          background: rgba(7, 12, 24, 0.92);
          box-shadow: 0 18px 44px rgba(2, 6, 23, 0.45);
        }
        .auth-fb-header {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 4px 4px 8px;
          border-bottom: 1px solid rgba(148,163,184,0.08);
        }
        .auth-fb-logo {
          flex-shrink: 0;
        }
        .auth-fb-brand-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }
        .auth-fb-brand-name {
          font-size: 14px;
          font-weight: 700;
          color: #c4b5fd;
          letter-spacing: 0.5px;
        }
        .auth-fb-brand-tagline {
          font-size: 11px;
          color: #94a3b8;
          line-height: 1.4;
        }
        .auth-form-panel-fb {
          padding: 12px;
          border-radius: 14px;
          background: rgba(15, 23, 42, 0.5);
          border: 1px solid rgba(148, 163, 184, 0.08);
          position: relative;
          overflow: hidden;
        }
        .auth-form-panel-content-fb {
          position: relative;
          z-index: 1;
        }
        .auth-note-small {
          font-size: 11px;
          color: #94a3b8;
          margin-top: 8px;
          text-align: center;
        }
        @media (max-width: 480px) {
          .auth-card-fb {
            padding: 12px 12px 16px;
            border-radius: 14px;
          }
          .auth-fb-brand-name { font-size: 13px; }
          .auth-fb-brand-tagline { font-size: 10.5px; }
        }
      `}</style>
    </div>
  );
}

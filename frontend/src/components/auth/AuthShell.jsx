import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const featureItems = [
  { label: 'منشورات وتفاعل', value: 'فيد سريع، إعجابات، تعليقات، وحفظ ومشاركة.' },
  { label: 'محادثات وبث', value: 'دردشة خاصة، مكالمات، وبث مباشر في نفس المشروع.' },
  { label: 'تجربة عربية', value: 'واجهة حديثة RTL مع تصميم زجاجي قريب من ملفات التحديث.' },
];

export default function AuthShell({ badge, title, description, footer, alternateAction, children }) {
  return (
    <div
      className="auth-shell auth-shell-enhanced"
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '24px',
        background:
          'radial-gradient(circle at top left, rgba(139,92,246,0.22), transparent 24%), radial-gradient(circle at bottom right, rgba(6,182,212,0.18), transparent 28%), linear-gradient(180deg, #070b17 0%, #0a1020 100%)',
      }}
    >
      <motion.div
        className="auth-card auth-card-enhanced"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        style={{
          width: 'min(1180px, 100%)',
          display: 'grid',
          gridTemplateColumns: 'minmax(320px, 0.95fr) minmax(420px, 1.05fr)',
          gap: '22px',
          alignItems: 'stretch',
        }}
      >
        <div
          className="auth-copy auth-copy-enhanced"
          style={{
            borderRadius: 34,
            padding: 30,
            background:
              'radial-gradient(circle at top left, rgba(139,92,246,0.22), transparent 26%), radial-gradient(circle at bottom right, rgba(6,182,212,0.2), transparent 30%), rgba(8, 14, 28, 0.92)',
            border: '1px solid rgba(148,163,184,0.16)',
            boxShadow: '0 26px 60px rgba(2, 6, 23, 0.35)',
            backdropFilter: 'blur(20px)',
            display: 'grid',
            alignContent: 'space-between',
            gap: 18,
          }}
        >
          <div>
            <span className="badge" style={{ marginBottom: 16 }}>{badge}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 20,
                  display: 'grid',
                  placeItems: 'center',
                  background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
                  fontSize: 28,
                  boxShadow: '0 16px 36px rgba(139,92,246,0.3)',
                }}
              >
                ✨
              </div>
              <div>
                <div className="page-eyebrow">YAMSHAT</div>
                <strong style={{ fontSize: 24 }}>منصة اجتماعية عصرية</strong>
              </div>
            </div>
            <h1 style={{ marginBottom: 10 }}>{title}</h1>
            <p style={{ margin: 0, color: 'var(--yam-muted)' }}>{description}</p>
          </div>

          <div className="auth-feature-list" style={{ display: 'grid', gap: 12 }}>
            {featureItems.map((item) => (
              <div
                key={item.label}
                className="auth-feature-item"
                style={{
                  borderRadius: 22,
                  padding: 16,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(148,163,184,0.12)',
                }}
              >
                <div className="page-eyebrow" style={{ marginBottom: 8 }}>{item.label}</div>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>

          <div className="auth-side-footer" style={{ display: 'grid', gap: 12 }}>
            <span className="yam-meta">تحديث الواجهة تم دمجه على نفس المشروع مع الحفاظ على الخدمات الأساسية.</span>
            <div className="auth-side-links" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Link to="/login" className="yam-badge">تسجيل الدخول</Link>
              <Link to="/register" className="yam-badge">إنشاء حساب</Link>
              <Link to="/" className="yam-badge">الرئيسية</Link>
            </div>
          </div>
        </div>

        <div
          className="auth-form-panel"
          style={{
            borderRadius: 34,
            padding: 30,
            background: 'rgba(8, 14, 28, 0.9)',
            border: '1px solid rgba(148,163,184,0.16)',
            boxShadow: '0 26px 60px rgba(2, 6, 23, 0.35)',
            backdropFilter: 'blur(20px)',
          }}
        >
          {alternateAction ? <div className="auth-switch-row" style={{ marginBottom: 16 }}>{alternateAction}</div> : null}
          {children}
          {footer ? <div className="auth-note auth-note-large" style={{ marginTop: 16 }}>{footer}</div> : null}
        </div>
      </motion.div>

      <style>{`
        @media (max-width: 920px) {
          .auth-card.auth-card-enhanced {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

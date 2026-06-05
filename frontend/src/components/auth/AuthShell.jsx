import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import BrandLogo from '../ui/BrandLogo.jsx';

const featureItems = [
  { label: 'المشاركة', value: 'منشورات، صور، فيديو، وتفاعل لحظي' },
  { label: 'المجتمع', value: 'ريلز، ستوري، دردشة، وبث مباشر' },
  { label: 'الهوية', value: 'Dark mode + purple glow + Arabic mobile UX' },
];

export default function AuthShell({ badge, title, description, footer, alternateAction, children }) {
  return (
    <div className="auth-shell auth-shell-enhanced">
      <motion.div className="auth-card auth-card-enhanced" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <div className="auth-copy auth-copy-enhanced">
          <div className="auth-brand-lockup">
            <div className="auth-brand-orb" aria-hidden="true">
              <BrandLogo size={76} alt="شعار يام شات الرسمي" className="auth-brand-logo" />
            </div>
            <div className="auth-brand-content">
              <span className="badge">{badge}</span>
              <h1>{title}</h1>
              <p>{description}</p>
            </div>
          </div>

          <div className="auth-feature-list">
            {featureItems.map((item) => (
              <div key={item.label} className="auth-feature-item">
                <span className="auth-feature-label">{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>

          <div className="auth-side-footer">
            <span>واجهة جوال اجتماعية مطورة على نفس المشروع الحالي بالكامل.</span>
            <div className="auth-side-links">
              <Link to="/login">تسجيل الدخول</Link>
              <Link to="/register">إنشاء حساب</Link>
              <Link to="/">الرئيسية</Link>
            </div>
          </div>
        </div>

        <div className="auth-form-panel auth-form-panel-watermarked">
          <motion.div
            className="auth-floating-watermark"
            aria-hidden="true"
            initial={{ opacity: 0, scale: 0.94, rotate: -8 }}
            animate={{ opacity: 0.1, scale: [0.96, 1.04, 0.98], rotate: [-8, -2, -10], y: [0, -14, 6] }}
            transition={{ duration: 12, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
          >
            <BrandLogo size={380} alt="" className="auth-floating-watermark-logo" shadow={false} />
          </motion.div>
          <div className="auth-form-panel-content">
            {alternateAction ? <div className="auth-switch-row">{alternateAction}</div> : null}
            {children}
            {footer ? <div className="auth-note auth-note-large">{footer}</div> : null}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

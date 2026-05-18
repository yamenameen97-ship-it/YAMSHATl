import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

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
          <span className="badge">{badge}</span>
          <h1>{title}</h1>
          <p>{description}</p>

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

        <div className="auth-form-panel">
          {alternateAction ? <div className="auth-switch-row">{alternateAction}</div> : null}
          {children}
          {footer ? <div className="auth-note auth-note-large">{footer}</div> : null}
        </div>
      </motion.div>
    </div>
  );
}

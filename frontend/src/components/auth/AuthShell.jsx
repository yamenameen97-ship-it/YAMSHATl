import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const featureItems = [
  { label: 'ربط مباشر', value: 'API + Socket.io + LiveKit' },
  { label: 'تجربة سريعة', value: 'واجهة React جاهزة للنشر' },
  { label: 'حماية الجلسة', value: 'JWT + Protected Routes' },
];

export default function AuthShell({
  badge,
  title,
  description,
  footer,
  alternateAction,
  children,
}) {
  return (
    <div className="auth-shell auth-shell-enhanced">
      <motion.div
        className="auth-card auth-card-enhanced"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
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
            <span>منصة اجتماعية عصرية بنفس الهوية الداكنة الأنيقة</span>
            <div className="auth-side-links">
              <Link to="/">الرئيسية</Link>
              <Link to="/stories">الستوري</Link>
              <Link to="/live">البث المباشر</Link>
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

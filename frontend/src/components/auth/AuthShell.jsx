import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const featureItems = [
  { label: 'لوحة موحدة', value: 'Dashboard + Users + Content + Reports' },
  { label: 'Realtime', value: 'FastAPI + Socket.io' },
  { label: 'الصلاحيات', value: 'RBAC + Protected Routes' },
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
            <span>نسخة Admin احترافية مبنية على المشروع الحالي بالكامل.</span>
            <div className="auth-side-links">
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
              <Link to="/admin/dashboard">Dashboard</Link>
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

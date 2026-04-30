import { HashRouter, NavLink, Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard.jsx";
import Analytics from "./pages/Analytics.jsx";
import Users from "./pages/Users.jsx";
import Reports from "./pages/Reports.jsx";
import LiveRooms from "./pages/LiveRooms.jsx";
import AuditLogs from "./pages/AuditLogs.jsx";
import "./styles.css";

const links = [
  ["/", "الرئيسية"],
  ["/analytics", "التحليلات"],
  ["/users", "المستخدمين"],
  ["/reports", "البلاغات"],
  ["/live", "البث المباشر"],
  ["/audit", "سجل العمليات"],
];

function Layout({ children }) {
  const now = new Date();
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div>
          <div className="brand-badge">Y</div>
          <h1>Yamshat Admin</h1>
          <p>لوحة تحكم لحظية للإدارة والتحليلات والمراقبة والتدقيق الأمني.</p>
        </div>
        <div className="status-box">
          <span className="live-dot" />
          <div>
            <strong>Live Admin Panel</strong>
            <small>{now.toLocaleString("ar-EG")}</small>
          </div>
        </div>
        <nav className="admin-nav">
          {links.map(([to, label]) => (
            <NavLink key={to} to={to} end={to === "/"} className={({ isActive }) => `admin-link ${isActive ? "active" : ""}`}>
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/users" element={<Users />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/live" element={<LiveRooms />} />
          <Route path="/audit" element={<AuditLogs />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
}

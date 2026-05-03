import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';
import MobileDock from './MobileDock.jsx';

export default function MainLayout({ children }) {
  return (
    <div className="app-shell yamshat-shell">
      <Sidebar />
      <div className="main-shell">
        <Topbar />
        <main className="page-content">
          <div className="page-shell-glow">{children}</div>
        </main>
      </div>
      <MobileDock />
    </div>
  );
}

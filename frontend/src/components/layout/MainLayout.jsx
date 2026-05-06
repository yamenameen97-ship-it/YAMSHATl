import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';
import MobileDock from './MobileDock.jsx';
import { isNativeShell } from '../../utils/runtime.js';

export default function MainLayout({ children }) {
  const nativeShell = isNativeShell();

  return (
    <div className={`app-shell yamshat-shell ${nativeShell ? 'native-shell' : ''}`}>
      {nativeShell ? null : <Sidebar />}
      <div className={`main-shell ${nativeShell ? 'native-shell' : ''}`}>
        {nativeShell ? null : <Topbar />}
        <main className={`page-content ${nativeShell ? 'native-shell' : ''}`}>
          <div className="page-shell-glow">{children}</div>
        </main>
      </div>
      {nativeShell ? null : <MobileDock />}
    </div>
  );
}

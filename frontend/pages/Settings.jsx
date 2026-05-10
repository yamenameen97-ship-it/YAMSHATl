import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import Modal from '../components/ui/Modal.jsx';

const TABS = [
  { key: 'security', label: '🔒 الأمان والحماية' },
  { key: 'privacy', label: '👁️ الخصوصية' },
  { key: 'data', label: '📊 بياناتي' },
  { key: 'notifications', label: '🔔 الإشعارات' },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState('security');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  
  // Security Activity Log
  const [activityLog] = useState([
    { id: 1, event: 'تسجيل دخول ناجح', device: 'Chrome / Windows', location: 'الرياض، السعودية', time: 'منذ ساعتين', status: 'success' },
    { id: 2, event: 'تغيير كلمة المرور', device: 'Safari / iPhone', location: 'جدة، السعودية', time: 'أمس الساعة 10:30 م', status: 'warning' },
    { id: 3, event: 'محاولة دخول مشبوهة', device: 'Firefox / Unknown', location: 'موسكو، روسيا', time: 'منذ 3 أيام', status: 'danger' },
  ]);

  // Privacy Controls
  const [privacy, setPrivacy] = useState({
    profileVisibility: 'public',
    showOnlineStatus: true,
    allowDirectMessages: 'everyone',
    readReceipts: true,
    dataSharing: false,
  });

  // Data Management
  const [exportLoading, setExportLoading] = useState(false);

  const handleExportData = () => {
    setExportLoading(true);
    // Simulate data preparation
    setTimeout(() => {
      setExportLoading(false);
      setSuccess('يتم تجهيز بياناتك الآن. ستتلقى رابط التحميل عبر البريد الإلكتروني خلال دقائق.');
    }, 2000);
  };

  const handleSavePrivacy = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess('تم تحديث إعدادات الخصوصية بنجاح.');
    }, 1000);
  };

  return (
    <MainLayout>
      <div className="settings-container">
        <div className="settings-header">
          <h1>إعدادات الحساب</h1>
          <p className="muted">تحكم في أمانك، خصوصيتك، وبياناتك في مكان واحد.</p>
        </div>

        <div className="settings-layout">
          <aside className="settings-sidebar">
            {TABS.map(tab => (
              <button 
                key={tab.key}
                className={`tab-nav-item ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </aside>

          <main className="settings-content">
            {success && <div className="settings-alert success">{success}</div>}

            {activeTab === 'security' && (
              <div className="tab-pane animate-fade-in">
                <Card title="سجل نشاط الأمان">
                  <p className="muted mb-4">راقب الأجهزة والمواقع التي سجلت الدخول إلى حسابك.</p>
                  <div className="activity-timeline">
                    {activityLog.map(log => (
                      <div key={log.id} className={`activity-log-item ${log.status}`}>
                        <div className="log-icon">{log.status === 'danger' ? '⚠️' : '🛡️'}</div>
                        <div className="log-details">
                          <div className="log-header">
                            <strong>{log.event}</strong>
                            <span className="log-time">{log.time}</span>
                          </div>
                          <p>{log.device} • {log.location}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button variant="secondary" className="mt-4">تسجيل الخروج من جميع الأجهزة الأخرى</Button>
                </Card>

                <Card title="المصادقة الثنائية (2FA)" className="mt-4">
                  <div className="flex-between">
                    <div>
                      <strong>تأمين الحساب بخطوتين</strong>
                      <p className="muted">أضف طبقة حماية إضافية باستخدام تطبيق المصادقة.</p>
                    </div>
                    <div className="toggle-switch active">مفعل</div>
                  </div>
                </Card>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="tab-pane animate-fade-in">
                <Card title="إعدادات الخصوصية الكاملة">
                  <div className="privacy-options">
                    <div className="option-group">
                      <label>ظهور الملف الشخصي</label>
                      <select 
                        value={privacy.profileVisibility} 
                        onChange={e => setPrivacy({...privacy, profileVisibility: e.target.value})}
                      >
                        <option value="public">عام (للجميع)</option>
                        <option value="friends">للأصدقاء فقط</option>
                        <option value="private">خاص (أنا فقط)</option>
                      </select>
                    </div>

                    <div className="option-toggle mt-4">
                      <div className="flex-between">
                        <div>
                          <strong>حالة الاتصال</strong>
                          <p className="muted">السماح للآخرين برؤية متى تكون متصلاً.</p>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={privacy.showOnlineStatus} 
                          onChange={e => setPrivacy({...privacy, showOnlineStatus: e.target.checked})} 
                        />
                      </div>
                    </div>

                    <div className="option-toggle mt-4">
                      <div className="flex-between">
                        <div>
                          <strong>مؤشرات القراءة</strong>
                          <p className="muted">إذا أوقفت هذا الخيار، لن تتمكن من رؤية مؤشرات القراءة للآخرين.</p>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={privacy.readReceipts} 
                          onChange={e => setPrivacy({...privacy, readReceipts: e.target.checked})} 
                        />
                      </div>
                    </div>

                    <div className="option-toggle mt-4">
                      <div className="flex-between">
                        <div>
                          <strong>تحسين التجربة (مشاركة البيانات)</strong>
                          <p className="muted">مشاركة بيانات الاستخدام المجهولة لتحسين التطبيق.</p>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={privacy.dataSharing} 
                          onChange={e => setPrivacy({...privacy, dataSharing: e.target.checked})} 
                        />
                      </div>
                    </div>
                  </div>
                  <Button onClick={handleSavePrivacy} loading={loading} className="mt-6">حفظ التغييرات</Button>
                </Card>
              </div>
            )}

            {activeTab === 'data' && (
              <div className="tab-pane animate-fade-in">
                <Card title="إدارة بياناتك">
                  <div className="data-management">
                    <div className="data-action-card">
                      <div className="action-icon">📥</div>
                      <div className="action-text">
                        <h4>تحميل بياناتي</h4>
                        <p className="muted">احصل على نسخة كاملة من منشوراتك، صورك، وإعداداتك بصيغة JSON و ZIP.</p>
                        <Button 
                          variant="secondary" 
                          onClick={handleExportData} 
                          loading={exportLoading}
                          className="mt-2"
                        >
                          بدء التصدير
                        </Button>
                      </div>
                    </div>

                    <div className="data-action-card mt-4 danger-zone">
                      <div className="action-icon">🗑️</div>
                      <div className="action-text">
                        <h4>حذف الحساب نهائياً</h4>
                        <p className="muted">سيتم حذف جميع بياناتك ولا يمكن التراجع عن هذا الإجراء.</p>
                        <Button variant="danger" className="mt-2">حذف حسابي</Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </main>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .settings-container { max-width: 1000px; margin: 0 auto; padding: 20px; }
        .settings-header { margin-bottom: 30px; }
        .settings-layout { display: grid; grid-template-columns: 250px 1fr; gap: 30px; }
        .settings-sidebar { display: flex; flex-direction: column; gap: 5px; }
        .tab-nav-item { 
          padding: 12px 15px; border: none; background: transparent; text-align: right; 
          border-radius: 8px; cursor: pointer; transition: all 0.2s; font-size: 15px;
        }
        .tab-nav-item:hover { background: #f3f4f6; }
        .tab-nav-item.active { background: #3b82f6; color: white; font-weight: bold; }
        .activity-timeline { display: flex; flex-direction: column; gap: 15px; margin-top: 15px; }
        .activity-log-item { display: flex; gap: 15px; padding: 15px; background: #f9fafb; border-radius: 10px; border-right: 4px solid #e5e7eb; }
        .activity-log-item.success { border-right-color: #10b981; }
        .activity-log-item.warning { border-right-color: #f59e0b; }
        .activity-log-item.danger { border-right-color: #ef4444; }
        .log-icon { font-size: 20px; }
        .log-header { display: flex; justify-content: space-between; margin-bottom: 5px; }
        .log-time { font-size: 12px; color: #9ca3af; }
        .settings-alert { padding: 15px; border-radius: 8px; margin-bottom: 20px; }
        .settings-alert.success { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
        .data-action-card { display: flex; gap: 20px; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; }
        .danger-zone { border-color: #fee2e2; background: #fffafb; }
        .action-icon { font-size: 30px; }
        .flex-between { display: flex; justify-content: space-between; align-items: center; }
        .mt-4 { margin-top: 1rem; }
        .mt-6 { margin-top: 1.5rem; }
        .mb-4 { margin-bottom: 1rem; }
        @media (max-width: 768px) { .settings-layout { grid-template-columns: 1fr; } }
      `}} />
    </MainLayout>
  );
}

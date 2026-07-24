import { useState, useMemo, useEffect } from 'react';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';

export default function AdminLogs() {
  const [logs, setLogs] = useState([
    {
      id: 1,
      type: 'security',
      level: 'critical',
      message: 'محاولة دخول فاشلة متكررة من IP: 192.168.1.50',
      user: 'unknown',
      timestamp: '2024-05-10 15:30:22',
      details: 'تم حظر الـ IP تلقائياً بعد 5 محاولات فاشلة.'
    },
    {
      id: 2,
      type: 'audit',
      level: 'info',
      message: 'تغيير صلاحيات المستخدم @user_5 إلى Moderator',
      user: 'admin_1',
      timestamp: '2024-05-10 15:25:10',
      details: 'قام المسؤول admin_1 بتغيير الصلاحيات بناءً على طلب الإدارة.'
    },
    {
      id: 3,
      type: 'error',
      level: 'warning',
      message: 'فشل في الاتصال بـ API البث المباشر',
      user: 'system',
      timestamp: '2024-05-10 15:20:05',
      details: 'خطأ في الاستجابة من الخادم الخارجي (Timeout).'
    },
    {
      id: 4,
      type: 'security',
      level: 'high',
      message: 'تغيير كلمة مرور المسؤول الرئيسي',
      user: 'super_admin',
      timestamp: '2024-05-10 15:15:00',
      details: 'تم تغيير كلمة المرور بنجاح عبر MFA.'
    },
    {
      id: 5,
      type: 'audit',
      level: 'info',
      message: 'حذف منشور رقم #5432',
      user: 'moderator_2',
      timestamp: '2024-05-10 15:10:45',
      details: 'السبب: محتوى مخالف لسياسة النشر.'
    }
  ]);

  const [activeTab, setActiveTab] = useState('all');
  const [selectedLog, setSelectedLog] = useState(null);
  const [isLive, setIsLive] = useState(true);

  // Simulate live monitoring
  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => {
      const newLog = {
        id: Date.now(),
        type: ['security', 'audit', 'error'][Math.floor(Math.random() * 3)],
        level: ['info', 'warning', 'high', 'critical'][Math.floor(Math.random() * 4)],
        message: 'عملية نظام دورية - مراقبة حية نشطة',
        user: 'system',
        timestamp: new Date().toLocaleString('ar-EG'),
        details: 'تفاصيل العملية التلقائية المكتشفة بواسطة نظام المراقبة.'
      };
      setLogs(prev => [newLog, ...prev.slice(0, 49)]);
    }, 5000);
    return () => clearInterval(interval);
  }, [isLive]);

  const filteredLogs = useMemo(() => {
    if (activeTab === 'all') return logs;
    return logs.filter(log => log.type === activeTab);
  }, [logs, activeTab]);

  const getLevelColor = (level) => {
    const colors = {
      'critical': '#dc2626',
      'high': '#ef4444',
      'warning': '#f59e0b',
      'info': '#3b82f6'
    };
    return colors[level] || '#64748b';
  };

  const getTypeIcon = (type) => {
    const icons = {
      'security': '🛡️',
      'audit': '📝',
      'error': '❌'
    };
    return icons[type] || '📄';
  };

  return (
    <div className="admin-logs-page">
      <Card className="logs-header-card">
        <div className="flex-between">
          <div>
            <h2>مركز السجلات والمراقبة</h2>
            <p className="muted">مراقبة حية للعمليات الحساسة، سجلات الأمان، الأخطاء، ومراجعة العمليات.</p>
          </div>
          <div className="header-actions">
            <Button 
              variant={isLive ? 'success' : 'secondary'} 
              onClick={() => setIsLive(!isLive)}
              className="live-btn"
            >
              {isLive ? '🔴 مراقبة حية نشطة' : '⚪ المراقبة متوقفة'}
            </Button>
            <Button variant="outline">تصدير السجلات (ملف CSV)</Button>
          </div>
        </div>
      </Card>

      <div className="logs-tabs mt-4">
        <button className={activeTab === 'all' ? 'active' : ''} onClick={() => setActiveTab('all')}>الكل</button>
        <button className={activeTab === 'security' ? 'active' : ''} onClick={() => setActiveTab('security')}>🛡️ الأمان</button>
        <button className={activeTab === 'audit' ? 'active' : ''} onClick={() => setActiveTab('audit')}>📝 المراجعة</button>
        <button className={activeTab === 'error' ? 'active' : ''} onClick={() => setActiveTab('error')}>❌ الأخطاء</button>
      </div>

      <Card className="logs-table-card mt-4">
        <div className="logs-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>النوع</th>
                <th>المستوى</th>
                <th>الرسالة</th>
                <th>المسؤول</th>
                <th>الوقت</th>
                <th>الإجراء</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map(log => (
                <tr key={log.id} className={`log-row level-${log.level}`}>
                  <td><span className="type-icon">{getTypeIcon(log.type)}</span> {log.type.toUpperCase()}</td>
                  <td>
                    <span className="level-badge" style={{ background: getLevelColor(log.level) + '20', color: getLevelColor(log.level) }}>
                      {log.level.toUpperCase()}
                    </span>
                  </td>
                  <td className="msg-cell">{log.message}</td>
                  <td><strong>{log.user}</strong></td>
                  <td className="time-cell">{log.timestamp}</td>
                  <td>
                    <Button size="small" variant="secondary" onClick={() => setSelectedLog(log)}>التفاصيل</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Log Details Modal */}
      <Modal 
        open={!!selectedLog} 
        onClose={() => setSelectedLog(null)} 
        title="تفاصيل السجل التقنية"
      >
        {selectedLog && (
          <div className="log-details">
            <div className="detail-header" style={{ borderRight: `5px solid ${getLevelColor(selectedLog.level)}` }}>
              <h4>{selectedLog.message}</h4>
              <div className="detail-meta">
                <span>النوع: {selectedLog.type}</span>
                <span>المستوى: {selectedLog.level}</span>
                <span>الوقت: {selectedLog.timestamp}</span>
              </div>
            </div>
            <div className="detail-body mt-4">
              <label>المسؤول / النظام:</label>
              <p><strong>{selectedLog.user}</strong></p>
              
              <label className="mt-3">الوصف التقني:</label>
              <div className="details-box">
                {selectedLog.details}
              </div>

              <label className="mt-3">بيانات إضافية (بصيغة JSON):</label>
              <pre className="json-box">
                {JSON.stringify({
                  id: selectedLog.id,
                  ip: '192.168.1.XX',
                  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)...',
                  fingerprint: 'a7b8c9d0e1f2g3h4i5j6k7l8m9n0o1p2',
                  action_path: '/admin/api/v1/sensitive-op'
                }, null, 2)}
              </pre>
            </div>
            <div className="detail-actions mt-4">
              <Button variant="danger">اتخاذ إجراء أمني</Button>
              <Button variant="secondary" onClick={() => setSelectedLog(null)}>إغلاق</Button>
            </div>
          </div>
        )}
      </Modal>

      <style dangerouslySetInnerHTML={{ __html: `
        .admin-logs-page { padding: 20px; }
        .flex-between { display: flex; justify-content: space-between; align-items: center; }
        .mt-4 { margin-top: 1rem; }
        .mt-3 { margin-top: 0.75rem; }
        .muted { color: #64748b; font-size: 14px; }
        
        .header-actions { display: flex; gap: 12px; }
        .live-btn { font-weight: bold; }
        
        .logs-tabs { display: flex; gap: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 1px; }
        .logs-tabs button { padding: 8px 16px; border: none; background: none; cursor: pointer; font-size: 14px; color: #64748b; border-bottom: 2px solid transparent; transition: all 0.2s; }
        .logs-tabs button:hover { color: #1e293b; background: #f8fafc; }
        .logs-tabs button.active { color: #3b82f6; border-bottom-color: #3b82f6; font-weight: bold; }
        
        .logs-table-container { overflow-x: auto; }
        .admin-table { width: 100%; border-collapse: collapse; }
        .admin-table th, .admin-table td { padding: 12px; text-align: right; border-bottom: 1px solid #f1f5f9; }
        .admin-table th { background: #f8fafc; color: #64748b; font-size: 12px; }
        
        .log-row { transition: background 0.2s; }
        .log-row:hover { background: #f8fafc; }
        .log-row.level-critical { background: #fff1f2; }
        
        .level-badge { padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; }
        .msg-cell { max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13px; }
        .time-cell { font-size: 12px; color: #64748b; font-family: monospace; }
        .type-icon { margin-left: 4px; }
        
        .log-details { padding: 10px 0; }
        .detail-header { padding: 12px; background: #f8fafc; border-radius: 0 8px 8px 0; }
        .detail-header h4 { margin: 0; color: #1e293b; }
        .detail-meta { display: flex; gap: 16px; margin-top: 8px; font-size: 12px; color: #64748b; }
        
        .detail-body label { display: block; font-size: 12px; font-weight: bold; color: #64748b; margin-bottom: 4px; }
        .details-box, .json-box { background: #f8fafc; padding: 12px; border-radius: 8px; font-size: 13px; border: 1px solid #e2e8f0; }
        .json-box { font-family: monospace; color: #0369a1; overflow-x: auto; }
        
        .detail-actions { display: flex; gap: 10px; justify-content: flex-end; }
      `}} />
    </div>
  );
}

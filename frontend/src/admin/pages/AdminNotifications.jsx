import { useState, useMemo } from 'react';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import Modal from '../../components/ui/Modal.jsx';

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'مرحباً بك في YAMSHAT',
      body: 'شكراً لانضمامك إلينا',
      segment: 'all',
      status: 'sent',
      createdAt: '2024-05-10 14:20',
      scheduledAt: null,
      sentAt: '2024-05-10 14:22',
      totalSent: 15234,
      delivered: 14890,
      opened: 8934,
      clicked: 3421,
      failed: 344,
      openRate: 60.1,
      clickRate: 22.9
    },
    {
      id: 2,
      title: 'عرض خاص: خصم 50%',
      body: 'احصل على خصم 50% على جميع الخدمات المميزة',
      segment: 'premium',
      status: 'scheduled',
      createdAt: '2024-05-10 10:00',
      scheduledAt: '2024-05-15 18:00',
      sentAt: null,
      totalSent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      failed: 0,
      openRate: 0,
      clickRate: 0
    },
    {
      id: 3,
      title: 'تحديث جديد متاح',
      body: 'قم بتحديث التطبيق للحصول على أحدث الميزات',
      segment: 'active',
      status: 'sent',
      createdAt: '2024-05-09 12:00',
      scheduledAt: null,
      sentAt: '2024-05-09 12:05',
      totalSent: 3421,
      delivered: 3350,
      opened: 2010,
      clicked: 890,
      failed: 71,
      openRate: 60.0,
      clickRate: 26.5
    },
    {
      id: 4,
      title: 'استطلاع رأيك مهم لنا',
      body: 'شارك رأيك في تحسين خدماتنا',
      segment: 'inactive',
      status: 'draft',
      createdAt: '2024-05-10 15:00',
      scheduledAt: null,
      sentAt: null,
      totalSent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      failed: 0,
      openRate: 0,
      clickRate: 0
    }
  ]);

  const [formModal, setFormModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSegment, setFilterSegment] = useState('all');
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    segment: 'all',
    scheduledAt: '',
    imageUrl: ''
  });

  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      const matchesStatus = filterStatus === 'all' || n.status === filterStatus;
      const matchesSegment = filterSegment === 'all' || n.segment === filterSegment;
      return matchesStatus && matchesSegment;
    });
  }, [notifications, filterStatus, filterSegment]);

  const handleCreateNotification = () => {
    if (!formData.title || !formData.body) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    const newNotification = {
      id: Math.max(...notifications.map(n => n.id), 0) + 1,
      ...formData,
      status: formData.scheduledAt ? 'scheduled' : 'draft',
      createdAt: new Date().toLocaleString('ar-EG'),
      scheduledAt: formData.scheduledAt || null,
      sentAt: null,
      totalSent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      failed: 0,
      openRate: 0,
      clickRate: 0
    };

    setNotifications([newNotification, ...notifications]);
    setFormData({ title: '', body: '', segment: 'all', scheduledAt: '', imageUrl: '' });
    setFormModal(false);
  };

  const handleSendNotification = (notificationId) => {
    setNotifications(prev => prev.map(n => 
      n.id === notificationId 
        ? {
            ...n,
            status: 'sent',
            sentAt: new Date().toLocaleString('ar-EG'),
            totalSent: Math.floor(Math.random() * 10000 + 5000),
            delivered: Math.floor(Math.random() * 9000 + 4000),
            opened: Math.floor(Math.random() * 5000 + 2000),
            clicked: Math.floor(Math.random() * 2000 + 500),
            failed: Math.floor(Math.random() * 500 + 100),
            openRate: (Math.random() * 40 + 50).toFixed(1),
            clickRate: (Math.random() * 30 + 10).toFixed(1)
          }
        : n
    ));
  };

  const handleDeleteNotification = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const getStatusColor = (status) => {
    const colors = {
      'sent': '#10b981',
      'scheduled': '#3b82f6',
      'draft': '#64748b',
      'failed': '#ef4444'
    };
    return colors[status] || '#64748b';
  };

  const getSegmentLabel = (segment) => {
    const labels = {
      'all': 'جميع المستخدمين',
      'active': 'المستخدمون النشطون',
      'inactive': 'المستخدمون غير النشطين',
      'premium': 'المستخدمون المميزون',
      'new': 'المستخدمون الجدد'
    };
    return labels[segment] || segment;
  };

  const notificationStats = useMemo(() => ({
    total: notifications.length,
    sent: notifications.filter(n => n.status === 'sent').length,
    scheduled: notifications.filter(n => n.status === 'scheduled').length,
    draft: notifications.filter(n => n.status === 'draft').length,
    totalDelivered: notifications.reduce((sum, n) => sum + n.delivered, 0),
    avgOpenRate: (notifications.filter(n => n.status === 'sent').reduce((sum, n) => sum + parseFloat(n.openRate), 0) / Math.max(notifications.filter(n => n.status === 'sent').length, 1)).toFixed(1)
  }), [notifications]);

  return (
    <div className="admin-notifications-page">
      <Card className="notifications-header-card">
        <div className="flex-between">
          <div>
            <h2>إدارة الإشعارات</h2>
            <p className="muted">جدولة الإشعارات، إرسال جماعي، تقسيم حسب الفئة، وتتبع الأداء.</p>
          </div>
          <Button 
            variant="primary" 
            onClick={() => setFormModal(true)}
          >
            + إنشاء إشعار جديد
          </Button>
        </div>
      </Card>

      <Card className="notifications-stats-card mt-4">
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-value">{notificationStats.total}</div>
            <div className="stat-label">إجمالي الإشعارات</div>
          </div>
          <div className="stat-item">
            <div className="stat-value" style={{ color: '#10b981' }}>{notificationStats.sent}</div>
            <div className="stat-label">مرسلة</div>
          </div>
          <div className="stat-item">
            <div className="stat-value" style={{ color: '#3b82f6' }}>{notificationStats.scheduled}</div>
            <div className="stat-label">مجدولة</div>
          </div>
          <div className="stat-item">
            <div className="stat-value" style={{ color: '#64748b' }}>{notificationStats.draft}</div>
            <div className="stat-label">مسودات</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{notificationStats.totalDelivered.toLocaleString('ar-EG')}</div>
            <div className="stat-label">إجمالي التسليمات</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{notificationStats.avgOpenRate}%</div>
            <div className="stat-label">متوسط معدل الفتح</div>
          </div>
        </div>
      </Card>

      <Card className="notifications-filters-card mt-4">
        <div className="filters-row">
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">جميع الحالات</option>
            <option value="sent">مرسلة</option>
            <option value="scheduled">مجدولة</option>
            <option value="draft">مسودات</option>
            <option value="failed">فاشلة</option>
          </select>
          <select 
            value={filterSegment} 
            onChange={(e) => setFilterSegment(e.target.value)}
            className="filter-select"
          >
            <option value="all">جميع الفئات</option>
            <option value="all">جميع المستخدمين</option>
            <option value="active">المستخدمون النشطون</option>
            <option value="inactive">المستخدمون غير النشطين</option>
            <option value="premium">المستخدمون المميزون</option>
            <option value="new">المستخدمون الجدد</option>
          </select>
        </div>
      </Card>

      <div className="notifications-list mt-4">
        {filteredNotifications.map(notification => (
          <Card key={notification.id} className={`notification-item notification-${notification.status}`}>
            <div className="notification-header">
              <div className="notification-main">
                <div className="notification-title">
                  <strong>{notification.title}</strong>
                  <span className="status-badge" style={{ background: getStatusColor(notification.status) + '20', color: getStatusColor(notification.status) }}>
                    {notification.status === 'sent' ? 'مرسلة' : notification.status === 'scheduled' ? 'مجدولة' : notification.status === 'draft' ? 'مسودة' : 'فاشلة'}
                  </span>
                </div>
                <p className="notification-body">{notification.body}</p>
                <div className="notification-meta">
                  <span>📋 {getSegmentLabel(notification.segment)}</span>
                  <span>📅 {notification.createdAt}</span>
                  {notification.scheduledAt && <span>⏰ مجدول: {notification.scheduledAt}</span>}
                </div>
              </div>
            </div>

            {notification.status === 'sent' && (
              <div className="notification-analytics">
                <div className="analytics-grid">
                  <div className="analytics-item">
                    <div className="analytics-label">تم الإرسال</div>
                    <div className="analytics-value">{notification.totalSent.toLocaleString('ar-EG')}</div>
                  </div>
                  <div className="analytics-item">
                    <div className="analytics-label">تم التسليم</div>
                    <div className="analytics-value">{notification.delivered.toLocaleString('ar-EG')}</div>
                  </div>
                  <div className="analytics-item">
                    <div className="analytics-label">تم الفتح</div>
                    <div className="analytics-value">{notification.opened.toLocaleString('ar-EG')}</div>
                  </div>
                  <div className="analytics-item">
                    <div className="analytics-label">تم النقر</div>
                    <div className="analytics-value">{notification.clicked.toLocaleString('ar-EG')}</div>
                  </div>
                  <div className="analytics-item">
                    <div className="analytics-label">معدل الفتح</div>
                    <div className="analytics-value">{notification.openRate}%</div>
                  </div>
                  <div className="analytics-item">
                    <div className="analytics-label">معدل النقر</div>
                    <div className="analytics-value">{notification.clickRate}%</div>
                  </div>
                </div>

                <div className="analytics-bars mt-3">
                  <div className="bar-item">
                    <span className="bar-label">معدل التسليم</span>
                    <div className="bar">
                      <div 
                        className="bar-fill" 
                        style={{ width: `${(notification.delivered / notification.totalSent * 100).toFixed(0)}%`, background: '#10b981' }}
                      />
                    </div>
                  </div>
                  <div className="bar-item">
                    <span className="bar-label">معدل الفتح</span>
                    <div className="bar">
                      <div 
                        className="bar-fill" 
                        style={{ width: `${notification.openRate}%`, background: '#3b82f6' }}
                      />
                    </div>
                  </div>
                  <div className="bar-item">
                    <span className="bar-label">معدل النقر</span>
                    <div className="bar">
                      <div 
                        className="bar-fill" 
                        style={{ width: `${notification.clickRate}%`, background: '#f59e0b' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="notification-actions">
              <Button 
                size="small" 
                variant="secondary" 
                onClick={() => setSelectedNotification(notification)}
              >
                عرض التفاصيل
              </Button>
              {notification.status === 'draft' && (
                <Button 
                  size="small" 
                  variant="primary" 
                  onClick={() => handleSendNotification(notification.id)}
                >
                  إرسال الآن
                </Button>
              )}
              {notification.status === 'scheduled' && (
                <Button 
                  size="small" 
                  variant="primary" 
                  onClick={() => handleSendNotification(notification.id)}
                >
                  إرسال فوري
                </Button>
              )}
              <Button 
                size="small" 
                variant="danger" 
                onClick={() => handleDeleteNotification(notification.id)}
              >
                حذف
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Create/Edit Notification Modal */}
      <Modal 
        open={formModal} 
        onClose={() => setFormModal(false)} 
        title="إنشاء إشعار جديد"
        size="large"
      >
        <div className="notification-form">
          <div className="form-group">
            <label>عنوان الإشعار</label>
            <Input 
              placeholder="أدخل عنوان الإشعار..."
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>نص الإشعار</label>
            <textarea 
              placeholder="أدخل نص الإشعار..."
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              className="form-textarea"
              rows="4"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>الفئة المستهدفة</label>
              <select 
                value={formData.segment}
                onChange={(e) => setFormData({ ...formData, segment: e.target.value })}
                className="form-select"
              >
                <option value="all">جميع المستخدمين</option>
                <option value="active">المستخدمون النشطون</option>
                <option value="inactive">المستخدمون غير النشطين</option>
                <option value="premium">المستخدمون المميزون</option>
                <option value="new">المستخدمون الجدد</option>
              </select>
            </div>

            <div className="form-group">
              <label>جدولة الإرسال (اختياري)</label>
              <input 
                type="datetime-local"
                value={formData.scheduledAt}
                onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label>رابط الصورة (اختياري)</label>
            <Input 
              placeholder="https://example.com/image.jpg"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              className="form-input"
            />
          </div>

          <div className="form-preview">
            <h4>معاينة الإشعار</h4>
            <div className="preview-box">
              <div className="preview-title">{formData.title || 'عنوان الإشعار'}</div>
              <div className="preview-body">{formData.body || 'نص الإشعار'}</div>
              <div className="preview-segment">
                <small>{getSegmentLabel(formData.segment)}</small>
              </div>
            </div>
          </div>

          <div className="form-buttons">
            <Button 
              variant="primary" 
              onClick={handleCreateNotification}
            >
              {formData.scheduledAt ? 'جدولة الإشعار' : 'إنشاء الإشعار'}
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => setFormModal(false)}
            >
              إلغاء
            </Button>
          </div>
        </div>
      </Modal>

      {/* Notification Details Modal */}
      <Modal 
        open={!!selectedNotification} 
        onClose={() => setSelectedNotification(null)} 
        title={`تفاصيل الإشعار: ${selectedNotification?.title}`}
        size="large"
      >
        <div className="notification-details">
          <div className="detail-section">
            <h4>معلومات الإشعار</h4>
            <div className="detail-grid">
              <div className="detail-item">
                <label>العنوان</label>
                <span>{selectedNotification?.title}</span>
              </div>
              <div className="detail-item">
                <label>الحالة</label>
                <span style={{ color: getStatusColor(selectedNotification?.status), fontWeight: 'bold' }}>
                  {selectedNotification?.status === 'sent' ? 'مرسلة' : selectedNotification?.status === 'scheduled' ? 'مجدولة' : selectedNotification?.status === 'draft' ? 'مسودة' : 'فاشلة'}
                </span>
              </div>
              <div className="detail-item">
                <label>الفئة المستهدفة</label>
                <span>{getSegmentLabel(selectedNotification?.segment)}</span>
              </div>
              <div className="detail-item">
                <label>تاريخ الإنشاء</label>
                <span>{selectedNotification?.createdAt}</span>
              </div>
            </div>
          </div>

          <div className="detail-section mt-4">
            <h4>النص</h4>
            <p className="detail-text">{selectedNotification?.body}</p>
          </div>

          {selectedNotification?.status === 'sent' && (
            <div className="detail-section mt-4">
              <h4>إحصائيات الأداء</h4>
              <div className="detail-grid">
                <div className="detail-item">
                  <label>تم الإرسال</label>
                  <span>{selectedNotification?.totalSent.toLocaleString('ar-EG')}</span>
                </div>
                <div className="detail-item">
                  <label>تم التسليم</label>
                  <span>{selectedNotification?.delivered.toLocaleString('ar-EG')}</span>
                </div>
                <div className="detail-item">
                  <label>تم الفتح</label>
                  <span>{selectedNotification?.opened.toLocaleString('ar-EG')}</span>
                </div>
                <div className="detail-item">
                  <label>تم النقر</label>
                  <span>{selectedNotification?.clicked.toLocaleString('ar-EG')}</span>
                </div>
                <div className="detail-item">
                  <label>معدل الفتح</label>
                  <span>{selectedNotification?.openRate}%</span>
                </div>
                <div className="detail-item">
                  <label>معدل النقر</label>
                  <span>{selectedNotification?.clickRate}%</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>

      <style dangerouslySetInnerHTML={{ __html: `
        .admin-notifications-page { padding: 20px; }
        .flex-between { display: flex; justify-content: space-between; align-items: center; }
        .mt-4 { margin-top: 1rem; }
        .mt-3 { margin-top: 0.75rem; }
        .muted { color: #64748b; font-size: 14px; }
        
        .notifications-stats-card { padding: 20px; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 16px; }
        .stat-item { text-align: center; padding: 12px; background: #f8fafc; border-radius: 8px; }
        .stat-value { font-size: 20px; font-weight: bold; }
        .stat-label { font-size: 11px; color: #64748b; margin-top: 4px; }
        
        .notifications-filters-card { padding: 16px; }
        .filters-row { display: flex; gap: 12px; }
        .filter-select { flex: 1; padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 14px; }
        
        .notifications-list { display: grid; gap: 16px; }
        .notification-item { padding: 16px; border-left: 4px solid #e2e8f0; }
        .notification-item.notification-sent { border-left-color: #10b981; background: #f0fdf4; }
        .notification-item.notification-scheduled { border-left-color: #3b82f6; background: #eff6ff; }
        .notification-item.notification-draft { border-left-color: #64748b; background: #f8fafc; }
        
        .notification-header { margin-bottom: 12px; }
        .notification-title { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
        .status-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; }
        .notification-body { font-size: 14px; color: #334155; margin: 8px 0; }
        .notification-meta { display: flex; gap: 12px; font-size: 12px; color: #64748b; flex-wrap: wrap; }
        
        .notification-analytics { padding: 12px; background: #f8fafc; border-radius: 6px; margin: 12px 0; }
        .analytics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 12px; }
        .analytics-item { text-align: center; padding: 8px; background: white; border-radius: 4px; }
        .analytics-label { font-size: 11px; color: #64748b; }
        .analytics-value { font-size: 16px; font-weight: bold; color: #1e293b; }
        
        .analytics-bars { display: flex; flex-direction: column; gap: 12px; }
        .bar-item { display: flex; align-items: center; gap: 12px; }
        .bar-label { font-size: 12px; color: #64748b; min-width: 80px; }
        .bar { flex: 1; height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; }
        .bar-fill { height: 100%; transition: all 0.3s ease; }
        
        .notification-actions { display: flex; gap: 8px; flex-wrap: wrap; }
        
        .notification-form { padding: 20px 0; }
        .form-group { margin-bottom: 16px; }
        .form-group label { display: block; font-size: 12px; color: #64748b; margin-bottom: 6px; font-weight: bold; }
        .form-input { width: 100%; padding: 8px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 14px; }
        .form-textarea { width: 100%; padding: 8px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 14px; font-family: inherit; }
        .form-select { width: 100%; padding: 8px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 14px; }
        
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        
        .form-preview { padding: 12px; background: #f8fafc; border-radius: 6px; margin: 16px 0; }
        .form-preview h4 { margin: 0 0 12px 0; }
        .preview-box { padding: 12px; background: white; border-radius: 4px; border: 1px solid #e2e8f0; }
        .preview-title { font-weight: bold; margin-bottom: 8px; }
        .preview-body { font-size: 13px; color: #64748b; margin-bottom: 8px; }
        .preview-segment { font-size: 11px; color: #94a3b8; }
        
        .form-buttons { display: flex; gap: 8px; margin-top: 16px; }
        
        .notification-details { padding: 20px 0; }
        .detail-section { padding: 16px; background: #f8fafc; border-radius: 8px; }
        .detail-section h4 { margin: 0 0 12px 0; }
        .detail-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
        .detail-item { display: flex; flex-direction: column; }
        .detail-item label { font-size: 12px; color: #64748b; margin-bottom: 4px; font-weight: bold; }
        .detail-item span { font-size: 14px; color: #1e293b; }
        .detail-text { font-size: 14px; line-height: 1.6; color: #334155; }
      `}} />
    </div>
  );
}

import { useState, useMemo } from 'react';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';

/**
 * ModerationDashboard Component
 * 
 * لوحة الإشراف والمراقبة تتضمن:
 * - قائمة التقارير
 * - إدارة الحظر
 * - مراجعة المحتوى
 * - إجراءات الإشراف
 */
export default function ModerationDashboard() {
  const [activeTab, setActiveTab] = useState('reports'); // reports, bans, content
  const [selectedReport, setSelectedReport] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all'); // all, pending, resolved

  // Mock data - Replace with real API calls
  const reports = useMemo(() => [
    {
      id: 1,
      type: 'spam',
      reporter: 'أحمد محمد',
      reportedUser: 'محمد علي',
      reportedPost: 'منشور مريب...',
      reason: 'محتوى مزعج',
      status: 'pending',
      date: new Date(Date.now() - 2 * 60000),
      evidence: 'رابط الملف',
    },
    {
      id: 2,
      type: 'harassment',
      reporter: 'فاطمة أحمد',
      reportedUser: 'علي محمد',
      reportedPost: 'تعليق مسيء',
      reason: 'تحرش وإساءة',
      status: 'resolved',
      date: new Date(Date.now() - 1 * 60 * 60000),
      evidence: 'لقطة الشاشة',
    },
    {
      id: 3,
      type: 'inappropriate',
      reporter: 'سارة خالد',
      reportedUser: 'محمود حسن',
      reportedPost: 'صورة غير لائقة',
      reason: 'محتوى غير لائق',
      status: 'pending',
      date: new Date(Date.now() - 30 * 60000),
      evidence: 'الصورة الأصلية',
    },
  ], []);

  const bans = useMemo(() => [
    {
      id: 1,
      username: 'user123',
      reason: 'انتهاك متكرر',
      duration: 'دائم',
      date: new Date(Date.now() - 7 * 24 * 60 * 60000),
      status: 'active',
    },
    {
      id: 2,
      username: 'spammer456',
      reason: 'بث محتوى مزعج',
      duration: '30 يوم',
      date: new Date(Date.now() - 3 * 24 * 60 * 60000),
      status: 'active',
    },
  ], []);

  const filteredReports = useMemo(() => {
    return reports.filter(r => filterStatus === 'all' || r.status === filterStatus);
  }, [reports, filterStatus]);

  const getReportTypeLabel = (type) => {
    const labels = {
      spam: '🚫 بريد مزعج',
      harassment: '😠 تحرش',
      inappropriate: '⚠️ محتوى غير لائق',
      copyright: '©️ انتهاك حقوق',
    };
    return labels[type] || type;
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: { background: '#fef3c7', color: '#92400e', label: '⏳ قيد الانتظار' },
      resolved: { background: '#d1fae5', color: '#065f46', label: '✅ تم الحل' },
      active: { background: '#fee2e2', color: '#991b1b', label: '🔴 نشط' },
      expired: { background: '#e5e7eb', color: '#374151', label: '⏰ انتهى' },
    };
    return styles[status] || styles.pending;
  };

  return (
    <div style={{ padding: '20px', display: 'grid', gap: '20px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
      }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
          🛡️ لوحة الإشراف والمراقبة
        </h1>

        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            variant={activeTab === 'reports' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('reports')}
          >
            📋 التقارير ({reports.length})
          </Button>
          <Button
            variant={activeTab === 'bans' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('bans')}
          >
            🚫 الحظر ({bans.length})
          </Button>
          <Button
            variant={activeTab === 'content' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('content')}
          >
            📝 مراجعة المحتوى
          </Button>
        </div>
      </div>

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div style={{ display: 'grid', gap: '16px' }}>
          {/* Filter */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {['all', 'pending', 'resolved'].map(status => (
              <Button
                key={status}
                variant={filterStatus === status ? 'primary' : 'secondary'}
                onClick={() => setFilterStatus(status)}
                style={{ padding: '6px 12px', fontSize: '12px' }}
              >
                {status === 'all' ? 'الكل' : status === 'pending' ? 'قيد الانتظار' : 'تم الحل'}
              </Button>
            ))}
          </div>

          {/* Reports List */}
          <div style={{ display: 'grid', gap: '12px' }}>
            {filteredReports.map(report => (
              <Card
                key={report.id}
                style={{
                  padding: '16px',
                  cursor: 'pointer',
                  border: selectedReport?.id === report.id ? '2px solid var(--primary)' : '1px solid var(--line)',
                  background: selectedReport?.id === report.id ? 'rgba(var(--primary-rgb), 0.05)' : 'var(--bg-card)',
                }}
                onClick={() => setSelectedReport(report)}
              >
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr auto',
                  gap: '12px',
                  alignItems: 'center',
                }}>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      نوع التقرير
                    </div>
                    <div style={{ fontWeight: 'bold' }}>
                      {getReportTypeLabel(report.type)}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      المستخدم المبلغ عنه
                    </div>
                    <div style={{ fontWeight: 'bold' }}>
                      {report.reportedUser}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      السبب
                    </div>
                    <div style={{ fontSize: '13px' }}>
                      {report.reason}
                    </div>
                  </div>

                  <div style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    ...getStatusBadge(report.status),
                  }}>
                    {getStatusBadge(report.status).label}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Report Details */}
          {selectedReport && (
            <Card style={{ padding: '20px', background: 'var(--bg-soft)' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 'bold' }}>
                📋 تفاصيل التقرير
              </h3>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
                marginBottom: '16px',
              }}>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    المبلغ
                  </div>
                  <div style={{ fontWeight: 'bold' }}>
                    {selectedReport.reporter}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    التاريخ
                  </div>
                  <div style={{ fontWeight: 'bold' }}>
                    {selectedReport.date.toLocaleString('ar-EG')}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  المحتوى المبلغ عنه
                </div>
                <div style={{
                  padding: '12px',
                  background: 'var(--bg-card)',
                  borderRadius: '6px',
                  borderLeft: '3px solid var(--primary)',
                }}>
                  {selectedReport.reportedPost}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <Button onClick={() => alert('تم الموافقة على الإجراء')}>
                  ✅ الموافقة
                </Button>
                <Button variant="secondary" onClick={() => alert('تم رفض التقرير')}>
                  ❌ رفض
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Bans Tab */}
      {activeTab === 'bans' && (
        <div style={{ display: 'grid', gap: '12px' }}>
          {bans.map(ban => (
            <Card key={ban.id} style={{ padding: '16px' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr auto',
                gap: '12px',
                alignItems: 'center',
              }}>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    اسم المستخدم
                  </div>
                  <div style={{ fontWeight: 'bold' }}>
                    {ban.username}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    السبب
                  </div>
                  <div style={{ fontSize: '13px' }}>
                    {ban.reason}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    المدة
                  </div>
                  <div style={{ fontWeight: 'bold' }}>
                    {ban.duration}
                  </div>
                </div>

                <Button variant="danger" onClick={() => alert('تم رفع الحظر')}>
                  رفع الحظر
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Content Review Tab */}
      {activeTab === 'content' && (
        <Card style={{ padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>
            📝
          </div>
          <h3 style={{ margin: '0 0 8px 0' }}>مراجعة المحتوى</h3>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>
            قيد التطوير - سيتم إضافة نظام مراجعة المحتوى قريباً
          </p>
        </Card>
      )}
    </div>
  );
}

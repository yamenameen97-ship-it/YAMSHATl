import { useState, useMemo } from 'react';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';

export default function AdminReports() {
  const [reports, setReports] = useState([
    { 
      id: 1, 
      type: 'محتوى غير لائق', 
      category: 'content_violation',
      target: 'Post #442', 
      targetId: 'post_442',
      reporter: 'user_x', 
      priority: 'high', 
      status: 'pending',
      aiScore: 0.85,
      createdAt: '2024-05-10 14:20',
      description: 'محتوى يحتوي على كلمات غير لائقة',
      evidence: ['صورة مرفقة'],
      auditLog: []
    },
    { 
      id: 2, 
      type: 'انتحال شخصية', 
      category: 'impersonation',
      target: 'User @fake_acc', 
      targetId: 'user_fake_acc',
      reporter: 'user_y', 
      priority: 'high', 
      status: 'escalated',
      aiScore: 0.92,
      createdAt: '2024-05-10 12:15',
      description: 'حساب يحاكي حساب شهير',
      evidence: ['مقارنة الصور'],
      auditLog: [
        { admin: 'admin_1', action: 'تصعيد', time: '2024-05-10 13:00', notes: 'تم التصعيد للفريق المتخصص' }
      ]
    },
    { 
      id: 3, 
      type: 'سبام', 
      category: 'spam',
      target: 'Post #445', 
      targetId: 'post_445',
      reporter: 'user_z', 
      priority: 'medium', 
      status: 'resolved',
      aiScore: 0.78,
      createdAt: '2024-05-09 18:30',
      description: 'منشور يحتوي على روابط مريبة',
      evidence: ['رابط مريب'],
      auditLog: [
        { admin: 'admin_2', action: 'حذف المنشور', time: '2024-05-09 19:00', notes: 'تم حذف المنشور' },
        { admin: 'admin_2', action: 'تحذير المستخدم', time: '2024-05-09 19:05', notes: 'تم إرسال تحذير' }
      ]
    },
    { 
      id: 4, 
      type: 'تحرش', 
      category: 'harassment',
      target: 'Comment #1203', 
      targetId: 'comment_1203',
      reporter: 'user_a', 
      priority: 'critical', 
      status: 'pending',
      aiScore: 0.88,
      createdAt: '2024-05-10 15:45',
      description: 'تعليق يحتوي على تحرش وتهديدات',
      evidence: ['نص التعليق'],
      auditLog: []
    },
    { 
      id: 5, 
      type: 'محتوى عنيف', 
      category: 'violence',
      target: 'Video #789', 
      targetId: 'video_789',
      reporter: 'user_b', 
      priority: 'critical', 
      status: 'ignored',
      aiScore: 0.65,
      createdAt: '2024-05-08 10:20',
      description: 'فيديو يحتوي على محتوى عنيف',
      evidence: ['رابط الفيديو'],
      auditLog: [
        { admin: 'admin_3', action: 'تجاهل البلاغ', time: '2024-05-08 11:00', notes: 'لا يوجد انتهاك واضح' }
      ]
    }
  ]);

  const [selectedReport, setSelectedReport] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [actionModal, setActionModal] = useState(null);
  const [actionNotes, setActionNotes] = useState('');

  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
      const matchesPriority = filterPriority === 'all' || r.priority === filterPriority;
      const matchesCategory = filterCategory === 'all' || r.category === filterCategory;
      return matchesStatus && matchesPriority && matchesCategory;
    });
  }, [reports, filterStatus, filterPriority, filterCategory]);

  const handleReportAction = (reportId, action) => {
    setReports(prev => prev.map(r => 
      r.id === reportId 
        ? {
            ...r,
            status: action === 'ignore' ? 'ignored' : action === 'escalate' ? 'escalated' : 'resolved',
            auditLog: [...r.auditLog, {
              admin: 'current_admin',
              action: action === 'ignore' ? 'تجاهل البلاغ' : action === 'escalate' ? 'تصعيد' : 'حل البلاغ',
              time: new Date().toLocaleString('ar-EG'),
              notes: actionNotes
            }]
          }
        : r
    ));
    setActionModal(null);
    setActionNotes('');
  };

  const getCategoryLabel = (category) => {
    const categories = {
      'content_violation': 'انتهاك محتوى',
      'impersonation': 'انتحال شخصية',
      'spam': 'سبام',
      'harassment': 'تحرش',
      'violence': 'محتوى عنيف',
      'sexual_content': 'محتوى جنسي',
      'hate_speech': 'خطاب كراهية',
      'misinformation': 'معلومات مضللة'
    };
    return categories[category] || category;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'critical': '#dc2626',
      'high': '#ea580c',
      'medium': '#eab308',
      'low': '#22c55e'
    };
    return colors[priority] || '#64748b';
  };

  const getStatusLabel = (status) => {
    const labels = {
      'pending': 'قيد الانتظار',
      'escalated': 'مصعد',
      'resolved': 'محل',
      'ignored': 'مجاهل'
    };
    return labels[status] || status;
  };

  const reportStats = useMemo(() => ({
    total: reports.length,
    pending: reports.filter(r => r.status === 'pending').length,
    escalated: reports.filter(r => r.status === 'escalated').length,
    resolved: reports.filter(r => r.status === 'resolved').length,
    critical: reports.filter(r => r.priority === 'critical').length
  }), [reports]);

  return (
    <div className="admin-reports-page">
      <Card className="reports-header-card">
        <h2>نظام البلاغات الذكي (Smart Moderation)</h2>
        <p className="muted">تصنيف ذكي للبلاغات، إدارة الأولويات، وسجل تدقيق شامل.</p>
        
        <div className="automation-banner mt-4">
          <span>🤖 تصنيف ذكي مفعل: البلاغات تُصنف تلقائياً حسب الأولوية والخطورة</span>
        </div>
      </Card>

      <Card className="reports-stats-card mt-4">
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-value">{reportStats.total}</div>
            <div className="stat-label">إجمالي البلاغات</div>
          </div>
          <div className="stat-item">
            <div className="stat-value" style={{ color: '#dc2626' }}>{reportStats.critical}</div>
            <div className="stat-label">حرجة</div>
          </div>
          <div className="stat-item">
            <div className="stat-value" style={{ color: '#ea580c' }}>{reportStats.pending}</div>
            <div className="stat-label">قيد الانتظار</div>
          </div>
          <div className="stat-item">
            <div className="stat-value" style={{ color: '#3b82f6' }}>{reportStats.escalated}</div>
            <div className="stat-label">مصعدة</div>
          </div>
          <div className="stat-item">
            <div className="stat-value" style={{ color: '#10b981' }}>{reportStats.resolved}</div>
            <div className="stat-label">محلولة</div>
          </div>
        </div>
      </Card>

      <Card className="reports-filters-card mt-4">
        <div className="filters-row">
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">جميع الحالات</option>
            <option value="pending">قيد الانتظار</option>
            <option value="escalated">مصعدة</option>
            <option value="resolved">محلولة</option>
            <option value="ignored">مجاهلة</option>
          </select>
          <select 
            value={filterPriority} 
            onChange={(e) => setFilterPriority(e.target.value)}
            className="filter-select"
          >
            <option value="all">جميع الأولويات</option>
            <option value="critical">حرجة</option>
            <option value="high">عالية</option>
            <option value="medium">متوسطة</option>
            <option value="low">منخفضة</option>
          </select>
          <select 
            value={filterCategory} 
            onChange={(e) => setFilterCategory(e.target.value)}
            className="filter-select"
          >
            <option value="all">جميع الفئات</option>
            <option value="content_violation">انتهاك محتوى</option>
            <option value="impersonation">انتحال شخصية</option>
            <option value="spam">سبام</option>
            <option value="harassment">تحرش</option>
            <option value="violence">محتوى عنيف</option>
            <option value="sexual_content">محتوى جنسي</option>
            <option value="hate_speech">خطاب كراهية</option>
            <option value="misinformation">معلومات مضللة</option>
          </select>
        </div>
      </Card>

      <div className="reports-list mt-4">
        {filteredReports.map(report => (
          <Card key={report.id} className={`report-item report-${report.priority}`}>
            <div className="report-header">
              <div className="report-main">
                <div className="report-title-row">
                  <strong>{report.type}</strong>
                  <span className="category-badge">{getCategoryLabel(report.category)}</span>
                </div>
                <p className="report-meta">
                  الهدف: <code>{report.target}</code> | المبلغ: <strong>@{report.reporter}</strong> | 
                  <span className="ai-score"> AI Score: {(report.aiScore * 100).toFixed(0)}%</span>
                </p>
                <p className="report-description">{report.description}</p>
              </div>
              <div className="report-badges">
                <span className="priority-tag" style={{ background: getPriorityColor(report.priority) + '20', color: getPriorityColor(report.priority) }}>
                  {report.priority === 'critical' ? '🔴 حرجة' : report.priority === 'high' ? '🟠 عالية' : report.priority === 'medium' ? '🟡 متوسطة' : '🟢 منخفضة'}
                </span>
                <span className="status-tag">
                  {getStatusLabel(report.status)}
                </span>
              </div>
            </div>

            <div className="report-evidence">
              <strong>الأدلة:</strong>
              <div className="evidence-list">
                {report.evidence.map((item, i) => (
                  <span key={i} className="evidence-item">{item}</span>
                ))}
              </div>
            </div>

            <div className="report-actions">
              <Button 
                size="small" 
                variant="secondary" 
                onClick={() => setSelectedReport(report)}
              >
                عرض التفاصيل
              </Button>
              {report.status === 'pending' && (
                <>
                  <Button 
                    size="small" 
                    variant="warning" 
                    onClick={() => { setSelectedReport(report); setActionModal('escalate'); }}
                  >
                    تصعيد
                  </Button>
                  <Button 
                    size="small" 
                    variant="primary" 
                    onClick={() => { setSelectedReport(report); setActionModal('resolve'); }}
                  >
                    حل
                  </Button>
                  <Button 
                    size="small" 
                    variant="secondary" 
                    onClick={() => { setSelectedReport(report); setActionModal('ignore'); }}
                  >
                    تجاهل
                  </Button>
                </>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Report Details Modal */}
      <Modal 
        open={!!selectedReport && !actionModal} 
        onClose={() => setSelectedReport(null)} 
        title={`تفاصيل البلاغ #${selectedReport?.id}`}
        size="large"
      >
        <div className="report-details">
          <div className="detail-section">
            <h4>معلومات البلاغ</h4>
            <div className="detail-grid">
              <div className="detail-item">
                <label>نوع البلاغ</label>
                <span>{selectedReport?.type}</span>
              </div>
              <div className="detail-item">
                <label>الفئة</label>
                <span>{getCategoryLabel(selectedReport?.category)}</span>
              </div>
              <div className="detail-item">
                <label>الأولوية</label>
                <span style={{ color: getPriorityColor(selectedReport?.priority), fontWeight: 'bold' }}>
                  {selectedReport?.priority}
                </span>
              </div>
              <div className="detail-item">
                <label>الحالة</label>
                <span>{getStatusLabel(selectedReport?.status)}</span>
              </div>
              <div className="detail-item">
                <label>درجة الذكاء الاصطناعي</label>
                <div className="ai-score-bar">
                  <div 
                    className="ai-score-fill" 
                    style={{ width: `${(selectedReport?.aiScore || 0) * 100}%` }}
                  />
                </div>
                <span>{(selectedReport?.aiScore * 100).toFixed(0)}%</span>
              </div>
              <div className="detail-item">
                <label>تاريخ الإنشاء</label>
                <span>{selectedReport?.createdAt}</span>
              </div>
            </div>
          </div>

          <div className="detail-section mt-4">
            <h4>الهدف المبلغ عنه</h4>
            <div className="target-info">
              <p><strong>النوع:</strong> {selectedReport?.target}</p>
              <p><strong>المعرف:</strong> <code>{selectedReport?.targetId}</code></p>
              <p><strong>المبلغ:</strong> @{selectedReport?.reporter}</p>
            </div>
          </div>

          <div className="detail-section mt-4">
            <h4>الوصف</h4>
            <p className="description-text">{selectedReport?.description}</p>
          </div>

          <div className="detail-section mt-4">
            <h4>سجل التدقيق (Admin Audit Log)</h4>
            {selectedReport?.auditLog.length > 0 ? (
              <div className="audit-timeline">
                {selectedReport.auditLog.map((log, i) => (
                  <div key={i} className="audit-entry">
                    <div className="audit-header">
                      <strong>{log.action}</strong>
                      <span className="audit-time">{log.time}</span>
                    </div>
                    <div className="audit-details">
                      <p><strong>المسؤول:</strong> {log.admin}</p>
                      <p><strong>الملاحظات:</strong> {log.notes}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted">لا توجد إجراءات سابقة على هذا البلاغ</p>
            )}
          </div>

          <div className="detail-actions mt-6">
            {selectedReport?.status === 'pending' && (
              <>
                <Button 
                  variant="warning" 
                  onClick={() => setActionModal('escalate')}
                >
                  تصعيد البلاغ
                </Button>
                <Button 
                  variant="primary" 
                  onClick={() => setActionModal('resolve')}
                >
                  حل البلاغ
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={() => setActionModal('ignore')}
                >
                  تجاهل البلاغ
                </Button>
              </>
            )}
          </div>
        </div>
      </Modal>

      {/* Action Modal */}
      <Modal 
        open={!!actionModal} 
        onClose={() => { setActionModal(null); setActionNotes(''); }} 
        title={actionModal === 'escalate' ? 'تصعيد البلاغ' : actionModal === 'resolve' ? 'حل البلاغ' : 'تجاهل البلاغ'}
        size="small"
      >
        <div className="action-form">
          <p>
            {actionModal === 'escalate' 
              ? 'سيتم تصعيد هذا البلاغ إلى فريق متخصص للمراجعة الإضافية.'
              : actionModal === 'resolve'
              ? 'سيتم تحديد هذا البلاغ كمحلول. يرجى إدخال الإجراء المتخذ.'
              : 'سيتم تجاهل هذا البلاغ. يرجى إدخال السبب.'}
          </p>
          <textarea 
            placeholder="أضف ملاحظات أو تفاصيل الإجراء..."
            value={actionNotes}
            onChange={(e) => setActionNotes(e.target.value)}
            className="action-textarea"
            rows="4"
          />
          <div className="button-group mt-4">
            <Button 
              variant={actionModal === 'escalate' ? 'warning' : actionModal === 'resolve' ? 'primary' : 'secondary'}
              onClick={() => handleReportAction(selectedReport.id, actionModal)}
            >
              تأكيد
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => { setActionModal(null); setActionNotes(''); }}
            >
              إلغاء
            </Button>
          </div>
        </div>
      </Modal>

      <style dangerouslySetInnerHTML={{ __html: `
        .admin-reports-page { padding: 20px; }
        .muted { color: #64748b; font-size: 14px; }
        .mt-4 { margin-top: 1rem; }
        .mt-6 { margin-top: 1.5rem; }
        
        .automation-banner { background: #eff6ff; border: 1px solid #bfdbfe; padding: 12px; border-radius: 8px; color: #1e40af; font-size: 14px; }
        
        .reports-stats-card { padding: 20px; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 16px; }
        .stat-item { text-align: center; padding: 16px; background: #f8fafc; border-radius: 8px; }
        .stat-value { font-size: 24px; font-weight: bold; color: #1e293b; }
        .stat-label { font-size: 12px; color: #64748b; margin-top: 8px; }
        
        .reports-filters-card { padding: 16px; }
        .filters-row { display: flex; gap: 12px; }
        .filter-select { flex: 1; padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 14px; }
        
        .reports-list { display: grid; gap: 16px; }
        .report-item { padding: 16px; border-left: 4px solid #e2e8f0; }
        .report-item.report-critical { border-left-color: #dc2626; background: #fef2f2; }
        .report-item.report-high { border-left-color: #ea580c; background: #fff7ed; }
        .report-item.report-medium { border-left-color: #eab308; background: #fefce8; }
        .report-item.report-low { border-left-color: #22c55e; background: #f0fdf4; }
        
        .report-header { display: flex; justify-content: space-between; gap: 16px; margin-bottom: 12px; }
        .report-main { flex: 1; }
        .report-title-row { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
        .category-badge { background: #f1f5f9; padding: 2px 8px; border-radius: 4px; font-size: 11px; }
        .report-meta { font-size: 12px; color: #64748b; margin: 4px 0; }
        .ai-score { margin-left: 12px; font-weight: bold; color: #3b82f6; }
        .report-description { font-size: 14px; color: #334155; margin: 8px 0 0 0; }
        
        .report-badges { display: flex; gap: 8px; align-items: flex-start; }
        .priority-tag { padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: bold; }
        .status-tag { padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: bold; background: #e0e7ff; color: #3730a3; }
        
        .report-evidence { padding: 12px; background: #f8fafc; border-radius: 6px; margin: 12px 0; }
        .evidence-list { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
        .evidence-item { background: #e0f2fe; color: #0369a1; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
        
        .report-actions { display: flex; gap: 8px; flex-wrap: wrap; }
        
        .report-details { padding: 20px 0; }
        .detail-section { padding: 16px; background: #f8fafc; border-radius: 8px; }
        .detail-section h4 { margin: 0 0 12px 0; }
        .detail-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
        .detail-item { display: flex; flex-direction: column; }
        .detail-item label { font-size: 12px; color: #64748b; margin-bottom: 4px; font-weight: bold; }
        .detail-item span { font-size: 14px; color: #1e293b; }
        
        .ai-score-bar { width: 100%; height: 6px; background: #e2e8f0; border-radius: 3px; overflow-y:auto; margin: 4px 0; }
        .ai-score-fill { height: 100%; background: linear-gradient(90deg, #3b82f6, #10b981); }
        
        .target-info { padding: 12px; background: #f1f5f9; border-radius: 6px; }
        .target-info p { margin: 4px 0; font-size: 13px; }
        .target-info code { background: #e2e8f0; padding: 2px 6px; border-radius: 3px; }
        
        .description-text { font-size: 14px; line-height: 1.6; color: #334155; }
        
        .audit-timeline { display: flex; flex-direction: column; gap: 12px; }
        .audit-entry { padding: 12px; background: #f1f5f9; border-radius: 6px; border-left: 3px solid #3b82f6; }
        .audit-header { display: flex; justify-content: space-between; margin-bottom: 8px; }
        .audit-time { font-size: 11px; color: #64748b; }
        .audit-details p { font-size: 12px; margin: 4px 0; }
        
        .detail-actions { display: flex; gap: 8px; }
        
        .action-form { padding: 16px 0; }
        .action-textarea { width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 6px; font-family: inherit; font-size: 14px; resize: vertical; }
        .button-group { display: flex; gap: 8px; }
      `}} />
    </div>
  );
}

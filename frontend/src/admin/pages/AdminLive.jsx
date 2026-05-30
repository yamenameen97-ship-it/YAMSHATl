import { useState, useMemo, useEffect } from 'react';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';

export default function AdminLive() {
  const [streams, setStreams] = useState([
    {
      id: 'stream_1',
      title: 'بث مباشر - حفلة موسيقية',
      host: 'user_1',
      viewers: 234,
      duration: '45 دقيقة',
      bitrate: '2.5 Mbps',
      fps: 30,
      health: 'ممتاز',
      healthScore: 95,
      startedAt: '2024-05-10 14:20',
      violations: [],
      reports: 2,
      status: 'live'
    },
    {
      id: 'stream_2',
      title: 'بث مباشر - جلسة نقاش',
      host: 'user_2',
      viewers: 156,
      duration: '23 دقيقة',
      bitrate: '1.8 Mbps',
      fps: 24,
      health: 'جيد',
      healthScore: 82,
      startedAt: '2024-05-10 14:50',
      violations: [
        { type: 'inappropriate_language', time: '2024-05-10 15:05', severity: 'medium', description: 'استخدام لغة غير لائقة' }
      ],
      reports: 1,
      status: 'live'
    },
    {
      id: 'stream_3',
      title: 'بث مباشر - دورة تعليمية',
      host: 'user_3',
      viewers: 89,
      duration: '12 دقيقة',
      bitrate: '1.2 Mbps',
      fps: 30,
      health: 'جيد',
      healthScore: 78,
      startedAt: '2024-05-10 15:15',
      violations: [],
      reports: 0,
      status: 'live'
    }
  ]);

  const [selectedStream, setSelectedStream] = useState(null);
  const [actionModal, setActionModal] = useState(null);
  const [violationModal, setViolationModal] = useState(null);
  const [newViolation, setNewViolation] = useState({
    type: 'inappropriate_language',
    severity: 'medium',
    description: ''
  });
  const [filterStatus, setFilterStatus] = useState('all');

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setStreams(prev => prev.map(s => ({
        ...s,
        viewers: Math.max(0, s.viewers + Math.floor(Math.random() * 10 - 3)),
        bitrate: (Math.random() * 1 + 1.5).toFixed(1) + ' Mbps',
        healthScore: Math.max(60, Math.min(99, s.healthScore + (Math.random() - 0.5) * 3))
      })));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const filteredStreams = useMemo(() => {
    return streams.filter(s => {
      const matchesStatus = filterStatus === 'all' || s.status === filterStatus;
      return matchesStatus;
    });
  }, [streams, filterStatus]);

  const handleEndStream = (streamId) => {
    setStreams(prev => prev.map(s => 
      s.id === streamId 
        ? { ...s, status: 'ended' }
        : s
    ));
    setActionModal(null);
  };

  const handleMuteAudio = (streamId) => {
    alert(`تم كتم الصوت للبث: ${streamId}`);
    setActionModal(null);
  };

  const handleHideChat = (streamId) => {
    alert(`تم إخفاء الدردشة للبث: ${streamId}`);
    setActionModal(null);
  };

  const handleAddViolation = (streamId) => {
    setStreams(prev => prev.map(s => 
      s.id === streamId 
        ? {
            ...s,
            violations: [...s.violations, {
              type: newViolation.type,
              time: new Date().toLocaleString('ar-EG'),
              severity: newViolation.severity,
              description: newViolation.description
            }]
          }
        : s
    ));
    setNewViolation({ type: 'inappropriate_language', severity: 'medium', description: '' });
    setViolationModal(null);
  };

  const getHealthColor = (score) => {
    if (score >= 90) return '#10b981';
    if (score >= 75) return '#f59e0b';
    return '#ef4444';
  };

  const getSeverityColor = (severity) => {
    const colors = {
      'low': '#10b981',
      'medium': '#f59e0b',
      'high': '#ef4444'
    };
    return colors[severity] || '#64748b';
  };

  const streamStats = useMemo(() => ({
    total: streams.length,
    live: streams.filter(s => s.status === 'live').length,
    ended: streams.filter(s => s.status === 'ended').length,
    totalViewers: streams.reduce((sum, s) => sum + s.viewers, 0),
    withViolations: streams.filter(s => s.violations.length > 0).length,
    totalReports: streams.reduce((sum, s) => sum + s.reports, 0)
  }), [streams]);

  return (
    <div className="admin-live-page">
      <Card className="live-header-card">
        <h2>إدارة البث المباشر</h2>
        <p className="muted">مراقبة مباشرة للبثوث، إنهاء بث بالقوة، كشف مخالفات، وسجل البلاغات.</p>
      </Card>

      <Card className="live-stats-card mt-4">
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-value">{streamStats.live}</div>
            <div className="stat-label">بثوث نشطة</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{streamStats.totalViewers.toLocaleString('ar-EG')}</div>
            <div className="stat-label">إجمالي المشاهدين</div>
          </div>
          <div className="stat-item">
            <div className="stat-value" style={{ color: '#ef4444' }}>{streamStats.withViolations}</div>
            <div className="stat-label">بثوث بها مخالفات</div>
          </div>
          <div className="stat-item">
            <div className="stat-value" style={{ color: '#f59e0b' }}>{streamStats.totalReports}</div>
            <div className="stat-label">إجمالي البلاغات</div>
          </div>
        </div>
      </Card>

      <Card className="live-filters-card mt-4">
        <select 
          value={filterStatus} 
          onChange={(e) => setFilterStatus(e.target.value)}
          className="filter-select"
        >
          <option value="all">جميع البثوث</option>
          <option value="live">بثوث نشطة</option>
          <option value="ended">بثوث منتهية</option>
        </select>
      </Card>

      <div className="streams-grid mt-4">
        {filteredStreams.map(stream => (
          <Card key={stream.id} className={`stream-card stream-${stream.status}`}>
            <div className="stream-header">
              <div className="stream-title-row">
                <span className="stream-status" style={{ background: stream.status === 'live' ? '#dc2626' : '#64748b' }}>
                  {stream.status === 'live' ? '🔴 مباشر' : '⚫ منتهي'}
                </span>
                <strong>{stream.title}</strong>
              </div>
              <div className="stream-host">بواسطة: <strong>@{stream.host}</strong></div>
            </div>

            <div className="stream-metrics">
              <div className="metric-item">
                <span className="metric-label">👁️ المشاهدون:</span>
                <span className="metric-value">{stream.viewers.toLocaleString('ar-EG')}</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">⏱️ المدة:</span>
                <span className="metric-value">{stream.duration}</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">📡 البث:</span>
                <span className="metric-value">{stream.bitrate}</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">🎬 FPS:</span>
                <span className="metric-value">{stream.fps}</span>
              </div>
            </div>

            <div className="stream-health">
              <div className="health-label">
                <span>صحة البث:</span>
                <span style={{ color: getHealthColor(stream.healthScore), fontWeight: 'bold' }}>
                  {stream.healthScore}%
                </span>
              </div>
              <div className="health-bar">
                <div 
                  className="health-fill" 
                  style={{ 
                    width: `${stream.healthScore}%`,
                    background: getHealthColor(stream.healthScore)
                  }}
                />
              </div>
            </div>

            {stream.violations.length > 0 && (
              <div className="violations-section">
                <div className="violations-header">
                  <strong>⚠️ المخالفات المكتشفة ({stream.violations.length})</strong>
                </div>
                <div className="violations-list">
                  {stream.violations.map((v, i) => (
                    <div key={i} className="violation-item" style={{ borderLeft: `3px solid ${getSeverityColor(v.severity)}` }}>
                      <div className="violation-type">{v.description}</div>
                      <div className="violation-meta">
                        <span className="violation-time">{v.time}</span>
                        <span className="violation-severity" style={{ color: getSeverityColor(v.severity) }}>
                          {v.severity === 'low' ? 'منخفضة' : v.severity === 'medium' ? 'متوسطة' : 'عالية'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {stream.reports > 0 && (
              <div className="reports-section">
                <span className="reports-badge">📋 {stream.reports} بلاغات</span>
              </div>
            )}

            <div className="stream-actions">
              <Button 
                size="small" 
                variant="secondary" 
                onClick={() => setSelectedStream(stream)}
              >
                عرض التفاصيل
              </Button>
              {stream.status === 'live' && (
                <>
                  <Button 
                    size="small" 
                    variant="warning" 
                    onClick={() => { setSelectedStream(stream); setActionModal('mute'); }}
                  >
                    كتم الصوت
                  </Button>
                  <Button 
                    size="small" 
                    variant="warning" 
                    onClick={() => { setSelectedStream(stream); setActionModal('hide_chat'); }}
                  >
                    إخفاء الدردشة
                  </Button>
                  <Button 
                    size="small" 
                    variant="danger" 
                    onClick={() => { setSelectedStream(stream); setActionModal('end'); }}
                  >
                    إنهاء البث
                  </Button>
                </>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Stream Details Modal */}
      <Modal 
        open={!!selectedStream && !actionModal && !violationModal} 
        onClose={() => setSelectedStream(null)} 
        title={`تفاصيل البث: ${selectedStream?.title}`}
        size="large"
      >
        <div className="stream-details">
          <div className="detail-section">
            <h4>معلومات البث</h4>
            <div className="detail-grid">
              <div className="detail-item">
                <label>المضيف</label>
                <span>@{selectedStream?.host}</span>
              </div>
              <div className="detail-item">
                <label>بدء البث</label>
                <span>{selectedStream?.startedAt}</span>
              </div>
              <div className="detail-item">
                <label>الحالة</label>
                <span style={{ color: selectedStream?.status === 'live' ? '#dc2626' : '#64748b', fontWeight: 'bold' }}>
                  {selectedStream?.status === 'live' ? 'مباشر' : 'منتهي'}
                </span>
              </div>
              <div className="detail-item">
                <label>المشاهدون الحاليون</label>
                <span>{selectedStream?.viewers.toLocaleString('ar-EG')}</span>
              </div>
            </div>
          </div>

          <div className="detail-section mt-4">
            <h4>جودة البث</h4>
            <div className="detail-grid">
              <div className="detail-item">
                <label>معدل البث</label>
                <span>{selectedStream?.bitrate}</span>
              </div>
              <div className="detail-item">
                <label>عدد الإطارات</label>
                <span>{selectedStream?.fps} fps</span>
              </div>
              <div className="detail-item">
                <label>صحة البث</label>
                <span style={{ color: getHealthColor(selectedStream?.healthScore || 0), fontWeight: 'bold' }}>
                  {selectedStream?.healthScore}%
                </span>
              </div>
              <div className="detail-item">
                <label>الحالة</label>
                <span>{selectedStream?.health}</span>
              </div>
            </div>
          </div>

          {selectedStream?.violations.length > 0 && (
            <div className="detail-section mt-4">
              <h4>سجل المخالفات</h4>
              <div className="violations-timeline">
                {selectedStream.violations.map((v, i) => (
                  <div key={i} className="violation-timeline-item">
                    <div className="violation-time">{v.time}</div>
                    <div className="violation-content">
                      <strong>{v.description}</strong>
                      <div className="violation-severity-badge" style={{ background: getSeverityColor(v.severity) + '20', color: getSeverityColor(v.severity) }}>
                        {v.severity === 'low' ? 'منخفضة' : v.severity === 'medium' ? 'متوسطة' : 'عالية'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="detail-section mt-4">
            <h4>سجل البلاغات</h4>
            <p className="muted">إجمالي البلاغات: {selectedStream?.reports}</p>
            {selectedStream?.reports > 0 && (
              <div className="reports-list">
                {[...Array(selectedStream.reports)].map((_, i) => (
                  <div key={i} className="report-item">
                    <span>📋 بلاغ #{i + 1}</span>
                    <span className="report-time">2024-05-10 15:{String(i).padStart(2, '0')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="detail-actions mt-6">
            {selectedStream?.status === 'live' && (
              <>
                <Button 
                  variant="warning" 
                  onClick={() => { setViolationModal(true); }}
                >
                  إضافة مخالفة
                </Button>
                <Button 
                  variant="danger" 
                  onClick={() => setActionModal('end')}
                >
                  إنهاء البث
                </Button>
              </>
            )}
          </div>
        </div>
      </Modal>

      {/* Add Violation Modal */}
      {violationModal && (
        <Modal 
          open={true} 
          onClose={() => setViolationModal(false)} 
          title="إضافة مخالفة"
          size="small"
        >
          <div className="violation-form">
            <div className="form-group">
              <label>نوع المخالفة</label>
              <select 
                value={newViolation.type}
                onChange={(e) => setNewViolation({ ...newViolation, type: e.target.value })}
                className="form-select"
              >
                <option value="inappropriate_language">لغة غير لائقة</option>
                <option value="violence">محتوى عنيف</option>
                <option value="harassment">تحرش</option>
                <option value="spam">سبام</option>
                <option value="sexual_content">محتوى جنسي</option>
                <option value="hate_speech">خطاب كراهية</option>
              </select>
            </div>

            <div className="form-group">
              <label>مستوى الخطورة</label>
              <select 
                value={newViolation.severity}
                onChange={(e) => setNewViolation({ ...newViolation, severity: e.target.value })}
                className="form-select"
              >
                <option value="low">منخفضة</option>
                <option value="medium">متوسطة</option>
                <option value="high">عالية</option>
              </select>
            </div>

            <div className="form-group">
              <label>الوصف</label>
              <textarea 
                value={newViolation.description}
                onChange={(e) => setNewViolation({ ...newViolation, description: e.target.value })}
                placeholder="أدخل وصف المخالفة..."
                className="form-textarea"
                rows="3"
              />
            </div>

            <div className="form-buttons">
              <Button 
                variant="primary" 
                onClick={() => handleAddViolation(selectedStream.id)}
              >
                إضافة المخالفة
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => setViolationModal(false)}
              >
                إلغاء
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Action Confirmation Modals */}
      {actionModal === 'end' && (
        <Modal 
          open={true} 
          onClose={() => setActionModal(null)} 
          title="تأكيد إنهاء البث"
          size="small"
        >
          <div className="action-form">
            <p>هل أنت متأكد من إنهاء البث "{selectedStream?.title}"؟</p>
            <div className="button-group mt-4">
              <Button 
                variant="danger" 
                onClick={() => handleEndStream(selectedStream.id)}
              >
                إنهاء البث
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => setActionModal(null)}
              >
                إلغاء
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {actionModal === 'mute' && (
        <Modal 
          open={true} 
          onClose={() => setActionModal(null)} 
          title="كتم الصوت"
          size="small"
        >
          <div className="action-form">
            <p>هل تريد كتم صوت البث "{selectedStream?.title}"؟</p>
            <div className="button-group mt-4">
              <Button 
                variant="warning" 
                onClick={() => handleMuteAudio(selectedStream.id)}
              >
                تأكيد كتم الصوت
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => setActionModal(null)}
              >
                إلغاء
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {actionModal === 'hide_chat' && (
        <Modal 
          open={true} 
          onClose={() => setActionModal(null)} 
          title="إخفاء الدردشة"
          size="small"
        >
          <div className="action-form">
            <p>هل تريد إخفاء الدردشة للبث "{selectedStream?.title}"؟</p>
            <div className="button-group mt-4">
              <Button 
                variant="warning" 
                onClick={() => handleHideChat(selectedStream.id)}
              >
                تأكيد الإخفاء
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => setActionModal(null)}
              >
                إلغاء
              </Button>
            </div>
          </div>
        </Modal>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .admin-live-page { padding: 20px; }
        .mt-4 { margin-top: 1rem; }
        .mt-6 { margin-top: 1.5rem; }
        .muted { color: #64748b; font-size: 14px; }
        
        .live-stats-card { padding: 20px; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 16px; }
        .stat-item { text-align: center; padding: 12px; background: #f8fafc; border-radius: 8px; }
        .stat-value { font-size: 20px; font-weight: bold; }
        .stat-label { font-size: 11px; color: #64748b; margin-top: 4px; }
        
        .live-filters-card { padding: 16px; }
        .filter-select { padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 14px; }
        
        .streams-grid { display: grid; gap: 16px; }
        .stream-card { padding: 16px; border-left: 4px solid #e2e8f0; }
        .stream-card.stream-live { border-left-color: #dc2626; background: #fef2f2; }
        .stream-card.stream-ended { border-left-color: #64748b; background: #f8fafc; }
        
        .stream-header { margin-bottom: 12px; }
        .stream-title-row { display: flex; align-items: center; gap: 12px; margin-bottom: 4px; }
        .stream-status { display: inline-block; padding: 2px 8px; border-radius: 4px; color: white; font-size: 11px; font-weight: bold; }
        .stream-host { font-size: 12px; color: #64748b; }
        
        .stream-metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; padding: 12px; background: #f8fafc; border-radius: 6px; margin: 12px 0; }
        .metric-item { display: flex; justify-content: space-between; font-size: 12px; }
        .metric-label { color: #64748b; }
        .metric-value { font-weight: bold; }
        
        .stream-health { padding: 12px; background: #f8fafc; border-radius: 6px; margin: 12px 0; }
        .health-label { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 12px; }
        .health-bar { width: 100%; height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; }
        .health-fill { height: 100%; transition: all 0.3s ease; }
        
        .violations-section { padding: 12px; background: #fef2f2; border-radius: 6px; margin: 12px 0; border-left: 3px solid #ef4444; }
        .violations-header { margin-bottom: 8px; color: #991b1b; }
        .violations-list { display: flex; flex-direction: column; gap: 8px; }
        .violation-item { padding: 8px; background: white; border-radius: 4px; }
        .violation-type { font-size: 12px; font-weight: bold; }
        .violation-meta { display: flex; justify-content: space-between; font-size: 10px; color: #64748b; margin-top: 4px; }
        
        .reports-section { padding: 8px; background: #eff6ff; border-radius: 4px; }
        .reports-badge { font-size: 12px; color: #0369a1; font-weight: bold; }
        
        .stream-actions { display: flex; gap: 8px; flex-wrap: wrap; }
        
        .stream-details { padding: 20px 0; }
        .detail-section { padding: 16px; background: #f8fafc; border-radius: 8px; }
        .detail-section h4 { margin: 0 0 12px 0; }
        .detail-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
        .detail-item { display: flex; flex-direction: column; }
        .detail-item label { font-size: 12px; color: #64748b; margin-bottom: 4px; font-weight: bold; }
        .detail-item span { font-size: 14px; color: #1e293b; }
        
        .violations-timeline { display: flex; flex-direction: column; gap: 12px; }
        .violation-timeline-item { padding: 12px; background: #fef2f2; border-radius: 6px; border-left: 3px solid #ef4444; }
        .violation-time { font-size: 11px; color: #64748b; }
        .violation-content { margin-top: 4px; }
        .violation-severity-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; margin-top: 4px; }
        
        .reports-list { display: flex; flex-direction: column; gap: 8px; }
        .report-item { display: flex; justify-content: space-between; padding: 8px; background: #eff6ff; border-radius: 4px; font-size: 12px; }
        .report-time { color: #64748b; }
        
        .detail-actions { display: flex; gap: 8px; }
        
        .violation-form { padding: 16px 0; }
        .form-group { margin-bottom: 16px; }
        .form-group label { display: block; font-size: 12px; color: #64748b; margin-bottom: 6px; font-weight: bold; }
        .form-select { width: 100%; padding: 8px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 14px; }
        .form-textarea { width: 100%; padding: 8px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 14px; font-family: inherit; }
        .form-buttons { display: flex; gap: 8px; }
        
        .action-form { padding: 16px 0; }
        .button-group { display: flex; gap: 8px; }
      `}} />
    </div>
  );
}

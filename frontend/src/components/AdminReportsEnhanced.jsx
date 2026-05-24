/**
 * مكون إدارة البلاغات المحسّن
 * يوفر:
 * - قائمة الإشراف (Moderation Queue)
 * - عارض البلاغات (Report Viewer)
 * - أدوات المراجعة (Review Tools)
 * - إجراءات الإشراف (Admin Actions)
 */

import React, { useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import { API_BASE } from '../api/config.js';

const API_BASE_URL = API_BASE;

export const AdminReportsEnhanced = ({ reports = [] }) => {
  const [filteredReports, setFilteredReports] = useState(reports);
  const [selectedReport, setSelectedReport] = useState(null);
  const [filters, setFilters] = useState({
    status: 'pending',
    category: 'all',
    priority: 'all',
    searchTerm: ''
  });
  const [moderationNotes, setModerationNotes] = useState('');
  const [action, setAction] = useState('');

  /**
   * تطبيق التصفية
   */
  const applyFilters = useCallback(() => {
    let filtered = [...reports];

    // تصفية حسب الحالة
    if (filters.status !== 'all') {
      filtered = filtered.filter(r => r.status === filters.status);
    }

    // تصفية حسب الفئة
    if (filters.category !== 'all') {
      filtered = filtered.filter(r => r.category === filters.category);
    }

    // تصفية حسب الأولوية
    if (filters.priority !== 'all') {
      filtered = filtered.filter(r => r.priority === filters.priority);
    }

    // البحث
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(r =>
        r.id.includes(searchLower) ||
        r.reportedBy.toLowerCase().includes(searchLower) ||
        r.reason.toLowerCase().includes(searchLower)
      );
    }

    // الترتيب حسب الأولوية والوقت
    filtered.sort((a, b) => {
      const priorityOrder = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3 };
      const aPriority = priorityOrder[a.priority] || 999;
      const bPriority = priorityOrder[b.priority] || 999;

      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }

      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    setFilteredReports(filtered);
  }, [reports, filters]);

  /**
   * تحديث التصفية
   */
  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  /**
   * عرض تفاصيل البلاغ
   */
  const viewReportDetails = useCallback((report) => {
    setSelectedReport(report);
    setModerationNotes('');
    setAction('');
  }, []);

  /**
   * إجراء الإشراف - الموافقة
   */
  const approveReport = useCallback(async () => {
    if (!selectedReport) return;

    try {
      await axios.post(`${API_BASE_URL}/admin/reports/${selectedReport.id}/approve`, {
        notes: moderationNotes,
        action: 'remove_content'
      });

      alert('تم الموافقة على البلاغ');
      setSelectedReport(null);
      applyFilters();
    } catch (error) {
      console.error('Error approving report:', error);
    }
  }, [selectedReport, moderationNotes, applyFilters]);

  /**
   * إجراء الإشراف - الرفض
   */
  const rejectReport = useCallback(async () => {
    if (!selectedReport) return;

    try {
      await axios.post(`${API_BASE_URL}/admin/reports/${selectedReport.id}/reject`, {
        notes: moderationNotes,
        reason: 'not_violation'
      });

      alert('تم رفض البلاغ');
      setSelectedReport(null);
      applyFilters();
    } catch (error) {
      console.error('Error rejecting report:', error);
    }
  }, [selectedReport, moderationNotes, applyFilters]);

  /**
   * إجراء الإشراف - حظر المستخدم
   */
  const banReportedUser = useCallback(async () => {
    if (!selectedReport) return;

    try {
      await axios.post(`${API_BASE_URL}/admin/reports/${selectedReport.id}/ban-user`, {
        userId: selectedReport.reportedUserId,
        reason: selectedReport.reason,
        notes: moderationNotes
      });

      alert('تم حظر المستخدم');
      setSelectedReport(null);
      applyFilters();
    } catch (error) {
      console.error('Error banning user:', error);
    }
  }, [selectedReport, moderationNotes, applyFilters]);

  /**
   * إجراء الإشراف - تحذير المستخدم
   */
  const warnReportedUser = useCallback(async () => {
    if (!selectedReport) return;

    try {
      await axios.post(`${API_BASE_URL}/admin/reports/${selectedReport.id}/warn-user`, {
        userId: selectedReport.reportedUserId,
        reason: selectedReport.reason,
        notes: moderationNotes
      });

      alert('تم تحذير المستخدم');
      setSelectedReport(null);
      applyFilters();
    } catch (error) {
      console.error('Error warning user:', error);
    }
  }, [selectedReport, moderationNotes, applyFilters]);

  // تطبيق التصفية عند التغيير
  useMemo(() => {
    applyFilters();
  }, [filters, applyFilters]);

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>إدارة البلاغات</h1>

      <div style={styles.mainContent}>
        {/* قائمة الإشراف */}
        <div style={styles.queuePanel}>
          <h2 style={styles.panelTitle}>قائمة الإشراف</h2>

          {/* شريط التصفية */}
          <div style={styles.filterBar}>
            <select
              value={filters.status}
              onChange={(e) => updateFilter('status', e.target.value)}
              style={styles.filterSelect}
            >
              <option value="all">جميع الحالات</option>
              <option value="pending">قيد الانتظار</option>
              <option value="approved">موافق عليه</option>
              <option value="rejected">مرفوض</option>
            </select>

            <select
              value={filters.category}
              onChange={(e) => updateFilter('category', e.target.value)}
              style={styles.filterSelect}
            >
              <option value="all">جميع الفئات</option>
              <option value="spam">بريد عشوائي</option>
              <option value="harassment">تحرش</option>
              <option value="hate_speech">خطاب كراهية</option>
              <option value="violence">عنف</option>
              <option value="adult_content">محتوى للبالغين</option>
              <option value="misinformation">معلومات مضللة</option>
              <option value="other">أخرى</option>
            </select>

            <select
              value={filters.priority}
              onChange={(e) => updateFilter('priority', e.target.value)}
              style={styles.filterSelect}
            >
              <option value="all">جميع الأولويات</option>
              <option value="critical">حرجة</option>
              <option value="high">عالية</option>
              <option value="medium">متوسطة</option>
              <option value="low">منخفضة</option>
            </select>

            <input
              type="text"
              placeholder="ابحث عن بلاغ..."
              value={filters.searchTerm}
              onChange={(e) => updateFilter('searchTerm', e.target.value)}
              style={styles.searchInput}
            />
          </div>

          {/* قائمة البلاغات */}
          <div style={styles.reportsList}>
            {filteredReports.map(report => (
              <div
                key={report.id}
                onClick={() => viewReportDetails(report)}
                style={{
                  ...styles.reportItem,
                  backgroundColor: selectedReport?.id === report.id ? '#e3f2fd' : '#fff',
                  borderLeft: `4px solid ${getPriorityColor(report.priority)}`
                }}
              >
                <div style={styles.reportItemHeader}>
                  <span style={{...styles.priorityBadge, backgroundColor: getPriorityColor(report.priority)}}>
                    {getPriorityText(report.priority)}
                  </span>
                  <span style={{...styles.categoryBadge, backgroundColor: getCategoryColor(report.category)}}>
                    {getCategoryText(report.category)}
                  </span>
                  <span style={{...styles.statusBadge, backgroundColor: getStatusColor(report.status)}}>
                    {getStatusText(report.status)}
                  </span>
                </div>
                <div style={styles.reportItemBody}>
                  <p style={styles.reportReason}>{report.reason}</p>
                  <p style={styles.reportMeta}>
                    من: {report.reportedBy} | في: {formatDate(report.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {filteredReports.length === 0 && (
            <div style={styles.emptyState}>
              <p>لا توجد بلاغات</p>
            </div>
          )}
        </div>

        {/* عارض البلاغات */}
        {selectedReport && (
          <div style={styles.viewerPanel}>
            <h2 style={styles.panelTitle}>تفاصيل البلاغ</h2>

            {/* معلومات البلاغ */}
            <div style={styles.reportDetails}>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>رقم البلاغ:</span>
                <span style={styles.detailValue}>{selectedReport.id}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>الفئة:</span>
                <span style={styles.detailValue}>{getCategoryText(selectedReport.category)}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>الأولوية:</span>
                <span style={{...styles.detailValue, color: getPriorityColor(selectedReport.priority)}}>
                  {getPriorityText(selectedReport.priority)}
                </span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>الحالة:</span>
                <span style={styles.detailValue}>{getStatusText(selectedReport.status)}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>من:</span>
                <span style={styles.detailValue}>{selectedReport.reportedBy}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>الوقت:</span>
                <span style={styles.detailValue}>{formatDate(selectedReport.createdAt)}</span>
              </div>
            </div>

            {/* السبب */}
            <div style={styles.reasonSection}>
              <h3 style={styles.sectionTitle}>سبب البلاغ</h3>
              <p style={styles.reasonText}>{selectedReport.reason}</p>
            </div>

            {/* المحتوى المبلغ عنه */}
            {selectedReport.reportedContent && (
              <div style={styles.contentSection}>
                <h3 style={styles.sectionTitle}>المحتوى المبلغ عنه</h3>
                {selectedReport.reportedContent.type === 'image' ? (
                  <img src={selectedReport.reportedContent.url} alt="Reported content" style={styles.contentImage} />
                ) : selectedReport.reportedContent.type === 'video' ? (
                  <video src={selectedReport.reportedContent.url} style={styles.contentVideo} controls />
                ) : (
                  <p style={styles.contentText}>{selectedReport.reportedContent.text}</p>
                )}
              </div>
            )}

            {/* ملاحظات الإشراف */}
            <div style={styles.notesSection}>
              <h3 style={styles.sectionTitle}>ملاحظات الإشراف</h3>
              <textarea
                value={moderationNotes}
                onChange={(e) => setModerationNotes(e.target.value)}
                placeholder="أضف ملاحظات..."
                style={styles.notesTextarea}
              />
            </div>

            {/* أدوات المراجعة والإجراءات */}
            <div style={styles.actionsSection}>
              <h3 style={styles.sectionTitle}>الإجراءات</h3>
              <div style={styles.actionButtons}>
                <button
                  onClick={approveReport}
                  style={{...styles.actionButton, backgroundColor: '#4CAF50'}}
                >
                  ✓ الموافقة والحذف
                </button>
                <button
                  onClick={warnReportedUser}
                  style={{...styles.actionButton, backgroundColor: '#FF9800'}}
                >
                  ⚠️ تحذير المستخدم
                </button>
                <button
                  onClick={banReportedUser}
                  style={{...styles.actionButton, backgroundColor: '#F44336'}}
                >
                  🚫 حظر المستخدم
                </button>
                <button
                  onClick={rejectReport}
                  style={{...styles.actionButton, backgroundColor: '#999'}}
                >
                  ✗ رفض البلاغ
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * دوال مساعدة
 */
function getPriorityText(priority) {
  const priorityMap = {
    'critical': 'حرجة',
    'high': 'عالية',
    'medium': 'متوسطة',
    'low': 'منخفضة'
  };
  return priorityMap[priority] || priority;
}

function getPriorityColor(priority) {
  const colorMap = {
    'critical': '#F44336',
    'high': '#FF9800',
    'medium': '#FFC107',
    'low': '#4CAF50'
  };
  return colorMap[priority] || '#999';
}

function getCategoryText(category) {
  const categoryMap = {
    'spam': 'بريد عشوائي',
    'harassment': 'تحرش',
    'hate_speech': 'خطاب كراهية',
    'violence': 'عنف',
    'adult_content': 'محتوى للبالغين',
    'misinformation': 'معلومات مضللة',
    'other': 'أخرى'
  };
  return categoryMap[category] || category;
}

function getCategoryColor(category) {
  const colorMap = {
    'spam': '#9C27B0',
    'harassment': '#E91E63',
    'hate_speech': '#F44336',
    'violence': '#D32F2F',
    'adult_content': '#FF6F00',
    'misinformation': '#FF9800',
    'other': '#757575'
  };
  return colorMap[category] || '#999';
}

function getStatusText(status) {
  const statusMap = {
    'pending': 'قيد الانتظار',
    'approved': 'موافق عليه',
    'rejected': 'مرفوض'
  };
  return statusMap[status] || status;
}

function getStatusColor(status) {
  const colorMap = {
    'pending': '#FFC107',
    'approved': '#4CAF50',
    'rejected': '#999'
  };
  return colorMap[status] || '#999';
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * الأنماط
 */
const styles = {
  container: {
    padding: '20px',
    backgroundColor: '#f5f5f5',
    minHeight: '100vh'
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    marginBottom: '20px',
    color: '#333'
  },
  mainContent: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px'
  },
  queuePanel: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column'
  },
  viewerPanel: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
    maxHeight: 'calc(100vh - 100px)'
  },
  panelTitle: {
    margin: '0 0 15px 0',
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#333'
  },
  filterBar: {
    display: 'flex',
    gap: '10px',
    marginBottom: '15px',
    flexWrap: 'wrap'
  },
  filterSelect: {
    padding: '8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px'
  },
  searchInput: {
    flex: 1,
    minWidth: '150px',
    padding: '8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px'
  },
  reportsList: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  reportItem: {
    padding: '12px',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    border: '1px solid #eee'
  },
  reportItemHeader: {
    display: 'flex',
    gap: '8px',
    marginBottom: '8px'
  },
  priorityBadge: {
    padding: '2px 8px',
    borderRadius: '4px',
    color: '#fff',
    fontSize: '11px',
    fontWeight: 'bold'
  },
  categoryBadge: {
    padding: '2px 8px',
    borderRadius: '4px',
    color: '#fff',
    fontSize: '11px'
  },
  statusBadge: {
    padding: '2px 8px',
    borderRadius: '4px',
    color: '#fff',
    fontSize: '11px'
  },
  reportItemBody: {
    fontSize: '13px'
  },
  reportReason: {
    margin: '0 0 5px 0',
    color: '#333',
    fontWeight: '500'
  },
  reportMeta: {
    margin: 0,
    fontSize: '12px',
    color: '#999'
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px 20px',
    color: '#999'
  },
  reportDetails: {
    marginBottom: '20px',
    paddingBottom: '20px',
    borderBottom: '1px solid #eee'
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
    fontSize: '14px'
  },
  detailLabel: {
    fontWeight: 'bold',
    color: '#666'
  },
  detailValue: {
    color: '#333'
  },
  reasonSection: {
    marginBottom: '20px'
  },
  sectionTitle: {
    margin: '0 0 10px 0',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#333'
  },
  reasonText: {
    margin: 0,
    padding: '10px',
    backgroundColor: '#f5f5f5',
    borderRadius: '4px',
    fontSize: '14px',
    lineHeight: '1.5'
  },
  contentSection: {
    marginBottom: '20px'
  },
  contentImage: {
    maxWidth: '100%',
    maxHeight: '200px',
    borderRadius: '4px'
  },
  contentVideo: {
    maxWidth: '100%',
    maxHeight: '200px',
    borderRadius: '4px'
  },
  contentText: {
    margin: 0,
    padding: '10px',
    backgroundColor: '#f5f5f5',
    borderRadius: '4px',
    fontSize: '14px'
  },
  notesSection: {
    marginBottom: '20px'
  },
  notesTextarea: {
    width: '100%',
    minHeight: '100px',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    fontFamily: 'Arial, sans-serif',
    resize: 'vertical'
  },
  actionsSection: {
    marginTop: 'auto'
  },
  actionButtons: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px'
  },
  actionButton: {
    padding: '10px',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    transition: 'opacity 0.2s'
  }
};

export default AdminReportsEnhanced;

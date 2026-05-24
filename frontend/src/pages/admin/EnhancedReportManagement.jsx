/**
 * مكون إدارة البلاغات المتقدم
 * توفر:
 * - قائمة الإشراف
 * - عارض البلاغات
 * - أدوات المراجعة
 * - إجراءات الإدارة
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const API_BASE_URL = 'https://yamshatl-ahj8.onrender.com/api';

/**
 * مكون صف البلاغ
 */
const ReportRow = ({ report, onAction, isSelected, onSelect }) => {
  const priorityColors = {
    low: '#34C759',
    medium: '#FF9500',
    high: '#FF3B30'
  };

  const statusColors = {
    pending: '#FF9500',
    reviewing: '#007AFF',
    resolved: '#34C759',
    rejected: '#999'
  };

  return (
    <tr style={styles.tableRow}>
      <td style={styles.tableCell}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(report.id, e.target.checked)}
          style={styles.checkbox}
        />
      </td>
      <td style={styles.tableCell}>
        <div style={styles.reportInfo}>
          <div style={styles.reportTitle}>{report.title}</div>
          <div style={styles.reportDescription}>{report.description}</div>
        </div>
      </td>
      <td style={styles.tableCell}>
        <span style={{
          ...styles.badge,
          backgroundColor: priorityColors[report.priority]
        }}>
          {report.priority}
        </span>
      </td>
      <td style={styles.tableCell}>
        <span style={{
          ...styles.badge,
          backgroundColor: statusColors[report.status]
        }}>
          {report.status}
        </span>
      </td>
      <td style={styles.tableCell}>{formatDate(report.createdAt)}</td>
      <td style={styles.tableCell}>
        <div style={styles.actions}>
          <button
            onClick={() => onAction('view', report.id)}
            style={styles.actionButton}
            title="عرض"
          >
            👁️
          </button>
          <button
            onClick={() => onAction('review', report.id)}
            style={styles.actionButton}
            title="مراجعة"
          >
            ✓
          </button>
          <button
            onClick={() => onAction('reject', report.id)}
            style={{...styles.actionButton, color: '#FF3B30'}}
            title="رفض"
          >
            ✕
          </button>
        </div>
      </td>
    </tr>
  );
};

/**
 * مكون عارض البلاغ
 */
const ReportViewer = ({ report, onClose, onAction }) => {
  if (!report) return null;

  return (
    <div style={styles.modal}>
      <div style={styles.modalContent}>
        <div style={styles.modalHeader}>
          <h2>{report.title}</h2>
          <button onClick={onClose} style={styles.closeButton}>✕</button>
        </div>

        <div style={styles.modalBody}>
          <div style={styles.section}>
            <h3>الوصف</h3>
            <p>{report.description}</p>
          </div>

          <div style={styles.section}>
            <h3>المحتوى المبلّغ عنه</h3>
            {report.contentType === 'image' && (
              <img src={report.contentUrl} alt="Content" style={styles.contentImage} />
            )}
            {report.contentType === 'video' && (
              <video src={report.contentUrl} controls style={styles.contentVideo} />
            )}
            {report.contentType === 'text' && (
              <div style={styles.contentText}>{report.contentText}</div>
            )}
          </div>

          <div style={styles.section}>
            <h3>معلومات البلاغ</h3>
            <table style={styles.infoTable}>
              <tbody>
                <tr>
                  <td>المبلّغ:</td>
                  <td>{report.reporterName}</td>
                </tr>
                <tr>
                  <td>المحتوى من:</td>
                  <td>{report.contentAuthorName}</td>
                </tr>
                <tr>
                  <td>السبب:</td>
                  <td>{report.reason}</td>
                </tr>
                <tr>
                  <td>التاريخ:</td>
                  <td>{formatDate(report.createdAt)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={styles.section}>
            <h3>الإجراء</h3>
            <div style={styles.actionButtons}>
              <button
                onClick={() => onAction('approve', report.id)}
                style={{...styles.actionButton, backgroundColor: '#34C759'}}
              >
                ✓ الموافقة
              </button>
              <button
                onClick={() => onAction('reject', report.id)}
                style={{...styles.actionButton, backgroundColor: '#FF3B30'}}
              >
                ✕ الرفض
              </button>
              <button
                onClick={() => onAction('ban-user', report.id)}
                style={{...styles.actionButton, backgroundColor: '#FF9500'}}
              >
                🚫 حظر المستخدم
              </button>
              <button
                onClick={() => onAction('delete-content', report.id)}
                style={{...styles.actionButton, backgroundColor: '#FF3B30'}}
              >
                🗑️ حذف المحتوى
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * مكون إدارة البلاغات
 */
export const EnhancedReportManagement = () => {
  const [filters, setFilters] = useState({
    status: 'pending',
    priority: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  const [selectedReports, setSelectedReports] = useState(new Set());
  const [selectedReport, setSelectedReport] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  // جلب البلاغات
  const { data: reports = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-reports', filters],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE_URL}/admin/reports`, {
        params: filters
      });
      return response.data;
    },
    refetchInterval: 5000
  });

  // معالجات الأحداث
  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSelectAll = useCallback((checked) => {
    if (checked) {
      setSelectedReports(new Set(reports.map(r => r.id)));
    } else {
      setSelectedReports(new Set());
    }
  }, [reports]);

  const handleSelectReport = useCallback((reportId, checked) => {
    const newSelected = new Set(selectedReports);
    if (checked) {
      newSelected.add(reportId);
    } else {
      newSelected.delete(reportId);
    }
    setSelectedReports(newSelected);
  }, [selectedReports]);

  const handleReportAction = useCallback(async (action, reportId) => {
    try {
      switch (action) {
        case 'view':
          const report = reports.find(r => r.id === reportId);
          setSelectedReport(report);
          break;
        case 'review':
          await axios.patch(`${API_BASE_URL}/admin/reports/${reportId}`, {
            status: 'reviewing'
          });
          refetch();
          break;
        case 'approve':
          await axios.patch(`${API_BASE_URL}/admin/reports/${reportId}`, {
            status: 'resolved'
          });
          setSelectedReport(null);
          refetch();
          break;
        case 'reject':
          await axios.patch(`${API_BASE_URL}/admin/reports/${reportId}`, {
            status: 'rejected'
          });
          setSelectedReport(null);
          refetch();
          break;
        case 'ban-user':
          await axios.post(`${API_BASE_URL}/admin/reports/${reportId}/ban-user`);
          setSelectedReport(null);
          refetch();
          break;
        case 'delete-content':
          await axios.post(`${API_BASE_URL}/admin/reports/${reportId}/delete-content`);
          setSelectedReport(null);
          refetch();
          break;
      }
    } catch (error) {
      console.error('Error performing action:', error);
    }
  }, [reports, refetch]);

  const handleBulkAction = useCallback(async (action) => {
    if (selectedReports.size === 0) {
      alert('الرجاء تحديد بلاغات');
      return;
    }

    try {
      const reportIds = Array.from(selectedReports);
      switch (action) {
        case 'approve':
          await axios.post(`${API_BASE_URL}/admin/reports/bulk/approve`, { reportIds });
          break;
        case 'reject':
          await axios.post(`${API_BASE_URL}/admin/reports/bulk/reject`, { reportIds });
          break;
      }
      setSelectedReports(new Set());
      refetch();
    } catch (error) {
      console.error('Error performing bulk action:', error);
    }
  }, [selectedReports, refetch]);

  if (isLoading) {
    return <div style={styles.container}>جاري التحميل...</div>;
  }

  return (
    <div style={styles.container}>
      {/* رأس الصفحة */}
      <div style={styles.header}>
        <h1 style={styles.title}>إدارة البلاغات</h1>
        <button
          onClick={() => setShowFilters(!showFilters)}
          style={styles.button}
        >
          🔍 {showFilters ? 'إخفاء' : 'عرض'} التصفية
        </button>
      </div>

      {/* أدوات التصفية */}
      {showFilters && (
        <div style={styles.filterPanel}>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            style={styles.select}
          >
            <option value="all">جميع الحالات</option>
            <option value="pending">قيد الانتظار</option>
            <option value="reviewing">قيد المراجعة</option>
            <option value="resolved">تم حلها</option>
            <option value="rejected">مرفوضة</option>
          </select>

          <select
            value={filters.priority}
            onChange={(e) => handleFilterChange('priority', e.target.value)}
            style={styles.select}
          >
            <option value="all">جميع الأولويات</option>
            <option value="low">منخفضة</option>
            <option value="medium">متوسطة</option>
            <option value="high">عالية</option>
          </select>

          <select
            value={filters.sortBy}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            style={styles.select}
          >
            <option value="createdAt">تاريخ الإنشاء</option>
            <option value="priority">الأولوية</option>
            <option value="status">الحالة</option>
          </select>
        </div>
      )}

      {/* أدوات الإجراءات الجماعية */}
      {selectedReports.size > 0 && (
        <div style={styles.bulkActions}>
          <span>تم تحديد {selectedReports.size} بلاغ</span>
          <div style={styles.bulkActionButtons}>
            <button
              onClick={() => handleBulkAction('approve')}
              style={{...styles.bulkButton, backgroundColor: '#34C759'}}
            >
              ✓ الموافقة
            </button>
            <button
              onClick={() => handleBulkAction('reject')}
              style={{...styles.bulkButton, backgroundColor: '#FF3B30'}}
            >
              ✕ الرفض
            </button>
          </div>
        </div>
      )}

      {/* جدول البلاغات */}
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.headerRow}>
              <th style={styles.headerCell}>
                <input
                  type="checkbox"
                  checked={selectedReports.size === reports.length && reports.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  style={styles.checkbox}
                />
              </th>
              <th style={styles.headerCell}>البلاغ</th>
              <th style={styles.headerCell}>الأولوية</th>
              <th style={styles.headerCell}>الحالة</th>
              <th style={styles.headerCell}>التاريخ</th>
              <th style={styles.headerCell}>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {reports.map(report => (
              <ReportRow
                key={report.id}
                report={report}
                onAction={handleReportAction}
                isSelected={selectedReports.has(report.id)}
                onSelect={handleSelectReport}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* عارض البلاغ */}
      <ReportViewer
        report={selectedReport}
        onClose={() => setSelectedReport(null)}
        onAction={handleReportAction}
      />

      {reports.length === 0 && (
        <div style={styles.emptyState}>
          <p>لا توجد بلاغات</p>
        </div>
      )}
    </div>
  );
};

/**
 * تنسيق التاريخ
 */
function formatDate(date) {
  return new Date(date).toLocaleDateString('ar-SA');
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
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  title: {
    margin: 0,
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#333'
  },
  button: {
    padding: '10px 20px',
    backgroundColor: '#007AFF',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  filterPanel: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '10px',
    padding: '15px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    marginBottom: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  select: {
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px'
  },
  bulkActions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    marginBottom: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  bulkActionButtons: {
    display: 'flex',
    gap: '10px'
  },
  bulkButton: {
    padding: '8px 16px',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  tableContainer: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    overflowX: 'auto',
    marginBottom: '20px'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  headerRow: {
    backgroundColor: '#f9f9f9',
    borderBottom: '2px solid #e0e0e0'
  },
  headerCell: {
    padding: '12px',
    textAlign: 'right',
    fontWeight: '600',
    color: '#333'
  },
  tableRow: {
    borderBottom: '1px solid #e0e0e0'
  },
  tableCell: {
    padding: '12px',
    textAlign: 'right'
  },
  checkbox: {
    cursor: 'pointer'
  },
  reportInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
  },
  reportTitle: {
    fontWeight: '600',
    color: '#333'
  },
  reportDescription: {
    fontSize: '12px',
    color: '#666'
  },
  badge: {
    padding: '4px 12px',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '12px',
    fontWeight: '500'
  },
  actions: {
    display: 'flex',
    gap: '5px'
  },
  actionButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    padding: '4px 8px',
    color: '#007AFF'
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    maxWidth: '600px',
    maxHeight: '80vh',
    overflow: 'auto',
    boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    borderBottom: '1px solid #e0e0e0'
  },
  closeButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '24px',
    color: '#666'
  },
  modalBody: {
    padding: '20px'
  },
  section: {
    marginBottom: '20px'
  },
  contentImage: {
    maxWidth: '100%',
    height: 'auto',
    borderRadius: '8px'
  },
  contentVideo: {
    maxWidth: '100%',
    height: 'auto',
    borderRadius: '8px'
  },
  contentText: {
    padding: '10px',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    fontSize: '14px'
  },
  infoTable: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  actionButtons: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '10px'
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    color: '#666'
  }
};

export default EnhancedReportManagement;

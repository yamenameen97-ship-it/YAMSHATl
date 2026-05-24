/**
 * مكون إدارة المستخدمين المحسّن
 * يوفر:
 * - تصفية متقدمة
 * - إجراءات الإشراف
 * - إجراءات سريعة
 * - إجراءات جماعية
 */

import React, { useState, useCallback, useMemo } from 'react';
import axios from 'axios';

const API_BASE_URL = 'https://yamshatl-ahj8.onrender.com/api';

export const AdminUsersEnhanced = ({ users = [] }) => {
  const [filteredUsers, setFilteredUsers] = useState(users);
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [filters, setFilters] = useState({
    status: 'all',
    role: 'all',
    joinDate: 'all',
    searchTerm: ''
  });
  const [sortBy, setSortBy] = useState('joinDate');
  const [sortOrder, setSortOrder] = useState('desc');

  /**
   * تطبيق التصفية
   */
  const applyFilters = useCallback(() => {
    let filtered = [...users];

    // تصفية حسب الحالة
    if (filters.status !== 'all') {
      filtered = filtered.filter(u => u.status === filters.status);
    }

    // تصفية حسب الدور
    if (filters.role !== 'all') {
      filtered = filtered.filter(u => u.role === filters.role);
    }

    // تصفية حسب تاريخ الانضمام
    if (filters.joinDate !== 'all') {
      const now = new Date();
      const daysAgo = {
        'today': 1,
        'week': 7,
        'month': 30,
        'year': 365
      }[filters.joinDate] || 0;

      const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(u => new Date(u.joinDate) >= cutoffDate);
    }

    // البحث
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(u =>
        u.username.toLowerCase().includes(searchLower) ||
        u.email.toLowerCase().includes(searchLower) ||
        u.id.includes(searchLower)
      );
    }

    // الترتيب
    filtered.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    setFilteredUsers(filtered);
  }, [users, filters, sortBy, sortOrder]);

  /**
   * تحديث التصفية
   */
  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  /**
   * تحديد/إلغاء تحديد مستخدم
   */
  const toggleUserSelection = useCallback((userId) => {
    setSelectedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  }, []);

  /**
   * تحديد الكل
   */
  const selectAll = useCallback(() => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
    }
  }, [filteredUsers, selectedUsers]);

  /**
   * إجراء سريع - حظر المستخدم
   */
  const banUser = useCallback(async (userId) => {
    try {
      await axios.post(`${API_BASE_URL}/admin/users/${userId}/ban`);
      alert('تم حظر المستخدم بنجاح');
      applyFilters();
    } catch (error) {
      console.error('Error banning user:', error);
    }
  }, [applyFilters]);

  /**
   * إجراء سريع - تحذير المستخدم
   */
  const warnUser = useCallback(async (userId) => {
    try {
      await axios.post(`${API_BASE_URL}/admin/users/${userId}/warn`);
      alert('تم تحذير المستخدم بنجاح');
    } catch (error) {
      console.error('Error warning user:', error);
    }
  }, []);

  /**
   * إجراء جماعي - حظر المختارين
   */
  const bulkBan = useCallback(async () => {
    if (selectedUsers.size === 0) {
      alert('يرجى تحديد مستخدمين');
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/admin/users/bulk-ban`, {
        userIds: Array.from(selectedUsers)
      });
      alert(`تم حظر ${selectedUsers.size} مستخدم`);
      setSelectedUsers(new Set());
      applyFilters();
    } catch (error) {
      console.error('Error bulk banning users:', error);
    }
  }, [selectedUsers, applyFilters]);

  /**
   * إجراء جماعي - ترقية المختارين
   */
  const bulkPromote = useCallback(async () => {
    if (selectedUsers.size === 0) {
      alert('يرجى تحديد مستخدمين');
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/admin/users/bulk-promote`, {
        userIds: Array.from(selectedUsers)
      });
      alert(`تم ترقية ${selectedUsers.size} مستخدم`);
      setSelectedUsers(new Set());
      applyFilters();
    } catch (error) {
      console.error('Error bulk promoting users:', error);
    }
  }, [selectedUsers, applyFilters]);

  // تطبيق التصفية عند التغيير
  useMemo(() => {
    applyFilters();
  }, [filters, sortBy, sortOrder, applyFilters]);

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>إدارة المستخدمين</h1>

      {/* شريط البحث والتصفية */}
      <div style={styles.filterBar}>
        <input
          type="text"
          placeholder="ابحث عن مستخدم..."
          value={filters.searchTerm}
          onChange={(e) => updateFilter('searchTerm', e.target.value)}
          style={styles.searchInput}
        />

        <select
          value={filters.status}
          onChange={(e) => updateFilter('status', e.target.value)}
          style={styles.filterSelect}
        >
          <option value="all">جميع الحالات</option>
          <option value="active">نشط</option>
          <option value="inactive">غير نشط</option>
          <option value="banned">محظور</option>
        </select>

        <select
          value={filters.role}
          onChange={(e) => updateFilter('role', e.target.value)}
          style={styles.filterSelect}
        >
          <option value="all">جميع الأدوار</option>
          <option value="user">مستخدم</option>
          <option value="moderator">مشرف</option>
          <option value="admin">إداري</option>
        </select>

        <select
          value={filters.joinDate}
          onChange={(e) => updateFilter('joinDate', e.target.value)}
          style={styles.filterSelect}
        >
          <option value="all">جميع التواريخ</option>
          <option value="today">اليوم</option>
          <option value="week">هذا الأسبوع</option>
          <option value="month">هذا الشهر</option>
          <option value="year">هذا العام</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={styles.filterSelect}
        >
          <option value="joinDate">تاريخ الانضمام</option>
          <option value="username">الاسم</option>
          <option value="lastActive">آخر نشاط</option>
        </select>

        <button
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          style={styles.sortButton}
        >
          {sortOrder === 'asc' ? '↑' : '↓'}
        </button>
      </div>

      {/* الإجراءات الجماعية */}
      {selectedUsers.size > 0 && (
        <div style={styles.bulkActionsBar}>
          <span style={styles.selectionInfo}>
            تم تحديد {selectedUsers.size} مستخدم
          </span>
          <button onClick={selectAll} style={styles.actionButton}>
            {selectedUsers.size === filteredUsers.length ? 'إلغاء التحديد' : 'تحديد الكل'}
          </button>
          <button onClick={bulkBan} style={{...styles.actionButton, backgroundColor: '#F44336'}}>
            حظر المختارين
          </button>
          <button onClick={bulkPromote} style={{...styles.actionButton, backgroundColor: '#4CAF50'}}>
            ترقية المختارين
          </button>
        </div>
      )}

      {/* جدول المستخدمين */}
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeader}>
              <th style={styles.tableCell}>
                <input
                  type="checkbox"
                  checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                  onChange={selectAll}
                />
              </th>
              <th style={styles.tableCell}>الاسم</th>
              <th style={styles.tableCell}>البريد الإلكتروني</th>
              <th style={styles.tableCell}>الدور</th>
              <th style={styles.tableCell}>الحالة</th>
              <th style={styles.tableCell}>آخر نشاط</th>
              <th style={styles.tableCell}>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user.id} style={styles.tableRow}>
                <td style={styles.tableCell}>
                  <input
                    type="checkbox"
                    checked={selectedUsers.has(user.id)}
                    onChange={() => toggleUserSelection(user.id)}
                  />
                </td>
                <td style={styles.tableCell}>
                  <div style={styles.userInfo}>
                    <img src={user.avatar} alt={user.username} style={styles.avatar} />
                    <span>{user.username}</span>
                  </div>
                </td>
                <td style={styles.tableCell}>{user.email}</td>
                <td style={styles.tableCell}>
                  <span style={{...styles.badge, backgroundColor: getRoleBadgeColor(user.role)}}>
                    {getRoleText(user.role)}
                  </span>
                </td>
                <td style={styles.tableCell}>
                  <span style={{...styles.badge, backgroundColor: getStatusBadgeColor(user.status)}}>
                    {getStatusText(user.status)}
                  </span>
                </td>
                <td style={styles.tableCell}>{formatDate(user.lastActive)}</td>
                <td style={styles.tableCell}>
                  <div style={styles.actions}>
                    <button
                      onClick={() => warnUser(user.id)}
                      style={{...styles.quickAction, backgroundColor: '#FF9800'}}
                      title="تحذير"
                    >
                      ⚠️
                    </button>
                    <button
                      onClick={() => banUser(user.id)}
                      style={{...styles.quickAction, backgroundColor: '#F44336'}}
                      title="حظر"
                    >
                      🚫
                    </button>
                    <button
                      style={{...styles.quickAction, backgroundColor: '#2196F3'}}
                      title="عرض التفاصيل"
                    >
                      👁️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* رسالة عدم وجود نتائج */}
      {filteredUsers.length === 0 && (
        <div style={styles.emptyState}>
          <p>لا توجد مستخدمين تطابق معايير البحث</p>
        </div>
      )}
    </div>
  );
};

/**
 * دوال مساعدة
 */
function getRoleText(role) {
  const roleMap = {
    'user': 'مستخدم',
    'moderator': 'مشرف',
    'admin': 'إداري'
  };
  return roleMap[role] || role;
}

function getRoleBadgeColor(role) {
  const colorMap = {
    'user': '#2196F3',
    'moderator': '#FF9800',
    'admin': '#F44336'
  };
  return colorMap[role] || '#999';
}

function getStatusText(status) {
  const statusMap = {
    'active': 'نشط',
    'inactive': 'غير نشط',
    'banned': 'محظور'
  };
  return statusMap[status] || status;
}

function getStatusBadgeColor(status) {
  const colorMap = {
    'active': '#4CAF50',
    'inactive': '#999',
    'banned': '#F44336'
  };
  return colorMap[status] || '#999';
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'الآن';
  if (diffMins < 60) return `قبل ${diffMins} دقيقة`;
  if (diffHours < 24) return `قبل ${diffHours} ساعة`;
  if (diffDays < 7) return `قبل ${diffDays} يوم`;
  return date.toLocaleDateString('ar-SA');
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
  filterBar: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
    flexWrap: 'wrap',
    backgroundColor: '#fff',
    padding: '15px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  searchInput: {
    flex: 1,
    minWidth: '200px',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px'
  },
  filterSelect: {
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    backgroundColor: '#fff'
  },
  sortButton: {
    padding: '10px 15px',
    backgroundColor: '#2196F3',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  bulkActionsBar: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
    backgroundColor: '#fff',
    padding: '15px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    alignItems: 'center'
  },
  selectionInfo: {
    marginRight: 'auto',
    fontWeight: 'bold',
    color: '#333'
  },
  actionButton: {
    padding: '10px 15px',
    backgroundColor: '#2196F3',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  tableContainer: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    overflow: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  tableHeader: {
    backgroundColor: '#f5f5f5',
    borderBottom: '2px solid #ddd'
  },
  tableRow: {
    borderBottom: '1px solid #eee',
    transition: 'background-color 0.2s'
  },
  tableCell: {
    padding: '15px',
    textAlign: 'right'
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    objectFit: 'cover'
  },
  badge: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  actions: {
    display: 'flex',
    gap: '5px'
  },
  quickAction: {
    padding: '6px 10px',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'opacity 0.2s'
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    color: '#999'
  }
};

export default AdminUsersEnhanced;

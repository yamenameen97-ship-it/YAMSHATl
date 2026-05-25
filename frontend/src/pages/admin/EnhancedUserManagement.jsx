/**
 * مكون إدارة المستخدمين المتقدم
 * توفر:
 * - تصفية متقدمة
 * - إجراءات الإشراف
 * - إجراءات سريعة
 * - إجراءات جماعية
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { API_BASE } from '../../api/config.js';

const API_BASE_URL = API_BASE;

/**
 * مكون صف المستخدم
 */
const UserRow = ({ user, onAction, isSelected, onSelect }) => {
  return (
    <tr style={styles.tableRow}>
      <td style={styles.tableCell}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(user.id, e.target.checked)}
          style={styles.checkbox}
        />
      </td>
      <td style={styles.tableCell}>
        <div style={styles.userInfo}>
          <img
            src={user.avatar}
            alt={user.username}
            style={styles.avatar}
          />
          <div>
            <div style={styles.username}>{user.username}</div>
            <div style={styles.email}>{user.email}</div>
          </div>
        </div>
      </td>
      <td style={styles.tableCell}>
        <span style={{
          ...styles.statusBadge,
          backgroundColor: user.isActive ? '#34C759' : '#FF3B30'
        }}>
          {user.isActive ? 'نشط' : 'غير نشط'}
        </span>
      </td>
      <td style={styles.tableCell}>{user.postsCount}</td>
      <td style={styles.tableCell}>{user.followersCount}</td>
      <td style={styles.tableCell}>{formatDate(user.joinedAt)}</td>
      <td style={styles.tableCell}>
        <div style={styles.actions}>
          <button
            onClick={() => onAction('view', user.id)}
            style={styles.actionButton}
            title="عرض"
          >
            👁️
          </button>
          <button
            onClick={() => onAction('edit', user.id)}
            style={styles.actionButton}
            title="تعديل"
          >
            ✏️
          </button>
          <button
            onClick={() => onAction('ban', user.id)}
            style={{...styles.actionButton, color: '#FF3B30'}}
            title="حظر"
          >
            🚫
          </button>
          <button
            onClick={() => onAction('delete', user.id)}
            style={{...styles.actionButton, color: '#FF3B30'}}
            title="حذف"
          >
            🗑️
          </button>
        </div>
      </td>
    </tr>
  );
};

/**
 * مكون إدارة المستخدمين
 */
export const EnhancedUserManagement = () => {
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    sortBy: 'joinedAt',
    sortOrder: 'desc'
  });

  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [showFilters, setShowFilters] = useState(false);

  // جلب المستخدمين
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users', filters],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE_URL}/admin/users`, {
        params: filters
      });
      return response.data;
    },
    refetchInterval: 5000
  });

  // تطبيق التصفية
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      if (filters.search && !user.username.includes(filters.search) && !user.email.includes(filters.search)) {
        return false;
      }
      if (filters.status !== 'all') {
        const isActive = filters.status === 'active';
        if (user.isActive !== isActive) return false;
      }
      return true;
    });
  }, [users, filters]);

  // معالجات الأحداث
  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSelectAll = useCallback((checked) => {
    if (checked) {
      setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
    } else {
      setSelectedUsers(new Set());
    }
  }, [filteredUsers]);

  const handleSelectUser = useCallback((userId, checked) => {
    const newSelected = new Set(selectedUsers);
    if (checked) {
      newSelected.add(userId);
    } else {
      newSelected.delete(userId);
    }
    setSelectedUsers(newSelected);
  }, [selectedUsers]);

  const handleUserAction = useCallback(async (action, userId) => {
    try {
      switch (action) {
        case 'view':
          // عرض تفاصيل المستخدم
          console.log('View user:', userId);
          break;
        case 'edit':
          // تعديل المستخدم
          console.log('Edit user:', userId);
          break;
        case 'ban':
          // حظر المستخدم
          await axios.post(`${API_BASE_URL}/admin/users/${userId}/ban`);
          console.log('User banned:', userId);
          break;
        case 'delete':
          // حذف المستخدم
          if (confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
            await axios.delete(`${API_BASE_URL}/admin/users/${userId}`);
            console.log('User deleted:', userId);
          }
          break;
      }
    } catch (error) {
      console.error('Error performing action:', error);
    }
  }, []);

  const handleBulkAction = useCallback(async (action) => {
    if (selectedUsers.size === 0) {
      alert('الرجاء تحديد مستخدمين');
      return;
    }

    try {
      const userIds = Array.from(selectedUsers);
      switch (action) {
        case 'ban':
          await axios.post(`${API_BASE_URL}/admin/users/bulk/ban`, { userIds });
          break;
        case 'delete':
          if (confirm(`هل أنت متأكد من حذف ${userIds.length} مستخدم؟`)) {
            await axios.post(`${API_BASE_URL}/admin/users/bulk/delete`, { userIds });
          }
          break;
        case 'activate':
          await axios.post(`${API_BASE_URL}/admin/users/bulk/activate`, { userIds });
          break;
      }
      setSelectedUsers(new Set());
    } catch (error) {
      console.error('Error performing bulk action:', error);
    }
  }, [selectedUsers]);

  if (isLoading) {
    return <div style={styles.container}>جاري التحميل...</div>;
  }

  return (
    <div style={styles.container}>
      {/* رأس الصفحة */}
      <div style={styles.header}>
        <h1 style={styles.title}>إدارة المستخدمين</h1>
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
          <input
            type="text"
            placeholder="البحث عن مستخدم..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            style={styles.input}
          />

          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            style={styles.select}
          >
            <option value="all">جميع الحالات</option>
            <option value="active">نشط</option>
            <option value="inactive">غير نشط</option>
          </select>

          <select
            value={filters.sortBy}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            style={styles.select}
          >
            <option value="joinedAt">تاريخ الانضمام</option>
            <option value="username">اسم المستخدم</option>
            <option value="postsCount">عدد المنشورات</option>
            <option value="followersCount">المتابعون</option>
          </select>

          <select
            value={filters.sortOrder}
            onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
            style={styles.select}
          >
            <option value="desc">تنازلي</option>
            <option value="asc">تصاعدي</option>
          </select>
        </div>
      )}

      {/* أدوات الإجراءات الجماعية */}
      {selectedUsers.size > 0 && (
        <div style={styles.bulkActions}>
          <span>تم تحديد {selectedUsers.size} مستخدم</span>
          <div style={styles.bulkActionButtons}>
            <button
              onClick={() => handleBulkAction('activate')}
              style={styles.bulkButton}
            >
              ✅ تفعيل
            </button>
            <button
              onClick={() => handleBulkAction('ban')}
              style={{...styles.bulkButton, backgroundColor: '#FF9500'}}
            >
              🚫 حظر
            </button>
            <button
              onClick={() => handleBulkAction('delete')}
              style={{...styles.bulkButton, backgroundColor: '#FF3B30'}}
            >
              🗑️ حذف
            </button>
          </div>
        </div>
      )}

      {/* جدول المستخدمين */}
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.headerRow}>
              <th style={styles.headerCell}>
                <input
                  type="checkbox"
                  checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  style={styles.checkbox}
                />
              </th>
              <th style={styles.headerCell}>المستخدم</th>
              <th style={styles.headerCell}>الحالة</th>
              <th style={styles.headerCell}>المنشورات</th>
              <th style={styles.headerCell}>المتابعون</th>
              <th style={styles.headerCell}>تاريخ الانضمام</th>
              <th style={styles.headerCell}>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <UserRow
                key={user.id}
                user={user}
                onAction={handleUserAction}
                isSelected={selectedUsers.has(user.id)}
                onSelect={handleSelectUser}
              />
            ))}
          </tbody>
        </table>
      </div>

      {filteredUsers.length === 0 && (
        <div style={styles.emptyState}>
          <p>لا توجد مستخدمين</p>
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
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '10px',
    padding: '15px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    marginBottom: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  input: {
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px'
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
    backgroundColor: '#34C759',
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
    overflowX: 'auto'
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
    borderBottom: '1px solid #e0e0e0',
    '&:hover': {
      backgroundColor: '#f9f9f9'
    }
  },
  tableCell: {
    padding: '12px',
    textAlign: 'right'
  },
  checkbox: {
    cursor: 'pointer'
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    objectFit: 'cover'
  },
  username: {
    fontWeight: '600',
    color: '#333'
  },
  email: {
    fontSize: '12px',
    color: '#666'
  },
  statusBadge: {
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
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    color: '#666'
  }
};

export default EnhancedUserManagement;

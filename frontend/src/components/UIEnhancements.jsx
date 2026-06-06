/**
 * مكونات تحسينات الواجهة والتفاعل (UI/UX Enhancements)
 * - مكونات محسّنة
 * - تأثيرات بصرية
 * - تحسينات التفاعل
 */

import React, { useState, useEffect, useCallback } from 'react';
import { AnimationManager, notificationManager } from '../utils/uxOptimization';

/**
 * مكون التحميل المحسّن (Enhanced Loading)
 */
export const EnhancedLoader = ({ isLoading, message = 'جاري التحميل...' }) => {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 shadow-2xl">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="text-lg font-semibold text-gray-800">{message}</p>
        </div>
      </div>
    </div>
  );
};

/**
 * مكون التنبيهات المحسّن (Enhanced Alert)
 */
export const EnhancedAlert = ({ type = 'info', message, onClose, autoClose = true }) => {
  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(onClose, 5000);
      return () => clearTimeout(timer);
    }
  }, [autoClose, onClose]);

  const typeStyles = {
    success: 'bg-green-100 border-green-400 text-green-700',
    error: 'bg-red-100 border-red-400 text-red-700',
    warning: 'bg-yellow-100 border-yellow-400 text-yellow-700',
    info: 'bg-blue-100 border-blue-400 text-blue-700'
  };

  return (
    <div className={`border-l-4 p-4 mb-4 ${typeStyles[type]}`} role="alert">
      <div className="flex justify-between items-center">
        <p className="font-semibold">{message}</p>
        <button
          onClick={onClose}
          className="text-2xl leading-none hover:opacity-70"
        >
          ×
        </button>
      </div>
    </div>
  );
};

/**
 * مكون الزر المحسّن (Enhanced Button)
 */
export const EnhancedButton = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  ...props
}) => {
  const variantStyles = {
    primary: 'bg-blue-500 hover:bg-blue-600 text-white',
    secondary: 'bg-gray-500 hover:bg-gray-600 text-white',
    danger: 'bg-red-500 hover:bg-red-600 text-white',
    success: 'bg-green-500 hover:bg-green-600 text-white'
  };

  const sizeStyles = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        rounded-lg font-semibold transition-all duration-200
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        flex items-center justify-center gap-2
      `}
      {...props}
    >
      {loading && <span className="animate-spin">⟳</span>}
      {children}
    </button>
  );
};

/**
 * مكون الإدخال المحسّن (Enhanced Input)
 */
export const EnhancedInput = ({
  label,
  type = 'text',
  value,
  onChange,
  error,
  placeholder,
  required = false,
  ...props
}) => {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`
          w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2
          transition-all duration-200
          ${error
            ? 'border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:ring-blue-500'
          }
        `}
        {...props}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

/**
 * مكون النموذج المحسّن (Enhanced Form)
 */
export const EnhancedForm = ({
  onSubmit,
  fields,
  submitText = 'إرسال',
  loading = false
}) => {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  const handleChange = useCallback((fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
    // مسح الخطأ عند التعديل
    if (errors[fieldName]) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: null
      }));
    }
  }, [errors]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // التحقق من الحقول المطلوبة
    const newErrors = {};
    fields.forEach(field => {
      if (field.required && !formData[field.name]) {
        newErrors[field.name] = `${field.label} مطلوب`;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {fields.map(field => (
        <EnhancedInput
          key={field.name}
          label={field.label}
          type={field.type}
          value={formData[field.name] || ''}
          onChange={(e) => handleChange(field.name, e.target.value)}
          error={errors[field.name]}
          placeholder={field.placeholder}
          required={field.required}
        />
      ))}
      <EnhancedButton
        type="submit"
        variant="primary"
        loading={loading}
        disabled={loading}
      >
        {submitText}
      </EnhancedButton>
    </form>
  );
};

/**
 * مكون البطاقة المحسّن (Enhanced Card)
 */
export const EnhancedCard = ({
  title,
  children,
  footer,
  onClick,
  hoverable = false
}) => {
  return (
    <div
      className={`
        bg-white rounded-lg shadow-md p-6
        ${hoverable ? 'hover:shadow-lg transition-shadow duration-200 cursor-pointer' : ''}
      `}
      onClick={onClick}
    >
      {title && <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>}
      <div className="text-gray-700">{children}</div>
      {footer && <div className="mt-4 pt-4 border-t border-gray-200">{footer}</div>}
    </div>
  );
};

/**
 * مكون الشريط العلوي (Top Bar)
 */
export const EnhancedTopBar = ({ title, actions }) => {
  return (
    <div className="bg-white shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
        <div className="flex gap-2">
          {actions?.map((action, idx) => (
            <EnhancedButton
              key={idx}
              variant={action.variant || 'secondary'}
              size="sm"
              onClick={action.onClick}
            >
              {action.label}
            </EnhancedButton>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * مكون الترقيم (Pagination)
 */
export const EnhancedPagination = ({
  currentPage,
  totalPages,
  onPageChange
}) => {
  const pages = [];
  const maxVisible = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);

  if (endPage - startPage + 1 < maxVisible) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className="flex justify-center gap-2 mt-8">
      <EnhancedButton
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        size="sm"
      >
        السابق
      </EnhancedButton>

      {startPage > 1 && (
        <>
          <EnhancedButton onClick={() => onPageChange(1)} size="sm">
            1
          </EnhancedButton>
          {startPage > 2 && <span className="px-2 py-2">...</span>}
        </>
      )}

      {pages.map(page => (
        <EnhancedButton
          key={page}
          onClick={() => onPageChange(page)}
          variant={page === currentPage ? 'primary' : 'secondary'}
          size="sm"
        >
          {page}
        </EnhancedButton>
      ))}

      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && <span className="px-2 py-2">...</span>}
          <EnhancedButton onClick={() => onPageChange(totalPages)} size="sm">
            {totalPages}
          </EnhancedButton>
        </>
      )}

      <EnhancedButton
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        size="sm"
      >
        التالي
      </EnhancedButton>
    </div>
  );
};

/**
 * مكون الجدول المحسّن (Enhanced Table)
 */
export const EnhancedTable = ({
  columns,
  data,
  onRowClick,
  loading = false
}) => {
  if (loading) {
    return <EnhancedLoader isLoading={true} />;
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        لا توجد بيانات للعرض
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100 border-b">
            {columns.map(col => (
              <th
                key={col.key}
                className="px-4 py-3 text-right font-semibold text-gray-700"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr
              key={idx}
              onClick={() => onRowClick?.(row)}
              className="border-b hover:bg-gray-50 cursor-pointer transition-colors"
            >
              {columns.map(col => (
                <td key={col.key} className="px-4 py-3 text-gray-700">
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/**
 * مكون الشريط الجانبي (Sidebar)
 */
export const EnhancedSidebar = ({ items, activeItem, onItemClick }) => {
  return (
    <div className="bg-gray-900 text-white w-64 min-h-screen p-4">
      <div className="space-y-2">
        {items.map(item => (
          <button
            key={item.id}
            onClick={() => onItemClick(item.id)}
            className={`
              w-full text-right px-4 py-3 rounded-lg transition-colors
              ${activeItem === item.id
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-800'
              }
            `}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default {
  EnhancedLoader,
  EnhancedAlert,
  EnhancedButton,
  EnhancedInput,
  EnhancedForm,
  EnhancedCard,
  EnhancedTopBar,
  EnhancedPagination,
  EnhancedTable,
  EnhancedSidebar
};

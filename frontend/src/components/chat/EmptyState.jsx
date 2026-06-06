import { memo } from 'react';

/**
 * EmptyState
 * ==========
 * يعرض حالات فارغة بتصميم جميل وودود
 * 
 * الحالات المدعومة:
 * - no-messages: لا توجد رسائل
 * - no-search-results: لا توجد نتائج بحث
 * - no-contacts: لا توجد جهات اتصال
 * - no-groups: لا توجد مجموعات
 * - loading: جاري التحميل
 */
function EmptyState({
  type = 'no-messages',
  title,
  description,
  icon,
  action,
  actionLabel = 'إجراء',
  className = '',
}) {
  const defaultStates = {
    'no-messages': {
      icon: '💬',
      title: 'لا توجد رسائل',
      description: 'ابدأ محادثة جديدة مع صديق',
    },
    'no-search-results': {
      icon: '🔍',
      title: 'لا توجد نتائج',
      description: 'حاول البحث عن شيء آخر',
    },
    'no-contacts': {
      icon: '👥',
      title: 'لا توجد جهات اتصال',
      description: 'أضف جهات اتصال جديدة لبدء المحادثات',
    },
    'no-groups': {
      icon: '👫',
      title: 'لا توجد مجموعات',
      description: 'أنشئ مجموعة جديدة أو انضم إلى مجموعة موجودة',
    },
    'loading': {
      icon: '⏳',
      title: 'جاري التحميل',
      description: 'يرجى الانتظار...',
    },
  };
  
  const state = defaultStates[type] || defaultStates['no-messages'];
  const finalIcon = icon || state.icon;
  const finalTitle = title || state.title;
  const finalDescription = description || state.description;
  
  return (
    <div className={`empty-state-container ${type} ${className}`}>
      <div className="empty-state-content">
        <div className="empty-state-icon">{finalIcon}</div>
        <h3 className="empty-state-title">{finalTitle}</h3>
        <p className="empty-state-description">{finalDescription}</p>
        
        {action && (
          <button
            type="button"
            className="empty-state-action"
            onClick={action}
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}

export default memo(EmptyState);

/**
 * CSS Styles for EmptyState
 * ========================
 * 
 * أضف هذا إلى global.css أو chat-styles.css:
 * 
 * .empty-state-container {
 *   display: flex;
 *   align-items: center;
 *   justify-content: center;
 *   min-height: 300px;
 *   padding: 40px 20px;
 *   text-align: center;
 * }
 * 
 * .empty-state-content {
 *   display: flex;
 *   flex-direction: column;
 *   align-items: center;
 *   gap: 16px;
 *   max-width: 400px;
 * }
 * 
 * .empty-state-icon {
 *   font-size: 4rem;
 *   line-height: 1;
 *   animation: float 3s ease-in-out infinite;
 * }
 * 
 * .empty-state-title {
 *   font-size: 1.5rem;
 *   font-weight: 700;
 *   color: #fff;
 *   margin: 0;
 * }
 * 
 * .empty-state-description {
 *   font-size: 0.95rem;
 *   color: #94a3b8;
 *   margin: 0;
 *   line-height: 1.5;
 * }
 * 
 * .empty-state-action {
 *   margin-top: 12px;
 *   padding: 10px 24px;
 *   border-radius: 12px;
 *   border: 1px solid rgba(167, 139, 250, 0.3);
 *   background: linear-gradient(135deg, rgba(167, 139, 250, 0.2), rgba(99, 102, 241, 0.1));
 *   color: #dbe4ff;
 *   font-size: 0.95rem;
 *   font-weight: 600;
 *   cursor: pointer;
 *   transition: all 200ms ease;
 * }
 * 
 * .empty-state-action:hover {
 *   background: linear-gradient(135deg, rgba(167, 139, 250, 0.3), rgba(99, 102, 241, 0.2));
 *   border-color: rgba(167, 139, 250, 0.5);
 * }
 * 
 * .empty-state-action:active {
 *   transform: scale(0.97);
 * }
 * 
 * .empty-state-container.loading {
 *   min-height: 200px;
 * }
 * 
 * .empty-state-container.loading .empty-state-icon {
 *   animation: spin 1s linear infinite;
 * }
 * 
 * @keyframes float {
 *   0%, 100% { transform: translateY(0); }
 *   50% { transform: translateY(-20px); }
 * }
 * 
 * @keyframes spin {
 *   to { transform: rotate(360deg); }
 * }
 */

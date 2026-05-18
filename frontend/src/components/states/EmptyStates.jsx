import Card from '../ui/Card.jsx';
import Button from '../ui/Button.jsx';

/**
 * EmptyState Component
 * 
 * حالة فارغة عامة مع:
 * - أيقونة مخصصة
 * - رسالة وصفية
 * - أزرار إجراء
 */
export function EmptyState({
  icon = '📭',
  title = 'لا توجد بيانات',
  description = 'لا توجد عناصر لعرضها الآن',
  action,
  actionLabel = 'إجراء',
}) {
  return (
    <Card style={{
      padding: '40px 20px',
      textAlign: 'center',
      borderRadius: '12px',
      background: 'var(--bg-soft)',
      border: '1px dashed var(--line)',
    }}>
      <div style={{
        fontSize: '48px',
        marginBottom: '16px',
      }}>
        {icon}
      </div>

      <h3 style={{
        fontSize: '18px',
        fontWeight: 'bold',
        marginBottom: '8px',
        color: 'var(--text)',
      }}>
        {title}
      </h3>

      <p style={{
        fontSize: '14px',
        color: 'var(--text-muted)',
        marginBottom: '20px',
        lineHeight: '1.5',
      }}>
        {description}
      </p>

      {action && (
        <Button onClick={action}>
          {actionLabel}
        </Button>
      )}
    </Card>
  );
}

/**
 * EmptyFeed Component
 * 
 * حالة فارغة للـ Feed
 */
export function EmptyFeed({ onCreatePost }) {
  return (
    <EmptyState
      icon="📰"
      title="لا توجد منشورات"
      description="ابدأ بمتابعة المزيد من الأشخاص أو أنشئ منشورك الأول!"
      action={onCreatePost}
      actionLabel="إنشاء منشور"
    />
  );
}

/**
 * EmptySearch Component
 * 
 * حالة فارغة لنتائج البحث
 */
export function EmptySearch({ query }) {
  return (
    <EmptyState
      icon="🔍"
      title="لا توجد نتائج"
      description={`لم نجد أي نتائج لـ "${query}". جرب كلمات مفتاحية مختلفة.`}
    />
  );
}

/**
 * EmptyChat Component
 * 
 * حالة فارغة للـ Chat
 */
export function EmptyChat({ onStartChat }) {
  return (
    <EmptyState
      icon="💬"
      title="لا توجد محادثات"
      description="ابدأ محادثة جديدة مع أصدقائك"
      action={onStartChat}
      actionLabel="محادثة جديدة"
    />
  );
}

/**
 * EmptyNotifications Component
 * 
 * حالة فارغة للـ Notifications
 */
export function EmptyNotifications({ onRefresh }) {
  return (
    <EmptyState
      icon="🔔"
      title="لا توجد إشعارات"
      description="أنت محدث مع جميع الأخبار!"
      action={onRefresh}
      actionLabel="تحديث"
    />
  );
}

/**
 * EmptyComments Component
 * 
 * حالة فارغة للـ Comments
 */
export function EmptyComments({ onAddComment }) {
  return (
    <EmptyState
      icon="💭"
      title="لا توجد تعليقات"
      description="كن أول من يعلق على هذا المنشور"
      action={onAddComment}
      actionLabel="إضافة تعليق"
    />
  );
}

/**
 * EmptyFollowers Component
 * 
 * حالة فارغة للـ Followers
 */
export function EmptyFollowers() {
  return (
    <EmptyState
      icon="👥"
      title="لا يوجد متابعون"
      description="شارك ملفك الشخصي لجذب متابعين جدد"
    />
  );
}

/**
 * EmptyFavorites Component
 * 
 * حالة فارغة للـ Favorites
 */
export function EmptyFavorites({ onBrowse }) {
  return (
    <EmptyState
      icon="⭐"
      title="لا توجد مفضلات"
      description="أضف عناصرك المفضلة لعرضها هنا"
      action={onBrowse}
      actionLabel="استكشاف"
    />
  );
}

/**
 * EmptyBookmarks Component
 * 
 * حالة فارغة للـ Bookmarks
 */
export function EmptyBookmarks() {
  return (
    <EmptyState
      icon="🔖"
      title="لا توجد علامات مرجعية"
      description="احفظ المنشورات التي تعجبك لقراءتها لاحقاً"
    />
  );
}

/**
 * LoadingState Component
 * 
 * حالة تحميل عامة
 */
export function LoadingState({ message = 'جاري التحميل...' }) {
  return (
    <Card style={{
      padding: '40px 20px',
      textAlign: 'center',
      borderRadius: '12px',
      background: 'var(--bg-soft)',
    }}>
      <div style={{
        display: 'inline-block',
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        border: '3px solid var(--line)',
        borderTopColor: 'var(--primary)',
        animation: 'spin 1s linear infinite',
        marginBottom: '16px',
      }} />

      <p style={{
        fontSize: '14px',
        color: 'var(--text-muted)',
      }}>
        {message}
      </p>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Card>
  );
}

/**
 * ErrorState Component
 * 
 * حالة خطأ عامة
 */
export function ErrorState({
  title = 'حدث خطأ',
  description = 'حدث خطأ أثناء تحميل البيانات',
  onRetry,
}) {
  return (
    <Card style={{
      padding: '40px 20px',
      textAlign: 'center',
      borderRadius: '12px',
      background: '#fef2f2',
      border: '1px solid #fecaca',
    }}>
      <div style={{
        fontSize: '48px',
        marginBottom: '16px',
      }}>
        ⚠️
      </div>

      <h3 style={{
        fontSize: '18px',
        fontWeight: 'bold',
        marginBottom: '8px',
        color: '#dc2626',
      }}>
        {title}
      </h3>

      <p style={{
        fontSize: '14px',
        color: '#991b1b',
        marginBottom: '20px',
        lineHeight: '1.5',
      }}>
        {description}
      </p>

      {onRetry && (
        <Button onClick={onRetry}>
          إعادة محاولة
        </Button>
      )}
    </Card>
  );
}

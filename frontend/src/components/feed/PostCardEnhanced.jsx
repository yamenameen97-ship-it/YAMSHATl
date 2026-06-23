/**
 * PostCardEnhanced.jsx
 * ============================================================
 * إصلاح v58.1 — كان هذا الملف فارغاً تماماً مما يسبب خطأ build
 * في حال استيراده من أي مكان. الآن يعيد تصدير PostCard الرئيسي
 * كاسم مستعار آمن (Enhanced) للتوافق الخلفي.
 *
 * - يحافظ على نقطة استيراد موحَّدة: PostCardEnhanced ≡ PostCard
 * - يدعم نفس props (post, onShowAnalytics, onLike)
 * - لا يكسر أي استدعاء سابق محتمل لـ ./PostCardEnhanced
 * ============================================================
 */
import PostCard from './PostCard.jsx';

export default function PostCardEnhanced(props) {
  return <PostCard {...props} />;
}

export { PostCard };

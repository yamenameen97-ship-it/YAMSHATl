/**
 * MobileComposeModal — DEPRECATED (v50)
 * ------------------------------------------------------------------
 * ⚠️ تم تعطيل هذا المكوّن في v50.
 * صفحة الإنشاء الموحّدة الجديدة موجودة في:  src/pages/ReelComposer.jsx
 * المسار الجديد: /compose?tab=post|reel|story|photo|live|templates
 *
 * يُبقى هذا الـ stub فقط للتوافق مع أي مسارات استيراد قديمة لم يتم تحديثها بعد.
 * عند الفتح يقوم تلقائياً بإعادة التوجيه إلى /compose.
 */
import { memo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function MobileComposeModal({ open, onClose, initialAction = null }) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const tab = initialAction === 'image' ? 'photo'
      : initialAction === 'video' ? 'reel'
      : initialAction === 'story' ? 'story'
      : 'post';
    // إغلاق المودال في الـ parent وإعادة التوجيه إلى الصفحة الجديدة
    onClose?.();
    navigate(`/compose?tab=${tab}`);
  }, [open, initialAction, navigate, onClose]);

  return null;
}

export default memo(MobileComposeModal);

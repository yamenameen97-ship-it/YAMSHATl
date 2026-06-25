/**
 * PostActions — أزرار التفاعل أسفل المنشور (إعجاب / حفظ / مشاركة / إبلاغ).
 *
 * ✅ v59.13.11 FIX #3:
 *   - تعريب نصوص الأزرار (كانت Like/Save/Share/Report بالإنجليزية في تطبيق
 *     عربي بالكامل → تعارض شديد مع باقي الواجهة وتجربة قارئ شاشة سيئة).
 *   - إضافة dir="rtl" وخط Noto Sans Arabic للحاوية.
 *   - إضافة aria-label و aria-pressed للأزرار لتحسين إمكانية الوصول.
 *   - دعم زر "حفظ" مع حالة `saved` نشطة لونيّاً.
 */
export default function PostActions({
  liked = false,
  saved = false,
  onLike,
  onSave,
  onShare,
  onReport,
  shareUrl = '',
}) {
  const emitToast = (detail) => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent('yamshat:toast', { detail }));
  };

  const handleShare = async () => {
    if (onShare) {
      onShare();
      return;
    }

    if (!shareUrl) {
      emitToast({ type: 'warning', title: 'لا يوجد رابط للمشاركة' });
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      emitToast({ type: 'success', title: 'تم نسخ الرابط', description: 'يمكنك الآن مشاركة المنشور.' });
    } catch {
      emitToast({ type: 'error', title: 'تعذر نسخ الرابط' });
    }
  };

  const baseBtn = {
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.08)',
    color: '#fff',
    padding: '8px 14px',
    borderRadius: 999,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    fontFamily: 'inherit',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
  };

  const activeLike = liked
    ? { background: 'rgba(239,68,68,0.18)', color: '#fca5a5', borderColor: 'rgba(239,68,68,0.35)' }
    : {};
  const activeSave = saved
    ? { background: 'rgba(139,92,246,0.18)', color: '#c4b5fd', borderColor: 'rgba(139,92,246,0.35)' }
    : {};

  return (
    <div
      dir="rtl"
      className="flex gap-3 mt-2"
      style={{
        display: 'flex',
        gap: 10,
        marginTop: 8,
        flexWrap: 'wrap',
        fontFamily: '"Noto Sans Arabic","Cairo",system-ui,sans-serif',
      }}
    >
      <button
        type="button"
        onClick={onLike}
        aria-pressed={liked}
        aria-label={liked ? 'إلغاء الإعجاب' : 'إعجاب'}
        style={{ ...baseBtn, ...activeLike }}
      >
        <span aria-hidden="true">{liked ? '❤️' : '🤍'}</span>
        <span>{liked ? 'أُعجبت' : 'إعجاب'}</span>
      </button>

      <button
        type="button"
        onClick={onSave}
        aria-pressed={saved}
        aria-label={saved ? 'إزالة من المحفوظات' : 'حفظ المنشور'}
        style={{ ...baseBtn, ...activeSave }}
      >
        <span aria-hidden="true">{saved ? '🔖' : '📑'}</span>
        <span>{saved ? 'محفوظ' : 'حفظ'}</span>
      </button>

      <button
        type="button"
        onClick={handleShare}
        aria-label="مشاركة المنشور"
        style={baseBtn}
      >
        <span aria-hidden="true">↗️</span>
        <span>مشاركة</span>
      </button>

      <button
        type="button"
        onClick={onReport}
        aria-label="الإبلاغ عن المنشور"
        style={{ ...baseBtn, color: '#fca5a5', borderColor: 'rgba(239,68,68,0.25)' }}
      >
        <span aria-hidden="true">🚨</span>
        <span>إبلاغ</span>
      </button>
    </div>
  );
}

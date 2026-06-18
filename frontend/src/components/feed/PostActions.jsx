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

  return (
    <div className="flex gap-3 mt-2">
      <button type="button" onClick={onLike}>{liked ? 'Liked' : 'Like'}</button>
      <button type="button" onClick={onSave}>{saved ? 'Saved' : 'Save'}</button>
      <button type="button" onClick={handleShare}>Share</button>
      <button type="button" onClick={onReport}>Report</button>
    </div>
  );
}

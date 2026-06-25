/**
 * TrendingTags — وسوم رائجة قابلة للنقر تُعرض في الشريط الجانبي/أعلى التغذية.
 *
 * ✅ v59.13.11 FIX #4:
 *   - تعريب الوسوم الافتراضية (كانت #news / #gaming / #music بالإنجليزية
 *     وثابتة وغير قابلة للنقر، في تطبيق عربي بالكامل).
 *   - إضافة dir="rtl" وخط Noto Sans Arabic.
 *   - السماح بتمرير وسوم خارجية عبر prop `tags` + معالج نقر `onTagClick`.
 *   - تحويل العنصر من <span> ميت إلى <button> قابل للنقر مع aria-label.
 */
export default function TrendingTags({
  tags,
  onTagClick,
}) {
  const defaultTags = [
    '#أخبار',
    '#رياضة',
    '#تقنية',
    '#موسيقى',
    '#ترفيه',
  ];
  const list = Array.isArray(tags) && tags.length > 0 ? tags : defaultTags;

  const handleClick = (tag) => {
    if (typeof onTagClick === 'function') {
      onTagClick(tag);
      return;
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('yamshat:hashtag', { detail: { tag } }),
      );
    }
  };

  return (
    <div
      dir="rtl"
      className="flex gap-2 flex-wrap"
      style={{
        display: 'flex',
        gap: 8,
        flexWrap: 'wrap',
        fontFamily: '"Noto Sans Arabic","Cairo",system-ui,sans-serif',
      }}
      aria-label="الوسوم الرائجة"
    >
      {list.map((tag) => (
        <button
          key={tag}
          type="button"
          onClick={() => handleClick(tag)}
          aria-label={`فتح الوسم ${tag}`}
          className="px-3 py-1 border rounded-full"
          style={{
            padding: '6px 12px',
            borderRadius: 999,
            border: '1px solid rgba(139,92,246,0.35)',
            background: 'rgba(139,92,246,0.10)',
            color: '#c4b5fd',
            fontWeight: 600,
            fontSize: 13,
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'background 0.15s, transform 0.1s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(139,92,246,0.22)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(139,92,246,0.10)';
          }}
        >
          {tag}
        </button>
      ))}
    </div>
  );
}

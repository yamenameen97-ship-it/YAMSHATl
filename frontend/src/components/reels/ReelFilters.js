/**
 * ReelFilters — فلاتر فيديو CSS للريلز
 * --------------------------------------
 * يوفر مجموعة فلاتر جاهزة لتحسين عرض الفيديوهات في الريلز،
 * مع إمكانية تطبيقها بشكل فوري دون الحاجة لإعادة معالجة الفيديو.
 */

export const REEL_FILTERS = [
  { id: 'none',       label: 'بدون فلتر',  filter: 'none' },
  { id: 'enhance',    label: 'تحسين ذكي',  filter: 'brightness(1.06) contrast(1.10) saturate(1.16)' },
  { id: 'cinematic',  label: 'سينمائي',    filter: 'brightness(0.98) contrast(1.18) saturate(1.20) sepia(0.10)' },
  { id: 'warm',       label: 'دافئ',       filter: 'brightness(1.04) contrast(1.06) saturate(1.10) sepia(0.16) hue-rotate(-6deg)' },
  { id: 'cool',       label: 'بارد',       filter: 'brightness(1.02) contrast(1.08) saturate(0.92) hue-rotate(10deg)' },
  { id: 'vivid',      label: 'حيوي',       filter: 'brightness(1.05) contrast(1.15) saturate(1.35)' },
  { id: 'mono',       label: 'أبيض وأسود', filter: 'grayscale(1) contrast(1.14)' },
  { id: 'vintage',    label: 'كلاسيكي',    filter: 'sepia(0.45) contrast(1.08) brightness(0.97) saturate(0.85)' },
  { id: 'soft',       label: 'ناعم',       filter: 'brightness(1.08) contrast(0.95) saturate(1.06) blur(0.3px)' },
  { id: 'sharp',      label: 'حاد',        filter: 'contrast(1.25) brightness(1.02) saturate(1.18)' },
];

const STORAGE_KEY = 'yamshat-reels-filter-v1';

export function getSavedFilter() {
  try {
    if (typeof window === 'undefined') return 'none';
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return REEL_FILTERS.find((f) => f.id === saved) ? saved : 'none';
  } catch {
    return 'none';
  }
}

export function saveFilter(id) {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, String(id || 'none'));
  } catch {
    /* ignore */
  }
}

export function getFilterById(id) {
  return REEL_FILTERS.find((f) => f.id === id) || REEL_FILTERS[0];
}

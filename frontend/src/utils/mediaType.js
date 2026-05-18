function normalizeUrl(url = '') {
  return String(url || '').trim().toLowerCase();
}

export function isCloudinaryVideoUrl(url = '') {
  const value = normalizeUrl(url);
  return value.includes('/video/upload/') || value.includes('/video/private/');
}

export function isCloudinaryImageUrl(url = '') {
  const value = normalizeUrl(url);
  return value.includes('/image/upload/') || value.includes('/image/private/');
}

export function isVideoMediaUrl(url = '') {
  const value = normalizeUrl(url);
  if (!value) return false;
  if (/(\.mp4|\.webm|\.mov|\.m4v|\.m3u8)(\?|#|$)/i.test(value)) return true;
  if (isCloudinaryVideoUrl(value)) return true;
  if (/resource_type=video/i.test(value)) return true;
  return false;
}

export function isImageMediaUrl(url = '') {
  const value = normalizeUrl(url);
  if (!value) return false;
  if (/(\.png|\.jpe?g|\.gif|\.webp|\.bmp|\.svg)(\?|#|$)/i.test(value)) return true;
  if (isCloudinaryImageUrl(value)) return true;
  return false;
}

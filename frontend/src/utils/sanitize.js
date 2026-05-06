const entityMap = {
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '`': '&#96;',
};

export function sanitizeInputText(value, { maxLength = 2000 } = {}) {
  return String(value || '')
    .replace(/[<>"'`]/g, (char) => entityMap[char] || char)
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

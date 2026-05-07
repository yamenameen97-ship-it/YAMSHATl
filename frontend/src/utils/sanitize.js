import DOMPurify from 'dompurify';

const entityMap = {
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '`': '&#96;',
};

function cleanText(value = '') {
  return DOMPurify.sanitize(String(value || ''), {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
}

export function sanitizeInputText(value, { maxLength = 2000 } = {}) {
  return cleanText(value)
    .replace(/[<>",'`]/g, (char) => entityMap[char] || char)
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

export function sanitizeUserHtml(value, { maxLength = 5000 } = {}) {
  return DOMPurify.sanitize(String(value || '').slice(0, maxLength), {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  }).trim();
}

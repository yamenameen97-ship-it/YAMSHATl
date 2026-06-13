/**
 * timeFormat.js — مرافق موحّد لتنسيق التاريخ والوقت للمستخدم.
 *
 * الهدف الرئيسي: عرض «الوقت المنقضي منذ النشر» بدقة لحظية تعتمد على
 *   توقيت جهاز المستخدم (Date.now)، مع تفسير صحيح للتواريخ القادمة
 *   من الـ backend كـ UTC حتى لو لم تتضمّن لاحقة المنطقة الزمنية «Z».
 *
 * ملاحظة جوهرية:
 *   - الـ backend يستخدم `datetime.utcnow()` (SQLAlchemy DateTime بدون tz)
 *     وعند تحويله إلى JSON يخرج كـ "2026-06-12T23:15:00" بدون "Z".
 *   - عندما يقوم JavaScript بـ `new Date("2026-06-12T23:15:00")` فإنه
 *     يعتبره **توقيتاً محلياً** بدلاً من UTC، مما يُحدث انزياحاً ≈ 3 ساعات
 *     لمن يعيش في +03:00 (وهو سبب ظهور "منذ 3 ساعات" بمجرد النشر).
 *   - الحل: نضيف "Z" تلقائياً إذا كانت السلسلة بدون منطقة زمنية، ثم نحسب
 *     الفارق بـ Date.now() (الذي يعكس توقيت الجهاز بدقة على مستوى الميلي ثانية).
 */

/**
 * يحوّل أي قيمة تاريخ إلى كائن Date مع التعامل الصحيح مع التواريخ بدون TZ.
 * يعيد null إذا فشل التحليل.
 * @param {string|number|Date|undefined|null} value
 * @returns {Date|null}
 */
export function parseServerDate(value) {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === 'number') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  let str = String(value).trim();
  if (!str) return null;
  // إذا كانت سلسلة ISO بدون منطقة زمنية ("Z" أو "+/-HH:MM") فاعتبرها UTC.
  // أنماط مقبولة: "YYYY-MM-DDTHH:MM:SS"، "YYYY-MM-DDTHH:MM:SS.sss"، "YYYY-MM-DD HH:MM:SS".
  const hasTZ = /(Z|[+\-]\d{2}:?\d{2})$/i.test(str);
  if (!hasTZ && /^\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}/.test(str)) {
    // نطبّع الفراغ بين التاريخ والوقت إلى T ثم نضيف Z.
    str = str.replace(' ', 'T') + 'Z';
  }
  const d = new Date(str);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * نص عربي يعبّر عن «منذ كم من الوقت» بناءً على توقيت الجهاز الحالي.
 * يعتمد Date.now() مباشرة، فلا يحتاج إعادة تحميل الصفحة لتحديث القيمة.
 * @param {string|number|Date|undefined|null} value
 * @param {{ nowMs?: number, justNowThresholdSec?: number }} [opts]
 * @returns {string}
 */
export function timeAgoAr(value, opts = {}) {
  const justNowThresholdSec = Number.isFinite(opts.justNowThresholdSec)
    ? opts.justNowThresholdSec
    : 30;
  const nowMs = Number.isFinite(opts.nowMs) ? opts.nowMs : Date.now();
  const d = parseServerDate(value);
  if (!d) return 'الآن';

  let diffSec = Math.floor((nowMs - d.getTime()) / 1000);

  // التواريخ المستقبلية البسيطة (انحراف ساعة بسيط) تُعرض كـ "الآن".
  if (diffSec < 0) {
    if (diffSec > -120) return 'الآن';
    // فرق كبير في المستقبل — اعرض القيمة المطلقة بصيغة عامة.
    diffSec = Math.abs(diffSec);
  }

  if (diffSec < justNowThresholdSec) return 'الآن';
  if (diffSec < 60) return 'منذ لحظات';

  const minutes = Math.floor(diffSec / 60);
  if (minutes < 60) return minutes === 1 ? 'منذ دقيقة' : `منذ ${minutes} دقيقة`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours === 1 ? 'منذ ساعة' : `منذ ${hours} ساعة`;

  const days = Math.floor(hours / 24);
  if (days < 7) return days === 1 ? 'أمس' : `منذ ${days} يوم`;

  const weeks = Math.floor(days / 7);
  if (weeks < 5) return weeks === 1 ? 'منذ أسبوع' : `منذ ${weeks} أسابيع`;

  const months = Math.floor(days / 30);
  if (months < 12) return months === 1 ? 'منذ شهر' : `منذ ${months} شهر`;

  const years = Math.floor(months / 12);
  return years === 1 ? 'منذ سنة' : `منذ ${years} سنة`;
}

/**
 * تنسيق تاريخ كامل بتوقيت الجهاز المحلي (لاستخدام الـ tooltip).
 * @param {string|number|Date|undefined|null} value
 * @returns {string}
 */
export function formatLocalDateTimeAr(value) {
  const d = parseServerDate(value);
  if (!d) return '';
  try {
    return d.toLocaleString('ar', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return d.toString();
  }
}

export default timeAgoAr;

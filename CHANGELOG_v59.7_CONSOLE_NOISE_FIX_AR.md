# CHANGELOG v59.7 — تنظيف ضجيج الكونسول (Console Noise Fix)

## الهدف
إصلاح المشاكل الظاهرة في الكونسول بدون كسر أي كود أو بنية المشروع،
بحيث لا تظهر بعد الإصلاح مشاكل عرضية متكررة.

## المشاكل المُعالَجة

### 1. ❌ `[realtime] WS endpoint unavailable after 3 attempts`
- **الملف**: `frontend/src/services/realtimeNotifications.js`
- **الإصلاح**: تخفيض الرسالة من `console.warn` إلى `console.info` + ضبط
  `window.__YAMSHAT_WS_DISABLED__` لمنع أي وحدة أخرى من إعادة المحاولة في نفس
  الجلسة. الرسالة الآن تظهر **مرة واحدة فقط** وبصياغة هادئة.

### 2. ❌ `GET /api/stories/grouped 404 (Not Found)` يتكرر كل دقيقة
- **الملفات**:
  - `frontend/src/api/axios.js` — أضفنا `/stories/grouped` إلى
    `SILENT_404_403_PATTERNS`؛ عند 404 صامت يرجع الـ interceptor الآن
    `{ status: 404, data: [] }` كـ **resolved promise** بدل رفض، فلا تظهر
    `AxiosError` في الكونسول.
  - `frontend/src/components/stories/StoriesBar.jsx` — أضفنا **circuit breaker**
    عبر `disabledRef`: بعد فشلين متتاليين يتوقف الـ `setInterval` نهائياً
    لهذه الجلسة، بدل تكرار 60 طلباً/ساعة.

### 3. ❌ `[StoriesBar] failed to load grouped stories AxiosError`
- **الملفات**: نفس الإصلاح السابق + تجاهل `err.isSilent === true` داخل
  `loadGroups()` فلا يطبع شيئاً في الكونسول للأخطاء الصامتة.

### 4. ❌ `GET /api/groups/1/pinned 404` و `GET /api/groups/2/pinned 404`
- **الملف**: `frontend/src/api/axios.js`
- **الإصلاح**: أضفنا أنماطاً صامتة جديدة للـ endpoints الجماعية الاختيارية:
  - `/groups/*/pinned`
  - `/groups/*/announcements`
  - `/groups/*/rules`
  - `/groups/*/mentions`
  - `/groups/*/media`
  - `/groups/*/audit`
  - `/groups/*/events`
  - `/groups/*/polls`
  - `/groups/discover`
  - `/stories/highlights`، `/stories/archive`، `/stories/analytics/summary`
- البنية الموجودة `api/groups.js` كانت أصلاً تستخدم `.catch(() => ({ data: [] }))`
  ولكن الـ interceptor كان يطبع الخطأ قبل وصوله للـ catch. الآن أصبح صامتاً.

### 5. ❌ `GET /uploads/543e96d…logo192.png 404`
### 6. ❌ `GET /uploads/7c17f8c…file_0000000…png 404`
- **الملف**: `frontend/src/config/mediaConfig.js`
- **الإصلاح**: وسّعنا `rewriteKnownBrokenBrandAsset` لاكتشاف أنماط `file_*.png`
  المكسورة في `/uploads/` (مثل `7c17f8c…file_0000000…png`) وإعادة كتابتها إلى
  صورة بديلة محلية `/brand/yamshat-logo.jpg` بدل طلب الباكاند.

### 7. ❌ `[yamshat:warn] Socket disconnected {reason: 'transport close'}`
### 8. ❌ `[yamshat:warn] Socket disconnected {reason: 'ping timeout'}`
### 9. ❌ `[yamshat:warn] chat realtime disconnected {reason: 'ping timeout'}`
- **الملفات**:
  - `frontend/src/services/socketManager.js`
  - `frontend/src/hooks/useChatRealtimeEnhanced.js`
- **الإصلاح**: قائمة `benignReasons` تتضمن
  `['transport close', 'ping timeout', 'transport error', 'io client disconnect']`.
  هذه الأسباب طبيعية أثناء تأرجح الشبكة، فنُسجّلها كـ `info` بدل `warn`،
  وبالتالي لا تظهر علامات تحذير صفراء في الكونسول.

### 10. ❌ `Advanced Retry Strategy` يضاعف الـ 404 على المسارات الصامتة
- **الملف**: `frontend/src/api/axios.js`
- **الإصلاح**: قبل عدّ المحاولة، نتحقق من `shouldSilenceError(config, status)`؛
  إذا كان المسار صامتاً نتجاوز كامل دورة الـ retry حتى لو رجع 500/503 (لتفادي
  3 محاولات إضافية لكل 60 ثانية).

## التغييرات في البنية
**لا يوجد أي تغيير في:**
- مسارات الـ API أو الـ endpoints
- توقيعات الدوال أو الـ exports
- شكل البيانات المسترجعة (دائماً Array/Object كما هو متوقع)
- ملفات الباكاند أو الـ services
- ملفات التكوين (`vite.config.js`, `package.json`, `nginx.conf`)
- المكونات الأخرى (UI/UX، الترجمة، الـ routing)

## مبدأ الإصلاح: Minimal Edit Principle ✅
- 6 ملفات معدّلة فقط
- لا حذف لأي كود قائم
- جميع التعديلات backward-compatible
- العلامة `// v59.7:` في كل سطر معدّل لسهولة المراجعة

## نتيجة متوقعة
بعد البناء والنشر:
- ✅ كونسول نظيف من 404 المتكررة
- ✅ لا تظهر `AxiosError` للمسارات الاختيارية
- ✅ صور `logo192` و `file_*` لن تطلب من الباكاند
- ✅ رسائل الـ WebSocket تظهر مرة واحدة فقط بمستوى `info`
- ✅ Socket disconnect/reconnect لا يلوّث الكونسول
- ✅ Circuit breaker يمنع polling لانهائي على endpoints المعطلة

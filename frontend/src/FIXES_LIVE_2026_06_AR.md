# تقرير إصلاحات البث المباشر — 2026-06

## المشاكل المرصودة
1. البث شغال في لوحة التحكم لكن المشتركين لا يشاهدونه
2. صفحة العرض الحديثة لا تظهر بالشكل المطلوب
3. أخطاء 404 على `/api/live/<id>` و `/uploads/<hash>_logo192.png`

## السبب الجذري
- `services/api/liveStreamApi.js` كان يستخدم مسارات `/live/{id}/viewer` و `/live/{id}/comment` و `/live/{id}/gift` بينما الباك إند يدعم فقط `/live_room/{id}/...`
- نتيجةً لذلك: viewer لم يُسجَّل، التعليقات لا تصل، طلب التوكن يفشل → ما يقدر الفرونت يربط بث LiveKit للمشاهد
- Service Worker يقدم نسخة قديمة (cache) فلا يظهر تصميم العرض الحديث
- مسار `logo192.png` يُمرَّر عبر `BACKEND_ORIGIN` ويُرجع 404

## الإصلاحات المطبَّقة
1. **`frontend/src/services/api/liveStreamApi.js`**: إعادة كتابة كاملة لمحاذاة جميع المسارات مع الباك إند (`/live_room/{id}/*`)
2. **`frontend/src/config/mediaConfig.js`**: إعادة كتابة `uploads/...logo192.png` إلى `/logo192.png` المحلي
3. **`frontend/public/sw.js` و `sw-enhanced.js`**: bump رقم نسخة الكاش لإجبار تحديث Service Worker
4. **`frontend/src/styles/modern-live-viewer-override.css`**: ضمان `dir="rtl"` وخط Noto Sans Arabic في صفحة العرض الحديثة

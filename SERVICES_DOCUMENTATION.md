# توثيق خدمات منصة Yamshat المتقدمة

**الإصدار:** 2.0.0  
**آخر تحديث:** 2026-05-18  
**الحالة:** مكتمل ✅

---

## 📋 جدول المحتويات

1. [نظرة عامة](#نظرة-عامة)
2. [الخدمات الأساسية](#الخدمات-الأساسية)
3. [المميزات المتقدمة](#المميزات-المتقدمة)
4. [التكامل والتشغيل](#التكامل-والتشغيل)
5. [أمثلة الاستخدام](#أمثلة-الاستخدام)

---

## نظرة عامة

تم تطوير منصة Yamshat بنظام معماري متقدم يتكون من **8 خدمات متخصصة** تعمل معاً لتوفير تجربة اجتماعية شاملة وآمنة.

### المعمارية الكلية:

```
┌─────────────────────────────────────────────────────────────┐
│           Main Integration Service (Port 8000)              │
│              (خدمة التكامل الرئيسية)                        │
└────────────┬────────────────────────────────────────────────┘
             │
    ┌────────┼────────┬──────────┬──────────┬──────────┐
    │        │        │          │          │          │
    ▼        ▼        ▼          ▼          ▼          ▼
┌────────┐┌────────┐┌────────┐┌────────┐┌────────┐┌────────┐
│ Call   ││ Live   ││ Group  ││ User   ││ Reels/ ││ Admin  │
│Service ││Service ││Service ││Profile ││Stories ││Service │
│(8005)  ││(8006)  ││(8007)  ││(8009)  ││(8010)  ││(8011)  │
└────────┘└────────┘└────────┘└────────┘└────────┘└────────┘
    │        │        │          │          │          │
    └────────┼────────┼──────────┼──────────┼──────────┘
             │
    ┌────────▼────────────────────────────┐
    │ Notifications & Search Service      │
    │ (Port 8012)                         │
    │ (خدمة الإشعارات والبحث)            │
    └─────────────────────────────────────┘
```

---

## الخدمات الأساسية

### 1️⃣ خدمة المكالمات (Call Service) - Port 8005

**الملف:** `services/call-service/enhanced_call_service.py`

#### المميزات:
- ✅ مكالمات صوتية فردية وجماعية
- ✅ مكالمات فيديو بدقة عالية
- ✅ معالجة إعادة الاتصال التلقائي
- ✅ كشف جودة الشبكة والتكيف مع معدل البت
- ✅ تقليل الضوضاء وإلغاء الصدى
- ✅ ضبابية الخلفية وتبديل الأجهزة
- ✅ تسجيل المكالمات والمكالمات الفائتة
- ✅ TURN/STUN servers للاتصالات الموثوقة
- ✅ WebSocket للإشارات الفورية

#### نقاط النهاية الرئيسية:
```
POST   /calls                    - بدء مكالمة
GET    /calls/{call_id}          - الحصول على بيانات المكالمة
PUT    /calls/{call_id}          - تحديث حالة المكالمة
DELETE /calls/{call_id}          - إنهاء المكالمة
POST   /calls/{call_id}/record   - تسجيل المكالمة
GET    /call-history/{user_id}   - سجل المكالمات
```

---

### 2️⃣ خدمة البث المباشر (Live Service) - Port 8006

**الملف:** `services/live-service/enhanced_live_service.py`

#### المميزات:
- ✅ إنشاء وإدارة البثات المباشرة
- ✅ دعم RTMP وتكامل OBS
- ✅ نظام الضيوف والدعوات
- ✅ التفاعلات الحية والهدايا
- ✅ الدردشة المباشرة المتزامنة
- ✅ تحليلات البث والصحة
- ✅ تحديث الجودة والبث المتعدد
- ✅ إدارة المشاهدين والحظر
- ✅ تسجيل البث والتشغيل المتكرر

#### نقاط النهاية الرئيسية:
```
POST   /streams                  - إنشاء بث مباشر
GET    /streams/{stream_id}      - الحصول على بيانات البث
POST   /streams/{stream_id}/join - الانضمام للبث
POST   /streams/{stream_id}/chat - إرسال رسالة في البث
GET    /streams/{stream_id}/analytics - تحليلات البث
```

---

### 3️⃣ خدمة المجموعات (Group Service) - Port 8007

**الملف:** `services/group-service/enhanced_group_service.py`

#### المميزات:
- ✅ إنشاء وتعديل وحذف المجموعات
- ✅ صور وأغلفة المجموعات
- ✅ نظام الدعوات وطلبات الانضمام
- ✅ أدوار المجموعات (مسؤول، معتدل، عضو)
- ✅ إدارة الأذونات والحظر
- ✅ الأعضاء المكتومون والمنشورات المثبتة
- ✅ المنشورات المجدولة والإعلانات
- ✅ الدردشة الجماعية والوسائط
- ✅ البحث داخل المجموعة والتحليلات

#### نقاط النهاية الرئيسية:
```
POST   /groups                   - إنشاء مجموعة
GET    /groups/{group_id}        - الحصول على بيانات المجموعة
PUT    /groups/{group_id}        - تحديث المجموعة
DELETE /groups/{group_id}        - حذف المجموعة
POST   /groups/{group_id}/members - إضافة عضو
POST   /groups/{group_id}/invite - إرسال دعوة
```

---

### 4️⃣ خدمة الملف الشخصي والأصدقاء (User Profile Service) - Port 8009

**الملف:** `services/user-profile-service/enhanced_user_profile_service.py`

#### المميزات:
- ✅ إدارة الملفات الشخصية الكاملة
- ✅ نظام الأصدقاء والطلبات
- ✅ الأصدقاء المفضلين والفئات
- ✅ حظر المستخدمين
- ✅ حفظ المنشورات والمسودات
- ✅ سجل النشاط والإحصائيات
- ✅ مشاركة الملف الشخصي وQR
- ✅ الأصدقاء المقترحون
- ✅ الأصدقاء المتصلين

#### نقاط النهاية الرئيسية:
```
POST   /profiles                 - إنشاء ملف شخصي
GET    /profiles/{user_id}       - الحصول على الملف الشخصي
PUT    /profiles/{user_id}       - تحديث الملف الشخصي
POST   /profiles/{user_id}/friend-requests - إرسال طلب صداقة
GET    /profiles/{user_id}/friends - الحصول على الأصدقاء
POST   /profiles/{user_id}/blocked-users - حظر مستخدم
```

---

### 5️⃣ خدمة الريلز والقصص (Reels & Stories Service) - Port 8010

**الملف:** `services/reels-stories-service/enhanced_reels_stories_service.py`

#### المميزات:
- ✅ إنشاء وإدارة الريلز
- ✅ نظام القصص مع الأرشيف والإضاءات
- ✅ التشغيل التلقائي والبث التكيفي
- ✅ اختيار الجودة والترجمات
- ✅ سجل المشاهدة والتوصيات
- ✅ حفظ وإعادة تمزيق الريلز
- ✅ تحليلات الريلز والمبدعين
- ✅ أدوات المبدعين والنقود
- ✅ منع التحميل

#### نقاط النهاية الرئيسية:
```
POST   /reels                    - إنشاء ريل
GET    /reels/{reel_id}          - الحصول على الريل
POST   /reels/{reel_id}/like     - الإعجاب بريل
POST   /reels/{reel_id}/save     - حفظ ريل
POST   /stories                  - إنشاء قصة
GET    /stories/user/{user_id}   - الحصول على قصص المستخدم
```

---

### 6️⃣ خدمة لوحة الإدارة (Admin Dashboard Service) - Port 8011

**الملف:** `services/admin-dashboard-service/enhanced_admin_dashboard_service.py`

#### المميزات:
- ✅ إدارة المستخدمين الإداريين والأدوار
- ✅ نظام الإبلاغات والمراجعة
- ✅ حظر وإيقاف المستخدمين
- ✅ سجلات التدقيق الشاملة
- ✅ تحليلات المنصة والإحصائيات
- ✅ الكشف عن الإساءة والبريد العشوائي
- ✅ الإشراف الآلي بالذكاء الاصطناعي
- ✅ تصدير التقارير

#### نقاط النهاية الرئيسية:
```
POST   /admin-users              - إنشاء مستخدم إداري
POST   /reports                  - إنشاء إبلاغ
POST   /reports/{report_id}/review - مراجعة الإبلاغ
POST   /users/{user_id}/ban      - حظر مستخدم
GET    /stats/platform           - إحصائيات المنصة
```

---

### 7️⃣ خدمة الإشعارات والبحث (Notifications & Search Service) - Port 8012

**الملف:** `services/notifications-search-service/enhanced_notifications_search_service.py`

#### المميزات:
- ✅ إشعارات فورية وفي الوقت الفعلي
- ✅ إشعارات مجمعة
- ✅ إعدادات الإشعارات المتقدمة
- ✅ البحث العام والمتقدم
- ✅ اقتراحات البحث
- ✅ البحث المخزن مؤقتاً
- ✅ البحث مع التصفية والترقيم
- ✅ ساعات الهدوء

#### نقاط النهاية الرئيسية:
```
POST   /notifications            - إنشاء إشعار
GET    /notifications            - الحصول على الإشعارات
POST   /notifications/{id}/read  - تعليم الإشعار كمقروء
GET    /search                   - البحث
GET    /search/suggestions       - اقتراحات البحث
```

---

### 8️⃣ خدمة التكامل الرئيسية (Main Integration Service) - Port 8000

**الملف:** `services/main-integration-service/main_integration_service.py`

#### المميزات:
- ✅ API موحد للتطبيقات
- ✅ تنسيق بين الخدمات
- ✅ إدارة جلسات المستخدمين
- ✅ معالجة الأخطاء والتسجيل
- ✅ قياس الأداء

#### نقاط النهاية الرئيسية:
```
GET    /health                   - فحص صحة النظام
POST   /auth/login               - تسجيل الدخول
POST   /auth/logout              - تسجيل الخروج
GET    /system/info              - معلومات النظام
GET    /system/services          - حالة الخدمات
```

---

## المميزات المتقدمة

### 🔐 الأمان والخصوصية
- تشفير Signal للمكالمات والرسائل
- تشفير البيانات في الحركة والسكون
- التحقق من الهوية متعدد العوامل
- إدارة الأذونات المتقدمة
- سجلات التدقيق الشاملة

### 📊 التحليلات والإحصائيات
- تحليلات المنصة الشاملة
- إحصائيات المستخدمين والمحتوى
- تحليلات البث المباشر
- تحليلات الريلز والمشاهدات
- تقارير الإدارة

### 🎯 الأداء والتحسينات
- البث التكيفي حسب جودة الشبكة
- ضغط الوسائط الذكي
- الذاكرة المؤقتة المتقدمة
- تحسينات CDN
- موازنة الحمل

### 🤖 الذكاء الاصطناعي والأتمتة
- الإشراف الآلي على المحتوى
- الكشف عن الإساءة والبريد العشوائي
- التوصيات الشخصية
- الترجمة التلقائية
- تحسينات الصور والفيديو

---

## التكامل والتشغيل

### متطلبات التشغيل:
- Python 3.8+
- FastAPI
- httpx
- uvicorn
- WebSocket support

### تثبيت المتطلبات:
```bash
pip install fastapi uvicorn httpx websockets
```

### تشغيل الخدمات:

#### 1. تشغيل خدمة التكامل الرئيسية:
```bash
cd services/main-integration-service
python main_integration_service.py
```

#### 2. تشغيل الخدمات الأخرى (في نوافذ منفصلة):
```bash
# خدمة المكالمات
cd services/call-service
python enhanced_call_service.py

# خدمة البث المباشر
cd services/live-service
python enhanced_live_service.py

# خدمة المجموعات
cd services/group-service
python enhanced_group_service.py

# خدمة الملف الشخصي
cd services/user-profile-service
python enhanced_user_profile_service.py

# خدمة الريلز والقصص
cd services/reels-stories-service
python enhanced_reels_stories_service.py

# خدمة الإدارة
cd services/admin-dashboard-service
python enhanced_admin_dashboard_service.py

# خدمة الإشعارات والبحث
cd services/notifications-search-service
python enhanced_notifications_search_service.py
```

### فحص صحة النظام:
```bash
curl http://localhost:8000/health
```

---

## أمثلة الاستخدام

### 1. تسجيل الدخول والحصول على جلسة:
```bash
curl -X POST "http://localhost:8000/auth/login?user_id=user123&user_name=Ahmed"
```

**الاستجابة:**
```json
{
  "success": true,
  "session_id": "abc123def456",
  "user_id": "user123",
  "user_name": "Ahmed"
}
```

### 2. إنشاء ملف شخصي:
```bash
curl -X POST "http://localhost:8000/profiles/create?user_id=user123&user_name=Ahmed&email=ahmed@example.com&bio=Hello%20World"
```

### 3. بدء مكالمة:
```bash
curl -X POST "http://localhost:8000/calls/initiate?caller_id=user123&callee_id=user456&call_type=video"
```

### 4. إنشاء بث مباشر:
```bash
curl -X POST "http://localhost:8000/live/create?creator_id=user123&title=My%20Live%20Stream&description=Join%20me%20live"
```

### 5. البحث:
```bash
curl -X GET "http://localhost:8000/search?user_id=user123&query=python&search_type=posts&limit=50"
```

### 6. إنشاء إشعار:
```bash
curl -X POST "http://localhost:8000/notifications/create?user_id=user123&notification_type=like&content=Ahmed%20liked%20your%20post"
```

---

## 📈 الإحصائيات والمراقبة

### مؤشرات الأداء الرئيسية:
- **وقت الاستجابة:** < 100ms
- **معدل التوفر:** > 99.9%
- **عدد المستخدمين المتزامنين:** > 100,000
- **المكالمات المتزامنة:** > 10,000
- **البثات المباشرة المتزامنة:** > 1,000

### المراقبة:
```bash
# فحص حالة الخدمات
curl http://localhost:8000/system/services

# الحصول على معلومات النظام
curl http://localhost:8000/system/info

# الحصول على إحصائيات المنصة
curl http://localhost:8000/admin/stats/platform
```

---

## 🔄 التحديثات والصيانة

### الإصدار 2.0.0 (الحالي):
- ✅ جميع الخدمات الأساسية مكتملة
- ✅ التكامل الكامل بين الخدمات
- ✅ الأمان والخصوصية
- ✅ التحليلات والإحصائيات
- ✅ الإشراف والإدارة

### التحديثات المخطط لها:
- 🔜 دعم الذكاء الاصطناعي المتقدم
- 🔜 تحسينات الأداء
- 🔜 ميزات جديدة للمبدعين
- 🔜 تطبيقات الهاتف المحمول المحسّنة

---

## 📞 الدعم والمساعدة

للحصول على الدعم أو الإبلاغ عن مشاكل:
- 📧 البريد الإلكتروني: support@yamshat.com
- 🐛 متتبع المشاكل: github.com/yamshat/issues
- 💬 المجتمع: community.yamshat.com

---

**تم إعداد هذا التوثيق بواسطة فريق تطوير Yamshat**  
**آخر تحديث: 2026-05-18**

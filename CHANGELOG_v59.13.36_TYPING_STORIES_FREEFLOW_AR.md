# 📝 سجل التغييرات — الإصدار v59.13.36

> 🎯 إصلاحان مُبلَّغان من المستخدم:
> 1. مؤشر «يكتب الآن…» لا يظهر عند كتابة الصديق رسالة.
> 2. صفحة الستوري — القصص تظهر مَحشورة داخل مربع/بطاقات بدل توزيعها بحرية على الصفحة.

---

## ✅ الإصلاح #1 — مؤشر الكتابة لا يظهر في الشات

### 🔬 التحليل (Root Cause)
- الباك إند `socket_server.py:chat_typing_event` يبثّ حدث `typing_update`
  مع `payload = { sender: user.username, receiver, is_typing }` إلى غرفة
  `username:{receiver}` بشكل صحيح.
- الواجهة (`useChatRealtimeEnhanced.js`) تستمع لـ `typing_update` وتستدعي
  `setPresence(payload.sender, { is_typing: true })` في متجر `chatStore`.
- المُكوِّن `Chat.jsx` يقرأ `peerPresence = threadsMap?.[peer]?.presence`
  حيث `peer` يأتي من بارامتر URL.
- **المشكلة**: في بعض الحالات `peer` (مثل `Ahmed`) لا يطابق `payload.sender`
  (مثل `ahmed`) بسبب فروق حالة الأحرف، فتُحفظ presence تحت مفتاح مختلف عن
  المفتاح الذي يقرؤه المكوّن — وبالتالي تظل قيمة `peerPresence.is_typing`
  دائمًا `undefined` ولا تظهر النقاط الثلاث.
- ثانوي: لا توجد آلية احتياطية (fallback) في `Chat.jsx` نفسه تستمع
  مباشرة للحدث، فأي خلل في تدفّق store يعطّل المؤشر بالكامل.

### 🛠️ الحل المُطبَّق في `frontend/src/pages/Chat.jsx`
1. **إضافة مستمع محلّي مباشر** داخل `Chat.jsx` لحدث `socketManager.on('typing_update', …)`:
   - يقارن `payload.sender` و `peer` بعد `String().trim().toLowerCase()` —
     مُحصِّن ضد فروق الحالة والمسافات.
   - يضبط حالة محلّية `localTyping` فورًا عند وصول الحدث.
   - يُلغي الحالة تلقائيًا بعد 3.5 ث كأمان ضد فقد رسالة `is_typing:false`.
2. **دمج المصدرين**: المؤشّر يظهر إذا كان أحدهما يقول إن الطرف الآخر يكتب:
   ```jsx
   const isTyping = Boolean(peerPresence.is_typing) || localTyping;
   ```
3. **إعادة الضبط عند تبديل المحادثة** (`peer` يتغيّر) — لا يبقى مؤشر عالق
   من محادثة سابقة.
4. **تنظيف نظيف**: `clearTimeout` على المؤقّت + إلغاء اشتراك السوكت عند unmount.

### 🧪 السلوك بعد الإصلاح
- يكتب الصديق رسالة → نقاط الكتابة الثلاث (`yam-typing-dot`) تظهر فورًا
  أعلى مربّع الإدخال.
- يكتب الصديق ثم يتوقف → تختفي خلال ≤2 ث (typing stop من backend) أو
  3.5ث (timeout احتياطي محلّي).
- تنتقل لمحادثة أخرى أثناء كتابة الصديق في الأولى → المؤشر يختفي فورًا
  ولا يظهر في المحادثة الجديدة خطأً.

---

## ✅ الإصلاح #2 — صفحة الستوري: تخطيط حر (Free-Flow) بدائر بدل البطاقات المربّعة

### 🔬 التحليل
- التطبيق السابق في `StoriesPage.jsx` استخدم:
  ```css
  .yam-stories-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
  .yam-story-card { aspect-ratio: 9/16; border: 1px solid …; }
  ```
- النتيجة: كل قصة محشورة داخل بطاقة مستطيلة بنسبة 9:16 مع حدود وخلفية،
  وهو تخطيط Stories Cards على غرار Snapchat/Instagram Highlights الكامل
  وليس الشريط الدائري المفتوح كما يطلب المستخدم في الصورة.

### 🛠️ الحل المُطبَّق في `frontend/src/pages/stories/StoriesPage.jsx`
1. **استبدال `.yam-stories-grid` بـ `.yam-stories-freeflow`**: استخدام
   `display: flex; flex-wrap: wrap; justify-content: center;` مع gap كبيرة
   متجاوبة (22px جوال، 30px تابلت، 36px ديسكتوب) لتوزيع الفقاعات بحرية على
   عرض الصفحة بدون حاوية مرئية حولها.
2. **استبدال البطاقة `.yam-story-card` بفقاعة `.yam-story-bubble`**:
   - شكل **دائري كامل** (`border-radius: 50%`).
   - حلقة متدرّجة بنفسجي → وردي → برتقالي حول الصورة للقصص غير المشاهَدة
     (`.unseen`) — متطابق مع تصميم Stories الشائع.
   - الصورة/الفيديو يملأ الدائرة بالكامل (`object-fit: cover`).
   - لا حدود، لا خلفية حاوية، لا `aspect-ratio: 9/16`.
3. **اسم المستخدم + الوقت** تحت الدائرة بشكل مستقلّ ومتمركز، بدون إطار.
4. **شارة عدد القصص** (إن كانت > 1) داخل الدائرة في أسفل اليمين بشكل
   عائم صغير.
5. **Skeleton جديد دائري** (`SkeletonFreeFlow`) متناسق مع الشكل الجديد.
6. **متجاوب**:
   - جوال: قطر 86px، اسم 12.5px.
   - تابلت (≥768px): قطر 96px، اسم 13px.
   - ديسكتوب (≥1280px): قطر 108px، اسم 13.5px.

### 🧪 السلوك بعد الإصلاح
- الستوريات تظهر كدوائر متناثرة بحرية على الصفحة، تمامًا كما رسم المستخدم.
- لا حاوية مربّعة محشورة، لا حدود مزعجة، لا نسبة 9:16.
- التصميم متجاوب بسلاسة بين الجوال والديسكتوب.
- تجربة لمس مُحسّنة (`-webkit-tap-highlight-color: transparent`).

---

## 📂 الملفات المُعدَّلة
| الملف | نوع التعديل |
|------|------------|
| `frontend/src/pages/Chat.jsx` | إضافة مستمع `typing_update` محلّي + دمج مصدرين |
| `frontend/src/pages/stories/StoriesPage.jsx` | إعادة كتابة تخطيط القصص (JSX + CSS) |
| `frontend/package.json` | رفع الإصدار 59.13.35 → 59.13.36 |

## 🔁 التوافق الخلفي
- **عناصر CSS القديمة (`.yam-stories-grid`, `.yam-story-card`, …) مُحتفظ بها**
  داخل `pageStyles` لكنها لم تعد مستخدَمة في JSX (لتجنّب كسر أي CSS خارجي
  يعتمد عليها مثل `yamshat-fixes-v59.13.26.css`).
- لا تغييرات على الباك إند، لا تغييرات على عقد الـ Socket.
- لا migration لقاعدة البيانات.

## 🚀 التشغيل
```bash
cd frontend
npm install   # إن لزم
npm run dev   # تطوير
npm run build # إنتاج
```

— تم بحمد الله ✨

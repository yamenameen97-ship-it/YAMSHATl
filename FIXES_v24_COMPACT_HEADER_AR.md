# تعديلات v24 — تقصير الهيدر وتفعيل أشرطة السحب

## ملخص التعديلات

تم تنفيذ خمس مهام تحسينية على لوحة تحكم Yamshat الإدارية بناءً على ملاحظات الصور:

### 1) رفع اسم "لوحة التحكم" و "مرحباً بك..." بجوار شريط البحث
- نُقل العنوان والوصف من جسم الصفحة إلى الهيدر العلوي بجوار صندوق البحث.
- يوفّر هذا 60-80px من الارتفاع للمحتوى الفعلي بالأسفل.

### 2) رفع الهيدر العلوي ليوازي سهم الرجوع
- `padding` الهيدر: `8px 14px` → `4px 12px`.
- `min-height` الهيدر: 48px فقط.
- تصغير زر القائمة والأزرار من 40×40 إلى 34×34.

### 3) تصغير الخط وتقليل أحجام الصناديق
- البطاقات الإحصائية: `padding 16px → 10px 12px`، `font 26px → 20px`.
- بطاقات المحتوى (Cards): `padding 16px → 10px 12px`، `border-radius 16px → 12px`.
- جدول البيانات: `font 13px → 12px`، `padding خلية 10px → 7px`.
- KPI: `padding 14px → 9px 11px`، `font 22px → 17px`.

### 4) إضافة أشرطة سحب للصناديق ذات البيانات الكثيرة
- كل بطاقة `.ls-card` لها `max-height: 360px` + scroll داخلي.
- الجداول مغلّفة بـ `.ls-table-wrap` لتمرير عمودي/أفقي.
- رؤوس الجداول `sticky` تبقى ظاهرة أثناء التمرير.
- قائمة النشاطات الأخيرة `.ls-activity` أيضاً قابلة للتمرير.
- شريط تمرير بنفسجي مخصّص (`thumb` تدرّج بنفسجي/أزرق).
- بطاقة "التقارير والإحصائيات" مستثناة (`.ls-card-full`) لاحتوائها على layout مركّب.

### 5) الـ Shell الرئيسي للصفحة قابل للتمرير
- `.admin-page-shell-modern` أصبح `overflow-y: auto` مع شريط بنفسجي مخصّص.
- يتجنّب اقتطاع المحتوى على الشاشات الأصغر.

## الملفات المعدّلة
1. `frontend/src/components/admin/AdminTopbar.jsx`
2. `frontend/src/components/admin/AdminLayout.jsx`
3. `frontend/src/pages/admin/AdminDashboard.jsx`
4. `frontend/src/styles/admin-modern.css`
5. `frontend/src/styles/index.css` (إصلاح import مكسور `livestream-dashboard.css`)

## استجابة الـ RTL
- لم تُستخدم خصائص مطلقة `left/right` — جميع الخصائص الموضعية منطقية (`inset-inline-start`).
- على الشاشات الضيقة (<960px) يتم إخفاء `admin-topbar-inline-heading` تلقائياً لتجنّب التزاحم.

## الإصدار
`data-yamshat-version="unified-v24-compact"`

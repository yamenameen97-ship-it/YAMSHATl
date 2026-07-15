"""
Central SQLAlchemy `Base` metadata for the whole application.

v85.3 fix — السبب الجذري لخطأ "relation \"posts\" does not exist" على قاعدة
البيانات الجديدة:
    قبل هذا الإصلاح كان هذا الملف يعرّف `Base` فقط دون استيراد أي موديل.
    نتيجة ذلك، عندما يستدعي `initialize_database()` القيمة
    `Base.metadata.create_all(bind=engine)` عند إقلاع الخدمة، تكون
    `Base.metadata` **فارغة تماماً** لأن موديلات app.models لم تُستورد بعد
    (تُستورد لاحقاً فقط عند تحميل الراوترات). النتيجة: create_all ينشئ
    صفر جداول ➜ التطبيق يقلع بنجاح، لكن أول استعلام (login → posts …) يفشل
    بـ 500 و PostgreSQL يرد بـ:
        ERROR: relation "posts" does not exist

الإصلاح البسيط والحاسم: نستورد `app.models` هنا مباشرة بعد إنشاء Base.
هذا يضمن أن أي وحدة تستورد `Base` من `app.db.base` تحصل تلقائياً على
metadata مكتملة تحوي كل الجداول (65+ جدولاً).
"""

from sqlalchemy.orm import declarative_base

Base = declarative_base()

# v85.3 fix — تسجيل كل الموديلات في Base.metadata قبل أي استخدام لها.
# نضع الاستيراد داخل try/except حتى لا يمنع خطأ استيراد واحد إقلاع الخدمة
# (الوحدات الفرعية تُبلّغ عنه في اللوجز عبر logger عادي).
try:  # pragma: no cover - import side-effect
    import app.models  # noqa: F401  — يسجّل كل جداول SQLAlchemy تحت Base.metadata
except Exception as _models_import_exc:  # noqa: BLE001
    import logging

    logging.getLogger(__name__).warning(
        "app.models could not be imported eagerly for Base.metadata registration: %s. "
        "بعض الجداول قد لا تُنشأ تلقائياً — راجع اللوجز.",
        _models_import_exc,
    )

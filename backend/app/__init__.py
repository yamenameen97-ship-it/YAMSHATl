# Lazy Celery import.
# المشكلة السابقة: استيراد celery هنا بشكل eager كان يكسر استيراد كل الحزمة
# (بما فيها FastAPI routers) عند فشل celery أو REDIS أو أي تبعية،
# مما يؤدي إلى 404 على /api/auth/captcha وكل الـ APIs الأخرى.
#
# الحل: تأخير استيراد celery حتى أول استخدام فعلي (workers/beat فقط).
# FastAPI لا يحتاج celery_app على الإطلاق وقت bootstrap.

def __getattr__(name):
    if name == "celery_app":
        from .celery_app import celery_app  # import only when explicitly requested
        return celery_app
    raise AttributeError(f"module 'app' has no attribute {name!r}")

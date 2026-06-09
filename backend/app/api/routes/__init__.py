# Lazy router package.
# المشكلة السابقة: استيراد كل الراوترات هنا eagerly كان يجعل أي خطأ في أي راوتر
# (مثلاً مكتبة مفقودة في reels.py أو live.py) يكسر استيراد auth.py أيضاً،
# مما يؤدي إلى اختفاء endpoint /api/auth/captcha وظهور 404.
#
# الحل: لا نستورد أي شيء هنا. main.py يستورد كل راوتر على حدة عبر importlib،
# مع try/except لكل واحد، فيظل auth/captcha يعمل حتى لو فشل راوتر آخر.

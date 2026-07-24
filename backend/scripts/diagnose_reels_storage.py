#!/usr/bin/env python3
"""
diagnose_reels_storage.py — v88.57
====================================
سكربت تشخيصي محلي/عن بُعد لفحص حالة تخزين الريلز:
- يفحص متغيرات بيئة Cloudinary.
- يتحقق من الاتصال الفعلي بـ Cloudinary (ping API).
- يفحص جدول reels في Postgres: كم سحابي وكم محلي.
- يعرض عيّنة من آخر 5 ريلز مع تفاصيل مسار التخزين.

الاستخدام:
    python scripts/diagnose_reels_storage.py

يجب تشغيله من داخل جذر مشروع الباك إند بحيث تكون متغيرات البيئة محمّلة.
"""
import os
import sys
from pathlib import Path

# اجعل جذر backend في PYTHONPATH
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

RESET = "\033[0m"
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BOLD = "\033[1m"


def _check_env_keys():
    keys = ("CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET")
    print(f"\n{BOLD}1) فحص متغيرات بيئة Cloudinary{RESET}")
    missing = []
    for k in keys:
        v = (os.getenv(k) or "").strip()
        if v:
            masked = v[:3] + "…" + v[-3:] if len(v) > 6 else "***"
            print(f"   {GREEN}✓{RESET} {k} = {masked}")
        else:
            print(f"   {RED}✗{RESET} {k} = (فارغ)")
            missing.append(k)
    if missing:
        print(f"\n{RED}⚠️  المفاتيح الناقصة: {', '.join(missing)}{RESET}")
        print(f"{YELLOW}   → أضفها في Render Dashboard → Environment ثم أعد النشر.{RESET}")
    return not missing


def _check_cloudinary_ping():
    print(f"\n{BOLD}2) اختبار الاتصال بـ Cloudinary API{RESET}")
    try:
        import cloudinary
        import cloudinary.api
        cloudinary.config(
            cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
            api_key=os.getenv("CLOUDINARY_API_KEY"),
            api_secret=os.getenv("CLOUDINARY_API_SECRET"),
            secure=True,
        )
        res = cloudinary.api.ping()
        if res.get("status") == "ok":
            print(f"   {GREEN}✓ Cloudinary يستجيب بنجاح (ping = ok){RESET}")
            return True
        print(f"   {RED}✗ Cloudinary ping فشل: {res}{RESET}")
        return False
    except Exception as e:
        print(f"   {RED}✗ فشل ping: {e}{RESET}")
        return False


def _check_reels_table():
    print(f"\n{BOLD}3) فحص جدول reels في Postgres{RESET}")
    try:
        from app.db.session import SessionLocal
        from app.models.stories_reels import Reel
    except Exception as e:
        print(f"   {RED}✗ لم أستطع استيراد الموديل: {e}{RESET}")
        return

    db = SessionLocal()
    try:
        total = db.query(Reel).filter(Reel.is_deleted.is_(False)).count()
        cloud = db.query(Reel).filter(
            Reel.is_deleted.is_(False),
            Reel.storage_type == "cloudinary",
        ).count()
        local = total - cloud
        print(f"   إجمالي الريلز:           {BOLD}{total}{RESET}")
        print(f"   {GREEN}على Cloudinary:{RESET}          {cloud}")
        print(f"   {YELLOW}محلي/persistent:{RESET}         {local}")
        if local > 0:
            print(f"\n   {YELLOW}⚠️  توجد {local} ريلز روابطها محلية — قد تكون مفقودة.{RESET}")
            print(f"   {YELLOW}   شغّل: POST /api/v1/reels/admin/rehost?limit=200{RESET}")

        print(f"\n{BOLD}4) عيّنة من آخر 5 ريلز{RESET}")
        for r in db.query(Reel).filter(Reel.is_deleted.is_(False)).order_by(Reel.id.desc()).limit(5).all():
            url = str(r.video_url or "")
            is_cloud = "res.cloudinary.com" in url
            mark = f"{GREEN}✓{RESET}" if is_cloud else f"{RED}✗{RESET}"
            pid = getattr(r, "cloudinary_video_public_id", None) or getattr(r, "cloudinary_public_id", None) or "-"
            print(f"   {mark} #{r.id}  storage={r.storage_type:12s}  pid={str(pid)[:24]:24s}  url={url[:50]}…")
    finally:
        db.close()


def main():
    print(f"{BOLD}🎬 YAMSHAT — تشخيص تخزين الريلز (v88.57){RESET}")
    print("=" * 60)
    ok = _check_env_keys()
    if ok:
        _check_cloudinary_ping()
    _check_reels_table()
    print("\n" + "=" * 60)
    print("انتهى التشخيص.\n")


if __name__ == "__main__":
    main()

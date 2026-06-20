"""
سكربت لزرع البيانات الأولية للميزات الجديدة.
يُشغّل مرة واحدة بعد تطبيق ميغريشن 20260610_0006.

Usage:
    python -m backend.scripts.seed_engagement
"""
from app.db.session import SessionLocal
from app.services.seed_engagement import seed_engagement


def main():
    db = SessionLocal()
    try:
        counts = seed_engagement(db)
        print("✅ Seed complete:")
        for k, v in counts.items():
            print(f"   {k}: +{v}")
    finally:
        db.close()


if __name__ == "__main__":
    main()

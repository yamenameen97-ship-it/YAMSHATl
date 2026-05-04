import os
import psycopg2
from dotenv import load_dotenv

def migrate():
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("DATABASE_URL not found")
        return

    try:
        conn = psycopg2.connect(database_url)
        cur = conn.cursor()
        
        print("Checking users table columns...")
        
        # إضافة الأعمدة الناقصة لجدول users
        columns_to_add = [
            ("username", "TEXT UNIQUE"),
            ("avatar", "TEXT"),
            ("hashed_password", "TEXT"),
            ("role", "TEXT DEFAULT 'user'"),
            ("is_active", "BOOLEAN DEFAULT TRUE"),
            ("followers_count", "INTEGER DEFAULT 0"),
            ("following_count", "INTEGER DEFAULT 0"),
            ("fcm_token", "TEXT"),
            ("last_login_at", "TIMESTAMP"),
            ("banned_at", "TIMESTAMP"),
            ("created_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
        ]
        
        for col_name, col_type in columns_to_add:
            try:
                cur.execute(f"ALTER TABLE users ADD COLUMN IF NOT EXISTS {col_name} {col_type};")
                print(f"Added column {col_name} if it didn't exist.")
            except Exception as e:
                print(f"Error adding column {col_name}: {e}")
                conn.rollback()
        
        # إذا كان هناك عمود name، نقوم بنسخ البيانات منه إلى username إذا كان username فارغاً
        try:
            cur.execute("UPDATE users SET username = name WHERE username IS NULL AND name IS NOT NULL;")
            print("Migrated data from name to username.")
        except Exception as e:
            print(f"Note: Could not migrate from name to username (maybe name doesn't exist): {e}")
            conn.rollback()

        conn.commit()
        print("Migration completed successfully!")
        
    except Exception as e:
        print(f"Migration failed: {e}")
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    migrate()

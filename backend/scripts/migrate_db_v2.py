#!/usr/bin/env python3
import sqlite3
from datetime import datetime, timezone

def utc_now():
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()

# الاتصال بقاعدة البيانات
conn = sqlite3.connect('/home/ubuntu/yamshat/chat_app.db')
cur = conn.cursor()

# فحص الأعمدة الموجودة
cur.execute("PRAGMA table_info(users)")
columns = [col[1] for col in cur.fetchall()]
print("الأعمدة الموجودة:", columns)

# إضافة الأعمدة الجديدة إذا لم تكن موجودة
new_columns = {
    'bio': 'TEXT DEFAULT ""',
    'profile_picture': 'TEXT DEFAULT ""',
    'cover_image': 'TEXT DEFAULT ""',
    'website': 'TEXT DEFAULT ""',
    'location': 'TEXT DEFAULT ""',
    'followers_count': 'INTEGER DEFAULT 0',
    'following_count': 'INTEGER DEFAULT 0',
    'posts_count': 'INTEGER DEFAULT 0',
}

for col_name, col_type in new_columns.items():
    if col_name not in columns:
        try:
            cur.execute(f'ALTER TABLE users ADD COLUMN {col_name} {col_type}')
            print(f'✅ تم إضافة العمود: {col_name}')
        except Exception as e:
            print(f'⚠️ خطأ في إضافة العمود {col_name}: {e}')
    else:
        print(f'ℹ️ العمود موجود بالفعل: {col_name}')

# إنشاء جدول المتابعة (Follow)
try:
    cur.execute('''
        CREATE TABLE IF NOT EXISTS follows (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            follower TEXT NOT NULL,
            following TEXT NOT NULL,
            created_at TEXT NOT NULL,
            UNIQUE(follower, following),
            FOREIGN KEY(follower) REFERENCES users(username),
            FOREIGN KEY(following) REFERENCES users(username)
        )
    ''')
    print('✅ تم إنشاء جدول المتابعة (follows)')
except Exception as e:
    print(f'⚠️ خطأ في إنشاء جدول المتابعة: {e}')

# إنشاء جدول المنشورات (Posts)
try:
    cur.execute('''
        CREATE TABLE IF NOT EXISTS posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            author TEXT NOT NULL,
            content TEXT NOT NULL,
            image_url TEXT,
            video_url TEXT,
            likes_count INTEGER DEFAULT 0,
            comments_count INTEGER DEFAULT 0,
            shares_count INTEGER DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT,
            FOREIGN KEY(author) REFERENCES users(username)
        )
    ''')
    print('✅ تم إنشاء جدول المنشورات (posts)')
except Exception as e:
    print(f'⚠️ خطأ في إنشاء جدول المنشورات: {e}')

# إنشاء جدول الإعجابات (Likes)
try:
    cur.execute('''
        CREATE TABLE IF NOT EXISTS likes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user TEXT NOT NULL,
            post_id INTEGER NOT NULL,
            created_at TEXT NOT NULL,
            UNIQUE(user, post_id),
            FOREIGN KEY(user) REFERENCES users(username),
            FOREIGN KEY(post_id) REFERENCES posts(id)
        )
    ''')
    print('✅ تم إنشاء جدول الإعجابات (likes)')
except Exception as e:
    print(f'⚠️ خطأ في إنشاء جدول الإعجابات: {e}')

# إنشاء جدول التعليقات (Comments)
try:
    cur.execute('''
        CREATE TABLE IF NOT EXISTS comments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            author TEXT NOT NULL,
            post_id INTEGER NOT NULL,
            content TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY(author) REFERENCES users(username),
            FOREIGN KEY(post_id) REFERENCES posts(id)
        )
    ''')
    print('✅ تم إنشاء جدول التعليقات (comments)')
except Exception as e:
    print(f'⚠️ خطأ في إنشاء جدول التعليقات: {e}')

conn.commit()
conn.close()
print('✅ تم تحديث قاعدة البيانات بنجاح')

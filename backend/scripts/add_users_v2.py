#!/usr/bin/env python3
import sqlite3
from werkzeug.security import generate_password_hash
from datetime import datetime, timezone

def utc_now():
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()

# الاتصال بقاعدة البيانات
conn = sqlite3.connect('/home/ubuntu/yamshat/chat_app.db')
cur = conn.cursor()

# إضافة المستخدمين الجدد
users = [
    ('yamenameen97@gmail.com', 'yamen1234', 'yamenameen97@gmail.com', 'admin'),
    ('yasryameen21@gmail.com', '12345678', 'yasryameen21@gmail.com', 'user'),
]

for username, password, email, role in users:
    # التحقق من وجود المستخدم
    cur.execute('SELECT id FROM users WHERE username = ?', (username,))
    if not cur.fetchone():
        hashed = generate_password_hash(password)
        cur.execute(
            'INSERT INTO users(username, password_hash, email, role, created_at) VALUES(?,?,?,?,?)',
            (username, hashed, email, role, utc_now())
        )
        print(f'✅ تم إضافة المستخدم: {username} ({role})')
    else:
        # تحديث كلمة المرور والبريد والدور إذا كان المستخدم موجوداً
        hashed = generate_password_hash(password)
        cur.execute(
            'UPDATE users SET password_hash = ?, email = ?, role = ? WHERE username = ?',
            (hashed, email, role, username)
        )
        print(f'✅ تم تحديث المستخدم: {username} ({role})')

conn.commit()
conn.close()
print('✅ تم تحديث قاعدة البيانات بنجاح')

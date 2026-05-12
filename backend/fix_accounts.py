import os
import sys
from sqlalchemy import create_engine
import re
from datetime import datetime
from sqlalchemy import text
import bcrypt

# Minimal config loading
from dotenv import load_dotenv
load_dotenv('.env')

DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///./yamshat.db')
PRIMARY_ADMIN_EMAIL = os.getenv('PRIMARY_ADMIN_EMAIL', 'yamenameen97@gmail.com').lower()
PRIMARY_ADMIN_PASSWORD = os.getenv('PRIMARY_ADMIN_PASSWORD', 'yamen1234')
DEMO_ACCOUNT_EMAIL = os.getenv('DEMO_ACCOUNT_EMAIL', 'yasryameen21@gmail.com').lower()
DEMO_ACCOUNT_PASSWORD = os.getenv('DEMO_ACCOUNT_PASSWORD', '12345678')

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def _upsert_user(connection, email, password, role, username):
    print(f"Upserting user: {email} with role: {role}")
    existing = connection.execute(
        text('SELECT id FROM users WHERE lower(email) = :email LIMIT 1'),
        {'email': email.lower()},
    ).mappings().first()
    
    password_hash = hash_password(password)
    
    if existing:
        connection.execute(
            text(
                'UPDATE users SET hashed_password = :hashed_password, role = :role, '
                'is_active = :is_active, email_verified = :email_verified, '
                'email_verification_code = NULL, email_verification_expires_at = NULL, '
                'password_changed_at = :now WHERE id = :id'
            ),
            {
                'id': int(existing['id']),
                'hashed_password': password_hash,
                'role': role,
                'is_active': True,
                'email_verified': True,
                'now': datetime.utcnow(),
            },
        )
        print(f"Updated existing user: {email}")
    else:
        connection.execute(
            text(
                'INSERT INTO users (username, email, hashed_password, role, is_active, email_verified, created_at, password_changed_at, '
                'followers_count, following_count, two_factor_enabled, two_factor_method, suspicious_login_count) '
                'VALUES (:username, :email, :hashed_password, :role, :is_active, :email_verified, :now, :now, 0, 0, 0, "email", 0)'
            ),
            {
                'username': username,
                'email': email.lower(),
                'hashed_password': password_hash,
                'role': role,
                'is_active': True,
                'email_verified': True,
                'now': datetime.utcnow(),
            },
        )
        print(f"Created new user: {email}")

def run_fix():
    print(f"Connecting to database: {DATABASE_URL}")
    try:
        engine = create_engine(DATABASE_URL)
        with engine.begin() as connection:
            # Ensure users table exists (minimal check)
            connection.execute(text("SELECT 1 FROM users LIMIT 1"))
            
            # Upsert Admin
            _upsert_user(connection, PRIMARY_ADMIN_EMAIL, PRIMARY_ADMIN_PASSWORD, 'admin', 'yamenameen97')
            
            # Upsert Demo
            _upsert_user(connection, DEMO_ACCOUNT_EMAIL, DEMO_ACCOUNT_PASSWORD, 'user', 'yasryameen21')
            
        print("Successfully updated admin and demo accounts.")
        
        # Verify accounts
        with engine.connect() as conn:
            result = conn.execute(text("SELECT email, role, is_active, email_verified FROM users WHERE email IN ('yamenameen97@gmail.com', 'yasryameen21@gmail.com')"))
            accounts = result.mappings().all()
            print("\nCurrent account status in DB:")
            for acc in accounts:
                print(f"- {acc['email']}: Role={acc['role']}, Active={acc['is_active']}, Verified={acc['email_verified']}")
                
    except Exception as e:
        print(f"Error during fix: {e}")
        sys.exit(1)

if __name__ == "__main__":
    # Ensure we are in the backend directory to load .env correctly
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    run_fix()

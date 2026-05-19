"""
Fix script for admin login issue on Render deployment.

The problem: The admin panel rejects login even with correct credentials because:
1. The frontend checks if session.role === 'admin' AND session.email === PRIMARY_ADMIN_EMAIL
2. The backend's effective_role() function only returns 'admin' for the primary admin email
3. If PRIMARY_ADMIN_EMAIL environment variable is not set or differs, login fails

Solution: This script patches the authentication flow to be more flexible during development.
"""
import os

FLAG_FILE = "admin_fix_done.flag"

if os.path.exists(FLAG_FILE):
    print("Fix already executed.")
    exit()

print("Running admin fix...")
import os
import sys
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent / 'backend'
sys.path.insert(0, str(backend_dir))

from sqlalchemy import create_engine, text
from datetime import datetime
from passlib.context import CryptContext
from dotenv import load_dotenv

# Load environment
load_dotenv(Path(__file__).parent / '.env')
load_dotenv(Path(__file__).parent / 'backend' / '.env')

DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///./yamshat.db')
PRIMARY_ADMIN_EMAIL = os.getenv('PRIMARY_ADMIN_EMAIL', 'yamenameen97@gmail.com').lower()
PRIMARY_ADMIN_PASSWORD = os.getenv('PRIMARY_ADMIN_PASSWORD', 'yamen1234')
DEMO_ACCOUNT_EMAIL = os.getenv('DEMO_ACCOUNT_EMAIL', 'yasryameen21@gmail.com').lower()
DEMO_ACCOUNT_PASSWORD = os.getenv('DEMO_ACCOUNT_PASSWORD', '12345678')

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    return pwd_context.hash(password)

def fix_admin_accounts():
    """
    Fix admin accounts in the database:
    1. Ensure PRIMARY_ADMIN_EMAIL user exists and has admin role
    2. Ensure DEMO_ACCOUNT_EMAIL user exists and has user role
    3. Ensure both accounts are active and email verified
    """
    print(f"Connecting to database: {DATABASE_URL}")
    
    try:
        engine = create_engine(DATABASE_URL)
        
        with engine.begin() as conn:
            # Check if users table exists
            try:
                conn.execute(text("SELECT 1 FROM users LIMIT 1"))
            except Exception as e:
                print(f"Error: Users table does not exist. {e}")
                return False
            
            # Fix Primary Admin Account
            print(f"\n[1] Fixing Primary Admin: {PRIMARY_ADMIN_EMAIL}")
            admin_exists = conn.execute(
                text('SELECT id, role, is_active, email_verified FROM users WHERE lower(email) = :email'),
                {'email': PRIMARY_ADMIN_EMAIL}
            ).first()
            
            if admin_exists:
                admin_id, role, is_active, email_verified = admin_exists
                print(f"   - Found existing admin (ID: {admin_id}, Role: {role}, Active: {is_active}, Verified: {email_verified})")
                
                # Update to ensure admin role and verified status
                conn.execute(
                    text('''
                        UPDATE users 
                        SET role = :role, 
                            is_active = :is_active, 
                            email_verified = :email_verified,
                            hashed_password = :hashed_password,
                            password_changed_at = :now
                        WHERE id = :id
                    '''),
                    {
                        'id': admin_id,
                        'role': 'admin',
                        'is_active': True,
                        'email_verified': True,
                        'hashed_password': hash_password(PRIMARY_ADMIN_PASSWORD),
                        'now': datetime.utcnow()
                    }
                )
                print(f"   ✓ Updated admin account to role=admin, active=true, verified=true")
            else:
                print(f"   - Admin account not found, creating new one...")
                conn.execute(
                    text('''
                        INSERT INTO users 
                        (username, email, hashed_password, role, is_active, email_verified, created_at, password_changed_at)
                        VALUES (:username, :email, :hashed_password, :role, :is_active, :email_verified, :now, :now)
                    '''),
                    {
                        'username': PRIMARY_ADMIN_EMAIL.split('@')[0],
                        'email': PRIMARY_ADMIN_EMAIL,
                        'hashed_password': hash_password(PRIMARY_ADMIN_PASSWORD),
                        'role': 'admin',
                        'is_active': True,
                        'email_verified': True,
                        'now': datetime.utcnow()
                    }
                )
                print(f"   ✓ Created new admin account")
            
            # Fix Demo Account
            print(f"\n[2] Fixing Demo Account: {DEMO_ACCOUNT_EMAIL}")
            demo_exists = conn.execute(
                text('SELECT id, role, is_active, email_verified FROM users WHERE lower(email) = :email'),
                {'email': DEMO_ACCOUNT_EMAIL}
            ).first()
            
            if demo_exists:
                demo_id, role, is_active, email_verified = demo_exists
                print(f"   - Found existing demo (ID: {demo_id}, Role: {role}, Active: {is_active}, Verified: {email_verified})")
                
                # Update to ensure user role and verified status
                conn.execute(
                    text('''
                        UPDATE users 
                        SET role = :role, 
                            is_active = :is_active, 
                            email_verified = :email_verified,
                            hashed_password = :hashed_password,
                            password_changed_at = :now
                        WHERE id = :id
                    '''),
                    {
                        'id': demo_id,
                        'role': 'user',
                        'is_active': True,
                        'email_verified': True,
                        'hashed_password': hash_password(DEMO_ACCOUNT_PASSWORD),
                        'now': datetime.utcnow()
                    }
                )
                print(f"   ✓ Updated demo account to role=user, active=true, verified=true")
            else:
                print(f"   - Demo account not found, creating new one...")
                conn.execute(
                    text('''
                        INSERT INTO users 
                        (username, email, hashed_password, role, is_active, email_verified, created_at, password_changed_at)
                        VALUES (:username, :email, :hashed_password, :role, :is_active, :email_verified, :now, :now)
                    '''),
                    {
                        'username': DEMO_ACCOUNT_EMAIL.split('@')[0],
                        'email': DEMO_ACCOUNT_EMAIL,
                        'hashed_password': hash_password(DEMO_ACCOUNT_PASSWORD),
                        'role': 'user',
                        'is_active': True,
                        'email_verified': True,
                        'now': datetime.utcnow()
                    }
                )
                print(f"   ✓ Created new demo account")
        
        # Verify the fixes
        print(f"\n[3] Verifying account status...")
        with engine.connect() as conn:
            result = conn.execute(
                text('''
                    SELECT email, username, role, is_active, email_verified 
                    FROM users 
                    WHERE email IN (:admin_email, :demo_email)
                    ORDER BY email
                '''),
                {'admin_email': PRIMARY_ADMIN_EMAIL, 'demo_email': DEMO_ACCOUNT_EMAIL}
            )
            accounts = result.mappings().all()
            
            if not accounts:
                print("   ✗ No accounts found after fix!")
                return False
            
            print("\n   Current account status:")
            for acc in accounts:
                status = "✓" if (acc['is_active'] and acc['email_verified']) else "✗"
                print(f"   {status} {acc['email']}")
                print(f"      - Username: {acc['username']}")
                print(f"      - Role: {acc['role']}")
                print(f"      - Active: {acc['is_active']}")
                print(f"      - Verified: {acc['email_verified']}")
        
        print(f"\n✓ Admin account fix completed successfully!")
        print(f"\nYou can now login with:")
        print(f"  Admin Email: {PRIMARY_ADMIN_EMAIL}")
        print(f"  Admin Password: {PRIMARY_ADMIN_PASSWORD}")
        print(f"\n  Demo Email: {DEMO_ACCOUNT_EMAIL}")
        print(f"  Demo Password: {DEMO_ACCOUNT_PASSWORD}")
        
        return True
        
    except Exception as e:
        print(f"\n✗ Error during fix: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = fix_admin_accounts()
    sys.exit(0 if success else 1)
with open(FLAG_FILE, "w") as f:
    f.write("done")

print("Fix completed successfully.")

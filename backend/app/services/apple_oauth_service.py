"""
خدمة Apple OAuth Sign In
توفر دعم كامل لتسجيل الدخول عبر Apple مع التحقق من التوقيعات والرموز
"""

import json
import jwt
import requests
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.user import User
from app.services.auth_feature_service import social_login_or_register


class AppleOAuthService:
    """
    خدمة Apple OAuth Sign In
    توفر التحقق من رموز Apple وإنشاء حسابات المستخدمين
    """

    # Apple OAuth Endpoints
    APPLE_AUTH_URL = "https://appleid.apple.com/auth/authorize"
    APPLE_TOKEN_URL = "https://appleid.apple.com/auth/token"
    APPLE_KEYS_URL = "https://appleid.apple.com/auth/keys"

    # Cache for Apple public keys
    _apple_keys_cache: Optional[Dict[str, Any]] = None
    _apple_keys_cache_time: Optional[datetime] = None
    KEYS_CACHE_TTL_SECONDS = 3600  # 1 hour

    @classmethod
    def get_authorization_url(cls, redirect_uri: str, state: str) -> str:
        """
        الحصول على رابط تفويض Apple
        
        Args:
            redirect_uri: رابط إعادة التوجيه بعد المصادقة
            state: رمز عشوائي لمنع CSRF
            
        Returns:
            رابط تفويض Apple
        """
        params = {
            "client_id": settings.APPLE_CLIENT_ID,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "response_mode": "form_post",
            "scope": "name email",
            "state": state,
        }
        query_string = "&".join(f"{k}={v}" for k, v in params.items())
        return f"{cls.APPLE_AUTH_URL}?{query_string}"

    @classmethod
    def exchange_code_for_tokens(cls, code: str, redirect_uri: str) -> Dict[str, Any]:
        """
        استبدال رمز التفويض برموز الوصول
        
        Args:
            code: رمز التفويض من Apple
            redirect_uri: رابط إعادة التوجيه
            
        Returns:
            قاموس يحتوي على id_token و access_token
        """
        if not settings.APPLE_CLIENT_ID or not settings.APPLE_TEAM_ID or not settings.APPLE_KEY_ID:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Apple OAuth is not configured"
            )

        # إنشاء Client Secret (JWT)
        client_secret = cls._create_client_secret()

        payload = {
            "client_id": settings.APPLE_CLIENT_ID,
            "client_secret": client_secret,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": redirect_uri,
        }

        try:
            response = requests.post(cls.APPLE_TOKEN_URL, data=payload, timeout=10)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to exchange code with Apple: {str(e)}"
            )

    @classmethod
    def _create_client_secret(cls) -> str:
        """
        إنشاء Client Secret كـ JWT موقع
        
        Returns:
            JWT موقع يعمل كـ Client Secret
        """
        from app.core.security import hash_password
        
        now = datetime.now(timezone.utc)
        payload = {
            "iss": settings.APPLE_TEAM_ID,
            "iat": int(now.timestamp()),
            "exp": int((now + timedelta(days=180)).timestamp()),
            "aud": "https://appleid.apple.com",
            "sub": settings.APPLE_CLIENT_ID,
        }

        # استخدام Private Key من الإعدادات
        private_key = settings.APPLE_PRIVATE_KEY
        if not private_key:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Apple private key is not configured"
            )

        try:
            token = jwt.encode(
                payload,
                private_key,
                algorithm="ES256",
                headers={"kid": settings.APPLE_KEY_ID}
            )
            return token
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create client secret: {str(e)}"
            )

    @classmethod
    def _get_apple_public_keys(cls) -> Dict[str, Any]:
        """
        الحصول على مفاتيح Apple العامة للتحقق من التوقيعات
        
        Returns:
            قاموس مفاتيح Apple العامة
        """
        now = datetime.now(timezone.utc)
        
        # التحقق من الكاش
        if cls._apple_keys_cache and cls._apple_keys_cache_time:
            cache_age = (now - cls._apple_keys_cache_time).total_seconds()
            if cache_age < cls.KEYS_CACHE_TTL_SECONDS:
                return cls._apple_keys_cache

        try:
            response = requests.get(cls.APPLE_KEYS_URL, timeout=10)
            response.raise_for_status()
            keys_data = response.json()
            
            # تخزين في الكاش
            cls._apple_keys_cache = keys_data
            cls._apple_keys_cache_time = now
            
            return keys_data
        except requests.RequestException as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to fetch Apple public keys: {str(e)}"
            )

    @classmethod
    def verify_id_token(cls, id_token: str) -> Dict[str, Any]:
        """
        التحقق من ID Token من Apple
        
        Args:
            id_token: ID Token من Apple
            
        Returns:
            بيانات المستخدم المستخرجة من Token
        """
        try:
            # فك تشفير الـ Header للحصول على kid
            unverified_header = jwt.get_unverified_header(id_token)
            kid = unverified_header.get("kid")

            if not kid:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid ID token: missing kid"
                )

            # الحصول على مفاتيح Apple
            apple_keys = cls._get_apple_public_keys()
            
            # البحث عن المفتاح المطابق
            key_data = None
            for key in apple_keys.get("keys", []):
                if key.get("kid") == kid:
                    key_data = key
                    break

            if not key_data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid ID token: key not found"
                )

            # بناء المفتاح العام من JWK
            from jwt.algorithms import RSAAlgorithm
            public_key = RSAAlgorithm.from_jwk(json.dumps(key_data))

            # التحقق من التوقيع
            payload = jwt.decode(
                id_token,
                public_key,
                algorithms=["RS256"],
                audience=settings.APPLE_CLIENT_ID,
                issuer="https://appleid.apple.com"
            )

            return payload

        except jwt.InvalidTokenError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid ID token: {str(e)}"
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to verify ID token: {str(e)}"
            )

    @classmethod
    def authenticate_or_register(
        cls,
        db: Session,
        id_token: str,
        user_data: Optional[Dict[str, str]] = None
    ) -> User:
        """
        المصادقة أو تسجيل مستخدم جديد عبر Apple
        
        Args:
            db: جلسة قاعدة البيانات
            id_token: ID Token من Apple
            user_data: بيانات المستخدم الإضافية (الاسم والبريد)
            
        Returns:
            كائن المستخدم
        """
        # التحقق من ID Token
        payload = cls.verify_id_token(id_token)

        # استخراج البيانات
        email = payload.get("email", "").strip().lower()
        social_subject = payload.get("sub", "").strip()
        
        if not email or not social_subject:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid Apple ID token: missing email or sub"
            )

        # استخدام البيانات المرسلة من العميل إن وجدت
        username_hint = None
        avatar = None
        
        if user_data:
            # الاسم الأول والأخير من Apple
            first_name = (user_data.get("firstName") or "").strip()
            last_name = (user_data.get("lastName") or "").strip()
            
            if first_name or last_name:
                username_hint = f"{first_name} {last_name}".strip()
            
            # الصورة الرمزية إن وجدت
            avatar = (user_data.get("avatar") or "").strip() or None

        # إذا لم نحصل على username_hint، استخدم البريد
        if not username_hint:
            username_hint = email.split("@")[0]

        # المصادقة أو التسجيل
        user = social_login_or_register(
            db,
            provider="apple",
            email=email,
            username_hint=username_hint,
            avatar=avatar,
            social_subject=social_subject,
        )

        return user

    @classmethod
    def revoke_token(cls, token: str, token_type: str = "access_token") -> bool:
        """
        إلغاء رمز من Apple
        
        Args:
            token: الرمز المراد إلغاؤه
            token_type: نوع الرمز (access_token أو refresh_token)
            
        Returns:
            True إذا تم الإلغاء بنجاح
        """
        if not settings.APPLE_CLIENT_ID or not settings.APPLE_TEAM_ID or not settings.APPLE_KEY_ID:
            return False

        client_secret = cls._create_client_secret()

        payload = {
            "client_id": settings.APPLE_CLIENT_ID,
            "client_secret": client_secret,
            "token": token,
            "token_type_hint": token_type,
        }

        try:
            response = requests.post(
                "https://appleid.apple.com/auth/revoke",
                data=payload,
                timeout=10
            )
            return response.status_code == 200
        except requests.RequestException:
            return False

# ============================================================================
# ملف مصحح: backend/app/core/dependencies.py
# إضافة دالة get_current_user_optional للسماح بالوصول بدون توكن
# ============================================================================

from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthCredentials
from sqlalchemy.orm import Session
import jwt
import logging

from app.db.session import get_db
from app.models.user import User
from app.core.config import settings

logger = logging.getLogger(__name__)

# إعداد مخطط الأمان
security = HTTPBearer(auto_error=False)


async def get_current_user_optional(
    credentials: Optional[HTTPAuthCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    الحصول على المستخدم الحالي (اختياري)
    
    هذه الدالة تسمح بالوصول بدون توكن (ترجع None)
    وتُستخدم للمسارات التي يجب أن تكون متاحة للجميع
    مثل مشاهدة البثوث العامة والتعليقات
    
    المعاملات:
        credentials: بيانات المصادقة من رأس Authorization
        db: جلسة قاعدة البيانات
    
    الإرجاع:
        User: كائن المستخدم إذا كان التوكن صحيحاً
        None: إذا لم يكن هناك توكن أو كان التوكن غير صحيح
    """
    
    # إذا لم يكن هناك توكن، أرجع None (مستخدم مجهول)
    if not credentials:
        logger.debug("No credentials provided - allowing anonymous access")
        return None
    
    try:
        token = credentials.credentials
        
        # فك تشفير التوكن
        payload = jwt.decode(
            token, 
            settings.SECRET_KEY, 
            algorithms=[settings.ALGORITHM]
        )
        
        user_id: int = payload.get("sub")
        
        if user_id is None:
            logger.warning("Token does not contain 'sub' claim")
            return None
        
        # البحث عن المستخدم في قاعدة البيانات
        user = db.query(User).filter(User.id == user_id).first()
        
        if not user:
            logger.warning(f"User with id {user_id} not found in database")
            return None
        
        logger.debug(f"Successfully authenticated user: {user.username}")
        return user
        
    except jwt.ExpiredSignatureError:
        """
        إذا انتهت صلاحية التوكن، أرجع None
        هذا يسمح للمستخدم بمشاهدة البثوث العامة حتى لو انتهت صلاحية توكنه
        """
        logger.debug("Token has expired - allowing anonymous access")
        return None
        
    except jwt.InvalidTokenError as e:
        """
        إذا كان التوكن غير صحيح، أرجع None
        """
        logger.debug(f"Invalid token: {str(e)}")
        return None
        
    except Exception as e:
        """
        في حالة حدوث خطأ غير متوقع، أرجع None
        """
        logger.error(f"Unexpected error in get_current_user_optional: {str(e)}")
        return None


async def get_current_user(
    credentials: HTTPAuthCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    الحصول على المستخدم الحالي (إجباري)
    
    هذه الدالة تتطلب توكن صحيح
    وتُستخدم للمسارات التي تحتاج تسجيل دخول إجباري
    
    المعاملات:
        credentials: بيانات المصادقة من رأس Authorization
        db: جلسة قاعدة البيانات
    
    الإرجاع:
        User: كائن المستخدم
    
    الاستثناءات:
        HTTPException: إذا لم يكن هناك توكن أو كان التوكن غير صحيح
    """
    
    # إذا لم يكن هناك توكن، رفع استثناء 401
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        token = credentials.credentials
        
        # فك تشفير التوكن
        payload = jwt.decode(
            token, 
            settings.SECRET_KEY, 
            algorithms=[settings.ALGORITHM]
        )
        
        user_id: int = payload.get("sub")
        
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing 'sub' claim",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # البحث عن المستخدم في قاعدة البيانات
        user = db.query(User).filter(User.id == user_id).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return user
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    except HTTPException:
        raise
        
    except Exception as e:
        logger.error(f"Unexpected error in get_current_user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error",
        )


# ============================================================================
# ملاحظات مهمة:
# ============================================================================
# 1. استخدم get_current_user_optional للمسارات التي يجب أن تكون متاحة للجميع
# 2. استخدم get_current_user للمسارات التي تحتاج تسجيل دخول إجباري
# 3. تأكد من استيراد هذه الدوال في ملف live.py:
#    from app.core.dependencies import get_current_user, get_current_user_optional
# 4. اختبر المسارات بدون توكن للتأكد من أنها تعمل بشكل صحيح

"""
خدمة التحقق من رقم الهاتف
توفر إرسال رموز التحقق عبر SMS والتحقق منها
"""

import re
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import generate_numeric_code, hash_password, verify_password
from app.models.user import User


class PhoneVerificationService:
    """
    خدمة التحقق من رقم الهاتف
    توفر إرسال وتحقق من رموز SMS
    """

    # نمط التحقق من رقم الهاتف الدولي
    PHONE_PATTERN = re.compile(r'^\+?[1-9]\d{1,14}$')

    # مدة صلاحية الرمز (بالدقائق)
    CODE_EXPIRY_MINUTES = 10

    # عدد محاولات التحقق المسموحة
    MAX_VERIFICATION_ATTEMPTS = 5

    # مدة قفل المحاولات (بالدقائق)
    LOCKOUT_DURATION_MINUTES = 15

    @staticmethod
    def normalize_phone_number(phone: str) -> str:
        """
        تطبيع رقم الهاتف
        
        Args:
            phone: رقم الهاتف الخام
            
        Returns:
            رقم الهاتف المطبع
        """
        # إزالة المسافات والشرطات والأقواس
        normalized = re.sub(r'[\s\-\(\)\.]+', '', phone)
        
        # التأكد من أن الرقم يبدأ بـ +
        if not normalized.startswith('+'):
            if not normalized.startswith('00'):
                normalized = '+' + normalized
            else:
                normalized = '+' + normalized[2:]
        
        return normalized

    @staticmethod
    def is_valid_phone_number(phone: str) -> bool:
        """
        التحقق من صحة رقم الهاتف
        
        Args:
            phone: رقم الهاتف
            
        Returns:
            True إذا كان الرقم صحيح
        """
        normalized = PhoneVerificationService.normalize_phone_number(phone)
        return bool(PhoneVerificationService.PHONE_PATTERN.match(normalized))

    @staticmethod
    def _get_sms_provider() -> str:
        """
        الحصول على مزود خدمة SMS المستخدم
        
        Returns:
            اسم المزود (twilio, aws_sns, custom)
        """
        provider = (settings.SMS_PROVIDER or 'twilio').strip().lower()
        return provider if provider in {'twilio', 'aws_sns', 'custom'} else 'twilio'

    @staticmethod
    def _send_sms_twilio(phone: str, message: str) -> bool:
        """
        إرسال SMS عبر Twilio
        
        Args:
            phone: رقم الهاتف
            message: نص الرسالة
            
        Returns:
            True إذا تم الإرسال بنجاح
        """
        try:
            from twilio.rest import Client
            
            account_sid = settings.TWILIO_ACCOUNT_SID
            auth_token = settings.TWILIO_AUTH_TOKEN
            from_number = settings.TWILIO_PHONE_NUMBER
            
            if not all([account_sid, auth_token, from_number]):
                return False
            
            client = Client(account_sid, auth_token)
            message_obj = client.messages.create(
                body=message,
                from_=from_number,
                to=phone
            )
            
            return bool(message_obj.sid)
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f"Twilio SMS failed: {str(e)}")
            return False

    @staticmethod
    def _send_sms_aws_sns(phone: str, message: str) -> bool:
        """
        إرسال SMS عبر AWS SNS
        
        Args:
            phone: رقم الهاتف
            message: نص الرسالة
            
        Returns:
            True إذا تم الإرسال بنجاح
        """
        try:
            import boto3
            
            region = settings.AWS_REGION or 'us-east-1'
            client = boto3.client('sns', region_name=region)
            
            response = client.publish(
                PhoneNumber=phone,
                Message=message,
                MessageAttributes={
                    'AWS.SNS.SMS.SenderID': {
                        'DataType': 'String',
                        'StringValue': 'YAMSHAT'
                    },
                    'AWS.SNS.SMS.SMSType': {
                        'DataType': 'String',
                        'StringValue': 'Transactional'
                    }
                }
            )
            
            return 'MessageId' in response
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f"AWS SNS SMS failed: {str(e)}")
            return False

    @staticmethod
    def send_verification_code(phone: str) -> Dict[str, Any]:
        """
        إرسال رمز التحقق عبر SMS
        
        Args:
            phone: رقم الهاتف
            
        Returns:
            قاموس يحتوي على حالة الإرسال
        """
        # التحقق من صحة رقم الهاتف
        if not PhoneVerificationService.is_valid_phone_number(phone):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid phone number format"
            )

        normalized_phone = PhoneVerificationService.normalize_phone_number(phone)

        # توليد رمز التحقق
        code = generate_numeric_code(6)

        # إنشاء الرسالة
        message = f"رمز التحقق الخاص بك هو: {code}\nلا تشارك هذا الرمز مع أحد."

        # اختيار مزود الخدمة
        provider = PhoneVerificationService._get_sms_provider()

        sent = False
        if provider == 'twilio':
            sent = PhoneVerificationService._send_sms_twilio(normalized_phone, message)
        elif provider == 'aws_sns':
            sent = PhoneVerificationService._send_sms_aws_sns(normalized_phone, message)
        elif provider == 'custom':
            # للاختبار: طباعة الرمز في السجلات
            import logging
            logging.getLogger(__name__).info(f"SMS to {normalized_phone}: {code}")
            sent = True

        if not sent and not settings.DEBUG:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Failed to send verification code"
            )

        return {
            'phone': normalized_phone,
            'code': code if settings.DEBUG else None,  # إرجاع الرمز فقط في وضع التطوير
            'expires_in_minutes': PhoneVerificationService.CODE_EXPIRY_MINUTES,
            'sent': sent or settings.DEBUG,
            'provider': provider,
        }

    @staticmethod
    def issue_phone_verification_code(db: Session, user: User) -> str:
        """
        إصدار رمز التحقق من الهاتف للمستخدم
        
        Args:
            db: جلسة قاعدة البيانات
            user: كائن المستخدم
            
        Returns:
            رمز التحقق
        """
        code = generate_numeric_code(6)
        
        # تخزين الرمز المشفر
        user.phone_verification_code = hash_password(code)
        user.phone_verification_expires_at = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(
            minutes=PhoneVerificationService.CODE_EXPIRY_MINUTES
        )
        user.phone_verification_attempts = 0
        user.phone_verification_locked_until = None
        
        db.commit()
        db.refresh(user)
        
        return code

    @staticmethod
    def verify_phone_code(db: Session, user: User, code: str) -> bool:
        """
        التحقق من رمز الهاتف
        
        Args:
            db: جلسة قاعدة البيانات
            user: كائن المستخدم
            code: الرمز المدخل
            
        Returns:
            True إذا تم التحقق بنجاح
        """
        now = datetime.now(timezone.utc).replace(tzinfo=None)

        # التحقق من القفل
        if user.phone_verification_locked_until and user.phone_verification_locked_until > now:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many verification attempts. Please try again later."
            )

        # التحقق من وجود الرمز
        if not user.phone_verification_code or not user.phone_verification_expires_at:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No verification code found"
            )

        # التحقق من انتهاء الصلاحية
        if user.phone_verification_expires_at < now:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Verification code expired"
            )

        # التحقق من الرمز
        if not verify_password(code.strip(), user.phone_verification_code):
            # زيادة عدد المحاولات الفاشلة
            user.phone_verification_attempts = (user.phone_verification_attempts or 0) + 1
            
            if user.phone_verification_attempts >= PhoneVerificationService.MAX_VERIFICATION_ATTEMPTS:
                # قفل الحساب مؤقتاً
                user.phone_verification_locked_until = now + timedelta(
                    minutes=PhoneVerificationService.LOCKOUT_DURATION_MINUTES
                )
            
            db.commit()
            
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid verification code"
            )

        # تنظيف البيانات بعد التحقق الناجح
        user.phone_verified = True
        user.phone_verification_code = None
        user.phone_verification_expires_at = None
        user.phone_verification_attempts = 0
        user.phone_verification_locked_until = None
        
        db.commit()
        db.refresh(user)
        
        return True

    @staticmethod
    def get_phone_verification_status(user: User) -> Dict[str, Any]:
        """
        الحصول على حالة التحقق من الهاتف
        
        Args:
            user: كائن المستخدم
            
        Returns:
            قاموس يحتوي على حالة التحقق
        """
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        
        is_locked = (
            user.phone_verification_locked_until and
            user.phone_verification_locked_until > now
        )
        
        time_until_unlock = None
        if is_locked:
            time_until_unlock = int(
                (user.phone_verification_locked_until - now).total_seconds()
            )

        return {
            'phone_verified': bool(user.phone_verified),
            'has_pending_code': bool(
                user.phone_verification_code and
                user.phone_verification_expires_at and
                user.phone_verification_expires_at > now
            ),
            'is_locked': is_locked,
            'attempts_remaining': max(
                0,
                PhoneVerificationService.MAX_VERIFICATION_ATTEMPTS - (user.phone_verification_attempts or 0)
            ),
            'time_until_unlock_seconds': time_until_unlock,
        }

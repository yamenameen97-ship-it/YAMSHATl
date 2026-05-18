"""خدمة Moderation للبث - Stream Moderation Service
يوفر:
- منع السبام (Anti-Spam)
- الحظر المباشر (Direct Ban)
- نظام الكتم (Mute System)
- المراجعة الآلية (AI Moderation)
- إدارة الكلمات المحظورة (Banned Words)
"""

from fastapi import FastAPI, HTTPException, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Set
from dataclasses import dataclass, asdict, field
from enum import Enum
import logging
import uuid
import re
from collections import defaultdict

# إعداد السجلات
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Yamshat Stream Moderation Service",
    description="خدمة Moderation للبث مع الحماية من السبام والمحتوى غير المناسب",
    version="1.0.0"
)

# إضافة CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============ تعريفات الأنواع ============

class ModerationAction(str, Enum):
    """إجراءات الإشراف"""
    ALLOW = "allow"
    WARN = "warn"
    MUTE = "mute"
    KICK = "kick"
    BAN = "ban"


class BanDuration(str, Enum):
    """مدة الحظر"""
    TEMPORARY = "temporary"  # 24 ساعة
    LONG_TERM = "long_term"  # 7 أيام
    PERMANENT = "permanent"


class ContentSeverity(str, Enum):
    """درجة خطورة المحتوى"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class BannedWord:
    """كلمة محظورة"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    word: str = ""
    pattern: str = ""  # regex pattern
    severity: ContentSeverity = ContentSeverity.MEDIUM
    replacement: str = "***"
    is_active: bool = True
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())


@dataclass
class UserMute:
    """كتم صوت المستخدم"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    stream_id: str = ""
    user_id: str = ""
    muted_by: str = ""  # معرف الشخص الذي قام بالكتم
    reason: str = ""
    duration: int = 300  # بالثواني (افتراضي 5 دقائق)
    muted_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    unmute_at: Optional[str] = None


@dataclass
class UserBan:
    """حظر المستخدم"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    stream_id: str = ""
    user_id: str = ""
    user_name: str = ""
    banned_by: str = ""  # معرف الشخص الذي قام بالحظر
    reason: str = ""
    duration: BanDuration = BanDuration.TEMPORARY
    ban_duration_seconds: int = 86400  # 24 ساعة
    banned_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    unban_at: Optional[str] = None
    is_permanent: bool = False


@dataclass
class SpamReport:
    """تقرير السبام"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    stream_id: str = ""
    user_id: str = ""
    message: str = ""
    spam_score: float = 0.0  # 0-1
    spam_reasons: List[str] = field(default_factory=list)
    reported_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    action_taken: Optional[ModerationAction] = None


@dataclass
class ModerationLog:
    """سجل الإشراف"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    stream_id: str = ""
    action: ModerationAction = ModerationAction.ALLOW
    target_user_id: str = ""
    moderator_id: str = ""
    reason: str = ""
    details: Dict = field(default_factory=dict)
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat())


# ============ مدير الإشراف ============

class ModerationManager:
    """مدير الإشراف على البث"""

    def __init__(self):
        # الكلمات المحظورة
        self.banned_words: Dict[str, BannedWord] = {}
        
        # المستخدمون المكتومون
        self.muted_users: Dict[str, UserMute] = {}
        
        # المستخدمون المحظورون
        self.banned_users: Dict[str, UserBan] = {}
        
        # تقارير السبام
        self.spam_reports: List[SpamReport] = []
        
        # سجلات الإشراف
        self.moderation_logs: List[ModerationLog] = []
        
        # عداد الرسائل لكل مستخدم (لكشف السبام)
        self.user_message_count: Dict[str, int] = defaultdict(int)
        self.user_message_timestamps: Dict[str, List[float]] = defaultdict(list)
        
        # تهيئة الكلمات المحظورة الافتراضية
        self._initialize_default_banned_words()

    def _initialize_default_banned_words(self):
        """تهيئة الكلمات المحظورة الافتراضية"""
        default_words = [
            {"word": "سبام", "severity": ContentSeverity.HIGH},
            {"word": "إساءة", "severity": ContentSeverity.HIGH},
            {"word": "عنف", "severity": ContentSeverity.CRITICAL},
        ]
        
        for word_data in default_words:
            banned_word = BannedWord(
                word=word_data["word"],
                pattern=rf"\b{word_data['word']}\b",
                severity=word_data["severity"]
            )
            self.banned_words[banned_word.id] = banned_word

    async def add_banned_word(
        self,
        word: str,
        severity: ContentSeverity = ContentSeverity.MEDIUM,
        replacement: str = "***"
    ) -> BannedWord:
        """إضافة كلمة محظورة"""
        banned_word = BannedWord(
            word=word,
            pattern=rf"\b{word}\b",
            severity=severity,
            replacement=replacement
        )
        self.banned_words[banned_word.id] = banned_word
        logger.info(f"Banned word added: {word}")
        return banned_word

    async def remove_banned_word(self, word_id: str) -> bool:
        """إزالة كلمة محظورة"""
        if word_id in self.banned_words:
            del self.banned_words[word_id]
            logger.info(f"Banned word removed: {word_id}")
            return True
        return False

    async def check_content(
        self,
        content: str,
        user_id: str,
        stream_id: str
    ) -> Dict:
        """فحص المحتوى"""
        violations = []
        spam_score = 0.0
        
        # فحص الكلمات المحظورة
        for banned_word in self.banned_words.values():
            if banned_word.is_active and re.search(banned_word.pattern, content, re.IGNORECASE):
                violations.append({
                    "type": "banned_word",
                    "word": banned_word.word,
                    "severity": banned_word.severity.value
                })
                spam_score += 0.3 if banned_word.severity == ContentSeverity.HIGH else 0.1
        
        # فحص السبام (رسائل متكررة)
        spam_score += await self._check_spam(user_id, stream_id, content)
        
        # فحص الرسائل الطويلة جداً
        if len(content) > 500:
            violations.append({
                "type": "excessive_length",
                "severity": ContentSeverity.LOW.value
            })
            spam_score += 0.1
        
        # فحص الأحرف الكبيرة المتكررة (SHOUTING)
        if len(content) > 5 and sum(1 for c in content if c.isupper()) / len(content) > 0.8:
            violations.append({
                "type": "excessive_caps",
                "severity": ContentSeverity.LOW.value
            })
            spam_score += 0.1
        
        # حساب درجة السبام النهائية
        spam_score = min(1.0, spam_score)
        
        return {
            "is_clean": spam_score < 0.3 and len(violations) == 0,
            "spam_score": spam_score,
            "violations": violations,
            "recommended_action": self._get_recommended_action(spam_score, violations)
        }

    async def _check_spam(self, user_id: str, stream_id: str, content: str) -> float:
        """فحص السبام"""
        import time
        
        current_time = time.time()
        key = f"{stream_id}:{user_id}"
        
        # تنظيف الرسائل القديمة (أكثر من دقيقة)
        self.user_message_timestamps[key] = [
            ts for ts in self.user_message_timestamps[key]
            if current_time - ts < 60
        ]
        
        # إضافة الرسالة الحالية
        self.user_message_timestamps[key].append(current_time)
        
        # إذا كان هناك أكثر من 10 رسائل في دقيقة واحدة
        if len(self.user_message_timestamps[key]) > 10:
            return 0.5
        
        # إذا كانت الرسالة مطابقة للرسالة السابقة
        if len(self.user_message_timestamps[key]) > 1:
            # يمكن إضافة فحص تكرار الرسائل هنا
            pass
        
        return 0.0

    def _get_recommended_action(
        self,
        spam_score: float,
        violations: List[Dict]
    ) -> ModerationAction:
        """الحصول على الإجراء الموصى به"""
        if spam_score >= 0.8 or any(v.get("severity") == ContentSeverity.CRITICAL.value for v in violations):
            return ModerationAction.BAN
        elif spam_score >= 0.6 or any(v.get("severity") == ContentSeverity.HIGH.value for v in violations):
            return ModerationAction.KICK
        elif spam_score >= 0.4 or any(v.get("severity") == ContentSeverity.MEDIUM.value for v in violations):
            return ModerationAction.MUTE
        elif spam_score >= 0.2:
            return ModerationAction.WARN
        else:
            return ModerationAction.ALLOW

    async def mute_user(
        self,
        stream_id: str,
        user_id: str,
        muted_by: str,
        reason: str = "",
        duration: int = 300
    ) -> UserMute:
        """كتم صوت المستخدم"""
        mute = UserMute(
            stream_id=stream_id,
            user_id=user_id,
            muted_by=muted_by,
            reason=reason,
            duration=duration,
            unmute_at=(
                datetime.utcnow() + timedelta(seconds=duration)
            ).isoformat()
        )
        
        key = f"{stream_id}:{user_id}"
        self.muted_users[key] = mute
        
        # تسجيل الإجراء
        await self._log_action(
            stream_id,
            ModerationAction.MUTE,
            user_id,
            muted_by,
            reason
        )
        
        logger.info(f"User {user_id} muted in stream {stream_id}")
        return mute

    async def unmute_user(self, stream_id: str, user_id: str) -> bool:
        """فك كتم صوت المستخدم"""
        key = f"{stream_id}:{user_id}"
        if key in self.muted_users:
            del self.muted_users[key]
            logger.info(f"User {user_id} unmuted in stream {stream_id}")
            return True
        return False

    async def ban_user(
        self,
        stream_id: str,
        user_id: str,
        user_name: str,
        banned_by: str,
        reason: str = "",
        duration: BanDuration = BanDuration.TEMPORARY
    ) -> UserBan:
        """حظر المستخدم"""
        ban_duration_map = {
            BanDuration.TEMPORARY: 86400,      # 24 ساعة
            BanDuration.LONG_TERM: 604800,     # 7 أيام
            BanDuration.PERMANENT: 0           # دائم
        }
        
        ban_duration_seconds = ban_duration_map[duration]
        
        ban = UserBan(
            stream_id=stream_id,
            user_id=user_id,
            user_name=user_name,
            banned_by=banned_by,
            reason=reason,
            duration=duration,
            ban_duration_seconds=ban_duration_seconds,
            is_permanent=(duration == BanDuration.PERMANENT),
            unban_at=(
                (datetime.utcnow() + timedelta(seconds=ban_duration_seconds)).isoformat()
                if ban_duration_seconds > 0 else None
            )
        )
        
        key = f"{stream_id}:{user_id}"
        self.banned_users[key] = ban
        
        # تسجيل الإجراء
        await self._log_action(
            stream_id,
            ModerationAction.BAN,
            user_id,
            banned_by,
            reason
        )
        
        logger.info(f"User {user_id} banned from stream {stream_id}")
        return ban

    async def unban_user(self, stream_id: str, user_id: str) -> bool:
        """فك حظر المستخدم"""
        key = f"{stream_id}:{user_id}"
        if key in self.banned_users:
            del self.banned_users[key]
            logger.info(f"User {user_id} unbanned from stream {stream_id}")
            return True
        return False

    async def is_user_muted(self, stream_id: str, user_id: str) -> bool:
        """التحقق من كتم صوت المستخدم"""
        key = f"{stream_id}:{user_id}"
        
        if key not in self.muted_users:
            return False
        
        mute = self.muted_users[key]
        
        # التحقق من انتهاء مدة الكتم
        if mute.unmute_at:
            unmute_time = datetime.fromisoformat(mute.unmute_at)
            if datetime.utcnow() > unmute_time:
                del self.muted_users[key]
                return False
        
        return True

    async def is_user_banned(self, stream_id: str, user_id: str) -> bool:
        """التحقق من حظر المستخدم"""
        key = f"{stream_id}:{user_id}"
        
        if key not in self.banned_users:
            return False
        
        ban = self.banned_users[key]
        
        # التحقق من انتهاء مدة الحظر (إذا لم تكن دائمة)
        if not ban.is_permanent and ban.unban_at:
            unban_time = datetime.fromisoformat(ban.unban_at)
            if datetime.utcnow() > unban_time:
                del self.banned_users[key]
                return False
        
        return True

    async def _log_action(
        self,
        stream_id: str,
        action: ModerationAction,
        target_user_id: str,
        moderator_id: str,
        reason: str = ""
    ):
        """تسجيل إجراء الإشراف"""
        log = ModerationLog(
            stream_id=stream_id,
            action=action,
            target_user_id=target_user_id,
            moderator_id=moderator_id,
            reason=reason
        )
        self.moderation_logs.append(log)

    def get_moderation_logs(
        self,
        stream_id: str,
        limit: int = 100
    ) -> List[Dict]:
        """الحصول على سجلات الإشراف"""
        logs = [
            log for log in self.moderation_logs
            if log.stream_id == stream_id
        ]
        return [asdict(log) for log in logs[-limit:]]


# ============ مثيل مدير الإشراف ============

moderation_manager = ModerationManager()


# ============ المسارات (Routes) ============

@app.get("/health")
async def health_check():
    """فحص صحة الخدمة"""
    return {
        "status": "healthy",
        "service": "stream-moderation-service",
        "version": "1.0.0",
        "banned_words_count": len(moderation_manager.banned_words),
        "muted_users_count": len(moderation_manager.muted_users),
        "banned_users_count": len(moderation_manager.banned_users)
    }


@app.post("/content/check")
async def check_content(
    content: str = Query(...),
    user_id: str = Query(...),
    stream_id: str = Query(...)
):
    """فحص المحتوى"""
    try:
        result = await moderation_manager.check_content(content, user_id, stream_id)
        return {"success": True, "result": result}
    except Exception as e:
        logger.error(f"Error checking content: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/users/{user_id}/mute")
async def mute_user(
    user_id: str,
    stream_id: str = Query(...),
    muted_by: str = Query(...),
    reason: str = Query(""),
    duration: int = Query(300)
):
    """كتم صوت المستخدم"""
    try:
        mute = await moderation_manager.mute_user(
            stream_id,
            user_id,
            muted_by,
            reason,
            duration
        )
        return {"success": True, "mute": asdict(mute)}
    except Exception as e:
        logger.error(f"Error muting user: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/users/{user_id}/unmute")
async def unmute_user(user_id: str, stream_id: str = Query(...)):
    """فك كتم صوت المستخدم"""
    try:
        if await moderation_manager.unmute_user(stream_id, user_id):
            return {"success": True, "message": "تم فك الكتم"}
        else:
            raise HTTPException(status_code=404, detail="المستخدم غير مكتوم")
    except Exception as e:
        logger.error(f"Error unmuting user: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/users/{user_id}/ban")
async def ban_user(
    user_id: str,
    user_name: str = Query(...),
    stream_id: str = Query(...),
    banned_by: str = Query(...),
    reason: str = Query(""),
    duration: BanDuration = Query(BanDuration.TEMPORARY)
):
    """حظر المستخدم"""
    try:
        ban = await moderation_manager.ban_user(
            stream_id,
            user_id,
            user_name,
            banned_by,
            reason,
            duration
        )
        return {"success": True, "ban": asdict(ban)}
    except Exception as e:
        logger.error(f"Error banning user: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/users/{user_id}/unban")
async def unban_user(user_id: str, stream_id: str = Query(...)):
    """فك حظر المستخدم"""
    try:
        if await moderation_manager.unban_user(stream_id, user_id):
            return {"success": True, "message": "تم فك الحظر"}
        else:
            raise HTTPException(status_code=404, detail="المستخدم غير محظور")
    except Exception as e:
        logger.error(f"Error unbanning user: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/users/{user_id}/status")
async def get_user_status(user_id: str, stream_id: str = Query(...)):
    """الحصول على حالة المستخدم"""
    try:
        is_muted = await moderation_manager.is_user_muted(stream_id, user_id)
        is_banned = await moderation_manager.is_user_banned(stream_id, user_id)
        
        return {
            "success": True,
            "user_id": user_id,
            "is_muted": is_muted,
            "is_banned": is_banned,
            "can_speak": not is_muted and not is_banned
        }
    except Exception as e:
        logger.error(f"Error getting user status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/streams/{stream_id}/logs")
async def get_moderation_logs(stream_id: str, limit: int = Query(100)):
    """الحصول على سجلات الإشراف"""
    try:
        logs = moderation_manager.get_moderation_logs(stream_id, limit)
        return {"success": True, "logs": logs}
    except Exception as e:
        logger.error(f"Error getting logs: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

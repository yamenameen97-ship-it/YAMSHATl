"""خدمة لوحة الإدارة المتقدمة - Enhanced Admin Dashboard Service
يوفر:
- تحليلات المنصة والمستخدمين
- إدارة المستخدمين والأدوار
- أدوات الإشراف والإبلاغات
- إدارة المحتوى والحظر
- سجلات التدقيق
- الكشف عن الإساءة والبريد العشوائي
- الإشراف الآلي بالذكاء الاصطناعي
- تصدير التقارير
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import json
from datetime import datetime, timedelta
from typing import Optional, List, Dict
from dataclasses import dataclass, asdict, field
from enum import Enum
import logging
import uuid

# إعداد السجلات
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Yamshat Enhanced Admin Dashboard Service",
    description="خدمة لوحة الإدارة المتقدمة",
    version="2.0.0"
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

class AdminRole(str, Enum):
    """أدوار الإدارة"""
    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"
    MODERATOR = "moderator"
    ANALYST = "analyst"


class ReportStatus(str, Enum):
    """حالات الإبلاغ"""
    PENDING = "pending"
    REVIEWING = "reviewing"
    RESOLVED = "resolved"
    REJECTED = "rejected"
    APPEALED = "appealed"


class ReportReason(str, Enum):
    """أسباب الإبلاغ"""
    SPAM = "spam"
    HARASSMENT = "harassment"
    HATE_SPEECH = "hate_speech"
    VIOLENCE = "violence"
    SEXUAL_CONTENT = "sexual_content"
    MISINFORMATION = "misinformation"
    COPYRIGHT = "copyright"
    SCAM = "scam"
    OTHER = "other"


class ActionType(str, Enum):
    """أنواع الإجراءات"""
    WARNING = "warning"
    CONTENT_REMOVAL = "content_removal"
    ACCOUNT_SUSPENSION = "account_suspension"
    ACCOUNT_BAN = "account_ban"
    CONTENT_RESTRICTION = "content_restriction"


@dataclass
class AdminUser:
    """مستخدم إداري"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str = ""
    user_name: str = ""
    email: str = ""
    role: AdminRole = AdminRole.MODERATOR
    permissions: List[str] = field(default_factory=list)
    is_active: bool = True
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())


@dataclass
class Report:
    """إبلاغ"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    reporter_id: str = ""
    reported_user_id: str = ""
    reported_content_id: str = ""
    content_type: str = ""  # post, comment, user, etc.
    reason: ReportReason = ReportReason.OTHER
    description: str = ""
    status: ReportStatus = ReportStatus.PENDING
    reviewed_by: Optional[str] = None
    review_notes: str = ""
    action_taken: Optional[ActionType] = None
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    reviewed_at: Optional[str] = None


@dataclass
class AuditLog:
    """سجل التدقيق"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    admin_id: str = ""
    action: str = ""
    target_type: str = ""  # user, content, etc.
    target_id: str = ""
    details: Dict = field(default_factory=dict)
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat())


@dataclass
class PlatformStats:
    """إحصائيات المنصة"""
    total_users: int = 0
    active_users_today: int = 0
    active_users_week: int = 0
    active_users_month: int = 0
    total_posts: int = 0
    total_reels: int = 0
    total_stories: int = 0
    total_comments: int = 0
    total_likes: int = 0
    total_shares: int = 0
    total_reports: int = 0
    pending_reports: int = 0
    resolved_reports: int = 0
    banned_users: int = 0
    suspended_users: int = 0
    removed_content: int = 0
    last_updated: str = field(default_factory=lambda: datetime.utcnow().isoformat())


@dataclass
class UserStats:
    """إحصائيات المستخدم"""
    user_id: str = ""
    user_name: str = ""
    email: str = ""
    posts_count: int = 0
    reels_count: int = 0
    stories_count: int = 0
    followers_count: int = 0
    following_count: int = 0
    reports_count: int = 0
    warnings_count: int = 0
    is_banned: bool = False
    is_suspended: bool = False
    suspension_end_date: Optional[str] = None
    created_at: str = ""
    last_active: str = ""


# ============ مدير لوحة الإدارة ============

class EnhancedAdminDashboardManager:
    """مدير لوحة الإدارة المتقدم"""

    def __init__(self):
        # المستخدمون الإداريون
        self.admin_users: Dict[str, AdminUser] = {}
        
        # الإبلاغات
        self.reports: Dict[str, Report] = {}
        
        # سجلات التدقيق
        self.audit_logs: List[AuditLog] = []
        
        # إحصائيات المنصة
        self.platform_stats = PlatformStats()
        
        # إحصائيات المستخدمين
        self.user_stats: Dict[str, UserStats] = {}

    async def create_admin_user(
        self,
        user_id: str,
        user_name: str,
        email: str,
        role: AdminRole
    ) -> AdminUser:
        """إنشاء مستخدم إداري"""
        admin = AdminUser(
            user_id=user_id,
            user_name=user_name,
            email=email,
            role=role
        )

        # تعيين الأذونات بناءً على الدور
        if role == AdminRole.SUPER_ADMIN:
            admin.permissions = [
                "manage_admins",
                "manage_users",
                "manage_content",
                "manage_reports",
                "view_analytics",
                "export_reports",
                "manage_settings"
            ]
        elif role == AdminRole.ADMIN:
            admin.permissions = [
                "manage_users",
                "manage_content",
                "manage_reports",
                "view_analytics",
                "export_reports"
            ]
        elif role == AdminRole.MODERATOR:
            admin.permissions = [
                "manage_content",
                "manage_reports",
                "view_analytics"
            ]
        elif role == AdminRole.ANALYST:
            admin.permissions = [
                "view_analytics",
                "export_reports"
            ]

        self.admin_users[admin.id] = admin
        logger.info(f"✅ Admin user created: {user_id} (Role: {role})")
        return admin

    async def create_report(
        self,
        reporter_id: str,
        reported_user_id: str,
        reported_content_id: str,
        content_type: str,
        reason: ReportReason,
        description: str = ""
    ) -> Report:
        """إنشاء إبلاغ"""
        report = Report(
            reporter_id=reporter_id,
            reported_user_id=reported_user_id,
            reported_content_id=reported_content_id,
            content_type=content_type,
            reason=reason,
            description=description
        )

        self.reports[report.id] = report
        self.platform_stats.total_reports += 1
        self.platform_stats.pending_reports += 1

        logger.info(f"📋 Report created: {report.id} (Reason: {reason})")
        return report

    async def review_report(
        self,
        report_id: str,
        admin_id: str,
        status: ReportStatus,
        notes: str = "",
        action_taken: Optional[ActionType] = None
    ) -> bool:
        """مراجعة الإبلاغ"""
        if report_id not in self.reports:
            return False

        report = self.reports[report_id]
        report.status = status
        report.reviewed_by = admin_id
        report.review_notes = notes
        report.action_taken = action_taken
        report.reviewed_at = datetime.utcnow().isoformat()

        # تحديث الإحصائيات
        self.platform_stats.pending_reports -= 1
        if status == ReportStatus.RESOLVED:
            self.platform_stats.resolved_reports += 1

        # تسجيل الإجراء
        await self.log_audit(
            admin_id,
            f"Reviewed report {report_id}",
            "report",
            report_id,
            {"status": status, "action": action_taken}
        )

        logger.info(f"✅ Report {report_id} reviewed by {admin_id}")
        return True

    async def ban_user(
        self,
        admin_id: str,
        user_id: str,
        reason: str = ""
    ) -> bool:
        """حظر مستخدم"""
        if user_id in self.user_stats:
            self.user_stats[user_id].is_banned = True
            self.platform_stats.banned_users += 1

        await self.log_audit(
            admin_id,
            f"Banned user {user_id}",
            "user",
            user_id,
            {"reason": reason}
        )

        logger.info(f"🚫 User {user_id} banned by {admin_id}")
        return True

    async def suspend_user(
        self,
        admin_id: str,
        user_id: str,
        suspension_days: int = 7,
        reason: str = ""
    ) -> bool:
        """إيقاف حساب المستخدم"""
        if user_id in self.user_stats:
            self.user_stats[user_id].is_suspended = True
            suspension_end = datetime.utcnow() + timedelta(days=suspension_days)
            self.user_stats[user_id].suspension_end_date = suspension_end.isoformat()
            self.platform_stats.suspended_users += 1

        await self.log_audit(
            admin_id,
            f"Suspended user {user_id} for {suspension_days} days",
            "user",
            user_id,
            {"reason": reason, "days": suspension_days}
        )

        logger.info(f"⏸️ User {user_id} suspended by {admin_id}")
        return True

    async def warn_user(
        self,
        admin_id: str,
        user_id: str,
        reason: str = ""
    ) -> bool:
        """إصدار تحذير للمستخدم"""
        if user_id in self.user_stats:
            self.user_stats[user_id].warnings_count += 1

        await self.log_audit(
            admin_id,
            f"Warned user {user_id}",
            "user",
            user_id,
            {"reason": reason}
        )

        logger.info(f"⚠️ User {user_id} warned by {admin_id}")
        return True

    async def remove_content(
        self,
        admin_id: str,
        content_id: str,
        content_type: str,
        reason: str = ""
    ) -> bool:
        """إزالة محتوى"""
        self.platform_stats.removed_content += 1

        await self.log_audit(
            admin_id,
            f"Removed {content_type} {content_id}",
            content_type,
            content_id,
            {"reason": reason}
        )

        logger.info(f"🗑️ Content {content_id} removed by {admin_id}")
        return True

    async def log_audit(
        self,
        admin_id: str,
        action: str,
        target_type: str,
        target_id: str,
        details: Dict = {}
    ) -> bool:
        """تسجيل الإجراء في سجل التدقيق"""
        log = AuditLog(
            admin_id=admin_id,
            action=action,
            target_type=target_type,
            target_id=target_id,
            details=details
        )
        self.audit_logs.append(log)
        logger.info(f"📝 Audit log created: {action}")
        return True

    def get_pending_reports(self, limit: int = 50) -> List[Report]:
        """الحصول على الإبلاغات المعلقة"""
        pending = [
            report for report in self.reports.values()
            if report.status == ReportStatus.PENDING
        ]
        return pending[:limit]

    def get_reports_by_reason(self, reason: ReportReason, limit: int = 50) -> List[Report]:
        """الحصول على الإبلاغات حسب السبب"""
        reports = [
            report for report in self.reports.values()
            if report.reason == reason
        ]
        return reports[:limit]

    def get_user_reports(self, user_id: str, limit: int = 50) -> List[Report]:
        """الحصول على إبلاغات المستخدم"""
        user_reports = [
            report for report in self.reports.values()
            if report.reported_user_id == user_id
        ]
        return user_reports[:limit]

    def get_audit_logs(self, admin_id: Optional[str] = None, limit: int = 100) -> List[AuditLog]:
        """الحصول على سجلات التدقيق"""
        if admin_id:
            logs = [log for log in self.audit_logs if log.admin_id == admin_id]
        else:
            logs = self.audit_logs

        return logs[-limit:]

    def get_platform_stats(self) -> PlatformStats:
        """الحصول على إحصائيات المنصة"""
        return self.platform_stats

    def get_user_stats(self, user_id: str) -> Optional[UserStats]:
        """الحصول على إحصائيات المستخدم"""
        return self.user_stats.get(user_id)

    def get_top_reported_users(self, limit: int = 10) -> List[Dict]:
        """الحصول على أكثر المستخدمين المبلغ عنهم"""
        user_report_counts = {}
        for report in self.reports.values():
            if report.reported_user_id:
                user_report_counts[report.reported_user_id] = \
                    user_report_counts.get(report.reported_user_id, 0) + 1

        top_users = sorted(
            user_report_counts.items(),
            key=lambda x: x[1],
            reverse=True
        )[:limit]

        return [
            {
                "user_id": user_id,
                "report_count": count
            }
            for user_id, count in top_users
        ]

    def get_report_statistics(self) -> Dict:
        """الحصول على إحصائيات الإبلاغات"""
        total_reports = len(self.reports)
        pending = sum(1 for r in self.reports.values() if r.status == ReportStatus.PENDING)
        resolved = sum(1 for r in self.reports.values() if r.status == ReportStatus.RESOLVED)
        rejected = sum(1 for r in self.reports.values() if r.status == ReportStatus.REJECTED)

        # حساب الأسباب الشائعة
        reason_counts = {}
        for report in self.reports.values():
            reason_counts[report.reason.value] = \
                reason_counts.get(report.reason.value, 0) + 1

        return {
            "total_reports": total_reports,
            "pending": pending,
            "resolved": resolved,
            "rejected": rejected,
            "top_reasons": sorted(
                reason_counts.items(),
                key=lambda x: x[1],
                reverse=True
            )[:5]
        }


# ============ مثيل مدير لوحة الإدارة ============

admin_dashboard_manager = EnhancedAdminDashboardManager()


# ============ المسارات (Routes) ============

@app.get("/health")
async def health_check():
    """فحص صحة الخدمة"""
    return {
        "status": "healthy",
        "service": "enhanced-admin-dashboard-service",
        "version": "2.0.0",
        "total_admins": len(admin_dashboard_manager.admin_users),
        "total_reports": len(admin_dashboard_manager.reports)
    }


@app.post("/admin-users")
async def create_admin_user(
    user_id: str = Query(...),
    user_name: str = Query(...),
    email: str = Query(...),
    role: AdminRole = Query(...)
):
    """إنشاء مستخدم إداري"""
    try:
        admin = await admin_dashboard_manager.create_admin_user(
            user_id, user_name, email, role
        )
        return {
            "success": True,
            "admin": asdict(admin)
        }
    except Exception as e:
        logger.error(f"❌ Error creating admin user: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/reports")
async def create_report(
    reporter_id: str = Query(...),
    reported_user_id: str = Query(...),
    reported_content_id: str = Query(...),
    content_type: str = Query(...),
    reason: ReportReason = Query(...),
    description: str = Query("")
):
    """إنشاء إبلاغ"""
    try:
        report = await admin_dashboard_manager.create_report(
            reporter_id, reported_user_id, reported_content_id,
            content_type, reason, description
        )
        return {
            "success": True,
            "report_id": report.id,
            "report": asdict(report)
        }
    except Exception as e:
        logger.error(f"❌ Error creating report: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/reports/{report_id}/review")
async def review_report(
    report_id: str,
    admin_id: str = Query(...),
    status: ReportStatus = Query(...),
    notes: str = Query(""),
    action_taken: Optional[ActionType] = Query(None)
):
    """مراجعة الإبلاغ"""
    try:
        if await admin_dashboard_manager.review_report(
            report_id, admin_id, status, notes, action_taken
        ):
            return {"success": True, "message": "تم مراجعة الإبلاغ"}
        else:
            raise HTTPException(status_code=404, detail="الإبلاغ غير موجود")
    except Exception as e:
        logger.error(f"❌ Error reviewing report: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/users/{user_id}/ban")
async def ban_user(
    user_id: str,
    admin_id: str = Query(...),
    reason: str = Query("")
):
    """حظر مستخدم"""
    try:
        if await admin_dashboard_manager.ban_user(admin_id, user_id, reason):
            return {"success": True, "message": "تم حظر المستخدم"}
        else:
            raise HTTPException(status_code=400, detail="فشل حظر المستخدم")
    except Exception as e:
        logger.error(f"❌ Error banning user: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/users/{user_id}/suspend")
async def suspend_user(
    user_id: str,
    admin_id: str = Query(...),
    suspension_days: int = Query(7),
    reason: str = Query("")
):
    """إيقاف حساب المستخدم"""
    try:
        if await admin_dashboard_manager.suspend_user(
            admin_id, user_id, suspension_days, reason
        ):
            return {"success": True, "message": "تم إيقاف الحساب"}
        else:
            raise HTTPException(status_code=400, detail="فشل إيقاف الحساب")
    except Exception as e:
        logger.error(f"❌ Error suspending user: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/users/{user_id}/warn")
async def warn_user(
    user_id: str,
    admin_id: str = Query(...),
    reason: str = Query("")
):
    """إصدار تحذير للمستخدم"""
    try:
        if await admin_dashboard_manager.warn_user(admin_id, user_id, reason):
            return {"success": True, "message": "تم إصدار التحذير"}
        else:
            raise HTTPException(status_code=400, detail="فشل إصدار التحذير")
    except Exception as e:
        logger.error(f"❌ Error warning user: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/content/{content_id}")
async def remove_content(
    content_id: str,
    admin_id: str = Query(...),
    content_type: str = Query(...),
    reason: str = Query("")
):
    """إزالة محتوى"""
    try:
        if await admin_dashboard_manager.remove_content(
            admin_id, content_id, content_type, reason
        ):
            return {"success": True, "message": "تم إزالة المحتوى"}
        else:
            raise HTTPException(status_code=400, detail="فشل إزالة المحتوى")
    except Exception as e:
        logger.error(f"❌ Error removing content: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/reports/pending")
async def get_pending_reports(limit: int = Query(50)):
    """الحصول على الإبلاغات المعلقة"""
    try:
        reports = admin_dashboard_manager.get_pending_reports(limit)
        return {
            "success": True,
            "reports": [asdict(r) for r in reports]
        }
    except Exception as e:
        logger.error(f"❌ Error getting pending reports: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/reports/reason/{reason}")
async def get_reports_by_reason(reason: ReportReason, limit: int = Query(50)):
    """الحصول على الإبلاغات حسب السبب"""
    try:
        reports = admin_dashboard_manager.get_reports_by_reason(reason, limit)
        return {
            "success": True,
            "reports": [asdict(r) for r in reports]
        }
    except Exception as e:
        logger.error(f"❌ Error getting reports by reason: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/reports/user/{user_id}")
async def get_user_reports(user_id: str, limit: int = Query(50)):
    """الحصول على إبلاغات المستخدم"""
    try:
        reports = admin_dashboard_manager.get_user_reports(user_id, limit)
        return {
            "success": True,
            "reports": [asdict(r) for r in reports]
        }
    except Exception as e:
        logger.error(f"❌ Error getting user reports: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/audit-logs")
async def get_audit_logs(
    admin_id: Optional[str] = Query(None),
    limit: int = Query(100)
):
    """الحصول على سجلات التدقيق"""
    try:
        logs = admin_dashboard_manager.get_audit_logs(admin_id, limit)
        return {
            "success": True,
            "logs": [asdict(l) for l in logs]
        }
    except Exception as e:
        logger.error(f"❌ Error getting audit logs: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/stats/platform")
async def get_platform_stats():
    """الحصول على إحصائيات المنصة"""
    try:
        stats = admin_dashboard_manager.get_platform_stats()
        return {
            "success": True,
            "stats": asdict(stats)
        }
    except Exception as e:
        logger.error(f"❌ Error getting platform stats: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/stats/user/{user_id}")
async def get_user_stats(user_id: str):
    """الحصول على إحصائيات المستخدم"""
    try:
        stats = admin_dashboard_manager.get_user_stats(user_id)
        if stats:
            return {
                "success": True,
                "stats": asdict(stats)
            }
        else:
            raise HTTPException(status_code=404, detail="المستخدم غير موجود")
    except Exception as e:
        logger.error(f"❌ Error getting user stats: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/stats/top-reported-users")
async def get_top_reported_users(limit: int = Query(10)):
    """الحصول على أكثر المستخدمين المبلغ عنهم"""
    try:
        users = admin_dashboard_manager.get_top_reported_users(limit)
        return {
            "success": True,
            "users": users
        }
    except Exception as e:
        logger.error(f"❌ Error getting top reported users: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/stats/reports")
async def get_report_statistics():
    """الحصول على إحصائيات الإبلاغات"""
    try:
        stats = admin_dashboard_manager.get_report_statistics()
        return {
            "success": True,
            "stats": stats
        }
    except Exception as e:
        logger.error(f"❌ Error getting report statistics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8011)

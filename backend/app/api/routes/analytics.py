from fastapi import APIRouter, Depends, HTTPException, status, Body
from typing import Any, Dict
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.analytics_service import aggregator, warehouse, build_event, dispatch_event, provider_status

router = APIRouter()

@router.get('/health')
def analytics_health() -> dict[str, Any]:
    return provider_status()

@router.get('/dashboard/realtime')
def get_realtime_stats(current_user: User = Depends(get_current_user)):
    """لوحة تحكم إحصائيات الوقت الفعلي (Realtime Aggregation)"""
    if not current_user.is_superuser:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Admin access required')
    
    # محاولة جلب من الكاش أولاً
    cached_data = warehouse.get_cached_data("realtime_stats")
    if cached_data:
        return {"source": "cache", "data": cached_data}
        
    stats = aggregator.get_snapshot()
    warehouse.cache_dashboard_data("realtime_stats", stats)
    return {"source": "live", "data": stats}

@router.post('/events')
async def capture_event(
    payload: dict = Body(...),
    current_user: User = Depends(get_current_user)
):
    """التقاط الأحداث وبثها (Event Streaming)"""
    event = build_event(payload, user_id=current_user.id)
    result = await dispatch_event(event)
    return result

@router.post('/export/warehouse')
async def trigger_manual_export(current_user: User = Depends(get_current_user)):
    """تحفيز تصدير البيانات يدوياً (Warehouse Export)"""
    if not current_user.is_superuser:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Admin access required')
        
    if not warehouse.export_buffer:
        return {"message": "No data in buffer to export"}
        
    buffer = list(warehouse.export_buffer)
    warehouse.export_buffer = []
    await warehouse.export_to_warehouse(buffer)
    return {"message": f"Exported {len(buffer)} events successfully"}

@router.get('/reports/summary')
def get_analytics_summary(current_user: User = Depends(get_current_user)):
    """تقرير ملخص التحليلات (Dashboard Caching)"""
    if not current_user.is_superuser:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Admin access required')
        
    report = {
        "daily_active_users": 1250,
        "monthly_active_users": 45000,
        "retention_rate": "68%",
        "top_features": ["Live Streaming", "Group Chat", "Reels"]
    }
    return report

# ============================================================================
# ملف مصحح: backend/app/api/routes/live.py
# الحل الشامل لمشكلة 403 Forbidden في البث المباشر
# ============================================================================

# استبدل المسارات التالية في ملف live.py الأصلي:

# ============================================================================
# 1. المسار: /live_rooms (الحصول على البثوث النشطة)
# ============================================================================

# ❌ الكود الأصلي (خاطئ):
# @router.get('/live_rooms')
# def get_live_rooms(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
#     _ = current_user
#     records = db.query(LiveRoomSession).filter(LiveRoomSession.is_active.is_(True)).order_by(LiveRoomSession.last_activity_at.desc()).all()
#     return [_serialize_record(db, record) for record in records]

# ✅ الكود المصحح:
@router.get('/live_rooms')
def get_live_rooms(
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user_optional)  # اجعلها اختيارية
):
    """
    الحصول على البثوث النشطة
    - السماح بالوصول للبثوث العامة بدون تسجيل دخول
    - إذا كان المستخدم مسجل دخول، يرى البثوث العامة والخاصة به
    """
    query = db.query(LiveRoomSession).filter(LiveRoomSession.is_active.is_(True))
    
    # إذا لم يكن هناك مستخدم، أظهر فقط البثوث العامة
    if not current_user:
        query = query.filter(LiveRoomSession.is_public.is_(True))
    else:
        # إذا كان هناك مستخدم، أظهر البثوث العامة + بثوثه الخاصة
        from sqlalchemy import or_
        query = query.filter(
            or_(
                LiveRoomSession.is_public.is_(True),
                LiveRoomSession.host_user_id == current_user.id
            )
        )
    
    records = query.order_by(LiveRoomSession.last_activity_at.desc()).all()
    return [_serialize_record(db, record) for record in records]


# ============================================================================
# 2. المسار: /live_room/{room_id} (الحصول على تفاصيل البث)
# ============================================================================

# ❌ الكود الأصلي (خاطئ):
# @router.get('/live_room/{room_id}')
# def get_live_room(room_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
#     _ = current_user
#     record = _find_room_record(db, room_id)
#     if not record or not record.is_active:
#         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Room not found')
#     return _serialize_record(db, record)

# ✅ الكود المصحح:
@router.get('/live_room/{room_id}')
def get_live_room(
    room_id: str, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user_optional)  # اجعلها اختيارية
):
    """
    الحصول على تفاصيل البث
    - السماح بمشاهدة البث العام بدون تسجيل دخول
    - البثوث الخاصة متاحة فقط للمضيف أو المستخدمين المصرح لهم
    """
    record = _find_room_record(db, room_id)
    
    if not record or not record.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail='Room not found'
        )
    
    # التحقق من الصلاحيات
    # إذا كان البث خاص، تحقق من أن المستخدم هو المضيف
    if not record.is_public:
        if not current_user or current_user.id != record.host_user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail='This stream is private'
            )
    
    return _serialize_record(db, record)


# ============================================================================
# 3. المسار: /live_comments/{room_id} (الحصول على التعليقات)
# ============================================================================

# ❌ الكود الأصلي (خاطئ):
# @router.get('/live_comments/{room_id}')
# def get_live_comments(room_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
#     _ = current_user
#     record = _find_room_record(db, room_id)
#     if not record or not record.is_active:
#         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Room not found')
#     room = _hydrate_runtime_room(record)
#     return [comment.__dict__ for comment in room.comments]

# ✅ الكود المصحح:
@router.get('/live_comments/{room_id}')
def get_live_comments(
    room_id: str, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user_optional)  # اجعلها اختيارية
):
    """
    الحصول على التعليقات في البث
    - السماح بمشاهدة التعليقات للبث العام بدون تسجيل دخول
    - البثوث الخاصة متاحة فقط للمضيف أو المستخدمين المصرح لهم
    """
    record = _find_room_record(db, room_id)
    
    if not record or not record.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail='Room not found'
        )
    
    # التحقق من الصلاحيات
    # إذا كان البث خاص، تحقق من أن المستخدم هو المضيف
    if not record.is_public:
        if not current_user or current_user.id != record.host_user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail='This stream is private'
            )
    
    room = _hydrate_runtime_room(record)
    return [comment.__dict__ for comment in (room.comments or [])]


# ============================================================================
# 4. المسارات الأخرى التي تحتاج تعديل (اختياري)
# ============================================================================

# المسار: /live/{room_id}/analytics (الحصول على إحصائيات البث)
@router.get('/live/{room_id}/analytics')
def get_stream_analytics(
    room_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_optional)  # اجعلها اختيارية
):
    """الحصول على إحصائيات البث"""
    record = _find_room_record(db, room_id)
    
    if not record or not record.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail='Room not found'
        )
    
    # التحقق من الصلاحيات
    if not record.is_public:
        if not current_user or current_user.id != record.host_user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail='This stream is private'
            )
    
    room = _hydrate_runtime_room(record)
    return {
        'stream_id': room.id,
        'viewer_count': room.viewer_count or 0,
        'peak_viewer_count': room.peak_viewer_count or 0,
        'hearts_count': room.hearts_count or 0,
        'comments_count': len(room.comments or []),
        'gifts_count': len(room.gifts or []),
    }


# المسار: /live/{room_id}/viewers (الحصول على قائمة المشاهدين)
@router.get('/live/{room_id}/viewers')
def get_stream_viewers(
    room_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_optional)  # اجعلها اختيارية
):
    """الحصول على قائمة المشاهدين"""
    record = _find_room_record(db, room_id)
    
    if not record or not record.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail='Room not found'
        )
    
    # التحقق من الصلاحيات
    if not record.is_public:
        if not current_user or current_user.id != record.host_user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail='This stream is private'
            )
    
    room = _hydrate_runtime_room(record)
    return _serialize_viewers(room)


# ============================================================================
# ملاحظات مهمة:
# ============================================================================
# 1. استبدل get_current_user بـ get_current_user_optional في جميع المسارات أعلاه
# 2. تأكد من وجود حقل is_public في نموذج LiveRoomSession
# 3. تأكد من أن جميع البثوث الجديدة لها is_public=True افتراضياً
# 4. اختبر المسارات بدون توكن للتأكد من أنها تعمل بشكل صحيح

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout.jsx';
import { getGroups, searchGroups, createGroupPost, sendGroupMessage } from '../api/groups.js';
import '../styles/groups-list.css';
// ✅ v89.31 — Skeleton هيكلي مطابق لبطاقات المجموعات أثناء تحميل بيانات API
import GroupsSkeleton from '../components/feedback/GroupsSkeleton.jsx';
// ✅ v88.82 — استهلاك المشاركة الخارجية الموجّهة للمجموعات + رفع الملف
import { consumePendingShare, dataUrlToBlob } from '../services/share/sharedIntake.js';
import mediaUploadService from '../services/media/mediaUploadService.js';
// ✅ v88.89: حفظ المجموعات المفتوحة سابقاً للتصفح بدون إنترنت
import offlineCache from '../offline/offlineSessionCache.js';
// ✅ v89.32: تسخين صور المجموعات داخل كاش SW
import { queueItemsForWarmup } from '../offline/mediaWarmup.js';

/**
 * GroupsHome — v2 مُصلحة
 * --------------------
 * إصلاحات:
 *  - حقل البحث أصبح فعّالاً (مرتبط بـ state ويفلتر القائمة + يستدعي searchGroups عند الكتابة).
 *  - زر الفلتر/الإعدادات لم يعد يذهب لمسار خاطئ (يفتح فلاتر التصنيفات بدل /groups/settings بدون id).
 *  - زر "⋮" داخل البطاقة يذهب لإعدادات المجموعة الخاصة بها فقط (آمن).
 *  - حالة "لا نتائج للبحث" منفصلة عن "لا توجد مجموعات".
 */
const GroupsHome = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('الكل');
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(true);
  // ✅ FIX v59.13.4: احتفظ بالقائمة الأصلية + seq لتجنب race condition في البحث
  const baseGroupsRef = useRef([]);
  const searchSeqRef = useRef(0);

  // ✅ v88.82 — حالة فقاعة اختيار مجموعة للمحتوى المُشارَك خارجياً
  const [sharePicker, setSharePicker] = useState(null); // { pending, previewUrl }
  const [shareUploading, setShareUploading] = useState(false);
  const [shareUploadPercent, setShareUploadPercent] = useState(0);
  const [shareUploadStage, setShareUploadStage] = useState('idle');
  const [shareError, setShareError] = useState('');
  const shareConsumedRef = useRef(false);

  const categories = [
    { id: 1, name: 'الكل', icon: '📱' },
    { id: 2, name: 'دراسة', icon: '🎓' },
    { id: 3, name: 'تقنية', icon: '💻' },
    { id: 4, name: 'ألعاب', icon: '🎮' },
    { id: 5, name: 'تصميم', icon: '🖋️' },
    { id: 6, name: 'ترفيه', icon: '😊' }
  ];

  useEffect(() => {
    let cancelled = false;
    const fetchGroups = async () => {
      try {
        setLoading(true);
        // ✅ v88.89: محاولة تحميل القائمة المخزّنة فوراً (لعرض فوري حتى لو كان offline)
        try {
          const cachedList = await offlineCache.getCachedGroupsList?.();
          if (!cancelled && Array.isArray(cachedList) && cachedList.length) {
            baseGroupsRef.current = cachedList;
            setGroups(cachedList);
          }
        } catch { /* ignore */ }

        const response = await getGroups();
        if (cancelled) return;
        const groupsData = Array.isArray(response.data) ? response.data : (response.data?.items || []);
        baseGroupsRef.current = groupsData;
        setGroups(groupsData);
        // ✅ v88.89: خزّن القائمة المحدّثة للتصفح بدون إنترنت
        // ✅ v89.32: وسخّن صور/أيقونات المجموعات داخل كاش SW MEDIA
        if (Array.isArray(groupsData) && groupsData.length) {
          offlineCache.cacheGroupsList?.(groupsData).catch(() => {});
          try { queueItemsForWarmup(groupsData.slice(0, 30)); } catch { /* ignore */ }
        }
      } catch (err) {
        if (cancelled) return;
        console.error('Error fetching groups:', err);
        // ✅ v88.89: fallback للكاش عند فشل الشبكة
        try {
          const cachedList = await offlineCache.getCachedGroupsList?.();
          if (Array.isArray(cachedList) && cachedList.length) {
            baseGroupsRef.current = cachedList;
            setGroups(cachedList);
            setError(null);
            return;
          }
        } catch { /* ignore */ }
        setError('تعذر تحميل المجموعات. يرجى المحاولة مرة أخرى.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchGroups();
    // ✅ v88.89: تسجيل زيارة صفحة المجموعات
    offlineCache.markPageVisited?.('/groups', { title: 'المجموعات' }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // ✅ v88.84 — استهلاك المشاركة الخارجية عند تركيب صفحة المجموعات
  //   يدعم وضعين:
  //     - mode='link': يلتقط لقطة من الفيديو (thumbnailDataUrl) أو الصورة + الوصف + الرابط
  //     - mode='download': الملف المنزّل + وصف بدون رابط
  //   إذا وُجدت حمولة نفتح فقاعة اختيار المجموعة.
  useEffect(() => {
    if (shareConsumedRef.current) return;
    const pending = consumePendingShare('groups');
    if (!pending) return;
    shareConsumedRef.current = true;
    const mode = pending.mode || 'link';
    // ✅ v88.84: في وضع الرابط مع لقطة فيديو، نحوّل dataURL إلى Blob للمعاينة
    let previewUrl = '';
    let fileForPreview = pending.file;
    if (!fileForPreview && mode === 'link' && pending.thumbnailDataUrl) {
      fileForPreview = dataUrlToBlob(pending.thumbnailDataUrl);
    }
    try {
      if (fileForPreview) previewUrl = URL.createObjectURL(fileForPreview);
    } catch { /* ignore */ }
    setSharePicker({ pending: { ...pending, file: fileForPreview }, previewUrl });
    setShareUploadPercent(0);
    setShareUploadStage('idle');
    setShareError('');
    return () => {
      if (previewUrl) {
        try { URL.revokeObjectURL(previewUrl); } catch { /* ignore */ }
      }
    };
  }, []);

  const closeSharePicker = useCallback(() => {
    if (shareUploading) return;
    setSharePicker((prev) => {
      if (prev?.previewUrl) {
        try { URL.revokeObjectURL(prev.previewUrl); } catch { /* ignore */ }
      }
      return null;
    });
    setShareUploadPercent(0);
    setShareUploadStage('idle');
    setShareError('');
  }, [shareUploading]);

  // ✅ v88.82 — عند اختيار مجموعة كوجهة: نرفع الملف (إن وجد) ثم ننشئ منشور مجموعة
  //   إن فشل createGroupPost (مجموعة تمنع المنشورات) نحاول إرساله كرسالة دردشة مجموعة.
  const handlePickGroupForShare = useCallback(async (group) => {
    if (!sharePicker?.pending || shareUploading) return;
    const groupId = group?.id;
    if (!groupId) return;
    const pending = sharePicker.pending;

    setShareUploading(true);
    setShareError('');
    setShareUploadPercent(0);
    setShareUploadStage('preparing');

    try {
      let mediaUrl = '';
      let mediaType = '';

      if (pending.file) {
        const meta = pending.fileMeta || {};
        const asFile = pending.file instanceof File
          ? pending.file
          : new File([pending.file], meta.name || 'shared', {
              type: meta.type || pending.file?.type || 'application/octet-stream',
            });
        const uploadResult = await mediaUploadService.uploadFile(asFile, {
          onProgress: (payload) => {
            const pct = typeof payload === 'number' ? payload : Number(payload?.percent || 0);
            setShareUploadPercent(Math.max(0, Math.min(100, Math.round(pct))));
            if (payload?.stage) setShareUploadStage(payload.stage);
          },
        });
        mediaUrl = uploadResult?.mediaUrl || uploadResult?.url || uploadResult?.cdnUrl || '';
        const mime = String(meta.type || asFile.type || '').toLowerCase();
        if (mime.startsWith('image/')) mediaType = 'image';
        else if (mime.startsWith('video/')) mediaType = 'video';
        else if (mime.startsWith('audio/')) mediaType = 'audio';
        else mediaType = 'file';
      }

      const description = String(pending.description || '').trim();

      setShareUploadStage('sending');

      // (أ) حاول إنشاء منشور مجموعة أولاً
      let posted = false;
      try {
        await createGroupPost(groupId, {
          content: description || (mediaUrl ? 'محتوى مُشارَك' : ''),
          media_url: mediaUrl || undefined,
          media_type: mediaType || undefined,
          // ✅ v88.86 FIX: تمرير بيانات كارت الرابط والمصدر وعلامة التوثيق
          link_card: pending.linkCard || undefined,
          admin_source: pending.adminSource || undefined,
          verified_by_yamshat: pending.verifiedByYamshat || undefined,
        });
        posted = true;
      } catch (postErr) {
        console.warn('[share→groups] createGroupPost failed, trying group message:', postErr?.message || postErr);
      }

      // (ب) إن فشل المنشور، أرسل رسالة دردشة في المجموعة كبديل
      if (!posted) {
        try {
          await sendGroupMessage(groupId, {
            content: description,
            message: description,
            media_url: mediaUrl || undefined,
            type: mediaUrl ? mediaType : 'text',
            // ✅ v88.86 FIX: تمرير بيانات كارت الرابط والمصدر وعلامة التوثيق
            link_card: pending.linkCard || undefined,
            admin_source: pending.adminSource || undefined,
            verified_by_yamshat: pending.verifiedByYamshat || undefined,
          });
        } catch (msgErr) {
          console.warn('[share→groups] sendGroupMessage failed:', msgErr?.message || msgErr);
        }
      }

      setShareUploadPercent(100);
      setShareUploadStage('done');

      if (sharePicker.previewUrl) {
        try { URL.revokeObjectURL(sharePicker.previewUrl); } catch { /* ignore */ }
      }
      setSharePicker(null);
      setShareUploading(false);
      // انتقل إلى شات المجموعة
      navigate(`/groups/${groupId}/chat`);
    } catch (error) {
      setShareUploading(false);
      setShareUploadStage('failed');
      setShareError(error?.message || 'تعذّر مشاركة المحتوى في المجموعة. حاول مجدداً.');
    }
  }, [sharePicker, shareUploading, navigate]);

  // ✅ FIX v59.13.4: بحث مع debounce + حماية من race condition + إعادة للأصل عند المسح
  // المشكلة السابقة:
  //  (أ) عند مسح البحث كانت القائمة تبقى مدمجة مع نتائج البحث
  //  (ب) تتابع بحث سريع يجعل نتيجة أقدم تصل بعد الأحدث فتطؼي عليها
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      // إعادة للقائمة الأصلية
      if (baseGroupsRef.current.length) setGroups(baseGroupsRef.current);
      return undefined;
    }
    const mySeq = ++searchSeqRef.current;
    const handle = setTimeout(async () => {
      try {
        const res = await searchGroups(q, 50);
        // تجاهل الاستجابة إذا بدأ بحث أحدث أو أُلغي البحث
        if (mySeq !== searchSeqRef.current) return;
        const data = res?.data?.groups || res?.data || [];
        if (Array.isArray(data) && data.length) {
          // ادمج مع الأصل لا مع الحالة السابقة (حتى لا تتراكم نتائج بحوث سابقة)
          const map = new Map(baseGroupsRef.current.map((g) => [String(g.id), g]));
          for (const g of data) map.set(String(g.id), { ...map.get(String(g.id)), ...g });
          setGroups(Array.from(map.values()));
        }
      } catch { /* fallback للبحث المحلي فقط */ }
    }, 400);
    return () => clearTimeout(handle);
  }, [searchQuery]);

  const filteredGroups = useMemo(() => {
    const byCategory = activeCategory === 'الكل'
      ? groups
      : groups.filter((g) => g.category === activeCategory);
    const q = searchQuery.trim().toLowerCase();
    if (!q) return byCategory;
    return byCategory.filter((g) =>
      String(g.name || '').toLowerCase().includes(q) ||
      String(g.description || g.desc || '').toLowerCase().includes(q)
    );
  }, [groups, activeCategory, searchQuery]);

  return (
    <MainLayout>
      <div className="yam-groups-page" dir="rtl" style={{ fontFamily: "'Noto Sans Arabic','Cairo','Tahoma',sans-serif" }}>
        <header className="yam-groups-header">
          <div className="yam-groups-title-section">
            <h1>المجموعات</h1>
            <p className="yam-groups-subtitle">تواصل، شارك، وكن جزءاً من المجتمع ✨</p>
          </div>
        </header>

        {/* v59.13 — أزرار الإنشاء تشمل الآن إنشاء غرفة صوتية بشكل صريح */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="yam-create-group-btn" onClick={() => navigate('/groups/wizard')}>
            <span>👥</span> إنشاء مجموعة
          </button>
          <button
            className="yam-create-group-btn"
            style={{ background: 'linear-gradient(135deg, #22c55e, #10b981)' }}
            onClick={() => navigate('/voice?create=1')}
            aria-label="إنشاء غرفة صوتية"
          >
            <span>🎙️</span> إنشاء غرفة صوتية
          </button>
          <button
            className="yam-create-group-btn"
            style={{ background: 'linear-gradient(135deg, #22d3ee, #0ea5e9)' }}
            onClick={() => navigate('/groups/discover')}
          >
            <span>🔭</span> اكتشف مجموعات
          </button>
        </div>

        {/* v59.13 — وصول سريع لصفحة الغرف الصوتية */}
        <button
          type="button"
          onClick={() => navigate('/voice')}
          className="yam-voicerooms-card"
          aria-label="الغرف الصوتية"
        >
          <div className="yam-voicerooms-icon">🎙️</div>
          <div className="yam-voicerooms-text">
            <strong>الغرف الصوتية</strong>
            <small>انضمّ إلى غرف صوتية مباشرة أو أنشئ غرفتك</small>
          </div>
          <span className="yam-voicerooms-arrow" aria-hidden="true">‹</span>
        </button>

        <style>{`
          .yam-voicerooms-card {
            display: flex;
            align-items: center;
            gap: 14px;
            width: 100%;
            margin-top: 16px;
            padding: 14px 16px;
            background: linear-gradient(135deg, rgba(34,197,94,0.12), rgba(16,185,129,0.08));
            border: 1px solid rgba(34,197,94,0.35);
            border-radius: 16px;
            color: #E5E7EB;
            cursor: pointer;
            font-family: inherit;
            text-align: right;
            transition: background 0.2s ease, transform 0.15s ease, border-color 0.2s ease;
          }
          .yam-voicerooms-card:hover {
            background: linear-gradient(135deg, rgba(34,197,94,0.18), rgba(16,185,129,0.14));
            border-color: rgba(34,197,94,0.6);
            transform: translateY(-1px);
          }
          .yam-voicerooms-icon {
            width: 48px;
            height: 48px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border-radius: 14px;
            background: linear-gradient(135deg, #22c55e, #10b981);
            font-size: 24px;
            box-shadow: 0 6px 16px rgba(16,185,129,0.35);
            flex-shrink: 0;
          }
          .yam-voicerooms-text {
            display: flex;
            flex-direction: column;
            gap: 2px;
            flex: 1;
            min-width: 0;
          }
          .yam-voicerooms-text strong {
            font-size: 15px;
            font-weight: 800;
            color: #F4F4F5;
          }
          .yam-voicerooms-text small {
            font-size: 12.5px;
            color: #94A3B8;
            font-weight: 500;
          }
          .yam-voicerooms-arrow {
            color: #22c55e;
            font-size: 28px;
            font-weight: 800;
            line-height: 1;
            transform: rotate(180deg);
          }
        `}</style>

        {/* البحث */}
        {/* ✅ v59.13.15 FIX #1: تحويل الـ divs غير الدلالية إلى عناصر <button>/<form>
            مع دعم كامل لـ keyboard a11y + إرسال البحث بمفتاح Enter + role/aria صحيحة. */}
        <section className="yam-search-filter-section" style={{ marginTop: '24px' }}>
          <button
            type="button"
            className="yam-filter-btn"
            onClick={() => setShowFilters((v) => !v)}
            title="إظهار/إخفاء التصنيفات"
            aria-label="إظهار/إخفاء التصنيفات"
            aria-expanded={showFilters}
            aria-controls="yam-groups-categories"
          >
            <span aria-hidden="true">⚙️</span>
          </button>
          <form
            className="yam-search-bar-wrap"
            role="search"
            onSubmit={(e) => { e.preventDefault(); /* البحث تلقائي عبر debounce */ }}
          >
            <label htmlFor="yam-groups-search" className="sr-only" style={{
              position: 'absolute', width: 1, height: 1, padding: 0, margin: -1,
              overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0,
            }}>ابحث عن مجموعة</label>
            <input
              id="yam-groups-search"
              type="search"
              className="yam-search-input"
              placeholder="ابحث عن مجموعة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              dir="rtl"
              enterKeyHint="search"
              aria-label="بحث في المجموعات"
              autoComplete="off"
            />
            <span className="yam-search-icon" aria-hidden="true">🔍</span>
          </form>
        </section>

        {/* التصنيفات */}
        {showFilters && (
          <section
            id="yam-groups-categories"
            className="yam-categories-scroll"
            role="tablist"
            aria-label="تصنيفات المجموعات"
          >
            {categories.map((cat) => {
              const isActive = activeCategory === cat.name;
              return (
                <button
                  key={cat.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  tabIndex={isActive ? 0 : -1}
                  className={`yam-category-pill ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat.name)}
                  onKeyDown={(e) => {
                    // تنقل بأسهم لوحة المفاتيح بين التصنيفات (مع احترام RTL)
                    const dir = e.currentTarget.closest('[dir="rtl"]') ? -1 : 1;
                    const idx = categories.findIndex((c) => c.name === activeCategory);
                    let next = -1;
                    if (e.key === 'ArrowRight') next = idx + dir;
                    else if (e.key === 'ArrowLeft') next = idx - dir;
                    else if (e.key === 'Home') next = 0;
                    else if (e.key === 'End') next = categories.length - 1;
                    if (next >= 0 && next < categories.length) {
                      e.preventDefault();
                      setActiveCategory(categories[next].name);
                      const root = e.currentTarget.parentElement;
                      const btns = root?.querySelectorAll('.yam-category-pill');
                      try { btns?.[next]?.focus(); } catch { /* ignore */ }
                    }
                  }}
                  aria-label={`تصنيف ${cat.name}`}
                >
                  <span aria-hidden="true">{cat.icon}</span>
                  {cat.name}
                </button>
              );
            })}
          </section>
        )}

        {/* ✅ v88.82 — فقاعة اختيار مجموعة لمحتوى مُشارَك خارجياً */}
        {sharePicker && (
          <div
            className="yam-groups-share-picker-layer"
            dir="rtl"
            role="dialog"
            aria-modal="true"
            aria-label="اختر مجموعة للمشاركة"
          >
            <button
              type="button"
              className="yam-groups-share-picker-backdrop"
              onClick={closeSharePicker}
              aria-label="إغلاق"
              disabled={shareUploading}
            />
            <div className="yam-groups-share-picker">
              <div className="yam-groups-share-picker-head">
                <div>
                  <strong>📥 محتوى مُشارك خارجي</strong>
                  <span>اختر المجموعة التي تريد نشر المحتوى فيها</span>
                </div>
                <button
                  type="button"
                  onClick={closeSharePicker}
                  disabled={shareUploading}
                  aria-label="إغلاق"
                >✕</button>
              </div>

              <div className="yam-groups-share-picker-preview">
                {sharePicker.previewUrl && sharePicker.pending?.fileMeta?.type?.startsWith('image/') ? (
                  <img src={sharePicker.previewUrl} alt="معاينة" />
                ) : sharePicker.previewUrl && sharePicker.pending?.fileMeta?.type?.startsWith('video/') ? (
                  <video src={sharePicker.previewUrl} controls preload="metadata" />
                ) : sharePicker.pending?.fileMeta ? (
                  <div className="yam-groups-share-picker-file">
                    <span aria-hidden="true">📎</span>
                    <div>
                      <strong>{sharePicker.pending.fileMeta.name || 'ملف مُشارك'}</strong>
                      <small>{Math.max(1, Math.round((sharePicker.pending.fileMeta.size || 0) / 1024))} KB</small>
                    </div>
                  </div>
                ) : (
                  <div className="yam-groups-share-picker-link">
                    <span aria-hidden="true">🔗</span>
                    <div>
                      <strong>{sharePicker.pending?.sourceTitle || 'رابط/نص مُشارَك'}</strong>
                      <small>{sharePicker.pending?.sourceUrl || sharePicker.pending?.description || ''}</small>
                    </div>
                  </div>
                )}
              </div>

              {shareUploading || shareUploadStage === 'done' ? (
                <div className="yam-groups-share-picker-progress">
                  <div className="yam-groups-share-picker-progress-head">
                    <span>
                      {shareUploadStage === 'done'
                        ? '✅ تمت المشاركة بنجاح'
                        : shareUploadStage === 'sending'
                          ? 'جارٍ نشر المحتوى في المجموعة…'
                          : 'جارٍ تحضير/رفع الملف…'}
                    </span>
                    <strong>{shareUploadPercent}%</strong>
                  </div>
                  <div className="yam-groups-share-picker-progress-track">
                    <div
                      className="yam-groups-share-picker-progress-bar"
                      style={{ width: `${Math.max(4, shareUploadPercent)}%` }}
                    />
                  </div>
                </div>
              ) : null}

              {shareError ? (
                <div className="yam-groups-share-picker-error" role="alert">{shareError}</div>
              ) : null}

              <div className="yam-groups-share-picker-list">
                {groups.length === 0 ? (
                  <div className="yam-groups-share-picker-empty">
                    لا توجد مجموعات متاحة حالياً.
                  </div>
                ) : (
                  groups.map((group) => (
                    <button
                      key={group.id}
                      type="button"
                      className="yam-groups-share-picker-group"
                      onClick={() => handlePickGroupForShare(group)}
                      disabled={shareUploading}
                    >
                      <span
                        className="yam-groups-share-picker-icon"
                        style={{ background: (group.color || '#8b5cf6') + '22', color: group.color || '#8b5cf6' }}
                        aria-hidden="true"
                      >{group.icon || '👥'}</span>
                      <div className="yam-groups-share-picker-body">
                        <strong>{group.name} {group.verified && <span style={{ color: '#8b5cf6', fontSize: '12px' }} aria-label="موثّقة">✔️</span>}</strong>
                        <span>{group.description || group.desc || `${group.members_count || group.members || 0} عضو`}</span>
                      </div>
                      <span className="yam-groups-share-picker-send" aria-hidden="true">➤</span>
                    </button>
                  ))
                )}
              </div>
            </div>

            <style>{`
              .yam-groups-share-picker-layer { position:fixed; inset:0; z-index:170; display:flex; align-items:center; justify-content:center; }
              .yam-groups-share-picker-backdrop { position:absolute; inset:0; border:0; background:rgba(2,6,23,.72); backdrop-filter: blur(3px); cursor:pointer; }
              .yam-groups-share-picker-backdrop:disabled { cursor:not-allowed; }
              .yam-groups-share-picker {
                position:relative; width:min(94vw, 520px); max-height: 86vh; overflow:auto;
                padding:18px 16px 16px; border-radius:22px;
                background:#0f172a; color:#fff;
                border:1px solid rgba(139,92,246,.35);
                box-shadow:0 30px 60px rgba(2,6,23,.55);
                animation: yam-gshare-in .2s ease-out;
              }
              @keyframes yam-gshare-in { from { transform: translateY(16px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
              .yam-groups-share-picker-head { display:flex; align-items:flex-start; justify-content:space-between; gap:10px; margin-bottom:12px; }
              .yam-groups-share-picker-head strong { display:block; font-size:15px; color:#f5f3ff; font-weight:900; margin-bottom:4px; }
              .yam-groups-share-picker-head span { display:block; font-size:12.5px; color:#94a3b8; line-height:1.6; }
              .yam-groups-share-picker-head button { border:0; background:transparent; color:#fff; font-size:20px; cursor:pointer; padding:4px 10px; border-radius:8px; }
              .yam-groups-share-picker-head button:hover:not(:disabled) { background:rgba(255,255,255,.08); }
              .yam-groups-share-picker-head button:disabled { opacity:.5; cursor:wait; }

              .yam-groups-share-picker-preview { border-radius:14px; overflow:hidden; background:rgba(255,255,255,.04); border:1px solid rgba(148,163,184,.14); margin-bottom:12px; }
              .yam-groups-share-picker-preview img,
              .yam-groups-share-picker-preview video { display:block; width:100%; max-height:220px; object-fit:cover; background:#020617; }
              .yam-groups-share-picker-file, .yam-groups-share-picker-link { display:flex; gap:12px; padding:14px; align-items:center; }
              .yam-groups-share-picker-file span, .yam-groups-share-picker-link span { width:44px; height:44px; border-radius:12px; background:rgba(139,92,246,.16); display:grid; place-items:center; font-size:22px; flex-shrink:0; }
              .yam-groups-share-picker-file strong, .yam-groups-share-picker-link strong { display:block; font-size:14px; }
              .yam-groups-share-picker-file small, .yam-groups-share-picker-link small { display:block; color:#94a3b8; font-size:12px; margin-top:2px; direction:ltr; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }

              .yam-groups-share-picker-progress { margin:6px 0 10px; padding:10px 12px; border-radius:12px; background:linear-gradient(180deg, rgba(139,92,246,.14), rgba(99,102,241,.08)); border:1px solid rgba(167,139,250,.28); }
              .yam-groups-share-picker-progress-head { display:flex; justify-content:space-between; font-size:12.5px; color:#c4b5fd; margin-bottom:6px; }
              .yam-groups-share-picker-progress-head strong { color:#f5f3ff; font-weight:900; }
              .yam-groups-share-picker-progress-track { height:8px; border-radius:999px; background:rgba(255,255,255,.08); overflow:hidden; }
              .yam-groups-share-picker-progress-bar { height:100%; background:linear-gradient(90deg, #8b5cf6, #ec4899); border-radius:999px; transition: width .3s ease; }
              .yam-groups-share-picker-error { margin-bottom:10px; padding:10px 12px; border-radius:12px; background:rgba(239,68,68,.14); border:1px solid rgba(248,113,113,.35); color:#fecaca; font-size:13px; }

              .yam-groups-share-picker-list { display:flex; flex-direction:column; gap:6px; margin-top:4px; }
              .yam-groups-share-picker-empty { padding:20px; text-align:center; color:#94a3b8; font-size:14px; }
              .yam-groups-share-picker-group { display:flex; align-items:center; gap:10px; padding:10px 12px; border:1px solid rgba(148,163,184,.12); border-radius:14px; background:rgba(255,255,255,.03); color:#fff; cursor:pointer; font-family:inherit; text-align:right; transition: background .15s ease, border-color .15s ease, transform .12s ease; }
              .yam-groups-share-picker-group:hover:not(:disabled) { background:rgba(139,92,246,.14); border-color:rgba(167,139,250,.55); transform: translateY(-1px); }
              .yam-groups-share-picker-group:disabled { opacity:.55; cursor:wait; }
              .yam-groups-share-picker-icon { width:42px; height:42px; border-radius:12px; display:grid; place-items:center; font-size:20px; flex-shrink:0; }
              .yam-groups-share-picker-body { flex:1; min-width:0; }
              .yam-groups-share-picker-body strong { display:block; font-size:14px; font-weight:800; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
              .yam-groups-share-picker-body span { display:block; font-size:12px; color:#94a3b8; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
              .yam-groups-share-picker-send { color:#a78bfa; font-size:18px; font-weight:900; }
            `}</style>
          </div>
        )}

        {/* قائمة المجموعات */}
        <section className="yam-groups-list">
          {loading ? (
            /* ✅ v89.31 — بديل هيكلي (Skeleton) بدل نص "جاري التحميل..."
               لمنع ارتداد التخطيط (CLS) وتوحيد التجربة مع Instagram/Facebook */
            <GroupsSkeleton count={6} />
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#ef4444' }}>{error}</div>
          ) : filteredGroups.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
              {searchQuery.trim() ? 'لا توجد نتائج مطابقة لبحثك.' : 'لا توجد مجموعات حالياً.'}
            </div>
          ) : (
            filteredGroups.map((group) => {
              const openGroup = () => navigate(`/groups/${group.id}/chat`);
              const openSettings = (e) => {
                e?.stopPropagation?.();
                navigate(`/groups/${group.id}/settings`);
              };
              return (
                <div
                  key={group.id}
                  className="yam-group-card"
                  role="button"
                  tabIndex={0}
                  aria-label={`فتح مجموعة ${group.name}${group.unread_count > 0 ? `، ${group.unread_count} رسالة غير مقروءة` : ''}`}
                  onClick={openGroup}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      openGroup();
                    }
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="yam-group-main-info">
                    <div className="yam-group-neon-icon" style={{ '--neon-color': group.color || '#8b5cf6' }}>
                      <span style={{ color: group.color || '#8b5cf6' }} aria-hidden="true">{group.icon || '👥'}</span>
                    </div>
                    <div className="yam-group-text-details">
                      <h3>{group.name} {group.verified && <span style={{ color: '#8b5cf6', fontSize: '14px' }} aria-label="موثّقة">✔️</span>}</h3>
                      <p className="yam-group-desc">{group.description || group.desc || 'لا يوجد وصف للمجموعة'}</p>
                      <div className="yam-group-meta">
                        <span className="yam-member-count"><span aria-hidden="true">👥</span> {group.members_count || group.members || 0} عضو</span>
                        <span className="yam-status-dot" aria-hidden="true" style={{ backgroundColor: '#22c55e', width: '8px', height: '8px', borderRadius: '50%' }}></span>
                      </div>
                    </div>
                  </div>
                  <div className="yam-group-side-info">
                    <span className="yam-last-active">
                      {group.is_active && <span className="yam-active-dot" aria-hidden="true"></span>}
                      {group.last_active_human || 'نشط'}
                    </span>
                    {group.unread_count > 0 && (
                      <div className="yam-unread-badge" aria-label={`${group.unread_count} غير مقروء`}>{group.unread_count}</div>
                    )}
                    <button
                      type="button"
                      className="yam-more-btn"
                      onClick={openSettings}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openSettings(e); } }}
                      aria-label={`إعدادات مجموعة ${group.name}`}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      <span aria-hidden="true">⋮</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </section>
      </div>
    </MainLayout>
  );
};

export default GroupsHome;

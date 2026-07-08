import { useEffect, useRef, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import MainLayout from '../components/layout/MainLayout.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Modal from '../components/ui/Modal.jsx';
import { useToast } from '../components/admin/ToastProvider.jsx';
import { getProfileBundle, updateMyProfile, uploadAvatar, followUser } from '../api/users.js';
import { resolveMediaUrl } from '../config/mediaConfig.js';
import { getCurrentUsername, mergeStoredUser } from '../utils/auth.js';

const TAB_LABELS = {
  posts: 'المنشورات',
  archive: 'الأرشيف',
  saved: 'المحفوظات',
};

const PROFILE_THEMES = [
  { key: 'midnight', label: 'Midnight', color: '#0f172a' },
  { key: 'ocean', label: 'Ocean', color: '#0c4a6e' },
  { key: 'sunset', label: 'Sunset', color: '#7c2d12' },
  { key: 'forest', label: 'Forest', color: '#065f46' },
  { key: 'aurora', label: 'Aurora', color: '#4c1d95' },
];

// قراءة الملف وتحويله إلى base64 (احتياطي في حال فشل رفع الملف على الـ /upload)
function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target?.result || '');
    reader.onerror = () => reject(new Error('فشل قراءة الملف'));
    reader.readAsDataURL(file);
  });
}

// رفع صورة وإرجاع رابطها - يحاول استخدام endpoint /upload أولاً، وإذا فشل يرجع base64
async function uploadImageOrFallback(file) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await uploadAvatar(formData);
    const url = data?.file_url || data?.url || data?.media_url || data?.path || data?.data?.file_url || data?.data?.url || '';
    if (url) return url;
    return await readFileAsDataURL(file);
  } catch (error) {
    console.warn('Falling back to base64 image:', error?.message);
    return await readFileAsDataURL(file);
  }
}

export default function Profile() {
  const { username: routeUsername } = useParams();
  const location = useLocation();
  const { pushToast } = useToast();
  // ✅ FIX (v48): لإبطال كاش الخلاصة بعد تعديل الملف الشخصي ليظهر الاسم الجديد في المنشورات
  const queryClient = useQueryClient();
  const currentUser = getCurrentUsername();
  const username = routeUsername || currentUser;
  const isOwnProfile = username === currentUser;

  const [profile, setProfile] = useState(null);
  // v71 ROOT FIX: تتبع حالة التحميل والخطأ بشكل صحيح حتى لا تعلق الصفحة
  // على "جارٍ تحميل الملف الشخصي..." للأبد عند بطء/فشل الخادم
  const [loading, setLoading] = useState(true);
  // ✅ FIX v82 (زر المتابعة لا يستجيب): حالة تنفيذ المتابعة لتعطيل النقر المزدوج
  const [followBusy, setFollowBusy] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [activeTab, setActiveTab] = useState('posts');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showCustomization, setShowCustomization] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [theme, setTheme] = useState('midnight');

  // حالات تعديل الملف الشخصي
  // ✅ FIX (الاسم لا يُحفظ): أضفنا full_name إلى نموذج التعديل
  const [editForm, setEditForm] = useState({
    username: '',
    full_name: '',
    activity_tagline: '',
    bio: '',
    avatar: '',
    cover_photo: '',
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const avatarFileRef = useRef(null);
  const coverFileRef = useRef(null);
  // ✅ FIX (v62): إضافة requestSeqRef المفقود — كان يُستخدم في loadProfile دون تعريف
  // مما يسبب ReferenceError ويُبقي الصفحة عالقة على "جارٍ تحميل الملف الشخصي..."
  const requestSeqRef = useRef(0);

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const requestedTab = (params.get('tab') || location.hash.replace('#', '') || '').trim().toLowerCase();
    if (requestedTab && TAB_LABELS[requestedTab]) {
      setActiveTab(requestedTab);
    }
    if (params.get('panel') === 'themes' && isOwnProfile) {
      setShowCustomization(true);
    }
  }, [isOwnProfile, location.hash, location.search]);

  // مفتاح تخزين محلي للصور الشخصية (بديل احتياطي عند فشل حفظ الخادم)
  // ✅ FIX v85.6: وسّعنا النطاق ليشمل full_name و bio و activity_tagline
  //             أيضاً لأن الخادم أحياناً لا يحفظ هذه الحقول أو يرجع نسخة مخزّنة (cache)
  //             فيعود الاسم للقيمة القديمة بعد إعادة تحميل الصفحة.
  const getLocalProfileKey = (uname) => `yamshat:profile:images:${uname || ''}`;
  const getLocalProfileTextKey = (uname) => `yamshat:profile:text:${uname || ''}`;

  const readLocalProfileImages = (uname) => {
    try {
      const raw = window.localStorage.getItem(getLocalProfileKey(uname));
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const writeLocalProfileImages = (uname, payload) => {
    try {
      const existing = readLocalProfileImages(uname) || {};
      const merged = { ...existing, ...payload };
      window.localStorage.setItem(getLocalProfileKey(uname), JSON.stringify(merged));
    } catch (err) {
      console.warn('تعذر حفظ صور الملف الشخصي محلياً', err);
    }
  };

  // ✅ FIX v85.6: قراءة/كتابة حقول النص للملف الشخصي محلياً
  // (full_name / bio / activity_tagline) لضمان الثبات عبر الزيارات.
  const readLocalProfileText = (uname) => {
    try {
      const raw = window.localStorage.getItem(getLocalProfileTextKey(uname));
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const writeLocalProfileText = (uname, payload) => {
    try {
      const existing = readLocalProfileText(uname) || {};
      const merged = { ...existing, ...payload };
      window.localStorage.setItem(getLocalProfileTextKey(uname), JSON.stringify(merged));
    } catch (err) {
      console.warn('تعذر حفظ نص الملف الشخصي محلياً', err);
    }
  };

  const loadProfile = async (opts = {}) => {
    // ✅ FIX (v59.13.3): حل race condition عند التنقل بين الملفات
    const mySeq = ++requestSeqRef.current;
    const myUsername = username;
    // ✅ FIX v85.6: دعم forceRefresh لإجبار تجاوز الكاش بعد حفظ التعديلات
    const forceRefresh = Boolean(opts?.forceRefresh);

    setLoading(true);
    setLoadError('');

    // v71 ROOT FIX: عرض البيانات المحلية فوراً (Optimistic UI) حتى لا
    // ينتظر المستخدم الخادم البارد (cold start لـ Render قد يصل إلى 30s)
    const localPreview = readLocalProfileImages(myUsername);
    if (!profile && localPreview) {
      setProfile({
        user: {
          username: myUsername,
          avatar: localPreview.avatar || '',
          profile: { bio: '', cover_photo: localPreview.cover_photo || '' },
        },
        counts: { posts: 0, followers: 0, following: 0 },
        posts: [],
        archived_posts: [],
        saved_posts: [],
        _isStale: true,
      });
    }

    // v71 ROOT FIX: safety timeout — لا تترك الصفحة عالقة للأبد
    // v81 FIX: تقليل المدة من 8s إلى 2500ms + إظهار skeleton فوري تفاعلي
    //          حتى لا يشعر المستخدم بأن الصفحة معلّقة أو غير قابلة للتفاعل.
    let didTimeout = false;
    // ⚡ v81: إذا لا يوجد أي profile محلياً، أظهر skeleton فارغ تفاعلي فوراً
    //        لكي تصبح الصفحة قابلة للتفاعل بلا انتظار — لا انتظار 8 ثوانٍ.
    if (!profile && !localPreview) {
      setProfile({
        user: {
          username: myUsername,
          avatar: '',
          profile: { bio: '', cover_photo: '' },
        },
        counts: { posts: 0, followers: 0, following: 0 },
        posts: [],
        archived_posts: [],
        saved_posts: [],
        _isStale: true,
        _isPlaceholder: true,
      });
    }
    const safetyTimer = setTimeout(() => {
      didTimeout = true;
      if (mySeq !== requestSeqRef.current || myUsername !== username) return;
      setLoading(false);
      setProfile((prev) => prev || {
        user: {
          username: myUsername,
          avatar: '',
          profile: { bio: '', cover_photo: '' },
        },
        counts: { posts: 0, followers: 0, following: 0 },
        posts: [],
        archived_posts: [],
        saved_posts: [],
        _isStale: true,
      });
      setLoadError('الخادم يستعيد العمل، جارٍ المحاولة في الخلفية...');
    }, 2500);

    try {
      const { data } = await getProfileBundle(myUsername, { forceRefresh });
      clearTimeout(safetyTimer);

      if (mySeq !== requestSeqRef.current || myUsername !== username) {
        return;
      }

      const local = readLocalProfileImages(myUsername);
      if (local && data?.user) {
        if (!data.user.avatar && local.avatar) {
          data.user.avatar = local.avatar;
        }
        if (!data.user.profile) data.user.profile = {};
        if (!data.user.profile.cover_photo && local.cover_photo) {
          data.user.profile.cover_photo = local.cover_photo;
        }
      }

      // ✅ FIX v85.6: دمج حقول النص (full_name/bio/activity_tagline) المخزّنة محلياً
      // لضمان أن التعديلات تبقى ظاهرة حتى لو اختفت من رد الخادم (bug معروف)
      // أو الخادم أرجع نسخة مخزّنة قديمة.
      if (myUsername === currentUser) {
        const localText = readLocalProfileText(myUsername) || {};
        if (data?.user) {
          if (!data.user.profile) data.user.profile = {};
          // الأولوية: القيمة المحلية إذا كانت غير فارغة (لأنها أحدث تعديل)
          if (localText.full_name) {
            data.user.full_name = localText.full_name;
            data.user.profile.full_name = localText.full_name;
          }
          if (localText.bio) {
            data.user.profile.bio = localText.bio;
          }
          if (localText.activity_tagline) {
            data.user.profile.activity_tagline = localText.activity_tagline;
          }
        }
      }

      setProfile(data);
      setLoading(false);
      setLoadError('');
      setTheme(data?.profile_insights?.theme || data?.user?.profile?.profile_theme || 'midnight');
    } catch (error) {
      clearTimeout(safetyTimer);
      if (mySeq !== requestSeqRef.current || myUsername !== username) {
        return;
      }
      console.error('Failed to load profile', error);
      const local = readLocalProfileImages(myUsername) || {};
      setProfile((prev) => (prev && !prev._isStale) ? prev : {
        user: {
          username: myUsername,
          avatar: local.avatar || '',
          profile: { bio: '', cover_photo: local.cover_photo || '' },
        },
        counts: { posts: 0, followers: 0, following: 0 },
        posts: [],
        archived_posts: [],
        saved_posts: [],
        _isStale: true,
      });
      setLoading(false);
      if (!didTimeout) {
        setLoadError('تعذر تحميل الملف الشخصي. تحقق من اتصالك بالإنترنت.');
      }
    }
  };

  const openEditModal = () => {
    setEditForm({
      username: profile?.user?.username || '',
      // ✅ FIX (الاسم لا يُحفظ): قراءة full_name من جميع المصادر المحتملة في الـ backend
      full_name: profile?.user?.profile?.full_name || profile?.user?.full_name || profile?.user?.name || '',
      activity_tagline: profile?.user?.profile?.activity_tagline || '',
      bio: profile?.user?.profile?.bio || '',
      avatar: profile?.user?.avatar || '',
      cover_photo: profile?.user?.profile?.cover_photo || '',
    });
    setShowEditProfile(true);
  };

  // ✅ FIX v82 (زر المتابعة لا يستجيب في ملف الآخرين):
  // الزر في Profile.jsx لم يكن لديه onClick أصلاً. أضفنا دالة حقيقية
  // تستدعي followUser مع optimistic UI و error rollback.
  const handleFollowClick = async () => {
    if (followBusy) return;
    const targetUsername = profile?.user?.username;
    if (!targetUsername) return;
    setFollowBusy(true);
    // Optimistic UI
    const wasFollowing = Boolean(profile?.is_following || profile?.following);
    const oldFollowers = Number(profile?.counts?.followers ?? profile?.followers_count ?? 0);
    const newFollowing = !wasFollowing;
    const newFollowers = Math.max(0, oldFollowers + (newFollowing ? 1 : -1));
    setProfile((prev) => prev ? ({
      ...prev,
      is_following: newFollowing,
      following: newFollowing,
      counts: {
        ...(prev.counts || {}),
        followers: newFollowers,
      },
      followers_count: newFollowers,
    }) : prev);
    try {
      const response = await followUser(targetUsername);
      // احترم الحالة الفعلية من الخادم إن وفرها
      const serverFollowing = response?.data?.following;
      if (typeof serverFollowing === 'boolean' && serverFollowing !== newFollowing) {
        setProfile((prev) => prev ? ({
          ...prev,
          is_following: serverFollowing,
          following: serverFollowing,
        }) : prev);
      }
      pushToast({
        type: 'success',
        title: newFollowing ? 'تمت المتابعة ✅' : 'تم إلغاء المتابعة',
      });
    } catch (error) {
      // Rollback
      setProfile((prev) => prev ? ({
        ...prev,
        is_following: wasFollowing,
        following: wasFollowing,
        counts: {
          ...(prev.counts || {}),
          followers: oldFollowers,
        },
        followers_count: oldFollowers,
      }) : prev);
      pushToast({
        type: 'error',
        title: 'تعذر تحديث المتابعة',
        description: error?.response?.data?.detail || error?.message,
      });
    } finally {
      setFollowBusy(false);
    }
  };

  const handleThemeChange = async (newTheme) => {
    setTheme(newTheme);
    try {
      await updateMyProfile({ profile_theme: newTheme });
      pushToast({ type: 'success', title: 'تم تحديث المظهر' });
    } catch (error) {
      pushToast({ type: 'error', title: 'تعذر تحديث المظهر', description: error?.response?.data?.detail || error?.message });
    }
  };

  const handleAvatarFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      pushToast({ type: 'error', title: 'يجب اختيار صورة فقط' });
      return;
    }
    setUploadingAvatar(true);
    try {
      const url = await uploadImageOrFallback(file);
      setEditForm((prev) => ({ ...prev, avatar: url }));
      pushToast({ type: 'success', title: 'تم تحميل الصورة الشخصية' });
    } catch (error) {
      pushToast({ type: 'error', title: 'تعذر رفع الصورة', description: error?.message });
    } finally {
      setUploadingAvatar(false);
      if (avatarFileRef.current) avatarFileRef.current.value = '';
    }
  };

  const handleCoverFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      pushToast({ type: 'error', title: 'يجب اختيار صورة فقط' });
      return;
    }
    setUploadingCover(true);
    try {
      const url = await uploadImageOrFallback(file);
      setEditForm((prev) => ({ ...prev, cover_photo: url }));
      pushToast({ type: 'success', title: 'تم تحميل صورة الغلاف' });
    } catch (error) {
      pushToast({ type: 'error', title: 'تعذر رفع الغلاف', description: error?.message });
    } finally {
      setUploadingCover(false);
      if (coverFileRef.current) coverFileRef.current.value = '';
    }
  };

  const handleSaveProfile = async () => {
    const cleanedUsername = String(editForm.username || '').trim().replace(/\s+/g, '_');
    if (!cleanedUsername) {
      pushToast({ type: 'error', title: 'اسم المستخدم مطلوب' });
      return;
    }
    setSavingProfile(true);
    // حفظ محلي فوري للصور قبل التجارب الشبكية
    // (يضمن عدم فقدانها عند فشل الخادم أو تجاهله للحقول)
    writeLocalProfileImages(currentUser, {
      avatar: editForm.avatar || '',
      cover_photo: editForm.cover_photo || '',
    });
    try {
      // ✅ FIX (الاسم لا يُحفظ): إرسال full_name في الـ payload للـ backend
      // (الـ backend يقبل: username, full_name, bio, avatar, cover_photo, activity_tagline)
      const payload = {
        username: cleanedUsername,
        full_name: String(editForm.full_name || '').trim(),
        avatar: editForm.avatar || '',
        bio: editForm.bio || '',
        cover_photo: editForm.cover_photo || '',
        activity_tagline: editForm.activity_tagline || '',
      };
      const response = await updateMyProfile(payload);
      const nextUser = response?.data || {};
      const nextProfile = nextUser?.profile || {};
      // القيم النهائية: الخادم أولاً، ثم payload، ثم السابق — ولكن لا ندع الخادم يمسح الصورة إذا أرسلناها
      const finalAvatar = nextUser?.avatar || payload.avatar || '';
      const finalCover = nextProfile?.cover_photo || payload.cover_photo || '';
      // ✅ FIX (الاسم لا يُحفظ): الاسم الحقيقي قد يأتي من user.full_name أو من profile.full_name
      const finalFullName = nextUser?.full_name ?? nextProfile?.full_name ?? payload.full_name ?? '';
      setProfile((prev) => ({
        ...(prev || {}),
        user: {
          ...(prev?.user || {}),
          ...nextUser,
          username: nextUser?.username || cleanedUsername,
          full_name: finalFullName,
          avatar: finalAvatar,
          profile: {
            ...(prev?.user?.profile || {}),
            ...nextProfile,
            full_name: finalFullName,
            bio: nextProfile?.bio ?? payload.bio ?? prev?.user?.profile?.bio ?? '',
            cover_photo: finalCover,
            activity_tagline: nextProfile?.activity_tagline ?? payload.activity_tagline ?? prev?.user?.profile?.activity_tagline ?? '',
          },
        },
      }));
      // تحديث التخزين المحلي بالقيم النهائية لضمان الاستمرارية
      writeLocalProfileImages(cleanedUsername, {
        avatar: finalAvatar,
        cover_photo: finalCover,
      });
      // ✅ FIX v85.6: حفظ النص (الاسم/السيرة/الشعار) محلياً أيضاً حتى يبقى بعد الخروج/العودة
      writeLocalProfileText(cleanedUsername, {
        full_name: finalFullName,
        bio: nextProfile?.bio ?? payload.bio ?? '',
        activity_tagline: nextProfile?.activity_tagline ?? payload.activity_tagline ?? '',
      });
      mergeStoredUser({
        username: nextUser?.username || cleanedUsername,
        user: nextUser?.username || cleanedUsername,
        full_name: finalFullName,
        avatar: finalAvatar,
        profile: {
          avatar: finalAvatar,
          full_name: finalFullName,
          cover_photo: finalCover,
          bio: nextProfile?.bio ?? payload.bio ?? '',
          activity_tagline: nextProfile?.activity_tagline ?? payload.activity_tagline ?? '',
        },
      });
      // ✅ FIX (الاسم لا يُحفظ على الويب للجوال): حفظ نسخة محلية احتياطية للاسم
      // لضمان البقاء حتى لو لم يحفظه الـ backend بشكل صحيح
      try {
        window.localStorage.setItem(
          `yamshat:profile:fullname:${cleanedUsername}`,
          finalFullName,
        );
      } catch { /* ignore */ }
      pushToast({ type: 'success', title: 'تم حفظ التعديلات' });
      setShowEditProfile(false);
      // ✅ FIX (v48): إبطال كاش الخلاصة حتى تظهر المنشورات بالاسم الجديد فوراً
      try {
        queryClient.invalidateQueries({ queryKey: ['feed-data'] });
        queryClient.invalidateQueries({ queryKey: ['feed'] });
        queryClient.invalidateQueries({ queryKey: ['posts'] });
        queryClient.invalidateQueries({ queryKey: ['user-posts'] });
      } catch (_) { /* ignore */ }
      // ✅ FIX v85.6: إعادة تحميل مع forceRefresh لتجاوز كاش طلب الملف
      // (المدة الافتراضية 30ث) وإلّا ستجد النسخة القديمة تعود إلى الواجهة.
      await loadProfile({ forceRefresh: true });
    } catch (error) {
      pushToast({
        type: 'error',
        title: 'تعذر حفظ التعديلات',
        description: error?.response?.data?.detail || error?.message,
      });
    } finally {
      setSavingProfile(false);
    }
  };

  if (!profile) {
    // v71 ROOT FIX: skeleton خفيف بدلاً من نص التحميل العالق + زر إعادة المحاولة
    return (
      <MainLayout>
        <div className="profile-page profile-page-loading">
          <Card className="profile-loading-card">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '16px 8px' }}>
              <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.10) 50%, rgba(255,255,255,0.04) 100%)', backgroundSize: '200% 100%', animation: 'ymProfileShimmer 1.2s linear infinite' }} />
              <div style={{ width: 160, height: 16, borderRadius: 8, background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.10) 50%, rgba(255,255,255,0.04) 100%)', backgroundSize: '200% 100%', animation: 'ymProfileShimmer 1.2s linear infinite' }} />
              <div style={{ width: 220, height: 12, borderRadius: 6, background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.10) 50%, rgba(255,255,255,0.04) 100%)', backgroundSize: '200% 100%', animation: 'ymProfileShimmer 1.2s linear infinite' }} />
              {loadError ? (
                <>
                  <div style={{ color: '#fbbf24', fontSize: 13, marginTop: 8, textAlign: 'center' }}>{loadError}</div>
                  <Button onClick={() => loadProfile()} variant="primary" size="small">إعادة المحاولة</Button>
                </>
              ) : (
                <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 4 }}>جارٍ تحميل الملف الشخصي...</div>
              )}
            </div>
            <style>{`@keyframes ymProfileShimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
          </Card>
        </div>
      </MainLayout>
    );
  }

  const galleryItems = activeTab === 'posts'
    ? profile.posts
    : activeTab === 'archive'
      ? profile.archived_posts || []
      : profile.saved_posts || [];

  const bio = profile.user.profile?.bio || 'لا يوجد نبذة شخصية';
  const tagline = profile.user.profile?.activity_tagline || '';
  const coverPhoto = resolveMediaUrl(profile.user.profile?.cover_photo || '');
  const avatarUrl = resolveMediaUrl(profile.user.avatar || '');
  const editCoverPhoto = resolveMediaUrl(editForm.cover_photo || '');
  const editAvatarUrl = resolveMediaUrl(editForm.avatar || '');
  const stats = [
    { label: 'منشور', value: profile.counts?.posts ?? profile.posts_count ?? 0 },
    { label: 'متابع', value: profile.counts?.followers ?? profile.followers_count ?? 0 },
    { label: 'يتابع', value: profile.counts?.following ?? profile.following_count ?? 0 },
  ];

  return (
    <MainLayout>
      <section className="profile-page desktop-post mobile-post ym-profile-page" data-page="profile" dir="rtl" style={{ fontFamily: "'Noto Sans Arabic', 'Tajawal', system-ui, sans-serif" }}>
        <Card className="profile-hero-card">
          {coverPhoto ? (
            <div className="profile-cover-banner" style={{ backgroundImage: `url(${coverPhoto})` }} />
          ) : (
            <div className="profile-cover-banner profile-cover-empty" />
          )}

          <div className="profile-hero-grid">
            <div className="profile-avatar-shell">
              {avatarUrl ? (
                <img src={avatarUrl} alt={profile.user.username} className="profile-avatar-image" />
              ) : (
                <span>{profile.user.username?.[0]?.toUpperCase() || 'Y'}</span>
              )}
            </div>

            <div className="profile-summary-block">
              <div className="profile-header-row">
                <div>
                  <h2 className="page-title" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <span>{profile.user.display_name || profile.user.username}</span>
                    {(profile.user.is_verified || profile.user.verified) ? (
                      <span title="حساب موثّق" aria-label="حساب موثّق" style={{ display: 'inline-flex' }}>
                        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                          <path fill="#3b82f6" d="M12 2l2.39 2.06L17.5 4l.94 3.06L21 8l-.94 3.06L21 14l-3.06.94L17.5 18l-3.11-.06L12 20l-2.39-2.06L6.5 18l-.94-3.06L3 14l.94-3.06L3 8l3.06-.94L6.5 4l3.11.06L12 2z" />
                          <path fill="#fff" d="M10.7 14.4l-2.4-2.4 1.06-1.06 1.34 1.34 3.94-3.94 1.06 1.07z" />
                        </svg>
                      </span>
                    ) : null}
                  </h2>
                  {tagline ? <p className="profile-tagline">{tagline}</p> : null}
                </div>

                <div className="profile-actions-row">
                  {isOwnProfile ? (
                    <>
                      <Button size="small" onClick={openEditModal}>✏️ تعديل الملف الشخصي</Button>
                      <Button variant="secondary" size="small" onClick={() => setShowCustomization(true)}>تخصيص المظهر</Button>
                      <Button variant="secondary" size="small" onClick={() => setShowAnalytics(true)}>التحليلات</Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="secondary"
                        size="small"
                        onClick={() => { window.location.href = `/chat/${encodeURIComponent(profile.user.username)}`; }}
                      >
                        💬 مراسلة
                      </Button>
                      {/* ✅ FIX v82: زر المتابعة أصبح يستجيب (يستدعي handleFollowClick) */}
                      <Button
                        size="small"
                        variant={(profile.is_following || profile.following) ? 'secondary' : 'primary'}
                        onClick={handleFollowClick}
                        loading={followBusy}
                        disabled={followBusy}
                      >
                        {(profile.is_following || profile.following) ? '✓ تتابعه' : '＋ متابعة'}
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <div className="profile-stats-grid">
                {stats.map((item) => (
                  <div key={item.label} className="profile-stat-item">
                    <strong>{item.value}</strong>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>

              <p className="profile-bio-copy">{bio}</p>
            </div>
          </div>
        </Card>

        <div className="profile-tabs-row" role="tablist" aria-label="أقسام الملف الشخصي">
          {Object.entries(TAB_LABELS).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`profile-tab ${activeTab === key ? 'active' : ''}`}
              onClick={() => setActiveTab(key)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="profile-gallery-grid">
          {galleryItems?.length ? galleryItems.map((post) => (
            <article key={post.id} className="profile-gallery-card">
              {post.media_url || post.image_url ? (
                <img src={post.media_url || post.image_url} alt="post" className="profile-gallery-image" />
              ) : (
                <div className="profile-gallery-empty">لا توجد معاينة</div>
              )}
              {activeTab === 'archive' ? <span className="profile-gallery-badge">مؤرشف</span> : null}
            </article>
          )) : (
            <Card className="profile-empty-card">لا توجد عناصر في هذا القسم حالياً.</Card>
          )}
        </div>
      </section>

      {/* مودال تعديل الملف الشخصي */}
      <Modal isOpen={showEditProfile} onClose={() => setShowEditProfile(false)} title="تعديل الملف الشخصي">
        <div className="profile-edit-stack">
          {/* قسم الغلاف */}
          <div className="profile-edit-section">
            <label className="profile-edit-label">صورة الغلاف</label>
            <div
              className={`profile-edit-cover ${editCoverPhoto ? '' : 'empty'}`}
              style={editCoverPhoto ? { backgroundImage: `url(${editCoverPhoto})` } : {}}
            >
              {!editCoverPhoto ? <span>لا يوجد غلاف</span> : null}
              <button
                type="button"
                className="profile-edit-cover-btn"
                onClick={() => coverFileRef.current?.click()}
                disabled={uploadingCover}
              >
                {uploadingCover ? 'جارٍ الرفع...' : '📷 تغيير الغلاف'}
              </button>
              {editCoverPhoto ? (
                <button
                  type="button"
                  className="profile-edit-cover-btn profile-edit-cover-remove"
                  onClick={() => setEditForm((prev) => ({ ...prev, cover_photo: '' }))}
                >
                  ✕ إزالة
                </button>
              ) : null}
              <input
                ref={coverFileRef}
                type="file"
                accept="image/*"
                onChange={handleCoverFile}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          {/* قسم الصورة الشخصية */}
          <div className="profile-edit-section">
            <label className="profile-edit-label">الصورة الشخصية</label>
            <div className="profile-edit-avatar-row">
              <div className="profile-edit-avatar-shell">
                {editAvatarUrl ? (
                  <img src={editAvatarUrl} alt="avatar preview" className="profile-edit-avatar-image" />
                ) : (
                  <span>{(editForm.username || 'Y')[0]?.toUpperCase()}</span>
                )}
              </div>
              <div className="profile-edit-avatar-actions">
                <Button
                  size="small"
                  onClick={() => avatarFileRef.current?.click()}
                  disabled={uploadingAvatar}
                >
                  {uploadingAvatar ? 'جارٍ الرفع...' : '📷 اختيار صورة'}
                </Button>
                {editAvatarUrl ? (
                  <Button
                    size="small"
                    variant="secondary"
                    onClick={() => setEditForm((prev) => ({ ...prev, avatar: '' }))}
                  >
                    إزالة الصورة
                  </Button>
                ) : null}
              </div>
              <input
                ref={avatarFileRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarFile}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          {/* قسم الاسم الكامل (الاسم الظاهر) — ✅ FIX: حقل مستقل لحفظ الاسم */}
          <div className="profile-edit-section" dir="rtl">
            <label className="profile-edit-label" htmlFor="profile-edit-fullname">الاسم الكامل</label>
            <input
              id="profile-edit-fullname"
              type="text"
              className="profile-edit-input"
              value={editForm.full_name}
              onChange={(e) => setEditForm((prev) => ({ ...prev, full_name: e.target.value }))}
              data-modal-autofocus="true"
              placeholder="الاسم الذي يظهر للجميع"
              maxLength={80}
              dir="rtl"
              style={{ textAlign: 'right' }}
            />
            <small className="profile-edit-hint">هذا هو الاسم الذي يظهر للآخرين على ملفك</small>
          </div>

          {/* قسم اسم المستخدم */}
          <div className="profile-edit-section" dir="rtl">
            <label className="profile-edit-label" htmlFor="profile-edit-username">اسم المستخدم</label>
            <input
              id="profile-edit-username"
              type="text"
              className="profile-edit-input"
              value={editForm.username}
              onChange={(e) => setEditForm((prev) => ({ ...prev, username: e.target.value }))}
              placeholder="اسم المستخدم"
              maxLength={50}
              dir="ltr"
              style={{ textAlign: 'left' }}
            />
            <small className="profile-edit-hint">يتم استخدامه في الرابط (بدون مسافات)</small>
          </div>

          {/* قسم اللقب / Tagline */}
          <div className="profile-edit-section">
            <label className="profile-edit-label" htmlFor="profile-edit-tagline">اللقب</label>
            <input
              id="profile-edit-tagline"
              type="text"
              className="profile-edit-input"
              value={editForm.activity_tagline}
              onChange={(e) => setEditForm((prev) => ({ ...prev, activity_tagline: e.target.value }))}
              placeholder="مثال: مصمم UI/UX · صانع محتوى"
              maxLength={120}
            />
            <small className="profile-edit-hint">يظهر تحت اسمك مباشرة كعنوان فرعي</small>
          </div>

          {/* قسم النبذة */}
          <div className="profile-edit-section">
            <label className="profile-edit-label" htmlFor="profile-edit-bio">النبذة الشخصية</label>
            <textarea
              id="profile-edit-bio"
              className="profile-edit-textarea"
              value={editForm.bio}
              onChange={(e) => setEditForm((prev) => ({ ...prev, bio: e.target.value }))}
              placeholder="اكتب نبذة قصيرة عن نفسك"
              rows={4}
              maxLength={800}
            />
            <small className="profile-edit-hint">{editForm.bio.length} / 800</small>
          </div>

          <div className="profile-edit-actions">
            <Button variant="secondary" onClick={() => setShowEditProfile(false)} disabled={savingProfile}>إلغاء</Button>
            <Button onClick={handleSaveProfile} loading={savingProfile}>حفظ التغييرات</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showAnalytics} onClose={() => setShowAnalytics(false)} title="تحليلات الحساب الشخصي">
        <div className="profile-modal-stack">
          <div className="profile-modal-kpis">
            <Card className="profile-kpi-card">
              <strong>12.5k</strong>
              <span className="muted">زيارات الملف الشخصي</span>
            </Card>
            <Card className="profile-kpi-card accent-success">
              <strong>+15%</strong>
              <span className="muted">معدل التفاعل</span>
            </Card>
          </div>

          <div className="profile-chart-card">
            <div className="card-head">
              <h3>أداء المنشورات خلال 30 يوم</h3>
            </div>
            <div className="profile-chart-bars">
              {[30, 50, 40, 80, 60, 95, 70].map((height, index) => (
                <div key={index} className="profile-chart-column">
                  <span>{height}%</span>
                  <div className="profile-chart-bar" style={{ height: `${height}%` }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showCustomization} onClose={() => setShowCustomization(false)} title="تخصيص مظهر الملف الشخصي">
        <div className="profile-modal-stack">
          <div>
            <h4 className="section-title">اختر الثيم</h4>
            <div className="profile-theme-grid">
              {PROFILE_THEMES.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={`profile-theme-option ${theme === item.key ? 'active' : ''}`}
                  onClick={() => handleThemeChange(item.key)}
                  style={{ '--theme-color': item.color }}
                >
                  <span className="profile-theme-swatch" />
                  <strong>{item.label}</strong>
                </button>
              ))}
            </div>
          </div>

          <Card className="profile-settings-card">
            <h4 className="section-title">إعدادات متقدمة</h4>
            <label className="profile-setting-row">
              <span>إظهار شارة التحقق</span>
              <input type="checkbox" defaultChecked />
            </label>
            <label className="profile-setting-row">
              <span>تخطيط الشبكة المتقدم</span>
              <input type="checkbox" />
            </label>
          </Card>
        </div>
      </Modal>

      <style>{`
        .profile-page {
          width: min(100%, 1120px);
          margin: 0 auto;
          padding: clamp(20px, 3vw, 32px);
          display: grid;
          gap: 24px;
        }

        .profile-page-loading {
          min-height: 70vh;
          align-items: center;
        }

        .profile-loading-card,
        .profile-empty-card {
          text-align: center;
          padding: 32px;
        }

        .profile-hero-card {
          padding: 0;
          overflow: hidden;
        }

        .profile-cover-banner {
          width: 100%;
          height: clamp(140px, 22vw, 220px);
          background-size: cover;
          background-position: center;
          background-color: color-mix(in srgb, var(--panel) 80%, transparent);
        }

        .profile-cover-banner.profile-cover-empty {
          background: linear-gradient(135deg, var(--primary), var(--secondary));
          opacity: 0.55;
        }

        .profile-hero-grid {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 28px;
          align-items: start;
          padding: clamp(20px, 3vw, 28px);
          margin-top: clamp(-60px, -8vw, -80px);
        }

        .profile-avatar-shell {
          width: clamp(112px, 16vw, 156px);
          aspect-ratio: 1;
          border-radius: 50%;
          overflow: hidden;
          display: grid;
          place-items: center;
          font-size: clamp(40px, 6vw, 64px);
          font-weight: 900;
          color: var(--text-on-accent);
          background: linear-gradient(135deg, var(--primary), var(--secondary));
          box-shadow: 0 24px 44px rgba(124, 58, 237, 0.24);
          border: 4px solid var(--panel);
        }

        .profile-avatar-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .profile-summary-block {
          display: grid;
          gap: 18px;
          padding-top: 12px;
        }

        .profile-header-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .profile-tagline {
          margin: 6px 0 0;
          color: var(--text-soft);
          font-size: 14px;
          font-weight: 600;
        }

        .profile-actions-row {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .profile-stats-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }

        .profile-stat-item {
          padding: 16px 18px;
          border-radius: 18px;
          border: 1px solid var(--line);
          background: color-mix(in srgb, var(--panel) 92%, transparent);
          display: grid;
          gap: 6px;
        }

        .profile-stat-item strong {
          font-size: clamp(20px, 3vw, 28px);
        }

        .profile-stat-item span {
          color: var(--muted);
          font-size: 13px;
          font-weight: 700;
        }

        .profile-bio-copy {
          margin: 0;
          color: var(--text-soft);
          white-space: pre-wrap;
        }

        .profile-tabs-row {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          padding: 6px;
          border-radius: 22px;
          border: 1px solid var(--line);
          background: color-mix(in srgb, var(--panel) 90%, transparent);
        }

        .profile-tab {
          min-height: 46px;
          padding: 0 18px;
          border-radius: 16px;
          border: 1px solid transparent;
          background: transparent;
          color: var(--muted);
          font-weight: 800;
        }

        .profile-tab.active {
          background: linear-gradient(135deg, var(--primary), var(--primary-strong));
          color: var(--text-on-accent);
          box-shadow: 0 16px 32px rgba(124, 58, 237, 0.2);
        }

        .profile-gallery-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
        }

        .profile-gallery-card {
          position: relative;
          aspect-ratio: 1;
          overflow: hidden;
          border-radius: 24px;
          border: 1px solid var(--line);
          background: color-mix(in srgb, var(--panel) 88%, transparent);
          box-shadow: var(--shadow-sm);
        }

        .profile-gallery-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .profile-gallery-empty {
          width: 100%;
          height: 100%;
          display: grid;
          place-items: center;
          color: var(--muted);
          font-weight: 700;
        }

        .profile-gallery-badge {
          position: absolute;
          top: 12px;
          inset-inline-end: 12px;
          padding: 6px 10px;
          border-radius: 999px;
          background: rgba(15, 23, 42, 0.72);
          color: #fff;
          font-size: 11px;
          font-weight: 800;
        }

        /* ============ مودال تعديل الملف الشخصي ============ */
        .profile-edit-stack {
          display: grid;
          gap: 18px;
          padding: 8px 0 4px;
        }

        .profile-edit-section {
          display: grid;
          gap: 8px;
        }

        .profile-edit-label {
          font-weight: 800;
          font-size: 14px;
          color: var(--text);
        }

        .profile-edit-hint {
          color: var(--muted);
          font-size: 12px;
        }

        .profile-edit-input,
        .profile-edit-textarea {
          width: 100%;
          padding: 12px 14px;
          border-radius: 14px;
          border: 1px solid var(--line);
          background: color-mix(in srgb, var(--panel) 92%, transparent);
          color: var(--text);
          font: inherit;
          box-sizing: border-box;
        }

        .profile-edit-textarea {
          resize: vertical;
          min-height: 96px;
        }

        .profile-edit-input:focus,
        .profile-edit-textarea:focus {
          outline: none;
          border-color: color-mix(in srgb, var(--primary) 55%, transparent);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 25%, transparent);
        }

        .profile-edit-cover {
          position: relative;
          width: 100%;
          height: 160px;
          border-radius: 18px;
          background-color: color-mix(in srgb, var(--panel) 92%, transparent);
          background-size: cover;
          background-position: center;
          border: 1px dashed var(--line);
          display: grid;
          place-items: center;
          overflow: hidden;
        }

        .profile-edit-cover.empty {
          background: linear-gradient(135deg, color-mix(in srgb, var(--primary) 22%, transparent), color-mix(in srgb, var(--secondary) 22%, transparent));
          color: var(--muted);
          font-weight: 700;
        }

        .profile-edit-cover-btn {
          position: absolute;
          inset-block-end: 12px;
          inset-inline-end: 12px;
          padding: 8px 14px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.18);
          background: rgba(15, 23, 42, 0.72);
          color: #fff;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          backdrop-filter: blur(6px);
        }

        .profile-edit-cover-btn:disabled {
          opacity: 0.6;
          cursor: wait;
        }

        .profile-edit-cover-remove {
          inset-inline-end: auto;
          inset-inline-start: 12px;
          background: rgba(239, 68, 68, 0.78);
        }

        .profile-edit-avatar-row {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .profile-edit-avatar-shell {
          width: 96px;
          height: 96px;
          border-radius: 50%;
          overflow: hidden;
          display: grid;
          place-items: center;
          font-size: 36px;
          font-weight: 900;
          color: var(--text-on-accent);
          background: linear-gradient(135deg, var(--primary), var(--secondary));
          flex-shrink: 0;
        }

        .profile-edit-avatar-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .profile-edit-avatar-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .profile-edit-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          flex-wrap: wrap;
          padding-top: 8px;
          border-top: 1px solid var(--line);
        }

        /* ============ المودالات الأخرى ============ */
        .profile-modal-stack {
          display: grid;
          gap: 20px;
          padding: 8px 0 4px;
        }

        .profile-modal-kpis {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .profile-kpi-card {
          text-align: center;
          padding: 24px;
        }

        .profile-kpi-card strong {
          display: block;
          margin-bottom: 8px;
          font-size: 32px;
          color: var(--primary);
        }

        .profile-kpi-card.accent-success strong {
          color: var(--success);
        }

        .profile-chart-card {
          padding: 20px;
          border-radius: 24px;
          border: 1px solid var(--line);
          background: color-mix(in srgb, var(--panel) 92%, transparent);
        }

        .profile-chart-bars {
          height: 220px;
          display: grid;
          grid-template-columns: repeat(7, minmax(0, 1fr));
          gap: 12px;
          align-items: end;
          margin-top: 18px;
        }

        .profile-chart-column {
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: end;
          align-items: center;
          gap: 8px;
        }

        .profile-chart-column span {
          font-size: 11px;
          color: var(--muted);
          font-weight: 700;
        }

        .profile-chart-bar {
          width: 100%;
          max-width: 42px;
          border-radius: 14px 14px 6px 6px;
          background: linear-gradient(180deg, var(--secondary), var(--primary));
        }

        .profile-theme-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
          margin-top: 14px;
        }

        .profile-theme-option {
          display: grid;
          gap: 10px;
          padding: 16px;
          border-radius: 18px;
          border: 1px solid var(--line);
          background: color-mix(in srgb, var(--panel) 92%, transparent);
          color: var(--text);
          text-align: start;
        }

        .profile-theme-option.active {
          border-color: color-mix(in srgb, var(--primary) 55%, white 8%);
          box-shadow: 0 16px 32px rgba(124, 58, 237, 0.18);
        }

        .profile-theme-swatch {
          width: 100%;
          height: 56px;
          border-radius: 14px;
          background: linear-gradient(135deg, var(--theme-color), color-mix(in srgb, var(--theme-color) 55%, white 12%));
        }

        .profile-settings-card {
          display: grid;
          gap: 14px;
        }

        .profile-setting-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        @media (max-width: 860px) {
          .profile-hero-grid,
          .profile-modal-kpis,
          .profile-theme-grid {
            grid-template-columns: 1fr;
          }

          .profile-header-row {
            flex-direction: column;
          }
        }

        @media (max-width: 640px) {
          .profile-gallery-grid,
          .profile-stats-grid {
            grid-template-columns: 1fr;
          }

          .profile-tabs-row {
            display: grid;
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </MainLayout>
  );
}

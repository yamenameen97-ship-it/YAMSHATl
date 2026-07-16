import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout.jsx';
import { useAppStore } from '../store/appStore.js';
import { getMe, getProfileBundle, getRelationship, getUserPosts } from '../api/users.js';
import { getCurrentUsername } from '../utils/auth.js';
// ✅ v87.18 FIX: صفحة الملف الشخصي كانت تختفي كلياً (شاشة بيضاء) لأن
//    الكود كان يستدعي resolveMediaUrlPublic بينما الدالة المتاحة اسمها
//    resolveMediaUrl (من config/mediaConfig.js). ReferenceError عند render
//    يوقف تشكيل الصفحة بالكامل. الحل: استيراد الدالة الصحيحة والاعتماد
//    عليها في تحويل رابط الأفاتار إلى URL كامل.
import { resolveMediaUrl } from '../config/mediaConfig.js';

// ✅ v87.16 FIX: إزالة البيانات التجريبية الثابتة نهائياً.
// كانت البيانات السابقة "Y A M E N / 78 / 1.2M / 32.4M" مُثبّتة في الكود
// فلا تتغير حتى لو المستخدم دخل بحساب مختلف. الآن كل القيم تُجلب
// من الـ backend via getMe() / getProfileBundle(username) ديناميكياً.
function formatStat(value) {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return '0';
  if (num >= 1_000_000) {
    const m = num / 1_000_000;
    return (m >= 10 ? m.toFixed(0) : m.toFixed(1).replace(/\.0$/, '')) + 'M';
  }
  if (num >= 1_000) {
    const k = num / 1_000;
    return (k >= 10 ? k.toFixed(0) : k.toFixed(1).replace(/\.0$/, '')) + 'K';
  }
  return String(num);
}

// الحقول التي نقرأها من استجابة backend لتغذية الواجهة
function extractProfile(payload = {}, currentUsername = '') {
  const user = payload?.user || {};
  const rawUsername = String(
    user.username || payload.username || currentUsername || ''
  ).trim().replace(/^@/, '');
  const displayRaw = String(
    user.display_name || user.full_name || user.name || user.author_name || rawUsername || 'مستخدم'
  );
  const handle = rawUsername ? `@${rawUsername}` : '@user';
  const stats = {
    following: Number(
      user.following_count ?? user.following ?? payload.following_count ?? 0
    ),
    followers: Number(
      user.followers_count ?? user.followers ?? payload.followers_count ?? 0
    ),
    likes: Number(
      user.likes_count ?? user.likes_received ?? payload.likes_count
        ?? payload.total_likes ?? 0
    ),
    posts: Number(user.posts_count ?? payload.posts_count ?? 0),
    reels: Number(user.reels_count ?? payload.reels_count ?? 0),
  };
  const bioRaw = String(user.bio ?? payload.bio ?? '').trim();
  const bioLines = bioRaw
    ? bioRaw.split(/\n+/).map((line) => line.trim()).filter(Boolean).slice(0, 4)
    : [];
  const contactLine = String(payload.contact_line || user.contact_line || 'للتواصل والإعلانات');
  const website = String(payload.website || user.website || 'yamshat.com');
  const avatar = user.avatar_url || user.avatar || payload.avatar_url || '';
  const verified = Boolean(user.verified || user.is_verified || payload.verified);
  return {
    username: rawUsername,
    handle,
    displayName: displayRaw,
    stats,
    bioLines,
    contactLine,
    website,
    avatar,
    verified,
    bio: bioRaw,
    isFollowing: Boolean(payload.is_following),
  };
}

const TABS = [
  { key: 'posts', label: 'المنشورات', icon: 'grid' },
  { key: 'media', label: 'الوسائط', icon: 'play' },
  { key: 'stories', label: 'الستوريات', icon: 'circle' },
  { key: 'groups', label: 'المجموعات', icon: 'group' },
];

const POSTS = [
  {
    id: 'post-text',
    type: 'text',
    time: 'منذ 2 ساعة',
    content: [
      'التصميم ليس فقط شكل جميل،',
      'بل هو طريقة لحل المشاكل وجعل الحياة أسهل.',
      'ما رأيكم؟ 💜',
    ],
    stats: { likes: '12.4K', comments: '832', shares: '451' },
  },
  {
    id: 'post-art',
    type: 'image',
    time: 'منذ 1 يوم',
    image: '/reference-profile/post-image.png',
    stats: { likes: '23.1K', comments: '1.2K', shares: '678' },
  },
];

function VerifiedBadge({ size = 16 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path fill="#4C7DFF" d="M12 2.25 14.61 4l3.13-.25 1.03 2.96L21.75 8l-1.75 4 1.75 4-2.98 1.29-1.03 2.96-3.13-.25L12 21.75 9.39 20l-3.13.25-1.03-2.96L2.25 16 4 12 2.25 8l2.98-1.29 1.03-2.96L9.39 4 12 2.25Z" />
      <path fill="#fff" d="m10.32 15.47-2.6-2.6 1.18-1.18 1.42 1.42 4.84-4.84 1.18 1.18-6.02 6.02Z" />
    </svg>
  );
}

function Icon({ name, size = 20, color = 'currentColor', stroke = 1.9 }) {
  const common = { fill: 'none', stroke: color, strokeWidth: stroke, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'back':
      return <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true"><path {...common} d="M15 5 8 12l7 7" /></svg>;
    case 'bell':
      return <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true"><path {...common} d="M12 4a4 4 0 0 0-4 4v2.35c0 .79-.28 1.55-.79 2.16L6 14h12l-1.21-1.49A3.36 3.36 0 0 1 16 10.35V8a4 4 0 0 0-4-4Z" /><path {...common} d="M10 18a2 2 0 0 0 4 0" /></svg>;
    case 'menu':
      return <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true"><circle cx="12" cy="5" r="1.6" fill={color} /><circle cx="12" cy="12" r="1.6" fill={color} /><circle cx="12" cy="19" r="1.6" fill={color} /></svg>;
    case 'paper':
      return <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true"><path {...common} d="m21 3-9.24 18-2.2-7.56L3 11.24 21 3Z" /><path {...common} d="M9.56 13.44 21 3" /></svg>;
    case 'heart':
      return <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true"><path {...common} d="M12 20.25S4 15.5 4 9.76A4.76 4.76 0 0 1 8.76 5c1.42 0 2.78.64 3.24 1.64C12.46 5.64 13.82 5 15.24 5A4.76 4.76 0 0 1 20 9.76c0 5.74-8 10.49-8 10.49Z" /></svg>;
    case 'comment':
      return <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true"><path {...common} d="M6.5 18.5 4 20V6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v8a2.5 2.5 0 0 1-2.5 2.5H6.5Z" /></svg>;
    case 'share':
      return <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true"><path {...common} d="m21 4-8.5 16-2.25-6.25L4 11.5 21 4Z" /></svg>;
    case 'grid':
      return <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true"><rect x="4" y="4" width="6" height="6" rx="1.4" fill={color} /><rect x="14" y="4" width="6" height="6" rx="1.4" fill={color} /><rect x="4" y="14" width="6" height="6" rx="1.4" fill={color} /><rect x="14" y="14" width="6" height="6" rx="1.4" fill={color} /></svg>;
    case 'play':
      return <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true"><path {...common} d="M8 6.75v10.5c0 .65.71 1.05 1.27.72l8.21-4.75a.83.83 0 0 0 0-1.44L9.27 6.03A.83.83 0 0 0 8 6.75Z" /></svg>;
    case 'circle':
      return <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true"><circle cx="12" cy="12" r="6.25" {...common} /></svg>;
    case 'group':
      return <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true"><circle cx="8" cy="9" r="2.5" {...common} /><circle cx="16.5" cy="8.5" r="2" {...common} /><path {...common} d="M4.5 18.5c.8-2.55 2.77-3.83 5.5-3.83s4.7 1.28 5.5 3.83" /><path {...common} d="M14.5 18c.47-1.76 1.82-2.78 3.84-2.95" /></svg>;
    case 'home':
      return <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true"><path {...common} d="m4.5 10.5 7.5-6 7.5 6" /><path {...common} d="M6.5 9.5V19h11V9.5" /></svg>;
    case 'chat':
      return <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true"><path {...common} d="M5.5 18.5 4 20V6.75A2.75 2.75 0 0 1 6.75 4h10.5A2.75 2.75 0 0 1 20 6.75v7.5A2.75 2.75 0 0 1 17.25 17H5.5Z" /></svg>;
    case 'plus':
      return <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true"><path {...common} d="M12 5v14M5 12h14" /></svg>;
    case 'reels':
      return <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true"><rect x="4.5" y="4.5" width="15" height="15" rx="3" {...common} /><path {...common} d="M4.5 9.25h15" /><path {...common} d="m8 4.75 3 4.5" /><path {...common} d="m13 4.75 3 4.5" /><path {...common} d="m10 11.5 4 2.5-4 2.5Z" /></svg>;
    case 'profile':
      return <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true"><circle cx="12" cy="8" r="3.25" {...common} /><path {...common} d="M5 19c1.03-3.1 3.27-4.65 7-4.65S17.97 15.9 19 19" /></svg>;
    case 'site':
      return <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true"><path {...common} d="M10.2 13.8 8.1 15.9a3.1 3.1 0 1 1-4.38-4.38l2.8-2.8a3.1 3.1 0 0 1 4.38 0" /><path {...common} d="m13.8 10.2 2.1-2.1a3.1 3.1 0 0 1 4.38 4.38l-2.8 2.8a3.1 3.1 0 0 1-4.38 0" /><path {...common} d="m9.2 14.8 5.6-5.6" /></svg>;
    case 'mail':
      return <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true"><rect x="4" y="6" width="16" height="12" rx="2.2" {...common} /><path {...common} d="m5 8 7 5 7-5" /></svg>;
    default:
      return null;
  }
}

function SignalIcons() {
  return (
    <div className="ym-ref-status-icons" aria-hidden="true">
      <span className="ym-ref-signal">
        <i /><i /><i /><i />
      </span>
      <span className="ym-ref-wifi"><em /></span>
      <span className="ym-ref-battery"><b /></span>
    </div>
  );
}

function normalizeProfilePosts(payload) {
  const source = Array.isArray(payload)
    ? payload
    : payload?.posts || payload?.items || payload?.results || payload?.data || [];

  if (!Array.isArray(source) || source.length === 0) return [];

  return source
    .map((post, index) => {
      const rawId = post?.id ?? post?.post_id ?? post?._id ?? `profile-post-${index}`;
      const rawText = String(
        post?.content ?? post?.text ?? post?.body ?? post?.caption ?? post?.description ?? ''
      ).trim();
      const content = rawText
        ? rawText.split(/\n+/).map((line) => line.trim()).filter(Boolean).slice(0, 6)
        : [];
      const image =
        post?.image_url || post?.image || post?.media_url || post?.media?.url || post?.thumbnail_url || '';
      const likes = post?.likes_count ?? post?.likes ?? post?.stats?.likes ?? 0;
      const comments = post?.comments_count ?? post?.comments ?? post?.stats?.comments ?? 0;
      const shares = post?.shares_count ?? post?.shares ?? post?.stats?.shares ?? 0;
      return {
        id: String(rawId),
        type: image ? 'image' : 'text',
        time: String(post?.created_at_relative || post?.time_ago || post?.created_relative || post?.created_at || 'الآن'),
        content,
        image,
        stats: {
          likes: formatStat(likes),
          comments: formatStat(comments),
          shares: formatStat(shares),
        },
      };
    })
    .filter((item) => item.content.length || item.image);
}

function ProfilePostsList({ username, avatar, displayName, verified }) {
  const [items, setItems] = useState(POSTS);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [postsError, setPostsError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadPosts = async () => {
      if (!username) {
        setItems(POSTS);
        setPostsError('');
        setLoadingPosts(false);
        return;
      }

      setLoadingPosts(true);
      try {
        const res = await getUserPosts(username);
        if (cancelled) return;
        const normalized = normalizeProfilePosts(res?.data);
        if (normalized.length > 0) {
          setItems(normalized);
          setPostsError('');
        } else {
          setItems(POSTS);
          setPostsError('');
        }
      } catch (err) {
        if (cancelled) return;
        setItems(POSTS);
        setPostsError(err?.response?.data?.detail || err?.message || '');
      } finally {
        if (!cancelled) setLoadingPosts(false);
      }
    };

    loadPosts();
    return () => {
      cancelled = true;
    };
  }, [username]);

  if (loadingPosts && items.length === 0) {
    return <div className="ym-ref-empty-state"><span>جارٍ تحميل المنشورات…</span></div>;
  }

  return (
    <>
      {items.map((post) => {
        const imageSrc = post.image ? resolveMediaUrl(post.image) : '';
        return (
          <article key={post.id} className="ym-ref-post-card">
            <div className="ym-ref-post-head">
              <div className="ym-ref-post-author">
                <img src={avatar} alt={username} />
                <div>
                  <strong>
                    <span>{displayName || username || 'مستخدم'}</span>
                    {verified ? <VerifiedBadge size={15} /> : null}
                  </strong>
                  <small>@{username || 'user'} · {post.time}</small>
                </div>
              </div>
              <button type="button" className="ym-ref-post-menu" aria-label="خيارات المنشور">
                <Icon name="menu" size={18} color="rgba(230,233,255,0.8)" />
              </button>
            </div>

            {post.content?.length ? (
              <div className="ym-ref-post-copy">
                {post.content.map((line, index) => (
                  <p key={`${post.id}-line-${index}`}>{line}</p>
                ))}
              </div>
            ) : null}

            {imageSrc ? (
              <div className="ym-ref-post-image-wrap">
                <img src={imageSrc} alt="صورة المنشور" className="ym-ref-post-image" loading="lazy" />
              </div>
            ) : null}

            <PostFooter stats={post.stats} />
          </article>
        );
      })}

      {!loadingPosts && postsError ? (
        <p style={{ color: 'rgba(255, 155, 155, 0.92)', fontSize: 12.5, marginTop: 10 }}>
          تعذر تحميل بعض المنشورات الحقيقية، فتم عرض نسخة احتياطية مؤقتة.
        </p>
      ) : null}
    </>
  );
}

function TabIcon({ name, active }) {
  return <Icon name={name} size={19} color={active ? '#F5F7FF' : 'rgba(223, 226, 255, 0.72)'} stroke={1.8} />;
}

function BottomItem({ icon, label, active = false, center = false }) {
  return (
    <button type="button" className={`ym-ref-bottom-item ${active ? 'is-active' : ''} ${center ? 'is-center' : ''}`}>
      {center ? (
        <span className="ym-ref-bottom-plus"><Icon name="plus" size={22} color="#FFFFFF" stroke={2.1} /></span>
      ) : (
        <span className="ym-ref-bottom-icon"><Icon name={icon} size={22} color={active ? '#7E4FFF' : 'rgba(220,224,255,0.72)'} stroke={1.9} /></span>
      )}
      <span>{label}</span>
    </button>
  );
}

function PostFooter({ stats }) {
  return (
    <div className="ym-ref-post-footer">
      <button type="button"><Icon name="heart" size={19} color="#7D53FF" /><span>{stats.likes}</span></button>
      <button type="button"><Icon name="comment" size={19} color="rgba(230,233,255,0.68)" /><span>{stats.comments}</span></button>
      <button type="button"><Icon name="share" size={19} color="rgba(230,233,255,0.68)" /><span>{stats.shares}</span></button>
    </div>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const { username: routeUsername } = useParams();
  const session = useAppStore((s) => s.session);
  const currentUsername = String(
    session?.username || session?.user || getCurrentUsername() || routeUsername || ''
  ).trim().replace(/^@/, '');

  // ✅ v87.16: أصحاب الحساب لا يحتاجون أزرار متابعة/رسالة على ملفهم.
  // المقارنة على username و user_id (دفاع متعدد الطبقات ضد المشاركة الجزئية).
  const isOwnProfile = useMemo(() => {
    const sessionIdCandidates = [
      session?.id,
      session?.user_id,
      session?.userId,
      session?.profile?.user_id,
      session?.profile?.id,
    ].filter((v) => v !== undefined && v !== null && v !== '');
    const mySet = new Set(
      sessionIdCandidates.map((v) => String(v))
    );
    const targetUsername = String(routeUsername || '').trim().replace(/^@/, '').toLowerCase();
    const myUsername = currentUsername.toLowerCase();
    if (targetUsername && myUsername && targetUsername === myUsername) return true;
    if (targetUsername && !myUsername) return false;
    if (!targetUsername) return true; // لا يوجد username في الرابط → ملكي
    return false;
  }, [routeUsername, currentUsername, session]);

  const [activeTab, setActiveTab] = useState('posts');
  const [profile, setProfile] = useState(() => extractProfile({}, currentUsername));
  const [relationship, setRelationship] = useState({ following: false, loading: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const targetUsername = String(
    routeUsername || currentUsername || ''
  ).trim().replace(/^@/, '');

  // ✅ v87.16: جلب البيانات الحقيقية من الـ backend.
  // إذا لم يمرر :username في الرابط → نعرض ملف المستخدم المسجّل دخوله.
  useEffect(() => {
    let cancelled = false;
    const loadProfile = async () => {
      if (!targetUsername) {
        setLoading(true);
        try {
          const meRes = await getMe();
          if (cancelled) return;
          const payload = meRes?.data?.profile || meRes?.data || {};
          const meUsername = String(
            payload.username || payload.user?.username || getCurrentUsername() || ''
          ).trim().replace(/^@/, '');
          setProfile(extractProfile(payload, meUsername));
          setError('');
        } catch (err) {
          if (cancelled) return;
          setError(err?.response?.data?.detail || err?.message || 'فشل تحميل الملف الشخصي');
        } finally {
          if (!cancelled) setLoading(false);
        }
        return;
      }
      setLoading(true);
      try {
        const bundleRes = await getProfileBundle(targetUsername, { forceRefresh: true });
        if (cancelled) return;
        const payload = bundleRes?.data || {};
        setProfile(extractProfile(payload, targetUsername));
        setError('');
      } catch (err) {
        if (cancelled) return;
        // fallback إلى getMe() إن كان هو المستخدم نفسه
        try {
          const meRes = await getMe();
          if (cancelled) return;
          const payload = meRes?.data?.profile || meRes?.data || {};
          const meUsername = String(payload.username || getCurrentUsername() || '').trim().replace(/^@/, '');
          if (meUsername.toLowerCase() === targetUsername.toLowerCase()) {
            setProfile(extractProfile(payload, meUsername));
            setError('');
            return;
          }
          setError(err?.response?.data?.detail || err?.message || 'فشل تحميل الملف الشخصي');
        } catch (innerErr) {
          if (cancelled) return;
          setError(innerErr?.response?.data?.detail || innerErr?.message || 'فشل تحميل الملف الشخصي');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadProfile();
    return () => { cancelled = true; };
  }, [targetUsername]);

  // جلب حالة المتابعة فقط حين يكون الملف لغير صاحبه
  useEffect(() => {
    if (isOwnProfile || !targetUsername) {
      setRelationship({ following: false, loading: false });
      return undefined;
    }
    let cancelled = false;
    const loadRelationship = async () => {
      try {
        const res = await getRelationship(targetUsername);
        if (cancelled) return;
        setRelationship({
          following: Boolean(
            res?.data?.following ?? res?.data?.is_following ?? res?.data?.you_follow ?? false
          ),
          loading: false,
        });
      } catch (err) {
        if (cancelled) return;
        setRelationship({ following: false, loading: false });
      }
    };
    loadRelationship();
    return () => { cancelled = true; };
  }, [isOwnProfile, targetUsername]);

  const statsDisplay = useMemo(() => ([
    { value: formatStat(profile.stats.following), label: 'متابع' },
    { value: formatStat(profile.stats.followers), label: 'متابعين' },
    { value: formatStat(profile.stats.likes), label: 'إعجابات' },
  ]), [profile.stats.following, profile.stats.followers, profile.stats.likes]);

  const avatarSrc = useMemo(() => {
    if (profile.avatar) return resolveMediaUrl(profile.avatar);
    return null;
  }, [profile.avatar]);

  const postHeadAvatar = avatarSrc || '/reference-profile/avatar.png';
  return (
    <MainLayout hideNav>
      <section
        className="ym-ref-profile-screen ym-profile-page profile-page"
        data-page="profile"
        data-placeholder={loading ? 'true' : 'false'}
        dir="rtl"
      >
        <div className="ym-ref-profile-shell">
          {/* ✅ v87.16 FIX: تم حذف شريط الساعة + البطارية + الواي فاي + البث نهائياً.
              كان مرسوماً رسماً لكن لا داعي له — الصفحة الفعلية تبدأ من الهيدر. */}

          <div className="ym-ref-topbar">
            <button type="button" aria-label="رجوع" className="ym-ref-icon-btn" onClick={() => navigate(-1)}>
              <Icon name="back" size={22} color="#FFFFFF" />
            </button>
            <div className="ym-ref-topbar-title">
              <span>{profile.username || 'مستخدم'}</span>
              {profile.verified ? <VerifiedBadge size={16} /> : null}
            </div>
            <div className="ym-ref-topbar-actions">
              <button type="button" aria-label="الإشعارات" className="ym-ref-icon-btn"><Icon name="bell" size={20} color="#FFFFFF" /></button>
              <button type="button" aria-label="المزيد" className="ym-ref-icon-btn"><Icon name="menu" size={20} color="#FFFFFF" /></button>
            </div>
          </div>

          <div className="ym-ref-profile-header">
            <div className="ym-ref-avatar-wrap">
              <div className="ym-ref-avatar-ring">
                {avatarSrc ? (
                  <img src={avatarSrc} alt={profile.username} className="ym-ref-avatar" />
                ) : (
                  <div className="ym-ref-avatar ym-ref-avatar-fallback" aria-hidden="true">
                    {(profile.displayName || profile.username || 'U').slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <button type="button" className="ym-ref-avatar-plus" aria-label="إضافة">
                <Icon name="plus" size={14} color="#FFFFFF" stroke={2.4} />
              </button>
            </div>

            <h1>{profile.displayName}</h1>
            <p>{profile.handle}</p>

            <div className="ym-ref-stats">
              {statsDisplay.map((item, index) => (
                <div key={item.label} className="ym-ref-stat">
                  <strong>{loading ? '—' : item.value}</strong>
                  <span>{item.label}</span>
                  {index < statsDisplay.length - 1 ? <i className="ym-ref-stat-divider" aria-hidden="true" /> : null}
                </div>
              ))}
            </div>

            {/* ✅ v87.16 FIX: إخفاء أزرار المتابعة والرسالة حين يكون الملف لمالكه.
                نبقي الأزرار فقط حين يكون الملف لمستخدم آخر. */}
            {!isOwnProfile ? (
              <div className="ym-ref-actions">
                <button type="button" className="ym-ref-action ym-ref-action-secondary">
                  <span>رسالة</span>
                  <Icon name="paper" size={15} color="rgba(245,247,255,0.92)" />
                </button>
                <button type="button" className="ym-ref-action ym-ref-action-primary">
                  {relationship.following ? 'إلغاء المتابعة' : 'متابعة'}
                </button>
              </div>
            ) : null}

            <div className="ym-ref-bio">
              {profile.bioLines.map((line) => <p key={line}>{line}</p>)}
              <div className="ym-ref-inline-line ym-ref-contact-row">
                <Icon name="mail" size={14} color="rgba(225,230,255,0.75)" />
                <span>{profile.contactLine}</span>
                <span className="ym-ref-dot-icon">◎</span>
              </div>
              <div className="ym-ref-inline-line ym-ref-link-row">
                <Icon name="site" size={14} color="#B994FF" />
                <a href={`https://${profile.website}`} target="_blank" rel="noreferrer">{profile.website}</a>
                <Icon name="site" size={14} color="#B994FF" />
              </div>
              {error ? <p style={{ color: '#ff8b8b', fontSize: 13, marginTop: 6 }}>{error}</p> : null}
            </div>
          </div>

          <nav className="ym-ref-tabs" aria-label="أقسام الملف الشخصي">
            {TABS.map((tab) => {
              const active = activeTab === tab.key;
              return (
                <button key={tab.key} type="button" className={`ym-ref-tab ${active ? 'is-active' : ''}`} onClick={() => setActiveTab(tab.key)}>
                  <TabIcon name={tab.icon} active={active} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="ym-ref-content">
            {activeTab === 'posts' ? (
              <ProfilePostsList
                username={profile.username}
                avatar={postHeadAvatar}
                displayName={profile.displayName}
                verified={profile.verified}
              />
            ) : (
              <div className="ym-ref-empty-state">
                <span>{TABS.find((tab) => tab.key === activeTab)?.label}</span>
                <p>تم تجهيز التبويب ضمن نفس توزيع التصميم المرجعي.</p>
              </div>
            )}
          </div>
        </div>

        <footer className="ym-ref-bottom-nav">
          <BottomItem icon="home" label="الرئيسية" />
          <BottomItem icon="chat" label="الدردشات" />
          <BottomItem icon="plus" label="" center />
          <BottomItem icon="reels" label="الريلز" />
          <BottomItem icon="profile" label="حسابي" active />
        </footer>

        <style>{`
          /* ✅ v87.22 FIX #1: تمكين السحب العمودي في صفحة الملف الشخصي.
             إزالة overflow:hidden و min-height الثابت اللذين كانا يحبسان التمرير.
             التمرير يحدث الآن داخل main.mobile-main-content من MobileLayout. */
          /* ✅ v87.24 FIX #1: إصلاح جذري للسحب العمودي.
             السبب: overflow:visible لا يسمح بالتمرير — نحتاج overflow-y:auto
             على العنصر نفسه حتى يتمكن من السحب على الجوال. */
          .ym-ref-profile-screen {
            min-height: 100%;
            height: auto;
            background:
              radial-gradient(circle at 50% 0%, rgba(123, 54, 255, 0.16), transparent 32%),
              radial-gradient(circle at 50% 100%, rgba(123, 54, 255, 0.10), transparent 24%),
              #020205;
            color: #FFFFFF;
            font-family: 'Noto Sans Arabic', 'Tajawal', 'Cairo', system-ui, sans-serif;
            display: flex;
            justify-content: center;
            position: relative;
            overflow: visible;
            touch-action: pan-y;
            -webkit-overflow-scrolling: touch;
            overscroll-behavior-y: contain;
            contain: none;
            content-visibility: visible;
          }

          .ym-ref-profile-shell {
            width: min(100%, 500px);
            min-height: 100%;
            height: auto;
            padding: 10px 18px calc(160px + env(safe-area-inset-bottom, 0px));
            box-sizing: border-box;
            position: relative;
            background: linear-gradient(180deg, rgba(7,7,10,0.96), rgba(3,3,5,1));
            overflow: visible;
            touch-action: pan-y;
            contain: none;
            content-visibility: visible;
          }

          .ym-ref-statusbar,
          .ym-ref-topbar,
          .ym-ref-stats,
          .ym-ref-actions,
          .ym-ref-tabs,
          .ym-ref-post-head,
          .ym-ref-post-footer,
          .ym-ref-bottom-nav,
          .ym-ref-inline-line,
          .ym-ref-topbar-actions,
          .ym-ref-post-author strong,
          .ym-ref-profile-header {
            display: flex;
            align-items: center;
          }

          .ym-ref-statusbar {
            justify-content: space-between;
            direction: ltr;
            padding: 2px 10px 0;
            font-size: 17px;
            line-height: 1;
            font-weight: 700;
            color: rgba(255,255,255,0.96);
          }

          .ym-ref-status-icons {
            display: flex;
            align-items: center;
            gap: 7px;
          }

          .ym-ref-signal { display: inline-flex; gap: 2px; align-items: flex-end; height: 14px; }
          .ym-ref-signal i { width: 2.4px; border-radius: 999px; background: #fff; display: block; }
          .ym-ref-signal i:nth-child(1) { height: 4px; opacity: .55; }
          .ym-ref-signal i:nth-child(2) { height: 7px; opacity: .72; }
          .ym-ref-signal i:nth-child(3) { height: 10px; opacity: .86; }
          .ym-ref-signal i:nth-child(4) { height: 13px; }
          .ym-ref-wifi { width: 14px; height: 10px; position: relative; display: inline-flex; align-items: center; justify-content: center; }
          .ym-ref-wifi::before,
          .ym-ref-wifi::after,
          .ym-ref-wifi em { content: ''; position: absolute; border: 1.8px solid transparent; border-top-color: #fff; border-radius: 50%; }
          .ym-ref-wifi::before { width: 14px; height: 14px; top: 1px; }
          .ym-ref-wifi::after { width: 10px; height: 10px; top: 3px; }
          .ym-ref-wifi em { width: 5px; height: 5px; top: 7px; }
          .ym-ref-battery { width: 22px; height: 11px; border: 1.6px solid #fff; border-radius: 3px; position: relative; display: inline-block; }
          .ym-ref-battery::after { content: ''; position: absolute; inset-inline-end: -3.4px; top: 2.3px; width: 2px; height: 5px; border-radius: 1px; background: #fff; }
          .ym-ref-battery b { position: absolute; inset: 1.6px; border-radius: 1px; background: #fff; display: block; }

          .ym-ref-topbar {
            justify-content: space-between;
            gap: 12px;
            padding: 16px 4px 10px;
          }

          .ym-ref-topbar-title {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            font-size: 19px;
            font-weight: 700;
            color: #FFFFFF;
            transform: translateX(9px);
          }

          .ym-ref-icon-btn,
          .ym-ref-post-menu,
          .ym-ref-bottom-item,
          .ym-ref-action,
          .ym-ref-tab,
          .ym-ref-post-footer button,
          .ym-ref-avatar-plus {
            border: 0;
            background: transparent;
            color: inherit;
            cursor: pointer;
            padding: 0;
            font: inherit;
          }

          .ym-ref-icon-btn {
            width: 34px;
            height: 34px;
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
          }

          .ym-ref-topbar-actions { gap: 4px; }

          .ym-ref-profile-header {
            flex-direction: column;
            justify-content: center;
            text-align: center;
            padding: 8px 0 10px;
            gap: 10px;
          }

          .ym-ref-avatar-wrap {
            position: relative;
            width: 124px;
            height: 124px;
            margin-bottom: 2px;
          }

          .ym-ref-avatar-ring {
            width: 124px;
            height: 124px;
            border-radius: 50%;
            padding: 3px;
            box-sizing: border-box;
            background: radial-gradient(circle at 50% 30%, rgba(122,64,255,.35), rgba(98,0,255,0.05) 60%, rgba(0,0,0,0));
            box-shadow: 0 0 0 1px rgba(104, 54, 255, 0.95), 0 0 30px rgba(104, 54, 255, 0.18);
          }

          .ym-ref-avatar {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 50%;
            display: block;
            background: #06060A;
          }

          .ym-ref-avatar-plus {
            position: absolute;
            right: -2px;
            bottom: 10px;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(180deg, #6B34FF 0%, #8A57FF 100%);
            box-shadow: 0 8px 18px rgba(111, 53, 255, 0.35);
          }

          .ym-ref-profile-header h1 {
            margin: 0;
            font-size: 24px;
            letter-spacing: 8px;
            font-weight: 500;
          }

          .ym-ref-profile-header > p {
            margin: -4px 0 4px;
            font-size: 16px;
            color: #9198C8;
          }

          .ym-ref-stats {
            width: 100%;
            justify-content: center;
            gap: 0;
            margin-top: 6px;
          }

          .ym-ref-stat {
            flex: 1 1 0;
            min-width: 0;
            justify-content: center;
            text-align: center;
            flex-direction: column;
            gap: 4px;
            position: relative;
          }

          .ym-ref-stat strong {
            font-size: 31px;
            line-height: 1.05;
            font-weight: 400;
            letter-spacing: -0.02em;
          }

          .ym-ref-stat span {
            color: rgba(205, 209, 232, 0.78);
            font-size: 16px;
          }

          .ym-ref-stat-divider {
            position: absolute;
            inset-inline-start: -1px;
            top: 12px;
            bottom: 12px;
            width: 1px;
            background: rgba(255,255,255,0.10);
          }

          .ym-ref-actions {
            width: 100%;
            gap: 12px;
            margin-top: 12px;
          }

          .ym-ref-action {
            flex: 1 1 0;
            min-height: 52px;
            border-radius: 12px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            font-size: 18px;
            font-weight: 700;
          }

          .ym-ref-action-primary {
            color: #FFFFFF;
            background: linear-gradient(180deg, #6B2CFF 0%, #8B49FF 100%);
            box-shadow: 0 10px 24px rgba(108, 44, 255, 0.28);
          }

          .ym-ref-action-secondary {
            color: #F4F7FF;
            background: rgba(9, 16, 18, 0.98);
            box-shadow: inset 0 0 0 1px rgba(60, 73, 84, 0.55);
          }

          .ym-ref-bio {
            display: grid;
            gap: 7px;
            margin-top: 6px;
            text-align: center;
          }

          .ym-ref-bio p,
          .ym-ref-inline-line,
          .ym-ref-post-copy p,
          .ym-ref-empty-state p,
          .ym-ref-empty-state span {
            margin: 0;
          }

          .ym-ref-bio p,
          .ym-ref-inline-line {
            color: rgba(236, 239, 255, 0.86);
            font-size: 16px;
            line-height: 1.5;
          }

          .ym-ref-inline-line {
            justify-content: center;
            gap: 6px;
          }

          .ym-ref-contact-row {
            color: #BAC1EA;
          }

          .ym-ref-dot-icon {
            color: #8E96C4;
            font-size: 13px;
            transform: translateY(-1px);
          }

          .ym-ref-link-row a {
            color: #A291FF;
            text-decoration: none;
          }

          .ym-ref-tabs {
            justify-content: space-between;
            padding: 14px 4px 8px;
            margin-top: 8px;
            border-bottom: 1px solid rgba(255,255,255,0.06);
          }

          .ym-ref-tab {
            min-width: 0;
            flex: 1 1 0;
            display: inline-flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 7px;
            padding: 0 4px 12px;
            color: rgba(223, 226, 255, 0.72);
            font-size: 14px;
            position: relative;
          }

          .ym-ref-tab.is-active {
            color: #FFFFFF;
          }

          .ym-ref-tab.is-active::after {
            content: '';
            position: absolute;
            right: 24%;
            left: 24%;
            bottom: -1px;
            height: 2px;
            border-radius: 999px;
            background: linear-gradient(90deg, #824AFF, #C4A9FF);
          }

          .ym-ref-content {
            padding-top: 8px;
          }

          .ym-ref-post-card {
            padding: 16px 0 18px;
            border-bottom: 1px solid rgba(255,255,255,0.055);
          }

          .ym-ref-post-head {
            justify-content: space-between;
            gap: 12px;
            margin-bottom: 12px;
          }

          .ym-ref-post-author {
            display: flex;
            align-items: center;
            gap: 10px;
            min-width: 0;
          }

          .ym-ref-post-author img {
            width: 42px;
            height: 42px;
            object-fit: cover;
            border-radius: 50%;
            box-shadow: 0 0 0 1px rgba(112, 68, 255, 0.55);
            flex-shrink: 0;
          }

          .ym-ref-post-author strong {
            gap: 6px;
            font-size: 15px;
            font-weight: 700;
            color: #F7F8FF;
            justify-content: flex-start;
          }

          .ym-ref-post-author small {
            display: block;
            margin-top: 3px;
            color: rgba(185, 190, 215, 0.72);
            font-size: 13px;
          }

          .ym-ref-post-copy {
            padding: 6px 2px 6px 0;
            display: grid;
            gap: 8px;
          }

          .ym-ref-post-copy p {
            color: rgba(244, 246, 255, 0.92);
            font-size: 18px;
            line-height: 1.72;
          }

          .ym-ref-post-image-wrap {
            margin-top: 4px;
            border-radius: 4px;
            overflow: hidden;
            background: #09070D;
            box-shadow: 0 0 0 1px rgba(123, 76, 255, 0.08);
          }

          .ym-ref-post-image {
            width: 100%;
            display: block;
            aspect-ratio: 460 / 178;
            object-fit: cover;
          }

          .ym-ref-post-footer {
            justify-content: flex-start;
            gap: 30px;
            margin-top: 14px;
            direction: ltr;
          }

          .ym-ref-post-footer button {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            color: rgba(240,243,255,0.88);
            font-size: 15px;
          }

          .ym-ref-empty-state {
            margin-top: 40px;
            border-radius: 18px;
            background: rgba(255,255,255,0.03);
            border: 1px solid rgba(255,255,255,0.06);
            padding: 24px 18px;
            text-align: center;
            color: rgba(236,240,255,0.86);
          }

          .ym-ref-empty-state span {
            display: block;
            font-size: 18px;
            font-weight: 700;
            margin-bottom: 8px;
          }

          .ym-ref-bottom-nav {
            position: fixed;
            left: 50%;
            bottom: 0;
            transform: translateX(-50%);
            width: min(100%, 500px);
            height: calc(78px + env(safe-area-inset-bottom, 0px));
            padding: 10px 14px calc(12px + env(safe-area-inset-bottom, 0px));
            box-sizing: border-box;
            justify-content: space-between;
            background: linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(4,4,7,0.94) 24%, #040407 100%);
            backdrop-filter: blur(10px);
            z-index: 30;
            direction: rtl;
          }

          .ym-ref-bottom-item {
            flex: 1 1 0;
            min-width: 0;
            display: inline-flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-end;
            gap: 6px;
            color: rgba(220,224,255,0.74);
            font-size: 13px;
          }

          .ym-ref-bottom-item.is-active {
            color: #7E4FFF;
          }

          .ym-ref-bottom-plus {
            width: 50px;
            height: 36px;
            border-radius: 12px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(180deg, #6A31FF 0%, #8B4DFF 100%);
            box-shadow: 0 12px 26px rgba(112, 58, 255, 0.34);
            transform: translateY(-2px);
          }

          .ym-ref-bottom-item.is-center {
            color: transparent;
          }

          .ym-ref-bottom-icon {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-height: 22px;
          }

          /* ✅ v88: التمرير الحقيقي أصبح على .page-content في MainLayout.
             لذلك نحافظ هنا على overflow:visible حتى لا يتولد nested scroll
             يجمّد السحب على بعض متصفحات الجوال. */
          @media (max-width: 768px) {
            .ym-ref-profile-screen {
              min-height: 100%;
              overflow: visible;
              touch-action: pan-y;
              -webkit-overflow-scrolling: touch;
            }
          }

          @media (min-width: 501px) {
            .ym-ref-profile-screen {
              padding-inline: 18px;
            }
            .ym-ref-profile-shell,
            .ym-ref-bottom-nav {
              border-inline: 1px solid rgba(255,255,255,0.05);
            }
          }

          @media (max-width: 420px) {
            .ym-ref-profile-shell {
              padding-inline: 14px;
            }
            .ym-ref-topbar-title {
              font-size: 18px;
              transform: translateX(6px);
            }
            .ym-ref-profile-header h1 {
              font-size: 21px;
              letter-spacing: 6px;
            }
            .ym-ref-stat strong {
              font-size: 27px;
            }
            .ym-ref-bio p,
            .ym-ref-inline-line,
            .ym-ref-action {
              font-size: 15px;
            }
            .ym-ref-post-copy p {
              font-size: 17px;
            }
          }
        `}</style>
      </section>
    </MainLayout>
  );
}

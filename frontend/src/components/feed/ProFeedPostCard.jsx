import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Button from '../ui/Button.jsx';
import Modal from '../ui/Modal.jsx';
import Card from '../ui/Card.jsx';
import {
  getPostHistory,
  getPostInsights,
  likePost,
  savePost,
  sharePost,
  updatePost,
  votePoll,
} from '../../api/posts.js';
// ✅ v59.13.16 FIX #5: ربط حقيقي بمسار /reports بدلاً من الحفظ المحلّي فقط
import { submitReport } from '../../api/reports.js';
import { useToast } from '../admin/ToastProvider.jsx';
import { getCurrentUsername } from '../../utils/auth.js';
import { avatarGradient, formatCompactNumber, formatTimeAgo, initialsFromName } from '../yamshat/YamshatDesign.js';

const REACTIONS = [
  { emoji: '❤️', label: 'حب' },
  { emoji: '🔥', label: 'حماس' },
  { emoji: '😂', label: 'ضحك' },
  { emoji: '👏', label: 'تصفيق' },
  { emoji: '😮', label: 'واو' },
  { emoji: '💡', label: 'فكرة' },
];
const REPORT_REASONS = ['محتوى مزعج', 'إساءة', 'معلومات مضللة', 'كراهية', 'احتيال', 'سبب آخر'];
const REPORTS_KEY = 'yamshat:post-reports:v1';
const REACTIONS_KEY = 'yamshat:post-reactions:v1';

function safeJsonParse(raw, fallback) {
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function loadReports() {
  if (typeof window === 'undefined') return [];
  return safeJsonParse(window.localStorage.getItem(REPORTS_KEY) || '[]', []);
}

function saveReports(items) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(REPORTS_KEY, JSON.stringify(items));
}

function loadReactionStore() {
  if (typeof window === 'undefined') return {};
  return safeJsonParse(window.localStorage.getItem(REACTIONS_KEY) || '{}', {});
}

function saveReactionStore(payload) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(REACTIONS_KEY, JSON.stringify(payload));
}

function Avatar({ username, src, size = 46 }) {
  const style = {
    width: size,
    height: size,
    borderRadius: '50%',
    objectFit: 'cover',
    overflow: 'hidden',
    flexShrink: 0,
    border: '1px solid rgba(148,163,184,0.24)',
    background: '#111827',
  };

  return src
    ? <img src={src} alt={username} style={style} />
    : <div style={{ ...style, display: 'grid', placeItems: 'center', color: 'white', fontWeight: 900, background: avatarGradient(username) }}>{initialsFromName(username).slice(0, 2)}</div>;
}

function renderRichText(content = '', navigate) {
  return content.split(/(\s+)/).map((part, index) => {
    if (!part.trim()) return part;
    if (part.startsWith('@')) {
      const username = part.slice(1).replace(/[.,،!؟:;]+$/g, '');
      return (
        <button
          key={`mention-${index}`}
          type="button"
          onClick={() => navigate(`/profile/${encodeURIComponent(username)}`)}
          style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', fontWeight: 800, padding: 0, fontSize: 'inherit' }}
        >
          {part}
        </button>
      );
    }
    if (part.startsWith('#')) {
      const tag = part.slice(1).replace(/[.,،!؟:;]+$/g, '');
      return (
        <button
          key={`tag-${index}`}
          type="button"
          onClick={() => navigate(`/search?q=${encodeURIComponent(`#${tag}`)}`)}
          style={{ background: 'none', border: 'none', color: '#a78bfa', cursor: 'pointer', fontWeight: 800, padding: 0, fontSize: 'inherit' }}
        >
          {part}
        </button>
      );
    }
    return <span key={`text-${index}`}>{part}</span>;
  });
}

function mediaListFromPost(post) {
  if (Array.isArray(post?.media_urls) && post.media_urls.length) return post.media_urls;
  if (post?.media_url) return [post.media_url];
  if (post?.image_url) return [post.image_url];
  if (post?.media) return [post.media];
  return [];
}

function totalPollVotes(poll = []) {
  return poll.reduce((sum, item) => sum + Number(item?.votes || 0), 0);
}

export default function ProFeedPostCard({ post, onRefresh }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { pushToast } = useToast();
  const currentUsername = getCurrentUsername();
  const isOwner = String(currentUsername || '').toLowerCase() === String(post?.username || '').toLowerCase();

  /* ✅ فتح الملف الشخصي لمؤلف المنشور عند الضغط على الاسم/الأفاتار */
  const goToAuthorProfile = (e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    const u = String(post?.username || '').trim().replace(/^@/, '');
    if (!u) return;
    navigate(`/profile/${encodeURIComponent(u)}`);
  };
  const onKeyGoToAuthorProfile = (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goToAuthorProfile(e); }
  };

  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [selectedReportReason, setSelectedReportReason] = useState(REPORT_REASONS[0]);
  const [reportNote, setReportNote] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [history, setHistory] = useState([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [editContent, setEditContent] = useState(post?.content || '');
  const [pollItems, setPollItems] = useState(Array.isArray(post?.poll) ? post.poll : []);
  const [pollLoading, setPollLoading] = useState(false);
  const [isPinned, setIsPinned] = useState(Boolean(post?.is_pinned));
  const [reactionState, setReactionState] = useState(() => {
    const reactionStore = loadReactionStore();
    const saved = reactionStore[String(post.id)] || {};
    return {
      myReaction: saved.myReaction || null,
      counts: saved.counts || {},
      liked: Boolean(post?.is_liked),
      likesCount: Number(post?.likes_count || 0),
      savesCount: Number(post?.saved_count || post?.save_count || 0),
      saved: Boolean(post?.is_saved || post?.saved_by_me),
      sharesCount: Number(post?.share_count || 0),
    };
  });

  useEffect(() => {
    setEditContent(post?.content || '');
    setPollItems(Array.isArray(post?.poll) ? post.poll : []);
    setIsPinned(Boolean(post?.is_pinned));
    setReactionState((prev) => ({
      ...prev,
      liked: Boolean(post?.is_liked),
      likesCount: Number(post?.likes_count || prev.likesCount || 0),
      savesCount: Number(post?.saved_count || post?.save_count || prev.savesCount || 0),
      saved: Boolean(post?.is_saved || post?.saved_by_me),
      sharesCount: Number(post?.share_count || prev.sharesCount || 0),
    }));
  }, [post]);

  const media = useMemo(() => mediaListFromPost(post), [post]);
  const pollVotes = useMemo(() => totalPollVotes(pollItems), [pollItems]);
  const topReactions = useMemo(() => Object.entries(reactionState.counts || {}).sort((a, b) => b[1] - a[1]).slice(0, 3), [reactionState.counts]);

  const persistReactionState = (nextState) => {
    const reactionStore = loadReactionStore();
    reactionStore[String(post.id)] = {
      myReaction: nextState.myReaction,
      counts: nextState.counts,
    };
    saveReactionStore(reactionStore);
    setReactionState(nextState);
  };

  const invalidateFeed = () => {
    queryClient.invalidateQueries({ queryKey: ['feed-data'] });
    onRefresh?.();
  };

  const likeMutation = useMutation({
    mutationFn: () => likePost(post.id),
    onSuccess: (response) => {
      const data = response?.data || response || {};
      setReactionState((prev) => ({
        ...prev,
        liked: Boolean(data?.liked ?? true),
        likesCount: Number(data?.likes_count ?? data?.like_count ?? prev.likesCount),
      }));
      invalidateFeed();
    },
    onError: (error) => pushToast({ type: 'error', title: 'تعذر تحديث التفاعل', description: error?.response?.data?.detail || error?.message }),
  });

  const saveMutation = useMutation({
    mutationFn: () => savePost(post.id),
    onSuccess: (response) => {
      const data = response?.data || response || {};
      setReactionState((prev) => ({
        ...prev,
        saved: Boolean(data?.saved),
        savesCount: Number(data?.save_count ?? prev.savesCount),
      }));
      pushToast({ type: 'success', title: data?.saved ? 'تم حفظ المنشور' : 'تم إلغاء الحفظ' });
      invalidateFeed();
    },
    onError: (error) => pushToast({ type: 'error', title: 'تعذر حفظ المنشور', description: error?.response?.data?.detail || error?.message }),
  });

  const shareMutation = useMutation({
    mutationFn: (platform) => sharePost(post.id, platform),
    onSuccess: (response) => {
      const data = response?.data || response || {};
      setReactionState((prev) => ({ ...prev, sharesCount: Number(data?.share_count ?? prev.sharesCount + 1) }));
      invalidateFeed();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload) => updatePost(post.id, payload),
    onSuccess: () => {
      pushToast({ type: 'success', title: 'تم تحديث المنشور' });
      setShowEditModal(false);
      invalidateFeed();
    },
    onError: (error) => pushToast({ type: 'error', title: 'تعذر تحديث المنشور', description: error?.response?.data?.detail || error?.message }),
  });

  const handleReaction = async (emoji) => {
    const nextCounts = { ...(reactionState.counts || {}) };
    const previousReaction = reactionState.myReaction;
    if (previousReaction) nextCounts[previousReaction] = Math.max(0, Number(nextCounts[previousReaction] || 0) - 1);
    nextCounts[emoji] = Number(nextCounts[emoji] || 0) + 1;
    const nextState = { ...reactionState, myReaction: emoji, counts: nextCounts };
    persistReactionState(nextState);
    setShowReactionPicker(false);
    if (!reactionState.liked) likeMutation.mutate();
  };

  const handleShare = async (platform) => {
    const shareUrl = `${window.location.origin}/post/${post.id}`;
    try {
      if (platform === 'copy') {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const mapping = {
          whatsapp: `https://wa.me/?text=${encodeURIComponent(`${post.content || ''} ${shareUrl}`)}`,
          twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(post.content || '')}&url=${encodeURIComponent(shareUrl)}`,
          telegram: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(post.content || '')}`,
        };
        window.open(mapping[platform], '_blank', 'noopener,noreferrer');
      }
      shareMutation.mutate(platform);
      pushToast({ type: 'success', title: platform === 'copy' ? 'تم نسخ رابط المشاركة' : 'تمت المشاركة' });
      setShowShareModal(false);
    } catch (error) {
      pushToast({ type: 'error', title: 'تعذر مشاركة المنشور', description: error?.message });
    }
  };

  // ✅ v59.13.16 FIX #5: إرسال فعلي لـ /reports عبر submitReport مع إبقاء نسخة محلية للأرشفة
  const handleReport = async () => {
    if (!selectedReportReason) {
      pushToast({ type: 'error', title: 'يرجى اختيار سبب البلاغ' });
      return;
    }
    // أرسل البلاغ فعلياً للخادم
    let serverOk = false;
    try {
      await submitReport({
        targetType: 'post',
        targetId: post.id,
        reason: selectedReportReason,
        details: reportNote.trim() || null,
        context: { source: 'web', target_label: `منشور @${post.username || ''}` },
      });
      serverOk = true;
    } catch (error) {
      // لا نفقد البلاغ — نخزّنه محلياً ونعرض رسالة خطأ
      console.warn('[ProFeedPostCard] submitReport failed:', error?.response?.status, error?.message);
    }

    // حفظ أرشيفي محلي للوصول السريع (لوحة الإشراف المحلية)
    const nextReports = [
      {
        id: `${post.id}-${Date.now()}`,
        post_id: post.id,
        username: post.username,
        reason: selectedReportReason,
        note: reportNote.trim(),
        synced: serverOk,
        created_at: new Date().toISOString(),
      },
      ...loadReports(),
    ].slice(0, 200);
    saveReports(nextReports);

    if (serverOk) {
      pushToast({
        type: 'success',
        title: 'تم إرسال البلاغ',
        description: 'سيتم مراجعته خلال 24 ساعة.',
      });
    } else {
      pushToast({
        type: 'warning',
        title: 'تم حفظ البلاغ محلياً',
        description: 'تعذّر الاتصال بالخادم — سيتم إعادة الإرسال عند توفر الاتصال.',
      });
    }
    setShowReportModal(false);
    setReportNote('');
  };

  const handleOpenAnalytics = async () => {
    setShowAnalyticsModal(true);
    setAnalyticsLoading(true);
    try {
      const response = await getPostInsights(post.id);
      setAnalytics(response?.data || response || {});
    } catch (error) {
      pushToast({ type: 'error', title: 'تعذر تحميل التحليلات', description: error?.response?.data?.detail || error?.message });
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleOpenHistory = async () => {
    setShowHistoryModal(true);
    setHistoryLoading(true);
    try {
      const response = await getPostHistory(post.id);
      setHistory(Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : []);
    } catch (error) {
      pushToast({ type: 'error', title: 'تعذر تحميل سجل التعديلات', description: error?.response?.data?.detail || error?.message });
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleTogglePin = () => {
    const nextPinned = !isPinned;
    setIsPinned(nextPinned);
    updateMutation.mutate({ is_pinned: nextPinned });
  };

  const handleVotePoll = async (optionKey) => {
    if (pollLoading) return;
    setPollLoading(true);
    try {
      const response = await votePoll(post.id, optionKey);
      const data = response?.data || response || {};
      if (Array.isArray(data?.poll)) setPollItems(data.poll);
      else {
        setPollItems((prev) => prev.map((item) => ({
          ...item,
          votes: item.id === optionKey ? Number(item.votes || 0) + 1 : Number(item.votes || 0),
          voted_by_me: item.id === optionKey,
        })));
      }
      pushToast({ type: 'success', title: 'تم تسجيل التصويت' });
      invalidateFeed();
    } catch (error) {
      pushToast({ type: 'error', title: 'تعذر التصويت في الاستطلاع', description: error?.response?.data?.detail || error?.message });
    } finally {
      setPollLoading(false);
    }
  };

  return (
    <>
      <Card className="feed-pro-card" style={{ padding: 18, borderRadius: 24, border: isPinned ? '1px solid rgba(168,85,247,0.58)' : '1px solid rgba(148,163,184,0.14)', background: 'linear-gradient(180deg, rgba(15,23,42,0.96), rgba(15,23,42,0.9))' }}>
        <div dir="rtl" style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap', fontFamily: "'Noto Sans Arabic', 'Tajawal', system-ui, sans-serif" }}>
          <div style={{ display: 'flex', flexDirection: 'row-reverse', gap: 12, alignItems: 'center', minWidth: 0 }}>
            <div
              role="link"
              tabIndex={0}
              onClick={goToAuthorProfile}
              onKeyDown={onKeyGoToAuthorProfile}
              aria-label={`فتح الملف الشخصي لـ ${post.username || ''}`}
              title={`فتح ملف ${post.username || ''}`}
              style={{ cursor: 'pointer', display: 'inline-flex' }}
            >
              <Avatar username={post.username || 'Yamshat'} src={post.avatar || post.user_avatar} size={48} />
            </div>
            <div style={{ minWidth: 0, textAlign: 'right' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <strong
                  role="link"
                  tabIndex={0}
                  onClick={goToAuthorProfile}
                  onKeyDown={onKeyGoToAuthorProfile}
                  aria-label={`فتح الملف الشخصي لـ ${post.username || ''}`}
                  title={`فتح ملف ${post.username || ''}`}
                  style={{ fontSize: 16, cursor: 'pointer' }}
                >{post.username || 'Yamshat'}</strong>
                {post.is_verified ? <span title="موثق">✅</span> : null}
                {isPinned ? <span className="feed-pill">📌 مثبت</span> : null}
                {post.edit_count ? <span className="feed-pill soft">{post.edit_count} تعديل</span> : null}
                {pollItems.length ? <span className="feed-pill soft">استطلاع</span> : null}
              </div>
              <div style={{ color: 'rgba(226,232,240,0.68)', fontSize: 12, marginTop: 4 }}>{formatTimeAgo(post.created_at)}{post.last_edited_at ? ` · آخر تعديل ${formatTimeAgo(post.last_edited_at)}` : ''}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button variant="secondary" size="small" onClick={handleOpenAnalytics}>📊 التحليلات</Button>
            <Button variant="secondary" size="small" onClick={handleOpenHistory}>🕘 السجل</Button>
            <Button variant="secondary" size="small" onClick={() => setShowReportModal(true)}>🚩 إبلاغ</Button>
            {isOwner ? <Button variant="secondary" size="small" onClick={() => setShowEditModal(true)}>✏️ تعديل</Button> : null}
            {isOwner ? <Button variant="secondary" size="small" onClick={handleTogglePin}>{isPinned ? 'إلغاء التثبيت' : 'تثبيت'}</Button> : null}
          </div>
        </div>

        <div style={{ marginTop: 16, fontSize: 16, lineHeight: 1.9, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {renderRichText(post.content || '', navigate)}
        </div>

        {post.hashtags?.length ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            {post.hashtags.map((tag) => (
              <button key={tag} type="button" className="feed-tag-chip" onClick={() => navigate(`/search?q=${encodeURIComponent(`#${tag}`)}`)}>#{tag}</button>
            ))}
          </div>
        ) : null}

        {pollItems.length ? (
          <div className="feed-poll-box">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', marginBottom: 10 }}>
              <strong>استطلاع المنشور</strong>
              <span className="muted">{formatCompactNumber(pollVotes)} صوت</span>
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              {pollItems.map((item) => {
                const votes = Number(item?.votes || 0);
                const percentage = pollVotes > 0 ? Math.round((votes / pollVotes) * 100) : 0;
                return (
                  <button key={item.id} type="button" disabled={pollLoading || item.voted_by_me} onClick={() => handleVotePoll(item.id)} className={`feed-poll-option ${item.voted_by_me ? 'voted' : ''}`}>
                    <div className="feed-poll-fill" style={{ width: `${percentage}%` }} />
                    <div className="feed-poll-content">
                      <span>{item.label}</span>
                      <strong>{percentage}%</strong>
                    </div>
                    <small>{formatCompactNumber(votes)} صوت</small>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {media.length ? (
          <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
            {media.slice(0, 3).map((item, index) => {
              const isVideo = /\.(mp4|webm|mov|m4v|m3u8)(\?.*)?$/i.test(item || '');
              return (
                <div key={`${item}-${index}`} onClick={() => setShowMediaModal(true)} style={{ borderRadius: 18, overflow: 'hidden', background: '#020617', cursor: 'pointer', border: '1px solid rgba(148,163,184,0.14)' }}>
                  {isVideo
                    ? <video src={item} controls muted style={{ width: '100%', maxHeight: 420, display: 'block' }} />
                    : <img src={item} alt={post.content || 'post media'} style={{ width: '100%', maxHeight: 520, objectFit: 'cover', display: 'block' }} />}
                </div>
              );
            })}
          </div>
        ) : null}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(148,163,184,0.12)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {topReactions.length ? topReactions.map(([emoji, count]) => <span key={emoji} className="feed-pill soft">{emoji} {formatCompactNumber(count)}</span>) : <span className="feed-pill soft">تفاعل متقدم</span>}
            <span className="feed-pill soft">❤️ {formatCompactNumber(reactionState.likesCount)}</span>
            <span className="feed-pill soft">🔖 {formatCompactNumber(reactionState.savesCount)}</span>
            <span className="feed-pill soft">📤 {formatCompactNumber(reactionState.sharesCount)}</span>
          </div>
          <div style={{ color: 'rgba(226,232,240,0.62)', fontSize: 12 }}>
            منشن {post.mentions?.length || 0} · هاشتاج {post.hashtags?.length || 0}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14, alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Button size="small" onClick={() => likeMutation.mutate()} variant={reactionState.liked ? 'primary' : 'secondary'}>
              {reactionState.myReaction || (reactionState.liked ? '❤️' : '🤍')} تفاعل
            </Button>
            <button type="button" onClick={() => setShowReactionPicker((prev) => !prev)} className="feed-ghost-link">اختيار رد فعل</button>
            {showReactionPicker ? (
              <div className="feed-reaction-popover">
                {REACTIONS.map((reaction) => (
                  <button key={reaction.emoji} type="button" onClick={() => handleReaction(reaction.emoji)} className="feed-reaction-item" title={reaction.label}>{reaction.emoji}</button>
                ))}
              </div>
            ) : null}
          </div>
          <Button size="small" variant={reactionState.saved ? 'primary' : 'secondary'} onClick={() => saveMutation.mutate()}>
            {reactionState.saved ? 'تم الحفظ' : 'حفظ'}
          </Button>
          <Button size="small" variant="secondary" onClick={() => setShowShareModal(true)}>مشاركة</Button>
          {post.share_url ? <button type="button" className="feed-ghost-link" onClick={() => navigate(post.share_url)}>فتح المنشور</button> : null}
        </div>
      </Card>

      <Modal open={showShareModal} onClose={() => setShowShareModal(false)} title="نظام المشاركة">
        <div style={{ display: 'grid', gap: 10 }}>
          <Button onClick={() => handleShare('copy')}>نسخ الرابط</Button>
          <Button variant="secondary" onClick={() => handleShare('whatsapp')}>واتساب</Button>
          <Button variant="secondary" onClick={() => handleShare('twitter')}>إكس / تويتر</Button>
          <Button variant="secondary" onClick={() => handleShare('telegram')}>تيليجرام</Button>
        </div>
      </Modal>

      <Modal open={showReportModal} onClose={() => setShowReportModal(false)} title="الإبلاغ عن المنشور">
        <div style={{ display: 'grid', gap: 14 }}>
          <select value={selectedReportReason} onChange={(event) => setSelectedReportReason(event.target.value)}>
            {REPORT_REASONS.map((reason) => <option key={reason} value={reason}>{reason}</option>)}
          </select>
          <textarea rows={4} value={reportNote} onChange={(event) => setReportNote(event.target.value)} placeholder="ملاحظات إضافية" />
          <Button onClick={handleReport}>إرسال البلاغ</Button>
        </div>
      </Modal>

      <Modal open={showAnalyticsModal} onClose={() => setShowAnalyticsModal(false)} title="تحليلات المنشور" size="large">
        {analyticsLoading ? <div>جاري تحميل التحليلات...</div> : (
          <div style={{ display: 'grid', gap: 14 }}>
            <div className="feed-stats-grid">
              <div className="feed-stat-card"><strong>{formatCompactNumber(analytics?.likes || analytics?.like_count || reactionState.likesCount)}</strong><span>إعجابات</span></div>
              <div className="feed-stat-card"><strong>{formatCompactNumber(analytics?.comments || analytics?.comment_count || post.comments_count || 0)}</strong><span>تعليقات</span></div>
              <div className="feed-stat-card"><strong>{formatCompactNumber(analytics?.shares || reactionState.sharesCount)}</strong><span>مشاركات</span></div>
              <div className="feed-stat-card"><strong>{formatCompactNumber(analytics?.saves || reactionState.savesCount)}</strong><span>حفظ</span></div>
              <div className="feed-stat-card"><strong>{formatCompactNumber(analytics?.engagement_score || 0)}</strong><span>معدل التفاعل</span></div>
              <div className="feed-stat-card"><strong>{analytics?.share_url || post.share_url || '-'}</strong><span>رابط المشاركة</span></div>
            </div>
            {analytics?.recent_commenters?.length ? (
              <div>
                <strong style={{ display: 'block', marginBottom: 10 }}>آخر المعلقين</strong>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {analytics.recent_commenters.map((user) => <span key={user} className="feed-pill soft">@{user}</span>)}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </Modal>

      <Modal open={showHistoryModal} onClose={() => setShowHistoryModal(false)} title="سجل التعديلات" size="large">
        {historyLoading ? <div>جاري تحميل السجل...</div> : !history.length ? <div>لا يوجد سجل تعديلات لهذا المنشور.</div> : (
          <div style={{ display: 'grid', gap: 12 }}>
            {history.map((item) => (
              <div key={item.id} className="feed-history-item">
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
                  <strong>نسخة محفوظة</strong>
                  <span className="muted">{formatTimeAgo(item.edited_at)}</span>
                </div>
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>{item.previous_content || 'بدون نص'}</div>
                {item.previous_poll?.length ? <div className="muted" style={{ marginTop: 8 }}>استطلاع سابق: {item.previous_poll.map((option) => option.label).join(' · ')}</div> : null}
              </div>
            ))}
          </div>
        )}
      </Modal>

      <Modal open={showEditModal} onClose={() => setShowEditModal(false)} title="تعديل المنشور">
        <div style={{ display: 'grid', gap: 14 }}>
          <textarea rows={7} value={editContent} onChange={(event) => setEditContent(event.target.value)} />
          <Button onClick={() => updateMutation.mutate({ content: editContent })}>حفظ التعديل</Button>
        </div>
      </Modal>

      <Modal open={showMediaModal} onClose={() => setShowMediaModal(false)} title="وسائط المنشور" size="large">
        <div style={{ display: 'grid', gap: 12 }}>
          {media.map((item) => {
            const isVideo = /\.(mp4|webm|mov|m4v|m3u8)(\?.*)?$/i.test(item || '');
            return isVideo
              ? <video key={item} src={item} controls style={{ width: '100%', borderRadius: 16 }} />
              : <img key={item} src={item} alt={post.content || 'media'} style={{ width: '100%', borderRadius: 16 }} />;
          })}
        </div>
      </Modal>

      <style>{`
        .feed-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          border-radius: 999px;
          background: rgba(139, 92, 246, 0.18);
          color: #e9d5ff;
          font-size: 12px;
          font-weight: 700;
        }
        .feed-pill.soft {
          background: rgba(148, 163, 184, 0.12);
          color: #cbd5e1;
          font-weight: 600;
        }
        .feed-tag-chip {
          border: 1px solid rgba(139, 92, 246, 0.24);
          background: rgba(139, 92, 246, 0.1);
          color: #d8b4fe;
          padding: 8px 12px;
          border-radius: 999px;
          cursor: pointer;
          font-weight: 700;
        }
        .feed-poll-box {
          margin-top: 16px;
          padding: 14px;
          border-radius: 20px;
          border: 1px solid rgba(148,163,184,0.14);
          background: rgba(2,6,23,0.48);
        }
        .feed-poll-option {
          position: relative;
          overflow: hidden;
          width: 100%;
          border-radius: 16px;
          border: 1px solid rgba(148,163,184,0.14);
          background: rgba(15,23,42,0.9);
          color: #e2e8f0;
          cursor: pointer;
          padding: 12px 14px;
          text-align: start;
          display: grid;
          gap: 4px;
        }
        .feed-poll-option.voted {
          border-color: rgba(34,197,94,0.45);
        }
        .feed-poll-fill {
          position: absolute;
          inset-inline-start: 0;
          inset-block: 0;
          background: linear-gradient(90deg, rgba(168,85,247,0.24), rgba(56,189,248,0.16));
          pointer-events: none;
        }
        .feed-poll-content {
          position: relative;
          z-index: 1;
          display: flex;
          justify-content: space-between;
          gap: 10px;
          align-items: center;
        }
        .feed-ghost-link {
          border: none;
          background: none;
          color: #93c5fd;
          cursor: pointer;
          font-weight: 700;
          padding: 6px 0;
        }
        .feed-reaction-popover {
          position: absolute;
          bottom: calc(100% + 8px);
          inset-inline-start: 0;
          display: flex;
          gap: 8px;
          padding: 10px;
          border-radius: 999px;
          background: rgba(15,23,42,0.98);
          border: 1px solid rgba(148,163,184,0.16);
          box-shadow: 0 20px 30px rgba(0,0,0,0.28);
          z-index: 20;
        }
        .feed-reaction-item {
          width: 42px;
          height: 42px;
          border-radius: 999px;
          border: 1px solid rgba(148,163,184,0.16);
          background: rgba(255,255,255,0.04);
          font-size: 20px;
          cursor: pointer;
        }
        .feed-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 12px;
        }
        .feed-stat-card,
        .feed-history-item {
          border-radius: 18px;
          border: 1px solid rgba(148,163,184,0.14);
          background: rgba(15,23,42,0.65);
          padding: 14px;
          display: grid;
          gap: 6px;
        }
        .feed-stat-card strong {
          font-size: 20px;
          word-break: break-word;
        }
      `}</style>
    </>
  );
}

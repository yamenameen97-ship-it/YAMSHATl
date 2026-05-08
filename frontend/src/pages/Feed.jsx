import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import MainLayout from '../components/layout/MainLayout.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Modal from '../components/ui/Modal.jsx';
import EmptyState from '../components/feedback/EmptyState.jsx';
import ErrorState from '../components/feedback/ErrorState.jsx';
import { FeedSkeleton } from '../components/feedback/Skeleton.jsx';
import NestedComments from '../components/feed/NestedComments.jsx';
import LazyMedia from '../components/media/LazyMedia.jsx';
import { useToast } from '../components/admin/ToastProvider.jsx';
import {
  addComment,
  createPost,
  getComments,
  getDraftPosts,
  getPostHistory,
  getPostInsights,
  getPosts,
  likePost,
  savePost,
  sharePost,
  updatePost,
  uploadPostMedia,
  votePoll,
} from '../api/posts.js';
import { getUsers } from '../api/users.js';
import { sanitizeInputText } from '../utils/sanitize.js';
import { useAppStore } from '../store/appStore.js';
import { getCurrentUsername } from '../utils/auth.js';

const EMOJIS = ['😀', '😂', '😍', '🔥', '👏', '🎉', '❤️', '🤝', '🚀', '💡', '📌', '✅'];
const VIDEO_RE = /\.(mp4|mov|webm|mkv)$/i;
const IMAGE_RE = /\.(png|jpe?g|webp|gif)$/i;

function formatDate(value) {
  if (!value) return 'الآن';
  try {
    return new Date(value).toLocaleString('ar-EG');
  } catch {
    return 'الآن';
  }
}

function stripHtml(html = '') {
  if (typeof window === 'undefined') return String(html || '');
  const div = window.document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

function escapeHtml(value = '') {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function enhanceText(text = '') {
  return escapeHtml(text)
    .replace(/(#[\w\u0600-\u06FF]+)/g, '<span class="tag-chip">$1</span>')
    .replace(/(@[\w.-]+)/g, '<span class="mention-chip">$1</span>')
    .replace(/\n/g, '<br />');
}

function getMentionQuery(text = '') {
  const match = String(text).match(/(?:^|\s)@([\w.-]{1,30})$/);
  return match ? match[1].toLowerCase() : '';
}

function withMention(text, username) {
  return String(text).replace(/(?:^|\s)@[\w.-]{0,30}$/, (match) => {
    const prefix = match.startsWith(' ') ? ' ' : '';
    return `${prefix}@${username} `;
  });
}

async function loadFeedData() {
  const [{ data: postsData }, { data: draftsData }, { data: usersData }] = await Promise.all([
    getPosts({ limit: 50 }),
    getDraftPosts(),
    getUsers(),
  ]);
  return {
    posts: Array.isArray(postsData) ? postsData : [],
    drafts: Array.isArray(draftsData) ? draftsData : [],
    users: (Array.isArray(usersData) ? usersData : []).map((item) => item?.username || item?.name).filter(Boolean),
  };
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

async function preprocessImageFile(file, { cropSquare = false } = {}) {
  if (!file?.type?.startsWith('image/') || file.type === 'image/gif') return file;
  const source = await readFileAsDataUrl(file);
  const image = await loadImage(source);
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (context) context.imageSmoothingQuality = 'high';
  const maxSize = 1400;
  let sx = 0;
  let sy = 0;
  let sw = image.width;
  let sh = image.height;

  if (cropSquare) {
    const size = Math.min(image.width, image.height);
    sx = Math.round((image.width - size) / 2);
    sy = Math.round((image.height - size) / 2);
    sw = size;
    sh = size;
  }

  const scale = Math.min(maxSize / sw, maxSize / sh, 1);
  canvas.width = Math.max(1, Math.round(sw * scale));
  canvas.height = Math.max(1, Math.round(sh * scale));
  context.drawImage(image, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.82));
  if (!blob) return file;
  const nextName = file.name.replace(/\.[^.]+$/, '') + '.jpg';
  return new File([blob], nextName, { type: 'image/jpeg' });
}

async function preprocessFiles(files, options) {
  const prepared = [];
  for (const file of files) {
    prepared.push(await preprocessImageFile(file, options));
  }
  return prepared;
}

function mediaPreviewUrl(file) {
  return URL.createObjectURL(file);
}

function ComposerToolbar({ onCommand, onAddEmoji }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
      <Button variant="secondary" onClick={() => onCommand('bold')}>عريض</Button>
      <Button variant="secondary" onClick={() => onCommand('italic')}>مائل</Button>
      <Button variant="secondary" onClick={() => onCommand('insertUnorderedList')}>قائمة</Button>
      <Button variant="secondary" onClick={() => onCommand('formatBlock', 'blockquote')}>اقتباس</Button>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {EMOJIS.map((emoji) => (
          <button key={emoji} type="button" className="mini-action" onClick={() => onAddEmoji(emoji)}>{emoji}</button>
        ))}
      </div>
    </div>
  );
}

function MediaGallery({ urls = [] }) {
  if (!urls.length) return null;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: urls.length > 1 ? 'repeat(auto-fit, minmax(180px, 1fr))' : '1fr', gap: 12 }}>
      {urls.map((url, index) => (
        <LazyMedia
          key={`${url}-${index}`}
          src={url}
          alt={`post media ${index + 1}`}
          priority={index === 0}
          className="post-media"
          style={{ width: '100%' }}
        />
      ))}
    </div>
  );
}

function DraftCard({ draft, onEdit }) {
  return (
    <div className="glass-chip" style={{ width: '100%', justifyContent: 'space-between', gap: 12 }}>
      <div style={{ minWidth: 0 }}>
        <strong style={{ display: 'block' }}>{draft.content?.slice(0, 48) || 'مسودة بدون عنوان'}</strong>
        <small className="muted">آخر تحديث: {formatDate(draft.updated_at || draft.created_at)}</small>
      </div>
      <Button variant="secondary" onClick={() => onEdit(draft)}>فتح</Button>
    </div>
  );
}

function HistoryList({ items = [] }) {
  if (!items.length) return <div className="muted">لا يوجد سجل تعديلات بعد.</div>;
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {items.map((item) => (
        <div key={item.id} className="glass-chip" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
          <strong>تعديل بتاريخ {formatDate(item.edited_at)}</strong>
          <div className="muted" style={{ whiteSpace: 'pre-wrap' }}>{item.previous_content || 'بدون نص'}</div>
        </div>
      ))}
    </div>
  );
}

export default function Feed() {
  const { pushToast } = useToast();
  const currentUser = getCurrentUsername();
  const setUploadProgress = useAppStore((state) => state.setUploadProgress);
  const clearUploadProgress = useAppStore((state) => state.clearUploadProgress);
  const uploadProgress = useAppStore((state) => state.uploadProgress.feedComposer || 0);
  const [editorText, setEditorText] = useState('');
  const [editorHtml, setEditorHtml] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [commentText, setCommentText] = useState({});
  const [commentsMap, setCommentsMap] = useState({});
  const [historyMap, setHistoryMap] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [scheduledAt, setScheduledAt] = useState('');
  const [allowComments, setAllowComments] = useState(true);
  const [pinPost, setPinPost] = useState(false);
  const [cropImages, setCropImages] = useState(true);
  const [pollEnabled, setPollEnabled] = useState(false);
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [showEmojiPanel, setShowEmojiPanel] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [activeFilter, setActiveFilter] = useState('feed');
  const [visibleCount, setVisibleCount] = useState(6);
  const [commentSubmittingMap, setCommentSubmittingMap] = useState({});
  const [insightsOpen, setInsightsOpen] = useState(false);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsData, setInsightsData] = useState(null);
  const editorRef = useRef(null);
  const feedSentinelRef = useRef(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['feed-v2', currentUser],
    queryFn: loadFeedData,
  });

  const posts = data?.posts || [];
  const drafts = data?.drafts || [];
  const users = data?.users || [];
  const mentionQuery = useMemo(() => getMentionQuery(editorText), [editorText]);
  const mentionSuggestions = useMemo(
    () => mentionQuery ? users.filter((item) => item && item !== currentUser && item.toLowerCase().includes(mentionQuery)).slice(0, 6) : [],
    [currentUser, mentionQuery, users]
  );

  useEffect(() => () => {
    attachments.forEach((item) => {
      if (item.preview?.startsWith('blob:')) URL.revokeObjectURL(item.preview);
    });
  }, [attachments]);

  useEffect(() => {
    setVisibleCount(6);
  }, [activeFilter]);

  useEffect(() => {
    if (activeFilter !== 'feed' || !feedSentinelRef.current || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        setVisibleCount((prev) => Math.min(posts.length, prev + 6));
      }
    }, { rootMargin: '400px 0px', threshold: 0.1 });
    observer.observe(feedSentinelRef.current);
    return () => observer.disconnect();
  }, [activeFilter, posts.length]);

  const resetComposer = () => {
    attachments.forEach((item) => {
      if (item.preview?.startsWith('blob:')) URL.revokeObjectURL(item.preview);
    });
    setAttachments([]);
    setEditorText('');
    setEditorHtml('');
    setScheduledAt('');
    setPollEnabled(false);
    setPollOptions(['', '']);
    setAllowComments(true);
    setPinPost(false);
    setEditingPost(null);
    setShowEmojiPanel(false);
    if (editorRef.current) editorRef.current.innerHTML = '';
    clearUploadProgress('feedComposer');
  };

  const syncEditorFromDom = () => {
    const html = editorRef.current?.innerHTML || '';
    const text = stripHtml(html);
    setEditorHtml(html);
    setEditorText(text);
  };

  const runCommand = (command, value = null) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    syncEditorFromDom();
  };

  const insertEmoji = (emoji) => {
    editorRef.current?.focus();
    document.execCommand('insertText', false, emoji);
    syncEditorFromDom();
  };

  const applyDraftToComposer = (draft) => {
    setEditingPost(draft);
    setEditorText(draft.content || '');
    setEditorHtml(draft.content_html || enhanceText(draft.content || ''));
    if (editorRef.current) editorRef.current.innerHTML = draft.content_html || enhanceText(draft.content || '');
    setScheduledAt(draft.scheduled_at ? String(draft.scheduled_at).slice(0, 16) : '');
    setPinPost(Boolean(draft.is_pinned));
    setAllowComments(Boolean(draft.allow_comments ?? true));
    setPollEnabled(Boolean(draft.poll?.length));
    setPollOptions(draft.poll?.length ? draft.poll.map((item) => item.label) : ['', '']);
    pushToast({ type: 'info', title: 'تم تحميل المسودة', description: 'تقدر تكمل التعديل أو تنشرها مباشرة.' });
  };

  const handleFilesInput = async (incomingFiles) => {
    const rawFiles = Array.from(incomingFiles || []).slice(0, 8);
    if (!rawFiles.length) return;
    const prepared = await preprocessFiles(rawFiles, { cropSquare: cropImages });
    const nextItems = prepared.map((file) => ({ file, preview: mediaPreviewUrl(file) }));
    setAttachments((prev) => [...prev, ...nextItems].slice(0, 8));
    pushToast({
      type: 'success',
      title: 'تم تجهيز الوسائط',
      description: 'تم تفعيل الرفع المتعدد مع ضغط الصور ودعم السحب والإفلات.',
    });
  };

  const handleDrop = async (event) => {
    event.preventDefault();
    setDragActive(false);
    await handleFilesInput(event.dataTransfer?.files || []);
  };

  const uploadAllMedia = async () => {
    const uploadedUrls = [];
    if (!attachments.length) return uploadedUrls;
    for (let index = 0; index < attachments.length; index += 1) {
      const item = attachments[index];
      const { data: uploadData } = await uploadPostMedia(item.file, (progressEvent) => {
        const current = progressEvent?.progress || 0;
        const totalProgress = ((index + current) / attachments.length) * 100;
        setUploadProgress('feedComposer', Math.round(totalProgress));
      });
      uploadedUrls.push(uploadData?.file_url || uploadData?.url || uploadData?.imagekit_url || uploadData?.cloud_url);
    }
    clearUploadProgress('feedComposer');
    return uploadedUrls.filter(Boolean);
  };

  const buildPayload = async ({ saveAsDraft = false } = {}) => {
    const uploadedUrls = await uploadAllMedia();
    return {
      content: sanitizeInputText(editorText, { maxLength: 5000 }),
      content_html: (editorHtml || '').slice(0, 12000),
      media_urls: uploadedUrls.length ? uploadedUrls : (editingPost?.media_urls || []),
      poll: pollEnabled ? pollOptions.filter(Boolean).map((label) => ({ label: sanitizeInputText(label, { maxLength: 120 }) })) : [],
      scheduled_at: scheduledAt || null,
      is_draft: saveAsDraft,
      is_pinned: pinPost,
      allow_comments: allowComments,
    };
  };

  const submitComposer = async ({ saveAsDraft = false } = {}) => {
    if (!editorText.trim() && !attachments.length && !(pollEnabled && pollOptions.some(Boolean))) {
      pushToast({ type: 'warning', title: 'المحتوى ناقص', description: 'اكتب نص أو أضف وسائط أو فعّل استطلاع.' });
      return;
    }
    try {
      setSubmitting(true);
      const payload = await buildPayload({ saveAsDraft });
      if (editingPost) {
        await updatePost(editingPost.id, payload);
      } else {
        await createPost(payload);
      }
      await refetch();
      resetComposer();
      pushToast({
        type: 'success',
        title: saveAsDraft ? 'تم حفظ المسودة' : 'تم نشر المنشور',
        description: saveAsDraft ? 'المسودة اتحفظت مع الجدولة والوسائط.' : 'المنشور اتحدث في الـ Feed بنجاح.',
      });
    } catch (err) {
      pushToast({ type: 'error', title: 'فشل الحفظ', description: err?.response?.data?.detail || 'حصلت مشكلة أثناء حفظ المنشور.' });
    } finally {
      setSubmitting(false);
      clearUploadProgress('feedComposer');
    }
  };

  const toggleLike = async (postId) => {
    await likePost(postId);
    await refetch();
  };

  const toggleSave = async (postId) => {
    await savePost(postId);
    await refetch();
  };

  const handleShare = async (post) => {
    const shareUrl = `${window.location.origin}${window.location.pathname}#post-${post.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Yamshat Post', text: post.content || 'منشور جديد', url: shareUrl });
        await sharePost(post.id, 'native-share');
      } else {
        await navigator.clipboard.writeText(shareUrl);
        await sharePost(post.id, 'copy-link');
      }
      pushToast({ type: 'success', title: 'تمت المشاركة', description: 'رابط المنشور جاهز للمشاركة أو اتحفظ في الحافظة.' });
      await refetch();
    } catch {
      pushToast({ type: 'warning', title: 'المشاركة اتلغت', description: 'ممكن تعيد المحاولة أو تنسخ الرابط يدوياً.' });
    }
  };

  const submitComment = async (postId, parentId = null, overrideText = null) => {
    const raw = overrideText ?? commentText[postId] ?? '';
    const text = sanitizeInputText(raw, { maxLength: 400 });
    if (!text) return;
    setCommentSubmittingMap((prev) => ({ ...prev, [postId]: true }));
    try {
      await addComment(postId, text, parentId);
      const { data: commentsData } = await getComments(postId);
      setCommentsMap((prev) => ({ ...prev, [postId]: Array.isArray(commentsData) ? commentsData : [] }));
      if (!parentId) {
        setCommentText((prev) => ({ ...prev, [postId]: '' }));
      }
      await refetch();
    } finally {
      setCommentSubmittingMap((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const toggleComments = async (postId) => {
    if (commentsMap[postId]) {
      setCommentsMap((prev) => {
        const next = { ...prev };
        delete next[postId];
        return next;
      });
      return;
    }
    const { data: commentsData } = await getComments(postId);
    setCommentsMap((prev) => ({ ...prev, [postId]: Array.isArray(commentsData) ? commentsData : [] }));
  };

  const showHistory = async (postId) => {
    const { data: historyData } = await getPostHistory(postId);
    setHistoryMap((prev) => ({ ...prev, [postId]: Array.isArray(historyData) ? historyData : [] }));
  };

  const handleVote = async (postId, optionKey) => {
    await votePoll(postId, optionKey);
    await refetch();
  };

  const openInsights = async (postId) => {
    setInsightsOpen(true);
    setInsightsLoading(true);
    try {
      const { data: payload } = await getPostInsights(postId);
      setInsightsData(payload || null);
    } finally {
      setInsightsLoading(false);
    }
  };

  const composerSummary = useMemo(() => {
    const hashtags = editorText.match(/#[\w\u0600-\u06FF]+/g) || [];
    const mentions = editorText.match(/@[\w.-]+/g) || [];
    return {
      hashtags: hashtags.slice(0, 6),
      mentions: mentions.slice(0, 6),
    };
  }, [editorText]);

  if (isLoading) {
    return (
      <MainLayout>
        <FeedSkeleton />
      </MainLayout>
    );
  }

  if (isError) {
    return (
      <MainLayout>
        <ErrorState title="تعذر تحميل الصفحة" description={error?.message || 'حصل خطأ أثناء تحميل الـ Feed.'} onRetry={refetch} />
      </MainLayout>
    );
  }

  const activePosts = activeFilter === 'drafts' ? drafts : posts.slice(0, visibleCount);

  return (
    <MainLayout>
      <div style={{ display: 'grid', gap: 20 }}>
        <Card className="hero-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <div>
              <div className="page-eyebrow">Feed Studio</div>
              <h2 className="page-title">منشورات [Yamshat](#) المتقدمة</h2>
              <p className="muted" style={{ marginBottom: 0 }}>
                أضفت محرر Rich Text، مشاركة وحفظ، هاشتاج ومينشن، استطلاعات، جدولة، تثبيت، مسودات، سجل تعديلات، رفع متعدد بالسحب والإفلات، ضغط صور، قص مركزي، GIF وEmoji.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Button variant={activeFilter === 'feed' ? 'primary' : 'secondary'} onClick={() => setActiveFilter('feed')}>المنشورات</Button>
              <Button variant={activeFilter === 'drafts' ? 'primary' : 'secondary'} onClick={() => setActiveFilter('drafts')}>المسودات</Button>
            </div>
          </div>
        </Card>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(320px, 1fr)', gap: 20, alignItems: 'start' }}>
          <div style={{ display: 'grid', gap: 20 }}>
            <Card ref={null}>
              <div className="card-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <h3>{editingPost ? 'تعديل منشور / مسودة' : 'إنشاء منشور جديد'}</h3>
                {editingPost ? <Button variant="secondary" onClick={resetComposer}>إلغاء التعديل</Button> : null}
              </div>

              <ComposerToolbar onCommand={runCommand} onAddEmoji={insertEmoji} />

              <div
                ref={editorRef}
                className="input"
                contentEditable
                suppressContentEditableWarning
                onInput={syncEditorFromDom}
                data-placeholder="اكتب منشورك هنا... استخدم #هاشتاج و @mention"
                style={{ minHeight: 160, padding: 16, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}
              />

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                {composerSummary.hashtags.map((item) => <span key={item} className="tag-chip">{item}</span>)}
                {composerSummary.mentions.map((item) => <span key={item} className="mention-chip">{item}</span>)}
              </div>

              {mentionSuggestions.length ? (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                  {mentionSuggestions.map((item) => (
                    <button
                      key={item}
                      type="button"
                      className="mini-action"
                      onClick={() => {
                        const nextText = withMention(editorText, item);
                        setEditorText(nextText);
                        setEditorHtml(enhanceText(nextText));
                        if (editorRef.current) editorRef.current.innerHTML = enhanceText(nextText);
                      }}
                    >
                      @{item}
                    </button>
                  ))}
                </div>
              ) : null}

              <div
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                style={{
                  marginTop: 16,
                  border: `1px dashed ${dragActive ? 'var(--primary)' : 'var(--line)'}`,
                  borderRadius: 20,
                  padding: 16,
                  background: dragActive ? 'rgba(139, 92, 246, 0.12)' : 'rgba(255,255,255,0.03)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                  <div>
                    <strong>رفع متعدد + Drag & Drop</strong>
                    <div className="muted">الصور هتتضغط تلقائياً، والـ GIF هيترفع كما هو، والفيديوهات مدعومة.</div>
                  </div>
                  <label className="upload-label" style={{ margin: 0 }}>
                    <input type="file" accept="image/*,video/*,.gif" multiple hidden onChange={(event) => handleFilesInput(event.target.files)} />
                    اختر ملفات
                  </label>
                </div>

                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12 }}>
                  <label className="remember-me-row"><input type="checkbox" checked={cropImages} onChange={(event) => setCropImages(event.target.checked)} /><span>قص الصور لمربع 1:1 قبل الرفع</span></label>
                  <label className="remember-me-row"><input type="checkbox" checked={allowComments} onChange={(event) => setAllowComments(event.target.checked)} /><span>السماح بالتعليقات</span></label>
                  <label className="remember-me-row"><input type="checkbox" checked={pinPost} onChange={(event) => setPinPost(event.target.checked)} /><span>تثبيت المنشور</span></label>
                </div>

                {attachments.length ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginTop: 12 }}>
                    {attachments.map((item, index) => (
                      <div key={`${item.file.name}-${index}`} style={{ position: 'relative' }}>
                        {item.file.type.startsWith('video/') ? (
                          <video src={item.preview} controls style={{ width: '100%', borderRadius: 16 }} />
                        ) : (
                          <img src={item.preview} alt={item.file.name} style={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'cover', borderRadius: 16 }} />
                        )}
                        <button
                          type="button"
                          className="mini-action"
                          style={{ position: 'absolute', top: 8, insetInlineEnd: 8 }}
                          onClick={() => setAttachments((prev) => prev.filter((_, currentIndex) => currentIndex !== index))}
                        >
                          حذف
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                  <label className="remember-me-row"><input type="checkbox" checked={pollEnabled} onChange={(event) => setPollEnabled(event.target.checked)} /><span>إضافة استطلاع</span></label>
                  <label style={{ display: 'grid', gap: 6 }}>
                    <span className="muted">جدولة النشر</span>
                    <input className="input" type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} />
                  </label>
                </div>
                {pollEnabled ? (
                  <div style={{ display: 'grid', gap: 8 }}>
                    {pollOptions.map((option, index) => (
                      <input
                        key={`poll-${index}`}
                        className="input"
                        value={option}
                        placeholder={`الخيار ${index + 1}`}
                        onChange={(event) => setPollOptions((prev) => prev.map((item, itemIndex) => itemIndex === index ? event.target.value : item))}
                      />
                    ))}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Button variant="secondary" onClick={() => setPollOptions((prev) => [...prev, ''].slice(0, 6))}>إضافة خيار</Button>
                      <Button variant="secondary" onClick={() => setPollOptions((prev) => prev.length > 2 ? prev.slice(0, -1) : prev)}>حذف خيار</Button>
                    </div>
                  </div>
                ) : null}
              </div>

              {uploadProgress > 0 ? (
                <div style={{ marginTop: 16 }}>
                  <div className="muted">رفع الوسائط: {uploadProgress}%</div>
                  <div style={{ height: 10, borderRadius: 999, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                    <div style={{ width: `${uploadProgress}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary), var(--secondary))' }} />
                  </div>
                </div>
              ) : null}

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 18 }}>
                <Button onClick={() => submitComposer({ saveAsDraft: false })} loading={submitting}>{editingPost ? 'تحديث المنشور' : 'نشر الآن'}</Button>
                <Button variant="secondary" onClick={() => submitComposer({ saveAsDraft: true })} loading={submitting}>حفظ كمسودة</Button>
                <Button variant="secondary" onClick={() => setShowEmojiPanel((prev) => !prev)}>Emoji Picker</Button>
              </div>

              {showEmojiPanel ? (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                  {EMOJIS.map((emoji) => <button key={`panel-${emoji}`} type="button" className="mini-action" onClick={() => insertEmoji(emoji)}>{emoji}</button>)}
                </div>
              ) : null}
            </Card>

            {activePosts.map((post) => (
              <Card key={post.id} className="post-card" id={`post-${post.id}`}>
                <div className="post-head" style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <div>
                    <strong>{post.username}</strong>
                    <div className="muted">{formatDate(post.published_at || post.created_at)}</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                      {post.is_pinned ? <span className="glass-chip">📌 مثبت</span> : null}
                      {post.is_draft ? <span className="glass-chip">📝 مسودة</span> : null}
                      {post.scheduled_at && !post.published_at ? <span className="glass-chip">⏰ مجدول</span> : null}
                      {post.edit_count ? <span className="glass-chip">🕘 {post.edit_count} تعديل</span> : null}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span className="glass-chip">❤️ {post.likes || 0}</span>
                    <span className="glass-chip">💬 {post.comments_count || 0}</span>
                    <span className="glass-chip">🔁 {post.share_count || 0}</span>
                    <span className="glass-chip">💾 {post.save_count || 0}</span>
                  </div>
                </div>

                <div
                  className="post-text"
                  style={{ marginTop: 14 }}
                  dangerouslySetInnerHTML={{ __html: post.content_html || enhanceText(post.content || '') }}
                />

                <MediaGallery urls={post.media_urls || []} />

                {post.poll?.length ? (
                  <div style={{ display: 'grid', gap: 8, marginTop: 16 }}>
                    {post.poll.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        className="mini-action"
                        style={{ justifyContent: 'space-between', width: '100%' }}
                        onClick={() => handleVote(post.id, option.id)}
                      >
                        <span>{option.label}</span>
                        <span>{option.votes || 0} صوت</span>
                      </button>
                    ))}
                  </div>
                ) : null}

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
                  <Button variant={post.liked_by_me ? 'primary' : 'secondary'} onClick={() => toggleLike(post.id)}>إعجاب</Button>
                  <Button variant={post.saved_by_me ? 'primary' : 'secondary'} onClick={() => toggleSave(post.id)}>حفظ</Button>
                  <Button variant="secondary" onClick={() => handleShare(post)}>مشاركة</Button>
                  <Button variant="secondary" onClick={() => toggleComments(post.id)}>التعليقات</Button>
                  <Button variant="secondary" onClick={() => openInsights(post.id)}>Insights</Button>
                  {post.username === currentUser ? (
                    <>
                      <Button variant="secondary" onClick={() => applyDraftToComposer(post)}>تعديل</Button>
                      <Button variant="secondary" onClick={() => showHistory(post.id)}>سجل التعديل</Button>
                    </>
                  ) : null}
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                  {(post.hashtags || []).map((tag) => <span key={`${post.id}-${tag}`} className="tag-chip">#{tag}</span>)}
                  {(post.mentions || []).map((mention) => <span key={`${post.id}-${mention}`} className="mention-chip">@{mention}</span>)}
                </div>

                {historyMap[post.id] ? (
                  <div style={{ marginTop: 16 }}>
                    <HistoryList items={historyMap[post.id]} />
                  </div>
                ) : null}

                {commentsMap[post.id] ? (
                  <div style={{ marginTop: 16 }}>
                    <NestedComments
                      comments={commentsMap[post.id] || []}
                      rootValue={commentText[post.id] || ''}
                      onRootValueChange={(value) => setCommentText((prev) => ({ ...prev, [post.id]: value }))}
                      onSubmitRoot={() => submitComment(post.id)}
                      onSubmitReply={(parentId, value) => submitComment(post.id, parentId, value)}
                      submitting={Boolean(commentSubmittingMap[post.id])}
                    />
                  </div>
                ) : null}
              </Card>
            ))}

            {!activePosts.length ? (
              <EmptyState
                icon={activeFilter === 'drafts' ? '📝' : '📰'}
                title={activeFilter === 'drafts' ? 'لا توجد مسودات بعد' : 'لا توجد منشورات حالياً'}
                description={activeFilter === 'drafts' ? 'احفظ أول مسودة من المحرر وسيظهر لك هنا مع الجدولة وسجل التعديلات.' : 'ابدأ بنشر أول منشورك باستخدام المحرر الجديد.'}
              />
            ) : null}

            {activeFilter === 'feed' && posts.length > activePosts.length ? (
              <div ref={feedSentinelRef} className="feed-infinite-sentinel">اسحب أو انزل شوية لتحميل المزيد من المنشورات…</div>
            ) : null}
          </div>

          <div style={{ display: 'grid', gap: 20 }}>
            <Card>
              <div className="card-head"><h3>لوحة سريعة</h3></div>
              <div style={{ display: 'grid', gap: 12 }}>
                <div className="glass-chip" style={{ justifyContent: 'space-between' }}><span>المنشورات</span><strong>{posts.length}</strong></div>
                <div className="glass-chip" style={{ justifyContent: 'space-between' }}><span>المسودات</span><strong>{drafts.length}</strong></div>
                <div className="glass-chip" style={{ justifyContent: 'space-between' }}><span>المرفقات الحالية</span><strong>{attachments.length}</strong></div>
                <div className="glass-chip" style={{ justifyContent: 'space-between' }}><span>الجدولة</span><strong>{scheduledAt ? 'مفعلة' : 'غير مفعلة'}</strong></div>
              </div>
            </Card>

            <Card>
              <div className="card-head"><h3>المسودات الجاهزة</h3></div>
              <div style={{ display: 'grid', gap: 10 }}>
                {drafts.slice(0, 6).map((draft) => <DraftCard key={draft.id} draft={draft} onEdit={applyDraftToComposer} />)}
                {!drafts.length ? <div className="muted">احفظ مسودة من فوق وهتظهر هنا تلقائي.</div> : null}
              </div>
            </Card>

            <Card>
              <div className="card-head"><h3>اقتراحات Mentions</h3></div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {users.slice(0, 12).map((user) => (
                  <button
                    key={user}
                    type="button"
                    className="mini-action"
                    onClick={() => {
                      const nextText = `${editorText} @${user}`.trim();
                      setEditorText(nextText);
                      setEditorHtml(enhanceText(nextText));
                      if (editorRef.current) editorRef.current.innerHTML = enhanceText(nextText);
                    }}
                  >
                    @{user}
                  </button>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>

      <Modal open={insightsOpen} title="Post Insights" onClose={() => setInsightsOpen(false)}>
        {insightsLoading ? <div className="muted">جارٍ تحميل الإحصائيات…</div> : null}
        {!insightsLoading && insightsData ? (
          <div className="insights-grid-modal">
            <div className="glass-chip" style={{ justifyContent: 'space-between' }}><span>الإعجابات</span><strong>{insightsData.likes}</strong></div>
            <div className="glass-chip" style={{ justifyContent: 'space-between' }}><span>التعليقات</span><strong>{insightsData.comments}</strong></div>
            <div className="glass-chip" style={{ justifyContent: 'space-between' }}><span>المشاركات</span><strong>{insightsData.shares}</strong></div>
            <div className="glass-chip" style={{ justifyContent: 'space-between' }}><span>الحفظ</span><strong>{insightsData.saves}</strong></div>
            <div className="glass-chip" style={{ justifyContent: 'space-between' }}><span>التعديلات</span><strong>{insightsData.edits}</strong></div>
            <div className="glass-chip" style={{ justifyContent: 'space-between' }}><span>Engagement</span><strong>{insightsData.engagement_score}</strong></div>
            <div className="glass-chip" style={{ justifyContent: 'space-between' }}><span>سرعة النقاش</span><strong>{insightsData.comment_velocity}</strong></div>
            <div className="glass-chip" style={{ justifyContent: 'space-between' }}><span>رابط المشاركة</span><strong>{insightsData.share_url}</strong></div>
            <div style={{ gridColumn: '1 / -1', display: 'grid', gap: 10, marginTop: 8 }}>
              <strong>أحدث التعليقات</strong>
              {(insightsData.recent_commenters || []).map((item) => (
                <div key={item.id} className="glass-chip" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                  <strong>@{item.username}</strong>
                  <span>{item.content}</span>
                </div>
              ))}
              {!insightsData.recent_commenters?.length ? <div className="muted">لا توجد تعليقات حديثة.</div> : null}
            </div>
          </div>
        ) : null}
      </Modal>
    </MainLayout>
  );
}

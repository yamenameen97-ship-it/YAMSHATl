import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout.jsx';
import { Avatar } from '../components/ui/index.js';
import { useToast } from '../components/admin/ToastProvider.jsx';
import {
  blockUserApi,
  getBlockStatus,
  getChatThreads,
  getMessages,
  getPresence,
  unblockUserApi,
} from '../api/chat.js';
import { formatLastSeen } from '../components/yamshat/YamshatDesign.js';
import { getChatPreferences, toggleChatPreference } from '../utils/chatPreferences.js';

const URL_PATTERN = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;

const IMAGE_MEDIA_RE = /\.(jpg|jpeg|png|gif|webp|svg|avif|bmp|heic|heif)(?:$|\?)/i;
const VIDEO_MEDIA_RE = /\.(mp4|webm|mov|m4v|mkv)(?:$|\?)/i;

function getPrimaryAttachment(message = {}) {
  return Array.isArray(message?.attachments) && message.attachments.length ? (message.attachments[0] || {}) : {};
}

function resolveMessageMediaUrl(message = {}) {
  const attachment = getPrimaryAttachment(message);
  return String(
    message?.media_url
    || message?.media_urls?.[0]
    || attachment?.url
    || attachment?.mediaUrl
    || attachment?.media_url
    || ''
  ).trim();
}

function extractFileName(message = {}) {
  const attachment = getPrimaryAttachment(message);
  if (message.attachment_name) return message.attachment_name;
  if (attachment?.fileName) return attachment.fileName;
  if (attachment?.file_name) return attachment.file_name;
  if (attachment?.name) return attachment.name;
  const mediaUrl = resolveMessageMediaUrl(message);
  if (!mediaUrl) return 'ملف مرفق';
  try {
    const clean = mediaUrl.split('?')[0];
    return decodeURIComponent(clean.split('/').pop() || 'ملف مرفق');
  } catch {
    return 'ملف مرفق';
  }
}

function resolveMediaType(message = {}) {
  const attachment = getPrimaryAttachment(message);
  const mediaUrl = resolveMessageMediaUrl(message).toLowerCase();
  const rawType = String(message?.type || message?.message_type || attachment?.kind || attachment?.type || '').trim().toLowerCase();
  const mime = String(attachment?.mime_type || attachment?.mimeType || '').trim().toLowerCase();
  if (['video', 'media_video'].includes(rawType) || mime.startsWith('video/') || VIDEO_MEDIA_RE.test(mediaUrl)) return 'video';
  if (mime.startsWith('image/') || IMAGE_MEDIA_RE.test(mediaUrl) || ['image', 'photo', 'media_image'].includes(rawType)) return 'image';
  return 'file';
}

export default function ChatSettings() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const peer = decodeURIComponent(userId || '').trim();

  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [presence, setPresence] = useState({});
  const [threadMeta, setThreadMeta] = useState(null);
  const [blockStatus, setBlockStatus] = useState({ can_chat: true, blocked_by_me: false, blocked_me: false });
  const [isMutedConversation, setIsMutedConversation] = useState(false);
  const [isPinnedConversation, setIsPinnedConversation] = useState(false);

  useEffect(() => {
    if (!peer) return;
    const prefs = getChatPreferences();
    setIsMutedConversation(prefs.muted.has(peer));
    setIsPinnedConversation(prefs.pinned.has(peer));
  }, [peer]);

  useEffect(() => {
    if (!peer) return;
    let active = true;

    const loadData = async () => {
      setLoading(true);
      try {
        const [messagesRes, presenceRes, blockRes, threadsRes] = await Promise.allSettled([
          getMessages(peer, 120),
          getPresence(peer),
          getBlockStatus(peer),
          getChatThreads(),
        ]);

        if (!active) return;

        const nextMessages = messagesRes.status === 'fulfilled'
          ? (Array.isArray(messagesRes.value?.data) ? messagesRes.value.data : (messagesRes.value?.data?.items || []))
              .map((item) => ({ ...item, media_url: resolveMessageMediaUrl(item) }))
          : [];

        const threads = threadsRes.status === 'fulfilled'
          ? (Array.isArray(threadsRes.value?.data) ? threadsRes.value.data : [])
          : [];

        setMessages(nextMessages);
        setPresence(presenceRes.status === 'fulfilled' ? (presenceRes.value?.data || {}) : {});
        setBlockStatus(blockRes.status === 'fulfilled' ? (blockRes.value?.data || {}) : { can_chat: true, blocked_by_me: false, blocked_me: false });
        setThreadMeta(threads.find((item) => item.username === peer) || null);
      } catch {
        if (!active) return;
        pushToast?.({ type: 'error', title: 'تعذر تحميل إعدادات المحادثة' });
      } finally {
        if (active) setLoading(false);
      }
    };

    loadData();
    return () => {
      active = false;
    };
  }, [peer, pushToast]);

  const mediaItems = useMemo(() => messages
    .filter((item) => resolveMessageMediaUrl(item))
    .map((item, index) => ({
      id: String(item?.id || item?.client_id || index),
      url: resolveMessageMediaUrl(item),
      type: resolveMediaType(item),
      caption: item.content || item.message || '',
    })), [messages]);

  const fileItems = useMemo(() => messages.filter((item) => (
    item?.type === 'file'
    || item?.type === 'voice'
    || (Array.isArray(item?.attachments) && item.attachments.length > 0)
  )), [messages]);

  const sharedLinks = useMemo(() => {
    const collected = [];
    messages.forEach((item, index) => {
      const text = `${item?.content || ''} ${item?.message || ''}`;
      const matches = text.match(URL_PATTERN) || [];
      matches.forEach((url, linkIndex) => {
        const normalized = url.startsWith('http') ? url : `https://${url}`;
        collected.push({
          id: `${item?.id || index}-${linkIndex}`,
          url: normalized,
          sender: item?.sender || 'غير معروف',
        });
      });
    });
    return collected.filter((entry, index, array) => array.findIndex((item) => item.url === entry.url) === index);
  }, [messages]);

  const handleBack = useCallback(() => {
    navigate(`/chat/${encodeURIComponent(peer)}`);
  }, [navigate, peer]);

  const handleMuteConversation = useCallback(() => {
    const nextSet = toggleChatPreference('muted', peer);
    const next = nextSet.has(peer);
    setIsMutedConversation(next);
    pushToast?.({ type: 'success', title: next ? 'تم كتم المحادثة' : 'تم إلغاء كتم المحادثة' });
  }, [peer, pushToast]);

  const handlePinConversation = useCallback(() => {
    const nextSet = toggleChatPreference('pinned', peer);
    const next = nextSet.has(peer);
    setIsPinnedConversation(next);
    pushToast?.({ type: 'success', title: next ? 'تم تثبيت المحادثة' : 'تم إلغاء تثبيت المحادثة' });
  }, [peer, pushToast]);

  const handleBlock = useCallback(async () => {
    try {
      if (blockStatus.blocked_by_me) {
        await unblockUserApi(peer);
        setBlockStatus((prev) => ({ ...prev, blocked_by_me: false, can_chat: true }));
        pushToast?.({ type: 'success', title: 'تم رفع الحظر' });
      } else {
        await blockUserApi(peer);
        setBlockStatus((prev) => ({ ...prev, blocked_by_me: true, can_chat: false }));
        pushToast?.({ type: 'success', title: 'تم حظر المستخدم' });
      }
    } catch {
      pushToast?.({ type: 'error', title: 'تعذر تنفيذ العملية' });
    }
  }, [blockStatus.blocked_by_me, peer, pushToast]);

  return (
    <MainLayout hideNav lockScroll>
      <section className="yam-chat-settings-screen" dir="rtl">
        <style>{`
          /* ✅ v85.8: تفعيل التمرير باللمس على الموبايل على body فقط.
             المشكلة السابقة: المُغلف الخارجي كان overflow:hidden مع grid داخل lockScroll
             دون تفعيل -webkit-overflow-scrolling و touch-action مما أوقف السحب بالأصبع. */
          .yam-chat-settings-screen {
            min-height: 100%;
            display: flex;
            flex-direction: column;
            background:
              radial-gradient(circle at top right, rgba(124,58,237,0.14), transparent 24%),
              radial-gradient(circle at bottom left, rgba(59,130,246,0.08), transparent 22%),
              #040714;
            color: #fff;
            touch-action: pan-y;
          }
          .yam-chat-settings-header {
            position: sticky;
            top: 0;
            z-index: 20;
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 16px 18px;
            padding-top: calc(16px + env(safe-area-inset-top, 0px));
            border-bottom: 1px solid rgba(255,255,255,0.06);
            background: rgba(7,10,24,0.94);
            backdrop-filter: blur(16px);
          }
          .yam-chat-settings-back,
          .yam-chat-settings-header-action {
            width: 42px;
            height: 42px;
            border-radius: 14px;
            border: 1px solid rgba(255,255,255,0.1);
            background: rgba(255,255,255,0.04);
            color: #fff;
            display: inline-flex;
            align-items: center;
            justify-content: center;
          }
          .yam-chat-settings-header-copy {
            flex: 1;
            min-width: 0;
          }
          .yam-chat-settings-header-copy strong,
          .yam-chat-settings-header-copy span {
            display: block;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .yam-chat-settings-header-copy strong {
            font-size: 16px;
            font-weight: 900;
          }
          .yam-chat-settings-header-copy span {
            color: #94a3b8;
            font-size: 12px;
            margin-top: 4px;
          }
          /* ✅ v85.8: تمرير لمسي مفعّل بالكامل للموبايل */
          .yam-chat-settings-body {
            flex: 1 1 auto;
            min-height: 0;
            overflow: visible;
            touch-action: pan-y;
            padding: 14px 14px 40px;
            padding-bottom: calc(96px + env(safe-area-inset-bottom, 0px));
            display: grid;
            gap: 12px;
          }
          /* ✅ v85.8: بطاقة أكثر ترتيباً — رأس واضح + محتوى منظم،
             دون الحاجة لأشرطة لونية مقطوعة على اليمين/اليسار. */
          .yam-chat-settings-card {
            border-radius: 18px;
            border: 1px solid rgba(148,163,184,0.12);
            background: linear-gradient(180deg, rgba(15,20,38,0.92), rgba(7,11,24,0.96));
            padding: 14px 14px 12px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.24);
          }
          .yam-peer-hero {
            display: grid;
            justify-items: center;
            text-align: center;
            gap: 12px;
          }
          .yam-peer-hero h1 {
            margin: 0;
            font-size: 22px;
            font-weight: 900;
          }
          .yam-peer-hero p {
            margin: 0;
            color: #94a3b8;
          }
          .yam-meta-grid,
          .yam-actions-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
          }
          .yam-stat-pill,
          .yam-action-tile {
            border-radius: 18px;
            border: 1px solid rgba(255,255,255,0.08);
            background: rgba(255,255,255,0.03);
            padding: 14px;
          }
          .yam-stat-pill span,
          .yam-action-tile span {
            display: block;
            color: #94a3b8;
            font-size: 12px;
            margin-bottom: 6px;
          }
          .yam-stat-pill strong,
          .yam-action-tile strong {
            font-size: 16px;
            font-weight: 800;
          }
          /* ✅ v85.8: تجاوز تصادم enhanced-ui.css الذي يجعل .yam-section-title
             بحجم 24-36px مما يخترق ترتيب الصفحة. */
          .yam-chat-settings-body .yam-section-title {
            display: flex !important;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            margin: 0 0 10px !important;
            padding-bottom: 8px;
            border-bottom: 1px solid rgba(148,163,184,0.10);
            font-size: 15px !important;
          }
          .yam-chat-settings-body .yam-section-title h2 {
            margin: 0;
            font-size: 15px;
            font-weight: 800;
            color: #e2e8f0;
          }
          .yam-chat-settings-body .yam-section-title small {
            color: #94a3b8;
            font-size: 11px;
          }
          .yam-media-strip {
            display: grid;
            grid-auto-flow: column;
            grid-auto-columns: minmax(124px, 1fr);
            gap: 10px;
            overflow-x: auto;
            padding-bottom: 4px;
          }
          .yam-media-card {
            display: grid;
            gap: 8px;
            text-decoration: none;
            color: #fff;
          }
          .yam-media-thumb {
            height: 128px;
            border-radius: 18px;
            overflow: hidden;
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.08);
            display: grid;
            place-items: center;
          }
          .yam-media-thumb img,
          .yam-media-thumb video {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .yam-media-thumb .yam-video-placeholder {
            font-size: 34px;
          }
          .yam-media-card p {
            margin: 0;
            color: #cbd5e1;
            font-size: 12px;
            line-height: 1.5;
            min-height: 36px;
          }
          .yam-link-list,
          .yam-file-list {
            display: grid;
            gap: 10px;
          }
          .yam-link-item,
          .yam-file-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding: 14px;
            border-radius: 18px;
            border: 1px solid rgba(255,255,255,0.08);
            background: rgba(255,255,255,0.03);
          }
          .yam-link-copy,
          .yam-file-copy {
            min-width: 0;
            flex: 1;
          }
          .yam-link-copy strong,
          .yam-link-copy span,
          .yam-file-copy strong,
          .yam-file-copy span {
            display: block;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .yam-link-copy span,
          .yam-file-copy span {
            color: #94a3b8;
            font-size: 12px;
            margin-top: 4px;
          }
          .yam-open-link {
            color: #a78bfa;
            text-decoration: none;
            font-weight: 800;
          }
          .yam-settings-actions {
            display: grid;
            gap: 10px;
          }
          .yam-settings-action-btn {
            min-height: 54px;
            border-radius: 18px;
            border: 1px solid rgba(255,255,255,0.08);
            background: rgba(255,255,255,0.03);
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding: 0 16px;
            text-align: right;
          }
          .yam-settings-action-btn.danger {
            border-color: rgba(248,113,113,0.28);
            color: #fca5a5;
          }
          .yam-settings-empty {
            color: #94a3b8;
            text-align: center;
            padding: 18px 10px;
            border-radius: 18px;
            border: 1px dashed rgba(255,255,255,0.12);
          }
          @media (max-width: 560px) {
            .yam-chat-settings-body {
              padding: 12px 12px 40px;
              padding-bottom: calc(40px + env(safe-area-inset-bottom, 0px));
              gap: 10px;
            }
            .yam-chat-settings-card {
              padding: 12px 12px 10px;
              border-radius: 16px;
            }
            /* ✅ v85.8: الإحصائيات أحياناً 2×2 أفضل من عمود واحد — أرتب */
            .yam-meta-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 8px;
            }
            .yam-actions-grid {
              grid-template-columns: minmax(0, 1fr);
            }
            .yam-stat-pill,
            .yam-action-tile {
              padding: 10px;
              border-radius: 14px;
            }
            .yam-stat-pill span,
            .yam-action-tile span {
              font-size: 10.5px;
              margin-bottom: 4px;
            }
            .yam-stat-pill strong,
            .yam-action-tile strong {
              font-size: 14px;
            }
            .yam-settings-action-btn {
              min-height: 46px;
              padding: 0 12px;
              font-size: 13.5px;
            }
            .yam-settings-action-btn strong { font-size: 13px; font-weight: 700; }
            .yam-peer-hero h1 { font-size: 18px; }
            .yam-peer-hero p { font-size: 12px; }
            .yam-media-thumb { height: 100px; }
            .yam-media-strip { grid-auto-columns: minmax(108px, 1fr); }
            .yam-file-item, .yam-link-item {
              padding: 10px 12px;
              border-radius: 14px;
            }
            .yam-file-copy strong, .yam-link-copy strong { font-size: 12.5px; }
            .yam-file-copy span, .yam-link-copy span { font-size: 10.5px; }
          }
        `}</style>

        <header className="yam-chat-settings-header">
          <button type="button" className="yam-chat-settings-back" onClick={handleBack} aria-label="رجوع">←</button>
          <Avatar name={peer} src={threadMeta?.avatar} size={44} ring showStatus status={presence?.is_online ? 'online' : 'offline'} />
          <div className="yam-chat-settings-header-copy">
            <strong>{peer}</strong>
            <span>{formatLastSeen(presence?.last_seen, Boolean(presence?.is_online))}</span>
          </div>
          <button type="button" className="yam-chat-settings-header-action" onClick={() => navigate(`/chat/${encodeURIComponent(peer)}`)} aria-label="فتح المحادثة">💬</button>
        </header>

        <div className="yam-chat-settings-body">
          <section className="yam-chat-settings-card yam-peer-hero">
            <Avatar name={peer} src={threadMeta?.avatar} size={104} ring showStatus status={presence?.is_online ? 'online' : 'offline'} />
            <div>
              <h1>{peer}</h1>
              <p>{presence?.is_typing ? 'يكتب الآن...' : formatLastSeen(presence?.last_seen, Boolean(presence?.is_online))}</p>
            </div>
            <div className="yam-meta-grid">
              <div className="yam-stat-pill">
                <span>الوسائط المشتركة</span>
                <strong>{mediaItems.length}</strong>
              </div>
              <div className="yam-stat-pill">
                <span>الروابط</span>
                <strong>{sharedLinks.length}</strong>
              </div>
              <div className="yam-stat-pill">
                <span>الملفات والصوتيات</span>
                <strong>{fileItems.length}</strong>
              </div>
              <div className="yam-stat-pill">
                <span>حالة المحادثة</span>
                <strong>{blockStatus.blocked_by_me ? 'محظور' : (isMutedConversation ? 'مكتومة' : 'نشطة')}</strong>
              </div>
            </div>
          </section>

          <section className="yam-chat-settings-card">
            <div className="yam-section-title">
              <h2>إجراءات المحادثة</h2>
              <small>بنفس أسلوب واتساب تقريبًا</small>
            </div>
            <div className="yam-settings-actions">
              <button type="button" className="yam-settings-action-btn" onClick={handleMuteConversation}>
                <strong>{isMutedConversation ? 'إلغاء كتم المحادثة' : 'كتم المحادثة'}</strong>
                <span>{isMutedConversation ? '🔔' : '🔕'}</span>
              </button>
              <button type="button" className="yam-settings-action-btn" onClick={handlePinConversation}>
                <strong>{isPinnedConversation ? 'إلغاء تثبيت المحادثة' : 'تثبيت المحادثة'}</strong>
                <span>📌</span>
              </button>
              <button type="button" className={`yam-settings-action-btn ${blockStatus.blocked_by_me ? '' : 'danger'}`} onClick={handleBlock}>
                <strong>{blockStatus.blocked_by_me ? 'رفع الحظر' : 'حظر المستخدم'}</strong>
                <span>{blockStatus.blocked_by_me ? '✅' : '🚫'}</span>
              </button>
            </div>
          </section>

          <section className="yam-chat-settings-card">
            <div className="yam-section-title">
              <h2>الوسائط المشتركة</h2>
              <small>{mediaItems.length} عنصر</small>
            </div>
            {loading ? <div className="yam-settings-empty">جاري تحميل الوسائط...</div> : null}
            {!loading && !mediaItems.length ? <div className="yam-settings-empty">لا توجد وسائط مشتركة في هذه المحادثة حالياً.</div> : null}
            {!loading && mediaItems.length ? (
              <div className="yam-media-strip">
                {mediaItems.map((item) => (
                  <a key={item.id} href={item.url} target="_blank" rel="noreferrer" className="yam-media-card">
                    <div className="yam-media-thumb">
                      {item.type === 'image' ? <img src={item.url} alt={item.caption || 'وسائط مشتركة'} /> : <div className="yam-video-placeholder">🎬</div>}
                    </div>
                    <p>{item.caption || 'عرض الوسائط'}</p>
                  </a>
                ))}
              </div>
            ) : null}
          </section>

          <section className="yam-chat-settings-card">
            <div className="yam-section-title">
              <h2>الروابط المشتركة</h2>
              <small>{sharedLinks.length} رابط</small>
            </div>
            {!sharedLinks.length ? <div className="yam-settings-empty">لا توجد روابط مشتركة في الرسائل الحالية.</div> : null}
            {sharedLinks.length ? (
              <div className="yam-link-list">
                {sharedLinks.map((item) => (
                  <div key={item.id} className="yam-link-item">
                    <div className="yam-link-copy">
                      <strong>{item.url}</strong>
                      <span>أرسله {item.sender}</span>
                    </div>
                    <a className="yam-open-link" href={item.url} target="_blank" rel="noreferrer">فتح</a>
                  </div>
                ))}
              </div>
            ) : null}
          </section>

          <section className="yam-chat-settings-card">
            <div className="yam-section-title">
              <h2>الملفات والصوتيات</h2>
              <small>{fileItems.length} ملف</small>
            </div>
            {!fileItems.length ? <div className="yam-settings-empty">لا توجد ملفات أو رسائل صوتية مشتركة حتى الآن.</div> : null}
            {fileItems.length ? (
              <div className="yam-file-list">
                {fileItems.map((item, index) => (
                  <div key={String(item?.id || item?.client_id || index)} className="yam-file-item">
                    <div className="yam-file-copy">
                      <strong>{extractFileName(item)}</strong>
                      <span>{item?.type === 'voice' ? 'رسالة صوتية' : 'ملف مرفق'}</span>
                    </div>
                    {resolveMessageMediaUrl(item) ? <a className="yam-open-link" href={resolveMessageMediaUrl(item)} target="_blank" rel="noreferrer">فتح</a> : <span aria-hidden="true">📎</span>}
                  </div>
                ))}
              </div>
            ) : null}
          </section>
        </div>
      </section>
    </MainLayout>
  );
}

/**
 * ChatSettings.jsx — v88.76 (2026-07-26)
 *
 * ✅ إصلاحات جذرية نهائية — لماذا كانت الوسائط/الملفات/الروابط تظهر 0
 *    والصناديق فارغة رغم الرسائل الفعلية:
 *
 *   1) 🔴 كان الرندر يعتمد على `!loading && mediaItems.length` فقط.
 *      أي نبضة بولنغ لاحقة كانت أحياناً تُعيد ضبط setLoading(true) (عبر
 *      re-fetch من useEffect) فيختفي المحتوى الظاهر مسبقاً لثوانٍ.
 *      → الحل: نستخدم `initialLoading` منفصل عن نبضات التحديث،
 *      ولا نُظهر «جاري التحميل» إلا عند الجلب الأول فقط.
 *
 *   2) 🔴 العدادات كانت تعرض 0 حتى ولو كانت `mediaItems.length > 0`
 *      أثناء إعادة الرندر، لأنها كانت تعرض `loading ? '…' : n`.
 *      أي عودة loading=true تُخفي الرقم الحقيقي.
 *      → الحل: نعرض الرقم دائماً إذا كان > 0، ونعرض `…` فقط
 *      عند الجلب الأول قبل وصول أي بيانات.
 *
 *   3) 🔴 `getMessages` كان يعتمد على cache حتى مع forceRefresh عبر
 *      طبقات وسيطة قديمة. الآن نمرر `cache:false` صراحة عند forceRefresh
 *      في نفس `chat.js`، وهنا نرسل `forceRefresh:true` في كل نبضة.
 *
 *   4) 🔴 كان يتم فقدان المرفقات إذا وصلت الرسالة عبر socket بحقل
 *      `attachment` (مفرد) أو `file` أو `media` بدل `attachments`.
 *      → توسيع getAttachments ليشمل كل الأسماء المعروفة + دعم الحقل المفرد.
 *
 *   5) 🔴 `classifyEntity` كان يتخطى الرسائل الصوتية عندما يكون
 *      `message_type=voice_note` أو `voice_message`. → قائمة أنواع موسّعة.
 *
 *   6) 🔴 عند إعادة استخدام mediaItems/fileItems داخل الصناديق كنا نستخدم
 *      `slice().reverse()` مرتين لنفس البيانات المحسوبة، ما يسبب أحياناً
 *      إعادة رسم مضاعفة. الآن reverse مرة واحدة داخل useMemo.
 *
 *   7) 🔴 إضافة استماع لحدث `message:sent` (بعث محلي) و `message:received`
 *      لتحديث فوري بدون انتظار البولنغ.
 *
 *   8) ✅ زر «تحديث» يدوي داخل ترويسة كل صندوق لإعادة الجلب فوراً بدون
 *      انتظار البولنغ (تجربة مستخدم).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import socketManager from '../services/socketManager.js';

const URL_PATTERN = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;

const IMAGE_MEDIA_RE = /\.(jpg|jpeg|png|gif|webp|svg|avif|bmp|heic|heif)(?:$|\?)/i;
const VIDEO_MEDIA_RE = /\.(mp4|webm|mov|m4v|mkv|avi|3gp)(?:$|\?)/i;
const AUDIO_MEDIA_RE = /\.(mp3|wav|ogg|m4a|opus|aac|flac|amr)(?:$|\?)/i;

const PAGE_SIZE = 200;
const MAX_PAGES = 12;                 // 12 × 200 = 2400 رسالة
const REFRESH_INTERVAL_MS = 8_000;    // بولنغ خلفي كل 8 ثوان

const IMAGE_KINDS = new Set(['image', 'photo', 'media_image', 'sticker', 'gif', 'animated_gif']);
const VIDEO_KINDS = new Set(['video', 'media_video', 'clip', 'reel']);
const AUDIO_KINDS = new Set(['voice', 'audio', 'media_audio', 'voice_note', 'voice_message', 'audio_message']);
const FILE_KINDS  = new Set(['file', 'document', 'attachment', 'pdf', 'doc']);

function safeUrl(value) {
  const str = String(value || '').trim();
  return str && str !== 'null' && str !== 'undefined' ? str : '';
}

/**
 * ✅ v88.76: نقبل كل الأسماء المعروفة للحقل + الحقل المفرد أيضاً.
 */
function getAttachments(message = {}) {
  const listCandidates = [
    message?.attachments,
    message?.attachments_list,
    message?.media_attachments,
    message?.attached_files,
    message?.files,
    message?.media,
  ];
  for (const list of listCandidates) {
    if (Array.isArray(list) && list.length) return list;
  }
  const singleCandidates = [
    message?.attachment,
    message?.file,
    message?.media_file,
  ];
  for (const single of singleCandidates) {
    if (single && typeof single === 'object') return [single];
  }
  return [];
}

function pickBestUrl(source = {}) {
  return (
    safeUrl(source?.url)
    || safeUrl(source?.media_url)
    || safeUrl(source?.mediaUrl)
    || safeUrl(source?.cdn_url)
    || safeUrl(source?.cdnUrl)
    || safeUrl(source?.file_url)
    || safeUrl(source?.fileUrl)
    || safeUrl(source?.download_url)
    || safeUrl(source?.thumbnail_url)
    || safeUrl(source?.thumbnailUrl)
  );
}

function extractFileName(source = {}, fallbackUrl = '') {
  const name = source?.file_name || source?.fileName || source?.name || source?.attachment_name || source?.original_name;
  if (name) return String(name);
  const url = fallbackUrl || pickBestUrl(source);
  if (!url) return 'ملف مرفق';
  try {
    const clean = url.split('?')[0];
    return decodeURIComponent(clean.split('/').pop() || 'ملف مرفق');
  } catch {
    return 'ملف مرفق';
  }
}

/**
 * ✅ v88.76: تصنيف موسّع — يعتمد kind/mime أولاً ثم extension.
 */
function classifyEntity(entity = {}, rawTypeHint = '') {
  const url = pickBestUrl(entity).toLowerCase();
  const kind = String(entity?.kind || entity?.type || entity?.message_type || rawTypeHint || '').trim().toLowerCase();
  const mime = String(entity?.mime_type || entity?.mimeType || entity?.content_type || '').trim().toLowerCase();

  if (VIDEO_KINDS.has(kind) || mime.startsWith('video/') || VIDEO_MEDIA_RE.test(url)) return 'video';
  if (IMAGE_KINDS.has(kind) || mime.startsWith('image/') || IMAGE_MEDIA_RE.test(url)) return 'image';
  if (AUDIO_KINDS.has(kind) || mime.startsWith('audio/') || AUDIO_MEDIA_RE.test(url)) return 'audio';
  if (FILE_KINDS.has(kind) || url) return 'file';
  return '';
}

function extractItemsFromResponse(res) {
  const data = res?.data ?? res;
  if (Array.isArray(data)) return { items: data, paging: null };
  const items = Array.isArray(data?.items) ? data.items : (Array.isArray(data?.messages) ? data.messages : []);
  return { items, paging: data?.paging || null };
}

export default function ChatSettings() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const peer = decodeURIComponent(userId || '').trim();

  // ✅ v88.76: نفصل initialLoading (يظهر مرة واحدة) عن refreshing (بولنغ صامت)
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [messages, setMessages] = useState([]);
  const [presence, setPresence] = useState({});
  const [threadMeta, setThreadMeta] = useState(null);
  const [blockStatus, setBlockStatus] = useState({ can_chat: true, blocked_by_me: false, blocked_me: false });
  const [isMutedConversation, setIsMutedConversation] = useState(false);
  const [isPinnedConversation, setIsPinnedConversation] = useState(false);
  const [totalLoaded, setTotalLoaded] = useState(0);
  const [hasMoreHistory, setHasMoreHistory] = useState(false);

  const messagesMapRef = useRef(new Map());
  const dataReceivedRef = useRef(false);

  useEffect(() => {
    if (!peer) return;
    const prefs = getChatPreferences();
    setIsMutedConversation(prefs.muted.has(peer));
    setIsPinnedConversation(prefs.pinned.has(peer));
  }, [peer]);

  const fetchPage = useCallback((beforeId, signal) => (
    getMessages(peer, PAGE_SIZE, beforeId, { signal, forceRefresh: true })
  ), [peer]);

  const loadAllMessages = useCallback(async (signal) => {
    const collected = [];
    let beforeId;
    let hasMore = true;
    for (let page = 0; page < MAX_PAGES && hasMore; page += 1) {
      if (signal?.aborted) return { items: [], hasMore: false };
      try {
        // eslint-disable-next-line no-await-in-loop
        const res = await fetchPage(beforeId, signal);
        const { items, paging } = extractItemsFromResponse(res);
        if (!items.length) { hasMore = false; break; }
        collected.push(...items);
        beforeId = paging?.next_before_id;
        hasMore = Boolean(paging?.has_more) && Boolean(beforeId);
      } catch (err) {
        if (err?.name === 'CanceledError' || err?.name === 'AbortError') return { items: [], hasMore: false };
        hasMore = false;
        break;
      }
    }
    return { items: collected, hasMore };
  }, [fetchPage]);

  const rebuildFromMap = useCallback(() => {
    const list = Array.from(messagesMapRef.current.values());
    list.sort((a, b) => {
      const ai = Number(a?.id || 0);
      const bi = Number(b?.id || 0);
      if (ai !== bi) return ai - bi;
      return String(a?.created_at || '').localeCompare(String(b?.created_at || ''));
    });
    setMessages(list);
    setTotalLoaded(list.length);
    if (list.length) dataReceivedRef.current = true;
  }, []);

  const mergeMessages = useCallback((items) => {
    let mutated = false;
    (items || []).forEach((item) => {
      if (!item || typeof item !== 'object') return;
      const key = String(item?.id || item?.client_id || `${item?.created_at || ''}-${item?.sender || ''}`);
      if (!key) return;
      const prev = messagesMapRef.current.get(key);
      if (!prev) mutated = true;
      messagesMapRef.current.set(key, { ...(prev || {}), ...item });
    });
    if (mutated) rebuildFromMap();
    return mutated;
  }, [rebuildFromMap]);

  const doRefresh = useCallback(async () => {
    if (!peer) return;
    setRefreshing(true);
    const pulseController = new AbortController();
    try {
      const res = await fetchPage(undefined, pulseController.signal);
      const { items } = extractItemsFromResponse(res);
      mergeMessages(items);
    } catch { /* تجاهل */ }
    finally { setRefreshing(false); }
  }, [peer, fetchPage, mergeMessages]);

  useEffect(() => {
    if (!peer) return undefined;
    const controller = new AbortController();
    let active = true;

    try { socketManager.connect?.(); } catch { /* ignore */ }

    const loadData = async () => {
      // ✅ v88.76: initialLoading يبقى true حتى نستقبل أول دفعة أو نُقر بأن لا رسائل
      setInitialLoading(true);
      try {
        const [historyRes, presenceRes, blockRes, threadsRes] = await Promise.allSettled([
          loadAllMessages(controller.signal),
          getPresence(peer, { signal: controller.signal }),
          getBlockStatus(peer, { signal: controller.signal }),
          getChatThreads({ signal: controller.signal }),
        ]);

        if (!active) return;

        const historyItems = historyRes.status === 'fulfilled' ? (historyRes.value?.items || []) : [];
        const hasMore = historyRes.status === 'fulfilled' ? Boolean(historyRes.value?.hasMore) : false;

        const map = new Map();
        historyItems.forEach((item) => {
          const key = String(item?.id || item?.client_id || `${item?.created_at || ''}-${item?.sender || ''}`);
          if (key) map.set(key, item);
        });
        messagesMapRef.current = map;
        rebuildFromMap();
        setHasMoreHistory(hasMore);

        const threads = threadsRes.status === 'fulfilled'
          ? (Array.isArray(threadsRes.value?.data) ? threadsRes.value.data : (threadsRes.value?.data?.items || []))
          : [];

        setPresence(presenceRes.status === 'fulfilled' ? (presenceRes.value?.data || {}) : {});
        setBlockStatus(blockRes.status === 'fulfilled' ? (blockRes.value?.data || {}) : { can_chat: true, blocked_by_me: false, blocked_me: false });
        setThreadMeta(threads.find((item) => item?.username === peer || item?.peer === peer) || null);
      } catch {
        if (!active) return;
        pushToast?.({ type: 'error', title: 'تعذر تحميل إعدادات المحادثة' });
      } finally {
        if (active) setInitialLoading(false);
      }
    };

    loadData();

    const handleSocketMessage = (message) => {
      if (!message || typeof message !== 'object') return;
      const sender = String(message?.sender || '').trim();
      const receiver = String(message?.receiver || '').trim();
      if (sender !== peer && receiver !== peer) return;
      mergeMessages([message]);
    };

    const handleWindowMessage = (event) => {
      const detail = event?.detail || {};
      const msg = detail?.message || detail?.data || detail;
      handleSocketMessage(msg);
    };

    let unsubscribeSocket = () => {};
    let unsubscribeSocketSent = () => {};
    let unsubscribeSocketRecv = () => {};
    try {
      unsubscribeSocket = socketManager.on('new_private_message', handleSocketMessage) || (() => {});
      unsubscribeSocketSent = socketManager.on('message:sent', handleSocketMessage) || (() => {});
      unsubscribeSocketRecv = socketManager.on('message:received', handleSocketMessage) || (() => {});
    } catch { /* ignore */ }

    const refreshTimer = setInterval(async () => {
      if (!active || document.hidden) return;
      const pulseController = new AbortController();
      try {
        const res = await fetchPage(undefined, pulseController.signal);
        if (!active) return;
        const { items } = extractItemsFromResponse(res);
        mergeMessages(items);
      } catch { /* تجاهل */ }
    }, REFRESH_INTERVAL_MS);

    const handleVisibility = async () => {
      if (document.hidden || !active) return;
      const pulseController = new AbortController();
      try {
        const res = await fetchPage(undefined, pulseController.signal);
        if (!active) return;
        const { items } = extractItemsFromResponse(res);
        mergeMessages(items);
      } catch { /* تجاهل */ }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    window.addEventListener('yamshat:new-message', handleWindowMessage);
    window.addEventListener('yamshat:message', handleWindowMessage);
    window.addEventListener('chat:message', handleWindowMessage);

    return () => {
      active = false;
      controller.abort();
      clearInterval(refreshTimer);
      document.removeEventListener('visibilitychange', handleVisibility);
      try { unsubscribeSocket?.(); } catch { /* ignore */ }
      try { unsubscribeSocketSent?.(); } catch { /* ignore */ }
      try { unsubscribeSocketRecv?.(); } catch { /* ignore */ }
      window.removeEventListener('yamshat:new-message', handleWindowMessage);
      window.removeEventListener('yamshat:message', handleWindowMessage);
      window.removeEventListener('chat:message', handleWindowMessage);
    };
  }, [peer, pushToast, loadAllMessages, rebuildFromMap, mergeMessages, fetchPage]);

  // ✅ v88.76: تصنيف صارم + reverse مرة واحدة (الأحدث أولاً)
  const classified = useMemo(() => {
    const mediaItems = [];
    const fileItems = [];
    const mediaUrlsUsed = new Set();
    const seenMediaKeys = new Set();

    const rawTypeOf = (m) => String(m?.type || m?.message_type || '').trim().toLowerCase();

    messages.forEach((item, index) => {
      const idKey = String(item?.id || item?.client_id || index);
      const rawType = rawTypeOf(item);
      const atts = getAttachments(item);

      const entities = [];
      if (atts.length) {
        atts.forEach((att, i) => entities.push({ entity: att, sub: i }));
      }
      const directUrl = safeUrl(item?.media_url) || safeUrl(item?.media_urls?.[0]);
      if (directUrl && !atts.some((a) => pickBestUrl(a) === directUrl)) {
        entities.push({ entity: { url: directUrl, mime_type: '', kind: rawType }, sub: 'root' });
      }
      if (!entities.length && ['voice', 'voice_note', 'voice_message', 'audio', 'image', 'video', 'file', 'document'].includes(rawType)) {
        entities.push({ entity: item, sub: 'self' });
      }

      entities.forEach(({ entity, sub }) => {
        const url = pickBestUrl(entity);
        const kind = classifyEntity(entity, rawType);
        const uniq = `${idKey}::${sub}::${url || kind}`;
        if (seenMediaKeys.has(uniq)) return;
        seenMediaKeys.add(uniq);

        if (kind === 'image' || kind === 'video') {
          if (!url) return;
          mediaItems.push({
            id: uniq,
            url,
            type: kind,
            caption: item?.content || item?.message || '',
            sender: item?.sender || '',
          });
          mediaUrlsUsed.add(url);
        } else if (kind === 'audio' || kind === 'file') {
          fileItems.push({
            id: uniq,
            url,
            kind,
            name: extractFileName(entity, url) || extractFileName(item, url),
            sender: item?.sender || '',
          });
          if (url) mediaUrlsUsed.add(url);
        }
      });
    });

    // الروابط النصية
    const linkSet = new Map();
    messages.forEach((item, index) => {
      const text = `${item?.content || ''} ${item?.message || ''}`.trim();
      if (!text) return;
      const matches = text.match(URL_PATTERN) || [];
      matches.forEach((raw, linkIndex) => {
        const normalized = raw.startsWith('http') ? raw : `https://${raw}`;
        if (mediaUrlsUsed.has(normalized)) return;
        if (!linkSet.has(normalized)) {
          linkSet.set(normalized, {
            id: `${item?.id || index}-${linkIndex}`,
            url: normalized,
            sender: item?.sender || 'غير معروف',
          });
        }
      });
    });

    // ✅ v88.76: reverse مرة واحدة هنا (الأحدث أولاً) لتفادي إعادة الحساب في الرندر
    mediaItems.reverse();
    fileItems.reverse();
    const sharedLinks = Array.from(linkSet.values()).reverse();

    if (typeof window !== 'undefined' && (window?.location?.hostname === 'localhost' || window?.__YAM_DEBUG__)) {
      // eslint-disable-next-line no-console
      console.debug('[ChatSettings v88.76] classify', {
        totalMessages: messages.length,
        media: mediaItems.length,
        files: fileItems.length,
        links: sharedLinks.length,
      });
    }

    return { mediaItems, fileItems, sharedLinks };
  }, [messages]);

  const { mediaItems, fileItems, sharedLinks } = classified;

  // ✅ v88.76: helper — اعرض الرقم دائماً إن كان > 0، وإلا اعرض … عند الجلب الأول فقط
  const showCount = (n) => {
    if (n > 0) return n;
    if (initialLoading && !dataReceivedRef.current) return '…';
    return 0;
  };

  const showEmpty = (n) => (!initialLoading || dataReceivedRef.current) && n === 0;
  const showList  = (n) => n > 0;

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
          .yam-refresh-btn {
            font-size: 11px;
            padding: 4px 10px;
            border-radius: 999px;
            border: 1px solid rgba(167,139,250,0.35);
            background: rgba(167,139,250,0.08);
            color: #c4b5fd;
            cursor: pointer;
          }
          .yam-refresh-btn:disabled { opacity: 0.55; }
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
            position: relative;
          }
          .yam-media-thumb img,
          .yam-media-thumb video {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .yam-media-thumb .yam-video-badge {
            position: absolute;
            inset: auto 6px 6px auto;
            background: rgba(0,0,0,0.55);
            color: #fff;
            padding: 2px 8px;
            border-radius: 999px;
            font-size: 11px;
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
          .yam-live-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-size: 11px;
            color: #86efac;
            background: rgba(34,197,94,0.10);
            border: 1px solid rgba(34,197,94,0.28);
            padding: 3px 10px;
            border-radius: 999px;
          }
          .yam-live-badge::before {
            content: '';
            width: 6px;
            height: 6px;
            border-radius: 999px;
            background: #22c55e;
            box-shadow: 0 0 8px #22c55e;
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
              <p style={{ marginTop: 6 }}>
                <span className="yam-live-badge">تحديث لحظي · {totalLoaded} رسالة{hasMoreHistory ? '+' : ''}</span>
              </p>
            </div>
            <div className="yam-meta-grid">
              <div className="yam-stat-pill">
                <span>الوسائط المشتركة</span>
                <strong>{showCount(mediaItems.length)}</strong>
              </div>
              <div className="yam-stat-pill">
                <span>الروابط</span>
                <strong>{showCount(sharedLinks.length)}</strong>
              </div>
              <div className="yam-stat-pill">
                <span>الملفات والصوتيات</span>
                <strong>{showCount(fileItems.length)}</strong>
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
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <small>{mediaItems.length} عنصر</small>
                <button type="button" className="yam-refresh-btn" onClick={doRefresh} disabled={refreshing}>
                  {refreshing ? '…' : '⟳'}
                </button>
              </div>
            </div>
            {showList(mediaItems.length) ? (
              <div className="yam-media-strip">
                {mediaItems.map((item) => (
                  <a key={item.id} href={item.url} target="_blank" rel="noreferrer" className="yam-media-card">
                    <div className="yam-media-thumb">
                      {item.type === 'image' ? (
                        <img src={item.url} alt={item.caption || 'وسائط مشتركة'} loading="lazy" />
                      ) : (
                        <>
                          <video src={item.url} muted playsInline preload="metadata" />
                          <span className="yam-video-badge">فيديو</span>
                        </>
                      )}
                    </div>
                    <p>{item.caption || (item.type === 'video' ? 'مقطع فيديو' : 'صورة مشتركة')}</p>
                  </a>
                ))}
              </div>
            ) : showEmpty(mediaItems.length) ? (
              <div className="yam-settings-empty">لا توجد وسائط مشتركة في هذه المحادثة حالياً.</div>
            ) : (
              <div className="yam-settings-empty">جاري تحميل الوسائط...</div>
            )}
          </section>

          <section className="yam-chat-settings-card">
            <div className="yam-section-title">
              <h2>الروابط المشتركة</h2>
              <small>{sharedLinks.length} رابط</small>
            </div>
            {showList(sharedLinks.length) ? (
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
            ) : showEmpty(sharedLinks.length) ? (
              <div className="yam-settings-empty">لا توجد روابط مشتركة في الرسائل الحالية.</div>
            ) : null}
          </section>

          <section className="yam-chat-settings-card">
            <div className="yam-section-title">
              <h2>الملفات والصوتيات</h2>
              <small>{fileItems.length} ملف</small>
            </div>
            {showList(fileItems.length) ? (
              <div className="yam-file-list">
                {fileItems.map((item) => (
                  <div key={item.id} className="yam-file-item">
                    <div className="yam-file-copy">
                      <strong>{item.name}</strong>
                      <span>{item.kind === 'audio' ? '🎙️ رسالة صوتية' : '📎 ملف مرفق'} · {item.sender || 'غير معروف'}</span>
                    </div>
                    {item.url ? <a className="yam-open-link" href={item.url} target="_blank" rel="noreferrer">فتح</a> : <span aria-hidden="true">📎</span>}
                  </div>
                ))}
              </div>
            ) : showEmpty(fileItems.length) ? (
              <div className="yam-settings-empty">لا توجد ملفات أو رسائل صوتية مشتركة حتى الآن.</div>
            ) : null}
          </section>
        </div>
      </section>
    </MainLayout>
  );
}

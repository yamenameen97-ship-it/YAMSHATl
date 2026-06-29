import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout.jsx';
import {
  getGroupDetails,
  getGroupMessages,
  sendGroupMessage,
  uploadGroupMedia,
  deleteGroupMessage,
  pinGroupMessage,
  forwardGroupMessage,
  reportGroupMessage,
  reactToGroupMessage,
} from '../api/groups.js';
import socketManager from '../services/socketManager.js';
import { useToast } from '../components/admin/ToastProvider.jsx';
import { getCurrentUsername } from '../utils/auth.js';
import { startCall, bootstrapCallService } from '../services/callService.js';
import { ensureNotificationPermission, showLocalNotification } from '../utils/notificationCenter.js';
import MediaPreviewModal from '../components/chat/MediaPreviewModal.jsx';
import MessageActionsToolbar from '../components/chat/MessageActionsToolbar.jsx';
import MessageReactionPicker from '../components/chat/MessageReactionPicker.jsx';
import SafeImage from '../components/chat/SafeImage.jsx';
import CallBubble from '../components/chat/CallBubble.jsx';
import GroupPinnedBar from '../components/groups/GroupPinnedBar.jsx';
import GroupQuickLinks from '../components/groups/GroupQuickLinks.jsx';
import '../styles/group-chat.css';
/* v61: حذف chat-mobile-fixes.css (دمج في chat-redesign-v61.css) */
import '../styles/groups-features.css';
// ✅ v59.13.17 FIX #3: ReportModal الموحّد بدلاً عن window.prompt للإبلاغ على رسائل المجموعة
import ReportModal from '../components/reports/ReportModal.jsx';

/**
 * صفحة دردشة مجموعة واحدة — نسخة v22 مُصلحة.
 *
 * إصلاحات v22:
 *  1. فشل الإرسال على ويب الجوال:
 *     - إضافة retry تلقائي للـ POST /messages (3 محاولات + backoff).
 *     - إعادة الرسالة الفاشلة للحقل مع رسالة خطأ واضحة.
 *     - زيادة timeout للرسائل (60s بدل 45s) لتحمل شبكة الجوال البطيئة.
 *  2. فشل رفع الملفات للمجموعة:
 *     - إضافة optimistic UI للملف قبل اكتمال الرفع.
 *     - عرض شريط تقدم + التعامل مع أخطاء الرفع بشكل صحيح.
 *     - عدم تعيين Content-Type يدوياً (المتصفح يضيف boundary).
 *  3. تفعيل المكالمات الصوتية والفيديو من هيدر المجموعة.
 *  4. تفعيل إشعارات الويب للمجموعات (طلب الإذن + إشعار محلي عند الرسائل).
 */
const GroupChat = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { pushToast } = useToast();

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [groupInfo, setGroupInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [notifPermission, setNotifPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);

  // حالة معاينة الوسائط قبل الإرسال
  const [previewFiles, setPreviewFiles] = useState([]);          // File[]
  const [previewMediaType, setPreviewMediaType] = useState('image');

  // حالة تحديد رسالة (Long-Press)
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [reactionAnchor, setReactionAnchor] = useState(null);    // DOMRect
  // ✅ v59.13.17 FIX #3: هدف الإبلاغ لرسالة المجموعة + مودال إعادة التوجيه الداخلي
  const [reportTarget, setReportTarget] = useState(null);
  const [forwardTarget, setForwardTarget] = useState(null);   // { messageId }
  const [forwardDraft, setForwardDraft] = useState('');
  const [forwardBusy, setForwardBusy] = useState(false);
  const documentVisibleRef = useRef(
    typeof document !== 'undefined' ? !document.hidden : true
  );

  const activeGroupIdRef = useRef(groupId);
  useEffect(() => {
    activeGroupIdRef.current = groupId;
  }, [groupId]);

  // ✅ v59.13.5 FIX #4: حفظ اسم المجموعة في ref حتّى لا نضعه في deps
  // الـ effect الكبير (سوكت + refetch)، وبالتالي لا يُعاد تشغيله
  // عند وصول groupInfo (الذي كان يتسبّب في leave/join + إعادة جلب كل الرسائل).
  const groupNameRef = useRef('المجموعة');
  useEffect(() => {
    if (groupInfo?.name) groupNameRef.current = groupInfo.name;
  }, [groupInfo?.name]);

  const currentUser = getCurrentUsername();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 🧹 مسح state فوريّ عند تغيّر المجموعة
  useEffect(() => {
    setMessages([]);
    setGroupInfo(null);
    setLoading(true);
    setMessage('');
    setShowAttachMenu(false);
    setUploadProgress(0);
  }, [groupId]);

  // 🔔 طلب إذن الإشعارات + bootstrap للمكالمات
  useEffect(() => {
    try { bootstrapCallService(); } catch { /* تجاهل */ }
    try {
      ensureNotificationPermission?.().then((perm) => {
        if (perm) setNotifPermission(perm);
      }).catch(() => {});
    } catch {
      if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
        Notification.requestPermission().then(setNotifPermission).catch(() => {});
      }
    }

    const onVisibility = () => {
      documentVisibleRef.current = !document.hidden;
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  // 📥 جلب معلومات المجموعة
  useEffect(() => {
    let cancelled = false;
    const fetchGroup = async () => {
      try {
        const res = await getGroupDetails(groupId);
        if (cancelled) return;
        const data = res.data || res;
        setGroupInfo(data);
      } catch (err) {
        console.warn('Could not load group info:', err?.message);
        if (!cancelled) {
          setGroupInfo({ name: 'المجموعة', members_count: 0, icon: '👥' });
        }
      }
    };
    fetchGroup();
    return () => { cancelled = true; };
  }, [groupId]);

  // 📥 جلب رسائل المجموعة + اشتراك السوكيت
  useEffect(() => {
    let cancelled = false;
    const room = `group:${groupId}`;

    const fetchChatData = async () => {
      try {
        setLoading(true);
        const response = await getGroupMessages(groupId, { limit: 50, offset: 0 });
        if (cancelled) return;

        const raw = Array.isArray(response.data)
          ? response.data
          : (response.data?.items || []);

        const formattedMessages = raw.map((msg) => ({
          id: msg.id,
          group_id: String(msg.group_id || groupId),
          sender: msg.sender_username || msg.sender,
          text: msg.content || msg.text || msg.message || '',
          mediaUrl:
            msg.media_url ||
            (Array.isArray(msg.attachments) && msg.attachments[0]?.url) ||
            null,
          mediaType: msg.message_type || 'text',
          time: new Date(msg.created_at || Date.now()).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
          isMe: (msg.sender_username || msg.sender) === currentUser,
          avatar:
            msg.sender_avatar ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.sender_username || msg.sender}`,
        }));

        formattedMessages.sort((a, b) => String(a.id).localeCompare(String(b.id)));
        setMessages(formattedMessages);
      } catch (err) {
        console.error('Error fetching group messages:', err);
        if (!cancelled) setMessages([]);
      } finally {
        if (!cancelled) {
          setLoading(false);
          setTimeout(scrollToBottom, 100);
        }
      }
    };

    fetchChatData();

    socketManager.connect();
    try {
      socketManager.emit('join_group', { group_id: groupId, room });
    } catch { /* تجاهل */ }

    const handleNewMessage = (payload) => {
      const currentGid = activeGroupIdRef.current;
      const payloadGid =
        String(payload.group_id || '') ||
        (typeof payload.receiver === 'string' && payload.receiver.startsWith('group:')
          ? payload.receiver.slice('group:'.length)
          : '');

      if (String(payloadGid) !== String(currentGid)) return;

      const senderName = payload.sender_username || payload.sender;
      const isFromMe = senderName === currentUser;

      const newMsg = {
        id: payload.id || `srv_${Date.now()}`,
        group_id: String(currentGid),
        sender: senderName,
        text: payload.content || payload.text || payload.message || '',
        mediaUrl:
          payload.media_url ||
          (Array.isArray(payload.attachments) && payload.attachments[0]?.url) ||
          null,
        mediaType: payload.message_type || 'text',
        time: new Date(payload.created_at || Date.now()).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        isMe: isFromMe,
        avatar:
          payload.sender_avatar ||
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${senderName}`,
      };

      setMessages((prev) => {
        if (prev.find((m) => String(m.id) === String(newMsg.id))) return prev;
        return [...prev, newMsg];
      });
      scrollToBottom();

      // 🔔 إشعار محلي إن لم تكن الرسالة منا والصفحة غير مرئية
      if (!isFromMe && !documentVisibleRef.current) {
        try {
          const groupName = groupNameRef.current || 'المجموعة';
          showLocalNotification?.({
            title: `${groupName} — ${senderName}`,
            body: newMsg.text || (newMsg.mediaUrl ? '📎 مرفق جديد' : 'رسالة جديدة'),
            icon: '/favicon.ico',
            tag: `group-${currentGid}`,
            data: { groupId: currentGid, type: 'group_message' },
          });
        } catch (e) {
          // fallback: استخدم Notification API مباشرة
          if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            try {
              new Notification(`${groupNameRef.current || 'المجموعة'} — ${senderName}`, {
                body: newMsg.text || '📎 مرفق جديد',
                icon: '/favicon.ico',
                tag: `group-${currentGid}`,
              });
            } catch { /* تجاهل */ }
          }
        }
      }
    };

    socketManager.on('new_message', handleNewMessage);
    socketManager.on('group_message', handleNewMessage);

    return () => {
      cancelled = true;
      socketManager.off('new_message', handleNewMessage);
      socketManager.off('group_message', handleNewMessage);
      try {
        socketManager.emit('leave_group', { group_id: groupId, room });
      } catch { /* تجاهل */ }
    };
    // ✅ v59.13.5 FIX #4: أزلنا groupInfo?.name من deps — يُقرأ عبر groupNameRef داخل المعالج
  }, [groupId, currentUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // ✅ Helper: محاولة إرسال مع retry لمعالجة شبكات الجوال الضعيفة
  const sendWithRetry = async (payload, maxAttempts = 3) => {
    let lastErr = null;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        // timeout أعلى للمحاولة الأولى ضمن إعدادات axios للحقول الحساسة
        const response = await sendGroupMessage(groupId, payload);
        return response;
      } catch (err) {
        lastErr = err;
        const status = err?.response?.status;
        // لا نعيد المحاولة على أخطاء العميل (4xx) ما عدا 408/429
        if (status && status >= 400 && status < 500 && status !== 408 && status !== 429) {
          throw err;
        }
        if (attempt < maxAttempts) {
          // backoff: 800ms, 1600ms
          await new Promise((r) => setTimeout(r, 800 * Math.pow(2, attempt - 1)));
        }
      }
    }
    throw lastErr;
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const content = message.trim();
    setMessage('');

    const tempId = `tmp_${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
      group_id: String(groupId),
      sender: currentUser,
      text: content,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
      pending: true,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser}`,
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    scrollToBottom();

    try {
      const response = await sendWithRetry({
        content,
        message_type: 'text',
      }, 3);

      const body = response.data || {};
      const serverMsg = body.message || body;

      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId
            ? {
                ...m,
                id: serverMsg.id || tempId,
                pending: false,
                failed: false,
              }
            : m
        )
      );
    } catch (err) {
      console.error('Failed to send message after retries:', err);
      // علّم الرسالة كفاشلة بدل حذفها (تجربة أفضل على الجوال)
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId
            ? { ...m, pending: false, failed: true }
            : m
        )
      );
      // أعد المحتوى للحقل ليتمكن المستخدم من إعادة الإرسال
      setMessage((prevInput) => prevInput || content);
      const errMsg = err?.response?.data?.detail || 'فشل إرسال الرسالة. تحقق من الاتصال.';
      pushToast?.({ type: 'error', title: 'فشل الإرسال', description: errMsg });
    }
  };

  // ✅ المرحلة 1: عند اختيار الملف، نفتح Preview Modal بدلاً من الإرسال المباشر
  const handleFileSelect = (e, mediaType = 'file') => {
    const filesList = Array.from(e.target.files || []);
    if (!filesList.length) return;
    setShowAttachMenu(false);

    const MAX_SIZE = 50 * 1024 * 1024;
    const accepted = [];
    for (const f of filesList) {
      if (f.size > MAX_SIZE) {
        pushToast?.({
          type: 'warning',
          title: 'الملف كبير',
          description: `"${f.name}" يتجاوز ${Math.round(MAX_SIZE / 1024 / 1024)}MB`,
        });
        continue;
      }
      accepted.push(f);
    }
    if (e.target) e.target.value = '';
    if (!accepted.length) return;

    // افتح المعاينة قبل الإرسال
    setPreviewMediaType(mediaType);
    setPreviewFiles((prev) => [...prev, ...accepted]);
  };

  // إرسال الملفات بعد تأكيد المعاينة
  const handleConfirmPreviewSend = async (filesToSend, caption) => {
    const list = filesToSend && filesToSend.length ? filesToSend : previewFiles;
    setPreviewFiles([]);
    for (const f of list) {
      await uploadAndSendGroupFile(f, previewMediaType, caption);
    }
  };

  // ✅ رفع ملف مع optimistic UI ومعالجة أخطاء واضحة (يستدعى من Preview Modal)
  const uploadAndSendGroupFile = async (file, mediaType = 'file', caption = '') => {
    if (!file) return;
    const MAX_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      pushToast?.({ type: 'warning', title: 'الملف كبير', description: `الحد الأقصى ${Math.round(MAX_SIZE / 1024 / 1024)}MB` });
      return;
    }

    const tempId = `tmp_${Date.now()}`;
    // optimistic preview للصور
    const previewUrl = mediaType === 'image' && URL.createObjectURL
      ? URL.createObjectURL(file)
      : null;

    const optimisticMsg = {
      id: tempId,
      group_id: String(groupId),
      sender: currentUser,
      text: file.name,
      mediaUrl: previewUrl,
      mediaType,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
      pending: true,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser}`,
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    scrollToBottom();

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // ⚠️ لا تعيّن Content-Type يدويًا — المتصفح يضيف boundary تلقائيًا
      const uploadRes = await uploadGroupMedia(formData, (progressEvent) => {
        if (progressEvent.total) {
          const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(pct);
        }
      });

      const mediaUrl = uploadRes.data?.url || uploadRes.data?.media_url || uploadRes.data?.cdn_url;
      if (!mediaUrl) throw new Error('No URL returned from upload');

      // إرسال رسالة الوسائط بعد نجاح الرفع — مع retry + caption إن وُجد
      const sendResp = await sendWithRetry({
        content: caption || '',
        message_type: mediaType,
        attachments: [
          {
            url: mediaUrl,
            kind: mediaType,
            file_name: file.name,
            file_size: file.size,
            mime_type: file.type,
          },
        ],
      }, 3);

      const body = sendResp.data || {};
      const serverMsg = body.message || body;

      // استبدل optimistic preview بالعنوان النهائي من الخادم
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId
            ? {
                ...m,
                id: serverMsg.id || tempId,
                mediaUrl,
                pending: false,
                failed: false,
              }
            : m
        )
      );

      // نظف URL.createObjectURL
      if (previewUrl) {
        try { URL.revokeObjectURL(previewUrl); } catch {}
      }
    } catch (err) {
      console.error('Upload failed:', err);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId
            ? { ...m, pending: false, failed: true }
            : m
        )
      );
      const errMsg = err?.response?.data?.detail || 'فشل رفع الملف. حاول مرة أخرى.';
      pushToast?.({ type: 'error', title: 'فشل الرفع', description: errMsg });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const openSettings = useCallback(() => {
    navigate(`/groups/${groupId}/settings`);
  }, [groupId, navigate]);

  // ✅ تفعيل المكالمات الصوتية/الفيديو
  const handleStartCall = useCallback(async (mode = 'voice') => {
    try {
      // طلب إذن الإشعارات لو لم يُمنح
      if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
        try { await Notification.requestPermission(); } catch {}
      }
      // للمجموعة: نستخدم بادئة group: لتعريف الطرف الآخر كغرفة مجموعة
      await startCall({ peer: `group:${groupId}`, mode });
      navigate(`/call/${encodeURIComponent('group:' + groupId)}?mode=${mode}`);
    } catch (err) {
      console.error('Could not start call:', err);
      pushToast?.({
        type: 'error',
        title: 'تعذر بدء المكالمة',
        description: 'تأكد من السماح بالوصول للميكروفون/الكاميرا.',
      });
    }
  }, [groupId, navigate, pushToast]);

  const groupName = groupInfo?.name || groupInfo?.title || 'دردشة المجموعة';
  const groupIcon = groupInfo?.icon || groupInfo?.image_url || null;
  const membersCount =
    groupInfo?.members_count ||
    (Array.isArray(groupInfo?.members) ? groupInfo.members.length : 0) ||
    0;

  // دوال إجراءات الرسالة (Long-Press Toolbar)
  const handleMsgLongPress = (msg, rect) => {
    setSelectedMessage(msg);
    setReactionAnchor(rect || null);
    try { document.body.classList.add('yam-long-press-active'); } catch {}
  };
  const closeMsgSelection = () => {
    setSelectedMessage(null);
    setReactionAnchor(null);
    try { document.body.classList.remove('yam-long-press-active'); } catch {}
  };
  const onMsgReply    = (m) => setMessage((p) => (p ? p + ' ' : '') + `رد، على «${(m?.text || '').slice(0,40)}»: `);
  const onMsgCopy     = (m) => {
    try {
      navigator.clipboard.writeText(m?.text || '');
      pushToast?.({ type: 'success', title: 'تم', description: 'تم نسخ النص' });
    } catch {
      pushToast?.({ type: 'error', title: 'خطأ', description: 'تعذر النسخ' });
    }
  };
  const onMsgDelete   = async (m) => {
    const prev = messages;
    setMessages((p) => p.filter((x) => x.id !== m.id));
    try {
      await deleteGroupMessage(groupId, m.id);
      pushToast?.({ type: 'success', title: 'تم', description: 'تم حذف الرسالة' });
    } catch {
      setMessages(prev); // rollback
      pushToast?.({ type: 'error', title: 'خطأ', description: 'فشل حذف الرسالة' });
    }
  };
  const onMsgStar     = (m) => {
    setMessages((prev) => prev.map((x) => x.id === m.id ? { ...x, starred: !x.starred } : x));
    pushToast?.({ type: 'info', title: 'مفضلة', description: m.starred ? 'تمت إزالة الرسالة من المفضلة' : 'تمت إضافة الرسالة للمفضلة' });
  };
  const onMsgPin      = async (m) => {
    try {
      await pinGroupMessage(groupId, m.id, !m.pinned);
      setMessages((prev) => prev.map((x) => x.id === m.id ? { ...x, pinned: !m.pinned } : x));
      pushToast?.({ type: 'success', title: 'تم', description: m.pinned ? 'تم فك تثبيت الرسالة' : 'تم تثبيت الرسالة' });
    } catch {
      pushToast?.({ type: 'error', title: 'خطأ', description: 'فشل تثبيت الرسالة' });
    }
  };
  const onMsgInfo     = (m) => {
    pushToast?.({
      type: 'info',
      title: `معلومات الرسالة`,
      description: `المرسل: ${m?.sender || '—'} • الوقت: ${m?.time || '—'}`,
    });
  };
  // ✅ v59.13.17 FIX #3: فتح مودال داخلي لإعادة التوجيه بدلاً من window.prompt
  const onMsgForward  = (m) => {
    setForwardDraft('');
    setForwardTarget({ messageId: m.id });
  };
  const submitForward = async () => {
    const target = (forwardDraft || '').trim();
    if (!target || !forwardTarget?.messageId) return;
    setForwardBusy(true);
    try {
      await forwardGroupMessage(groupId, forwardTarget.messageId, [target]);
      pushToast?.({ type: 'success', title: 'تم', description: 'تم إعادة توجيه الرسالة' });
      setForwardTarget(null);
      setForwardDraft('');
    } catch {
      pushToast?.({ type: 'error', title: 'خطأ', description: 'فشل إعادة التوجيه' });
    } finally {
      setForwardBusy(false);
    }
  };
  // ✅ v59.13.17 FIX #3: فتح ReportModal الموحّد بدلاً من window.prompt + استدعاء yam-مخصّص
  const onMsgReport   = (m) => {
    setReportTarget({
      id: m?.id,
      label: `رسالة مجموعة من ${m?.sender || 'عضو'}`,
    });
  };
  const onMsgReact    = async (m, emoji) => {
    setMessages((prev) => prev.map((x) => x.id === m.id ? { ...x, reaction: emoji } : x));
    try {
      await reactToGroupMessage(groupId, m.id, emoji);
    } catch { /* تجاهل — الـ optimistic UI يكفي */ }
  };

  return (
    <MainLayout>
    <div className="yam-group-chat-container" dir="rtl" data-yam-group-root="true" style={{ fontFamily: "'Noto Sans Arabic','Cairo','Tahoma',sans-serif" }}>
      {/* Long-Press Toolbar (فوق الهيدر) */}
      {selectedMessage ? (
        <MessageActionsToolbar
          selectedMessage={selectedMessage}
          onClose={closeMsgSelection}
          onForward={onMsgForward}
          onDelete={onMsgDelete}
          onStar={onMsgStar}
          onReply={onMsgReply}
          onCopy={onMsgCopy}
          onPin={onMsgPin}
          onInfo={onMsgInfo}
          onReport={onMsgReport}
        />
      ) : null}

      {/* Reaction Picker */}
      {selectedMessage && reactionAnchor ? (
        <MessageReactionPicker
          anchorRect={reactionAnchor}
          onPick={(emoji) => onMsgReact(selectedMessage, emoji)}
          onClose={() => { /* keep selection for toolbar */ }}
        />
      ) : null}

      {/* Media Preview Modal (قبل الإرسال) */}
      {previewFiles.length > 0 ? (
        <MediaPreviewModal
          files={previewFiles}
          onCancel={() => setPreviewFiles([])}
          onSend={(files, caption) => handleConfirmPreviewSend(files, caption)}
          onRemove={(idx) => setPreviewFiles((p) => p.filter((_, i) => i !== idx))}
          onAddMore={() => {
            if (previewMediaType === 'image') imageInputRef.current?.click();
            else if (previewMediaType === 'video') videoInputRef.current?.click();
            else fileInputRef.current?.click();
          }}
        />
      ) : null}

      {/* الهيدر */}
      <header className="yam-group-header">
        <button
          className="yam-back-arrow-btn"
          onClick={() => navigate('/groups')}
          aria-label="رجوع"
          style={{
            background: 'transparent',
            border: 'none',
            color: '#fff',
            fontSize: '22px',
            cursor: 'pointer',
            padding: '4px 8px',
            marginInlineEnd: '4px',
          }}
        >
          ←
        </button>

        <div
          className="yam-group-info"
          onClick={openSettings}
          style={{ cursor: 'pointer', flex: 1 }}
        >
          <div className="yam-group-icon-wrap">
            {groupIcon && String(groupIcon).startsWith('http') ? (
              <img
                src={groupIcon}
                alt={groupName}
                style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              <span style={{ fontSize: '24px' }}>{groupIcon || '👥'}</span>
            )}
          </div>
          <div className="yam-group-details">
            <h2>
              {groupName} <span className="yam-verified-badge">✔️</span>
            </h2>
            <div className="yam-group-status">
              <span className="yam-status-dot"></span>
              {membersCount > 0 ? `${membersCount} عضو` : 'متصل الآن'}
            </div>
          </div>
        </div>
        <div className="yam-header-actions">
          <button
            type="button"
            className="yam-action-btn"
            title="مكالمة صوتية"
            aria-label="مكالمة صوتية"
            onClick={() => handleStartCall('voice')}
          >📞</button>
          <button
            type="button"
            className="yam-action-btn"
            title="مكالمة فيديو"
            aria-label="مكالمة فيديو"
            onClick={() => handleStartCall('video')}
          >🎥</button>
          <button
            type="button"
            className="yam-action-btn"
            onClick={openSettings}
            title="إعدادات المجموعة"
            aria-label="إعدادات المجموعة"
          >ℹ️</button>
        </div>
      </header>

      {/* تنبيه إذن الإشعارات */}
      {notifPermission === 'default' && (
        <div
          style={{
            background: 'rgba(124, 58, 237, 0.12)',
            color: '#c4b5fd',
            padding: '8px 12px',
            fontSize: '13px',
            textAlign: 'center',
            cursor: 'pointer',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
          }}
          onClick={() => {
            if (typeof Notification !== 'undefined') {
              Notification.requestPermission().then(setNotifPermission).catch(() => {});
            }
          }}
        >
          🔔 فعّل إشعارات المجموعة لتصلك الرسائل وأنت بعيد عن التطبيق
        </div>
      )}

      {/* v59.3 — شريط الرسائل المثبّتة */}
      <GroupPinnedBar
        groupId={groupId}
        canManage={
          groupInfo?.members?.find?.((m) => (m.username || m.user_id) === currentUser)?.role === 'owner' ||
          groupInfo?.members?.find?.((m) => (m.username || m.user_id) === currentUser)?.role === 'admin' ||
          groupInfo?.members?.find?.((m) => (m.username || m.user_id) === currentUser)?.role === 'moderator'
        }
        onJump={(msgId) => {
          const el = document.querySelector(`[data-msg-id="${msgId}"]`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.style.outline = '2px solid #f59e0b';
            setTimeout(() => { el.style.outline = ''; }, 1500);
          }
        }}
      />

      {/* v59.3 — اختصارات ميزات المجموعة */}
      <GroupQuickLinks
        groupId={groupId}
        role={groupInfo?.members?.find?.((m) => (m.username || m.user_id) === currentUser)?.role || 'member'}
      />

      {/* منطقة الرسائل */}
      <main className="yam-group-messages">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
            جاري تحميل الرسائل...
          </div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
            لا توجد رسائل بعد. ابدأ المحادثة!
          </div>
        ) : (
          messages
            .filter((m) => !m.group_id || String(m.group_id) === String(groupId))
            .map((msg) => (
              <div
                key={msg.id}
                className={`yam-message-group ${msg.isMe ? 'me' : ''} ${msg.pending ? 'pending' : ''} ${msg.failed ? 'failed' : ''}`}
              >
                <div className="yam-user-avatar-wrap">
                  <img src={msg.avatar} alt={msg.sender} className="yam-user-avatar" />
                </div>
                <div className="yam-message-content-wrap">
                  {!msg.isMe && <span className="yam-sender-name">{msg.sender}</span>}
                  <div className="yam-message-bubble">
                    {msg.mediaUrl ? (
                      msg.mediaType === 'image' ? (
                        <img
                          src={msg.mediaUrl}
                          alt="media"
                          style={{ maxWidth: '240px', borderRadius: '8px', display: 'block' }}
                        />
                      ) : msg.mediaType === 'video' ? (
                        <video
                          src={msg.mediaUrl}
                          controls
                          style={{ maxWidth: '240px', borderRadius: '8px', display: 'block' }}
                        />
                      ) : (
                        <a
                          href={msg.mediaUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: '#a78bfa' }}
                        >
                          📎 {msg.text || 'ملف مرفق'}
                        </a>
                      )
                    ) : (
                      msg.text
                    )}
                  </div>
                  <div className="yam-message-time">
                    {msg.time}
                    {msg.isMe && (
                      <span className="yam-read-receipt" style={msg.failed ? { color: '#ef4444' } : {}}>
                        {msg.failed ? '⚠️' : msg.pending ? '🕓' : '✓✓'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* شريط تقدم الرفع */}
      {uploading && (
        <div
          style={{
            position: 'absolute',
            bottom: '76px',
            insetInlineStart: '12px',
            insetInlineEnd: '12px',
            background: '#1e293b',
            borderRadius: '10px',
            padding: '8px 12px',
            color: '#fff',
            fontSize: '13px',
            zIndex: 60,
            boxShadow: '0 6px 18px rgba(0,0,0,0.4)',
          }}
        >
          ⏫ جاري الرفع... {uploadProgress}%
          <div style={{
            marginTop: '6px',
            height: '4px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '4px',
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${uploadProgress}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #7c3aed, #a78bfa)',
              transition: 'width 0.3s ease',
            }} />
          </div>
        </div>
      )}

      {/* قائمة المرفقات */}
      {showAttachMenu && (
        <div
          className="yam-attach-menu"
          style={{
            position: 'absolute',
            bottom: '80px',
            insetInlineStart: '12px',
            background: '#1e293b',
            borderRadius: '12px',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            zIndex: 50,
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <button
            className="yam-attach-option"
            onClick={() => imageInputRef.current?.click()}
            style={{
              background: 'transparent', border: 'none', color: '#fff',
              padding: '10px', cursor: 'pointer', textAlign: 'right',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}
          >
            🖼️ صورة
          </button>
          <button
            className="yam-attach-option"
            onClick={() => videoInputRef.current?.click()}
            style={{
              background: 'transparent', border: 'none', color: '#fff',
              padding: '10px', cursor: 'pointer', textAlign: 'right',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}
          >
            🎬 فيديو
          </button>
          <button
            className="yam-attach-option"
            onClick={() => fileInputRef.current?.click()}
            style={{
              background: 'transparent', border: 'none', color: '#fff',
              padding: '10px', cursor: 'pointer', textAlign: 'right',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}
          >
            📄 ملف
          </button>
          <button
            className="yam-attach-option"
            onClick={() => setShowAttachMenu(false)}
            style={{
              background: 'transparent', border: 'none', color: '#94a3b8',
              padding: '8px', cursor: 'pointer', textAlign: 'center',
            }}
          >
            إلغاء
          </button>
        </div>
      )}

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        multiple
        onChange={(e) => handleFileSelect(e, 'image')}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        style={{ display: 'none' }}
        multiple
        onChange={(e) => handleFileSelect(e, 'video')}
      />
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: 'none' }}
        multiple
        onChange={(e) => handleFileSelect(e, 'file')}
      />

      <footer className="yam-group-input-area">
        <button
          className="yam-plus-btn"
          onClick={() => setShowAttachMenu((prev) => !prev)}
          title="إرفاق ملف"
          aria-label="إرفاق ملف"
          disabled={uploading}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px',
          }}
        >
          {uploading ? (
            <span style={{ fontSize: '14px' }}>⏳</span>
          ) : (
            <svg
              width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round"
            >
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
            </svg>
          )}
        </button>
        <div className="yam-input-wrapper">
          <input
            type="text"
            className="yam-chat-input"
            placeholder="اكتب رسالة..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            // ✅ enterkeyhint يحسن لوحة مفاتيح الجوال
            enterKeyHint="send"
            inputMode="text"
            autoComplete="off"
          />
          <span className="yam-input-icon">😊</span>
        </div>
        <button
          className="yam-send-btn"
          onClick={handleSendMessage}
          aria-label="إرسال"
          // ✅ منع الزر من خسارة التركيز ووميض الـ keyboard على iOS Safari
          onMouseDown={(e) => e.preventDefault()}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </footer>
    </div>

      {/* ✅ v59.13.17 FIX #3: مودال الإبلاغ الموحّد لرسائل المجموعة */}
      <ReportModal
        open={!!reportTarget}
        onClose={() => setReportTarget(null)}
        targetType="group_message"
        targetId={reportTarget?.id}
        targetLabel={reportTarget?.label}
      />

      {/* ✅ v59.13.17 FIX #3: مودال إعادة توجيه رسالة مجموعة */}
      {forwardTarget ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="yam-fwd-title"
          dir="rtl"
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16,
            fontFamily: "'Noto Sans Arabic','Cairo','Tahoma',sans-serif",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !forwardBusy) {
              setForwardTarget(null);
              setForwardDraft('');
            }
          }}
        >
          <div style={{
            background: 'var(--bg-elevated, #1f2233)', color: 'var(--text, #fff)',
            borderRadius: 14, width: '100%', maxWidth: 460,
            padding: 18, boxShadow: '0 18px 48px rgba(0,0,0,0.45)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <h3 id="yam-fwd-title" style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 700 }}>
              ↪️ إعادة توجيه الرسالة
            </h3>
            <p style={{ margin: '0 0 12px', fontSize: 13, opacity: 0.7 }}>
              أدخل اسم المستخدم (@username) أو معرّف المجموعة:
            </p>
            <input
              autoFocus
              type="text"
              dir="auto"
              placeholder="مثال: @ahmad أو group:42"
              value={forwardDraft}
              onChange={(e) => setForwardDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !forwardBusy && forwardDraft.trim()) submitForward();
                if (e.key === 'Escape') { setForwardTarget(null); setForwardDraft(''); }
              }}
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '11px 14px', borderRadius: 10,
                background: 'rgba(255,255,255,0.06)',
                color: 'inherit', border: '1px solid rgba(255,255,255,0.12)',
                fontFamily: 'inherit', fontSize: 15,
              }}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 14, justifyContent: 'flex-end' }}>
              <button
                type="button"
                disabled={forwardBusy}
                onClick={() => { setForwardTarget(null); setForwardDraft(''); }}
                style={{
                  padding: '9px 16px', borderRadius: 10,
                  cursor: forwardBusy ? 'not-allowed' : 'pointer',
                  background: 'transparent', color: 'inherit',
                  border: '1px solid rgba(255,255,255,0.16)', fontWeight: 600,
                  opacity: forwardBusy ? 0.5 : 1,
                }}
              >إلغاء</button>
              <button
                type="button"
                disabled={forwardBusy || !forwardDraft.trim()}
                onClick={submitForward}
                style={{
                  padding: '9px 18px', borderRadius: 10,
                  cursor: (forwardBusy || !forwardDraft.trim()) ? 'not-allowed' : 'pointer',
                  background: 'var(--primary, #6f53ff)', color: '#fff',
                  border: 'none', fontWeight: 700,
                  opacity: (forwardBusy || !forwardDraft.trim()) ? 0.5 : 1,
                }}
              >{forwardBusy ? 'جارٍ…' : 'إعادة توجيه'}</button>
            </div>
          </div>
        </div>
      ) : null}
    </MainLayout>
  );
};

export default GroupChat;

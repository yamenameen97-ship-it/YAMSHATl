import { useEffect, useMemo, useRef, useState } from 'react';
import VoiceRecorder from './VoiceRecorder.jsx';
import PressToRecordMic from './PressToRecordMic.jsx';
import VoiceMessagePlayer from '../ui/VoiceMessagePlayer.jsx';
import socketManager from '../../services/socketManager.js';
import mediaUploadService from '../../services/media/mediaUploadService.js';
import signalProtocolService from '../../services/chat/signalProtocol.js';
import { DISAPPEARING_MESSAGE_OPTIONS } from '../../config/mediaConfig.js';
import { clearChatDraft, loadChatDraft, persistChatDraft } from '../../features/chat/chatDrafts.js';
import { MESSAGE_LIFECYCLE } from '../../features/chat/messageLifecycle.js';

const EMOJI_SET = ['😀', '😂', '😍', '🥹', '👍', '👏', '🔥', '❤️', '💜', '😮', '🤝', '🎉'];

function emitToast(detail) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('yamshat:toast', { detail }));
}

function attachmentKind(file) {
  if (file?.type?.startsWith('image/')) return 'image';
  if (file?.type?.startsWith('video/')) return 'video';
  if (file?.type?.startsWith('audio/')) return 'audio';
  return 'file';
}

function createAttachmentEntry(file) {
  const kind = attachmentKind(file);
  const previewUrl = ['image', 'video', 'audio'].includes(kind) ? URL.createObjectURL(file) : '';
  return {
    id: `attachment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    file,
    kind,
    previewUrl,
    status: MESSAGE_LIFECYCLE.QUEUED,
    progress: 0,
    stage: MESSAGE_LIFECYCLE.QUEUED,
    error: '',
    uploadResult: null,
  };
}

function revokeAttachments(entries = []) {
  entries.forEach((entry) => {
    if (entry?.previewUrl) URL.revokeObjectURL(entry.previewUrl);
  });
}

function normalizeUploadedAttachment(upload = {}, file, extras = {}) {
  const kind = extras?.kind || upload?.kind || upload?.type || upload?.mediaType || attachmentKind(file);
  const mimeType = extras?.mime_type || extras?.mimeType || upload?.mime_type || upload?.mimeType || file?.type || upload?.preparedFile?.type || '';
  const fileName = extras?.file_name || extras?.fileName || upload?.file_name || upload?.fileName || upload?.originalName || file?.name || '';
  const fileSize = Number(extras?.file_size || extras?.size || upload?.file_size || upload?.size || upload?.originalSize || file?.size || 0) || undefined;
  const durationSeconds = Number(
    extras?.duration_seconds
    || extras?.audio_duration_seconds
    || upload?.duration_seconds
    || upload?.audio_duration_seconds
    || 0,
  ) || undefined;

  return {
    ...upload,
    ...extras,
    kind,
    type: extras?.type || kind,
    url: extras?.url || upload?.url || upload?.media_url || upload?.mediaUrl || '',
    media_url: extras?.media_url || upload?.media_url || upload?.mediaUrl || upload?.url || '',
    cdn_url: extras?.cdn_url || upload?.cdn_url || upload?.cdnUrl || upload?.url || upload?.mediaUrl || '',
    thumbnail_url: extras?.thumbnail_url || upload?.thumbnail_url || upload?.thumbnailUrl || '',
    mime_type: mimeType || undefined,
    file_name: fileName || undefined,
    file_size: fileSize,
    duration_seconds: durationSeconds,
    audio_duration_seconds: durationSeconds,
    waveform: extras?.waveform || upload?.waveform || null,
    waveform_seed: extras?.waveform_seed || upload?.waveform_seed || null,
    originalName: fileName || upload?.originalName || file?.name || '',
    originalSize: fileSize,
    mediaType: upload?.mediaType || kind,
  };
}

function timerLabel(value) {
  const option = DISAPPEARING_MESSAGE_OPTIONS.find((item) => Number(item.value) === Number(value));
  return option?.label || 'بدون';
}

function getAttachmentAccent(kind) {
  if (kind === 'image') return 'linear-gradient(135deg, rgba(34,197,94,0.26), rgba(16,185,129,0.12))';
  if (kind === 'video') return 'linear-gradient(135deg, rgba(59,130,246,0.24), rgba(14,165,233,0.12))';
  if (kind === 'audio') return 'linear-gradient(135deg, rgba(236,72,153,0.24), rgba(168,85,247,0.14))';
  return 'linear-gradient(135deg, rgba(148,163,184,0.2), rgba(71,85,105,0.1))';
}

function formatAttachmentMeta(entry) {
  const sizeMb = (Number(entry?.file?.size || 0) / (1024 * 1024)).toFixed(1);
  const sizeLabel = Number.isFinite(Number(sizeMb)) ? `${sizeMb} م.ب` : '';
  const stageLabel = entry?.error ? 'فشل' : entry?.stage || 'جاهز';
  return [stageLabel, sizeLabel].filter(Boolean).join(' • ');
}

export default function ChatInput({ currentUser, replyTo, onCancelReply, onSend, peer, securitySnapshot, disabled = false, compact = false }) {
  const [text, setText] = useState('');
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  // ✅ v86.9: بنر خطأ التسجيل الصوتي (غير حاجب)
  const [voiceError, setVoiceError] = useState('');
  const voiceErrorTimerRef = useRef(null);
  const [attachments, setAttachments] = useState([]);
  const [sending, setSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [messageTimer, setMessageTimer] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [inputExpanded, setInputExpanded] = useState(false);
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);
  const fileInputRef = useRef(null);
  const attachmentsRef = useRef([]);
  const textareaRef = useRef(null);
  const emojiPickerRef = useRef(null);
  // ✅ FIX v59.13.8 (#4): isMountedRef لحماية uploadAttachment الـ async
  //    + لتنظيف blob URLs المتراكمة عند تبديل peer.
  const isMountedRef = useRef(true);
  // ✅ v59.13.12 FIX #4: تتبّع كل AbortControllers للرفع الجارٍ
  //    وإلغاؤها عند تبديل peer أو unmount — لمنع إرسال مرفقات لمحادثة خاطئة.
  const uploadControllersRef = useRef(new Set());
  const abortAllUploads = () => {
    uploadControllersRef.current.forEach((c) => { try { c.abort?.(); } catch { /* ignore */ } });
    uploadControllersRef.current.clear();
  };

  useEffect(() => {
    attachmentsRef.current = attachments;
  }, [attachments]);

  // ✅ FIX v59.13.8 (#4): عند تبديل المحادثة (peer)، يجب تحرير بلوبات المرفقات
  //    السابقة و إفراغ المصفوفة — وإلّا تتراكم blob URLs في الذاكرة
  //    و المرفقات السابقة تظهر في محادثة جديدة بسبب بقاء attachments state.
  useEffect(() => {
    if (!peer) {
      setText('');
      // ✅ v59.13.12 FIX #4: ألغِ أي رفع جارٍ قبل إفراغ المرفقات
      abortAllUploads();
      if (attachmentsRef.current.length) {
        revokeAttachments(attachmentsRef.current);
        setAttachments([]);
      }
      return;
    }
    // ✅ v59.13.12 FIX #4: ألغِ رفع المحادثة السابقة حتى لا تصل إلى peer الجديد
    abortAllUploads();
    if (attachmentsRef.current.length) {
      revokeAttachments(attachmentsRef.current);
      setAttachments([]);
    }
    setText(loadChatDraft(currentUser, peer));
  }, [currentUser, peer]);

  useEffect(() => () => {
    isMountedRef.current = false;
    // ✅ v59.13.12 FIX #4: ألغِ أي رفع جارٍ عند unmount
    abortAllUploads();
    revokeAttachments(attachmentsRef.current);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    // ✅ v86.9: نظّف مؤقّت رسالة خطأ التسجيل
    if (voiceErrorTimerRef.current) window.clearTimeout(voiceErrorTimerRef.current);
  }, []);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = '0px';
    const nextHeight = Math.min(textarea.scrollHeight, compact ? 180 : 220);
    textarea.style.height = `${Math.max(compact ? 52 : 56, nextHeight)}px`;
    setInputExpanded(nextHeight > (compact ? 72 : 86));
  }, [compact, text]);

  useEffect(() => {
    if (!showEmojiPicker) return undefined;
    const handlePointerDown = (event) => {
      if (emojiPickerRef.current?.contains(event.target)) return;
      setShowEmojiPicker(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [showEmojiPicker]);

  const pendingAttachmentCount = useMemo(
    () => attachments.filter((item) => item.status === MESSAGE_LIFECYCLE.QUEUED || item.status === MESSAGE_LIFECYCLE.UPLOADING || item.status === MESSAGE_LIFECYCLE.PENDING_UPLOAD).length,
    [attachments],
  );

  const composerDisabled = disabled || !peer;

  const stopTyping = () => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (!isTypingRef.current) return;
    isTypingRef.current = false;
    if (peer) {
      socketManager.emit('chat_typing', { receiver: peer, is_typing: false });
    }
  };

  const emitRecordingState = (value) => {
    if (composerDisabled) return;
    setIsRecording(value === 'recording' || value === 'paused');
    if (peer) {
      socketManager.emit('chat_recording', { receiver: peer, is_recording: value === 'recording' || value === 'paused' });
    }
  };

  const handleTyping = (nextValue) => {
    if (composerDisabled) return;
    setText(nextValue);
    persistChatDraft(currentUser, peer, nextValue);
    if (!peer) return;
    if (!isTypingRef.current && nextValue.trim()) {
      isTypingRef.current = true;
      socketManager.emit('chat_typing', { receiver: peer, is_typing: true });
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(stopTyping, 1800);
  };

  const updateAttachment = (attachmentId, patch) => {
    setAttachments((prev) => prev.map((item) => item.id === attachmentId ? { ...item, ...(patch || {}) } : item));
  };

  const resetComposer = () => {
    revokeAttachments(attachments);
    setText('');
    clearChatDraft(currentUser, peer);
    setAttachments([]);
    setSending(false);
    setShowVoiceRecorder(false);
    setIsRecording(false);
    setShowEmojiPicker(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (onCancelReply) onCancelReply();
    stopTyping();
    if (peer) socketManager.emit('chat_recording', { receiver: peer, is_recording: false });
  };

  const handleFilesAdded = (fileList) => {
    if (composerDisabled) return;
    const files = Array.from(fileList || []);
    if (!files.length) return;

    const accepted = [];
    const rejected = [];

    files.forEach((file) => {
      try {
        mediaUploadService.validate(file);
        accepted.push(createAttachmentEntry(file));
      } catch (error) {
        rejected.push({ file, error: error?.message || 'ملف غير صالح' });
      }
    });

    if (accepted.length) {
      setAttachments((prev) => [...prev, ...accepted]);
      setShowVoiceRecorder(false);
    }

    if (rejected.length) {
      emitToast({
        type: 'error',
        title: 'بعض الملفات مرفوضة',
        description: rejected.map((item) => `${item.file.name}: ${item.error}`).join(' | '),
      });
    }
  };

  const removeAttachment = (attachmentId) => {
    setAttachments((prev) => {
      const target = prev.find((item) => item.id === attachmentId);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.id !== attachmentId);
    });
  };

  const uploadAttachment = async (entry) => {
    // ✅ FIX v59.13.8 (#4): حراسة setState في onProgress و بعد await
    //    سيناريو الخلل: رفع 5 مرفقات فيديو كبيرة ثم تبديل المحادثة أو إغلاق الشات:
    //    onProgress يستمر يستدعي updateAttachment → setAttachments على مكوّن مُزال
    //    + تحديث status على مرفقات المحادثة السابقة إذا لم يتم تنظيفها.
    updateAttachment(entry.id, { status: MESSAGE_LIFECYCLE.PENDING_UPLOAD, progress: 0, stage: 'preparing', error: '' });
    // ✅ v59.13.12 FIX #4: أنشئ AbortController لهذا الرفع
    const controller = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    if (controller) uploadControllersRef.current.add(controller);
    try {
      const uploadResult = await mediaUploadService.uploadFile(entry.file, {
        signal: controller?.signal,
        onProgress: (payload) => {
          if (!isMountedRef.current) return;
          updateAttachment(entry.id, {
            status: payload?.percent >= 100 ? MESSAGE_LIFECYCLE.SYNCING : MESSAGE_LIFECYCLE.UPLOADING,
            progress: Number(payload?.percent || 0),
            stage: payload?.stage || 'uploading',
          });
        },
      });
      if (!isMountedRef.current) return uploadResult;
      updateAttachment(entry.id, { status: MESSAGE_LIFECYCLE.SYNCING, progress: 100, stage: 'done', uploadResult });
      return uploadResult;
    } catch (error) {
      // ✅ v59.13.12 FIX #4: تجاهل أخطاء AbortController (إلغاء مقصود)
      const aborted = error?.name === 'AbortError' || error?.code === 'ERR_CANCELED' || controller?.signal?.aborted;
      if (isMountedRef.current && !aborted) {
        updateAttachment(entry.id, { status: MESSAGE_LIFECYCLE.FAILED, error: error?.message || 'فشل الرفع', stage: 'failed' });
      }
      throw error;
    } finally {
      if (controller) uploadControllersRef.current.delete(controller);
    }
  };

  const buildMessageSecurityPayload = async (plainText) => {
    if (!currentUser || !peer || !plainText.trim()) return null;
    try {
      return await signalProtocolService.encryptMessage({
        username: currentUser,
        peer,
        plaintext: plainText.trim(),
      });
    } catch (error) {
      emitToast({ type: 'warning', title: 'تعذر تجهيز طبقة التشفير', description: error?.message || 'سيتم الإرسال بتوافقية مؤقتة.' });
      return null;
    }
  };

  const handleSend = async () => {
    if (composerDisabled || sending || (!text.trim() && attachments.length === 0)) return;
    setSending(true);

    try {
      const uploadResults = await Promise.all(attachments.map((entry) => uploadAttachment(entry)));
      const normalizedUploads = uploadResults.map((item, index) => normalizeUploadedAttachment(item, attachments[index]?.file, {
        kind: attachments[index]?.kind,
      }));
      const securityPayload = await buildMessageSecurityPayload(text);
      await onSend?.({
        text: text.trim(),
        media_url: normalizedUploads[0]?.media_url || normalizedUploads[0]?.url || '',
        media_urls: normalizedUploads.map((item) => item.media_url || item.url).filter(Boolean),
        attachments: normalizedUploads,
        type: normalizedUploads.length ? (normalizedUploads[0]?.type || normalizedUploads[0]?.mediaType || 'media') : 'text',
        replyTo,
        securityPayload,
        disappearing_in_seconds: Number(messageTimer || 0),
        message_status: {
          sent: false,
          delivered: false,
          seen: false,
          typing: false,
          recording: false,
        },
      });
      resetComposer();
    } catch (error) {
      emitToast({
        type: 'error',
        title: 'تعذر إرسال الرسالة',
        description: error?.response?.data?.detail || error?.message || 'حاول مرة تانية.',
      });
      setSending(false);
    }
  };

  const handleVoiceSend = async (voicePayload) => {
    if (composerDisabled) return;
    setSending(true);
    try {
      const upload = await mediaUploadService.uploadVoiceNote(voicePayload.file, {
        fileName: voicePayload.file.name,
        onProgress: () => {},
      });
      const voiceAttachment = normalizeUploadedAttachment(upload, voicePayload.file, {
        kind: 'voice',
        type: 'voice',
        duration_seconds: voicePayload.durationSeconds,
        audio_duration_seconds: voicePayload.durationSeconds,
        waveform_seed: voicePayload.waveformSeed,
        waveform: voicePayload.waveformSeed,
      });
      await onSend?.({
        text: '',
        media_url: voiceAttachment.media_url,
        media_urls: [voiceAttachment.media_url].filter(Boolean),
        attachments: [voiceAttachment],
        type: 'voice',
        waveform_seed: voicePayload.waveformSeed,
        audio_duration_seconds: voicePayload.durationSeconds,
        replyTo,
        securityPayload: null,
        disappearing_in_seconds: Number(messageTimer || 0),
        message_status: {
          sent: false,
          delivered: false,
          seen: false,
          typing: false,
          recording: false,
        },
      });
      resetComposer();
    } catch (error) {
      emitToast({ type: 'error', title: 'فشل إرسال التسجيل', description: error?.message || 'جرّب مرة تانية.' });
      setSending(false);
    }
  };

  const appendEmoji = (emoji) => {
    const nextValue = `${text}${emoji}`;
    handleTyping(nextValue);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  const signalSummary = securitySnapshot?.enabled
    ? `${securitySnapshot.protocol || 'Signal'} • ${securitySnapshot.status || 'ready'}`
    : 'Signal bootstrap pending';

  return (
    <div className={`yam-composer-shell ${compact ? 'compact' : ''} ${inputExpanded ? 'expanded' : ''}`} dir="rtl" style={{ fontFamily: "'Noto Sans Arabic', 'Tajawal', system-ui, sans-serif" }}>
      <style>{`
        .yam-composer-shell {
          position: relative;
          display: grid;
          gap: 12px;
          padding: 14px;
          border-radius: 28px;
          border: 1px solid rgba(255,255,255,0.08);
          background: linear-gradient(180deg, rgba(6,10,23,0.96), rgba(10,15,31,0.98));
          box-shadow: 0 24px 50px rgba(0,0,0,0.26), inset 0 1px 0 rgba(255,255,255,0.05);
          transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
        }
        .yam-composer-shell.compact {
          border-radius: 26px;
          padding: 12px;
        }
        .yam-composer-shell.expanded {
          border-color: rgba(167,139,250,0.28);
          box-shadow: 0 24px 60px rgba(79,70,229,0.18), inset 0 1px 0 rgba(255,255,255,0.06);
        }
        .yam-composer-top,
        .yam-composer-footer,
        .yam-reply-banner,
        .yam-attachments-grid,
        .yam-composer-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .yam-composer-top,
        .yam-composer-footer {
          justify-content: space-between;
          flex-wrap: wrap;
        }
        .yam-composer-chip,
        .yam-timer-select,
        .yam-emoji-btn,
        .yam-action-btn,
        .yam-send-btn,
        .yam-ghost-btn {
          transition: all 180ms ease;
        }
        .yam-composer-chip {
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.05);
          color: #dbe4ff;
          padding: 8px 12px;
          font-size: 12px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .yam-timer-select {
          min-height: 38px;
          border-radius: 999px;
          padding: 0 12px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(15,23,42,0.94);
          color: #fff;
          outline: none;
        }
        .yam-reply-banner {
          justify-content: space-between;
          align-items: flex-start;
          padding: 12px 14px;
          border-radius: 20px;
          border: 1px solid rgba(167,139,250,0.18);
          background: linear-gradient(135deg, rgba(124,58,237,0.18), rgba(59,130,246,0.08));
        }
        .yam-reply-copy {
          min-width: 0;
          display: grid;
          gap: 4px;
          border-right: 3px solid rgba(196,181,253,0.9);
          padding-right: 10px;
        }
        .yam-reply-copy strong,
        .yam-reply-copy span,
        .yam-attachment-copy strong,
        .yam-attachment-copy span {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .yam-reply-copy span {
          color: #dbe4ff;
          opacity: 0.78;
          font-size: 13px;
        }
        .yam-attachments-grid {
          flex-wrap: wrap;
          align-items: stretch;
          max-height: 220px;
          overflow-y: auto;
          overflow-x: hidden;
          padding-inline-end: 4px;
        }
        .yam-attachments-grid::-webkit-scrollbar {
          width: 6px;
        }
        .yam-attachments-grid::-webkit-scrollbar-thumb {
          background: rgba(148,163,184,0.35);
          border-radius: 999px;
        }
        .yam-attachment-card {
          position: relative;
          min-width: 0;
          flex: 1 1 220px;
          display: grid;
          gap: 10px;
          padding: 12px;
          border-radius: 22px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.035);
          overflow: hidden;
        }
        .yam-attachment-card::before {
          content: '';
          position: absolute;
          inset: 0;
          opacity: 0.9;
          pointer-events: none;
        }
        .yam-attachment-preview {
          width: 100%;
          height: 110px;
          border-radius: 16px;
          object-fit: cover;
          background: rgba(255,255,255,0.04);
        }
        .yam-attachment-head,
        .yam-attachment-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
        .yam-attachment-head {
          align-items: flex-start;
        }
        .yam-attachment-copy {
          min-width: 0;
          display: grid;
          gap: 4px;
        }
        .yam-attachment-copy span {
          color: #94a3b8;
          font-size: 12px;
        }
        .yam-progress-track {
          height: 6px;
          width: 100%;
          border-radius: 999px;
          overflow: hidden;
          background: rgba(255,255,255,0.08);
        }
        .yam-progress-fill {
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #8b5cf6, #4f46e5);
        }
        .yam-composer-textrow {
          display: flex;
          align-items: stretch;
          width: 100%;
          min-width: 0;
        }
        .yam-composer-textrow .yam-input-frame {
          flex: 1 1 100%;
          width: 100%;
        }
        .yam-composer-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: nowrap;
          min-width: 0;
          gap: 8px;
        }
        .yam-composer-actions {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          position: relative;
          flex-shrink: 0;
          flex-wrap: wrap;
        }
        .yam-action-btn,
        .yam-emoji-btn,
        .yam-ghost-btn {
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.05);
          color: #fff;
          width: 44px;
          height: 44px;
          min-width: 44px;
          min-height: 44px;
          border-radius: 14px;
          display: inline-grid;
          place-items: center;
          font-size: 18px;
          cursor: pointer;
        }
        .yam-action-btn:hover,
        .yam-emoji-btn:hover,
        .yam-ghost-btn:hover,
        .yam-send-btn:hover {
          transform: translateY(-1px);
          border-color: rgba(167,139,250,0.28);
          background: rgba(124,58,237,0.14);
        }
        .yam-action-btn.active,
        .yam-emoji-btn.active {
          background: linear-gradient(135deg, rgba(124,58,237,0.28), rgba(79,70,229,0.22));
          border-color: rgba(167,139,250,0.34);
        }
        .yam-input-frame {
          flex: 1;
          min-width: 0;
          display: flex;
          align-items: flex-end;
          gap: 10px;
          border-radius: 24px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(15,23,42,0.92);
          padding: 8px 10px 8px 14px;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.03);
        }
        .yam-input-frame textarea {
          flex: 1;
          min-width: 0;
          resize: none;
          border: none;
          outline: none;
          background: transparent;
          color: #fff;
          line-height: 1.55;
          font-size: 15px;
          font-family: inherit;
          overflow-y: auto;
        }
        .yam-input-frame textarea::placeholder {
          color: #94a3b8;
        }
        .yam-send-btn {
          border: none;
          min-width: 48px;
          width: 48px;
          height: 48px;
          border-radius: 16px;
          background: linear-gradient(135deg, #8b5cf6, #4f46e5);
          color: #fff;
          font-weight: 800;
          padding: 0;
          box-shadow: 0 12px 24px rgba(79,70,229,0.32);
          flex: 0 0 auto;
          display: inline-grid;
          place-items: center;
          cursor: pointer;
        }
        .yam-send-btn:disabled,
        .yam-action-btn:disabled,
        .yam-emoji-btn:disabled,
        .yam-ghost-btn:disabled,
        .yam-timer-select:disabled {
          opacity: 0.55;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
        .yam-emoji-popover {
          position: absolute;
          bottom: calc(100% + 10px);
          right: 0;
          width: min(320px, calc(100vw - 32px));
          border-radius: 22px;
          padding: 14px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(8,13,27,0.98);
          box-shadow: 0 24px 60px rgba(0,0,0,0.32);
          z-index: 30;
          display: grid;
          gap: 10px;
        }
        .yam-emoji-grid {
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 8px;
        }
        .yam-emoji-tile {
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.04);
          border-radius: 14px;
          height: 42px;
          font-size: 20px;
        }
        .yam-composer-footer {
          color: #94a3b8;
          font-size: 11px;
        }
        @media (max-width: 980px) {
          .yam-composer-shell {
            border-radius: 18px;
            padding: 6px 8px;
            gap: 4px;
            box-shadow: 0 -6px 18px rgba(0,0,0,0.22);
            position: relative;
            z-index: 1;
            width: 100%;
            box-sizing: border-box;
            min-width: 0;
          }
          .yam-attachments-grid {
            max-height: 156px;
          }
          .yam-composer-row {
            gap: 6px;
            flex-wrap: nowrap !important;
            align-items: center;
            justify-content: space-between;
            min-width: 0;
            width: 100%;
          }
          .yam-composer-actions {
            width: auto;
            justify-content: flex-start;
            flex-shrink: 0;
            gap: 4px;
            flex-wrap: nowrap !important;
          }
          .yam-composer-textrow {
            width: 100%;
            margin-bottom: 4px;
          }
          .yam-composer-textrow .yam-input-frame {
            width: 100%;
            flex: 1 1 100%;
          }
          .yam-input-frame {
            width: 100%;
            flex: 1 1 100%;
            min-width: 0;
            padding: 4px 10px;
            border-radius: 20px;
            align-items: center;
          }
          .yam-input-frame textarea {
            min-width: 0;
            width: 100%;
            font-size: 16px;
            line-height: 1.4;
            min-height: 36px;
            max-height: 110px;
            padding: 6px 0;
            word-break: break-word;
            overflow-wrap: anywhere;
          }
          .yam-action-btn,
          .yam-emoji-btn,
          .yam-ghost-btn {
            width: 36px;
            height: 36px;
            min-width: 36px;
            min-height: 36px;
            border-radius: 10px;
            font-size: 15px;
            flex-shrink: 0;
          }
          .yam-send-btn {
            min-width: 44px;
            width: 44px;
            height: 44px;
            border-radius: 14px;
            padding: 0;
            font-size: 16px;
            flex-shrink: 0 !important;
            display: inline-grid !important;
            place-items: center;
          }
          .yam-emoji-grid {
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }
          .yam-composer-footer {
            display: none !important;
          }
          .yam-composer-top {
            display: none !important;
          }
        }
        @media (max-width: 480px) {
          .yam-action-btn,
          .yam-emoji-btn,
          .yam-ghost-btn {
            width: 34px;
            height: 34px;
            min-width: 34px;
            min-height: 34px;
            border-radius: 10px;
            font-size: 14px;
          }
          .yam-composer-actions {
            gap: 3px;
          }
          .yam-input-frame {
            padding: 4px 8px;
          }
          .yam-send-btn {
            width: 42px;
            height: 42px;
            min-width: 42px;
            flex-shrink: 0 !important;
          }
          .yam-composer-row {
            gap: 4px !important;
          }
        }
        @media (max-width: 360px) {
          /* أصغر الأحجام للهواتف الضيقة جداً حتى يظهر زر الإرسال بجانب بقية الأزرار */
          .yam-action-btn,
          .yam-emoji-btn,
          .yam-ghost-btn {
            width: 32px;
            height: 32px;
            min-width: 32px;
            min-height: 32px;
            font-size: 13px;
          }
          .yam-send-btn {
            width: 40px;
            height: 40px;
            min-width: 40px;
          }
          .yam-composer-actions {
            gap: 2px;
          }
        }
      `}</style>

      {!compact ? (
        <div className="yam-composer-top">
          <div className="yam-composer-chip">🔐 {signalSummary}</div>
          <div className="yam-composer-top" style={{ gap: 8 }}>
            <label className="yam-composer-chip" style={{ paddingInline: 10 }}>الرسائل المختفية</label>
            <select
              value={messageTimer}
              disabled={composerDisabled}
              onChange={(event) => setMessageTimer(Number(event.target.value || 0))}
              className="yam-timer-select"
            >
              {DISAPPEARING_MESSAGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <div className="yam-composer-chip">⏱ {timerLabel(messageTimer)}</div>
          </div>
        </div>
      ) : null}

      {replyTo ? (
        <div className="yam-reply-banner">
          <div className="yam-reply-copy">
            <strong>رد على {replyTo.sender || peer}</strong>
            <span>{replyTo.content || replyTo.message || 'رسالة بدون نص'}</span>
          </div>
          <button type="button" className="yam-ghost-btn" onClick={onCancelReply} disabled={composerDisabled} aria-label="إلغاء الرد">×</button>
        </div>
      ) : null}

      {attachments.length > 0 ? (
        <div className="yam-attachments-grid">
          {attachments.map((entry) => (
            <div key={entry.id} className="yam-attachment-card" style={{ background: getAttachmentAccent(entry.kind) }}>
              <div className="yam-attachment-head">
                <div className="yam-attachment-copy">
                  <strong>{entry.file.name}</strong>
                  <span>{formatAttachmentMeta(entry)}</span>
                </div>
                <button type="button" className="yam-ghost-btn" onClick={() => removeAttachment(entry.id)} disabled={composerDisabled} aria-label="حذف المرفق">×</button>
              </div>

              {entry.previewUrl && entry.kind === 'image' ? <img src={entry.previewUrl} alt={entry.file.name} className="yam-attachment-preview" /> : null}
              {entry.previewUrl && entry.kind === 'video' ? <video src={entry.previewUrl} className="yam-attachment-preview" muted /> : null}
              {entry.kind === 'audio' && entry.previewUrl ? (
                <VoiceMessagePlayer src={entry.previewUrl} seed={entry.id} bubbleless title="معاينة صوت" />
              ) : null}
              {entry.kind !== 'image' && entry.kind !== 'video' && entry.kind !== 'audio' ? <div className="yam-attachment-preview" style={{ display: 'grid', placeItems: 'center', fontSize: 30 }}>📄</div> : null}

              <div className="yam-attachment-meta">
                <span style={{ fontSize: 12, color: '#dbe4ff' }}>{entry.progress}%</span>
                {entry.error ? <span style={{ fontSize: 12, color: '#fecaca' }}>{entry.error}</span> : null}
              </div>
              <div className="yam-progress-track">
                <div
                  className="yam-progress-fill"
                  style={{
                    width: `${entry.progress}%`,
                    background: entry.status === MESSAGE_LIFECYCLE.FAILED ? '#ef4444' : 'linear-gradient(90deg, #8b5cf6, #4f46e5)',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {showVoiceRecorder ? (
        <VoiceRecorder
          onStateChange={emitRecordingState}
          onSend={handleVoiceSend}
          onCancel={() => {
            emitRecordingState('idle');
            setShowVoiceRecorder(false);
          }}
        />
      ) : null}

      {/*
        ✅ v86.9 (WhatsApp-style Press-to-Record):
        - Voice recording toast (غير حاجب) — لعرض الأخطاء أثناء التسجيل
        - يظهر أعلى الشريط عند حدوث خطأ في الميكروفون / الأذونات.
      */}
      {voiceError ? (
        <div
          role="alert"
          style={{
            padding: '10px 12px',
            borderRadius: 12,
            background: 'rgba(239,68,68,0.14)',
            color: '#fca5a5',
            fontSize: 13,
            border: '1px solid rgba(239,68,68,0.32)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span aria-hidden="true">⚠️</span>
          <span>{voiceError}</span>
        </div>
      ) : null}

      {/* صف النص: textarea مستقل أعلى الأزرار (طلب المستخدم) */}
      <div className="yam-composer-textrow">
        <div className="yam-input-frame">
          <textarea
            ref={textareaRef}
            disabled={composerDisabled}
            placeholder={disabled ? 'المحادثة معطلة حالياً' : 'اكتب رسالة...'}
            value={text}
            rows={1}
            onChange={(event) => handleTyping(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                handleSend();
              }
            }}
          />
          {/* v88.5.1: أُزيلت الأيقونات الداخلية — انتقلت إلى شريط الأزرار الموحّد أعلاه.
              صندوق الكتابة الآن خالٍ من الأيقونات ومخصّص للنص فقط. */}
        </div>
      </div>

      {/* صف الأزرار: الإيموجي + المرفق + المايك + الإرسال */}
      <div className="yam-composer-row">
        <div className="yam-composer-actions" ref={emojiPickerRef}>
          <button
            type="button"
            className={`yam-emoji-btn ${showEmojiPicker ? 'active' : ''}`}
            disabled={composerDisabled}
            onClick={() => setShowEmojiPicker((prev) => !prev)}
            aria-label="إيموجي"
          >
            😊
          </button>

          {showEmojiPicker ? (
            <div className="yam-emoji-popover">
              <strong style={{ fontSize: 13 }}>ردود سريعة</strong>
              <div className="yam-emoji-grid">
                {EMOJI_SET.map((emoji) => (
                  <button key={emoji} type="button" className="yam-emoji-tile" onClick={() => appendEmoji(emoji)}>{emoji}</button>
                ))}
              </div>
            </div>
          ) : null}

          <label className="yam-action-btn" style={{ cursor: composerDisabled ? 'not-allowed' : 'pointer' }} aria-label="إرفاق ملف">
            <input ref={fileInputRef} type="file" hidden multiple disabled={composerDisabled} onChange={(event) => handleFilesAdded(event.target.files)} />
            📎
          </label>

          {/* v88.5.1: زرّ GIF داخل شريط الأزرار الموحّد (كان سابقاً داخل صندوق النص) */}
          <button
            type="button"
            className="yam-action-btn yam-gif-btn"
            disabled={composerDisabled}
            onClick={() => emitToast({ type: 'info', title: 'GIF قريباً' })}
            aria-label="GIF"
            title="GIF"
            style={{ fontSize: 11, fontWeight: 700 }}
          >
            GIF
          </button>

          {/* v88.5.1: زرّ صورة سريع داخل شريط الأزرار الموحّد */}
          <button
            type="button"
            className="yam-action-btn yam-image-btn"
            disabled={composerDisabled}
            onClick={() => fileInputRef.current?.click()}
            aria-label="صورة"
            title="صورة"
          >
            🖼
          </button>

          {/*
            ✅ v86.9 (WhatsApp-style Press-to-Record):
            استُبدل الزر النقري القديم بمكوّن PressToRecordMic:
              - اضغط مطولاً ⇒ يبدأ التسجيل فوراً.
              - اسحب للأعلى ⇒ قفل التسجيل (يظهر زر إرسال + إلغاء).
              - اسحب للأسفل ⇒ إلغاء فوري.
              - حرّر الإصبع بدون سحب ⇒ يوقف التسجيل ويُرسل تلقائياً.
            نُبقي زر الفتح اليدوي لواجهة التسجيل الكاملة عبر ضغطة مطوّلة ثانوية
            (لكن العنصر الأساسي هو Press-to-Record).
          */}
          <PressToRecordMic
            disabled={composerDisabled}
            onStateChange={(next) => {
              // مزامنة إشارة "يسجّل الآن" مع الطرف الآخر عبر السوكت
              emitRecordingState(next === 'idle' ? 'idle' : 'recording');
              setShowEmojiPicker(false);
            }}
            onError={(msg) => {
              setVoiceError(msg || '');
              // مسح تلقائي بعد 5 ثوانٍ
              if (voiceErrorTimerRef.current) window.clearTimeout(voiceErrorTimerRef.current);
              voiceErrorTimerRef.current = window.setTimeout(() => setVoiceError(''), 5000);
            }}
            onSend={(voicePayload) => {
              // يُرسل التسجيل مباشرة (بدون عرض مسبق) — مطابق لواتساب.
              handleVoiceSend({
                blob: voicePayload.blob,
                file: voicePayload.file,
                durationSeconds: voicePayload.durationSeconds,
                mimeType: voicePayload.mimeType,
                waveformSeed: `voice-${Date.now()}`,
              });
            }}
          />
        </div>

        <button
          type="button"
          className="yam-send-btn"
          onClick={handleSend}
          disabled={composerDisabled || sending || (!text.trim() && attachments.length === 0)}
          aria-label="إرسال الرسالة"
          title="إرسال"
        >
          {sending ? (
            '…'
          ) : compact ? (
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {/* سهم إرسال واضح يشير إلى اليسار الأعلى (توجيه RTL) */}
              <path d="M22 2 11 13" />
              <path d="M22 2 15 22l-4-9-9-4z" />
            </svg>
          ) : (
            'إرسال'
          )}
        </button>
      </div>

      <div className="yam-composer-footer">
        <span>
          {pendingAttachmentCount > 0
            ? `مرفقات قيد الإرسال: ${pendingAttachmentCount}`
            : inputExpanded
              ? 'مساحة كتابة ممتدة مع Shift + Enter لسطر جديد'
              : 'إدخال قابل للتمدد + معاينة مرفقات + تسجيل صوتي + إيموجي'}
        </span>
        <span>{messageTimer ? `الاختفاء: ${timerLabel(messageTimer)}` : 'وضع الرسائل العادية'}</span>
      </div>
    </div>
  );
}

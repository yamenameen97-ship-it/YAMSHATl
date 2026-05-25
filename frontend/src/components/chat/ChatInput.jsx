import { useEffect, useMemo, useRef, useState } from 'react';
import Button from '../ui/Button.jsx';
import VoiceRecorder from './VoiceRecorder.jsx';
import socketManager from '../../services/socketManager.js';
import mediaUploadService from '../../services/media/mediaUploadService.js';
import signalProtocolService from '../../services/chat/signalProtocol.js';
import { DISAPPEARING_MESSAGE_OPTIONS } from '../../config/mediaConfig.js';
import { clearChatDraft, loadChatDraft, persistChatDraft } from '../../features/chat/chatDrafts.js';
import { MESSAGE_LIFECYCLE } from '../../features/chat/messageLifecycle.js';

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

function timerLabel(value) {
  const option = DISAPPEARING_MESSAGE_OPTIONS.find((item) => Number(item.value) === Number(value));
  return option?.label || 'بدون';
}

export default function ChatInput({ currentUser, replyTo, onCancelReply, onSend, peer, securitySnapshot, disabled = false, compact = false }) {
  const [text, setText] = useState('');
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [sending, setSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [messageTimer, setMessageTimer] = useState(0);
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);
  const fileInputRef = useRef(null);
  const attachmentsRef = useRef([]);

  useEffect(() => {
    attachmentsRef.current = attachments;
  }, [attachments]);

  useEffect(() => {
    if (!peer) {
      setText('');
      return;
    }
    setText(loadChatDraft(currentUser, peer));
  }, [currentUser, peer]);

  useEffect(() => () => {
    revokeAttachments(attachmentsRef.current);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  }, []);

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
    updateAttachment(entry.id, { status: MESSAGE_LIFECYCLE.PENDING_UPLOAD, progress: 0, stage: 'preparing', error: '' });
    try {
      const uploadResult = await mediaUploadService.uploadFile(entry.file, {
        onProgress: (payload) => {
          updateAttachment(entry.id, {
            status: payload?.percent >= 100 ? MESSAGE_LIFECYCLE.SYNCING : MESSAGE_LIFECYCLE.UPLOADING,
            progress: Number(payload?.percent || 0),
            stage: payload?.stage || 'uploading',
          });
        },
      });
      updateAttachment(entry.id, { status: MESSAGE_LIFECYCLE.SYNCING, progress: 100, stage: 'done', uploadResult });
      return uploadResult;
    } catch (error) {
      updateAttachment(entry.id, { status: MESSAGE_LIFECYCLE.FAILED, error: error?.message || 'فشل الرفع', stage: 'failed' });
      throw error;
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
      const securityPayload = await buildMessageSecurityPayload(text);
      await onSend?.({
        text: text.trim(),
        media_url: uploadResults[0]?.mediaUrl || '',
        media_urls: uploadResults.map((item) => item.mediaUrl).filter(Boolean),
        attachments: uploadResults,
        type: uploadResults.length ? (uploadResults[0]?.mediaType || 'media') : 'text',
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
      await onSend?.({
        text: '',
        media_url: upload.mediaUrl,
        media_urls: [upload.mediaUrl],
        attachments: [upload],
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

  const signalSummary = securitySnapshot?.enabled
    ? `${securitySnapshot.protocol || 'Signal'} • ${securitySnapshot.status || 'ready'}`
    : 'Signal bootstrap pending';

  return (
    <div
      style={{
        padding: compact ? 10 : 12,
        background: compact ? 'rgba(8,15,29,0.96)' : '#111827',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        display: 'grid',
        gap: 10,
      }}
    >
      {!compact ? (
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>
            🔐 {signalSummary}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <label style={{ fontSize: 12, color: 'var(--muted)' }}>الرسائل المختفية</label>
            <select value={messageTimer} disabled={composerDisabled} onChange={(event) => setMessageTimer(Number(event.target.value || 0))} style={{ background: '#0f172a', color: '#fff', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '8px 10px' }}>
              {DISAPPEARING_MESSAGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>⏱ {timerLabel(messageTimer)}</span>
          </div>
        </div>
      ) : null}

      {replyTo ? (
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: compact ? '8px 10px' : '8px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: 14, gap: 10 }}>
          <div style={{ fontSize: 12, borderRight: '2px solid var(--primary)', paddingRight: 8 }}>
            <div style={{ fontWeight: 'bold' }}>الرد على {replyTo.sender}</div>
            <div style={{ opacity: 0.75 }}>{replyTo.content || replyTo.message}</div>
          </div>
          <button type="button" onClick={onCancelReply} disabled={composerDisabled} style={{ background: 'none', border: 'none', color: 'white' }}>×</button>
        </div>
      ) : null}

      {attachments.length > 0 ? (
        <div style={{ display: 'grid', gap: 8 }}>
          {attachments.map((entry) => (
            <div key={entry.id} style={{ display: 'grid', gap: 8, padding: 10, borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  {entry.previewUrl && entry.kind === 'image' ? <img src={entry.previewUrl} alt={entry.file.name} style={{ width: 56, height: 56, borderRadius: 12, objectFit: 'cover' }} /> : null}
                  {entry.previewUrl && entry.kind === 'video' ? <video src={entry.previewUrl} style={{ width: 56, height: 56, borderRadius: 12, objectFit: 'cover' }} /> : null}
                  {entry.kind === 'audio' && entry.previewUrl ? <audio src={entry.previewUrl} controls style={{ maxWidth: 220 }} /> : null}
                  {!entry.previewUrl ? <div style={{ width: 56, height: 56, borderRadius: 12, display: 'grid', placeItems: 'center', background: 'rgba(139,92,246,0.15)' }}>📄</div> : null}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{entry.file.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>{entry.stage} • {entry.progress}%</div>
                    {entry.error ? <div style={{ fontSize: 12, color: '#fca5a5' }}>{entry.error}</div> : null}
                  </div>
                </div>
                <button type="button" onClick={() => removeAttachment(entry.id)} disabled={composerDisabled} style={{ background: 'none', border: 'none', color: '#fca5a5' }}>حذف</button>
              </div>
              <div style={{ height: 6, borderRadius: 999, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                <div style={{ width: `${entry.progress}%`, height: '100%', background: entry.status === 'failed' ? '#ef4444' : '#8b5cf6', transition: 'width 0.2s ease' }} />
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

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, direction: 'rtl' }}>
        <button type="button" disabled={composerDisabled} style={{ background: 'none', border: 'none', fontSize: 20 }} onClick={() => emitToast({ type: 'info', title: 'الإيموجي', description: 'استخدم لوحة الإيموجي في جهازك أو لوحة المفاتيح.' })}>😊</button>
        <label style={{ cursor: composerDisabled ? 'not-allowed' : 'pointer', opacity: composerDisabled ? 0.55 : 1 }}>
          <input ref={fileInputRef} type="file" hidden multiple disabled={composerDisabled} onChange={(event) => handleFilesAdded(event.target.files)} />
          <span style={{ fontSize: 20 }}>📎</span>
        </label>
        <button
          type="button"
          disabled={composerDisabled}
          onClick={() => setShowVoiceRecorder((prev) => !prev)}
          style={{
            background: showVoiceRecorder || isRecording ? '#8b5cf6' : 'transparent',
            border: '1px solid rgba(255,255,255,0.12)',
            width: compact ? 46 : 40,
            height: compact ? 46 : 40,
            borderRadius: compact ? 16 : '50%',
            color: 'white',
            flexShrink: 0,
          }}
        >
          🎤
        </button>

        <input
          type="text"
          disabled={composerDisabled}
          placeholder={disabled ? 'المحادثة معطلة حالياً' : peer ? `اكتب رسالة إلى ${peer}...` : 'اكتب رسالة...'}
          value={text}
          onChange={(event) => handleTyping(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              handleSend();
            }
          }}
          style={{
            flex: 1,
            minWidth: 0,
            background: '#1f2937',
            border: '1px solid rgba(255,255,255,0.08)',
            padding: compact ? '15px 18px' : '12px 14px',
            borderRadius: compact ? 20 : 18,
            color: 'white',
            outline: 'none',
            minHeight: compact ? 54 : 48,
          }}
        />

        <Button onClick={handleSend} loading={sending} disabled={composerDisabled || sending || (!text.trim() && attachments.length === 0)}>
          إرسال
        </Button>
      </div>

      {compact ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, color: '#94a3b8', fontSize: 11 }}>
          <span>{pendingAttachmentCount > 0 ? `مرفقات قيد الإرسال: ${pendingAttachmentCount}` : 'مساحة كتابة واسعة بدون هيدر جانبي'}</span>
          <span>{messageTimer ? `الاختفاء: ${timerLabel(messageTimer)}` : 'الرسائل العادية مفعلة'}</span>
        </div>
      ) : null}
    </div>
  );
}

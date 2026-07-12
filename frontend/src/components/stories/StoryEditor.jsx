import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { uploadStory, getStoryMusicCatalog } from '../../api/stories.js';
import UserPickerModal from './UserPickerModal.jsx';

const STORY_SETTINGS_KEY = 'yamshat:stories-settings';

function _readDefaultPrivacy() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORY_SETTINGS_KEY) || '{}');
    let v = String(raw?.whoCanSeeMyStory || 'friends').trim();
    if (v === 'close-friends') v = 'close_friends';
    if (raw?.closeFriendsOnly) v = 'close_friends';
    if (!['friends', 'close_friends', 'private'].includes(v)) v = 'friends';
    return v;
  } catch {
    return 'friends';
  }
}

function toLocalDateTimeValue(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatCountdownRemaining(value) {
  if (!value) return '';
  const target = new Date(value);
  if (Number.isNaN(target.getTime())) return '';
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return 'انتهى العد التنازلي';
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts = [];
  if (days > 0) parts.push(`${days}ي`);
  if (hours > 0 || days > 0) parts.push(`${hours}س`);
  parts.push(`${minutes}د`);
  if (days === 0) parts.push(`${String(seconds).padStart(2, '0')}ث`);
  return parts.join(' ');
}

function wrapText(ctx, text, maxWidth) {
  if (!text) return [];
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

async function buildTextStoryFile({
  caption,
  texts,
  stickers,
  locationText,
  questionSticker,
  mentions,
}) {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  grad.addColorStop(0, '#7c3aed');
  grad.addColorStop(0.5, '#ec4899');
  grad.addColorStop(1, '#0f172a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  for (let i = 0; i < 6; i += 1) {
    ctx.beginPath();
    ctx.arc(150 + i * 160, 220 + (i % 2) * 120, 90 + i * 8, 0, Math.PI * 2);
    ctx.fill();
  }

  let y = 260;

  if (locationText) {
    ctx.fillStyle = 'rgba(15,23,42,0.5)';
    roundRect(ctx, 110, y - 46, 420, 72, 28, true, false);
    ctx.font = '700 34px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`📍 ${locationText}`, 140, y);
    y += 120;
  }

  const mainText = caption || texts.map((t) => t.text).join(' • ') || 'قصة نصية';
  ctx.font = '700 72px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.direction = 'rtl';
  const lines = wrapText(ctx, mainText, 820).slice(0, 6);
  lines.forEach((line) => {
    ctx.fillText(line, canvas.width / 2, y);
    y += 96;
  });

  if (mentions.length) {
    y += 40;
    ctx.font = '600 32px sans-serif';
    ctx.fillStyle = '#fde68a';
    ctx.fillText(mentions.map((m) => `@${m}`).join('   '), canvas.width / 2, y);
    y += 90;
  }

  if (questionSticker) {
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    roundRect(ctx, 120, y - 30, 840, 220, 36, true, false);
    ctx.font = '700 44px sans-serif';
    ctx.fillStyle = '#fff';
    ctx.fillText('❓ سؤال', canvas.width / 2, y + 26);
    ctx.font = '600 38px sans-serif';
    const questionLines = wrapText(ctx, questionSticker, 720).slice(0, 3);
    questionLines.forEach((line, idx) => {
      ctx.fillText(line, canvas.width / 2, y + 94 + idx * 48);
    });
  }

  const emojiLine = stickers.filter((s) => !String(s).includes('::')).slice(0, 4).join('   ');
  if (emojiLine) {
    ctx.font = '64px sans-serif';
    ctx.fillText(emojiLine, canvas.width / 2, 1720);
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('تعذّر إنشاء القصة النصية'));
        return;
      }
      resolve(new File([blob], `text-story-${Date.now()}.png`, { type: 'image/png' }));
    }, 'image/png', 0.95);
  });
}

function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

export default function StoryEditor({ file, onClose, onSuccess }) {
  const [previewUrl, setPreviewUrl] = useState(() => (file ? URL.createObjectURL(file) : ''));
  const [mediaType, setMediaType] = useState(() => (file?.type?.startsWith('video') ? 'video' : file ? 'image' : 'text'));
  const [stickers, setStickers] = useState([]);
  const [texts, setTexts] = useState([]);
  const [caption, setCaption] = useState('');
  const [privacy, setPrivacy] = useState(() => _readDefaultPrivacy());
  const [filterName, setFilterName] = useState('');
  const [music, setMusic] = useState('');
  const [musicCatalog, setMusicCatalog] = useState([]);
  const [showMusicPicker, setShowMusicPicker] = useState(false);
  const [previewingMusic, setPreviewingMusic] = useState('');
  const musicAudioRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawMode, setDrawMode] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [showPoll, setShowPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdownAt, setCountdownAt] = useState('');
  const [showTextModal, setShowTextModal] = useState(false);
  const [textDraft, setTextDraft] = useState('');
  const [questionSticker, setQuestionSticker] = useState('');
  const [showQuestionEditor, setShowQuestionEditor] = useState(false);
  const [locationText, setLocationText] = useState('');
  const [showLocationEditor, setShowLocationEditor] = useState(false);
  const [mentions, setMentions] = useState([]);
  const [showMentionsPicker, setShowMentionsPicker] = useState(false);
  const [crossPostToReels, setCrossPostToReels] = useState(false);

  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const stageRef = useRef(null);
  const isMountedRef = useRef(true);

  const dirty = Boolean(
    caption || stickers.length || texts.length || questionSticker || locationText || mentions.length ||
    (music && music !== 'none') || filterName || showPoll || pollQuestion || showCountdown || countdownAt || !file,
  );

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getStoryMusicCatalog();
        if (!cancelled) setMusicCatalog(res?.data?.items || []);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (musicAudioRef.current) {
      musicAudioRef.current.pause();
      musicAudioRef.current = null;
    }
  }, [previewUrl]);

  useEffect(() => {
    if (canvasRef.current && stageRef.current) {
      const canvas = canvasRef.current;
      const rect = stageRef.current.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      const ctx = canvas.getContext('2d');
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctxRef.current = ctx;
    }
  }, [mediaType]);

  const previewMusic = useCallback((url, key) => {
    if (previewingMusic === key) {
      if (musicAudioRef.current) {
        musicAudioRef.current.pause();
        musicAudioRef.current = null;
      }
      setPreviewingMusic('');
      return;
    }
    if (musicAudioRef.current) {
      musicAudioRef.current.pause();
      musicAudioRef.current = null;
    }
    if (!url) {
      setMusic('none');
      setPreviewingMusic('');
      return;
    }
    const audio = new Audio(url);
    audio.volume = 0.45;
    audio.loop = true;
    audio.play().catch(() => {});
    musicAudioRef.current = audio;
    setPreviewingMusic(key);
    setMusic(key);
  }, [previewingMusic]);

  const addSticker = (emoji) => {
    setStickers((s) => [...s, { id: Date.now() + Math.random(), emoji, x: 40, y: 40 }]);
  };

  const addText = () => {
    setTextDraft('');
    setShowTextModal(true);
  };

  const confirmAddText = () => {
    const value = textDraft.trim();
    if (value) setTexts((t) => [...t, { id: Date.now() + Math.random(), text: value, x: 12, y: 16 + t.length * 10 }]);
    setShowTextModal(false);
    setTextDraft('');
  };

  const removeText = (id) => setTexts((t) => t.filter((x) => x.id !== id));
  const removeSticker = (id) => setStickers((s) => s.filter((x) => x.id !== id));
  const removeMention = (username) => setMentions((arr) => arr.filter((item) => item !== username));

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches?.[0];
    const cx = touch ? touch.clientX : e.clientX;
    const cy = touch ? touch.clientY : e.clientY;
    return { x: cx - rect.left, y: cy - rect.top };
  };

  const startDraw = (e) => {
    if (!drawMode || !ctxRef.current) return;
    setIsDrawing(true);
    const { x, y } = getPos(e);
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(x, y);
  };
  const moveDraw = (e) => {
    if (!isDrawing || !ctxRef.current) return;
    const { x, y } = getPos(e);
    ctxRef.current.lineTo(x, y);
    ctxRef.current.stroke();
  };
  const endDraw = () => setIsDrawing(false);
  const clearDrawing = () => {
    if (ctxRef.current && canvasRef.current) ctxRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  const publishDisabled = useMemo(() => {
    if (uploading) return true;
    if (file) return false;
    return !caption.trim() && !texts.length && !stickers.length && !questionSticker.trim() && !locationText.trim() && !mentions.length;
  }, [uploading, file, caption, texts.length, stickers.length, questionSticker, locationText, mentions.length]);

  const handleUpload = useCallback(async () => {
    setUploading(true);
    setError('');
    setProgress(0);
    try {
      const drawingData = canvasRef.current?.toDataURL('image/png');
      const validPollOptions = pollOptions.map((o) => o.trim()).filter(Boolean);
      const structuredStickers = [
        ...stickers.map((s) => s.emoji),
        ...(locationText.trim() ? [`location::${locationText.trim()}`] : []),
        ...(questionSticker.trim() ? [`question::${questionSticker.trim()}`] : []),
      ];

      const generatedFile = file || await buildTextStoryFile({
        caption,
        texts,
        stickers: structuredStickers,
        locationText,
        questionSticker,
        mentions,
      });

      const uploadResponse = await uploadStory(
        generatedFile,
        {
          caption,
          privacy,
          music,
          filter_name: filterName,
          poll_question: showPoll && validPollOptions.length >= 2 ? pollQuestion.trim() : '',
          poll_options: showPoll && validPollOptions.length >= 2 ? validPollOptions : [],
          countdown_at: showCountdown && countdownAt && !Number.isNaN(new Date(countdownAt).getTime()) ? new Date(countdownAt).toISOString() : '',
          drawing_data: drawingData?.length < 200000 ? drawingData : '',
          is_close_friends: privacy === 'close_friends',
          auto_delete_hours: 24,
          stickers: structuredStickers,
          mentions,
          cross_post_to_reels: crossPostToReels,
        },
        (evt) => {
          if (!isMountedRef.current) return;
          if (evt?.total) setProgress(Math.round((evt.loaded / evt.total) * 100));
        },
      );
      const uploadedStory = uploadResponse?.data || null;
      if (isMountedRef.current && typeof onSuccess === 'function') {
        onSuccess(uploadedStory, { file, generatedFile, caption, privacy });
      }
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.message || '';
      if (isMountedRef.current) setError(msg ? `تعذّر الرفع: ${msg}` : 'تعذّر رفع القصة.');
    } finally {
      if (isMountedRef.current) setUploading(false);
    }
  }, [caption, countdownAt, crossPostToReels, file, filterName, locationText, mentions, music, onSuccess, pollOptions, pollQuestion, privacy, questionSticker, showCountdown, showPoll, stickers, texts]);

  const handleClose = useCallback(() => {
    if (uploading) return;
    if (dirty && !window.confirm('أنت على وشك الخروج دون نشر. هل تريد الإغلاق؟')) return;
    if (typeof onClose === 'function') onClose();
  }, [dirty, uploading, onClose]);

  const FILTERS = [
    { id: '', label: 'بدون', css: 'none' },
    { id: 'mono', label: 'أبيض/أسود', css: 'grayscale(1)' },
    { id: 'warm', label: 'دافئ', css: 'sepia(0.4) saturate(1.2)' },
    { id: 'cool', label: 'بارد', css: 'hue-rotate(180deg) saturate(1.1)' },
    { id: 'vivid', label: 'حيوي', css: 'saturate(1.6) contrast(1.1)' },
    { id: 'fade', label: 'باهت', css: 'opacity(0.85) contrast(0.9)' },
  ];

  const activeFilterCss = FILTERS.find((f) => f.id === filterName)?.css || 'none';
  const countdownPreviewLabel = showCountdown && countdownAt ? formatCountdownRemaining(countdownAt) : '';

  const setCountdownPreset = (hours) => {
    const date = new Date(Date.now() + hours * 60 * 60 * 1000);
    setCountdownAt(toLocalDateTimeValue(date));
    setShowCountdown(true);
  };

  return (
    <div dir="rtl" className="yam-story-editor-overlay" role="dialog" aria-modal="true">
      <div className="yam-story-editor">
        <div className="yam-editor-header">
          <button type="button" onClick={handleClose} className="yam-editor-close" aria-label="إغلاق">✕</button>
          <strong>{file ? 'قصة جديدة' : 'قصة نصية'}</strong>
          <button type="button" onClick={handleUpload} disabled={publishDisabled} className="yam-editor-publish">
            {uploading ? `${progress}%` : 'نشر'}
          </button>
        </div>

        <div ref={stageRef} className={`yam-editor-stage ${mediaType === 'text' ? 'text-mode' : ''}`}>
          {mediaType === 'video' ? (
            <video src={previewUrl} autoPlay loop muted playsInline style={{ filter: activeFilterCss }} className="yam-editor-media" />
          ) : previewUrl ? (
            <img src={previewUrl} alt="معاينة" style={{ filter: activeFilterCss }} className="yam-editor-media" />
          ) : (
            <div className="yam-editor-text-preview" style={{ filter: activeFilterCss }}>
              {locationText && <span className="yam-text-chip">📍 {locationText}</span>}
              <div className="yam-editor-text-preview-main">{caption || texts[0]?.text || 'ابدأ بكتابة قصة نصية…'}</div>
              {mentions.length > 0 && <div className="yam-editor-mentions-inline">{mentions.map((m) => <span key={m}>@{m}</span>)}</div>}
              {questionSticker && <div className="yam-editor-question-preview"><strong>❓ سؤال</strong><span>{questionSticker}</span></div>}
              {stickers.length > 0 && <div className="yam-editor-emojis">{stickers.map((s) => s.emoji).join(' ')}</div>}
            </div>
          )}

          <canvas
            ref={canvasRef}
            onMouseDown={startDraw}
            onMouseMove={moveDraw}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
            onTouchStart={startDraw}
            onTouchMove={moveDraw}
            onTouchEnd={endDraw}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', cursor: drawMode ? 'crosshair' : 'default', pointerEvents: drawMode ? 'auto' : 'none' }}
          />

          {stickers.map((s) => (
            <div key={s.id} onClick={() => removeSticker(s.id)} className="yam-stage-emoji" style={{ insetInlineStart: `${s.x}%`, top: `${s.y}%` }} title="انقر للحذف">{s.emoji}</div>
          ))}
          {texts.map((t) => (
            <div key={t.id} onClick={() => removeText(t.id)} className="yam-stage-text" style={{ insetInlineStart: `${t.x}%`, top: `${t.y}%` }} title="انقر للحذف">{t.text}</div>
          ))}
          {countdownPreviewLabel && <div className="yam-editor-countdown-preview"><span className="yam-editor-countdown-chip">⏳ {countdownPreviewLabel}</span></div>}
          {error && <div className="yam-editor-error">{error}</div>}
          {uploading && <div className="yam-editor-progress"><div className="yam-editor-progress-bar" style={{ width: `${progress}%` }} /></div>}
        </div>

        <div className="yam-editor-tools">
          <button type="button" onClick={addText} className="yam-tool-btn">Aa نص</button>
          <button type="button" onClick={() => setDrawMode((d) => !d)} className={`yam-tool-btn ${drawMode ? 'active' : ''}`}>✏️ رسم</button>
          {drawMode && <button type="button" onClick={clearDrawing} className="yam-tool-btn">🧽 مسح</button>}
          <button type="button" onClick={() => addSticker('🔥')} className="yam-tool-btn">🔥</button>
          <button type="button" onClick={() => addSticker('❤️')} className="yam-tool-btn">❤️</button>
          <button type="button" onClick={() => addSticker('😂')} className="yam-tool-btn">😂</button>
          <button type="button" onClick={() => setShowMentionsPicker(true)} className="yam-tool-btn">@ منشن</button>
          <button type="button" onClick={() => setShowLocationEditor((s) => !s)} className={`yam-tool-btn ${showLocationEditor ? 'active' : ''}`}>📍 موقع</button>
          <button type="button" onClick={() => setShowQuestionEditor((s) => !s)} className={`yam-tool-btn ${showQuestionEditor ? 'active' : ''}`}>❓ سؤال</button>
          <button type="button" onClick={() => setShowPoll((s) => !s)} className={`yam-tool-btn ${showPoll ? 'active' : ''}`}>📊 استطلاع</button>
          <button type="button" onClick={() => { const next = !showCountdown; setShowCountdown(next); if (next && !countdownAt) setCountdownPreset(24); }} className={`yam-tool-btn ${showCountdown ? 'active' : ''}`}>⏳ عدّاد</button>
        </div>

        {showLocationEditor && (
          <div className="yam-editor-block">
            <input type="text" dir="rtl" value={locationText} onChange={(e) => setLocationText(e.target.value)} placeholder="اسم الموقع أو المكان" maxLength={60} className="yam-editor-input" />
          </div>
        )}

        {showQuestionEditor && (
          <div className="yam-editor-block">
            <input type="text" dir="rtl" value={questionSticker} onChange={(e) => setQuestionSticker(e.target.value)} placeholder="اكتب السؤال الذي تريد طرحه" maxLength={140} className="yam-editor-input" />
          </div>
        )}

        {showPoll && (
          <div className="yam-editor-poll">
            <input type="text" dir="rtl" value={pollQuestion} onChange={(e) => setPollQuestion(e.target.value)} placeholder="سؤال الاستطلاع…" maxLength={140} className="yam-editor-input" />
            {pollOptions.map((opt, idx) => (
              <div key={idx} className="yam-poll-row">
                <input type="text" dir="rtl" value={opt} onChange={(e) => { const next = [...pollOptions]; next[idx] = e.target.value; setPollOptions(next); }} placeholder={`الخيار ${idx + 1}`} maxLength={60} className="yam-editor-input" />
                {pollOptions.length > 2 && <button type="button" className="yam-poll-remove" onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== idx))}>✕</button>}
              </div>
            ))}
            {pollOptions.length < 4 && <button type="button" className="yam-poll-add" onClick={() => setPollOptions([...pollOptions, ''])}>+ إضافة خيار</button>}
          </div>
        )}

        <div className="yam-editor-filters">
          {FILTERS.map((f) => (
            <button key={f.id || 'none'} type="button" onClick={() => setFilterName(f.id)} className={`yam-filter-btn ${filterName === f.id ? 'active' : ''}`}>{f.label}</button>
          ))}
        </div>

        <div className="yam-editor-meta">
          <input type="text" dir="rtl" value={caption} onChange={(e) => setCaption(e.target.value)} placeholder={file ? 'اكتب وصفًا (اختياري)…' : 'اكتب نص القصة…'} maxLength={300} className="yam-editor-input" />
          <button type="button" onClick={() => setShowMusicPicker((s) => !s)} className="yam-editor-input yam-music-picker-btn">
            {music && music !== 'none' && music !== '' ? `🎵 ${musicCatalog.find((m) => m.key === music)?.label || music}` : '🎵 إضافة موسيقى (اختياري)'}
          </button>
          {showMusicPicker && (
            <div className="yam-music-picker" dir="rtl">
              <div className="yam-music-picker-header">
                <strong>🎵 مكتبة الموسيقى</strong>
                <button type="button" onClick={() => { setShowMusicPicker(false); if (musicAudioRef.current) { musicAudioRef.current.pause(); musicAudioRef.current = null; } setPreviewingMusic(''); }}>✕</button>
              </div>
              <div className="yam-music-list">
                {musicCatalog.length > 0 ? musicCatalog.map((item) => (
                  <button key={item.key} type="button" className={`yam-music-item ${music === item.key ? 'selected' : ''}`} onClick={() => previewMusic(item.url, item.key)}>
                    <span className="yam-music-label">{item.label}</span>
                    {item.url && <span className="yam-music-play-icon">{previewingMusic === item.key ? '⏸' : '▶'}</span>}
                    {music === item.key && item.url && <span className="yam-music-check">✓</span>}
                  </button>
                )) : <div className="yam-music-loading">جاري تحميل المكتبة…</div>}
              </div>
            </div>
          )}

          {mentions.length > 0 && (
            <div className="yam-mentions-chips">
              {mentions.map((username) => (
                <button key={username} type="button" className="yam-chip" onClick={() => removeMention(username)}>@{username} ✕</button>
              ))}
            </div>
          )}

          <label className="yam-switch-row">
            <input type="checkbox" checked={crossPostToReels} onChange={(e) => setCrossPostToReels(e.target.checked)} disabled={(file && !file.type?.startsWith('video')) || (!file && mediaType !== 'video')} />
            <span>نشر تلقائي كريلز عند كون القصة فيديو</span>
          </label>

          <div className="yam-editor-privacy" role="radiogroup" aria-label="خصوصية القصة">
            <button type="button" role="radio" aria-checked={privacy === 'friends'} onClick={() => setPrivacy('friends')} className={`yam-privacy-btn ${privacy === 'friends' ? 'active' : ''}`}>👥 الأصدقاء</button>
            <button type="button" role="radio" aria-checked={privacy === 'close_friends'} onClick={() => setPrivacy('close_friends')} className={`yam-privacy-btn ${privacy === 'close_friends' ? 'active' : ''}`}>💚 المقربون</button>
            <button type="button" role="radio" aria-checked={privacy === 'private'} onClick={() => setPrivacy('private')} className={`yam-privacy-btn ${privacy === 'private' ? 'active' : ''}`}>🔒 خاص</button>
          </div>
          <p className="yam-editor-note">يمكنك الآن نشر قصة عادية أو قصة نصية فقط مع سؤال، موقع، منشن، استطلاع، وعدّاد تنازلي.</p>
        </div>
      </div>

      {showTextModal && (
        <div role="dialog" aria-modal="true" dir="rtl" onClick={(e) => { if (e.target === e.currentTarget) { setShowTextModal(false); setTextDraft(''); } }} className="yam-modal-backdrop">
          <div className="yam-modal-card">
            <h3>🔤 إضافة نص للقصة</h3>
            <textarea autoFocus value={textDraft} onChange={(e) => setTextDraft(e.target.value)} placeholder="أدخل النص هنا…" maxLength={140} rows={3} onKeyDown={(e) => { if (e.key === 'Escape') { setShowTextModal(false); setTextDraft(''); } if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && textDraft.trim()) confirmAddText(); }} />
            <div className="yam-modal-meta"><span>Ctrl/Cmd + Enter للإضافة</span><span>{textDraft.length}/140</span></div>
            <div className="yam-modal-actions">
              <button type="button" onClick={() => { setShowTextModal(false); setTextDraft(''); }}>إلغاء</button>
              <button type="button" disabled={!textDraft.trim()} onClick={confirmAddText} className="primary">إضافة</button>
            </div>
          </div>
        </div>
      )}

      <UserPickerModal
        open={showMentionsPicker}
        title="إضافة منشن إلى القصة"
        excludedUsernames={mentions}
        onPick={async (user) => {
          if (user?.username && !mentions.includes(user.username)) setMentions((prev) => [...prev, user.username]);
          setShowMentionsPicker(false);
        }}
        onClose={() => setShowMentionsPicker(false)}
      />

      <style>{editorStyles}</style>
    </div>
  );
}

const editorStyles = `
.yam-story-editor-overlay { font-family:'Noto Sans Arabic','Tajawal',system-ui,sans-serif; position:fixed; inset:0; background:rgba(0,0,0,.94); z-index:2100; display:flex; align-items:stretch; justify-content:center; overflow:hidden; }
.yam-story-editor { width:100%; height:100%; max-width:100vw; background:#0a0a10; display:flex; flex-direction:column; overflow-y:auto; overflow-x:hidden; -webkit-overflow-scrolling:touch; }
@media (min-width: 900px) { .yam-story-editor-overlay { padding:20px; align-items:center; } .yam-story-editor { max-width:460px; max-height:96vh; border-radius:18px; box-shadow:0 20px 60px rgba(0,0,0,.7); } }
.yam-editor-header { display:flex; align-items:center; justify-content:space-between; padding:12px 16px; background:rgba(10,10,16,.95); color:#fff; border-bottom:1px solid rgba(255,255,255,.06); position:sticky; top:0; z-index:20; }
.yam-editor-close,.yam-editor-publish { background:transparent; border:none; color:#fff; font-size:16px; cursor:pointer; padding:6px 12px; border-radius:12px; font-family:inherit; font-weight:700; }
.yam-editor-publish { background:linear-gradient(135deg,#8b5cf6,#ec4899); min-width:74px; }
.yam-editor-publish:disabled { opacity:.6; cursor:not-allowed; }
.yam-editor-stage { position:relative; min-height:45vh; max-height:60vh; background:#000; overflow:hidden; display:flex; align-items:center; justify-content:center; }
.yam-editor-stage.text-mode { background:linear-gradient(135deg,#7c3aed,#ec4899,#0f172a); }
@media (min-width: 900px) { .yam-editor-stage { flex:1; min-height:0; max-height:none; } }
.yam-editor-media { width:100%; height:100%; object-fit:contain; transition:filter .25s; }
.yam-editor-text-preview { width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:32px; gap:18px; color:#fff; text-align:center; }
.yam-editor-text-preview-main { font-size:clamp(24px,5vw,40px); font-weight:800; line-height:1.6; text-shadow:0 6px 22px rgba(0,0,0,.45); }
.yam-text-chip,.yam-editor-countdown-chip,.yam-chip { display:inline-flex; align-items:center; gap:6px; padding:10px 14px; border-radius:999px; background:rgba(17,24,39,.75); border:1px solid rgba(255,255,255,.18); color:#fff; font-weight:800; font-size:13px; }
.yam-editor-mentions-inline { display:flex; gap:8px; flex-wrap:wrap; justify-content:center; }
.yam-editor-mentions-inline span { background:rgba(255,255,255,.16); padding:7px 10px; border-radius:999px; font-size:13px; }
.yam-editor-question-preview { max-width:88%; background:rgba(17,24,39,.5); border:1px solid rgba(255,255,255,.12); border-radius:18px; padding:16px; display:flex; flex-direction:column; gap:8px; }
.yam-editor-question-preview strong { font-size:15px; }
.yam-editor-emojis { font-size:32px; }
.yam-stage-emoji { position:absolute; font-size:clamp(32px,8vw,56px); cursor:pointer; user-select:none; filter:drop-shadow(0 2px 6px rgba(0,0,0,.5)); }
.yam-stage-text { position:absolute; color:#fff; font-size:clamp(18px,5vw,28px); font-weight:800; text-shadow:0 2px 8px rgba(0,0,0,.7); cursor:pointer; padding:4px 10px; background:rgba(0,0,0,.25); border-radius:8px; }
.yam-editor-error { position:absolute; top:12px; inset-inline:12px; background:rgba(239,68,68,.95); color:#fff; padding:10px 14px; border-radius:10px; font-size:13px; text-align:center; }
.yam-editor-progress { position:absolute; bottom:0; left:0; right:0; height:4px; background:rgba(255,255,255,.15); }
.yam-editor-progress-bar { height:100%; background:linear-gradient(90deg,#8b5cf6,#ec4899); transition:width .2s; }
.yam-editor-countdown-preview { position:absolute; top:18px; left:50%; transform:translateX(-50%); z-index:4; pointer-events:none; }
.yam-editor-tools,.yam-editor-filters { display:flex; gap:8px; overflow-x:auto; padding:10px 12px; background:rgba(255,255,255,.03); border-top:1px solid rgba(255,255,255,.06); scrollbar-width:none; }
.yam-editor-tools::-webkit-scrollbar,.yam-editor-filters::-webkit-scrollbar { display:none; }
.yam-tool-btn,.yam-filter-btn { flex-shrink:0; background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.12); color:#fff; padding:8px 14px; border-radius:18px; font-size:14px; cursor:pointer; font-family:inherit; font-weight:600; }
.yam-tool-btn.active,.yam-filter-btn.active { background:#8b5cf6; border-color:#8b5cf6; }
.yam-editor-meta,.yam-editor-block,.yam-editor-poll { display:flex; flex-direction:column; gap:10px; padding:12px; }
.yam-editor-input { width:100%; box-sizing:border-box; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.12); color:#fff; padding:12px 14px; border-radius:14px; font-size:14px; font-family:inherit; }
.yam-editor-input::placeholder { color:rgba(255,255,255,.45); }
.yam-mentions-chips { display:flex; flex-wrap:wrap; gap:8px; }
.yam-chip { background:rgba(56,189,248,.18); border-color:rgba(56,189,248,.35); cursor:pointer; font-size:12px; }
.yam-switch-row { display:flex; align-items:center; gap:10px; color:#fff; font-size:13px; }
.yam-editor-privacy { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }
.yam-privacy-btn { background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.12); color:#fff; padding:10px 12px; border-radius:14px; cursor:pointer; font-family:inherit; font-weight:700; }
.yam-privacy-btn.active { background:rgba(139,92,246,.22); border-color:#8b5cf6; }
.yam-editor-note { margin:0; opacity:.72; font-size:12px; color:#dbeafe; }
.yam-poll-row { display:flex; gap:8px; align-items:center; }
.yam-poll-remove,.yam-poll-add { border:none; cursor:pointer; border-radius:12px; font-family:inherit; }
.yam-poll-remove { width:42px; height:42px; background:rgba(239,68,68,.16); color:#fff; }
.yam-poll-add { align-self:flex-start; padding:10px 14px; background:rgba(255,255,255,.08); color:#fff; }
.yam-music-picker { background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.1); border-radius:16px; overflow:hidden; }
.yam-music-picker-header { display:flex; align-items:center; justify-content:space-between; padding:10px 12px; color:#fff; border-bottom:1px solid rgba(255,255,255,.08); }
.yam-music-picker-header button { background:transparent; border:none; color:#fff; cursor:pointer; font-size:18px; }
.yam-music-list { display:flex; flex-direction:column; max-height:220px; overflow:auto; }
.yam-music-item { display:flex; align-items:center; gap:8px; padding:10px 12px; background:transparent; border:none; color:#fff; cursor:pointer; font-family:inherit; text-align:right; }
.yam-music-item.selected { background:rgba(139,92,246,.18); }
.yam-music-label { flex:1; }
.yam-music-loading { padding:14px; color:rgba(255,255,255,.68); }
.yam-modal-backdrop { position:fixed; inset:0; z-index:10000; background:rgba(0,0,0,.6); display:flex; align-items:center; justify-content:center; padding:16px; }
.yam-modal-card { background:#1f2233; color:#fff; border-radius:14px; width:100%; max-width:420px; padding:18px; box-shadow:0 18px 48px rgba(0,0,0,.45); border:1px solid rgba(255,255,255,.08); }
.yam-modal-card h3 { margin:0 0 12px; font-size:17px; font-weight:700; }
.yam-modal-card textarea { width:100%; box-sizing:border-box; padding:12px; border-radius:10px; background:rgba(255,255,255,.06); color:inherit; border:1px solid rgba(255,255,255,.12); font-family:inherit; font-size:16px; resize:vertical; }
.yam-modal-meta { display:flex; justify-content:space-between; align-items:center; margin-top:6px; font-size:12px; opacity:.65; }
.yam-modal-actions { display:flex; gap:8px; margin-top:14px; justify-content:flex-end; }
.yam-modal-actions button { padding:9px 16px; border-radius:10px; cursor:pointer; background:transparent; color:inherit; border:1px solid rgba(255,255,255,.16); font-weight:600; }
.yam-modal-actions button.primary { background:var(--primary,#8b5cf6); color:#fff; border:none; }
`;

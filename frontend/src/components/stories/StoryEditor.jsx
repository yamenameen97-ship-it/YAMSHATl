import React, { useState, useRef, useEffect, useCallback } from 'react';
import { uploadStory } from '../../api/stories.js';

/**
 * StoryEditor — محرر ستوري احترافي.
 * -----------------------------------------------------------------
 * • RTL + خط Noto Sans Arabic.
 * • متجاوب: ملء الشاشة على الجوال، إطار 9:16 على اللابتوب.
 * • معاينة فورية للصورة/الفيديو.
 * • أدوات: نص، ستيكرز، رسم بالقلم، فلاتر، موسيقى، خصوصية.
 * • خيار خصوصية: أصدقاء (افتراضي)، أصدقاء مقربون، خاص.
 * • شريط تقدّم أثناء الرفع.
 */
export default function StoryEditor({ file, onClose, onSuccess }) {
  const [previewUrl, setPreviewUrl] = useState(() => (file ? URL.createObjectURL(file) : ''));
  const [mediaType] = useState(() => (file?.type?.startsWith('video') ? 'video' : 'image'));
  const [stickers, setStickers] = useState([]);
  const [texts, setTexts] = useState([]);
  const [caption, setCaption] = useState('');
  const [privacy, setPrivacy] = useState('friends'); // friends | close_friends | private
  const [filterName, setFilterName] = useState('');
  const [music, setMusic] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawMode, setDrawMode] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  // v59.10: دعم الاستطلاعات (poll)
  const [showPoll, setShowPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  // v59.10: معرفة إذا كان هناك تغييرات غير محفوظة
  const dirty = caption || stickers.length || texts.length || music || filterName || showPoll || pollQuestion;

  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const stageRef = useRef(null);

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

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
  }, []);

  const addSticker = (emoji) => {
    setStickers(s => [...s, { id: Date.now() + Math.random(), emoji, x: 40, y: 40 }]);
  };

  const addText = () => {
    const text = window.prompt('أدخل النص:');
    if (text && text.trim()) {
      setTexts(t => [...t, { id: Date.now() + Math.random(), text: text.trim(), x: 30, y: 80 }]);
    }
  };

  const removeText = (id) => setTexts(t => t.filter(x => x.id !== id));
  const removeSticker = (id) => setStickers(s => s.filter(x => x.id !== id));

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

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches?.[0];
    const cx = touch ? touch.clientX : e.clientX;
    const cy = touch ? touch.clientY : e.clientY;
    return { x: cx - rect.left, y: cy - rect.top };
  };

  const clearDrawing = () => {
    if (ctxRef.current && canvasRef.current) {
      ctxRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  const handleUpload = useCallback(async () => {
    if (!file) return;
    setUploading(true);
    setError('');
    setProgress(0);
    try {
      const drawingData = canvasRef.current?.toDataURL('image/png');
      const validPollOptions = pollOptions.map(o => o.trim()).filter(Boolean);
      // v59.13: نلتقط نتيجة الرفع (القصة الجديدة) ونمررها لـonSuccess
      // حتى نتمكّن من إضافتها فوريًا في الواجهة بدون انتظار الباك إند.
      const uploadResponse = await uploadStory(
        file,
        {
          caption,
          privacy,
          music,
          filter_name: filterName,
          // v59.10: دعم الاستطلاعات
          poll_question: showPoll && validPollOptions.length >= 2 ? pollQuestion.trim() : '',
          poll_options: showPoll && validPollOptions.length >= 2 ? validPollOptions : [],
          drawing_data: drawingData?.length < 4500 ? drawingData : '', // تجنّب إرسال صورة كبيرة جدًا
          is_close_friends: privacy === 'close_friends',
          auto_delete_hours: 24,
          stickers: stickers.map(s => s.emoji),
        },
        (evt) => {
          if (evt?.total) setProgress(Math.round((evt.loaded / evt.total) * 100));
        },
      );
      const uploadedStory = uploadResponse?.data || null;
      if (typeof onSuccess === 'function') onSuccess(uploadedStory, { file, caption, privacy });
    } catch (err) {
      console.error('[StoryEditor] upload failed', err);
      const msg = err?.response?.data?.detail || err?.message || '';
      setError(msg ? `تعذّر الرفع: ${msg}` : 'تعذّر رفع القصة. يُرجى المحاولة مرة أخرى.');
    } finally {
      setUploading(false);
    }
  }, [file, caption, privacy, music, filterName, stickers, showPoll, pollQuestion, pollOptions, onSuccess]);

  // v59.10: تأكيد عند الإغلاق إذا كانت هناك تعديلات
  const handleClose = useCallback(() => {
    if (uploading) return;
    if (dirty && !window.confirm('أنت على وشك الخروج دون نشر. هل ترغب فعلاً بإغلاق المحرر؟')) {
      return;
    }
    if (typeof onClose === 'function') onClose();
  }, [dirty, uploading, onClose]);

  const FILTERS = [
    { id: '',         label: 'بدون',   css: 'none' },
    { id: 'mono',     label: 'أبيض/أسود', css: 'grayscale(1)' },
    { id: 'warm',     label: 'دافئ',    css: 'sepia(0.4) saturate(1.2)' },
    { id: 'cool',     label: 'بارد',    css: 'hue-rotate(180deg) saturate(1.1)' },
    { id: 'vivid',    label: 'حيوي',    css: 'saturate(1.6) contrast(1.1)' },
    { id: 'fade',     label: 'باهت',    css: 'opacity(0.85) contrast(0.9)' },
  ];

  const activeFilterCss = FILTERS.find(f => f.id === filterName)?.css || 'none';

  return (
    <div dir="rtl" className="yam-story-editor-overlay" role="dialog" aria-modal="true">
      <div className="yam-story-editor">
        <div className="yam-editor-header">
          <button type="button" onClick={handleClose} className="yam-editor-close" aria-label="إغلاق">✕</button>
          <strong>قصة جديدة</strong>
          <button
            type="button"
            onClick={handleUpload}
            disabled={uploading || !file}
            className="yam-editor-publish"
          >
            {uploading ? `${progress}%` : 'نشر'}
          </button>
        </div>

        <div ref={stageRef} className="yam-editor-stage">
          {mediaType === 'video' ? (
            <video
              src={previewUrl}
              autoPlay
              loop
              muted
              playsInline
              style={{ filter: activeFilterCss }}
              className="yam-editor-media"
            />
          ) : (
            <img
              src={previewUrl}
              alt="معاينة"
              style={{ filter: activeFilterCss }}
              className="yam-editor-media"
            />
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
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              cursor: drawMode ? 'crosshair' : 'default',
              pointerEvents: drawMode ? 'auto' : 'none',
            }}
          />

          {stickers.map(s => (
            <div
              key={s.id}
              onClick={() => removeSticker(s.id)}
              style={{
                position: 'absolute', insetInlineStart: `${s.x}%`, top: `${s.y}%`,
                fontSize: 'clamp(32px, 8vw, 56px)', cursor: 'pointer', userSelect: 'none',
                filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.5))',
              }}
              title="انقر للحذف"
            >{s.emoji}</div>
          ))}

          {texts.map(t => (
            <div
              key={t.id}
              onClick={() => removeText(t.id)}
              style={{
                position: 'absolute', insetInlineStart: `${t.x}%`, top: `${t.y}%`,
                color: '#fff', fontSize: 'clamp(18px, 5vw, 28px)', fontWeight: 800,
                textShadow: '0 2px 8px rgba(0,0,0,0.7)', cursor: 'pointer',
                padding: '4px 10px', background: 'rgba(0,0,0,0.25)', borderRadius: 8,
              }}
              title="انقر للحذف"
            >{t.text}</div>
          ))}

          {error && <div className="yam-editor-error">{error}</div>}

          {uploading && (
            <div className="yam-editor-progress">
              <div className="yam-editor-progress-bar" style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>

        {/* أدوات */}
        <div className="yam-editor-tools">
          <button type="button" onClick={addText} className="yam-tool-btn">Aa نص</button>
          <button
            type="button"
            onClick={() => setDrawMode(d => !d)}
            className={`yam-tool-btn ${drawMode ? 'active' : ''}`}
          >✏️ رسم</button>
          {drawMode && (
            <button type="button" onClick={clearDrawing} className="yam-tool-btn">🧽 مسح</button>
          )}
          <button type="button" onClick={() => addSticker('🔥')} className="yam-tool-btn">🔥</button>
          <button type="button" onClick={() => addSticker('❤️')} className="yam-tool-btn">❤️</button>
          <button type="button" onClick={() => addSticker('😂')} className="yam-tool-btn">😂</button>
          <button type="button" onClick={() => addSticker('✨')} className="yam-tool-btn">✨</button>
          {/* v59.10: زر الاستطلاع */}
          <button
            type="button"
            onClick={() => setShowPoll(s => !s)}
            className={`yam-tool-btn ${showPoll ? 'active' : ''}`}
            title="إضافة استطلاع"
          >📊 استطلاع</button>
        </div>

        {/* v59.10: محرر الاستطلاع */}
        {showPoll && (
          <div className="yam-editor-poll">
            <input
              type="text"
              dir="rtl"
              value={pollQuestion}
              onChange={(e) => setPollQuestion(e.target.value)}
              placeholder="سؤال الاستطلاع…"
              maxLength={140}
              className="yam-editor-input"
            />
            {pollOptions.map((opt, idx) => (
              <div key={idx} className="yam-poll-row">
                <input
                  type="text"
                  dir="rtl"
                  value={opt}
                  onChange={(e) => {
                    const next = [...pollOptions];
                    next[idx] = e.target.value;
                    setPollOptions(next);
                  }}
                  placeholder={`الخيار ${idx + 1}`}
                  maxLength={60}
                  className="yam-editor-input"
                />
                {pollOptions.length > 2 && (
                  <button
                    type="button"
                    className="yam-poll-remove"
                    onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== idx))}
                  >✕</button>
                )}
              </div>
            ))}
            {pollOptions.length < 4 && (
              <button
                type="button"
                className="yam-poll-add"
                onClick={() => setPollOptions([...pollOptions, ''])}
              >+ إضافة خيار</button>
            )}
          </div>
        )}

        {/* فلاتر */}
        <div className="yam-editor-filters">
          {FILTERS.map(f => (
            <button
              key={f.id || 'none'}
              type="button"
              onClick={() => setFilterName(f.id)}
              className={`yam-filter-btn ${filterName === f.id ? 'active' : ''}`}
            >{f.label}</button>
          ))}
        </div>

        {/* الكابشن + الخصوصية */}
        <div className="yam-editor-meta">
          <input
            type="text"
            dir="rtl"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="اكتب وصفًا (اختياري)…"
            maxLength={300}
            className="yam-editor-input"
          />
          <input
            type="text"
            dir="rtl"
            value={music}
            onChange={(e) => setMusic(e.target.value)}
            placeholder="🎵 موسيقى (اختياري)"
            maxLength={120}
            className="yam-editor-input"
          />
          <div className="yam-editor-privacy" role="radiogroup" aria-label="خصوصية القصة">
            <button
              type="button"
              role="radio"
              aria-checked={privacy === 'friends'}
              onClick={() => setPrivacy('friends')}
              className={`yam-privacy-btn ${privacy === 'friends' ? 'active' : ''}`}
            >👥 الأصدقاء</button>
            <button
              type="button"
              role="radio"
              aria-checked={privacy === 'close_friends'}
              onClick={() => setPrivacy('close_friends')}
              className={`yam-privacy-btn ${privacy === 'close_friends' ? 'active' : ''}`}
            >💚 المقربون</button>
            <button
              type="button"
              role="radio"
              aria-checked={privacy === 'private'}
              onClick={() => setPrivacy('private')}
              className={`yam-privacy-btn ${privacy === 'private' ? 'active' : ''}`}
            >🔒 خاص</button>
          </div>
          <p className="yam-editor-note">
            ستظهر قصتك لأصدقائك المقبولين فقط — لا تظهر للعامة.
          </p>
        </div>
      </div>

      <style>{editorStyles}</style>
    </div>
  );
}

const editorStyles = `
.yam-story-editor-overlay {
  font-family: 'Noto Sans Arabic', 'Tajawal', system-ui, -apple-system, sans-serif;
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.94);
  z-index: 2100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}
.yam-story-editor {
  width: 100%;
  height: 100%;
  max-width: 100vw;
  background: #0a0a10;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
@media (min-width: 900px) {
  .yam-story-editor-overlay { padding: 20px; }
  .yam-story-editor {
    max-width: 460px;
    max-height: 96vh;
    border-radius: 18px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.7);
  }
}
.yam-editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(255,255,255,0.03);
  color: #fff;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.yam-editor-header strong { font-size: 15px; font-weight: 700; }
.yam-editor-close, .yam-editor-publish {
  background: transparent;
  border: none;
  color: #fff;
  font-size: 16px;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 12px;
  font-family: inherit;
  font-weight: 700;
}
.yam-editor-publish {
  background: linear-gradient(135deg, #8b5cf6, #ec4899);
  min-width: 70px;
}
.yam-editor-publish:disabled { opacity: 0.6; cursor: wait; }

.yam-editor-stage {
  position: relative;
  flex: 1;
  background: #000;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
.yam-editor-media {
  width: 100%;
  height: 100%;
  object-fit: contain;
  transition: filter 0.25s;
}
.yam-editor-error {
  position: absolute;
  top: 12px;
  inset-inline-start: 12px;
  inset-inline-end: 12px;
  background: rgba(239,68,68,0.95);
  color: #fff;
  padding: 10px 14px;
  border-radius: 10px;
  font-size: 13px;
  text-align: center;
}
.yam-editor-progress {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 4px;
  background: rgba(255,255,255,0.15);
}
.yam-editor-progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #8b5cf6, #ec4899);
  transition: width 0.2s;
}

.yam-editor-tools {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 10px 12px;
  background: rgba(255,255,255,0.03);
  border-top: 1px solid rgba(255,255,255,0.06);
  scrollbar-width: none;
}
.yam-editor-tools::-webkit-scrollbar { display: none; }
.yam-tool-btn {
  flex-shrink: 0;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.12);
  color: #fff;
  padding: 8px 14px;
  border-radius: 18px;
  font-size: 14px;
  cursor: pointer;
  font-family: inherit;
  font-weight: 600;
}
.yam-tool-btn:hover { background: rgba(255,255,255,0.15); }
.yam-tool-btn.active { background: #8b5cf6; border-color: #8b5cf6; }

.yam-editor-filters {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 8px 12px;
  scrollbar-width: none;
}
.yam-editor-filters::-webkit-scrollbar { display: none; }
.yam-filter-btn {
  flex-shrink: 0;
  background: transparent;
  color: #ddd;
  border: 1px solid rgba(255,255,255,0.18);
  padding: 6px 14px;
  border-radius: 14px;
  font-size: 12.5px;
  cursor: pointer;
  font-family: inherit;
}
.yam-filter-btn.active { background: #fff; color: #000; border-color: #fff; font-weight: 700; }

.yam-editor-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 14px 16px;
  background: rgba(255,255,255,0.02);
  border-top: 1px solid rgba(255,255,255,0.06);
}
.yam-editor-input {
  width: 100%;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.12);
  color: #fff;
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 14px;
  outline: none;
  font-family: inherit;
}
.yam-editor-input:focus { border-color: rgba(139,92,246,0.7); }
.yam-editor-input::placeholder { color: rgba(255,255,255,0.45); }

.yam-editor-privacy {
  display: flex;
  gap: 6px;
}
.yam-privacy-btn {
  flex: 1;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.12);
  color: #ddd;
  padding: 9px 8px;
  border-radius: 10px;
  font-size: 12.5px;
  cursor: pointer;
  font-family: inherit;
  font-weight: 600;
}
.yam-privacy-btn.active {
  background: linear-gradient(135deg, #8b5cf6, #ec4899);
  color: #fff;
  border-color: transparent;
}
.yam-editor-note {
  font-size: 11.5px;
  color: rgba(255,255,255,0.55);
  margin: 4px 0 0;
  text-align: center;
}

/* v59.10: محرر الاستطلاع */
.yam-editor-poll {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px 14px;
  background: rgba(139, 92, 246, 0.08);
  border-top: 1px solid rgba(139, 92, 246, 0.25);
}
.yam-poll-row {
  display: flex;
  gap: 6px;
  align-items: center;
}
.yam-poll-row .yam-editor-input { flex: 1; }
.yam-poll-remove {
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.4);
  color: #fca5a5;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
}
.yam-poll-add {
  background: rgba(139, 92, 246, 0.18);
  border: 1px dashed rgba(139, 92, 246, 0.5);
  color: #c4b5fd;
  padding: 8px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
  font-family: inherit;
  font-weight: 600;
}
`;

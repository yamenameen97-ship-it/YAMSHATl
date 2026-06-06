import React, { useState, useRef, useEffect } from 'react';
import Button from '../ui/Button';

export default function StoryEditor({ file, onClose, onSuccess }) {
  const [previewUrl, setPreviewUrl] = useState(URL.createObjectURL(file));
  const [stickers, setStickers] = useState([]);
  const [texts, setTexts] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      const ctx = canvas.getContext('2d');
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 5;
      ctxRef.current = ctx;
    }
  }, []);

  const addSticker = (emoji) => {
    setStickers([...stickers, { id: Date.now(), emoji, x: 50, y: 50 }]);
  };

  const addText = () => {
    const text = prompt("أدخل النص:");
    if (text) setTexts([...texts, { id: Date.now(), text, x: 100, y: 100 }]);
  };

  const handleUpload = () => {
    // منطق الرفع المطور هنا
    onSuccess();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ position: 'relative', aspectRatio: '9/16', background: '#000', borderRadius: 16, overflow: 'hidden' }}>
        <img src={previewUrl} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="preview" />
        
        <canvas 
          ref={canvasRef}
          onMouseDown={(e) => {
            setIsDrawing(true);
            ctxRef.current.beginPath();
            ctxRef.current.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
          }}
          onMouseMove={(e) => {
            if (!isDrawing) return;
            ctxRef.current.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
            ctxRef.current.stroke();
          }}
          onMouseUp={() => setIsDrawing(false)}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', cursor: 'crosshair' }}
        />

        {stickers.map(s => (
          <div key={s.id} style={{ position: 'absolute', left: s.x, top: s.y, fontSize: 40, cursor: 'move' }}>{s.emoji}</div>
        ))}

        {texts.map(t => (
          <div key={t.id} style={{ position: 'absolute', left: t.x, top: t.y, color: 'white', fontSize: 24, fontWeight: 'bold' }}>{t.text}</div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '10px 0' }}>
        <Button onClick={() => addSticker('🔥')}>🔥</Button>
        <Button onClick={() => addSticker('❤️')}>❤️</Button>
        <Button onClick={addText}>T إضافة نص</Button>
        <Button onClick={() => {}}>🎵 موسيقى</Button>
        <Button onClick={() => {}}>✂️ قص</Button>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <Button variant="secondary" onClick={onClose} style={{ flex: 1 }}>إلغاء</Button>
        <Button onClick={handleUpload} style={{ flex: 2 }}>نشر القصة</Button>
      </div>
    </div>
  );
}

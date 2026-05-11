import React, { useState, useEffect, useCallback, useRef } from 'react';
import Button from '../ui/Button';
import socketManager from '../../services/socketManager';
import mediaUploadPipeline from '../../services/chat/mediaUpload';
import encryptionService from '../../services/chat/encryption';
import retryQueue from '../../services/chat/retryQueue';

export default function ChatInput({ replyTo, onCancelReply, onSend, chatId }) {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(null);
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  // Typing indicator with debounce
  const handleTyping = useCallback(() => {
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socketManager.emit('typing_start', { chatId });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      socketManager.emit('typing_stop', { chatId });
    }, 2000); // 2 seconds debounce
  }, [chatId]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  const handleInputChange = (e) => {
    setText(e.target.value);
    handleTyping();
  };

  const handleSend = async () => {
    if (!text.trim() && attachments.length === 0) return;

    let messageData = {
      id: Date.now().toString(),
      chatId,
      text: text.trim(),
      timestamp: new Date().toISOString(),
      replyTo: replyTo?.id
    };

    // 1. Handle Media Upload if any
    if (attachments.length > 0) {
      try {
        setUploadProgress(0);
        const uploadedFiles = [];
        for (const file of attachments) {
          const result = await mediaUploadPipeline.uploadWithProgress(file, (progress) => {
            setUploadProgress(progress);
          });
          uploadedFiles.push(result.url);
        }
        messageData.media = uploadedFiles;
        messageData.type = 'media';
      } catch (error) {
        console.error('Media upload failed', error);
        // Add to retry queue or show error
        alert('فشل رفع الوسائط، سيتم المحاولة لاحقاً');
      }
    } else {
      messageData.type = 'text';
    }

    // 2. Apply E2E Encryption
    if (messageData.text) {
      messageData.text = await encryptionService.encrypt(messageData.text, 'user-secret-key');
    }

    // 3. Send via Socket or Retry Queue
    if (socketManager.socket.connected) {
      onSend(messageData);
    } else {
      retryQueue.addToQueue(messageData);
      // Optimistic UI update could happen here
    }

    // Reset state
    setText('');
    setAttachments([]);
    setUploadProgress(null);
    if (onCancelReply) onCancelReply();
    
    // Stop typing indicator
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    isTypingRef.current = false;
    socketManager.emit('typing_stop', { chatId });
  };

  const startRecording = () => {
    setIsRecording(true);
    // Logic for voice recording
  };

  const stopRecording = () => {
    setIsRecording(false);
    // In a real app, this would upload the audio file first
    handleSend();
  };

  return (
    <div style={{ padding: 10, background: '#111', borderTop: '1px solid #333' }}>
      {/* Reply Preview */}
      {replyTo && (
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 10px', background: 'rgba(255,255,255,0.05)', borderRadius: 8, marginBottom: 10 }}>
          <div style={{ fontSize: 12, borderRight: '2px solid var(--primary)', paddingRight: 8 }}>
            <div style={{ fontWeight: 'bold' }}>الرد على {replyTo.sender}</div>
            <div style={{ opacity: 0.7 }}>{replyTo.text}</div>
          </div>
          <button onClick={onCancelReply} style={{ background: 'none', border: 'none', color: 'white' }}>×</button>
        </div>
      )}

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
          {attachments.map((file, i) => (
            <div key={i} style={{ position: 'relative', width: 50, height: 50, background: '#222', borderRadius: 8, overflow: 'hidden' }}>
              {file.type.startsWith('image/') ? (
                <img src={URL.createObjectURL(file)} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>📄</div>
              )}
              {uploadProgress !== null && (
                <div style={{ position: 'absolute', bottom: 0, left: 0, height: 4, background: 'var(--primary)', width: `${uploadProgress}%`, transition: 'width 0.3s' }} />
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button style={{ background: 'none', border: 'none', fontSize: 20 }}>😊</button>
        <label style={{ cursor: 'pointer' }}>
          <input type="file" hidden multiple onChange={(e) => setAttachments(Array.from(e.target.files))} />
          <span style={{ fontSize: 20 }}>📎</span>
        </label>
        
        <input 
          type="text" 
          placeholder="اكتب رسالة..." 
          value={text}
          onChange={handleInputChange}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          style={{ flex: 1, background: '#222', border: 'none', padding: '10px 15px', borderRadius: 20, color: 'white', outline: 'none' }}
        />

        {text.trim() || attachments.length > 0 ? (
          <Button onClick={handleSend}>إرسال</Button>
        ) : (
          <button 
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            style={{ 
              background: isRecording ? '#ff4444' : 'var(--primary)', 
              border: 'none', width: 40, height: 40, borderRadius: '50%', color: 'white', cursor: 'pointer',
              transition: '0.2s',
              transform: isRecording ? 'scale(1.2)' : 'scale(1)'
            }}
          >
            🎤
          </button>
        )}
      </div>
    </div>
  );
}

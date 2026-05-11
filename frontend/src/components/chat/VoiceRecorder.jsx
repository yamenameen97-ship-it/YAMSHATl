import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { tokens } from '../../styles/designTokens';

/**
 * VoiceRecorder Component
 * Handles audio recording for chat messages
 */
const VoiceRecorder = ({ onSend, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);
  const timerRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      mediaRecorder.current.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' });
        if (audioChunks.current.length > 0) {
          onSend(audioBlob, duration);
        }
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.current.start();
      setIsRecording(true);
      
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('لا يمكن الوصول إلى الميكروفون');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
      setDuration(0);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: tokens.spacing.md,
      padding: tokens.spacing.sm,
      backgroundColor: isRecording ? tokens.colors.error + '11' : 'transparent',
      borderRadius: tokens.borderRadius.full,
      transition: tokens.animations.transitions.default,
    }}>
      {isRecording && (
        <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.sm }}>
          <span style={{ 
            width: '10px', 
            height: '10px', 
            backgroundColor: tokens.colors.error, 
            borderRadius: '50%',
            animation: 'pulse 1s infinite'
          }} />
          <span style={{ fontSize: tokens.typography.sizes.sm, fontWeight: 'bold' }}>
            {formatTime(duration)}
          </span>
        </div>
      )}

      <button
        onMouseDown={startRecording}
        onMouseUp={stopRecording}
        onTouchStart={startRecording}
        onTouchEnd={stopRecording}
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          border: 'none',
          backgroundColor: isRecording ? tokens.colors.error : tokens.colors.primary[600],
          color: 'white',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px',
          boxShadow: tokens.shadows.md,
        }}
      >
        {isRecording ? '⏹️' : '🎤'}
      </button>

      {isRecording && (
        <button 
          onClick={() => { stopRecording(); onCancel(); }}
          style={{ background: 'none', border: 'none', color: tokens.colors.text.secondary, cursor: 'pointer' }}
        >
          إلغاء
        </button>
      )}

      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.3; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

VoiceRecorder.propTypes = {
  onSend: PropTypes.func.isRequired,
  onCancel: PropTypes.func,
};

export default VoiceRecorder;

import { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

/**
 * Modal Component with Advanced Accessibility & Focus Trap
 * Part of the Global Modal System
 */
export default function Modal({ open, title, children, onClose, size = 'medium' }) {
  const modalRef = useRef(null);
  const previousFocus = useRef(null);

  // Focus Trap Logic - Accessibility System Improvement
  const handleTabKey = useCallback((e) => {
    if (!modalRef.current) return;
    
    const focusableElements = modalRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.key === 'Tab') {
      if (e.shiftKey) { // Shift + Tab
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else { // Tab
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    }
  }, []);

  useEffect(() => {
    if (open) {
      // Accessibility: Store previous focus to return it later
      previousFocus.current = document.activeElement;
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      
      // Accessibility: Focus the modal container
      setTimeout(() => {
        modalRef.current?.focus();
      }, 50);

      const handleKeyDown = (e) => {
        if (e.key === 'Escape') onClose();
        handleTabKey(e);
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'unset';
        // Accessibility: Return focus to the element that opened the modal
        previousFocus.current?.focus();
      };
    }
  }, [open, onClose, handleTabKey]);

  if (!open) return null;

  return createPortal(
    <div 
      className="modal-backdrop fade-in" 
      onClick={onClose}
      role="presentation"
    >
      <div 
        className={`modal-card slide-up ${size}`} 
        onClick={(e) => e.stopPropagation()}
        ref={modalRef}
        tabIndex="-1"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="modal-header">
          <h3 id="modal-title">{title}</h3>
          <button 
            type="button" 
            className="modal-close" 
            onClick={onClose}
            aria-label="إغلاق النافذة"
          >
            ✕
          </button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .modal-backdrop {
          position: fixed; top: 0; left: 0; width: 100%; height: 100%;
          background: rgba(0, 0, 0, 0.5); backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center; z-index: 1000;
        }
        .modal-card {
          background: white; border-radius: 16px; width: 90%; max-height: 90vh;
          display: flex; flex-direction: column; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
          outline: none;
        }
        .modal-card.small { max-width: 400px; }
        .modal-card.medium { max-width: 600px; }
        .modal-card.large { max-width: 900px; }
        .modal-header { padding: 20px; border-bottom: 1px solid #f3f4f6; display: flex; justify-content: space-between; align-items: center; }
        .modal-header h3 { margin: 0; font-size: 1.25rem; font-weight: 600; }
        .modal-close { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #9ca3af; transition: color 0.2s; }
        .modal-close:hover { color: #111827; }
        .modal-body { padding: 20px; overflow-y: auto; }
        .fade-in { animation: fadeIn 0.2s ease-out; }
        .slide-up { animation: slideUp 0.3s ease-out; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}} />
    </div>,
    document.body
  );
}

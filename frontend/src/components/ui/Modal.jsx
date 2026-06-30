import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';

export default function Modal({
  open,
  isOpen,
  title,
  subtitle = '',
  children,
  onClose,
  size = 'medium',
  footer = null,
  className = '',
  closeOnOverlay = true,
}) {
  const visible = typeof open === 'boolean' ? open : Boolean(isOpen);
  const modalRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!visible) return undefined;

    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement;
    document.body.style.overflow = 'hidden';

    // v71 ROOT FIX: استخدام requestAnimationFrame بدلاً من setTimeout(40ms)
    // للتركيز الفوري في أول frame بعد الرسم — يجعل النوافذ تفتح فوراً
    const focusFirst = window.requestAnimationFrame(() => {
      if (!modalRef.current) return;
      // استعلام مدمج بدلاً من استعلامين منفصلين (تحسين أداء)
      const preferred = modalRef.current.querySelector('[data-modal-autofocus="true"]');
      if (preferred) { preferred.focus(); return; }
      const focusable = modalRef.current.querySelector(
        'input:not([type="hidden"]):not([disabled]), textarea:not([disabled]), select:not([disabled]), [contenteditable="true"], button:not([disabled])',
      );
      focusable?.focus();
    });

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onCloseRef.current?.();
      if (event.key !== 'Tab' || !modalRef.current) return;
      const focusables = Array.from(modalRef.current.querySelectorAll(
        'button:not([disabled]), [href], input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )).filter((element) => !element.hasAttribute('disabled') && element.getAttribute('aria-hidden') !== 'true');
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFirst);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
      if (previousFocus && typeof previousFocus.focus === 'function' && document.contains(previousFocus)) {
        previousFocus.focus();
      }
    };
  }, [visible]);

  if (!visible) return null;

  return createPortal(
    <div
      className="ui-modal-backdrop"
      onClick={() => {
        if (closeOnOverlay) onCloseRef.current?.();
      }}
      role="presentation"
    >
      <section
        className={`ui-modal ui-modal-${size} ${className}`.trim()}
        onClick={(event) => event.stopPropagation()}
        ref={modalRef}
        tabIndex="-1"
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={subtitle ? descriptionId : undefined}
      >
        <header className="ui-modal-header">
          <div>
            {title ? <h3 id={titleId}>{title}</h3> : null}
            {subtitle ? <p id={descriptionId}>{subtitle}</p> : null}
          </div>
          <button type="button" className="btn btn-secondary btn-small" onClick={() => onCloseRef.current?.()} aria-label="إغلاق النافذة">
            ✕
          </button>
        </header>
        <div className="ui-modal-body">{children}</div>
        {footer ? <footer className="ui-modal-footer">{footer}</footer> : null}
      </section>
    </div>,
    document.body,
  );
}

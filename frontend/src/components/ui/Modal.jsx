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
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!visible) return undefined;

    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement;
    document.body.style.overflow = 'hidden';

    const focusFirst = window.setTimeout(() => {
      const firstFocusable = modalRef.current?.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      firstFocusable?.focus();
    }, 40);

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
      if (event.key !== 'Tab' || !modalRef.current) return;
      const focusables = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
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
      window.clearTimeout(focusFirst);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
      previousFocus?.focus?.();
    };
  }, [visible, onClose]);

  if (!visible) return null;

  return createPortal(
    <div
      className="ui-modal-backdrop"
      onClick={() => {
        if (closeOnOverlay) onClose?.();
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
          <button type="button" className="btn btn-secondary btn-small" onClick={() => onClose?.()} aria-label="إغلاق النافذة">
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

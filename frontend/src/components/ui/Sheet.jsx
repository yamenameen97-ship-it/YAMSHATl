import { useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function Sheet({
  open,
  isOpen,
  side = 'bottom',
  title,
  subtitle = '',
  children,
  onClose,
  actions = null,
  className = '',
}) {
  const visible = typeof open === 'boolean' ? open : Boolean(isOpen);

  useEffect(() => {
    if (!visible) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [visible, onClose]);

  if (!visible) return null;

  return createPortal(
    <div className="ui-sheet-backdrop" onClick={() => onClose?.()} role="presentation">
      <section
        className={`ui-sheet side-${side} ${className}`.trim()}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ui-sheet-title"
      >
        <header className="ui-sheet-header">
          <div>
            {title ? <h3 id="ui-sheet-title">{title}</h3> : null}
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          <button type="button" className="btn btn-secondary btn-small" onClick={() => onClose?.()} aria-label="إغلاق اللوحة">
            ✕
          </button>
        </header>
        <div className="ui-sheet-body">{children}</div>
        {actions ? <footer className="ui-sheet-footer">{actions}</footer> : null}
      </section>
    </div>,
    document.body,
  );
}

import { useState } from 'react';

/**
 * Enhanced Input Component
 * Features:
 * - Field validation
 * - Error states
 * - Loading states
 * - Clear button
 * - Character counter
 * - Accessibility
 */
export default function InputEnhanced({
  label,
  hint,
  error,
  value = '',
  maxLength,
  showCharCount = false,
  clearable = false,
  onClear,
  disabled = false,
  loading = false,
  icon,
  className = '',
  type = 'text',
  required = false,
  pattern,
  validate,
  onChange,
  ...props
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [internalError, setInternalError] = useState('');

  const displayError = error || internalError;
  const charCount = value?.length || 0;
  const isAtLimit = maxLength && charCount >= maxLength;

  const handleChange = (e) => {
    const newValue = e.target.value;
    
    // Clear internal error on change
    if (internalError) setInternalError('');

    // Validate if validator provided
    if (validate) {
      const validationError = validate(newValue);
      if (validationError) {
        setInternalError(validationError);
      }
    }

    // Pattern validation
    if (pattern && newValue && !new RegExp(pattern).test(newValue)) {
      setInternalError(`صيغة غير صحيحة`);
    }

    if (onChange) {
      onChange(e);
    }
  };

  const handleClear = () => {
    if (onClear) {
      onClear();
    } else if (onChange) {
      const event = {
        target: { value: '' },
      };
      onChange(event);
    }
    setInternalError('');
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    if (props.onBlur) {
      props.onBlur(e);
    }
  };

  const handleFocus = (e) => {
    setIsFocused(true);
    if (props.onFocus) {
      props.onFocus(e);
    }
  };

  const inputClasses = [
    'input-enhanced',
    displayError ? 'input-error' : '',
    isFocused ? 'input-focused' : '',
    disabled ? 'input-disabled' : '',
    loading ? 'input-loading' : '',
    icon ? 'input-with-icon' : '',
    clearable && value ? 'input-clearable' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="input-wrapper">
      {label && (
        <label className="input-label">
          {label}
          {required && <span className="required-indicator">*</span>}
        </label>
      )}

      <div className="input-container">
        {icon && <span className="input-icon">{icon}</span>}

        <input
          type={type}
          className={inputClasses}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          disabled={disabled || loading}
          maxLength={maxLength}
          required={required}
          pattern={pattern}
          aria-invalid={!!displayError}
          aria-describedby={displayError ? `${props.id}-error` : hint ? `${props.id}-hint` : undefined}
          {...props}
        />

        {loading && (
          <span className="input-spinner" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" opacity="0.3" />
              <path d="M12 2a10 10 0 0 1 10 10" />
            </svg>
          </span>
        )}

        {clearable && value && !loading && (
          <button
            type="button"
            className="input-clear-btn"
            onClick={handleClear}
            aria-label="مسح المدخل"
            tabIndex={-1}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* Character Counter */}
      {showCharCount && maxLength && (
        <div className={`char-counter ${isAtLimit ? 'char-counter-warning' : ''}`}>
          {charCount} / {maxLength}
        </div>
      )}

      {/* Error Message */}
      {displayError && (
        <div className="input-error-message" id={`${props.id}-error`} role="alert">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{displayError}</span>
        </div>
      )}

      {/* Hint Text */}
      {hint && !displayError && (
        <div className="input-hint" id={`${props.id}-hint`}>
          {hint}
        </div>
      )}

      <style>{`
        .input-wrapper {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .input-label {
          font-size: 14px;
          font-weight: 500;
          color: var(--text);
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .required-indicator {
          color: #ef4444;
        }

        .input-container {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-enhanced {
          width: 100%;
          padding: 10px 12px;
          font-size: 14px;
          border: 1px solid var(--line);
          border-radius: 6px;
          background: var(--bg-input);
          color: var(--text);
          transition: all 0.2s ease;
          outline: none;
          font-family: inherit;
        }

        .input-enhanced::placeholder {
          color: var(--muted);
        }

        .input-enhanced:hover:not(:disabled) {
          border-color: var(--line-hover);
        }

        .input-enhanced:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(var(--accent-rgb), 0.1);
        }

        .input-enhanced.input-error {
          border-color: #ef4444;
          background: rgba(239, 68, 68, 0.05);
        }

        .input-enhanced.input-error:focus {
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
        }

        .input-enhanced:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          background: var(--bg-soft);
        }

        .input-enhanced.input-loading {
          padding-right: 36px;
        }

        .input-enhanced.input-with-icon {
          padding-left: 36px;
        }

        .input-icon {
          position: absolute;
          left: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--muted);
          pointer-events: none;
        }

        .input-spinner {
          position: absolute;
          right: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--accent);
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .input-clear-btn {
          position: absolute;
          right: 10px;
          background: none;
          border: none;
          color: var(--muted);
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s ease;
        }

        .input-clear-btn:hover {
          color: var(--text);
        }

        .input-clear-btn:active {
          transform: scale(0.95);
        }

        .input-error-message {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #ef4444;
          animation: slideDown 0.2s ease-out;
        }

        .input-hint {
          font-size: 12px;
          color: var(--muted);
        }

        .char-counter {
          font-size: 12px;
          color: var(--muted);
          text-align: right;
        }

        .char-counter-warning {
          color: #f59e0b;
          font-weight: 500;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Responsive design */
        @media (max-width: 640px) {
          .input-enhanced {
            font-size: 16px;
            padding: 12px 14px;
          }

          .input-label {
            font-size: 13px;
          }

          .input-error-message {
            font-size: 11px;
          }
        }
      `}</style>
    </div>
  );
}

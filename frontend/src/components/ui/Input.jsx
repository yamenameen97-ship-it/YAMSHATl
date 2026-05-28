export default function Input({
  label,
  hint,
  error = '',
  className = '',
  inputClassName = '',
  leading = null,
  trailing = null,
  as = 'input',
  rows = 4,
  ...props
}) {
  const Tag = as === 'textarea' ? 'textarea' : 'input';

  return (
    <label className={`field ${error ? 'has-error' : ''} ${className}`.trim()}>
      {label ? <span className="field-label">{label}</span> : null}
      <span className={`input-shell ${leading ? 'has-leading' : ''} ${trailing ? 'has-trailing' : ''}`.trim()}>
        {leading ? <span className="input-addon input-addon-leading">{leading}</span> : null}
        <Tag className={`input ${inputClassName}`.trim()} rows={Tag === 'textarea' ? rows : undefined} {...props} />
        {trailing ? <span className="input-addon input-addon-trailing">{trailing}</span> : null}
      </span>
      {error ? <span className="field-error">{error}</span> : hint ? <span className="field-hint">{hint}</span> : null}
    </label>
  );
}

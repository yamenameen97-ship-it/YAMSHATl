import { useMemo, useState } from 'react';

export default function Tabs({
  items = [],
  value,
  defaultValue,
  onChange,
  variant = 'segmented',
  className = '',
  fullWidth = false,
}) {
  const firstValue = items[0]?.value;
  const [internalValue, setInternalValue] = useState(defaultValue ?? firstValue);
  const activeValue = value ?? internalValue ?? firstValue;
  const activeItem = useMemo(() => items.find((item) => item.value === activeValue) || items[0], [items, activeValue]);

  const selectTab = (nextValue) => {
    if (value === undefined) setInternalValue(nextValue);
    onChange?.(nextValue);
  };

  if (!items.length) return null;

  return (
    <div className={`ui-tabs-shell ${className}`.trim()}>
      <div className={`ui-tabs ui-tabs-${variant} ${fullWidth ? 'is-full-width' : ''}`.trim()} role="tablist" aria-orientation="horizontal">
        {items.map((item) => {
          const selected = item.value === activeValue;
          return (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={selected}
              className={`ui-tab ${selected ? 'is-active' : ''}`.trim()}
              onClick={() => selectTab(item.value)}
            >
              {item.icon ? <span className="ui-tab-icon" aria-hidden="true">{item.icon}</span> : null}
              <span>{item.label}</span>
              {item.badge ? <strong className="ui-tab-badge">{item.badge}</strong> : null}
            </button>
          );
        })}
      </div>
      {activeItem?.content ? (
        <div className="ui-tab-panel" role="tabpanel">
          {activeItem.content}
        </div>
      ) : null}
    </div>
  );
}

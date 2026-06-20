import React, { useState, useEffect, useRef, useCallback } from 'react';

/**
 * 🔍 AdvancedSearch — مكون البحث المتقدم
 * يدعم: البحث المباشر، الفلاتر، الاقتراحات، debounce
 * يستخدم Neon Theme تلقائياً عبر classes في badges-indicators.css
 *
 * Props:
 *  - placeholder: نص داخل حقل البحث
 *  - onSearch: (query, filters) => void
 *  - filters: [{ key, label }] قائمة الفلاتر المتاحة
 *  - suggestions: [{ id, label, icon, type }] اقتراحات
 *  - debounceMs: تأخير قبل تنفيذ البحث (افتراضي 250ms)
 */
export default function AdvancedSearch({
  placeholder = 'بحث...',
  onSearch,
  filters = [],
  suggestions = [],
  debounceMs = 250,
  className = '',
}) {
  const [query, setQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef(null);
  const debounceRef = useRef(null);

  const fireSearch = useCallback((q, f) => {
    if (typeof onSearch === 'function') onSearch(q, f);
  }, [onSearch]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fireSearch(query.trim(), activeFilters);
    }, debounceMs);
    return () => clearTimeout(debounceRef.current);
  }, [query, activeFilters, debounceMs, fireSearch]);

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggleFilter = (key) => {
    setActiveFilters((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  return (
    <div
      ref={containerRef}
      className={`search-bar-advanced ${className}`.trim()}
      style={{ position: 'relative' }}
    >
      <input
        type="search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setShowSuggestions(true);
        }}
        onFocus={() => setShowSuggestions(true)}
        placeholder={placeholder}
        aria-label="advanced search"
      />
      <span className="search-icon" aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      </span>

      {filters.length > 0 && (
        <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
          {filters.map((f) => (
            <button
              type="button"
              key={f.key}
              onClick={() => toggleFilter(f.key)}
              className={`filter-chip ${activeFilters.includes(f.key) ? 'active' : ''}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {showSuggestions && query.trim() && suggestions.length > 0 && (
        <div className="search-suggestions" role="listbox">
          {suggestions.slice(0, 8).map((s) => (
            <div
              key={s.id}
              className="suggestion-item"
              role="option"
              onClick={() => {
                setQuery(s.label);
                setShowSuggestions(false);
                fireSearch(s.label, activeFilters);
              }}
            >
              {s.icon && <span aria-hidden="true">{s.icon}</span>}
              <span style={{ flex: 1 }}>{s.label}</span>
              {s.type && (
                <span style={{
                  fontSize: '0.7rem',
                  color: 'var(--neon-text-muted, #8a7bb0)',
                }}>
                  {s.type}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

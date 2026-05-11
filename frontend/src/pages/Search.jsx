import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import EmptyState from '../components/feedback/EmptyState.jsx';
import ErrorState from '../components/feedback/ErrorState.jsx';
import { ListSkeleton } from '../components/feedback/Skeleton.jsx';
import useDebounce from '../hooks/useDebounce';
import axios from 'axios';

const SEARCH_FILTERS = [
  { key: 'all', label: 'الكل' },
  { key: 'users', label: 'المستخدمون' },
  { key: 'posts', label: 'المنشورات' },
  { key: 'groups', label: 'المجموعات' },
  { key: 'hashtags', label: 'الهاشتاجات' },
];

const SORT_OPTIONS = [
  { value: 'relevance', label: 'الملاءمة' },
  { value: 'recent', label: 'الأحدث' },
  { value: 'popular', label: 'الأكثر شهرة' },
];

const SEARCH_HISTORY_KEY = 'yamshat.search.history';
const SEARCH_CACHE = new Map();

export default function Search() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 500);
  const [filterKey, setFilterKey] = useState('all');
  const [sortBy, setSortBy] = useState('relevance');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const abortControllerRef = useRef(null);

  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem(SEARCH_HISTORY_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const trending = [
    { id: 1, tag: '#Yamshat_2026', count: '120K' },
    { id: 2, tag: '#AI_Future', count: '85K' },
    { id: 3, tag: '#Web3', count: '45K' }
  ];

  const suggestions = useMemo(() => {
    if (!query) return [];
    return history.filter(h => h.toLowerCase().includes(query.toLowerCase())).slice(0, 5);
  }, [query, history]);

  const performSearch = useCallback(async (isNewSearch = true) => {
    if (!debouncedQuery.trim()) return;

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const currentPage = isNewSearch ? 1 : page;
    const cacheKey = `${debouncedQuery}-${filterKey}-${sortBy}-${currentPage}`;

    // Check Cache
    if (isNewSearch && SEARCH_CACHE.has(cacheKey)) {
      setResults(SEARCH_CACHE.get(cacheKey));
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Mock API Call with Abort Signal
      const response = await axios.get('/api/search', {
        params: { q: debouncedQuery, filter: filterKey, sort: sortBy, page: currentPage },
        signal: abortControllerRef.current.signal
      }).catch(err => {
        if (axios.isCancel(err)) return { data: { results: [], hasMore: false } };
        throw err;
      });

      const newResults = response.data.results || [];
      if (isNewSearch) {
        setResults(newResults);
        SEARCH_CACHE.set(cacheKey, newResults);
      } else {
        setResults(prev => [...prev, ...newResults]);
      }
      
      setHasMore(response.data.hasMore);
      
      // Save to history
      if (isNewSearch && !history.includes(debouncedQuery)) {
        const newHistory = [debouncedQuery, ...history].slice(0, 10);
        setHistory(newHistory);
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
      }
    } catch (err) {
      if (err.name !== 'CanceledError') {
        setError('حدث خطأ أثناء البحث. حاول مرة أخرى.');
      }
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, filterKey, sortBy, page, history]);

  useEffect(() => {
    if (debouncedQuery) {
      setPage(1);
      performSearch(true);
    } else {
      setResults([]);
    }
  }, [debouncedQuery, filterKey, sortBy]);

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
      performSearch(false);
    }
  };

  return (
    <MainLayout>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: 20, color: 'white' }}>
        <Card style={{ padding: 20, marginBottom: 20 }}>
          <Input 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث عن أي شيء..."
            style={{ fontSize: 18 }}
          />
          
          {suggestions.length > 0 && (
            <div style={{ marginTop: 10, background: '#222', borderRadius: 8, padding: 10 }}>
              <div style={{ fontSize: 12, opacity: 0.5, marginBottom: 5 }}>مقترحات</div>
              {suggestions.map(s => (
                <div key={s} onClick={() => setQuery(s)} style={{ padding: '5px 0', cursor: 'pointer' }}>🕒 {s}</div>
              ))}
            </div>
          )}
        </Card>

        {!debouncedQuery && (
          <div className="search-discovery">
            <div style={{ marginBottom: 30 }}>
              <h3>البحث الأخير</h3>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
                {history.map(h => (
                  <span key={h} onClick={() => setQuery(h)} style={{ padding: '5px 15px', background: '#333', borderRadius: 20, cursor: 'pointer' }}>{h}</span>
                ))}
              </div>
            </div>

            <div>
              <h3>الأكثر رواجاً 🔥</h3>
              <div style={{ marginTop: 10 }}>
                {trending.map(t => (
                  <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #222' }}>
                    <span>{t.tag}</span>
                    <span style={{ opacity: 0.5 }}>{t.count} منشور</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {debouncedQuery && (
          <div className="results">
            <div style={{ display: 'flex', gap: 10, marginBottom: 20, overflowX: 'auto' }}>
              {SEARCH_FILTERS.map(f => (
                <button 
                  key={f.key}
                  onClick={() => setFilterKey(f.key)}
                  style={{ 
                    padding: '5px 15px', 
                    borderRadius: 20, 
                    background: filterKey === f.key ? 'var(--primary)' : '#222',
                    border: 'none', color: 'white', whiteSpace: 'nowrap'
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {loading && page === 1 ? <ListSkeleton /> : (
              <>
                {results.length === 0 ? <EmptyState message="لا توجد نتائج" /> : (
                  results.map(r => (
                    <Card key={r.id} style={{ padding: 15, marginBottom: 10 }}>
                      <h4>{r.title || r.name}</h4>
                      <p style={{ opacity: 0.7 }}>{r.description || r.content}</p>
                    </Card>
                  ))
                )}
                {hasMore && (
                  <Button onClick={loadMore} disabled={loading} style={{ width: '100%', marginTop: 20 }}>
                    {loading ? 'جاري التحميل...' : 'تحميل المزيد'}
                  </Button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}

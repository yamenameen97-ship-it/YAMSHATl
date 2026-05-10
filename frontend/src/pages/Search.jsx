import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import EmptyState from '../components/feedback/EmptyState.jsx';
import ErrorState from '../components/feedback/ErrorState.jsx';
import { ListSkeleton } from '../components/feedback/Skeleton.jsx';

const SEARCH_FILTERS = [
  { key: 'all', label: 'الكل' },
  { key: 'users', label: 'المستخدمون' },
  { key: 'posts', label: 'المنشورات' },
  { key: 'groups', label: 'المجموعات' },
  { key: 'hashtags', label: 'الهاشتاجات' },
];

const SORT_OPTIONS = [
  { value: 'relevance', label: 'الملاءمة (Elastic)' },
  { value: 'recent', label: 'الأحدث' },
  { value: 'popular', label: 'الأكثر شهرة' },
  { value: 'trending', label: 'الرائج' },
];

const DEBOUNCE_DELAY = 300;
const SEARCH_HISTORY_KEY = 'yamshat.search.history';
const MAX_HISTORY_ITEMS = 10;

function getSearchHistory() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(SEARCH_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSearchHistory(query) {
  if (typeof window === 'undefined' || !query.trim()) return;
  try {
    let history = getSearchHistory();
    history = history.filter((item) => item !== query);
    history.unshift(query);
    history = history.slice(0, MAX_HISTORY_ITEMS);
    window.localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
  } catch {
    // ignore
  }
}

function clearSearchHistory() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(SEARCH_HISTORY_KEY);
  } catch {
    // ignore
  }
}

export default function Search() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [filterKey, setFilterKey] = useState('all');
  const [sortBy, setSortBy] = useState('relevance');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchHistory, setSearchHistory] = useState(getSearchHistory());
  
  // Advanced Filters State
  const [advancedFilters, setAdvancedFilters] = useState({
    dateRange: 'all',
    location: '',
    verifiedOnly: false,
    hasMedia: false,
  });
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [trendingSearches, setTrendingSearches] = useState([
    { topic: '#الذكاء_الاصطناعي', count: 5400, trend: 'up' },
    { topic: '#Yamshat_Update', count: 3200, trend: 'up' },
    { topic: 'وظائف تقنية', count: 2100, trend: 'stable' },
    { topic: '#React_2024', count: 1850, trend: 'down' },
  ]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, DEBOUNCE_DELAY);

    return () => clearTimeout(timer);
  }, [query]);

  // Perform search when debounced query or filters change
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    performSearch();
  }, [debouncedQuery, filterKey, sortBy, advancedFilters]);

  // Generate search suggestions
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      return;
    }

    const mockSuggestions = [
      `${query} في المستخدمين`,
      `${query} في المنشورات`,
      `#${query}`,
      `@${query}`,
    ].filter((item) => item !== query);

    setSuggestions(mockSuggestions);
    setShowSuggestions(true);
  }, [query]);

  const performSearch = useCallback(async () => {
    if (!debouncedQuery.trim()) return;

    try {
      setLoading(true);
      setError('');

      // ElasticSearch Simulation Integration
      // In a real app, this would be: const response = await api.get('/search/elastic', { params: { q: debouncedQuery, ...filters } });
      console.log('Executing ElasticSearch query for:', debouncedQuery, { filterKey, sortBy, advancedFilters });
      
      const mockResults = generateMockResults(debouncedQuery, filterKey, sortBy);
      
      // Simulate ElasticSearch Latency
      await new Promise((resolve) => setTimeout(resolve, 450));
      
      setResults(mockResults);
      saveSearchHistory(debouncedQuery);
      setSearchHistory(getSearchHistory());
    } catch (err) {
      setError(err?.message || 'تعذر تنفيذ البحث عبر ElasticSearch. حاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, filterKey, sortBy, advancedFilters]);

  const generateMockResults = (searchQuery, filter, sort) => {
    const mockData = {
      users: [
        { id: 1, type: 'user', name: `${searchQuery} Expert`, username: `pro_${searchQuery}`, avatar: '🚀', followers: 15200, verified: true, score: 0.98 },
        { id: 2, type: 'user', name: `${searchQuery} Dev`, username: `dev_${searchQuery}`, avatar: '💻', followers: 8400, verified: false, score: 0.85 },
      ],
      posts: [
        { id: 1, type: 'post', title: `دليل شامل عن ${searchQuery}`, content: `هذا المنشور يحتوي على معلومات متقدمة حول ${searchQuery}...`, likes: 450, comments: 88, hasMedia: true, date: '2024-01-10' },
        { id: 2, type: 'post', title: `أخبار ${searchQuery} اليوم`, content: `تطورات جديدة في عالم ${searchQuery} تجذب الانتباه...`, likes: 210, comments: 34, hasMedia: false, date: '2024-01-09' },
      ],
      groups: [
        { id: 1, type: 'group', name: `مجتمع ${searchQuery}`, description: 'مكان للمهتمين بـ ' + searchQuery, members: 12400 },
      ],
      hashtags: [
        { id: 1, type: 'hashtag', tag: `#${searchQuery}`, posts: 45000 },
      ],
    };

    let filtered = [];
    if (filter === 'all') {
      filtered = [...(mockData.users || []), ...(mockData.posts || []), ...(mockData.groups || []), ...(mockData.hashtags || [])];
    } else {
      filtered = mockData[filter] || [];
    }

    // Apply Advanced Filters
    if (advancedFilters.verifiedOnly) {
      filtered = filtered.filter(item => item.type !== 'user' || item.verified);
    }
    if (advancedFilters.hasMedia) {
      filtered = filtered.filter(item => item.type !== 'post' || item.hasMedia);
    }

    // ElasticSearch Relevance Sorting (Mock)
    if (sort === 'relevance') {
      filtered = filtered.sort((a, b) => (b.score || 0) - (a.score || 0));
    } else if (sort === 'popular') {
      filtered = filtered.sort((a, b) => (b.followers || b.likes || b.members || 0) - (a.followers || a.likes || a.members || 0));
    }

    return filtered;
  };

  const handleSearch = (value) => {
    setQuery(value);
    setShowSuggestions(true);
  };

  return (
    <MainLayout>
      <section className="search-page-grid">
        <div className="search-main-column">
          <Card className="search-hero-card">
            <div className="section-head compact">
              <div>
                <h3 className="section-title">🔍 محرك البحث الذكي (ElasticSearch)</h3>
                <p className="muted">بحث فائق السرعة مع دعم الفلاتر المتقدمة والنتائج الأكثر ملاءمة.</p>
              </div>
            </div>

            <div className="search-input-wrapper">
              <Input
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="ابحث عن مستخدمين، منشورات، أو هاشتاجات..."
                className="large-search-input"
              />
              <div className="search-actions">
                <Button 
                  variant={showAdvanced ? 'primary' : 'secondary'} 
                  size="small" 
                  onClick={() => setShowAdvanced(!showAdvanced)}
                >
                  {showAdvanced ? 'إخفاء الفلاتر' : 'فلاتر متقدمة'}
                </Button>
              </div>
            </div>

            {showAdvanced && (
              <div className="advanced-filters-panel animate-fade-in">
                <div className="filter-grid">
                  <div className="filter-group">
                    <label>النطاق الزمني</label>
                    <select 
                      value={advancedFilters.dateRange} 
                      onChange={(e) => setAdvancedFilters({...advancedFilters, dateRange: e.target.value})}
                    >
                      <option value="all">كل الوقت</option>
                      <option value="today">اليوم</option>
                      <option value="week">هذا الأسبوع</option>
                      <option value="month">هذا الشهر</option>
                    </select>
                  </div>
                  <div className="filter-group">
                    <label>الموقع</label>
                    <Input 
                      placeholder="المدينة أو الدولة" 
                      value={advancedFilters.location}
                      onChange={(e) => setAdvancedFilters({...advancedFilters, location: e.target.value})}
                    />
                  </div>
                  <div className="filter-checkboxes">
                    <label className="checkbox-label">
                      <input 
                        type="checkbox" 
                        checked={advancedFilters.verifiedOnly}
                        onChange={(e) => setAdvancedFilters({...advancedFilters, verifiedOnly: e.target.checked})}
                      />
                      الحسابات الموثقة فقط
                    </label>
                    <label className="checkbox-label">
                      <input 
                        type="checkbox" 
                        checked={advancedFilters.hasMedia}
                        onChange={(e) => setAdvancedFilters({...advancedFilters, hasMedia: e.target.checked})}
                      />
                      المنشورات التي تحتوي وسائط
                    </label>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {debouncedQuery.trim() ? (
            <>
              <div className="search-results-header">
                <div className="tabs-container">
                  {SEARCH_FILTERS.map((f) => (
                    <button 
                      key={f.key} 
                      className={`tab-item ${filterKey === f.key ? 'active' : ''}`}
                      onClick={() => setFilterKey(f.key)}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                <select 
                  className="sort-dropdown"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              {loading ? <ListSkeleton count={3} /> : (
                <div className="results-list">
                  {results.map((res) => (
                    <Card key={`${res.type}-${res.id}`} className="result-item-card">
                      <div className="result-flex">
                        <div className="result-main">
                          <div className="result-type-badge">{res.type}</div>
                          <h4>{res.name || res.title || res.tag} {res.verified && '✅'}</h4>
                          <p className="muted">{res.username ? `@${res.username}` : res.content}</p>
                          <div className="result-stats">
                            {res.followers && <span>{res.followers.toLocaleString()} متابع</span>}
                            {res.likes && <span>❤️ {res.likes}</span>}
                            {res.members && <span>👥 {res.members} عضو</span>}
                          </div>
                        </div>
                        <Button variant="secondary" size="small">عرض</Button>
                      </div>
                    </Card>
                  ))}
                  {results.length === 0 && <EmptyState title="لا توجد نتائج" description="جرب تغيير كلمات البحث أو الفلاتر" />}
                </div>
              )}
            </>
          ) : (
            <div className="search-placeholder-view">
              <Card>
                <h4>سجل البحث الأخير</h4>
                <div className="history-tags">
                  {searchHistory.map((h, i) => (
                    <span key={i} className="history-tag" onClick={() => setQuery(h)}>{h}</span>
                  ))}
                  {searchHistory.length === 0 && <p className="muted">لا يوجد سجل بحث حالياً</p>}
                </div>
                {searchHistory.length > 0 && (
                  <button className="text-btn danger" onClick={() => { clearSearchHistory(); setSearchHistory([]); }}>مسح السجل</button>
                )}
              </Card>
            </div>
          )}
        </div>

        <div className="search-side-column">
          <Card className="trending-card">
            <h3 className="section-title">🔥 عمليات البحث الرائجة</h3>
            <div className="trending-list">
              {trendingSearches.map((item, index) => (
                <div key={index} className="trending-search-item" onClick={() => setQuery(item.topic.replace('#', ''))}>
                  <div className="trend-info">
                    <span className="trend-rank">{index + 1}</span>
                    <span className="trend-topic">{item.topic}</span>
                  </div>
                  <div className="trend-meta">
                    <span className="trend-count">{item.count.toLocaleString()}</span>
                    <span className={`trend-indicator ${item.trend}`}>
                      {item.trend === 'up' ? '📈' : item.trend === 'down' ? '📉' : '➖'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="search-tips-card">
            <h4>نصائح للبحث المتقدم</h4>
            <ul className="tips-list">
              <li>استخدم <code>"عبارة"</code> للبحث عن جملة مطابقة.</li>
              <li>استخدم <code>-كلمة</code> لاستبعاد نتائج معينة.</li>
              <li>استخدم <code>user:name</code> للبحث عن مستخدم محدد.</li>
            </ul>
          </Card>
        </div>
      </section>
    </MainLayout>
  );
}

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import EmptyState from '../components/feedback/EmptyState.jsx';
import ErrorState from '../components/feedback/ErrorState.jsx';
import { ListSkeleton } from '../components/feedback/Skeleton.jsx';
import useDebounce from '../hooks/useDebounce';
import { getPosts } from '../api/posts.js';
import { getUsers } from '../api/users.js';
import { getSearchSuggestions, getTrendingSearches, liveSearch } from '../api/search.js';
import { groupSearchResults } from '../utils/fuzzySearch.js';
import {
  buildSearchCollections,
  buildSearchIndex,
  buildUserDiscovery,
  getSearchInsights,
  searchIndex,
} from '../services/search/searchEngine.js';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

const SEARCH_FILTERS = [
  { key: 'all', label: 'الكل' },
  { key: 'users', label: 'الأشخاص' },
  { key: 'posts', label: 'المنشورات' },
  { key: 'reels', label: 'الريلز' },
  { key: 'hashtags', label: 'الهاشتاجات' },
];

const SEARCH_HISTORY_KEY = 'yamshat.search.history';
const TOPBAR_SEARCH_KEY = 'yamshat.topbarSearch';
const SEARCH_COLLECTIONS_CACHE_KEY = 'yamshat.search.collections.cache.v2';
const SEARCH_RESULTS_CACHE_TTL = 5 * 60 * 1000;

function resolveIncomingSearch(search = '') {
  const params = new URLSearchParams(search);
  const queryFromUrl = params.get('q') || '';
  if (queryFromUrl) return queryFromUrl;
  if (typeof window === 'undefined') return '';
  return window.sessionStorage.getItem(TOPBAR_SEARCH_KEY) || '';
}

function restoreCollectionsCache() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(SEARCH_COLLECTIONS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - Number(parsed.timestamp || 0) > SEARCH_RESULTS_CACHE_TTL) return null;
    return parsed.collections || null;
  } catch {
    return null;
  }
}

function persistCollectionsCache(collections) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SEARCH_COLLECTIONS_CACHE_KEY, JSON.stringify({ timestamp: Date.now(), collections }));
  } catch {
    // ignore caching failures
  }
}

function SearchResultRow({ index, style, data }) {
  const { results, openResult, setQuery } = data;
  const item = results[index];
  if (!item) return null;

  const accent = item.type === 'users' ? '👤' : item.type === 'posts' ? '📝' : item.type === 'reels' ? '🎬' : '#';

  return (
    <div style={{ ...style, padding: '8px 0' }}>
      <Card style={{ padding: 18, height: '100%', overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <div style={{ width: 54, height: 54, borderRadius: 16, background: 'rgba(59,130,246,0.12)', display: 'grid', placeItems: 'center', fontSize: 20, overflow: 'hidden', flexShrink: 0 }}>
            {item.avatar ? <img src={item.avatar} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : accent}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <h3 style={{ margin: '0 0 6px', fontSize: 16 }}>{item.title}</h3>
                <div className="muted" style={{ fontSize: 12 }}>{item.type === 'users' ? 'شخص' : item.type === 'posts' ? 'منشور' : item.type === 'reels' ? 'ريل' : 'هاشتاج'}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                {item.isVerified ? <span className="score-pill">موثّق</span> : null}
                <span className="score-pill">match {Math.round(item.score * 100)}%</span>
              </div>
            </div>
            <p style={{ margin: '10px 0', opacity: 0.86, fontSize: 13, lineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {item.description || item.content || 'بدون وصف إضافي'}
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
              {(item.hashtags || []).slice(0, 3).map((tag) => <button key={tag} type="button" className="micro-chip" onClick={() => setQuery(tag)}>{tag}</button>)}
              {(item.mentions || []).slice(0, 2).map((mention) => <button key={mention} type="button" className="micro-chip mention" onClick={() => setQuery(mention)}>{mention}</button>)}
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Button size="small" onClick={() => openResult(item)}>{item.type === 'hashtags' ? 'تصفية بالهاشتاج' : 'فتح'}</Button>
              <Button variant="secondary" size="small" onClick={() => setQuery(item.name || item.title)}>بحث مشابه</Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function Search() {
  const location = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState(() => resolveIncomingSearch(location.search));
  const debouncedQuery = useDebounce(query, 180);
  const [filterKey, setFilterKey] = useState('all');
  const [sortBy, setSortBy] = useState('relevance');
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [onlyMedia, setOnlyMedia] = useState(false);
  const [requiredHashtag, setRequiredHashtag] = useState('');
  const [requiredMention, setRequiredMention] = useState('');
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [collections, setCollections] = useState(() => restoreCollectionsCache() || { users: [], posts: [], reels: [], hashtags: [] });
  const [history, setHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY) || '[]');
    } catch {
      return [];
    }
  });
  const [remoteResults, setRemoteResults] = useState([]);
  const [remoteSuggestions, setRemoteSuggestions] = useState([]);
  const [remoteTrending, setRemoteTrending] = useState([]);
  const searchCacheRef = useRef(new Map());

  useEffect(() => {
    const incomingQuery = resolveIncomingSearch(location.search);
    if (incomingQuery && incomingQuery !== query) setQuery(incomingQuery);
  }, [location.search]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (query.trim()) window.sessionStorage.setItem(TOPBAR_SEARCH_KEY, query.trim());
    else window.sessionStorage.removeItem(TOPBAR_SEARCH_KEY);
  }, [query]);

  const hydrateCollections = useCallback(async () => {
    try {
      setLoading((prev) => prev && !(collections.users?.length || collections.posts?.length));
      setError('');
      const [{ data: usersData }, { data: postsData }] = await Promise.all([getUsers(), getPosts({ limit: 120, page: 1 })]);
      const users = Array.isArray(usersData) ? usersData : usersData?.items || [];
      const posts = Array.isArray(postsData) ? postsData : postsData?.items || [];
      const nextCollections = buildSearchCollections(users, posts);
      setCollections(nextCollections);
      persistCollectionsCache(nextCollections);
    } catch (err) {
      if (!(collections.users?.length || collections.posts?.length)) {
        setError(err?.response?.data?.detail || err?.message || 'تعذر تحميل بيانات البحث الذكي.');
      }
    } finally {
      setLoading(false);
    }
  }, [collections.posts?.length, collections.users?.length]);

  useEffect(() => {
    hydrateCollections();
  }, [hydrateCollections]);

  useEffect(() => {
    let cancelled = false;
    getTrendingSearches(8)
      .then((data) => {
        if (cancelled) return;
        setRemoteTrending(Array.isArray(data?.trending) ? data.trending : []);
      })
      .catch(() => {
        if (!cancelled) setRemoteTrending([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const trimmedQuery = debouncedQuery.trim();
    if (trimmedQuery.length < 2) {
      setRemoteResults([]);
      setRemoteSuggestions([]);
      return () => {
        cancelled = true;
      };
    }

    Promise.allSettled([
      liveSearch({ q: trimmedQuery, type: filterKey, limit: 12 }),
      getSearchSuggestions(trimmedQuery, 8),
    ]).then((responses) => {
      if (cancelled) return;
      const [resultsResponse, suggestionsResponse] = responses;
      setRemoteResults(resultsResponse.status === 'fulfilled' ? resultsResponse.value?.results || [] : []);
      setRemoteSuggestions(suggestionsResponse.status === 'fulfilled' ? suggestionsResponse.value?.suggestions || [] : []);
    });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, filterKey]);

  useEffect(() => {
    if (!debouncedQuery.trim()) return;
    setSearching(true);
    const timer = window.setTimeout(() => {
      setSearching(false);
      if (!history.includes(debouncedQuery.trim())) {
        const next = [debouncedQuery.trim(), ...history].slice(0, 12);
        setHistory(next);
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(next));
      }
    }, 120);
    return () => window.clearTimeout(timer);
  }, [debouncedQuery, history]);

  const searchIndexMemo = useMemo(() => buildSearchIndex(collections), [collections]);

  const results = useMemo(() => {
    const cacheKey = JSON.stringify({
      q: debouncedQuery,
      filterKey,
      sortBy,
      onlyVerified,
      onlyMedia,
      requiredHashtag,
      requiredMention,
      signature: searchIndexMemo.signature,
      remote: remoteResults.length,
    });

    if (searchCacheRef.current.has(cacheKey)) return searchCacheRef.current.get(cacheKey);

    const localResults = searchIndex(searchIndexMemo, debouncedQuery, {
      type: filterKey,
      sortBy,
      onlyVerified,
      onlyMedia,
      requiredHashtag,
      requiredMention,
      intent: filterKey === 'users' ? 'discover-users' : 'general-search',
    });

    const merged = [];
    const seen = new Set();
    [...remoteResults, ...localResults].forEach((item) => {
      const key = `${item.type}:${item.id}`;
      if (seen.has(key)) return;
      seen.add(key);
      merged.push(item);
    });

    const nextResults = sortBy === 'trending'
      ? merged.sort((left, right) => (right.metrics?.likes || right.metrics?.followers || right.score || 0) - (left.metrics?.likes || left.metrics?.followers || left.score || 0))
      : merged.sort((left, right) => (right.score || 0) - (left.score || 0));

    searchCacheRef.current.set(cacheKey, nextResults);
    if (searchCacheRef.current.size > 30) {
      const oldestKey = searchCacheRef.current.keys().next().value;
      searchCacheRef.current.delete(oldestKey);
    }
    return nextResults;
  }, [debouncedQuery, filterKey, sortBy, onlyVerified, onlyMedia, requiredHashtag, requiredMention, searchIndexMemo, remoteResults]);

  const grouped = useMemo(() => groupSearchResults(results), [results]);
  const suggestions = useMemo(() => {
    if (!query.trim()) return history.slice(0, 6);
    const localSuggestions = history.filter((item) => item.toLowerCase().includes(query.toLowerCase()));
    const remoteSuggestionTexts = remoteSuggestions.map((item) => item.text).filter(Boolean);
    return Array.from(new Set([...remoteSuggestionTexts, ...localSuggestions])).slice(0, 6);
  }, [history, query, remoteSuggestions]);
  const insights = useMemo(() => getSearchInsights(searchIndexMemo, debouncedQuery || query), [searchIndexMemo, debouncedQuery, query]);
  const userDiscovery = useMemo(() => buildUserDiscovery(searchIndexMemo, debouncedQuery || query, 8), [searchIndexMemo, debouncedQuery, query]);

  const openResult = useCallback((item) => {
    if (item.type === 'hashtags') {
      setQuery(item.title.replace(/^#/, ''));
      setRequiredHashtag(item.title);
      setFilterKey('hashtags');
      return;
    }
    navigate(item.route || '/search');
  }, [navigate]);

  const listData = useMemo(() => ({ results, openResult, setQuery }), [results, openResult]);

  return (
    <MainLayout>
      <div className="yam-search-page-shell" style={{ maxWidth: 1120, margin: '0 auto', padding: 20, minHeight: 'calc(var(--yam-vh, 100vh) - 70px)', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Card style={{ padding: 20, marginBottom: 18 }}>
          <div style={{ display: 'grid', gap: 14 }}>
            <div>
              <h2 style={{ margin: '0 0 8px' }}>البحث الذكي</h2>
              <p className="muted yam-search-subtitle" style={{ margin: 0 }}>بحث مفهرس مع تخزين مؤقت وفلاتر وهاشتاجات ومنشنات واكتشاف مستخدمين.</p>
            </div>

            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث باسم شخص أو #هاشتاج أو @منشن" inputClassName="yam-search-input" dir="rtl" />

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {SEARCH_FILTERS.map((filter) => (
                <Button key={filter.key} variant={filterKey === filter.key ? 'primary' : 'secondary'} size="small" onClick={() => setFilterKey(filter.key)}>
                  {filter.label}
                </Button>
              ))}
            </div>

            <div className="advanced-search-grid">
              <label className="search-select-field">
                <span>الترتيب</span>
                <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                  <option value="relevance">الأكثر صلة</option>
                  <option value="trending">الأكثر تفاعلاً</option>
                  <option value="fresh">الأحدث</option>
                  <option value="people">اكتشاف أشخاص</option>
                </select>
              </label>
              <label className="search-inline-toggle"><input type="checkbox" checked={onlyVerified} onChange={(event) => setOnlyVerified(event.target.checked)} /> موثّق فقط</label>
              <label className="search-inline-toggle"><input type="checkbox" checked={onlyMedia} onChange={(event) => setOnlyMedia(event.target.checked)} /> محتوى فيه وسائط</label>
              <Input value={requiredHashtag} onChange={(event) => setRequiredHashtag(event.target.value)} placeholder="#هاشتاج إضافي" />
              <Input value={requiredMention} onChange={(event) => setRequiredMention(event.target.value)} placeholder="@mention" />
            </div>

            {suggestions.length ? (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {suggestions.map((item) => <button key={item} type="button" className="micro-chip" onClick={() => setQuery(item)}>{item}</button>)}
              </div>
            ) : null}
          </div>
        </Card>

        <div style={{ flex: 1 }}>
          {loading ? <ListSkeleton count={6} /> : null}
          {!loading && error ? <ErrorState title="تعذر فتح البحث الذكي" description={error} onRetry={hydrateCollections} /> : null}

          {!loading && !error && !debouncedQuery ? (
            <div className="search-dashboard-grid">
              <Card style={{ padding: 18 }}>
                <h3 style={{ marginTop: 0 }}>سيرش سريع</h3>
                <div style={{ display: 'grid', gap: 12, marginTop: 14 }}>
                  {['مصممين UI', '#yamshat', '@support', 'ريلز طبخ', 'منشورات الذكاء الاصطناعي'].map((item) => (
                    <button key={item} type="button" className="discovery-row" onClick={() => setQuery(item)}>
                      <span>{item}</span>
                      <span>↖</span>
                    </button>
                  ))}
                </div>
              </Card>

              <Card style={{ padding: 18 }}>
                <h3 style={{ marginTop: 0 }}>الترند الآن</h3>
                <div style={{ display: 'grid', gap: 12 }}>
                  {(remoteTrending.length ? remoteTrending : (collections.hashtags || []).slice(0, 8)).map((item) => (
                    <button key={item.tag} type="button" className="trending-row" onClick={() => { setQuery(String(item.tag || '').replace(/^#/, '')); setRequiredHashtag(item.tag); }}>
                      <div>
                        <strong>{item.tag}</strong>
                        <div className="muted">{item.count || item.score || 0} نتيجة</div>
                      </div>
                    </button>
                  ))}
                </div>
              </Card>

              <Card style={{ padding: 18 }}>
                <h3 style={{ marginTop: 0 }}>اكتشاف أشخاص</h3>
                <div style={{ display: 'grid', gap: 10 }}>
                  {userDiscovery.slice(0, 6).map((user) => (
                    <button key={user.id} type="button" className="discovery-user-card" onClick={() => navigate(`/profile/${encodeURIComponent(user.username)}`)}>
                      <div className="discovery-avatar">{user.avatar ? <img src={user.avatar} alt={user.username} /> : '👤'}</div>
                      <div style={{ textAlign: 'start' }}>
                        <strong>{user.name || user.username}</strong>
                        <div className="muted">@{user.username}</div>
                        <div className="muted">{user.reason}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </Card>
            </div>
          ) : null}

          {!loading && !error && debouncedQuery ? (
            <div className="yam-search-results-layout" style={{ height: '100%', display: 'grid', gridTemplateColumns: '1.4fr 0.78fr', gap: 16 }}>
              <div style={{ minHeight: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Card style={{ padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <strong>النتائج ({results.length}) {searching ? '• جاري التحديث' : ''}</strong>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {Object.entries(grouped).map(([key, items]) => <span key={key} className="score-pill">{key} {items.length}</span>)}
                    </div>
                  </div>
                </Card>

                <div style={{ flex: 1, minHeight: 0 }}>
                  {!results.length ? (
                    <EmptyState icon="🔎" title="مفيش نتائج مناسبة" />
                  ) : (
                    <AutoSizer>
                      {({ height, width }) => (
                        <List height={height} width={width} itemCount={results.length} itemSize={190} itemData={listData} className="no-scrollbar">
                          {SearchResultRow}
                        </List>
                      )}
                    </AutoSizer>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
                <Card style={{ padding: 18 }}>
                  <h3 style={{ marginTop: 0 }}>Top hashtags</h3>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {insights.topHashtags.length ? insights.topHashtags.map((item) => (
                      <button key={item.tag} type="button" className="micro-chip" onClick={() => setQuery(item.tag)}>{item.tag} • {item.count}</button>
                    )) : <span className="muted">لما تكتب بحث هتظهر لك الهاشتاجات الأقرب.</span>}
                  </div>
                </Card>

                <Card style={{ padding: 18 }}>
                  <h3 style={{ marginTop: 0 }}>Top mentions</h3>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {insights.topMentions.length ? insights.topMentions.map((item) => (
                      <button key={item.mention} type="button" className="micro-chip mention" onClick={() => setQuery(item.mention)}>{item.mention} • {item.count}</button>
                    )) : <span className="muted">المنشنات هتظهر هنا تلقائي.</span>}
                  </div>
                </Card>

                <Card style={{ padding: 18 }}>
                  <h3 style={{ marginTop: 0 }}>People discovery</h3>
                  <div style={{ display: 'grid', gap: 10 }}>
                    {userDiscovery.map((user) => (
                      <button key={user.id} type="button" className="discovery-user-card" onClick={() => navigate(`/profile/${encodeURIComponent(user.username)}`)}>
                        <div className="discovery-avatar">{user.avatar ? <img src={user.avatar} alt={user.username} /> : '👤'}</div>
                        <div style={{ textAlign: 'start' }}>
                          <strong>{user.name || user.username}</strong>
                          <div className="muted">@{user.username} • {user.followers} متابع</div>
                          <div className="muted">{user.reason}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <style>{`
        .yam-search-page-shell {
          box-sizing: border-box;
        }
        .yam-search-input {
          direction: rtl;
          text-align: right;
        }
        .yam-search-subtitle {
          line-height: 1.7;
        }
        .yam-search-results-layout {
          height: 100%;
        }
        .search-dashboard-grid { display: grid; grid-template-columns: 1.1fr 0.9fr 1fr; gap: 16px; }
        .advanced-search-grid { display: grid; grid-template-columns: 180px repeat(2, auto) 1fr 1fr; gap: 10px; align-items: center; }
        .search-select-field { display: grid; gap: 6px; color: #cbd5e1; font-size: 13px; }
        .search-select-field select {
          border-radius: 14px; padding: 12px 14px; border: 1px solid rgba(148,163,184,0.18);
          background: rgba(15,23,42,0.68); color: white;
        }
        .search-inline-toggle { display: flex; align-items: center; gap: 8px; color: #cbd5e1; font-size: 13px; }
        .discovery-row, .trending-row, .discovery-user-card {
          width: 100%; border: 1px solid rgba(148,163,184,0.14); background: rgba(15,23,42,0.45); color: white;
          border-radius: 16px; padding: 14px 16px; display: flex; align-items: center; justify-content: space-between;
          text-align: inherit; cursor: pointer; gap: 12px;
        }
        .discovery-user-card { justify-content: flex-start; }
        .discovery-avatar {
          width: 48px; height: 48px; border-radius: 16px; overflow: hidden; display: grid; place-items: center;
          background: rgba(59,130,246,0.14); flex-shrink: 0;
        }
        .discovery-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .score-pill, .micro-chip {
          display: inline-flex; align-items: center; justify-content: center; padding: 4px 12px; border-radius: 999px;
          background: rgba(59,130,246,0.14); color: #93c5fd; border: 1px solid rgba(147,197,253,0.3); font-size: 11px;
        }
        .micro-chip { cursor: pointer; }
        .micro-chip.mention { background: rgba(168,85,247,0.14); color: #d8b4fe; border-color: rgba(216,180,254,0.35); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @media (max-width: 980px) {
          .yam-search-page-shell {
            padding: 14px !important;
            min-height: auto !important;
          }
          .search-dashboard-grid,
          .advanced-search-grid,
          .yam-search-results-layout {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 640px) {
          .yam-search-page-shell {
            padding: 12px 12px 96px !important;
          }
          .yam-search-subtitle {
            font-size: 13px;
          }
        }
      `}</style>
    </MainLayout>
  );
}

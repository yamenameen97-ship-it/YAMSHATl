import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { getGroups } from '../api/groups.js';
import { buildTrendingHashtags } from '../services/recommendationService.js';
import {
  detectSearchIntent,
  extractHashtags,
  groupSearchResults,
  searchInCollections,
} from '../utils/fuzzySearch.js';

const SEARCH_FILTERS = [
  { key: 'all', label: 'الكل', icon: '✨' },
  { key: 'users', label: 'المستخدمين', icon: '👤' },
  { key: 'posts', label: 'المنشورات', icon: '📝' },
  { key: 'groups', label: 'المجموعات', icon: '👥' },
  { key: 'reels', label: 'الفيديوهات', icon: '🎬' },
  { key: 'hashtags', label: 'الهاشتاجات', icon: '#' },
];

const SEARCH_HISTORY_KEY = 'yamshat.search.history';
const TOPBAR_SEARCH_KEY = 'yamshat.topbarSearch';

function isVideoUrl(url = '') {
  return /\.(mp4|webm|mov|m3u8)(\?.*)?$/i.test(String(url || ''));
}

function resolveIncomingSearch(search = '') {
  const params = new URLSearchParams(search);
  const queryFromUrl = params.get('q') || '';
  const filterFromUrl = params.get('type') || 'all';
  const hashtagFromUrl = params.get('tag') || '';
  if (typeof window === 'undefined') {
    return { query: queryFromUrl, filterKey: filterFromUrl, hashtag: hashtagFromUrl };
  }
  return {
    query: queryFromUrl || window.sessionStorage.getItem(TOPBAR_SEARCH_KEY) || '',
    filterKey: filterFromUrl,
    hashtag: hashtagFromUrl,
  };
}

function prettyType(type = '') {
  if (type === 'users') return 'مستخدم';
  if (type === 'posts') return 'منشور';
  if (type === 'groups') return 'مجموعة';
  if (type === 'reels') return 'فيديو';
  if (type === 'hashtags') return 'هاشتاج';
  return 'نتيجة';
}

function SearchCard({ item, onOpen, onSimilar, onHashtagClick }) {
  const hashtags = (item.hashtags || []).slice(0, 3);

  return (
    <Card style={{ padding: 18, height: '100%', overflow: 'hidden', border: '1px solid rgba(148,163,184,0.14)' }}>
      <div style={{ display: 'grid', gap: 12 }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <div style={{ width: 56, height: 56, borderRadius: 18, background: 'rgba(59,130,246,0.12)', display: 'grid', placeItems: 'center', fontSize: 22, overflow: 'hidden', flexShrink: 0 }}>
            {item.avatar ? (
              <img src={item.avatar} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" decoding="async" />
            ) : item.type === 'hashtags' ? '#' : item.type === 'reels' ? '🎬' : item.type === 'posts' ? '📝' : item.type === 'groups' ? '👥' : '👤'}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: '0 0 6px', fontSize: 16 }}>{item.title}</h3>
                <div className="muted" style={{ fontSize: 12 }}>{prettyType(item.type)}</div>
              </div>
              <span className="score-pill">{Math.round(item.score * 100)}%</span>
            </div>
            <p style={{ margin: '10px 0 0', opacity: 0.88, fontSize: 13, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {item.description || item.content || 'بدون وصف إضافي'}
            </p>
          </div>
        </div>

        {hashtags.length ? (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {hashtags.map((tag) => (
              <button key={tag} type="button" className="tag-chip" onClick={() => onHashtagClick(tag)}>{tag}</button>
            ))}
          </div>
        ) : null}

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Button size="small" onClick={() => onOpen(item)}>{item.type === 'hashtags' ? 'تصفية' : 'فتح'}</Button>
          {item.type !== 'hashtags' ? <Button variant="secondary" size="small" onClick={() => onSimilar(item)}>بحث مشابه</Button> : null}
        </div>
      </div>
    </Card>
  );
}

export default function Search() {
  const location = useLocation();
  const navigate = useNavigate();
  const incoming = useMemo(() => resolveIncomingSearch(location.search), [location.search]);
  const [query, setQuery] = useState(incoming.query);
  const [filterKey, setFilterKey] = useState(incoming.filterKey || 'all');
  const [activeHashtag, setActiveHashtag] = useState(incoming.hashtag || '');
  const debouncedQuery = useDebounce(query, 300);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [collections, setCollections] = useState({ users: [], posts: [], groups: [], reels: [], hashtags: [] });
  const [history, setHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY) || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    setQuery(incoming.query || '');
    setFilterKey(incoming.filterKey || 'all');
    setActiveHashtag(incoming.hashtag || '');
  }, [incoming.filterKey, incoming.hashtag, incoming.query]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (query.trim()) window.sessionStorage.setItem(TOPBAR_SEARCH_KEY, query.trim());
    else window.sessionStorage.removeItem(TOPBAR_SEARCH_KEY);
  }, [query]);

  const hydrateCollections = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [usersResponse, postsResponse, groupsResponse] = await Promise.allSettled([
        getUsers(),
        getPosts({ limit: 120, page: 1 }),
        getGroups(),
      ]);

      const usersData = usersResponse.status === 'fulfilled' ? usersResponse.value?.data : [];
      const postsData = postsResponse.status === 'fulfilled' ? postsResponse.value?.data : [];
      const groupsData = groupsResponse.status === 'fulfilled' ? groupsResponse.value?.data : [];

      const users = Array.isArray(usersData) ? usersData : usersData?.items || [];
      const posts = Array.isArray(postsData) ? postsData : postsData?.items || [];
      const groups = Array.isArray(groupsData) ? groupsData : groupsData?.items || [];
      const reels = posts.filter((item) => isVideoUrl(item.media_url || item.video_url || ''));
      const tagUniverse = [
        ...buildTrendingHashtags(posts),
        ...Array.from(new Set(posts.flatMap((item) => extractHashtags(`${item.content || ''} ${item.caption || ''}`)).map((tag) => tag.toLowerCase()))).map((tag) => ({ tag, count: 1 })),
      ];

      const hashtagMap = new Map();
      tagUniverse.forEach((item) => {
        const key = String(item.tag || item.name || item).toLowerCase();
        if (!key) return;
        const current = hashtagMap.get(key) || { tag: key.startsWith('#') ? key : `#${key}`, count: 0 };
        current.count += Number(item.count || item.posts_count || 1);
        hashtagMap.set(key, current);
      });

      setCollections({
        users,
        posts,
        groups,
        reels,
        hashtags: Array.from(hashtagMap.values()).sort((a, b) => b.count - a.count),
      });
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || 'تعذر تحميل بيانات البحث.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    hydrateCollections();
  }, [hydrateCollections]);

  useEffect(() => {
    if (!query.trim()) {
      setSearching(false);
      return undefined;
    }
    setSearching(true);
    const timer = window.setTimeout(() => setSearching(false), 180);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const trimmed = debouncedQuery.trim();
    if (!trimmed) return;
    if (history.includes(trimmed)) return;
    const next = [trimmed, ...history].slice(0, 12);
    setHistory(next);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(next));
  }, [debouncedQuery, history]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedQuery.trim()) params.set('q', debouncedQuery.trim());
    if (filterKey !== 'all') params.set('type', filterKey);
    if (activeHashtag) params.set('tag', activeHashtag.replace(/^#/, ''));
    navigate(`${location.pathname}${params.toString() ? `?${params.toString()}` : ''}`, { replace: true });
  }, [activeHashtag, debouncedQuery, filterKey, location.pathname, navigate]);

  const intent = useMemo(() => detectSearchIntent(debouncedQuery), [debouncedQuery]);
  const effectiveFilter = useMemo(() => {
    if (intent.startsWithHashtag && filterKey === 'all') return 'hashtags';
    return filterKey;
  }, [filterKey, intent.startsWithHashtag]);

  const results = useMemo(
    () => searchInCollections(debouncedQuery, collections, { filter: effectiveFilter, activeHashtag, limit: 90 }),
    [activeHashtag, collections, debouncedQuery, effectiveFilter],
  );
  const grouped = useMemo(() => groupSearchResults(results), [results]);

  const quickHashtags = useMemo(() => {
    const pool = new Map();
    [...collections.hashtags.slice(0, 12), ...results.flatMap((item) => item.hashtags || [])].forEach((item) => {
      const tag = typeof item === 'string' ? item : item.tag || item.name || '';
      if (!tag) return;
      const normalized = tag.startsWith('#') ? tag : `#${tag}`;
      if (!pool.has(normalized)) pool.set(normalized, normalized);
    });
    return Array.from(pool.values()).slice(0, 10);
  }, [collections.hashtags, results]);

  const suggestions = useMemo(() => {
    if (!query.trim()) return history.slice(0, 6);
    return history.filter((item) => item.toLowerCase().includes(query.toLowerCase())).slice(0, 6);
  }, [history, query]);

  const openResult = useCallback((item) => {
    if (item.type === 'hashtags') {
      setActiveHashtag(item.title);
      setFilterKey('hashtags');
      setQuery(item.title);
      return;
    }
    if (item.type === 'groups') {
      navigate('/groups');
      return;
    }
    navigate(item.route || '/search');
  }, [navigate]);

  const handleSimilarSearch = useCallback((item) => {
    setQuery(item.name || item.title || '');
    if (item.type === 'groups') setFilterKey('groups');
  }, []);

  const summaryCards = [
    { label: 'مستخدمين', count: grouped.users?.length || 0 },
    { label: 'منشورات', count: grouped.posts?.length || 0 },
    { label: 'مجموعات', count: grouped.groups?.length || 0 },
    { label: 'هاشتاجات', count: grouped.hashtags?.length || 0 },
  ];

  return (
    <MainLayout>
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: 20, minHeight: 'calc(100vh - 70px)', display: 'grid', gap: 18 }}>
        <Card style={{ padding: 22 }}>
          <div style={{ display: 'grid', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: '0 0 8px' }}>نظام البحث الاحترافي</h2>
                <p className="muted" style={{ margin: 0 }}>بحث مباشر مع debounce وفلاتر وهاشتاجات ونتائج للمستخدمين والمنشورات والمجموعات.</p>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span className={`live-pill ${searching ? 'active' : ''}`}>{searching ? 'Live searching…' : 'Live ready'}</span>
                <span className="live-pill">debounce 300ms</span>
              </div>
            </div>

            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث باسم شخص أو هاشتاج أو محتوى أو مجموعة..." />

            {suggestions.length ? (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {suggestions.map((item) => (
                  <button key={item} type="button" className="soft-chip" onClick={() => setQuery(item)}>{item}</button>
                ))}
              </div>
            ) : null}

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {SEARCH_FILTERS.map((filter) => (
                <Button key={filter.key} variant={effectiveFilter === filter.key ? 'primary' : 'secondary'} size="small" onClick={() => setFilterKey(filter.key)}>
                  {filter.icon} {filter.label}
                </Button>
              ))}
            </div>

            {quickHashtags.length ? (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {quickHashtags.map((tag) => (
                  <button key={tag} type="button" className={`tag-chip ${activeHashtag === tag ? 'active' : ''}`} onClick={() => setActiveHashtag((prev) => prev === tag ? '' : tag)}>
                    {tag}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </Card>

        {loading ? <ListSkeleton count={5} /> : null}
        {!loading && error ? <ErrorState title="تعذر تحميل البحث" description={error} onRetry={hydrateCollections} /> : null}

        {!loading && !error && !debouncedQuery ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 0.95fr', gap: 18 }}>
            <Card style={{ padding: 18 }}>
              <h3 style={{ marginTop: 0 }}>ابدأ بسرعة</h3>
              <div style={{ display: 'grid', gap: 12, marginTop: 14 }}>
                {['#yamshat', 'مصممين UI', 'جروبات السفر', 'منشورات الذكاء الاصطناعي', 'مجموعات البرمجة'].map((item) => (
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
                {collections.hashtags.slice(0, 8).map((item) => (
                  <button key={item.tag} type="button" className="trending-row" onClick={() => { setQuery(item.tag); setActiveHashtag(item.tag); setFilterKey('hashtags'); }}>
                    <div>
                      <strong>{item.tag}</strong>
                      <div className="muted">{item.count} منشور</div>
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          </div>
        ) : null}

        {!loading && !error && debouncedQuery ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }}>
              {summaryCards.map((item) => (
                <Card key={item.label} style={{ padding: 16 }}>
                  <div className="muted" style={{ fontSize: 12 }}>{item.label}</div>
                  <strong style={{ fontSize: 24 }}>{item.count}</strong>
                </Card>
              ))}
            </div>

            <Card style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <strong>النتائج ({results.length})</strong>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span className="score-pill">Live</span>
                  {activeHashtag ? <span className="score-pill">Tag {activeHashtag}</span> : null}
                  {Object.entries(grouped).map(([key, items]) => <span key={key} className="score-pill">{prettyType(key)} {items.length}</span>)}
                </div>
              </div>
            </Card>

            {!results.length ? (
              <EmptyState icon="🔎" title="مفيش نتائج مناسبة" description="جرّب كلمة أقصر أو غيّر الفلتر أو اختار هاشتاج مختلف." />
            ) : (
              <div style={{ display: 'grid', gap: 14 }}>
                {results.map((item) => (
                  <SearchCard
                    key={`${item.type}-${item.id}`}
                    item={item}
                    onOpen={openResult}
                    onSimilar={handleSimilarSearch}
                    onHashtagClick={(tag) => setActiveHashtag(tag)}
                  />
                ))}
              </div>
            )}
          </>
        ) : null}
      </div>

      <style>{`
        .discovery-row, .trending-row, .soft-chip, .tag-chip {
          border: 1px solid rgba(148,163,184,0.14);
          background: rgba(15,23,42,0.45);
          color: white;
          transition: transform 180ms ease, border-color 180ms ease, background 180ms ease;
        }
        .discovery-row:hover, .trending-row:hover, .soft-chip:hover, .tag-chip:hover { transform: translateY(-1px); border-color: rgba(139,92,246,0.38); }
        .discovery-row, .trending-row {
          width: 100%;
          border-radius: 18px;
          padding: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
        }
        .soft-chip, .tag-chip {
          border-radius: 999px;
          padding: 9px 14px;
          cursor: pointer;
        }
        .tag-chip.active { background: rgba(139,92,246,0.24); border-color: rgba(139,92,246,0.52); }
        .live-pill, .score-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          border-radius: 999px;
          background: rgba(59,130,246,0.12);
          color: #bfdbfe;
          font-size: 12px;
          font-weight: 700;
        }
        .live-pill.active { background: rgba(34,197,94,0.16); color: #bbf7d0; }
      `}</style>
    </MainLayout>
  );
}

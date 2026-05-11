import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { buildTrendingHashtags, explainRecommendation } from '../services/recommendationService.js';
import { groupSearchResults, searchInCollections } from '../utils/fuzzySearch.js';

const SEARCH_FILTERS = [
  { key: 'all', label: 'الكل' },
  { key: 'users', label: 'الأشخاص' },
  { key: 'posts', label: 'المنشورات' },
  { key: 'reels', label: 'الريلز' },
  { key: 'hashtags', label: 'الهاشتاجات' },
];

const SEARCH_HISTORY_KEY = 'yamshat.search.history';

function isVideoUrl(url = '') {
  return /\.(mp4|webm|mov|m3u8)(\?.*)?$/i.test(String(url || ''));
}

export default function Search() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 250);
  const [filterKey, setFilterKey] = useState('all');
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [collections, setCollections] = useState({ users: [], posts: [], reels: [], hashtags: [] });
  const [history, setHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY) || '[]');
    } catch {
      return [];
    }
  });

  const hydrateCollections = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [{ data: usersData }, { data: postsData }] = await Promise.all([getUsers(), getPosts({ limit: 80, page: 1 })]);
      const users = Array.isArray(usersData) ? usersData : usersData?.items || [];
      const posts = Array.isArray(postsData) ? postsData : postsData?.items || [];
      const reels = posts.filter((item) => isVideoUrl(item.media_url || item.video_url || ''));
      const hashtags = buildTrendingHashtags(posts);
      setCollections({ users, posts, reels, hashtags });
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || 'تعذر تحميل بيانات البحث الذكي.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    hydrateCollections();
  }, [hydrateCollections]);

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
    }, 140);
    return () => window.clearTimeout(timer);
  }, [debouncedQuery, history]);

  const results = useMemo(() => searchInCollections(debouncedQuery, collections, { filter: filterKey }), [debouncedQuery, collections, filterKey]);
  const grouped = useMemo(() => groupSearchResults(results), [results]);
  const suggestions = useMemo(() => {
    if (!query.trim()) return history.slice(0, 6);
    return history.filter((item) => item.toLowerCase().includes(query.toLowerCase())).slice(0, 6);
  }, [history, query]);

  const openResult = (item) => {
    if (item.type === 'hashtags') {
      setQuery(item.title.replace(/^#/, ''));
      setFilterKey('hashtags');
      return;
    }
    navigate(item.route || '/search');
  };

  return (
    <MainLayout>
      <div style={{ maxWidth: 980, margin: '0 auto', padding: 20 }}>
        <Card style={{ padding: 20, marginBottom: 18 }}>
          <div style={{ display: 'grid', gap: 14 }}>
            <div>
              <h2 style={{ margin: '0 0 8px' }}>البحث الذكي</h2>
              <p className="muted" style={{ margin: 0 }}>Fuzzy search للناس والمنشورات والريلز والهاشتاجات مع ترتيب حسب الصلة والانتشار.</p>
            </div>
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث باسم شخص أو هاشتاج أو محتوى..." />
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {SEARCH_FILTERS.map((filter) => (
                <Button key={filter.key} variant={filterKey === filter.key ? 'primary' : 'secondary'} size="small" onClick={() => setFilterKey(filter.key)}>
                  {filter.label}
                </Button>
              ))}
            </div>
            {suggestions.length ? (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {suggestions.map((item) => (
                  <button key={item} type="button" className="mini-chip" onClick={() => setQuery(item)}>{item}</button>
                ))}
              </div>
            ) : null}
          </div>
        </Card>

        {loading ? <ListSkeleton count={6} /> : null}
        {!loading && error ? <ErrorState title="تعذر فتح البحث الذكي" description={error} onRetry={hydrateCollections} /> : null}

        {!loading && !error && !debouncedQuery ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 0.9fr', gap: 16 }}>
            <Card style={{ padding: 18 }}>
              <h3 style={{ marginTop: 0 }}>جاهز تدور على إيه؟</h3>
              <p className="muted">البحث بيدعم الأخطاء الإملائية البسيطة وكمان بيلمّح لك بالنتائج القريبة.</p>
              <div style={{ display: 'grid', gap: 12, marginTop: 14 }}>
                {['مصممين UI', '#yamshat', 'ريلز طبخ', 'منشورات الذكاء الاصطناعي'].map((item) => (
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
                  <button key={item.tag} type="button" className="trending-row" onClick={() => setQuery(item.tag.replace(/^#/, ''))}>
                    <div>
                      <strong>{item.tag}</strong>
                      <div className="muted">{item.count} منشور</div>
                    </div>
                    <span className="score-pill">{Math.round(item.score)}</span>
                  </button>
                ))}
              </div>
            </Card>
          </div>
        ) : null}

        {!loading && !error && debouncedQuery ? (
          <div style={{ display: 'grid', gap: 16 }}>
            <Card style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <div>
                  <strong>نتائج البحث</strong>
                  <div className="muted">{results.length} نتيجة • {searching ? 'جاري الترتيب...' : 'تم الترتيب حسب الصلة'}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {Object.entries(grouped).map(([key, items]) => (
                    <span key={key} className="score-pill">{key} {items.length}</span>
                  ))}
                </div>
              </div>
            </Card>

            {!results.length ? <EmptyState icon="🔎" title="مفيش نتائج مناسبة" description="جرّب كلمة تانية أو وسيّع البحث باستخدام فلتر الكل." /> : null}

            {results.map((item) => (
              <Card key={`${item.type}-${item.id}`} style={{ padding: 18 }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{ width: 54, height: 54, borderRadius: 16, background: 'rgba(59,130,246,0.12)', display: 'grid', placeItems: 'center', fontSize: 20, overflow: 'hidden', flexShrink: 0 }}>
                    {item.avatar ? <img src={item.avatar} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : item.type === 'hashtags' ? '#' : item.type === 'reels' ? '🎬' : item.type === 'posts' ? '📝' : '👤'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                      <div>
                        <h3 style={{ margin: '0 0 6px' }}>{item.title}</h3>
                        <div className="muted">{item.type === 'users' ? 'شخص' : item.type === 'posts' ? 'منشور' : item.type === 'reels' ? 'ريل' : 'هاشتاج'}</div>
                      </div>
                      <span className="score-pill">match {Math.round(item.score * 100)}%</span>
                    </div>
                    <p style={{ margin: '10px 0', opacity: 0.86 }}>{item.description || item.content || 'بدون وصف إضافي'}</p>
                    {item.hashtags?.length ? <div className="muted" style={{ marginBottom: 10 }}>{item.hashtags.slice(0, 4).join(' • ')}</div> : null}
                    <div className="muted" style={{ marginBottom: 12 }}>إشارة الترتيب: {explainRecommendation(item) || 'مطابقة قريبة للاسم أو النص'}</div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <Button size="small" onClick={() => openResult(item)}>{item.type === 'hashtags' ? 'تصفية بالهاشتاج' : 'فتح'}</Button>
                      {item.type !== 'hashtags' ? <Button variant="secondary" size="small" onClick={() => setQuery(item.name || item.title)}>بحث مشابه</Button> : null}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : null}
      </div>

      <style>{`
        .mini-chip {
          border: 1px solid rgba(148,163,184,0.18);
          background: rgba(15,23,42,0.58);
          color: white;
          padding: 8px 12px;
          border-radius: 999px;
          cursor: pointer;
        }
        .discovery-row, .trending-row {
          width: 100%;
          border: 1px solid rgba(148,163,184,0.14);
          background: rgba(15,23,42,0.45);
          color: white;
          border-radius: 16px;
          padding: 14px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          text-align: inherit;
          cursor: pointer;
        }
        .score-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 68px;
          padding: 7px 12px;
          border-radius: 999px;
          background: rgba(59,130,246,0.14);
          color: #93c5fd;
          border: 1px solid rgba(147,197,253,0.3);
          font-size: 12px;
        }
        @media (max-width: 900px) {
          .search-discovery-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </MainLayout>
  );
}

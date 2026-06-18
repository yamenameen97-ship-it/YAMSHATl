import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

const DB_NAME = 'yamshat-pwa-db';
const STORE_NAME = 'shared-content';
const SHARE_KEY = 'latest';

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function readSharedPayload() {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).get(SHARE_KEY);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

async function clearSharedPayload() {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(SHARE_KEY);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

export default function ShareTargetLanding() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [payload, setPayload] = useState(null);
  const [previews, setPreviews] = useState([]);

  useEffect(() => {
    let mounted = true;
    let urls = [];

    readSharedPayload()
      .then((data) => {
        if (!mounted) return;
        setPayload(data);
        const nextPreviews = (data?.files || []).map((file) => {
          const url = URL.createObjectURL(file.blob);
          urls.push(url);
          return {
            ...file,
            previewUrl: url,
            isImage: file.type?.startsWith('image/'),
            isVideo: file.type?.startsWith('video/'),
          };
        });
        setPreviews(nextPreviews);
      })
      .catch(() => {
        if (mounted) setPayload(null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const summaryText = useMemo(() => {
    if (!payload) return 'افتح التطبيق من خيار المشاركة لإرسال صور أو فيديو إلى Yamshat.';
    const pieces = [];
    if (payload.title) pieces.push(payload.title);
    if (payload.text) pieces.push(payload.text);
    if (payload.url) pieces.push(payload.url);
    return pieces.join(' • ') || 'تم استلام محتوى جديد من ميزة المشاركة.';
  }, [payload]);

  const openFeed = async () => {
    await clearSharedPayload().catch(() => null);
    navigate('/');
  };

  const openInbox = async () => {
    await clearSharedPayload().catch(() => null);
    navigate('/inbox');
  };

  return (
    <section className="share-target-page" dir="rtl">
      <div className="share-target-card">
        <div className="share-target-badge">PWA Share Target</div>
        <h1>استقبال المحتوى من الهاتف</h1>
        <p>{loading ? 'جاري تحميل العناصر المشتركة...' : summaryText}</p>

        {!loading && previews.length > 0 ? (
          <div className="share-preview-grid">
            {previews.map((file) => (
              <article key={file.id} className="share-preview-card">
                {file.isImage ? (
                  <img src={file.previewUrl} alt={file.name} loading="lazy" />
                ) : file.isVideo ? (
                  <video src={file.previewUrl} controls preload="metadata" />
                ) : (
                  <div className="share-file-fallback">{file.name}</div>
                )}
                <div className="share-file-meta">
                  <strong>{file.name}</strong>
                  <span>{Math.max(1, Math.round((file.size || 0) / 1024))} KB</span>
                </div>
              </article>
            ))}
          </div>
        ) : null}

        {!loading && !payload ? (
          <div className="share-empty-box">
            <strong>لا يوجد محتوى مستلم حالياً</strong>
            <span>استخدم زر المشاركة من المعرض أو مدير الملفات ثم اختر Yamshat.</span>
          </div>
        ) : null}

        <div className="share-actions">
          <button type="button" className="share-action primary" onClick={openFeed}>فتح الصفحة الرئيسية</button>
          <button type="button" className="share-action" onClick={openInbox}>فتح الرسائل</button>
          <Link to="/" className="share-link-inline">عودة للتطبيق</Link>
        </div>

        {searchParams.get('shared') === '0' ? (
          <div className="share-error-note">تعذر استلام المشاركة بالكامل. جرّب مرة أخرى من الهاتف.</div>
        ) : null}
      </div>

      <style>{`
        .share-target-page {
          min-height: 100dvh;
          padding: calc(24px + env(safe-area-inset-top, 0px)) 16px calc(32px + env(safe-area-inset-bottom, 0px));
          background: radial-gradient(circle at top, rgba(99, 102, 241, 0.18), transparent 32%), #020617;
          color: #fff;
        }

        .share-target-card {
          width: min(980px, 100%);
          margin: 0 auto;
          display: grid;
          gap: 16px;
          padding: 22px;
          border-radius: 28px;
          background: rgba(15, 23, 42, 0.92);
          border: 1px solid rgba(148, 163, 184, 0.14);
          box-shadow: 0 30px 60px rgba(2, 6, 23, 0.32);
        }

        .share-target-badge {
          width: fit-content;
          padding: 6px 12px;
          border-radius: 999px;
          background: rgba(139, 92, 246, 0.16);
          color: #c4b5fd;
          font-size: 0.82rem;
          font-weight: 800;
        }

        .share-target-card h1 {
          margin: 0;
          font-size: clamp(1.5rem, 3vw, 2.2rem);
        }

        .share-target-card p {
          margin: 0;
          color: #cbd5e1;
          line-height: 1.7;
        }

        .share-preview-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 14px;
        }

        .share-preview-card {
          overflow: hidden;
          border-radius: 20px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
        }

        .share-preview-card img,
        .share-preview-card video,
        .share-file-fallback {
          width: 100%;
          aspect-ratio: 1 / 1;
          object-fit: cover;
          display: block;
          background: rgba(15,23,42,0.85);
        }

        .share-file-fallback {
          display: grid;
          place-items: center;
          color: #cbd5e1;
          padding: 16px;
          text-align: center;
        }

        .share-file-meta {
          display: grid;
          gap: 4px;
          padding: 12px;
        }

        .share-file-meta strong {
          font-size: 0.92rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .share-file-meta span,
        .share-empty-box span,
        .share-error-note {
          color: #94a3b8;
          font-size: 0.88rem;
        }

        .share-empty-box,
        .share-error-note {
          padding: 14px 16px;
          border-radius: 18px;
          background: rgba(255,255,255,0.04);
          border: 1px dashed rgba(148,163,184,0.2);
          display: grid;
          gap: 6px;
        }

        .share-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          align-items: center;
        }

        .share-action,
        .share-link-inline {
          min-height: 44px;
          padding: 0 16px;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.04);
          color: #fff;
          font-weight: 800;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
        }

        .share-action.primary {
          border-color: transparent;
          background: linear-gradient(135deg, #8b5cf6, #6366f1);
        }
      `}</style>
    </section>
  );
}

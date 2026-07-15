import { bD as useSearchParams, bx as useNavigate, b0 as reactExports, as as jsxRuntimeExports, f as Link } from "../index-D_Nx8mZz.js";
const DB_NAME = "yamshat-pwa-db";
const STORE_NAME = "shared-content";
const SHARE_KEY = "latest";
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
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).get(SHARE_KEY);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}
async function clearSharedPayload() {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(SHARE_KEY);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}
function ShareTargetLanding() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = reactExports.useState(true);
  const [payload, setPayload] = reactExports.useState(null);
  const [previews, setPreviews] = reactExports.useState([]);
  reactExports.useEffect(() => {
    let mounted = true;
    let urls = [];
    readSharedPayload().then((data) => {
      if (!mounted) return;
      setPayload(data);
      const nextPreviews = (data?.files || []).map((file) => {
        const url = URL.createObjectURL(file.blob);
        urls.push(url);
        return {
          ...file,
          previewUrl: url,
          isImage: file.type?.startsWith("image/"),
          isVideo: file.type?.startsWith("video/")
        };
      });
      setPreviews(nextPreviews);
    }).catch(() => {
      if (mounted) setPayload(null);
    }).finally(() => {
      if (mounted) setLoading(false);
    });
    return () => {
      mounted = false;
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);
  const summaryText = reactExports.useMemo(() => {
    if (!payload) return "افتح التطبيق من خيار المشاركة لإرسال صور أو فيديو إلى Yamshat.";
    const pieces = [];
    if (payload.title) pieces.push(payload.title);
    if (payload.text) pieces.push(payload.text);
    if (payload.url) pieces.push(payload.url);
    return pieces.join(" • ") || "تم استلام محتوى جديد من ميزة المشاركة.";
  }, [payload]);
  const openFeed = async () => {
    await clearSharedPayload().catch(() => null);
    navigate("/");
  };
  const openInbox = async () => {
    await clearSharedPayload().catch(() => null);
    navigate("/inbox");
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "share-target-page", dir: "rtl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "share-target-card", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "share-target-badge", children: "PWA Share Target" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { children: "استقبال المحتوى من الهاتف" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: loading ? "جاري تحميل العناصر المشتركة..." : summaryText }),
      !loading && previews.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "share-preview-grid", children: previews.map((file) => /* @__PURE__ */ jsxRuntimeExports.jsxs("article", { className: "share-preview-card", children: [
        file.isImage ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: file.previewUrl, alt: file.name, loading: "lazy" }) : file.isVideo ? /* @__PURE__ */ jsxRuntimeExports.jsx("video", { src: file.previewUrl, controls: true, preload: "metadata" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "share-file-fallback", children: file.name }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "share-file-meta", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: file.name }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            Math.max(1, Math.round((file.size || 0) / 1024)),
            " KB"
          ] })
        ] })
      ] }, file.id)) }) : null,
      !loading && !payload ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "share-empty-box", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "لا يوجد محتوى مستلم حالياً" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "استخدم زر المشاركة من المعرض أو مدير الملفات ثم اختر Yamshat." })
      ] }) : null,
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "share-actions", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "share-action primary", onClick: openFeed, children: "فتح الصفحة الرئيسية" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "share-action", onClick: openInbox, children: "فتح الرسائل" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/", className: "share-link-inline", children: "عودة للتطبيق" })
      ] }),
      searchParams.get("shared") === "0" ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "share-error-note", children: "تعذر استلام المشاركة بالكامل. جرّب مرة أخرى من الهاتف." }) : null
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
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
      ` })
  ] });
}
export {
  ShareTargetLanding as default
};

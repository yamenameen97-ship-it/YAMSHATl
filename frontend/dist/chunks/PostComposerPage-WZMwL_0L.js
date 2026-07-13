import { bz as useNavigate, b0 as reactExports, ar as jsxRuntimeExports } from "../index-D5NOBPt4.js";
import { P as PostComposer } from "./PostComposer-ZkMWZPLd.js";
import "./posts-BMr4cr0i.js";
function PostComposerPage() {
  const navigate = useNavigate();
  reactExports.useEffect(() => {
    const prev = document.title;
    document.title = "منشور جديد · YAMSHAT";
    return () => {
      document.title = prev;
    };
  }, []);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: "ympc-page",
      dir: "rtl",
      style: { fontFamily: "'Noto Sans Arabic', 'Tajawal', system-ui, sans-serif" },
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "ympc-top", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              className: "ympc-icon-btn",
              onClick: () => navigate(-1),
              "aria-label": "رجوع",
              title: "رجوع",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { viewBox: "0 0 24 24", width: "22", height: "22", fill: "none", stroke: "currentColor", strokeWidth: "2.2", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M9 18l6-6-6-6" }) })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "ympc-title", children: "منشور جديد" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ympc-spacer", "aria-hidden": true })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("main", { className: "ympc-main", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ympc-wrap", children: /* @__PURE__ */ jsxRuntimeExports.jsx(PostComposer, {}) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
        /*
          v85.5 FIX (منشور جديد لا يقبل السحب لأسفل):
          - نستخدم min-height بدلاً من height + overflow-y: auto صريح على الصفحة
            حتى يعمل السحب دائماً على الموبايل.
          - touch-action: pan-y يسمح بالتمرير العمودي وتعطيل تكبير/تصغير مزعج.
          - overscroll-behavior: contain يمنع تسرّب سحب السحب لصفحة أعلى (pull-to-refresh).
          - -webkit-overflow-scrolling: touch لسلاسة على iOS.
        */
        .ympc-page {
          min-height: 100dvh;
          height: auto;
          background: var(--background, #0a0a0f);
          color: var(--text, #f4f4f5);
          padding-bottom: calc(36px + env(safe-area-inset-bottom, 0px));
          direction: rtl;
          overflow: visible;
          -webkit-overflow-scrolling: touch;
          overscroll-behavior-y: contain;
          touch-action: pan-y;
        }
        .ympc-top {
          position: sticky;
          top: 0;
          z-index: 10;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 14px;
          padding-top: calc(12px + env(safe-area-inset-top, 0px));
          background: rgba(10, 10, 15, 0.92);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }
        .ympc-icon-btn {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: rgba(139, 92, 246, 0.10);
          border: 1px solid rgba(139, 92, 246, 0.25);
          color: #E5E7EB;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.15s ease, border-color 0.15s ease;
        }
        .ympc-icon-btn:hover {
          background: rgba(139, 92, 246, 0.22);
          border-color: rgba(139, 92, 246, 0.45);
        }
        /* في RTL: نقلب السهم ليشير لليمين (اتجاه الرجوع البصري) */
        .ympc-icon-btn svg { transform: scaleX(-1); }
        .ympc-title {
          flex: 1;
          margin: 0;
          font-size: 1.05rem;
          font-weight: 700;
          color: #F4F4F5;
          text-align: center;
          letter-spacing: -0.01em;
        }
        .ympc-spacer { width: 40px; height: 40px; }

        .ympc-main {
          padding: 14px 12px;
          max-width: 720px;
          margin: 0 auto;
        }
        .ympc-wrap {
          width: 100%;
        }
        @media (min-width: 768px) {
          .ympc-main { padding: 22px 18px; }
          .ympc-title { font-size: 1.15rem; }
        }
      ` })
      ]
    }
  );
}
export {
  PostComposerPage as default
};

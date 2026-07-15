import { F as useNavigate, I as jsxRuntimeExports, a0 as MainLayout, J as Button, a2 as Card } from "../index-DRmq1dbV.js";
function SettingsShell({
  title,
  subtitle,
  icon = "⚙️",
  backTo,
  tabs = null,
  activeTab = null,
  onTabChange = () => {
  },
  message = "",
  children
}) {
  const navigate = useNavigate();
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(MainLayout, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "settings-shell", dir: "rtl", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "settings-shell-header", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            className: "settings-shell-back",
            onClick: () => backTo ? navigate(backTo) : navigate(-1),
            "aria-label": "رجوع",
            children: "←"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "settings-shell-title-block", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "settings-shell-icon", "aria-hidden": true, children: icon }),
            title
          ] }),
          subtitle ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "muted", children: subtitle }) : null
        ] })
      ] }),
      message ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "settings-banner", children: message }) : null,
      tabs && tabs.length ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "settings-shell-tabs", children: tabs.map((tab) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          variant: activeTab === tab.key ? "primary" : "secondary",
          size: "small",
          onClick: () => onTabChange(tab.key),
          children: tab.label
        },
        tab.key
      )) }) : null,
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "settings-shell-body", children })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
        .settings-shell {
          max-width: 1080px;
          margin: 0 auto;
          padding: 12px 14px calc(118px + env(safe-area-inset-bottom, 0px));
          font-size: 13px;
          box-sizing: border-box;
          touch-action: pan-y;
          -ms-touch-action: pan-y;
          -webkit-overflow-scrolling: touch;
          overscroll-behavior-y: contain;
          overscroll-behavior-x: none;
          pointer-events: auto;
          transform: none;
          filter: none;
          perspective: none;
        }
        .settings-shell-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
        }
        .settings-shell-back {
          width: 32px;
          height: 32px;
          border-radius: 9px;
          border: 1px solid rgba(167,139,250,0.25);
          background: rgba(15,23,42,0.7);
          color: #e2e8f0;
          font-size: 16px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .settings-shell-back:hover { background: rgba(99,102,241,0.18); }
        .settings-shell-title-block h1 {
          margin: 0 0 2px;
          font-size: 17px;
          display: flex;
          align-items: center;
          gap: 7px;
        }
        .settings-shell-icon { font-size: 18px; }
        .settings-shell-title-block p { margin: 0; font-size: 11.5px; }
        .settings-banner {
          padding: 8px 10px;
          border-radius: 10px;
          background: rgba(34,197,94,0.14);
          color: #86efac;
          border: 1px solid rgba(34,197,94,0.24);
          margin-bottom: 10px;
          font-size: 12px;
        }
        .settings-shell-tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 10px;
          overflow-x: auto;
        }
        .settings-shell-body {
          display: grid;
          gap: 10px;
          overflow: visible;
          touch-action: pan-y;
          pointer-events: auto;
        }
        .settings-shell-header,
        .settings-shell-tabs,
        .settings-shell-body > *,
        .settings-row,
        .stats-grid,
        .metric-card {
          touch-action: pan-y;
          pointer-events: auto;
        }
        .settings-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding: 7px 0;
          border-bottom: 1px solid rgba(148,163,184,0.08);
        }
        .settings-row:last-child { border-bottom: none; }
        .settings-row-info { flex: 1; min-width: 0; }
        .settings-row-info strong { display: block; margin-bottom: 1px; font-size: 12.5px; font-weight: 600; }
        .settings-row-info .muted { font-size: 11px; line-height: 1.35; }
        .settings-section-title {
          margin: 0 0 3px;
          font-size: 14.5px;
          font-weight: 700;
        }
        .settings-section-desc {
          margin: 0 0 8px;
          color: rgba(226,232,240,0.66);
          font-size: 11.5px;
        }
        .settings-toggle {
          position: relative;
          width: 36px;
          height: 20px;
          border-radius: 999px;
          background: rgba(100,116,139,0.35);
          cursor: pointer;
          transition: background 0.2s;
          border: none;
          flex-shrink: 0;
        }
        .settings-toggle::after {
          content: '';
          position: absolute;
          top: 2px;
          right: 2px;
          width: 16px;
          height: 16px;
          background: #fff;
          border-radius: 50%;
          transition: all 0.2s;
        }
        .settings-toggle[data-on='true'] { background: #6366f1; }
        .settings-toggle[data-on='true']::after { right: 18px; }
        .settings-select, .settings-input {
          padding: 4px 8px;
          border-radius: 7px;
          background: rgba(15,23,42,0.6);
          border: 1px solid rgba(148,163,184,0.18);
          color: #e2e8f0;
          font-size: 12px;
          min-width: 110px;
          min-height: 26px;
        }
        .settings-danger {
          color: #fca5a5;
          border-color: rgba(239,68,68,0.3);
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 6px;
        }
        .metric-card {
          padding: 8px 10px;
          border-radius: 10px;
          background: rgba(15,23,42,0.45);
          border: 1px solid rgba(148,163,184,0.12);
          display: grid;
          gap: 2px;
        }
        .metric-card span { color: rgba(226,232,240,0.72); font-size: 11px; }
        .metric-card strong { font-size: 13.5px; }

        /* v76 — overrides لتصغير الأزرار داخل SettingsShell */
        .settings-shell button,
        .settings-shell a,
        .settings-shell [role='button'],
        .settings-shell [role='tab'],
        .settings-shell [role='link'],
        .settings-shell .settings-toggle,
        .settings-shell .settings-shell-back,
        .settings-shell .settings-link-btn,
        .settings-shell .btn,
        .settings-shell button.btn {
          touch-action: manipulation;
        }
        .settings-shell input,
        .settings-shell textarea,
        .settings-shell select,
        .settings-shell [contenteditable='true'] {
          touch-action: auto;
        }
        .settings-shell-body .btn,
        .settings-shell-body button.btn,
        .settings-shell-body .btn-small,
        .settings-shell-body .btn-medium {
          min-height: 24px !important;
          height: 24px !important;
          padding: 3px 10px !important;
          font-size: 11.5px !important;
          border-radius: 6px !important;
        }
        .settings-shell-body .btn-large {
          min-height: 28px !important;
          height: 28px !important;
          padding: 4px 12px !important;
          font-size: 12px !important;
        }

        @media (max-width: 600px) {
          .settings-shell {
            padding: 10px 10px calc(124px + env(safe-area-inset-bottom, 0px));
          }
          .settings-shell-title-block h1 { font-size: 15px; }
          .settings-row { flex-wrap: wrap; gap: 6px; }
        }
      ` })
  ] });
}
function SettingsToggle({ on, onChange, ariaLabel }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "button",
    {
      type: "button",
      className: "settings-toggle",
      "data-on": on ? "true" : "false",
      onClick: () => onChange(!on),
      "aria-label": ariaLabel || "toggle",
      "aria-pressed": on
    }
  );
}
function SettingsRow({ icon, title, description, children }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "settings-row", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "settings-row-info", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("strong", { children: [
        icon ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { marginInlineEnd: 6 }, children: icon }) : null,
        title
      ] }),
      description ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "muted", children: description }) : null
    ] }),
    children
  ] });
}
function SettingsSection({ title, description, children }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { style: { padding: 18 }, children: [
    title ? /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "settings-section-title", children: title }) : null,
    description ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "settings-section-desc", children: description }) : null,
    children
  ] });
}
export {
  SettingsShell as S,
  SettingsSection as a,
  SettingsRow as b,
  SettingsToggle as c
};

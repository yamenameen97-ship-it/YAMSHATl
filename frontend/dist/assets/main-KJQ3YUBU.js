import {
  notificationService_default
} from "./chunks/chunk-LQ6AMTHB.js";
import {
  featureFlags_default,
  initializePerformanceToolkit
} from "./chunks/chunk-A6DTRSIG.js";
import {
  QueryClient,
  QueryClientProvider
} from "./chunks/chunk-AB4CHF2R.js";
import {
  socket_default
} from "./chunks/chunk-O2E6FMLO.js";
import {
  socketManager_default
} from "./chunks/chunk-46YZGXXY.js";
import {
  ToastProvider
} from "./chunks/chunk-OIWCOE6H.js";
import {
  RoutePageSkeleton
} from "./chunks/chunk-4ZQ5VGKF.js";
import {
  getChatThreads,
  sendMessageApi
} from "./chunks/chunk-HHMVNFXU.js";
import "./chunks/chunk-JSOE33EX.js";
import {
  Button
} from "./chunks/chunk-EHD43N2I.js";
import {
  API_BASE,
  HashRouter,
  Link,
  Navigate,
  Route,
  Routes,
  clearStoredUser,
  getAuthToken,
  getBackoffDelayMs,
  getCsrfToken,
  getCurrentAppPathname,
  getCurrentUsername,
  getSessionTtlMs,
  getStoredUser,
  hasPermission,
  hasStoredSession,
  isPrimaryAdminSession,
  logger_default,
  redirectToAppPath,
  require_react_dom,
  sessionManager_default,
  shouldRefreshSessionSoon,
  sleep,
  useAppStore,
  useChatStore,
  useLocation
} from "./chunks/chunk-FJN4GIYV.js";
import {
  __commonJS,
  __publicField,
  __toESM,
  init_define_import_meta_env,
  require_jsx_runtime,
  require_react
} from "./chunks/chunk-SOYW6UE7.js";

// node_modules/react-dom/client.js
var require_client = __commonJS({
  "node_modules/react-dom/client.js"(exports) {
    "use strict";
    init_define_import_meta_env();
    var m = require_react_dom();
    if (true) {
      exports.createRoot = m.createRoot;
      exports.hydrateRoot = m.hydrateRoot;
    } else {
      i = m.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
      exports.createRoot = function(c, o) {
        i.usingClientEntryPoint = true;
        try {
          return m.createRoot(c, o);
        } finally {
          i.usingClientEntryPoint = false;
        }
      };
      exports.hydrateRoot = function(c, h, o) {
        i.usingClientEntryPoint = true;
        try {
          return m.hydrateRoot(c, h, o);
        } finally {
          i.usingClientEntryPoint = false;
        }
      };
    }
    var i;
  }
});

// src/main.jsx
init_define_import_meta_env();
var import_react11 = __toESM(require_react(), 1);
var import_client = __toESM(require_client(), 1);

// src/App.jsx
init_define_import_meta_env();
var import_react9 = __toESM(require_react(), 1);

// src/components/ProtectedRoute.jsx
init_define_import_meta_env();

// src/components/feedback/PageLoader.jsx
init_define_import_meta_env();
var import_jsx_runtime = __toESM(require_jsx_runtime(), 1);
function PageLoader({ label = "\u062C\u0627\u0631\u064D \u0627\u0644\u062A\u062D\u0645\u064A\u0644..." }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "page-loader", role: "status", "aria-live": "polite", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "page-loader-spinner" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "page-loader-copy", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: label }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u0628\u0646\u062C\u0647\u0632 \u0644\u0643 \u0627\u0644\u0648\u0627\u062C\u0647\u0629 \u0628\u0634\u0643\u0644 \u0623\u0633\u0631\u0639 \u0648\u0623\u0643\u062B\u0631 \u0633\u0644\u0627\u0633\u0629." })
    ] })
  ] });
}

// src/components/ProtectedRoute.jsx
var import_jsx_runtime2 = __toESM(require_jsx_runtime(), 1);
function ProtectedRoute({ children, requiredPermission = "" }) {
  const location = useLocation();
  const user = useAppStore((state) => state.session);
  const authHydrated = useAppStore((state) => state.authHydrated);
  const authLoading = useAppStore((state) => state.authLoading);
  if (!authHydrated || authLoading) {
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(PageLoader, { label: "\u062C\u0627\u0631\u064D \u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u0627\u0644\u062C\u0644\u0633\u0629..." });
  }
  if (!user?.username && !user?.user && !user?.email) {
    const loginPath = location.pathname.startsWith("/admin") ? "/admin/login" : "/login";
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Navigate, { to: loginPath, state: { from: location }, replace: true });
  }
  if (location.pathname.startsWith("/admin") && !isPrimaryAdminSession(user)) {
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Navigate, { to: "/admin/login", state: { from: location }, replace: true });
  }
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Navigate, { to: "/", replace: true });
  }
  return children;
}

// src/components/system/AppStatusBanner.jsx
init_define_import_meta_env();
var import_react = __toESM(require_react(), 1);
var import_jsx_runtime3 = __toESM(require_jsx_runtime(), 1);
function formatRemaining(ms) {
  const minutes = Math.max(Math.ceil(ms / 6e4), 1);
  return `${minutes} \u062F\u0642\u064A\u0642\u0629`;
}
function AppStatusBanner() {
  const isOnline = useAppStore((state) => state.isOnline);
  const activeRequests = useAppStore((state) => state.activeRequests);
  const queuedActions = useAppStore((state) => state.queuedActions);
  const ttl = getSessionTtlMs();
  const [syncNote, setSyncNote] = (0, import_react.useState)("");
  (0, import_react.useEffect)(() => {
    const handleSent = () => setSyncNote("\u062A\u0645\u062A \u0645\u0632\u0627\u0645\u0646\u0629 \u0639\u0646\u0635\u0631 \u0645\u0646 \u0627\u0644\u0637\u0627\u0628\u0648\u0631 \u0628\u0646\u062C\u0627\u062D.");
    const handleFailed = () => setSyncNote("\u0628\u0639\u0636 \u0627\u0644\u0639\u0646\u0627\u0635\u0631 \u0645\u0627 \u0632\u0627\u0644\u062A \u0628\u0627\u0646\u062A\u0638\u0627\u0631 \u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629.");
    window.addEventListener("yamshat:queued-message-sent", handleSent);
    window.addEventListener("yamshat:queued-message-failed", handleFailed);
    return () => {
      window.removeEventListener("yamshat:queued-message-sent", handleSent);
      window.removeEventListener("yamshat:queued-message-failed", handleFailed);
    };
  }, []);
  const banner = (0, import_react.useMemo)(() => {
    if (!isOnline) {
      return {
        type: "warning",
        text: queuedActions.length ? `\u0623\u0646\u062A \u0627\u0644\u0622\u0646 \u0628\u062F\u0648\u0646 \u0625\u0646\u062A\u0631\u0646\u062A. \u062A\u0645 \u062D\u0641\u0638 ${queuedActions.length} \u0625\u062C\u0631\u0627\u0621 \u0645\u062D\u0644\u064A\u0627\u064B \u0648\u0633\u064A\u062A\u0645 \u0625\u0631\u0633\u0627\u0644\u0647\u0627 \u062A\u0644\u0642\u0627\u0626\u064A\u0627\u064B \u0639\u0646\u062F \u0639\u0648\u062F\u0629 \u0627\u0644\u0634\u0628\u0643\u0629.` : "\u0623\u0646\u062A \u0627\u0644\u0622\u0646 \u0628\u062F\u0648\u0646 \u0625\u0646\u062A\u0631\u0646\u062A. \u0633\u062A\u0638\u0647\u0631 \u0644\u0643 \u0635\u0641\u062D\u0627\u062A Offline \u0648\u0633\u0646\u0633\u062A\u0623\u0646\u0641 \u0627\u0644\u062A\u062D\u062F\u064A\u062B\u0627\u062A \u062A\u0644\u0642\u0627\u0626\u064A\u0627\u064B \u0639\u0646\u062F \u0631\u062C\u0648\u0639 \u0627\u0644\u0634\u0628\u0643\u0629."
      };
    }
    if (queuedActions.length > 0) {
      return {
        type: "info",
        text: `Background sync \u064A\u0639\u0645\u0644 \u062D\u0627\u0644\u064A\u0627\u064B \u0644\u0645\u0632\u0627\u0645\u0646\u0629 ${queuedActions.length} \u0625\u062C\u0631\u0627\u0621 \u0645\u0624\u062C\u0644.${syncNote ? ` ${syncNote}` : ""}`
      };
    }
    if (ttl !== null && ttl > 0 && ttl <= 5 * 60 * 1e3) {
      return {
        type: "info",
        text: `\u062A\u0646\u0628\u064A\u0647: \u0627\u0644\u062C\u0644\u0633\u0629 \u0627\u0644\u062D\u0627\u0644\u064A\u0629 \u0633\u062A\u0646\u062A\u0647\u064A \u062E\u0644\u0627\u0644 ${formatRemaining(ttl)} \u0645\u0627 \u0644\u0645 \u064A\u062A\u0645 \u062A\u062C\u062F\u064A\u062F\u0647\u0627 \u062A\u0644\u0642\u0627\u0626\u064A\u0627\u064B.`
      };
    }
    if (activeRequests > 0) {
      return {
        type: "info",
        text: "\u062C\u0627\u0631\u064D \u0645\u0632\u0627\u0645\u0646\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0648\u062A\u062D\u062F\u064A\u062B \u0627\u0644\u0648\u0627\u062C\u0647\u0629..."
      };
    }
    return null;
  }, [activeRequests, isOnline, queuedActions.length, syncNote, ttl]);
  if (!banner) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: `app-status-banner ${banner.type}`, children: banner.text });
}

// src/components/system/AppErrorBoundary.jsx
init_define_import_meta_env();
var import_react2 = __toESM(require_react(), 1);
var import_jsx_runtime4 = __toESM(require_jsx_runtime(), 1);
var AppErrorBoundary = class extends import_react2.default.Component {
  constructor(props) {
    super(props);
    __publicField(this, "handleReload", () => {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("last_chunk_error_reload");
        window.location.reload();
      }
    });
    this.state = { hasError: false, message: "", isChunkError: false };
  }
  static getDerivedStateFromError(error) {
    const isChunkError = error?.message?.includes("Failed to fetch dynamically imported module") || error?.name === "ChunkLoadError" || error?.message?.includes("Loading chunk");
    return {
      hasError: true,
      message: error?.message || "\u062D\u062F\u062B \u062E\u0637\u0623 \u063A\u064A\u0631 \u0645\u062A\u0648\u0642\u0639.",
      isChunkError
    };
  }
  componentDidCatch(error, errorInfo) {
    logger_default.error("app error boundary caught an error", {
      message: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack
    });
    if (this.state.isChunkError) {
      const lastReload = sessionStorage.getItem("last_chunk_error_reload");
      const now = Date.now();
      if (!lastReload || now - parseInt(lastReload) > 1e4) {
        sessionStorage.setItem("last_chunk_error_reload", now.toString());
        logger_default.info("Chunk load error detected, attempting auto-reload...");
        setTimeout(() => {
          window.location.reload();
        }, 1e3);
      }
    }
  }
  render() {
    if (!this.state.hasError) return this.props.children;
    return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "page-loader-shell", style: { minHeight: "100vh", padding: 24, display: "flex", alignItems: "center", justifyContent: "center", background: "#0b0f1a" }, children: /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "empty-state", style: { maxWidth: 560, textAlign: "center", color: "#fff" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "empty-icon", style: { fontSize: "48px", marginBottom: "16px" }, children: "\u26A0\uFE0F" }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("h3", { style: { fontSize: "24px", marginBottom: "12px" }, children: this.state.isChunkError ? "\u062A\u062D\u062F\u064A\u062B \u0645\u0637\u0644\u0648\u0628 \u0644\u0644\u062A\u0637\u0628\u064A\u0642" : "\u062D\u0635\u0644 \u062E\u0637\u0623 \u063A\u064A\u0631 \u0645\u062A\u0648\u0642\u0639" }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { style: { opacity: 0.8, marginBottom: "24px" }, children: this.state.isChunkError ? "\u0646\u0648\u0627\u062C\u0647 \u0645\u0634\u0643\u0644\u0629 \u0641\u064A \u062A\u062D\u0645\u064A\u0644 \u0628\u0639\u0636 \u0623\u062C\u0632\u0627\u0621 \u0627\u0644\u062A\u0637\u0628\u064A\u0642\u060C \u0642\u062F \u064A\u0643\u0648\u0646 \u0630\u0644\u0643 \u0628\u0633\u0628\u0628 \u062A\u062D\u062F\u064A\u062B \u062C\u062F\u064A\u062F. \u064A\u0631\u062C\u0649 \u0625\u0639\u0627\u062F\u0629 \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0635\u0641\u062D\u0629." : this.state.message || "\u062A\u0645 \u0625\u064A\u0642\u0627\u0641 \u0627\u0644\u062C\u0632\u0621 \u0627\u0644\u0645\u062A\u0623\u062B\u0631 \u0644\u062D\u0645\u0627\u064A\u0629 \u0627\u0644\u062C\u0644\u0633\u0629 \u0648\u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A." }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Button, { onClick: this.handleReload, variant: "primary", children: "\u0625\u0639\u0627\u062F\u0629 \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u062A\u0637\u0628\u064A\u0642" })
    ] }) });
  }
};

// src/components/feedback/InstallPrompt.jsx
init_define_import_meta_env();
var import_jsx_runtime5 = __toESM(require_jsx_runtime(), 1);
function InstallPrompt() {
  const installPrompt = useAppStore((state) => state.installPrompt);
  const clearInstallPrompt = useAppStore((state) => state.clearInstallPrompt);
  if (!installPrompt) return null;
  const handleInstall = async () => {
    installPrompt.prompt();
    await installPrompt.userChoice.catch(() => null);
    clearInstallPrompt();
  };
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "install-banner card enhanced-install-banner", children: [
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { style: { display: "grid", gap: 8 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("strong", { children: "\u062A\u062B\u0628\u064A\u062A \u0627\u0644\u062A\u0637\u0628\u064A\u0642" }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "muted", children: "\u062B\u0628\u0651\u062A \u064A\u0645\u0634\u0627\u062A \u0643\u062A\u0637\u0628\u064A\u0642 PWA \u0644\u0644\u0648\u0635\u0648\u0644 \u0627\u0644\u0633\u0631\u064A\u0639\u060C \u0648\u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062A\u060C \u0648\u062A\u062C\u0631\u0628\u0629 \u0623\u0641\u0636\u0644 \u0639\u0646\u062F \u0636\u0639\u0641 \u0627\u0644\u0634\u0628\u0643\u0629." }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "install-benefits-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "install-benefit-pill", children: "\u0641\u062A\u062D \u0623\u0633\u0631\u0639" }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "install-benefit-pill", children: "Offline pages" }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "install-benefit-pill", children: "Background sync" })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "install-banner-actions", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Button, { onClick: handleInstall, children: "\u062A\u062B\u0628\u064A\u062A \u0627\u0644\u0622\u0646" }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Button, { variant: "secondary", onClick: clearInstallPrompt, children: "\u0644\u0627\u062D\u0642\u0627\u064B" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("style", { children: `
        .enhanced-install-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }
        .install-benefits-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .install-benefit-pill {
          padding: 6px 10px;
          border-radius: 999px;
          background: rgba(59,130,246,0.08);
          border: 1px solid rgba(59,130,246,0.14);
          font-size: 12px;
        }
      ` })
  ] });
}

// src/components/feedback/OfflineExperience.jsx
init_define_import_meta_env();
var import_react3 = __toESM(require_react(), 1);
var import_jsx_runtime6 = __toESM(require_jsx_runtime(), 1);
function OfflineExperience() {
  const isOnline = useAppStore((state) => state.isOnline);
  const queuedActions = useAppStore((state) => state.queuedActions);
  const [syncMessage, setSyncMessage] = (0, import_react3.useState)("\u062C\u0627\u0647\u0632");
  (0, import_react3.useEffect)(() => {
    const handleSent = () => setSyncMessage("\u062A\u0645\u062A \u0645\u0632\u0627\u0645\u0646\u0629 \u0639\u0646\u0635\u0631 \u0645\u0646 \u0627\u0644\u0637\u0627\u0628\u0648\u0631");
    const handleFailed = () => setSyncMessage("\u0644\u0627 \u064A\u0632\u0627\u0644 \u0647\u0646\u0627\u0643 \u0639\u0646\u0627\u0635\u0631 \u0628\u0627\u0646\u062A\u0638\u0627\u0631 \u0627\u0644\u0625\u0631\u0633\u0627\u0644");
    window.addEventListener("yamshat:queued-message-sent", handleSent);
    window.addEventListener("yamshat:queued-message-failed", handleFailed);
    return () => {
      window.removeEventListener("yamshat:queued-message-sent", handleSent);
      window.removeEventListener("yamshat:queued-message-failed", handleFailed);
    };
  }, []);
  if (isOnline && queuedActions.length === 0) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "offline-experience-shell card", children: [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { style: { display: "grid", gap: 6 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("strong", { children: isOnline ? "Background sync \u064A\u0639\u0645\u0644" : "\u0648\u0636\u0639 \u0639\u062F\u0645 \u0627\u0644\u0627\u062A\u0635\u0627\u0644 \u0645\u0641\u0639\u0651\u0644" }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "muted", children: isOnline ? `\u064A\u0648\u062C\u062F ${queuedActions.length} \u0639\u0646\u0635\u0631 \u0628\u0627\u0646\u062A\u0638\u0627\u0631 \u0627\u0644\u0645\u0632\u0627\u0645\u0646\u0629. ${syncMessage}` : "\u064A\u0645\u0643\u0646\u0643 \u0645\u062A\u0627\u0628\u0639\u0629 \u0627\u0644\u062A\u0635\u0641\u062D\u060C \u0648\u0633\u0646\u0631\u0633\u0644 \u0627\u0644\u0631\u0633\u0627\u0626\u0644 \u0648\u0627\u0644\u0637\u0644\u0628\u0627\u062A \u0627\u0644\u0645\u0624\u062C\u0644\u0629 \u0639\u0646\u062F \u0631\u062C\u0648\u0639 \u0627\u0644\u0634\u0628\u0643\u0629." })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "offline-actions-row", children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Link, { to: "/", className: "offline-quick-link", children: "\u0627\u0644\u0635\u0641\u062D\u0629 \u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629" }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Link, { to: "/notifications", className: "offline-quick-link", children: "\u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062A" }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Link, { to: "/inbox", className: "offline-quick-link", children: "\u0627\u0644\u0631\u0633\u0627\u0626\u0644" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("style", { children: `
        .offline-experience-shell {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
          margin: 12px 16px 0;
          border: 1px solid rgba(245,158,11,0.22);
          background: linear-gradient(135deg, rgba(15,23,42,0.95), rgba(30,41,59,0.95));
        }
        .offline-actions-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .offline-quick-link {
          padding: 8px 12px;
          border-radius: 999px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.08);
        }
      ` })
  ] });
}

// src/hooks/useNetworkStatus.js
init_define_import_meta_env();
var import_react4 = __toESM(require_react(), 1);
function useNetworkStatus() {
  const setOnlineStatus = useAppStore((state) => state.setOnlineStatus);
  (0, import_react4.useEffect)(() => {
    const updateStatus = (online) => {
      setOnlineStatus(Boolean(online));
      if (online) {
        if (!socket_default.connected) socket_default.connect();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("yamshat:network-restored"));
        }
        return;
      }
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("yamshat:network-lost"));
      }
      if (socket_default.connected) socket_default.disconnect();
    };
    updateStatus(typeof navigator === "undefined" ? true : navigator.onLine);
    const handleOnline = () => updateStatus(true);
    const handleOffline = () => updateStatus(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [setOnlineStatus]);
}

// src/hooks/useOfflineQueue.js
init_define_import_meta_env();
var import_react5 = __toESM(require_react(), 1);
function fireQueueEvent(name, detail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(name, { detail }));
}
function useOfflineQueue() {
  const isOnline = useAppStore((state) => state.isOnline);
  const queuedActions = useAppStore((state) => state.queuedActions);
  const dequeueAction = useAppStore((state) => state.dequeueAction);
  const updateQueuedAction = useAppStore((state) => state.updateQueuedAction);
  const replaceQueuedActions = useAppStore((state) => state.replaceQueuedActions);
  const runningRef = (0, import_react5.useRef)(false);
  (0, import_react5.useEffect)(() => {
    if (!featureFlags_default.offlineQueue || !isOnline || runningRef.current || queuedActions.length === 0) return;
    window.__YAMSHAT_SW_READY__?.then((registration) => registration?.active?.postMessage?.({ type: "yamshat:queue-sync" })).catch(() => null);
    let cancelled = false;
    runningRef.current = true;
    const flushQueue = async () => {
      logger_default.info("offline queue flush started", { size: queuedActions.length });
      for (const action of queuedActions) {
        if (cancelled) break;
        if (action?.type !== "chat:send_message" || !action?.payload) {
          dequeueAction(action?.id);
          continue;
        }
        const retryAtMs = action?.nextRetryAt ? new Date(action.nextRetryAt).getTime() : 0;
        if (retryAtMs && retryAtMs > Date.now()) {
          continue;
        }
        try {
          updateQueuedAction(action.id, { lastAttemptAt: (/* @__PURE__ */ new Date()).toISOString() });
          const { data } = await sendMessageApi(action.payload);
          dequeueAction(action.id);
          fireQueueEvent("yamshat:queued-message-sent", {
            queuedId: action.id,
            client_id: action.payload.client_id,
            payload: action.payload,
            response: data?.data || data
          });
          await sleep(120);
        } catch (error) {
          const status = error?.response?.status;
          const attempts = Number(action?.attempts || 0) + 1;
          logger_default.warn("offline queue item failed", { actionId: action.id, status, attempts });
          if (status && status < 500 && status !== 429) {
            dequeueAction(action.id);
            fireQueueEvent("yamshat:queued-message-failed", {
              queuedId: action.id,
              client_id: action.payload.client_id,
              payload: action.payload,
              error: error?.response?.data?.detail || error?.message || "Queue item failed"
            });
            continue;
          }
          const delayMs = getBackoffDelayMs(attempts - 1, {
            baseDelayMs: status === 429 ? 1400 : 900,
            maxDelayMs: 45e3,
            jitterRatio: 0.4
          });
          updateQueuedAction(action.id, {
            attempts,
            lastAttemptAt: (/* @__PURE__ */ new Date()).toISOString(),
            nextRetryAt: new Date(Date.now() + delayMs).toISOString()
          });
          break;
        }
      }
      runningRef.current = false;
    };
    flushQueue();
    const handleSyncNow = () => {
      replaceQueuedActions([...useAppStore.getState().queuedActions]);
    };
    const handleServiceWorkerMessage = (event) => {
      if (event.data?.type === "yamshat:sync-now") handleSyncNow();
    };
    window.addEventListener("yamshat:sync-now", handleSyncNow);
    navigator.serviceWorker?.addEventListener?.("message", handleServiceWorkerMessage);
    const pendingRetryAt = queuedActions.map((item) => item?.nextRetryAt ? new Date(item.nextRetryAt).getTime() : 0).filter((value) => value > Date.now()).sort((a, b) => a - b)[0];
    const timer = pendingRetryAt ? window.setTimeout(() => {
      replaceQueuedActions([...useAppStore.getState().queuedActions]);
    }, Math.max(250, pendingRetryAt - Date.now() + 50)) : null;
    return () => {
      cancelled = true;
      runningRef.current = false;
      if (timer) window.clearTimeout(timer);
      window.removeEventListener("yamshat:sync-now", handleSyncNow);
      navigator.serviceWorker?.removeEventListener?.("message", handleServiceWorkerMessage);
    };
  }, [dequeueAction, isOnline, queuedActions, replaceQueuedActions, updateQueuedAction]);
}

// src/hooks/useSessionGuard.js
init_define_import_meta_env();
var import_react6 = __toESM(require_react(), 1);
var PUBLIC_PATHS = /* @__PURE__ */ new Set(["/login", "/register", "/verify-email", "/forgot-password", "/reset-password", "/admin", "/admin/login"]);
var REFRESH_EARLY_WINDOW_MS = 6e4;
function isPublicPath(pathname) {
  if (PUBLIC_PATHS.has(pathname)) return true;
  return pathname.startsWith("/reset-password");
}
function redirectToLogin(pathname) {
  if (typeof window === "undefined") return;
  const currentPath = getCurrentAppPathname();
  const loginPath = pathname.startsWith("/admin") || currentPath.startsWith("/admin") ? "/admin/login" : "/login";
  redirectToAppPath(loginPath);
}
function useSessionGuard() {
  const location = useLocation();
  const setAuthHydrated = useAppStore((state) => state.setAuthHydrated);
  const setAuthLoading = useAppStore((state) => state.setAuthLoading);
  (0, import_react6.useEffect)(() => {
    let cancelled = false;
    const bootstrap = async () => {
      setAuthLoading(true);
      try {
        const pathname = location.pathname;
        const publicPath = isPublicPath(pathname);
        const stored = getStoredUser();
        const token = getAuthToken();
        const shouldAttemptRestore = !publicPath || hasStoredSession();
        if (stored && token && !shouldRefreshSessionSoon(REFRESH_EARLY_WINDOW_MS)) return;
        if (!shouldAttemptRestore) return;
        await sessionManager_default.refreshSession({
          reason: publicPath ? "public-bootstrap" : "protected-bootstrap",
          force: !publicPath
        });
      } catch {
        if (cancelled) return;
        clearStoredUser();
        if (!isPublicPath(location.pathname)) redirectToLogin(location.pathname);
      } finally {
        if (!cancelled) {
          setAuthHydrated(true);
          setAuthLoading(false);
        }
      }
    };
    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [location.pathname, setAuthHydrated, setAuthLoading]);
  (0, import_react6.useEffect)(() => {
    if (!hasStoredSession()) return void 0;
    const ttl = getSessionTtlMs();
    if (ttl === null) return void 0;
    const refreshIn = Math.max(ttl - REFRESH_EARLY_WINDOW_MS, 5e3);
    const timer = window.setTimeout(async () => {
      try {
        setAuthLoading(true);
        await sessionManager_default.refreshSession({ reason: "scheduled" });
      } catch {
        clearStoredUser();
        if (!isPublicPath(location.pathname)) redirectToLogin(location.pathname);
      } finally {
        setAuthHydrated(true);
        setAuthLoading(false);
      }
    }, refreshIn);
    return () => window.clearTimeout(timer);
  }, [location.pathname, setAuthHydrated, setAuthLoading]);
}

// src/hooks/usePageAnalytics.js
init_define_import_meta_env();
var import_react7 = __toESM(require_react(), 1);

// src/utils/analytics.js
init_define_import_meta_env();
var QUEUE_KEY = "yamshat-analytics-queue";
function readQueue() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(QUEUE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
function writeQueue(queue) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(QUEUE_KEY, JSON.stringify(queue.slice(-50)));
  } catch {
  }
}
function getAnonymousId() {
  if (typeof window === "undefined") return "server";
  try {
    const key = "yamshat-anonymous-id";
    const existing = window.localStorage.getItem(key);
    if (existing) return existing;
    const next = `anon-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem(key, next);
    return next;
  } catch {
    return `anon-${Date.now()}`;
  }
}
function buildHeaders() {
  const headers = {
    "Content-Type": "application/json",
    "X-Yamshat-Client": "web",
    "X-Session-Id": typeof window === "undefined" ? "server" : window.sessionStorage.getItem("yamshat-session-id") || getAnonymousId(),
    "X-Anonymous-Id": getAnonymousId()
  };
  const token = getAuthToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const csrfToken = getCsrfToken();
  if (csrfToken) headers["X-CSRF-Token"] = csrfToken;
  return headers;
}
async function sendPayload(payload) {
  const endpoint = `${API_BASE}/analytics/events`;
  const body = JSON.stringify(payload);
  if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    try {
      const blob = new Blob([body], { type: "application/json" });
      const ok = navigator.sendBeacon(endpoint, blob);
      if (ok) return true;
    } catch {
    }
  }
  const response = await fetch(endpoint, {
    method: "POST",
    headers: buildHeaders(),
    body,
    keepalive: true,
    credentials: "include"
  });
  if (!response.ok) throw new Error(`Analytics failed: ${response.status}`);
  return true;
}
async function flushAnalyticsQueue() {
  const queued = readQueue();
  if (!queued.length) return;
  const pending = [...queued];
  writeQueue([]);
  for (const item of pending) {
    try {
      await sendPayload(item);
    } catch {
      writeQueue([...readQueue(), item]);
    }
  }
}
async function trackEvent(eventName, properties = {}, context = {}) {
  const payload = {
    event_name: eventName,
    category: context.category || "ui",
    route: context.route || (typeof window !== "undefined" ? window.location.pathname : "/"),
    platform: "web",
    anonymous_id: getAnonymousId(),
    properties,
    context
  };
  try {
    await sendPayload(payload);
  } catch {
    writeQueue([...readQueue(), payload]);
  }
}
function trackPageView(route, title = "") {
  return trackEvent("page_view", { title: title || (typeof document !== "undefined" ? document.title : "") }, { category: "navigation", route });
}

// src/hooks/usePageAnalytics.js
function usePageAnalytics() {
  const location = useLocation();
  (0, import_react7.useEffect)(() => {
    const route = `${location.pathname}${location.search || ""}`;
    trackPageView(route).catch(() => null);
  }, [location.pathname, location.search]);
  (0, import_react7.useEffect)(() => {
    flushAnalyticsQueue().catch(() => null);
    const handleOnline = () => {
      flushAnalyticsQueue().catch(() => null);
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, []);
}

// src/hooks/useChatRealtime.js
init_define_import_meta_env();
var import_react8 = __toESM(require_react(), 1);
function useChatRealtime() {
  const currentUser = getCurrentUsername();
  const token = getAuthToken();
  const initialized2 = useChatStore((state) => state.initialized);
  const activePeer = useChatStore((state) => state.activePeer);
  const hydrateThreads = useChatStore((state) => state.hydrateThreads);
  const applyIncomingMessage = useChatStore((state) => state.applyIncomingMessage);
  const updateMessageStatus = useChatStore((state) => state.updateMessageStatus);
  const setPresence = useChatStore((state) => state.setPresence);
  const markThreadRead = useChatStore((state) => state.markThreadRead);
  const setLoadingThreads = useChatStore((state) => state.setLoadingThreads);
  const activePeerRef = (0, import_react8.useRef)(activePeer);
  (0, import_react8.useEffect)(() => {
    activePeerRef.current = activePeer;
  }, [activePeer]);
  (0, import_react8.useEffect)(() => {
    if (!currentUser || initialized2) return void 0;
    let active = true;
    const bootstrap = async () => {
      setLoadingThreads(true);
      try {
        const { data } = await getChatThreads({});
        if (!active) return;
        hydrateThreads(Array.isArray(data) ? data : [], { replace: true });
      } catch (error) {
        logger_default.warn("chat threads bootstrap failed", { detail: error?.response?.data?.detail || error?.message });
      } finally {
        if (active) setLoadingThreads(false);
      }
    };
    bootstrap();
    return () => {
      active = false;
    };
  }, [currentUser, hydrateThreads, initialized2, setLoadingThreads]);
  (0, import_react8.useEffect)(() => {
    if (!currentUser) return void 0;
    const emitRegister = () => {
      socketManager_default.emit("register_user", { token, user: currentUser }, { skipSignature: true });
      socketManager_default.emit("sync_chat_state", { peer: activePeerRef.current || void 0 });
    };
    socketManager_default.connect();
    emitRegister();
    const handleConnect = () => emitRegister();
    const handleNewMessage = (message) => {
      const participants = [message?.sender, message?.receiver];
      if (!participants.includes(currentUser)) return;
      const peer = message?.sender === currentUser ? message?.receiver : message?.sender;
      applyIncomingMessage(message, currentUser, {
        skipUnreadIncrement: message?.sender !== currentUser && activePeerRef.current === peer
      });
      if (message?.sender !== currentUser && activePeerRef.current === peer) {
        markThreadRead(peer);
      }
    };
    const handleDelivered = (payload) => {
      if (payload?.sender !== currentUser || !payload?.viewer) return;
      updateMessageStatus(payload.viewer, payload.message_ids || [], "delivered");
    };
    const handleSeen = (payload) => {
      if (payload?.sender === currentUser && payload?.viewer) {
        updateMessageStatus(payload.viewer, payload.message_ids || [], "seen");
      }
      if (payload?.viewer === currentUser && payload?.sender) {
        markThreadRead(payload.sender);
      }
    };
    const handlePresence = (payload) => {
      if (!payload?.user) return;
      setPresence(payload.user, payload);
    };
    const handleTyping = (payload) => {
      if (!payload?.sender) return;
      setPresence(payload.sender, {
        is_typing: Boolean(payload?.is_typing),
        typing_updated_at: (/* @__PURE__ */ new Date()).toISOString()
      });
    };
    socketManager_default.on("connect", handleConnect);
    socketManager_default.on("new_private_message", handleNewMessage);
    socketManager_default.on("messages_delivered", handleDelivered);
    socketManager_default.on("messages_seen", handleSeen);
    socketManager_default.on("presence_update", handlePresence);
    socketManager_default.on("typing_update", handleTyping);
    return () => {
      socketManager_default.off("connect", handleConnect);
      socketManager_default.off("new_private_message", handleNewMessage);
      socketManager_default.off("messages_delivered", handleDelivered);
      socketManager_default.off("messages_seen", handleSeen);
      socketManager_default.off("presence_update", handlePresence);
      socketManager_default.off("typing_update", handleTyping);
    };
  }, [activePeer, applyIncomingMessage, currentUser, markThreadRead, setPresence, token, updateMessageStatus]);
}

// src/App.jsx
var import_jsx_runtime7 = __toESM(require_jsx_runtime(), 1);
var AdminDashboard = (0, import_react9.lazy)(() => import("./chunks/admin-P7JM6UOM.js").then((mod) => ({ default: mod.AdminDashboard })));
var AdminUsers = (0, import_react9.lazy)(() => import("./chunks/admin-P7JM6UOM.js").then((mod) => ({ default: mod.AdminUsers })));
var AdminPosts = (0, import_react9.lazy)(() => import("./chunks/admin-P7JM6UOM.js").then((mod) => ({ default: mod.AdminPosts })));
var AdminNotifications = (0, import_react9.lazy)(() => import("./chunks/admin-P7JM6UOM.js").then((mod) => ({ default: mod.AdminNotifications })));
var AdminLive = (0, import_react9.lazy)(() => import("./chunks/admin-P7JM6UOM.js").then((mod) => ({ default: mod.AdminLive })));
var AdminReports = (0, import_react9.lazy)(() => import("./chunks/admin-P7JM6UOM.js").then((mod) => ({ default: mod.AdminReports })));
var AdminAudit = (0, import_react9.lazy)(() => import("./chunks/admin-P7JM6UOM.js").then((mod) => ({ default: mod.AdminAudit })));
var AdminSettings = (0, import_react9.lazy)(() => import("./chunks/admin-P7JM6UOM.js").then((mod) => ({ default: mod.AdminSettings })));
var AdminRbac = (0, import_react9.lazy)(() => import("./chunks/admin-P7JM6UOM.js").then((mod) => ({ default: mod.AdminRbac })));
var AdminChat = (0, import_react9.lazy)(() => import("./chunks/admin-P7JM6UOM.js").then((mod) => ({ default: mod.AdminChat })));
var AdminStories = (0, import_react9.lazy)(() => import("./chunks/admin-P7JM6UOM.js").then((mod) => ({ default: mod.AdminStories })));
var AdminReels = (0, import_react9.lazy)(() => import("./chunks/admin-P7JM6UOM.js").then((mod) => ({ default: mod.AdminReels })));
var AdminGroups = (0, import_react9.lazy)(() => import("./chunks/admin-P7JM6UOM.js").then((mod) => ({ default: mod.AdminGroups })));
var Login = (0, import_react9.lazy)(() => import("./chunks/Login-5BMPMDED.js"));
var AdminLogin = (0, import_react9.lazy)(() => import("./chunks/AdminLogin-GCU52ZGA.js"));
var Register = (0, import_react9.lazy)(() => import("./chunks/Register-YHXVOBB4.js"));
var VerifyEmail = (0, import_react9.lazy)(() => import("./chunks/VerifyEmail-WWHKEQFS.js"));
var ForgotPassword = (0, import_react9.lazy)(() => import("./chunks/ForgotPassword-GZR4QQ3X.js"));
var ResetPassword = (0, import_react9.lazy)(() => import("./chunks/ResetPassword-A3ZV4ZSU.js"));
var Dashboard = (0, import_react9.lazy)(() => import("./chunks/Dashboard-FS6N6W3M.js"));
var LiveStreamDashboard = (0, import_react9.lazy)(() => import("./chunks/LiveStreamDashboard-GKZKEQAY.js"));
var Feed = (0, import_react9.lazy)(() => import("./chunks/Feed-DPX3EJJB.js"));
var Stories = (0, import_react9.lazy)(() => import("./chunks/Stories-AH23EFRE.js"));
var Reels = (0, import_react9.lazy)(() => import("./chunks/Reels-EUDC3EAD.js"));
var Groups = (0, import_react9.lazy)(() => import("./chunks/Groups-FNWPBLPC.js"));
var Live = (0, import_react9.lazy)(() => import("./chunks/Live-3GMZ7KYD.js"));
var Inbox = (0, import_react9.lazy)(() => import("./chunks/chat-FSKBGTUX.js").then((mod) => ({ default: mod.Inbox })));
var Users = (0, import_react9.lazy)(() => import("./chunks/Users-Z57PWDCW.js"));
var Profile = (0, import_react9.lazy)(() => import("./chunks/Profile-7J54KWQV.js"));
var Chat = (0, import_react9.lazy)(() => import("./chunks/chat-FSKBGTUX.js").then((mod) => ({ default: mod.Chat })));
var Notifications = (0, import_react9.lazy)(() => import("./chunks/notifications-VZTIAEGD.js").then((mod) => ({ default: mod.Notifications })));
var Search = (0, import_react9.lazy)(() => import("./chunks/Search-YDRZ6KN3.js"));
var Settings = (0, import_react9.lazy)(() => import("./chunks/Settings-XNOTV627.js"));
function AppGuards() {
  useNetworkStatus();
  useSessionGuard();
  useOfflineQueue();
  usePageAnalytics();
  useChatRealtime();
  const theme = useAppStore((state) => state.theme);
  const language = useAppStore((state) => state.language);
  const activeRequests = useAppStore((state) => state.activeRequests);
  (0, import_react9.useEffect)(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  }, [theme]);
  (0, import_react9.useEffect)(() => {
    document.documentElement.setAttribute("lang", language);
    document.documentElement.setAttribute("dir", language === "ar" ? "rtl" : "ltr");
  }, [language]);
  (0, import_react9.useEffect)(() => {
    const timers = /* @__PURE__ */ new WeakMap();
    const clickableSelector = "button, a.btn, .mini-action, .ghost-btn, .reaction-btn, .table-link, .story-user-card";
    const handlePointerFeedback = (event) => {
      const target = event.target instanceof Element ? event.target.closest(clickableSelector) : null;
      if (!target) return;
      const isDisabled = target.matches?.(":disabled") || target.getAttribute("aria-disabled") === "true";
      if (isDisabled || target.getAttribute("aria-busy") === "true" || target.dataset.busy === "true") return;
      target.dataset.autoBusy = "true";
      const activeTimer = timers.get(target);
      if (activeTimer) window.clearTimeout(activeTimer);
      const nextTimer = window.setTimeout(() => {
        delete target.dataset.autoBusy;
      }, 650);
      timers.set(target, nextTimer);
    };
    document.addEventListener("click", handlePointerFeedback, true);
    return () => {
      document.removeEventListener("click", handlePointerFeedback, true);
    };
  }, []);
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(import_jsx_runtime7.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(AppStatusBanner, {}),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(InstallPrompt, {}),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(OfflineExperience, {}),
    activeRequests > 0 ? /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "global-progress-bar" }) : null
  ] });
}
function RouteFallback() {
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(RoutePageSkeleton, {});
}
function App() {
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(ToastProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(AppErrorBoundary, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(AppGuards, {}),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_react9.Suspense, { fallback: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(RouteFallback, {}), children: /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(Routes, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Route, { path: "/login", element: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Login, {}) }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Route, { path: "/register", element: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Register, {}) }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Route, { path: "/verify-email", element: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(VerifyEmail, {}) }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Route, { path: "/forgot-password", element: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(ForgotPassword, {}) }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Route, { path: "/reset-password", element: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(ResetPassword, {}) }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Route, { path: "/admin", element: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Navigate, { to: "/admin/login", replace: true }) }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Route, { path: "/admin/login", element: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(AdminLogin, {}) }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Route, { path: "/admin/register", element: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Navigate, { to: "/register", replace: true }) }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Route, { path: "/", element: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(ProtectedRoute, { children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Feed, {}) }) }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Route, { path: "/dashboard", element: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(ProtectedRoute, { children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Dashboard, {}) }) }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Route, { path: "/livestream-dashboard", element: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(ProtectedRoute, { children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(LiveStreamDashboard, {}) }) }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Route, { path: "/stories", element: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(ProtectedRoute, { children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Stories, {}) }) }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Route, { path: "/reels", element: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(ProtectedRoute, { children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Reels, {}) }) }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Route, { path: "/groups", element: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(ProtectedRoute, { children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Groups, {}) }) }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Route, { path: "/live", element: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(ProtectedRoute, { children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Live, {}) }) }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Route, { path: "/inbox", element: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(ProtectedRoute, { children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Inbox, {}) }) }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Route, { path: "/users", element: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(ProtectedRoute, { children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Users, {}) }) }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Route, { path: "/profile", element: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(ProtectedRoute, { children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Profile, {}) }) }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Route, { path: "/notifications", element: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(ProtectedRoute, { children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Notifications, {}) }) }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Route, { path: "/search", element: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(ProtectedRoute, { children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Search, {}) }) }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Route, { path: "/settings", element: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(ProtectedRoute, { children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Settings, {}) }) }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Route, { path: "/profile/:username", element: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(ProtectedRoute, { children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Profile, {}) }) }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Route, { path: "/chat", element: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(ProtectedRoute, { children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Chat, {}) }) }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Route, { path: "/chat/:userId", element: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(ProtectedRoute, { children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Chat, {}) }) }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Route, { path: "/admin/dashboard", element: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(ProtectedRoute, { requiredPermission: "dashboard.view", children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(AdminDashboard, {}) }) }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Route, { path: "/admin/users", element: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(ProtectedRoute, { requiredPermission: "users.view", children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(AdminUsers, {}) }) }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Route, { path: "/admin/rbac", element: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(ProtectedRoute, { requiredPermission: "rbac.view", children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(AdminRbac, {}) }) }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Route, { path: "/admin/posts", element: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(ProtectedRoute, { requiredPermission: "posts.view", children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(AdminPosts, {}) }) }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Route, { path: "/admin/content", element: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Navigate, { to: "/admin/posts", replace: true }) }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Route, { path: "/admin/notifications", element: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(ProtectedRoute, { requiredPermission: "notifications.manage", children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(AdminNotifications, {}) }) }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Route, { path: "/admin/live", element: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(ProtectedRoute, { requiredPermission: "live.manage", children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(AdminLive, {}) }) }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Route, { path: "/admin/reports", element: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(ProtectedRoute, { requiredPermission: "reports.view", children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(AdminReports, {}) }) }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Route, { path: "/admin/audit", element: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(ProtectedRoute, { requiredPermission: "dashboard.view", children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(AdminAudit, {}) }) }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Route, { path: "/admin/settings", element: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(ProtectedRoute, { requiredPermission: "settings.manage", children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(AdminSettings, {}) }) }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Route, { path: "/admin/chat", element: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(ProtectedRoute, { children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(AdminChat, {}) }) }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Route, { path: "/admin/stories", element: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(ProtectedRoute, { children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(AdminStories, {}) }) }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Route, { path: "/admin/reels", element: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(ProtectedRoute, { children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(AdminReels, {}) }) }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Route, { path: "/admin/groups", element: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(ProtectedRoute, { children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(AdminGroups, {}) }) }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Route, { path: "*", element: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Navigate, { to: "/", replace: true }) })
    ] }) })
  ] }) });
}

// src/lib/queryClient.js
init_define_import_meta_env();
var queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 6e4,
      gcTime: 10 * 6e4,
      retry: (failureCount, error) => {
        const status = error?.response?.status;
        if ([400, 401, 403, 404, 422].includes(status)) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchInterval: false,
      networkMode: "offlineFirst",
      structuralSharing: true
    },
    mutations: {
      retry: 1,
      networkMode: "offlineFirst"
    }
  }
});

// src/realtime/RealtimeProvider.jsx
init_define_import_meta_env();
var import_react10 = __toESM(require_react(), 1);
var import_jsx_runtime8 = __toESM(require_jsx_runtime(), 1);
var RealtimeContext = (0, import_react10.createContext)({
  socket: socket_default,
  connected: false,
  socketId: ""
});
function redirectToLogin2() {
  if (typeof window === "undefined") return;
  const currentPath = getCurrentAppPathname();
  const loginPath = currentPath.startsWith("/admin") ? "/admin/login" : "/login";
  redirectToAppPath(loginPath);
}
function RealtimeProvider({ children }) {
  const session = useAppStore((state) => state.session);
  const [connected, setConnected] = (0, import_react10.useState)(socket_default.connected);
  const [socketId, setSocketId] = (0, import_react10.useState)(socket_default.id || "");
  (0, import_react10.useEffect)(() => {
    const handleConnect = () => {
      setConnected(true);
      setSocketId(socket_default.id || "");
    };
    const handleDisconnect = () => {
      setConnected(false);
      setSocketId("");
    };
    const handleAuthExpired = () => {
      logger_default.warn("realtime auth expired, clearing session");
      clearStoredUser();
      redirectToLogin2();
    };
    const disposeConnect = socket_default.on("connect", handleConnect);
    const disposeDisconnect = socket_default.on("disconnect", handleDisconnect);
    const disposeAuthExpired = socket_default.on("auth_expired", handleAuthExpired);
    return () => {
      disposeConnect?.();
      disposeDisconnect?.();
      disposeAuthExpired?.();
    };
  }, []);
  (0, import_react10.useEffect)(() => {
    if (session?.access_token || session?.token) {
      socket_default.syncAuth();
      socket_default.connect();
      return void 0;
    }
    socket_default.disconnect();
    return void 0;
  }, [session?.access_token, session?.token, session?.username, session?.role]);
  const value = (0, import_react10.useMemo)(() => ({ socket: socket_default, connected, socketId }), [connected, socketId]);
  return /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(RealtimeContext.Provider, { value, children });
}
var RealtimeProvider_default = RealtimeProvider;

// src/utils/runtimeErrors.js
init_define_import_meta_env();
var initialized = false;
function report(kind, payload = {}) {
  if (!featureFlags_default.frontendLogging) return;
  logger_default.error(`frontend runtime ${kind}`, payload);
}
function initializeRuntimeErrorCapture() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  window.addEventListener("error", (event) => {
    report("error", {
      message: event?.message,
      filename: event?.filename,
      lineno: event?.lineno,
      colno: event?.colno,
      stack: event?.error?.stack
    });
  });
  window.addEventListener("unhandledrejection", (event) => {
    report("unhandledrejection", {
      reason: event?.reason?.message || String(event?.reason || ""),
      stack: event?.reason?.stack
    });
  });
}

// src/main.jsx
var import_jsx_runtime9 = __toESM(require_jsx_runtime(), 1);
if (typeof window !== "undefined") {
  window.__YAMSHAT_SW_READY__ = Promise.resolve(null);
  initializePerformanceToolkit();
  initializeRuntimeErrorCapture();
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    useAppStore.getState().setInstallPrompt(event);
  });
  window.addEventListener("appinstalled", () => {
    useAppStore.getState().clearInstallPrompt();
  });
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      window.__YAMSHAT_SW_READY__ = navigator.serviceWorker.register("/sw.js").then((registration) => {
        initializePerformanceToolkit({ registration });
        notificationService_default.initialize().catch(() => null);
        return registration;
      }).catch(() => null);
    });
  }
}
import_client.default.createRoot(document.getElementById("root")).render(
  /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(import_react11.default.StrictMode, { children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(QueryClientProvider, { client: queryClient, children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(HashRouter, { children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(RealtimeProvider_default, { children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(App, {}) }) }) }) })
);

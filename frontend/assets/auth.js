(() => {
    const storageKey = "yamshatAuth";
    const resolvedApiBase = (() => {
        const saved = (localStorage.getItem("apiBase") || "").trim().replace(/\/+$/, "");
        if (saved) return saved.endsWith("/api") ? saved : `${saved}/api`;
        return `${window.location.origin.replace(/\/+$/, "")}/api`;
    })();

    function getStoredAuth() {
        try {
            const raw = localStorage.getItem(storageKey);
            if (!raw) return {};
            const data = JSON.parse(raw);
            return typeof data === "object" && data ? data : {};
        } catch (_) {
            return {};
        }
    }

    function setStoredAuth(payload = {}) {
        const next = {
            token: String(payload.token || "").trim(),
            user: String(payload.user || "").trim(),
            email: String(payload.email || "").trim(),
        };
        if (!next.token && !next.user && !next.email) {
            localStorage.removeItem(storageKey);
            return {};
        }
        localStorage.setItem(storageKey, JSON.stringify(next));
        return next;
    }

    function clearStoredAuth() {
        localStorage.removeItem(storageKey);
    }

    function persistSessionFromPayload(payload = {}) {
        const current = getStoredAuth();
        const next = {
            token: String(payload.token || current.token || "").trim(),
            user: String(payload.user || current.user || "").trim(),
            email: String(payload.email || current.email || "").trim(),
        };
        return setStoredAuth(next);
    }

    function withAuthHeaders(headers = {}) {
        const nextHeaders = { ...headers };
        const auth = getStoredAuth();
        if (auth.token && !nextHeaders.Authorization) {
            nextHeaders.Authorization = `Bearer ${auth.token}`;
        }
        return nextHeaders;
    }

    async function authFetch(url, options = {}) {
        const nextOptions = { credentials: "include", ...options };
        nextOptions.headers = withAuthHeaders(options.headers || {});
        return fetch(url, nextOptions);
    }

    async function requestJSON(url, options = {}) {
        const response = await authFetch(url, options);
        const data = await response.json().catch(() => ({ message: "حدث خطأ غير متوقع" }));
        if (data && typeof data === "object" && (data.token || data.user || data.email)) {
            persistSessionFromPayload(data);
        }
        if (!response.ok) {
            if (response.status === 401) {
                clearStoredAuth();
            }
            throw new Error(data.message || "حدث خطأ في الطلب");
        }
        return data;
    }

    window.API_BASE = resolvedApiBase;
    window.AUTH_STORAGE_KEY = storageKey;
    window.getStoredAuth = getStoredAuth;
    window.setStoredAuth = setStoredAuth;
    window.clearStoredAuth = clearStoredAuth;
    window.persistSessionFromPayload = persistSessionFromPayload;
    window.withAuthHeaders = withAuthHeaders;
    window.authFetch = authFetch;
    window.requestJSON = requestJSON;
})();

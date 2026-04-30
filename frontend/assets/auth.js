(() => {
    const storageKey = "yamshatAuth";
    const chatKeyPrefix = "yamshatChatKeys:";

    function normalizeBase(url) {
        const safe = String(url || "").trim().replace(/\/+$/, "");
        if (!safe) return "";
        return safe.endsWith("/api") ? safe : `${safe}/api`;
    }

    function detectApiBase() {
        const saved = normalizeBase(localStorage.getItem("apiBase"));
        if (saved) return saved;

        const explicit = normalizeBase(window.YAMSHAT_API_BASE || window.APP_API_BASE || window.YAMSHAT_BACKEND_ORIGIN);
        if (explicit) return explicit;

        const backendOrigin = String(window.YAMSHAT_BACKEND_ORIGIN || "").trim().replace(/\/+$/, "");
        if (backendOrigin) return `${backendOrigin}/api`;

        const origin = window.location.origin.replace(/\/+$/, "");
        const host = window.location.hostname;

        if (host === "127.0.0.1" || host === "localhost") {
            if (window.location.port === "5500") return "http://127.0.0.1:5000/api";
            return `${origin}/api`;
        }
        return `${origin}/api`;
    }

    const resolvedApiBase = detectApiBase();

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
            token: String(payload.token || payload.access_token || "").trim(),
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
            token: String(payload.token || payload.access_token || current.token || "").trim(),
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

    function b64FromBytes(buffer) {
        return btoa(String.fromCharCode(...new Uint8Array(buffer)));
    }

    function bytesFromB64(value) {
        return Uint8Array.from(atob(String(value || "")), char => char.charCodeAt(0));
    }

    function chatKeyStorageKey(user) {
        return `${chatKeyPrefix}${String(user || "").trim().toLowerCase()}`;
    }

    async function generateWebChatKeyPair() {
        const keyPair = await crypto.subtle.generateKey(
            {
                name: 'RSA-OAEP',
                modulusLength: 2048,
                publicExponent: new Uint8Array([1, 0, 1]),
                hash: 'SHA-256',
            },
            true,
            ['encrypt', 'decrypt']
        );
        const [publicKey, privateKey] = await Promise.all([
            crypto.subtle.exportKey('spki', keyPair.publicKey),
            crypto.subtle.exportKey('pkcs8', keyPair.privateKey),
        ]);
        return {
            publicKey: b64FromBytes(publicKey),
            privateKey: b64FromBytes(privateKey),
            algorithm: 'RSA_OAEP_SHA256',
        };
    }

    async function getStoredWebChatKeys(user = getStoredAuth().user) {
        const raw = localStorage.getItem(chatKeyStorageKey(user));
        if (!raw) return null;
        try {
            const parsed = JSON.parse(raw);
            if (!parsed?.publicKey || !parsed?.privateKey) return null;
            return parsed;
        } catch (_) {
            return null;
        }
    }

    async function importWebChatPublicKey(publicKeyB64) {
        return crypto.subtle.importKey(
            'spki',
            bytesFromB64(publicKeyB64),
            { name: 'RSA-OAEP', hash: 'SHA-256' },
            false,
            ['encrypt']
        );
    }

    async function importWebChatPrivateKey(privateKeyB64) {
        return crypto.subtle.importKey(
            'pkcs8',
            bytesFromB64(privateKeyB64),
            { name: 'RSA-OAEP', hash: 'SHA-256' },
            false,
            ['decrypt']
        );
    }

    async function requestJSON(url, options = {}) {
        const response = await authFetch(url, options);
        const data = await response.json().catch(() => ({ message: "حدث خطأ غير متوقع" }));
        if (data && typeof data === "object" && (data.token || data.access_token || data.user || data.email)) {
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

    async function ensureWebChatIdentity(user = getStoredAuth().user, options = {}) {
        const safeUser = String(user || '').trim();
        if (!safeUser) return null;
        let keys = options.force ? null : await getStoredWebChatKeys(safeUser);
        if (!keys) {
            keys = await generateWebChatKeyPair();
            localStorage.setItem(chatKeyStorageKey(safeUser), JSON.stringify(keys));
        }
        if (options.upload !== false && getStoredAuth().token) {
            await requestJSON(`${resolvedApiBase}/chat_keys/public`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ public_key: keys.publicKey, algorithm: keys.algorithm || 'RSA_OAEP_SHA256' }),
            });
        }
        return keys;
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
    window.ensureWebChatIdentity = ensureWebChatIdentity;
    window.getStoredWebChatKeys = getStoredWebChatKeys;
    window.importWebChatPublicKey = importWebChatPublicKey;
    window.importWebChatPrivateKey = importWebChatPrivateKey;
    window.webChatBytesFromB64 = bytesFromB64;
    window.webChatB64FromBytes = b64FromBytes;
})();

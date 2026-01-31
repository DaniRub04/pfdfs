/* =======================
   Config
======================= */
const RAW_API_URL = import.meta.env.VITE_API_URL;

if (!RAW_API_URL) {
    throw new Error("❌ Falta la variable de entorno VITE_API_URL (Vercel / .env)");
}

const API_URL = RAW_API_URL.replace(/\/+$/, "");

/* =======================
   Token helpers
======================= */
export function getToken() {
    return localStorage.getItem("token");
}

export function setToken(token) {
    localStorage.setItem("token", token);
}

export function clearToken() {
    localStorage.removeItem("token");
}

export function isLoggedIn() {
    return !!getToken();
}

/* =======================
   Utils
======================= */
function withLeadingSlash(path) {
    return path.startsWith("/") ? path : `/${path}`;
}

function toQueryString(params = {}) {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
        if (v === undefined || v === null || v === "") return;
        sp.append(k, String(v));
    });
    const qs = sp.toString();
    return qs ? `?${qs}` : "";
}

/* =======================
   Request helper
======================= */
async function request(path, options = {}) {
    const safePath = withLeadingSlash(path);
    const token = options.token ?? getToken();
    const body = options.body;

    const isFormData =
        typeof FormData !== "undefined" && body instanceof FormData;

    const headers = {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
    };

    if (body && !isFormData) {
        headers["Content-Type"] = headers["Content-Type"] || "application/json";
    }

    const res = await fetch(`${API_URL}${safePath}`, {
        method: options.method || "GET",
        headers,
        body,
        credentials: "omit",
    });

    if (res.status === 204) return null;

    const contentType = res.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");

    const data = isJson
        ? await res.json().catch(() => ({}))
        : await res.text().catch(() => "");

    if (res.status === 401) {
        clearToken();
    }

    if (!res.ok) {
        const message =
            typeof data === "object"
                ? data?.message || data?.error || data?.details || data?.msg || data?.mensaje || `HTTP ${res.status}`
                : data || `HTTP ${res.status}`;

        throw new Error(message);
    }

    return data;
}

/* =======================
   API pública
======================= */
const api = {
    health: () => request("/health"),

    register: (payload) =>
        request("/auth/register", {
            method: "POST",
            body: JSON.stringify(payload),
        }),

    login: async (payload) => {
        const data = await request("/auth/login", {
            method: "POST",
            body: JSON.stringify(payload),
        });

        const token = data?.token || data?.access_token;
        if (!token) throw new Error("Login exitoso pero no se recibió token");

        setToken(token);
        return data;
    },

    logout: () => clearToken(),

    me: () => request("/profile/me"),

    autos: {
        list: (params) => request(`/autos${toQueryString(params)}`),
        get: (id) => request(`/autos/${id}`),

        create: (payload) =>
            request("/autos", {
                method: "POST",
                body: JSON.stringify(payload),
            }),

        update: (id, payload) =>
            request(`/autos/${id}`, {
                method: "PUT",
                body: JSON.stringify(payload),
            }),

        remove: (id) =>
            request(`/autos/${id}`, {
                method: "DELETE",
            }),
    },
};

/* =======================
   ✅ Aliases para código viejo
   (para que no truene si tu UI usa autosList, etc.)
======================= */
api.autosList = (params) => api.autos.list(params);
api.autosGet = (id) => api.autos.get(id);
api.autosCreate = (payload) => api.autos.create(payload);
api.autosUpdate = (id, payload) => api.autos.update(id, payload);
api.autosDelete = (id) => api.autos.remove(id);

if (typeof window !== "undefined") {
    window.api = api;
}


export { api };

/* =======================
   /* =======================
   Config
======================= */
const RAW_API_URL = import.meta.env.VITE_API_URL;

if (!RAW_API_URL) {
    throw new Error("❌ Falta la variable de entorno VITE_API_URL (Vercel / .env)");
}

// Quita slash final si existe (https://x.com/ -> https://x.com)
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
   - Soporta JSON y FormData
======================= */
async function request(path, options = {}) {
    const safePath = withLeadingSlash(path);
    const token = options.token ?? getToken();

    const body = options.body;

    // Detecta FormData
    const isFormData =
        typeof FormData !== "undefined" && body instanceof FormData;

    const headers = {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
    };

    // Si hay body y NO es FormData, asumimos JSON si no viene Content-Type
    if (body && !isFormData) {
        headers["Content-Type"] = headers["Content-Type"] || "application/json";
    }

    const res = await fetch(`${API_URL}${safePath}`, {
        method: options.method || "GET",
        headers,
        body,
        // Como trabajas con Bearer token, NO necesitas cookies
        credentials: "omit",
    });

    // 204 No Content
    if (res.status === 204) return null;

    const contentType = res.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");

    const data = isJson
        ? await res.json().catch(() => ({}))
        : await res.text().catch(() => "");

    // Si token expiró / inválido, limpia token para evitar loops
    if (res.status === 401) {
        clearToken();
    }

    if (!res.ok) {
        const message =
            typeof data === "object"
                ? data?.message ||
                data?.error ||
                data?.details ||
                data?.msg ||
                data?.mensaje ||
                `HTTP ${res.status}`
                : data || `HTTP ${res.status}`;

        throw new Error(message);
    }

    return data;
}

/* =======================
   API pública
======================= */
export const api = {
    /* -------- Health -------- */
    health: () => request("/health"),

    /* -------- Auth -------- */
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

    /* -------- Perfil -------- */
    me: () => request("/profile/me"),

    /* =======================
          AUTOS (CRUD)
       ======================= */
    autos: {
        // Permite filtros opcionales: api.autos.list({ estado:"disponible" })
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

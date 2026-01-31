/* =======================
   Config
======================= */
const RAW_API_URL = import.meta.env.VITE_API_URL;

if (!RAW_API_URL) {
    throw new Error("❌ Falta VITE_API_URL (Vercel / .env)");
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

/** ✅ Si no hay token, lanza un error claro para UI */
function requireAuth() {
    const t = getToken();
    if (!t) {
        const err = new Error("No has iniciado sesión");
        err.status = 401;
        throw err;
    }
    return t;
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

    // si te pasan token explícito úsalo, si no usa el localStorage
    // ✅ para requests públicos: pasar { token: null }
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

    // ✅ si el backend dice 401, limpiamos token
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

        const err = new Error(message);
        err.status = res.status;
        err.data = data;
        throw err;
    }

    return data;
}

/* =======================
   API pública
======================= */
const api = {
    health: () => request("/health"),

    // ---------- AUTH ----------
    register: (payload) =>
        request("/auth/register", {
            method: "POST",
            body: JSON.stringify(payload),
        }),

    // ✅ Verificación de correo (NO requiere login)
    verifyEmail: (token) =>
        request(`/auth/verify${toQueryString({ token })}`, { token: null }),

    login: async (payload) => {
        const data = await request("/auth/login", {
            method: "POST",
            body: JSON.stringify(payload),
        });

        // ✅ tu backend devuelve `token`
        const token = data?.token;
        if (!token) throw new Error("Login exitoso pero no se recibió token");

        setToken(token);
        return data;
    },

    logout: () => clearToken(),

    // ---------- USER ----------
    me: async () => {
        if (!isLoggedIn()) return null;
        return request("/profile/me");
    },

    // ---------- AUTOS ----------
    autos: {
        /* ✅ CATÁLOGO PÚBLICO (sin token)
           Úsalo en Landing.jsx para listar/leer autos sin login */
        publicList: (params) => request(`/autos${toQueryString(params)}`, { token: null }),
        publicGet: (id) => request(`/autos/${id}`, { token: null }),

        /* 🔒 CRUD PROTEGIDO (con token)
           Úsalo en Autos.jsx (inventario/admin) */
        list: (params) => {
            requireAuth();
            return request(`/autos${toQueryString(params)}`);
        },

        get: (id) => {
            requireAuth();
            return request(`/autos/${id}`);
        },

        create: (payload) => {
            requireAuth();
            return request("/autos", {
                method: "POST",
                body: JSON.stringify(payload),
            });
        },

        update: (id, payload) => {
            requireAuth();
            return request(`/autos/${id}`, {
                method: "PUT",
                body: JSON.stringify(payload),
            });
        },

        remove: (id) => {
            requireAuth();
            return request(`/autos/${id}`, {
                method: "DELETE",
            });
        },
    },
};

// (Opcional) Exponer api en window para debug rápido en consola
if (typeof window !== "undefined") {
    window.api = api;
}

export { api };

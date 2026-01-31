/* =======================
   Config
======================= */
const RAW_API_URL = import.meta.env.VITE_API_URL;

if (!RAW_API_URL) {
    throw new Error("❌ Falta la variable de entorno VITE_API_URL (Vercel / .env)");
}

// Quita slash final si existe
const API_URL = RAW_API_URL.replace(/\/$/, "");

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
   Request helper
   - Soporta JSON y FormData
======================= */
async function request(path, options = {}) {
    const token = options.token ?? getToken();

    // Asegura que path empiece con /
    const safePath = path.startsWith("/") ? path : `/${path}`;

    // Detecta si el body es FormData
    const isFormData =
        typeof FormData !== "undefined" && options.body instanceof FormData;

    const headers = {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
    };

    // Solo seteamos Content-Type cuando es JSON (si es FormData, el navegador lo pone)
    if (options.body && !isFormData) {
        headers["Content-Type"] = headers["Content-Type"] || "application/json";
    }

    const res = await fetch(`${API_URL}${safePath}`, {
        ...options,
        headers,
        // No usas cookies/sesiones, así evitamos problemas
        credentials: "omit",
    });

    // No Content
    if (res.status === 204) return null;

    const contentType = res.headers.get("content-type") || "";

    // Intenta JSON, si no, texto
    const data = contentType.includes("application/json")
        ? await res.json().catch(() => ({}))
        : await res.text().catch(() => "");

    if (!res.ok) {
        // Intenta extraer mensaje de varias formas comunes
        const message =
            typeof data === "object"
                ? data?.message || data?.error || data?.details || `HTTP ${res.status}`
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
        list: () => request("/autos"),
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

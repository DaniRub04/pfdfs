const API_URL = import.meta.env.VITE_API_URL;

/* =======================
   Token helpers
======================= */
function getToken() {
    return localStorage.getItem("token");
}

function setToken(token) {
    localStorage.setItem("token", token);
}

function clearToken() {
    localStorage.removeItem("token");
}

export function isLoggedIn() {
    return !!getToken();
}

/* =======================
   Request helper
======================= */
async function request(path, options = {}) {
    const token = getToken();

    const res = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
            ...(options.body ? { "Content-Type": "application/json" } : {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(options.headers || {}),
        },
    });

    // No Content
    if (res.status === 204) return null;

    // Intenta JSON, si no, texto
    const contentType = res.headers.get("content-type") || "";
    const data = contentType.includes("application/json")
        ? await res.json().catch(() => ({}))
        : await res.text().catch(() => "");

    if (!res.ok) {
        const message =
            typeof data === "object"
                ? data?.message || `HTTP ${res.status}`
                : data || `HTTP ${res.status}`;
        throw new Error(message);
    }

    return data;
}

/* =======================
   API pública
======================= */
export const api = {
    // Salud
    health: () => request("/health"),

    // Auth
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

        // Soporta { token } o { access_token }
        const token = data?.token || data?.access_token;
        if (!token) {
            throw new Error("Login exitoso pero no se recibió token");
        }

        setToken(token);
        return data;
    },

    logout: () => {
        clearToken();
    },

    // Ruta protegida (ajusta si tu backend usa otra)
    me: () => request("/profile/me"),
};

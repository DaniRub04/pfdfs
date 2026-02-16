// frontend/src/services/api.js

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

  // ✅ Normaliza respuestas { ok, data }
  if (data && typeof data === "object" && "ok" in data && "data" in data) {
    return data.data;
  }

  return data;
}

/* =======================
   API pública
======================= */
const api = {
  /* Helpers (para que AppShell use api.getToken()) */
  getToken,
  setToken,
  clearToken,
  isLoggedIn,

  health: () => request("/health"),

  /* ---------- AUTH ---------- */
  register: (payload) =>
    request("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  verifyEmail: (token) =>
    request(`/auth/verify${toQueryString({ token })}`, { token: null }),

  login: async (payload) => {
    const data = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    // login normalmente regresa { token, user? }
    const token = data?.token;
    if (!token) throw new Error("Login exitoso pero no se recibió token");

    setToken(token);
    return data;
  },

  logout: () => clearToken(),

  /* ---------- USER ---------- */
  me: async () => {
    if (!isLoggedIn()) return null;
    return request("/profile/me");
  },

  /* ---------- AUTOS (legacy si aún lo usas) ---------- */
  autos: {
    publicList: (params) =>
      request(`/autos${toQueryString(params)}`, { token: null }),

    publicGet: (id) => request(`/autos/${id}`, { token: null }),

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

  /* ---------- PUBLICACIONES NUEVAS (multi-categoría) ---------- */
  publicar: {
    // ✅ LISTA PÚBLICA (Landing / Catálogo) -> solo aprobadas
    listPublic: (params) =>
      request(`/publicar${toQueryString(params)}`, { token: null }),

    // 🔒 MIS PUBLICACIONES (perfil) -> todas (pendiente/aprobado/rechazado)
    myList: (params) => {
      requireAuth();
      return request(`/publicar/mias${toQueryString(params)}`);
    },

    // 🔒 CREAR PUBLICACIÓN (queda en pendiente por default en backend)
    create: (payload) => {
      requireAuth();
      return request("/publicar", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },

    // 🔒 EDITAR MI PUBLICACIÓN (solo data)
    update: (id, payload) => {
      requireAuth();
      return request(`/publicar/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    },

    // 🔒 ELIMINAR MI PUBLICACIÓN
    remove: (id) => {
      requireAuth();
      return request(`/publicar/${id}`, {
        method: "DELETE",
      });
    },

    /* =========================
       👑 ADMIN (moderación)
    ========================= */

    // ✅ LISTAR por status/group con paginación
    adminList: (params) => {
      requireAuth();
      return request(`/publicar/admin${toQueryString(params)}`);
    },

    // ✅ CAMBIAR status (admin)
    adminSetStatus: (id, status) => {
      requireAuth();
      return request(`/publicar/admin/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
    },
  },
};

// Exponer para debug opcional
if (typeof window !== "undefined") {
  window.api = api;
}

export { api };

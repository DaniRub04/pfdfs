// frontend/src/pages/Landing.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../services/api";
import PublicationCard from "../components/PublicationCard";
import "../styles/landing.css";
import "../styles/publicationCards.css";

const DEMO_MODELS = [
  { id: "m1", img: "/landing/img/carro1.avif", price: "660,000 MXN", name: "Modelo destacado 1" },
  { id: "m2", img: "/landing/img/carro2.avif", price: "800,000 MXN", name: "Modelo destacado 2" },
  { id: "m3", img: "/landing/img/carro3.avif", price: "1,100,000 MXN", name: "Modelo destacado 3" },
];

// ✅ Grupo/categoría principal (para navegar)
const GROUP_OPTIONS = [
  { id: "automotriz", label: "Automotriz" },
  { id: "marketplace", label: "Marketplace" },
  { id: "empresas", label: "Empresas" },
  { id: "universidades", label: "Universidades" },
  { id: "instituciones", label: "Instituciones" },
];

function normalizeGroup(groupId, fallback = "automotriz") {
  const ok = GROUP_OPTIONS.some((g) => g.id === groupId);
  return ok ? groupId : fallback;
}

function getLocalToken() {
  return (
    api.getToken?.() ||
    localStorage.getItem("token") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("auth_token") ||
    ""
  );
}

function safeJson(v) {
  if (!v) return {};
  if (typeof v === "object") return v;
  if (typeof v === "string") {
    try {
      return JSON.parse(v);
    } catch {
      return {};
    }
  }
  return {};
}

export default function Landing() {
  const nav = useNavigate();
  const [sp] = useSearchParams();

  // ✅ respeta /?group=...
  const group = useMemo(() => normalizeGroup(sp.get("group") || "automotriz"), [sp]);

  const groupLabel = useMemo(
    () => GROUP_OPTIONS.find((g) => g.id === group)?.label || "Catálogo",
    [group]
  );

  // auth
  const [me, setMe] = useState(null);
  const [isAuthed, setIsAuthed] = useState(Boolean(getLocalToken()));

  // preview público (GLOBAL)
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");

  async function loadMe() {
    try {
      const meData = await api.me();
      setMe(meData);
    } catch {
      setMe(null);
    } finally {
      setIsAuthed(Boolean(getLocalToken()));
    }
  }

  async function loadPublic() {
    setErr("");
    setLoading(true);
    try {
      // ✅ LANDING = VISTA GLOBAL
      // GET /publicar -> backend devuelve solo status='aprobado'
      const resp = await api.publicar.listPublic({ limit: 24 }); // sin group

      // tu api.request() normalmente devuelve data directo si viene {ok,data}
      const list = Array.isArray(resp) ? resp : resp?.data || resp?.items || [];

      const mapped = list.map((row) => ({
        ...row,
        _data: safeJson(row?.data),
      }));

      setItems(mapped);
    } catch (e) {
      setErr(e?.message || "No se pudieron cargar publicaciones");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMe();
    loadPublic();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    const base = items;

    // ⚠️ Nota: tu landing está limitada a 6 por diseño
    if (!s) return base.slice(0, 6);

    return base
      .filter((row) => {
        const p = row._data || {};
        const haystack = `${p.titulo || ""} ${p.descripcion || ""} ${p.marca || ""} ${
          p.modelo || ""
        } ${p.nombre || ""} ${row.group_id || ""}`;
        return haystack.toLowerCase().includes(s);
      })
      .slice(0, 6);
  }, [items, q]);

  // ✅ NUEVAS RUTAS (catálogo por grupo)
  function goCatalogo() {
    nav(`/catalogo?group=${encodeURIComponent(group)}`);
  }

  // ✅ NUEVAS RUTAS (publicar dinámico por categoría)
  function goPublicar() {
    if (!getLocalToken()) return nav("/login");
    nav("/publicar"); // selector general
  }

  // ✅ NUEVAS RUTAS (inventario)
  function goInventario() {
    if (!getLocalToken()) return nav("/login");
    nav("/inventario");
  }

  return (
    <div className="lp">
      <main className="lp-main" id="top">
        {/* HERO */}
        <section className="lp-hero">
          <div className="lp-hero-content">
            <h1>Catálogo por grupos: rápido, claro, confiable.</h1>
            <p>
              Explora publicaciones por categoría principal. Enfoque actual: <b>{groupLabel}</b>.
              Publica y administra tu inventario con una experiencia moderna.
            </p>

            <div className="lp-hero-cta">
              <button className="lp-btn lp-btn-primary" type="button" onClick={goCatalogo}>
                Explorar {groupLabel}
              </button>

              {isAuthed ? (
                <>
                  <button className="lp-btn lp-btn-ghost" type="button" onClick={goPublicar}>
                    Publicar
                  </button>

                  {/* ✅ dejamos el botón de inventario */}
                  <button className="lp-btn lp-btn-ghost" type="button" onClick={goInventario}>
                    Inventario
                  </button>
                </>
              ) : (
                <>
                  <button className="lp-btn lp-btn-ghost" type="button" onClick={() => nav("/login")}>
                    Iniciar sesión
                  </button>
                  <button className="lp-btn lp-btn-ghost" type="button" onClick={() => nav("/register")}>
                    Crear cuenta
                  </button>
                </>
              )}
            </div>
          </div>
        </section>

        {/* DESTACADOS (demo visual) */}
        <section className="lp-section" id="models">
          <div className="lp-section-head">
            <h2>Destacados</h2>
            <p>Vista previa</p>
          </div>

          <div className="lp-model-grid">
            {DEMO_MODELS.map((m) => (
              <div key={m.id} className="lp-model-card">
                <img src={m.img} alt={m.name} />
                <div className="lp-price">{m.price}</div>
              </div>
            ))}
          </div>
        </section>

        {/* PREVIEW PÚBLICO GLOBAL */}
        <section className="lp-section" id="market">
          <div className="lp-section-head">
            <h2>Publicaciones disponibles</h2>

            <div className="lp-market-actions">
              <button
                className="lp-btn lp-btn-ghost"
                type="button"
                onClick={loadPublic}
                disabled={loading}
              >
                ↻ Recargar
              </button>

              <button className="lp-btn lp-btn-primary" type="button" onClick={goCatalogo}>
                Ver catálogo
              </button>

              {isAuthed ? (
                <>
                  <button className="lp-btn lp-btn-primary" type="button" onClick={goPublicar}>
                    + Publicar
                  </button>

                  {/* ✅ BOTÓN REMOVIDO: "+ Publicar en Automotriz / {groupLabel}" */}
                </>
              ) : (
                <button className="lp-btn lp-btn-primary" type="button" onClick={() => nav("/register")}>
                  Publicar (crear cuenta)
                </button>
              )}
            </div>
          </div>

          {/* ✅ buscador del preview - mejor separación */}
          <div style={{ marginTop: 18, marginBottom: 10 }}>
            <input
              type="text"
              placeholder="Buscar en la vista previa…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.16)",
                background: "rgba(255,255,255,0.05)",
                color: "#fff",
                outline: "none",
              }}
            />
          </div>

          {err && <div className="lp-alert">❌ {err}</div>}

          {loading ? (
            <div className="lp-skeleton-grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <div className="lp-skeleton" key={i} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="lp-empty">
              <p>No hay publicaciones disponibles todavía.</p>
              {isAuthed ? (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button className="lp-btn lp-btn-primary" type="button" onClick={goPublicar}>
                    Publicar la primera
                  </button>
                </div>
              ) : (
                <button className="lp-btn lp-btn-primary" type="button" onClick={() => nav("/register")}>
                  Crear cuenta
                </button>
              )}
            </div>
          ) : (
            <div className="lp-cards">
              {filtered.map((row) => (
                <PublicationCard
                  key={row.id}
                  row={row}
                  onViewCatalog={() => nav(`/catalogo?group=${encodeURIComponent(row.group_id || group)}`)}
                />
              ))}
            </div>
          )}
        </section>

        {/* ABOUT */}
        <section className="lp-section lp-about" id="about">
          <h2>Nosotros</h2>
          <p>Calidad, innovación y confianza.</p>
          <p>Whatsapp: 9954635434</p>
          <p>Instagram: @selectaplaza</p>

          <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="lp-btn lp-btn-ghost" type="button" onClick={() => nav("/nosotros")}>
              Ver más
            </button>
            <button className="lp-btn lp-btn-ghost" type="button" onClick={() => nav("/privacidad")}>
              Aviso de privacidad
            </button>
            <button className="lp-btn lp-btn-ghost" type="button" onClick={() => nav("/ayuda")}>
              Ayuda
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
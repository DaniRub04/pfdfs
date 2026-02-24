// frontend/src/pages/Landing.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../services/api";
import PublicationCard from "../components/PublicationCard";
import "../styles/landing.css";
import "../styles/publicationCards.css";

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

  // ✅ respeta /?group=... (solo para navegación)
  const group = useMemo(() => normalizeGroup(sp.get("group") || "automotriz"), [sp]);

  const groupLabel = useMemo(
    () => GROUP_OPTIONS.find((g) => g.id === group)?.label || "Catálogo",
    [group]
  );

  // auth
  const [me, setMe] = useState(null);
  const [isAuthed, setIsAuthed] = useState(Boolean(getLocalToken()));

  // preview público (GLOBAL) + paginación
  const [items, setItems] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");

  // ✅ paginación (server)
  const [page, setPage] = useState(0); // 0-based
  const [pageSize, setPageSize] = useState(12);

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

  async function loadPublic({ page: p = page, pageSize: ps = pageSize } = {}) {
    setErr("");
    setLoading(true);
    try {
      // ✅ LANDING = VISTA GLOBAL (sin group)
      // backend nuevo: GET /publicar?limit=&offset=  -> { total, rows, limit, offset, hasMore }
      const offset = p * ps;

      const resp = await api.publicar.listPublic({
        limit: ps,
        offset,
      });

      // api.request() normaliza {ok,data} => resp es "data" directo
      const total = Number(resp?.total ?? 0) || 0;
      const rows = Array.isArray(resp?.rows) ? resp.rows : [];
      const more = Boolean(resp?.hasMore);

      const mapped = rows.map((row) => ({
        ...row,
        _data: safeJson(row?.data),
      }));

      setItems(mapped);
      setRowCount(total);
      setHasMore(more);
    } catch (e) {
      setErr(e?.message || "No se pudieron cargar publicaciones");
      setItems([]);
      setRowCount(0);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMe();
    loadPublic({ page: 0, pageSize });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ cuando cambia página o tamaño, recargamos
  useEffect(() => {
    loadPublic({ page, pageSize });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    const base = items;

    // ✅ el buscador sigue siendo LOCAL (sobre la página actual)
    if (!s) return base;

    return base.filter((row) => {
      const p = row._data || {};
      const haystack = `${p.titulo || ""} ${p.descripcion || ""} ${p.marca || ""} ${p.modelo || ""} ${
        p.nombre || ""
      } ${row.group_id || ""}`;
      return haystack.toLowerCase().includes(s);
    });
  }, [items, q]);

  // ✅ NUEVAS RUTAS (catálogo por grupo)
  function goCatalogo() {
    nav(`/catalogo?group=${encodeURIComponent(group)}`);
  }

  // ✅ NUEVAS RUTAS (publicar dinámico)
  function goPublicar() {
    if (!getLocalToken()) return nav("/login");
    nav("/publicar");
  }

  // ✅ NUEVAS RUTAS (inventario)
  function goInventario() {
    if (!getLocalToken()) return nav("/login");
    nav("/inventario");
  }

  const totalPages = Math.max(1, Math.ceil(rowCount / pageSize));
  const canPrev = page > 0;
  const canNext = page + 1 < totalPages && (hasMore || (page + 1) * pageSize < rowCount);

  return (
    <div className="lp">
      <main className="lp-main" id="top">
        {/* HERO */}
        <section className="lp-hero">
          <div className="lp-hero-content">
            <h1>Catálogo por grupos: rápido, claro, confiable.</h1>

            {/* ✅ Texto sin "Enfoque actual: ..." */}
            <p>
              Explora publicaciones por categoría principal. Publica y administra tu inventario con una
              experiencia moderna.
            </p>

            <div className="lp-hero-cta">
              {/* ✅ Quitado: botón "Explorar {groupLabel}" */}
              {isAuthed ? (
                <>
                  <button className="lp-btn lp-btn-ghost" type="button" onClick={goPublicar}>
                    Publicar
                  </button>

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

        {/* ✅ DESTACADOS ELIMINADO */}

        {/* PREVIEW PÚBLICO GLOBAL */}
        <section className="lp-section" id="market">
          <div className="lp-section-head">
            <h2>Publicaciones disponibles</h2>

            <div className="lp-market-actions">
              <button
                className="lp-btn lp-btn-ghost"
                type="button"
                onClick={() => loadPublic({ page, pageSize })}
                disabled={loading}
              >
                ↻ Recargar
              </button>

              <button className="lp-btn lp-btn-primary" type="button" onClick={goCatalogo}>
                Ver catálogo
              </button>

              {isAuthed ? (
                <button className="lp-btn lp-btn-primary" type="button" onClick={goPublicar}>
                  + Publicar
                </button>
              ) : (
                <button className="lp-btn lp-btn-primary" type="button" onClick={() => nav("/register")}>
                  Publicar (crear cuenta)
                </button>
              )}
            </div>
          </div>

          {/* buscador (local) */}
          <div className="lp-preview-search-wrap">
            <input
              type="text"
              placeholder="Buscar en la vista previa… (solo página actual)"
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

          {/* ✅ Paginación (server) */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 10 }}>
            <button
              className="lp-btn lp-btn-ghost"
              type="button"
              disabled={!canPrev || loading}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              ← Anterior
            </button>

            <div style={{ opacity: 0.85, fontSize: 13 }}>
              Página <b>{page + 1}</b> de <b>{totalPages}</b> · Total: <b>{rowCount}</b>
            </div>

            <button
              className="lp-btn lp-btn-ghost"
              type="button"
              disabled={!canNext || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente →
            </button>

            <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ opacity: 0.75, fontSize: 12 }}>Por página:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPage(0);
                  setPageSize(Number(e.target.value));
                }}
                style={{
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.18)",
                  background: "rgba(0,0,0,0.25)",
                  color: "#fff",
                  outline: "none",
                }}
              >
                {[6, 12, 24].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {err && <div className="lp-alert">❌ {err}</div>}

          {loading ? (
            <div className="lp-skeleton-grid">
              {Array.from({ length: pageSize }).map((_, i) => (
                <div className="lp-skeleton" key={i} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="lp-empty">
              <p>No hay publicaciones en esta página (o el filtro no encontró resultados).</p>
              {isAuthed ? (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button className="lp-btn lp-btn-primary" type="button" onClick={goPublicar}>
                    Publicar
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

          <TypographyHint />
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

/** 👇 nota pequeña sin meter MUI aquí */
function TypographyHint() {
  return (
    <div style={{ opacity: 0.7, fontSize: 12, marginTop: 10 }}>
      Nota: el buscador es <b>local</b> (filtra solo la página actual). La paginación viene del backend.
    </div>
  );
}
// frontend/src/pages/Landing.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../services/api";
import "../styles/landing.css";

const DEMO_MODELS = [
  { id: "m1", img: "/landing/img/carro1.avif", price: "660,000 MXN", name: "Modelo destacado 1" },
  { id: "m2", img: "/landing/img/carro2.avif", price: "800,000 MXN", name: "Modelo destacado 2" },
  { id: "m3", img: "/landing/img/carro3.avif", price: "1,100,000 MXN", name: "Modelo destacado 3" },
];

// ✅ Grupo/categoría principal (para navegar al catálogo por grupos)
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

/** ✅ Unsplash: si viene una URL de página, la convertimos a URL directa de imagen */
function normalizeImageUrl(url) {
  const u = String(url || "").trim();
  if (!u) return "";

  // Caso: https://unsplash.com/es/fotos/<slug>-<ID>
  if (u.includes("unsplash.com/") && u.includes("/fotos/")) {
    const last = u.split("/fotos/")[1] || "";
    const id = (last.split("?")[0] || "").split("-").pop(); // ID al final
    if (id) return `https://source.unsplash.com/${id}/1200x900`;
  }

  // Caso: https://unsplash.com/photos/<ID>
  if (u.includes("unsplash.com/") && u.includes("/photos/")) {
    const id = (u.split("/photos/")[1] || "").split("?")[0].split("/")[0];
    if (id) return `https://source.unsplash.com/${id}/1200x900`;
  }

  // ya es URL directa
  return u;
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
      // ✅ IMPORTANTE: LANDING = VISTA GLOBAL (NO manda group)
      // endpoint: GET /publicar -> devuelve solo status='aprobado'
      const resp = await api.publicar.listPublic({ limit: 24 }); // sin group

      // tu backend regresa { ok:true, data:[...] }
      const list = Array.isArray(resp) ? resp : resp?.data || resp?.items || [];

      const mapped = list.map((row) => {
        const p = row?.data && typeof row.data === "object" ? row.data : {};
        return { ...row, _data: p };
      });

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

    if (!s) return base.slice(0, 6);

    return base
      .filter((row) => {
        const p = row._data || {};
        const haystack = `${p.titulo || ""} ${p.descripcion || ""} ${p.marca || ""} ${p.modelo || ""} ${
          p.nombre || ""
        } ${row.group_id || ""}`;
        return haystack.toLowerCase().includes(s);
      })
      .slice(0, 6);
  }, [items, q]);

  function goCatalogo() {
    // ✅ El catálogo sí es por grupo (el que traes en URL o default)
    nav(`/catalogo?group=${encodeURIComponent(group)}`);
  }

  function goPublicar() {
    if (!getLocalToken()) return nav("/login");
    nav("/publicar"); // selector de categorías/formulario
  }

  function goInventario() {
    if (!getLocalToken()) return nav("/login");
    nav("/perfil/inventario");
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
                  <button className="lp-btn lp-btn-ghost" type="button" onClick={goInventario}>
                    Inventario
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="lp-btn lp-btn-ghost"
                    type="button"
                    onClick={() => nav("/login")}
                  >
                    Iniciar sesión
                  </button>
                  <button
                    className="lp-btn lp-btn-ghost"
                    type="button"
                    onClick={() => nav("/register")}
                  >
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
                <button className="lp-btn lp-btn-primary" type="button" onClick={goPublicar}>
                  + Publicar
                </button>
              ) : (
                <button
                  className="lp-btn lp-btn-primary"
                  type="button"
                  onClick={() => nav("/register")}
                >
                  Publicar (crear cuenta)
                </button>
              )}
            </div>
          </div>

          {/* buscador del preview */}
          <div style={{ marginTop: 12 }}>
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
                <button className="lp-btn lp-btn-primary" type="button" onClick={goPublicar}>
                  Publicar la primera
                </button>
              ) : (
                <button
                  className="lp-btn lp-btn-primary"
                  type="button"
                  onClick={() => nav("/register")}
                >
                  Crear cuenta
                </button>
              )}
            </div>
          ) : (
            <div className="lp-cards">
              {filtered.map((row) => {
                const p = row._data || {};

                const rawImg = p?.foto_url || p?.imagenes?.[0] || "";
                const imgSrc = normalizeImageUrl(rawImg);

                const title = p?.titulo || p?.nombre || "Publicación";
                const desc = p?.descripcion || "Sin descripción.";

                const precio =
                  p?.precio == null || p?.precio === ""
                    ? null
                    : Number(String(p.precio).replace(/[^\d.]/g, ""));

                return (
                  <article className="lp-card" key={row.id}>
                    <div className={`lp-card-img ${!imgSrc ? "lp-card-img--placeholder" : ""}`}>
                      {imgSrc ? (
                        <img
                          src={imgSrc}
                          alt={title}
                          className="lp-card-img__img"
                          loading="lazy"
                        />
                      ) : (
                        <>
                          <div className="lp-card-img__brand">
                            SELECTA<span>PLAZA</span>
                          </div>
                          <div className="lp-card-img__meta">
                            <span>{title}</span>
                            <span className="lp-dot" />
                            <span>{row.group_id || "—"}</span>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="lp-card-body">
                      <div className="lp-card-head">
                        <div>
                          <div className="lp-card-title">{title}</div>

                          <div className="lp-card-meta">
                            <span>{row.group_id || "—"}</span>
                            <span className="lp-dot" />
                            <span>
                              {precio == null ? "—" : `$${precio.toLocaleString("es-MX")} MXN`}
                            </span>
                          </div>
                        </div>
                      </div>

                      <p className="lp-desc">{desc}</p>

                      <div className="lp-card-foot">
                        <button className="lp-btn lp-btn-ghost" type="button" onClick={goCatalogo}>
                          Ver en catálogo
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
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

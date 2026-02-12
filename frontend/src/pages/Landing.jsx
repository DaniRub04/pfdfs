import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../services/api";
import "../styles/landing.css";

const DEMO_MODELS = [
  { id: "m1", img: "/landing/img/carro1.avif", price: "660,000 MXN", name: "Modelo destacado 1" },
  { id: "m2", img: "/landing/img/carro2.avif", price: "800,000 MXN", name: "Modelo destacado 2" },
  { id: "m3", img: "/landing/img/carro3.avif", price: "1,100,000 MXN", name: "Modelo destacado 3" },
];

// ✅ Grupo/categoría principal (para tu catálogo por grupos)
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

  // preview público
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
      // ✅ token es la fuente de verdad para rutas protegidas
      setIsAuthed(Boolean(getLocalToken()));
    }
  }

  async function loadPublic() {
    setErr("");
    setLoading(true);
    try {
      const data = await api.autos.publicList(); // público
      const list = Array.isArray(data) ? data : data?.items || [];
      const publicList = list.filter((a) => (a.estado || "disponible") === "disponible");
      setItems(publicList);
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
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items.slice(0, 6);
    return items
      .filter((x) =>
        `${x.marca || ""} ${x.modelo || ""} ${x.titulo || ""} ${x.descripcion || ""}`
          .toLowerCase()
          .includes(s)
      )
      .slice(0, 6);
  }, [items, q]);

  function goCatalogo() {
    nav(`/catalogo?group=${encodeURIComponent(group)}`);
  }

  // ✅ Publicar directo al FORM del grupo actual
  function goPublicar() {
    if (!getLocalToken()) return nav("/login");
    nav(`/publicar/${encodeURIComponent(group)}`);
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
            <h1>HOLACatálogo por grupos: rápido, claro, confiable.</h1>
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
                  <button className="lp-btn lp-btn-ghost" type="button" onClick={() => nav("/login")}>
                    Iniciar sesión
                  </button>
                  <button className="lp-btn lp-btn-ghost" type="button" onClick={() => nav("/register")}>
                    Crear cuenta
                  </button>
                </>
              )}
            </div>

            {/* opcional: debug */}
            {/* <div style={{ opacity: 0.7, marginTop: 8, fontSize: 12 }}>
              authed: {String(isAuthed)} • token: {getLocalToken() ? "sí" : "no"} • me: {me ? "sí" : "no"}
            </div> */}
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

        {/* PREVIEW PÚBLICO */}
        <section className="lp-section" id="market">
          <div className="lp-section-head">
            <h2>Publicaciones disponibles</h2>

            <div className="lp-market-actions">
              <button className="lp-btn lp-btn-ghost" type="button" onClick={loadPublic} disabled={loading}>
                ↻ Recargar
              </button>

              <button className="lp-btn lp-btn-primary" type="button" onClick={goCatalogo}>
                Ver catálogo
              </button>

              {isAuthed ? (
                // ✅ Directo al formulario
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
                <button className="lp-btn lp-btn-primary" type="button" onClick={() => nav("/register")}>
                  Crear cuenta
                </button>
              )}
            </div>
          ) : (
            <div className="lp-cards">
              {filtered.map((a) => {
                const imgSrc = a?.foto_url || a?.imagenes?.[0] || "";
                const title = a?.titulo || `${a?.marca || "Publicación"} ${a?.modelo || ""}`.trim();

                return (
                  <article className="lp-card" key={a.id}>
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
                            <span>{a.marca || "Item"}</span>
                            <span className="lp-dot" />
                            <span>{a.modelo || "—"}</span>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="lp-card-body">
                      <div className="lp-card-head">
                        <div>
                          <div className="lp-card-title">
                            {a.marca} <span>{a.modelo}</span>
                          </div>

                          <div className="lp-card-meta">
                            <span>{a.anio ?? "—"}</span>
                            <span className="lp-dot" />
                            <span>
                              {a.precio == null ? "—" : `$${Number(a.precio).toLocaleString("es-MX")}`}
                            </span>
                          </div>
                        </div>

                        {a.estado && (
                          <span className={`lp-badge lp-badge-${a.estado || "disponible"}`}>
                            {a.estado || "disponible"}
                          </span>
                        )}
                      </div>

                      <p className="lp-desc">{a.descripcion || "Sin descripción."}</p>

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

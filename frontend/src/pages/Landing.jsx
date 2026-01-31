import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import "../styles/landing.css";

const DEMO_MODELS = [
  { id: "m1", img: "/landing/img/carro1.avif", price: "660,000 MXN", name: "Modelo destacado 1" },
  { id: "m2", img: "/landing/img/carro2.avif", price: "800,000 MXN", name: "Modelo destacado 2" },
  { id: "m3", img: "/landing/img/carro3.avif", price: "1,100,000 MXN", name: "Modelo destacado 3" },
];

export default function Landing() {
  const nav = useNavigate();

  // UI (header/menu/search/modal)
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  // auth
  const [me, setMe] = useState(null);

  // autos publicados (preview)
  const [items, setItems] = useState([]);
  const [loadingAutos, setLoadingAutos] = useState(true);
  const [autosErr, setAutosErr] = useState("");
  const [q, setQ] = useState("");

  function scrollToSection(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth" });
    setSidebarOpen(false);
    setSearchOpen(false);
  }

  function openLogin() {
    setLoginOpen(true);
    setSidebarOpen(false);
  }

  function closeLogin() {
    setLoginOpen(false);
  }

  async function loadMe() {
    try {
      const meData = await api.me();
      setMe(meData);
    } catch {
      setMe(null);
    }
  }

  // ✅ CATÁLOGO PÚBLICO (sin token)
  async function loadAutos() {
    setAutosErr("");
    setLoadingAutos(true);
    try {
      const data = await api.autos.publicList(); // ✅ público
      const list = Array.isArray(data) ? data : data?.items || [];

      // ✅ catálogo público: solo "disponible"
      const publicList = list.filter((a) => (a.estado || "disponible") === "disponible");

      setItems(publicList);
    } catch (e) {
      setAutosErr(e?.message || "No se pudieron cargar autos");
      setItems([]);
    } finally {
      setLoadingAutos(false);
    }
  }

  useEffect(() => {
    loadMe();
    loadAutos();
  }, []);

  const filteredAutos = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items.slice(0, 6);
    return items
      .filter((x) =>
        `${x.marca || ""} ${x.modelo || ""} ${x.estado || ""} ${x.descripcion || ""}`
          .toLowerCase()
          .includes(s)
      )
      .slice(0, 6);
  }, [items, q]);

  function logout() {
    api.logout();
    setMe(null);
    nav("/");
  }

  function goToLogin() {
    closeLogin();
    nav("/login");
  }

  return (
    <div className="lp">
      {/* HEADER */}
      <header className="lp-header">
        <button
          className="lp-icon-btn"
          onClick={() => setSidebarOpen((v) => !v)}
          aria-label="Abrir menú"
        >
          ☰
        </button>

        <div
          className="lp-logo"
          onClick={() => scrollToSection("top")}
          role="button"
          tabIndex={0}
          title="Inicio"
        >
          AU<span>TRUST</span>
        </div>

        <div className="lp-right">
          {me ? (
            <div className="lp-user">
              <span className="lp-user-mail">{me.email}</span>
              <button className="lp-btn lp-btn-ghost" onClick={() => nav("/autos")}>
                Ir a inventario
              </button>
              <button className="lp-btn lp-btn-danger" onClick={logout}>
                Cerrar sesión
              </button>
            </div>
          ) : (
            <div className="lp-user">
              <button className="lp-btn lp-btn-ghost" onClick={openLogin}>
                Iniciar sesión
              </button>
              <button className="lp-btn lp-btn-primary" onClick={() => nav("/register")}>
                Crear cuenta
              </button>
            </div>
          )}

          <button
            className="lp-search"
            onClick={() => setSearchOpen((v) => !v)}
            aria-label="Buscar"
          />
        </div>
      </header>

      {/* SEARCH BAR */}
      <div className={`lp-searchbar ${searchOpen ? "active" : ""}`}>
        <input
          type="text"
          placeholder="Buscar autos (marca, modelo...)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {/* SIDEBAR */}
      <aside className={`lp-sidebar ${sidebarOpen ? "active" : ""}`}>
        <h3>Menú</h3>
        <ul>
          <li onClick={() => scrollToSection("models")}>Modelos destacados</li>
          <li onClick={() => scrollToSection("market")}>Autos en venta</li>
          <li onClick={() => scrollToSection("about")}>Nosotros</li>

          <li onClick={() => nav("/autos")}>Inventario (CRUD)</li>

          {!me ? (
            <>
              <li onClick={() => nav("/login")}>Iniciar sesión</li>
              <li onClick={() => nav("/register")}>Crear cuenta</li>
            </>
          ) : (
            <li onClick={logout}>Cerrar sesión</li>
          )}
        </ul>
      </aside>

      {/* MAIN */}
      <main className="lp-main" id="top">
        {/* HERO */}
        <section className="lp-hero">
          <div className="lp-hero-content">
            <h1>Autos en streaming: rápido, claro, confiable.</h1>
            <p>Explora autos disponibles. Publica y administra tu inventario con una experiencia moderna.</p>

            <div className="lp-hero-cta">
              <button className="lp-btn lp-btn-primary" onClick={() => scrollToSection("market")}>
                Explorar autos
              </button>

              {me ? (
                <button className="lp-btn lp-btn-ghost" onClick={() => nav("/autos")}>
                  Administrar inventario
                </button>
              ) : (
                <button className="lp-btn lp-btn-ghost" onClick={() => nav("/register")}>
                  Crear cuenta
                </button>
              )}
            </div>
          </div>
        </section>

        {/* MODELOS DESTACADOS (demo) */}
        <section className="lp-section" id="models">
          <div className="lp-section-head">
            <h2>Modelos destacados</h2>
            <p>Ejemplos visuales (demo). Tus autos reales aparecen abajo.</p>
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

        {/* MARKET */}
        <section className="lp-section" id="market">
          <div className="lp-section-head">
            <h2>Autos en venta</h2>

            <div className="lp-market-actions">
              <button className="lp-btn lp-btn-ghost" onClick={loadAutos} disabled={loadingAutos}>
                ↻ Recargar
              </button>

              {me ? (
                <Link className="lp-btn lp-btn-primary" to="/autos">
                  + Publicar auto
                </Link>
              ) : (
                <button className="lp-btn lp-btn-primary" onClick={() => nav("/register")}>
                  Publicar (crear cuenta)
                </button>
              )}
            </div>
          </div>

          {autosErr && <div className="lp-alert">❌ {autosErr}</div>}

          {loadingAutos ? (
            <div className="lp-skeleton-grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <div className="lp-skeleton" key={i} />
              ))}
            </div>
          ) : filteredAutos.length === 0 ? (
            <div className="lp-empty">
              <p>No hay autos disponibles todavía.</p>
              {me ? (
                <Link className="lp-btn lp-btn-primary" to="/autos">
                  Publicar el primero
                </Link>
              ) : (
                <button className="lp-btn lp-btn-primary" onClick={() => nav("/register")}>
                  Crear cuenta
                </button>
              )}
            </div>
          ) : (
            <div className="lp-cards">
              {filteredAutos.map((a) => (
                <article className="lp-card" key={a.id}>
                  {/* ✅ Placeholder pro (sin fotos todavía) */}
                  <div className="lp-card-img lp-card-img--placeholder">
                    <div className="lp-card-img__brand">
                      AU<span>TRUST</span>
                    </div>
                    <div className="lp-card-img__meta">
                      <span>{a.marca || "Auto"}</span>
                      <span className="lp-dot" />
                      <span>{a.modelo || "—"}</span>
                    </div>
                  </div>

                  <div className="lp-card-head">
                    <div>
                      <div className="lp-card-title">
                        {a.marca} <span>{a.modelo}</span>
                      </div>

                      <div className="lp-card-meta">
                        <span>{a.anio ?? "—"}</span>
                        <span className="lp-dot" />
                        <span>
                          {a.precio == null
                            ? "—"
                            : `$${Number(a.precio).toLocaleString("es-MX")}`}
                        </span>
                      </div>
                    </div>

                    <span className={`lp-badge lp-badge-${a.estado || "disponible"}`}>
                      {a.estado || "disponible"}
                    </span>
                  </div>

                  <p className="lp-desc">{a.descripcion || "Sin descripción."}</p>

                  <div className="lp-card-foot">
                    {me ? (
                      <button className="lp-btn lp-btn-ghost" onClick={() => nav("/autos")}>
                        Ver en inventario
                      </button>
                    ) : (
                      <button className="lp-btn lp-btn-ghost" onClick={openLogin}>
                        Iniciar sesión
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* ABOUT */}
        <section className="lp-section lp-about" id="about">
          <h2>Nosotros</h2>
          <p>Calidad, innovación y confianza.</p>
          <p>Whatsapp: 9954635434</p>
          <p>Instagram: autrust</p>
        </section>
      </main>

      {/* LOGIN MODAL */}
      <div className={`lp-modal ${loginOpen ? "active" : ""}`} onMouseDown={closeLogin}>
        <div className="lp-modal-content" onMouseDown={(e) => e.stopPropagation()}>
          <h2>Iniciar sesión</h2>
          <p style={{ marginTop: 0, opacity: 0.85, fontSize: 13 }}>
            Para publicar o administrar autos necesitas iniciar sesión.
          </p>

          <button type="button" onClick={goToLogin}>
            Ir a Login
          </button>

          <div className="lp-modal-foot">
            <button className="lp-btn lp-btn-ghost" onClick={closeLogin} type="button">
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


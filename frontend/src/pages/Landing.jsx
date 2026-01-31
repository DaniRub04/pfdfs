import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../services/api"; // ✅ desde pages -> services
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
  const [authErr, setAuthErr] = useState("");

  // login form (solo UI por ahora; luego lo conectamos con token)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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
    setAuthErr("");
    setLoginOpen(true);
    setSidebarOpen(false);
  }

  function closeLogin() {
    setLoginOpen(false);
    setAuthErr("");
  }

  async function loadMe() {
    try {
      const meData = await api.me();
      setMe(meData);
    } catch {
      setMe(null);
    }
  }

  async function loadAutos() {
    setAutosErr("");
    setLoadingAutos(true);
    try {
      const data = await api.autos.list();
      const list = Array.isArray(data) ? data : data?.items || [];
      setItems(list);
    } catch (e) {
      setAutosErr(e?.message || "No se pudieron cargar autos");
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
    nav("/"); // regresa a home
  }

  // ✅ por ahora login es SOLO UI. Luego lo conectamos con tu endpoint real.
  function fakeLogin(e) {
    e.preventDefault();
    setAuthErr("");

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
      setAuthErr("La contraseña debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas y un número.");
      return;
    }

    // aquí luego llamaremos api.login(...) y guardaremos token
    closeLogin();
    // nav("/login"); // si quieres mandar a tu vista real de login, lo habilitamos después
  }

  return (
    <div className="lp">
      {/* HEADER */}
      <header className="lp-header">
        <button className="lp-icon-btn" onClick={() => setSidebarOpen((v) => !v)} aria-label="Abrir menú">
          ☰
        </button>

        <div className="lp-logo" onClick={() => scrollToSection("top")} role="button" tabIndex={0}>
          AU<span>TRUST</span>
        </div>

        <div className="lp-right">
          {/* Login mini en esquina */}
          {me ? (
            <div className="lp-user">
              <span className="lp-user-mail">{me.email}</span>
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
                Registrarse
              </button>
            </div>
          )}

          <button className="lp-search" onClick={() => setSearchOpen((v) => !v)} aria-label="Buscar" />
        </div>
      </header>

      {/* SEARCH BAR */}
      <div className={`lp-searchbar ${searchOpen ? "active" : ""}`}>
        <input
          type="text"
          placeholder="Buscar autos publicados (marca, modelo, estado...)"
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

          <li onClick={() => nav("/autos")}>Ir al CRUD (Inventario)</li>

          {!me ? (
            <li onClick={openLogin}>Iniciar sesión</li>
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
            <h1>Encuentra tu carro ideal</h1>
            <p>Autos usados verificados • Publica el tuyo en minutos • Compra con confianza</p>

            <div className="lp-hero-cta">
              <button className="lp-btn lp-btn-primary" onClick={() => scrollToSection("market")}>
                Ver autos en venta
              </button>
              <button className="lp-btn lp-btn-ghost" onClick={() => nav("/autos")}>
                Publicar / Administrar (CRUD)
              </button>
            </div>
          </div>
        </section>

        {/* MODELOS DESTACADOS (demo) */}
        <section className="lp-section" id="models">
          <div className="lp-section-head">
            <h2>Modelos destacados</h2>
            <p>Ejemplos visuales (demo). Tus autos reales salen abajo en “Autos en venta”.</p>
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

        {/* MARKET (realtime list desde API) */}
        <section className="lp-section" id="market">
          <div className="lp-section-head">
            <h2>Autos en venta</h2>
            <div className="lp-market-actions">
              <button className="lp-btn lp-btn-ghost" onClick={loadAutos} disabled={loadingAutos}>
                ↻ Recargar
              </button>
              <Link className="lp-btn lp-btn-primary" to="/autos">
                + Publicar auto (CRUD)
              </Link>
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
              <p>No hay autos publicados todavía.</p>
              <Link className="lp-btn lp-btn-primary" to="/autos">
                Publicar el primero
              </Link>
            </div>
          ) : (
            <div className="lp-cards">
              {filteredAutos.map((a) => (
                <article className="lp-card" key={a.id}>
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

                    <span className={`lp-badge lp-badge-${a.estado || "disponible"}`}>
                      {a.estado || "disponible"}
                    </span>
                  </div>

                  <p className="lp-desc">{a.descripcion || "Sin descripción."}</p>

                  <div className="lp-card-foot">
                    <button className="lp-btn lp-btn-ghost" onClick={() => nav("/autos")}>
                      Ver / Editar en CRUD
                    </button>
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

      {/* LOGIN MODAL (UI) */}
      <div className={`lp-modal ${loginOpen ? "active" : ""}`} onMouseDown={closeLogin}>
        <div className="lp-modal-content" onMouseDown={(e) => e.stopPropagation()}>
          <h2>Iniciar sesión</h2>

          {authErr && <div className="lp-alert">{authErr}</div>}

          <form onSubmit={fakeLogin}>
            <input
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button type="submit">Entrar</button>
          </form>

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

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import "../styles/auth.css";

// ✅ BANDERAS (para apagar textos sin borrar)
const SHOW_JWT_BULLET = false;
const SHOW_VERIFY_BULLET = false;
const SHOW_VERIFY_FOOTER = false;

export default function Login() {
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // Limpia estado en hot reload / navegación
  useEffect(() => {
    setEmail("");
    setPassword("");
    setMsg("");
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setMsg("");
    setLoading(true);

    try {
      await api.login({ email: email.trim(), password });
      nav("/autos"); // 🔒 ruta protegida
    } catch (err) {
      setMsg(err?.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-shell">
        {/* LADO IZQUIERDO */}
        <aside className="auth-left">
          <div className="brand">
            <div className="brand-badge" />
            <div>
              <p className="brand-title">AutoTrust</p>
              <p className="brand-sub">
                Accede a tu panel para administrar el inventario de autos.
              </p>
            </div>
          </div>

          {/* ✅ Contenedor que faltaba (para que no se rompan los cierres) */}
          <div className="features">
            {/* ❌ Si luego quieres usar esta bandera, aquí tienes el bloque listo */}
            {SHOW_JWT_BULLET && (
              <div className="feature">
                <span className="feature-dot" />
                <span>Autenticación segura con token (JWT).</span>
              </div>
            )}

            <div className="feature">
              <span className="feature-dot" />
              <span>Control de estados: disponible, apartado, vendido.</span>
            </div>

            {/* ❌ Quitado por bandera: Acceso solo después de verificar tu correo */}
            {SHOW_VERIFY_BULLET && (
              <div className="feature">
                <span className="feature-dot" />
                <span>Acceso solo después de verificar tu correo.</span>
              </div>
            )}
          </div>
        </aside>

        {/* FORMULARIO */}
        <main className="auth-card">
          <h1>Iniciar sesión</h1>
          <p>Ingresa con tu correo y contraseña.</p>

          {msg && <div className="alert">❌ {msg}</div>}

          <form className="auth-form" onSubmit={onSubmit} autoComplete="off">
            <div className="field">
              <label className="label">Correo electrónico</label>
              <input
                className="input"
                type="email"
                name="username"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                readOnly
                onFocus={(e) => e.target.removeAttribute("readonly")}
                required
              />
            </div>

            <div className="field">
              <label className="label">Contraseña</label>
              <input
                className="input"
                type="password"
                name="password"
                placeholder="Tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                readOnly
                onFocus={(e) => e.target.removeAttribute("readonly")}
                required
              />

              <div className="row">
                <Link className="mini-link" to="/register">
                  Crear cuenta
                </Link>
                <Link className="mini-link" to="/">
                  Volver al inicio
                </Link>
              </div>
            </div>

            <button className="btn btn-primary" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </button>

            {/* ❌ Quitado por bandera: Nota de cuenta no verificada */}
            {SHOW_VERIFY_FOOTER && (
              <p className="footer-note">
                Si tu cuenta no está verificada, revisa tu correo y haz clic en
                el enlace de activación.
              </p>
            )}
          </form>
        </main>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import "../styles/auth.css";

export default function Register() {
  const [form, setForm] = useState({ nombre: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  function onChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setOk("");

    const nombre = form.nombre.trim();
    const email = form.email.trim();
    const password = form.password;

    if (!nombre || !email || !password) {
      setErr("Completa todos los campos.");
      return;
    }
    if (password.length < 8) {
      setErr("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    try {
      setLoading(true);
      await api.register({ nombre, email, password });
      setOk("✅ Registro exitoso. Revisa tu correo para verificar tu cuenta.");
      setForm({ nombre: "", email: "", password: "" });
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <aside className="auth-left">
          <div className="brand">
            <div className="brand-badge" />
            <div>
              <p className="brand-title">AutoTrust</p>
              <p className="brand-sub">
                Inventario y control de autos con flujo de verificación de correo.
              </p>
            </div>
          </div>

          <div className="feature-list">
            <div className="feature">
              <span className="feature-dot" />
              <span>Diseño oscuro tipo streaming: simple y familiar.</span>
            </div>
            <div className="feature">
              <span className="feature-dot" />
              <span>Verificación por correo antes de iniciar sesión.</span>
            </div>
            <div className="feature">
              <span className="feature-dot" />
              <span>Acceso protegido a Autos después de login.</span>
            </div>
          </div>
        </aside>

        <main className="auth-card">
          <h1>Crear cuenta</h1>
          <p>Usa tu correo real. Te enviaremos un link para activar la cuenta.</p>

          {err && <div className="alert">❌ {err}</div>}
          {ok && <div className="alert success">{ok}</div>}

          <form className="auth-form" onSubmit={onSubmit}>
            <div className="field">
              <label className="label">Nombre</label>
              <input
                className="input"
                name="nombre"
                value={form.nombre}
                onChange={onChange}
                placeholder="Tu nombre"
                autoComplete="name"
              />
            </div>

            <div className="field">
              <label className="label">Correo</label>
              <input
                className="input"
                name="email"
                value={form.email}
                onChange={onChange}
                placeholder="correo@ejemplo.com"
                type="email"
                autoComplete="email"
              />
            </div>

            <div className="field">
              <label className="label">Contraseña</label>
              <input
                className="input"
                name="password"
                value={form.password}
                onChange={onChange}
                placeholder="Mínimo 8 caracteres"
                type="password"
                autoComplete="new-password"
              />
              <div className="row">
                <span className="footer-note">Tip: mezcla letras + números.</span>
                <Link className="mini-link" to="/login">
                  Ya tengo cuenta
                </Link>
              </div>
            </div>

            <button className="btn btn-primary" disabled={loading}>
              {loading ? "Creando..." : "Crear cuenta"}
            </button>

            <p className="footer-note">
              Al registrarte aceptas el uso de correo para verificación (solo para activar tu cuenta).
            </p>
          </form>
        </main>
      </div>
    </div>
  );
}

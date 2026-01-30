import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";

export default function Login() {
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // Evita que quede algo “pegado” por renders/hot reload
  useEffect(() => {
    setEmail("");
    setPassword("");
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setMsg("");
    setLoading(true);

    try {
      await api.login({ email, password });
      nav("/dashboard");
    } catch (err) {
      setMsg(err.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div style={{ width: "100%", maxWidth: 520, padding: 20 }}>
        <h1>Concesionaria Autos</h1>
        <p>API: {import.meta.env.VITE_API_URL}</p>

        <h2>Login</h2>

        <form
          onSubmit={onSubmit}
          style={{ display: "grid", gap: 10 }}
          autoComplete="off"
        >
          <input
            type="email"
            name="username"
            placeholder="Correo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            // Truco anti-autofill en Chromium/Brave:
            readOnly
            onFocus={(e) => e.target.removeAttribute("readonly")}
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            // Truco anti-autofill en Chromium/Brave:
            readOnly
            onFocus={(e) => e.target.removeAttribute("readonly")}
            required
          />

          <button disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </button>

          {msg && <p style={{ color: "tomato" }}>❌ {msg}</p>}
        </form>
      </div>
    </div>
  );
}

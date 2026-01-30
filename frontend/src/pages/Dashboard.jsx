import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../services/api";

export default function Dashboard() {
  const nav = useNavigate();
  const [me, setMe] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    api.me()
      .then((data) => setMe(data))
      .catch((e) => setErr(e.message));
  }, []);

  function logout() {
    api.logout();
    nav("/login");
  }

  return (
    <div style={{ maxWidth: 900, margin: "60px auto", padding: 20 }}>
      <header style={{ display: "flex", justifyContent: "space-between" }}>
        <h1>Dashboard</h1>
        <button onClick={logout}>Cerrar sesión</button>
      </header>

      {/* INFO DEL USUARIO */}
      {err && <p style={{ color: "tomato" }}>❌ {err}</p>}
      {me && (
        <p>
          Bienvenido <strong>{me.nombre || me.email}</strong>
        </p>
      )}

      {/* CARDS */}
      <div
        style={{
          marginTop: 30,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 20,
        }}
      >
        {/* CARD AUTOS */}
        <div style={cardStyle}>
          <h3>🚗 Autos</h3>
          <p>Alta, edición y eliminación de autos</p>
          <Link to="/autos">
            <button>Gestionar</button>
          </Link>
        </div>

        {/* CARD PERFIL */}
        <div style={cardStyle}>
          <h3>👤 Perfil</h3>
          <p>Información de tu cuenta</p>
          <button onClick={() => alert("Pendiente")}>Ver</button>
        </div>

        {/* CARD FUTURA */}
        <div style={cardStyle}>
          <h3>📊 Estadísticas</h3>
          <p>Ventas y métricas</p>
          <button disabled>Próximamente</button>
        </div>
      </div>

      {/* DEBUG OPCIONAL (puedes quitarlo luego) */}
      <details style={{ marginTop: 40 }}>
        <summary>Debug /profile/me</summary>
        <pre>{JSON.stringify(me, null, 2)}</pre>
      </details>
    </div>
  );
}

const cardStyle = {
  border: "1px solid #ddd",
  borderRadius: 10,
  padding: 20,
};

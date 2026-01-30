import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
    <div style={{ maxWidth: 720, margin: "80px auto", padding: 20 }}>
      <h1>Dashboard</h1>

      <button onClick={logout}>Cerrar sesión</button>

      <h3>/profile/me</h3>
      {err && <p style={{ color: "tomato" }}>❌ {err}</p>}
      {me ? (
        <pre>{JSON.stringify(me, null, 2)}</pre>
      ) : (
        !err && <p>Cargando...</p>
      )}
    </div>
  );
}

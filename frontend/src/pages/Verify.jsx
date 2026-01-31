import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { api } from "../services/api";

export default function Verify() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState("loading");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    async function run() {
      try {
        if (!token) {
          setStatus("error");
          setMsg("Token inválido.");
          return;
        }
        const res = await api.auth.verify(token);
        setStatus("ok");
        setMsg(res.message || "Cuenta verificada.");
      } catch (e) {
        setStatus("error");
        setMsg(e.message || "No se pudo verificar.");
      }
    }
    run();
  }, [token]);

  return (
    <div style={{ maxWidth: 520, margin: "80px auto", padding: 16 }}>
      <h1>Verificación de correo</h1>

      {status === "loading" && <p>Verificando...</p>}
      {status === "ok" && (
        <>
          <p>✅ {msg}</p>
          <Link to="/login">Ir a iniciar sesión</Link>
        </>
      )}
      {status === "error" && (
        <>
          <p>❌ {msg}</p>
          <Link to="/login">Volver</Link>
        </>
      )}
    </div>
  );
}

// frontend/src/AdminRoute.jsx
import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "./services/api";

export default function AdminRoute({ children }) {
  const [ok, setOk] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const me = await api.me();
        setOk(me?.role === "admin");
      } catch {
        setOk(false);
      }
    })();
  }, []);

  if (ok === null) return null;
  if (!ok) return <Navigate to="/" replace />;

  return children;
}

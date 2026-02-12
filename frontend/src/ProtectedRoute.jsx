import { Navigate, useLocation } from "react-router-dom";
import { api } from "./services/api";

export default function ProtectedRoute({ children }) {
  const loc = useLocation();

  // ✅ misma lógica que AppShell + fallback por si tu key cambia
  const token =
    api.getToken?.() ||
    localStorage.getItem("token") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("auth_token");

  if (!token) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;

  return children;
}

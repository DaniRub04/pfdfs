import { Routes, Route, Navigate } from "react-router-dom";

import AppShell from "./layout/AppShell.jsx";

// públicas
import Landing from "./pages/Landing.jsx";
import Catalogo from "./pages/Catalogo.jsx";
import Ayuda from "./pages/Ayuda.jsx";
import Nosotros from "./pages/Nosotros.jsx";
import Privacidad from "./pages/Privacidad.jsx";

// auth
import Login from "./pages/Login.jsx";
import Verify from "./pages/Verify.jsx";
import Register from "./pages/Register.jsx";

// publicar (protegidas)
import PublishSelect from "./pages/PublishSelect.jsx";
import PublishForm from "./pages/PublishForm.jsx";

// protegidas
import ProtectedRoute from "./ProtectedRoute.jsx";
import AdminRoute from "./AdminRoute.jsx";

// perfil
import PerfilLayout from "./pages/perfil/PerfilLayout.jsx";
import PerfilHome from "./pages/perfil/PerfilHome.jsx";
import PerfilInventario from "./pages/perfil/PerfilInventario.jsx";
import PerfilPublicaciones from "./pages/perfil/PerfilPublicaciones.jsx";
import PerfilConfiguracion from "./pages/perfil/PerfilConfiguracion.jsx";

// 👑 admin
import AdminPublicaciones from "./pages/AdminPublicaciones.jsx";

export default function App() {
  return (
    <Routes>
      {/* ✅ Layout base para todo el sitio */}
      <Route element={<AppShell />}>
        {/* ================= PUBLICAS ================= */}
        <Route path="/" element={<Landing />} />
        <Route path="/catalogo" element={<Catalogo />} />
        <Route path="/ayuda" element={<Ayuda />} />
        <Route path="/nosotros" element={<Nosotros />} />
        <Route path="/privacidad" element={<Privacidad />} />

        {/* ================= AUTH ================= */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify" element={<Verify />} />

        {/* ================= PUBLICAR (PROTEGIDO) ================= */}
        <Route
          path="/publicar"
          element={
            <ProtectedRoute>
              <PublishSelect />
            </ProtectedRoute>
          }
        />
        <Route
          path="/publicar/:group"
          element={
            <ProtectedRoute>
              <PublishForm />
            </ProtectedRoute>
          }
        />

        {/* ================= PERFIL (PROTEGIDO) ================= */}
        <Route
          path="/perfil"
          element={
            <ProtectedRoute>
              <PerfilLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<PerfilHome />} />
          <Route path="inventario" element={<PerfilInventario />} />
          <Route path="publicaciones" element={<PerfilPublicaciones />} />
          <Route path="configuracion" element={<PerfilConfiguracion />} />
          <Route path="*" element={<Navigate to="/perfil" replace />} />
        </Route>

        {/* ================= ADMIN (SOLO ADMIN) ================= */}
        <Route
          path="/admin/publicaciones"
          element={
            <AdminRoute>
              <AdminPublicaciones />
            </AdminRoute>
          }
        />

        {/* ================= 404 GLOBAL ================= */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

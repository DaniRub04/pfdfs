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

// protegidas
import ProtectedRoute from "./ProtectedRoute.jsx";
import Inventario from "./pages/Autos.jsx";
import PublishSelect from "./pages/PublishSelect.jsx";
import PublishForm from "./pages/PublishForm.jsx";
import Profile from "./pages/Profile.jsx";

export default function App() {
  return (
    <Routes>
      {/* ✅ Layout base para todo el sitio (AppBar + Drawer + Footer) */}
      <Route element={<AppShell />}>
        {/* públicas */}
        <Route path="/" element={<Landing />} />
        <Route path="/catalogo" element={<Catalogo />} />
        <Route path="/ayuda" element={<Ayuda />} />
        <Route path="/nosotros" element={<Nosotros />} />
        <Route path="/privacidad" element={<Privacidad />} />

        {/* auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify" element={<Verify />} />

        {/* protegidas */}
        <Route
          path="/inventario"
          element={
            <ProtectedRoute>
              <Inventario />
            </ProtectedRoute>
          }
        />

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

        <Route
          path="/perfil"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

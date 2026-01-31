import { Routes, Route, Navigate } from "react-router-dom";

import Landing from "./pages/Landing.jsx";
import Autos from "./pages/Autos.jsx";
import Login from "./pages/Login.jsx";
import Verify from "./pages/Verify.jsx";
import Register from "./pages/Register.jsx"; // ✅ NUEVO
import ProtectedRoute from "./ProtectedRoute.jsx";

export default function App() {
  return (
    <Routes>
      {/* públicas */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} /> {/* ✅ NUEVO */}
      <Route path="/verify" element={<Verify />} />

      {/* protegida */}
      <Route
        path="/autos"
        element={
          <ProtectedRoute>
            <Autos />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

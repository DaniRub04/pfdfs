import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Autos from "./pages/Autos"; // ✅ nuevo
import ProtectedRoute from "./ProtectedRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/login" element={<Login />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* ✅ CRUD de autos en cards */}
        <Route
          path="/autos"
          element={
            <ProtectedRoute>
              <Autos />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

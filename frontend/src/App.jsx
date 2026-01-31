import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing";
import { Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing.jsx";
import Autos from "./pages/Autos.jsx";
import Login from "./pages/Login.jsx"; // ya lo tienes

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/autos" element={<Autos />} />
      <Route path="/login" element={<Login />} />

      {/* opcional: si tienes dashboard */}
      {/* <Route path="/dashboard" element={<Dashboard />} /> */}

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

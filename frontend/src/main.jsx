// frontend/src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import App from "./App.jsx";
import { theme } from "./theme";
import "./index.css";
import "./styles/theme.css"; // ✅ Fondo global (mismo look que Landing) para TODAS las vistas

// ✅ Nota: En @mui/x-data-grid v8 NO se importa grid.css manualmente.
// (Esa ruta no existe y rompe el build en Vercel)

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);
import { useMemo, useState } from "react";
import { Link, Outlet, useNavigate, useSearchParams } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Box,
  IconButton,
  Button,
  Typography,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Container,
} from "@mui/material";

import { GROUP_OPTIONS, normalizeGroup } from "../config/groups";
import { api } from "../services/api";

export default function AppShell() {
  const nav = useNavigate();
  const [sp] = useSearchParams();

  const [drawerOpen, setDrawerOpen] = useState(false);

  // ✅ Grupo actual (viene de query param)
  const group = useMemo(() => normalizeGroup(sp.get("group") || "automotriz"), [sp]);

  // ✅ Auth simple por token (ajusta key si la tuya cambia)
  const token = api.getToken?.() || localStorage.getItem("token");
  const isAuthed = Boolean(token);

  const goCatalogo = (nextGroup = group) => {
    const g = normalizeGroup(nextGroup);
    nav(`/catalogo?group=${encodeURIComponent(g)}`);
  };

  const goPublish = () => nav("/publicar");
  const goInventario = () => nav("/inventario");

  const logout = () => {
    api.logout?.();
    localStorage.removeItem("token");
    setDrawerOpen(false);
    nav("/");
  };

  const topLinks = [
    { label: "Inicio", to: "/" },
    { label: "Catálogo", to: `/catalogo?group=${encodeURIComponent(group)}` },
    { label: "Ayuda", to: "/ayuda" },
    { label: "Nosotros", to: "/nosotros" },
    { label: "Privacidad", to: "/privacidad" },
  ];

  return (
    <Box sx={{ minHeight: "100vh" }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          background: "rgba(10,10,28,0.72)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255,255,255,0.10)",
        }}
      >
        <Toolbar sx={{ gap: 1.5 }}>
          <Tooltip title="Menú">
            <IconButton
              color="inherit"
              onClick={() => setDrawerOpen(true)}
              sx={{
                borderRadius: 2.5,
                border: "1px solid rgba(255,255,255,0.14)",
                background: "rgba(255,255,255,0.04)",
              }}
            >
              ☰
            </IconButton>
          </Tooltip>

          <Typography
            component={Link}
            to="/"
            sx={{
              textDecoration: "none",
              color: "inherit",
              fontWeight: 900,
              letterSpacing: 2,
              userSelect: "none",
              whiteSpace: "nowrap",
            }}
          >
            SELECTA<span style={{ fontWeight: 400, opacity: 0.7 }}>PLAZA</span>
          </Typography>

          {/* Links en desktop */}
          <Box sx={{ display: { xs: "none", md: "flex" }, gap: 1, ml: 2 }}>
            {topLinks.map((l) => (
              <Button
                key={l.to}
                component={Link}
                to={l.to}
                variant="text"
                sx={{
                  color: "rgba(255,255,255,0.9)",
                  textTransform: "none",
                  fontWeight: 800,
                }}
              >
                {l.label}
              </Button>
            ))}
          </Box>

          <Box sx={{ flex: 1 }} />

          {/* Dropdown de grupo */}
          <FormControl
            size="small"
            sx={{
              minWidth: 190,
              "& .MuiInputLabel-root": { color: "rgba(255,255,255,.78)" },
              "& .MuiOutlinedInput-root": {
                color: "white",
                borderRadius: 2.5,
                background: "rgba(255,255,255,0.04)",
              },
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "rgba(255,255,255,0.14)",
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: "rgba(255,255,255,0.22)",
              },
              "& .MuiSvgIcon-root": { color: "rgba(255,255,255,.85)" },
            }}
          >
            <InputLabel id="group-label">Grupo</InputLabel>
            <Select
              labelId="group-label"
              value={group}
              label="Grupo"
              onChange={(e) => goCatalogo(normalizeGroup(e.target.value))}
            >
              {GROUP_OPTIONS.map((g) => (
                <MenuItem key={g.id} value={g.id}>
                  {g.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            onClick={() => goCatalogo(group)}
            variant="outlined"
            sx={{
              borderRadius: 2.5,
              borderColor: "rgba(45,212,191,0.55)",
              color: "white",
              background: "rgba(45,212,191,0.10)",
              "&:hover": {
                background: "rgba(45,212,191,0.18)",
                borderColor: "rgba(45,212,191,0.75)",
              },
              textTransform: "none",
              fontWeight: 900,
            }}
          >
            Explorar
          </Button>

          {isAuthed ? (
            <Box sx={{ display: { xs: "none", md: "flex" }, gap: 1, ml: 1 }}>
              <Button
                variant="outlined"
                onClick={goPublish}
                sx={{ textTransform: "none", fontWeight: 900 }}
              >
                Publicar
              </Button>
              <Button
                variant="outlined"
                onClick={goInventario}
                sx={{ textTransform: "none", fontWeight: 900 }}
              >
                Inventario
              </Button>
              <Button
                variant="outlined"
                onClick={logout}
                sx={{
                  textTransform: "none",
                  fontWeight: 900,
                  borderColor: "rgba(255,59,129,0.45)",
                  background: "rgba(255,59,129,0.12)",
                  "&:hover": { background: "rgba(255,59,129,0.18)" },
                }}
              >
                Salir
              </Button>
            </Box>
          ) : (
            <Box sx={{ display: { xs: "none", md: "flex" }, gap: 1, ml: 1 }}>
              <Button
                variant="outlined"
                onClick={() => nav("/login")}
                sx={{ textTransform: "none", fontWeight: 900 }}
              >
                Entrar
              </Button>
              <Button
                variant="outlined"
                onClick={() => nav("/register")}
                sx={{
                  textTransform: "none",
                  fontWeight: 900,
                  borderColor: "rgba(45,212,191,0.55)",
                  background: "rgba(45,212,191,0.12)",
                  "&:hover": { background: "rgba(45,212,191,0.18)" },
                }}
              >
                Crear cuenta
              </Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* Drawer móvil */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: 300,
            background: "rgba(10,10,28,0.96)",
            color: "white",
            borderRight: "1px solid rgba(255,255,255,0.10)",
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography sx={{ fontWeight: 900, letterSpacing: 2 }}>
            SELECTA<span style={{ fontWeight: 400, opacity: 0.7 }}>PLAZA</span>
          </Typography>

          <Divider sx={{ my: 2, borderColor: "rgba(255,255,255,0.10)" }} />

          <List>
            {topLinks.map((l) => (
              <ListItemButton
                key={l.to}
                component={Link}
                to={l.to}
                onClick={() => setDrawerOpen(false)}
              >
                <ListItemText primary={l.label} />
              </ListItemButton>
            ))}
          </List>

          <Divider sx={{ my: 2, borderColor: "rgba(255,255,255,0.10)" }} />

          <List>
            {isAuthed ? (
              <>
                <ListItemButton
                  onClick={() => {
                    setDrawerOpen(false);
                    goPublish();
                  }}
                >
                  <ListItemText primary="Publicar" />
                </ListItemButton>
                <ListItemButton
                  onClick={() => {
                    setDrawerOpen(false);
                    goInventario();
                  }}
                >
                  <ListItemText primary="Inventario" />
                </ListItemButton>
                <ListItemButton onClick={logout}>
                  <ListItemText primary="Salir" />
                </ListItemButton>
              </>
            ) : (
              <>
                <ListItemButton
                  onClick={() => {
                    setDrawerOpen(false);
                    nav("/login");
                  }}
                >
                  <ListItemText primary="Entrar" />
                </ListItemButton>
                <ListItemButton
                  onClick={() => {
                    setDrawerOpen(false);
                    nav("/register");
                  }}
                >
                  <ListItemText primary="Crear cuenta" />
                </ListItemButton>
              </>
            )}
          </List>
        </Box>
      </Drawer>

      {/* Content */}
      <Box sx={{ pt: "88px", pb: 6 }}>
        <Container maxWidth="lg">
          <Outlet />
        </Container>
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          borderTop: "1px solid rgba(255,255,255,0.10)",
          background: "rgba(10, 10, 28, 0.35)",
          py: 3,
        }}
      >
        <Container
          maxWidth="lg"
          sx={{
            display: "flex",
            justifyContent: "space-between",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <Typography sx={{ opacity: 0.8, fontSize: 13 }}>
            © {new Date().getFullYear()} Selecta Plaza
          </Typography>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <Button component={Link} to="/privacidad" variant="text" sx={{ opacity: 0.9 }}>
              Privacidad
            </Button>
            <Button component={Link} to="/ayuda" variant="text" sx={{ opacity: 0.9 }}>
              Ayuda
            </Button>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}

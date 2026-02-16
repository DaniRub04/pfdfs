import { useEffect, useMemo, useState } from "react";
import { Link, Outlet, useLocation, useNavigate, useSearchParams } from "react-router-dom";
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
  Chip,
} from "@mui/material";

import { GROUP_OPTIONS, normalizeGroup } from "../config/groups";
import { api } from "../services/api";

export default function AppShell() {
  const nav = useNavigate();
  const location = useLocation();
  const [sp] = useSearchParams();

  const [drawerOpen, setDrawerOpen] = useState(false);

  // ✅ Grupo actual (viene de query param)
  const group = useMemo(() => normalizeGroup(sp.get("group") || "automotriz"), [sp]);

  // ✅ Auth simple por token
  const token = api.getToken?.() || localStorage.getItem("token");
  const isAuthed = Boolean(token);

  // ✅ user + admin badge
  const [me, setMe] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);

  // Re-cargar /me cuando cambia el token (login/logout)
  useEffect(() => {
    (async () => {
      if (!isAuthed) {
        setMe(null);
        setPendingCount(0);
        return;
      }

      try {
        const data = await api.me();
        setMe(data || null);
      } catch {
        setMe(null);
        setPendingCount(0);
      }
    })();
  }, [isAuthed, token]);

  // Contador de pendientes solo para admin
  useEffect(() => {
    if (me?.role === "admin") {
      api.publicar
        .adminList({ status: "pendiente", limit: 1, offset: 0 })
        .then((r) => {
          // Soporta ambos formatos:
          // 1) r.total
          // 2) r.data.total (si tu helper devuelve axios response)
          const total = (r?.total ?? r?.data?.total ?? 0);
          setPendingCount(Number(total) || 0);
        })
        .catch(() => setPendingCount(0));
    } else {
      setPendingCount(0);
    }
  }, [me]);

  const goCatalogo = (nextGroup = group) => {
    const g = normalizeGroup(nextGroup);
    nav(`/catalogo?group=${encodeURIComponent(g)}`);
  };

  const goPublish = () => nav("/publicar");
  const goPerfil = () => nav("/perfil");
  const goAdmin = () => nav("/admin/publicaciones");

  // ✅ Selector inteligente: si estás en /publicar... cambia a /publicar/:group, si no, a /catalogo
  const onGroupChange = (nextGroup) => {
    const g = normalizeGroup(nextGroup);
    if (location.pathname.startsWith("/publicar")) {
      nav(`/publicar/${encodeURIComponent(g)}`);
    } else {
      goCatalogo(g);
    }
  };

  // Mostrar selector de grupo solo donde tiene sentido
  const showGroupSelect = useMemo(() => {
    const p = location.pathname;
    return p.startsWith("/catalogo") || p.startsWith("/publicar");
  }, [location.pathname]);

  const logout = () => {
    api.logout?.();
    localStorage.removeItem("token");
    setDrawerOpen(false);
    setMe(null);
    setPendingCount(0);
    nav("/");
  };

  const topLinks = [
    { label: "Inicio", to: "/" },
    { label: "Catálogo", to: `/catalogo?group=${encodeURIComponent(group)}` },
    { label: "Ayuda", to: "/ayuda" },
    { label: "Nosotros", to: "/nosotros" },
    { label: "Privacidad", to: "/privacidad" },
  ];

  const closeDrawerAnd = (fn) => () => {
    setDrawerOpen(false);
    fn?.();
  };

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

          {/* Dropdown de grupo (solo catálogo/publicar) */}
          {showGroupSelect && (
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
                onChange={(e) => onGroupChange(e.target.value)}
              >
                {GROUP_OPTIONS.map((g) => (
                  <MenuItem key={g.id} value={g.id}>
                    {g.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

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
              {/* 👑 Admin button only if role=admin */}
              {me?.role === "admin" && (
                <Button
                  variant="outlined"
                  onClick={goAdmin}
                  sx={{
                    textTransform: "none",
                    fontWeight: 900,
                    borderColor: "rgba(255,215,0,0.55)",
                    background: "rgba(255,215,0,0.12)",
                    "&:hover": { background: "rgba(255,215,0,0.18)" },
                    display: "flex",
                    gap: 1,
                    alignItems: "center",
                  }}
                >
                  Admin
                  {pendingCount > 0 && (
                    <Chip
                      size="small"
                      label={pendingCount}
                      color="warning"
                      sx={{ fontWeight: 900 }}
                    />
                  )}
                </Button>
              )}

              <Button
                variant="outlined"
                onClick={goPublish}
                sx={{ textTransform: "none", fontWeight: 900 }}
              >
                Publicar
              </Button>

              <Button
                variant="outlined"
                onClick={goPerfil}
                sx={{ textTransform: "none", fontWeight: 900 }}
              >
                Perfil
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

          {showGroupSelect && (
            <>
              <Divider sx={{ my: 2, borderColor: "rgba(255,255,255,0.10)" }} />

              <FormControl
                size="small"
                fullWidth
                sx={{
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
                <InputLabel id="group-label-drawer">Grupo</InputLabel>
                <Select
                  labelId="group-label-drawer"
                  value={group}
                  label="Grupo"
                  onChange={(e) => {
                    const g = e.target.value;
                    setDrawerOpen(false);
                    onGroupChange(g);
                  }}
                >
                  {GROUP_OPTIONS.map((g) => (
                    <MenuItem key={g.id} value={g.id}>
                      {g.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </>
          )}

          <Divider sx={{ my: 2, borderColor: "rgba(255,255,255,0.10)" }} />

          <List>
            {isAuthed ? (
              <>
                {me?.role === "admin" && (
                  <ListItemButton onClick={closeDrawerAnd(goAdmin)}>
                    <ListItemText
                      primary={`Admin${pendingCount > 0 ? ` (${pendingCount})` : ""}`}
                    />
                  </ListItemButton>
                )}

                <ListItemButton onClick={closeDrawerAnd(goPublish)}>
                  <ListItemText primary="Publicar" />
                </ListItemButton>
                <ListItemButton onClick={closeDrawerAnd(goPerfil)}>
                  <ListItemText primary="Perfil" />
                </ListItemButton>
                <ListItemButton onClick={closeDrawerAnd(logout)}>
                  <ListItemText primary="Salir" />
                </ListItemButton>
              </>
            ) : (
              <>
                <ListItemButton onClick={closeDrawerAnd(() => nav("/login"))}>
                  <ListItemText primary="Entrar" />
                </ListItemButton>
                <ListItemButton onClick={closeDrawerAnd(() => nav("/register"))}>
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

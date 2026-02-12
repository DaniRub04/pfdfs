import { NavLink, Outlet } from "react-router-dom";
import { Box, Button, Stack, Typography } from "@mui/material";

const linkSx = {
  textTransform: "none",
  fontWeight: 900,
  justifyContent: "flex-start",
};

export default function PerfilLayout() {
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "260px 1fr" }, gap: 2 }}>
      <Box
        sx={{
          border: "1px solid rgba(255,255,255,0.10)",
          borderRadius: 3,
          background: "rgba(255,255,255,0.04)",
          p: 2,
          height: "fit-content",
        }}
      >
        <Typography sx={{ fontWeight: 900, letterSpacing: 1, mb: 1 }}>
          Mi perfil
        </Typography>

        <Stack gap={1}>
          <Button component={NavLink} to="/perfil" end sx={linkSx}>
            Resumen
          </Button>
          <Button component={NavLink} to="/perfil/inventario" sx={linkSx}>
            Inventario
          </Button>
          <Button component={NavLink} to="/perfil/publicaciones" sx={linkSx}>
            Publicaciones
          </Button>
          <Button component={NavLink} to="/perfil/configuracion" sx={linkSx}>
            Configuración
          </Button>
        </Stack>
      </Box>

      <Box
        sx={{
          border: "1px solid rgba(255,255,255,0.10)",
          borderRadius: 3,
          background: "rgba(255,255,255,0.04)",
          p: 2,
          minHeight: 320,
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}

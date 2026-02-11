import { Typography } from "@mui/material";

export default function PerfilConfiguracion() {
  return (
    <>
      <Typography sx={{ fontWeight: 900, mb: 1 }}>Configuración</Typography>
      <Typography sx={{ opacity: 0.85 }}>
        Aquí irán ajustes de cuenta, seguridad, preferencias, etc.
      </Typography>
    </>
  );
}

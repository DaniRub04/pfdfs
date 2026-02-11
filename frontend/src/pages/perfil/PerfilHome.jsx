import { Typography } from "@mui/material";

export default function PerfilHome() {
  return (
    <>
      <Typography sx={{ fontWeight: 900, mb: 1 }}>Resumen</Typography>
      <Typography sx={{ opacity: 0.85 }}>
        Bienvenido. Desde aquí puedes administrar tu inventario, publicaciones y configuración.
      </Typography>
    </>
  );
}

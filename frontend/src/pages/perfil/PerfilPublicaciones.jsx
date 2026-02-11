import { Typography } from "@mui/material";

export default function PerfilPublicaciones() {
  return (
    <>
      <Typography sx={{ fontWeight: 900, mb: 1 }}>Publicaciones</Typography>
      <Typography sx={{ opacity: 0.85 }}>
        Aquí irá el historial de publicaciones, estados (pendiente/aprobado), etc.
      </Typography>
    </>
  );
}

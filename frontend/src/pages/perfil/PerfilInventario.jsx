import { Typography } from "@mui/material";

export default function PerfilInventario() {
  return (
    <>
      <Typography sx={{ fontWeight: 900, mb: 1 }}>Inventario</Typography>
      <Typography sx={{ opacity: 0.85 }}>
        Aquí irá la lista de productos/vehículos publicados por el usuario.
      </Typography>
    </>
  );
}

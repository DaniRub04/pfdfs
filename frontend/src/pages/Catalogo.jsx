import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Box,
  Typography,
  TextField,
  Button,
  Chip,
  Paper,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";

import { api } from "../services/api";
import { GROUPS } from "../config/catalogoConfig";

function normalizeGroup(groupId, fallback = "automotriz") {
  const ok = GROUPS.some((g) => g.id === groupId);
  return ok ? groupId : fallback;
}

export default function Catalogo() {
  const [sp, setSp] = useSearchParams();

  // ✅ lee group desde query
  const group = useMemo(() => normalizeGroup(sp.get("group") || "automotriz"), [sp]);
  const activeGroup = useMemo(() => GROUPS.find((g) => g.id === group), [group]);

  // UI state
  const [q, setQ] = useState("");
  const [order, setOrder] = useState("recientes");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");

  // data
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // ✅ cargar lista pública por grupo desde /publicar
  useEffect(() => {
    (async () => {
      setErr("");
      setLoading(true);
      try {
        const data = await api.publicar.listPublic({ group, limit: 100 });
        const list = Array.isArray(data) ? data : data?.items || [];

        // Cada row: { id, group_id, data, user_id, created_at }
        const mapped = list.map((row) => {
          const p = row?.data && typeof row.data === "object" ? row.data : {};
          return {
            id: row.id,
            group_id: row.group_id,
            created_at: row.created_at,
            _data: p,
          };
        });

        // Estado normalmente vive dentro del JSON (data)
        const publicList = mapped.filter(
          (row) => ((row?._data?.estado ?? "disponible") === "disponible")
        );

        setItems(publicList);
      } catch (e) {
        setErr(e?.message || "No se pudieron cargar publicaciones");
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [group]);

  // ✅ filtro/orden local (simple)
  const filtered = useMemo(() => {
    let list = [...items];

    // búsqueda (dentro de data)
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      list = list.filter((row) => {
        const p = row._data || {};
        const haystack = `${p.titulo || ""} ${p.descripcion || ""} ${p.marca || ""} ${p.modelo || ""} ${p.nombre || ""}`;
        return haystack.toLowerCase().includes(s);
      });
    }

    // precio (dentro de data)
    const minN = min ? Number(min) : null;
    const maxN = max ? Number(max) : null;

    if (minN != null && !Number.isNaN(minN)) {
      list = list.filter((row) => Number(row?._data?.precio ?? 0) >= minN);
    }
    if (maxN != null && !Number.isNaN(maxN)) {
      list = list.filter((row) => Number(row?._data?.precio ?? 0) <= maxN);
    }

    // orden
    if (order === "menor") list.sort((a, b) => (a._data?.precio ?? 0) - (b._data?.precio ?? 0));
    if (order === "mayor") list.sort((a, b) => (b._data?.precio ?? 0) - (a._data?.precio ?? 0));
    // "recientes": backend ya ordena por created_at desc, pero mantenemos tal cual

    return list;
  }, [items, q, min, max, order]);

  // ✅ chips activos
  const chips = useMemo(() => {
    const c = [];
    c.push({ key: "group", label: `Grupo: ${activeGroup?.title || group}` });
    if (q.trim()) c.push({ key: "q", label: `“${q.trim()}”` });
    if (min) c.push({ key: "min", label: `min $${min}` });
    if (max) c.push({ key: "max", label: `max $${max}` });
    if (order !== "recientes") c.push({ key: "order", label: `orden: ${order}` });
    return c;
  }, [activeGroup, group, q, min, max, order]);

  function setGroupInUrl(nextGroup) {
    setSp({ group: nextGroup });
  }

  function clearFilters() {
    setQ("");
    setMin("");
    setMax("");
    setOrder("recientes");
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 900, mb: 0.5 }}>
        Catálogo público
      </Typography>
      <Typography sx={{ opacity: 0.85, mb: 2 }}>
        Explora por grupos/categorías. Ahora estás en: <b>{activeGroup?.title || group}</b>
      </Typography>

      {/* Search + selector */}
      <Paper sx={{ p: 2, borderRadius: 3, mb: 2 }}>
        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
          <TextField
            value={q}
            onChange={(e) => setQ(e.target.value)}
            label={`Buscar en ${activeGroup?.title || "Catálogo"}`}
            placeholder="Ej: toyota 2023, laptop, servicio..."
            size="small"
            sx={{ flex: 1, minWidth: 260 }}
          />

          <FormControl size="small" sx={{ minWidth: 210 }}>
            <InputLabel id="group-switch">Grupo</InputLabel>
            <Select
              labelId="group-switch"
              value={group}
              label="Grupo"
              onChange={(e) => setGroupInUrl(e.target.value)}
            >
              {GROUPS.map((g) => (
                <MenuItem key={g.id} value={g.id}>
                  {g.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button variant="outlined" onClick={clearFilters}>
            Limpiar
          </Button>
        </Box>

        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 2 }}>
          {chips.map((c) => (
            <Chip key={c.key} label={c.label} variant="outlined" />
          ))}
        </Box>
      </Paper>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "320px 1fr" }, gap: 2 }}>
        {/* Filtros */}
        <Paper sx={{ p: 2, borderRadius: 3 }}>
          <Typography sx={{ fontWeight: 900, mb: 1 }}>Filtros</Typography>
          <Divider sx={{ mb: 2, borderColor: "rgba(255,255,255,0.10)" }} />

          <TextField
            value={min}
            onChange={(e) => setMin(e.target.value)}
            label="Precio mínimo"
            size="small"
            type="number"
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            value={max}
            onChange={(e) => setMax(e.target.value)}
            label="Precio máximo"
            size="small"
            type="number"
            fullWidth
            sx={{ mb: 2 }}
          />

          <FormControl size="small" fullWidth>
            <InputLabel id="order">Ordenar</InputLabel>
            <Select
              labelId="order"
              value={order}
              label="Ordenar"
              onChange={(e) => setOrder(e.target.value)}
            >
              <MenuItem value="recientes">Recientes</MenuItem>
              <MenuItem value="menor">Menor precio</MenuItem>
              <MenuItem value="mayor">Mayor precio</MenuItem>
            </Select>
          </FormControl>

          <Button variant="outlined" fullWidth sx={{ mt: 2 }} onClick={clearFilters}>
            Reset
          </Button>
        </Paper>

        {/* Resultados */}
        <Paper sx={{ p: 2, borderRadius: 3 }}>
          <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 2 }}>
            <Typography sx={{ fontWeight: 900 }}>Resultados</Typography>
            <Typography sx={{ opacity: 0.8, fontSize: 13 }}>
              {loading ? "Cargando..." : `${filtered.length} elementos`}
            </Typography>
          </Box>

          <Divider sx={{ my: 2, borderColor: "rgba(255,255,255,0.10)" }} />

          {err && (
            <Typography sx={{ color: "error.main", mb: 2, fontWeight: 800 }}>
              ❌ {err}
            </Typography>
          )}

          {loading ? (
            <Typography sx={{ opacity: 0.8 }}>Cargando catálogo…</Typography>
          ) : filtered.length === 0 ? (
            <Typography sx={{ opacity: 0.8 }}>No hay resultados con los filtros actuales.</Typography>
          ) : (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "1fr 1fr 1fr" },
                gap: 2,
              }}
            >
              {filtered.slice(0, 24).map((row) => {
                const p = row._data || {};
                const title = p.titulo || p.nombre || "Publicación";
                const price =
                  p.precio == null ? "—" : `$${Number(p.precio).toLocaleString("es-MX")} MXN`;
                const img = p.foto_url || p.imagenes?.[0] || "";

                return (
                  <Paper key={row.id} sx={{ p: 0, borderRadius: 3, overflow: "hidden" }}>
                    <Box
                      sx={{
                        height: 180,
                        background:
                          img
                            ? `url(${img}) center/cover no-repeat`
                            : "radial-gradient(600px 200px at 20% 20%, rgba(45,212,191,.18), transparent 60%), linear-gradient(180deg, rgba(0,0,0,.35), rgba(255,255,255,.03))",
                      }}
                    />

                    <Box sx={{ p: 2 }}>
                      <Typography sx={{ fontWeight: 900 }}>{title}</Typography>
                      <Typography sx={{ opacity: 0.8, mt: 0.5, fontSize: 13 }}>
                        {p.anio ?? p.año ?? "—"} · {price}
                      </Typography>

                      <Typography sx={{ opacity: 0.85, mt: 1, fontSize: 13 }}>
                        {p.descripcion || "Sin descripción."}
                      </Typography>
                    </Box>
                  </Paper>
                );
              })}
            </Box>
          )}

          <Typography sx={{ opacity: 0.6, fontSize: 12, mt: 2 }}>
            Vista conectada al endpoint público: <b>/publicar?group=...&limit=...</b>
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
}

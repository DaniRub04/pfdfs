// frontend/src/pages/Catalogo.jsx
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
import PublicationCard from "../components/PublicationCard";
import "../styles/publicationCards.css";

function normalizeGroup(groupId, fallback = "automotriz") {
  const ok = GROUPS.some((g) => g.id === groupId);
  return ok ? groupId : fallback;
}

function toNumberOrNull(v) {
  if (v == null) return null;
  const n = Number(String(v).replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function safeJson(v) {
  if (!v) return {};
  if (typeof v === "object") return v;
  if (typeof v === "string") {
    try {
      return JSON.parse(v);
    } catch {
      return {};
    }
  }
  return {};
}

/**
 * ✅ listPublic() con tu api.js normalmente regresa un array directo
 * porque request() colapsa {ok,data} => data.
 * Aun así, esta función tolera formatos alternos.
 */
function normalizePublicList(resp) {
  if (Array.isArray(resp)) return resp;

  if (resp && typeof resp === "object") {
    if (Array.isArray(resp.data)) return resp.data;
    if (Array.isArray(resp.items)) return resp.items;
    if (Array.isArray(resp.rows)) return resp.rows;
  }

  return [];
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

  async function load() {
    setErr("");
    setLoading(true);
    try {
      const resp = await api.publicar.listPublic({ group, limit: 200 });

      const list = normalizePublicList(resp);

      const mapped = list.map((row) => ({
        ...row,
        // ✅ data puede venir como JSON string o como objeto
        _data: safeJson(row?.data),
      }));

      setItems(mapped);
    } catch (e) {
      setErr(e?.message || "No se pudieron cargar publicaciones");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  // ✅ cargar lista pública por grupo
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group]);

  // ✅ filtro/orden local (simple)
  const filtered = useMemo(() => {
    let list = [...items];

    // búsqueda (sobre data + group_id)
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      list = list.filter((row) => {
        const p = row._data || {};
        const haystack = `${p.titulo || ""} ${p.descripcion || ""} ${p.marca || ""} ${
          p.modelo || ""
        } ${p.nombre || ""} ${row.group_id || ""}`;
        return haystack.toLowerCase().includes(s);
      });
    }

    // precio (dentro de data)
    const minN = min ? toNumberOrNull(min) : null;
    const maxN = max ? toNumberOrNull(max) : null;

    if (minN != null) {
      list = list.filter((row) => {
        const price = toNumberOrNull(row?._data?.precio) ?? 0;
        return price >= minN;
      });
    }
    if (maxN != null) {
      list = list.filter((row) => {
        const price = toNumberOrNull(row?._data?.precio) ?? 0;
        return price <= maxN;
      });
    }

    // orden
    if (order === "menor") {
      list.sort(
        (a, b) =>
          (toNumberOrNull(a._data?.precio) ?? 0) - (toNumberOrNull(b._data?.precio) ?? 0)
      );
    }
    if (order === "mayor") {
      list.sort(
        (a, b) =>
          (toNumberOrNull(b._data?.precio) ?? 0) - (toNumberOrNull(a._data?.precio) ?? 0)
      );
    }
    // "recientes": backend ya ordena por created_at desc

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

          <Button variant="outlined" onClick={load} disabled={loading}>
            Recargar
          </Button>

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
              {filtered.slice(0, 60).map((row) => (
                <PublicationCard key={row.id} row={row} />
              ))}
            </Box>
          )}

          <Typography sx={{ opacity: 0.6, fontSize: 12, mt: 2 }}>
            Vista conectada al endpoint público: <b>/publicar?group=...&limit=...</b> (solo aprobadas)
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
}
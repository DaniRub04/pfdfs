// frontend/src/pages/AdminPublicaciones.jsx
import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Box,
  Button,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { api } from "../services/api";
import { GROUPS } from "../config/catalogoConfig"; // ajusta si tu config está en otra ruta

const STATUS_OPTIONS = [
  { id: "pendiente", label: "PENDIENTE" },
  { id: "aprobado", label: "APROBADO" },
  { id: "rechazado", label: "RECHAZADO" },
];

function statusChip(status) {
  const s = String(status || "").toLowerCase();
  if (s === "aprobado") return <Chip label="APROBADO" color="success" size="small" />;
  if (s === "rechazado") return <Chip label="RECHAZADO" color="error" size="small" />;
  return <Chip label="PENDIENTE" color="warning" size="small" />;
}

/**
 * Normaliza cualquier forma posible del backend:
 * - { total, rows }
 * - { ok:true, data:{ total, rows } }
 * - { data:{ total, rows } }
 * - rows: [] (directo)
 */
function normalizeAdminListResponse(resp) {
  // directo array
  if (Array.isArray(resp)) {
    return { total: resp.length, rows: resp };
  }

  // { ok, data }
  const maybeData = resp?.data ?? resp?.data?.data ?? resp?.data?.rows; // por si viene raro
  const payload = resp?.rows ? resp : (resp?.data && typeof resp.data === "object" ? resp.data : maybeData);

  // si payload ya es { total, rows }
  if (payload && typeof payload === "object") {
    const total = payload.total ?? payload.count ?? 0;
    const rows = Array.isArray(payload.rows) ? payload.rows : Array.isArray(payload.items) ? payload.items : [];
    return { total: Number(total) || 0, rows };
  }

  return { total: 0, rows: [] };
}

export default function AdminPublicaciones() {
  // filtros
  const [status, setStatus] = useState("pendiente");
  const [group, setGroup] = useState("");
  const [q, setQ] = useState("");

  // paginación server-side
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // data
  const [rowsRaw, setRowsRaw] = useState([]); // rows del server (sin filtro local)
  const [rowCount, setRowCount] = useState(0); // total del server (sin filtro local)
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // ✅ métricas
  const [stats, setStats] = useState({ pendiente: 0, aprobado: 0, rechazado: 0 });

  const loadStats = useCallback(async () => {
    try {
      const [p, a, r] = await Promise.all([
        api.publicar.adminList({ status: "pendiente", limit: 1, offset: 0 }),
        api.publicar.adminList({ status: "aprobado", limit: 1, offset: 0 }),
        api.publicar.adminList({ status: "rechazado", limit: 1, offset: 0 }),
      ]);

      const P = normalizeAdminListResponse(p);
      const A = normalizeAdminListResponse(a);
      const R = normalizeAdminListResponse(r);

      setStats({
        pendiente: P.total ?? 0,
        aprobado: A.total ?? 0,
        rechazado: R.total ?? 0,
      });
    } catch {
      // si falla, no truena el panel
      setStats((s) => s);
    }
  }, []);

  const load = useCallback(async () => {
    setErr("");
    setLoading(true);
    try {
      const resp = await api.publicar.adminList({
        status,
        group: group || undefined,
        limit: pageSize,
        offset: page * pageSize,
      });

      const norm = normalizeAdminListResponse(resp);
      setRowsRaw(norm.rows);
      setRowCount(norm.total);
    } catch (e) {
      setErr(e?.message || "No se pudo cargar moderación");
      setRowsRaw([]);
      setRowCount(0);
    } finally {
      setLoading(false);
    }
  }, [status, group, page, pageSize]);

  useEffect(() => {
    load();
    loadStats();
  }, [load, loadStats]);

  async function changeStatus(id, nextStatus) {
    try {
      await api.publicar.adminSetStatus(id, nextStatus);
      await load();
      await loadStats();
      alert(`Publicación ${String(nextStatus).toUpperCase()} correctamente ✅`);
    } catch (e) {
      alert(e?.message || "No se pudo cambiar el estado");
    }
  }

  // ✅ filtro local instantáneo (no afecta rowCount/paginación)
  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rowsRaw;

    return rowsRaw.filter((r) => {
      const d = r.data || {};
      const text = `${d.titulo || ""} ${d.marca || ""} ${d.modelo || ""} ${d.descripcion || ""} ${
        d.empresa || ""
      } ${d.nombreEmpresa || ""}`.toLowerCase();
      return text.includes(term);
    });
  }, [rowsRaw, q]);

  const columns = useMemo(
    () => [
      { field: "id", headerName: "ID", width: 110 },

      {
        field: "group_id",
        headerName: "Grupo",
        width: 150,
        valueGetter: (p) => p.row?.group_id || "—",
      },

      {
        field: "titulo",
        headerName: "Título",
        flex: 1,
        minWidth: 220,
        valueGetter: (p) =>
          p.row?.data?.titulo ||
          `${p.row?.data?.marca || ""} ${p.row?.data?.modelo || ""}`.trim() ||
          "—",
      },

      {
        field: "creador",
        headerName: "User",
        width: 140,
        valueGetter: (p) => (p.row?.user_id ? String(p.row.user_id).slice(0, 8) + "…" : "—"),
      },

      {
        field: "status",
        headerName: "Estado",
        width: 140,
        renderCell: (p) => statusChip(p.value),
      },

      {
        field: "created_at",
        headerName: "Fecha",
        width: 140,
        valueGetter: (p) => (p.row?.created_at ? String(p.row.created_at).slice(0, 10) : "—"),
      },

      {
        field: "acciones",
        headerName: "Acciones",
        width: 320,
        sortable: false,
        filterable: false,
        renderCell: (p) => {
          const id = p.row.id;
          const st = String(p.row.status || "").toLowerCase();

          return (
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              {st !== "aprobado" && (
                <Button size="small" variant="outlined" onClick={() => changeStatus(id, "aprobado")}>
                  Aprobar
                </Button>
              )}

              {st !== "rechazado" && (
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  onClick={() => changeStatus(id, "rechazado")}
                >
                  Rechazar
                </Button>
              )}

              {st !== "pendiente" && (
                <Button
                  size="small"
                  variant="outlined"
                  color="warning"
                  onClick={() => changeStatus(id, "pendiente")}
                >
                  Pendiente
                </Button>
              )}
            </Box>
          );
        },
      },
    ],
    // changeStatus usa load/loadStats que ya están estables por useCallback
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 900, mb: 2 }}>
        Admin Panel — Moderación de publicaciones
      </Typography>

      {/* ✅ métricas */}
      <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
        <Paper sx={{ p: 2, borderRadius: 3, flex: 1, minWidth: 220 }}>
          <Typography sx={{ fontWeight: 900 }}>Pendientes</Typography>
          <Typography variant="h4" sx={{ fontWeight: 900, color: "warning.main" }}>
            {stats.pendiente}
          </Typography>
        </Paper>

        <Paper sx={{ p: 2, borderRadius: 3, flex: 1, minWidth: 220 }}>
          <Typography sx={{ fontWeight: 900 }}>Aprobadas</Typography>
          <Typography variant="h4" sx={{ fontWeight: 900, color: "success.main" }}>
            {stats.aprobado}
          </Typography>
        </Paper>

        <Paper sx={{ p: 2, borderRadius: 3, flex: 1, minWidth: 220 }}>
          <Typography sx={{ fontWeight: 900 }}>Rechazadas</Typography>
          <Typography variant="h4" sx={{ fontWeight: 900, color: "error.main" }}>
            {stats.rechazado}
          </Typography>
        </Paper>
      </Box>

      <Paper sx={{ p: 2, borderRadius: 3, mb: 2 }}>
        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "center" }}>
          <FormControl size="small" sx={{ minWidth: 190 }}>
            <InputLabel id="st">Estado</InputLabel>
            <Select
              labelId="st"
              label="Estado"
              value={status}
              onChange={(e) => {
                setPage(0);
                setStatus(e.target.value);
              }}
            >
              {STATUS_OPTIONS.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel id="gr">Categoría</InputLabel>
            <Select
              labelId="gr"
              label="Categoría"
              value={group}
              onChange={(e) => {
                setPage(0);
                setGroup(e.target.value);
              }}
            >
              <MenuItem value="">Todas</MenuItem>
              {(GROUPS || []).map((g) => (
                <MenuItem key={g.id} value={g.id}>
                  {g.title ?? g.label ?? g.name ?? g.id}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            size="small"
            label="Buscar (local)"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            sx={{ minWidth: 260, flex: 1 }}
          />

          <Button
            variant="contained"
            onClick={() => {
              load();
              loadStats();
            }}
          >
            Recargar
          </Button>

          <Button
            variant="outlined"
            onClick={() => {
              setStatus("pendiente");
              setGroup("");
              setQ("");
              setPage(0);
              setPageSize(10);
            }}
          >
            Reset
          </Button>
        </Box>

        <Divider sx={{ my: 2 }} />

        {err && (
          <Typography sx={{ color: "error.main", fontWeight: 900, mb: 1 }}>
            ❌ {err}
          </Typography>
        )}

        <Box sx={{ height: 560 }}>
          <DataGrid
            rows={rows}
            columns={columns}
            loading={loading}
            getRowId={(r) => r.id}
            rowCount={rowCount}
            paginationMode="server"
            paginationModel={{ page, pageSize }}
            onPaginationModelChange={(m) => {
              setPage(m.page);
              setPageSize(m.pageSize);
            }}
            pageSizeOptions={[10, 20, 50]}
            disableRowSelectionOnClick
          />
        </Box>

        <Typography sx={{ opacity: 0.7, fontSize: 12, mt: 1 }}>
          Nota: el buscador es local (sobre la página actual). La paginación viene del backend.
        </Typography>
      </Paper>
    </Box>
  );
}

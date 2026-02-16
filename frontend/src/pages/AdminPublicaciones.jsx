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
import { GROUPS } from "../config/catalogoConfig";

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
 * Compat MUI X:
 * - Firma vieja: (params) => params.row
 * - Firma nueva (v8): (value, row) => row
 */
function pickRow(args0, args1) {
  // v8: (value, row)
  if (args1 && typeof args1 === "object") return args1;
  // vieja: (params)
  if (args0 && typeof args0 === "object" && args0.row) return args0.row;
  return null;
}

function normalizeAdminListResponse(resp) {
  if (Array.isArray(resp)) return { total: resp.length, rows: resp };

  const payload =
    resp?.rows
      ? resp
      : resp?.data && typeof resp.data === "object"
        ? resp.data
        : resp?.data?.data;

  if (payload && typeof payload === "object") {
    const total = payload.total ?? payload.count ?? 0;
    const rows = Array.isArray(payload.rows)
      ? payload.rows
      : Array.isArray(payload.items)
        ? payload.items
        : [];
    return { total: Number(total) || 0, rows };
  }

  return { total: 0, rows: [] };
}

export default function AdminPublicaciones() {
  const [status, setStatus] = useState("pendiente");
  const [group, setGroup] = useState("");
  const [q, setQ] = useState("");

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const [rowsRaw, setRowsRaw] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

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
      setRowsRaw(norm.rows || []);
      setRowCount(norm.total || 0);
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

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rowsRaw;

    return rowsRaw.filter((r) => {
      const d = r?.data || {};
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
        valueGetter: (a0, a1) => {
          const row = pickRow(a0, a1);
          return row?.group_id || "—";
        },
      },

      {
        field: "titulo",
        headerName: "Título",
        flex: 1,
        minWidth: 220,
        valueGetter: (a0, a1) => {
          const row = pickRow(a0, a1);
          const d = row?.data || {};
          return d.titulo || `${d.marca || ""} ${d.modelo || ""}`.trim() || "—";
        },
      },

      {
        field: "creador",
        headerName: "User",
        width: 140,
        valueGetter: (a0, a1) => {
          const row = pickRow(a0, a1);
          return row?.user_id ? String(row.user_id).slice(0, 8) + "…" : "—";
        },
      },

      {
        field: "status",
        headerName: "Estado",
        width: 140,
        renderCell: (params) => statusChip(params.value),
      },

      {
        field: "created_at",
        headerName: "Fecha",
        width: 140,
        valueGetter: (a0, a1) => {
          const row = pickRow(a0, a1);
          return row?.created_at ? String(row.created_at).slice(0, 10) : "—";
        },
      },

      {
        field: "acciones",
        headerName: "Acciones",
        width: 320,
        sortable: false,
        filterable: false,
        renderCell: (params) => {
          const id = params.row?.id;
          const st = String(params.row?.status || "").toLowerCase();

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
    []
  );

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 900, mb: 2 }}>
        Admin Panel — Moderación de publicaciones
      </Typography>

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

        <Box sx={{ height: "70vh", minHeight: 560, width: "100%" }}>
          <DataGrid
            rows={rows}
            columns={columns}
            loading={loading}
            getRowId={(r) => r?.id ?? `${r?.group_id ?? "x"}-${r?.created_at ?? Math.random()}`}
            rowCount={rowCount}
            paginationMode="server"
            paginationModel={{ page, pageSize }}
            onPaginationModelChange={(m) => {
              setPage(m.page);
              setPageSize(m.pageSize);
            }}
            pageSizeOptions={[10, 20, 50]}
            disableRowSelectionOnClick
            sx={{
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 2,
              bgcolor: "rgba(255,255,255,0.03)",
              color: "rgba(255,255,255,0.9)",
              "& .MuiDataGrid-columnHeaders": {
                bgcolor: "rgba(255,255,255,0.05)",
                borderBottom: "1px solid rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.92)",
              },
              "& .MuiDataGrid-columnHeaderTitle": {
                fontWeight: 900,
              },
              "& .MuiDataGrid-cell": {
                borderBottom: "1px solid rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.9)",
              },
              "& .MuiDataGrid-footerContainer": {
                borderTop: "1px solid rgba(255,255,255,0.12)",
                bgcolor: "rgba(255,255,255,0.03)",
                color: "rgba(255,255,255,0.85)",
              },
              "& .MuiTablePagination-root": {
                color: "rgba(255,255,255,0.85)",
              },
              "& .MuiDataGrid-iconSeparator": {
                opacity: 0.4,
              },
            }}
          />
        </Box>

        <Typography sx={{ opacity: 0.7, fontSize: 12, mt: 1 }}>
          Nota: el buscador es local (sobre la página actual). La paginación viene del backend.
        </Typography>
      </Paper>
    </Box>
  );
}

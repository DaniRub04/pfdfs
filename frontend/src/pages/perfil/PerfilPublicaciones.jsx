import { useEffect, useMemo, useState } from "react";
import {
  Typography,
  Paper,
  Box,
  Divider,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { api } from "../../services/api";
import { getGroupConfig } from "../../config/catalogoConfig";

function Field({ field, value, onChange }) {
  const common = {
    value: value ?? "",
    onChange: (e) => onChange(e.target.value),
    style: {
      width: "100%",
      padding: 10,
      borderRadius: 10,
      border: "1px solid rgba(255,255,255,0.18)",
      background: "rgba(255,255,255,0.04)",
      color: "inherit",
      outline: "none",
    },
  };

  if (field.type === "textarea") return <textarea rows={4} {...common} />;
  if (field.type === "select") {
    return (
      <select {...common}>
        <option value="">Selecciona...</option>
        {(field.options || []).map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    );
  }
  return <input type={field.type || "text"} {...common} />;
}

export default function PerfilPublicaciones() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState(null); // row actual
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  async function load() {
    setErr("");
    setLoading(true);
    try {
      const data = await api.publicar.myList({ limit: 200 });
      const list = Array.isArray(data) ? data : data?.items || [];
      setItems(list);
    } catch (e) {
      setErr(e?.message || "Error al cargar tus publicaciones");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const mapped = useMemo(() => {
    return items.map((row) => ({
      ...row,
      _data: row?.data && typeof row.data === "object" ? row.data : {},
    }));
  }, [items]);

  function openEdit(row) {
    setEditing(row);
    setEditForm(row._data || {});
    setEditOpen(true);
  }

  function setField(name, val) {
    setEditForm((prev) => ({ ...prev, [name]: val }));
  }

  async function saveEdit() {
    if (!editing) return;
    setSaving(true);
    try {
      await api.publicar.update(editing.id, { data: editForm });
      setEditOpen(false);
      setEditing(null);
      await load();
    } catch (e) {
      alert(e?.message || "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  }

  async function remove(row) {
    if (!confirm("¿Eliminar esta publicación? Esto no se puede deshacer.")) return;
    try {
      await api.publicar.remove(row.id);
      await load();
    } catch (e) {
      alert(e?.message || "No se pudo eliminar");
    }
  }

  async function changeStatus(row, nextStatus) {
    try {
      await api.publicar.setStatus(row.id, nextStatus);
      await load();
    } catch (e) {
      alert(e?.message || "No se pudo cambiar el estado");
    }
  }

  return (
    <>
      <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", mb: 2 }}>
        <Typography sx={{ fontWeight: 900 }}>Mis publicaciones</Typography>
        <Button variant="outlined" onClick={load} disabled={loading}>
          Recargar
        </Button>
      </Box>

      {loading ? (
        <Typography sx={{ opacity: 0.8 }}>Cargando...</Typography>
      ) : err ? (
        <Typography sx={{ color: "error.main" }}>❌ {err}</Typography>
      ) : mapped.length === 0 ? (
        <Typography sx={{ opacity: 0.8 }}>Aún no tienes publicaciones.</Typography>
      ) : (
        <Box sx={{ display: "grid", gap: 2 }}>
          {mapped.map((row) => {
            const p = row._data || {};
            const title = p.titulo || p.nombre || "Publicación";
            const desc = p.descripcion || "Sin descripción.";
            const estado = row.status || "pendiente";

            return (
              <Paper key={row.id} sx={{ p: 2, borderRadius: 3 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                  <Box>
                    <Typography sx={{ fontWeight: 900 }}>{title}</Typography>
                    <Typography sx={{ opacity: 0.7, fontSize: 13 }}>
                      Grupo: {row.group_id} · {new Date(row.created_at).toLocaleString()}
                    </Typography>
                  </Box>

                  <Chip
                    label={estado}
                    size="small"
                    color={
                      estado === "aprobado" ? "success" : estado === "rechazado" ? "error" : "warning"
                    }
                  />
                </Box>

                <Divider sx={{ my: 1.5 }} />

                <Typography sx={{ opacity: 0.9, fontSize: 14 }}>{desc}</Typography>

                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 2 }}>
                  <Button variant="outlined" onClick={() => openEdit(row)}>
                    Editar
                  </Button>

                  <Button
                    variant="outlined"
                    onClick={() => remove(row)}
                    sx={{ borderColor: "rgba(255,59,129,0.45)" }}
                  >
                    Eliminar
                  </Button>

                  {/* ⚠️ Si luego metes rol admin, mueve esto a un panel admin */}
                  <Button variant="outlined" onClick={() => changeStatus(row, "pendiente")}>
                    Pendiente
                  </Button>
                  <Button variant="outlined" onClick={() => changeStatus(row, "aprobado")}>
                    Aprobar
                  </Button>
                  <Button variant="outlined" onClick={() => changeStatus(row, "rechazado")}>
                    Rechazar
                  </Button>
                </Box>
              </Paper>
            );
          })}
        </Box>
      )}

      {/* Dialog editar */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Editar publicación</DialogTitle>
        <DialogContent dividers>
          {!editing ? null : (() => {
            const cfg = getGroupConfig(editing.group_id);
            const schema = cfg?.publishSchema || [];

            return (
              <Box sx={{ display: "grid", gap: 2 }}>
                <Typography sx={{ opacity: 0.8, fontSize: 13 }}>
                  Grupo: <b>{cfg?.title || editing.group_id}</b>
                </Typography>

                {schema.map((f) => (
                  <Box key={f.name}>
                    <Typography sx={{ fontWeight: 800, mb: 0.5 }}>
                      {f.label} {f.required ? "*" : ""}
                    </Typography>
                    <Field field={f} value={editForm[f.name]} onChange={(v) => setField(f.name, v)} />
                  </Box>
                ))}
              </Box>
            );
          })()}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setEditOpen(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={saveEdit} variant="contained" disabled={saving}>
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}


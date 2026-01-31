import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";

const emptyForm = {
  marca: "",
  modelo: "",
  anio: "",
  precio: "",
  estado: "disponible",
  descripcion: "",
};

export default function Autos() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // modal
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("create"); // create | edit
  const [currentId, setCurrentId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  // filtro
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((x) =>
      `${x.marca} ${x.modelo} ${x.estado} ${x.descripcion || ""}`
        .toLowerCase()
        .includes(s)
    );
  }, [items, q]);

  async function refresh() {
    setErr("");
    setLoading(true);
    try {
      const data = await api.autosList();
      // tu backend puede devolver {items: []} o [] — soportamos ambos:
      const list = Array.isArray(data) ? data : data.items || [];
      setItems(list);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  function openCreate() {
    setMode("create");
    setCurrentId(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(item) {
    setMode("edit");
    setCurrentId(item.id);
    setForm({
      marca: item.marca || "",
      modelo: item.modelo || "",
      anio: item.anio ?? "",
      precio: item.precio ?? "",
      estado: item.estado || "disponible",
      descripcion: item.descripcion || "",
    });
    setOpen(true);
  }

  function closeModal() {
    setOpen(false);
    setErr("");
  }

  function onChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function normalizePayload(f) {
    // convierte a números donde corresponde
    return {
      marca: f.marca.trim(),
      modelo: f.modelo.trim(),
      anio: f.anio === "" ? null : Number(f.anio),
      precio: f.precio === "" ? null : Number(f.precio),
      estado: f.estado,
      descripcion: f.descripcion.trim(),
    };
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");

    // validación rápida
    if (!form.marca.trim() || !form.modelo.trim()) {
      setErr("Marca y modelo son obligatorios.");
      return;
    }

    try {
      const payload = normalizePayload(form);

      if (mode === "create") {
        await api.autosCreate(payload);
      } else {
        await api.autosUpdate(currentId, payload);
      }

      closeModal();
      await refresh();
    } catch (e2) {
      setErr(e2.message);
    }
  }

  async function onDelete(id) {
    if (!confirm("¿Seguro que quieres eliminar este auto?")) return;
    setErr("");
    try {
      await api.autosDelete(id);
      await refresh();
    } catch (e) {
      setErr(e.message);
    }
  }

  return (
    <div style={styles.page}>
      <header style={styles.topbar}>
        <div>
          <h1 style={styles.title}>Autos</h1>
          <p style={styles.subtitle}>Administra tu inventario</p>
        </div>

        <div style={styles.actions}>
          <Link to="/dashboard" style={styles.linkBtn}>
            Volver
          </Link>
          <button style={styles.primaryBtn} onClick={openCreate}>
            + Nuevo auto
          </button>
        </div>
      </header>

      <section style={styles.toolbar}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por marca, modelo, estado..."
          style={styles.search}
        />
        <button style={styles.ghostBtn} onClick={refresh}>
          Recargar
        </button>
      </section>

      {err && <div style={styles.errorBox}>❌ {err}</div>}

      {loading ? (
        <div style={styles.loading}>Cargando autos...</div>
      ) : filtered.length === 0 ? (
        <div style={styles.empty}>
          <p style={{ margin: 0, fontWeight: 700 }}>No hay autos todavía</p>
          <p style={{ marginTop: 6, opacity: 0.75 }}>
            Crea el primero con “Nuevo auto”.
          </p>
          <button style={styles.primaryBtn} onClick={openCreate}>
            + Nuevo auto
          </button>
        </div>
      ) : (
        <section style={styles.grid}>
          {filtered.map((x) => (
            <article key={x.id} style={styles.card}>
              <div style={styles.cardHead}>
                <div>
                  <p style={styles.cardTitle}>
                    {x.marca} {x.modelo}
                  </p>
                  <p style={styles.cardMeta}>
                    {x.anio ?? "—"} ·{" "}
                    {x.precio != null ? `$${Number(x.precio).toLocaleString()}` : "—"}
                  </p>
                </div>

                <span style={badgeStyle(x.estado)}>{x.estado}</span>
              </div>

              {x.descripcion ? (
                <p style={styles.cardDesc}>{x.descripcion}</p>
              ) : (
                <p style={{ ...styles.cardDesc, opacity: 0.6 }}>
                  Sin descripción.
                </p>
              )}

              <div style={styles.cardFooter}>
                <button style={styles.smallBtn} onClick={() => openEdit(x)}>
                  Editar
                </button>
                <button
                  style={{ ...styles.smallBtn, ...styles.dangerBtn }}
                  onClick={() => onDelete(x.id)}
                >
                  Eliminar
                </button>
              </div>
            </article>
          ))}
        </section>
      )}

      {/* MODAL */}
      {open && (
        <div style={styles.modalOverlay} onMouseDown={closeModal}>
          <div style={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                <h2 style={{ margin: 0 }}>
                  {mode === "create" ? "Nuevo auto" : "Editar auto"}
                </h2>
                <p style={{ margin: "6px 0 0", opacity: 0.75 }}>
                  Completa la información del vehículo
                </p>
              </div>
              <button style={styles.iconBtn} onClick={closeModal} aria-label="Cerrar">
                ✕
              </button>
            </div>

            {err && <div style={styles.errorBox}>❌ {err}</div>}

            <form onSubmit={onSubmit} style={styles.form}>
              <div style={styles.row}>
                <div style={styles.field}>
                  <label style={styles.label}>Marca *</label>
                  <input
                    name="marca"
                    value={form.marca}
                    onChange={onChange}
                    style={styles.input}
                    placeholder="Toyota"
                    autoFocus
                  />
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Modelo *</label>
                  <input
                    name="modelo"
                    value={form.modelo}
                    onChange={onChange}
                    style={styles.input}
                    placeholder="Corolla"
                  />
                </div>
              </div>

              <div style={styles.row}>
                <div style={styles.field}>
                  <label style={styles.label}>Año</label>
                  <input
                    name="anio"
                    value={form.anio}
                    onChange={onChange}
                    style={styles.input}
                    placeholder="2020"
                    inputMode="numeric"
                  />
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Precio</label>
                  <input
                    name="precio"
                    value={form.precio}
                    onChange={onChange}
                    style={styles.input}
                    placeholder="245000"
                    inputMode="numeric"
                  />
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Estado</label>
                  <select
                    name="estado"
                    value={form.estado}
                    onChange={onChange}
                    style={styles.input}
                  >
                    <option value="disponible">disponible</option>
                    <option value="apartado">apartado</option>
                    <option value="vendido">vendido</option>
                  </select>
                </div>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Descripción</label>
                <textarea
                  name="descripcion"
                  value={form.descripcion}
                  onChange={onChange}
                  style={{ ...styles.input, minHeight: 90, resize: "vertical" }}
                  placeholder="Automático, único dueño, servicios al día..."
                />
              </div>

              <div style={styles.formFooter}>
                <button type="button" style={styles.ghostBtn} onClick={closeModal}>
                  Cancelar
                </button>
                <button type="submit" style={styles.primaryBtn}>
                  {mode === "create" ? "Guardar" : "Actualizar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* =======================
   Styles (pro)
======================= */
const styles = {
  page: {
    maxWidth: 1100,
    margin: "48px auto",
    padding: 20,
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial',
  },
  topbar: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 18,
  },
  title: { margin: 0, fontSize: 34, letterSpacing: -0.6 },
  subtitle: { margin: "6px 0 0", opacity: 0.75 },

  actions: { display: "flex", gap: 10, alignItems: "center" },
  linkBtn: {
    textDecoration: "none",
    padding: "10px 14px",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    color: "#111827",
    background: "#fff",
  },

  toolbar: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    marginBottom: 16,
  },
  search: {
    flex: 1,
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    outline: "none",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 14,
  },

  card: {
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    padding: 16,
    background: "#fff",
    boxShadow: "0 8px 30px rgba(0,0,0,0.04)",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  cardHead: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    alignItems: "flex-start",
  },
  cardTitle: { margin: 0, fontWeight: 800, fontSize: 18 },
  cardMeta: { margin: "6px 0 0", opacity: 0.7, fontSize: 13 },
  cardDesc: { margin: 0, lineHeight: 1.4, opacity: 0.9 },
  cardFooter: { display: "flex", gap: 10, marginTop: "auto" },

  primaryBtn: {
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid #111827",
    background: "#111827",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
  },
  ghostBtn: {
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: "#fff",
    color: "#111827",
    fontWeight: 700,
    cursor: "pointer",
  },
  smallBtn: {
    padding: "9px 12px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: "#fff",
    cursor: "pointer",
    fontWeight: 700,
  },
  dangerBtn: {
    border: "1px solid #fecaca",
    color: "#b91c1c",
    background: "#fff",
  },

  errorBox: {
    background: "#fff1f2",
    border: "1px solid #fecdd3",
    color: "#9f1239",
    padding: "10px 12px",
    borderRadius: 12,
    marginBottom: 14,
    fontWeight: 700,
  },

  loading: { padding: 18, opacity: 0.8 },
  empty: {
    border: "1px dashed #e5e7eb",
    borderRadius: 16,
    padding: 22,
    background: "#fafafa",
    display: "grid",
    gap: 10,
    justifyItems: "start",
  },

  // modal
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.35)",
    display: "grid",
    placeItems: "center",
    padding: 18,
  },
  modal: {
    width: "min(760px, 100%)",
    background: "#fff",
    borderRadius: 18,
    border: "1px solid #e5e7eb",
    boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
    padding: 16,
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    padding: 6,
    marginBottom: 10,
  },
  iconBtn: {
    border: "1px solid #e5e7eb",
    background: "#fff",
    borderRadius: 12,
    padding: "8px 10px",
    cursor: "pointer",
    fontWeight: 900,
  },

  form: { padding: 6, display: "grid", gap: 12 },
  row: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 },
  field: { display: "grid", gap: 6 },
  label: { fontSize: 13, fontWeight: 800, opacity: 0.8 },
  input: {
    padding: "12px 12px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    outline: "none",
  },
  formFooter: { display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 6 },
};

function badgeStyle(estado) {
  const base = {
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 800,
    border: "1px solid #e5e7eb",
    background: "#f9fafb",
    color: "#111827",
    whiteSpace: "nowrap",
  };

  if (estado === "vendido") return { ...base, background: "#fee2e2", borderColor: "#fecaca", color: "#991b1b" };
  if (estado === "apartado") return { ...base, background: "#ffedd5", borderColor: "#fed7aa", color: "#9a3412" };
  return { ...base, background: "#dcfce7", borderColor: "#bbf7d0", color: "#166534" };
}

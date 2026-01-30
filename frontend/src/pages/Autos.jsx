import { useEffect, useMemo, useState } from "react";
import { api, isLoggedIn } from "../services/api";

const emptyForm = {
  marca: "",
  modelo: "",
  anio: "",
  precio: "",
  descripcion: "",
};

export default function Autos() {
  const [autos, setAutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const logged = useMemo(() => isLoggedIn(), []);

  async function cargarAutos() {
    try {
      setError("");
      setLoading(true);
      const data = await api.autos.list();
      setAutos(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargarAutos();
  }, []);

  function onChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function startEdit(auto) {
    setEditingId(auto.id);
    setForm({
      marca: auto.marca ?? "",
      modelo: auto.modelo ?? "",
      anio: auto.anio ?? "",
      precio: auto.precio ?? "",
      descripcion: auto.descripcion ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function onSubmit(e) {
    e.preventDefault();
    try {
      setError("");

      // Validación mínima
      if (!form.marca || !form.modelo) {
        throw new Error("Marca y modelo son obligatorios.");
      }

      const payload = {
        ...form,
        anio: form.anio ? Number(form.anio) : null,
        precio: form.precio ? Number(form.precio) : null,
      };

      if (!logged) {
        throw new Error("Necesitas iniciar sesión para crear/editar.");
      }

      if (editingId) {
        const updated = await api.autos.update(editingId, payload);
        setAutos((prev) =>
          prev.map((a) => (a.id === editingId ? updated : a))
        );
      } else {
        const created = await api.autos.create(payload);
        setAutos((prev) => [created, ...prev]);
      }

      cancelEdit();
    } catch (e2) {
      setError(e2.message);
    }
  }

  async function onDelete(id) {
    try {
      setError("");
      if (!logged) throw new Error("Necesitas iniciar sesión para eliminar.");

      const ok = confirm("¿Seguro que quieres eliminar este auto?");
      if (!ok) return;

      await api.autos.remove(id);
      setAutos((prev) => prev.filter((a) => a.id !== id));
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 16 }}>
      <h1 style={{ marginBottom: 6 }}>Autos</h1>
      <p style={{ opacity: 0.8, marginTop: 0 }}>
        CRUD en cards (Supabase + Render + Vercel)
      </p>

      {!logged && (
        <div
          style={{
            background: "#fff3cd",
            padding: 12,
            borderRadius: 10,
            marginBottom: 12,
            border: "1px solid #ffeeba",
          }}
        >
          Estás en modo lectura. Para crear/editar/eliminar, inicia sesión.
        </div>
      )}

      {error && (
        <div
          style={{
            background: "#ffe5e5",
            padding: 12,
            borderRadius: 10,
            marginBottom: 12,
            border: "1px solid #ffb3b3",
          }}
        >
          {error}
        </div>
      )}

      {/* Form */}
      <form
        onSubmit={onSubmit}
        style={{
          background: "#111",
          color: "white",
          padding: 16,
          borderRadius: 14,
          marginBottom: 18,
        }}
      >
        <h2 style={{ marginTop: 0 }}>
          {editingId ? "Editar auto" : "Registrar auto"}
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 10,
          }}
        >
          <input
            name="marca"
            placeholder="Marca"
            value={form.marca}
            onChange={onChange}
            style={inputStyle}
          />
          <input
            name="modelo"
            placeholder="Modelo"
            value={form.modelo}
            onChange={onChange}
            style={inputStyle}
          />
          <input
            name="anio"
            placeholder="Año"
            value={form.anio}
            onChange={onChange}
            style={inputStyle}
          />
          <input
            name="precio"
            placeholder="Precio"
            value={form.precio}
            onChange={onChange}
            style={inputStyle}
          />
        </div>

        <textarea
          name="descripcion"
          placeholder="Descripción"
          value={form.descripcion}
          onChange={onChange}
          style={{ ...inputStyle, marginTop: 10, height: 90 }}
        />

        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
          <button type="submit" style={btnPrimary}>
            {editingId ? "Guardar cambios" : "Crear"}
          </button>

          {editingId && (
            <button type="button" onClick={cancelEdit} style={btnSecondary}>
              Cancelar
            </button>
          )}

          <button type="button" onClick={cargarAutos} style={btnSecondary}>
            Recargar
          </button>
        </div>
      </form>

      {/* Cards */}
      {loading ? (
        <p>Cargando...</p>
      ) : autos.length === 0 ? (
        <p>No hay autos todavía.</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 12,
          }}
        >
          {autos.map((a) => (
            <div key={a.id} style={card}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <h3 style={{ margin: 0 }}>
                  {a.marca} {a.modelo}
                </h3>
                <span style={badge}>{a.estado || "disponible"}</span>
              </div>

              <p style={{ margin: "8px 0", opacity: 0.85 }}>
                <b>Año:</b> {a.anio ?? "-"} <br />
                <b>Precio:</b>{" "}
                {a.precio != null
                  ? Number(a.precio).toLocaleString("es-MX")
                  : "-"}
              </p>

              {a.descripcion && (
                <p style={{ margin: "8px 0", opacity: 0.85 }}>
                  {a.descripcion}
                </p>
              )}

              <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                <button
                  onClick={() => startEdit(a)}
                  style={btnSecondarySmall}
                  disabled={!logged}
                  title={!logged ? "Inicia sesión para editar" : "Editar"}
                >
                  Editar
                </button>
                <button
                  onClick={() => onDelete(a.id)}
                  style={btnDangerSmall}
                  disabled={!logged}
                  title={!logged ? "Inicia sesión para eliminar" : "Eliminar"}
                >
                  Eliminar
                </button>
              </div>

              <small style={{ opacity: 0.65 }}>
                Creado:{" "}
                {a.creado_en ? new Date(a.creado_en).toLocaleString() : "-"}
              </small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ===== estilos inline simples ===== */
const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #333",
  outline: "none",
  background: "#1b1b1b",
  color: "white",
};

const btnPrimary = {
  padding: "10px 14px",
  borderRadius: 10,
  border: "0",
  cursor: "pointer",
  background: "#1B7F5C",
  color: "white",
  fontWeight: 700,
};

const btnSecondary = {
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid #444",
  cursor: "pointer",
  background: "#222",
  color: "white",
};

const btnSecondarySmall = {
  ...btnSecondary,
  padding: "8px 10px",
  flex: 1,
};

const btnDangerSmall = {
  padding: "8px 10px",
  borderRadius: 10,
  border: "1px solid #5b0000",
  cursor: "pointer",
  background: "#330000",
  color: "white",
  flex: 1,
};

const card = {
  background: "#0f0f0f",
  color: "white",
  padding: 14,
  borderRadius: 14,
  border: "1px solid #222",
  boxShadow: "0 6px 18px rgba(0,0,0,0.2)",
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const badge = {
  fontSize: 12,
  background: "#1f2a2a",
  border: "1px solid #2f4a4a",
  padding: "4px 8px",
  borderRadius: 999,
  height: "fit-content",
};

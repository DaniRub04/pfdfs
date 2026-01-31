import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import "../styles/autos.css";

const EMPTY_FORM = {
  marca: "",
  modelo: "",
  anio: "",
  precio: "",
  estado: "disponible",
  descripcion: "",
};

export default function Autos() {
  const nav = useNavigate();

  const [me, setMe] = useState(null);
  const [autos, setAutos] = useState([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null); // auto actual o null
  const [form, setForm] = useState(EMPTY_FORM);

  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  async function loadAll() {
    setError("");
    setLoading(true);
    try {
      const [meData, autosData] = await Promise.all([api.me(), api.autos.list()]);
      setMe(meData);
      setAutos(Array.isArray(autosData) ? autosData : []);
    } catch (e) {
      setError(e.message || "Error cargando datos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  function logout() {
    api.logout();
    nav("/login");
  }

  const autosFiltrados = useMemo(() => {
    const term = q.trim().toLowerCase();
    return autos.filter((a) => {
      const matchText =
        !term ||
        String(a.marca || "").toLowerCase().includes(term) ||
        String(a.modelo || "").toLowerCase().includes(term) ||
        String(a.descripcion || "").toLowerCase().includes(term);

      const matchEstado = !estadoFiltro || a.estado === estadoFiltro;

      return matchText && matchEstado;
    });
  }, [autos, q, estadoFiltro]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError("");
    setModalOpen(true);
  }

  function openEdit(auto) {
    setEditing(auto);
    setForm({
      marca: auto.marca ?? "",
      modelo: auto.modelo ?? "",
      anio: auto.anio ?? "",
      precio: auto.precio ?? "",
      estado: auto.estado ?? "disponible",
      descripcion: auto.descripcion ?? "",
    });
    setError("");
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setModalOpen(false);
    setEditing(null);
    setForm(EMPTY_FORM);
    setError("");
  }

  function onChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function validate() {
    if (!form.marca.trim()) return "Marca es obligatoria";
    if (!form.modelo.trim()) return "Modelo es obligatorio";

    const anio = Number(form.anio);
    if (!Number.isFinite(anio) || anio < 1900 || anio > 2100) {
      return "Año inválido (ej: 2022)";
    }

    const precio = Number(form.precio);
    if (!Number.isFinite(precio) || precio < 0) {
      return "Precio inválido";
    }

    const estados = new Set(["disponible", "vendido", "apartado"]);
    if (!estados.has(form.estado)) return "Estado inválido";

    return "";
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    const msg = validate();
    if (msg) return setError(msg);

    setSaving(true);
    try {
      const payload = {
        marca: form.marca.trim(),
        modelo: form.modelo.trim(),
        anio: Number(form.anio),
        precio: Number(form.precio),
        estado: form.estado,
        descripcion: form.descripcion?.trim() || null,
      };

      if (editing?.id) {
        await api.autos.update(editing.id, payload);
        setToast("✅ Auto actualizado");
      } else {
        await api.autos.create(payload);
        setToast("✅ Auto creado");
      }

      closeModal();
      await loadAll();
      setTimeout(() => setToast(""), 1800);
    } catch (e2) {
      setError(e2.message || "Error guardando");
    } finally {
      setSaving(false);
    }
  }

  async function removeAuto(auto) {
    const ok = confirm(`¿Eliminar ${auto.marca} ${auto.modelo}?`);
    if (!ok) return;

    setError("");
    try {
      await api.autos.remove(auto.id);
      setToast("🗑️ Auto eliminado");
      await loadAll();
      setTimeout(() => setToast(""), 1800);
    } catch (e) {
      setError(e.message || "Error eliminando");
    }
  }

  return (
    <div className="autos-page">
      <header className="autos-topbar">
        <div>
          <h1 className="autos-title">Autos</h1>
          <p className="autos-sub">
            {me ? (
              <>
                Sesión: <b>{me.email}</b>
              </>
            ) : (
              "—"
            )}
          </p>
        </div>

        <div className="autos-actions">
          <button className="btn btn-primary" onClick={openCreate}>
            + Nuevo auto
          </button>
          <button className="btn btn-ghost" onClick={() => nav("/dashboard")}>
            Dashboard
          </button>
          <button className="btn btn-danger" onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      </header>

      <section className="autos-toolbar">
        <input
          className="input"
          placeholder="Buscar marca, modelo o descripción…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        <select
          className="select"
          value={estadoFiltro}
          onChange={(e) => setEstadoFiltro(e.target.value)}
        >
          <option value="">Todos</option>
          <option value="disponible">Disponible</option>
          <option value="apartado">Apartado</option>
          <option value="vendido">Vendido</option>
        </select>

        <button className="btn btn-ghost" onClick={loadAll} disabled={loading}>
          ↻ Recargar
        </button>
      </section>

      {toast && <div className="toast">{toast}</div>}
      {error && <div className="alert">❌ {error}</div>}

      {loading ? (
        <div className="skeleton-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div className="skeleton-card" key={i} />
          ))}
        </div>
      ) : autosFiltrados.length === 0 ? (
        <div className="empty">
          <p>No hay autos que mostrar.</p>
          <button className="btn btn-primary" onClick={openCreate}>
            Crear el primero
          </button>
        </div>
      ) : (
        <div className="cards-grid">
          {autosFiltrados.map((a) => (
            <article className="card" key={a.id}>
              <div className="card-head">
                <div>
                  <div className="card-title">
                    {a.marca} <span className="muted">{a.modelo}</span>
                  </div>
                  <div className="card-meta">
                    <span>{a.anio}</span>
                    <span className="dot" />
                    <span>${Number(a.precio).toLocaleString("es-MX")}</span>
                  </div>
                </div>

                <span className={`badge badge-${a.estado}`}>
                  {a.estado}
                </span>
              </div>

              {a.descripcion && <p className="card-desc">{a.descripcion}</p>}

              <div className="card-footer">
                <button className="btn btn-ghost" onClick={() => openEdit(a)}>
                  Editar
                </button>
                <button className="btn btn-danger" onClick={() => removeAuto(a)}>
                  Eliminar
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* MODAL (sin archivo extra) */}
      {modalOpen && (
        <div className="modal-backdrop" onMouseDown={closeModal}>
          <div
            className="modal"
            onMouseDown={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-head">
              <h2>{editing ? "Editar auto" : "Nuevo auto"}</h2>
              <button className="icon-btn" onClick={closeModal} aria-label="Cerrar">
                ✕
              </button>
            </div>

            <form className="modal-body" onSubmit={submit}>
              {error && <div className="alert">❌ {error}</div>}

              <div className="grid-2">
                <div>
                  <label className="label">Marca</label>
                  <input
                    className="input"
                    name="marca"
                    value={form.marca}
                    onChange={onChange}
                    placeholder="Toyota"
                  />
                </div>
                <div>
                  <label className="label">Modelo</label>
                  <input
                    className="input"
                    name="modelo"
                    value={form.modelo}
                    onChange={onChange}
                    placeholder="Corolla"
                  />
                </div>

                <div>
                  <label className="label">Año</label>
                  <input
                    className="input"
                    name="anio"
                    value={form.anio}
                    onChange={onChange}
                    placeholder="2022"
                    inputMode="numeric"
                  />
                </div>

                <div>
                  <label className="label">Precio</label>
                  <input
                    className="input"
                    name="precio"
                    value={form.precio}
                    onChange={onChange}
                    placeholder="300000"
                    inputMode="numeric"
                  />
                </div>

                <div className="span-2">
                  <label className="label">Estado</label>
                  <select className="select" name="estado" value={form.estado} onChange={onChange}>
                    <option value="disponible">Disponible</option>
                    <option value="apartado">Apartado</option>
                    <option value="vendido">Vendido</option>
                  </select>
                </div>

                <div className="span-2">
                  <label className="label">Descripción</label>
                  <textarea
                    className="textarea"
                    name="descripcion"
                    value={form.descripcion}
                    onChange={onChange}
                    placeholder="Único dueño, automático, etc."
                    rows={4}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={closeModal} disabled={saving}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getGroupConfig } from "../config/catalogoConfig";
import { api } from "../services/api";

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

export default function PublishForm() {
  const { group } = useParams();
  const nav = useNavigate();

  const cfg = useMemo(() => getGroupConfig(group), [group]);

  // ✅ SOLO campos del formulario (data). group NO va aquí.
  const [form, setForm] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // ✅ Si tu schema tiene "categoria", la llenamos por defecto con el grupo y la bloqueamos
  // (así el usuario no la escribe manualmente)
  const schema = useMemo(() => cfg?.publishSchema || [], [cfg]);

  const schemaWithCategory = useMemo(() => {
    const g = String(group || "").trim();
    if (!g) return schema;

    return schema.map((f) => {
      if (String(f?.name || "").toLowerCase() !== "categoria") return f;

      // si ya existe "categoria" en el schema, la volvemos readonly/disabled para el usuario
      return {
        ...f,
        type: "text",
        required: false, // no la forzamos en validación porque la seteamos nosotros
        readOnly: true,
        disabled: true,
        placeholder: g,
      };
    });
  }, [schema, group]);

  // ✅ precarga categoria una sola vez (o cuando cambia el group)
  useEffect(() => {
    const hasCategoria = schema.some((f) => String(f?.name || "").toLowerCase() === "categoria");
    if (!hasCategoria) return;

    const g = String(group || "").trim();
    if (!g) return;

    setForm((prev) => {
      // no pisar si el usuario ya tenía algo (aunque estará disabled, pero por seguridad)
      if (String(prev?.categoria ?? "").trim()) return prev;
      return { ...prev, categoria: g };
    });
  }, [schema, group]);

  if (!cfg) {
    return (
      <div style={{ padding: 24 }}>
        <h1>Grupo no válido</h1>
        <button onClick={() => nav("/publicar")}>Volver</button>
      </div>
    );
  }

  function setField(name, val) {
    // ✅ si es categoria, la protegemos para que no se cambie desde UI
    if (String(name || "").toLowerCase() === "categoria") return;
    setForm((prev) => ({ ...prev, [name]: val }));
  }

  function validate() {
    return schemaWithCategory.filter((f) => {
      // si es categoria y viene bloqueada, no la validamos aquí
      if (String(f?.name || "").toLowerCase() === "categoria") return false;
      return f.required && !String(form[f.name] ?? "").trim();
    });
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (submitting) return;

    const missing = validate();
    if (missing.length) {
      alert("Completa los campos requeridos: " + missing.map((m) => m.label).join(", "));
      return;
    }

    setSubmitting(true);

    try {
      // ✅ fuerza categoria por defecto (aunque no exista en schema)
      const dataToSend = {
        ...form,
        categoria: String(group || "").trim(), // <- default para todos los formularios
      };

      await api.publicar.create({
        group, // va a group_id en BD
        data: dataToSend, // jsonb en BD
      });

      alert("Publicado correctamente ✅");
      nav("/perfil/publicaciones");
    } catch (err) {
      alert("Error al publicar: " + (err?.message || "Error desconocido"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>Publicar en: {cfg.title}</h1>
      <p style={{ opacity: 0.8 }}>{cfg.desc}</p>

      <form onSubmit={onSubmit} style={{ marginTop: 16, maxWidth: 720 }}>
        {(schemaWithCategory || []).map((f) => {
          const isCategoria = String(f?.name || "").toLowerCase() === "categoria";
          const g = String(group || "").trim();

          return (
            <div key={f.name} style={{ marginBottom: 12 }}>
              <label style={{ display: "block", marginBottom: 6 }}>
                {f.label} {f.required ? "*" : ""}
              </label>

              {isCategoria ? (
                <input
                  type="text"
                  value={String(form.categoria ?? g)}
                  disabled
                  style={{
                    width: "100%",
                    padding: 10,
                    borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.18)",
                    background: "rgba(255,255,255,0.03)",
                    color: "inherit",
                    outline: "none",
                    opacity: 0.85,
                    cursor: "not-allowed",
                  }}
                />
              ) : (
                <Field field={f} value={form[f.name]} onChange={(v) => setField(f.name, v)} />
              )}
            </div>
          );
        })}

        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button type="button" onClick={() => nav("/publicar")} disabled={submitting}>
            Cambiar grupo
          </button>

          <button type="submit" disabled={submitting}>
            {submitting ? "Publicando..." : "Publicar"}
          </button>
        </div>
      </form>
    </div>
  );
}
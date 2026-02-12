import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getGroupConfig } from "../config/catalogoConfig";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "https://concesionaria-backend-rskz.onrender.com";

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

  const [form, setForm] = useState({ group });
  const [submitting, setSubmitting] = useState(false);

  if (!cfg) {
    return (
      <div style={{ padding: 24 }}>
        <h1>Grupo no válido</h1>
        <button onClick={() => nav("/publicar")}>
          Volver
        </button>
      </div>
    );
  }

  function setField(name, val) {
    setForm((prev) => ({ ...prev, [name]: val }));
  }

  function validate() {
    const schema = cfg.publishSchema || [];
    return schema.filter(
      (f) => f.required && !String(form[f.name] ?? "").trim()
    );
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (submitting) return;

    const missing = validate();
    if (missing.length) {
      alert(
        "Completa los campos requeridos: " +
          missing.map((m) => m.label).join(", ")
      );
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${API_BASE}/publicar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          group,
          data: form,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        alert(json?.message || "Error al publicar");
        return;
      }

      alert("Publicado correctamente ✅");
      nav("/perfil/publicaciones");
    } catch (err) {
      alert("Error al publicar: " + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>Publicar en: {cfg.title}</h1>
      <p style={{ opacity: 0.8 }}>{cfg.desc}</p>

      <form onSubmit={onSubmit} style={{ marginTop: 16, maxWidth: 720 }}>
        {(cfg.publishSchema || []).map((f) => (
          <div key={f.name} style={{ marginBottom: 12 }}>
            <label style={{ display: "block", marginBottom: 6 }}>
              {f.label} {f.required ? "*" : ""}
            </label>
            <Field
              field={f}
              value={form[f.name]}
              onChange={(v) => setField(f.name, v)}
            />
          </div>
        ))}

        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button
            type="button"
            onClick={() => nav("/publicar")}
            disabled={submitting}
          >
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

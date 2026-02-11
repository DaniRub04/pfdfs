import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getGroupConfig } from "../config/catalogoConfig";

function Field({ field, value, onChange }) {
  const common = {
    value: value ?? "",
    onChange: (e) => onChange(e.target.value),
    style: { width: "100%", padding: 10, borderRadius: 10, border: "1px solid #333", background: "transparent", color: "inherit" },
  };

  if (field.type === "textarea") {
    return <textarea rows={4} {...common} />;
  }

  if (field.type === "select") {
    return (
      <select {...common}>
        <option value="">Selecciona...</option>
        {(field.options || []).map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
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

  if (!cfg) {
    return (
      <div style={{ padding: 24 }}>
        <h1>Grupo no válido</h1>
        <button onClick={() => nav("/publicar")}>Volver</button>
      </div>
    );
  }

  function setField(name, val) {
    setForm((prev) => ({ ...prev, [name]: val }));
  }

  async function onSubmit(e) {
    e.preventDefault();

    // ✅ aquí después conectamos tu backend
    // ejemplo recomendado: POST /publicaciones (body incluye group + payload)
    // por ahora solo lo mostramos:
    console.log("PUBLICAR PAYLOAD:", form);

    alert("Formulario listo. Siguiente paso: conectar endpoint del backend.");
    nav("/perfil/inventario");
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>Publicar en: {cfg.title}</h1>
      <p style={{ opacity: 0.8 }}>{cfg.desc}</p>

      <form onSubmit={onSubmit} style={{ marginTop: 16, maxWidth: 720 }}>
        {cfg.publishSchema.map((f) => (
          <div key={f.name} style={{ marginBottom: 12 }}>
            <label style={{ display: "block", marginBottom: 6, opacity: 0.9 }}>
              {f.label} {f.required ? "*" : ""}
            </label>
            <Field field={f} value={form[f.name]} onChange={(v) => setField(f.name, v)} />
          </div>
        ))}

        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button type="button" onClick={() => nav("/publicar")} style={{ padding: "10px 14px", borderRadius: 10 }}>
            Cambiar grupo
          </button>
          <button type="submit" style={{ padding: "10px 14px", borderRadius: 10 }}>
            Publicar
          </button>
        </div>
      </form>
    </div>
  );
}

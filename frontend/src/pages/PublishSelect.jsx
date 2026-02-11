import { useNavigate } from "react-router-dom";
import { GROUPS } from "../config/catalogConfig";

export default function PublishSelect() {
  const nav = useNavigate();

  return (
    <div style={{ padding: 24 }}>
      <h1>Publicar</h1>
      <p>Selecciona el grupo para mostrar el formulario correcto.</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 16 }}>
        {GROUPS.map((g) => (
          <button
            key={g.id}
            onClick={() => nav(`/publicar/${g.id}`)}
            style={{
              padding: 16,
              borderRadius: 14,
              border: "1px solid #333",
              background: "transparent",
              color: "inherit",
              textAlign: "left",
            }}
          >
            <div style={{ fontWeight: 800, fontSize: 18 }}>{g.title}</div>
            <div style={{ opacity: 0.8, marginTop: 6 }}>{g.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

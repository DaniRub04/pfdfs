import { useNavigate } from "react-router-dom";
import { GROUPS } from "../config/catalogoConfig";

export default function PublishSelect() {
  const nav = useNavigate();

  return (
    <div
      style={{
        padding: "40px 24px",
        maxWidth: 1100,
        margin: "0 auto",
      }}
    >
      <h1 style={{ marginBottom: 8 }}>Publicar</h1>
      <p style={{ opacity: 0.8 }}>
        Selecciona el grupo para mostrar el formulario correcto.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 18,
          marginTop: 28,
        }}
      >
        {GROUPS.map((g) => (
          <button
            key={g.id}
            onClick={() => nav(`/publicar/${g.id}`)}
            style={{
              padding: 20,
              borderRadius: 18,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(255,255,255,0.05)",
              backdropFilter: "blur(10px)",
              color: "inherit",
              textAlign: "left",
              cursor: "pointer",
              transition: "all .2s ease",
              boxShadow: "0 10px 30px rgba(0,0,0,.25)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-6px)";
              e.currentTarget.style.borderColor =
                "rgba(45,212,191,0.45)";
              e.currentTarget.style.boxShadow =
                "0 18px 40px rgba(0,0,0,.35)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.borderColor =
                "rgba(255,255,255,0.14)";
              e.currentTarget.style.boxShadow =
                "0 10px 30px rgba(0,0,0,.25)";
            }}
          >
            <div
              style={{
                fontWeight: 900,
                fontSize: 18,
                marginBottom: 6,
              }}
            >
              {g.title}
            </div>

            <div style={{ opacity: 0.8, fontSize: 14 }}>
              {g.desc}
            </div>
          </button>
        ))}
      </div>

      <div style={{ marginTop: 30 }}>
        <button
          onClick={() => nav("/")}
          style={{
            padding: "10px 16px",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.14)",
            background: "rgba(255,255,255,0.05)",
            color: "inherit",
            cursor: "pointer",
          }}
        >
          ← Volver al inicio
        </button>
      </div>
    </div>
  );
}
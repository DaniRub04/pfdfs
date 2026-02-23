import React, { useMemo } from "react";

/**
 * Normaliza URLs de imagen:
 * - Si te pasan un link de Unsplash tipo: https://unsplash.com/es/fotos/<ID>
 *   lo convertimos a imagen directa: https://source.unsplash.com/<ID>/1200x900
 */
function normalizeImageUrl(url) {
  const u = String(url || "").trim();
  if (!u) return "";

  // Unsplash page -> direct image
  const m = u.match(/unsplash\.com\/.*\/fotos\/([a-zA-Z0-9_-]+)/);
  if (m?.[1]) return `https://source.unsplash.com/${m[1]}/1200x900`;

  return u;
}

function toNumberOrNull(v) {
  if (v == null || v === "") return null;
  const n = Number(String(v).replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function fmtMoneyMXN(v) {
  const n = toNumberOrNull(v);
  if (n == null) return "—";
  return `$${n.toLocaleString("es-MX")} MXN`;
}

function pickFirst(...vals) {
  for (const v of vals) {
    if (v == null) continue;
    const s = String(v).trim();
    if (s) return s;
  }
  return "";
}

function prettyLabel(key) {
  const k = String(key || "").trim();
  if (!k) return "";
  const map = {
    titulo: "Título",
    nombre: "Nombre",
    descripcion: "Descripción",
    precio: "Precio",
    marca: "Marca",
    modelo: "Modelo",
    anio: "Año",
    año: "Año",
    kilometraje: "Kilometraje",
    ubicacion: "Ubicación",
    ubicación: "Ubicación",
    ciudad: "Ciudad",
    estado: "Estado",
    telefono: "Teléfono",
    teléfono: "Teléfono",
    whatsapp: "WhatsApp",
    email: "Email",
    correo: "Correo",
    empresa: "Empresa",
    nombreEmpresa: "Empresa",
    universidad: "Universidad",
    institucion: "Institución",
    institución: "Institución",
  };
  if (map[k]) return map[k];
  // "snake_case" -> "Snake case"
  return k
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatValue(key, value) {
  if (value == null) return "";
  // si es precio, formatea moneda
  const k = String(key || "").toLowerCase();
  if (k === "precio") return fmtMoneyMXN(value);

  // arrays cortos
  if (Array.isArray(value)) {
    const flat = value
      .map((x) => (x == null ? "" : String(x).trim()))
      .filter(Boolean);
    return flat.slice(0, 3).join(", ") + (flat.length > 3 ? "…" : "");
  }

  // objetos -> no lo pintamos tal cual (evitar JSON gigante)
  if (typeof value === "object") return "";

  return String(value).trim();
}

export default function PublicationCard({ row, onViewCatalog }) {
  // ✅ Acepta tanto row._data (Landing/Catalogo) como row.data (Admin, etc.)
  const p = row?._data || row?.data || {};

  const rawImg = p?.foto_url || p?.imagenes?.[0] || "";
  const imgSrc = normalizeImageUrl(rawImg);

  const title = pickFirst(p?.titulo, p?.nombre, "Publicación");
  const desc = pickFirst(p?.descripcion, "Sin descripción.");

  // Estado (badge)
  const estado = String(p?.estado || "disponible").toLowerCase();

  // Precio
  const precioLabel = fmtMoneyMXN(p?.precio);

  // Campos “comunes” (si existen)
  const marca = pickFirst(p?.marca);
  const modelo = pickFirst(p?.modelo);
  const anio = pickFirst(p?.anio, p?.año);
  const ubicacion = pickFirst(p?.ubicacion, p?.ubicación, p?.ciudad);
  const telefono = pickFirst(p?.telefono, p?.teléfono);
  const whatsapp = pickFirst(p?.whatsapp);
  const empresa = pickFirst(p?.empresa, p?.nombreEmpresa);

  // ✅ Detalles dinámicos (para no perder campos)
  const extraDetails = useMemo(() => {
    // keys que ya mostramos arriba o que no conviene listar
    const skip = new Set([
      "foto_url",
      "imagenes",
      "image",
      "img",
      "titulo",
      "nombre",
      "descripcion",
      "precio",
      "estado",
      "marca",
      "modelo",
      "anio",
      "año",
      "ubicacion",
      "ubicación",
      "ciudad",
      "telefono",
      "teléfono",
      "whatsapp",
      "empresa",
      "nombreEmpresa",
      "group",
      "group_id",
      "id",
      "user_id",
      "created_at",
      "updated_at",
    ]);

    if (!p || typeof p !== "object") return [];

    const entries = Object.entries(p)
      .filter(([k, v]) => !skip.has(String(k).trim()) && v != null && v !== "")
      .map(([k, v]) => {
        const value = formatValue(k, v);
        return value ? { key: k, label: prettyLabel(k), value } : null;
      })
      .filter(Boolean);

    // limita para que no se haga enorme en landing
    return entries.slice(0, 6);
  }, [p]);

  return (
    <article className="lp-card">
      <div className={`lp-card-img ${!imgSrc ? "lp-card-img--placeholder" : ""}`}>
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={title}
            className="lp-card-img__img"
            loading="lazy"
          />
        ) : (
          <>
            <div className="lp-card-img__brand">
              SELECTA<span>PLAZA</span>
            </div>
            <div className="lp-card-img__meta">
              <span>{title}</span>
              <span className="lp-dot" />
              <span>{row?.group_id || "—"}</span>
            </div>
          </>
        )}
      </div>

      <div className="lp-card-body">
        <div className="lp-card-head">
          <div>
            <div className="lp-card-title">{title}</div>

            <div className="lp-card-meta">
              <span>{row?.group_id || "—"}</span>
              <span className="lp-dot" />
              <span>{precioLabel}</span>
            </div>

            {/* ✅ “sub-meta” compacta */}
            {(marca || modelo || anio || ubicacion || empresa) && (
              <div className="lp-card-meta" style={{ marginTop: 6, opacity: 0.92 }}>
                {empresa && (
                  <>
                    <span>{empresa}</span>
                    <span className="lp-dot" />
                  </>
                )}
                {(marca || modelo) && (
                  <>
                    <span>{`${marca || ""}${marca && modelo ? " " : ""}${modelo || ""}`.trim()}</span>
                    <span className="lp-dot" />
                  </>
                )}
                {anio && (
                  <>
                    <span>{anio}</span>
                    <span className="lp-dot" />
                  </>
                )}
                {ubicacion && <span>{ubicacion}</span>}
              </div>
            )}

            {/* ✅ Contacto (si existe) */}
            {(telefono || whatsapp) && (
              <div className="lp-card-meta" style={{ marginTop: 6, opacity: 0.9 }}>
                {telefono && <span>📞 {telefono}</span>}
                {telefono && whatsapp && <span className="lp-dot" />}
                {whatsapp && <span>💬 {whatsapp}</span>}
              </div>
            )}
          </div>

          <span className={`lp-badge lp-badge-${estado}`}>{estado}</span>
        </div>

        <p className="lp-desc">{desc}</p>

        {/* ✅ Detalles dinámicos (máx 6) */}
        {extraDetails.length > 0 && (
          <div style={{ marginTop: 10, display: "grid", gap: 6 }}>
            {extraDetails.map((d) => (
              <div key={String(d.key)} style={{ fontSize: 12, opacity: 0.9 }}>
                <b style={{ opacity: 0.95 }}>{d.label}:</b>{" "}
                <span style={{ opacity: 0.9 }}>{d.value}</span>
              </div>
            ))}
          </div>
        )}

        <div className="lp-card-foot">
          <button
            className="lp-btn lp-btn-ghost"
            type="button"
            onClick={onViewCatalog}
          >
            Ver en catálogo
          </button>
        </div>
      </div>
    </article>
  );
}
import React from "react";

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

export default function PublicationCard({ row, onViewCatalog }) {
  const p = row?._data || row?.data || {};

  const rawImg = p?.foto_url || p?.imagenes?.[0] || "";
  const imgSrc = normalizeImageUrl(rawImg);

  const title = p?.titulo || p?.nombre || "Publicación";
  const desc = p?.descripcion || "Sin descripción.";
  const estado = String(p?.estado || "disponible").toLowerCase();

  const precioNum =
    p?.precio == null || p?.precio === ""
      ? null
      : Number(String(p.precio).replace(/[^\d.]/g, ""));

  const precioLabel =
    precioNum == null || Number.isNaN(precioNum)
      ? "—"
      : `$${precioNum.toLocaleString("es-MX")} MXN`;

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
          </div>

          <span className={`lp-badge lp-badge-${estado}`}>{estado}</span>
        </div>

        <p className="lp-desc">{desc}</p>

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

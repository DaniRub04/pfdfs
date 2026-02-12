// backend/src/controllers/publicar.controllers.js
import { createPublication, listPublications } from "../services/publicar.service.js";

const VALID_GROUPS = new Set([
  "automotriz",
  "marketplace",
  "empresas",
  "universidades",
  "instituciones",
]);

/**
 * GET /publicar
 * Público: lista publicaciones (para landing)
 * Opcional: ?group=automotriz|marketplace|...
 * Opcional: ?limit=20
 */
export async function listarPublicaciones(req, res, next) {
  try {
    const group = req.query.group ? String(req.query.group).trim().toLowerCase() : null;
    const limit = req.query.limit ? Number(req.query.limit) : 20;

    if (group && !VALID_GROUPS.has(group)) {
      return res.status(400).json({ ok: false, message: "group no válido", group });
    }

    const publicaciones = await listPublications({
      group,
      limit: Number.isFinite(limit) ? limit : 20,
    });

    return res.json({ ok: true, data: publicaciones });
  } catch (err) {
    console.error("LISTAR PUBLICACIONES ERROR:", err);
    return next(err);
  }
}

/**
 * POST /publicar
 * Privado: crea publicación
 */
export async function publicar(req, res, next) {
  try {
    // Acepta ambos formatos:
    // 1) { group, data: {...} }
    // 2) { group, titulo, precio, ... } (plano)
    const body = req.body ?? {};
    const data = body.data && typeof body.data === "object" ? body.data : body;

    // group puede venir en body o dentro de data
    const group = body.group ?? data.group;

    if (!group || typeof group !== "string") {
      return res.status(400).json({ ok: false, message: "group requerido" });
    }

    const groupNormalized = group.trim().toLowerCase();
    if (!VALID_GROUPS.has(groupNormalized)) {
      return res
        .status(400)
        .json({ ok: false, message: "group no válido", group: groupNormalized });
    }

    if (!data || typeof data !== "object") {
      return res.status(400).json({ ok: false, message: "data requerido (objeto)" });
    }

    // Evita que data tenga group duplicado/conflictivo
    const { group: _ignored, ...dataClean } = data;

    // auth middleware setea req.user
    const userId = req.user?.id ?? null;

    const created = await createPublication({
      group: groupNormalized,
      data: dataClean,
      userId,
    });

    return res.status(201).json({ ok: true, data: created });
  } catch (err) {
    console.error("PUBLICAR ERROR:", err);
    return next(err);
  }
}

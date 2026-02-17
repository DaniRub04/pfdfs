// backend/src/controllers/publicar.controllers.js
import {
  createPublication,
  listPublications,
  listMyPublications,
  updateMyPublication,
  deleteMyPublication,
} from "../services/publicar.service.js";

const VALID_GROUPS = new Set([
  "automotriz",
  "marketplace",
  "empresas",
  "universidades",
  "instituciones",
]);

function normalizeGroup(v) {
  return String(v ?? "").trim().toLowerCase();
}

/**
 * GET /publicar
 * Público: lista publicaciones APROBADAS (landing/catálogo)
 * Opcional: ?group=automotriz|marketplace|...
 * Opcional: ?limit=20
 */
export async function listarPublicaciones(req, res, next) {
  try {
    const groupRaw = req.query.group;
    const group = groupRaw ? normalizeGroup(groupRaw) : null;

    const limitRaw = req.query.limit;
    const limit = limitRaw ? Number(limitRaw) : 20;

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
 * Privado: crea publicación (status 'pendiente' por default en service)
 *
 * Acepta ambos formatos:
 * 1) { group, data: {...} }
 * 2) { group, titulo, precio, ... } (plano)
 */
export async function publicar(req, res, next) {
  try {
    const body = req.body ?? {};
    const data = body.data && typeof body.data === "object" ? body.data : body;

    // group puede venir en body o dentro de data
    const group = body.group ?? data.group;

    if (!group || typeof group !== "string") {
      return res.status(400).json({ ok: false, message: "group requerido" });
    }

    const groupNormalized = normalizeGroup(group);
    if (!VALID_GROUPS.has(groupNormalized)) {
      return res.status(400).json({
        ok: false,
        message: "group no válido",
        group: groupNormalized,
      });
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

/**
 * GET /publicar/mias
 * Privado: lista MIS publicaciones (pendiente/aprobado/rechazado)
 * Opcional: ?group=...&limit=...
 */
export async function listarMisPublicaciones(req, res, next) {
  try {
    const userId = req.user?.id ?? null;

    const groupRaw = req.query.group;
    const group = groupRaw ? normalizeGroup(groupRaw) : null;

    const limitRaw = req.query.limit;
    const limit = limitRaw ? Number(limitRaw) : 50;

    if (group && !VALID_GROUPS.has(group)) {
      return res.status(400).json({ ok: false, message: "group no válido", group });
    }

    const publicaciones = await listMyPublications({
      userId,
      group,
      limit: Number.isFinite(limit) ? limit : 50,
    });

    return res.json({ ok: true, data: publicaciones });
  } catch (err) {
    console.error("LISTAR MIS PUBLICACIONES ERROR:", err);
    return next(err);
  }
}

/**
 * PUT /publicar/:id
 * Privado: editar MI publicación (solo data)
 * Body: { data: {...} }  (o plano: { ... } )
 */
export async function editarMiPublicacion(req, res, next) {
  try {
    const userId = req.user?.id ?? null;
    const id = req.params.id;

    const body = req.body ?? {};
    const data = body.data && typeof body.data === "object" ? body.data : body;

    if (!data || typeof data !== "object") {
      return res.status(400).json({ ok: false, message: "data requerido (objeto)" });
    }

    // evita group duplicado si llega
    const { group: _ignored, ...dataClean } = data;

    const updated = await updateMyPublication({ id, userId, data: dataClean });
    if (!updated) {
      return res.status(404).json({ ok: false, message: "No encontrada o sin permisos" });
    }

    return res.json({ ok: true, data: updated });
  } catch (err) {
    console.error("EDITAR MI PUBLICACION ERROR:", err);
    return next(err);
  }
}

/**
 * DELETE /publicar/:id
 * Privado: eliminar MI publicación
 */
export async function eliminarMiPublicacion(req, res, next) {
  try {
    const userId = req.user?.id ?? null;
    const id = req.params.id;

    const deleted = await deleteMyPublication({ id, userId });
    if (!deleted) {
      return res.status(404).json({ ok: false, message: "No encontrada o sin permisos" });
    }

    return res.json({ ok: true, data: { id: deleted.id } });
  } catch (err) {
    console.error("ELIMINAR MI PUBLICACION ERROR:", err);
    return next(err);
  }
}

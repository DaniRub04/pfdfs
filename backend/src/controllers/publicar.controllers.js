// backend/src/controllers/publicar.controller.js
import { createPublication } from "../services/publicar.service.js";

const VALID_GROUPS = new Set([
  "automotriz",
  "marketplace",
  "empresas",
  "universidades",
  "instituciones",
]);

export async function publicar(req, res, next) {
  try {
    // Acepta ambos formatos:
    // 1) { group, data: {...} }
    // 2) { group, titulo, precio, ... } (plano)
    const body = req.body ?? {};
    const data = body.data && typeof body.data === "object" ? body.data : body;

    // group puede venir en body o dentro de data
    const group = (body.group ?? data.group);

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
      return res
        .status(400)
        .json({ ok: false, message: "data requerido (objeto)" });
    }

    // Evita que data tenga group duplicado/conflictivo
    const { group: _ignored, ...dataClean } = data;

    // Si tienes auth middleware que setea req.user, lo usa; si no, null
    const userId = req.user?.id ?? null;

    const created = await createPublication({
      group: groupNormalized,
      data: dataClean,
      userId,
    });

    return res.status(201).json({ ok: true, data: created });
  } catch (err) {
    // Para que no sea un 500 "ciego" en el frontend
    console.error("PUBLICAR ERROR:", err);
    return next(err);
  }
}


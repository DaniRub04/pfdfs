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
    const { group, data } = req.body;

    if (!group || typeof group !== "string") {
      return res.status(400).json({ ok: false, message: "group requerido" });
    }
    if (!VALID_GROUPS.has(group)) {
      return res.status(400).json({ ok: false, message: "group no válido", group });
    }
    if (!data || typeof data !== "object") {
      return res.status(400).json({ ok: false, message: "data requerido (objeto)" });
    }

    // Si ya tienes auth y pones req.user, úsalo.
    // Si no, se queda null (y no falla).
    const userId = req.user?.id ?? null;

    const created = await createPublication({ group, data, userId });

    return res.status(201).json({ ok: true, data: created });
  } catch (err) {
    next(err);
  }
}

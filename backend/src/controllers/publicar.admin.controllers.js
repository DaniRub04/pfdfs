// backend/src/controllers/publicar.admin.controllers.js
import {
  adminListPublications,
  adminSetStatus,
} from "../services/publicar.admin.service.js";

export async function adminList(req, res, next) {
  try {
    const {
      status = "pendiente",
      group = null,
      limit = 20,
      offset = 0,
    } = req.query;

    const data = await adminListPublications({
      status,
      group,
      limit,
      offset,
    });

    return res.json({ ok: true, data });
  } catch (err) {
    console.error("ADMIN LIST ERROR:", err);
    return next(err);
  }
}

export async function adminChangeStatus(req, res, next) {
  try {
    const id = req.params.id;
    const status = req.body?.status;

    const updated = await adminSetStatus({ id, status });
    if (!updated) {
      return res.status(404).json({ ok: false, message: "No encontrada" });
    }

    return res.json({ ok: true, data: updated });
  } catch (err) {
    console.error("ADMIN STATUS ERROR:", err);
    return next(err);
  }
}

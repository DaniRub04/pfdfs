import { Router } from "express";

import {
  publicar,
  listarPublicaciones,
  listarMisPublicaciones,
  editarMiPublicacion,
  eliminarMiPublicacion,
} from "../controllers/publicar.controllers.js";

import {
  adminList,
  adminChangeStatus,
} from "../controllers/publicar.admin.controllers.js";

import { auth } from "../middlewares/auth.js";
import { isAdmin } from "../middlewares/isAdmin.js";

const router = Router();

/* ===================================================
   🌍 PÚBLICO
=================================================== */

/**
 * GET /publicar
 * Público - Lista publicaciones aprobadas (landing/catálogo)
 */
router.get("/", listarPublicaciones);


/* ===================================================
   🔐 USUARIO AUTENTICADO
=================================================== */

/**
 * GET /publicar/mias
 * Privado - Lista mis publicaciones (pendiente/aprobado/rechazado)
 */
router.get("/mias", auth, listarMisPublicaciones);

/**
 * POST /publicar
 * Privado - Crear publicación (queda en pendiente)
 */
router.post("/", auth, publicar);

/**
 * PUT /publicar/:id
 * Privado - Editar mi publicación
 */
router.put("/:id", auth, editarMiPublicacion);

/**
 * DELETE /publicar/:id
 * Privado - Eliminar mi publicación
 */
router.delete("/:id", auth, eliminarMiPublicacion);

/**
 * ⚠️ IMPORTANTE:
 * Eliminamos el endpoint:
 * PATCH /publicar/:id/status
 *
 * Porque ahora SOLO admin puede cambiar estados.
 */


/* ===================================================
   👑 ADMIN (MODERACIÓN)
=================================================== */

/**
 * GET /publicar/admin
 * Admin - Lista publicaciones por status/group
 * Ej:
 * /publicar/admin?status=pendiente&group=automotriz&limit=20&offset=0
 */
router.get("/admin", auth, isAdmin, adminList);

/**
 * PATCH /publicar/admin/:id/status
 * Admin - Cambiar status (aprobado / rechazado / pendiente)
 */
router.patch("/admin/:id/status", auth, isAdmin, adminChangeStatus);

export default router;

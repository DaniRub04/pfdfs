// backend/src/routes/publicar.routes.js
import { Router } from "express";

import {
  publicar,
  listarPublicaciones,
  listarMisPublicaciones,
  editarMiPublicacion,
  eliminarMiPublicacion,
  cambiarStatus,
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
 * Privado - Lista mis publicaciones (todas)
 */
router.get("/mias", auth, listarMisPublicaciones);

/**
 * POST /publicar
 * Privado - Crear publicación (pendiente por defecto)
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
 * PATCH /publicar/:id/status
 * Privado - Cambiar status (owner o admin si lo mantienes)
 */
router.patch("/:id/status", auth, cambiarStatus);


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

// backend/src/middlewares/isAdmin.js
export function isAdmin(req, res, next) {
  // auth middleware ya debió setear req.user
  const role = req.user?.role;

  if (role !== "admin") {
    return res.status(403).json({ ok: false, message: "Solo administradores" });
  }

  return next();
}

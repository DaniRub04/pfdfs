import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

function isBigintId(v) {
  const s = String(v ?? "").trim();
  return /^[0-9]+$/.test(s); // solo dígitos
}

const DEBUG_AUTH =
  String(process.env.DEBUG_AUTH ?? "false").toLowerCase() === "true";

export function auth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const [type, token] = header.split(" ");

    if (type !== "Bearer" || !token) {
      return res.status(401).json({ ok: false, message: "Token requerido" });
    }

    const payload = jwt.verify(token, env.JWT_SECRET);

    const userId = payload.sub ?? payload.id ?? payload.userId ?? null;

    if (DEBUG_AUTH) {
      console.log("JWT PAYLOAD:", payload);
      console.log("JWT userId:", userId);
    }

    if (!isBigintId(userId)) {
      return res.status(401).json({
        ok: false,
        message: "No autorizado: userId no es bigint válido",
        got: userId,
      });
    }

    req.user = {
      id: String(userId), // lo mantenemos string pero numérico
      email: payload.email ?? null,
      nombre: payload.nombre ?? null,
      role: payload.role ?? null,
    };

    return next();
  } catch (e) {
    return res.status(401).json({ ok: false, message: "Token inválido o expirado" });
  }
}

import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export function auth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const [type, token] = header.split(" ");

    if (type !== "Bearer" || !token) {
      return res.status(401).json({ ok: false, message: "Token requerido" });
    }

    const payload = jwt.verify(token, env.JWT_SECRET);
    req.user = payload; // {id, email, nombre}
    next();
  } catch (e) {
    return res.status(401).json({ ok: false, message: "Token inválido o expirado" });
  }
}

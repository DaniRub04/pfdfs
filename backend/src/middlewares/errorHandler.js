export function errorHandler(err, req, res, next) {
  console.error("ERROR:", err);

  const status = err.statusCode || 500;
  const message =
    status === 500 ? "Error interno del servidor" : err.message;

  res.status(status).json({
    ok: false,
    message,
  });
} 
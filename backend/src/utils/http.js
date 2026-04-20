export function sendError(res, status, message, details) {
  return res.status(status).json({
    error: {
      message,
      ...(details ? { details } : {}),
    },
  });
}


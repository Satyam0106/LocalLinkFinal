import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { User } from "../models/User.js";
import { sendError } from "../utils/http.js";

function getTokenFromHeader(req) {
  const header = req.headers.authorization;
  if (!header) return null;
  const [type, token] = header.split(" ");
  if (type !== "Bearer" || !token) return null;
  return token;
}

export async function authRequired(req, res, next) {
  try {
    const token = getTokenFromHeader(req);
    if (!token) return sendError(res, 401, "Missing auth token");

    const payload = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(payload.sub).select("-passwordHash");
    if (!user) return sendError(res, 401, "Invalid auth token");

    req.user = user;
    next();
  } catch {
    return sendError(res, 401, "Invalid auth token");
  }
}

export function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return sendError(res, 401, "Unauthorized");
    if (req.user.role !== role) return sendError(res, 403, "Forbidden");
    return next();
  };
}


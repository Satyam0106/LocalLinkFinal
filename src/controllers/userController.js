import mongoose from "mongoose";
import { User } from "../models/User.js";
import { sendError } from "../utils/http.js";
import { serializeUser } from "../utils/serializers.js";

function serializePublicUser(user) {
  const payload = serializeUser(user);
  if (!payload) return null;
  // Hide sensitive fields for non-self reads
  delete payload.email;
  return payload;
}

export async function getMe(req, res) {
  return res.json({ user: serializeUser(req.user) });
}

export async function getUserById(req, res) {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return sendError(res, 400, "Invalid user id");

  // Self: return full serialized user
  if (String(req.user?._id) === String(id)) {
    const user = await User.findById(id).select("-passwordHash");
    if (!user) return sendError(res, 404, "User not found");
    return res.json({ user: serializeUser(user) });
  }

  // Non-self: only allow reading vendors (public discovery use-case)
  const user = await User.findOne({ _id: id, role: "vendor", status: "active" }).select("-passwordHash");
  if (!user) return sendError(res, 404, "User not found");

  return res.json({ user: serializePublicUser(user) });
}

export async function deactivateMe(req, res) {
  // Additive, non-destructive delete: soft-deactivate the account.
  // We don't hard-delete related docs to avoid breaking existing flows.
  const user = await User.findById(req.user._id);
  if (!user) return sendError(res, 404, "User not found");

  user.status = "inactive";
  await user.save();

  return res.status(204).send();
}


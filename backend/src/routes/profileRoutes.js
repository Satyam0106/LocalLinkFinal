import { Router } from "express";
import { authRequired, requireRole } from "../middleware/auth.js";
import {
  createVendorContact,
  deleteVendorContact,
  getMyProfile,
  listVendorContacts,
  updateMyProfile,
  updateVendorContact,
} from "../controllers/profileController.js";

export const profileRoutes = Router();

profileRoutes.get("/profile/me", authRequired, getMyProfile);
profileRoutes.patch("/profile/me", authRequired, updateMyProfile);
profileRoutes.get("/vendor/contacts", authRequired, requireRole("vendor"), listVendorContacts);
profileRoutes.post("/vendor/contacts", authRequired, requireRole("vendor"), createVendorContact);
profileRoutes.patch("/vendor/contacts/:id", authRequired, requireRole("vendor"), updateVendorContact);
profileRoutes.delete("/vendor/contacts/:id", authRequired, requireRole("vendor"), deleteVendorContact);

import { Router } from "express";
import { authRequired, requireRole } from "../middleware/auth.js";
import { getCustomerDashboard, getVendorDashboard } from "../controllers/dashboardController.js";

export const dashboardRoutes = Router();

dashboardRoutes.get("/dashboard/customer", authRequired, requireRole("customer"), getCustomerDashboard);
dashboardRoutes.get("/dashboard/vendor", authRequired, requireRole("vendor"), getVendorDashboard);

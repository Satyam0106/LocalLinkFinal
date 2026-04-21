import { Router } from "express";
import { authRequired } from "../middleware/auth.js";
import { listPurchases, updatePurchaseStatus } from "../controllers/purchaseController.js";

export const purchaseRoutes = Router();

purchaseRoutes.get("/purchases", authRequired, listPurchases);
purchaseRoutes.patch("/purchase/:id", authRequired, updatePurchaseStatus);

import { Router } from "express";
import { getVendor, listVendors } from "../controllers/vendorController.js";

export const vendorRoutes = Router();

vendorRoutes.get("/vendors", listVendors);
vendorRoutes.get("/vendor/:id", getVendor);


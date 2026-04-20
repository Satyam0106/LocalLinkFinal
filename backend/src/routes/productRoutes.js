import { Router } from "express";
import {
  createProduct,
  deleteProduct,
  getProduct,
  getProductsByVendor,
  listProducts,
  updateProduct,
} from "../controllers/productController.js";
import { authRequired, requireRole } from "../middleware/auth.js";

export const productRoutes = Router();

productRoutes.get("/products", listProducts);
productRoutes.get("/products/:vendorId", getProductsByVendor);
productRoutes.get("/product/:id", getProduct);
productRoutes.post("/product", authRequired, requireRole("vendor"), createProduct);
productRoutes.patch("/product/:id", authRequired, requireRole("vendor"), updateProduct);
productRoutes.delete("/product/:id", authRequired, requireRole("vendor"), deleteProduct);

import { Router } from "express";
import { authRequired, requireRole } from "../middleware/auth.js";
import { createRequest, updateRequestStatus } from "../controllers/requestController.js";
import { getOrder, listOrders } from "../controllers/orderController.js";

export const orderRoutes = Router();

// Convenience aliases on top of Request/Purchase model.
orderRoutes.get("/orders", authRequired, listOrders);
orderRoutes.get("/order/:id", authRequired, getOrder);
orderRoutes.post("/order", authRequired, requireRole("customer"), async (req, res) => {
  const previousBody = req.body;
  req.body = { ...(req.body ?? {}), type: "order" };
  try {
    return await createRequest(req, res);
  } finally {
    req.body = previousBody;
  }
});
orderRoutes.patch("/order/:id", authRequired, updateRequestStatus);


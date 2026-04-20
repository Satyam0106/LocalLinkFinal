import { Router } from "express";
import {
  acceptRequest,
  createRequest,
  deleteRequest,
  getRequest,
  listRequests,
  updateRequestStatus,
} from "../controllers/requestController.js";
import { authRequired, requireRole } from "../middleware/auth.js";

export const requestRoutes = Router();

requestRoutes.get("/requests", authRequired, listRequests);
requestRoutes.get("/request/:id", authRequired, getRequest);
requestRoutes.post("/request", authRequired, requireRole("customer"), createRequest);
requestRoutes.put("/request/:id", authRequired, requireRole("vendor"), acceptRequest);
requestRoutes.patch("/request/:id", authRequired, updateRequestStatus);
requestRoutes.delete("/request/:id", authRequired, deleteRequest);

import { Router } from "express";
import { authRequired } from "../middleware/auth.js";
import { deactivateMe, getMe, getUserById } from "../controllers/userController.js";
import { updateMyProfile } from "../controllers/profileController.js";

export const userRoutes = Router();

userRoutes.get("/users/me", authRequired, getMe);
userRoutes.patch("/users/me", authRequired, updateMyProfile);
userRoutes.delete("/users/me", authRequired, deactivateMe);
userRoutes.get("/users/:id", authRequired, getUserById);


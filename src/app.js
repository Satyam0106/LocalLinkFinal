import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { authRoutes } from "./routes/authRoutes.js";
import { vendorRoutes } from "./routes/vendorRoutes.js";
import { productRoutes } from "./routes/productRoutes.js";
import { requestRoutes } from "./routes/requestRoutes.js";
import { chatRoutes } from "./routes/chatRoutes.js";
import { profileRoutes } from "./routes/profileRoutes.js";
import { purchaseRoutes } from "./routes/purchaseRoutes.js";
import { dashboardRoutes } from "./routes/dashboardRoutes.js";
import { userRoutes } from "./routes/userRoutes.js";
import { orderRoutes } from "./routes/orderRoutes.js";
import { sendError } from "./utils/http.js";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) return callback(null, true);
        if (origin === env.clientOrigin) return callback(null, true);
        if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
          return callback(null, true);
        }
        return callback(null, false);
      },
      credentials: true,
    })
  );
  app.use(express.json());

  app.get("/", (_req, res) => res.type("text/plain").send("Backend running"));
  app.get("/health", (_req, res) => res.json({ ok: true }));

  app.use("/auth", authRoutes);
  app.use(vendorRoutes);
  app.use(productRoutes);
  app.use(requestRoutes);
  app.use(orderRoutes);
  app.use(chatRoutes);
  app.use(profileRoutes);
  app.use(purchaseRoutes);
  app.use(dashboardRoutes);
  app.use(userRoutes);

  app.use((req, res) => sendError(res, 404, `Route not found: ${req.method} ${req.path}`));

  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    console.error(err);
    return sendError(res, 500, "Internal server error");
  });

  return app;
}

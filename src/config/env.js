import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

export const env = {
  port: process.env.PORT ? Number(process.env.PORT) : 4000,
  mongoUri: process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/localink",
  jwtSecret: process.env.JWT_SECRET ?? "dev_secret_change_me",
  clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
};


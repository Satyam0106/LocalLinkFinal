import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

export const env = {
  port: process.env.PORT ? Number(process.env.PORT) : 4000,
  mongoUri: process.env.MONGODB_URI ?? "mongodb+srv://satyamrout0107_db_user:SATYAM123@cluster0.jf7mgrj.mongodb.net/localink?retryWrites=true&w=majority&appName=Cluster0",
  jwtSecret: process.env.JWT_SECRET ?? "your-secret-key",
  clientOrigin: process.env.CLIENT_ORIGIN ?? "https://local-link-final.vercel.app/auth",
};


import { createApp } from "./app.js";
import { connectDb, disconnectDb } from "./config/db.js";
import { env } from "./config/env.js";

async function main() {
  await connectDb(env.mongoUri);

  const app = createApp();
  const server = app.listen(env.port, () => {
    console.log(`Localink backend listening on http://localhost:${env.port}`);
  });

  const shutdown = async (signal) => {
    console.log(`${signal} received, shutting down…`);
    server.close(async () => {
      await disconnectDb();
      process.exit(0);
    });
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let memoryServer;

export async function connectDb(mongoUri) {
  mongoose.set("strictQuery", true);

  if (mongoUri) {
    try {
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5_000,
      });
      console.log("Connected to MongoDB:", mongoUri);
      return;
    } catch (error) {
      console.warn("Failed to connect to MongoDB. Falling back to in-memory database.", error.message);
    }
  }

  memoryServer = await MongoMemoryServer.create();
  const inMemoryUri = memoryServer.getUri();
  await mongoose.connect(inMemoryUri, {
    serverSelectionTimeoutMS: 5_000,
  });
  console.log("Connected to in-memory MongoDB:", inMemoryUri);
}

export async function disconnectDb() {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
  }
}

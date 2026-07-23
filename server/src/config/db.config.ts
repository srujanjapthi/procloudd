import mongoose from "mongoose";
import { isDevelopment } from "@/common/utils/node-env.util.js";
import env from "@/config/env.config.js";

export async function connectDB(): Promise<void> {
  await mongoose.connect(env.DB_URL);

  if (isDevelopment()) {
    console.log("Connected to MongoDB");
  }
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
}

mongoose.connection.on("error", (error) => {
  console.error("MongoDB connection error:", error);
});

mongoose.connection.on("disconnected", () => {
  if (isDevelopment()) {
    console.log("MongoDB disconnected");
  }
});

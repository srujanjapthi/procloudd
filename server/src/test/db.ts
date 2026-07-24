import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import {
  redisClient,
  connectRedis,
  disconnectRedis,
} from "@/config/redis.config.js";
import Sessions from "@/services/session.service.js";
import AppConfig from "@/config/app.config.js";

let replSet: MongoMemoryReplSet | undefined;

export async function connectTestDb(): Promise<void> {
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(replSet.getUri());
  await Promise.all(
    Object.values(mongoose.connection.models).map((model) => model.init())
  );
  await connectRedis();
  await Sessions.init();
}

export async function disconnectTestDb(): Promise<void> {
  await mongoose.disconnect();
  await replSet?.stop();
  await disconnectRedis();
}

export async function clearTestDb(): Promise<void> {
  const collections = Object.values(mongoose.connection.collections);
  await Promise.all(collections.map((collection) => collection.deleteMany({})));

  const keys = await redisClient.keys(`${AppConfig.session.redisKeyPrefix}:*`);
  if (keys.length > 0) {
    await redisClient.del(keys);
  }
}

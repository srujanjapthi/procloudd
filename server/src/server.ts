import { connectDB, disconnectDB } from "@/config/db.config.js";
import { connectRedis, disconnectRedis } from "@/config/redis.config.js";
import Sessions from "@/services/session.service.js";
import env from "@/config/env.config.js";

await connectDB();
await connectRedis();
await Sessions.init();

const { default: app } = await import("@/app.js");

app.listen(env.PORT, () => {
  console.log(`App is running on http://localhost:${env.PORT}`);
});

async function shutdown(): Promise<void> {
  await Promise.all([disconnectDB(), disconnectRedis()]);
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

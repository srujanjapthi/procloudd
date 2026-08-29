import { connectDB, disconnectDB } from "@/config/db.config.js";
import { connectRedis, disconnectRedis } from "@/config/redis.config.js";
import Sessions from "@/services/session.service.js";
import env from "@/config/env.config.js";

await connectDB();
await connectRedis();
await Sessions.init();

const { default: app } = await import("@/app.js");
let isShuttingDown = false;

app.listen(env.PORT, () => {
  console.log(`App is running on http://localhost:${env.PORT}`);
});

async function shutdown(): Promise<void> {
  if (isShuttingDown) return;

  isShuttingDown = true;

  try {
    await Promise.all([disconnectDB(), disconnectRedis()]);
  } catch (err) {
    console.error("Error during shutdown:", err);
  } finally {
    process.exit(0);
  }
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

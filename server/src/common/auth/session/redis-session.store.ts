import { redisClient } from "@/config/redis.config.js";
import AppConfig from "@/config/app.config.js";
import type { SessionStore } from "./session.interface.js";

export interface RedisSessionStoreConfig {
  prefix?: string;
  indexName?: string;
}

export function createRedisSessionStore({
  prefix = AppConfig.session.redisKeyPrefix,
  indexName = AppConfig.session.redisIndexName,
}: RedisSessionStoreConfig = {}): SessionStore {
  const sessionKey = (id: string): string => `${prefix}:${id}`;
  const idFromKey = (redisKey: string): string =>
    redisKey.slice(prefix.length + 1);

  return {
    async init() {
      const indexes = await redisClient.ft._list();
      if (indexes.includes(indexName)) return;

      await redisClient.ft.create(
        indexName,
        {
          "$.userId": { type: "TAG", AS: "userId" },
          "$.createdAt": { type: "NUMERIC", AS: "createdAt" },
        },
        { ON: "JSON", PREFIX: `${prefix}:` }
      );
    },

    async save(session, ttlSeconds) {
      const redisKey = sessionKey(session.sessionId);
      await redisClient
        .multi()
        .json.set(redisKey, "$", {
          userId: session.userId,
          createdAt: session.createdAt,
          ...(session.userAgent && { userAgent: session.userAgent }),
        })
        .expire(redisKey, ttlSeconds)
        .exec();
    },

    async get(sessionId) {
      const data = await redisClient.json.get(sessionKey(sessionId));
      if (!data) return null;
      const { userId, createdAt, userAgent } = data as {
        userId: string;
        createdAt: number;
        userAgent?: string;
      };
      return { sessionId, userId, createdAt, ...(userAgent && { userAgent }) };
    },

    async delete(sessions) {
      if (sessions.length === 0) return;
      await redisClient.del(
        sessions.map((session) => sessionKey(session.sessionId))
      );
    },

    async listByUser(userId) {
      const result = await redisClient.ft.search(
        indexName,
        `@userId:{${userId}}`,
        { RETURN: ["createdAt", "$.userAgent", "AS", "userAgent"] }
      );

      return result.documents.map((doc) => {
        const userAgent = doc.value.userAgent as string | undefined;
        return {
          sessionId: idFromKey(doc.id),
          userId,
          createdAt: Number(doc.value.createdAt),
          ...(userAgent && { userAgent }),
        };
      });
    },
  };
}

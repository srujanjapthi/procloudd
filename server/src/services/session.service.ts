import { randomUUID } from "node:crypto";
import { createRedisSessionStore } from "@/common/auth/session/redis-session.store.js";
import type { Session } from "@/common/auth/session/session.interface.js";
import AppConfig from "@/config/app.config.js";

const store = createRedisSessionStore();

const Sessions = {
  init(): Promise<void> {
    return store.init();
  },

  async createSession(userId: string, userAgent?: string): Promise<string> {
    const sessionId = randomUUID();
    await store.save(
      {
        sessionId,
        userId,
        createdAt: Date.now(),
        ...(userAgent && { userAgent }),
      },
      AppConfig.session.ttlSeconds
    );
    return sessionId;
  },

  getSession(sessionId: string): Promise<Session | null> {
    return store.get(sessionId);
  },

  listUserSessions(userId: string): Promise<Session[]> {
    return store.listByUser(userId);
  },

  async deleteSession(sessionId: string): Promise<void> {
    const session = await store.get(sessionId);
    if (session) await store.delete([session]);
  },

  async deleteUserSessions(
    userId: string,
    exceptSessionId?: string
  ): Promise<void> {
    const sessions = await store.listByUser(userId);
    const toDelete = exceptSessionId
      ? sessions.filter((session) => session.sessionId !== exceptSessionId)
      : sessions;
    await store.delete(toDelete);
  },
};

export default Sessions;

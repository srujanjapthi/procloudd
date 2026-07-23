import * as Duration from "@/common/lib/duration.util.js";

const APP_NAME = "ProCloudd";

const AppConfig = {
  name: APP_NAME,
  session: {
    cookieName: "sid",
    ttlSeconds: Duration.toMs("7d") / 1000,
    maxPerUser: 2,
    redisKeyPrefix: "session",
    redisIndexName: "sessionIdx",
  },
  login: {
    maxFailedAttempts: 5,
    lockoutDurationMs: Duration.toMs("15m"),
  },
  oauthSignupToken: {
    expiryMs: Duration.toMs("30m"),
  },
  pendingLoginToken: {
    expiryMs: Duration.toMs("5m"),
  },
  githubOAuthState: {
    expiryMs: Duration.toMs("10m"),
  },
  password: {
    minLength: 8,
    maxLength: 72,
    saltRounds: 12,
  },
  username: {
    minLength: 3,
    maxLength: 30,
  },
  otp: {
    digits: 4,
    expiryMinutes: 10,
    maxAttempts: 5,
  },
  totp: {
    codeLength: 6,
    issuer: APP_NAME,
    epochTolerance: [30, 0] as [number, number],
    recoveryCodeCount: 8,
  },
  pagination: {
    defaultPage: 1,
    defaultLimit: 20,
    maxLimit: 100,
  },
  storage: {
    defaultMaxStorageInBytes: 1 * 1024 ** 3,
  },
} as const;

export default AppConfig;

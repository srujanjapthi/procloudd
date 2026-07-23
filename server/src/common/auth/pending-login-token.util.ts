import { createTokenScope } from "@/common/lib/hmac-token.util.js";
import env from "@/config/env.config.js";
import AppConfig from "@/config/app.config.js";

export interface PendingLoginPayload {
  userId: string;
}

export const { createToken, verifyToken } =
  createTokenScope<PendingLoginPayload>(
    env.PENDING_LOGIN_SECRET,
    AppConfig.pendingLoginToken.expiryMs
  );

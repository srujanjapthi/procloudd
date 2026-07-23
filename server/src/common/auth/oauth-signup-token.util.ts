import { createTokenScope } from "@/common/lib/hmac-token.util.js";
import env from "@/config/env.config.js";
import AppConfig from "@/config/app.config.js";

export interface OAuthSignupPayload {
  email: string;
  provider: string;
  providerId: string;
}

export const { createToken, verifyToken } =
  createTokenScope<OAuthSignupPayload>(
    env.OAUTH_SIGNUP_SECRET,
    AppConfig.oauthSignupToken.expiryMs
  );

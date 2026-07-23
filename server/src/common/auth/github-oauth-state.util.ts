import { randomBytes } from "node:crypto";
import { createTokenScope } from "@/common/lib/hmac-token.util.js";
import env from "@/config/env.config.js";
import AppConfig from "@/config/app.config.js";

interface GithubOAuthStatePayload {
  nonce: string;
}

const { createToken, verifyToken } = createTokenScope<GithubOAuthStatePayload>(
  env.GITHUB_OAUTH_STATE_SECRET,
  AppConfig.githubOAuthState.expiryMs
);

export function createState(): string {
  return createToken({ nonce: randomBytes(16).toString("hex") });
}

export function verifyState(state: string): boolean {
  return verifyToken(state) !== null;
}

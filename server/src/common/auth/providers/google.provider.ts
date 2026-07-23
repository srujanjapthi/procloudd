import { OAuth2Client } from "google-auth-library";
import AppError from "@/common/error/app.error.js";
import env from "@/config/env.config.js";
import type { AuthProvider } from "./auth-provider.interface.js";

export interface GoogleProviderInput {
  idToken: string;
}

const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);

const GoogleProvider: AuthProvider<GoogleProviderInput> = {
  provider: "google",
  async verify({ idToken }) {
    let payload;
    try {
      const ticket = await client.verifyIdToken({
        idToken,
        audience: env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch {
      throw AppError.unauthorized("Invalid Google token");
    }

    if (!payload?.email || !payload.email_verified) {
      throw AppError.unauthorized("Invalid Google token");
    }

    const name = {
      ...(payload.given_name !== undefined && {
        firstName: payload.given_name,
      }),
      ...(payload.family_name !== undefined && {
        lastName: payload.family_name,
      }),
    };

    return {
      providerId: payload.sub,
      email: payload.email,
      ...(Object.keys(name).length > 0 && { name }),
      ...(payload.picture !== undefined && { avatarUrl: payload.picture }),
    };
  },
};

export default GoogleProvider;

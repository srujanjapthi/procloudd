import AppError from "@/common/error/app.error.js";
import * as CredentialHasher from "@/common/lib/credential-hasher.util.js";
import type { AuthProvider } from "./auth-provider.interface.js";

export interface LocalUserRecord {
  id: string;
  email: string;
  password: string;
}

export interface LocalProviderInput {
  password: string;
  user: LocalUserRecord;
}

const LocalProvider: AuthProvider<LocalProviderInput> = {
  provider: "local",
  async verify({ password, user }) {
    const isValid = await CredentialHasher.verify(password, user.password);
    if (!isValid) {
      throw AppError.unauthorized("Invalid email or password");
    }

    return {
      providerId: user.id,
      email: user.email,
    };
  },
};

export default LocalProvider;

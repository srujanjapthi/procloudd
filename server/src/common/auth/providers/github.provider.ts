import AppError from "@/common/error/app.error.js";
import env from "@/config/env.config.js";
import type { AuthProvider } from "./auth-provider.interface.js";

export interface GithubProviderInput {
  code: string;
}

interface GithubAccessTokenResponse {
  access_token?: string;
}

interface GithubUserResponse {
  id: number;
  name: string | null;
  email: string | null;
  avatar_url?: string;
}

interface GithubEmailResponse {
  email: string;
  primary: boolean;
  verified: boolean;
}

export const REDIRECT_URI = `${env.CLIENT_URL}/auth/github/callback`;

export function getAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: "user:email",
    state,
  });
  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

async function exchangeCodeForAccessToken(code: string): Promise<string> {
  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: REDIRECT_URI,
    }),
  });

  const data = (await response.json()) as GithubAccessTokenResponse;
  if (!data.access_token) {
    throw AppError.unauthorized("Invalid GitHub authorization code");
  }
  return data.access_token;
}

async function fetchProfile(accessToken: string): Promise<GithubUserResponse> {
  const response = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
    },
  });
  if (!response.ok) {
    throw AppError.unauthorized("Failed to fetch GitHub profile");
  }
  return (await response.json()) as GithubUserResponse;
}

async function fetchPrimaryVerifiedEmail(
  accessToken: string
): Promise<string | null> {
  const response = await fetch("https://api.github.com/user/emails", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
    },
  });
  if (!response.ok) {
    return null;
  }

  const emails = (await response.json()) as GithubEmailResponse[];
  return emails.find((entry) => entry.primary && entry.verified)?.email ?? null;
}

const GithubProvider: AuthProvider<GithubProviderInput> = {
  provider: "github",
  async verify({ code }) {
    const accessToken = await exchangeCodeForAccessToken(code);
    const profile = await fetchProfile(accessToken);

    const email =
      profile.email ?? (await fetchPrimaryVerifiedEmail(accessToken));
    if (!email) {
      throw AppError.unauthorized("GitHub account has no verified email");
    }

    const [firstName, ...rest] = (profile.name ?? "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    const lastName = rest.join(" ");

    return {
      providerId: String(profile.id),
      email,
      ...((firstName ?? lastName) && {
        name: {
          ...(firstName && { firstName }),
          ...(lastName && { lastName }),
        },
      }),
      ...(profile.avatar_url !== undefined && {
        avatarUrl: profile.avatar_url,
      }),
    };
  },
};

export default GithubProvider;

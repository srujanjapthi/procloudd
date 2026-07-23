export interface AuthSession {
  userId: string;
  sessionId: string;
}

export interface OAuthSignup {
  token: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
}

export interface SessionChoice {
  sessionId: string;
  device: string;
  createdAt: number;
}

export interface SessionSummary extends SessionChoice {
  isCurrent: boolean;
}

export type LoginOutcome =
  | { requiresSessionSelection: false; session: AuthSession }
  | {
      requiresSessionSelection: true;
      token: string;
      sessions: SessionChoice[];
    };

export type OAuthLoginResponse =
  | { isNewUser: true; signup: OAuthSignup }
  | { isNewUser: false; requiresTwoFactor: true; token: string }
  | ({ isNewUser: false; requiresTwoFactor: false } & LoginOutcome);

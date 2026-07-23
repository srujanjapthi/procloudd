export interface AuthProviderProfile {
  providerId: string;
  email: string;
  name?: {
    firstName?: string;
    middleName?: string;
    lastName?: string;
  };
  avatarUrl?: string;
}

export interface AuthProvider<Input> {
  readonly provider: string;
  verify(input: Input): Promise<AuthProviderProfile>;
}

const TEST_ENV: Record<string, string> = {
  NODE_ENV: "test",
  CLIENT_URL: "http://localhost:5173",
  DB_URL: "mongodb://127.0.0.1:27017/test",
  REDIS_URL: "redis://127.0.0.1:6379",
  OTP_HMAC_SECRET: "test-otp-hmac-secret",
  SESSION_SECRET: "test-session-secret",
  OAUTH_SIGNUP_SECRET: "test-oauth-signup-secret",
  PENDING_LOGIN_SECRET: "test-pending-login-secret",
  GITHUB_OAUTH_STATE_SECRET: "test-github-oauth-state-secret",
  TOTP_ENCRYPTION_KEY:
    "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
  EMAIL_PROVIDER: "nodemailer",
  NODEMAILER_HOST: "smtp.example.com",
  NODEMAILER_PORT: "587",
  NODEMAILER_USER: "test-smtp-user",
  NODEMAILER_PASSWORD: "test-smtp-password",
  EMAIL_FROM: "ProCloudd <no-reply@example.com>",
  GOOGLE_CLIENT_ID: "test-google-client-id",
  GITHUB_CLIENT_ID: "test-github-client-id",
  GITHUB_CLIENT_SECRET: "test-github-client-secret",
};

for (const [key, value] of Object.entries(TEST_ENV)) {
  process.env[key] ??= value;
}

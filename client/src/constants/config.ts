const APP_CONFIG = {
  name: "ProCloudd",
  otp: {
    codeLength: 4,
    resendCooldownSeconds: 30,
  },
  totp: {
    codeLength: 6,
  },
  password: {
    minLength: 8,
    maxLength: 72,
  },
  username: {
    minLength: 3,
    maxLength: 30,
  },
  ui: {
    copyFeedbackMs: 1500,
    tickIntervalMs: 1000,
    googleOneTapDelayMs: 2000,
  },
  query: {
    retry: 1,
    staleTimeMs: 30_000,
  },
  preview: {
    maxTextPreviewBytes: 5 * 1024 * 1024,
  },
  recent: {
    defaultWindowDays: 30,
    windowOptions: [
      { days: 7, label: "Last 7 days" },
      { days: 30, label: "Last 30 days" },
      { days: 90, label: "Last 90 days" },
      { days: 365, label: "Last year" },
    ],
  },
} as const;

export default APP_CONFIG;

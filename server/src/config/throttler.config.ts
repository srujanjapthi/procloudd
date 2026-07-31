import * as Duration from "@/common/lib/duration.util.js";

export interface ThrottlerPolicy {
  useUserId: boolean;
  waitTime: number;
  delayAfter: number;
}

export const ThrottlerConfig = {
  keyPrefix: "throttle",
  fallbackTtlSeconds: 60,
} as const;

export const throttlerPolicies = {
  auth: {
    useUserId: true,
    waitTime: Duration.toMs("3s"),
    delayAfter: 2,
  },
  otp: {
    useUserId: false,
    waitTime: Duration.toMs("5s"),
    delayAfter: 1,
  },
  oauth: {
    useUserId: false,
    waitTime: Duration.toMs("2s"),
    delayAfter: 3,
  },
  upload: {
    useUserId: true,
    waitTime: Duration.toMs("2s"),
    delayAfter: 2,
  },
  fileOps: {
    useUserId: true,
    waitTime: Duration.toMs("1s"),
    delayAfter: 5,
  },
  download: {
    useUserId: true,
    waitTime: Duration.toMs("0.5s"),
    delayAfter: 10,
  },
  preview: {
    useUserId: true,
    waitTime: Duration.toMs("0.3s"),
    delayAfter: 30,
  },
  directoryOps: {
    useUserId: true,
    waitTime: Duration.toMs("1.5s"),
    delayAfter: 3,
  },
  userMgmt: {
    useUserId: true,
    waitTime: Duration.toMs("2.5s"),
    delayAfter: 2,
  },
  availability: {
    useUserId: false,
    waitTime: Duration.toMs("1s"),
    delayAfter: 5,
  },
  logout: {
    useUserId: true,
    waitTime: Duration.toMs("1s"),
    delayAfter: 5,
  },
  general: {
    useUserId: false,
    waitTime: Duration.toMs("0.5s"),
    delayAfter: 20,
  },
  read: {
    useUserId: true,
    waitTime: Duration.toMs("0.2s"),
    delayAfter: 50,
  },
  public: {
    useUserId: false,
    waitTime: Duration.toMs("1s"),
    delayAfter: 10,
  },
} as const satisfies Record<string, ThrottlerPolicy>;

import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { connectTestDb, disconnectTestDb, clearTestDb } from "@/test/db.js";
import { seedOtp } from "@/test/fixtures.js";
import Otp from "@/models/otp.model.js";
import AppConfig from "@/config/app.config.js";
import * as OtpHasher from "@/common/lib/otp-hasher.util.js";
import * as OtpService from "../otp.service.js";

vi.mock("@/services/email.service.js", () => ({
  default: { send: vi.fn().mockResolvedValue(undefined) },
}));
vi.mock("@/common/lib/otp-generator.util.js", () => ({
  generateOtp: vi.fn(),
}));

const { default: Email } = await import("@/services/email.service.js");
const { generateOtp } = await import("@/common/lib/otp-generator.util.js");

beforeAll(async () => {
  await connectTestDb();
}, 60_000);

afterEach(async () => {
  await clearTestDb();
  vi.mocked(Email.send).mockClear();
  vi.mocked(generateOtp).mockReset();
});

afterAll(async () => {
  await disconnectTestDb();
});

describe("sendOtp", () => {
  it("creates a hashed OTP record with zero attempts and emails the code", async () => {
    vi.mocked(generateOtp).mockReturnValue("1234");
    const email = "user@example.com";

    await OtpService.sendOtp(email, "register");

    const stored = await Otp.findOne({ email, purpose: "register" }).lean();
    expect(stored).not.toBeNull();
    expect(stored!.code).toBe(OtpHasher.hash("1234"));
    expect(stored!.attempts).toBe(0);
    expect(generateOtp).toHaveBeenCalledWith(AppConfig.otp.digits);
    expect(Email.send).toHaveBeenCalledWith(
      expect.objectContaining({ to: email })
    );
  });

  it("overwrites an existing OTP for the same email and purpose, resetting attempts", async () => {
    const email = "user@example.com";
    await seedOtp(email, "1111", "register");
    await Otp.updateOne(
      { email, purpose: "register" },
      { $set: { attempts: 3 } }
    );

    vi.mocked(generateOtp).mockReturnValue("2222");
    await OtpService.sendOtp(email, "register");

    const stored = await Otp.findOne({ email, purpose: "register" }).lean();
    expect(stored!.code).toBe(OtpHasher.hash("2222"));
    expect(stored!.attempts).toBe(0);

    await expect(
      OtpService.checkOtp(email, "1111", "register")
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("keeps separate OTPs for different purposes for the same email", async () => {
    const email = "user@example.com";

    vi.mocked(generateOtp).mockReturnValue("1111");
    await OtpService.sendOtp(email, "register");
    vi.mocked(generateOtp).mockReturnValue("2222");
    await OtpService.sendOtp(email, "login");

    const registerRecord = await Otp.findOne({
      email,
      purpose: "register",
    }).lean();
    const loginRecord = await Otp.findOne({ email, purpose: "login" }).lean();
    expect(registerRecord!.code).toBe(OtpHasher.hash("1111"));
    expect(loginRecord!.code).toBe(OtpHasher.hash("2222"));
  });
});

describe("checkOtp", () => {
  it("resolves for a correct code without deleting the record", async () => {
    const email = "user@example.com";
    await seedOtp(email, "1234", "login");

    await expect(
      OtpService.checkOtp(email, "1234", "login")
    ).resolves.toBeUndefined();

    const stored = await Otp.findOne({ email, purpose: "login" }).lean();
    expect(stored).not.toBeNull();
  });

  it("rejects when no OTP record exists", async () => {
    await expect(
      OtpService.checkOtp("nobody@example.com", "1234", "login")
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("rejects a code seeded for a different purpose", async () => {
    const email = "user@example.com";
    await seedOtp(email, "1234", "register");

    await expect(
      OtpService.checkOtp(email, "1234", "login")
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("rejects an incorrect code and increments attempts", async () => {
    const email = "user@example.com";
    await seedOtp(email, "1234", "login");

    await expect(
      OtpService.checkOtp(email, "0000", "login")
    ).rejects.toMatchObject({ statusCode: 400 });

    const stored = await Otp.findOne({ email, purpose: "login" }).lean();
    expect(stored!.attempts).toBe(1);
  });

  it("rejects and deletes the record once max attempts is reached, even with a correct code", async () => {
    const email = "user@example.com";
    await seedOtp(email, "1234", "login");
    await Otp.updateOne(
      { email, purpose: "login" },
      { $set: { attempts: AppConfig.otp.maxAttempts } }
    );

    await expect(
      OtpService.checkOtp(email, "1234", "login")
    ).rejects.toMatchObject({ statusCode: 400 });

    const stored = await Otp.findOne({ email, purpose: "login" }).lean();
    expect(stored).toBeNull();
  });
});

describe("verifyOtp", () => {
  it("resolves and deletes the record for a correct code", async () => {
    const email = "user@example.com";
    await seedOtp(email, "1234", "reset-password");

    await expect(
      OtpService.verifyOtp(email, "1234", "reset-password")
    ).resolves.toBeUndefined();

    const stored = await Otp.findOne({
      email,
      purpose: "reset-password",
    }).lean();
    expect(stored).toBeNull();
  });

  it("rejects when no OTP record exists", async () => {
    await expect(
      OtpService.verifyOtp("nobody@example.com", "1234", "reset-password")
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("rejects an incorrect code, increments attempts, and does not delete the record", async () => {
    const email = "user@example.com";
    await seedOtp(email, "1234", "reset-password");

    await expect(
      OtpService.verifyOtp(email, "0000", "reset-password")
    ).rejects.toMatchObject({ statusCode: 400 });

    const stored = await Otp.findOne({
      email,
      purpose: "reset-password",
    }).lean();
    expect(stored).not.toBeNull();
    expect(stored!.attempts).toBe(1);
  });

  it("rejects and deletes the record once max attempts is reached", async () => {
    const email = "user@example.com";
    await seedOtp(email, "1234", "reset-password");
    await Otp.updateOne(
      { email, purpose: "reset-password" },
      { $set: { attempts: AppConfig.otp.maxAttempts } }
    );

    await expect(
      OtpService.verifyOtp(email, "1234", "reset-password")
    ).rejects.toMatchObject({ statusCode: 400 });

    const stored = await Otp.findOne({
      email,
      purpose: "reset-password",
    }).lean();
    expect(stored).toBeNull();
  });

  it("allows exactly one winner when the same code is verified concurrently", async () => {
    const email = "user@example.com";
    await seedOtp(email, "1234", "login");

    const results = await Promise.allSettled([
      OtpService.verifyOtp(email, "1234", "login"),
      OtpService.verifyOtp(email, "1234", "login"),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    const stored = await Otp.findOne({ email, purpose: "login" }).lean();
    expect(stored).toBeNull();
  });
});

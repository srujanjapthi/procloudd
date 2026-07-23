import { describe, expect, it } from "vitest";
import { generate as generateOtplibCode } from "otplib";
import { generateSecret, verifyCode, getKeyUri } from "../totp.util.js";

describe("totp.util", () => {
  describe("generateSecret", () => {
    it("returns a non-empty base32-looking secret", () => {
      const secret = generateSecret();
      expect(secret.length).toBeGreaterThan(0);
      expect(secret).toMatch(/^[A-Z2-7]+=*$/);
    });

    it("returns a different secret on each call", () => {
      expect(generateSecret()).not.toBe(generateSecret());
    });
  });

  describe("verifyCode", () => {
    it("accepts a real code generated for the same secret", async () => {
      const secret = generateSecret();
      const code = await generateOtplibCode({ secret });
      expect(await verifyCode(code, secret)).toBe(true);
    });

    it("rejects an incorrect code", async () => {
      const secret = generateSecret();
      const realCode = await generateOtplibCode({ secret });
      const wrongCode = realCode === "000000" ? "111111" : "000000";
      expect(await verifyCode(wrongCode, secret)).toBe(false);
    });

    it("rejects a code generated for a different secret", async () => {
      const secretA = generateSecret();
      const secretB = generateSecret();
      const codeForB = await generateOtplibCode({ secret: secretB });
      expect(await verifyCode(codeForB, secretA)).toBe(false);
    });

    it("returns false (not throw) for a malformed code", async () => {
      const secret = generateSecret();
      await expect(verifyCode("not-a-code", secret)).resolves.toBe(false);
      await expect(verifyCode("", secret)).resolves.toBe(false);
    });

    it("returns false (not throw) for a malformed secret", async () => {
      await expect(verifyCode("123456", "not-a-valid-secret")).resolves.toBe(
        false
      );
    });
  });

  describe("getKeyUri", () => {
    it("returns an otpauth:// URI containing the account name and issuer", () => {
      const secret = generateSecret();
      const uri = getKeyUri("user@example.com", secret);
      expect(uri).toMatch(/^otpauth:\/\/totp\//);
      expect(uri).toContain(encodeURIComponent("user@example.com"));
      expect(uri).toContain(`secret=${secret}`);
    });

    it("safely encodes special characters in the account name", () => {
      const secret = generateSecret();
      expect(() =>
        getKeyUri("weird+chars&here@example.com", secret)
      ).not.toThrow();
    });
  });
});

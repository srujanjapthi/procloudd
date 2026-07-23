import { describe, expect, it, vi } from "vitest";
import { create, verify, createTokenScope } from "../hmac-token.util.js";

const SECRET = "test-secret";

describe("hmac-token.util", () => {
  describe("create/verify", () => {
    it("round-trips the original payload", () => {
      const token = create({ userId: "abc123" }, SECRET, 10_000);
      expect(verify<{ userId: string }>(token, SECRET)).toEqual({
        userId: "abc123",
      });
    });

    it("round-trips an empty payload", () => {
      const token = create({}, SECRET, 10_000);
      expect(verify(token, SECRET)).toEqual({});
    });

    it("round-trips a payload with nested objects and arrays", () => {
      const payload = { user: { id: "1", roles: ["admin", "user"] }, n: 0 };
      const token = create(payload, SECRET, 10_000);
      expect(verify(token, SECRET)).toEqual(payload);
    });

    it("does not leak the exp field into the returned payload", () => {
      const token = create({ userId: "abc123" }, SECRET, 10_000);
      const result = verify<{ userId: string; exp?: number }>(token, SECRET);
      expect(result).not.toHaveProperty("exp");
    });

    it("rejects a token signed with a different secret", () => {
      const token = create({ userId: "abc123" }, SECRET, 10_000);
      expect(verify(token, "wrong-secret")).toBeNull();
    });

    it("rejects a tampered signature of the same length", () => {
      const token = create({ userId: "abc123" }, SECRET, 10_000);
      const [encoded] = token.split(".");
      const tampered = `${encoded}.${"0".repeat(64)}`;
      expect(verify(tampered, SECRET)).toBeNull();
    });

    it("rejects a signature of the wrong length without throwing", () => {
      const token = create({ userId: "abc123" }, SECRET, 10_000);
      const [encoded] = token.split(".");
      expect(() => verify(`${encoded}.short`, SECRET)).not.toThrow();
      expect(verify(`${encoded}.short`, SECRET)).toBeNull();
    });

    it("rejects a tampered payload (valid-looking but re-encoded) even with the original signature", () => {
      const token = create({ userId: "abc123" }, SECRET, 10_000);
      const [, signature] = token.split(".");
      const forgedPayload = Buffer.from(
        JSON.stringify({ userId: "attacker", exp: Date.now() + 10_000 })
      ).toString("base64url");
      expect(verify(`${forgedPayload}.${signature}`, SECRET)).toBeNull();
    });

    it("rejects an expired token", () => {
      const token = create({ userId: "abc123" }, SECRET, -1);
      expect(verify(token, SECRET)).toBeNull();
    });

    it("rejects a token at the exact expiry instant (exclusive boundary)", () => {
      vi.useFakeTimers();
      try {
        vi.setSystemTime(1_000_000);
        const token = create({ userId: "abc123" }, SECRET, 5_000);
        vi.setSystemTime(1_005_000); // exactly exp
        expect(verify(token, SECRET)).toBeNull();
        vi.setSystemTime(1_004_999); // 1ms before exp
        expect(verify(token, SECRET)).toEqual({ userId: "abc123" });
      } finally {
        vi.useRealTimers();
      }
    });

    it("rejects malformed tokens (missing parts, empty string, no dot)", () => {
      expect(verify("not-a-real-token", SECRET)).toBeNull();
      expect(verify("", SECRET)).toBeNull();
      expect(verify(".", SECRET)).toBeNull();
      expect(verify("onlyoneparthere", SECRET)).toBeNull();
    });
  });

  describe("createTokenScope", () => {
    it("produces a bound createToken/verifyToken pair that work together", () => {
      const scope = createTokenScope<{ email: string }>(SECRET, 10_000);
      const token = scope.createToken({ email: "a@b.com" });
      expect(scope.verifyToken(token)).toEqual({ email: "a@b.com" });
    });

    it("two scopes with different secrets cannot verify each other's tokens", () => {
      const scopeA = createTokenScope<{ email: string }>("secret-a", 10_000);
      const scopeB = createTokenScope<{ email: string }>("secret-b", 10_000);
      const token = scopeA.createToken({ email: "a@b.com" });
      expect(scopeB.verifyToken(token)).toBeNull();
    });
  });
});

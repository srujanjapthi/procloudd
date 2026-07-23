import { describe, expect, it } from "vitest";
import { hash, verify } from "../otp-hasher.util.js";

describe("otp-hasher.util", () => {
  it("hashes a value that verify() then accepts as matching", () => {
    const hashed = hash("1234");
    expect(verify("1234", hashed)).toBe(true);
  });

  it("rejects an incorrect value", () => {
    const hashed = hash("1234");
    expect(verify("9999", hashed)).toBe(false);
  });

  it("is deterministic — the same input always hashes to the same output", () => {
    expect(hash("1234")).toBe(hash("1234"));
  });

  it("produces a 64-character hex digest (sha256)", () => {
    expect(hash("1234")).toMatch(/^[0-9a-f]{64}$/);
  });

  it("does not throw for a hash of a different length, just returns false", () => {
    expect(() => verify("1234", "short")).not.toThrow();
    expect(verify("1234", "short")).toBe(false);
  });

  it("round-trips an empty string", () => {
    const hashed = hash("");
    expect(verify("", hashed)).toBe(true);
    expect(verify("not-empty", hashed)).toBe(false);
  });
});

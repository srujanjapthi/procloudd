import { describe, expect, it } from "vitest";
import { hash, verify } from "../credential-hasher.util.js";

describe("credential-hasher.util", () => {
  it("hashes a value that verify() then accepts as matching", async () => {
    const hashed = await hash("correct-password");
    expect(await verify("correct-password", hashed)).toBe(true);
  });

  it("rejects an incorrect plain value", async () => {
    const hashed = await hash("correct-password");
    expect(await verify("wrong-password", hashed)).toBe(false);
  });

  it("is case-sensitive", async () => {
    const hashed = await hash("Password1!");
    expect(await verify("password1!", hashed)).toBe(false);
  });

  it("salts each hash differently, but both still verify against the original plain text", async () => {
    const [hashA, hashB] = await Promise.all([
      hash("same-password"),
      hash("same-password"),
    ]);
    expect(hashA).not.toBe(hashB);
    expect(await verify("same-password", hashA)).toBe(true);
    expect(await verify("same-password", hashB)).toBe(true);
  });

  it("does not throw for a malformed hash, just returns false", async () => {
    await expect(verify("anything", "not-a-real-hash")).resolves.toBe(false);
  });

  it("truncates input at 72 bytes (a known bcrypt limitation, not a bug)", async () => {
    const base = "a".repeat(72);
    const hashed = await hash(base);
    // Anything appended past byte 72 is silently ignored by bcrypt, so a
    // longer string sharing the same first 72 bytes verifies as a match.
    expect(await verify(base + "this-part-is-ignored", hashed)).toBe(true);
  });
});

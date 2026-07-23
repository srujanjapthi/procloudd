import { describe, expect, it } from "vitest";
import { encrypt, decrypt } from "../encryption.util.js";

describe("encryption.util", () => {
  it("round-trips plain text", () => {
    const encrypted = encrypt("my-totp-secret");
    expect(decrypt(encrypted)).toBe("my-totp-secret");
  });

  it("round-trips an empty string", () => {
    const encrypted = encrypt("");
    expect(decrypt(encrypted)).toBe("");
  });

  it("round-trips unicode/multi-byte characters", () => {
    const text = "こんにちは 🔐 é";
    expect(decrypt(encrypt(text))).toBe(text);
  });

  it("produces different ciphertext for the same input on each call (random IV)", () => {
    const a = encrypt("same-input");
    const b = encrypt("same-input");
    expect(a).not.toBe(b);
    expect(decrypt(a)).toBe("same-input");
    expect(decrypt(b)).toBe("same-input");
  });

  it("throws on a malformed value with missing parts", () => {
    expect(() => decrypt("")).toThrow("Malformed encrypted value");
    expect(() => decrypt("only-one-part")).toThrow("Malformed encrypted value");
    expect(() => decrypt("two:parts")).toThrow("Malformed encrypted value");
  });

  it("throws when the ciphertext has been tampered with", () => {
    const encrypted = encrypt("secret-value");
    const [iv, tag, ciphertext] = encrypted.split(":");
    const tamperedByte = (parseInt(ciphertext!.slice(0, 2), 16) ^ 0xff)
      .toString(16)
      .padStart(2, "0");
    const tampered = `${iv}:${tag}:${tamperedByte}${ciphertext!.slice(2)}`;
    expect(() => decrypt(tampered)).toThrow();
  });

  it("throws when the auth tag has been tampered with", () => {
    const encrypted = encrypt("secret-value");
    const [iv, tag, ciphertext] = encrypted.split(":");
    const tamperedByte = (parseInt(tag!.slice(0, 2), 16) ^ 0xff)
      .toString(16)
      .padStart(2, "0");
    const tampered = `${iv}:${tamperedByte}${tag!.slice(2)}:${ciphertext}`;
    expect(() => decrypt(tampered)).toThrow();
  });

  it("throws when the IV has been tampered with", () => {
    const encrypted = encrypt("secret-value");
    const [iv, tag, ciphertext] = encrypted.split(":");
    const tamperedByte = (parseInt(iv!.slice(0, 2), 16) ^ 0xff)
      .toString(16)
      .padStart(2, "0");
    const tampered = `${tamperedByte}${iv!.slice(2)}:${tag}:${ciphertext}`;
    expect(() => decrypt(tampered)).toThrow();
  });
});

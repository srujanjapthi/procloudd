import { createHmac, timingSafeEqual } from "node:crypto";

type WithExpiry<T> = T & { exp: number };

function sign(encoded: string, secret: string): string {
  return createHmac("sha256", secret).update(encoded).digest("hex");
}

function isSignatureValid(
  encoded: string,
  signature: string,
  secret: string
): boolean {
  const expected = Buffer.from(sign(encoded, secret));
  const actual = Buffer.from(signature);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function create<T extends object>(
  payload: T,
  secret: string,
  expiryMs: number
): string {
  const signed: WithExpiry<T> = { ...payload, exp: Date.now() + expiryMs };
  const encoded = Buffer.from(JSON.stringify(signed)).toString("base64url");
  return `${encoded}.${sign(encoded, secret)}`;
}

export function verify<T extends object>(
  token: string,
  secret: string
): T | null {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature || !isSignatureValid(encoded, signature, secret)) {
    return null;
  }

  const { exp, ...payload }: WithExpiry<T> = JSON.parse(
    Buffer.from(encoded, "base64url").toString()
  );

  return exp > Date.now() ? (payload as T) : null;
}

export function createTokenScope<T extends object>(
  secret: string,
  expiryMs: number
): {
  createToken: (payload: T) => string;
  verifyToken: (token: string) => T | null;
} {
  return {
    createToken: (payload) => create(payload, secret, expiryMs),
    verifyToken: (token) => verify<T>(token, secret),
  };
}

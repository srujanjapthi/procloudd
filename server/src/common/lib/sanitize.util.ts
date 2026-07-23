import DOMPurify from "dompurify";
import { JSDOM } from "jsdom";

const window = new JSDOM("").window;
const purify = DOMPurify(window);

function sanitizeValue(value: unknown): unknown {
  if (typeof value === "string") {
    return sanitizeString(value);
  }

  if (Array.isArray(value)) {
    return sanitizeArray(value);
  }

  if (isPlainObject(value)) {
    return sanitizeObject(value);
  }

  return value;
}

function sanitizeString(value: string): string {
  return purify.sanitize(value, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
}

function sanitizeArray(array: unknown[]): unknown[] {
  return array.map(sanitizeValue);
}

function sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [key, sanitizeValue(value)])
  );
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}

export function sanitize<T>(value: T): T {
  return sanitizeValue(value) as T;
}

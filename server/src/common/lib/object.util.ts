/**
 * Flattens a nested object into dot-notation keys, dropping `undefined`
 * values. Used to build a MongoDB `$set` from a partial update — without
 * this, `$set: { name: { middleName: "X" } }` replaces the entire `name`
 * subdocument instead of merging one field into it.
 */
export function toDotNotation(
  obj: object,
  prefix = ""
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) continue;

    const path = prefix ? `${prefix}.${key}` : key;

    if (isPlainObject(value)) {
      Object.assign(result, toDotNotation(value, path));
    } else {
      result[path] = value;
    }
  }

  return result;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    !(value instanceof Date)
  );
}

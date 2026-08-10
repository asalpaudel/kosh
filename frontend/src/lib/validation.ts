export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function stringField(value: unknown, key: string): string | null {
  if (!isRecord(value)) return null;
  return typeof value[key] === "string" ? value[key] : null;
}

export function booleanField(value: unknown, key: string): boolean | null {
  if (!isRecord(value)) return null;
  return typeof value[key] === "boolean" ? value[key] : null;
}

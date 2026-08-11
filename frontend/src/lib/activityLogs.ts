import { isRecord } from "./validation";

export interface ActivityLog {
  id: string;
  timestamp: string;
  actorName: string;
  role: string;
  action: string;
  details: string;
}

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function parseActivityLogs(value: unknown): ActivityLog[] {
  if (!Array.isArray(value)) throw new Error("Invalid activity log response");
  return value.filter(isRecord).map((record, index) => ({
    id:
      typeof record.id === "string" || typeof record.id === "number"
        ? String(record.id)
        : `activity-${String(index)}`,
    timestamp: text(record.timestamp),
    actorName: text(record.actorName),
    role: text(record.role),
    action: text(record.action),
    details: text(record.details),
  }));
}

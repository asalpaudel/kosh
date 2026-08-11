import { isRecord } from "./validation";

export interface ManagedUser {
  id: string | number;
  name: string;
  email: string;
  phone: string;
  role: string;
  sahakari: string;
  status: string;
}

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function parseManagedUser(value: unknown): ManagedUser {
  if (!isRecord(value) || (typeof value.id !== "string" && typeof value.id !== "number")) {
    throw new Error("Invalid user response");
  }
  return {
    id: value.id,
    name: text(value.name),
    email: text(value.email),
    phone: text(value.phone),
    role: text(value.role),
    sahakari: text(value.sahakari),
    status: text(value.status) || "Pending",
  };
}

export function parseManagedUsers(value: unknown): ManagedUser[] {
  if (!Array.isArray(value)) throw new Error("Invalid user list response");
  return value.map(parseManagedUser);
}

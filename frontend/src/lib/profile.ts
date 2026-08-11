import { booleanField, isRecord, stringField } from "./validation";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  role: string;
  sahakari: string;
  status: string;
  hasPhoto: boolean;
  hasCitizenship: boolean;
  hasSignature: boolean;
}

export interface ProfileUpdate {
  name: string;
  phone: string;
  address: string;
}

export function parseUserProfile(value: unknown): UserProfile {
  if (!isRecord(value)) throw new Error("Invalid profile response");
  const rawId = value.id;
  if (typeof rawId !== "string" && typeof rawId !== "number") {
    throw new Error("Profile is missing an identifier");
  }

  return {
    id: String(rawId),
    name: stringField(value, "name") ?? "",
    email: stringField(value, "email") ?? "",
    phone: stringField(value, "phone") ?? "",
    address: stringField(value, "address") ?? "",
    role: stringField(value, "role") ?? "",
    sahakari: stringField(value, "sahakari") ?? "",
    status: stringField(value, "status") ?? "Pending",
    hasPhoto: booleanField(value, "hasPhoto") ?? false,
    hasCitizenship: booleanField(value, "hasCitizenship") ?? false,
    hasSignature: booleanField(value, "hasSignature") ?? false,
  };
}

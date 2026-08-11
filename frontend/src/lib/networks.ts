import { isRecord } from "./validation";

export interface NetworkSummary {
  id: string;
  registeredId: string;
  name: string;
  address: string;
  createdAt: string;
  phone: string;
  panNumber: string;
  staffCount: number;
  userCount: number;
  packageType: string;
  packagePrice: number;
  adminLimit: number;
  userLimit: number;
  hasLogo: boolean;
  hasDocument: boolean;
}

function finiteNumber(value: unknown): number {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : 0;
}

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function parseNetworks(value: unknown): NetworkSummary[] {
  if (!Array.isArray(value)) throw new Error("Invalid networks response");
  return value.map((item) => {
    if (!isRecord(item) || (typeof item.id !== "string" && typeof item.id !== "number")) {
      throw new Error("Networks response contains an invalid item");
    }
    return {
      id: String(item.id),
      registeredId: text(item.registeredId),
      name: text(item.name) || "Unnamed cooperative",
      address: text(item.address),
      createdAt: text(item.createdAt),
      phone: text(item.phone),
      panNumber: text(item.panNumber),
      staffCount: finiteNumber(item.staffCount),
      userCount: finiteNumber(item.userCount),
      packageType: text(item.packageType),
      packagePrice: finiteNumber(item.packagePrice),
      adminLimit: finiteNumber(item.adminLimit),
      userLimit: finiteNumber(item.userLimit),
      hasLogo: item.hasLogo === true,
      hasDocument: item.hasDocument === true,
    };
  });
}

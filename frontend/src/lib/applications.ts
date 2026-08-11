import { isRecord } from "./validation";

export type ApplicationType = "fixed-deposit" | "saving-account" | "loan";

export interface UserApplication {
  id: string;
  type: ApplicationType;
  packageName: string;
  userName: string;
  status: string;
  applicationDate: string;
  reviewDate: string;
  reviewNotes: string;
  depositAmount: number | null;
  depositTerm: number | null;
  initialDeposit: number | null;
  requestedAmount: number | null;
  approvedAmount: number | null;
  interestRate: number | null;
  maturityDate: string;
  maturityAmount: number | null;
  nextPaymentDate: string;
  purpose: string;
  maxDuration: number | null;
}

function finiteNumber(value: unknown): number | null {
  const number = typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;
  return Number.isFinite(number) ? number : null;
}

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function parseUserApplications(value: unknown, type: ApplicationType): UserApplication[] {
  if (!Array.isArray(value)) throw new Error("Invalid applications response");

  return value.map((item, index) => {
    if (!isRecord(item)) throw new Error("Applications response contains an invalid item");
    const relatedKey = type === "fixed-deposit" ? "fixedDeposit" : type === "saving-account" ? "savingAccount" : "loanPackage";
    const related = isRecord(item[relatedKey]) ? item[relatedKey] : {};
    const user = isRecord(item.user) ? item.user : {};
    const rawId = item.id;

    return {
      id: typeof rawId === "string" || typeof rawId === "number" ? String(rawId) : `${type}-${String(index)}`,
      type,
      packageName: text(related.name) || "Financial package",
      userName: text(user.name) || "Member",
      status: text(item.status) || "UNKNOWN",
      applicationDate: text(item.applicationDate),
      reviewDate: text(item.reviewDate),
      reviewNotes: text(item.reviewNotes),
      depositAmount: finiteNumber(item.depositAmount),
      depositTerm: finiteNumber(item.depositTerm),
      initialDeposit: finiteNumber(item.initialDeposit),
      requestedAmount: finiteNumber(item.requestedAmount),
      approvedAmount: finiteNumber(item.approvedAmount),
      interestRate: finiteNumber(item.interestRate) ?? finiteNumber(related.interestRate),
      maturityDate: text(item.maturityDate),
      maturityAmount: finiteNumber(item.maturityAmount),
      nextPaymentDate: text(item.nextPaymentDate),
      purpose: text(item.purpose),
      maxDuration: finiteNumber(related.maxDuration),
    };
  });
}

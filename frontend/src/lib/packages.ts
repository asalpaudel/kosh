import { isRecord } from "./validation";

export type PackageType = "fixed-deposit" | "saving-account" | "loan-package";

export interface FinancePackage {
  id: string;
  name: string;
  description: string;
  interestRate: number;
  minAmount: number | null;
  maxAmount: number | null;
  minBalance: number | null;
  minDuration: number | null;
  maxDuration: number | null;
  interestBasis: string | null;
  capitalizationFrequency: string | null;
  dayCountConvention: string | null;
  maxLoanToValuePercent: number | null;
  guarantorExposureLimit: number | null;
}

function finiteNumber(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseFinancePackages(value: unknown): FinancePackage[] {
  if (!Array.isArray(value)) throw new Error("Invalid package response");

  return value.map((item) => {
    if (!isRecord(item) || (typeof item.id !== "string" && typeof item.id !== "number")) {
      throw new Error("Package response contains an invalid item");
    }

    return {
      id: String(item.id),
      name: typeof item.name === "string" ? item.name : "Unnamed package",
      description: typeof item.description === "string" ? item.description : "",
      interestRate: finiteNumber(item.interestRate) ?? 0,
      minAmount: finiteNumber(item.minAmount),
      maxAmount: finiteNumber(item.maxAmount),
      minBalance: finiteNumber(item.minBalance),
      minDuration: finiteNumber(item.minDuration),
      maxDuration: finiteNumber(item.maxDuration),
      interestBasis: typeof item.interestBasis === "string" ? item.interestBasis : null,
      capitalizationFrequency: typeof item.capitalizationFrequency === "string" ? item.capitalizationFrequency : null,
      dayCountConvention: typeof item.dayCountConvention === "string" ? item.dayCountConvention : null,
      maxLoanToValuePercent: finiteNumber(item.maxLoanToValuePercent),
      guarantorExposureLimit: finiteNumber(item.guarantorExposureLimit),
    };
  });
}

export function packageBannerUrl(apiBase: string, pkg: FinancePackage, type: PackageType): string {
  const resource = {
    "fixed-deposit": "fixed-deposits",
    "saving-account": "saving-accounts",
    "loan-package": "loan-packages",
  }[type];
  return `${apiBase}/finance/${resource}/${encodeURIComponent(pkg.id)}/banner`;
}

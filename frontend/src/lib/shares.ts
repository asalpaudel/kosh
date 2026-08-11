import { isRecord } from "./validation";

export interface ShareSettings {
  unitPrice: number;
  minimumShares: number;
  statutoryMaxShares: number;
}

export interface ShareCertificate {
  id: number;
  certificateNumber: string;
  memberId: number;
  memberName: string;
  sharesHeld: number;
  issuedDate: string;
  status: string;
}

export interface ShareTransaction {
  id: number;
  transactionNumber: string;
  transactionType: string;
  fromMemberId: number | null;
  fromMemberName: string | null;
  toMemberId: number | null;
  toMemberName: string | null;
  shareCount: number;
  unitPrice: number;
  totalAmount: number;
  transactionDate: string;
  journalSequence: number;
  narration: string;
  createdBy: string;
}

const stringField = (record: Record<string, unknown>, key: string): string =>
  typeof record[key] === "string" ? record[key] : "";
const numberField = (record: Record<string, unknown>, key: string): number => {
  const value = record[key];
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;
  if (!Number.isFinite(parsed)) throw new Error(`Invalid ${key}`);
  return parsed;
};
const nullableNumber = (record: Record<string, unknown>, key: string): number | null =>
  record[key] == null ? null : numberField(record, key);
const nullableString = (record: Record<string, unknown>, key: string): string | null =>
  record[key] == null ? null : stringField(record, key);

export function parseShareSettings(value: unknown): ShareSettings {
  if (!isRecord(value)) throw new Error("Invalid share settings response");
  return {
    unitPrice: numberField(value, "unitPrice"),
    minimumShares: numberField(value, "minimumShares"),
    statutoryMaxShares: numberField(value, "statutoryMaxShares"),
  };
}

export function parseShareCertificate(value: unknown): ShareCertificate {
  if (!isRecord(value)) throw new Error("Invalid share certificate response");
  return {
    id: numberField(value, "id"), certificateNumber: stringField(value, "certificateNumber"),
    memberId: numberField(value, "memberId"), memberName: stringField(value, "memberName"),
    sharesHeld: numberField(value, "sharesHeld"), issuedDate: stringField(value, "issuedDate"),
    status: stringField(value, "status"),
  };
}

export function parseShareCertificates(value: unknown): ShareCertificate[] {
  if (!Array.isArray(value)) throw new Error("Invalid share register response");
  return value.map(parseShareCertificate);
}

export function parseShareTransaction(value: unknown): ShareTransaction {
  if (!isRecord(value)) throw new Error("Invalid share transaction response");
  return {
    id: numberField(value, "id"), transactionNumber: stringField(value, "transactionNumber"),
    transactionType: stringField(value, "transactionType"),
    fromMemberId: nullableNumber(value, "fromMemberId"), fromMemberName: nullableString(value, "fromMemberName"),
    toMemberId: nullableNumber(value, "toMemberId"), toMemberName: nullableString(value, "toMemberName"),
    shareCount: numberField(value, "shareCount"), unitPrice: numberField(value, "unitPrice"),
    totalAmount: numberField(value, "totalAmount"), transactionDate: stringField(value, "transactionDate"),
    journalSequence: numberField(value, "journalSequence"), narration: stringField(value, "narration"),
    createdBy: stringField(value, "createdBy"),
  };
}

export function parseShareTransactions(value: unknown): ShareTransaction[] {
  if (!Array.isArray(value)) throw new Error("Invalid share transaction response");
  return value.map(parseShareTransaction);
}

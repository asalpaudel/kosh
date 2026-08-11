import { isRecord } from "./validation";

export interface TransactionRecord {
  id: string;
  userId: string | null;
  amount: number;
  date: string;
  type: string;
  accountHead: string;
  direction: string;
}

function finiteAmount(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value !== "string") return 0;
  const parsed = Number(value.replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function identifier(value: unknown): string | null {
  if (typeof value === "string" || typeof value === "number") return String(value);
  return null;
}

export function parseTransactions(value: unknown): TransactionRecord[] {
  if (!Array.isArray(value)) throw new Error("Invalid transaction response");

  return value.filter(isRecord).map((record, index) => {
    const details = isRecord(record.details) ? record.details : {};
    const type = typeof record.type === "string" ? record.type : "Transaction";
    const date = typeof record.date === "string" ? record.date : "";

    return {
      id: identifier(record.id) ?? identifier(record.transactionId) ?? `transaction-${String(index)}`,
      userId: identifier(record.userId),
      amount: finiteAmount(record.amount ?? record.amountValue),
      date,
      type,
      accountHead:
        typeof details.internalHead === "string"
          ? details.internalHead
          : typeof record.accountHead === "string"
            ? record.accountHead
            : type,
      direction: typeof details.direction === "string" ? details.direction : "",
    };
  });
}

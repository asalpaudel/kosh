import { isRecord } from "./validation";

const amount = (value: unknown): number => {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : 0;
  return Number.isFinite(parsed) ? parsed : 0;
};

export interface LedgerHistoryLine {
  lineId: string; sequenceNo: number; date: string; postedAt: string; voucherRef: string;
  narration: string; sourceType: string; sourceId: string; accountCode: string; accountName: string;
  debit: number; credit: number; change: number; balanceAfter: number; entryHash: string;
}
export interface LedgerCheckpoint {
  checkpointDate: string; sequenceNo: number; entryHash: string; publishedAt: string; recipientCount: number;
}
export interface MemberTransparency {
  memberId: string; memberName: string; savingsBalance: number; fixedDepositBalance: number;
  loanBalance: number; shareCapitalBalance: number; history: LedgerHistoryLine[]; checkpoints: LedgerCheckpoint[];
}

const id = (value: unknown): string => typeof value === "string" || typeof value === "number" ? String(value) : "";
const text = (value: unknown): string => typeof value === "string" ? value : "";

export function parseMemberTransparency(value: unknown): MemberTransparency {
  if (!isRecord(value) || !Array.isArray(value.history) || !Array.isArray(value.checkpoints)) throw new Error("Invalid member ledger response");
  return {
    memberId: id(value.memberId), memberName: text(value.memberName), savingsBalance: amount(value.savingsBalance),
    fixedDepositBalance: amount(value.fixedDepositBalance), loanBalance: amount(value.loanBalance),
    shareCapitalBalance: amount(value.shareCapitalBalance),
    history: value.history.filter(isRecord).map((line) => ({
      lineId: id(line.lineId), sequenceNo: amount(line.sequenceNo), date: text(line.date), postedAt: text(line.postedAt),
      voucherRef: text(line.voucherRef), narration: text(line.narration), sourceType: text(line.sourceType),
      sourceId: id(line.sourceId), accountCode: text(line.accountCode), accountName: text(line.accountName),
      debit: amount(line.debit), credit: amount(line.credit), change: amount(line.change),
      balanceAfter: amount(line.balanceAfter), entryHash: text(line.entryHash),
    })),
    checkpoints: value.checkpoints.filter(isRecord).map((checkpoint) => ({
      checkpointDate: text(checkpoint.checkpointDate), sequenceNo: amount(checkpoint.sequenceNo),
      entryHash: text(checkpoint.entryHash), publishedAt: text(checkpoint.publishedAt),
      recipientCount: amount(checkpoint.recipientCount),
    })),
  };
}

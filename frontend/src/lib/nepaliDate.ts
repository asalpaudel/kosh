import DateConverter from "@remotemerge/nepali-date-converter";

export interface BsDateValue { year: number; month: number; day: number }

export const BS_MONTHS = [
  "Baishakh", "Jestha", "Asar", "Shrawan", "Bhadra", "Asoj",
  "Kartik", "Mangsir", "Poush", "Magh", "Falgun", "Chaitra",
] as const;

const pad = (value: number) => String(value).padStart(2, "0");

export function adToBs(value: string): BsDateValue {
  const iso = nepalDateIso(value);
  const result = new DateConverter(iso).toBs();
  return { year: result.year, month: result.month, day: result.date };
}

export function bsToAd(value: BsDateValue): string {
  const result = new DateConverter(`${String(value.year)}-${pad(value.month)}-${pad(value.day)}`).toAd();
  return `${String(result.year)}-${pad(result.month)}-${pad(result.date)}`;
}

export function daysInBsMonth(year: number, month: number): number {
  if (year === 2099 && month === 12) return 30;
  const start = bsToAd({ year, month, day: 1 });
  const next = month === 12
    ? bsToAd({ year: year + 1, month: 1, day: 1 })
    : bsToAd({ year, month: month + 1, day: 1 });
  return Math.round((Date.parse(`${next}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86_400_000);
}

export function nepalDateIso(value: string | Date): string {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error("Invalid date");
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kathmandu", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(date);
  const field = (type: "year" | "month" | "day") => parts.find((part) => part.type === type)?.value ?? "";
  return `${field("year")}-${field("month")}-${field("day")}`;
}

export function formatBsDate(value: string | Date, nepaliNumerals = false): string {
  try {
    const bs = adToBs(nepalDateIso(value));
    const formatted = `${String(bs.year)} ${BS_MONTHS[bs.month - 1] ?? ""} ${String(bs.day)} BS`;
    return nepaliNumerals ? toNepaliDigits(formatted) : formatted;
  } catch {
    return "—";
  }
}

export function formatAdDate(value: string | Date): string {
  try {
    const iso = nepalDateIso(value);
    return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" })
      .format(new Date(`${iso}T00:00:00Z`));
  } catch {
    return "—";
  }
}

export function formatDualDate(value: string | Date): string {
  return `${formatBsDate(value)} · ${formatAdDate(value)} AD`;
}

export function toNepaliDigits(value: string): string {
  const digits = "०१२३४५६७८९";
  return value.replace(/\d/g, (digit) => digits[Number(digit)] ?? digit);
}

export function todayInNepal(): string {
  return nepalDateIso(new Date());
}

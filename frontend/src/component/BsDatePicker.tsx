import { useEffect, useMemo, useRef, useState } from "react";
import {
  BS_MONTHS, adToBs, bsToAd, daysInBsMonth, formatAdDate, toNepaliDigits, todayInNepal,
  type BsDateValue,
} from "../lib/nepaliDate";

interface BsDatePickerProps {
  value: string;
  onChange: (adDate: string) => void;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
}

const WEEKDAYS = ["आ", "सो", "मं", "बु", "बि", "शु", "श"];

export default function BsDatePicker({
  value, onChange, disabled = false, className = "", ariaLabel = "Bikram Sambat date",
}: BsDatePickerProps) {
  const fallback = adToBs(todayInNepal());
  const selected = useMemo(() => {
    if (!value) return null;
    try { return adToBs(value); } catch { return null; }
  }, [value]);
  const [view, setView] = useState<BsDateValue>(selected ?? fallback);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (selected) setView(selected); }, [selected]);
  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (rootRef.current && event.target instanceof Node && !rootRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => { document.removeEventListener("mousedown", close); };
  }, []);

  const totalDays = daysInBsMonth(view.year, view.month);
  const firstDay = new Date(`${bsToAd({ ...view, day: 1 })}T00:00:00Z`).getUTCDay();
  const years = Array.from({ length: 125 }, (_, index) => 1975 + index);
  const moveMonth = (delta: number) => {
    const index = view.year * 12 + view.month - 1 + delta;
    const year = Math.floor(index / 12);
    const month = index % 12 + 1;
    if (year >= 1975 && year <= 2098) setView({ year, month, day: 1 });
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        disabled={disabled}
        onClick={() => { setOpen((current) => !current); }}
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-left disabled:bg-gray-100 disabled:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
      >
        <span className="block text-sm font-semibold text-gray-800">
          {selected ? toNepaliDigits(`${String(selected.year)}-${String(selected.month).padStart(2, "0")}-${String(selected.day).padStart(2, "0")}`) : "मिति छान्नुहोस्"}
        </span>
        <span className="block text-[11px] text-gray-500">{value ? `${formatAdDate(value)} AD` : "Bikram Sambat"}</span>
      </button>

      {open && !disabled && (
        <div className="absolute left-0 top-full z-[80] mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-teal-100 bg-[#fffdf7] p-4 shadow-[0_24px_70px_rgba(15,118,110,0.22)]">
          <div className="mb-4 flex items-center justify-between gap-2">
            <button type="button" onClick={() => { moveMonth(-1); }} className="h-9 w-9 rounded-full border border-teal-100 text-teal-800 hover:bg-teal-50" aria-label="Previous BS month">←</button>
            <div className="flex gap-2">
              <select value={view.month} onChange={(event) => { setView((current) => ({ ...current, month: Number(event.target.value), day: 1 })); }} className="rounded-lg border border-teal-100 bg-white px-2 py-1.5 text-sm font-semibold text-teal-950">
                {BS_MONTHS.map((month, index) => <option key={month} value={index + 1}>{month}</option>)}
              </select>
              <select value={view.year} onChange={(event) => { setView((current) => ({ ...current, year: Number(event.target.value), day: 1 })); }} className="rounded-lg border border-teal-100 bg-white px-2 py-1.5 text-sm font-semibold text-teal-950">
                {years.map((year) => <option key={year} value={year}>{toNepaliDigits(String(year))}</option>)}
              </select>
            </div>
            <button type="button" onClick={() => { moveMonth(1); }} className="h-9 w-9 rounded-full border border-teal-100 text-teal-800 hover:bg-teal-50" aria-label="Next BS month">→</button>
          </div>
          <div className="mb-2 grid grid-cols-7 text-center text-[11px] font-bold text-gray-400">
            {WEEKDAYS.map((day, index) => <span key={day} className={index === 6 ? "text-red-500" : ""}>{day}</span>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }, (_, index) => <span key={`blank-${String(index)}`} />)}
            {Array.from({ length: totalDays }, (_, index) => index + 1).map((day) => {
              const active = selected?.year === view.year && selected.month === view.month && selected.day === day;
              return (
                <button key={day} type="button" onClick={() => { onChange(bsToAd({ year: view.year, month: view.month, day })); setOpen(false); }} className={`h-9 rounded-full text-sm transition ${active ? "bg-teal-700 font-bold text-white shadow" : "text-gray-700 hover:bg-teal-100"}`}>
                  {toNepaliDigits(String(day))}
                </button>
              );
            })}
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-teal-100 pt-3 text-xs text-gray-500">
            <span>BS primary · AD stored</span>
            <button type="button" onClick={() => { onChange(todayInNepal()); setOpen(false); }} className="font-bold text-teal-700 hover:text-teal-900">Today</button>
          </div>
        </div>
      )}
    </div>
  );
}

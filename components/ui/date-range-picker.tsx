import * as React from "react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";

interface DateRangePickerProps {
  date: DateRange | undefined;
  setDate: (date: DateRange | undefined) => void;
  className?: string;
}

export function DateRangePicker({
  date,
  setDate,
  className,
}: DateRangePickerProps) {
  // Simple implementation using native date inputs
  const fromDate = date?.from ? format(date.from, "yyyy-MM-dd") : "";
  const toDate = date?.to ? format(date.to, "yyyy-MM-dd") : "";

  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const d = e.target.value ? new Date(e.target.value) : undefined;
    setDate({ from: d, to: date?.to });
  };

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const d = e.target.value ? new Date(e.target.value) : undefined;
    setDate({ from: date?.from, to: d });
  };

  return (
    <div className={`flex items-center gap-2 ${className || ""}`}>
      <div className="grid gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          Từ ngày
        </label>
        <div className="relative">
          <input
            type="date"
            value={fromDate}
            onChange={handleFromChange}
            className="flex h-9 w-[130px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      </div>
      <div className="grid gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          Đến ngày
        </label>
        <div className="relative">
          <input
            type="date"
            value={toDate}
            onChange={handleToChange}
            className="flex h-9 w-[130px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      </div>
    </div>
  );
}

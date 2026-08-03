export const DAY_START_HOUR = 9;
export const DAY_END_HOUR = 19;
export const PX_PER_MINUTE = 1;
export const SLOT_MINUTES = 30;

export const STATUS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  pending:     { bg: "bg-orange-50", border: "border-orange-400", text: "text-orange-900" },
  confirmed:   { bg: "bg-teal-50",   border: "border-teal-500",   text: "text-teal-900" },
  in_progress: { bg: "bg-teal-100",  border: "border-teal-600",   text: "text-teal-900" },
  completed:   { bg: "bg-gray-50",   border: "border-gray-300",   text: "text-gray-400" },
  cancelled:   { bg: "bg-red-50",    border: "border-red-300",    text: "text-red-400 line-through" },
  no_show:     { bg: "bg-red-50",    border: "border-red-400",    text: "text-red-700" },
};

// Из ТЗ: пороги загрузки дня 20/80 + серый (выходной) + синий (только контрольные)
export type DayLoadColor = "gray" | "green" | "yellow" | "red" | "blue";

export const DAY_LOAD_STYLES: Record<DayLoadColor, string> = {
  gray:   "bg-gray-100 text-gray-400",
  green:  "bg-emerald-100 text-emerald-700",
  yellow: "bg-amber-200 text-amber-800",
  red:    "bg-red-200 text-red-700",
  blue:   "bg-sky-200 text-sky-700",
};

export const DAY_LOAD_LEGEND: { color: DayLoadColor; labelKey: string }[] = [
  { color: "green",  labelKey: "schedule.load.low" },
  { color: "yellow", labelKey: "schedule.load.mid" },
  { color: "red",    labelKey: "schedule.load.high" },
  { color: "blue",   labelKey: "schedule.load.followUp" },
];

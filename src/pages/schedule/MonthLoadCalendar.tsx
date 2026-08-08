import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { DAY_LOAD_STYLES, DAY_LOAD_LEGEND, type DayLoadColor } from "./schedule-constants";

const WEEKDAYS_SHORT: Record<string, string[]> = {
  az: ["B.e", "Ç.a", "Ç", "C.a", "C", "Ş", "B"],
  ru: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"],
  en: ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
};

const MONTHS_FULL: Record<string, string[]> = {
  az: ["Yanvar","Fevral","Mart","Aprel","May","İyun","İyul","Avqust","Sentyabr","Oktyabr","Noyabr","Dekabr"],
  ru: ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"],
  en: ["January","February","March","April","May","June","July","August","September","October","November","December"],
};

function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function getDaysInMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(); }
function dayOfWeekMon(d: Date) { return (d.getDay() + 6) % 7; }
function toKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

interface Props {
  selected: Date;
  onSelect: (d: Date) => void;
  dayLoad: Map<string, DayLoadColor>;
  viewMonth: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

export function MonthLoadCalendar({
  selected, onSelect, dayLoad, viewMonth, onPrevMonth, onNextMonth,
}: Props) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as "az" | "ru" | "en";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days = useMemo(() => {
    const first = startOfMonth(viewMonth);
    const offset = dayOfWeekMon(first);
    const count = getDaysInMonth(viewMonth);
    const cells: (Date | null)[] = [];
    for (let i = 0; i < offset; i++) cells.push(null);
    for (let i = 1; i <= count; i++) cells.push(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), i));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [viewMonth]);

  const selectedKey = toKey(selected);
  const todayKey = toKey(today);

  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-lg font-bold text-gray-900">
          {MONTHS_FULL[lang][viewMonth.getMonth()]} {viewMonth.getFullYear()}
        </span>
        <div className="flex gap-1">
          <button onClick={onPrevMonth} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 transition">‹</button>
          <button onClick={onNextMonth} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 transition">›</button>
        </div>
      </div>

      <div className="mb-1.5 grid grid-cols-7 gap-1">
        {WEEKDAYS_SHORT[lang].map((d) => (
          <div key={d} className="text-center text-[11px] font-semibold text-gray-400">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((d, idx) => {
          if (!d) return <div key={idx} />;
          const key = toKey(d);
          const isSelected = key === selectedKey;
          const isToday = key === todayKey;
          const load = dayLoad.get(key) ?? "gray";

          return (
            <button
              key={key}
              onClick={() => onSelect(d)}
              className={`relative flex h-9 w-full items-center justify-center rounded-xl text-sm font-bold transition ${
                isSelected ? "ring-2 ring-teal-500 ring-offset-1" : ""
              } ${DAY_LOAD_STYLES[load]}`}
            >
              {d.getDate()}
              {isToday && (
                <span className="absolute -bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-teal-600" />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-gray-500">
        {DAY_LOAD_LEGEND.map(({ color, labelKey }) => (
          <div key={color} className="flex items-center gap-1.5">
            <span className={`h-3 w-3 rounded-md ${DAY_LOAD_STYLES[color].split(" ")[0]}`} />
            {t(labelKey)}
          </div>
        ))}
      </div>
    </div>
  );
}

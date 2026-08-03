import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { getLoadColor } from "./desk-load-colors";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/shared/lib/supabase";

interface Props {
  selected: Date;
  onSelect: (d: Date) => void;
  doctorId: string;
  viewMonth: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

const WEEKDAYS: Record<string, string[]> = {
  az: ["B","B.e","Ç.a","Ç","C.a","C","Ş"],
  ru: ["Вс","Пн","Вт","Ср","Чт","Пт","Сб"],
  en: ["Su","Mo","Tu","We","Th","Fr","Sa"],
};

const MONTHS_FULL: Record<string, string[]> = {
  az: ["Yanvar","Fevral","Mart","Aprel","May","İyun","İyul","Avqust","Sentyabr","Oktyabr","Noyabr","Dekabr"],
  ru: ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"],
  en: ["January","February","March","April","May","June","July","August","September","October","November","December"],
};

const TOTAL_SLOTS = 20; // 09-19, слот 30 мин

function getDaysInMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}
function dayOfWeekMon(d: Date) {
  return (d.getDay() + 6) % 7;
}
function toKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

export function DeskMiniCalendar({ selected, onSelect, doctorId, viewMonth, onPrevMonth, onNextMonth }: Props) {
  const { i18n } = useTranslation();
  const lang = i18n.language as "az"|"ru"|"en";

  // Загружаем приёмы за месяц для индикации
  const { data: monthAppts = [] } = useQuery({
    queryKey: ["doctor-month", doctorId, viewMonth.getFullYear(), viewMonth.getMonth()],
    queryFn: async () => {
      const start = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
      const end = new Date(viewMonth.getFullYear(), viewMonth.getMonth()+1, 0, 23, 59, 59);
      const { data } = await supabase
        .from("appointments")
        .select("scheduled_at")
        .eq("doctor_id", doctorId)
        .not("status", "in", '("cancelled","no_show")')
        .gte("scheduled_at", start.toISOString())
        .lte("scheduled_at", end.toISOString());
      return data ?? [];
    },
    enabled: !!doctorId,
    staleTime: 5 * 60_000,
  });

  // Считаем загрузку по дням
  const dayLoad = useMemo(() => {
    const map = new Map<string, number>();
    monthAppts.forEach((a) => {
      const d = new Date(a.scheduled_at);
      const key = toKey(d);
      map.set(key, (map.get(key) ?? 0) + 1);
    });
    return map;
  }, [monthAppts]);

  const today = new Date();
  today.setHours(0,0,0,0);
  const selectedKey = toKey(selected);
  const todayKey = toKey(today);

  // Ячейки месяца
  const days = useMemo(() => {
    const first = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
    const offset = dayOfWeekMon(first);
    const count = getDaysInMonth(viewMonth);
    const cells: (Date|null)[] = [];
    for (let i=0; i<offset; i++) cells.push(null);
    for (let i=1; i<=count; i++) cells.push(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), i));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [viewMonth]);

  return (
    <div className="rounded-2xl bg-white p-3 shadow-sm">
      {/* Заголовок */}
      <div className="mb-2 flex items-center justify-between">
        <button onClick={onPrevMonth} className="rounded p-1 text-gray-400 hover:bg-gray-100">‹</button>
        <span className="text-sm font-bold text-gray-800">
          {MONTHS_FULL[lang][viewMonth.getMonth()]} {viewMonth.getFullYear()}
        </span>
        <button onClick={onNextMonth} className="rounded p-1 text-gray-400 hover:bg-gray-100">›</button>
      </div>

      {/* Дни недели */}
      <div className="mb-1 grid grid-cols-7 gap-0.5">
        {["Пн","Вт","Ср","Чт","Пт","Сб","Вс"].map((d) => (
          <div key={d} className="text-center text-[10px] font-semibold text-gray-400">{d}</div>
        ))}
      </div>

      {/* Дни */}
      <div className="grid grid-cols-7 gap-0.5">
        {days.map((d, idx) => {
          if (!d) return <div key={idx} />;
          const key = toKey(d);
          const isSelected = key === selectedKey;
          const isToday = key === todayKey;
          const count = dayLoad.get(key) ?? 0;
          const pct = Math.min(100, Math.round((count / TOTAL_SLOTS) * 100));
          const dotColor = count > 0 ? getLoadColor(pct) : null;

          return (
            <button
              key={key}
              onClick={() => onSelect(d)}
              className={`relative flex h-8 w-full flex-col items-center justify-center rounded-lg text-xs transition ${
                isSelected
                  ? "font-bold text-white"
                  : isToday
                  ? "border border-teal-400 font-semibold text-teal-700"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
              style={isSelected && dotColor
                ? { backgroundColor: dotColor }
                : isSelected
                ? { backgroundColor: "#0d9488" }
                : undefined
              }
            >
              {d.getDate()}
              {dotColor && !isSelected && (
                <span
                  className="absolute bottom-0.5 h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: dotColor }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Легенда */}
      <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-0.5">
        {[
          { color: "#4ade80", label: "до 30%" },
          { color: "#facc15", label: "30–60%" },
          { color: "#fb923c", label: "60–90%" },
          { color: "#f87171", label: ">90%" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: item.color }} />
            <span className="text-[9px] text-gray-500">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
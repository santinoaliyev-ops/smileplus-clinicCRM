import { useTranslation } from "react-i18next";
import type { ScheduleDoctor } from "@/shared/api/schedule/schedule.service";

interface Props {
  doctors: ScheduleDoctor[];
  selectedId: string | null;
  onSelect: (doctor: ScheduleDoctor) => void;
}

// Палитра из дизайна (accent teal) — инициалы визуально заменяют колонки-аватары
function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function DoctorSelector({ doctors, selectedId, onSelect }: Props) {
  const { t } = useTranslation();

  if (doctors.length === 0) return null;

  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-3 shadow-sm">
      <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
        {t("schedule.doctor")}
      </p>
      <div className="flex flex-col gap-1">
        {doctors.map((d) => {
          const active = d.id === selectedId;
          return (
            <button
              key={d.id}
              onClick={() => onSelect(d)}
              className={`flex items-center gap-2.5 rounded-2xl px-2.5 py-2 text-left transition ${
                active
                  ? "bg-teal-600 text-white shadow-sm"
                  : "text-gray-700 hover:bg-teal-50"
              }`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                  active ? "bg-white/20 text-white" : "bg-teal-100 text-teal-700"
                }`}
              >
                {initials(d.fullName)}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">
                  {d.fullName}
                </span>
                <span className={`block truncate text-xs ${active ? "text-white/70" : "text-gray-400"}`}>
                  {d.specialization}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

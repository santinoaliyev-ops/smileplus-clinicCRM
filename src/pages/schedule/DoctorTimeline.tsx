import { useMemo, type MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import type { ScheduleAppointment } from "@/shared/api/schedule/schedule.service";
import type { ScheduleException } from "@/shared/api/schedule/schedule-exceptions.service";
import { DAY_START_HOUR, DAY_END_HOUR, PX_PER_MINUTE, STATUS_COLORS } from "./schedule-constants";
import { getAge } from "@/features/doctor-dashboard/lib/desk-utils";
import { getDayExceptions, toDateKey } from "./schedule-exception-utils";

interface Props {
  appointments: ScheduleAppointment[];
  exceptions: ScheduleException[];
  day: Date;
  onSelect: (a: ScheduleAppointment) => void;
  onSlotClick: (time: { hour: number; minute: number }) => void;
}

function toMinutes(hms: string): number {
  const [h, m] = hms.split(":").map(Number);
  return h * 60 + m;
}

export function DoctorTimeline({ appointments, exceptions, day, onSelect, onSlotClick }: Props) {
  const { t } = useTranslation();
  const totalMinutes = (DAY_END_HOUR - DAY_START_HOUR) * 60;
  const dayStartMin = DAY_START_HOUR * 60;

  const now = new Date();
  const isToday = now.toDateString() === day.toDateString();
  const nowMinutes = (now.getHours() - DAY_START_HOUR) * 60 + now.getMinutes();
  const showNowLine = isToday && nowMinutes >= 0 && nowMinutes <= totalMinutes;

  const hours = Array.from({ length: DAY_END_HOUR - DAY_START_HOUR }, (_, i) => DAY_START_HOUR + i);

  const dayExceptions = useMemo(
    () => getDayExceptions(exceptions, toDateKey(day)),
    [exceptions, day]
  );

  const blockedSegments = useMemo(
    () =>
      dayExceptions.map((ex) => {
        const startMin = ex.timeFrom ? Math.max(0, toMinutes(ex.timeFrom) - dayStartMin) : 0;
        const endMin = ex.timeTo ? Math.min(totalMinutes, toMinutes(ex.timeTo) - dayStartMin) : totalMinutes;
        return { ex, startMin, endMin };
      }),
    [dayExceptions, dayStartMin, totalMinutes]
  );

  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const minutes = (e.clientY - rect.top) / PX_PER_MINUTE;
    const total = DAY_START_HOUR * 60 + minutes;
    const hour = Math.floor(total / 60);
    const minute = Math.floor((total % 60) / 30) * 30;
    onSlotClick({ hour, minute });
  };

  const fullDayException = dayExceptions.find((ex) => !ex.timeFrom || !ex.timeTo);

  return (
    <div className="relative">
      {fullDayException && (
        <div className="mb-3 flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700">
          <span>🚫</span>
          <span>
            {t("schedule.doctorOff")}
            {" — "}
            {t(`scheduleExceptions.types.${fullDayException.exceptionType}`)}
            {fullDayException.reason && ` (${fullDayException.reason})`}
          </span>
        </div>
      )}

      {hours.map((h) => (
        <div
          key={h}
          className="relative border-t border-gray-100"
          style={{ height: 60 * PX_PER_MINUTE }}
        >
          <span className="absolute -top-3 left-0 bg-white pr-3 text-sm font-bold text-gray-500">
            {String(h).padStart(2, "0")}:00
          </span>
        </div>
      ))}

      <div
        className="absolute left-16 right-0 top-0 cursor-pointer"
        style={{ height: totalMinutes * PX_PER_MINUTE }}
        onClick={handleClick}
      >
        {blockedSegments.map(({ ex, startMin, endMin }) => (
          <div
            key={ex.id}
            className="absolute left-0 right-0 flex cursor-not-allowed items-center justify-center overflow-hidden rounded-xl bg-[repeating-linear-gradient(135deg,#f3f4f6,#f3f4f6_10px,#f9fafb_10px,#f9fafb_20px)] text-xs font-medium text-gray-400"
            style={{ top: startMin * PX_PER_MINUTE, height: Math.max((endMin - startMin) * PX_PER_MINUTE, 0) }}
          >
            {t(`scheduleExceptions.types.${ex.exceptionType}`)}
          </div>
        ))}

        {showNowLine && (
          <div
            className="pointer-events-none absolute left-0 right-0 z-10 h-0.5 bg-red-500"
            style={{ top: nowMinutes * PX_PER_MINUTE }}
          />
        )}

        {appointments.map((a) => {
          const start = new Date(a.scheduledAt);
          const minutesFromStart = (start.getHours() - DAY_START_HOUR) * 60 + start.getMinutes();
          if (minutesFromStart < 0 || minutesFromStart > totalMinutes) return null;

          const age = getAge(a.patient.birthDate);
          const style = STATUS_COLORS[a.status] ?? STATUS_COLORS.confirmed;
          const end = new Date(start.getTime() + a.durationMin * 60000);

          return (
            <button
              key={a.id}
              onClick={() => onSelect(a)}
              className={`absolute left-1 right-1 overflow-hidden rounded-2xl border-l-4 px-4 py-3 text-left shadow-sm transition hover:shadow-md ${style.bg} ${style.border} ${style.text}`}
              style={{
                top: minutesFromStart * PX_PER_MINUTE,
                height: Math.max(a.durationMin * PX_PER_MINUTE, 44),
              }}
            >
              <div className="truncate text-sm font-bold leading-tight">
                {a.patient.fullName ?? a.patient.phone}
                {age !== null && <span className="ml-1 font-normal opacity-70">({age})</span>}
              </div>
              <div className="truncate text-xs opacity-70 leading-tight">
                {start.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                –{end.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                {a.arrivedAt && " ✓"}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

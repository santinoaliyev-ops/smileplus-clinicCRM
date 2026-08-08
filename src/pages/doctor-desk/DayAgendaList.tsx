import { useTranslation } from "react-i18next";
import type { DoctorAppointment } from "@/shared/api/appointments/appointments.service";
import { formatTime, getAge } from "@/features/doctor-dashboard/lib/desk-utils";

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-orange-100 text-orange-600",
  confirmed: "bg-teal-100 text-teal-700",
  in_progress: "bg-sky-100 text-sky-700",
  completed: "bg-gray-100 text-gray-500",
  cancelled: "bg-red-100 text-red-400 line-through",
  no_show: "bg-red-100 text-red-600",
};

/** Read-only список приёмов на выбранный (не сегодняшний) день — без live-действий */
export function DayAgendaList({ appointments }: { appointments: DoctorAppointment[] }) {
  const { t } = useTranslation();

  if (appointments.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-white text-gray-400">
        <span className="mb-3 text-4xl">📅</span>
        <p className="text-sm font-medium">{t("doctorDesk.noAppointmentsToday")}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-2 overflow-y-auto">
      {appointments.map((a) => {
        const age = getAge(a.patient.birthDate);
        return (
          <div
            key={a.id}
            className="flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-sm"
          >
            <div>
              <p className="text-sm font-medium text-gray-800">
                {a.patient.fullName ?? a.patient.phone}
                {age !== null && (
                  <span className="ml-1.5 font-normal text-gray-400">({age})</span>
                )}
              </p>
              <span
                className={`mt-0.5 inline-block rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                  STATUS_BADGE[a.status] ?? "bg-gray-100 text-gray-500"
                }`}
              >
                {t(`schedule.statuses.${a.status}`)}
              </span>
            </div>
            <span className="text-sm font-semibold text-teal-600">
              {formatTime(a.scheduledAt)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

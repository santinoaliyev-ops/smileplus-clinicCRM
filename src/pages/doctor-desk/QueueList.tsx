import { useTranslation } from "react-i18next";
import type { DoctorAppointment } from "@/shared/api/appointments/appointments.service";
import { formatTime, getAge } from "@/features/doctor-dashboard/lib/desk-utils";

export function QueueList({ appointments }: { appointments: DoctorAppointment[] }) {
  const { t } = useTranslation();
  if (appointments.length === 0) return null;

  return (
    <div className="mt-1">
      <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
        {t("doctorDesk.queue")}
      </p>
      <div className="space-y-2">
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
                    <span className="ml-1.5 font-normal text-gray-400">
                      ({age})
                    </span>
                  )}
                </p>
                {a.status === "pending" && (
                  <span className="text-xs text-orange-500">
                    {t("doctorDesk.unconfirmed")}
                  </span>
                )}
              </div>
              <span className="text-sm font-semibold text-teal-600">
                {formatTime(a.scheduledAt)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
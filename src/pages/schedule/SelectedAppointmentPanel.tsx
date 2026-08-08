import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import type { ScheduleAppointment } from "@/shared/api/schedule/schedule.service";
import { useScheduleActions } from "@/features/schedule/hooks/useSchedule";

interface Props {
  appointment: ScheduleAppointment | null;
  dayStats: { total: number; free: number; premium: number };
  onAddPatient: () => void;
}

export function SelectedAppointmentPanel({ appointment, dayStats, onAddPatient }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { confirm, markArrived } = useScheduleActions();

  return (
    <div className="flex w-80 shrink-0 flex-col gap-3">
      <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-gray-900">{t("schedule.selectedAppointment")}</h2>

        {!appointment ? (
          <p className="py-6 text-center text-sm text-gray-400">{t("schedule.noSelection")}</p>
        ) : (
          <>
            <p className="font-bold text-gray-900">
              {appointment.patient.fullName ?? appointment.patient.phone}
            </p>
            <p className="mb-3 text-sm text-gray-500">
              {new Date(appointment.scheduledAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
              {" – "}
              {new Date(new Date(appointment.scheduledAt).getTime() + appointment.durationMin * 60000)
                .toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
            </p>

            {appointment.notes && (
              <>
                <p className="text-xs font-medium text-gray-400">{t("doctorDesk.comment")}</p>
                <p className="mb-3 text-sm text-gray-700">{appointment.notes}</p>
              </>
            )}

            <p className="text-xs font-medium text-gray-400">{t("schedule.statusLabel")}</p>
            <p className="mb-4 text-sm font-medium text-gray-700">
              {t(`schedule.statuses.${appointment.status}`)}
            </p>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => navigate(`/doctor/invoice/${appointment.id}`)}
                className="rounded-2xl bg-teal-600 py-2.5 text-sm font-bold text-white hover:bg-teal-700 transition"
              >
                {t("schedule.openAppointment")}
              </button>
              {appointment.status === "pending" && (
                <button
                  onClick={() => confirm.mutate(appointment.id)}
                  className="rounded-2xl border border-teal-500 py-2.5 text-sm font-bold text-teal-600 hover:bg-teal-50 transition"
                >
                  {t("schedule.confirm")}
                </button>
              )}
              {!appointment.arrivedAt && (
                <button
                  onClick={() => markArrived.mutate(appointment.id)}
                  className="rounded-2xl border border-teal-500 py-2.5 text-sm font-bold text-teal-600 hover:bg-teal-50 transition"
                >
                  {t("doctorDesk.markArrived")}
                </button>
              )}
              <button
                onClick={onAddPatient}
                className="rounded-2xl bg-gray-900 py-2.5 text-sm font-bold text-white hover:bg-gray-800 transition"
              >
                {t("schedule.addPatient")}
              </button>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
          <p className="text-xs text-gray-400">{t("schedule.today")}</p>
          <p className="text-xl font-bold text-gray-900">{dayStats.total}</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
          <p className="text-xs text-gray-400">{t("schedule.free")}</p>
          <p className="text-xl font-bold text-gray-900">{dayStats.free}</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
          <p className="text-xs text-gray-400">{t("schedule.premium")}</p>
          <p className="text-xl font-bold text-gray-900">{dayStats.premium}</p>
        </div>
      </div>
    </div>
  );
}

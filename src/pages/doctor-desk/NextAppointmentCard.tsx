import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import type { DoctorAppointment } from "@/shared/api/appointments/appointments.service";
import {
  endTime,
  formatTime,
  getAge,
  getNextTimer,
} from "@/features/doctor-dashboard/lib/desk-utils";
import { usePatientSummary } from "@/features/doctor-dashboard/hooks/usePatientSummary";
import { PatientStatusDot } from "./PatientStatusDot";
import { SubscriptionBadge } from "./SubscriptionBadge";

interface Props {
  appointment: DoctorAppointment;
  now: Date;
  canStart: boolean;
  onStart: () => void;
  onArrived: () => void;
  onNoShow: () => void;
}

const TONE_BG = {
  blue: "bg-teal-600",
  yellow: "bg-amber-500",
  red: "bg-red-500",
} as const;

const TONE_TEXT = {
  blue: "text-white",
  yellow: "text-white",
  red: "text-white",
} as const;

export function NextAppointmentCard({
  appointment, now, canStart, onStart, onArrived, onNoShow,
}: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const timer = getNextTimer(appointment, now);
  const age = getAge(appointment.patient.birthDate);
  const { data: summary } = usePatientSummary(appointment.patient.id);

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
      {/* Таймер */}
      <div className={`${TONE_BG[timer.tone]} px-4 py-3`}>
        <p className={`text-xs font-medium opacity-80 ${TONE_TEXT[timer.tone]}`}>
          {timer.tone === "blue"
            ? t("doctorDesk.timeToNext")
            : t("doctorDesk.patientLate")}
        </p>
        <p className={`text-2xl font-bold ${TONE_TEXT[timer.tone]}`}>
          {timer.tone === "blue"
            ? t("doctorDesk.minutesShort", { count: timer.minutes })
            : t("doctorDesk.lateBy", { count: timer.minutes })}
        </p>
        {timer.progress !== null && (
          <div className="mt-2 h-1.5 w-full rounded-full bg-white/30">
            <div
              className="h-1.5 rounded-full bg-white transition-all"
              style={{ width: `${Math.round(timer.progress * 100)}%` }}
            />
          </div>
        )}
        {timer.waitingMinutes !== null && (
          <p className={`mt-1.5 text-xs font-semibold ${TONE_TEXT[timer.tone]}`}>
            {t("doctorDesk.patientWaiting", { count: timer.waitingMinutes })}
          </p>
        )}
      </div>

      {/* Пациент */}
      <div className="p-4 flex flex-col gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            {summary && <PatientStatusDot isPrimary={summary.isPrimary} />}
            <span className="font-semibold text-gray-900">
              {appointment.patient.fullName ?? appointment.patient.phone}
            </span>
            {age !== null && (
              <span className="text-sm text-gray-400">
                ({t("common.years_old", { count: age })})
              </span>
            )}
            {summary && <SubscriptionBadge subscription={summary.subscription} />}
          </div>
          <p className="mt-0.5 text-sm text-gray-500">
            {formatTime(appointment.scheduledAt)} –{" "}
            {endTime(appointment.scheduledAt, appointment.durationMin)}{" "}
            <span className="text-gray-400">
              ({appointment.durationMin} {t("common.minutes")})
            </span>
          </p>
          {appointment.status === "pending" && (
            <span className="mt-1 inline-block rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-600">
              {t("doctorDesk.unconfirmed")}
            </span>
          )}
          {appointment.notes && (
            <p className="mt-1.5 text-xs text-gray-500 bg-gray-50 rounded-lg px-2.5 py-1.5">
              {appointment.notes}
            </p>
          )}
        </div>

        {/* Действия */}
        <div className="flex flex-col gap-2">
          <button
            onClick={onStart}
            disabled={!canStart}
            className="w-full rounded-xl bg-teal-600 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-40 transition"
          >
            {t("doctorDesk.startAppointment")}
          </button>
          {!appointment.arrivedAt && (
            <button
              onClick={onArrived}
              className="w-full rounded-xl border border-teal-200 bg-teal-50 py-2 text-sm font-medium text-teal-700 hover:bg-teal-100 transition"
            >
              {t("doctorDesk.markArrived")}
            </button>
          )}
          {timer.tone !== "blue" && (
            <button
              onClick={onNoShow}
              className="w-full rounded-xl border border-red-200 py-2 text-sm text-red-600 hover:bg-red-50 transition"
            >
              {t("doctorDesk.noShow")}
            </button>
          )}
          <button
            onClick={() =>
              navigate("/schedule", {
                state: { preselectPatientId: appointment.patient.id },
              })
            }
            className="w-full rounded-xl border border-dashed border-gray-300 py-2 text-sm text-gray-500 hover:bg-gray-50 transition"
          >
            {t("doctorDesk.bookNext")}
          </button>
        </div>
      </div>
    </div>
  );
}
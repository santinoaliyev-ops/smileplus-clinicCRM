import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import type { DoctorAppointment } from "@/shared/api/appointments/appointments.service";
import {
  endTime,
  formatTime,
  getAge,
} from "@/features/doctor-dashboard/lib/desk-utils";
import { usePatientSummary } from "@/features/doctor-dashboard/hooks/usePatientSummary";

import { PatientStatusDot } from "./PatientStatusDot";
import { SubscriptionBadge } from "./SubscriptionBadge";

interface Props {
  appointment: DoctorAppointment;
  onFinish: () => void;
}

export function CurrentAppointmentPanel({ appointment }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const age = getAge(appointment.patient.birthDate);
  const { data: summary } = usePatientSummary(appointment.patient.id);

  return (
    <div className="flex w-72 shrink-0 flex-col gap-4 overflow-y-auto rounded-2xl bg-white p-5 shadow-sm ring-2 ring-teal-400 self-start max-h-full">
      {/* Время приёма */}
      <div>
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">
          {t("doctorDesk.appointment")}
        </p>
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold text-gray-900">
            {formatTime(appointment.scheduledAt)} –{" "}
            {endTime(appointment.scheduledAt, appointment.durationMin)}
          </span>
          <span className="text-sm text-gray-400">
            ({appointment.durationMin} {t("common.minutes")})
          </span>
        </div>
      </div>

      {/* Пациент */}
      <div>
        <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-gray-400">
          {t("createAppointment.patient")}
        </p>
        <div className="flex items-start gap-2">
          {summary && <PatientStatusDot isPrimary={summary.isPrimary} />}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => navigate(`/patient/${appointment.patient.id}`)}
                className="font-semibold text-gray-900 transition hover:text-teal-600"
              >
                {appointment.patient.fullName ?? appointment.patient.phone}
              </button>
              {age !== null && (
                <span className="text-sm text-gray-500">
                  ({t("common.years_old", { count: age })})
                </span>
              )}
              {summary && (
                <SubscriptionBadge subscription={summary.subscription} />
              )}
            </div>
            <span className="text-xs text-gray-400">
              {appointment.patient.phone}
            </span>
          </div>
        </div>

        {/* Статус */}
        {summary && (
          <span
            className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
              summary.isPrimary
                ? "bg-red-50 text-red-600"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            {t(summary.isPrimary ? "doctorDesk.primary" : "doctorDesk.returning")}
          </span>
        )}
      </div>

      {/* Комментарий */}
      {appointment.notes && (
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">
            {t("doctorDesk.comment")}
          </p>
          <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-gray-700">
            {appointment.notes}
          </p>
        </div>
      )}

      {/* Последний приём */}
      {summary?.lastVisit && (
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">
            {t("doctorDesk.lastVisit")}
          </p>
          <div className="text-sm text-gray-700">
            <span className="font-medium">
              {new Date(summary.lastVisit.date).toLocaleDateString("ru-RU", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
            {summary.lastVisit.doctorName && (
              <span className="ml-2 rounded-full bg-teal-50 px-2 py-0.5 text-xs text-teal-700">
                {summary.lastVisit.doctorName}
              </span>
            )}
            {summary.lastVisit.procedureType && (
              <div className="mt-0.5 text-xs text-gray-500">
                {t(`procedures.${summary.lastVisit.procedureType}`)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
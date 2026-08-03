import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import type { DoctorAppointment } from "@/shared/api/appointments/appointments.service";
import { useAppointmentHasInvoice } from "@/features/doctor-dashboard/hooks/useInvoice";

interface Props {
  appointment: DoctorAppointment;
  onFinish: () => void;
}

export function AppointmentManagement({ appointment, onFinish }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: hasInvoice = false, isLoading: invoiceCheckLoading } = useAppointmentHasInvoice(appointment.id);
  const canFinish = hasInvoice && !invoiceCheckLoading;

  return (
    <div className="flex flex-1 flex-col gap-2 overflow-hidden rounded-2xl bg-white p-5 shadow-sm min-h-0 self-start">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-800">
          {t("doctorDesk.managementTitle")}
        </span>
        <button
          onClick={onFinish}
          disabled={!canFinish}
          title={canFinish ? undefined : t("doctorDesk.finishRequiresInvoice")}
          className="rounded-xl bg-teal-600 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
        >
          {t("doctorDesk.finishAppointment")}
        </button>
      </div>
      {!canFinish && !invoiceCheckLoading && (
        <p className="-mt-1 mb-1 text-xs text-amber-600">
          {t("doctorDesk.finishRequiresInvoice")}
        </p>
      )}

      <div className="divide-y divide-gray-100">
        {/* Наряд */}
        <div className="flex items-center justify-between py-3">
          <span className="text-sm text-gray-700">{t("doctorDesk.invoice")}</span>
          {hasInvoice ? (
            <span className="flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700">
              ✓ {t("doctorDesk.invoiceSent")}
            </span>
          ) : (
            <button
              onClick={() => navigate(`/doctor/invoice/${appointment.id}`)}
              className="flex items-center gap-1.5 rounded-lg border border-teal-300 bg-teal-50 px-3 py-1.5 text-sm font-medium text-teal-700 transition hover:bg-teal-100"
            >
              + {t("doctorDesk.add")}
            </button>
          )}
        </div>

        {/* Случай обслуживания */}
        <div className="flex items-center justify-between py-3">
          <span className="text-sm text-gray-700">
            {t("doctorDesk.clinicalRecord")}
          </span>
          <button
            onClick={() => navigate(`/patient/${appointment.patient.id}`)}
            className="flex items-center gap-1.5 rounded-lg border border-teal-300 bg-teal-50 px-3 py-1.5 text-sm font-medium text-teal-700 transition hover:bg-teal-100"
          >
            + {t("doctorDesk.add")}
          </button>
        </div>

        {/* Продолжение лечения */}
        <div className="flex items-center justify-between py-3">
          <span className="text-sm text-gray-700">
            {t("doctorDesk.continuationOfTreatment")}
          </span>
          <button
            onClick={() =>
              navigate("/schedule", {
                state: { preselectPatientId: appointment.patient.id },
              })
            }
            className="flex items-center gap-1.5 rounded-lg border border-teal-300 bg-teal-50 px-3 py-1.5 text-sm font-medium text-teal-700 transition hover:bg-teal-100"
          >
            + {t("doctorDesk.book")}
          </button>
        </div>
      </div>
    </div>
  );
}
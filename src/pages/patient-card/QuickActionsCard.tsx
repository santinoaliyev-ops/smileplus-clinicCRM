import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

interface Props {
  patientId: string;
}

export function QuickActionsCard({ patientId }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const bookAppointment = () =>
    navigate("/schedule", { state: { preselectPatientId: patientId } });

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm">
      <div className="shrink-0 border-b border-gray-100 px-4 py-3">
        <span className="text-sm font-semibold text-gray-800">{t("patientCard.quickActions")}</span>
      </div>
      <div className="flex flex-col gap-2 p-3">
        <button
          onClick={bookAppointment}
          className="rounded-xl bg-teal-600 py-2 text-sm font-semibold text-white transition hover:bg-teal-700"
        >
          + {t("patientCard.newAppointment")}
        </button>
        <button
          onClick={() => navigate(`/doctor/treatment-plan/${patientId}`)}
          className="rounded-xl border border-teal-300 bg-teal-50 py-2 text-sm font-medium text-teal-700 transition hover:bg-teal-100"
        >
          + {t("treatmentPlan.new")}
        </button>
        <button
          onClick={bookAppointment}
          className="rounded-xl border border-gray-200 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
        >
          {t("patientCard.bookPatient")}
        </button>
        <button
          disabled
          title={t("common.comingSoon")}
          className="cursor-not-allowed rounded-xl border border-gray-100 py-2 text-sm font-medium text-gray-300"
        >
          + {t("patientCard.addPhoto")}
        </button>
        <button
          disabled
          title={t("common.comingSoon")}
          className="cursor-not-allowed rounded-xl border border-gray-100 py-2 text-sm font-medium text-gray-300"
        >
          + {t("patientCard.addXray")}
        </button>
        <button
          disabled
          title={t("common.comingSoon")}
          className="cursor-not-allowed rounded-xl border border-gray-100 py-2 text-sm font-medium text-gray-300"
        >
          {t("patientCard.sendToCashier")}
        </button>
      </div>
    </div>
  );
}

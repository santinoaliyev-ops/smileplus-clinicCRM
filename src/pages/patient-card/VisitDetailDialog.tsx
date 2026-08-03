import { useTranslation } from "react-i18next";
import { useVisitDetail } from "@/features/patient-card/hooks/usePatientProfile";

interface Props {
  appointmentId: string;
  onClose: () => void;
}

export function VisitDetailDialog({ appointmentId, onClose }: Props) {
  const { t } = useTranslation();
  const { data: visit, isLoading } = useVisitDetail(appointmentId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between">
          <h2 className="text-base font-semibold text-gray-900">
            {t("patientCard.visitDetail")}
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        {isLoading || !visit ? (
          <p className="py-6 text-center text-sm text-gray-400">
            {t("common.loading")}
          </p>
        ) : (
          <>
            <p className="mb-3 text-sm text-gray-500">
              {new Date(visit.scheduledAt).toLocaleString("ru-RU", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>

            <div className="space-y-2">
              {visit.procedures.map((p, i) => (
                <div
                  key={i}
                  className="flex items-start justify-between rounded-xl bg-gray-50 px-3 py-2 text-sm"
                >
                  <div>
                    <div className="font-medium text-gray-800">{p.name}</div>
                    {p.toothNumbers.length > 0 && (
                      <div className="text-xs text-gray-400">
                        🦷 {p.toothNumbers.join(", ")}
                      </div>
                    )}
                  </div>
                  <span className="font-semibold text-gray-900">
                    {p.amountTotal} ₼
                  </span>
                </div>
              ))}
            </div>

            {visit.notes && (
              <div className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
                <span className="font-medium">{t("doctorDesk.comment")}: </span>
                {visit.notes}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
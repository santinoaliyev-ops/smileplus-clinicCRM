import { useTranslation } from "react-i18next";
import { usePatientFinanceSummary } from "@/features/patient-card/hooks/usePatientProfile";

interface Props {
  patientId: string;
}

export function FinanceCard({ patientId }: Props) {
  const { t } = useTranslation();
  const { data, isLoading, isError } = usePatientFinanceSummary(patientId);

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm">
      <div className="shrink-0 border-b border-gray-100 px-4 py-3">
        <span className="text-sm font-semibold text-gray-800">{t("patientCard.finance")}</span>
      </div>
      <div className="p-4">
        {isLoading ? (
          <p className="text-center text-sm text-gray-400">{t("common.loading")}</p>
        ) : isError || !data ? (
          <p className="text-center text-sm text-gray-400">{t("patientCard.financeUnavailable")}</p>
        ) : (
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">{t("patientCard.totalInvoices")}</span>
              <span className="font-medium text-gray-800">{data.invoiceCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{t("patientCard.paid")}</span>
              <span className="font-medium text-green-600">{data.paidAmount} ₼</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{t("patientCard.unpaid")}</span>
              <span className={`font-medium ${data.unpaidAmount > 0 ? "text-red-600" : "text-gray-800"}`}>
                {data.unpaidAmount} ₼
              </span>
            </div>
            <div className="flex justify-between border-t border-gray-50 pt-2.5">
              <span className="text-gray-500">{t("patientCard.coveredBySubscription")}</span>
              <span className="font-medium text-teal-600">{data.coveredAmount} ₼</span>
            </div>
            {data.lastInvoice && (
              <div className="flex justify-between border-t border-gray-50 pt-2.5">
                <span className="text-gray-500">{t("patientCard.lastInvoice")}</span>
                <span className="font-medium text-gray-800">
                  {new Date(data.lastInvoice.date).toLocaleDateString("ru-RU", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                  {" · "}
                  {data.lastInvoice.amount} ₼
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

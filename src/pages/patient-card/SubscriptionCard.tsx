import { useTranslation } from "react-i18next";
import type { PatientProfile } from "@/shared/api/patients/patient-profile.service";

interface Props {
  subscription: PatientProfile["subscription"];
}

export function SubscriptionCard({ subscription }: Props) {
  const { t } = useTranslation();

  if (!subscription) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
          {t("patientCard.subscription")}
        </p>
        <p className="text-sm text-gray-400">{t("invoice.noSubscription")}</p>
      </div>
    );
  }

  const remaining = subscription.coverageLimit - subscription.coverageUsed;
  const isActive = !subscription.endDate || new Date(subscription.endDate) >= new Date();

  return (
    <div className="rounded-2xl border border-teal-100 bg-teal-50/50 p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
          {t("patientCard.subscription")}
        </p>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
            isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
          }`}
        >
          {isActive ? t("patientCard.subscriptionActive") : t("patientCard.subscriptionExpired")}
        </span>
      </div>
      <p className="text-lg font-bold text-teal-800">{subscription.plan.toUpperCase()}</p>
      {subscription.endDate && (
        <p className="text-xs text-gray-500">
          {t("patientCard.until")}{" "}
          {new Date(subscription.endDate).toLocaleDateString("ru-RU", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      )}
      <p className="mt-2 text-sm text-gray-700">
        {t("patientCard.remaining")}: <span className="font-semibold text-teal-700">{remaining} ₼</span>
      </p>
    </div>
  );
}

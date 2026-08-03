import { useTranslation } from "react-i18next";
import type { PatientSubscriptionInfo } from "@/shared/api/patients/patient-summary.service";

export function SubscriptionBadge({
  subscription,
}: {
  subscription: PatientSubscriptionInfo | null;
}) {
  const { t } = useTranslation();
  if (!subscription) return null;

  const remaining = subscription.coverageLimit - subscription.coverageUsed;

  return (
    <span
      title={`${t("doctorDesk.subscription", { plan: subscription.plan })} · ${remaining} ₼`}
      className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs"
    >
      ☂️
    </span>
  );
}
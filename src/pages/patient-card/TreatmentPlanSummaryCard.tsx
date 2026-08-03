import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useClinic } from "@/app/providers/clinic";
import { usePatientPlans, usePlanActions } from "@/features/treatment-plans/hooks/useTreatmentPlans";
import { useClinicProcedures } from "@/features/doctor-dashboard/hooks/useInvoice";
import type { TreatmentPlanItem } from "@/shared/api/treatment-plans/treatment-plans.service";

interface Props {
  patientId: string;
}

export function TreatmentPlanSummaryCard({ patientId }: Props) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { clinic } = useClinic();
  const lang = i18n.language as "az" | "ru" | "en";

  const { data: plans = [], isLoading } = usePatientPlans(patientId);
  const { data: proceduresData } = useClinicProcedures(clinic?.clinicId, patientId);
  const { markCompleted } = usePlanActions(patientId);

  const getProcName = (procedureId: string) => {
    const p = proceduresData?.procedures.find((pr) => pr.procedureId === procedureId);
    if (!p) return "—";
    return lang === "ru" ? p.nameRu : lang === "en" ? p.nameEn : p.nameAz;
  };

  const activePlan =
    plans.find((p) => p.status === "active") ?? plans.find((p) => p.status === "draft") ?? plans[0];

  const itemStatusLabel = (item: TreatmentPlanItem) => {
    if (item.isCompleted) return { label: t("treatmentPlan.itemDone"), cls: "bg-green-100 text-green-700" };
    if (activePlan?.status === "active") return { label: t("treatmentPlan.itemPending"), cls: "bg-amber-100 text-amber-700" };
    return { label: t("treatmentPlan.itemPlanned"), cls: "bg-gray-100 text-gray-500" };
  };

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm">
      <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-4 py-3">
        <span className="text-sm font-semibold text-gray-800">{t("treatmentPlan.title")}</span>
        <button
          onClick={() => navigate(`/doctor/treatment-plan/${patientId}`)}
          className="text-xs font-medium text-teal-600 hover:text-teal-700"
        >
          {t("treatmentPlan.openPage")} →
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center text-sm text-gray-400">{t("common.loading")}</div>
        ) : !activePlan || activePlan.items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-6 text-center text-sm text-gray-400">
            <span>{t("treatmentPlan.empty")}</span>
            <button
              onClick={() => navigate(`/doctor/treatment-plan/${patientId}`)}
              className="rounded-lg bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700 hover:bg-teal-100"
            >
              + {t("treatmentPlan.new")}
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {activePlan.items.map((item) => {
              const status = itemStatusLabel(item);
              return (
                <div key={item.id} className="flex items-center justify-between gap-2 px-4 py-2.5 text-sm">
                  <div className="min-w-0">
                    <div className={`truncate font-medium ${item.isCompleted ? "text-gray-400 line-through" : "text-gray-800"}`}>
                      {getProcName(item.procedureId)}
                      {item.toothNumbers.length > 0 && (
                        <span className="ml-1.5 font-normal text-gray-400">
                          🦷 {item.toothNumbers.join(", ")}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => !item.isCompleted && markCompleted.mutate(item.id)}
                    disabled={item.isCompleted}
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${status.cls}`}
                  >
                    {status.label}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

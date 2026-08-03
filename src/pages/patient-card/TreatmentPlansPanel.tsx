import { useState } from "react";
import { useTranslation } from "react-i18next";

import {
  usePatientPlans,
  useCreatePlan,
  usePlanActions,
} from "@/features/treatment-plans/hooks/useTreatmentPlans";
import { useClinic } from "@/app/providers/clinic";
import { useDoctorProfile } from "@/features/doctor-dashboard/hooks/useDoctorProfile";
import { useClinicProcedures } from "@/features/doctor-dashboard/hooks/useInvoice";
import { ToothChart } from "@/shared/ui/tooth-chart";
import type {
  TreatmentPlan,
  TreatmentPlanStatus,
} from "@/shared/api/treatment-plans/treatment-plans.service";
import type { ClinicProcedure } from "@/shared/api/invoices/invoice.service";

const STATUS_LABELS: Record<TreatmentPlanStatus, string> = {
  draft: "Qaralama",
  active: "Aktiv",
  completed: "Tamamlandı",
  archived: "Arxiv",
};

const STATUS_COLORS: Record<TreatmentPlanStatus, string> = {
  draft: "bg-gray-100 text-gray-600",
  active: "bg-teal-100 text-teal-700",
  completed: "bg-green-100 text-green-700",
  archived: "bg-amber-100 text-amber-700",
};

interface Props {
  patientId: string;
}

export function TreatmentPlansPanel({ patientId }: Props) {
  const { t, i18n } = useTranslation();
  const { clinic } = useClinic();
  const { data: doctor } = useDoctorProfile();
  const lang = i18n.language as "az" | "ru" | "en";

  const { data: plans = [], isLoading } = usePatientPlans(patientId);
  const createPlan = useCreatePlan(patientId);
  const { updateStatus, markCompleted } = usePlanActions(patientId);
  const { data: proceduresData } = useClinicProcedures(clinic?.clinicId, patientId);

  const [creating, setCreating] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<TreatmentPlan | null>(null);

  // Форма нового плана
  const [planTitle, setPlanTitle] = useState("");
  const [planNotes, setPlanNotes] = useState("");
  const [selectedTeeth, setSelectedTeeth] = useState<number[]>([]);
  const [planItems, setPlanItems] = useState<{
    procedure: ClinicProcedure;
    toothNumbers: number[];
    quantity: number;
  }[]>([]);
  const [error, setError] = useState<string | null>(null);

  const getProcName = (p: ClinicProcedure) =>
    lang === "ru" ? p.nameRu : lang === "en" ? p.nameEn : p.nameAz;

  const addItem = (p: ClinicProcedure) => {
    setPlanItems((prev) => [
      ...prev,
      { procedure: p, toothNumbers: [...selectedTeeth], quantity: 1 },
    ]);
    setSelectedTeeth([]);
  };

  const removeItem = (idx: number) =>
    setPlanItems((prev) => prev.filter((_, i) => i !== idx));

  const submitPlan = async () => {
    if (!doctor || !clinic) return;
    if (planItems.length === 0) {
      setError(t("treatmentPlan.emptyItems"));
      return;
    }
    setError(null);
    try {
      await createPlan.mutateAsync({
        patientId,
        doctorId: doctor.id,
        clinicId: clinic.clinicId,
        title: planTitle || undefined,
        notes: planNotes || undefined,
        items: planItems.map((item) => ({
          procedureId: item.procedure.procedureId,
          procedureName: getProcName(item.procedure),
          toothNumbers: item.toothNumbers,
          quantity: item.quantity,
          priceSnapshot: item.procedure.patientPrice,
        })),
      });
      setCreating(false);
      setPlanTitle("");
      setPlanNotes("");
      setPlanItems([]);
    } catch {
      setError(t("treatmentPlan.createError"));
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 text-center text-sm text-gray-400">
        {t("common.loading")}
      </div>
    );
  }

  // Форма создания плана
  if (creating) {
    return (
      <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800">
            {t("treatmentPlan.newPlan")}
          </h3>
          <button
            onClick={() => { setCreating(false); setPlanItems([]); }}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            {t("common.cancel")}
          </button>
        </div>

        <input
          value={planTitle}
          onChange={(e) => setPlanTitle(e.target.value)}
          placeholder={t("treatmentPlan.titlePlaceholder")}
          className="rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-teal-500"
        />

        {/* Зубная формула для выбора зубов */}
        <div>
          <p className="mb-1 text-xs text-gray-500">{t("treatmentPlan.selectTeeth")}</p>
          <ToothChart
            teeth={[]}
            selected={selectedTeeth}
            onChange={setSelectedTeeth}
          />
        </div>

        {/* Список процедур */}
        <div className="max-h-40 overflow-y-auto rounded-xl border border-gray-100">
          {(proceduresData?.procedures ?? []).map((p) => (
            <button
              key={p.procedureId}
              onClick={() => addItem(p)}
              disabled={selectedTeeth.length === 0}
              className="flex w-full items-center justify-between border-b border-gray-50 px-3 py-2 text-left text-sm hover:bg-teal-50 disabled:opacity-40"
            >
              <span className="font-medium text-gray-800">{getProcName(p)}</span>
              <span className="text-xs text-teal-600">{p.patientPrice} ₼</span>
            </button>
          ))}
        </div>

        {/* Выбранные позиции */}
        {planItems.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-gray-500">
              {t("treatmentPlan.items")} ({planItems.length})
            </p>
            {planItems.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-1.5 text-sm"
              >
                <div>
                  <span className="font-medium">{getProcName(item.procedure)}</span>
                  {item.toothNumbers.length > 0 && (
                    <span className="ml-2 text-xs text-gray-400">
                      🦷 {item.toothNumbers.join(", ")}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-teal-600">
                    {item.procedure.patientPrice * item.quantity} ₼
                  </span>
                  <button
                    onClick={() => removeItem(idx)}
                    className="text-gray-400 hover:text-red-500"
                  >✕</button>
                </div>
              </div>
            ))}
            <div className="flex justify-between border-t border-gray-100 pt-1 text-sm font-semibold">
              <span>{t("treatmentPlan.total")}</span>
              <span className="text-teal-700">
                {planItems.reduce(
                  (s, i) => s + i.procedure.patientPrice * i.quantity, 0
                )} ₼
              </span>
            </div>
          </div>
        )}

        <textarea
          value={planNotes}
          onChange={(e) => setPlanNotes(e.target.value)}
          placeholder={t("treatmentPlan.notes")}
          rows={2}
          className="rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-teal-500"
        />

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
        )}

        <button
          onClick={submitPlan}
          disabled={createPlan.isPending || planItems.length === 0}
          className="rounded-xl bg-teal-600 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-40"
        >
          {createPlan.isPending ? t("common.loading") : t("treatmentPlan.create")}
        </button>
      </div>
    );
  }

  // Детали плана
  if (selectedPlan) {
    const plan = plans.find((p) => p.id === selectedPlan.id) ?? selectedPlan;
    return (
      <div className="flex flex-col gap-2 rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-800">
              {plan.title ?? t("treatmentPlan.untitled")}
            </h3>
            <span className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_COLORS[plan.status]}`}>
              {STATUS_LABELS[plan.status]}
            </span>
          </div>
          <button
            onClick={() => setSelectedPlan(null)}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            ← {t("treatmentPlan.backToList")}
          </button>
        </div>

        <div className="space-y-1">
          {plan.items.map((item) => (
            <div
              key={item.id}
              className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                item.isCompleted ? "bg-green-50 opacity-70" : "bg-gray-50"
              }`}
            >
              <div>
                <span className={`font-medium ${item.isCompleted ? "line-through text-gray-400" : "text-gray-800"}`}>
                  {item.procedureName}
                </span>
                {item.toothNumbers.length > 0 && (
                  <span className="ml-2 text-xs text-gray-400">
                    🦷 {item.toothNumbers.join(", ")}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-teal-600">
                  {item.priceSnapshot * item.quantity} ₼
                </span>
                {!item.isCompleted && (
                  <button
                    onClick={() => markCompleted.mutate(item.id)}
                    className="rounded bg-teal-50 px-1.5 py-0.5 text-[10px] font-semibold text-teal-700 hover:bg-teal-100"
                  >
                    ✓
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Статус плана */}
        {plan.status !== "completed" && plan.status !== "archived" && (
          <div className="flex gap-2 pt-1">
            {plan.status === "draft" && (
              <button
                onClick={() => updateStatus.mutate({ planId: plan.id, status: "active" })}
                className="flex-1 rounded-lg bg-teal-600 py-1.5 text-xs font-semibold text-white hover:bg-teal-700"
              >
                {t("treatmentPlan.activate")}
              </button>
            )}
            <button
              onClick={() => updateStatus.mutate({ planId: plan.id, status: "archived" })}
              className="flex-1 rounded-lg border border-gray-200 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
            >
              {t("treatmentPlan.archive")}
            </button>
          </div>
        )}
      </div>
    );
  }

  // Список планов
  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          {t("treatmentPlan.title")} ({plans.length})
        </p>
        <button
          onClick={() => setCreating(true)}
          className="rounded-lg bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700 hover:bg-teal-100"
        >
          + {t("treatmentPlan.new")}
        </button>
      </div>

      {plans.length === 0 ? (
        <p className="py-3 text-center text-sm text-gray-400">
          {t("treatmentPlan.empty")}
        </p>
      ) : (
        plans.map((plan) => (
          <button
            key={plan.id}
            onClick={() => setSelectedPlan(plan)}
            className="flex items-center justify-between rounded-xl border border-gray-100 px-3 py-2.5 text-left hover:bg-gray-50 transition"
          >
            <div>
              <div className="text-sm font-medium text-gray-800">
                {plan.title ?? t("treatmentPlan.untitled")}
              </div>
              <div className="mt-0.5 text-xs text-gray-400">
                {new Date(plan.createdAt).toLocaleDateString("ru-RU", {
                  day: "numeric", month: "short", year: "numeric",
                })}
                {" · "}
                {plan.items.length} {t("treatmentPlan.itemsCount")}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_COLORS[plan.status]}`}>
                {STATUS_LABELS[plan.status]}
              </span>
              <span className="text-gray-300">›</span>
            </div>
          </button>
        ))
      )}
    </div>
  );
}
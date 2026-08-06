import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useClinic } from "@/app/providers/clinic";
import { usePatientProfile } from "@/features/patient-card/hooks/usePatientProfile";
import { usePatientTeeth } from "@/features/doctor-dashboard/hooks/usePatientTeeth";
import { useDoctorProfile } from "@/features/doctor-dashboard/hooks/useDoctorProfile";
import { useClinicProcedures } from "@/features/doctor-dashboard/hooks/useInvoice";
import { useSpecialties } from "@/features/services-catalog/hooks/useSpecialties";
import {
  usePatientPlans,
  useCreatePlan,
  usePlanActions,
} from "@/features/treatment-plans/hooks/useTreatmentPlans";
import type {
  TreatmentPlan,
  TreatmentPlanStatus,
} from "@/shared/api/treatment-plans/treatment-plans.service";
import type { ClinicProcedure } from "@/shared/api/invoices/invoice.service";
import type { Specialty } from "@/shared/api/specialties/specialties.service";
import { CompactToothBar } from "@/pages/invoice/CompactToothBar";
import { getAge } from "@/features/doctor-dashboard/lib/desk-utils";

interface PlanItemDraft {
  procedure: ClinicProcedure;
  toothNumbers: number[];
}

const STATUS_COLORS: Record<TreatmentPlanStatus, string> = {
  draft: "bg-gray-100 text-gray-600",
  active: "bg-teal-100 text-teal-700",
  completed: "bg-green-100 text-green-700",
  archived: "bg-amber-100 text-amber-700",
};

export function TreatmentPlanPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { clinic } = useClinic();
  const { data: doctor } = useDoctorProfile();
  const lang = i18n.language as "az" | "ru" | "en";

  const { data: profile } = usePatientProfile(patientId);
  const { data: teeth = [] } = usePatientTeeth(patientId);
  const { data: plans = [], isLoading: plansLoading } = usePatientPlans(patientId);
  const { data: proceduresData, isLoading: procLoading } = useClinicProcedures(
    clinic?.clinicId,
    patientId
  );
  const { data: specialties = [] } = useSpecialties();
  const createPlan = useCreatePlan(patientId!);
  const { updateStatus, markCompleted } = usePlanActions(patientId!);

  const [selectedTeeth, setSelectedTeeth] = useState<number[]>([]);
  const [creating, setCreating] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [planTitle, setPlanTitle] = useState("");
  const [planNotes, setPlanNotes] = useState("");
  const [planItems, setPlanItems] = useState<PlanItemDraft[]>([]);
  const [error, setError] = useState<string | null>(null);

  const age = getAge(profile?.birthDate ?? null);
  const activeCat = activeCategory ?? specialties[0]?.code ?? null;

  const getProcName = (p: ClinicProcedure) =>
    lang === "ru" ? p.nameRu : lang === "en" ? p.nameEn : p.nameAz;
  const getCatName = (cat: Specialty) =>
    lang === "ru" ? cat.nameRu : lang === "en" ? cat.nameEn : cat.nameAz;

  const visibleProcedures = useMemo(
    () => proceduresData?.procedures.filter((p) => p.categoryCode === activeCat) ?? [],
    [proceduresData, activeCat]
  );

  const canAdd = (p: ClinicProcedure) => !p.requiresTooth || selectedTeeth.length > 0;

  // таблица treatment_plan_items не хранит имя процедуры — резолвим по procedureId из каталога
  const resolveItemName = (procedureId: string) => {
    const p = proceduresData?.procedures.find((pr) => pr.procedureId === procedureId);
    return p ? getProcName(p) : "—";
  };

  const selectedPlan = plans.find((p) => p.id === selectedPlanId) ?? null;

  const startCreating = () => {
    setCreating(true);
    setSelectedPlanId(null);
    setPlanTitle("");
    setPlanNotes("");
    setPlanItems([]);
    setSelectedTeeth([]);
    setError(null);
  };

  const openPlan = (plan: TreatmentPlan) => {
    setCreating(false);
    setSelectedPlanId(plan.id);
  };

  const addItem = (p: ClinicProcedure) => {
    if (!canAdd(p)) return;
    setPlanItems((prev) => [...prev, { procedure: p, toothNumbers: [...selectedTeeth] }]);
    setSelectedTeeth([]);
  };

  const removeItem = (idx: number) =>
    setPlanItems((prev) => prev.filter((_, i) => i !== idx));

  const planTotal = planItems.reduce((s, i) => s + i.procedure.patientPrice, 0);

  const submitPlan = async () => {
    if (!doctor || !clinic || !patientId) return;
    if (planItems.length === 0) {
      setError(t("treatmentPlan.emptyItems"));
      return;
    }
    setError(null);
    try {
      const created = await createPlan.mutateAsync({
        patientId,
        doctorId: doctor.id,
        clinicId: clinic.clinicId,
        title: planTitle || undefined,
        notes: planNotes || undefined,
        items: planItems.map((item) => ({
          procedureId: item.procedure.procedureId,
          toothNumbers: item.toothNumbers,
          quantity: 1,
          priceSnapshot: item.procedure.patientPrice,
        })),
      });
      setCreating(false);
      setSelectedPlanId(created.id);
    } catch {
      setError(t("treatmentPlan.createError"));
    }
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-100 text-sm">
      {/* Шапка */}
      <header className="flex shrink-0 items-center gap-4 border-b border-gray-200 bg-white px-4 py-2">
        <button
          onClick={() => navigate(-1)}
          className="shrink-0 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
        >
          ←
        </button>

        <div className="shrink-0">
          <div className="text-sm font-bold text-gray-900">
            {profile?.fullName ?? profile?.phone ?? "…"}
            {age !== null && (
              <span className="ml-1.5 font-normal text-gray-500">
                ({t("common.years_old", { count: age })})
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            {t("treatmentPlan.title")}
            {profile?.subscription && (
              <span className="rounded-full bg-teal-100 px-1.5 py-0.5 text-[10px] font-semibold text-teal-700">
                {profile.subscription.plan.toUpperCase()}
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-x-auto">
          <CompactToothBar teeth={teeth} selected={selectedTeeth} onChange={setSelectedTeeth} />
        </div>
      </header>

      <div className="flex min-h-0 flex-1 gap-px bg-gray-200">
        {/* Сайдбар: список планов */}
        <aside className="flex w-72 shrink-0 flex-col overflow-hidden bg-white">
          <div className="shrink-0 border-b border-gray-100 p-3">
            <button
              onClick={startCreating}
              className="w-full rounded-lg bg-teal-600 py-2 text-sm font-semibold text-white transition hover:bg-teal-700"
            >
              + {t("treatmentPlan.new")}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {plansLoading ? (
              <div className="p-4 text-center text-sm text-gray-400">{t("common.loading")}</div>
            ) : plans.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-400">{t("treatmentPlan.empty")}</div>
            ) : (
              plans.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => openPlan(plan)}
                  className={`flex w-full flex-col items-start gap-1 border-b border-gray-50 px-3 py-2.5 text-left transition ${
                    plan.id === selectedPlanId ? "bg-teal-50" : "hover:bg-gray-50"
                  }`}
                >
                  <span className="text-sm font-medium text-gray-800">
                    {plan.title ?? t("treatmentPlan.untitled")}
                  </span>
                  <span className="flex items-center gap-2 text-xs text-gray-400">
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${STATUS_COLORS[plan.status]}`}>
                      {t(`treatmentPlan.statuses.${plan.status}`)}
                    </span>
                    {plan.items.length} {t("treatmentPlan.itemsCount")}
                  </span>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Основная область */}
        {creating ? (
          <div className="flex min-h-0 flex-1 gap-px bg-gray-200">
            {/* Категории + процедуры */}
            <div className="flex w-52 shrink-0 flex-col overflow-y-auto bg-white">
              {specialties.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.code)}
                  className={`border-l-2 px-3 py-2 text-left text-sm transition ${
                    activeCat === cat.code
                      ? "border-teal-600 bg-teal-50 font-semibold text-teal-800"
                      : "border-transparent text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {getCatName(cat)}
                </button>
              ))}
            </div>

            <div className="flex flex-1 flex-col overflow-hidden bg-white">
              <div className="flex-1 overflow-y-auto">
                {procLoading ? (
                  <div className="p-4 text-center text-gray-400">{t("common.loading")}</div>
                ) : (
                  visibleProcedures.map((p) => (
                    <button
                      key={p.procedureId}
                      onClick={() => addItem(p)}
                      disabled={!canAdd(p)}
                      className="flex w-full items-center justify-between border-b border-gray-50 px-3 py-2.5 text-left text-sm transition hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <span className="font-medium text-gray-800">{getProcName(p)}</span>
                      <span className="text-xs text-teal-600">
                        {p.promotion && (
                          <span className="mr-1 text-gray-400 line-through">
                            {p.promotion.originalPrice} ₼
                          </span>
                        )}
                        {p.patientPrice} ₼
                      </span>
                    </button>
                  ))
                )}
              </div>
              {visibleProcedures.some((p) => p.requiresTooth) && selectedTeeth.length === 0 && (
                <p className="shrink-0 border-t border-gray-100 px-3 py-2 text-xs text-gray-400">
                  {t("treatmentPlan.selectTeeth")}
                </p>
              )}
            </div>

            {/* Форма плана */}
            <div className="flex w-96 shrink-0 flex-col overflow-hidden bg-white">
              <div className="shrink-0 space-y-2 border-b border-gray-100 p-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-800">{t("treatmentPlan.newPlan")}</h3>
                  <button
                    onClick={() => setCreating(false)}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    {t("common.cancel")}
                  </button>
                </div>
                <input
                  value={planTitle}
                  onChange={(e) => setPlanTitle(e.target.value)}
                  placeholder={t("treatmentPlan.titlePlaceholder")}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex-1 overflow-y-auto p-3">
                {planItems.length === 0 ? (
                  <div className="flex h-24 items-center justify-center text-sm text-gray-400">
                    {t("treatmentPlan.emptyItems")}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {planItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm"
                      >
                        <div>
                          <span className="font-medium text-gray-800">{getProcName(item.procedure)}</span>
                          {item.toothNumbers.length > 0 && (
                            <span className="ml-2 text-xs text-gray-400">
                              🦷 {item.toothNumbers.join(", ")}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-teal-600">{item.procedure.patientPrice} ₼</span>
                          <button
                            onClick={() => removeItem(idx)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="shrink-0 space-y-2 border-t border-gray-100 p-3">
                <textarea
                  value={planNotes}
                  onChange={(e) => setPlanNotes(e.target.value)}
                  placeholder={t("treatmentPlan.notes")}
                  rows={2}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-teal-500"
                />
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span>{t("treatmentPlan.total")}</span>
                  <span className="text-teal-700">{planTotal} ₼</span>
                </div>
                {error && (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
                )}
                <button
                  onClick={submitPlan}
                  disabled={createPlan.isPending || planItems.length === 0}
                  className="w-full rounded-lg bg-teal-600 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-40"
                >
                  {createPlan.isPending ? t("common.loading") : t("treatmentPlan.create")}
                </button>
              </div>
            </div>
          </div>
        ) : selectedPlan ? (
          <div className="flex-1 overflow-y-auto bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-gray-900">
                  {selectedPlan.title ?? t("treatmentPlan.untitled")}
                </h2>
                <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_COLORS[selectedPlan.status]}`}>
                  {t(`treatmentPlan.statuses.${selectedPlan.status}`)}
                </span>
              </div>
              {selectedPlan.status !== "completed" && selectedPlan.status !== "archived" && (
                <div className="flex gap-2">
                  {selectedPlan.status === "draft" && (
                    <button
                      onClick={() => updateStatus.mutate({ planId: selectedPlan.id, status: "active" })}
                      className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700"
                    >
                      {t("treatmentPlan.activate")}
                    </button>
                  )}
                  <button
                    onClick={() => updateStatus.mutate({ planId: selectedPlan.id, status: "archived" })}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
                  >
                    {t("treatmentPlan.archive")}
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              {selectedPlan.items.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm ${
                    item.isCompleted ? "bg-green-50 opacity-70" : "bg-gray-50"
                  }`}
                >
                  <div>
                    <span className={`font-medium ${item.isCompleted ? "text-gray-400 line-through" : "text-gray-800"}`}>
                      {resolveItemName(item.procedureId)}
                    </span>
                    {item.toothNumbers.length > 0 && (
                      <span className="ml-2 text-xs text-gray-400">🦷 {item.toothNumbers.join(", ")}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-teal-600">{item.priceSnapshot} ₼</span>
                    {!item.isCompleted && (
                      <button
                        onClick={() => markCompleted.mutate(item.id)}
                        className="rounded bg-teal-50 px-2 py-1 text-[11px] font-semibold text-teal-700 hover:bg-teal-100"
                      >
                        ✓
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {selectedPlan.notes && (
              <div className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-gray-700">
                {selectedPlan.notes}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center bg-white text-sm text-gray-400">
            {t("treatmentPlan.selectPlanHint")}
          </div>
        )}
      </div>
    </div>
  );
}

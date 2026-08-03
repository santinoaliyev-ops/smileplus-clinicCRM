import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { usePatientProfile } from "@/features/patient-card/hooks/usePatientProfile";
import { usePatientTeeth } from "@/features/doctor-dashboard/hooks/usePatientTeeth";
import { ToothChart } from "@/shared/ui/tooth-chart";
import { getAge } from "@/features/doctor-dashboard/lib/desk-utils";
import { VisitDetailDialog } from "./VisitDetailDialog";
import { ObservationDialog } from "./ObservationDialog";
import { ToothHistoryPanel } from "./ToothHistoryPanel";
import { TreatmentPlansPanel } from "./TreatmentPlansPanel";

export function PatientCardPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [openVisitId, setOpenVisitId] = useState<string | null>(null);
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [observeDialogOpen, setObserveDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"visits" | "plans">("visits");

  const { data: profile, isLoading, error } = usePatientProfile(patientId);
  const { data: teeth = [] } = usePatientTeeth(patientId);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 text-gray-400">
        {t("common.loading")}
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-slate-50 text-gray-500">
        <p>{t("patientCard.loadError")}</p>
        <button
          onClick={() => navigate(-1)}
          className="rounded-lg border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50"
        >
          ← {t("common.back")}
        </button>
      </div>
    );
  }

  const age = getAge(profile.birthDate);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50">
      {/* Шапка */}
      <header className="flex shrink-0 items-center gap-4 border-b border-gray-200 bg-white px-5 py-3">
        <button
          onClick={() => navigate(-1)}
          className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
        >
          ← {t("common.back")}
        </button>
        <div>
          <h1 className="text-base font-bold text-gray-900">
            {profile.fullName ?? profile.phone}
            {age !== null && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({t("common.years_old", { count: age })})
              </span>
            )}
          </h1>
          <p className="text-xs text-gray-500">{profile.phone}</p>
        </div>
        {profile.subscription && (
          <div className="ml-auto rounded-xl bg-teal-50 px-4 py-2 text-sm">
            <span className="font-semibold text-teal-700">
              {profile.subscription.plan.toUpperCase()}
            </span>
            <span className="ml-3 text-gray-500">
              {profile.subscription.coverageLimit -
                profile.subscription.coverageUsed}{" "}
              ₼ {t("patientCard.remaining")}
            </span>
          </div>
        )}
      </header>

      <div className="flex flex-1 gap-3 overflow-hidden p-3">
        {/* Левая колонка: формула + история зуба + медкарта */}
        <div className="flex w-96 shrink-0 flex-col gap-3 overflow-y-auto">
          {/* Зубная формула */}
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
              {t("patientCard.toothChart")}
              <span className="ml-2 font-normal normal-case text-gray-400">
                {t("observation.hint")}
              </span>
            </p>
            <ToothChart
              teeth={teeth}
              selected={selectedTooth ? [selectedTooth] : []}
              onChange={(sel) => {
                const last = sel[sel.length - 1];
                if (last) {
                  setSelectedTooth(last);
                  setObserveDialogOpen(false);
                }
              }}
            />
          </div>

          {/* История зуба */}
          {selectedTooth && (
            <ToothHistoryPanel
              patientId={patientId!}
              toothNumber={selectedTooth}
              onObserve={() => setObserveDialogOpen(true)}
              onClose={() => setSelectedTooth(null)}
            />
          )}

          {/* Медкарта */}
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
              {t("patientCard.medicalCard")}
            </p>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">{t("patientCard.bloodType")}</span>
                <span className="font-medium text-gray-800">
                  {profile.medicalCard.bloodType ?? "—"}
                </span>
              </div>
              <div>
                <span className="text-gray-500">{t("patientCard.allergies")}</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {profile.medicalCard.allergies?.length ? (
                    profile.medicalCard.allergies.map((a, i) => (
                      <span
                        key={i}
                        className="rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-600"
                      >
                        {a}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </div>
              </div>
              <div>
                <span className="text-gray-500">{t("patientCard.chronic")}</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {profile.medicalCard.chronicConditions?.length ? (
                    profile.medicalCard.chronicConditions.map((c, i) => (
                      <span
                        key={i}
                        className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700"
                      >
                        {c}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </div>
              </div>
              {profile.medicalCard.notes && (
                <div className="rounded-lg bg-gray-50 p-2 text-xs text-gray-600">
                  {profile.medicalCard.notes}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Правая колонка: табы — история приёмов / планы лечения */}
        <div className="flex flex-1 flex-col overflow-hidden rounded-2xl bg-white shadow-sm">
          {/* Табы */}
          <div className="flex shrink-0 border-b border-gray-100">
            <button
              onClick={() => setActiveTab("visits")}
              className={`px-4 py-3 text-sm font-medium transition ${
                activeTab === "visits"
                  ? "border-b-2 border-teal-600 text-teal-700"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t("patientCard.visitHistory")} ({profile.visits.length})
            </button>
            <button
              onClick={() => setActiveTab("plans")}
              className={`px-4 py-3 text-sm font-medium transition ${
                activeTab === "plans"
                  ? "border-b-2 border-teal-600 text-teal-700"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t("treatmentPlan.title")}
            </button>
          </div>

          {/* Контент таба */}
          {activeTab === "visits" ? (
            <div className="flex-1 overflow-y-auto">
              {profile.visits.length === 0 ? (
                <div className="p-6 text-center text-sm text-gray-400">
                  {t("patientCard.noVisits")}
                </div>
              ) : (
                profile.visits.map((v) => (
                  <button
                    key={v.appointmentId}
                    onClick={() => v.isOwn && setOpenVisitId(v.appointmentId)}
                    disabled={!v.isOwn}
                    title={!v.isOwn ? t("patientCard.foreignVisit") : undefined}
                    className={`flex w-full items-start justify-between border-b border-gray-50 px-4 py-3 text-left transition ${
                      v.isOwn
                        ? "cursor-pointer hover:bg-teal-50"
                        : "cursor-default opacity-60"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-800">
                          {new Date(v.scheduledAt).toLocaleDateString("ru-RU", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                        {v.isOwn ? (
                          <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-semibold text-teal-700">
                            {t("patientCard.ownVisit")}
                          </span>
                        ) : (
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500">
                            {v.clinicName ?? "—"}
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 text-xs text-gray-500">
                        {v.doctorName ?? "—"}
                      </div>
                      {v.procedures.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {v.procedures.map((p, i) => (
                            <span
                              key={i}
                              className="rounded bg-gray-50 px-1.5 py-0.5 text-[10px] text-gray-600"
                            >
                              {p}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {v.isOwn && <span className="text-gray-300">›</span>}
                  </button>
                ))
              )}
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-3">
              <TreatmentPlansPanel patientId={patientId!} />
            </div>
          )}
        </div>
      </div>

      {openVisitId && (
        <VisitDetailDialog
          appointmentId={openVisitId}
          onClose={() => setOpenVisitId(null)}
        />
      )}

      {observeDialogOpen && selectedTooth && patientId && (
        <ObservationDialog
          patientId={patientId}
          toothNumber={selectedTooth}
          onClose={() => setObserveDialogOpen(false)}
        />
      )}
    </div>
  );
}
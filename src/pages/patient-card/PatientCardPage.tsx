import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { usePatientProfile } from "@/features/patient-card/hooks/usePatientProfile";
import { usePatientTeeth } from "@/features/doctor-dashboard/hooks/usePatientTeeth";
import { ToothChart } from "@/shared/ui/tooth-chart";
import { DoctorDeskLayout } from "@/pages/doctor-desk/DoctorDeskLayout";
import { ObservationDialog } from "./ObservationDialog";
import { ToothHistoryPanel } from "./ToothHistoryPanel";
import { PatientHeaderCard } from "./PatientHeaderCard";
import { SubscriptionCard } from "./SubscriptionCard";
import { VisitHistoryTimeline } from "./VisitHistoryTimeline";
import { TreatmentPlanSummaryCard } from "./TreatmentPlanSummaryCard";
import { QuickActionsCard } from "./QuickActionsCard";
import { PhotosFilesCard } from "./PhotosFilesCard";
import { FinanceCard } from "./FinanceCard";
import { MedicalInfoCard } from "./MedicalInfoCard";

export function PatientCardPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [observeDialogOpen, setObserveDialogOpen] = useState(false);

  const { data: profile, isLoading, error } = usePatientProfile(patientId);
  const { data: teeth = [] } = usePatientTeeth(patientId);

  if (isLoading) {
    return (
      <DoctorDeskLayout>
        <div className="flex h-full items-center justify-center text-gray-400">
          {t("common.loading")}
        </div>
      </DoctorDeskLayout>
    );
  }

  if (error || !profile) {
    return (
      <DoctorDeskLayout>
        <div className="flex h-full flex-col items-center justify-center gap-3 text-gray-500">
          <p>{t("patientCard.loadError")}</p>
          <button
            onClick={() => navigate(-1)}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50"
          >
            ← {t("common.back")}
          </button>
        </div>
      </DoctorDeskLayout>
    );
  }

  return (
    <DoctorDeskLayout>
      <div className="flex h-full flex-col gap-4 overflow-y-auto pb-4">
        <button
          onClick={() => navigate(-1)}
          className="w-fit rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
        >
          ← {t("patientCard.backToList")}
        </button>

        {/* Шапка пациента + подписка */}
        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="flex-1">
            <PatientHeaderCard profile={profile} />
          </div>
          <div className="lg:w-80 lg:shrink-0">
            <SubscriptionCard subscription={profile.subscription} />
          </div>
        </div>

        {/* Одонтограмма — на всю ширину */}
        <div className="flex flex-col gap-3">
          <ToothChart
            teeth={teeth}
            selected={selectedTooth ? [selectedTooth] : []}
            hideBulkActions
            onChange={(sel) => {
              const last = sel[sel.length - 1];
              if (last) {
                setSelectedTooth(last);
                setObserveDialogOpen(false);
              }
            }}
          />
          {selectedTooth && (
            <ToothHistoryPanel
              patientId={patientId!}
              toothNumber={selectedTooth}
              onObserve={() => setObserveDialogOpen(true)}
              onClose={() => setSelectedTooth(null)}
            />
          )}
        </div>

        {/* История посещений | План лечения | Быстрые действия */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="shrink-0 border-b border-gray-100 px-4 py-3">
              <span className="text-sm font-semibold text-gray-800">{t("patientCard.visitHistory")}</span>
            </div>
            <div className="max-h-96 flex-1 overflow-y-auto">
              <VisitHistoryTimeline history={profile.history} />
            </div>
          </div>

          <TreatmentPlanSummaryCard patientId={patientId!} />
          <QuickActionsCard patientId={patientId!} />
        </div>

        {/* Фото | Финансы | Медицинская информация */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <PhotosFilesCard patientId={patientId!} selectedTooth={selectedTooth} />
          <FinanceCard patientId={patientId!} />
          <MedicalInfoCard medicalCard={profile.medicalCard} />
        </div>
      </div>

      {observeDialogOpen && selectedTooth && patientId && (
        <ObservationDialog
          patientId={patientId}
          toothNumber={selectedTooth}
          onClose={() => setObserveDialogOpen(false)}
        />
      )}
    </DoctorDeskLayout>
  );
}

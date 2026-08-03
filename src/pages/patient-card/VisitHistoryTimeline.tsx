import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useVisitDetail } from "@/features/patient-card/hooks/usePatientProfile";
import type { PatientProfileVisit } from "@/shared/api/patients/patient-profile.service";

interface Props {
  visits: PatientProfileVisit[];
}

function VisitDetail({ appointmentId }: { appointmentId: string }) {
  const { t } = useTranslation();
  const { data: visit, isLoading } = useVisitDetail(appointmentId);

  if (isLoading) {
    return <div className="px-4 py-3 text-xs text-gray-400">{t("common.loading")}</div>;
  }
  if (!visit) return null;

  return (
    <div className="space-y-2 border-t border-gray-50 bg-gray-50/60 px-4 py-3">
      {visit.procedures.length === 0 ? (
        <p className="text-xs text-gray-400">{t("patientCard.noProcedures")}</p>
      ) : (
        visit.procedures.map((p, i) => (
          <div key={i} className="flex items-start justify-between rounded-lg bg-white px-3 py-2 text-sm shadow-sm">
            <div>
              <div className="font-medium text-gray-800">{p.name}</div>
              {p.toothNumbers.length > 0 && (
                <div className="text-xs text-gray-400">🦷 {p.toothNumbers.join(", ")}</div>
              )}
            </div>
            <span className="font-semibold text-gray-900">{p.amountTotal} ₼</span>
          </div>
        ))
      )}
      {visit.notes && (
        <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
          <span className="font-medium">{t("doctorDesk.comment")}: </span>
          {visit.notes}
        </div>
      )}
    </div>
  );
}

export function VisitHistoryTimeline({ visits }: Props) {
  const { t } = useTranslation();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (visits.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-gray-400">{t("patientCard.noVisits")}</div>
    );
  }

  return (
    <div className="divide-y divide-gray-50">
      {visits.map((v) => {
        const isExpanded = expandedId === v.appointmentId;
        return (
          <div key={v.appointmentId}>
            <button
              onClick={() => v.isOwn && setExpandedId(isExpanded ? null : v.appointmentId)}
              disabled={!v.isOwn}
              title={!v.isOwn ? t("patientCard.foreignVisit") : undefined}
              className={`flex w-full items-start justify-between px-4 py-3 text-left transition ${
                v.isOwn ? "cursor-pointer hover:bg-teal-50" : "cursor-default opacity-60"
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
                <div className="mt-0.5 text-xs text-gray-500">{v.doctorName ?? "—"}</div>
                {v.procedures.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {v.procedures.map((p, i) => (
                      <span key={i} className="rounded bg-gray-50 px-1.5 py-0.5 text-[10px] text-gray-600">
                        {p}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {v.isOwn && (
                <span className={`shrink-0 text-gray-300 transition ${isExpanded ? "rotate-90" : ""}`}>›</span>
              )}
            </button>
            {isExpanded && <VisitDetail appointmentId={v.appointmentId} />}
          </div>
        );
      })}
    </div>
  );
}

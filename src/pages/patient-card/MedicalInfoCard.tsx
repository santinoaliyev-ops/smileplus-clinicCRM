import { useTranslation } from "react-i18next";
import type { PatientProfile } from "@/shared/api/patients/patient-profile.service";

interface Props {
  medicalCard: PatientProfile["medicalCard"];
}

export function MedicalInfoCard({ medicalCard }: Props) {
  const { t } = useTranslation();

  const flags: { key: keyof PatientProfile["medicalCard"]; label: string }[] = [
    { key: "diabetes", label: t("patientCard.diabetes") },
    { key: "pregnancy", label: t("patientCard.pregnancy") },
    { key: "pacemaker", label: t("patientCard.pacemaker") },
    { key: "anticoagulants", label: t("patientCard.anticoagulants") },
    { key: "hepatitis", label: t("patientCard.hepatitis") },
    { key: "hiv", label: t("patientCard.hiv") },
  ];

  const activeFlags = flags.filter((f) => medicalCard[f.key] === true);

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm">
      <div className="shrink-0 border-b border-gray-100 px-4 py-3">
        <span className="text-sm font-semibold text-gray-800">{t("patientCard.medicalCard")}</span>
      </div>
      <div className="space-y-2.5 p-4 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">{t("patientCard.bloodType")}</span>
          <span className="font-medium text-gray-800">{medicalCard.bloodType ?? "—"}</span>
        </div>

        <div>
          <span className="text-gray-500">{t("patientCard.allergies")}</span>
          <div className="mt-1 flex flex-wrap gap-1">
            {medicalCard.allergies?.length ? (
              medicalCard.allergies.map((a, i) => (
                <span key={i} className="rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-600">
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
            {medicalCard.chronicConditions?.length ? (
              medicalCard.chronicConditions.map((c, i) => (
                <span key={i} className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
                  {c}
                </span>
              ))
            ) : (
              <span className="text-gray-400">—</span>
            )}
          </div>
        </div>

        <div>
          <span className="text-gray-500">{t("patientCard.riskFactors")}</span>
          <div className="mt-1 flex flex-wrap gap-1">
            {activeFlags.length ? (
              activeFlags.map((f) => (
                <span key={f.key} className="rounded-full bg-orange-50 px-2 py-0.5 text-xs text-orange-700">
                  {f.label}
                </span>
              ))
            ) : (
              <span className="text-gray-400">—</span>
            )}
          </div>
        </div>

        {medicalCard.peculiarities && (
          <div>
            <span className="text-gray-500">{t("patientCard.peculiarities")}</span>
            <p className="mt-1 rounded-lg bg-gray-50 p-2 text-xs text-gray-600">{medicalCard.peculiarities}</p>
          </div>
        )}

        {medicalCard.notes && (
          <div className="rounded-lg bg-gray-50 p-2 text-xs text-gray-600">{medicalCard.notes}</div>
        )}
      </div>
    </div>
  );
}

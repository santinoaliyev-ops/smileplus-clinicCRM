import { useState } from "react";
import { useTranslation } from "react-i18next";

import { useClinic } from "@/app/providers/clinic";
import { useDoctorProfile } from "@/features/doctor-dashboard/hooks/useDoctorProfile";
import { useCreateObservation } from "@/features/observations/hooks/useObservations";
import {
  CONDITION_COLORS,
  type ConditionCode,
} from "@/shared/ui/tooth-chart";

interface Props {
  patientId: string;
  toothNumber: number;
  appointmentId?: string | null;
  onClose: () => void;
}

const SELECTABLE: ConditionCode[] = [
  "HEALTHY",
  "CARIES",
  "FILLED",
  "FILLED_CARIES",
  "ROOT",
  "MISSING",
  "ARTIFICIAL",
];

export function ObservationDialog({
  patientId,
  toothNumber,
  appointmentId = null,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const { clinic } = useClinic();
  const { data: doctor } = useDoctorProfile();
  const create = useCreateObservation();

  const [condition, setCondition] = useState<ConditionCode | null>(null);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!condition || !doctor || !clinic) return;
    setError(null);
    try {
      await create.mutateAsync({
        patientId,
        doctorId: doctor.id,
        clinicId: clinic.clinicId,
        appointmentId,
        toothNumber,
        conditionCode: condition,
        notes: notes || undefined,
      });
      onClose();
    } catch {
      setError(t("observation.error"));
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              {t("observation.title")}
            </h2>
            <p className="text-sm text-gray-500">
              {t("observation.tooth")} {toothNumber}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        {/* Выбор состояния */}
        <div className="mb-4 grid grid-cols-2 gap-2">
          {SELECTABLE.map((code) => (
            <button
              key={code}
              onClick={() => setCondition(code)}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
                condition === code
                  ? "border-teal-500 bg-teal-50 font-semibold"
                  : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: CONDITION_COLORS[code] }}
              />
              <span className="text-gray-700">
                {t(`toothChart.conditions.${code}`)}
              </span>
            </button>
          ))}
        </div>

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t("observation.notes")}
          rows={2}
          className="mb-3 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-teal-500"
        />

        {error && (
          <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          onClick={submit}
          disabled={!condition || create.isPending}
          className="w-full rounded-xl bg-teal-600 py-2.5 font-semibold text-white transition hover:bg-teal-700 disabled:opacity-40"
        >
          {create.isPending ? t("observation.saving") : t("observation.save")}
        </button>
      </div>
    </div>
  );
}
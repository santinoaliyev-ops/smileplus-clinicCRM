import { useTranslation } from "react-i18next";
import { useToothHistory } from "@/features/patient-card/hooks/useToothHistory";
import {
  CONDITION_COLORS,
  CONDITION_LABELS,
  type ConditionCode,
} from "@/shared/ui/tooth-chart";

interface Props {
  patientId: string;
  toothNumber: number;
  onObserve: () => void;
  onClose: () => void;
}

export function ToothHistoryPanel({
  patientId,
  toothNumber,
  onObserve,
  onClose,
}: Props) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as "az" | "ru" | "en";
  const { data: history, isLoading } = useToothHistory(patientId, toothNumber);

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm">
      {/* Шапка */}
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900">
            {t("toothHistory.tooth")} {toothNumber}
          </span>
          {history?.current && (
            <span
              className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
              style={{
                backgroundColor:
                  CONDITION_COLORS[
                    history.current.conditionCode as ConditionCode
                  ] ?? "#22c55e",
              }}
            >
              {history.current.conditionCode
                ? CONDITION_LABELS[
                    history.current.conditionCode as ConditionCode
                  ][lang]
                : "—"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onObserve}
            className="rounded-lg bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700 hover:bg-teal-100"
          >
            + {t("observation.title")}
          </button>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100"
          >
            ✕
          </button>
        </div>
      </div>

      {/* История */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center text-sm text-gray-400">
            {t("common.loading")}
          </div>
        ) : !history || history.events.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-400">
            {t("toothHistory.noEvents")}
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {history.events.map((ev) => (
              <div key={ev.id} className="px-4 py-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        ev.eventType === "treatment"
                          ? "bg-teal-100 text-teal-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {ev.eventType === "treatment"
                        ? t("toothHistory.treatment")
                        : t("toothHistory.diagnosis")}
                    </span>
                    {ev.procedureCode && (
                      <span className="ml-2 text-xs text-gray-500">
                        {ev.procedureCode}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(ev.date).toLocaleDateString("ru-RU", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="mt-1 text-xs text-gray-600">
                  {ev.doctorName && <span>{ev.doctorName}</span>}
                  {ev.clinicName && (
                    <span className="ml-1.5 text-gray-400">
                      · {ev.clinicName}
                    </span>
                  )}
                </div>
                {ev.note && (
                  <p className="mt-1 text-xs text-gray-500">{ev.note}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
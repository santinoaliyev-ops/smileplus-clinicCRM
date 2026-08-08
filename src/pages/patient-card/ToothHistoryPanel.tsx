import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useToothHistory } from "@/features/patient-card/hooks/useToothHistory";
import {
  usePatientFiles,
  useUploadPatientFile,
  useDeletePatientFile,
} from "@/features/patient-card/hooks/usePatientFiles";
import { useClinic } from "@/app/providers/clinic";
import {
  CONDITION_COLORS,
  CONDITION_LABELS,
  type ConditionCode,
} from "@/shared/ui/tooth-chart";
import { PatientFileGrid } from "./PatientFileGrid";

interface Props {
  patientId: string;
  toothNumber: number;
  onObserve: () => void;
  onClose: () => void;
}

type Tab = "history" | "procedures" | "photos" | "xray";

export function ToothHistoryPanel({
  patientId,
  toothNumber,
  onObserve,
  onClose,
}: Props) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const lang = i18n.language as "az" | "ru" | "en";
  const { data: history, isLoading } = useToothHistory(patientId, toothNumber);
  const [tab, setTab] = useState<Tab>("history");

  const { clinic } = useClinic();
  const { data: files = [], isLoading: filesLoading } = usePatientFiles(patientId);
  const upload = useUploadPatientFile(patientId);
  const remove = useDeletePatientFile(patientId);
  const fileInput = useRef<HTMLInputElement>(null);

  const events = history?.events ?? [];
  const procedureEvents = events.filter((e) => e.eventType === "treatment");

  const toothFileType = tab === "photos" ? "photo" : "xray";
  const toothFiles = useMemo(
    () => files.filter((f) => f.fileType === toothFileType && f.toothNumber === toothNumber),
    [files, toothFileType, toothNumber]
  );

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || !clinic || (tab !== "photos" && tab !== "xray")) return;
    Array.from(fileList).forEach((file) => {
      upload.mutate({
        clinicId: clinic.clinicId,
        uploadedBy: clinic.clinicStaffId,
        fileType: toothFileType,
        file,
        toothNumber,
      });
    });
    if (fileInput.current) fileInput.current.value = "";
  };

  const TABS: { key: Tab; label: string }[] = [
    { key: "history", label: t("toothHistory.tabs.history") },
    { key: "procedures", label: t("toothHistory.tabs.procedures") },
    { key: "photos", label: t("toothHistory.tabs.photos") },
    { key: "xray", label: t("toothHistory.tabs.xray") },
  ];

  const renderEventList = (list: typeof events) =>
    list.length === 0 ? (
      <div className="p-4 text-center text-sm text-gray-400">{t("toothHistory.noEvents")}</div>
    ) : (
      <div className="divide-y divide-gray-50">
        {list.map((ev) => (
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
                  {ev.eventType === "treatment" ? t("toothHistory.treatment") : t("toothHistory.diagnosis")}
                </span>
                {ev.procedureCode && (
                  <span className="ml-2 text-xs text-gray-500">{ev.procedureCode}</span>
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
              {ev.clinicName && <span className="ml-1.5 text-gray-400">· {ev.clinicName}</span>}
            </div>
            {ev.note && <p className="mt-1 text-xs text-gray-500">{ev.note}</p>}
          </div>
        ))}
      </div>
    );

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
                  CONDITION_COLORS[history.current.conditionCode as ConditionCode] ?? "#22c55e",
              }}
            >
              {history.current.conditionCode
                ? CONDITION_LABELS[history.current.conditionCode as ConditionCode][lang]
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
            onClick={() => navigate(`/doctor/treatment-plan/${patientId}`)}
            className="rounded-lg bg-gray-900 px-2.5 py-1 text-xs font-semibold text-white hover:bg-gray-800"
          >
            + {t("toothHistory.addTreatment")}
          </button>
          <button onClick={onClose} className="rounded-full p-1 text-gray-400 hover:bg-gray-100">
            ✕
          </button>
        </div>
      </div>

      {/* Табы */}
      <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-2">
        <div className="flex">
          {TABS.map((tb) => (
            <button
              key={tb.key}
              onClick={() => setTab(tb.key)}
              className={`px-3 py-2 text-xs font-medium transition ${
                tab === tb.key
                  ? "border-b-2 border-teal-600 text-teal-700"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tb.label}
            </button>
          ))}
        </div>
        {(tab === "photos" || tab === "xray") && (
          <div className="mr-1 flex shrink-0 items-center">
            <button
              onClick={() => fileInput.current?.click()}
              disabled={upload.isPending}
              className="rounded-lg bg-teal-50 px-2 py-1 text-xs font-semibold text-teal-700 hover:bg-teal-100 disabled:opacity-40"
            >
              + {t("doctorDesk.add")}
            </button>
            <input
              ref={fileInput}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>
        )}
      </div>

      {/* Контент */}
      <div className="max-h-72 flex-1 overflow-y-auto">
        {tab === "history" ? (
          isLoading ? (
            <div className="p-4 text-center text-sm text-gray-400">{t("common.loading")}</div>
          ) : (
            renderEventList(events)
          )
        ) : tab === "procedures" ? (
          isLoading ? (
            <div className="p-4 text-center text-sm text-gray-400">{t("common.loading")}</div>
          ) : (
            renderEventList(procedureEvents)
          )
        ) : (
          <div className="p-3">
            <PatientFileGrid
              fileType={toothFileType}
              files={toothFiles}
              isLoading={filesLoading}
              onDelete={(f) => remove.mutate({ id: f.id, storagePath: f.storagePath })}
            />
          </div>
        )}
      </div>
    </div>
  );
}

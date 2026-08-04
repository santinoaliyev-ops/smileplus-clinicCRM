import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { useClinic } from "@/app/providers/clinic";
import {
  usePatientFiles,
  useUploadPatientFile,
  useDeletePatientFile,
} from "@/features/patient-card/hooks/usePatientFiles";
import type { PatientFileType } from "@/shared/api/patients/patient-files.service";

const TABS: PatientFileType[] = ["photo", "xray", "ct", "document"];

const ICONS: Record<PatientFileType, string> = {
  photo: "📷",
  xray: "🩻",
  ct: "🧊",
  document: "📄",
};

const TAB_LABEL_KEY: Record<PatientFileType, string> = {
  photo: "patientCard.files.photos",
  xray: "patientCard.files.xray",
  ct: "patientCard.files.ct",
  document: "patientCard.files.documents",
};

interface Props {
  patientId: string;
  selectedTooth: number | null;
}

export function PhotosFilesCard({ patientId, selectedTooth }: Props) {
  const { t } = useTranslation();
  const { clinic } = useClinic();
  const [tab, setTab] = useState<PatientFileType>("photo");
  const fileInput = useRef<HTMLInputElement>(null);

  const { data: files = [], isLoading } = usePatientFiles(patientId);
  const upload = useUploadPatientFile(patientId);
  const remove = useDeletePatientFile(patientId);

  const visibleFiles = useMemo(
    () =>
      files.filter(
        (f) => f.fileType === tab && (!selectedTooth || f.toothNumber === selectedTooth)
      ),
    [files, tab, selectedTooth]
  );

  const handlePick = () => fileInput.current?.click();

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || !clinic) return;
    Array.from(fileList).forEach((file) => {
      upload.mutate({
        clinicId: clinic.clinicId,
        uploadedBy: clinic.clinicStaffId,
        fileType: tab,
        file,
        toothNumber: selectedTooth,
      });
    });
    if (fileInput.current) fileInput.current.value = "";
  };

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm">
      <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-2 pt-2">
        <div className="flex">
          {TABS.map((tb) => (
            <button
              key={tb}
              onClick={() => setTab(tb)}
              className={`px-3 py-2 text-xs font-medium transition ${
                tab === tb
                  ? "border-b-2 border-teal-600 text-teal-700"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t(TAB_LABEL_KEY[tb])}
            </button>
          ))}
        </div>
        <div className="mr-2 flex shrink-0 items-center gap-2">
          {selectedTooth && (
            <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-teal-700">
              🦷 {selectedTooth}
            </span>
          )}
          <button
            onClick={handlePick}
            disabled={upload.isPending}
            className="rounded-lg bg-teal-50 px-2 py-1 text-xs font-semibold text-teal-700 hover:bg-teal-100 disabled:opacity-40"
          >
            + {t("doctorDesk.add")}
          </button>
          <input
            ref={fileInput}
            type="file"
            multiple
            accept={tab === "document" ? undefined : "image/*"}
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>
      </div>

      <div className="max-h-72 overflow-y-auto p-3">
        {isLoading ? (
          <div className="p-6 text-center text-sm text-gray-400">{t("common.loading")}</div>
        ) : visibleFiles.length === 0 ? (
          <div className="flex flex-col items-center gap-1 p-8 text-center text-sm text-gray-400">
            <span className="text-2xl">{ICONS[tab]}</span>
            <span>{t("patientCard.noFiles")}</span>
          </div>
        ) : tab === "document" ? (
          <div className="space-y-1.5">
            {visibleFiles.map((f) => (
              <a
                key={f.id}
                href={f.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm hover:bg-gray-100"
              >
                <span className="truncate text-gray-700">📄 {f.title ?? "—"}</span>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    remove.mutate({ id: f.id, storagePath: f.storagePath });
                  }}
                  className="ml-2 shrink-0 text-gray-400 hover:text-red-500"
                >
                  ✕
                </button>
              </a>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {visibleFiles.map((f) => (
              <a
                key={f.id}
                href={f.url}
                target="_blank"
                rel="noreferrer"
                className="group relative aspect-square overflow-hidden rounded-lg bg-gray-100"
              >
                <img src={f.url} alt={f.title ?? ""} className="h-full w-full object-cover" />
                {f.toothNumber && (
                  <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1 text-[9px] text-white">
                    🦷 {f.toothNumber}
                  </span>
                )}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    remove.mutate({ id: f.id, storagePath: f.storagePath });
                  }}
                  className="absolute right-1 top-1 hidden h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs text-white group-hover:flex"
                >
                  ✕
                </button>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

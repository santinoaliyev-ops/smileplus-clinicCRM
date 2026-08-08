import { useTranslation } from "react-i18next";
import type { PatientFile, PatientFileType } from "@/shared/api/patients/patient-files.service";

interface Props {
  fileType: PatientFileType;
  files: PatientFile[];
  isLoading: boolean;
  onDelete: (file: PatientFile) => void;
}

const ICONS: Record<PatientFileType, string> = {
  photo: "📷",
  xray: "🩻",
  ct: "🧊",
  document: "📄",
};

/** Сетка превью (фото/рентген/КТ) или список документов — используется и в PhotosFilesCard, и в ToothHistoryPanel */
export function PatientFileGrid({ fileType, files, isLoading, onDelete }: Props) {
  const { t } = useTranslation();

  if (isLoading) {
    return <div className="p-6 text-center text-sm text-gray-400">{t("common.loading")}</div>;
  }

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center gap-1 p-8 text-center text-sm text-gray-400">
        <span className="text-2xl">{ICONS[fileType]}</span>
        <span>{t("patientCard.noFiles")}</span>
      </div>
    );
  }

  if (fileType === "document") {
    return (
      <div className="space-y-1.5">
        {files.map((f) => (
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
                onDelete(f);
              }}
              className="ml-2 shrink-0 text-gray-400 hover:text-red-500"
            >
              ✕
            </button>
          </a>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {files.map((f) => (
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
              onDelete(f);
            }}
            className="absolute right-1 top-1 hidden h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs text-white group-hover:flex"
          >
            ✕
          </button>
        </a>
      ))}
    </div>
  );
}

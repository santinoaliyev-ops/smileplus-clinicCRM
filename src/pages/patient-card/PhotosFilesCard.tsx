import { useState } from "react";
import { useTranslation } from "react-i18next";

type FileTab = "photos" | "xray" | "ct" | "documents";

const ICONS: Record<FileTab, string> = {
  photos: "📷",
  xray: "🩻",
  ct: "🧊",
  documents: "📄",
};

interface Props {
  selectedTooth: number | null;
}

export function PhotosFilesCard({ selectedTooth }: Props) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<FileTab>("photos");

  const TABS: FileTab[] = ["photos", "xray", "ct", "documents"];

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
              {t(`patientCard.files.${tb}`)}
            </button>
          ))}
        </div>
        {selectedTooth && (
          <span className="mr-2 shrink-0 rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-teal-700">
            🦷 {selectedTooth}
          </span>
        )}
      </div>
      <div className="flex flex-col items-center justify-center gap-1 p-8 text-center">
        <span className="text-2xl">{ICONS[tab]}</span>
        <span className="text-sm text-gray-400">{t("patientCard.filesComingSoon")}</span>
      </div>
    </div>
  );
}
